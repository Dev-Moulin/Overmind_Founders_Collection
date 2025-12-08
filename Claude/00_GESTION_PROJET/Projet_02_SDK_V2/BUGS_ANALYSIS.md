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

**Document créé** : 8 décembre 2025
**Statut** : En attente de validation pour commencer les corrections
