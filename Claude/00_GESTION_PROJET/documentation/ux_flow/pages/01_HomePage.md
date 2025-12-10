# HomePage

> Route: `/`
> Fichier: `apps/web/src/pages/HomePage.tsx`
> Statut: **Implementee** (mise a jour 10 decembre 2025)

## Objectif

Page principale interactive affichant la grille des 42 fondateurs avec leurs Top 5 Totems.
Click sur une card ouvre le `FounderExpandedView` pour voter.

## Wireframe

```
+-------------------------------------------------------------+
| +----------------------------------------------------------+|
| | HEADER                                      [Connect]     ||
| +----------------------------------------------------------+|
|                                                              |
| +----------------------------------------------------------+|
| |               HERO SECTION                                ||
| |           INTUITION Founders Totem                        ||
| +----------------------------------------------------------+|
|                                                              |
| +----------------------------------------------------------+|
| |                   STATS SECTION                           ||
| |  [42 Founders] [On-chain] [Proposals] [With Totem]        ||
| +----------------------------------------------------------+|
|                                                              |
| +----------------------------------------------------------+|
| |                   FOUNDERS GRID                           ||
| | +----------------+ +----------------+ +----------------+  ||
| | | Photo  | Name  | | Photo  | Name  | | Photo  | Name  |  ||
| | |        | Bio   | |        | Bio   | |        | Bio   |  ||
| | |----------------|+|----------------|+|----------------|  ||
| | | Top Totems     | | Top Totems     | | Top Totems     |  ||
| | | (Votes/TRUST)  | | (Votes/TRUST)  | | (Votes/TRUST)  |  ||
| | | 1. Phoenix +3  | | [Radar Chart]  | | [Liste vide]   |  ||
| | | 2. Lion    +2  | |                | |                |  ||
| | | 3. Eagle   +1  | |                | |                |  ||
| | |----------------|+|----------------|+|----------------|  ||
| | | [Votes][TRUST] | | [Votes][TRUST] | | [Votes][TRUST] |  ||
| | |----------------|+|----------------|+|----------------|  ||
| | | [Click to vote]| | [Click to vote]| | [Click to vote]|  ||
| | +----------------+ +----------------+ +----------------+  ||
| +----------------------------------------------------------+|
+-------------------------------------------------------------+
```

## Composants

### FounderHomeCard
- **Header** : Photo (76x76) + Nom + Bio courte
- **Badge** : Indicateur d'activite recente (si > 0)
- **Top Totems** : Visualisation des 5 meilleurs totems
  - Mode **Votes** (defaut) : Liste classee par Net Votes (walletsFor - walletsAgainst)
  - Mode **TRUST** : Radar chart FOR/AGAINST
- **Selecteur de mode** : Boutons "Votes" et "TRUST" avec effet de zoom
- **Bouton Vote** : "Click to vote" - ouvre FounderExpandedView

### TopTotemsRadar (dans `components/graph/`)
- **Mode `wallets`** : Liste avec barres horizontales
  - Rang (1, 2, 3...)
  - Nom du totem
  - Wallets FOR / AGAINST
  - Net Votes (+X ou -X) en vert/rouge
- **Mode `trust`** : Radar chart recharts
  - Axes = totems
  - Zone bleue = FOR
  - Zone orange = AGAINST
  - Normalisation sqrt pour compresser les valeurs extremes

## Donnees

### Interface TopTotem
```typescript
interface TopTotem {
  id: string;
  label: string;
  image?: string;
  trustFor: number;        // FOR en TRUST (ETH)
  trustAgainst: number;    // AGAINST en TRUST
  totalTrust: number;      // FOR + AGAINST
  netScore: number;        // FOR - AGAINST
  walletsFor: number;      // Nombre de wallets FOR
  walletsAgainst: number;  // Nombre de wallets AGAINST
  totalWallets: number;    // Total wallets
  netVotes: number;        // walletsFor - walletsAgainst
}
```

### Interface FounderForHomePage
```typescript
interface FounderForHomePage {
  id: string;
  name: string;
  shortBio?: string;
  atomId?: string;
  proposalCount: number;
  winningTotem?: { label: string; netScore: bigint; trend: string };
  recentActivityCount: number;
}
```

## Hooks

- `useFoundersForHomePage()` : Liste des fondateurs avec stats
- `useTopTotems(founderName, limit)` : Top N totems pour un fondateur
  - Requete deposits pour compter les wallets uniques
  - Agregation par totem (object_id)
  - Tri par totalTrust puis slice

## Carousel (selecteur de mode)

Le carousel permet de basculer entre deux vues :

1. **Votes** (Net Votes) - Consensus democratique
   - 1 wallet = 1 vote
   - Affiche : walletsFor / walletsAgainst / netVotes
   - Tri par netVotes (descending)

2. **TRUST** (Total TRUST) - Engagement financier
   - ETH depose = poids du vote
   - Affiche : radar chart FOR vs AGAINST
   - Tri par totalTrust (descending)

## Interactions

1. **Click sur card** : Ouvre FounderExpandedView (modal)
2. **Click sur Votes/TRUST** : Change le mode d'affichage (stopPropagation)
3. **Escape** : Ferme FounderExpandedView
4. **URL param** : `?founder=<id>` pour deep link

## Fichiers modifies (10 decembre 2025)

- `apps/web/src/pages/HomePage.tsx` - Page principale
- `apps/web/src/components/founder/FounderHomeCard.tsx` - Card avec carousel
- `apps/web/src/components/graph/TopTotemsRadar.tsx` - Composant dual-mode
- `apps/web/src/hooks/data/useTopTotems.ts` - Hook avec wallet counting
- `apps/web/src/i18n/locales/{en,fr}.json` - Traductions
