# 📋 INTUITION Founders Totem - Documentation Master

## 🎯 Vue d'ensemble du projet

Plateforme de vote collaborative pour définir les totems (objets, animaux, traits) représentant les 42 fondateurs d'INTUITION. Les totems gagnants seront transformés en NFTs 3D.

## 📅 Suivi du projet

**Date de début** : 17 novembre 2025
**Dernière mise à jour** : 19 novembre 2025
**Statut actuel** : 🚀 Développement en cours

### 📊 Bilan des issues GitHub

- **Total issues créées** : 70 issues (#1-70)
- **Issues ouvertes** : 50 issues (prêtes à coder)
- **Issues fermées** : 20 issues (recherches/documentation + développement terminé)

### ✅ Issues terminées (développement)

- **#18** : ✅ Créer fichier de données avec les 42 fondateurs (Done - 18/11/2025)
- **#19** : ✅ Setup wagmi + RainbowKit pour connexion wallet (Done - 19/11/2025)
- **#20** : ✅ Créer composant ConnectButton avec RainbowKit (Done - 19/11/2025)
- **#21** : ✅ Setup Tailwind CSS (Done - 19/11/2025)

### 🎯 Plan de démarrage recommandé

#### Phase 1 : Setup de base (Issues #18-24)
1. ✅ **#18** - Créer fichier de données avec les 42 fondateurs (Done)
2. ✅ **#19** - Setup wagmi + RainbowKit pour connexion wallet (Done)
3. ✅ **#20** - Créer composant ConnectButton avec RainbowKit (Done)
4. ✅ **#21** - Setup Tailwind CSS (Done)
5. **#22** - Créer composant Layout avec Header/Footer
6. **#23** - Créer composant NotEligible (message d'erreur)
7. **#24** - Créer composant FounderCard

#### Phase 2 : Backend (Issues #51-57)
8. **#51** - Setup Fastify project structure
9. **#52** - Configurer variables d'environnement et secrets
10. **#53** - Implémenter endpoint vérification whitelist
11. **#54** - Implémenter endpoint modération de contenu
12. **#55** - Implémenter endpoint upload image Pinata (optionnel)
13. **#56** - Configurer CORS et sécurité
14. **#57** - Déployer sur Render Free Tier

#### Phase 3 : Sécurité Frontend (Issues #58-61)
15. **#58** - Configurer DOMPurify pour sanitization XSS
16. **#59** - Configurer Content Security Policy (CSP)
17. **#60** - Implémenter validation Zod pour tous les formulaires
18. **#61** - Sécuriser authentification wallet (nonce + signature)

#### Phase 4 : Fonctionnalités principales (Issues #25-50)
- **Propositions** : #25-34 (10 issues)
- **Vote** : #35-42 (8 issues)
- **Résultats** : #43-47 (5 issues)
- **Pages manquantes** : #48-50 (3 issues)

#### Phase 5 : Tests (Issues #65-70)
19. **#65** - Setup Vitest et React Testing Library
20. **#66** - Écrire tests unitaires pour utils et composants
21. **#67** - Setup Playwright pour tests E2E
22. **#68** - Écrire tests E2E pour parcours utilisateur
23. **#69** - Configurer tests blockchain avec Anvil
24. **#70** - Configurer coverage et GitHub Actions CI/CD

### 🚀 Prochaine étape : Initialisation du projet en MONOREPO

**Architecture choisie** : Monorepo pnpm workspaces

**Avantages** :
- ✅ Partage des types TypeScript entre frontend/backend
- ✅ Une seule commande pour tout installer/lancer
- ✅ Versions synchronisées des dépendances
- ✅ CI/CD simplifié

**Structure** :
```
/
├── apps/
│   ├── web/          # Frontend (Vite + React + TS)
│   └── api/          # Backend (Fastify + TS)
├── packages/
│   └── shared/       # Types/utils partagés
├── package.json      # Root workspace
├── pnpm-workspace.yaml
└── Claude/           # Documentation
```

**Commandes d'initialisation** :
```bash
# 1. Setup monorepo root
pnpm init

# 2. Créer workspace config
echo "packages:\n  - 'apps/*'\n  - 'packages/*'" > pnpm-workspace.yaml

# 3. Créer apps/web (frontend)
pnpm create vite@latest apps/web -- --template react-ts

# 4. Créer apps/api (backend)
pnpm create fastify@latest apps/api

# 5. Créer packages/shared (types partagés)
mkdir -p packages/shared
cd packages/shared && pnpm init

# 6. Installer toutes les dépendances
pnpm install
```

## 📂 Structure de la documentation

### ✅ Terminé

#### [01_OBJECTIF](./01_OBJECTIF/)
- **Objectif.md** : But du projet, 42 fondateurs, phases
- **Issues créées** : #18
- **Statut** : ✅ Complet (documentation) | ✅ Issue #18 terminée
- **Dernière mise à jour** : 18/11/2025

#### [02_FONCTIONNEMENT](./02_FONCTIONNEMENT/)
- **01_Connexion.md** : Connexion wallet et vérification éligibilité
  - **Issues créées** : #19, #20, #21, #22, #23, #24
  - **Statut** : ✅ Complet (documentation) | ⏳ Issues créées (6 issues à coder)
- **02_Propositions.md** : Création d'Atoms et Triples
  - **Issues créées** : #25, #26, #27, #28, #29, #30, #31, #32, #33, #34
  - **Statut** : ✅ Complet (documentation) | ⏳ Issues créées (10 issues à coder)
- **05_Vote.md** : Système de vote avec $TRUST
  - **Issues créées** : #35, #36, #37, #38, #39, #40, #41, #42
  - **Statut** : ✅ Complet (documentation) | ⏳ Issues créées (8 issues à coder)
- **04_Resultats.md** : Affichage des résultats
  - **Issues créées** : #43, #44, #45, #46, #47
  - **Statut** : ✅ Complet (documentation) | ⏳ Issues créées (5 issues à coder)
- **Dernière mise à jour** : 18/11/2025

#### [03_TECHNOLOGIES](./03_TECHNOLOGIES/)
- **INTUITION_Protocol.md** : Atoms, Triples, Signals, SDK
- **Testnet_Configuration.md** : Base Sepolia, faucets, configuration
- **Stack_Frontend.md** : React, Vite, wagmi, RainbowKit, etc.
- **Statut** : ✅ Complet
- **Dernière mise à jour** : 17/11/2025

#### [04_VERIFICATION_WALLETS](./04_VERIFICATION_WALLETS/)
- **Verification_Wallets.md** : Questions pour INTUITION, options techniques
- **Statut** : ⏳ En attente de réponse INTUITION
- **Dernière mise à jour** : 17/11/2025

#### [05_STRUCTURE_DONNEES](./05_STRUCTURE_DONNEES/)
- **Schema_GraphQL.md** : Schéma complet, queries prêtes à l'emploi
- **Bonding_Curves.md** : Mécanisme de vault et retraits
- **Statut** : ✅ Complet
- **Dernière mise à jour** : 17/11/2025

#### [06_BACKEND](./06_BACKEND/) - ✅ Complet
**Objectif** : Documenter l'architecture backend nécessaire

**Points à couvrir** :
- [x] Recherche : Express vs Fastify vs tRPC
- [x] Coûts d'hébergement (Heroku, Railway, Render, Fly.io, Vercel, Netlify, DigitalOcean)
- [x] Architecture et endpoints
- [x] Décision : Fastify + Render Free Tier ($0/mois)
- [x] Plan de migration si croissance

**Issues créées** : #51, #52, #53, #54, #55, #56, #57
**Statut** : ✅ Complet (documentation) | ⏳ Issues créées (7 issues à coder)
**Dernière mise à jour** : 18/11/2025

#### [07_SECURITE](./07_SECURITE/) - ✅ Complet
**Objectif** : Sécurité complète de l'application

**Points à couvrir** :
- [x] Protection XSS (React + DOMPurify)
- [x] Protection CSRF (@fastify/csrf-protection)
- [x] Rate limiting multi-niveaux (@fastify/rate-limit)
- [x] Validation des inputs (Zod frontend + backend)
- [x] Gestion sécurisée des clés API (env variables)
- [x] OWASP Top 10:2025 complet
- [x] Security headers (Helmet)
- [x] CSP (Content Security Policy)
- [x] Logging & monitoring (Pino, Sentry)

**Issues créées** : #58, #59, #60, #61, #62, #63, #64
**Statut** : ✅ Complet (documentation) | ⏳ Issues créées (7 issues à coder)
**Dernière mise à jour** : 18/11/2025

### ⏳ En cours / À faire

#### [08_UX_UI](./08_UX_UI/) - ✅ Complet
**Objectif** : Guidelines UX/UI et accessibilité

**Points à couvrir** :
- [x] Responsive design (Mobile-first, égalité Mobile/Desktop)
- [x] Accessibilité (a11y) - WCAG 2.1 AAA
- [x] Design system complet (Tailwind + shadcn/ui + glasscn-ui)
- [x] Palette de couleurs INTUITION
- [x] Typographie (Inter font)
- [x] Glassmorphism + Web3 aesthetic
- [x] Dark mode uniquement
- [x] Composants UI (FounderCard, TotemCard, GlassCard)
- [x] Loading states (skeleton screens, spinners, progress)
- [x] Animations (Framer Motion + CSS)
- [x] Structure des pages (Landing, Proposer, Voter, Résultats)
- [x] Stack 100% gratuite ($0/mois)

**Statut** : ✅ Complet
**Dernière mise à jour** : 18/11/2025

#### [09_GESTION_ERREURS](./09_GESTION_ERREURS/) - ✅ Complet
**Objectif** : Stratégie complète de gestion des erreurs

**Points à couvrir** :
- [x] Error Boundaries React (react-error-boundary)
- [x] Error Handler Backend (Fastify centralisé)
- [x] Logging structuré avec Pino (gratuit)
- [x] Messages utilisateur clairs (sonner toasts)
- [x] Retry strategy avec exponential backoff
- [x] Monitoring gratuit (Render Logs + UptimeRobot)
- [x] Stack 100% gratuite ($0/mois)

**Statut** : ✅ Complet
**Dernière mise à jour** : 18/11/2025

#### [10_TESTS](./10_TESTS/) - ✅ Complet
**Objectif** : Stratégie de tests

**Points à couvrir** :
- [x] Tests unitaires (Vitest + React Testing Library)
- [x] Tests d'intégration (wagmi Mock Connector)
- [x] Tests E2E (Playwright cross-browser)
- [x] Tests des interactions smart contracts (Anvil/Foundry)
- [x] Coverage minimum (80% statements, 75% branches)
- [x] CI/CD GitHub Actions (gratuit repos publics)
- [x] Stack 100% gratuite ($0/mois)

**Issues créées** : #65, #66, #67, #68, #69, #70
**Statut** : ✅ Complet (documentation) | ⏳ Issues créées (6 issues à coder)
**Dernière mise à jour** : 18/11/2025

#### [11_DEPLOIEMENT](./11_DEPLOIEMENT/) - ✅ Complet
**Objectif** : DevOps et déploiement

**Points à couvrir** :
- [x] Hébergement Frontend (Vercel Free - 6000 min/mois)
- [x] Hébergement Backend (Render Free - 750h/mois)
- [x] CI/CD avec GitHub Actions (gratuit repos publics)
- [x] Environnements (dev, staging, prod)
- [x] Variables d'environnement (Vite best practices)
- [x] Domaine gratuit (.us.kg) + DNS Cloudflare
- [x] Monitoring gratuit (UptimeRobot + Render Logs)
- [x] Stack 100% gratuite ($0/mois)

**Statut** : ✅ Complet
**Dernière mise à jour** : 18/11/2025

#### [12_MODERATION](./12_MODERATION/) - ✅ Complet
**Objectif** : Système de modération du contenu

**Points à couvrir** :
- [x] Comparaison des solutions (npm packages, APIs)
- [x] Recommandation : glin-profanity (gratuit, multilingue)
- [x] Détection d'obfuscation (l33t, espaces, Unicode)
- [x] Workflow de modération (automatique + manuelle)
- [x] Interface de modération manuelle (dashboard)
- [x] Intégration OpenAI Moderation API (Phase 2)
- [x] Conformité légale (GDPR, DSA)
- [x] Plan d'implémentation complet

**Statut** : ✅ Complet
**Dernière mise à jour** : 18/11/2025

#### [13_DONNEES_FONDATEURS](./13_DONNEES_FONDATEURS/) - 🟢 Optionnel
**Objectif** : Enrichir les profils des fondateurs

**Points à couvrir** :
- [ ] Photos/avatars
- [ ] Bios courtes
- [ ] Liens sociaux (Twitter, LinkedIn)
- [ ] Où stocker ces données

**Priorité** : 🟢 Basse (nice to have)

## 🔍 Recherches prioritaires

### 🔴 Priorité 1 (Critique)
1. **Backend : Express vs Fastify vs tRPC**
   - Comparaison des performances
   - Facilité d'utilisation
   - Coûts d'hébergement
   - Intégration avec React/Vite

2. **Sécurité : Protection complète**
   - XSS, CSRF, Injection, etc.
   - Best practices 2025
   - Outils et libraries

3. **Modération : Outils de détection**
   - Open-source content moderation
   - Multilingual profanity detection
   - Implementation

### 🟡 Priorité 2 (Important)
4. **Monitoring et Logging**
   - Sentry vs autres outils
   - Setup et configuration
   - Coûts

5. **Accessibilité (a11y)**
   - WCAG 2.1 guidelines
   - Outils de test
   - Implementation

### 🟢 Priorité 3 (Optionnel)
6. **Données des fondateurs**
   - Sources d'information
   - Stockage
   - Mise à jour

## 📊 Statut par catégorie

| Catégorie | Statut | Complétion | Notes |
|-----------|--------|------------|-------|
| Objectif | ✅ | 100% | Finalisé |
| Fonctionnement | ✅ | 100% | Vérifié et corrigé |
| Technologies | ✅ | 100% | Frontend complet |
| Vérification Wallets | ⏳ | 80% | Attente INTUITION |
| Structure Données | ✅ | 100% | Schéma complet |
| Backend | ✅ | 100% | Fastify + Render Free |
| Sécurité | ✅ | 100% | OWASP 2025 + Protections complètes |
| UX/UI | ✅ | 100% | Tailwind + shadcn/ui + glassmorphism (gratuit) |
| Gestion Erreurs | ✅ | 100% | Pino + Error Boundaries (gratuit) |
| Tests | ✅ | 100% | Vitest + RTL + Playwright (gratuit) |
| Déploiement | ✅ | 100% | Vercel + Render + GitHub Actions (gratuit) |
| Modération | ✅ | 100% | glin-profanity + OpenAI (Phase 2) |
| Données Fondateurs | 🟢 | 0% | Optionnel |

## 🎯 Prochaines étapes

1. ✅ ~~Créer structure de documentation~~
2. ✅ ~~Documenter INTUITION Protocol~~
3. ✅ ~~Vérifier et corriger la documentation~~
4. ✅ ~~Créer le repository GitHub avec issues~~
5. ✅ ~~Recherche Backend Architecture (Issue #1)~~
6. ✅ ~~Recherches approfondies sur points critiques (Issues #2, #3, #4, #6, #7)~~
7. ⏳ Contacter équipe INTUITION pour whitelist
8. ⏳ Commencer le développement

## 🔗 Liens utiles

### Documentation externe
- [INTUITION Docs](https://www.docs.intuition.systems/)
- [INTUITION GitHub](https://github.com/0xIntuition)
- [wagmi Documentation](https://wagmi.sh/)
- [Vite Documentation](https://vitejs.dev/)
- [Base Network Docs](https://docs.base.org/)

### Outils de développement
- [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
- [INTUITION Testnet Hub](https://testnet.hub.intuition.systems/)
- [Basescan Testnet](https://sepolia.basescan.org/)

### Communauté
- Discord INTUITION : (à ajouter)
- GitHub Discussions : https://github.com/0xIntuition/intuition-ts/discussions

## 📝 Notes importantes

### Décisions prises
- **Réseau** : Base Mainnet (testnet : Base Sepolia)
- **Frontend** : React + Vite + TypeScript
- **Wallet Connection** : wagmi v2 + RainbowKit
- **INTUITION SDK** : @0xintuition/sdk + @0xintuition/graphql
- **Vote** : 1 wallet = possibilité de plusieurs votes (pas de limite)
- **Classement** : Par totalAssets dans positiveVault
- **Backend** : Fastify + TypeScript
- **Hébergement Backend** : Render Free Tier ($0/mois)
- **Migration** : Render Starter ($7/mois) si croissance
- **Sécurité** : OWASP 2025, CSRF, XSS, Rate Limiting, Zod validation
- **Logging** : Pino (backend), Sentry (optionnel production)

### Questions en suspens
- [ ] Obtenir liste whitelist airdrop (INTUITION)

### Risques identifiés
- ⚠️ Dépendance à l'équipe INTUITION pour la whitelist
- ⚠️ Complexité des bonding curves (users doivent comprendre)
- ⚠️ Modération du contenu (mots interdits contournables)
- ⚠️ Gas fees sur Base (même si bas)

## 🔄 Changelog

### 18 novembre 2025
- ✅ Création du repository GitHub avec 8 issues
- ✅ Configuration protection branche main
- ✅ Recherche Backend Architecture complète (Issue #1)
- ✅ Comparaison Express vs Fastify vs tRPC
- ✅ Analyse hébergement : Heroku, Railway, Render, Fly.io, Vercel, Netlify, DigitalOcean
- ✅ Décision : Fastify + Render Free Tier ($0/mois)
- ✅ Documentation `/Claude/06_BACKEND/Architecture_Backend.md` (651 lignes)
- ✅ Recherche Sécurité complète (Issue #2)
- ✅ OWASP Top 10:2025 analysé et intégré
- ✅ Protections XSS, CSRF, Rate Limiting, CSP documentées
- ✅ Documentation `/Claude/07_SECURITE/Securite.md` (1013 lignes)
- ✅ Recherche Modération complète (Issue #3)
- ✅ Comparaison packages npm : glin-profanity, @2toad/profanity, leo-profanity, content-checker
- ✅ Analyse APIs : Perspective API, OpenAI Moderation, AWS Comprehend
- ✅ Décision : glin-profanity (Phase 1) + OpenAI Moderation (Phase 2)
- ✅ Workflow de modération automatique + manuelle
- ✅ Interface de modération avec dashboard React + Redis
- ✅ Documentation `/Claude/12_MODERATION/Moderation_Contenu.md` (1200+ lignes)
- ✅ Recherche Gestion erreurs et logging complète (Issue #4)
- ✅ Error Boundaries React (react-error-boundary)
- ✅ Error Handler Fastify centralisé
- ✅ Logging structuré avec Pino (gratuit)
- ✅ Toast notifications (sonner)
- ✅ Retry strategy avec exponential backoff
- ✅ Monitoring gratuit : Render Logs + UptimeRobot
- ✅ Documentation `/Claude/09_GESTION_ERREURS/Gestion_Erreurs_Logging.md` (900+ lignes)
- ✅ Recherche Déploiement & DevOps complète (Issue #7)
- ✅ Comparaison Vercel vs Netlify (Vercel wins: 6000 vs 300 min build)
- ✅ Configuration Render Free pour backend
- ✅ CI/CD GitHub Actions (illimité repos publics)
- ✅ Environnements multi-stages (dev, staging, prod)
- ✅ Variables d'environnement Vite best practices
- ✅ Domaine gratuit .us.kg + Cloudflare DNS
- ✅ Monitoring gratuit : UptimeRobot + Render Logs
- ✅ Documentation `/Claude/11_DEPLOIEMENT/Deploiement_DevOps.md` (1000+ lignes)
- ✅ Recherche Tests complète (Issue #6)
- ✅ Comparaison Vitest vs Jest (Vitest wins: 10-20x plus rapide, zero-config)
- ✅ Comparaison Playwright vs Cypress (Playwright wins: Safari support, parallelization gratuite)
- ✅ Tests Web3 avec Anvil/Foundry et wagmi Mock Connector
- ✅ Configuration React Testing Library avec custom render
- ✅ Coverage 80% + CI/CD GitHub Actions
- ✅ Documentation `/Claude/10_TESTS/Strategie_Tests.md` (1200+ lignes)
- ✅ Recherche UI/UX Design complète (Issue #5)
- ✅ Palette de couleurs INTUITION extraite du site officiel
- ✅ Design system complet : Tailwind + shadcn/ui + glasscn-ui
- ✅ Glassmorphism + Web3 aesthetic, dark mode uniquement
- ✅ Composants UI : GlassCard, FounderCard, TotemCard (code complet)
- ✅ Responsive Mobile-first (égalité Mobile/Desktop)
- ✅ Accessibilité WCAG 2.1 AAA avec contrastes vérifiés
- ✅ Loading states : Skeleton screens, spinners, progress bars
- ✅ Animations : Framer Motion + CSS
- ✅ Structure pages : Landing, Proposer, Voter, Résultats
- ✅ Documentation `/Claude/08_UX_UI/Design_System.md` (1300+ lignes)

### 17 novembre 2025
- ✅ Création de la structure de documentation
- ✅ Documentation complète du protocol INTUITION
- ✅ Configuration testnet Base Sepolia
- ✅ Stack frontend complète
- ✅ Schéma GraphQL et bonding curves
- ✅ Vérification et correction des queries
- ✅ Identification des recherches à faire

## 📧 Contact

**Projet** : INTUITION Founders Totem Collection
**Type** : NFT Voting Platform
**Blockchain** : Base (Ethereum L2)
**Protocol** : INTUITION v2
