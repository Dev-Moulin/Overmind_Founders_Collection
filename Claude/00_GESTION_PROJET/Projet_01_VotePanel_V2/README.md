# Projet 01 - VotePanel V2

> **Date de création** : 26 novembre 2025
> **Statut** : En cours
> **Branche** : `feature/v2-fondation-interactive-homepage`

---

## Objectif

Transformer le système de vote/proposition en une interface **single-page interactive** intégrée à la HomePage, avec distinction claire entre :
- **Créer un vote** (nouveau claim/triple)
- **Voter sur un existant** (dépôt dans vault existant via bonding curve)

---

## Documents de ce projet

| Fichier | Description | Statut |
|---------|-------------|--------|
| [README.md](./README.md) | Ce fichier - Vue d'ensemble | A jour |
| [01_ARCHITECTURE.md](./01_ARCHITECTURE.md) | Architecture technique et UX | A jour |
| [02_ETAT_IMPLEMENTATION.md](./02_ETAT_IMPLEMENTATION.md) | Ce qui est fait vs à faire | A jour |
| [03_RECHERCHES.md](./03_RECHERCHES.md) | Recherches WebSocket, Cache Apollo | A jour |
| [04_RECHERCHES_APPROFONDIES.md](./04_RECHERCHES_APPROFONDIES.md) | SDK deposit/redeem, hooks existants | A jour |
| [TODO_Synchronisation_et_UX.md](./TODO_Synchronisation_et_UX.md) | Tâches détaillées synchronisation | A jour |

---

## DÉCOUVERTE IMPORTANTE

Les hooks pour voter sur un claim existant et retirer ses TRUST **existent déjà** :

| Hook | Fichier | Usage |
|------|---------|-------|
| `useVote` | [useVote.ts](../../apps/web/src/hooks/useVote.ts) | Vote FOR/AGAINST sur claim existant |
| `useWithdraw` | [useWithdraw.ts](../../apps/web/src/hooks/useWithdraw.ts) | Retrait TRUST d'un vault |
| `VoteModal` | [VoteModal.tsx](../../apps/web/src/components/VoteModal.tsx) | UI de vote existante |

> Voir [04_RECHERCHES_APPROFONDIES.md](./04_RECHERCHES_APPROFONDIES.md) pour les détails.

---

## Références documentation existante

### Documents vérifiés et valides

| Document | Usage | Vérifié |
|----------|-------|---------|
| [Bonding_Curves.md](../documentation/structure_donnees/Bonding_Curves.md) | Comprendre le mécanisme de vault et récupération TRUST | OK |
| [Schema_GraphQL.md](../documentation/structure_donnees/Schema_GraphQL.md) | Structure V2 des données (triple_vault, counter_term) | OK |
| [INTUITION_SDK.md](../documentation/technologies/INTUITION_SDK.md) | Utilisation du SDK pour créer atoms/triples | OK |
| [hooks/01_useIntuition.md](../documentation/hooks/01_useIntuition.md) | Documentation du hook principal | OK |

### Documents obsolètes (ne pas utiliser)

| Document | Raison |
|----------|--------|
| [V2_FONDATION.md](../documentation/ux_flow/V2_FONDATION.md) | Vision initiale, architecture a évolué |
| [02_ProposePage.md](../documentation/ux_flow/pages/02_ProposePage.md) | Page remplacée par VotePanel |
| [03_VotePage.md](../documentation/ux_flow/pages/03_VotePage.md) | Page remplacée par VotePanel |

---

## Changement de direction

### Avant (ancienne vision V2_FONDATION)
- Animation flip card complexe
- Effet "code qui défile"
- ProposePage et VotePage séparées
- Prédicats créables par l'utilisateur

### Maintenant (Projet_01)
- Interface simple et efficace (pas d'animation flip pour l'instant)
- VotePanel intégré dans HomePage (panneau droit)
- **Distinction claire** : Créer claim vs Voter sur existant
- Prédicats **fixes** (6 prédéfinis dans predicates.json)
- Catégorie stockée dans description de l'atom (`Categorie : X`)
- Synchronisation temps réel via **WebSocket subscriptions**

---

## Fichiers de code principaux

### Créés/Modifiés pour V2

| Fichier | Description |
|---------|-------------|
| `apps/web/src/components/VotePanel.tsx` | Panneau de vote principal (créer claim) |
| `apps/web/src/components/FounderExpandedView.tsx` | Vue agrandie fondateur (gauche) |
| `apps/web/src/hooks/useIntuition.ts` | Hook SDK - `createClaimWithDescription` |
| `apps/web/src/hooks/useFounderProposals.ts` | Fetch proposals d'un fondateur |
| `apps/web/src/hooks/useProtocolConfig.ts` | Config protocole (coûts, frais) |
| `apps/web/src/lib/graphql/queries.ts` | `GET_TRIPLES_BY_PREDICATES` |
| `apps/web/src/pages/HomePage.tsx` | Layout split avec grille + panel |

### Existants (à réutiliser)

| Fichier | Description |
|---------|-------------|
| `apps/web/src/hooks/useVote.ts` | Vote sur claim existant (approve + deposit) |
| `apps/web/src/hooks/useWithdraw.ts` | Retrait TRUST (redeem) |
| `apps/web/src/components/VoteModal.tsx` | Modal vote FOR/AGAINST |

### À créer

| Fichier | Description |
|---------|-------------|
| `apps/web/src/components/ClaimExistsModal.tsx` | Modal quand claim existe déjà |
| `apps/web/src/hooks/useWindowFocus.ts` | Détecter onglet visible/masqué |
| `apps/web/src/lib/graphql/subscriptions.ts` | Subscriptions WebSocket |

---

## Décisions techniques validées

| Décision | Choix | Raison |
|----------|-------|--------|
| Temps réel | **WebSocket subscriptions** | Latence < 1s, moins de charge serveur, supporté par Hasura |
| Cache Apollo | `cache-and-network` | Affiche cache puis met à jour |
| UX claim existe | Modal popup | Clair pour l'utilisateur |
| Pause onglet masqué | Oui | Économie batterie/réseau |
| Timer visuel | Oui (après refresh) | Feedback utilisateur "Actualisé" |
| Auth WebSocket | Non requise | Testnet public, pas de headers nécessaires |

---

## Différence Créer vs Voter

| Action | Hook | Fonction SDK | Coût |
|--------|------|--------------|------|
| **Créer claim** (nouveau) | `useIntuition` | `createTriples()` | triple_cost + dépôt |
| **Voter sur existant** | `useVote` | `batchDepositStatement()` | dépôt seulement |
| **Retirer TRUST** | `useWithdraw` | `redeem()` | gratuit (gas only) |

---

## Prochaines étapes

Voir [TODO_Synchronisation_et_UX.md](./TODO_Synchronisation_et_UX.md) pour le détail.

### Phase 1 : Synchronisation temps réel
- Installer `graphql-ws`
- Configurer WebSocket link dans Apollo Client
- Créer subscriptions GraphQL pour les données temps réel
- Hook useWindowFocus (pause quand onglet masqué)
- Indicateur visuel "Actualisé"

### Phase 2 : UX Claim vs Vote
- Renommer "Voter pour un Totem" → "Créer un vote totem"
- Vérification proactive si claim existe
- Créer `ClaimExistsModal` (basé sur `VoteModal` existant)
- Intégrer `useVote` dans le flow VotePanel

### Phase 3 : Améliorations
- Badge nouveaux totems
- Tendances (hausse/baisse scores)
- Retrait TRUST (intégrer `useWithdraw`)

---

**Dernière mise à jour** : 27 novembre 2025
