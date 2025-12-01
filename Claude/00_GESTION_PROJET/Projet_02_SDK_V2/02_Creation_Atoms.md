# Fonctions de création d'Atoms

**Atoms** désignent les entités de base de la connaissance dans Intuition – ce sont des identifiants uniques représentant n'importe quel concept, objet ou donnée. Le SDK fournit plusieurs fonctions pour créer des Atoms selon la nature de la donnée de départ.

---

## createAtomFromString

Crée un Atom à partir d'une chaîne de caractères (texte brut). C'est le moyen le plus simple de générer un nouvel Atom avec une étiquette texte.

```typescript
const result = await createAtomFromString(
    { walletClient, publicClient, address },
    'Mon premier Atom'
);
console.log('Atom ID:', result.state.termId);
```

### Paramètres

- `address` = adresse du MultiVault approprié (récupérée via `getMultiVaultAddressFromChainId(chainId)`)

### Fonctionnement interne

Sous le capot, cette fonction envoie une transaction au contrat MultiVault pour créer un nouvel Atom contenant les données de la chaîne fournie. L'ID de l'Atom créé est déterminé de manière déterministe par le contenu : le MultiVault calcule un **hash keccak256** des données de l'atom.

### Unicité des Atoms

Si un Atom avec exactement les mêmes données existe déjà, le même `termId` serait produit, et le contrat empêche normalement la création de doublon (un Atom donné ne peut exister qu'une fois dans le graphe global). Une tentative de créer un Atom avec des données identiques à un existant échouera donc (erreur du type **"term already exists"**). Chaque Atom est globalement unique et sert d'identifiant persistant pour la donnée fournie.

---

## createAtomFromThing

Permet de créer un Atom à partir d'un objet structuré (Thing). Cette fonction est utile pour enregistrer des métadonnées plus riches (par ex. un projet, une personne, une ressource web) en une seule fois.

```typescript
const metadata = {
  url: 'https://exemple.com',
  name: 'Projet Exemple',
  description: 'Un projet Web3 intéressant',
  image: 'https://exemple.com/logo.png'
};
const result = await createAtomFromThing({ walletClient, publicClient, address }, metadata);
```

### Champs disponibles

Vous fournissez un objet JavaScript avec des champs tels que :
- `url`
- `name`
- `description`
- `image`
- etc.

Le SDK se charge d'en faire un Atom. Le SDK peut soit stocker directement ces champs on-chain (après sérialisation, en bytes), soit éventuellement les uploader sur IPFS puis enregistrer un hash (selon la taille).

---

## createAtomFromIpfsUpload

Une fonction voisine pour uploader un JSON complet sur IPFS puis créer un Atom à partir du hash IPFS.

Dans tous les cas, le résultat est un nouvel Atom avec un `termId` unique (calculé à partir des données ou du hash).

---

## createAtomFromEthereumAccount

Crée un Atom représentant un compte Ethereum (adresse EOA ou contrat). Il suffit de fournir une adresse Ethereum et un chainId associé.

```typescript
const result = await createAtomFromEthereumAccount(
  { walletClient, publicClient, address },
  { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', chainId: 1 }
);
```

Ceci créerait un Atom identifiant l'adresse vitalik.eth (0xd8dA6B...45 sur Ethereum Mainnet). L'atomData contiendra l'adresse et le chainId, permettant de référencer de façon unique un compte sur une blockchain donnée. Cette fonction est pratique pour intégrer des identités blockchain dans le graphe (par ex., lier une personne à son portefeuille Ethereum).

---

## Coûts et contraintes

| Paramètre | Valeur |
|-----------|--------|
| Frais de création | 0.1 $TRUST |
| Taille max données | 1000 octets |
| Signal initial | 0 (sauf si dépôt inclus) |

### Frais de création

La création d'un Atom exige le paiement d'une frais fixe de création de **0,1 $TRUST** (sur le mainnet Intuition). Ce frais est généralement envoyé en même temps que la transaction de création. Le SDK V2 facilite cela – si aucune valeur n'est spécifiée explicitement, il est probable qu'il envoie le minimum requis. En testnet, $tTRUST (token de test) est utilisé de manière analogue.

### Dépôt initial optionnel

Il est possible d'inclure en supplément un dépôt initial lors de la création (voir la section Signalement), mais ce n'est pas obligatoire. Par défaut, créer un Atom ne lui confère aucun signal de confiance initial : un utilisateur peut créer un identifiant sans y staker de tokens, ce qui laisse l'Atom avec un poids de confiance initial de zéro. (Seul le staking de $TRUST via les fonctions de dépôt confère du Signal à l'Atom – création et signal sont deux actions distinctes).

### Limite de taille

La taille maximale des données d'un Atom est configurée à **1000 octets max**. Si l'objet est trop volumineux (ou une chaîne trop longue), la création pourrait échouer. Le SDK se chargera souvent de rejeter ou de tronquer si nécessaire, mais c'est un paramètre à connaître.

---

## Retour de fonction

Le résultat retourné par `createAtomFromString` inclut notamment :

```typescript
{
  uri: string,           // Si applicable
  transactionHash: string,
  state: {
    creator: string,     // Adresse du créateur
    termId: string,      // Identifiant hashé (keccak256)
    atomWallet: string   // Adresse du wallet associé
  }
}
```

### AtomWallet

Chaque Atom possède en effet son propre petit smart contract (wallet) géré par le protocole pour stocker ses données et sa vault de dépôt. Vous n'interagirez pas directement avec lui dans la plupart des cas (le SDK s'en charge).

---

## Création batch d'Atoms

La fonction `createAtoms` du contrat permet la création batch de multiples Atoms à la fois (en fournissant un tableau de données). Le SDK expose d'ailleurs des méthodes de batch dédiées pour tirer parti de cette efficacité.

```typescript
// Exemple conceptuel - créer plusieurs atoms en une transaction
const atomsData = ['Atom 1', 'Atom 2', 'Atom 3'];
const result = await batchCreateAtoms(
  { walletClient, publicClient, address },
  atomsData
);
```

### Événement émis

Chaque Atom créé émet un événement **AtomCreated** on-chain, utile pour l'indexation.

---

## Sources

- [SDK Getting Started](https://docs.intuition.systems/docs/developer-tools/sdks/getting-started)
- [SDK Overview](https://docs.intuition.systems/docs/developer-tools/sdks/overview)
- [GitHub – intuition-ts](https://github.com/0xIntuition/intuition-ts)
