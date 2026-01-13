# TODO - Implémentation Système de Vote avec Triples

> **Date:** 2 décembre 2025 (mise à jour)
> **Branche:** feature/3-triples-system
> **Documentation:** [INDEX.md](INDEX.md)
> **Décisions Design:** [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md)

---

## État Actuel du Projet

### Ce qui existe déjà

| Élément | Fichier | Description |
|---------|---------|-------------|
| **useVote** | `hooks/useVote.ts` | Vote FOR uniquement (AGAINST non implémenté) |
| **useVoteSubmit** | `hooks/useVoteSubmit.ts` | Logique soumission vote (~210 lignes) |
| **useIntuition** | `hooks/useIntuition.ts` | createAtom, createTriple, createClaim |
| **useVoteStats** | `hooks/useVoteStats.ts` | Statistiques de votes (timeline, distribution) |
| **useTotemData** | `hooks/useTotemData.ts` | Logique totems (~245 lignes) |
| **useProactiveClaimCheck** | `hooks/useProactiveClaimCheck.ts` | Check claim existant (~119 lignes) |
| **useAdminAtoms** | `hooks/useAdminAtoms.ts` | Queries GraphQL admin (~113 lignes) |
| **useAdminActions** | `hooks/useAdminActions.ts` | Handlers création admin (~175 lignes) |
| **VotePanel** | `components/VotePanel.tsx` | Orchestrateur refactorisé (619 lignes) |
| **ClaimExistsModal** | `components/ClaimExistsModal.tsx` | Modal vote sur claim existant |
| **GraphQL Queries** | `lib/graphql/queries.ts` | GET_TRIPLE_VOTES, GET_USER_POSITION, etc. |
| **Subscriptions WS** | `lib/graphql/subscriptions.ts` | Real-time updates |
| **Types** | `types/vote.ts`, `types/claim.ts` | VoteStatus, VoteError, ExistingClaimInfo |

### Composants Vote Extraits (10 fichiers)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `vote/NotConnected.tsx` | ~20 | Écran non connecté |
| `vote/RecentActivity.tsx` | ~50 | Historique votes |
| `vote/VotePreview.tsx` | ~32 | Preview claim |
| `vote/ClaimExistsWarning.tsx` | ~55 | Alerte proactive |
| `vote/PredicateSelector.tsx` | ~86 | Step 1 - Sélection prédicat |
| `vote/TrustAmountInput.tsx` | ~73 | Step 3 - Montant TRUST |
| `vote/TotemSelector.tsx` | ~350 | Step 2 - Sélection totem |
| `vote/SuccessNotification.tsx` | ~33 | Notification succès |
| `vote/ErrorNotification.tsx` | ~35 | Notification erreur |
| `vote/SubmitButton.tsx` | ~39 | Bouton submit |

### Composants Admin Extraits (9 fichiers)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `admin/FoundersTab.tsx` | 206 | Tab fondateurs |
| `admin/PredicatesTab.tsx` | 113 | Tab prédicats |
| `admin/ObjectsTab.tsx` | 251 | Tab objets/totems |
| `admin/OfcCategoriesTab.tsx` | 207 | Tab catégories OFC |
| `admin/AccessDenied.tsx` | 17 | Écran accès refusé |
| `admin/AdminHeader.tsx` | 10 | Header admin |
| `admin/AdminTabs.tsx` | 36 | Navigation tabs |
| `admin/ErrorMessage.tsx` | 11 | Message d'erreur |
| `admin/CreatedItemsList.tsx` | 30 | Liste items créés |

### Ce qui a été implémenté récemment

| Élément | Fichier | Description |
|---------|---------|-------------|
| **Vote AGAINST** | `hooks/useVote.ts` | ✅ Supporte FOR et AGAINST via counterTermId |
| **usePositionFromContract** | `hooks/usePositionFromContract.ts` | ✅ Lecture positions depuis le contrat (fallback GraphQL) |
| **useWithdraw** | `hooks/useWithdraw.ts` | ✅ Retrait avec maxRedeem check |
| **HasCounterStake handling** | `hooks/useVote.ts` | ✅ Gestion erreur position opposée |
| **useVoteCart** | `hooks/useVoteCart.ts` | ✅ Gestion état panier de votes |
| **useBatchVote** | `hooks/useBatchVote.ts` | ✅ Orchestration batch redeem + deposit |
| **VoteCartPanel** | `components/vote/VoteCartPanel.tsx` | ✅ UI panier basique |
| **Types voteCart** | `types/voteCart.ts` | ✅ Types pour le panier |

### Ce qui manque

| Élément | Raison | Référence Doc |
|---------|--------|---------------|
| **Système 3 Triples** | Remplacer préfixe OFC: | [01_Architecture_3_Triples.md](../documentation/technologies/Triples_Vote_System/01_Architecture_3_Triples.md), [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) |
| **Simplification prédicats** | Garder seulement 2 (has totem, embodies) | [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) |
| **Panier localStorage** | Persister le panier entre sessions | [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) |
| **Presets montants** | Min protocole + 20% balance | [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) |
| **Vote Market** | Stats agrégées par fondateur | [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) |
| **UI 3 panneaux** | Refonte interface complète | [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) |
| **Preview Deposit/Redeem** | Prévisualisation des shares | [13_Deposit_Redeem_BondingCurve.md](13_Deposit_Redeem_BondingCurve.md) |
| **Batch Triples** | Création multiple en 1 tx | [03_Creation_Triples.md](03_Creation_Triples.md) |
| **Graphe de votes** | Visualisation graphique | [14_Architecture_Contrats.md](14_Architecture_Contrats.md) |

---

## Refactoring Terminé

### VotePanel.tsx

| Métrique | Avant | Après |
|----------|-------|-------|
| Lignes | 1136 | 619 |
| Composants extraits | 0 | 10 |
| Hooks extraits | 0 | 3 |
| Réduction | - | **-45%** |

### AdminAuditPage.tsx

| Métrique | Avant | Après |
|----------|-------|-------|
| Lignes | 1228 | 229 |
| Composants extraits | 0 | 9 |
| Hooks extraits | 0 | 2 |
| Réduction | - | **-81%** |

---

## Plan d'Implémentation

### Phase 1: Vote AGAINST ✅ COMPLÉTÉ

**Référence doc:** [10_Vote_ForAgainst.md](10_Vote_ForAgainst.md)

- [x] **1.1** Modifier `useVote.ts` pour supporter AGAINST
  - ✅ Récupérer `counterTermId` du triple
  - ✅ Ajouter paramètre `isFor: boolean`
  - ✅ Appeler `deposit()` sur le bon termId

- [x] **1.2** Mettre à jour `ClaimExistsModal.tsx`
  - ✅ Boutons FOR/AGAINST fonctionnels
  - ✅ Afficher totaux FOR vs AGAINST
  - ✅ Gestion erreur `HasCounterStake`

```typescript
// Vote FOR
deposit(termId, curveId, amount, minShares)

// Vote AGAINST
deposit(counterTermId, curveId, amount, minShares)
```

### Phase 1b: Panier de Votes ✅ PARTIELLEMENT COMPLÉTÉ

**Concept:** Permettre à l'utilisateur d'accumuler plusieurs votes avant de les soumettre en batch.

**Référence design:** [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) - Sections 5, 6, 8

#### Tâches complétées

- [x] **1b.1** Créer `useVoteCart.ts` ✅
  - **Fichier:** `hooks/useVoteCart.ts`
  - État du panier (items, total, etc.)
  - Fonctions: addItem, removeItem, updateAmount, clear
  - Calcul automatique des retraits nécessaires

- [x] **1b.2** `useProtocolConfig.ts` existe déjà ✅
  - **Fichier:** `hooks/useProtocolConfig.ts`
  - Lit `minDeposit`, `entryFee`, `exitFee`, `atomCost`, `tripleCost`

- [x] **1b.3** Créer composant `VoteCartPanel.tsx` ✅
  - **Fichier:** `components/vote/VoteCartPanel.tsx`
  - Liste des items, coût total, bouton valider

- [x] **1b.4** Créer `useBatchVote.ts` ✅
  - **Fichier:** `hooks/useBatchVote.ts`
  - Orchestration: redeemBatch → depositBatch

#### Tâches restantes (voir Phase 7)

- [ ] Ajouter localStorage pour persistence
- [ ] Créer `PresetButtons.tsx`
- [ ] Créer `PositionModifier.tsx`
- [ ] Améliorer UI panier (position haut droite)

#### Limitations découvertes

**Référence:** [17_EthMultiVault_V2_Reference.md](17_EthMultiVault_V2_Reference.md)

1. **Pas de fonction combinée redeem+deposit** → 2 transactions minimum pour basculer
2. **Créer atom + triple + deposit = 3 tx séparées** (ou 2 si triple inclut le dépôt initial)
3. **Pas de MAX_BATCH_SIZE explicite** → Arrays limités par le gas uniquement
4. **batchRedeem utilise un pourcentage** (0-100) et non des shares absolues

### Phase 2: Système 3 Triples ✅ COMPLÉTÉ

**Référence doc:** [01_Architecture_3_Triples.md](../documentation/technologies/Triples_Vote_System/01_Architecture_3_Triples.md), [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md)

**Objectif:** Remplacer le préfixe `OFC:` par un système de 3 triples propre.

```
Triple 1: [Fondateur] → [has totem] → [Totem]           ← Vote FOR/AGAINST
Triple 2: [Totem] → [has category] → [Animal]           ← Catégorie du totem
Triple 3: [Animal] → [tag category] → [Overmind Founders Collection]
```

- [x] **2.1** Créer les atoms système (testnet) ✅
  - `has category` (prédicat) → `0xddde1d94...`
  - `tag category` (prédicat) → `0x13254dd3...`
  - `Overmind Founders Collection` (object système) → `0xcbe206fd...`
  - 6 catégories: Animal, Object, Trait, Concept, Element, Mythology

- [x] **2.2** Modifier `useIntuition.ts` ✅
  - Fonction `createClaimWithCategory` pour 3 triples
  - Utilise termIds pré-créés depuis `categories.json`
  - Crée Triple 2 et Triple 3 automatiquement

- [x] **2.3** Adapter les queries GraphQL ✅
  - `GET_TOTEM_CATEGORY` → `predicate: { label: { _eq: "has category" } }`
  - `GET_CATEGORIES_BY_TOTEMS` → même pattern
  - `GET_ALL_TOTEM_CATEGORIES` → même pattern
  - `GET_TOTEMS_BY_CATEGORY` → même pattern
  - Retiré tous les filtres `LIKE 'OFC:%'`

- [x] **2.4** Mettre à jour `categories.json` ✅
  - Structure 3-triples: `predicate`, `tagPredicate`, `systemObject`, `categories`
  - Labels en anglais (Animal, Object, Trait, Concept, Element, Mythology)
  - TermIds testnet configurés

- [x] **2.5** Interface Admin mise à jour ✅
  - `OfcCategoriesTab.tsx` avec sections Prédicats, Objet système, Catégories
  - Export JSON des termIds pour copie facile
  - Affichage debug labels attendus vs retournés

- [x] **2.6** Types TypeScript mis à jour ✅
  - `CategoryConfig` dans `intuition.ts` avec `tagPredicate` et `systemObject`
  - `TotemType` dans `totem.ts` avec IDs anglais

### Phase 3: Simplification Prédicats ✅ COMPLÉTÉ

**Référence doc:** [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) - Section 2

**Objectif:** Garder uniquement 2 prédicats utilisateur.

| Prédicat | Usage | Exemple |
|----------|-------|---------|
| `has totem` | Associatif neutre | Elon → Lion |
| `embodies` | Opinion forte, "incarne" | Elon → Innovation |

- [x] **3.1** Supprimer les prédicats inutilisés ✅
  - `AdminAuditPage.tsx` : PREDICATES réduit de 6 à 2
  - Anciens prédicats supprimés: `is represented by`, `is symbolized by`, `channels`, `resonates with`

- [x] **3.2** Mettre à jour `PredicateSelector.tsx` ✅
  - Affiche descriptions pour chaque prédicat
  - Badge "défaut" pour `has totem`
  - Layout amélioré avec flex-col

- [x] **3.3** Adapter la config/data ✅
  - `predicates.json` avec termIds testnet:
    - `has totem` → `0x73a33c74...`
    - `embodies` → `0x34aa4950...`
  - `PredicatesTab.tsx` avec export JSON des termIds

### Phase 4: Panier Amélioré + Prévisualisation ✅ COMPLÉTÉ

**Référence doc:** [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) - Sections 5, 6, 8 + [13_Deposit_Redeem_BondingCurve.md](13_Deposit_Redeem_BondingCurve.md)

**Objectif:** Améliorer le panier avec persistence, presets et prévisualisation des coûts.

#### Prévisualisation (hooks)

- [x] **4.1** Créer `usePreviewDeposit.ts` ✅
  - **Fichier:** `hooks/usePreviewDeposit.ts`
  - Appel `previewDeposit(termId, curveId, amount)` via `publicClient.readContract`
  - Retourne shares estimées + frais détaillés

- [x] **4.2** Créer `usePreviewRedeem.ts` ✅
  - **Fichier:** `hooks/usePreviewRedeem.ts`
  - Appel `previewRedeem(termId, curveId, shares)` via `publicClient.readContract`
  - Retourne montant TRUST estimé
  - Inclut `previewByPercent` helper

#### Panier amélioré

- [x] **4.3** Ajouter localStorage au panier ✅
  - **Fichier:** `hooks/useVoteCart.ts` (modifié)
  - Sérialisation/désérialisation bigint
  - Expiration 24h
  - Clé par founderId (`ofc_vote_cart_{founderId}`)

- [x] **4.4** Créer `PresetButtons.tsx` ✅
  - **Fichier:** `components/vote/PresetButtons.tsx`
  - Presets: [Min] [10%] [25%] [50%] [100%]
  - Filtre automatique des presets < minimum
  - Version compacte `PresetButtonsCompact` disponible

- [x] **4.5** Créer `PositionModifier.tsx` ✅
  - **Fichier:** `components/vote/PositionModifier.tsx`
  - Pour positions existantes
  - Presets: [10%] [25%] [50%] [80%] [100%] de la position
  - Boutons: [+ Ajouter] [Retirer] [Basculer]

- [x] **4.6** Créer composants UI panier ✅
  - **Fichier:** `components/vote/CartBadge.tsx`
  - `CartBadge` - Badge numérique
  - `CartIconWithBadge` - Icône panier avec badge
  - `FloatingCartButton` - Bouton flottant position fixe

### Phase 5: Batch Execution Hooks ✅ COMPLÉTÉ

**Référence doc:** [17_EthMultiVault_V2_Reference.md](17_EthMultiVault_V2_Reference.md) - Batch functions

**Objectif:** Créer les hooks pour exécuter des transactions batch.

- [x] **5.1** Créer `useBatchDeposit.ts` ✅
  - **Fichier:** `hooks/useBatchDeposit.ts`
  - Appel `depositBatch(receiver, termIds[], curveIds[], assets[], minShares[])`
  - Exécute plusieurs dépôts en 1 transaction
  - Calcul automatique `totalAmount` pour `msg.value`

- [x] **5.2** Créer `useBatchRedeem.ts` ✅
  - **Fichier:** `hooks/useBatchRedeem.ts`
  - Appel `redeemBatch(receiver, termIds[], curveIds[], shares[], minAssets[])`
  - Exécute plusieurs retraits en 1 transaction

- [x] **5.3** Créer `useCartExecution.ts` ✅
  - **Fichier:** `hooks/useCartExecution.ts`
  - Orchestrateur complet: validate → withdraw → deposit
  - Status tracking: idle → validating → withdrawing → depositing → success/error
  - Progress percentage (0-100%)
  - Helper `getStatusLabel()` pour labels FR

### Phase 6: VotePanel Integration ✅ COMPLÉTÉ

**Objectif:** Intégrer les composants panier dans VotePanel.

- [x] **6.1** Intégrer `PresetButtons` dans `TrustAmountInput` ✅
  - Quick amount selection buttons
  - Based on balance and minDeposit

- [x] **6.2** Ajouter `FloatingCartButton` ✅
  - Affiche item count et total cost
  - Ouvre le panel panier au click

- [x] **6.3** Intégrer `VoteCartPanel` en slide-over ✅
  - Panel latéral droit
  - Backdrop + fermeture au click
  - Gestion complète du panier

- [x] **6.4** Wire up `useVoteCart` dans VotePanel ✅
  - Initialize cart per founder
  - Callbacks: remove, update, clear
  - Success callback avec refetch

### Phase 7: Vote Market ✅ COMPLÉTÉ

**Référence doc:** [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) - Section 4

**Objectif:** Afficher les stats agrégées par fondateur.

- [x] **7.1** Créer `useVoteMarketStats.ts` ✅
  - **Fichier:** `hooks/useVoteMarketStats.ts`
  - Total TRUST déposé sur le fondateur
  - Nombre de votants uniques
  - Nombre de totems associés
  - Top totem
  - Ratio FOR/AGAINST global

- [x] **7.2** Créer `VoteMarket.tsx` ✅
  - **Fichier:** `components/vote/VoteMarket.tsx`
  - Version compacte: `VoteMarketCompact.tsx`
  - Stats agrégées avec animations
  - Expandable pour voir plus de détails

- [x] **7.3** Intégrer dans panneau gauche ✅
  - Section dépliable/repliable
  - Utilisé dans `FounderInfoPanel.tsx`

### Phase 8: Batch Triples ✅ COMPLÉTÉ

**Référence doc:** [03_Creation_Triples.md](03_Creation_Triples.md), [12_CreateTriple_Details.md](12_CreateTriple_Details.md)

- [x] **8.1** Créer `useBatchTriples.ts` ✅
  - **Fichier:** `hooks/useBatchTriples.ts`
  - Fonction `createBatch(triples[])` avec atomicité
  - Fonction `validateItems()` pour vérifier si triples existent
  - Fonction `estimateCost()` pour calculer les coûts

- [x] **8.2** Créer `BatchTripleForm.tsx` ✅
  - **Fichier:** `components/admin/BatchTripleForm.tsx`
  - Ajout/suppression de triples dans le batch
  - Validation avant soumission
  - Coût total affiché en temps réel

### Phase 9: Refonte UI 3 Panneaux ✅ COMPLÉTÉ

**Référence doc:** [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) - Section 3

**Objectif:** Interface complète avec 3 panneaux.

```
┌─────────────┬─────────────────────────────┬─────────────────┐
│   GAUCHE    │          CENTRE             │     DROITE      │
│   (1/5)     │           (2/5)             │      (2/5)      │
│             │                             │                 │
│ Infos       │ Totems existants            │ Vote Totem      │
│ Fondateur   │ (grille avec scores)        │                 │
│             │                             │ 1. Prédicat     │
│ Photo       ├─────────────────────────────┤ 2. Direction    │
│ Description │ Mes positions               │ 3. Montant      │
│ Liens       │ (sur ce fondateur)          │                 │
│             │                             │ [Ajouter]       │
│ Vote Market │                             │                 │
│ (compact)   │                             │ [Panier]        │
└─────────────┴─────────────────────────────┴─────────────────┘
```

- [x] **9.1** Créer `FounderInfoPanel.tsx` (gauche) ✅
  - **Fichier:** `components/founder/FounderInfoPanel.tsx`
  - Photo + nom fondateur
  - Bio / description
  - Liens sociaux (Twitter, Farcaster)
  - Vote Market compact intégré
  - Status WebSocket (connecté, pausé, chargement)

- [x] **9.2** Créer `FounderCenterPanel.tsx` (centre) ✅
  - **Fichier:** `components/founder/FounderCenterPanel.tsx`
  - Onglets: Totems | Mes positions
  - Grille totems cliquables avec scores FOR/AGAINST
  - Section "Mes positions" (positions de l'utilisateur)
  - Sélection de totem pour vote

- [x] **9.3** Adapter panneau droit (Vote Totem) ✅
  - **Fichier:** `components/founder/VoteTotemPanel.tsx`
  - Sélecteur de prédicat (has totem / embodies)
  - Direction FOR/AGAINST
  - Input montant avec PresetButtonsCompact
  - Bouton "Ajouter au panier"
  - Preview du vote

- [x] **9.4** Intégrer le panier (haut droite) ✅
  - **Fichier:** `components/FounderExpandedView.tsx`
  - Badge avec nombre de votes
  - Panel slide-over dépliable
  - VoteCartPanel intégré
  - Total + bouton valider

### Phase 10: Graphe de Visualisation ✅ COMPLÉTÉ

**Référence doc:** [14_Architecture_Contrats.md](14_Architecture_Contrats.md)

- [x] **10.1** Créer `useVoteGraph.ts` ✅
  - **Fichier:** `hooks/useVoteGraph.ts`
  - Récupère triples et votes via GraphQL
  - Transforme en nodes/edges pour reagraph
  - Stats: totalNodes, totalEdges, uniqueTotems, uniquePredicates, totalVotes

- [x] **10.2** Créer `VoteGraph.tsx` ✅
  - **Fichier:** `components/graph/VoteGraph.tsx`
  - Librairie: **reagraph** (WebGL haute performance)
  - Nodes = atoms (fondateurs violet, prédicats indigo, totems vert)
  - Edges = triples avec poids basé sur votes
  - Contrôles: recentrer, ajuster la vue
  - Lazy loading pour les performances
  - Intégré dans FounderCenterPanel (onglet "Graphe")

---

## Détails Techniques

### Coûts à Afficher

**Référence doc:** [04_Depots_TRUST.md](04_Depots_TRUST.md)

| Opération | Coût | Source |
|-----------|------|--------|
| Création Atom | Variable | `getAtomCost()` |
| Création Triple | Variable | `getTripleCost()` |
| Frais d'entrée (dépôt) | Variable | `vaultFees().entryFee` |
| Frais protocole | Variable | `vaultFees().protocolFee` |
| Frais de sortie (retrait) | ~7% défaut | `vaultFees().exitFee` |
| Dépôt minimum | Variable | `generalConfig().minDeposit` |
| Dénominateur frais | 10000 (bp) | `generalConfig().feeDenominator` |

### Lecture des configs en 1 appel

```typescript
import { multiCallIntuitionConfigs } from '@0xintuition/protocol';

const config = await multiCallIntuitionConfigs({
  address: multiVaultAddress,
  publicClient,
});

// Retourne:
// - atomCost, tripleCost
// - entryFee, exitFee, protocolFee
// - minDeposit, feeDenominator
// - etc.
```

### Signatures des fonctions batch

#### depositBatch
```typescript
function depositBatch(
  receiver: address,
  termIds: bytes32[],
  curveIds: uint256[],
  assets: uint256[],
  minShares: uint256[]
): uint256[] // shares reçues
// payable - msg.value = sum(assets)
```

#### redeemBatch
```typescript
function redeemBatch(
  receiver: address,
  termIds: bytes32[],
  curveIds: uint256[],
  shares: uint256[],
  minAssets: uint256[]
): uint256[] // assets reçus
```

#### previewDeposit
```typescript
function previewDeposit(
  termId: bytes32,
  curveId: uint256,
  assets: uint256
): (shares: uint256, assetsAfterFees: uint256)
```

#### previewRedeem
```typescript
function previewRedeem(
  termId: bytes32,
  curveId: uint256,
  shares: uint256
): (assetsAfterFees: uint256, sharesUsed: uint256)
```

### Batch Creation - Atomicité

**Référence doc:** [03_Creation_Triples.md](03_Creation_Triples.md)

```typescript
// TOUT ou RIEN
batchCreateTripleStatements(triples[]) {
  // Si un triple échoue → tous revert
  // Si tous OK → tous créés dans même tx
}

// Idem pour depositBatch et redeemBatch
// Une erreur = toute la transaction revert
```

### Calcul du coût total d'un panier

```typescript
function calculateCartCost(cart: VoteCart, config: MultivaultConfig) {
  let totalCost = 0n;
  let totalWithdrawable = 0n;

  for (const item of cart.items) {
    // Si nouveau totem → ajouter coût création atom
    if (item.isNewTotem) {
      totalCost += BigInt(config.atomCost);
    }

    // Si position opposée → on récupère du TRUST
    if (item.needsWithdraw && item.currentPosition) {
      // Utiliser previewRedeem pour le montant exact
      totalWithdrawable += item.currentPosition.shares; // approximation
    }

    // Ajouter le dépôt demandé
    totalCost += item.amount;

    // Ajouter les frais d'entrée
    const entryFee = (item.amount * BigInt(config.entryFee)) / BigInt(config.feeDenominator);
    totalCost += entryFee;
  }

  return {
    totalCost,
    totalWithdrawable,
    netCost: totalCost - totalWithdrawable,
  };
}
```

---

## Points d'Attention

1. **TRUST est natif** sur Intuition L3 → utiliser `msg.value`, pas de transfert ERC20
2. **Counter vault** pour AGAINST → récupérer l'ID via GraphQL ou contrat (`counterTermId`)
3. **Slippage protection** → toujours utiliser `minShares`/`minAssets`
4. **Batch atomicité** → tout ou rien, gérer l'UX en conséquence
5. **Frais cumulatifs** → afficher le total (entrée + protocole + redistribution)
6. **curveId = 1** pour tous les dépôts (FOR et AGAINST)
7. **HasCounterStake** → Impossible d'avoir position FOR et AGAINST simultanément
8. **MAX_BATCH_SIZE** → Vérifier la limite avant de soumettre un batch
9. **Pas de combinaison redeem+deposit** → 2 transactions minimum pour basculer

---

## Références Documentation

### Documentation SDK V2

| Sujet | Fichier |
|-------|---------|
| Réseaux & Endpoints | [01_Reseaux_Endpoints.md](01_Reseaux_Endpoints.md) |
| Création Atoms | [02_Creation_Atoms.md](02_Creation_Atoms.md) |
| Création Triples | [03_Creation_Triples.md](03_Creation_Triples.md) |
| Dépôts TRUST | [04_Depots_TRUST.md](04_Depots_TRUST.md) |
| Retraits Redeem | [05_Retraits_Redeem.md](05_Retraits_Redeem.md) |
| Config Wagmi | [07_Config_Wagmi_Connexion.md](07_Config_Wagmi_Connexion.md) |
| Transactions Write | [08_Transactions_Write.md](08_Transactions_Write.md) |
| Vote FOR/AGAINST | [10_Vote_ForAgainst.md](10_Vote_ForAgainst.md) |
| CreateTriple Details | [12_CreateTriple_Details.md](12_CreateTriple_Details.md) |
| Bonding Curves | [13_Deposit_Redeem_BondingCurve.md](13_Deposit_Redeem_BondingCurve.md) |
| Architecture Contrats | [14_Architecture_Contrats.md](14_Architecture_Contrats.md) |
| Sécurité | [16_Securite_Modificateurs.md](16_Securite_Modificateurs.md) |
| EthMultiVault Reference | [17_EthMultiVault_V2_Reference.md](17_EthMultiVault_V2_Reference.md) |
| **Décisions Design V2** | [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) |

### Documentation Architecture

| Sujet | Fichier |
|-------|---------|
| Architecture 3 Triples | [01_Architecture_3_Triples.md](../documentation/technologies/Triples_Vote_System/01_Architecture_3_Triples.md) |

---

## Prochaine Étape

### Phases complétées

- ✅ **Phase 1**: Vote AGAINST
- ✅ **Phase 2**: Système 3 Triples (testnet configuré)
- ✅ **Phase 3**: Simplification Prédicats (2 prédicats: `has totem`, `embodies`)
- ✅ **Phase 4**: Panier + Prévisualisation (hooks preview, localStorage, PresetButtons, CartBadge)
- ✅ **Phase 5**: Batch Execution Hooks (useBatchDeposit, useBatchRedeem, useCartExecution)
- ✅ **Phase 6**: VotePanel Integration (FloatingCartButton, VoteCartPanel slide-over)
- ✅ **Phase 7**: Vote Market (useVoteMarketStats, VoteMarket, VoteMarketCompact)
- ✅ **Phase 8**: Batch Triples (useBatchTriples, BatchTripleForm)
- ✅ **Phase 9**: Refonte UI 3 Panneaux (FounderInfoPanel, FounderCenterPanel, VoteTotemPanel)
- ✅ **Phase 10**: Graphe de Visualisation (useVoteGraph, VoteGraph avec reagraph)

### Ordre d'implémentation

| Phase | Nom | Dépendances | Priorité | Statut |
|-------|-----|-------------|----------|--------|
| ~~**2**~~ | ~~Système 3 Triples~~ | - | ~~Haute~~ | ✅ Fait |
| ~~**3**~~ | ~~Simplification Prédicats~~ | Phase 2 | ~~Haute~~ | ✅ Fait |
| ~~**4**~~ | ~~Panier + Prévisualisation~~ | Phases 2-3 | ~~Moyenne~~ | ✅ Fait |
| ~~**5**~~ | ~~Batch Execution Hooks~~ | Phase 4 | ~~Moyenne~~ | ✅ Fait |
| ~~**6**~~ | ~~VotePanel Integration~~ | Phase 5 | ~~Moyenne~~ | ✅ Fait |
| ~~**7**~~ | ~~Vote Market~~ | - | ~~Moyenne~~ | ✅ Fait |
| ~~**8**~~ | ~~Batch Triples~~ | Phase 2 | ~~Basse~~ | ✅ Fait |
| ~~**9**~~ | ~~Refonte UI 3 Panneaux~~ | Phases 4-7 | ~~Basse~~ | ✅ Fait |
| ~~**10**~~ | ~~Graphe de Visualisation~~ | - | ~~Nice to have~~ | ✅ Fait |
| **11** | **Results Page** | - | Haute | ⏸️ En pause |
| **12** | **Linear/Progressive Curves** | - | Haute | 🔄 En cours |

**Phases 1-10 complétées !** Phase 12 (Linear/Progressive Curves) en cours.

---

## Phase 11: Results Page - Top 5 Totems par Fondateur

**Date** : 10 décembre 2025
**Objectif** : Afficher les résultats des votes pour tous les fondateurs

### 11.1 Concept

Deux métriques par totem :
1. **Net Votes** = Nb wallets FOR - Nb wallets AGAINST (consensus communautaire, 1 wallet = 1 voix)
2. **Total TRUST** = FOR + AGAINST (force de conviction / engagement)

### 11.2 Tâches

- [x] **11.1** Analyser le code existant réutilisable ✅
  - `useTopTotems.ts` - Calcule TRUST FOR/AGAINST, agrège par totem
  - `useFoundersForHomePage.ts` - Retourne les 42 fondateurs avec winning totem
  - `useFounderPanelStats.ts` - Pattern 2 queries (triples + deposits) pour count wallets
  - `GET_DEPOSITS_BY_TERM_IDS` - Query pour récupérer `sender_id` et `vault_type`
  - `GET_ALL_PROPOSALS` - Tous les triples avec votes

- [ ] **11.2** Créer `useTopTotemsWithVoters.ts`
  - Ajouter `walletsFor` et `walletsAgainst` (count distinct sender_id)
  - Garder `trustFor` et `trustAgainst`
  - Trier par `netVotes` (wallets FOR - wallets AGAINST)

- [ ] **11.3** Créer `useAllFoundersResults.ts`
  - Agréger les résultats pour tous les 42 fondateurs
  - Retourner Top 5 totems par fondateur

- [ ] **11.4** Créer composants UI
  - `pages/ResultsPage.tsx` - Page principale avec grille
  - `components/results/FounderResultCard.tsx` - Card par fondateur
  - `components/results/TotemResultsChart.tsx` - Bar chart empilé (recharts)

- [ ] **11.5** Intégration
  - Ajouter route `/results` dans `router.tsx`
  - Ajouter traductions i18n (en.json, fr.json)

### 11.3 Données GraphQL nécessaires

```graphql
# Pour compter les wallets uniques par totem
query GetVotersPerTriple($termId: String!) {
  deposits(where: { term_id: { _eq: $termId } }) {
    sender_id
    vault_type  # "triple_positive" (FOR) ou "triple_negative" (AGAINST)
    assets_after_fees
  }
}
```

### 11.4 Structure des données

```typescript
interface TopTotemWithVoters {
  id: string;
  label: string;
  image?: string;
  // TRUST metrics
  trustFor: number;
  trustAgainst: number;
  totalTrust: number;
  netTrust: number;
  // Wallet metrics
  walletsFor: number;
  walletsAgainst: number;
  totalWallets: number;
  netVotes: number;  // walletsFor - walletsAgainst (TRI PRINCIPAL)
}
```

---

## Phase 12: Support Linear/Progressive Bonding Curves

**Date** : 20 décembre 2025
**Objectif** : Supporter les deux types de bonding curves INTUITION V2

### 12.1 Contexte

INTUITION V2 supporte deux bonding curves :
- **Linear** (curveId = 1) : Courbe linéaire standard
- **Progressive** (curveId = 4) : Courbe progressive avec offset

### 12.2 Tâches

- [x] **12.1** Ajouter support `curveId` aux hooks de vote/withdraw
  - `useVote.ts` : paramètre `curveId` optionnel
  - `useWithdraw.ts` : paramètre `curveId` optionnel

- [x] **12.2** Créer hook `useTopTotemsByCurve.ts`
  - Breakdown Linear/Progressive par totem
  - Winners par curve
  - Stats agrégées

- [x] **12.3** Créer composant `CurveStatsPanel.tsx`
  - Toggle Linear/Progressive/All
  - Stats par curve avec NET score
  - Affichage winners

- [x] **12.4** Fix critique : FOR/AGAINST detection
  - Problème : `vault_type` non fiable
  - Solution : Utiliser `term_id` vs `counter_term_id`
  - Fichiers : `useFoundersForHomePage.ts`, `useVotesTimeline.ts`

- [x] **12.5** Intégration dans les panels
  - `FounderCenterPanel` : CurveStatsPanel + curveFilter
  - `FounderExpandedView` : État partagé curveFilter
  - `FounderInfoPanel` : Affichage winner selon curveFilter

- [ ] **12.6** Tests et validation
  - Vérifier affichage des données
  - Vérifier couleurs TradingChart (FOR=vert, AGAINST=orange)
  - Tester toggle curve

### 12.3 Points techniques

**FOR/AGAINST dans INTUITION V2** :
```typescript
// Dépôt sur term_id = vote FOR
// Dépôt sur counter_term_id = vote AGAINST

const termToTripleMap = new Map<string, { tripleTermId: string; isFor: boolean }>();
triples.forEach((t) => {
  map.set(t.term_id, { tripleTermId: t.term_id, isFor: true });
  if (t.counter_term?.id) {
    map.set(t.counter_term.id, { tripleTermId: t.term_id, isFor: false });
  }
});
```

**curve_id** :
- `"1"` = Linear
- `"4"` = Progressive
- `null` = défaut Linear

---

## Historique des modifications

| Date | Changement |
|------|------------|
| 28 nov 2025 | Création initiale |
| 1 déc 2025 | Phase 1 complétée, ajout Phase 1b (Panier de Votes), documentation batch operations |
| 2 déc 2025 | Création [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) avec toutes les décisions de design |
| 2 déc 2025 | Renumérotation phases (2-9) dans l'ordre logique d'implémentation |
| 2 déc 2025 | **Phase 2 complétée**: Système 3 Triples implémenté et configuré sur testnet |
| 2 déc 2025 | **Phase 3 complétée**: Simplification à 2 prédicats (`has totem`, `embodies`) avec termIds testnet |
| 2 déc 2025 | **Phase 4 complétée**: usePreviewDeposit, usePreviewRedeem, PresetButtons, PositionModifier, CartBadge, localStorage persistence |
| 2 déc 2025 | **Phase 5 complétée**: useBatchDeposit, useBatchRedeem, useCartExecution orchestrator |
| 2 déc 2025 | **Phase 6 complétée**: VotePanel integration avec FloatingCartButton et VoteCartPanel slide-over |
| 2 déc 2025 | **Phase 7 complétée**: useVoteMarketStats, VoteMarket.tsx, VoteMarketCompact.tsx |
| 2 déc 2025 | **Phase 8 complétée**: useBatchTriples.ts, BatchTripleForm.tsx |
| 2 déc 2025 | **Phase 9 complétée**: FounderInfoPanel, FounderCenterPanel, VoteTotemPanel, refonte FounderExpandedView 3-panels |
| 2 déc 2025 | **Phase 10 complétée**: useVoteGraph.ts, VoteGraph.tsx avec reagraph (WebGL), onglet Graphe dans FounderCenterPanel |
| 2 déc 2025 | **PROJET TERMINÉ** - Toutes les 10 phases implémentées ! |
| 5 déc 2025 | **i18n Internationalisation**: Tous les composants traduits EN/FR |
| 20 déc 2025 | **Phase 12 en cours**: Support Linear/Progressive Bonding Curves, fix FOR/AGAINST detection |
