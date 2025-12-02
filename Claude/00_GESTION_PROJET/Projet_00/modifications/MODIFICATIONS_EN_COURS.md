# Modifications en Cours - Tracker Central

**Dernière mise à jour** : 26 novembre 2025
**Objectif** : Centraliser toutes les modifications identifiées qui nécessitent une action ou une discussion

---

## 📊 Vue d'Ensemble

| Sujet | Priorité | Status | Date | Fichier Détails |
|-------|----------|--------|------|-----------------|
| Agrégation des votes | 🔴 P0 | ✅ Fonction existe | 21/11/2025 | [CORRECTION_ISSUES_AGGREGATION.md](../corrections/CORRECTION_ISSUES_AGGREGATION.md) |
| Architecture simplifiée (pas de backend) | 🔴 P0 | ✅ Fait | 21/11/2025 | [ARCHITECTURE_NO_BACKEND.md](./ARCHITECTURE_NO_BACKEND.md) |
| Hook useVote (Issue #38) | 🔴 P0 | ✅ Fait (PR #118) | 21/11/2025 | Mergé dans main |
| **Catégories via Triples OFC:** | 🟡 P1 | ✅ Code fait | 26/11/2025 | [Categories_Triples_OFC.md](../../documentation/technologies/Categories_Triples_OFC.md) |
| Autres modifications | ⚪ À définir | ⏳ À discuter | 21/11/2025 | Ce fichier |

---

## 1️⃣ Agrégation des Votes (P0)

**Status** : ✅ Fonction existe déjà - 🟡 Documentation à jour

### Résumé
Correction du mécanisme d'agrégation des votes suite à la découverte que le protocole INTUITION v2 ne fait pas d'agrégation automatique par objet.

**Découverte importante** : La fonction d'agrégation `aggregateTriplesByObject()` **existe déjà** dans `apps/web/src/utils/aggregateVotes.ts` avec 17 tests passants!

### Actions concrètes
- [x] ✅ Fonction d'agrégation créée et testée
- [x] ✅ `aggregateTriplesByObject()` - Agrège les triples par objet
- [x] ✅ `getWinningTotem()` - Retourne le totem gagnant
- [x] ✅ `formatTrustAmount()` - Formate les montants TRUST
- [x] ✅ 17 tests unitaires passants
- [x] ✅ Utilisé par `useAllProposals` et `FounderDetailsPage`
- [x] ✅ Commentaires ajoutés sur issues #33, #34, #46, #47 (21/11/2025)
- [x] ✅ Refactorisé `useAllTotems` pour utiliser la fonction utils (21/11/2025)
- [ ] ⏳ Optionnel: PR pour ajouter 3 prédicats dans ProposalModal

### Fichier implémenté
📄 `apps/web/src/utils/aggregateVotes.ts` (162 lignes)
📄 `apps/web/src/utils/aggregateVotes.test.ts` (273 lignes, 17 tests)

### Documentation complète
👉 Voir [CORRECTION_ISSUES_AGGREGATION.md](../corrections/CORRECTION_ISSUES_AGGREGATION.md)

---

## 2️⃣ Architecture Simplifiée - Pas de Backend (P0)

**Status** : ✅ Complété

### Résumé
Décision de ne pas implémenter de serveur backend. Toute la logique passe par le frontend avec interactions blockchain directes.

### Actions concrètes
- [x] ✅ Créer documentation ARCHITECTURE_NO_BACKEND.md
- [x] ✅ Créer issue #96 - Hook useWhitelist (vérification on-chain)
- [x] ✅ Créer issue #97 - Cache local (localStorage)
- [x] ✅ Annuler issue #100 - IPFS (SDK INTUITION gère déjà)
- [x] ✅ Fermer 10 issues backend (#51-57, #62-64)
- [x] ✅ Mettre à jour ISSUES_GITHUB.md

### Résultat
- **Économies** : ~$7/mois (Render hosting)
- **Complexité** : -50% (1 codebase au lieu de 2)
- **Sécurité** : Vérification trustless on-chain
- **Issues** : 69 au lieu de 74 (5 de moins au net)

### Documentation complète
👉 Voir [ARCHITECTURE_NO_BACKEND.md](./ARCHITECTURE_NO_BACKEND.md)

---

## 3️⃣ Hook useVote - Issue #38 (P0)

**Status** : ✅ Complété

**Date de finalisation** : 21 novembre 2025

### Résumé
Implémentation du hook `useVote` pour gérer le processus complet de vote (approve + deposit TRUST tokens).

### Problème résolu (CRITIQUE)
Lors de l'implémentation, découverte d'une **erreur critique** :
- ❌ **Avant** : `useIntuition.ts` et `useVote.ts` utilisaient Base Mainnet (chain ID 8453)
- ✅ **Après** : Utilisation correcte de INTUITION L3 Testnet (chain ID 13579)

**Erreur** : `"Contract MultiVault not found for chain ID 8453"`

**Cause** : Le SDK INTUITION n'a pas de contrats déployés sur Base Mainnet, seulement sur INTUITION L3 Testnet.

### Code implémenté
1. **Hook `useVote.ts`** :
   - Gestion états : `idle` → `checking` → `approving` → `depositing` → `success`/`error`
   - Vérification allowance ERC-20 (TRUST token)
   - Approval automatique si nécessaire
   - Deposit via `batchDepositStatement` du SDK
   - Gestion erreurs complète (user rejection, insufficient balance, gas)
   - Toast notifications avec progression (Step 1/2 ou 1/3)

2. **VoteModal.tsx refactorisé** :
   - Intégration du hook `useVote`
   - Suppression prop `onSubmit` (logique dans le hook)
   - UI avec progress bar et statuts visuels
   - Fermeture automatique après succès

3. **VotePage.tsx mis à jour** :
   - Suppression fonction `handleVoteSubmit` (plus nécessaire)

4. **Fix critique chain ID** :
   - `useIntuition.ts` : `base.id` → `intuitionTestnet.id`
   - `useVote.ts` : `base.id` → `intuitionTestnet.id`

### Actions concrètes
- [x] ✅ Installer `sonner` pour toasts
- [x] ✅ Créer hook `useVote.ts`
- [x] ✅ Exporter dans `hooks/index.ts`
- [x] ✅ Refactorer `VoteModal.tsx`
- [x] ✅ Mettre à jour `VotePage.tsx`
- [x] ✅ Fixer chain ID dans `useIntuition.ts`
- [x] ✅ Fixer chain ID dans `useVote.ts`
- [x] ✅ Build passing
- [x] ✅ Mettre à jour documentation

### Fichiers modifiés
- `apps/web/package.json` (ajout sonner)
- `apps/web/src/hooks/useVote.ts` (créé)
- `apps/web/src/hooks/index.ts` (export)
- `apps/web/src/hooks/useIntuition.ts` (fix chain ID)
- `apps/web/src/components/VoteModal.tsx` (refactorisé)
- `apps/web/src/pages/VotePage.tsx` (simplifié)

### Branch
`feature/38-use-vote-hook`

### Prochaine étape
- [ ] Créer Pull Request
- [ ] Merger après review
- [ ] Fermer issue #38

### Notes techniques
**TODO temporaire** : Le hook utilise `as any` pour `batchDepositStatement` car la signature TypeScript du SDK semble incorrecte. À tester avec une vraie transaction pour confirmer les bons paramètres.

---

## 4️⃣ Catégories via Triples OFC: (P1)

**Date de découverte** : 26 novembre 2025
**Priorité** : 🟡 P1
**Status** : ✅ Code implémenté - ⏳ Test on-chain à faire

### Contexte
Le champ `description` des atoms n'est **pas disponible dans les subscriptions WebSocket** d'INTUITION. L'ancienne méthode (stocker la catégorie dans `description`) ne fonctionne qu'en HTTP.

### Problème actuel
- ❌ WebSocket subscription échoue : `field 'description' not found in type: 'atoms'`
- ❌ Pas de mise à jour temps réel des catégories
- ✅ HTTP fonctionne mais pas de real-time

### Solution adoptée
Utiliser des **triples** pour stocker la catégorie :
```
Triple 1: [Founder] [represented_by] [Totem]     → Vote principal
Triple 2: [Totem] [has_category] [OFC:Animal]    → Catégorie
```

Nomenclature : **OFC:** = Overmind Founders Collection

### Impact
- **Code** : `useIntuition.ts`, `VotePanel.tsx`, `subscriptions.ts`, `queries.ts`
- **Coût** : 2x triple_cost par nouveau totem (au lieu de 1)
- **Avantage** : WebSocket compatible, filtrage temps réel

### Actions concrètes
- [x] ✅ Documenter l'architecture (Categories_Triples_OFC.md)
- [x] ✅ Créer `categories.json` avec la config des atoms OFC:
- [ ] ⏳ Créer les atoms on-chain (has_category + OFC:*) - À FAIRE AU PREMIER USAGE
- [x] ✅ Modifier `useIntuition.ts` - `createClaimWithCategory()` créé
- [x] ✅ Ajouter subscription `SUBSCRIBE_TOTEM_CATEGORIES`
- [x] ✅ Ajouter queries HTTP (`GET_TOTEM_CATEGORY`, `GET_CATEGORIES_BY_TOTEMS`, etc.)
- [x] ✅ Mettre à jour `VotePanel.tsx` - utilise `createClaimWithCategory`
- [x] ✅ Fallback rétrocompatibilité (description field en HTTP)
- [ ] ⏳ Tester le flow complet on-chain

### Fichiers implémentés
| Fichier | Description |
|---------|-------------|
| `packages/shared/src/data/categories.json` | Config 6 catégories OFC: + prédicat has_category |
| `apps/web/src/hooks/useIntuition.ts` | `createClaimWithCategory()` - crée 2 triples |
| `apps/web/src/lib/graphql/subscriptions.ts` | `SUBSCRIBE_TOTEM_CATEGORIES`, `SUBSCRIBE_CATEGORIES_BY_TOTEMS` |
| `apps/web/src/lib/graphql/queries.ts` | `GET_TOTEM_CATEGORY`, `GET_CATEGORIES_BY_TOTEMS`, `GET_ALL_TOTEM_CATEGORIES`, `GET_TOTEMS_BY_CATEGORY` |
| `apps/web/src/components/VotePanel.tsx` | Sélecteur catégories depuis config, preview triple |

### Documentation complète
👉 Voir [Categories_Triples_OFC.md](../../documentation/technologies/Categories_Triples_OFC.md)

---

## 5️⃣ Autres Modifications À Discuter

**Status** : ⏳ À définir

### Notes
Paul a mentionné qu'il y a d'autres modifications dont il faut parler.

### Questions à clarifier
- [ ] Quelles modifications ?
- [ ] Sont-elles bloquantes pour l'agrégation ?
- [ ] Nécessitent-elles une documentation séparée ?

### Espace pour notes
```
[Réservé pour les prochaines discussions]




```

---

## 📝 Template pour Nouvelle Modification

Quand une nouvelle modification est identifiée, utiliser ce template :

```markdown
## X️⃣ [Titre de la Modification]

**Date de découverte** : JJ/MM/AAAA
**Priorité** : 🔴 P0 / 🟡 P1 / 🟢 P2 / ⚪ À définir
**Status** : ⏳ Identifié / 🟡 En cours / ✅ Fait / ❌ Bloqué

### Contexte
[Pourquoi cette modification est nécessaire]

### Problème actuel
[Décrit ce qui ne va pas ou ce qui manque]

### Impact
- **Code** : [Fichiers/composants concernés]
- **Issues** : [Numéros d'issues concernées]
- **Priorité** : [Pourquoi c'est urgent/important]

### Solution proposée
[Ce qu'on doit faire pour corriger]

### Actions concrètes
- [ ] Action 1
- [ ] Action 2
- [ ] Action 3

### Documentation
- [Lien vers doc détaillée si nécessaire]

### Notes
[Autres informations importantes]
```

---

## 🔄 Workflow de Gestion

### 1. Identification d'une modification
- Ajouter une nouvelle section avec le template ci-dessus
- Définir la priorité (P0, P1, P2)
- Documenter le "pourquoi"

### 2. Discussion
- Clarifier les questions
- Valider l'approche
- Définir les actions concrètes

### 3. Création de documentation détaillée (si nécessaire)
- Pour les modifications complexes, créer un fichier dédié
- Référencer ce fichier dans le tracker

### 4. Exécution
- Cocher les actions au fur et à mesure
- Mettre à jour le status

### 5. Clôture
- Marquer comme ✅ Fait
- Archiver si nécessaire

---

## 🗂️ Archives

Les modifications terminées seront déplacées ici pour garder le fichier propre.

### Modifications Complétées
_Aucune pour l'instant_

---

## 📎 Liens Utiles

- [ISSUES_GITHUB.md](./ISSUES_GITHUB.md) - Liste complète des issues
- [IMPLEMENTATION_STATUS.md](./03_TECHNOLOGIES/IMPLEMENTATION_STATUS.md) - État d'avancement
- [Vote_Aggregation_Research.md](./03_TECHNOLOGIES/Vote_Aggregation_Research.md) - Recherche agrégation

---

**Prochaine étape** : Discuter des "autres modifications" mentionnées par Paul
