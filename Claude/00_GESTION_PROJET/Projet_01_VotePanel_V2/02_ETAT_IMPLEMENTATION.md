# État de l'Implémentation - VotePanel V2

> **Date** : 27 novembre 2025 (mise à jour)
> **Statut** : En cours

---

## 1. Vue d'ensemble

### Progression globale

| Catégorie | Terminé | En cours | À faire |
|-----------|---------|----------|---------|
| Composants | 4 | 0 | 2 |
| Hooks | 6 | 0 | 2 |
| Pages | 1 | 0 | 0 |
| GraphQL | 1 | 0 | 1 (subscription) |
| Styling | 1 | 0 | 0 |

> **DÉCOUVERTE** : Les hooks `useVote` et `useWithdraw` existent déjà ! Voir section 3.

---

## 2. Composants

### Terminés

| Composant | Fichier | Fonctionnalités |
|-----------|---------|-----------------|
| `VotePanel` | [VotePanel.tsx](../../../apps/web/src/components/VotePanel.tsx) | Sélection prédicat (accordion), sélection/création totem, montant TRUST, preview, création claim |
| `FounderExpandedView` | [FounderExpandedView.tsx](../../../apps/web/src/components/FounderExpandedView.tsx) | Vue détaillée fondateur (photo, bio, stats), layout split, fermeture (backdrop/bouton/Escape) |
| `FounderHomeCard` | [FounderHomeCard.tsx](../../../apps/web/src/components/FounderHomeCard.tsx) | Card dans la grille, sélection par click |
| `VoteModal` | [VoteModal.tsx](../../../apps/web/src/components/VoteModal.tsx) | **EXISTANT** - Modal pour voter sur claim existant (FOR/AGAINST) |

### À créer

| Composant | Description | Priorité | Notes |
|-----------|-------------|----------|-------|
| `ClaimExistsModal` | Modal popup quand claim existe déjà | Haute | Peut réutiliser `VoteModal` comme base |
| `RefreshIndicator` | Indicateur "Actualisé il y a X secondes" | Moyenne | |

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
| `useIntuition` | [useIntuition.ts](../../../apps/web/src/hooks/useIntuition.ts) | `createClaim`, `createClaimWithDescription`, `findTriple`, `ClaimExistsError` |
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

## 5. GraphQL Queries

### Terminées

| Query | Fichier | Usage |
|-------|---------|-------|
| `GET_FOUNDER_PROPOSALS` | [queries.ts:15](../../../apps/web/src/lib/graphql/queries.ts#L15) | Proposals d'un fondateur |
| `GET_TRIPLES_BY_PREDICATES` | [queries.ts:308](../../../apps/web/src/lib/graphql/queries.ts#L308) | Tous les triples avec nos prédicats |
| `GET_ATOMS_BY_LABELS` | [queries.ts:544](../../../apps/web/src/lib/graphql/queries.ts#L544) | Recherche atoms par label |
| `GET_TRIPLE_BY_ATOMS` | [queries.ts:579](../../../apps/web/src/lib/graphql/queries.ts#L579) | Vérifie si triple existe |

### À créer

| Query/Subscription | Description | Priorité |
|--------------------|-------------|----------|
| `SUBSCRIBE_FOUNDER_PROPOSALS` | Subscription WebSocket pour temps réel | Haute |

---

## 6. Détails des Composants Existants

### VotePanel.tsx (800 lignes)

**Fonctionnalités implémentées :**

- [x] Accordéon pour prédicats (6 fixes depuis predicates.json)
- [x] Accordéon pour totems (existants + création)
- [x] Mode "existant" : sélection depuis totems du fondateur ou globaux
- [x] Mode "nouveau" : création avec nom + catégorie
- [x] Catégorie stockée dans description (`Categorie : X`)
- [x] Recherche dans totems existants
- [x] Suggestions par catégorie (Animaux, Objets, Traits, Superpowers)
- [x] Input montant TRUST avec validation minimum
- [x] Preview du claim ("Fondateur prédicat totem")
- [x] Affichage balance wallet
- [x] Affichage coûts protocole (triple_cost, entry_fee)
- [x] Gestion erreur `ClaimExistsError`
- [x] Notifications succès/erreur

**Manques :**

- [ ] Vérification proactive si claim existe (avant soumission)
- [ ] Intégration de `useVote` pour voter sur existant
- [ ] Indicateur "Actualisé"
- [ ] Subscription temps réel

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

### Phase 2 : UX Claim vs Vote (Priorité HAUTE)

1. Renommer titre "Voter pour un Totem" → "Créer un vote totem"
2. Ajouter vérification proactive si claim existe
3. Créer `ClaimExistsModal` (basé sur `VoteModal`)
4. Intégrer `useVote` dans le flow VotePanel

### Phase 3 : Améliorations (Priorité MOYENNE)

1. Badge "Nouveaux totems"
2. Tendances hausse/baisse des scores
3. Animation quand nouvelles données
4. Retrait TRUST (intégrer `useWithdraw`)

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
