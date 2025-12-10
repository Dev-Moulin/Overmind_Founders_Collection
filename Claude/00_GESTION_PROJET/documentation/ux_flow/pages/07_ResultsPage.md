# ResultsPage

> Route: `/results`
> Fichier: `apps/web/src/pages/ResultsPage.tsx`
> Statut: **SUPPRIMEE** (10 decembre 2025)

## Decision

La page Results separee a ete supprimee. Les resultats sont maintenant integres directement dans la HomePage via les `FounderHomeCard`.

Chaque card affiche :
- **Top 5 Totems** du fondateur
- **Deux modes** : Net Votes (wallets) et Total TRUST (radar)
- **Carousel** pour basculer entre les vues

Voir [01_HomePage.md](./01_HomePage.md) pour les details de l'implementation.

---

## Ancienne spec (historique)

### Objectif original

Vue d'ensemble des resultats pour tous les fondateurs avec podium et stats.

## Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                      [Connect]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              RESULTS                                    │ │
│ │                                                          │ │
│ │  Discover the winning totems for all founders          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  GLOBAL STATISTICS                                      │ │
│ │                                                          │ │
│ │  Total Claims: 234    |  Total TRUST: 12,345            │ │
│ │  Unique Totems: 87    |  Active Voters: 156             │ │
│ │  Completed: 42/42 (100%)                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  TOP TOTEMS ACROSS ALL FOUNDERS                         │ │
│ │                                                          │ │
│ │  Most popular totems:                                   │ │
│ │                                                          │ │
│ │  🦁 Lion (5 founders)     🦅 Eagle (4 founders)         │ │
│ │  🥝 Kiwi (3 founders)     🐉 Dragon (3 founders)        │ │
│ │  ⚡ Lightning (2)         🌊 Ocean (2)                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  FILTERS                                                │ │
│ │  Category: [All ▼]  Sort: [TRUST ▼]  View: [Grid ▼]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │           FOUNDERS RESULTS GRID                         │ │
│ │                                                          │ │
│ │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │ │
│ │  │ Photo  │ │ Photo  │ │ Photo  │ │ Photo  │           │ │
│ │  │        │ │        │ │        │ │        │  ...      │ │
│ │  │ Name   │ │ Name   │ │ Name   │ │ Name   │           │ │
│ │  │────────│ │────────│ │────────│ │────────│           │ │
│ │  │ 🏆     │ │ 🏆     │ │ 🏆     │ │ 🏆     │           │ │
│ │  │🦁 Lion │ │🥝 Kiwi │ │🦅 Eagle│ │🐉Dragon│           │ │
│ │  │125 TR  │ │80 TR   │ │60 TR   │ │55 TR   │           │ │
│ │  │────────│ │────────│ │────────│ │────────│           │ │
│ │  │5 claims│ │2 claims│ │3 claims│ │4 claims│           │ │
│ │  │15 votes│ │8 votes │ │12 votes│ │10 votes│           │ │
│ │  │────────│ │────────│ │────────│ │────────│           │ │
│ │  │[Details│ │[Details│ │[Details│ │[Details│           │ │
│ │  └────────┘ └────────┘ └────────┘ └────────┘           │ │
│ │                                                          │ │
│ │           ... (all 42 founders)                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  CATEGORY BREAKDOWN                                     │ │
│ │                                                          │ │
│ │  Animals: 18   Objects: 12   Traits: 8                 │ │
│ │  Universe: 3   Superpower: 1                            │ │
│ │                                                          │ │
│ │  [View Details]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  EXPORT OPTIONS                                         │ │
│ │                                                          │ │
│ │  [Export JSON]  [Export CSV]  [Generate NFT Metadata]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FOOTER                                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Composants

### Global Statistics Panel
- **Totaux globaux** :
  - Total de claims crees
  - Total TRUST depose
  - Nombre de totems uniques
  - Nombre de voters actifs
  - Progression (fondateurs avec totem / 42)

### Top Totems Section
- **Totems les plus populaires** :
  - Totem utilise par plusieurs fondateurs
  - Compte le nombre de fondateurs par totem
  - Affichage visuel avec emojis

### Filters Bar
- **Dropdown Category** : Filtre par categorie
- **Dropdown Sort** :
  - "Most TRUST"
  - "Most claims"
  - "Most votes"
  - "Alphabetical"
- **View Mode** : Grid ou List

### Founders Results Grid
Similar a HomePage mais :
- **Focus sur le totem gagnant** :
  - Badge "WINNER" pour le winner
  - Emoji + nom du totem
  - NET Score
- **Stats supplementaires** :
  - Nombre de claims pour ce fondateur
  - Nombre total de votes
- **Action** :
  - Bouton "Details" -> FounderDetailPage

### Category Breakdown
- **Pie chart ou bar chart** :
  - Distribution des categories
  - Comptage par categorie

### Export Options
- **Export JSON** : Format structure pour devs
- **Export CSV** : Format tableur
- **Generate NFT Metadata** : Format JSON pour NFTs

```json
{
  "name": "Joseph Lubin - Lion",
  "description": "Totem for Joseph Lubin",
  "image": "ipfs://...",
  "attributes": [
    { "trait_type": "Founder", "value": "Joseph Lubin" },
    { "trait_type": "Totem", "value": "Lion" },
    { "trait_type": "Category", "value": "Animal" },
    { "trait_type": "TRUST Score", "value": 125 }
  ]
}
```

## Flow d'interaction

```
User arrive sur /results
    |
Charge les donnees via useAllProposals()
    |
Affiche Global Stats
    |
Affiche Top Totems
    |
Affiche Filters
    |
Affiche Founders Grid
    |
User peut filtrer/trier
    |
User peut cliquer sur une card
    |
Redirect vers FounderDetailsPage
```

## Hooks

- `useAllProposals()` : Resultats pour tous les fondateurs
- `useGlobalStats()` : Statistiques globales
- `useTopTotems()` : Totems les plus populaires
- `useCategoryBreakdown()` : Distribution par categorie

## Etats

- `categoryFilter` : Categorie selectionnee
- `sortBy` : Mode de tri
- `viewMode` : 'grid' | 'list'
- `loading` : Chargement
- `error` : Erreur

---

## Ecarts avec l'implementation actuelle

### Ce qui est implemente (203 lignes)
- [x] Hook `useAllProposals()` avec GraphQL
- [x] Global Stats Grid (4 cards: Fondateurs, Propositions, Totems gagnants, Claims)
- [x] Search input
- [x] Sort select (Nom/Votes/Propositions)
- [x] FounderResultCard composant
- [x] Loading/Error/Empty states
- [x] Status Indicator temps reel

### Ce qui manque
- [ ] **Top Totems Section** : Totems populaires avec comptage fondateurs
- [ ] **Category filter** : Filtre par categorie de totem
- [ ] **View Mode toggle** : Grid/List
- [ ] **Category Breakdown** : Distribution par categorie (chart)
- [ ] **Export Options** : JSON, CSV, NFT Metadata
- [ ] **Stats detaillees** : Total TRUST, Unique Totems, Active Voters, Progression

### Differences de design
- Global Stats simplifie (4 cards) vs panel detaille avec progression
- Pas de section **Top Totems**
- Pas de **Category Breakdown** chart
- Pas d'**Export Options**

