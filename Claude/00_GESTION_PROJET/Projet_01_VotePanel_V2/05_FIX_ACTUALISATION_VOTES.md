# Fix Actualisation des Votes après Succès

> **Date** : 26 novembre 2025
> **Statut** : ✅ RÉSOLU

---

## 1. Problème Initial

### Symptômes

Après un vote réussi via `ClaimExistsModal` :
- ✅ Le vote était enregistré on-chain (succès)
- ✅ La modal se fermait correctement après 2 secondes
- ❌ Les données (forVotes, againstVotes) ne s'actualisaient PAS automatiquement
- ⚠️ L'utilisateur devait quitter la page et revenir pour voir les nouvelles données

### Comportement observé

```
[ClaimExistsModal] Vote SUCCESS! Setting timeout to call onVoteSuccess...
[ClaimExistsModal] Cleanup: clearing timeout  ← LE TIMEOUT ÉTAIT ANNULÉ !
```

Le callback `onVoteSuccess` n'était **jamais appelé**, donc le polling de refetch dans `VotePanel` ne s'exécutait jamais.

---

## 2. Investigation

### Étape 1 : Ajout de logs de debug

Dans [ClaimExistsModal.tsx:81-108](../../../apps/web/src/components/ClaimExistsModal.tsx#L81-L108), ajout de logs pour tracer l'exécution :

```typescript
useEffect(() => {
  console.log('[ClaimExistsModal] useEffect status changed:', status);
  if (status === 'success' && !hasClosedRef.current) {
    console.log('[ClaimExistsModal] Vote SUCCESS! Setting timeout...');
    const timeoutId = setTimeout(() => {
      console.log('[ClaimExistsModal] Timeout fired, calling onVoteSuccess...');
      onVoteSuccess?.();
      onClose();
    }, 2000);

    return () => {
      console.log('[ClaimExistsModal] Cleanup: clearing timeout');
      clearTimeout(timeoutId);
    };
  }
}, [status, onClose, onVoteSuccess]);  // ← PROBLÈME ICI !
```

### Étape 2 : Logs révélateurs

```
[ClaimExistsModal] Vote SUCCESS! Setting timeout to call onVoteSuccess...
[ClaimExistsModal] Cleanup: clearing timeout
```

Le cleanup s'exécutait **immédiatement** après avoir créé le timeout !

### Étape 3 : Identification de la cause

**Cause racine** : `onVoteSuccess` et `onClose` dans le tableau de dépendances du useEffect.

**Pourquoi c'est un problème** :
1. `onVoteSuccess` est une fonction **inline async** définie dans `VotePanel`
2. À chaque re-render de `VotePanel`, une **nouvelle référence** de fonction est créée
3. React détecte que la dépendance a changé → **cleanup** du useEffect
4. Le cleanup annule le timeout avant qu'il n'ait eu le temps de s'exécuter (2000ms)

---

## 3. Solution Appliquée

### Pattern : useRef pour callbacks instables

Au lieu de mettre les callbacks dans les dépendances, on les stocke dans des refs :

```typescript
// Store callbacks in refs to avoid useEffect re-runs
const onVoteSuccessRef = useRef(onVoteSuccess);
const onCloseRef = useRef(onClose);

// Update refs when props change
useEffect(() => {
  onVoteSuccessRef.current = onVoteSuccess;
  onCloseRef.current = onClose;
}, [onVoteSuccess, onClose]);

// Close modal on success (with cleanup and single-close protection)
useEffect(() => {
  if (status === 'success' && !hasClosedRef.current) {
    hasClosedRef.current = true;
    const timeoutId = setTimeout(() => {
      onVoteSuccessRef.current?.();  // ← Utilise la ref
      onCloseRef.current();          // ← Utilise la ref
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }
}, [status]);  // ← Plus de callbacks dans les deps, seulement [status]
```

### Fichiers modifiés

| Fichier | Lignes | Modifications |
|---------|--------|---------------|
| [ClaimExistsModal.tsx](../../../apps/web/src/components/ClaimExistsModal.tsx) | 1 | Import `useRef` (retiré `useCallback` inutilisé) |
| [ClaimExistsModal.tsx](../../../apps/web/src/components/ClaimExistsModal.tsx) | 52-60 | Ajout des refs pour callbacks + useEffect de sync |
| [ClaimExistsModal.tsx](../../../apps/web/src/components/ClaimExistsModal.tsx) | 81-108 | useEffect du timeout avec deps fixes `[status]` |

---

## 4. Résultat

### Logs après fix

```
[ClaimExistsModal] Vote SUCCESS! Setting timeout to call onVoteSuccess...
[ClaimExistsModal] Timeout fired, calling onVoteSuccess...  ← MAINTENANT FONCTIONNE !
[VotePanel] === onVoteSuccess called ===
[VotePanel] Starting polling for updated data...
```

### Impact

- ✅ Les votes s'actualisent automatiquement après 2 secondes
- ✅ Le polling dans `VotePanel.onVoteSuccess` s'exécute correctement
- ✅ L'utilisateur voit immédiatement les nouvelles données sans quitter la page
- ✅ UX fluide et immédiate

---

## 5. Leçons Apprises

### Pattern à éviter

```typescript
// ❌ MAUVAIS : callbacks inline dans les deps du useEffect
const onSomethingSuccess = async () => { /* ... */ };

useEffect(() => {
  if (condition) {
    setTimeout(() => {
      onSomethingSuccess();
    }, 2000);
  }
}, [condition, onSomethingSuccess]);  // ← onSomethingSuccess change chaque render
```

### Pattern recommandé

```typescript
// ✅ BON : callbacks stockés dans des refs
const onSomethingSuccessRef = useRef(onSomethingSuccess);

useEffect(() => {
  onSomethingSuccessRef.current = onSomethingSuccess;
}, [onSomethingSuccess]);

useEffect(() => {
  if (condition) {
    setTimeout(() => {
      onSomethingSuccessRef.current();  // ← Utilise la ref
    }, 2000);
  }
}, [condition]);  // ← Seulement les vraies dépendances
```

### Alternative : useCallback dans le parent

Si on contrôle le composant parent (`VotePanel`), on peut aussi stabiliser la référence avec `useCallback` :

```typescript
// Dans VotePanel
const onVoteSuccess = useCallback(async () => {
  // ... logique de polling
}, [/* deps stables */]);
```

Mais dans notre cas, la solution avec `useRef` dans l'enfant est plus robuste car elle ne dépend pas du parent.

---

## 6. Prochaines Étapes

### Phase 4 : Cleanup

- [ ] Retirer les console.logs de debug après vérification complète du fix
- [ ] Tester sur plusieurs scénarios (vote FOR, vote AGAINST, multiples votes successifs)

### Fichiers avec logs à nettoyer

| Fichier | Logs à retirer |
|---------|----------------|
| [ClaimExistsModal.tsx](../../../apps/web/src/components/ClaimExistsModal.tsx) | Lignes 82, 84, 87, 89, 94, 104 |
| [VotePanel.tsx](../../../apps/web/src/components/VotePanel.tsx) | Logs dans `onVoteSuccess` callback |

---

**Références** :
- [02_ETAT_IMPLEMENTATION.md](./02_ETAT_IMPLEMENTATION.md) - État général du projet
- [TODO_Synchronisation_et_UX.md](./TODO_Synchronisation_et_UX.md) - Tâches détaillées
- [React Hooks: useEffect cleanup](https://react.dev/reference/react/useEffect#cleanup-function)
