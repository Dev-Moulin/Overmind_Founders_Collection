# Ordre d'exécution - Phase 2

**Mise à jour** : 28/11/2025 - Après étapes 10, 11, 13 (commit d3e73ea)

## Principe

Chaque fichier = 1 document de plan = 1 validation Paul = 1 exécution

---

## Fichiers existants (après nettoyage)

### Components (13)
- ConnectButton, Footer, Layout, ClaimExistsModal, FounderExpandedView
- FounderHomeCard, NetworkGuard, VotePanel, RefreshIndicator
- LanguageSwitcher, WithdrawModal, Header, NetworkSwitch

### Hooks (13)
- useUserVotes, useTotemVoters, useFounderProposals, useVoteStats
- useWindowFocus, useWithdraw, useIntuition, useProtocolConfig
- useFounderSubscription, useNetwork, useVote, useFoundersForHomePage, useWhitelist

### Utils (2)
- aggregateVotes, founderImage

---

## Étape 1 : Fichiers déjà traités

| # | Action | Status |
|---|--------|--------|
| 01 | config/constants.ts - ADMIN_WALLET, NFT_CONTRACT, OFC_PREFIX | [x] |

---

## Étape 2 : Extractions à faire

| # | Fichier source | Extraction | Vers | Status |
|---|----------------|------------|------|--------|
| 02 | hooks/useVote.ts + useUserVotes.ts | VoteStatus, VoteError, VoteWithDetails | types/vote.ts | [x] |
| 03 | hooks/useWithdraw.ts | WithdrawStatus, WithdrawError, WithdrawPreview | types/withdraw.ts | [x] |
| 04 | hooks/useIntuition.ts | CategoryConfig, CreateAtomResult, CreateTripleResult, ClaimExistsError, FounderData | types/intuition.ts | [x] |
| 05 | hooks/useProtocolConfig.ts | ProtocolConfig | types/protocol.ts | [x] |
| 06 | hooks/useFoundersForHomePage.ts | TrendDirection, WinningTotem, FounderForHomePage | types/founder.ts | [x] |
| 07 | hooks/useTotemVoters.ts | TotemVoter, GET_TOTEM_VOTERS | types/voter.ts, lib/graphql/ | [x] |
| 08 | hooks/useFounderProposals.ts | calculateVoteCounts, calculatePercentage, enrichTripleWithVotes (dupliqués) | utils/voteCalculations.ts | [x] |
| 09 | hooks/useFounderSubscription.ts | formatTimeSinceUpdate | utils/formatters.ts | [x] |
| 10 | components/VotePanel.tsx | OFC_PREFIX, CategoryConfigType, Predicate, getTimeAgo, getCategoryName | config/, types/, utils/ | [x] |
| 11 | components/ClaimExistsModal.tsx | ExistingClaimInfo | types/claim.ts | [x] |
| 12 | utils/aggregateVotes.ts | VoteResult, AggregatedVotes, VotingStats | types/vote.ts | [SKIP] types co-localisés |
| 13 | utils/index.ts | Nettoyer re-exports confus | - | [x] |

---

## Étape 3 : Nettoyage final

| # | Action | Status |
|---|--------|--------|
| 14 | Supprimer code dupliqué restant | [x] Aucune duplication |
| 15 | Vérifier tous les imports | [x] TypeScript OK |
| 16 | Build final + Tests | [x] Build réussi |

---

## Fichiers supprimés (ne plus traiter)

Ces fichiers ont été supprimés lors du nettoyage (commit aaa3790) :
- ~~hooks/useVotePanel.ts~~
- ~~hooks/useVoteData.ts~~
- ~~hooks/useVotePanelVoters.ts~~
- ~~hooks/useFounders.ts~~
- ~~components/CreateClaimModal.tsx~~
- ~~components/FounderCard.tsx~~
- ~~components/TotemCard.tsx~~
- ~~components/ProfileContent.tsx~~

---

## Procédure pour chaque fichier

1. Créer le plan détaillé (`Phase2_Plan/XX_nom.md`)
2. Paul valide
3. Exécuter (créer fichier + import + commenter ancien code)
4. Build + Test
5. Paul contrôle
6. Supprimer commentaires
7. Build + Test final
8. Créer `Phase3_Execution/XX_nom.md`
9. Commit
10. Marquer comme fait ici

---

## Phase 2 TERMINÉE

Toutes les étapes ont été complétées avec succès.

### Résumé des extractions :
- **types/** : vote.ts, withdraw.ts, intuition.ts, protocol.ts, founder.ts, voter.ts, category.ts, claim.ts, predicate.ts
- **utils/** : voteCalculations.ts, formatters.ts, category.ts
- **config/** : constants.ts (OFC_PREFIX, ADMIN_WALLET, NFT_CONTRACT)

### Note - Problème mainnet GraphQL
Le schéma GraphQL mainnet est différent de testnet (pas de relations `predicate`, `subject`, `object` dans les filtres). Ce n'est pas lié au refactoring - c'est un problème d'API à traiter séparément.
