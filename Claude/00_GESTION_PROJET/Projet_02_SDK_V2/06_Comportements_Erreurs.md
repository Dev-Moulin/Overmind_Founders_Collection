# Comportement attendu, erreurs et considérations techniques

Récapitulatif des comportements techniques attendus des fonctions du SDK, notamment en termes d'atomicité, d'optimisation gas, d'erreurs possibles et de limites.

---

## Atomicité des opérations

Chaque fonction de création ou de dépôt/retrait enclenche une transaction Ethereum. Par défaut, ces opérations sont **atomiques individuellement** : si une condition d'échec survient, la transaction entière est annulée (aucune modification partielle de l'état).

### Opérations simples

| Opération | Comportement en cas d'échec |
|-----------|----------------------------|
| `createAtomFromString` | L'Atom n'est pas créé du tout |
| `deposit` | Aucun token n'est prélevé |
| `redeem` | Aucune part n'est brûlée |

### Opérations batch

Pour les opérations batch, l'atomicité s'applique à l'**ensemble du batch** :
- La transaction groupée ne réussit que si **toutes** les opérations internes réussissent
- Sinon, elle est revertée dans sa totalité

| Type batch | Comportement |
|------------|--------------|
| `batchCreateTripleStatements` | Soit tous les triples créés, soit aucun |
| `batchDepositStatement` | Soit tous les dépôts passent, soit aucun |
| `redeemBatch` | Soit tous les retraits passent, soit aucun |

Le contrat MultiVault est conçu pour traiter les tableaux d'entrées en une boucle interne et utilise des primitives Solidity qui revertent l'ensemble en cas d'erreur sur un élément.

Cette atomicité garantit l'**intégrité** (pas de situation intermédiaire avec la moitié des éléments créés), mais signifie aussi qu'il faut bien valider chaque sous-opération avant d'envoyer la transaction batch pour éviter un échec global.

---

## Optimisation et coûts en gas

L'un des buts de la SDK V2 est d'exploiter les batchs pour réduire le coût total des interactions.

### Principe d'économie

| Aspect | Transactions séparées | Batch |
|--------|----------------------|-------|
| Gas fixe de transaction | Payé N fois | Payé 1 fois |
| Overhead d'appel | Répété | Mutualisé |
| Efficacité globale | Basse | Haute |

Regrouper les opérations permet d'économiser le gas fixe de transaction par opération. La doc souligne qu'un batch de dépôts fait payer une seule fois certains coûts plutôt que de les payer N fois.

### Exemples pratiques

- Utiliser `batchCreateAtoms` ou `batchCreateTripleStatements` sera beaucoup plus efficient que créer chaque Atom/Triple séparément
- Regrouper 3 créations d'Atoms en une transaction économisera une bonne portion de gas par rapport à 3 transactions
- Déposer sur 3 vaults en un call (`batchDepositStatement`) coûte bien moins que 3 calls distincts

### Limites

La consommation de gas totale d'un batch est la somme des actions + un petit surcoût de boucle. Un gros batch peut donc coûter presque autant que plusieurs transactions, avec un bénéfice notable mais pas infiniment magique.

**Recommandation** : Exploitez les batchs quand c'est pertinent (création initiale massive, action multi-cible), mais mesurez l'impact pour de très gros volumes afin de ne pas saturer une transaction.

---

## Erreurs et exceptions courantes

### 1. Doublons / Identifiants existants

Le protocole n'autorise pas :
- Deux Atoms avec la même donnée
- Deux Triples avec le même trio

| Tentative | Résultat |
|-----------|----------|
| Créer un Atom existant | Revert "Term already exists" |
| Créer un Triple existant | Revert similaire |

**Conseil** : Vérifier via le GraphQL API ou via `isTermCreated(termId)` avant de créer, pour éviter une transaction inutile.

Cette contrainte de duplicat élimine les collisions et assure l'unicité globale des termes dans la base de connaissance.

### 2. Données invalides ou trop volumineuses

| Problème | Conséquence |
|----------|-------------|
| Objet mal formé | Revert du contrat |
| Données > 1000 octets | Création refusée |
| Atom ID invalide dans un triple | Transaction échoue |

**Important** : Il faut toujours créer les Atoms requis **avant** les triples qui les utilisent.

### 3. Frais non fournis

| Situation | Erreur |
|-----------|--------|
| `createAtomFromString` sans 0.1 TRUST | "Insufficient value for fees" |
| `deposit` avec value = 0 | Transaction revertée |
| Batch avec value ≠ somme des montants | Revert |

Le SDK prenant un objet `{ walletClient, ... }` et un paramètre de données, il envoie normalement automatiquement la `value` minimale nécessaire.

### 4. Minimums non respectés

| Contrainte | Valeur | Conséquence si non respectée |
|------------|--------|------------------------------|
| Dépôt minimum | 0.01 TRUST | Revert immédiat |
| Minimum shares | 1e6 wei | Dépôt arrondi ou refusé |

Le paramètre Minimum Shares = 1e6 wei vise surtout à éviter des tranches de parts trop fines (pour garder des nombres entiers gérables).

### 5. Vault inexistant ou inactif

| Situation | Conséquence |
|-----------|-------------|
| `deposit` sur vaultId inexistant | Revert |
| `redeem` sur vault où l'utilisateur n'a pas de parts | Rejeté |
| Contrat en pause | Revert "Pausable: paused" |

Le protocole a un mode pause (via `whenNotPaused` sur les fonctions critiques). Si le contrat est mis en pause par gouvernance, toutes les actions (create, deposit, redeem) revert automatiquement.

### 6. Dépassement de capacité (batch trop gros)

| Problème | Conséquence |
|----------|-------------|
| Batch gigantesque | Dépasse limite de gas ou taille de bloc |
| Out of gas | Transaction rejetée par les nœuds |
| Transaction trop grosse | Rejetée par la mempool |

Ce n'est pas une "erreur revert" du contrat à proprement parler, mais un échec de la transaction au niveau réseau.

**Solution** : Monitorez la consommation de gas lors de tests et fixez une limite raisonnable de batch. Si vraiment beaucoup d'éléments doivent être créés ou mis à jour, segmentez en plusieurs transactions.

### 7. Erreurs au withdraw (redeem)

| Situation | Conséquence |
|-----------|-------------|
| Retirer plus de shares que possédées | Revert (balance insuffisante) |
| `minAssets` non satisfait | Revert (aucune part brûlée) |

**Conseil** : Toujours calculer ou récupérer le nombre de parts disponibles avant de lancer un redeem.

---

## Bonding Curves

Intuition utilise une **courbe Offset Progressive** pour calculer combien de parts mint en fonction du total existant.

### Principe

| Situation | Effet |
|-----------|-------|
| Plus un vault a de tokens | Plus le prix par part augmente |
| Dépôt précoce | Plus de parts par token |
| Retrait | Fait baisser le prix |

### Conséquence

Un dépôt ultérieur rapporte un peu moins de parts par token qu'un dépôt plus précoce (d'où l'avantage aux premiers contributeurs).

### Fonctions d'estimation

| Fonction | Usage |
|----------|-------|
| `previewDeposit` | Nombre de parts qu'un dépôt produirait |
| `previewRedeem` | Montant pour un nombre de parts |
| `currentSharePrice` | Prix actuel de la part |

Ces fonctions peuvent être utiles pour informer l'utilisateur avant qu'il stake.

---

## Autres considérations

### Retour d'information et monitoring

Utiliser ces fonctions déclenche des événements on-chain :
- `AtomCreated`
- `TripleCreated`
- `Deposited`
- `Redeemed`

Il peut être utile côté application de capter ces événements via `publicClient.subscribeContractEvent` ou via le GraphQL API d'Intuition pour mettre à jour l'UI en temps réel.

Le SDK V2 intègre aussi un client GraphQL qui permet de requêter l'état du knowledge graph facilement après coup.

### Synchronisation de l'adresse du contrat

Assurez-vous toujours d'utiliser la bonne adresse de contrat MultiVault dans les appels :

```typescript
address = getMultiVaultAddressFromChainId(chainId)
```

En V2, le MultiVault est unique par réseau et gère tout (créations, dépôts…). Si l'adresse est fausse ou si vous utilisez par mégarde l'adresse du testnet sur le mainnet, les transactions échoueront.

### Gestion des erreurs dans le code

Les fonctions étant async, pensez à entourer d'un `try/catch` lors de l'utilisation du SDK :

```typescript
try {
  const result = await deposit(...);
} catch (error) {
  // Informer l'utilisateur
  console.error('Dépôt refusé:', error.message);
}
```

Les revert Solidity viennent souvent avec un message, accessible dans l'erreur renvoyée par viem/Ethers. Traitez-les pour offrir une bonne UX.

### Limites liées aux données

Pour `createAtomFromThing` ou `createAtomFromIpfsUpload` :
- Pinata API peut être utilisée (le SDK propose un champ `pinataApiKey` etc.) pour uploader sur IPFS
- Assurez-vous de ne pas dépasser les quotas ou d'avoir les bonnes clés
- Si l'upload échoue, la création d'atom échouera aussi

### Compatibilité versions

Le guide quickstart indique `@0xintuition/sdk@^2.0.0-alpha.2` comme référence. Les exemples correspondent à la V2 contract architecture.

Si jamais vous migriez depuis une V1, il existe un SDK Migration Guide pour faciliter la transition.

---

## Tableau récapitulatif des erreurs

| Erreur | Cause |
|--------|-------|
| "Term already exists" | Atom/Triple avec mêmes données existe déjà |
| "MinimumDepositNotMet" | Dépôt < 0.01 TRUST |
| "Insufficient value for fees" | Pas assez de valeur envoyée |
| "Pausable: paused" | Contrat en pause |
| Out of gas | Batch trop grand |
| Balance insuffisante | Retrait de plus de parts que possédées |

---

## Sources

- [Bonding Curves](https://docs.intuition.systems/docs/protocol/tokenomics/trust/bonding-curve)
- [Deposit and Return](https://docs.intuition.systems/docs/protocol/tokenomics/trust/deposit-and-return)
- [SDK Getting Started](https://docs.intuition.systems/docs/developer-tools/sdks/getting-started)
- [GraphQL API](https://docs.intuition.systems/docs/developer-tools/graphql/overview)
- [Migration v1 → v2](https://docs.intuition.systems/docs/updates/migration-1-5)
