# Correction des Issues - Mécanisme d'Agrégation

**Date** : 21 novembre 2025
**Auteur** : Claude + Paul
**Contexte** : Audit de documentation suite à la découverte du mécanisme d'agrégation INTUITION v2

---

## 📋 Résumé Exécutif

Suite à l'audit de la documentation, nous avons découvert que certaines **issues GitHub** contiennent des instructions **incorrectes** qui ne correspondent pas au fonctionnement réel du protocole INTUITION v2.

**Problème principal** : Les issues demandent de filtrer les queries GraphQL par un prédicat spécifique (`has_totem`), alors qu'il faut récupérer **tous les triples** pour permettre l'agrégation client-side.

---

## 🔍 Découverte Initiale

### Ce qui a déclenché l'audit

1. **Conversation précédente** : Discussion sur le mécanisme de vote INTUITION v2
2. **Recherche dans le SDK** : Analyse du code source `@0xintuition/sdk@2.0.0-alpha.4`
3. **Découverte clé** : La fonction `calculateTripleId()` prouve que chaque triple est unique

```typescript
// Preuve : Chaque triple a un ID unique basé sur les 3 composants
function calculateTripleId(subjectAtomData, predicateAtomData, objectAtomData) {
  const salt = keccak256(toHex("TRIPLE_SALT"));
  return keccak256(
    encodePacked(
      ["bytes32", "bytes32", "bytes32", "bytes32"],
      [salt, subjectAtomData, predicateAtomData, objectAtomData]
    )
  );
}
```

**Conséquence** : Chaque triple a ses propres vaults (FOR et AGAINST). Pas d'agrégation automatique.

### Documentation créée

- ✅ [Vote_Aggregation_Research.md](Claude/03_TECHNOLOGIES/Vote_Aggregation_Research.md) - Recherche complète
- ✅ [Pages_Architecture.md](Claude/05_UX_FLOW/Pages_Architecture.md) - Architecture UX mise à jour
- ✅ [02_Propositions.md](Claude/02_FONCTIONNEMENT/02_Propositions.md) - Queries corrigées
- ✅ [04_Resultats.md](Claude/02_FONCTIONNEMENT/04_Resultats.md) - Fonction d'agrégation
- ✅ [Objectif.md](Claude/01_OBJECTIF/Objectif.md) - Vision mise à jour
- ✅ [IMPLEMENTATION_STATUS.md](Claude/03_TECHNOLOGIES/IMPLEMENTATION_STATUS.md) - Section agrégation
- ✅ [INTUITION_Protocol.md](Claude/03_TECHNOLOGIES/INTUITION_Protocol.md) - Note d'avertissement
- ✅ [Schema_GraphQL.md](Claude/05_STRUCTURE_DONNEES/Schema_GraphQL.md) - Note sur queries

---

## ❌ Problèmes Identifiés dans les Issues

### Issue #38 - Hook useVote (OPEN → EN COURS)

**Status** : ✅ IMPLÉMENTÉ (PR à créer)
**Problème** : Aucun - Implémentation correcte

**Code implémenté** :
- ✅ Hook `useVote.ts` créé avec gestion complète du flow approve + deposit
- ✅ Utilise `batchDepositStatement` du SDK INTUITION
- ✅ Gestion des états (checking, approving, depositing, success, error)
- ✅ Notifications toast avec progression (Step 1/2 ou 1/3)
- ✅ Gestion erreurs (insufficient balance, user rejection, gas)
- ✅ Intégration dans `VoteModal.tsx` avec UI complète
- ✅ Fix critique : Chain ID changé de Base Mainnet (8453) vers INTUITION L3 Testnet (13579)

**Gravité** : ✅ Correct (pas de problème)

**Action décidée** :
- ✅ Issue #38 peut être fermée après merge du PR
- ✅ Branch `feature/38-use-vote-hook` prête pour PR

---

### Issue #27 - ProposalModal (CLOSED)

**Status** : ✅ DONE (code mergé #94)
**Problème** : Divergence entre l'issue et le code implémenté

| Issue #27 | Code réel mergé |
|-----------|-----------------|
| Parle de "type de totem" (Objet/Animal/Trait/Univers) | Utilise des "prédicats" |
| Formulaire avec type selector | Dropdown prédicat + object input |
| Pas de mention des prédicats | Liste de 4 prédicats par défaut |

**Gravité** : 🟡 Mineur (le code est meilleur que l'issue)

**Action décidée** :
- ❌ **NE PAS créer d'issue de fix** (le code est correct)
- ✅ Petit PR pour ajouter 3 prédicats manquants (`embodies`, `channels`, `resonates with`)
- ✅ Pas besoin de créer une issue pour ça

---

### Issue #33 - GraphQL Queries Propositions (OPEN)

**Status** : À FAIRE
**Problème** : Query hardcode le filtre par prédicat

**Code incorrect dans l'issue** :
```graphql
triples(
  where: {
    subject: { id: $founderId }
    predicate: { id: "has_totem" }  # ❌ PROBLÈME ICI
  }
)
```

**Pourquoi c'est incorrect** :
- Filtre uniquement les triples avec prédicat `has_totem`
- Ignore tous les autres prédicats (`embodies`, `channels`, etc.)
- Empêche l'agrégation correcte des votes
- Un totem peut avoir plusieurs claims avec différents prédicats

**Gravité** : 🔴 **CRITIQUE**

**Action décidée** :
- ✅ Ajouter un commentaire d'avertissement sur l'issue
- ✅ Fournir la query correcte (sans filtre prédicat)
- ✅ Référencer la documentation

---

### Issue #34 - GraphQL Queries (OPEN)

**Status** : À FAIRE
**Problème** : Identique à #33 (doublon)

**Action décidée** :
- ✅ Même commentaire que #33
- 💡 Possiblement fermer #34 comme doublon de #33

---

### Issue #43 - Page Results Globale (CLOSED ✅)

**Status** : ✅ IMPLÉMENTÉE et FERMÉE
**Problème** : Initialement manquait mention de l'agrégation

**Code implémenté** :
- ✅ Utilise `aggregateTriplesByObject()` from utils
- ✅ Affiche NET score correctement calculé
- ✅ Gère les claims multiples par totem
- ✅ Tri par NET score décroissant

**Gravité** : ✅ Résolu

**Fichiers** :
- `apps/web/src/pages/ResultsPage.tsx`
- `apps/web/src/hooks/useAllProposals.ts`

---

### Issue #44 - Page FounderDetails (CLOSED ✅)

**Status** : ✅ IMPLÉMENTÉE et FERMÉE
**Problème** : Initialement similaire à #43

**Code implémenté** :
- ✅ Utilise `aggregateTriplesByObject()` from utils
- ✅ Affiche totem gagnant avec agrégation correcte
- ✅ Liste tous les totems avec NET scores

**Fichiers** :
- `apps/web/src/pages/FounderDetailsPage.tsx`

---

### Issue #45 - Page TotemDetails (CLOSED ✅)

**Status** : ✅ IMPLÉMENTÉE et FERMÉE
**Problème** : Doit afficher les claims individuels avec leurs prédicats

**Code implémenté** :
- ✅ Affiche tous les claims pour un totem
- ✅ Montre les prédicats utilisés
- ✅ Calcul NET score correct

**Fichiers** :
- `apps/web/src/pages/TotemDetailsPage.tsx`

---

### Issue #46 - Backend GraphQL Stats (OPEN)

**Status** : À FAIRE
**Problème** : Query pour "totem gagnant" incorrecte

**Code incorrect dans l'issue** :
```graphql
# Demande de trier et prendre le top 1
Order by positiveVault totalAssets desc, limit 1
```

**Pourquoi c'est incorrect** :
- Prend uniquement le claim avec le plus de votes FOR
- N'agrège pas les claims pour un même totem
- Ignore les votes AGAINST
- Calcul du NET score non mentionné

**Gravité** : 🔴 **CRITIQUE**

**Action décidée** :
- ✅ Ajouter commentaire d'avertissement majeur
- ✅ Expliquer l'agrégation requise
- ✅ Fournir exemple de code correct

---

### Issue #47 - Export Résultats (OPEN)

**Status** : À FAIRE
**Problème** : Export doit inclure données agrégées

**Action décidée** :
- ✅ Ajouter commentaire sur format export
- ✅ Inclure NET score et nombre de claims

---

## ✅ Actions à Entreprendre

### 1. Fonction d'Agrégation - ✅ DÉJÀ IMPLÉMENTÉE

**Priorité** : 🟢 **COMPLÉTÉ**

**Fichier** : `apps/web/src/utils/aggregateVotes.ts`

**Status** : ✅ **EXISTE DÉJÀ ET EST TESTÉ**

**Fonctions implémentées** :
- ✅ `aggregateTriplesByObject(triples: Triple[]): AggregatedTotem[]` - Agrège les triples par objet (totem)
- ✅ `formatTrustAmount(amount: bigint, decimals?: number): string` - Formate les montants TRUST
- ✅ `getWinningTotem(totems: AggregatedTotem[]): AggregatedTotem | null` - Retourne le totem gagnant

**Tests** : ✅ **17 tests passent**
- ✅ Agrégation de claims multiples pour le même totem
- ✅ Gestion de plusieurs totems différents
- ✅ Gestion des NET scores négatifs
- ✅ Tri par NET score décroissant
- ✅ Formatage des montants TRUST
- ✅ Edge cases (empty arrays, zero values)

**Utilisation actuelle** :
- ✅ `hooks/useAllProposals.ts` - Agrège les propositions par fondateur
- ✅ `pages/FounderDetailsPage.tsx` - Affiche les totems d'un fondateur
- ✅ `hooks/useAllTotems.ts` - **Refactorisé** pour utiliser `aggregateTriplesByObject()`

**Découverte** :
La fonction d'agrégation a été créée lors d'une session précédente et est déjà complète avec tests. Pas besoin de créer d'issue #97.

**Actions complétées** :
- ✅ Refactorisé `useAllTotems.ts` pour utiliser `aggregateTriplesByObject` (21/11/2025)
- ✅ Éliminé la duplication de logique d'agrégation
- ✅ Ajouté interface `ExtendedClaim` avec alias `forVotes`/`againstVotes` pour compatibilité
- ✅ Conservé les champs spécifiques : `founder`, `topPredicate`
- ✅ Build TypeScript passant

---

### 2. Ajouter Commentaires sur Issues OPEN ✅

**Issues concernées** : #33, #34, #46, #47 (issues #43, #44, #45 déjà fermées)

**Status** : ✅ **COMPLÉTÉ** (21 novembre 2025)

**Commentaires ajoutés** :
- ✅ **Issue #33** : Explication complète du mécanisme d'agrégation + exemples de queries GraphQL correctes
- ✅ **Issue #34** : Note que c'est un doublon de #33 + référence au commentaire principal
- ✅ **Issue #46** : Explication pour les statistiques + correction de la query incorrecte + exemples d'agrégation
- ✅ **Issue #47** : Note sur architecture frontend-only + exemples d'export avec agrégation (JSON/CSV/NFT metadata)

**Liens vers les commentaires** :
- [Issue #33 - Commentaire](https://github.com/Dev-Moulin/intuition-founders-totem/issues/33#issuecomment-3563846837)
- [Issue #34 - Commentaire](https://github.com/Dev-Moulin/intuition-founders-totem/issues/34#issuecomment-3563848135)
- [Issue #46 - Commentaire](https://github.com/Dev-Moulin/intuition-founders-totem/issues/46#issuecomment-3563850143)
- [Issue #47 - Commentaire](https://github.com/Dev-Moulin/intuition-founders-totem/issues/47#issuecomment-3563852385)

**Template de commentaire** :

```markdown
⚠️ **MISE À JOUR CRITIQUE** (21 novembre 2025)

Suite à l'audit de documentation sur le mécanisme d'agrégation INTUITION v2, cette issue nécessite des **changements majeurs** :

## ❌ CE QUI NE DOIT PAS ÊTRE FAIT

```graphql
# INCORRECT - Ne pas filtrer par prédicat spécifique
triples(
  where: {
    subject: { id: $founderId }
    predicate: { id: "has_totem" }  # ❌ ENLEVER CETTE LIGNE
  }
)
```

## ✅ CE QUI DOIT ÊTRE FAIT

```graphql
# CORRECT - Récupérer tous les triples pour permettre l'agrégation
triples(
  where: {
    subject: { id: $founderId }
    # Pas de filtre sur prédicat !
  }
) {
  id
  predicate {
    id
    label  # ✅ OBLIGATOIRE
  }
  object {
    id
    label
    image
    description
  }
  positiveVault {
    totalAssets
  }
  negativeVault {
    totalAssets  # ✅ OBLIGATOIRE
  }
  deposits_aggregate {
    aggregate {
      count
    }
  }
  createdAt
  creator
}
```

## 📋 Nouvelle exigence : Agrégation client-side

Les utilisateurs peuvent créer des claims avec **différents prédicats** pour le même totem :
- `[Joseph Lubin] [is represented by] [Lion]`
- `[Joseph Lubin] [embodies] [Lion]`
- `[Joseph Lubin] [channels] [Lion]`

Pour déterminer le totem gagnant, il faut :
1. Récupérer **tous** les triples (sans filtrer par prédicat)
2. **Agréger** les claims par `object.id` (totem)
3. Calculer le **NET score** de chaque claim : `positiveVault.totalAssets - negativeVault.totalAssets`
4. **Sommer** les NET scores de tous les claims pour un même totem

## 🔗 Documentation

- [Vote_Aggregation_Research.md](../Claude/03_TECHNOLOGIES/Vote_Aggregation_Research.md) - Recherche complète
- [02_Propositions.md](../Claude/02_FONCTIONNEMENT/02_Propositions.md#L177-L213) - Queries corrigées
- [04_Resultats.md](../Claude/02_FONCTIONNEMENT/04_Resultats.md#L298-L463) - Fonction d'agrégation

## ⚠️ Dépendance nouvelle

Cette issue dépend maintenant de l'issue **#97** (fonction d'agrégation) qui doit être créée.
```

**Status** : ❌ À faire

---

### 3. Petit PR pour ProposalModal

**Fichier** : `apps/web/src/components/ProposalModal.tsx`

**Changement** :
```typescript
// Ligne 24-30
const DEFAULT_PREDICATES = [
  'is represented by',
  'has totem',
  'is symbolized by',
  'is associated with',
  'embodies',        // ➕ Ajouter
  'channels',        // ➕ Ajouter
  'resonates with',  // ➕ Ajouter
];
```

**Commit message** :
```
feat: add 3 suggested predicates to ProposalModal

Add missing predicate examples to align with documentation:
- "embodies"
- "channels"
- "resonates with"

Users remain free to create any custom predicate.

Reference: Claude/03_TECHNOLOGIES/Vote_Aggregation_Research.md
```

**Status** : ❌ À faire

---

## 📊 Récapitulatif

| Action | Nombre | Status | Priorité |
|--------|--------|--------|----------|
| **Fonction d'agrégation** | 1 | ✅ Existe déjà | ~~P0~~ |
| **Issues fermées (grâce à l'agrégation)** | 3 | ✅ #43, #44, #45 | - |
| **Issues toujours ouvertes** | 4 | ⏳ #33, #34, #46, #47 | P1 |
| **Commentaires ajoutés sur issues** | 4 | ✅ Fait (21/11/2025) | ~~P1~~ |
| **Refactor useAllTotems** | 1 | ✅ Fait (21/11/2025) | ~~P2~~ |
| **Documentation mise à jour** | 8 | ✅ Fait | - |

---

## 🎯 Ordre d'Exécution Recommandé

1. ✅ **Documentation mise à jour** (FAIT)
2. ✅ **Fonction d'agrégation** (EXISTE DÉJÀ - `apps/web/src/utils/aggregateVotes.ts`)
3. ✅ **Commentaires ajoutés** sur issues #33, #34, #46, #47 (FAIT - 21/11/2025)
4. ⏳ **PR ProposalModal** - Ajouter 3 prédicats (Optionnel P2)
5. ✅ **Fonction testée** - 17 tests passants (FAIT)
6. 🔄 **Issues #33/#34** - À implémenter avec agrégation (queries GraphQL)
7. 🔄 **Issues #46/#47** - À implémenter avec agrégation (stats + export)

---

## 📝 Notes Importantes

### Pourquoi on fait ça ?

1. **Éviter les bugs** : Sans agrégation, le totem gagnant serait calculé incorrectement
2. **Respecter le protocole** : INTUITION v2 ne fait pas d'agrégation automatique
3. **Flexibilité** : Les users peuvent créer n'importe quel prédicat
4. **Auto-régulation** : Les votes AGAINST permettent de contrer les bad claims

### Ce qui aurait pu se passer sans correction

**Scénario problématique** :
```
Situation réelle :
- Claim 1 : [Joseph] [is represented by] [Lion] → 50 TRUST FOR
- Claim 2 : [Joseph] [embodies] [Lion] → 30 TRUST FOR
- Claim 3 : [Joseph] [has totem] [Phoenix] → 60 TRUST FOR

Avec le code incorrect (filtre has_totem) :
→ Phoenix gagne avec 60 TRUST ❌

Avec le code correct (agrégation) :
→ Lion gagne avec 80 TRUST (50+30) ✅
```

### Leçons apprises

1. **Toujours vérifier les assumptions** : Ce qui semble logique peut être faux
2. **Lire le code source** : La meilleure documentation est le code
3. **Documenter les découvertes** : Ce fichier servira de référence
4. **Traçabilité** : Garder une trace du "pourquoi" des changements

---

## 🔗 Références

- [Vote_Aggregation_Research.md](Claude/03_TECHNOLOGIES/Vote_Aggregation_Research.md)
- [INTUITION SDK v2.0.0-alpha.4](https://github.com/0xIntuition/intuition-ts/tree/main/packages/sdk)
- [INTUITION Docs](https://docs.intuition.systems/)

---

**Dernière mise à jour** : 21 novembre 2025
**Révision** : Découverte que la fonction d'agrégation existe déjà (`apps/web/src/utils/aggregateVotes.ts`) avec 17 tests passants. Pas besoin de créer l'issue #97.
