# TODO - Implémentation Système de Vote avec Triples

> **Date:** 28 novembre 2025
> **Branche:** cleanup/remove-unused-code
> **Documentation:** [INDEX.md](INDEX.md)

---

## État Actuel du Projet

### Ce qui existe déjà

| Élément | Fichier | Description |
|---------|---------|-------------|
| **useVote** | `hooks/useVote.ts` | Vote FOR uniquement (AGAINST non implémenté) |
| **useVoteSubmit** | `hooks/useVoteSubmit.ts` | Logique soumission vote (~210 lignes) |
| **useIntuition** | `hooks/useIntuition.ts` | createAtom, createTriple, createClaim |
| **useVoteStats** | `hooks/useVoteStats.ts` | Statistiques de votes (timeline, distribution) |
| **useTotemData** | `hooks/useTotemData.ts` | Logique totems (~245 lignes) |
| **useProactiveClaimCheck** | `hooks/useProactiveClaimCheck.ts` | Check claim existant (~119 lignes) |
| **useAdminAtoms** | `hooks/useAdminAtoms.ts` | Queries GraphQL admin (~113 lignes) |
| **useAdminActions** | `hooks/useAdminActions.ts` | Handlers création admin (~175 lignes) |
| **VotePanel** | `components/VotePanel.tsx` | Orchestrateur refactorisé (619 lignes) |
| **ClaimExistsModal** | `components/ClaimExistsModal.tsx` | Modal vote sur claim existant |
| **GraphQL Queries** | `lib/graphql/queries.ts` | GET_TRIPLE_VOTES, GET_USER_POSITION, etc. |
| **Subscriptions WS** | `lib/graphql/subscriptions.ts` | Real-time updates |
| **Types** | `types/vote.ts`, `types/claim.ts` | VoteStatus, VoteError, ExistingClaimInfo |

### Composants Vote Extraits (10 fichiers)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `vote/NotConnected.tsx` | ~20 | Écran non connecté |
| `vote/RecentActivity.tsx` | ~50 | Historique votes |
| `vote/VotePreview.tsx` | ~32 | Preview claim |
| `vote/ClaimExistsWarning.tsx` | ~55 | Alerte proactive |
| `vote/PredicateSelector.tsx` | ~86 | Step 1 - Sélection prédicat |
| `vote/TrustAmountInput.tsx` | ~73 | Step 3 - Montant TRUST |
| `vote/TotemSelector.tsx` | ~350 | Step 2 - Sélection totem |
| `vote/SuccessNotification.tsx` | ~33 | Notification succès |
| `vote/ErrorNotification.tsx` | ~35 | Notification erreur |
| `vote/SubmitButton.tsx` | ~39 | Bouton submit |

### Composants Admin Extraits (9 fichiers)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `admin/FoundersTab.tsx` | 206 | Tab fondateurs |
| `admin/PredicatesTab.tsx` | 113 | Tab prédicats |
| `admin/ObjectsTab.tsx` | 251 | Tab objets/totems |
| `admin/OfcCategoriesTab.tsx` | 207 | Tab catégories OFC |
| `admin/AccessDenied.tsx` | 17 | Écran accès refusé |
| `admin/AdminHeader.tsx` | 10 | Header admin |
| `admin/AdminTabs.tsx` | 36 | Navigation tabs |
| `admin/ErrorMessage.tsx` | 11 | Message d'erreur |
| `admin/CreatedItemsList.tsx` | 30 | Liste items créés |

### Ce qui manque

| Élément | Raison | Référence Doc |
|---------|--------|---------------|
| **Vote AGAINST** | `useVote.ts` ne supporte que FOR | [10_Vote_ForAgainst.md](10_Vote_ForAgainst.md) |
| **Batch Triple Creation** | Pas de hook pour `batchCreateTripleStatements` | [03_Creation_Triples.md](03_Creation_Triples.md) |
| **Preview Deposit/Redeem** | Pas de fonction de prévisualisation des shares | [13_Deposit_Redeem_BondingCurve.md](13_Deposit_Redeem_BondingCurve.md) |
| **Graphe de votes** | Pas de visualisation graphique | [14_Architecture_Contrats.md](14_Architecture_Contrats.md) |

---

## Refactoring Terminé

### VotePanel.tsx

| Métrique | Avant | Après |
|----------|-------|-------|
| Lignes | 1136 | 619 |
| Composants extraits | 0 | 10 |
| Hooks extraits | 0 | 3 |
| Réduction | - | **-45%** |

### AdminAuditPage.tsx

| Métrique | Avant | Après |
|----------|-------|-------|
| Lignes | 1228 | 229 |
| Composants extraits | 0 | 9 |
| Hooks extraits | 0 | 2 |
| Réduction | - | **-81%** |

---

## Plan d'Implémentation

### Phase 1: Vote AGAINST (Priorité Haute)

**Référence doc:** [10_Vote_ForAgainst.md](10_Vote_ForAgainst.md)

- [ ] **1.1** Modifier `useVote.ts` pour supporter AGAINST
  - Récupérer `counterTermId` du triple
  - Ajouter paramètre `isFor: boolean`
  - Appeler `deposit()` sur le bon termId

- [ ] **1.2** Mettre à jour `ClaimExistsModal.tsx`
  - Boutons FOR/AGAINST fonctionnels
  - Afficher totaux FOR vs AGAINST

```typescript
// Vote FOR
deposit(termId, curveId, amount, minShares)

// Vote AGAINST
deposit(counterTermId, curveId, amount, minShares)
```

### Phase 2: Prévisualisation (Priorité Haute)

**Référence doc:** [13_Deposit_Redeem_BondingCurve.md](13_Deposit_Redeem_BondingCurve.md)

- [ ] **2.1** Créer `usePreviewDeposit.ts`
  - Appel `previewDeposit(termId, curveId, amount)`
  - Retourne nombre de shares estimé

- [ ] **2.2** Créer `usePreviewRedeem.ts`
  - Appel `previewRedeem(termId, curveId, shares)`
  - Retourne montant TRUST estimé

- [ ] **2.3** Créer composant `VotePreviewShares.tsx`
  - Affiche shares attendues
  - Affiche frais détaillés
  - Affiche slippage potentiel

### Phase 3: Batch Triples (Priorité Moyenne)

**Référence doc:** [03_Creation_Triples.md](03_Creation_Triples.md), [12_CreateTriple_Details.md](12_CreateTriple_Details.md)

- [ ] **3.1** Créer `useBatchTriples.ts`
  - Fonction `batchCreate(triples[])`
  - Gestion erreurs atomique (tout ou rien)
  - Progress tracking

- [ ] **3.2** Créer `BatchTripleForm.tsx`
  - Ajout/suppression de triples
  - Validation avant soumission
  - Coût total affiché

### Phase 4: Graphe de Visualisation (Priorité Basse)

**Référence doc:** [14_Architecture_Contrats.md](14_Architecture_Contrats.md)

- [ ] **4.1** Créer `useVoteGraph.ts`
  - Récupère triples et votes
  - Formate en nodes/edges

- [ ] **4.2** Créer `VoteGraph.tsx`
  - Librairie: react-force-graph ou vis.js
  - Nodes = atoms (fondateurs, prédicats, totems)
  - Edges = triples avec scores

---

## Détails Techniques

### Coûts à Afficher

**Référence doc:** [04_Depots_TRUST.md](04_Depots_TRUST.md)

| Opération | Coût |
|-----------|------|
| Création Atom | 0.1 TRUST |
| Création Triple | 0.1 TRUST |
| Frais d'entrée (dépôt) | 0.5% |
| Frais protocole | 1.25% |
| Frais de sortie (retrait) | 0.75% |
| Redistribution atoms | 0.9% |

### Batch Creation - Atomicité

**Référence doc:** [03_Creation_Triples.md](03_Creation_Triples.md)

```typescript
// TOUT ou RIEN
batchCreateTripleStatements(triples[]) {
  // Si un triple échoue → tous revert
  // Si tous OK → tous créés dans même tx
}
```

---

## Points d'Attention

1. **TRUST est natif** sur Intuition L3 → utiliser `msg.value`, pas de transfert ERC20
2. **Counter vault** pour AGAINST → récupérer l'ID via GraphQL ou contrat
3. **Slippage protection** → toujours utiliser `minShares`/`minAssets`
4. **Batch atomicité** → tout ou rien, gérer l'UX en conséquence
5. **Frais cumulatifs** → afficher le total (entrée + protocole + redistribution)

---

## Références Documentation

| Sujet | Fichier |
|-------|---------|
| Réseaux & Endpoints | [01_Reseaux_Endpoints.md](01_Reseaux_Endpoints.md) |
| Création Atoms | [02_Creation_Atoms.md](02_Creation_Atoms.md) |
| Création Triples | [03_Creation_Triples.md](03_Creation_Triples.md) |
| Dépôts TRUST | [04_Depots_TRUST.md](04_Depots_TRUST.md) |
| Retraits Redeem | [05_Retraits_Redeem.md](05_Retraits_Redeem.md) |
| Config Wagmi | [07_Config_Wagmi_Connexion.md](07_Config_Wagmi_Connexion.md) |
| Transactions Write | [08_Transactions_Write.md](08_Transactions_Write.md) |
| Vote FOR/AGAINST | [10_Vote_ForAgainst.md](10_Vote_ForAgainst.md) |
| CreateTriple Details | [12_CreateTriple_Details.md](12_CreateTriple_Details.md) |
| Bonding Curves | [13_Deposit_Redeem_BondingCurve.md](13_Deposit_Redeem_BondingCurve.md) |
| Architecture Contrats | [14_Architecture_Contrats.md](14_Architecture_Contrats.md) |
| Sécurité | [16_Securite_Modificateurs.md](16_Securite_Modificateurs.md) |

---

## Prochaine Étape

Commencer par **Phase 1: Vote AGAINST** car c'est le manque le plus critique dans le système actuel.
