# Projet 01 - VotePanel V2 : Synchronisation et UX

## Date : 2025-11-27 (mise à jour)

---

## 1. Distinction Claim vs Vote

### Clarification importante

| Action | Description | Coût | Vault |
|--------|-------------|------|-------|
| **Créer un Claim** | Nouveau triple (Fondateur + Prédicat + Totem) | `triple_cost` (~0.0005 TRUST) + dépôt initial | Crée un nouveau vault |
| **Voter sur Claim existant** | Déposer du TRUST dans un vault existant | Dépôt seulement | Bonding curve du vault existant |

### Référence Bonding Curves
- Voir : [Bonding_Curves.md](../documentation/structure_donnees/Bonding_Curves.md) [vérifié OK]
- Le montant récupérable varie selon la courbe (gain ou perte possible)
- Frais ~7% au dépôt (creator fees + protocol fees)

---

## 2. Architecture UX proposée

### 2 conteneurs/pages distincts

#### A. "Créer un vote" (VotePanel actuel)
- **But** : Créer un NOUVEAU claim (triple)
- **Quand** : Combinaison Fondateur + Prédicat + Totem n'existe PAS
- **Coût** : triple_cost + dépôt initial
- **Titre suggéré** : "Créer un vote totem" ou "Proposer un totem"

#### B. "Voter sur existant" (À créer)
- **But** : Ajouter du TRUST sur un claim existant
- **Quand** : Le claim existe déjà
- **Coût** : Dépôt seulement (bonding curve)
- **Titre suggéré** : "Voter sur un totem" ou "Soutenir ce totem"

### Logique de redirection

```
Si utilisateur sélectionne (Fondateur + Prédicat + Totem) :
  → Vérifier si le triple existe déjà (GraphQL query)

  SI existe :
    → Afficher Modal popup : "Ce claim existe déjà ! Voulez-vous voter dessus ?"
    → Bouton "Voter sur ce claim" → ouvre VoteOnExisting

  SI n'existe pas :
    → Rester sur "Créer un vote"
    → Procéder à la création du claim
```

---

## 3. Synchronisation des données

### Décision : WebSocket Subscriptions (pas Polling)

> **Voir** : [03_RECHERCHES.md](./03_RECHERCHES.md) pour les détails techniques

| Aspect | Polling (30s) | WebSocket Subscription |
|--------|---------------|------------------------|
| Latence | 0-30 secondes | < 1 seconde |
| Requêtes/min/user | 2-3 | 0 (push server) |
| Charge serveur | Élevée | Faible |
| Batterie mobile | Consomme | Passive |

**Décision validée** : WebSocket subscriptions via Hasura.

### Données à synchroniser

| Données | Query/Subscription | Temps réel |
|---------|-------------------|------------|
| Tous les triples | `SUBSCRIBE_TRIPLES_BY_PREDICATES` | Oui (WebSocket) |
| Proposals du fondateur | `SUBSCRIBE_FOUNDER_PROPOSALS` | Oui (WebSocket) |
| Votes FOR/AGAINST | `triple_vault.total_assets` / `counter_term.total_assets` | Oui (WebSocket) |
| Config protocole | `useProtocolConfig` | Non (stable) |
| Balance user | `useBalance` (wagmi) | Oui (auto) |

### Cache Apollo

**Stratégie** : `cache-and-network` + `nextFetchPolicy: 'cache-first'`

- Affiche données du cache immédiatement
- Met à jour en background
- Évite les refetch inutiles lors de re-renders

### Pause quand onglet masqué

Le hook `useWindowFocus` détecte si l'onglet est visible :
- Visible → subscriptions actives
- Masqué → subscriptions en pause (skip: true)

Économise batterie et bande passante.

---

## 4. Vérification claim existant avant création

### Logique actuelle (dans useIntuition.ts)

```typescript
// createClaim et createClaimWithDescription vérifient déjà si le triple existe
const existingTriple = await findTriple(params.subjectId, predicateId, objectId);
if (existingTriple) {
  throw new ClaimExistsError({
    termId: existingTriple.termId,
    subjectLabel: existingTriple.subjectLabel,
    predicateLabel: existingTriple.predicateLabel,
    objectLabel: existingTriple.objectLabel,
  });
}
```

### Amélioration proposée

Au lieu d'attendre l'erreur à la soumission :
1. Vérifier AVANT que l'utilisateur clique sur "Créer"
2. Afficher un message proactif : "Ce claim existe déjà"
3. Proposer un bouton : "Voter sur ce claim →"

```typescript
// Vérification en temps réel quand totem sélectionné
const checkClaimExists = useCallback(async () => {
  if (!founder.atomId || !selectedPredicateId || !selectedTotemId) return null;

  // Query pour vérifier si le triple existe
  const { data } = await apolloClient.query({
    query: GET_TRIPLE_BY_ATOMS,
    variables: {
      subjectId: founder.atomId,
      predicateId: selectedPredicateWithAtom?.atomId,
      objectId: selectedTotemId,
    },
  });

  return data?.triples?.[0] || null;
}, [founder.atomId, selectedPredicateId, selectedTotemId]);
```

---

## 5. Tâches restantes

### Phase 1 : WebSocket Subscriptions ✅ TERMINÉE

- [x] Installer `graphql-ws`
- [x] Configurer WebSocket link dans Apollo Client
- [x] Créer fichier `subscriptions.ts` avec les subscriptions GraphQL
- [x] Créer hook `useFounderSubscription`
- [x] Créer hook `useWindowFocus`
- [x] Intégrer subscriptions dans VotePanel
- [x] Ajouter indicateur "Actualisé"

### Phase 2 : UX Claim vs Vote ✅ TERMINÉE

- [x] Renommer titre "Voter pour un Totem" → "Créer un vote totem"
- [x] Ajouter vérification proactive si claim existe
- [x] Créer composant `ClaimExistsModal`
- [x] Intégrer `useVote` dans ClaimExistsModal (vote FOR/AGAINST)
- [x] Intégrer ClaimExistsModal dans VotePanel (ouverture automatique)

### Phase 3 : Améliorations ✅ TERMINÉE

- [x] Badge "X nouveaux totems"
- [x] Animation subtile quand nouvelles données
- [x] Afficher tendance (hausse/baisse) des scores
- [x] Retrait TRUST (`useWithdraw` + `WithdrawModal`)

### Phase 3.1 : Fix actualisation votes ✅ TERMINÉE (26 nov 2025)

**Problème** : Les votes ne s'actualisaient pas automatiquement après succès.

**Cause identifiée** :
- Le useEffect dans `ClaimExistsModal` avait `onVoteSuccess` et `onClose` dans ses dépendances
- Ces callbacks (fonctions inline) changeaient de référence à chaque render
- Le cleanup du useEffect s'exécutait et annulait le timeout avant qu'il ne fire
- Résultat : `onVoteSuccess` n'était jamais appelé

**Solution appliquée** :
- [x] Utiliser `useRef` pour stocker les callbacks au lieu de les mettre dans les deps
- [x] Créer un useEffect séparé pour mettre à jour les refs quand les props changent
- [x] Retirer les callbacks des dépendances du useEffect du timeout (seulement `[status]`)
- [x] Mettre à jour la documentation

**Résultat** :
- ✅ Les votes s'actualisent automatiquement sans quitter la page
- ✅ Le polling dans `onVoteSuccess` (VotePanel) s'exécute correctement
- ✅ UX fluide et immédiate

### Phase 4 : Cleanup (En cours)

- [ ] Retirer les console.logs de debug après vérification du fix

---

## 6. Questions ouvertes - RÉSOLUES

### 1. Subscriptions WebSocket vs Polling ?

**RÉPONSE** : WebSocket subscriptions.

L'API INTUITION (Hasura) supporte les subscriptions GraphQL via `wss://testnet.intuition.sh/v1/graphql`. C'est meilleur sur tous les critères : latence, charge serveur, batterie mobile.

> Voir : [03_RECHERCHES.md](./03_RECHERCHES.md#1-websocket-subscriptions-vs-polling)

### 2. Cache Apollo ?

**RÉPONSE** : `cache-and-network` + `nextFetchPolicy: 'cache-first'`

Cette stratégie affiche les données du cache immédiatement puis met à jour en background. Meilleure UX sans spinners inutiles.

> Voir : [03_RECHERCHES.md](./03_RECHERCHES.md#3-apollo-cache-strategy)

### 3. UX redirection quand claim existe ?

**RÉPONSE** : Modal popup.

Afficher une modal avec :
- Message : "Ce claim existe déjà !"
- Détails du claim existant
- Bouton "Voter sur ce claim"

Plus clair pour l'utilisateur qu'une redirection directe.

### 4. Mobile et batterie ?

**RÉPONSE** : Pause subscriptions quand onglet masqué.

Le hook `useWindowFocus` détecte `document.hidden` et met en pause les subscriptions. Quand l'onglet redevient visible, les subscriptions reprennent automatiquement.

> Voir : [03_RECHERCHES.md](./03_RECHERCHES.md#4-pause-subscriptions-quand-onglet-masqué)

---

## 7. Fichiers concernés

### Existants (à modifier)

| Fichier | Modifications |
|---------|---------------|
| `apps/web/src/components/VotePanel.tsx` | Intégrer subscriptions, renommer titre |
| `apps/web/src/lib/apollo-client.ts` | Ajouter WebSocket link |

### À créer

| Fichier | Description |
|---------|-------------|
| `apps/web/src/lib/graphql/subscriptions.ts` | Subscriptions GraphQL |
| `apps/web/src/hooks/useFounderSubscription.ts` | Hook subscription |
| `apps/web/src/hooks/useWindowFocus.ts` | Détection onglet visible |
| `apps/web/src/hooks/useVoteOnExisting.ts` | Logique vote existant |
| `apps/web/src/components/VoteOnExisting.tsx` | UI vote existant |
| `apps/web/src/components/ClaimExistsModal.tsx` | Modal claim existe |
| `apps/web/src/components/RefreshIndicator.tsx` | Indicateur "Actualisé" |

---

**Voir aussi** :
- [01_ARCHITECTURE.md](./01_ARCHITECTURE.md) - Architecture complète
- [02_ETAT_IMPLEMENTATION.md](./02_ETAT_IMPLEMENTATION.md) - État actuel du code
- [03_RECHERCHES.md](./03_RECHERCHES.md) - Recherches techniques détaillées
