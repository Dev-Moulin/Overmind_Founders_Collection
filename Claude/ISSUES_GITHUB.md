# INTUITION Founders Totem - Liste Complète des Issues GitHub

**Dernière mise à jour** : 19 novembre 2025
**Total** : 74 issues

---

## Issues CLOSED (19)

### Recherche & Documentation (#1-7)
- **#1** : [RESEARCH] Backend Architecture Choice
- **#2** : [SECURITY] Complete Security Documentation
- **#3** : [RESEARCH] Content Moderation System
- **#4** : [DOCUMENTATION] Error Handling & Logging Strategy
- **#5** : [DESIGN] UX/UI Guidelines & Accessibility
- **#6** : [TESTING] Testing Strategy Definition
- **#7** : [DEVOPS] Deployment & CI/CD Pipeline

### Développement (#18-24)
- **#18** : Setup: Créer fichier de données avec les 42 fondateurs
- **#19** : Frontend: Setup wagmi + RainbowKit pour connexion wallet
- **#20** : Frontend: Créer composant ConnectButton avec RainbowKit
- **#21** : Frontend: Gérer la vérification du réseau Base Mainnet
- **#22** : Backend: Créer endpoint de vérification whitelist
- **#23** : Frontend: Créer composant NotEligible (message d'erreur)

### Setup Additionnel (#77-81)
- **#77** : Frontend: Setup Tailwind CSS v4
- **#78** : Frontend: Créer composants Header et Footer de base
- **#79** : Frontend: Configuration variables d'environnement (.env)
- **#80** : Frontend: Setup React Router pour navigation
- **#81** : Frontend: Installation et configuration INTUITION SDK

---

## Issues OPEN (55)

### Optionnel (#8)
- **#8** : [OPTIONAL] Founders Data Enrichment

### Frontend - Connexion & Wallet (#24)
- **#24** : Frontend: Afficher les informations du wallet connecté

### Frontend - Propositions (#25-34)
- **#25** : Frontend: Créer page Proposer avec grille des 42 fondateurs
- **#26** : Frontend: Créer composant FounderCard
- **#27** : Frontend: Créer composant ProposalModal (formulaire de proposition)
- **#28** : Frontend: Créer composant ImageUpload avec upload IPFS (Pinata)
- **#29** : Frontend: Intégrer INTUITION SDK - Création d'Atom (createAtomFromThing)
- **#30** : Frontend: Intégrer INTUITION SDK - Création de Triple (createTripleStatement)
- **#31** : Frontend: Créer composant TransactionProgress (suivi des transactions)
- **#32** : Frontend: Gérer les erreurs de proposition (rejection, gas, duplicates)
- **#33** : Backend: Créer requêtes GraphQL pour récupérer les propositions
- **#34** : Backend: Créer requêtes GraphQL pour récupérer les propositions

### Frontend - Vote (#35-42)
- **#35** : Frontend: Créer page Vote avec liste des propositions d'un fondateur
- **#36** : Frontend: Créer composant TotemCard (affichage totem avec vote)
- **#37** : Frontend: Créer composant VoteModal (choisir montant TRUST à déposer)
- **#38** : Frontend: Créer hook useVote pour gérer les transactions de vote
- **#39** : Backend: Créer requêtes GraphQL pour récupérer les votes
- **#40** : Frontend: Créer page MyVotes (historique des votes utilisateur)
- **#41** : Frontend: Créer hook useWithdraw pour retirer TRUST après vote
- **#42** : Frontend: Gérer les erreurs de vote (rejection, balance, network)

### Frontend - Résultats (#43-47)
- **#43** : Frontend: Créer page Results globale (tous les fondateurs)
- **#44** : Frontend: Créer page FounderDetails (résultats détaillés par fondateur)
- **#45** : Frontend: Créer page TotemDetails (détails complets d'un totem)
- **#46** : Backend: Créer requêtes GraphQL pour statistiques et résultats
- **#47** : Backend: Créer endpoint export résultats (JSON/CSV/NFT metadata)

### Frontend - Pages & Layout (#48-50)
- **#48** : Frontend: Créer page Landing/Home avec hero et navigation
- **#49** : Frontend: Créer Layout principal avec navigation et routing
- **#50** : Frontend: Créer page 404 Not Found

### Backend - Setup & API (#51-57)
- **#51** : Backend - Setup Fastify project structure
- **#52** : Backend - Configurer variables d'environnement et secrets
- **#53** : Backend - Implémenter endpoint vérification whitelist
- **#54** : Backend - Implémenter endpoint modération de contenu
- **#55** : Backend - Implémenter endpoint upload image Pinata (optionnel)
- **#56** : Backend - Configurer CORS et sécurité
- **#57** : Backend - Déployer sur Render Free Tier

### Sécurité Frontend (#58-61)
- **#58** : Frontend - Configurer DOMPurify pour sanitization XSS
- **#59** : Frontend - Configurer Content Security Policy (CSP)
- **#60** : Frontend - Implémenter validation Zod pour tous les formulaires
- **#61** : Frontend - Sécuriser authentification wallet (nonce + signature)

### Sécurité Backend (#62-64)
- **#62** : Backend - Implémenter protection CSRF
- **#63** : Backend - Implémenter logging sécurité avec Pino
- **#64** : Backend - Configurer gestion des secrets et variables d'environnement

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

### Phase 3 : Propositions
16. #26 - FounderCard component
17. #25 - Page Proposer (grille fondateurs)
18. #27 - ProposalModal
19. #28 - ImageUpload (Pinata IPFS)
20. #29 - SDK INTUITION - createAtom
21. #30 - SDK INTUITION - createTriple
22. #31 - TransactionProgress
23. #32 - Gestion erreurs propositions

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

### Phase 6 : Backend
34. #51 - Setup Fastify
35. #52 - Variables environnement backend
36. #53 - Endpoint whitelist
37. #54 - Endpoint modération
38. #55 - Endpoint Pinata (optionnel)
39. #56 - CORS et sécurité
40. #33/#34 - GraphQL propositions
41. #39 - GraphQL votes
42. #46 - GraphQL résultats
43. #47 - Export résultats
44. #57 - Déploiement Render

### Phase 7 : Sécurité
45. #58 - DOMPurify XSS
46. #59 - CSP
47. #60 - Validation Zod
48. #61 - Auth wallet nonce
49. #62 - CSRF
50. #63 - Logging Pino
51. #64 - Gestion secrets

### Phase 8 : Tests
52. #65 - Setup Vitest + RTL
53. #66 - Tests unitaires
54. #67 - Setup Playwright
55. #68 - Tests E2E
56. #69 - Tests blockchain Anvil
57. #70 - Coverage + CI/CD

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

**Note** : Le Layout créé (#78) est un composant wrapper basique. L'issue #49 (Layout + routing) concerne le layout complet avec navigation et React Router.
