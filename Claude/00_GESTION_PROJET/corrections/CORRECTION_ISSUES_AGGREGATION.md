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

### Issue #27 - ProposalModal (CLOSED)

**Status** : DONE (code mergé)
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

### Issue #43 - Page Results Globale (OPEN)

**Status** : À FAIRE
**Problème** : Mentionne "totem gagnant (max TRUST)" sans préciser l'agrégation

**Manque dans l'issue** :
- Pas de mention de l'agrégation client-side
- Pas de mention du NET score (FOR - AGAINST)
- Pas de mention des claims multiples

**Gravité** : 🟡 Moyen (incomplet mais pas faux)

**Action décidée** :
- ✅ Ajouter commentaire d'avertissement
- ✅ Expliquer l'agrégation nécessaire
- ✅ Référencer la fonction `aggregateTriplesByObject()`

---

### Issue #44 - Page FounderDetails (OPEN)

**Status** : À FAIRE
**Problème** : Similaire à #43

**Action décidée** :
- ✅ Ajouter commentaire d'avertissement
- ✅ Référencer documentation

---

### Issue #45 - Page TotemDetails (OPEN)

**Status** : À FAIRE
**Problème** : Doit afficher les claims individuels avec leurs prédicats

**Action décidée** :
- ✅ Ajouter commentaire expliquant l'affichage des claims multiples
- ✅ Référencer documentation

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

### 1. Créer Issue #97 - Fonction d'Agrégation

**Priorité** : 🔴 **P0 (Bloquant)**

**Titre** : `Utils: Créer fonction d'agrégation des votes par totem`

**Description** :
Créer une fonction utilitaire pour agréger les votes de plusieurs triples (claims) pointant vers le même objet (totem).

**Fichier** : `apps/web/src/utils/aggregateVotes.ts`

**Fonctions** :
- `aggregateTriplesByObject(triples: Triple[]): AggregatedTotem[]`
- `formatTrustAmount(amount: bigint): string`
- `getWinningTotem(totems: AggregatedTotem[]): AggregatedTotem`

**Tests** :
- Test avec 3 claims pour le même totem
- Test avec votes AGAINST
- Test avec NET score négatif

**Dépendances** : Utilisée par #33, #34, #43, #44, #45, #46

**Assigné** : À définir

**Status** : ❌ À créer

---

### 2. Ajouter Commentaires sur Issues OPEN

**Issues concernées** : #33, #34, #43, #44, #45, #46, #47

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
| **Issues à créer** | 1 | ❌ À faire | P0 |
| **Commentaires à ajouter** | 7 | ❌ À faire | P0 |
| **PR code** | 1 | ❌ À faire | P1 |
| **Documentation mise à jour** | 7 | ✅ Fait | - |

---

## 🎯 Ordre d'Exécution Recommandé

1. ✅ **Documentation mise à jour** (FAIT)
2. **Créer issue #97** - Fonction d'agrégation (BLOQUANT pour le reste)
3. **Ajouter commentaires** sur issues #33, #34, #43-47
4. **PR ProposalModal** - Ajouter 3 prédicats
5. **Coder issue #97** - Implémenter la fonction d'agrégation
6. **Coder issues #33/#34** - Queries GraphQL avec agrégation
7. **Coder issues #43-47** - Pages résultats avec agrégation

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
**Prochaine révision** : Après création de l'issue #97
