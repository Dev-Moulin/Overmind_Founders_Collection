# État de l'Implémentation - VotePanel V2

> **Date** : 26 novembre 2025 (mise à jour)
> **Statut** : Phase 3 terminée - PROJET COMPLET + OFC: Catégories

---

## 1. Vue d'ensemble

### Progression globale

| Catégorie | Terminé | En cours | À faire |
|-----------|---------|----------|---------|
| Composants | 7 | 0 | 0 |
| Hooks | 8 | 0 | 0 |
| Pages | 1 | 0 | 0 |
| GraphQL | 5 (HTTP) + 3 (WS) | 0 | 0 |
| Styling | 1 | 0 | 0 |
| **OFC: Categories** | 5 | 0 | 1 (test on-chain) |

> **Phase 1** : WebSocket Subscriptions ✅ TERMINÉE
> **Phase 2** : UX Claim vs Vote ✅ TERMINÉE
> **Phase 3** : Améliorations ✅ TERMINÉE
> **Phase OFC:** : Catégories via Triples ✅ CODE TERMINÉ (test on-chain pending)

---

## 2. Composants

### Terminés

| Composant | Fichier | Fonctionnalités |
|-----------|---------|-----------------|
| `VotePanel` | [VotePanel.tsx](../../../apps/web/src/components/VotePanel.tsx) | Sélection prédicat (accordion), sélection/création totem, montant TRUST, preview, création claim, **intégration ClaimExistsModal** |
| `FounderExpandedView` | [FounderExpandedView.tsx](../../../apps/web/src/components/FounderExpandedView.tsx) | Vue détaillée fondateur (photo, bio, stats), layout split, fermeture (backdrop/bouton/Escape), **animation nouvelles données** |
| `FounderHomeCard` | [FounderHomeCard.tsx](../../../apps/web/src/components/FounderHomeCard.tsx) | Card dans la grille, sélection par click, **badge NEW**, **tendances ↑↓** |
| `VoteModal` | [VoteModal.tsx](../../../apps/web/src/components/VoteModal.tsx) | **EXISTANT** - Modal pour voter sur claim existant (FOR/AGAINST) |
| `ClaimExistsModal` | [ClaimExistsModal.tsx](../../../apps/web/src/components/ClaimExistsModal.tsx) | Modal quand claim existe, vote FOR/AGAINST, **affichage position user**, **bouton Retirer** |
| `RefreshIndicator` | [RefreshIndicator.tsx](../../../apps/web/src/components/RefreshIndicator.tsx) | Indicateur temps réel (connexion, pause, loading, déconnecté) |
| `WithdrawModal` | [WithdrawModal.tsx](../../../apps/web/src/components/WithdrawModal.tsx) | **NOUVEAU** - Modal retrait TRUST avec `useWithdraw` |

### À créer

*Tous les composants prévus ont été implémentés.*

### Composants découverts (déjà existants)

| Composant | Fichier | Usage actuel |
|-----------|---------|--------------|
| `VoteModal` | [VoteModal.tsx](../../../apps/web/src/components/VoteModal.tsx) | Vote FOR/AGAINST sur claim existant, utilisé dans VotePage |
| `VoteErrorAlert` | [VoteErrorAlert.tsx](../../../apps/web/src/components/VoteErrorAlert.tsx) | Affichage erreurs de vote |

---

## 3. Hooks

### Terminés

| Hook | Fichier | Fonctionnalités |
|------|---------|-----------------|
| `useIntuition` | [useIntuition.ts](../../../apps/web/src/hooks/useIntuition.ts) | `createClaim`, `createClaimWithDescription`, **`createClaimWithCategory`** (OFC:), `findTriple`, `ClaimExistsError` |
| `useFounderProposals` | [useFounderProposals.ts](../../../apps/web/src/hooks/useFounderProposals.ts) | Fetch proposals d'un fondateur, calcul scores FOR/AGAINST |
| `useProtocolConfig` | [useProtocolConfig.ts](../../../apps/web/src/hooks/useProtocolConfig.ts) | Config protocole (costs, fees), validation dépôt minimum |
| `useFoundersForHomePage` | [useFoundersForHomePage.ts](../../../apps/web/src/hooks/useFoundersForHomePage.ts) | Liste des 42 fondateurs avec stats |
| `useVote` | [useVote.ts](../../../apps/web/src/hooks/useVote.ts) | **EXISTANT** - Vote sur claim existant (approve + deposit) |
| `useWithdraw` | [useWithdraw.ts](../../../apps/web/src/hooks/useWithdraw.ts) | **EXISTANT** - Retrait TRUST d'un vault (redeem) |
| `useFounderSubscription` | [useFounderSubscription.ts](../../../apps/web/src/hooks/useFounderSubscription.ts) | **NOUVEAU** - Subscription WebSocket temps réel, pause auto |
| `useWindowFocus` | [useWindowFocus.ts](../../../apps/web/src/hooks/useWindowFocus.ts) | **NOUVEAU** - Détection visibilité onglet, auto-pause subscriptions |

### À créer (Phase 2)

| Hook | Description | Priorité |
|------|-------------|----------|
| - | Phase 1 hooks complétés | - |

### Hooks découverts - Détails importants

#### useVote.ts (266 lignes)

**SDK utilisé** : `batchDepositStatement` de `@0xintuition/sdk`

```typescript
// Ligne 183-186
const depositResult = await batchDepositStatement(
  config,
  [[claimId], [amountWei], [isFor]]
);
```

**Interface** :
```typescript
interface UseVoteResult {
  vote: (claimId: Hex, amount: string, isFor: boolean) => Promise<void>;
  status: VoteStatus;  // 'idle' | 'checking' | 'approving' | 'depositing' | 'success' | 'error'
  error: VoteError | null;
  isLoading: boolean;
  currentStep: number;
  totalSteps: number;
  reset: () => void;
}
```

**Workflow** :
1. Checking - Vérifie allowance ERC20 TRUST
2. Approving - Approuve le contrat MultiVault si nécessaire
3. Depositing - Dépose dans le vault du claim

#### useWithdraw.ts (275 lignes)

**SDK utilisé** : `redeem` de `@0xintuition/protocol`

```typescript
// Ligne 160-162
const txHash = await redeem(config, {
  args: [address, termId, curveId, shares, minAssets],
});
```

**Interface** :
```typescript
interface UseWithdrawResult {
  withdraw: (termId: Hex, shares: bigint, isPositive: boolean, minAssets?: bigint) => Promise<Hex | null>;
  status: WithdrawStatus;
  error: WithdrawError | null;
  isLoading: boolean;
  reset: () => void;
}
```

**Fonction utilitaire incluse** :
```typescript
estimateWithdrawAmount(shares, totalShares, totalAssets, exitFeePercent = 7)
```

---

## 4. Pages

### Terminées

| Page | Fichier | Fonctionnalités |
|------|---------|-----------------|
| `HomePage` | [HomePage.tsx](../../../apps/web/src/pages/HomePage.tsx) | Grille 42 fondateurs, stats dynamiques, sélection → expanded view, URL params |

### Notes

- La HomePage intègre maintenant le VotePanel via `FounderExpandedView`
- Plus besoin de pages séparées ProposePage/VotePage pour le flow principal
- `VoteModal` existe dans l'ancienne `VotePage` et peut être réutilisé

---

## 5. GraphQL Queries & Subscriptions

### Queries HTTP - Terminées

| Query | Fichier | Usage |
|-------|---------|-------|
| `GET_FOUNDER_PROPOSALS` | [queries.ts:15](../../../apps/web/src/lib/graphql/queries.ts#L15) | Proposals d'un fondateur |
| `GET_TRIPLES_BY_PREDICATES` | [queries.ts:308](../../../apps/web/src/lib/graphql/queries.ts#L308) | Tous les triples avec nos prédicats |
| `GET_ATOMS_BY_LABELS` | [queries.ts:544](../../../apps/web/src/lib/graphql/queries.ts#L544) | Recherche atoms par label |
| `GET_TRIPLE_BY_ATOMS` | [queries.ts:579](../../../apps/web/src/lib/graphql/queries.ts#L579) | Vérifie si triple existe |
| `GET_TOTEM_CATEGORY` | [queries.ts:658](../../../apps/web/src/lib/graphql/queries.ts#L658) | **OFC:** Catégorie d'un totem |
| `GET_CATEGORIES_BY_TOTEMS` | [queries.ts:683](../../../apps/web/src/lib/graphql/queries.ts#L683) | **OFC:** Batch query catégories |
| `GET_ALL_TOTEM_CATEGORIES` | [queries.ts:711](../../../apps/web/src/lib/graphql/queries.ts#L711) | **OFC:** Toutes les catégories |
| `GET_TOTEMS_BY_CATEGORY` | [queries.ts:740](../../../apps/web/src/lib/graphql/queries.ts#L740) | **OFC:** Totems par catégorie |

### Subscriptions WebSocket - Terminées

| Subscription | Fichier | Usage |
|--------------|---------|-------|
| `SUBSCRIBE_FOUNDER_PROPOSALS` | [subscriptions.ts:18](../../../apps/web/src/lib/graphql/subscriptions.ts#L18) | Temps réel proposals fondateur |
| `SUBSCRIBE_TOTEM_CATEGORIES` | [subscriptions.ts:184](../../../apps/web/src/lib/graphql/subscriptions.ts#L184) | **OFC:** Catégories temps réel |
| `SUBSCRIBE_CATEGORIES_BY_TOTEMS` | [subscriptions.ts:214](../../../apps/web/src/lib/graphql/subscriptions.ts#L214) | **OFC:** Batch subscription |

### À créer

*Toutes les queries/subscriptions nécessaires ont été implémentées.*

---

## 6. Détails des Composants Existants

### VotePanel.tsx (~1000 lignes)

**Fonctionnalités implémentées :**

- [x] Accordéon pour prédicats (6 fixes depuis predicates.json)
- [x] Accordéon pour totems (existants + création)
- [x] Mode "existant" : sélection depuis totems du fondateur ou globaux
- [x] Mode "nouveau" : création avec nom + catégorie
- [x] ✅ **Catégorie via triples OFC:** (remplace description)
- [x] Recherche dans totems existants
- [x] Suggestions par catégorie (6 catégories OFC:)
- [x] Input montant TRUST avec validation minimum
- [x] Preview du claim ("Fondateur prédicat totem")
- [x] ✅ Preview du triple catégorie (`[Totem] [has_category] [OFC:*]`)
- [x] Affichage balance wallet
- [x] Affichage coûts protocole (triple_cost, entry_fee)
- [x] Gestion erreur `ClaimExistsError`
- [x] Notifications succès/erreur
- [x] ✅ WebSocket subscription catégories temps réel
- [x] ✅ Utilise `createClaimWithCategory()` (2 triples)
- [x] ✅ Fallback rétrocompatibilité (description field en HTTP)

**Manques :**

- [ ] Vérification proactive si claim existe (avant soumission)
- [ ] Intégration de `useVote` pour voter sur existant
- [x] ✅ Indicateur "Actualisé" (via RefreshIndicator)
- [x] ✅ Subscription temps réel catégories

### VoteModal.tsx (298 lignes) - EXISTANT

**Fonctionnalités implémentées :**

- [x] Utilise `useVote` hook
- [x] Sélection du claim si plusieurs pour un totem
- [x] Input montant TRUST
- [x] Progress indicator (étapes 1/2 ou 1/3)
- [x] Vote FOR ou AGAINST
- [x] Gestion succès/erreur
- [x] Fermeture auto après succès

**Peut servir de base pour** `ClaimExistsModal`

### FounderExpandedView.tsx (137 lignes)

**Fonctionnalités implémentées :**

- [x] Layout split (1/4 fondateur + 3/4 VotePanel)
- [x] Photo fondateur avec fallback DiceBear
- [x] Nom, bio courte
- [x] Stats : propositions, totem gagnant, score
- [x] Fermeture : bouton X, backdrop click, Escape
- [x] Responsive (mobile : layout vertical)
- [x] Animation fade-in + slide-in

---

## 7. Configuration Apollo Client

### État actuel

| Aspect | Status | Notes |
|--------|--------|-------|
| HTTP Link | ✅ OK | Pointe vers `testnet.intuition.sh` |
| Cache | ✅ OK | `cache-and-network` pour watchQuery |
| Auth | ✅ OK | Pas nécessaire sur testnet public |
| WebSocket Link | ✅ OK | Package `graphql-ws` installé, WS link configuré |
| Split Link | ✅ OK | HTTP pour queries, WS pour subscriptions |

### Fichier concerné

- [apollo-client.ts](../../../apps/web/src/lib/apollo-client.ts)

---

## 8. Différence Créer vs Voter

| Action | Hook | Fonction SDK | Coût |
|--------|------|--------------|------|
| **Créer claim** (nouveau) | `useIntuition` | `createTriples()` | triple_cost + dépôt |
| **Voter sur existant** | `useVote` | `batchDepositStatement()` | dépôt seulement |
| **Retirer TRUST** | `useWithdraw` | `redeem()` | gratuit (gas only) |

---

## 9. Prochaines Étapes (Ordre recommandé)

### Phase 1 : WebSocket Subscriptions ✅ TERMINÉE

1. ✅ Installer `graphql-ws`
2. ✅ Configurer WebSocket link dans Apollo Client
3. ✅ Créer subscription `SUBSCRIBE_FOUNDER_PROPOSALS`
4. ✅ Créer hook `useFounderSubscription`
5. ✅ Créer hook `useWindowFocus` (pause quand onglet masqué)
6. ✅ Ajouter indicateur "Actualisé" (`RefreshIndicator`)

### Phase 2 : UX Claim vs Vote ✅ TERMINÉE

1. ✅ Renommer titre "Voter pour un Totem" → "Créer un vote totem"
2. ✅ Créer `ClaimExistsModal` (modal quand claim existe)
3. ✅ Intégrer `useVote` dans ClaimExistsModal (vote FOR/AGAINST)
4. ✅ Intégrer ClaimExistsModal dans VotePanel (ouverture automatique sur `ClaimExistsError`)

### Phase 3 : Améliorations ✅ TERMINÉE

1. ✅ Badge "Nouveaux totems" (`recentActivityCount` + badge vert pulsant)
2. ✅ Tendances hausse/baisse des scores (`TrendDirection` + flèches ↑↓)
3. ✅ Animation quand nouvelles données (flash violet sur stats)
4. ✅ Retrait TRUST (intégrer `useWithdraw` + `WithdrawModal`)
5. ✅ **Fix actualisation vote** : useEffect cleanup bug (callbacks dans deps)

### Phase 3.1 : Fix critique actualisation des votes ✅ TERMINÉE

**Problème identifié** : Les votes ne s'actualisaient pas après succès car `onVoteSuccess` n'était jamais appelé.

**Cause** : Dans `ClaimExistsModal`, le useEffect avait `onVoteSuccess` et `onClose` dans ses dépendances. Ces callbacks changeaient de référence à chaque render, déclenchant le cleanup du useEffect qui annulait le timeout avant qu'il ne s'exécute.

**Solution appliquée** :
- Utilisation de `useRef` pour stocker les callbacks (`onVoteSuccessRef`, `onCloseRef`)
- Création d'un useEffect séparé pour mettre à jour les refs quand les props changent
- Retrait des callbacks des dépendances du useEffect du timeout (seulement `[status]`)
- Les refs permettent d'accéder à la version à jour des callbacks sans déclencher le cleanup

**Fichiers modifiés** :
- [ClaimExistsModal.tsx:52-60](../../../apps/web/src/components/ClaimExistsModal.tsx#L52-L60) - Refs pour callbacks
- [ClaimExistsModal.tsx:81-108](../../../apps/web/src/components/ClaimExistsModal.tsx#L81-L108) - useEffect avec deps fixes

**Impact** :
- ✅ Les votes s'actualisent maintenant automatiquement sans quitter la page
- ✅ Le polling dans `onVoteSuccess` (VotePanel) s'exécute correctement
- ✅ Les données sont rafraîchies après 2 secondes de délai (timeout)

---

## 10. Dépendances

### Packages installés

```json
{
  "@0xintuition/sdk": "latest",
  "@0xintuition/protocol": "latest",
  "@apollo/client": "^3.x",
  "wagmi": "^2.x",
  "viem": "^2.x",
  "sonner": "^1.x",
  "graphql-ws": "^6.0.6"
}
```

> **Note** : `graphql-ws` est le package moderne recommandé par Hasura et Apollo (pas `subscriptions-transport-ws` qui est déprécié).

---

**Voir aussi** :
- [01_ARCHITECTURE.md](./01_ARCHITECTURE.md) - Architecture technique
- [03_RECHERCHES.md](./03_RECHERCHES.md) - Recherches WebSocket, Cache
- [04_RECHERCHES_APPROFONDIES.md](./04_RECHERCHES_APPROFONDIES.md) - Hooks existants, SDK détails
- [TODO_Synchronisation_et_UX.md](./TODO_Synchronisation_et_UX.md) - Tâches détaillées
