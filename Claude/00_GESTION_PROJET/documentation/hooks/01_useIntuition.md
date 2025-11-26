# useIntuition

> Fichier: `apps/web/src/hooks/useIntuition.ts`
> Lignes: 463

## Description

Hook principal pour interagir avec le SDK INTUITION. Permet de créer des atoms (identités on-chain), des triples (claims), et de gérer les propositions.

---

## Fonctions Exportées

### `useIntuition()`

Hook principal qui retourne les fonctions de création.

#### Retour

```typescript
{
  createAtom: (value: string, depositAmount?: string) => Promise<CreateAtomResult>;
  createFounderAtom: (founder: FounderData, depositAmount?: string) => Promise<CreateAtomResult>;
  createTriple: (subjectId: Hex, predicateId: Hex, objectId: Hex, depositAmount: string) => Promise<CreateTripleResult>;
  createClaim: (params: CreateClaimParams) => Promise<CreateClaimResult>;
  isReady: boolean;
}
```

---

## Interfaces

### `CreateAtomResult`

```typescript
interface CreateAtomResult {
  uri: string;              // URI IPFS de l'atom
  transactionHash: string;  // Hash de la transaction
  termId: Hex;              // ID de l'atom créé
}
```

### `CreateTripleResult`

```typescript
interface CreateTripleResult {
  transactionHash: string;
  tripleId: Hex;
  subjectId: Hex;
  predicateId: Hex;
  objectId: Hex;
}
```

### `ClaimExistsError`

Erreur custom quand un claim existe déjà :

```typescript
class ClaimExistsError extends Error {
  termId: Hex;           // ID du triple existant
  subjectLabel: string;  // Label du sujet
  predicateLabel: string;
  objectLabel: string;
}
```

---

## Fonctions Détaillées

### `createAtom(value, depositAmount?)`

Crée un atom simple à partir d'une string (pour prédicats, totems).

```typescript
const { createAtom } = useIntuition();

const result = await createAtom('Lion', '0.001');
console.log('Atom créé:', result.termId);
```

### `createFounderAtom(founder, depositAmount?)`

Crée un atom avec métadonnées complètes (pour fondateurs).

```typescript
const { createFounderAtom } = useIntuition();

const result = await createFounderAtom({
  name: 'Vitalik Buterin',
  shortBio: 'Co-founder of Ethereum',
  twitter: 'VitalikButerin',
  image: 'https://...'
}, '0.001');
```

### `createTriple(subjectId, predicateId, objectId, depositAmount)`

Crée un triple (claim) à partir de 3 atomIds existants.

**Important V2 :**
- `msg.value` doit inclure le `tripleBaseCost` + `depositAmount`
- Le contrat valide : `msg.value == sum(assets)`

```typescript
const { createTriple } = useIntuition();

await createTriple(
  '0xsubject...',  // Fondateur atomId
  '0xpredicate...', // Prédicat atomId
  '0xobject...',   // Totem atomId
  '0.01'           // Dépôt initial
);
```

### `createClaim(params)`

Fonction haut niveau qui :
1. Vérifie si les atoms existent (getOrCreate)
2. Vérifie si le triple existe déjà
3. Crée le triple

```typescript
const { createClaim } = useIntuition();

try {
  const result = await createClaim({
    subjectId: '0xfounder...',
    predicate: 'is represented by',  // String = créer si n'existe pas
    object: 'Lion',                  // String = créer si n'existe pas
    depositAmount: '0.01'
  });
} catch (error) {
  if (error instanceof ClaimExistsError) {
    // Rediriger vers la page de vote
    navigate(`/vote/${error.termId}`);
  }
}
```

---

## Fonctions Internes

### `findAtomByLabel(label)`

Cherche un atom existant par son label via GraphQL.

```typescript
const existingId = await findAtomByLabel('Lion');
if (existingId) {
  // L'atom existe déjà
}
```

### `findTriple(subjectId, predicateId, objectId)`

Vérifie si un triple existe déjà.

### `getOrCreateAtom(value, depositAmount?)`

Pattern "get or create" :
1. Cherche l'atom par label
2. Si existe, retourne l'ID existant
3. Sinon, crée un nouvel atom

---

## Configuration V2 Contract

Le hook récupère la config du contrat pour validation :

```typescript
const contractConfig = await multiCallIntuitionConfigs({ publicClient, address });

console.log('Triple base cost:', contractConfig.formatted_triple_cost);
console.log('Min deposit:', contractConfig.formatted_min_deposit);
console.log('Entry fee:', contractConfig.formatted_entry_fee);
```

**Validations automatiques :**
- Vérifie que `deposit >= minDeposit`
- Vérifie que `balance >= tripleBaseCost + deposit`
- Messages d'erreur explicites avec montants

---

## Fonction Utilitaire

### `getFounderImageUrl(founder)`

Cascade pour obtenir l'image du fondateur :

```typescript
export function getFounderImageUrl(founder: FounderData): string {
  // 1. Image manuelle si fournie
  if (founder.image) return founder.image;

  // 2. Avatar Twitter via unavatar.io
  if (founder.twitter) {
    return `https://unavatar.io/twitter/${founder.twitter.replace('@', '')}`;
  }

  // 3. Avatar GitHub
  if (founder.github) {
    return `https://github.com/${founder.github}.png`;
  }

  // 4. Fallback DiceBear
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
}
```

---

## Dépendances

- `wagmi` : `usePublicClient`, `useWalletClient`
- `@apollo/client` : `useApolloClient`
- `@0xintuition/sdk` : `createAtomFromString`, `createAtomFromThing`, `getMultiVaultAddressFromChainId`
- `@0xintuition/protocol` : `MultiVaultAbi`, `multiCallIntuitionConfigs`
- `viem` : `parseEther`, `formatEther`, `Hex`

---

## Exemple Complet

```tsx
function ProposePage() {
  const { createClaim, isReady } = useIntuition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (founderAtomId: string, predicate: string, totem: string) => {
    if (!isReady) {
      toast.error('Wallet non connecté');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createClaim({
        subjectId: founderAtomId,
        predicate,
        object: totem,
        depositAmount: '0.01'
      });

      toast.success('Claim créé !');
      console.log('Triple ID:', result.triple.tripleId);
    } catch (error) {
      if (error instanceof ClaimExistsError) {
        toast.info('Ce claim existe déjà. Votez dessus !');
        navigate(`/vote?claim=${error.termId}`);
      } else {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button onClick={() => handleSubmit('0x...', 'is represented by', 'Lion')} disabled={isSubmitting}>
      {isSubmitting ? 'Création...' : 'Créer Claim'}
    </button>
  );
}
```

---

**Dernière mise à jour** : 25 novembre 2025
