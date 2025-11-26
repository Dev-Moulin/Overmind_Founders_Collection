# Gestion de Projet

Ce dossier contient tous les fichiers de suivi et de gestion du projet.

**⚠️ IMPORTANT** : Ce README doit être lu impérativement après chaque compression/résumé de conversation.

---

## 🚨 RÈGLES CRITIQUES - Git/GitHub Workflow

### ❌ INTERDICTIONS ABSOLUES

1. **JE NE DOIS JAMAIS** créer de Pull Request
2. **JE NE DOIS JAMAIS** marquer que c'est moi qui ai rédigé un commit
   - ❌ Pas de "Generated with Claude Code"
   - ❌ Pas de "Co-Authored-By: Claude"
3. **JE NE DOIS JAMAIS** push directement sur `main`

### ✅ CE QUE JE PEUX FAIRE

1. **Je PEUX** push sur des **branches** (jamais sur main directement)
2. **Je DOIS** créer une **nouvelle branche** pour chaque :
   - Feature
   - Fix
   - Refactor
   - Documentation
   - Toute modification

### 👤 VALIDATION

**PAUL ET PAUL SEUL** valide les Pull Requests.

### 📝 Workflow Git Correct

```bash
# 1. Créer une nouvelle branche
git checkout -b feature/nom-descriptif

# 2. Faire les modifications et commits
git add fichiers
git commit -m "description claire"

# 3. Push sur la branche
git push origin feature/nom-descriptif

# 4. ATTENDRE que Paul valide la PR (ne pas la créer)
```

---

## 🔄 RÈGLES - Synchronisation Issues GitHub

### À chaque mise à jour de ISSUES_GITHUB.md

1. **Vérifier la synchronisation avec GitHub** :
   ```bash
   gh issue list --state open --limit 50
   ```
   - Les issues OPEN dans la doc doivent correspondre à celles sur GitHub
   - Les issues CLOSED dans la doc doivent être fermées sur GitHub

2. **Vérifier la cohérence feature/issue** :
   - Avant de fermer une issue, **confirmer que la feature est réellement implémentée**
   - Ne pas fermer une issue en disant "essentiellement fait" ou "partiellement implémenté"
   - Si le code existe → vérifier qu'il correspond bien à ce que demande l'issue

3. **Processus de fermeture d'issue** :
   - ✅ Lire le contenu de l'issue sur GitHub
   - ✅ Vérifier que le code implémente bien TOUT ce qui est demandé
   - ✅ Fermer sur GitHub avec un commentaire référençant le commit/PR
   - ✅ Mettre à jour ISSUES_GITHUB.md avec les détails (fichiers créés, hooks ajoutés, etc.)

4. **Ne jamais** :
   - ❌ Fermer une issue sans avoir vérifié le code
   - ❌ Supposer qu'une issue est faite sans vérification
   - ❌ Fermer une issue partiellement implémentée

5. **Après compression/résumé de conversation** :
   - ✅ Relire ce README en priorité
   - ✅ Vérifier les issues fermées récemment avec `gh issue view #XX`
   - ✅ Si une issue a été fermée incorrectement :
     - Rouvrir avec `gh issue reopen #XX`
     - Documenter ce qui manque dans ISSUES_GITHUB.md
     - Discuter avec Paul avant d'implémenter

---

## 📂 Structure

```
Claude/
├── 00_GESTION_PROJET/
│   ├── Projet00/                            # Gestion de projet (source de vérité)
│   │   ├── issues/
│   │   │   └── ISSUES_GITHUB.md            # Liste complète des issues GitHub
│   │   ├── corrections/
│   │   │   └── CORRECTION_ISSUES_AGGREGATION.md
│   │   └── modifications/
│   │       ├── MODIFICATIONS_EN_COURS.md
│   │       └── ARCHITECTURE_NO_BACKEND.md
│   ├── documentation/                       # Documentation corrigée et à jour
│   │   ├── AUDIT_DOCUMENTATION.md          # Tracker de l'audit
│   │   ├── fonctionnement/
│   │   │   ├── 02_Propositions.md
│   │   │   ├── 04_Resultats.md
│   │   │   └── 05_Vote.md
│   │   ├── technologies/
│   │   │   ├── INTUITION_SDK.md
│   │   │   ├── Categories_Triples_OFC.md     # 🆕 Architecture catégories via triples
│   │   │   ├── Stack_Frontend.md
│   │   │   ├── Testnet_Configuration.md
│   │   │   └── Vote_Aggregation_Research.md
│   │   ├── structure_donnees/
│   │   │   ├── Bonding_Curves.md
│   │   │   └── Schema_GraphQL.md
│   │   ├── ux_flow/
│   │   │   ├── INDEX_PAGES.md
│   │   │   ├── V2_FONDATION.md             # 🆕 Architecture V2 - HomePage interactive
│   │   │   └── pages/
│   │   │       ├── 00_PATTERNS_COMMUNS.md
│   │   │       ├── 01_HomePage.md
│   │   │       ├── 02_ProposePage.md
│   │   │       ├── 03_VotePage.md
│   │   │       ├── 04_FounderDetailsPage.md
│   │   │       ├── 05_TotemDetailsPage.md
│   │   │       ├── 06_MyVotesPage.md
│   │   │       ├── 07_ResultsPage.md
│   │   │       ├── 08_NotFoundPage.md
│   │   │       └── 09_AdminAuditPage.md
│   │   ├── securite/
│   │   │   └── Frontend_Security.md
│   │   ├── ux_ui/
│   │   │   └── Design_System.md
│   │   ├── gestion_erreurs/
│   │   │   └── Frontend_Error_Handling.md
│   │   ├── objectif/
│   │   │   └── Objectif.md
│   │   └── donnees/
│   │       ├── Verification_Builders.md
│   │       └── Totems_Fondateurs.md
│   ├── Projet_01_VotePanel_V2/              # 🆕 VotePanel V2 - HomePage interactive
│   │   ├── 01_ARCHITECTURE.md
│   │   ├── 02_ETAT_IMPLEMENTATION.md
│   │   ├── 03_RECHERCHES.md
│   │   ├── 04_RECHERCHES_APPROFONDIES.md
│   │   ├── 05_FIX_ACTUALISATION_VOTES.md   # 🆕 Fix useEffect cleanup bug
│   │   ├── README.md
│   │   └── TODO_Synchronisation_et_UX.md
│   └── README.md                            # Ce fichier
└── trash/                                   # Documentation obsolète (19 fichiers)
```

## 📋 Fichiers

### Gestion de Projet (Projet00/)

#### Issues
- **[Projet00/issues/ISSUES_GITHUB.md](./Projet00/issues/ISSUES_GITHUB.md)** : Liste exhaustive des issues du projet avec leur statut

#### Corrections
- **[Projet00/corrections/CORRECTION_ISSUES_AGGREGATION.md](./Projet00/corrections/CORRECTION_ISSUES_AGGREGATION.md)** : Documentation détaillée de la correction du mécanisme d'agrégation INTUITION v2

#### Modifications
- **[Projet00/modifications/MODIFICATIONS_EN_COURS.md](./Projet00/modifications/MODIFICATIONS_EN_COURS.md)** : Tracker central de toutes les modifications en cours et à venir
- **[Projet00/modifications/ARCHITECTURE_NO_BACKEND.md](./Projet00/modifications/ARCHITECTURE_NO_BACKEND.md)** : Décision architecture frontend-only (pas de serveur backend)

### Documentation (Corrigée et à jour)

#### Audit
- **[documentation/AUDIT_DOCUMENTATION.md](./documentation/AUDIT_DOCUMENTATION.md)** : Tracker de l'audit de la documentation (4/4 fichiers traités ✅)

#### Fonctionnement
- **[documentation/fonctionnement/02_Propositions.md](./documentation/fonctionnement/02_Propositions.md)** : Processus de proposition de totems (CORRIGÉ - SDK INTUITION, frontend-only)
- **[documentation/fonctionnement/04_Resultats.md](./documentation/fonctionnement/04_Resultats.md)** : Affichage des résultats avec agrégation (RÉÉCRIT - méthode correcte d'agrégation)
- **[documentation/fonctionnement/05_Vote.md](./documentation/fonctionnement/05_Vote.md)** : Processus de vote (CORRIGÉ - agrégation, FOR/AGAINST, hook useVote)

## 🔄 Workflow

1. **Identifier** une modification → Ajouter dans `MODIFICATIONS_EN_COURS.md`
2. **Documenter** en détail → Créer un fichier dans `corrections/` si complexe
3. **Tracer** les issues GitHub → Référencer dans `ISSUES_GITHUB.md`
4. **Archiver** quand terminé

## 📚 Documentation Projet

Ce dossier (`Claude/00_GESTION_PROJET/`) est la **source de vérité**.

**Audit complet effectué le 24 novembre 2025** :
- 14 dossiers audités
- 22 fichiers traités
- 14 fichiers conservés/corrigés dans `documentation/`
- 19 fichiers obsolètes déplacés vers `trash/`

La documentation à jour se trouve dans :
- `documentation/objectif/` - Objectifs du projet
- `documentation/fonctionnement/` - Processus (propositions, votes, résultats)
- `documentation/technologies/` - Stack technique (SDK INTUITION, GraphQL)
- `documentation/structure_donnees/` - Schémas de données
- `documentation/ux_flow/` - Architecture des pages + **V2_FONDATION** (nouvelle architecture)
- `documentation/securite/` - Sécurité frontend
- `documentation/ux_ui/` - Design system
- `documentation/gestion_erreurs/` - Gestion erreurs frontend
- `documentation/donnees/` - Données fondateurs et totems

**Note** : Les anciens dossiers (`01_OBJECTIF/`, `02_FONCTIONNEMENT/`, etc.) ont été supprimés. Toute la documentation à jour est dans `documentation/`.

---

## 🆕 V2_FONDATION - Nouvelle Architecture

**Document** : [documentation/ux_flow/V2_FONDATION.md](./documentation/ux_flow/V2_FONDATION.md)

### Résumé

Transformation de la HomePage en interface **single-page interactive** :
- Click sur une card → animation flip + agrandissement
- Layout split : card à gauche (1/4) + vote panel à droite (3/4)
- **Zero backend** : catégories stockées dans la description des atoms (`"Catégorie: Animal"`)
- **Prédicats fixes** : 6 prédicats prédéfinis, pas de création par user
- **URL persistance** : `?founder=joseph-lubin` pour partage direct

### Décisions UX validées
- Fermeture : click ailleurs + bouton × + Escape
- Mobile : layout vertical
- URL param pour persistance

### Statut
- [x] Documentation complète
- [ ] Implémentation en cours

---

**Dernière mise à jour** : 26 novembre 2025