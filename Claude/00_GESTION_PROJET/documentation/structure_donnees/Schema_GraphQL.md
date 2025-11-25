# Structure des données - Schéma GraphQL INTUITION

## ⚠️ IMPORTANT - Version du schéma

Ce document décrit le **schéma V2** de l'API INTUITION utilisé sur le testnet (`https://testnet.intuition.sh/v1/graphql`).

### Changements principaux V2 vs V1 :

1. **Plus de champ `id` sur atoms et triples** → Utiliser uniquement `term_id`
2. **Structure des vaults modifiée** :
   - V1 : `positiveVault` / `negativeVault`
   - V2 : `triple_vault` (FOR) / `counter_term` (AGAINST)
3. **Accès aux votes AGAINST** : Via `counter_term.total_assets` au lieu de `negativeVault.totalAssets`

**Sources de cette documentation** :
- Tests directs avec `curl` sur l'API GraphQL : https://testnet.intuition.sh/v1/graphql
- Introspection du schéma avec `__type` queries
- SDK INTUITION : @0xintuition/sdk version 2.0.0-alpha.4

**⚠️ Toute la documentation ci-dessous utilise le schéma V2.**

---

## Vue d'ensemble

Toutes les données du projet sont stockées on-chain via le protocol INTUITION et interrogeables via l'API GraphQL.

**API Endpoint** : https://testnet.intuition.sh/v1/graphql
**Schéma source** : https://raw.githubusercontent.com/0xIntuition/intuition-ts/main/packages/graphql/schema.graphql

## Types principaux

### 1. Atoms (Identités / Concepts)

Un **Atom** représente une unité atomique de connaissance : personne, objet, concept, trait, etc.

#### Définition GraphQL

```graphql
type atoms {
  # Identifiants
  term_id: String!              # ID unique de l'Atom (SEUL IDENTIFIANT DISPONIBLE)
  wallet_id: String!            # Adresse du vault wallet

  # Créateur
  creator: accounts             # Relation vers le créateur
  creator_id: String!           # ID du créateur

  # Contenu
  label: String                 # Nom de l'Atom (ex: "Joseph Lubin")
  data: String                  # Données structurées (JSON)
  raw_data: String!             # Données brutes
  emoji: String                 # Emoji associé
  image: String                 # URL de l'image

  # Métadonnées
  type: atom_type!              # Type d'Atom (Thing, Person, etc.)
  resolving_status: atom_resolving_status!

  # Blockchain
  block_number: numeric!        # Numéro de bloc de création
  log_index: bigint!            # Index dans les logs
  transaction_hash: String!     # Hash de la transaction

  # Timestamps
  created_at: timestamptz!      # Date de création
  updated_at: timestamptz!      # Dernière mise à jour

  # Relations
  term: terms                   # Relation vers term
  atom_values: [atom_values!]!  # Valeurs associées

  # Relations Triples
  as_subject_triples: [triples!]!    # Triples où cet Atom est sujet
  as_predicate_triples: [triples!]!  # Triples où cet Atom est prédicat
  as_object_triples: [triples!]!     # Triples où cet Atom est objet

  # Vault (pour les votes)
  totalShares: numeric          # Total de shares dans le vault
  totalAssets: numeric          # Total d'assets dans le vault
  vault: vaults                 # Relation vers le vault
}
```

#### Exemple de query

```graphql
query GetAtom {
  atoms(where: { label: { _eq: "Joseph Lubin" } }) {
    term_id
    label
    emoji
    image
    type
    created_at
    creator {
      id
      label
    }
    totalShares
    totalAssets
    vault {
      id
      curveId
      isActive
    }
  }
}
```

#### Exemple de réponse

```json
{
  "data": {
    "atoms": [
      {
        "term_id": "0x1234567890abcdef...",
        "label": "Joseph Lubin",
        "emoji": null,
        "image": "ipfs://Qm...",
        "type": "Person",
        "created_at": "2025-11-01T10:00:00Z",
        "creator": {
          "id": "0xabcd...1234",
          "label": "Alice"
        },
        "totalShares": "1000000000000000000",
        "totalAssets": "1000000000000000000",
        "vault": {
          "id": "0xvault123...",
          "curveId": "1",
          "isActive": true
        }
      }
    ]
  }
}
```

### 2. Triples (Relations / Propositions)

Un **Triple** relie trois Atoms au format RDF : Sujet - Prédicat - Objet

Pour notre projet : `[Fondateur] [represented_by] [Totem]`

#### Définition GraphQL

```graphql
type triples {
  # Identifiant
  term_id: String!              # ID unique du Triple (SEUL IDENTIFIANT DISPONIBLE)

  # Les trois Atoms
  subject: atoms                # Atom sujet (ex: Joseph Lubin)
  subject_id: String!

  predicate: atoms              # Atom prédicat (ex: represented_by)
  predicate_id: String!

  object: atoms                 # Atom objet (ex: Lion)
  object_id: String!

  # Créateur
  creator: accounts             # Qui a créé ce Triple
  creator_id: String!

  # Vaults (votes) - STRUCTURE V2
  triple_vault: triple_vault    # Vault FOR (votes positifs)
  counter_term: terms           # Term du vault AGAINST (votes négatifs)
  counter_term_id: String!      # ID du counter_term

  # Blockchain
  block_number: numeric!        # Bloc de création
  transaction_hash: String!

  # Timestamps
  created_at: timestamptz!

  # Relation
  term: terms
}
```

**IMPORTANT** : Le schéma V2 ne contient plus `id`, `positiveVault`, `negativeVault`.
Utilisez `triple_vault` pour les votes FOR et `counter_term` pour accéder aux votes AGAINST.

#### Exemple de query (V2)

```graphql
query GetTripleProposals {
  triples(
    where: {
      subject: { label: { _eq: "Joseph Lubin" } }
      predicate: { label: { _eq: "represented_by" } }
    }
    order_by: { created_at: desc }
  ) {
    term_id
    subject {
      term_id
      label
      image
    }
    predicate {
      term_id
      label
    }
    object {
      term_id
      label
      image
    }
    creator {
      id
    }
    triple_vault {
      total_shares
      total_assets
    }
    counter_term {
      id
      total_assets
    }
    created_at
  }
}
```

#### Exemple de réponse (V2)

```json
{
  "data": {
    "triples": [
      {
        "term_id": "0xterm456...",
        "subject": {
          "term_id": "0xsubject123...",
          "label": "Joseph Lubin",
          "image": "ipfs://Qm..."
        },
        "predicate": {
          "term_id": "0xpred789...",
          "label": "represented_by"
        },
        "object": {
          "term_id": "0xobject456...",
          "label": "Lion",
          "image": "ipfs://Qm...lion"
        },
        "creator": {
          "id": "0xuser789..."
        },
        "triple_vault": {
          "total_shares": "150000000000000000000",
          "total_assets": "150000000000000000000"
        },
        "counter_term": {
          "id": "0xcounter_term...",
          "total_assets": "5000000000000000000"
        },
        "created_at": "2025-11-15T14:30:00Z"
      }
    ]
  }
}
```

### 3. Triple Vault (Stockage des votes FOR)

Dans le schéma V2, chaque triple a un **triple_vault** qui stocke les votes FOR.

#### Définition GraphQL

```graphql
type triple_vault {
  term_id: String!              # ID du term associé
  total_shares: numeric!        # Total de shares dans le vault
  total_assets: numeric!        # Total d'assets ($TRUST) - votes FOR
  market_cap: numeric!          # Capitalisation du marché
  position_count: bigint!       # Nombre de positions
  curve_id: numeric!            # ID de la bonding curve
  block_number: numeric!
  counter_term_id: String!      # ID du counter_term (pour votes AGAINST)
  updated_at: timestamptz!

  # Relations
  term: terms
  counter_term: terms           # Accès au vault AGAINST
}
```

**Note V2** : Pour les votes AGAINST, il faut accéder au `counter_term` qui est un autre `term` avec son propre `total_assets`:
- `triple_vault.total_assets` : votes FOR
- `counter_term.total_assets` : votes AGAINST

### 4. Deposits (Votes)

Un **Deposit** représente un vote (dépôt de $TRUST dans un vault).

#### Définition GraphQL

```graphql
type deposits {
  id: String!

  # Qui
  sender: accounts              # Qui a voté
  sender_id: String!
  receiver: accounts            # Receveur (généralement même que sender)
  receiver_id: String!

  # Quoi
  term: terms                   # Sur quel term (Atom ou Triple)
  term_id: String!
  vault: vaults                 # Dans quel vault
  vault_type: vault_type!       # Type de vault

  # Montants
  shares: numeric!              # Nombre de shares reçues
  total_shares: numeric!        # Total de shares après dépôt
  assets_after_fees: numeric!   # Montant après frais

  # Blockchain
  block_number: numeric!
  log_index: bigint!
  transaction_hash: String!
  created_at: timestamptz!

  # Courbe
  curve_id: numeric!
}
```

#### Exemple de query - Votes d'un user

```graphql
query GetUserVotes {
  deposits(
    where: {
      sender_id: { _eq: "0xuser123..." }
    }
    order_by: { created_at: desc }
  ) {
    id
    term_id
    shares
    assets_after_fees
    created_at
    vault_type
    term {
      # Si c'est un Triple
      ... on triples {
        subject { label }
        object { label }
      }
    }
  }
}
```

### 5. Positions (Positions d'un user)

Une **Position** représente la position totale d'un user sur un term.

#### Définition GraphQL

```graphql
type positions {
  id: String!

  # Qui
  account: accounts
  account_id: String!

  # Sur quoi
  term: terms
  term_id: String!
  vault: vaults

  # Montants
  shares: numeric!              # Total de shares possédées
  total_deposit_assets_after_total_fees: numeric!
  total_redeem_assets_for_receiver: numeric!

  # Blockchain
  block_number: bigint!
  log_index: bigint!
  transaction_hash: String!
  transaction_index: bigint!

  # Timestamps
  created_at: timestamptz!
  updated_at: timestamptz!

  # Courbe
  curve_id: numeric!
}
```

## Types de données

### Scalars personnalisés

```graphql
scalar numeric      # Nombres décimaux (BigDecimal)
scalar bigint       # Entiers très grands (BigInt)
scalar bytea        # Données binaires
scalar jsonb        # JSON
scalar timestamptz  # Timestamp avec timezone
scalar float8       # Float 64 bits
```

### Enums

#### atom_type
```graphql
enum atom_type {
  Thing           # Objet/concept générique
  Person          # Personne
  Organization    # Organisation
  Account         # Compte blockchain
}
```

#### vault_type
```graphql
enum vault_type {
  atom
  triple_positive
  triple_negative
}
```

#### order_by
```graphql
enum order_by {
  asc
  desc
  asc_nulls_first
  asc_nulls_last
  desc_nulls_first
  desc_nulls_last
}
```

## Opérateurs de comparaison

Pour les filtres `where` :

```graphql
# Égalité
_eq: "value"          # Égal à
_neq: "value"         # Différent de

# Comparaison
_gt: 100              # Plus grand que
_gte: 100             # Plus grand ou égal
_lt: 100              # Plus petit que
_lte: 100             # Plus petit ou égal

# Ensembles
_in: ["val1", "val2"] # Dans la liste
_nin: ["val1"]        # Pas dans la liste

# Null
_is_null: true        # Est null
_is_null: false       # N'est pas null

# Strings
_like: "%pattern%"    # LIKE SQL
_ilike: "%pattern%"   # LIKE insensible à la casse
_regex: "^pattern$"   # Expression régulière
_similar: "pattern"   # SIMILAR TO SQL
```

## Queries utiles pour notre projet

### 1. Récupérer tous les totems proposés pour un fondateur

```graphql
query GetFounderTotems($founderName: String!) {
  triples(
    where: {
      subject: { label: { _eq: $founderName } }
      predicate: { label: { _eq: "represented_by" } }
    }
    order_by: { created_at: desc }
  ) {
    id
    object {
      term_id
      label
      image
      type
    }
    creator {
      id
    }
    triple_vault {
      total_shares
      total_assets
    }
    counter_term {
      id
      total_assets
    }
    created_at
  }
}
```

### 2. Récupérer le totem gagnant (avec agrégation)

> ⚠️ **IMPORTANT** : Un même totem peut avoir **plusieurs claims** avec différents prédicats.
> Il faut donc récupérer TOUS les triples et agréger côté client avec `aggregateTriplesByObject()`.

```graphql
# ❌ INCORRECT - Ne récupère qu'un seul triple
# query GetWinningTotem { triples(limit: 1) { ... } }

# ✅ CORRECT - Récupérer TOUS les triples puis agréger côté client
query GetAllTriplesForFounder($founderName: String!) {
  triples(
    where: {
      subject: { label: { _eq: $founderName } }
    }
  ) {
    term_id
    predicate {
      term_id
      label
    }
    object {
      term_id
      label
      image
      emoji
    }
    triple_vault {
      total_shares
      total_assets
    }
    counter_term {
      id
      total_assets
    }
  }
}
```

```typescript
// Côté client : agréger par objet (totem)
import { aggregateTriplesByObject, getWinningTotem } from '@/utils/aggregateVotes';

const aggregated = aggregateTriplesByObject(triples);
const winner = getWinningTotem(aggregated);
// winner.netScore = Σ(FOR - AGAINST) de tous les claims pour ce totem
```

### 3. Récupérer les votes d'un user

```graphql
query GetMyVotes($walletAddress: String!) {
  deposits(
    where: {
      sender_id: { _eq: $walletAddress }
      vault_type: { _eq: "triple_positive" }
    }
    order_by: { created_at: desc }
  ) {
    id
    shares
    assets_after_fees
    created_at
    term {
      ... on triples {
        subject {
          term_id
          label
        }
        object {
          term_id
          label
        }
        triple_vault {
          total_assets
        }
      }
    }
  }
}
```

### 4. Compter les propositions pour chaque fondateur

```graphql
query CountProposalsPerFounder {
  atoms(
    where: {
      label: {
        _in: [
          "Joseph Lubin",
          "Andrew Keys",
          # ... tous les 42 fondateurs
        ]
      }
    }
  ) {
    label
    as_subject_triples_aggregate(
      where: { predicate: { label: { _eq: "represented_by" } } }
    ) {
      aggregate {
        count
      }
    }
  }
}
```

### 5. Rechercher un totem par nom

```graphql
query SearchTotem($searchTerm: String!) {
  atoms(
    where: {
      label: { _ilike: $searchTerm }
      type: { _in: ["Thing", "Person"] }
    }
    limit: 10
  ) {
    term_id
    label
    image
    emoji
    type
  }
}
```

## Agrégations

Pour compter, sommer, etc. :

```graphql
query GetStats {
  # Compter les Triples
  triples_aggregate {
    aggregate {
      count
    }
  }

  # Compter les dépôts
  deposits_aggregate(
    where: { vault_type: { _eq: "triple_positive" } }
  ) {
    aggregate {
      count
      sum {
        shares
        assets_after_fees
      }
    }
  }
}
```

## Subscriptions (temps réel)

Pour écouter les changements en temps réel :

```graphql
subscription OnNewVote {
  deposits(
    order_by: { created_at: desc }
    limit: 1
  ) {
    id
    shares
    sender_id
    term_id
    created_at
  }
}
```

## Configuration du client GraphQL

```typescript
import { createClient } from '@0xintuition/graphql';

const client = createClient({
  apiUrl: 'https://testnet.intuition.sh/v1/graphql'  // Testnet
  // ou
  // apiUrl: 'https://mainnet.intuition.sh/v1/graphql'  // Mainnet
});

// Query
const result = await client.request(query, variables);

// Subscription
const subscription = client.subscribe(subscriptionQuery, {
  next: (data) => console.log('New data:', data),
  error: (error) => console.error('Error:', error),
  complete: () => console.log('Complete')
});
```

## React Query Hooks (avec SDK)

```typescript
import { useAtomsQuery, useTriplesQuery } from '@0xintuition/graphql';

function MyComponent() {
  // Query Atoms
  const { data, loading, error } = useAtomsQuery({
    variables: {
      where: { label: { _eq: "Joseph Lubin" } }
    }
  });

  // Query Triples
  const { data: triples } = useTriplesQuery({
    variables: {
      where: {
        subject_id: { _eq: atomId }
      }
    }
  });

  return <div>{/* ... */}</div>;
}
```

## Notes importantes

### Format des montants

Les montants ($TRUST, shares, assets) sont en **wei** (18 décimales) :
- `"1000000000000000000"` = 1 $TRUST
- Utiliser `parseEther()` et `formatEther()` de viem

```typescript
import { parseEther, formatEther } from 'viem';

// Convertir 10 TRUST en wei
const amount = parseEther('10');  // "10000000000000000000"

// Convertir wei en TRUST
const trust = formatEther('150000000000000000000');  // "150"
```

### IDs et adresses

- `term_id`, `id` : Hash hexadécimal commençant par `0x`
- `wallet_id`, `creator_id`, `account_id` : Adresses Ethereum (0x + 40 caractères)

### Timestamps

- Format : ISO 8601 avec timezone
- Exemple : `"2025-11-15T14:30:00+00:00"`

```typescript
const date = new Date(atom.created_at);
```

## Ressources

- **Schema complet** : https://raw.githubusercontent.com/0xIntuition/intuition-ts/main/packages/graphql/schema.graphql
- **Playground GraphQL** : https://testnet.intuition.sh/v1/graphql
- **Documentation SDK** : https://www.docs.intuition.systems/docs/developer-tools/graphql-api/overview
