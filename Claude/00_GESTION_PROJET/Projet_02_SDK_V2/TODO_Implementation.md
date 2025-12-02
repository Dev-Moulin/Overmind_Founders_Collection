# TODO - Implémentation Système de Vote avec Triples

> **Date:** 2 décembre 2025 (mise à jour)
> **Branche:** refactor/votepanel-decomposition
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

### Phase 2: Système 3 Triples

**Référence doc:** [01_Architecture_3_Triples.md](../documentation/technologies/Triples_Vote_System/01_Architecture_3_Triples.md), [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md)

**Objectif:** Remplacer le préfixe `OFC:` par un système de 3 triples propre.

```
Triple 1: [Fondateur] → [has totem] → [Totem]           ← Vote FOR/AGAINST
Triple 2: [Totem] → [has category] → [Animal]           ← Catégorie du totem
Triple 3: [Animal] → [tag category] → [Overmind Founders Collection]
```

- [ ] **2.1** Créer les atoms système (une fois sur mainnet)
  - `has totem` (prédicat)
  - `embodies` (prédicat)
  - `has category` (prédicat)
  - `tag category` (prédicat)
  - `Overmind Founders Collection` (object système)

- [ ] **2.2** Modifier `useIntuition.ts`
  - Fonction `createClaimWithCategory` pour 3 triples
  - Vérifier si catégorie existe déjà (Triple 3)
  - Créer Triple 3 si nouvelle catégorie

- [ ] **2.3** Adapter les queries GraphQL
  - `GET_ALL_CATEGORIES` → filtrer par Triple 3
  - `GET_TOTEM_CATEGORY` → lire Triple 2
  - Retirer tous les `LIKE 'OFC:%'`

- [ ] **2.4** Mettre à jour `categories.json`
  - Retirer le préfixe `OFC:`
  - Labels génériques (Animal, Film, Concept...)

### Phase 3: Simplification Prédicats

**Référence doc:** [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) - Section 2

**Objectif:** Garder uniquement 2 prédicats utilisateur.

| Prédicat | Usage | Exemple |
|----------|-------|---------|
| `has totem` | Associatif neutre | Elon → Lion |
| `embodies` | Opinion forte, "incarne" | Elon → Innovation |

- [ ] **3.1** Supprimer les prédicats inutilisés
  - `is represented by`
  - `is symbolized by`
  - `channels`

- [ ] **3.2** Mettre à jour `PredicateSelector.tsx`
  - Afficher seulement 2 options
  - Descriptions claires pour chaque

- [ ] **3.3** Adapter la config/data
  - Fichier predicates si existant
  - Types TypeScript

### Phase 4: Panier Amélioré + Prévisualisation

**Référence doc:** [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) - Sections 5, 6, 8 + [13_Deposit_Redeem_BondingCurve.md](13_Deposit_Redeem_BondingCurve.md)

**Objectif:** Améliorer le panier avec persistence, presets et prévisualisation des coûts.

#### Prévisualisation (hooks)

- [ ] **4.1** Créer `usePreviewDeposit.ts`
  - Appel `previewDeposit(termId, curveId, amount)`
  - Retourne shares estimées + frais détaillés

- [ ] **4.2** Créer `usePreviewRedeem.ts`
  - Appel `previewRedeem(termId, curveId, shares)`
  - Retourne montant TRUST estimé

#### Panier amélioré

- [ ] **4.3** Ajouter localStorage au panier
  ```typescript
  // Sauvegarder
  localStorage.setItem('voteCart', JSON.stringify(cart));

  // Récupérer au chargement
  const saved = localStorage.getItem('voteCart');
  if (saved) setCart(JSON.parse(saved));
  ```

- [ ] **4.4** Créer `PresetButtons.tsx`
  - Nouveau vote: basé sur 20% de la balance
  - Presets: [Min] [10%] [25%] [50%] [100%]
  - Filtrer les presets < minimum requis

- [ ] **4.5** Créer `PositionModifier.tsx`
  - Pour positions existantes
  - Presets: [10%] [25%] [50%] [80%] [100%] de la position
  - Boutons: [FOR +Ajouter] [RETIRER Tout] [AGAINST Basculer]

- [ ] **4.6** Améliorer UI panier
  - Position: haut droite de l'écran
  - Afficher nombre de votes en badge
  - Bloquer navigation si panier non vide (confirmation)
  - Afficher prévisualisation (coûts, shares) via hooks 4.1/4.2

### Phase 5: Vote Market

**Référence doc:** [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) - Section 4

**Objectif:** Afficher les stats agrégées par fondateur.

- [ ] **5.1** Créer `useVoteMarketStats.ts`
  - Total TRUST déposé sur le fondateur
  - Nombre de votants uniques
  - Nombre de totems associés
  - Top totem
  - Ratio FOR/AGAINST global

- [ ] **5.2** Créer `VoteMarket.tsx`
  ```
  ┌─────────────────────────┐
  │ Total TRUST: 150.5      │
  │ Total votants: 45       │
  │ Totems associés: 12     │
  │ ▼ Détails               │
  │   Top totem: Lion       │
  │   Ratio FOR/AGAINST: 78%│
  └─────────────────────────┘
  ```

- [ ] **5.3** Intégrer dans panneau gauche
  - Section dépliable/repliable
  - Mise à jour en temps réel (subscription)

### Phase 6: Batch Triples

**Référence doc:** [03_Creation_Triples.md](03_Creation_Triples.md), [12_CreateTriple_Details.md](12_CreateTriple_Details.md)

- [ ] **6.1** Créer `useBatchTriples.ts`
  - Fonction `batchCreate(triples[])`
  - Gestion erreurs atomique (tout ou rien)
  - Progress tracking

- [ ] **6.2** Créer `BatchTripleForm.tsx`
  - Ajout/suppression de triples
  - Validation avant soumission
  - Coût total affiché

### Phase 7: Refonte UI 3 Panneaux

**Référence doc:** [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) - Section 3

**Objectif:** Interface complète avec 3 panneaux.

```
┌─────────────┬─────────────────────────────┬─────────────────┐
│   GAUCHE    │          CENTRE             │     DROITE      │
│             │                             │                 │
│ Infos       │ Market Graph                │ Vote Totem      │
│ Fondateur   │ (FOR/AGAINST timeline)      │                 │
│             │                             │ 1. Prédicat     │
│ Tags        ├─────────────────────────────┤ 2. Totem        │
│ Description │ Totems existants            │ 3. Montant      │
│ Liens       │ (grille avec scores)        │                 │
│             ├─────────────────────────────┤ [Ajouter]       │
│ Vote Market │ Mes positions               │                 │
│ (dropdown)  │ (sur ce fondateur)          │                 │
└─────────────┴─────────────────────────────┴─────────────────┘
```

- [ ] **7.1** Créer `FounderInfoPanel.tsx` (gauche)
  - Photo + nom fondateur
  - Tags (Tech, Entrepreneur...)
  - Description complète
  - Liens sociaux (Twitter, GitHub, LinkedIn)
  - Vote Market (dropdown)

- [ ] **7.2** Créer `FounderCenterPanel.tsx` (centre)
  - Market Graph (timeline FOR/AGAINST)
  - Grille totems existants avec scores
  - Section "Mes positions"

- [ ] **7.3** Adapter panneau droit (Vote Totem)
  - Intégrer PresetButtons
  - Intégrer PositionModifier
  - Bouton "Ajouter au panier"

- [ ] **7.4** Intégrer le panier (haut droite)
  - Badge avec nombre de votes
  - Panel dépliable
  - Total + bouton valider

### Phase 8: Graphe de Visualisation (Nice to have)

**Référence doc:** [14_Architecture_Contrats.md](14_Architecture_Contrats.md)

- [ ] **8.1** Créer `useVoteGraph.ts`
  - Récupère triples et votes
  - Formate en nodes/edges

- [ ] **8.2** Créer `VoteGraph.tsx`
  - Librairie: react-force-graph ou vis.js
  - Nodes = atoms (fondateurs, prédicats, totems)
  - Edges = triples avec scores

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
- ✅ **Phase 1b** (partiel): Panier de Votes (base créée)

### Ordre d'implémentation

| Phase | Nom | Dépendances | Priorité |
|-------|-----|-------------|----------|
| **2** | Système 3 Triples | - | Haute (fondation) |
| **3** | Simplification Prédicats | Phase 2 | Haute |
| **4** | Panier + Prévisualisation | Phases 2-3 | Moyenne |
| **5** | Vote Market | - | Moyenne |
| **6** | Batch Triples | Phase 2 | Basse |
| **7** | Refonte UI 3 Panneaux | Phases 4-5 | Basse |
| **8** | Graphe de Visualisation | - | Nice to have |

**Prochaine phase à implémenter:** Phase 2 (Système 3 Triples)

---

## Historique des modifications

| Date | Changement |
|------|------------|
| 28 nov 2025 | Création initiale |
| 1 déc 2025 | Phase 1 complétée, ajout Phase 1b (Panier de Votes), documentation batch operations |
| 2 déc 2025 | Création [18_Design_Decisions_V2.md](18_Design_Decisions_V2.md) avec toutes les décisions de design |
| 2 déc 2025 | Renumérotation phases (2-9) dans l'ordre logique d'implémentation |
