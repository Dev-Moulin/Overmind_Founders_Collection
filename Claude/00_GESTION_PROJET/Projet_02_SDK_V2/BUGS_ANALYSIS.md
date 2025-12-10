# Analyse des Bugs - 8 décembre 2025

## Résumé des 8 problèmes identifiés

| # | Problème | Cause racine | Priorité |
|---|----------|--------------|----------|
| 1 | My Votes n'affiche pas les positions | Query GraphQL filtrage nested potentiel + skip si pas wallet | 🔴 HIGH |
| 2 | Trading Graph vide | Probablement pas de données ou confusion de hooks | 🔴 HIGH |
| 3 | Onglet Création non fonctionnel | Placeholder uniquement, UI manquante | 🟡 MEDIUM |
| 4 | Stats panneau gauche vides | Query deposits nested non supporté | 🔴 HIGH |
| 5 | Top Totems = 1 seul | Minimum 3 totems requis pour radar sinon liste | 🟡 MEDIUM |
| 6 | Layout non adapté 16 pouces | CSS widths fixes, pas de breakpoints | 🟡 MEDIUM |
| 7 | Vote Graph trop petit | Espace insuffisant dans le layout | 🟡 MEDIUM |
| 8 | Tags fondateur manquants | Champ `tags` inexistant dans founders.json | 🟢 LOW |

---

## 1. MY VOTES N'AFFICHE PAS LES POSITIONS

### Symptôme
Section "My Votes" dans FounderCenterPanel montre "Aucun vote" même si l'utilisateur a voté.

### Cause racine identifiée
**Filtrage GraphQL nested potentiellement non supporté**

La requête `GET_USER_VOTES_FOR_FOUNDER` utilise un filtre nested:
```graphql
deposits(
  where: {
    sender_id: { _eq: $walletAddress }
    term: {
      subject: { label: { _eq: $founderName } }
      predicate: { label: { _in: ["has totem", "embodies"] } }
    }
  }
)
```

Ce filtre `term.subject.label` peut ne pas être supporté selon le schéma Hasura.

### Solution proposée
**Option A**: Simplifier la query + filtrer côté client
```typescript
// 1. Query sans filter nested
deposits(where: { sender_id: { _eq: $walletAddress }, vault_type: { _in: [...] } })

// 2. Filtrer en JS
const filtered = deposits.filter(d =>
  d.term?.subject?.label === founderName &&
  ['has totem', 'embodies'].includes(d.term?.predicate?.label)
);
```

### Fichiers concernés
- `apps/web/src/lib/graphql/queries.ts` (lignes 799-843)
- `apps/web/src/hooks/data/useUserVotesForFounder.ts`

---

## 2. TRADING GRAPH VIDE

### Symptôme
Le graphe Trading (Area Chart FOR/AGAINST) n'affiche aucune donnée.

### Causes potentielles identifiées
1. **Pas de données** - Le fondateur n'a peut-être pas de votes enregistrés
2. **Confusion de hooks** - Il existe DEUX hooks `useVotesTimeline`:
   - `useVoteStats.ts` → par termId (triple)
   - `useVotesTimeline.ts` → par founderName (nouveau)

### Solution proposée
1. Ajouter du logging pour debugger:
```typescript
console.log('Timeline data:', timelineData);
console.log('Founder name:', founder.name);
```
2. Vérifier dans Network tab si la query GraphQL est envoyée
3. S'assurer que le bon hook est importé (celui par founder)

### Fichiers concernés
- `apps/web/src/hooks/data/useVotesTimeline.ts`
- `apps/web/src/components/founder/FounderCenterPanel.tsx`
- `apps/web/src/components/graph/TradingChart.tsx`

---

## 3. ONGLET CRÉATION NON FONCTIONNEL

### Symptôme
L'onglet "Création" affiche "Bientôt disponible" - impossible de créer un nouveau totem.

### Cause racine
**L'UI n'est pas implémentée** - seulement un placeholder existe.

Le backend est PRÊT:
- `useIntuition.createClaimWithCategory()` - crée les 3 triples
- `categories.json` - catégories prédéfinies
- `useVoteCart` - supporte `isNewTotem: true`

### Solution proposée
Créer un composant `CreationTab.tsx` avec:
1. Input nom du totem
2. Sélecteur de catégorie (Animal, Object, Trait, Concept, Element, Mythology)
3. Affichage du triple attendu: `[Totem] [has category] [Category]`
4. Connexion au panneau droit pour sélection prédicat + montant

### Fichiers à créer/modifier
- CRÉER: `apps/web/src/components/founder/CreationTab.tsx`
- MODIFIER: `apps/web/src/components/founder/FounderCenterPanel.tsx` (remplacer lignes 271-282)

### Flux attendu
1. User tape nom totem → "Lion"
2. User sélectionne catégorie → "Animal"
3. Système affiche: `[Lion] [has category] [Animal]`
4. User sélectionne prédicat dans panneau droit → "has totem"
5. User entre montant → "1.5 TRUST"
6. "Ajouter au panier" → crée les 3 triples:
   - `[Founder] [has totem] [Lion]` + 1.5 TRUST
   - `[Lion] [has category] [Animal]`
   - `[Animal] [tag category] [Overmind Founders Collection]`

---

## 4. STATS PANNEAU GAUCHE VIDES

### Symptôme
Total Market Cap, Total Holders, Claims affichent "..." puis rien.

### Cause racine identifiée
**Même problème que #1** - la query deposits utilise un filtre nested:
```graphql
deposits(
  where: {
    term: {
      subject: { label: { _eq: $founderName } }
      predicate: { label: { _in: [...] } }
    }
  }
)
```

### Solution proposée
1. **Market Cap** → calculer depuis `triples.triple_vault.total_assets` (fonctionne probablement)
2. **Holders** → query séparée sans filtre nested, puis filtrer côté client
3. **Claims** → `triples.length` (fonctionne probablement)

### Fichiers concernés
- `apps/web/src/lib/graphql/queries.ts` (GET_FOUNDER_PANEL_STATS)
- `apps/web/src/hooks/data/useFounderPanelStats.ts`

---

## 5. TOP TOTEMS = 1 SEUL

### Symptôme
Le radar "Top Totems" affiche qu'un seul totem au lieu de 5.

### Cause racine identifiée
**Comportement normal** - le composant bascule en mode liste si < 3 totems:
```typescript
// TopTotemsRadar.tsx ligne 199
if (totems.length < 3) {
  return <ListView ... />  // Pas de radar, juste une liste
}
```

### Raisons possibles
1. Le fondateur n'a vraiment qu'1 ou 2 totems avec des votes
2. Les données ne remontent pas correctement (voir problème #4)

### Solution proposée
1. D'abord corriger le problème #4 pour s'assurer que les données remontent
2. Si vraiment < 3 totems, envisager de baisser le seuil à 2 ou 1

### Fichiers concernés
- `apps/web/src/components/graph/TopTotemsRadar.tsx`
- `apps/web/src/hooks/data/useTopTotems.ts`

---

## 6. LAYOUT NON ADAPTÉ 16 POUCES

### Symptôme
Sur un écran 16 pouces, les 3 panneaux sont trop serrés / débordent.

### Cause racine identifiée
Le layout utilise des fractions fixes:
```tsx
// FounderExpandedView.tsx ligne 125-159
<div className="lg:w-1/5">...</div>  // Panneau gauche = 20%
<div className="lg:w-2/5">...</div>  // Panneau central = 40%
<div className="lg:w-2/5">...</div>  // Panneau droit = 40%
```

Le container fait `max-w-[1600px]` ce qui peut être trop sur un 16 pouces.

### Solution proposée
1. Ajouter un breakpoint `xl:` pour écrans plus petits
2. Réduire les proportions ou passer en mode scroll horizontal
3. Alternative: tabs au lieu de 3 colonnes sur écrans < 1400px

```tsx
// Proposition responsive
<div className="lg:w-1/4 xl:w-1/5">...</div>
<div className="lg:w-1/2 xl:w-2/5 overflow-y-auto">...</div>
<div className="lg:w-1/4 xl:w-2/5">...</div>
```

### Fichiers concernés
- `apps/web/src/components/founder/FounderExpandedView.tsx`

---

## 7. VOTE GRAPH TROP PETIT

### Symptôme
Le graphe relationnel dans le panneau gauche est trop petit pour être lisible.

### Cause racine
L'espace disponible dans le panneau gauche (1/5 = 20% de 1600px = 320px max) est insuffisant.

```tsx
// FounderInfoPanel.tsx ligne 196-205
<RelationsRadar
  ...
  height={220}  // Hauteur fixe de 220px
/>
```

### Solution proposée
1. Augmenter la largeur du panneau gauche (1/5 → 1/4)
2. Rendre le graphe cliquable pour ouvrir en modal plein écran
3. Alternative: déplacer le graphe vers le panneau central

### Fichiers concernés
- `apps/web/src/components/founder/FounderInfoPanel.tsx`
- `apps/web/src/components/graph/RelationsRadar.tsx`

---

## 8. TAGS FONDATEUR MANQUANTS

### Symptôme
Pas de tags affichés entre le nom du fondateur et sa description.

### Cause racine identifiée
**Le champ `tags` n'existe pas dans les données founders**

Le fichier `founders.json` contient:
- id, name, shortBio, fullBio, twitter, linkedin, github
- **PAS de champ `tags`**

Le composant `FounderInfoPanel` ne gère pas les tags (code absent).

### Solution proposée
**Option A**: Ajouter le champ `tags` aux données
```json
{
  "id": "joseph-lubin",
  "name": "Joseph Lubin",
  "tags": ["Ethereum", "ConsenSys", "MetaMask"],
  ...
}
```

**Option B**: Extraire les tags automatiquement de la bio
Parser `shortBio` pour extraire les mots-clés (Ethereum, ConsenSys, etc.)

**Option C**: Tags dynamiques depuis les totems votés
Afficher les top 3 totems comme "tags"

### Fichiers concernés
- `packages/shared/src/data/founders.json` (ajouter champ tags)
- `apps/web/src/components/founder/FounderInfoPanel.tsx` (afficher les tags)
- `apps/web/src/types/founder.ts` (ajouter type tags?)

---

## Ordre de priorité recommandé

1. **#1 + #4** - Corriger les queries GraphQL nested (cause commune)
2. **#2** - Debug Trading Graph (vérifier données)
3. **#6 + #7** - Adapter layout responsive
4. **#3** - Implémenter onglet Création
5. **#5** - Vérifier après fix #4
6. **#8** - Ajouter tags (enhancement)

---

## Prochaines étapes

1. [ ] Tester les queries GraphQL dans le playground Hasura
2. [ ] Simplifier les queries avec filtre nested → filtrage côté client
3. [ ] Ajouter logging temporaire pour debug
4. [ ] Implémenter les fixes un par un
5. [ ] Tester sur écran 16 pouces

---

## ✅ STATUT DES BUGS DU 8 DÉCEMBRE

| # | Bug | Statut |
|---|-----|--------|
| 1 | My Votes n'affiche pas les positions | ✅ CORRIGÉ (PR #185) |
| 2 | Trading Graph vide | ✅ CORRIGÉ (PR #190) |
| 3 | Onglet Création non fonctionnel | 🟡 EN ATTENTE |
| 4 | Stats panneau gauche vides | ✅ CORRIGÉ (PR #185) |
| 5 | Top Totems = 1 seul | ✅ CORRIGÉ |
| 6 | Layout non adapté 16 pouces | ✅ CORRIGÉ (PR #187) |
| 7 | Vote Graph trop petit | ✅ CORRIGÉ |
| 8 | Tags fondateur manquants | ✅ CORRIGÉ (PR #186) |

---

# NOUVEAUX BUGS - 9 décembre 2025

## Résumé des 5 problèmes identifiés

| # | Problème | Cause racine | Priorité |
|---|----------|--------------|----------|
| 9 | WITHDRAW bloqué "position opposée existante" | `currentPosition` non passé à `addItem()` | 🔴 HIGH |
| 10 | Trading Chart FOR/AGAINST inversé | Mapping couleurs inversé dans TradingChart | 🔴 HIGH |
| 11 | My Votes dupliqués au switch d'onglet | Bug state management dans FounderCenterPanel | 🔴 HIGH |
| 12 | Duplicate React keys dans Best Triples | Plusieurs triples avec même objet → utiliser `tripleTermId` | 🟡 MEDIUM |
| 13 | Erreur vide dans useBatchVote | Logging insuffisant quand `err.message` est undefined | 🟡 MEDIUM |

---

## 9. WITHDRAW BLOQUÉ - "POSITION OPPOSÉE EXISTANTE"

### Symptôme
Quand l'utilisateur a voté FOR et veut voter AGAINST, il reçoit l'erreur :
> "Impossible de voter: position opposée existante. Essayez de retirer d'abord."

### Comportement attendu (selon TODO_FIX_01_Discussion.md)
Le système devait **automatiquement** :
1. Détecter la position FOR existante
2. Notifier : "On va retirer votre position FOR (X TRUST)"
3. Ajouter le retrait + nouveau vote AGAINST dans le panier
4. Exécuter en batch

### Cause racine identifiée
Dans `VoteTotemPanel.tsx` lignes 318-327, `currentPosition` n'est **jamais passé** à `addItem()` :

```typescript
// ACTUEL (BUG) - ligne 318-327
const cartItem = {
  totemId: selectedTotemId as Hex,
  totemName: selectedTotemLabel || 'Unknown',
  predicateId: selectedPredicateWithAtom.atomId as Hex,
  termId: (proactiveClaimInfo?.termId || selectedTotemId) as Hex,
  counterTermId: (proactiveClaimInfo?.counterTermId || selectedTotemId) as Hex,
  direction: voteDirection as 'for' | 'against',
  amount: trustAmount,
  isNewTotem,
  // ❌ MANQUE: currentPosition
};
```

Sans `currentPosition`, `needsWithdraw` est toujours `false` dans `useVoteCart.ts` (lignes 357-360).

### Solution proposée
```typescript
// CORRECTION
const currentPositionForCart = hasAnyPosition && positionDirection
  ? { direction: positionDirection, shares: currentUserShares }
  : undefined;

const cartItem = {
  // ... autres champs
  currentPosition: currentPositionForCart, // ✅ Ajouter cette ligne
};
```

### Fichiers concernés
- `apps/web/src/components/founder/VoteTotemPanel.tsx` (lignes 318-327)

---

## 10. TRADING CHART FOR/AGAINST INVERSÉ

### Symptôme
L'utilisateur vote FOR mais le graphe affiche la courbe AGAINST (rouge) qui augmente.

### Cause potentielle
Mapping des couleurs inversé dans `TradingChart.tsx` ou données `vault_type` mal interprétées.

### À investiguer
- Vérifier `vault_type: "triple_positive"` (FOR) vs `"triple_negative"` (AGAINST)
- Vérifier le mapping couleurs dans le composant

### Fichiers concernés
- `apps/web/src/components/graph/TradingChart.tsx`
- `apps/web/src/hooks/data/useVotesTimeline.ts`

---

## 11. MY VOTES DUPLIQUÉS AU SWITCH D'ONGLET

### Symptôme
Quand l'utilisateur switch entre "My Votes" et "Best Triples" puis revient sur "My Votes", les entrées se dupliquent.

### Cause potentielle
Bug de state management - les données s'accumulent au lieu d'être remplacées lors du re-render.

### Fichiers concernés
- `apps/web/src/components/founder/FounderCenterPanel.tsx`

---

## 12. DUPLICATE REACT KEYS DANS BEST TRIPLES

### Symptôme
Warning React dans la console :
> "Encountered two children with the same key, '0xbf84a0dc...'"

### Cause racine identifiée
Plusieurs triples peuvent avoir le **même objet** (ex: "Turtle" avec "has totem" ET "embodies").
Le code utilise `totem.id` (object atomId) comme key, mais il faudrait utiliser `totem.tripleTermId`.

### Solution proposée
```typescript
// AVANT (BUG) - ligne 452
key={totem.id || `best-${index}`}

// APRÈS (FIX)
key={totem.tripleTermId || `best-${index}`}
```

### Fichiers concernés
- `apps/web/src/components/founder/FounderCenterPanel.tsx` (ligne 452)

---

## 13. ERREUR VIDE DANS useBatchVote

### Symptôme
La console affiche `[useBatchVote] Error:` suivi de rien (objet vide).

### Cause racine
Le logging suppose que `err.message` existe toujours, mais certaines erreurs peuvent être des objets sans `message`.

### Solution proposée
```typescript
// AVANT (BUG) - ligne 656
console.error('[useBatchVote] Error:', err);

// APRÈS (FIX)
console.error('[useBatchVote] Error:', err);
console.error('[useBatchVote] Error details:', {
  message: (err as Error)?.message,
  name: (err as Error)?.name,
  stack: (err as Error)?.stack,
  raw: JSON.stringify(err, null, 2),
});
```

### Fichiers concernés
- `apps/web/src/hooks/blockchain/useBatchVote.ts` (ligne 656)

---

## Ordre de priorité recommandé

1. **#9** - WITHDRAW bloqué (critique pour UX)
2. **#10** - Trading Chart inversé (confusing pour users)
3. **#11** - My Votes dupliqués (bug visuel majeur)
4. **#12** - Duplicate React keys (warning console)
5. **#13** - Erreur vide (debug)

---

## ✅ STATUT DES BUGS DU 9 DÉCEMBRE

| # | Bug | Statut | Notes |
|---|-----|--------|-------|
| 9 | WITHDRAW bloqué | ✅ CORRIGÉ | `currentPosition` déjà passé à `addItem()` |
| 10 | Trading Chart inversé | ✅ VÉRIFIÉ | Code correct (`triple_positive` = FOR vert) |
| 11 | My Votes dupliqués | 🟡 À INVESTIGUER | Peut-être lié au `cache-and-network` fetch policy |
| 12 | Duplicate React keys | ✅ CORRIGÉ | Utilise `tripleTermId` au lieu de `totem.id` |
| 13 | Erreur vide | ✅ CORRIGÉ | Logging amélioré + support `shortMessage` |

---

**Document mis à jour** : 9 décembre 2025
**Statut** : 4/5 bugs corrigés, 1 à investiguer

---

# NOUVEAUX BUGS - 10 décembre 2025

## Résumé des 3 problèmes identifiés et corrigés

| # | Problème | Cause racine | Statut |
|---|----------|--------------|--------|
| 14 | Tooltip TopTotemsRadar masque les données | Position fixe au survol | ✅ CORRIGÉ |
| 15 | Click uniquement sur labels radar | Pas de handler sur les dots | ✅ CORRIGÉ |
| 16 | Outline blanc au focus | CSS focus par défaut | ✅ CORRIGÉ |

---

## 14. TOOLTIP MASQUE LES DONNÉES

### Symptôme
Au survol d'un totem dans le radar, le tooltip apparaissait à une position fixe et masquait souvent les données qu'on essayait de voir.

### Solution implémentée
**Positionnement dynamique par quadrant** : Le tooltip se place maintenant dans le coin opposé à la position du curseur.

```typescript
const isLeft = mouseX < cx;
const isTop = mouseY < cy;

// Si curseur en haut à gauche → tooltip en bas à droite
const positionStyle = {
  ...(isTop ? { bottom: 8 } : { top: 8 }),
  ...(isLeft ? { right: 8 } : { left: 8 }),
};
```

### Fichier modifié
- `apps/web/src/components/graph/TopTotemsRadar.tsx`

---

## 15. CLICK UNIQUEMENT SUR LABELS RADAR

### Symptôme
Pour sélectionner un totem et voir son graphique trading, il fallait cliquer sur le texte du label. Cliquer sur les points colorés (bleu/orange) ne faisait rien.

### Solution implémentée
Ajout des props `dot` et `activeDot` sur les composants `<Radar>` avec handler `onClick` :

```typescript
<Radar
  name="FOR"
  dataKey="for"
  dot={{ r: 4, cursor: 'pointer' }}
  activeDot={{ onClick: handleRadarClick }}
/>
```

### Fichier modifié
- `apps/web/src/components/graph/TopTotemsRadar.tsx`

---

## 16. OUTLINE BLANC AU FOCUS

### Symptôme
Quand on cliquait dans le conteneur du radar ou sur un point, un cadre blanc (outline CSS) apparaissait autour du conteneur. Effet indésirable visuellement.

### Solution implémentée
Suppression de l'outline via Tailwind et attributs HTML :

```tsx
<div
  className="... outline-none focus:outline-none **:outline-none"
  tabIndex={-1}
>
  <RadarChart style={{ outline: 'none' }} ... />
</div>
```

- `**:outline-none` - syntaxe Tailwind pour tous les descendants
- `tabIndex={-1}` - empêche le focus clavier

### Fichier modifié
- `apps/web/src/components/graph/TopTotemsRadar.tsx`

---

**Document mis à jour** : 10 décembre 2025
**Statut** : 3/3 bugs corrigés
