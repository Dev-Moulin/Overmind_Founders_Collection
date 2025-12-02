# INTUITION Founders Totem - Liste Complète des Issues GitHub

**Dernière mise à jour** : 24 novembre 2025
**Total** : ~75 issues (70+ closed, ~7 open)

**Vérification de cohérence** : 24 novembre 2025
- Synchronisé avec `gh issue list --state all`
- Issues fermées car code implémenté : #35, #36, #37, #38, #40, #43, #44, #45, #96, #97, #98, #110, #112, #114
- Session du 24/11/2025 : #33, #34, #39, #46, #47 fermées (GraphQL queries + hooks + export implémentés)
- Session du 24/11/2025 (suite) : #28, #30, #31, #32 fermées (Phase 3 complète)
- Session du 24/11/2025 (suite) : #41, #42 fermées (Phase 4 Vote complète)
- Session du 24/11/2025 (suite) : #58, #59, #60, #61 fermées (Phase 7 Sécurité complète)

---

## Issues CLOSED (55)

### Recherche & Documentation (#1-7)
- **#1** : [RESEARCH] Backend Architecture Choice
- **#2** : [SECURITY] Complete Security Documentation
- **#3** : [RESEARCH] Content Moderation System
- **#4** : [DOCUMENTATION] Error Handling & Logging Strategy
- **#5** : [DESIGN] UX/UI Guidelines & Accessibility
- **#6** : [TESTING] Testing Strategy Definition
- **#7** : [DEVOPS] Deployment & CI/CD Pipeline

### Développement (#18-27, #29-30, #48-50)
- **#18** : Setup: Créer fichier de données avec les 42 fondateurs
- **#19** : Frontend: Setup wagmi + RainbowKit pour connexion wallet
- **#20** : Frontend: Créer composant ConnectButton avec RainbowKit
- **#21** : Frontend: Gérer la vérification du réseau Base Mainnet
- **#22** : Backend: Créer endpoint de vérification whitelist
- **#23** : Frontend: Créer composant NotEligible (message d'erreur)
- **#24** : Frontend: Afficher les informations du wallet connecté
- **#25** : Frontend: Créer page Proposer avec grille des 42 fondateurs
- **#26** : Frontend: Créer composant FounderCard
- **#27** : Frontend: Créer composant ProposalModal (formulaire de proposition)
- **#29** : Frontend: Intégrer INTUITION SDK - Création d'Atom (createAtomFromThing)
- **#30** : Frontend: Intégrer INTUITION SDK - Création de Triple (createTripleStatement)
- **#48** : Frontend: Créer page Landing/Home avec hero et navigation
- **#49** : Frontend: Créer Layout principal avec navigation et routing
- **#50** : Frontend: Créer page 404 Not Found

### Setup Additionnel (#77-81)
- **#77** : Frontend: Setup Tailwind CSS v4
- **#78** : Frontend: Créer composants Header et Footer de base
- **#79** : Frontend: Configuration variables d'environnement (.env)
- **#80** : Frontend: Setup React Router pour navigation
- **#81** : Frontend: Installation et configuration INTUITION SDK

### Backend - Architecture Simplifiée (FERMÉES #51-57, #62-64)
- **#51** : ~~Backend - Setup Fastify project structure~~ (CLOSED - Pas de backend)
- **#52** : ~~Backend - Configurer variables d'environnement~~ (CLOSED - Pas de backend)
- **#53** : ~~Backend - Endpoint vérification whitelist~~ (CLOSED - Vérification on-chain directe)
- **#54** : ~~Backend - Endpoint modération~~ (CLOSED - Auto-régulation via votes)
- **#55** : ~~Backend - Endpoint upload Pinata~~ (CLOSED - SDK INTUITION gère IPFS)
- **#56** : ~~Backend - CORS et sécurité~~ (CLOSED - Pas de backend)
- **#57** : ~~Backend - Déployer sur Render~~ (CLOSED - Pas de backend)
- **#62** : ~~Backend - Protection CSRF~~ (CLOSED - Pas de backend)
- **#63** : ~~Backend - Logging Pino~~ (CLOSED - Pas de backend)
- **#64** : ~~Backend - Gestion secrets~~ (CLOSED - Pas de backend)

### GraphQL & Data (FERMÉES #33-34, #39, #46-47) - Session 24/11/2025
- **#33** : ~~Frontend: Créer requêtes GraphQL pour récupérer les propositions~~ (CLOSED - `queries.ts` GET_FOUNDER_PROPOSALS, GET_ALL_PROPOSALS existent)
- **#34** : ~~Frontend: Requêtes GraphQL propositions~~ (CLOSED - doublon de #33)
- **#39** : ~~Frontend: Créer requêtes GraphQL pour récupérer les votes~~ (CLOSED - `queries.ts` + `useVoteStats.ts` implémentés)
- **#46** : ~~Frontend: GraphQL statistiques et résultats~~ (CLOSED - `usePlatformStats.ts` + `useTotemVoters.ts` ajoutés)
- **#47** : ~~Frontend: Export résultats JSON/CSV~~ (CLOSED - `exportResults.ts` implémenté, NFT non nécessaire)

### Phase 3 - Propositions (FERMÉES #28, #30-32) - Session 24/11/2025
- **#28** : ~~Frontend: Créer composant ImageUpload avec upload IPFS~~ (CLOSED - SDK INTUITION gère IPFS automatiquement via `createAtomFromThing()`)
- **#30** : ~~Frontend: Intégrer INTUITION SDK - Création de Triple~~ (CLOSED - `useIntuition.ts` implémente `createAtom`, `createTriple`, `createClaim`)
- **#31** : ~~Frontend: Créer composant TransactionProgress~~ (CLOSED - `TransactionProgress.tsx` existe, 276 lignes)
- **#32** : ~~Frontend: Gérer les erreurs de proposition~~ (CLOSED - `errorFormatter.ts` existe, 232 lignes + tests)

### Phase 4 - Vote (FERMÉES #41-42) - Session 24/11/2025
- **#41** : ~~Frontend: Créer hook useWithdraw~~ (CLOSED - `useWithdraw.ts` utilise `redeem` de `@0xintuition/protocol`)
- **#42** : ~~Frontend: Gérer les erreurs de vote~~ (CLOSED - `VoteErrorAlert.tsx`, `InsufficientBalanceCard.tsx`, `NetworkErrorCard.tsx`, `WrongNetworkCard.tsx` + lucide-react)

### Phase 7 - Sécurité Frontend (FERMÉES #58-61) - Session 24/11/2025
- **#58** : ~~Frontend - Configurer DOMPurify pour sanitization XSS~~ (CLOSED - `sanitize.ts` + `SafeHTML.tsx` implémentés)
- **#59** : ~~Frontend - Configurer Content Security Policy~~ (CLOSED - `csp.ts` avec directives pour INTUITION, WalletConnect, IPFS)
- **#60** : ~~Frontend - Implémenter validation Zod~~ (CLOSED - `schemas/` créé avec `proposal.schema.ts`, `vote.schema.ts`, `common.schema.ts`)
- **#61** : ~~Frontend - Sécuriser authentification wallet~~ (CLOSED - `auth.ts` + `useWalletAuth.ts` avec nonce/timestamp)

---

## Issues OPEN (7)

### Optionnel (#8)
- **#8** : [OPTIONAL] Founders Data Enrichment

### Tests (#65-70)
- **#65** : Tests - Setup Vitest et React Testing Library
- **#66** : Tests - Écrire tests unitaires pour utils et composants
- **#67** : Tests - Setup Playwright pour tests E2E
- **#68** : Tests - Écrire tests E2E pour parcours utilisateur
- **#69** : Tests - Configurer tests blockchain avec Anvil
- **#70** : Tests - Configurer coverage et GitHub Actions CI/CD


---

## Ordre de Développement Recommandé

### Phase 1 : Connexion Wallet (DONE)
1. ✅ #18 - Fichier données 42 fondateurs
2. ✅ #19 - Setup wagmi + RainbowKit
3. ✅ #20 - ConnectButton custom
4. ✅ #77 - Setup Tailwind CSS v4
5. ✅ #78 - Composants Header/Footer de base
6. ✅ #21 - Vérification réseau Base Mainnet
7. ✅ #22 - Backend endpoint whitelist

### Phase 2 : Frontend Base
8. #79 - Configuration variables d'environnement
9. #80 - Setup React Router
10. #81 - Installation INTUITION SDK
11. #23 - NotEligible component
12. #24 - WalletInfo component
13. #48 - Landing page
14. #49 - Layout + routing
15. #50 - Page 404

### Phase 3 : Propositions (DONE)
16. ✅ #26 - FounderCard component
17. ✅ #25 - Page Proposer (grille fondateurs)
18. ✅ #27 - ProposalModal
19. ✅ #28 - ImageUpload (SDK INTUITION gère IPFS)
20. ✅ #29 - SDK INTUITION - createAtom
21. ✅ #30 - SDK INTUITION - createTriple
22. ✅ #31 - TransactionProgress
23. ✅ #32 - Gestion erreurs propositions

### Phase 4 : Vote
24. #36 - TotemCard component
25. #35 - Page Vote
26. #37 - VoteModal
27. #38 - Hook useVote
28. #40 - Page MyVotes
29. #41 - Hook useWithdraw
30. #42 - Gestion erreurs vote

### Phase 5 : Résultats
31. #43 - Page Results
32. #44 - Page FounderDetails
33. #45 - Page TotemDetails

### Phase 6 : Frontend - Architecture Simplifiée (DONE)
34. ✅ #96 - Hook useWhitelist (vérification on-chain NFT)
35. ✅ #97 - Cache local (localStorage/IndexedDB)
36. ✅ #33/#34 - GraphQL propositions (avec agrégation)
37. ✅ #39 - GraphQL votes (`useVoteStats.ts`)
38. ✅ #46 - GraphQL résultats (`usePlatformStats.ts`, `useTotemVoters.ts`)
39. ✅ #47 - Export résultats (`exportResults.ts`)

### Phase 7 : Sécurité (DONE)
40. ✅ #58 - DOMPurify XSS (`sanitize.ts`, `SafeHTML.tsx`)
41. ✅ #59 - CSP (`csp.ts`)
42. ✅ #60 - Validation Zod (`schemas/`)
43. ✅ #61 - Auth wallet nonce (`auth.ts`, `useWalletAuth.ts`)

### Phase 8 : Tests
44. #65 - Setup Vitest + RTL
45. #66 - Tests unitaires
46. #67 - Setup Playwright
47. #68 - Tests E2E
48. #69 - Tests blockchain Anvil
49. #70 - Coverage + CI/CD

---

## Historique des PRs

- **PR #72** - Fichier données 42 fondateurs (issue #18)
- **PR #73** - wagmi + RainbowKit setup (issue #19)
- **PR #74** - ConnectButton custom avec glassmorphism (issue #20)
- **PR #75** - Setup Tailwind CSS v4 (issue #77)
- **PR #76** - Header/Footer/Layout components basiques (issue #78)
- **PR #82** - NetworkGuard pour vérification Base Mainnet (issue #21)
- **PR #83** - Endpoint whitelist backend (issue #22)
- **PR #84** - Configuration variables d'environnement (issue #79)
- **PR #85** - Setup React Router pour navigation (issue #80)
- **PR #86** - Installation et configuration INTUITION SDK (issue #81)
- **PR #87** - Composant NotEligible (issue #23)
- **PR #88** - Composant WalletInfo (issue #24)
- **PR #89** - Page Landing/Home (issue #48)
- **PR #90** - Layout avec navigation (issue #49)
- **PR #91** - Page 404 Not Found (issue #50)
- **PR #92** - Composant FounderCard (issue #26)
- **PR #93** - Page Proposer avec grille fondateurs (issue #25)
- **PR #94** - Composant ProposalModal (issue #27)
- **PR #95** - Intégration INTUITION SDK pour création de claims (issues #29, #30)
- **PR #118** - Use vote hook refactor (issue #38)
- **PR #119** - GraphQL votes queries + hooks + export (issues #33, #34, #39, #46, #47)

**Note** : Le Layout créé (#78) est un composant wrapper basique. L'issue #49 (Layout + routing) concerne le layout complet avec navigation et React Router.
