# TODO FIX 01 - Discussion et Clarifications

**Date** : 3 décembre 2025
**Branche** : `fix/phase10-corrections`
**Statut** : ✅ DÉCISIONS VALIDÉES - PRÊT POUR IMPLÉMENTATION

---

## 1. GRAPHES - Trois composants à créer

### 1.1 Graphe Trading (Panneau Central - En haut)

**Objectif** : Visualiser l'évolution des votes FOR et AGAINST dans le temps pour comprendre la dynamique de soutien d'un fondateur ou d'un totem spécifique.

**Spécifications** :
- **Librairie** : Evil Charts (recharts) - Animated Area Chart
- **2 courbes superposées** :
  - Courbe VERTE = Votes FOR (TRUST cumulé)
  - Courbe ROUGE/ORANGE = Votes AGAINST (TRUST cumulé)
- **Axe X** : Temps
- **Axe Y** : TRUST (en ETH)
- **Timeframes** : Boutons 24h | 7j | 30j | All
- **Mode par défaut** : Total TRUST sur le fondateur sélectionné
- **Mode sélection** : Si un totem est sélectionné → affiche le TRUST de ce totem uniquement

**Pourquoi** : Permet de voir les tendances, les moments de forte activité, et si un fondateur/totem gagne ou perd du soutien au fil du temps.

**Données GraphQL** :
```graphql
deposits(where: { term: { subject: { label: { _eq: $founderName } } } }) {
  created_at          # Pour l'axe temps
  assets_after_fees   # Montant TRUST
  vault_type          # "triple_positive" (FOR) ou "triple_negative" (AGAINST)
}
```

---

### 1.2 Radar Chart - Top Totems (Panneau Central ou Gauche)

**Objectif** : Comparer visuellement les scores FOR et AGAINST des top totems d'un fondateur pour voir d'un coup d'œil quels totems sont soutenus et lesquels sont contestés.

**Spécifications** :
- **Librairie** : Evil Charts - Stroke Multiple Radar Chart
- **Axes** : Les 3-5 top totems du fondateur (dynamique par fondateur)
- **2 séries de données** :
  - Série BLEUE = Votes FOR
  - Série ORANGE = Votes AGAINST
- **Distance du centre** : Proportionnelle au montant TRUST

**Pourquoi** : Vue synthétique et esthétique pour comparer rapidement les totems entre eux et voir le rapport FOR/AGAINST de chacun.

**Données** :
```typescript
const chartData = topTotems.map(totem => ({
  totem: totem.label,        // "Lion", "Turtle", etc.
  for: totem.trustFor,       // Ex: 450
  against: totem.trustAgainst // Ex: 50
}));
```

---

### 1.3 Graphe Relations Radial (Panneau Gauche)

**Objectif** : Visualiser les relations Fondateur → Totems avec indication visuelle du rapport FOR/AGAINST pour chaque totem, permettant de voir la "carte" complète des votes.

**Spécifications** :
- **Structure** :
  - **Centre** : Le Fondateur (avec son image/nom)
  - **Extrémités** : Les Totems (avec leur image/nom)
  - **Lignes/Axes** : Du centre vers chaque totem
  - **Distance** : Plus le totem est loin du centre = plus il a de TRUST total

- **Zones colorées** (comme un radar rempli) :
  - Zone **BLEUE** : S'étend vers les totems majoritairement FOR
  - Zone **ORANGE** : S'étend vers les totems majoritairement AGAINST
  - Les 2 zones se superposent pour montrer la "bataille"

- **Prédicat** : Affiché au **survol/tooltip** uniquement (pas visible par défaut)
  - Tooltip : "has totem" ou "embodies"

- **Agrégation prédicats** : Si un totem a les 2 prédicats (has totem + embodies), on **agrège** et on affiche le signal dominant (FOR ou AGAINST majoritaire)

**Pourquoi** : Vue "carte de bataille" qui montre d'un coup d'œil quels totems sont soutenus (bleu) vs contestés (orange), avec la force relative de chacun.

**Illustration** :
```
                    Lion (AGAINST dominant)
                      ●
                     /|\  ← Zone ORANGE
                    / | \
                   /  |  \
                  /   |   \
       Owl ●----[Fondateur]----● Turtle
       (FOR)      |         (FOR)
                  |
                  |  ← Zone BLEUE
                  |
                  ●
              Phoenix (FOR)
```

**Interactions** :
- **Click sur totem** → Sélectionne le totem dans le panneau droit pour voter
- **Hover sur ligne** → Affiche tooltip avec prédicat et scores détaillés

---

## 1.BIS. PROBLÈME CRITIQUE - Totems Admin Invisibles

### Analyse du problème

**Symptôme** : Les totems créés dans la page Admin n'apparaissent pas dans l'onglet "Totems".

**Causes identifiées** :

#### Cause 1 : Mauvaise requête dans FounderCenterPanel
L'onglet Totems utilise `GET_FOUNDER_PROPOSALS` qui cherche :
```graphql
triples(where: {
  subject: { label: { _eq: "Joseph Lubin" } }   # Fondateur = SUJET
  predicate: { label: { _in: ["has totem", "embodies"] } }
})
```

Mais quand Admin crée un totem, il crée SEULEMENT :
```
[Lion] - [has category] - [Animal]   # ← PAS de lien avec un fondateur !
```

Le triple `[Fondateur] - [has totem] - [Lion]` est créé **uniquement quand quelqu'un vote**.

#### Cause 2 : Subscription utilise ANCIEN format
`SUBSCRIBE_TOTEM_CATEGORIES` dans `subscriptions.ts` ligne 184 :
```graphql
predicate: { label: { _eq: "has_category" } }   # ← UNDERSCORE (ancien)
object: { label: { _like: "OFC:%" } }           # ← PREFIX OFC: (ancien)
```

Mais `categories.json` utilise le NOUVEAU format :
```json
"predicate": { "label": "has category" }   # ← ESPACE (nouveau)
"categories": ["Animal", "Object", ...]    # ← SANS préfixe OFC:
```

**Résultat** : La subscription ne trouve RIEN car les formats ne matchent pas !

### Code existant qui FONCTIONNAIT

Le hook `useTotemData.ts` existe et fait exactement ce qu'on veut :
- Utilise `SUBSCRIBE_TOTEM_CATEGORIES` (WebSocket)
- Fusionne totems des votes + totems des catégories
- Retourne `allExistingTotems` = TOUS les totems OFC

Le `VotePanel.tsx` original (430 lignes) utilise ce hook :
```typescript
const { allExistingTotems, existingTotems, ... } = useTotemData({...});
```

Mais `VoteTotemPanel.tsx` (Phase 9, 269 lignes) est simplifié et N'UTILISE PAS `useTotemData` !

### Solution

1. **Corriger `SUBSCRIBE_TOTEM_CATEGORIES`** :
   - `has_category` → `has category` (espace)
   - `OFC:%` → `["Animal", "Object", "Trait", "Concept", "Element", "Mythology"]`

2. **Utiliser `useTotemData` dans `FounderCenterPanel`** pour l'onglet Totems

3. **Garder `useFounderProposals`** pour les totems AVEC votes (scores)

### Système de Tags OFC (rappel)

Pour qu'un totem soit reconnu comme "OFC" :
1. **Triple catégorie** : `[Totem] - [has category] - [Category]`
2. Les catégories valides sont : Animal, Object, Trait, Concept, Element, Mythology

Ces triples sont créés par :
- **Admins** via la page Admin (pour les totems prédéfinis)
- **Users** lors de la création d'un nouveau totem personnalisé

---

## 2. ONGLETS - Totems vs My Votes

### 2.1 Onglet "Totems"

**Objectif** : Afficher TOUS les totems disponibles pour voter, pas seulement ceux qui ont déjà des votes.

**Pourquoi** : Actuellement, seuls les totems ayant déjà reçu des votes apparaissent. Cela empêche les utilisateurs de découvrir et voter sur de nouveaux totems créés par les admins ou d'autres users. En affichant tous les totems OFC disponibles, on encourage l'exploration et la participation.

**Ce qu'on affiche** :
- ✅ Totems créés par admins (via page Admin)
- ✅ Totems créés par users (avec les bons tags OFC)
- ✅ Même si aucun vote n'existe encore sur ce fondateur

**Comment récupérer les totems OFC** :
```graphql
# Tous les atoms avec une catégorie OFC
query GetAllOFCTotems {
  triples(
    where: {
      predicate: { label: { _eq: "has category" } }
      object: { label: { _in: ["Animal", "Object", "Trait", "Concept", "Element", "Mythology"] } }
    }
  ) {
    subject { term_id, label, image }  # Le totem
    object { label }                    # La catégorie
  }
}
```

---

### 2.2 Onglet "Positions" → Renommer **"My Votes"**

**Objectif** : Afficher les votes de l'utilisateur connecté de manière claire et cliquable.

**Pourquoi** : Le terme "Positions" est trop financier/trading. "My Votes" est plus intuitif et correspond mieux à l'action de l'utilisateur. Le format simplifié avec images permet une lecture rapide et une interaction directe (clic → sélection pour modifier).

**Format d'affichage simplifié** :
```
[Img Sujet] Sujet - [Img Prédicat] Prédicat - [Img Objet] Objet   +0.0307
```

**Format atom** (style Intuition Portal) :
```html
<div class="flex items-center gap-2">
  <img class="h-6 w-6 rounded" src="..." alt="..." />
  <span>Nom</span>
</div>
```

**Interactions** :
- Click sur un vote → Sélectionne l'objet/totem dans le panneau droit

**Supprimer** :
- ❌ Boutons "Ajouter" / "Retirer" (seront gérés ailleurs)

---

## 3. PANNEAU GAUCHE - Stats

**Pourquoi** : Les métriques actuelles ("Relations", "Prédicats", "TRUST") sont confuses et ne donnent pas une vision claire de l'activité. Les nouvelles métriques (Market Cap, Holders, Claims) sont plus parlantes et permettent de comprendre rapidement la popularité et l'engagement autour d'un fondateur.

### Métriques à afficher

| Métrique | Calcul | Description |
|----------|--------|-------------|
| **Total Market Cap** | Σ(FOR + AGAINST) | Valeur totale de tous les votes sur ce fondateur |
| **Total Holders** | Count distinct `sender_id` | Nombre de wallets ayant voté |
| **Claims** | Count triples | Nombre de claims différents |

### Top Totems (section)

Afficher les **3 totems** avec le plus de TRUST total (FOR + AGAINST), triés par score.

**Affichage proposé** :
```
┌─────────────────────────────────┐
│ Joseph Lubin                    │
├─────────────────────────────────┤
│ Total Market Cap    1,234 TRUST │
│ Total Holders       42 voters   │
│ Claims              5           │
├─────────────────────────────────┤
│ Top Totems                      │
│ 1. 🦁 Lion          +450 TRUST  │
│ 2. 🐢 Turtle        +230 TRUST  │
│ 3. 🔥 Phoenix       +180 TRUST  │
├─────────────────────────────────┤
│ [Graphe Relations Radial]       │
│                                 │
└─────────────────────────────────┘
```

---

## 4. ACTION WITHDRAW

**Pourquoi** : Les utilisateurs doivent pouvoir retirer leur TRUST d'une position. C'est essentiel pour la gestion de leur portefeuille et la liquidité du système. Le bouton "Retirer" a déjà été ajouté au VoteTotemPanel (Phase 10 fix).

**Statut** : Bouton ajouté, logique de retrait à implémenter après les graphes

---

## 5. ✅ ARCHITECTURE 3 PANNEAUX - Spécifications complètes

### 5.1 PANNEAU GAUCHE - Infos Fondateur + Stats

**Structure (de haut en bas)** :

```
┌─────────────────────────────────────┐
│ [Avatar]  Nom du Fondateur          │  ← Photo à gauche, nom aligné en bas de l'avatar
├─────────────────────────────────────┤
│ Tags associés au fondateur          │
├─────────────────────────────────────┤
│ Description complète                │
├─────────────────────────────────────┤
│ Liens sociaux (X, GitHub, etc.)     │
├─────────────────────────────────────┤
│ ─────────── séparation ──────────── │
├─────────────────────────────────────┤
│ Stats                               │
│ • Total Market Cap: XXX TRUST       │
│ • Total Holders: XX voters          │
│ • Claims: XX                        │
├─────────────────────────────────────┤
│ Radar Chart - Top 5 Totems          │  ← FOR bleu / AGAINST orange
├─────────────────────────────────────┤
│ Vote Graph (Relations Radial)       │  ← Fondateur au centre, totems autour
└─────────────────────────────────────┘
```

**Interactions Radar Chart** :
- Click sur un totem → affiche ce totem dans le **Graphe Trading** (panneau central)
- Ne sélectionne PAS dans le panneau droit

**Interactions Vote Graph** :
- Pas d'interaction pour le moment (display only)

---

### 5.2 PANNEAU CENTRAL - Graphe Trading + 2 Sections

**Structure (de haut en bas)** :

```
┌─────────────────────────────────────────────────────────┐
│ Graphe Trading (FOR vert / AGAINST orange)              │
│ [12H] [24H] [7D] [All]                                  │
├─────────────────────────────────────────────────────────┤
│ SECTION 1 : Sélection totem                             │
│ [Totems]                                    [Création]  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Contenu de l'onglet sélectionné                     │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ SECTION 2 : Votes                                       │
│ [My Votes]                              [Best Triples]  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Contenu de l'onglet sélectionné                     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Timeframes** : 12H | 24H | 7D | All

---

### Section 1 : Sélection totem

#### Onglet "Totems"

**Barre de catégories dynamique** :
```
[All] [Animal] [Tech] [Web3] [Movie] [Sci-fi] [Power] [...] [>]
 ↑                                                      ↑    ↑
 Toujours 1er                              Plus de catégories  Flèche navigation
```

**Navigation catégories** :
- `[...]` + `[>]` pour voir plus de catégories
- `[<]` apparaît si on a scrollé pour revenir
- **Ordre dynamique** : Catégories triées par utilisation (votes), `All` toujours 1er
- Si trop d'onglets → afficher les plus utilisés en premier

**Grille de totems** :
- Totems classés du plus utilisé au moins utilisé
- Dans `All` : tous les totems, triés par utilisation globale
- Dans une catégorie : totems de cette catégorie, triés par utilisation

**Interaction** : Click sur totem → remplit automatiquement le panneau droit

#### Onglet "Création" (nouveau totem)

**Formulaire** :
- Input : Nom du totem
- Sélecteur : Catégorie

**Comportement** :
- À la saisie → le nom est transmis au panneau droit automatiquement
- L'utilisateur choisit ensuite : prédicat, direction (FOR/AGAINST uniquement, pas WITHDRAW), montant
- "Ajouter au panier" → le nouveau totem apparaît SEULEMENT pour cet utilisateur
- Visible dans "My Votes" tant que le panier n'est pas validé
- Peut modifier/supprimer avant validation du panier (pas de frais)

---

### Section 2 : Votes

#### Onglet "My Votes"

**Contenu** : Les votes de l'utilisateur connecté sur ce fondateur

**Format d'affichage** :
```
[Img Sujet] Sujet - [Img Prédicat] Prédicat - [Img Objet] Objet   +0.0307
```

**Inclut** :
- Votes déjà validés (on-chain)
- Votes en attente dans le panier (seulement visibles par l'utilisateur)

**Interaction** : Click → sélectionne le totem dans le panneau droit pour modifier

#### Onglet "Best Triples"

**Contenu** : Les meilleurs triples sur ce fondateur (tous utilisateurs confondus)

**Format d'affichage** :
```
[Sujet] - [Prédicat] - [Objet]   XX% TRUST
```

**Tri** : Par valeur TRUST (pourcentage du total)

---

### 5.3 PANNEAU DROIT - Vote Totem

**Structure (de haut en bas)** :

```
┌─────────────────────────────────────┐
│ 1. Prédicat                         │
│ [has totem] [embodies]              │  ← Aucun sélectionné par défaut
├─────────────────────────────────────┤
│ 2. Totem                            │
│ [Auto-rempli depuis panneau central]│
├─────────────────────────────────────┤
│ 3. Action                           │
│ [FOR] [WITHDRAW] [AGAINST]          │
├─────────────────────────────────────┤
│ 4. Montant                          │
│ [____] TRUST                        │
├─────────────────────────────────────┤
│ [Ajouter au panier]                 │
└─────────────────────────────────────┘
```

**Validation prédicat** :
- Si aucun prédicat sélectionné → bouton "Ajouter au panier" désactivé
- Les boutons FOR et AGAINST pulsent pour attirer l'attention

**Comportement actions** :

| Contexte | Actions disponibles |
|----------|---------------------|
| **Nouveau totem (création)** | FOR, AGAINST (pas WITHDRAW) |
| **Totem existant, pas de vote** | FOR, AGAINST (pas WITHDRAW) |
| **Totem existant, déjà voté FOR** | FOR (ajouter), WITHDRAW, AGAINST |
| **Totem existant, déjà voté AGAINST** | FOR, WITHDRAW, AGAINST (ajouter) |

**Switch FOR ↔ AGAINST** :
- Si l'utilisateur a voté FOR et veut voter AGAINST :
  - Notification : "On va retirer votre position FOR (X TRUST)"
  - Demander le montant pour le nouveau vote AGAINST
  - Le switch se fait dans le panier (pas de frais supplémentaires tant que non validé)

---

### 5.4 PANIER - Comportement

**Position** : Dropdown rattaché au panneau droit, ouvre un panneau supplémentaire

**Visibilité** :
- Les items du panier sont visibles UNIQUEMENT par l'utilisateur
- Nouveaux totems créés → visibles dans panier + "My Votes"
- Modifications de vote → visibles dans panier

**Avant validation** :
- Peut modifier/supprimer les items
- Pas de frais blockchain
- Switch FOR ↔ AGAINST gratuit

**Après validation** :
- Transactions exécutées
- Frais appliqués
- Totems créés visibles par tous

---

## 6. DÉCISIONS TECHNIQUES VALIDÉES

| Sujet | Décision |
|-------|----------|
| **Librairie graphes** | Evil Charts (basé sur recharts) |
| **Graphe Trading** | 2 Area Charts (FOR vert + AGAINST orange) superposés |
| **Timeframes** | 12H, 24H, 7D, All |
| **Radar Top Totems** | 5 totems, 2 séries (FOR bleu, AGAINST orange) |
| **Graphe Relations** | Radar custom avec zones colorées FOR/AGAINST |
| **Prédicat** | Visible au tooltip uniquement |
| **Agrégation prédicats** | Si 2 prédicats → afficher signal dominant |
| **Interaction Radar** | Click totem → affiche dans Graphe Trading (pas panneau droit) |
| **Interaction Vote Graph** | Pas d'interaction (display only) |
| **Panneau central** | 2 sections : [Totems/Création] + [My Votes/Best Triples] |
| **Catégories** | Ordre dynamique par utilisation, All toujours 1er |
| **Panier** | Dropdown rattaché au panneau droit |
| **Prédicat par défaut** | Aucun, bouton bloqué + pulse FOR/AGAINST |

---

## 7. PROCHAINES ÉTAPES - Ordre d'implémentation

### 🔴 Étape 0 : FIX CRITIQUE - Totems OFC (PRIORITAIRE)

**Option A** : Corriger la subscription existante
- [ ] Modifier `SUBSCRIBE_TOTEM_CATEGORIES` : `has_category` → `has category`
- [ ] Modifier `SUBSCRIBE_TOTEM_CATEGORIES` : `OFC:%` → liste catégories
- [ ] Utiliser `useTotemData` existant dans `FounderCenterPanel`

**Option B** : Créer nouvelle requête (si subscription pose problème)
- [ ] Créer requête `GET_ALL_OFC_TOTEMS` dans queries.ts
- [ ] Créer hook `useAllOFCTotems()`
- [ ] Modifier `FounderCenterPanel.tsx` pour utiliser ce hook

**Dans les deux cas** :
- [ ] Afficher TOUS les totems OFC dans l'onglet Totems
- [ ] Enrichir avec les votes existants si le triple existe

### Étape 1 : Setup Evil Charts
- [ ] Installer les dépendances si nécessaire
- [ ] Vérifier compatibilité avec le projet

### Étape 2 : Graphe Trading (Area Chart)
- [ ] Créer hook `useVotesTimeline(founderName, totemId?, timeframe)`
- [ ] Créer composant `TradingChart.tsx`
- [ ] Intégrer dans panneau central

### Étape 3 : Radar Top Totems
- [ ] Créer hook `useTopTotems(founderName, limit)`
- [ ] Créer composant `TopTotemsRadar.tsx`
- [ ] Intégrer dans panneau (central ou gauche)

### Étape 4 : Graphe Relations Radial
- [ ] Créer composant `RelationsRadar.tsx`
- [ ] Implémenter zones FOR/AGAINST
- [ ] Ajouter tooltip prédicat
- [ ] Intégrer dans panneau gauche

### Étape 5 : My Votes (ex-Positions)
- [ ] Renommer onglet "Positions" → "My Votes"
- [ ] Format simplifié : `[img] Sujet - [img] Prédicat - [img] Objet  +X.XXX`
- [ ] Supprimer boutons "Ajouter" / "Retirer"
- [ ] Click → sélectionne l'objet dans panneau droit

### Étape 6 : Stats Panneau Gauche
- [ ] Total Market Cap = Σ(FOR + AGAINST) sur le fondateur
- [ ] Total Holders = count distinct sender_id
- [ ] Claims = count triples (nombre de totems votés)
- [ ] Top 3 Totems avec leur score

---

**Dernière mise à jour** : 5 décembre 2025
**Statut** : Prêt pour implémentation

---

## 8. INTERNATIONALISATION (i18n) - COMPLÉTÉ

### 8.1 Changements effectués (5 décembre 2025)

**Objectif** : Tous les textes de l'application doivent s'afficher dans la langue sélectionnée (EN/FR).

**Fichiers de traduction:**
- `apps/web/src/i18n/locales/en.json`
- `apps/web/src/i18n/locales/fr.json`

**Composants mis à jour:**

| Composant | Modifications |
|-----------|---------------|
| `VoteGraph.tsx` | Ajout `useTranslation`, remplacement textes hardcodés FR |
| `TradingChart.tsx` | Ajout `useTranslation`, "Aucune donnée" → `t('common.noData')` |
| `FounderExpandedView.tsx` | "Panier de votes" → `t('founderExpanded.voteCart')` |
| `FounderInfoPanel.tsx` | Fermer, Propositions → clés i18n |
| `RefreshIndicator.tsx` | Réécriture complète avec `formatTime()` interne |
| `VotePanel.tsx` | Multiples remplacements |
| `VoteCartPanel.tsx` | Summary, dépôts, frais, etc. |
| `VoteMarket.tsx` | "Aucun vote" → `t('founderExpanded.noVotesYet')` |
| `FoundersTab.tsx` (Admin) | Toute la page admin internationalisée |

**Nouvelles clés ajoutées:**

```json
// refreshIndicator
"paused", "connecting", "disconnected", "justNow", "secondsAgo",
"pausedTooltip", "connectingTooltip", "disconnectedTooltip",
"activeTooltip", "updatedAt"

// founderExpanded (extensions)
"oppositePositionWarning", "newTotemInfo", "summary", "deposits",
"entryFees", "atomCreation", "withdrawals", "netTotal", "noVotesYet",
"emptyCart", "addVotesHint", "validating", "validateCart"

// admin
"loadingAtoms", "graphqlError", "existingAtoms", "missingAtoms",
"totalFounders", "foundersWithAtoms", "foundersWithoutAtom", "termId",
"type", "creating", "createAtom", "noUrl", "imageSource",
"sourceManual", "sourceTwitter", "sourceGitHub", "sourceGenerated"
```

**Pattern utilisé:**
```typescript
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation();
  return <span>{t('section.key')}</span>;
}
```
