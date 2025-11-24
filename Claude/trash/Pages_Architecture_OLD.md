# Architecture des Pages - INTUITION Founders Totem

**Date** : 21 novembre 2025
**Version** : 2.0 - Mise à jour avec l'état d'implémentation

Ce document décrit l'architecture complète de toutes les pages de l'application, avec wireframes ASCII et détails des composants.

---

## 🎯 État d'implémentation (21 nov 2025)

### ✅ Pages complètement implémentées avec GraphQL

| Page | Route | Status | Hook GraphQL | Build | Tests |
|------|-------|--------|--------------|-------|-------|
| **HomePage** | `/` | ✅ Implémentée | N/A (statique) | ✅ | ✅ |
| **ProposePage** | `/propose` | ✅ Implémentée | SDK INTUITION | ✅ | ✅ |
| **ResultsPage** | `/results` | ✅ GraphQL intégré | `useAllProposals` | ✅ | ✅ |
| **FounderDetailsPage** | `/results/:founderId` | ✅ GraphQL intégré | `useFounderProposals` | ✅ | ✅ |
| **TotemDetailsPage** | `/results/:founderId/:totemId` | ✅ GraphQL intégré | `useTotemDetails` | ✅ | ✅ |
| **MyVotesPage** | `/my-votes` | ✅ GraphQL intégré | `useUserVotesDetailed` | ✅ | N/A |
| **NotFoundPage** | `*` | ✅ Implémentée | N/A | ✅ | ✅ |

### ⏳ Pages avec placeholder

| Page | Route | Status | Priorité |
|------|-------|--------|----------|
| **VotePage** | `/vote` | ⏳ Placeholder | Haute |
| **FounderVotePage** | `/vote/:founderId` | ⏳ Placeholder | Moyenne |

### 📊 Résumé technique

**Intégration blockchain complète:**
- ✅ INTUITION L3 Testnet (Chain ID: 13579)
- ✅ Cross-chain NFT verification (Base Mainnet)
- ✅ GraphQL Apollo Client configuré
- ✅ Tous les hooks GraphQL opérationnels

**Hooks GraphQL créés:**
- `useAllProposals` - Tous les fondateurs avec leurs totems gagnants
- `useFounderProposals` - Propositions pour un fondateur spécifique
- `useTotemDetails` - Détails complets d'un totem avec claims
- `useUserVotesDetailed` - Historique des votes d'un utilisateur
- `useUserProposals` - Propositions créées par un utilisateur
- `useProposalLimit` - Vérification limite de propositions

**Tests:**
- ✅ 120/120 tests passent
- ✅ Build: 15.62s
- ✅ Dev server: http://localhost:5174/

**Prochaines étapes:**
1. Implémenter VotePage (vote FOR/AGAINST)
2. Implémenter FounderVotePage (interface de vote pour un fondateur)
3. Tests E2E avec Playwright
4. Optimisations (polling GraphQL, cache Apollo)

---

## Table des matières

1. [HomePage - Page d'accueil](#1-homepage---page-daccueil)
2. [ProposePage - Proposer un totem](#2-proposepage---proposer-un-totem)
3. [VotePage - Voter pour les totems](#3-votepage---voter-pour-les-totems)
4. [FounderDetailPage - Détails d'un fondateur](#4-founderdetailpage---détails-dun-fondateur)
5. [TotemDetailPage - Détails d'un totem](#5-totemdetailpage---détails-dun-totem)
6. [MyVotesPage - Mes votes](#6-myvotespage---mes-votes)
7. [ResultsPage - Résultats globaux](#7-resultspage---résultats-globaux)
8. [NotFoundPage - 404](#8-notfoundpage---404)

---

## 1. HomePage - Page d'accueil

### Objectif
Landing page qui présente le projet et affiche la grille des 42 fondateurs.

### Wireframe ASCII

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                      [Connect]   │ │
│ │ Overmind Founders Collection                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │               HERO SECTION                              │ │
│ │                                                          │ │
│ │        🎭 Overmind Founders Collection 🎭               │ │
│ │                                                          │ │
│ │   Vote for the totems that represent the 42 founders   │ │
│ │          of INTUITION using $TRUST tokens              │ │
│ │                                                          │ │
│ │         [View All Totems]  [How it works?]             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                   FOUNDERS GRID                         │ │
│ │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │ │
│ │ │ Photo  │ │ Photo  │ │ Photo  │ │ Photo  │           │ │
│ │ │        │ │        │ │        │ │        │  ...      │ │
│ │ │ Name   │ │ Name   │ │ Name   │ │ Name   │           │ │
│ │ │ Role   │ │ Role   │ │ Role   │ │ Role   │           │ │
│ │ │────────│ │────────│ │────────│ │────────│           │ │
│ │ │🦁 Lion │ │🥝 Kiwi │ │🦅 Eagle│ │❓ TBD  │           │ │
│ │ │150 TR  │ │80 TR   │ │60 TR   │ │0 TR    │           │ │
│ │ │────────│ │────────│ │────────│ │────────│           │ │
│ │ │[Vote]  │ │[Vote]  │ │[Vote]  │ │[Propose│           │ │
│ │ │[Propose│ │[Propose│ │[Propose│ │        │           │ │
│ │ └────────┘ └────────┘ └────────┘ └────────┘           │ │
│ │                                                          │ │
│ │           ... (42 cards in responsive grid)             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FOOTER                                                   │ │
│ │ Made with ❤️ by Overmind | Powered by INTUITION         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Composants

#### Header
- **Logo/Title** : "Overmind Founders Collection"
- **ConnectButton** : RainbowKit button (wallet connection)
- **Navigation** : Links vers "Vote", "My Votes", "Results"

#### Hero Section
- **Title** : Grand titre avec emojis
- **Subtitle** : Explication courte du projet
- **CTA Buttons** :
  - "View All Totems" → VotePage
  - "How it works?" → Ouvre modal explicative

#### Founders Grid
- **FounderCard** (x42) :
  - Photo du fondateur
  - Nom
  - Rôle/titre
  - **Winning Totem** (si existant) :
    - Emoji du totem
    - Nom du totem
    - Total TRUST NET
  - **Actions** :
    - Bouton "Vote" → VotePage avec filtre sur ce fondateur
    - Bouton "Propose" → ProposePage avec ce fondateur présélectionné

#### Footer
- **Credits** : Overmind
- **Links** : GitHub, INTUITION, Base

### Données affichées

```typescript
interface FounderCardData {
  founderId: Hex;
  name: string;
  role: string;
  image: string;
  winningTotem: {
    label: string;
    emoji: string;
    netScore: bigint;
  } | null;
}
```

### Hooks utilisés

- `useFounderTotems(founderId)` : Pour récupérer le totem gagnant
- `useAccount()` : Pour vérifier si wallet connecté

### État de chargement

```
┌────────┐
│ Photo  │
│ [...]  │  ← Skeleton loader
│ Name   │
│ [...]  │
└────────┘
```

---

## 2. ProposePage - Proposer un totem

### Objectif
Permet aux users de créer une nouvelle proposition (claim) pour un fondateur **déjà sélectionné depuis la HomePage**.

**Note importante** : Le fondateur est choisi sur la HomePage via le bouton "Propose" de la FounderCard. Cette page affiche donc directement le formulaire de proposition pour ce fondateur.

### Wireframe ASCII

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                      [Connect]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │         PROPOSE A TOTEM FOR                             │ │
│ │                                                          │ │
│ │  ┌────────┐                                             │ │
│ │  │        │  Joseph Lubin                               │ │
│ │  │ Photo  │  Co-founder of Ethereum                     │ │
│ │  │        │  Founder of ConsenSys                       │ │
│ │  └────────┘                                             │ │
│ │                                                          │ │
│ │  [← Back to founders]   [Change founder]               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │          PROPOSAL FORM                                  │ │
│ │                                                          │ │
│ │  ┌──────────────────────────────────────────────────┐   │ │
│ │  │ 1. Select or Create Predicate                   │   │ │
│ │  │                                                   │   │ │
│ │  │  [v] is represented by    ▼                      │   │ │
│ │  │      - is represented by                         │   │ │
│ │  │      - has totem                                 │   │ │
│ │  │      - is symbolized by                          │   │ │
│ │  │      - is associated with                        │   │ │
│ │  │      - embodies                                  │   │ │
│ │  │      - channels                                  │   │ │
│ │  │      - resonates with                            │   │ │
│ │  │      - Create new... [_____________]             │   │ │
│ │  └──────────────────────────────────────────────────┘   │ │
│ │                                                          │ │
│ │  ┌──────────────────────────────────────────────────┐   │ │
│ │  │ 2. Select or Create Totem (Object)              │   │ │
│ │  │                                                   │   │ │
│ │  │  Search: [Lion________________]  🔍              │   │ │
│ │  │                                                   │   │ │
│ │  │  Existing totems:                                │   │ │
│ │  │  ○ 🦁 Lion (150 TRUST, 5 claims)                │   │ │
│ │  │  ○ 🥝 Kiwi (80 TRUST, 2 claims)                 │   │ │
│ │  │  ○ 🦅 Eagle (60 TRUST, 3 claims)                │   │ │
│ │  │                                                   │   │ │
│ │  │  ● Create new: "Lion"                            │   │ │
│ │  │                                                   │   │ │
│ │  │  Category: [Animal ▼]                            │   │ │
│ │  │  Emoji (optional): [🦁]                          │   │ │
│ │  └──────────────────────────────────────────────────┘   │ │
│ │                                                          │ │
│ │  ┌──────────────────────────────────────────────────┐   │ │
│ │  │ 3. Initial TRUST Deposit                        │   │ │
│ │  │                                                   │   │ │
│ │  │  Amount: [10_____] TRUST                         │   │ │
│ │  │                                                   │   │ │
│ │  │  ℹ️ This TRUST will be deposited FOR this claim │   │ │
│ │  │  You can withdraw it later if needed            │   │ │
│ │  │                                                   │   │ │
│ │  │  Your balance: 1,234 TRUST                      │   │ │
│ │  └──────────────────────────────────────────────────┘   │ │
│ │                                                          │ │
│ │  ┌──────────────────────────────────────────────────┐   │ │
│ │  │ CLAIM PREVIEW                                    │   │ │
│ │  │                                                   │   │ │
│ │  │  Joseph Lubin + is represented by + 🦁 Lion     │   │ │
│ │  │                                                   │   │ │
│ │  │  Initial deposit: 10 TRUST FOR                  │   │ │
│ │  │  Est. gas: ~0.001 ETH                           │   │ │
│ │  └──────────────────────────────────────────────────┘   │ │
│ │                                                          │ │
│ │         [Cancel]              [Create Claim]            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FOOTER                                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Composants

#### Founder Header
- **Photo du fondateur** : Grande photo
- **Nom + Bio** : Nom, rôle, description courte
- **Navigation** :
  - Bouton "← Back to founders" : Retour à HomePage
  - Bouton "Change founder" : Permet de changer de fondateur (redirect vers HomePage ou ouvre sélecteur)

#### Proposal Form

**Étape 1 : Prédicat**
- **Dropdown** avec prédicats existants (query GraphQL)
- **Option "Create new"** : Input text pour nouveau prédicat
- Prédicats suggérés dans l'interface :
  - "is represented by" (par défaut)
  - "has totem" (par défaut)
  - "is symbolized by" (par défaut)
  - "is associated with" (par défaut)
  - "embodies" (exemple)
  - "channels" (exemple)
  - "resonates with" (exemple)
- **Note** : Les utilisateurs peuvent créer n'importe quel prédicat

**Étape 2 : Objet (Totem)**
- **Search bar** : Recherche dans les totems existants
- **Liste de totems existants** :
  - Affiche emoji + nom + stats (TRUST total, nombre de claims)
  - Radio button pour sélection
- **Option "Create new"** :
  - Input text : Nom du totem
  - Dropdown : Catégorie (Animal, Object, Trait, Universe, Superpower, Other)
  - Input text : Emoji (optionnel)

**Étape 3 : Dépôt initial**
- **Input number** : Montant TRUST à déposer
- **Affichage balance** : Balance actuelle du user
- **Info tooltip** : Explication sur le dépôt (récupérable, vote FOR)

**Claim Preview**
- Affiche la phrase complète : `[Sujet] + [Prédicat] + [Objet]`
- Montant déposé
- Estimation du gas

**Boutons d'action**
- **Cancel** : Ferme le modal/panel
- **Create Claim** : Déclenche la transaction

### Flow d'interaction

```
User sur HomePage
    ↓
Click bouton "Propose" sur FounderCard
    ↓
Redirect vers ProposePage avec founderId en param (/propose?founder=0x123...)
    ↓
ProposePage charge avec fondateur présélectionné
    ↓
User voit le Founder Header + Proposal Form
    ↓
Étape 1: Choisit/crée prédicat
    ↓
Étape 2: Choisit/crée totem
    ↓
Étape 3: Définit montant TRUST
    ↓
Preview du claim
    ↓
Click "Create Claim"
    ↓
Transaction blockchain (useIntuition.createClaim)
    ↓
Notification de succès/erreur
    ↓
Redirect vers FounderDetailPage
```

### Hooks utilisés

- `useParams()` ou `useSearchParams()` : Pour récupérer le founderId depuis l'URL
- `useFounderData(founderId)` : Données du fondateur (nom, photo, bio)
- `useIntuition()` : Pour `createClaim()`
- `useExistingPredicates()` : Query GraphQL des prédicats existants
- `useExistingTotems(founderId)` : Query GraphQL des totems pour ce fondateur
- `useBalance()` : Balance TRUST du user (wagmi)

### États

- `founderId` : Récupéré depuis les params URL
- `predicateMode` : 'select' | 'create'
- `predicateValue` : ID ou string du prédicat
- `totemMode` : 'select' | 'create'
- `totemValue` : ID ou string du totem
- `depositAmount` : Montant TRUST
- `isSubmitting` : Transaction en cours

### Route

**URL Pattern** : `/propose?founder=0x123abc...` ou `/propose/:founderId`

**Exemple** : `/propose?founder=0x123abc456def` → Ouvre le formulaire pour ce fondateur

---

## 3. VotePage - Voter pour les totems

### Objectif
Affiche tous les totems proposés avec possibilité de voter FOR ou AGAINST.

### Wireframe ASCII

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                      [Connect]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              VOTE FOR TOTEMS                            │ │
│ │                                                          │ │
│ │  Support or challenge totem claims with $TRUST         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FILTERS & SORTING                                       │ │
│ │                                                          │ │
│ │  Founder: [All ▼]  Category: [All ▼]  Sort: [NET ▼]   │ │
│ │                                                          │ │
│ │  Search: [______________________________] 🔍            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              TOTEMS LIST (Aggregated by Object)         │ │
│ │                                                          │ │
│ │  ┌───────────────────────────────────────────────────┐  │ │
│ │  │ #1  🦁 Lion for Joseph Lubin                     │  │ │
│ │  │                                                    │  │ │
│ │  │  150 TRUST FOR  |  25 TRUST AGAINST  |  125 NET  │  │ │
│ │  │  ████████████░░                                   │  │ │
│ │  │                                                    │  │ │
│ │  │  5 claims with 3 different predicates            │  │ │
│ │  │  Top predicate: "is represented by"              │  │ │
│ │  │                                                    │  │ │
│ │  │  [Vote FOR]  [Vote AGAINST]  [View Claims]       │  │ │
│ │  └───────────────────────────────────────────────────┘  │ │
│ │                                                          │ │
│ │  ┌───────────────────────────────────────────────────┐  │ │
│ │  │ #2  🥝 Kiwi for Joseph Lubin                     │  │ │
│ │  │                                                    │  │ │
│ │  │  80 TRUST FOR  |  10 TRUST AGAINST  |  70 NET    │  │ │
│ │  │  ████████░░░░░                                    │  │ │
│ │  │                                                    │  │ │
│ │  │  2 claims with 2 different predicates            │  │ │
│ │  │  Top predicate: "embodies"                       │  │ │
│ │  │                                                    │  │ │
│ │  │  [Vote FOR]  [Vote AGAINST]  [View Claims]       │  │ │
│ │  └───────────────────────────────────────────────────┘  │ │
│ │                                                          │ │
│ │  ... (all totems)                                       │ │
│ │                                                          │ │
│ │  [Load More]                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │        VOTE MODAL (when clicking Vote FOR/AGAINST)     │ │
│ │                                                          │ │
│ │  ┌──────────────────────────────────────────────────┐   │ │
│ │  │  Vote FOR: 🦁 Lion (Joseph Lubin)               │   │ │
│ │  │                                                   │   │ │
│ │  │  Select a specific claim to vote on:            │   │ │
│ │  │                                                   │   │ │
│ │  │  ○ "is represented by Lion"                      │   │ │
│ │  │     50 FOR | 5 AGAINST | 45 NET                 │   │ │
│ │  │                                                   │   │ │
│ │  │  ● "embodies Lion"                               │   │ │
│ │  │     30 FOR | 2 AGAINST | 28 NET                 │   │ │
│ │  │                                                   │   │ │
│ │  │  ○ "channels Lion"                               │   │ │
│ │  │     20 FOR | 0 AGAINST | 20 NET                 │   │ │
│ │  │                                                   │   │ │
│ │  │  Amount: [10_____] TRUST                         │   │ │
│ │  │                                                   │   │ │
│ │  │  Your balance: 1,234 TRUST                      │   │ │
│ │  │                                                   │   │ │
│ │  │  [Cancel]              [Confirm Vote]           │   │ │
│ │  └──────────────────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FOOTER                                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Composants

#### Filters Bar
- **Dropdown Founder** : Filtre par fondateur (ou "All")
- **Dropdown Category** : Filtre par catégorie de totem (Animal, Object, etc.)
- **Dropdown Sort** :
  - "NET Score (high to low)"
  - "NET Score (low to high)"
  - "Most claims"
  - "Most recent"
- **Search bar** : Recherche par nom de totem

#### TotemCard (Agrégé)
- **Rank** : Position dans le classement (#1, #2, etc.)
- **Emoji + Label** : Nom du totem
- **Founder** : Pour quel fondateur
- **Vote Stats** :
  - Total TRUST FOR
  - Total TRUST AGAINST
  - NET Score
  - Progress bar visuelle
- **Claim Stats** :
  - Nombre de claims
  - Nombre de prédicats différents
  - Prédicat le plus utilisé
- **Actions** :
  - Bouton "Vote FOR"
  - Bouton "Vote AGAINST"
  - Bouton "View Claims" (expandable ou redirect)

#### VoteModal
Affiché quand user clique sur "Vote FOR" ou "Vote AGAINST"

- **Titre** : "Vote FOR: [Totem]" ou "Vote AGAINST: [Totem]"
- **Liste des claims** :
  - Radio buttons pour sélectionner le claim spécifique
  - Affiche le prédicat et les stats de chaque claim
  - Si totem a plusieurs claims, user choisit lequel supporter/contester
- **Input Amount** : Montant TRUST à déposer
- **Balance display** : Balance actuelle
- **Confirm button** : Déclenche transaction

**Important** : Le user vote sur un **claim spécifique**, pas sur le totem agrégé. Mais l'interface groupe par totem pour faciliter la navigation.

### Flow d'interaction

```
User entre sur VotePage
    ↓
Voit liste des totems agrégés
    ↓
Applique filtres/tri (optionnel)
    ↓
Click "Vote FOR" sur un totem
    ↓
VoteModal s'ouvre
    ↓
Sélectionne claim spécifique (si plusieurs)
    ↓
Entre montant TRUST
    ↓
Click "Confirm Vote"
    ↓
Transaction (depositTriple via SDK)
    ↓
Notification succès/erreur
    ↓
Liste des totems se rafraîchit
```

### Hooks utilisés

- `useAllTotems()` : Query GraphQL + agrégation
- `useFounderTotems(founderId)` : Si filtre par fondateur
- `useDepositTriple()` : Pour voter (wrapper du SDK)
- `useAccount()` : Wallet connecté
- `useBalance()` : Balance TRUST

### États

- `filters` : { founder, category, search }
- `sortBy` : Mode de tri
- `selectedTotem` : Totem pour lequel on veut voter
- `voteMode` : 'for' | 'against'
- `selectedClaim` : Claim spécifique sélectionné
- `voteAmount` : Montant TRUST
- `isVoting` : Transaction en cours

---

## 4. FounderDetailPage - Détails d'un fondateur

### Objectif
Page dédiée à un fondateur avec tous ses totems proposés et le totem gagnant.

### Wireframe ASCII

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                      [Connect]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │           FOUNDER HEADER                                │ │
│ │                                                          │ │
│ │  ┌────────┐                                             │ │
│ │  │        │   Joseph Lubin                              │ │
│ │  │ Photo  │   Co-founder of Ethereum                    │ │
│ │  │        │   Founder of ConsenSys                      │ │
│ │  └────────┘                                             │ │
│ │                                                          │ │
│ │  🔗 Twitter  🔗 LinkedIn  🔗 Website                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  🏆 WINNING TOTEM                                       │ │
│ │                                                          │ │
│ │  ┌───────────────────────────────────────────────────┐  │ │
│ │  │                                                    │  │ │
│ │  │             🦁                                     │  │ │
│ │  │            Lion                                    │  │ │
│ │  │                                                    │  │ │
│ │  │      125 TRUST NET (150 FOR - 25 AGAINST)         │  │ │
│ │  │                                                    │  │ │
│ │  │      5 claims | 3 predicates                      │  │ │
│ │  │                                                    │  │ │
│ │  │      [Vote FOR]  [Vote AGAINST]  [Details]        │  │ │
│ │  └───────────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  ALL PROPOSED TOTEMS (15 totems)                       │ │
│ │                                                          │ │
│ │  Sort by: [NET Score ▼]                                 │ │
│ │                                                          │ │
│ │  ┌─────────────┬─────────────┬─────────────────────┐   │ │
│ │  │ Rank | Totem│ NET Score   │ Actions             │   │ │
│ │  ├─────────────┼─────────────┼─────────────────────┤   │ │
│ │  │ #1   🦁 Lion│ 125 TRUST   │ [Vote] [Details]    │   │ │
│ │  │      5 claim│ ████████░░  │                     │   │ │
│ │  ├─────────────┼─────────────┼─────────────────────┤   │ │
│ │  │ #2   🥝 Kiwi│ 70 TRUST    │ [Vote] [Details]    │   │ │
│ │  │      2 claim│ ████░░░░░░  │                     │   │ │
│ │  ├─────────────┼─────────────┼─────────────────────┤   │ │
│ │  │ #3   🦅Eagle│ 55 TRUST    │ [Vote] [Details]    │   │ │
│ │  │      3 claim│ ███░░░░░░░  │                     │   │ │
│ │  └─────────────┴─────────────┴─────────────────────┘   │ │
│ │                                                          │ │
│ │  ... (all totems for this founder)                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  STATISTICS                                             │ │
│ │                                                          │ │
│ │  Total Claims: 27          Total TRUST: 1,245           │ │
│ │  Unique Totems: 15         Avg per Totem: 83 TRUST      │ │
│ │  Top Category: Animal (8)  First Claim: 3 days ago      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  RECENT ACTIVITY                                        │ │
│ │                                                          │ │
│ │  • 0x1234 voted FOR "Lion" with 10 TRUST (2h ago)       │ │
│ │  • 0x5678 created claim "embodies Eagle" (5h ago)       │ │
│ │  • 0x9abc voted AGAINST "Kiwi" with 5 TRUST (1d ago)    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FOOTER                                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Composants

#### Founder Header
- **Photo** : Grande photo du fondateur
- **Name + Bio** : Nom, rôle, description
- **Social Links** : Twitter, LinkedIn, Website, etc.

#### Winning Totem Highlight
- **Grande card mise en avant** :
  - Emoji du totem en grand
  - Nom du totem
  - NET Score avec détail (FOR - AGAINST)
  - Stats (nombre de claims, prédicats)
  - Actions (Vote FOR, AGAINST, Details)

#### All Totems Table
- **Table triable** :
  - Colonnes : Rank, Totem (emoji + nom), NET Score, Actions
  - Progress bar pour visualiser le score
  - Nombre de claims par totem
  - Boutons Vote et Details

#### Statistics Panel
- **Chiffres clés** :
  - Total claims pour ce fondateur
  - Total TRUST déposé
  - Nombre de totems uniques
  - Moyenne TRUST par totem
  - Catégorie la plus populaire
  - Date du premier claim

#### Recent Activity Feed
- **Timeline des événements récents** :
  - Nouveaux claims
  - Votes FOR/AGAINST
  - Retraits
- Format : `[Address] [action] [détails] ([date])`

### Hooks utilisés

- `useFounderData(founderId)` : Données du fondateur
- `useFounderTotems(founderId)` : Tous les totems agrégés
- `useFounderStats(founderId)` : Statistiques
- `useFounderActivity(founderId)` : Activité récente

### Navigation

- **Breadcrumb** : Home > Founders > Joseph Lubin
- **Actions** :
  - Bouton "Propose new totem" → ProposePage avec ce fondateur
  - Bouton "View all founders" → HomePage

---

## 5. TotemDetailPage - Détails d'un totem

### Objectif
Page dédiée à un totem spécifique montrant tous les claims qui le composent.

### Wireframe ASCII

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                      [Connect]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │           TOTEM HEADER                                  │ │
│ │                                                          │ │
│ │               🦁                                         │ │
│ │              Lion                                        │ │
│ │                                                          │ │
│ │         for Joseph Lubin                                │ │
│ │                                                          │ │
│ │      125 TRUST NET (150 FOR - 25 AGAINST)               │ │
│ │      ████████████░░                                     │ │
│ │                                                          │ │
│ │      Rank: #1 out of 15 totems                          │ │
│ │      Category: Animal                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  ALL CLAIMS FOR THIS TOTEM (5 claims)                  │ │
│ │                                                          │ │
│ │  ┌───────────────────────────────────────────────────┐  │ │
│ │  │ Claim #1                                          │  │ │
│ │  │                                                    │  │ │
│ │  │ Joseph Lubin + is represented by + Lion           │  │ │
│ │  │                                                    │  │ │
│ │  │ 50 TRUST FOR  |  5 TRUST AGAINST  |  45 NET      │  │ │
│ │  │ ████████░░                                        │  │ │
│ │  │                                                    │  │ │
│ │  │ Created by: 0x1234...abcd  |  3 days ago         │  │ │
│ │  │ Voters: 15 FOR, 2 AGAINST                        │  │ │
│ │  │                                                    │  │ │
│ │  │ [Vote FOR]  [Vote AGAINST]  [View on Explorer]   │  │ │
│ │  └───────────────────────────────────────────────────┘  │ │
│ │                                                          │ │
│ │  ┌───────────────────────────────────────────────────┐  │ │
│ │  │ Claim #2                                          │  │ │
│ │  │                                                    │  │ │
│ │  │ Joseph Lubin + embodies + Lion                    │  │ │
│ │  │                                                    │  │ │
│ │  │ 30 TRUST FOR  |  2 TRUST AGAINST  |  28 NET      │  │ │
│ │  │ ████░░░░░░                                        │  │ │
│ │  │                                                    │  │ │
│ │  │ Created by: 0x5678...ef01  |  2 days ago         │  │ │
│ │  │ Voters: 8 FOR, 1 AGAINST                         │  │ │
│ │  │                                                    │  │ │
│ │  │ [Vote FOR]  [Vote AGAINST]  [View on Explorer]   │  │ │
│ │  └───────────────────────────────────────────────────┘  │ │
│ │                                                          │ │
│ │  ... (all 5 claims)                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  CLAIM COMPARISON                                       │ │
│ │                                                          │ │
│ │  Which claim best represents this totem?               │ │
│ │                                                          │ │
│ │  ┌────────────────────┬─────────┬───────────────────┐   │ │
│ │  │ Predicate          │ NET     │ Voters            │   │ │
│ │  ├────────────────────┼─────────┼───────────────────┤   │ │
│ │  │ is represented by  │ 45 TR   │ 15 FOR, 2 AGAINST │   │ │
│ │  │ embodies           │ 28 TR   │ 8 FOR, 1 AGAINST  │   │ │
│ │  │ channels           │ 20 TR   │ 5 FOR, 0 AGAINST  │   │ │
│ │  │ resonates with     │ 18 TR   │ 6 FOR, 2 AGAINST  │   │ │
│ │  │ has totem          │ 14 TR   │ 4 FOR, 1 AGAINST  │   │ │
│ │  └────────────────────┴─────────┴───────────────────┘   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  VOTERS LEADERBOARD                                     │ │
│ │                                                          │ │
│ │  Top contributors to this totem:                        │ │
│ │                                                          │ │
│ │  1. 0x1234...abcd  -  50 TRUST FOR                      │ │
│ │  2. 0x5678...ef01  -  30 TRUST FOR                      │ │
│ │  3. 0x9abc...1234  -  20 TRUST FOR                      │ │
│ │  4. 0xdef0...5678  -  10 TRUST AGAINST                  │ │
│ │  5. 0x4567...89ab  -  10 TRUST FOR                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FOOTER                                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Composants

#### Totem Header
- **Emoji en grand** : Représentation visuelle
- **Nom du totem** : Label
- **Founder** : Pour qui ce totem
- **Aggregate Stats** :
  - NET Score total avec détail
  - Progress bar
  - Rang global
  - Catégorie

#### Claims List
Pour chaque claim :
- **Claim Statement** : `[Sujet] + [Prédicat] + [Objet]`
- **Vote Stats** : FOR, AGAINST, NET avec progress bar
- **Creator** : Adresse du créateur + date
- **Voter Count** : Nombre de voters FOR et AGAINST
- **Actions** :
  - Vote FOR
  - Vote AGAINST
  - View on Explorer (lien vers Basescan avec tripleId)

#### Claim Comparison Table
- **Table comparative** des prédicats :
  - Colonne Predicate
  - Colonne NET Score
  - Colonne Nombre de voters
- Permet de voir quel prédicat a le plus de support

#### Voters Leaderboard
- **Top 10 contributors** :
  - Adresse (tronquée)
  - Montant TRUST déposé
  - Direction (FOR ou AGAINST)

### Hooks utilisés

- `useTotemDetails(founderId, objectId)` : Tous les claims pour ce totem
- `useTotemVoters(objectId)` : Liste des voters
- `useTotemStats(objectId)` : Stats agrégées

### Navigation

- **Breadcrumb** : Home > Founders > Joseph Lubin > Lion
- **Actions** :
  - Bouton "Back to founder" → FounderDetailPage
  - Bouton "Vote on this totem" → Ouvre VoteModal

---

## 6. MyVotesPage - Mes votes

### Objectif
Affiche l'historique des votes et propositions du user connecté.

### Wireframe ASCII

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                      [Connect]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              MY VOTES & CLAIMS                          │ │
│ │                                                          │ │
│ │  Track your contributions and manage your TRUST         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  OVERVIEW                                               │ │
│ │                                                          │ │
│ │  Total TRUST Deposited: 1,234                           │ │
│ │  Active Votes: 15  |  Claims Created: 3                 │ │
│ │  Founders Voted: 8                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  TABS                                                   │ │
│ │  [Active Votes] [Withdrawn] [My Claims] [All History]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  ACTIVE VOTES (15)                                      │ │
│ │                                                          │ │
│ │  ┌───────────────────────────────────────────────────┐  │ │
│ │  │ Joseph Lubin → 🦁 Lion                            │  │ │
│ │  │ "is represented by"                               │  │ │
│ │  │                                                    │  │ │
│ │  │ Your vote: 10 TRUST FOR                           │  │ │
│ │  │ Current status: 50 FOR | 5 AGAINST | 45 NET      │  │ │
│ │  │ Voted: 2 days ago                                 │  │ │
│ │  │                                                    │  │ │
│ │  │ Withdrawable: 10 TRUST                            │  │ │
│ │  │                                                    │  │ │
│ │  │ [Withdraw]  [Add More]  [View Claim]              │  │ │
│ │  └───────────────────────────────────────────────────┘  │ │
│ │                                                          │ │
│ │  ┌───────────────────────────────────────────────────┐  │ │
│ │  │ Joseph Lubin → 🥝 Kiwi                            │  │ │
│ │  │ "embodies"                                        │  │ │
│ │  │                                                    │  │ │
│ │  │ Your vote: 5 TRUST AGAINST                        │  │ │
│ │  │ Current status: 80 FOR | 15 AGAINST | 65 NET     │  │ │
│ │  │ Voted: 1 day ago                                  │  │ │
│ │  │                                                    │  │ │
│ │  │ Withdrawable: 5 TRUST                             │  │ │
│ │  │                                                    │  │ │
│ │  │ [Withdraw]  [Add More]  [View Claim]              │  │ │
│ │  └───────────────────────────────────────────────────┘  │ │
│ │                                                          │ │
│ │  ... (all active votes)                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  MY CLAIMS (3)                                          │ │
│ │                                                          │ │
│ │  ┌───────────────────────────────────────────────────┐  │ │
│ │  │ 💡 Joseph Lubin embodies Eagle                    │  │ │
│ │  │                                                    │  │ │
│ │  │ Created: 3 days ago                               │  │ │
│ │  │ Status: 35 FOR | 5 AGAINST | 30 NET              │  │ │
│ │  │ Rank: #3 for Joseph Lubin                         │  │ │
│ │  │                                                    │  │ │
│ │  │ Your initial deposit: 10 TRUST (still active)    │  │ │
│ │  │                                                    │  │ │
│ │  │ Creator rewards earned: 0.5 TRUST (protocol fees)│  │ │
│ │  │                                                    │  │ │
│ │  │ [View Claim]  [Share]                             │  │ │
│ │  └───────────────────────────────────────────────────┘  │ │
│ │                                                          │ │
│ │  ... (all claims created)                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  QUICK ACTIONS                                          │ │
│ │                                                          │ │
│ │  [Withdraw All]  [Create New Claim]  [Export Data]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FOOTER                                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Composants

#### Overview Stats
- **Totaux** :
  - TRUST total déposé
  - Nombre de votes actifs
  - Nombre de claims créés
  - Nombre de fondateurs votés

#### Tabs Navigation
- **Active Votes** : Votes avec TRUST encore déposé
- **Withdrawn** : Votes retirés (historique)
- **My Claims** : Claims créés par le user
- **All History** : Timeline complète

#### Vote Card (Active)
- **Claim info** : Fondateur, totem, prédicat
- **Your vote** : Montant et direction (FOR/AGAINST)
- **Current status** : Stats actuelles du claim
- **Date** : Quand le vote a été fait
- **Withdrawable amount** : TRUST récupérable
- **Actions** :
  - Withdraw : Retirer le TRUST
  - Add More : Ajouter du TRUST
  - View Claim : Voir détails du claim

#### Claim Card (Created)
- **Claim statement** : Full claim
- **Creation date** : Quand créé
- **Current status** : Stats actuelles
- **Rank** : Position pour ce fondateur
- **Initial deposit** : Montant déposé à la création (+ état)
- **Creator rewards** : Frais de créateur accumulés (5% des dépôts)
- **Actions** :
  - View Claim : Voir détails
  - Share : Partager le claim (lien)

#### Quick Actions Bar
- **Withdraw All** : Retirer tout le TRUST d'un coup
- **Create New Claim** : Redirect vers ProposePage
- **Export Data** : Télécharger CSV de l'historique

### Hooks utilisés

- `useUserVotes(address)` : Tous les votes du user
- `useUserClaims(address)` : Claims créés par le user
- `useWithdrawable(address)` : Montant total withdrawable
- `useUserStats(address)` : Stats globales

### États

- `activeTab` : Tab sélectionné
- `isWithdrawing` : Transaction de retrait en cours
- `selectedVote` : Vote sélectionné pour action

---

## 7. ResultsPage - Résultats globaux

### Objectif
Vue d'ensemble des résultats pour tous les fondateurs avec podium et stats.

### Wireframe ASCII

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

### Composants

#### Global Statistics Panel
- **Totaux globaux** :
  - Total de claims créés
  - Total TRUST déposé
  - Nombre de totems uniques
  - Nombre de voters actifs
  - Progression (fondateurs avec totem / 42)

#### Top Totems Section
- **Totems les plus populaires** :
  - Totem utilisé par plusieurs fondateurs
  - Compte le nombre de fondateurs par totem
  - Affichage visuel avec emojis

#### Filters Bar
- **Dropdown Category** : Filtre par catégorie
- **Dropdown Sort** :
  - "Most TRUST"
  - "Most claims"
  - "Most votes"
  - "Alphabetical"
- **View Mode** : Grid ou List

#### Founders Results Grid
Similar à HomePage mais :
- **Focus sur le totem gagnant** :
  - Badge "🏆" pour le winner
  - Emoji + nom du totem
  - NET Score
- **Stats supplémentaires** :
  - Nombre de claims pour ce fondateur
  - Nombre total de votes
- **Action** :
  - Bouton "Details" → FounderDetailPage

#### Category Breakdown
- **Pie chart ou bar chart** (ASCII ou canvas) :
  - Distribution des catégories
  - Comptage par catégorie

#### Export Options
- **Export JSON** : Format structuré pour devs
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

### Hooks utilisés

- `useAllFoundersResults()` : Résultats pour tous les fondateurs
- `useGlobalStats()` : Statistiques globales
- `useTopTotems()` : Totems les plus populaires
- `useCategoryBreakdown()` : Distribution par catégorie

### États

- `categoryFilter` : Catégorie sélectionnée
- `sortBy` : Mode de tri
- `viewMode` : 'grid' | 'list'

---

## 8. NotFoundPage - 404

### Objectif
Page d'erreur 404 stylisée et utile.

### Wireframe ASCII

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                      [Connect]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                                                             │
│                                                             │
│                     404                                     │
│                                                             │
│               🔍 Page Not Found 🔍                          │
│                                                             │
│   Looks like this totem doesn't exist... yet!             │
│                                                             │
│                                                             │
│              ┌──────────────────────┐                       │
│              │ [Back to Home]       │                       │
│              └──────────────────────┘                       │
│                                                             │
│              ┌──────────────────────┐                       │
│              │ [View All Totems]    │                       │
│              └──────────────────────┘                       │
│                                                             │
│              ┌──────────────────────┐                       │
│              │ [Propose a Totem]    │                       │
│              └──────────────────────┘                       │
│                                                             │
│                                                             │
│   Or search for a founder:                                 │
│   [_________________________________] 🔍                     │
│                                                             │
│                                                             │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FOOTER                                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Composants

#### Error Display
- **404 en grand** : Typography large
- **Emoji** : 🔍 ou 🎭 ou autre thématique
- **Message** : Message sympathique et thématique

#### Quick Actions
- **Boutons CTA** :
  - Back to Home → HomePage
  - View All Totems → VotePage
  - Propose a Totem → ProposePage

#### Search Bar
- **Search founders** : Input pour chercher un fondateur
- Auto-suggestion si possible
- Redirect vers FounderDetailPage si trouvé

### Hooks utilisés

- `useNavigate()` : React Router navigation
- `useFoundersSearch()` : Recherche dans les fondateurs

---

## Patterns communs à toutes les pages

### Layout Structure

```
┌────────────────────────────────┐
│ Header (sticky)                │
├────────────────────────────────┤
│                                │
│ Main Content                   │
│ (page-specific)                │
│                                │
├────────────────────────────────┤
│ Footer                         │
└────────────────────────────────┘
```

### Responsive Breakpoints

- **Mobile** : < 640px (1 colonne)
- **Tablet** : 640px - 1024px (2-3 colonnes)
- **Desktop** : > 1024px (4-6 colonnes)

### Loading States

Tous les composants qui fetchen des données ont des skeleton loaders :

```
┌────────┐
│▒▒▒▒▒▒▒▒│  ← Skeleton placeholder
│▒▒▒▒▒▒  │
│▒▒▒▒▒▒▒▒│
└────────┘
```

### Error States

Affichage d'erreurs avec retry :

```
┌──────────────────────────┐
│ ⚠️ Error loading data    │
│                          │
│ [Retry]                  │
└──────────────────────────┘
```

### Empty States

Quand pas de données :

```
┌──────────────────────────┐
│ 📭 No votes yet          │
│                          │
│ Be the first to vote!   │
│                          │
│ [Vote Now]               │
└──────────────────────────┘
```

### Modals/Dialogs

Structure standard :

```
┌───────────────────────────────┐
│ ┌───────────────────────────┐ │
│ │ Modal Title          [X]  │ │
│ ├───────────────────────────┤ │
│ │                           │ │
│ │ Modal Content             │ │
│ │                           │ │
│ ├───────────────────────────┤ │
│ │ [Cancel]     [Confirm]    │ │
│ └───────────────────────────┘ │
└───────────────────────────────┘
```

### Notifications/Toasts

```
┌─────────────────────────────┐
│ ✅ Vote successful!         │
│ Transaction: 0x1234...abcd  │
└─────────────────────────────┘
```

---

## Navigation Flow

```
HomePage (/)
  ├─> ProposePage (/propose)
  │     └─> [Create Claim] → FounderDetailPage
  │
  ├─> VotePage (/vote)
  │     ├─> [Vote FOR/AGAINST] → VoteModal
  │     └─> [View Claims] → TotemDetailPage
  │
  ├─> FounderDetailPage (/founder/:id)
  │     ├─> [Propose] → ProposePage
  │     ├─> [Vote] → VoteModal
  │     └─> [Details] → TotemDetailPage
  │
  ├─> ResultsPage (/results)
  │     └─> [Details] → FounderDetailPage
  │
  ├─> MyVotesPage (/my-votes)
  │     ├─> [Withdraw] → Transaction
  │     ├─> [Add More] → VoteModal
  │     └─> [View Claim] → TotemDetailPage
  │
  └─> TotemDetailPage (/founder/:id/totem/:objectId)
        ├─> [Vote FOR/AGAINST] → VoteModal
        └─> [Back to founder] → FounderDetailPage
```

---

## Conclusion

Cette architecture couvre toutes les pages de l'application avec :
- ✅ Wireframes ASCII pour visualisation
- ✅ Liste complète des composants
- ✅ Flows d'interaction détaillés
- ✅ Hooks et états nécessaires
- ✅ Patterns réutilisables

**Next steps** :
1. Implémenter les composants de base (Header, Footer, Layout)
2. Créer les pages une par une selon cet ordre de priorité :
   - HomePage (landing + grid fondateurs)
   - ProposePage (créer claims)
   - VotePage (voter sur totems)
   - FounderDetailPage (détails fondateur)
   - MyVotesPage (historique user)
   - ResultsPage (résultats globaux)
   - TotemDetailPage (détails totem)
   - NotFoundPage (404)
