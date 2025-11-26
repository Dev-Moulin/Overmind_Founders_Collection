# Refonte UX/UI Complète + Migration Mainnet

> **Date** : 26 novembre 2025
> **Objectif** : Refonte complète de l'interface + migration mainnet
> **Référence** : Portal Intuition triple page

---

## 📋 Table des Matières

1. [Analyse Portal Intuition Triple Page](#1-analyse-portal-intuition-triple-page)
2. [Problèmes Actuels Identifiés](#2-problèmes-actuels-identifiés)
3. [Architecture Proposée](#3-architecture-proposée)
4. [Améliorations UX/UI](#4-améliorations-uxui)
5. [Nouvelles Features à Implémenter](#5-nouvelles-features-à-implémenter)
6. [Migration Mainnet](#6-migration-mainnet)
7. [Plan d'Implémentation](#7-plan-dimplémentation)

---

## 1. Analyse Portal Intuition Triple Page

### Référence
**URL** : `https://www.portal.intuition.systems/explore/triple/0xa1739235f5a8362b15268eab46484abdd7660a1e2a6a5d7deacbed9d4c055e68?tab=positions`

### Structure observée

```
┌────────────────────────────────────────────────────────────┐
│                    Header / Navigation                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │   Graphique de Prix (Price Chart)                     │ │
│  │   38.05 TRUST (+778.2%)                               │ │
│  │   [24H][1W][1M][1Y][ALL]                              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │   Your Position (Collapsible)                         │ │
│  │   Current Value, P&L, Shares, Ownership               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │   Claims du Sujet                                     │ │
│  │   Liste des claims liés au sujet                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │   TRUST Market                                        │ │
│  │   Total Market Cap, Position Count                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │   Atom URIs                                           │ │
│  │   • Subject: 0x... [Copy]                             │ │
│  │   • Predicate: 0x... [Copy]                           │ │
│  │   • Object: 0x... [Copy]                              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │   Créateur du Claim                                   │ │
│  │   Adresse wallet du créateur                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Problèmes Actuels Identifiés

### 2.1. Problèmes de Conteneurs et Taille

| Problème | Description | Impact |
|----------|-------------|--------|
| **Conteneurs trop petits** | Les conteneurs actuels occupent trop peu d'espace | UX cramped, difficile à lire |
| **Double scroll bars** | Scroll bars dans le conteneur "Totems existants / Nouveau" | Navigation confuse |
| **Scroll bars dans conteneur central** | Le conteneur central a des scroll bars | Devrait afficher tout sans scroll |

### 2.2. Problèmes d'Information Manquante

| Élément | Problème | Solution proposée |
|---------|----------|-------------------|
| **Biographie** | Biographie fondateur tronquée | Afficher biographie complète |
| **Liens sociaux** | X, LinkedIn, GitHub non affichés | Ajouter section "Social Links" |
| **"Propositions: 0"** | Texte peu clair dans conteneur gauche | À clarifier ou retirer |

### 2.3. Problèmes de Navigation et UX

| Problème | Description | Solution |
|----------|-------------|----------|
| **Navbar Totems pas fixe** | Les boutons "Existant / Nouveau" scrollent | Fixer en haut du conteneur (sticky) |
| **Barre recherche scroll** | La barre "Rechercher tous les totems" scroll | Fixer en haut (sticky) |
| **Erreurs dans conteneur** | Erreurs affichées dans le conteneur central | Popup toast en bas à gauche |
| **Bouton "Voter sur ce claim"** | Bouton séparé quand claim existe | Transformer le bouton "Créer" |

### 2.4. Problèmes de Présentation

| Élément | Problème | Solution |
|---------|----------|---------|
| **Totems = Atoms** | Totems affichés comme du texte simple | Entourer dans des conteneurs comme `has_tag` Intuition |
| **Tags visuels** | Pas de différenciation visuelle | Utiliser badges/pills colorés |

---

## 3. Architecture Proposée

### 3.1. Layout 3 Colonnes

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         Header / Navigation                                 │
├───────────────┬────────────────────────────────────────┬───────────────────┤
│               │                                         │                   │
│   LEFT        │            CENTER                       │      RIGHT        │
│   PANEL       │            PANEL                        │      PANEL        │
│   (25%)       │            (50%)                        │      (25%)        │
│               │                                         │                   │
│ ┌───────────┐ │ ┌────────────────────────────────────┐ │ ┌───────────────┐│
│ │ Founder   │ │ │ [GRAPHIQUE PRIX]                   │ │ │ Your Position ││
│ │ Card      │ │ │                                     │ │ │               ││
│ │           │ │ └────────────────────────────────────┘ │ │ Metrics       ││
│ │ Photo     │ │                                         │ │ P&L, Shares   ││
│ │ Nom       │ │ ┌────────────────────────────────────┐ │ │               ││
│ │ Bio       │ │ │ [CRÉER UN VOTE TOTEM]              │ │ └───────────────┘│
│ │ complète  │ │ │                                     │ │                   │
│ │           │ │ │ Navbar: [Existant][Nouveau] (FIXED)│ │ ┌───────────────┐│
│ │ Links:    │ │ │                                     │ │ │ Claims Sujet  ││
│ │ • X       │ │ │ [Recherche totems] (FIXED)         │ │ │               ││
│ │ • LinkedIn│ │ │                                     │ │ │ Liste claims  ││
│ │ • GitHub  │ │ │ ┌────────────────────────────────┐ │ │ │ du sujet      ││
│ │           │ │ │ │ Liste totems (SCROLL)          │ │ │               ││
│ │ Stats:    │ │ │ │                                 │ │ └───────────────┘│
│ │ • Props   │ │ │ │ [Totem 1] [Totem 2]            │ │                   │
│ │ • Score   │ │ │ │                                 │ │ ┌───────────────┐│
│ │           │ │ │ └────────────────────────────────┘ │ │ │ TRUST Market  ││
│ └───────────┘ │ │                                     │ │ │               ││
│               │ │ [Prédicat sélectionné]             │ │ │ Market Cap    ││
│               │ │ [Totem sélectionné]                │ │ │ Position Cnt  ││
│               │ │ [Montant]                          │ │ │               ││
│               │ │                                     │ │ └───────────────┘│
│               │ │ [CRÉER LE VOTE] ou                 │ │                   │
│               │ │ [! VOTER SUR CE CLAIM] (dynamique) │ │ ┌───────────────┐│
│               │ │                                     │ │ │ Atom URIs     ││
│               │ └────────────────────────────────────┘ │ │ • Subject     ││
│               │                                         │ │ • Predicate   ││
│               │                                         │ │ • Object      ││
│               │                                         │ │               ││
│               │                                         │ │ [Créateur]    ││
│               │                                         │ │               ││
│               │                                         │ └───────────────┘│
│               │                                         │                   │
└───────────────┴─────────────────────────────────────────┴──────────────────┘
```

### 3.2. Responsive Mobile

En mobile, layout vertical :
```
┌────────────────────────┐
│ Header                 │
├────────────────────────┤
│ [GRAPHIQUE PRIX]       │
├────────────────────────┤
│ Founder Card           │
├────────────────────────┤
│ [CRÉER VOTE]           │
├────────────────────────┤
│ Your Position          │
├────────────────────────┤
│ Claims Sujet           │
├────────────────────────┤
│ TRUST Market           │
├────────────────────────┤
│ Atom URIs              │
└────────────────────────┘
```

---

## 4. Améliorations UX/UI

### 4.1. Conteneur Gauche (Founder Info)

**Agrandir et enrichir** :

```tsx
<div className="w-1/4 p-6 space-y-6">
  {/* Photo + Nom */}
  <div className="text-center">
    <img
      src={founder.photo}
      alt={founder.name}
      className="w-32 h-32 rounded-full mx-auto mb-4"
    />
    <h2 className="text-2xl font-bold text-white">{founder.name}</h2>
  </div>

  {/* Biographie COMPLÈTE */}
  <div>
    <h3 className="text-sm font-medium text-white/60 mb-2">À propos</h3>
    <p className="text-white/80 text-sm leading-relaxed">
      {founder.bio} {/* BIOGRAPHIE COMPLÈTE, PAS TRONQUÉE */}
    </p>
  </div>

  {/* Liens sociaux */}
  <div>
    <h3 className="text-sm font-medium text-white/60 mb-2">Liens</h3>
    <div className="space-y-2">
      {founder.twitter && (
        <a
          href={founder.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <TwitterIcon className="w-4 h-4" />
          <span className="text-sm">X (Twitter)</span>
        </a>
      )}
      {founder.linkedin && (
        <a
          href={founder.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <LinkedInIcon className="w-4 h-4" />
          <span className="text-sm">LinkedIn</span>
        </a>
      )}
      {founder.github && (
        <a
          href={founder.github}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <GitHubIcon className="w-4 h-4" />
          <span className="text-sm">GitHub</span>
        </a>
      )}
    </div>
  </div>

  {/* Stats */}
  <div>
    <h3 className="text-sm font-medium text-white/60 mb-2">Statistiques</h3>
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-white/60">Propositions</span>
        <span className="text-white font-medium">{founder.proposalCount}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-white/60">Score total</span>
        <span className="text-white font-medium">{founder.totalScore}</span>
      </div>
    </div>
  </div>
</div>
```

**À clarifier** : "Propositions: 0" → Vérifier si c'est `proposalCount` ou autre métrique.

### 4.2. Conteneur Central (Vote Panel)

**Fixes importants** :

#### A. Navbar Sticky

```tsx
<div className="relative">
  {/* Navbar FIXED (ne scroll pas) */}
  <div className="sticky top-0 z-10 bg-gray-900 border-b border-white/10">
    <div className="flex">
      <button
        onClick={() => setTotemMode('existing')}
        className={`flex-1 py-3 ${
          totemMode === 'existing'
            ? 'border-b-2 border-purple-500 text-white'
            : 'text-white/60'
        }`}
      >
        Totems existants
      </button>
      <button
        onClick={() => setTotemMode('new')}
        className={`flex-1 py-3 ${
          totemMode === 'new'
            ? 'border-b-2 border-purple-500 text-white'
            : 'text-white/60'
        }`}
      >
        Créer un nouveau
      </button>
    </div>
  </div>

  {/* Barre de recherche FIXED (ne scroll pas) */}
  {totemMode === 'existing' && (
    <div className="sticky top-[49px] z-10 bg-gray-900 p-4 border-b border-white/10">
      <input
        type="text"
        placeholder="Rechercher tous les totems..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
      />
    </div>
  )}

  {/* Liste totems (SCROLLABLE) */}
  <div className="max-h-[400px] overflow-y-auto p-4">
    {/* Totems ici */}
  </div>
</div>
```

#### B. Totems comme Tags (style Intuition)

```tsx
// Au lieu de simples textes, utiliser des badges
<button
  onClick={() => selectTotem(totem)}
  className={`
    inline-flex items-center gap-2 px-3 py-2 rounded-full
    border-2 transition-all
    ${
      selectedTotem?.id === totem.id
        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
        : 'bg-white/5 border-white/20 text-white/80 hover:border-white/40'
    }
  `}
>
  <span className="text-sm font-medium">{totem.label}</span>
  {totem.category && (
    <span className="text-xs text-white/60">#{totem.category}</span>
  )}
</button>
```

#### C. Bouton Dynamique (Créer vs Voter)

```tsx
// Au lieu de deux boutons, un seul qui change
<button
  onClick={proactiveClaimInfo ? handleVoteExisting : handleCreateClaim}
  disabled={!canSubmit}
  className={`
    w-full py-4 rounded-lg font-bold text-lg transition-all
    ${
      proactiveClaimInfo
        ? 'bg-amber-600 hover:bg-amber-500'  // Vote sur existant
        : 'bg-purple-600 hover:bg-purple-500'  // Créer nouveau
    }
  `}
>
  {proactiveClaimInfo ? (
    <span className="flex items-center justify-center gap-2">
      <span>⚠</span>
      <span>Voter sur ce claim existant</span>
    </span>
  ) : (
    'Créer le vote'
  )}
</button>

{/* Message d'info si claim existe */}
{proactiveClaimInfo && (
  <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
    <p className="text-amber-400 text-sm text-center">
      ! Ce claim existe déjà
    </p>
  </div>
)}
```

#### D. Gestion des Erreurs (Toast Popup)

```tsx
// Utiliser Sonner (déjà installé) pour les toasts
import { toast } from 'sonner';

// Au lieu d'afficher dans le conteneur
if (error) {
  toast.error(error.message, {
    position: 'bottom-left',  // En bas à gauche
    duration: 5000,
  });
}

// Success aussi
if (success) {
  toast.success('Vote créé avec succès !', {
    position: 'bottom-left',
  });
}
```

#### E. Retirer les Scroll Bars du Conteneur Central

```css
/* Le conteneur central ne devrait PAS scroll */
.center-panel {
  overflow: visible; /* Pas de scroll */
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Seulement la liste des totems scroll */
.totems-list {
  max-height: 400px;
  overflow-y: auto;
}
```

### 4.3. Conteneur Droit (Info Triple)

**Nouvelles sections** :

```tsx
<div className="w-1/4 p-6 space-y-6">
  {/* Your Position (collapsible) */}
  <UserPositionCard termId={termId} walletAddress={address} />

  {/* Claims du Sujet */}
  <div className="bg-white/5 rounded-xl p-4">
    <h3 className="text-lg font-medium mb-3">Claims du Sujet</h3>
    <div className="space-y-2">
      {subjectClaims.map((claim) => (
        <a
          key={claim.id}
          href={`/explore/triple/${claim.id}`}
          className="block p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <p className="text-sm text-white/80 truncate">
            {claim.predicate} {claim.object}
          </p>
        </a>
      ))}
    </div>
  </div>

  {/* TRUST Market */}
  <TrustMarketCard termId={termId} />

  {/* Atom URIs */}
  <div className="bg-white/5 rounded-xl p-4 space-y-2">
    <h3 className="text-lg font-medium mb-3">Atom URIs</h3>
    <AtomURICard atomId={triple.subject.id} label="Subject" />
    <AtomURICard atomId={triple.predicate.id} label="Predicate" />
    <AtomURICard atomId={triple.object.id} label="Object" />
  </div>

  {/* Créateur du Claim */}
  <div className="bg-white/5 rounded-xl p-4">
    <h3 className="text-sm font-medium text-white/60 mb-2">Créateur</h3>
    <a
      href={`https://etherscan.io/address/${triple.creator}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-400 hover:text-purple-300 font-mono text-sm"
    >
      {triple.creator.slice(0, 6)}...{triple.creator.slice(-4)}
    </a>
  </div>
</div>
```

---

## 5. Nouvelles Features à Implémenter

### 5.1. Graphique de Prix (Priority: HIGH)

**Composant** : `PriceChart.tsx`

**Library** : Recharts (déjà disponible)

**Query GraphQL** :
```graphql
query GET_VAULT_PRICE_HISTORY($termId: String!, $startTimestamp: Int!) {
  vault_snapshots(
    where: {
      vault_term: { id: { _eq: $termId } }
      block_timestamp: { _gte: $startTimestamp }
    }
    order_by: { block_timestamp: asc }
  ) {
    block_timestamp
    current_share_price
  }
}
```

### 5.2. Claims du Sujet (Priority: MEDIUM)

**Query GraphQL** :
```graphql
query GET_SUBJECT_CLAIMS($subjectId: String!) {
  triples(
    where: {
      subject: { id: { _eq: $subjectId } }
    }
    order_by: { created_at: desc }
    limit: 10
  ) {
    term_id
    predicate { label }
    object { label }
    triple_vault {
      total_assets
    }
  }
}
```

### 5.3. Liens Sociaux Fondateurs (Priority: HIGH)

**Data structure** :
```typescript
interface Founder {
  // ... existing fields
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
}
```

**À ajouter dans** : `packages/shared/src/data/founders.json`

### 5.4. Créateur du Claim (Priority: LOW)

**Query GraphQL** :
```graphql
query GET_TRIPLE_CREATOR($termId: String!) {
  triples(where: { term_id: { _eq: $termId } }) {
    creator_id
    created_at
  }
}
```

---

## 6. Migration Mainnet

### 6.1. Checklist Pré-Migration

- [ ] Lire documentation officielle INTUITION mainnet
- [ ] Obtenir endpoints GraphQL mainnet (HTTP + WebSocket)
- [ ] Vérifier Chain ID mainnet
- [ ] Vérifier adresses des contrats mainnet (MultiVault, etc.)
- [ ] Tester connexion RPC mainnet
- [ ] Vérifier les frais gas réels mainnet

### 6.2. Configuration Environnement

**Créer** `.env.local` (testnet) :
```bash
VITE_NETWORK=testnet
VITE_CHAIN_ID=... # À obtenir
VITE_GRAPHQL_HTTP=https://testnet.intuition.sh/v1/graphql
VITE_GRAPHQL_WS=wss://testnet.intuition.sh/v1/graphql
VITE_RPC_URL=... # RPC testnet
```

**Créer** `.env.production` (mainnet) :
```bash
VITE_NETWORK=mainnet
VITE_CHAIN_ID=... # À obtenir
VITE_GRAPHQL_HTTP=https://mainnet.intuition.sh/v1/graphql # À vérifier
VITE_GRAPHQL_WS=wss://mainnet.intuition.sh/v1/graphql # À vérifier
VITE_RPC_URL=... # RPC mainnet
```

### 6.3. Fichiers à Modifier

| Fichier | Modifications |
|---------|---------------|
| `apps/web/src/lib/apollo-client.ts` | Utiliser `import.meta.env.VITE_GRAPHQL_HTTP/WS` |
| `apps/web/src/lib/wagmi-config.ts` | Utiliser `import.meta.env.VITE_CHAIN_ID` et `VITE_RPC_URL` |
| `package.json` | Ajouter scripts `build:testnet` et `build:mainnet` |

### 6.4. Build Scripts

Dans `package.json` :
```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build:testnet": "vite build --mode testnet",
    "build:mainnet": "vite build --mode production",
    "preview": "vite preview"
  }
}
```

### 6.5. Tests Mainnet

**Procédure** :
1. Build avec `pnpm build:mainnet`
2. Tester en local avec `pnpm preview`
3. Vérifier connexion wallet mainnet
4. Tester queries GraphQL mainnet
5. **Tester avec PETITS montants** (0.001 TRUST par exemple)
6. Vérifier gas fees réels
7. Tester transaction complète (approve + deposit)
8. Vérifier affichage des données

---

## 7. Plan d'Implémentation

### Phase 5 : Refonte Layout (3-4 jours)

#### Jour 1 : Layout 3 Colonnes
- [ ] Créer structure 3 colonnes (Left 25%, Center 50%, Right 25%)
- [ ] Responsive mobile (stack vertical)
- [ ] Fixer les proportions et spacing

#### Jour 2 : Conteneur Gauche (Founder Info)
- [ ] Agrandir le conteneur
- [ ] Afficher biographie COMPLÈTE
- [ ] Ajouter section "Liens sociaux"
  - [ ] Ajouter champs dans `founders.json`
  - [ ] Implémenter affichage avec icônes
- [ ] Améliorer section Stats
- [ ] Clarifier "Propositions: 0"

#### Jour 3 : Conteneur Central (Vote Panel)
- [ ] **Navbar sticky** (Existant/Nouveau)
- [ ] **Barre recherche sticky**
- [ ] Retirer scroll bars du conteneur principal
- [ ] **Totems comme tags** (style Intuition badges)
- [ ] **Bouton dynamique** (Créer → Voter si claim existe)
- [ ] **Toasts pour erreurs** (bottom-left, via Sonner)

#### Jour 4 : Conteneur Droit (Triple Info)
- [ ] Créer `PriceChart.tsx` (Recharts)
- [ ] Créer `UserPositionCard.tsx` (collapsible)
- [ ] Créer `SubjectClaimsCard.tsx`
- [ ] Créer `TrustMarketCard.tsx`
- [ ] Créer `AtomURIsCard.tsx`
- [ ] Créer `ClaimCreatorCard.tsx`

### Phase 6 : GraphQL Queries (1 jour)

- [ ] `GET_VAULT_PRICE_HISTORY`
- [ ] `GET_SUBJECT_CLAIMS`
- [ ] `GET_TRIPLE_CREATOR`
- [ ] Tester toutes les queries

### Phase 7 : Migration Mainnet (2-3 jours)

#### Jour 1 : Recherche et Configuration
- [ ] Lire documentation INTUITION mainnet
- [ ] Obtenir tous les endpoints mainnet
- [ ] Créer `.env.local` et `.env.production`
- [ ] Configurer `apollo-client.ts` et `wagmi-config.ts`
- [ ] Créer build scripts

#### Jour 2-3 : Tests Mainnet
- [ ] Build mainnet
- [ ] Tests locaux (preview)
- [ ] Tests connexion wallet mainnet
- [ ] Tests transactions PETITS montants
- [ ] Vérifier gas fees
- [ ] Tests complets end-to-end

### Phase 8 : Push Git (Respecter README.md)

**Selon** `/home/paul/THP_Linux/Dev_++/Overmind_Founders_Collection/Claude/00_GESTION_PROJET/README.md` :

#### Règles Git Critiques

**❌ INTERDICTIONS** :
- NE JAMAIS créer de Pull Request
- NE JAMAIS marquer que c'est Claude qui a rédigé un commit
  - Pas de "Generated with Claude Code"
  - Pas de "Co-Authored-By: Claude"
- NE JAMAIS push directement sur `main`

**✅ WORKFLOW CORRECT** :
1. Créer une nouvelle branche : `git checkout -b feature/refonte-ux-mainnet`
2. Faire les commits : `git commit -m "refactor: layout 3 colonnes + sticky navbar"`
3. Push sur la branche : `git push origin feature/refonte-ux-mainnet`
4. **ATTENDRE** que Paul valide la PR (ne pas la créer)

#### Commits Recommandés

```bash
# Phase 5
git commit -m "refactor: layout 3 colonnes avec responsive mobile"
git commit -m "feat: biographie complète + liens sociaux fondateurs"
git commit -m "feat: navbar et recherche sticky dans VotePanel"
git commit -m "feat: totems affichés comme tags/badges Intuition"
git commit -m "feat: bouton dynamique Créer/Voter sur claim existant"
git commit -m "feat: toasts pour erreurs (bottom-left)"

# Phase 6
git commit -m "feat: PriceChart avec Recharts + périodes 24H/1W/1M/ALL"
git commit -m "feat: UserPositionCard collapsible avec P&L"
git commit -m "feat: SubjectClaimsCard + TrustMarketCard + AtomURIs"

# Phase 7
git commit -m "chore: configuration mainnet (env vars + build scripts)"
git commit -m "test: validation connexion et queries mainnet"

# Push
git push origin feature/refonte-ux-mainnet
```

---

## 8. Récapitulatif des Objectifs

### Objectifs En Cours (À conserver)

Depuis [TODO_Synchronisation_et_UX.md](./TODO_Synchronisation_et_UX.md) :

- [x] Phase 1 : WebSocket Subscriptions ✅
- [x] Phase 2 : UX Claim vs Vote ✅
- [x] Phase 3 : Améliorations ✅
- [x] Phase 3.1 : Fix actualisation votes ✅
- [x] Phase 4 : Cleanup ✅

### Nouveaux Objectifs (À ajouter)

- [ ] **Phase 5 : Refonte Layout** (3-4 jours)
  - [ ] Layout 3 colonnes (Left 25%, Center 50%, Right 25%)
  - [ ] Conteneur gauche enrichi (bio complète + liens sociaux)
  - [ ] Conteneur central sans scroll + navbar/recherche sticky
  - [ ] Totems comme tags + bouton dynamique + toasts erreurs
  - [ ] Conteneur droit avec toutes les infos triple

- [ ] **Phase 6 : Nouvelles Features** (1 jour)
  - [ ] Graphique de prix (Recharts)
  - [ ] Claims du sujet
  - [ ] TRUST Market
  - [ ] Atom URIs + Créateur

- [ ] **Phase 7 : Migration Mainnet** (2-3 jours)
  - [ ] Configuration environnement (testnet + mainnet)
  - [ ] Tests complets mainnet
  - [ ] Validation production-ready

- [ ] **Phase 8 : Push Git** (1 jour)
  - [ ] Commits propres et descriptifs
  - [ ] Push sur branche feature
  - [ ] Attendre validation Paul

---

**Estimation totale** : 7-9 jours de développement

**Priorité absolue** :
1. Refonte Layout (Phase 5)
2. Migration Mainnet (Phase 7)
3. Nouvelles Features (Phase 6)

---

**Voir aussi** :
- [02_ETAT_IMPLEMENTATION.md](./02_ETAT_IMPLEMENTATION.md)
- [05_FIX_ACTUALISATION_VOTES.md](./05_FIX_ACTUALISATION_VOTES.md)
- [TODO_Synchronisation_et_UX.md](./TODO_Synchronisation_et_UX.md)
- [README.md](../../README.md) - Règles Git CRITIQUES
