# 📋 INTUITION Founders Totem - Documentation Master

## 🎯 Vue d'ensemble du projet

Plateforme de vote collaborative pour définir les totems (objets, animaux, traits) représentant les 42 fondateurs d'INTUITION. Les totems gagnants seront transformés en NFTs 3D.

## 📅 Suivi du projet

**Date de début** : 17 novembre 2025
**Dernière mise à jour** : 17 novembre 2025
**Statut actuel** : Phase de documentation et recherche

## 📂 Structure de la documentation

### ✅ Terminé

#### [01_OBJECTIF](./01_OBJECTIF/)
- **Objectif.md** : But du projet, 42 fondateurs, phases
- **Statut** : ✅ Complet
- **Dernière mise à jour** : 17/11/2025

#### [02_FONCTIONNEMENT](./02_FONCTIONNEMENT/)
- **01_Connexion.md** : Connexion wallet et vérification éligibilité
- **02_Propositions.md** : Création d'Atoms et Triples
- **05_Vote.md** : Système de vote avec $TRUST
- **04_Resultats.md** : Affichage des résultats
- **Statut** : ✅ Complet et vérifié (queries GraphQL corrigées)
- **Dernière mise à jour** : 17/11/2025

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

**Statut** : ✅ Complet
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

**Statut** : ✅ Complet
**Dernière mise à jour** : 18/11/2025

### ⏳ En cours / À faire

#### [08_UX_UI](./08_UX_UI/) - 🟡 À créer
**Objectif** : Guidelines UX/UI et accessibilité

**Points à couvrir** :
- [ ] Responsive design (Mobile, Tablet, Desktop)
- [ ] Accessibilité (a11y) - WCAG 2.1
- [ ] Design system / palette de couleurs
- [ ] Wireframes (optionnel)

**Priorité** : 🟡 Moyenne

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

#### [10_TESTS](./10_TESTS/) - 🟡 À créer
**Objectif** : Stratégie de tests

**Points à couvrir** :
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests E2E
- [ ] Tests des interactions smart contracts
- [ ] Coverage minimum

**Priorité** : 🟡 Moyenne

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
| UX/UI | 🟡 | 0% | À définir |
| Gestion Erreurs | ✅ | 100% | Pino + Error Boundaries (gratuit) |
| Tests | 🟡 | 0% | À définir |
| Déploiement | ✅ | 100% | Vercel + Render + GitHub Actions (gratuit) |
| Modération | ✅ | 100% | glin-profanity + OpenAI (Phase 2) |
| Données Fondateurs | 🟢 | 0% | Optionnel |

## 🎯 Prochaines étapes

1. ✅ ~~Créer structure de documentation~~
2. ✅ ~~Documenter INTUITION Protocol~~
3. ✅ ~~Vérifier et corriger la documentation~~
4. ✅ ~~Créer le repository GitHub avec issues~~
5. ✅ ~~Recherche Backend Architecture (Issue #1)~~
6. 🔄 **EN COURS : Recherches approfondies sur points critiques (Issues #2-#8)**
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
