# Statut d'Implémentation - INTUITION Founders Totem

**Dernière mise à jour** : 19 novembre 2025

Ce document résume ce qui a été implémenté, les recherches effectuées et ce qui reste à faire.

---

## Ce qui a été implémenté

### Phase 1 : Infrastructure de base (DONE)

| Issue | Description | PR |
|-------|-------------|-----|
| #18 | Fichier données 42 fondateurs | #72 |
| #19 | Setup wagmi + RainbowKit | #73 |
| #20 | ConnectButton custom | #74 |
| #77 | Setup Tailwind CSS v4 | #75 |
| #78 | Composants Header/Footer | #76 |
| #21 | Vérification réseau Base Mainnet | #82 |
| #22 | Backend endpoint whitelist | #83 |
| #79 | Configuration .env | #84 |
| #80 | Setup React Router | #85 |
| #81 | Installation INTUITION SDK | #86 |

### Phase 2 : Composants et Pages (DONE)

| Issue | Description | PR |
|-------|-------------|-----|
| #23 | Composant NotEligible | #87 |
| #24 | Composant WalletInfo | #88 |
| #48 | Page Landing/Home | #89 |
| #49 | Layout avec navigation | #90 |
| #50 | Page 404 Not Found | #91 |
| #26 | Composant FounderCard | #92 |
| #25 | Page Proposer avec grille | #93 |
| #27 | Composant ProposalModal | #94 |

### Phase 3 : Intégration INTUITION SDK (DONE)

| Issue | Description | PR |
|-------|-------------|-----|
| #29 | SDK - Création d'Atoms | #95 |
| #30 | SDK - Création de Triples | #95 |

**Détails de l'implémentation (#29/#30)** :

- **Hook `useIntuition.ts`** créé avec :
  - `createAtom(value, depositAmount?)` : Crée un atom à partir d'une string
  - `createTriple(subjectId, predicateId, objectId, depositAmount)` : Crée un triple
  - `createClaim(params)` : Combinaison complète (création atoms + triple)
  - Utilise `batchCreateTripleStatements` du SDK

- **`ProposalModal` refactoré** avec :
  - Sélection/création de prédicat (dropdown ou nouveau)
  - Sélection/création d'objet/totem (dropdown ou nouveau)
  - Input pour montant TRUST à déposer
  - Aperçu du claim en temps réel
  - Prédicats par défaut : "is represented by", "has totem", etc.

- **`ProposePage` mis à jour** :
  - Intégration du hook `useIntuition`
  - Notifications success/error
  - Gestion des erreurs SDK
  - Support pour `existingPredicates` et `existingObjects` (pour GraphQL futur)

- **Type `FounderData` enrichi** :
  - Ajout du champ `atomId?: string` pour stocker l'ID INTUITION

---

## Recherches effectuées

### 1. Protocole INTUITION - Concepts clés

**Atoms** :
- Unités de base du graphe de connaissances
- Créés avec `createAtomFromString()` ou `createAtomFromThing()`
- Retournent un `termId` (Hex) unique

**Triples** :
- Structure : `[Sujet] + [Prédicat] + [Objet]`
- Créés avec `createTripleStatement()` ou `batchCreateTripleStatements()`
- Représentent une affirmation (claim)

**Signaux/Votes** :
- Dépôts de TRUST sur les vaults FOR ou AGAINST
- Montant = poids du vote
- Récupérable après le vote

### 2. SDK INTUITION v2.0.0-alpha.4

**Fonctions principales** :
```typescript
// Création
createAtomFromString(config, value, deposit?)
createAtomFromThing(config, metadata, deposit?)
batchCreateTripleStatements(config, [[subjects], [predicates], [objects], [deposits]])

// Requêtes
getAtomDetails(atomId)
getTripleDetails(tripleId)
globalSearch(query)
findAtomIds(labels)
findTripleIds(triples)

// Adresses
getMultiVaultAddressFromChainId(chainId)
```

**Package GraphQL** :
```typescript
import { createClient } from '@0xintuition/graphql';

const client = createClient({
  apiUrl: 'https://testnet.intuition.sh/v1/graphql'
});
```

### 3. Configuration Testnet

**Base Sepolia** (Chain ID: 84532) :
- Testnet recommandé pour INTUITION
- Même réseau que la production
- Migration facile

**Adresses contrats testnet** :
```
Token $TRUST (Test):        0xA54b4E6e356b963Ee00d1C947f478d9194a1a210
BaseEmissionsController:    0xC14773Aae24aA60CB8F261995405C28f6D742DCf
TimelockController:         0x9099BC9fd63B01F94528B60CEEB336C679eb6d52
```

**Faucets** :
- ETH : https://www.alchemy.com/faucets/base-sepolia
- $TRUST : https://testnet.hub.intuition.systems/

### 4. Mécanisme d'agrégation des votes

**Fichier de recherche** : [Vote_Aggregation_Research.md](./Vote_Aggregation_Research.md)

**Découverte principale** : Les votes sont comptabilisés **indépendamment pour chaque triple** (sujet + prédicat + objet).

**Preuve technique** :
- La fonction `calculateTripleId()` génère un hash unique basé sur les 3 composants
- Chaque triple a son propre `termId` et ses propres vaults (FOR et AGAINST)
- Pas d'agrégation automatique par objet dans le protocole

**Stratégie d'implémentation** :
- **Agrégation client-side** : Regrouper les claims par `objectId` (totem)
- **NET score** : Calculer `(TRUST FOR - TRUST AGAINST)` pour chaque claim
- **Somme** : Additionner les NET scores de tous les claims pour un même totem
- Le totem avec le NET score total le plus élevé gagne

**Avantages** :
- Les utilisateurs ont la liberté de créer n'importe quel prédicat
- Le système s'auto-régule via les votes AGAINST
- Gère correctement les prédicats négatifs (NET score faible/négatif)
- Enrichit le knowledge graph INTUITION

---

## Ce qui reste à faire

### Issues OPEN prioritaires

**Propositions** :
- [ ] #31 - Composant TransactionProgress (suivi des transactions)
- [ ] #32 - Gestion erreurs proposition (rejection, gas, duplicates)
- [ ] #33/#34 - Requêtes GraphQL pour propositions

**Vote** :
- [ ] #35 - Page Vote avec liste des propositions
- [ ] #36 - Composant TotemCard
- [ ] #37 - VoteModal (choisir montant TRUST)
- [ ] #38 - Hook useVote
- [ ] #39 - Requêtes GraphQL pour votes
- [ ] #40 - Page MyVotes (historique)
- [ ] #41 - Hook useWithdraw
- [ ] #42 - Gestion erreurs vote

**Résultats** :
- [ ] #43 - Page Results globale
- [ ] #44 - Page FounderDetails
- [ ] #45 - Page TotemDetails
- [ ] #46 - GraphQL statistiques
- [ ] #47 - Export résultats

### Prochaines étapes recommandées

1. **Configurer le testnet** :
   - Modifier `wagmi.ts` pour utiliser `baseSepolia`
   - Modifier `useIntuition.ts` pour utiliser `baseSepolia`
   - Obtenir ETH et $TRUST de test

2. **Créer les Atoms des fondateurs** :
   - Script pour créer les 42 atoms
   - Sauvegarder les `atomId` dans `founders.json`
   - Créer l'atom prédicat "is represented by"

3. **Implémenter les requêtes GraphQL** (issues #33/#34) :
   - Récupérer les propositions existantes
   - Alimenter les dropdowns de prédicats/objets

4. **Implémenter le système de vote** (issues #35-42) :
   - Pages et composants de vote
   - Hooks pour deposit/withdraw TRUST

---

## Architecture des fichiers clés

### Frontend

```
apps/web/src/
├── components/
│   ├── ConnectButton.tsx      # Connexion wallet RainbowKit
│   ├── FounderCard.tsx        # Carte fondateur avec infos
│   ├── Layout.tsx             # Layout principal
│   ├── NetworkGuard.tsx       # Vérifie le réseau
│   ├── NotEligible.tsx        # Message non éligible
│   └── ProposalModal.tsx      # Modal création claim
├── hooks/
│   └── useIntuition.ts        # Hook SDK INTUITION
├── lib/
│   └── wagmi.ts               # Config wagmi/RainbowKit
├── pages/
│   ├── HomePage.tsx           # Landing page
│   ├── ProposePage.tsx        # Page propositions
│   └── NotFoundPage.tsx       # 404
└── router.tsx                 # Routes React Router
```

### Données

```
packages/shared/src/data/
└── founders.json              # 42 fondateurs avec infos
```

---

## Notes techniques importantes

### SDK INTUITION

1. **`batchCreateTripleStatements`** attend des tableaux :
   ```typescript
   [[subjectId], [predicateId], [objectId], [depositAmount]]
   ```
   Pour un seul triple, on passe des tableaux à un élément.

2. **Retour de `createAtomFromString`** :
   ```typescript
   {
     uri: string,
     transactionHash: string,
     state: { termId: Hex }
   }
   ```

3. **Retour de `batchCreateTripleStatements`** :
   ```typescript
   {
     transactionHash: string,
     state: [{
       creator: Hex,
       termId: Hex,      // ID du triple
       subjectId: Hex,
       predicateId: Hex,
       objectId: Hex
     }]
   }
   ```

### Prédicats par défaut

Le modal propose des prédicats suggérés :
- **Prédicats par défaut** :
  - "is represented by"
  - "has totem"
  - "is symbolized by"
  - "is associated with"
- **Exemples supplémentaires** :
  - "embodies"
  - "channels"
  - "resonates with"

Ces prédicats sont des strings. Si sélectionnés, ils créent de nouveaux atoms. Pour réutiliser des atoms existants, il faut implémenter le GraphQL (#33/#34).

Les utilisateurs sont libres de créer n'importe quel prédicat pour exprimer la relation qui leur semble la plus pertinente.

### Vote avec TRUST

Le dépôt de TRUST fonctionne en deux étapes :
1. **Approve** : Autoriser le contrat MultiVault à dépenser les TRUST
2. **Deposit** : Déposer les TRUST dans le vault FOR/AGAINST du triple

---

## Ressources

### Documentation
- SDK : https://www.docs.intuition.systems/docs/developer-tools/sdks/overview
- GraphQL : https://www.docs.intuition.systems/docs/developer-tools/graphql-api/overview
- Testnet Hub : https://testnet.hub.intuition.systems/

### GitHub
- Monorepo : https://github.com/0xIntuition/intuition-ts
- SDK Package : https://github.com/0xIntuition/intuition-ts/tree/main/packages/sdk

### Explorers
- Base Sepolia : https://sepolia.basescan.org/
- Base Mainnet : https://basescan.org/
