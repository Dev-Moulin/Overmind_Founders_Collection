# useAllProposals

> Fichier: `apps/web/src/hooks/useAllProposals.ts`
> Lignes: 156

## Description

Hook pour récupérer toutes les propositions et les grouper par fondateur. Chaque fondateur reçoit son totem gagnant (celui avec le plus haut score NET).

---

## Interface

```typescript
export function useAllProposals(): {
  founders: FounderWithTotem[];
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<any>;
  totalFounders: number;
  totalProposals: number;
  totalClaims: number;
  foundersWithWinners: number;
};
```

---

## Types

### `FounderWithTotem`

```typescript
interface FounderWithTotem {
  id: string;           // Nom du fondateur (utilisé comme ID)
  name: string;
  image?: string;
  winningTotem?: {
    objectId: string;
    object: {
      id: string;
      label: string;
      image?: string;
      description?: string;
    };
    netScore: bigint;
    totalFor: bigint;
    totalAgainst: bigint;
    claimCount: number;
  };
  totalProposals: number;  // Nombre de totems uniques proposés
  totalClaims: number;     // Nombre total de triples (claims)
  totalVoters: number;     // Voteurs uniques (approximation)
}
```

---

## Retour Détaillé

| Propriété | Type | Description |
|-----------|------|-------------|
| `founders` | `FounderWithTotem[]` | Fondateurs avec leurs totems gagnants |
| `loading` | `boolean` | État de chargement |
| `error` | `ApolloError` | Erreur si requête échoue |
| `refetch` | `function` | Fonction pour rafraîchir les données |
| `totalFounders` | `number` | Nombre total de fondateurs uniques |
| `totalProposals` | `number` | Somme des totems uniques |
| `totalClaims` | `number` | Somme de tous les triples |
| `foundersWithWinners` | `number` | Fondateurs avec au moins 1 totem gagnant |

---

## Exemple d'Utilisation

```tsx
function ResultsPage() {
  const { founders, loading, error, refetch, totalFounders } = useAllProposals();

  if (loading) return <div>Chargement des résultats...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div>
      <h1>Résultats ({totalFounders} fondateurs)</h1>
      <button onClick={() => refetch()}>Rafraîchir</button>

      {founders.map(founder => (
        <div key={founder.id} className="founder-card">
          <img src={founder.image} alt={founder.name} />
          <h2>{founder.name}</h2>

          {founder.winningTotem ? (
            <div className="winning-totem">
              <p>🏆 Totem gagnant: {founder.winningTotem.object.label}</p>
              <p>Score: {formatEther(founder.winningTotem.netScore)} TRUST</p>
              <p>Claims: {founder.winningTotem.claimCount}</p>
            </div>
          ) : (
            <p>Aucun totem proposé</p>
          )}

          <p>{founder.totalProposals} propositions</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Logique Interne

### 1. Groupement par Fondateur

```typescript
// Les triples sont groupés par subject.label (nom du fondateur)
const founderMap = new Map<string, Triple[]>();
data.triples.forEach(triple => {
  const founderName = triple.subject.label;
  if (!founderMap.has(founderName)) {
    founderMap.set(founderName, []);
  }
  founderMap.get(founderName).push(triple);
});
```

### 2. Agrégation des Totems

```typescript
// Pour chaque fondateur, on agrège ses totems par objet
const aggregatedTotems = aggregateTriplesByObject(formattedTriples);
// Retourne un tableau trié par netScore (décroissant)
```

### 3. Détermination du Gagnant

```typescript
// Le totem gagnant est le premier (plus haut score NET)
const winningTotem = aggregatedTotems.length > 0 ? aggregatedTotems[0] : undefined;
```

### 4. Tri Alphabétique

```typescript
// Les fondateurs sont triés alphabétiquement par nom
founders.sort((a, b) => a.name.localeCompare(b.name));
```

---

## Query GraphQL

```graphql
query GetAllProposals {
  triples(
    where: {
      subject: { type: { _eq: "Person" } }
    }
    order_by: { created_at: desc }
  ) {
    term_id
    subject { term_id, label, image }
    predicate { term_id, label }
    object { term_id, label, image, description }
    triple_vault { total_assets, total_shares }
    counter_term { id, total_assets }
    created_at
  }
}
```

---

## Dépendances

- `@apollo/client` : `useQuery`
- `aggregateTriplesByObject` depuis `../utils/aggregateVotes`
- `GET_ALL_PROPOSALS` depuis `../lib/graphql/queries`

---

## Cas d'Usage

| Cas | Description |
|-----|-------------|
| Page Résultats | Afficher tous les fondateurs avec leurs totems gagnants |
| Dashboard Admin | Statistiques globales sur les propositions |
| Export | Génération de rapports sur les votes |

---

**Dernière mise à jour** : 25 novembre 2025
