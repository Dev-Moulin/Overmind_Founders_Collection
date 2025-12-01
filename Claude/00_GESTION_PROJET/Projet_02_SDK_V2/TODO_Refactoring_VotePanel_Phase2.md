# TODO - Refactoring VotePanel.tsx - Phase 2 (Optionnel)

> **Date:** 28 novembre 2025
> **Prérequis:** Phase 1 terminée ✅
> **Objectif:** Réduire VotePanel de 736 → ~400 lignes

---

## 📊 État Actuel

| Fichier | Lignes | Objectif |
|---------|--------|----------|
| VotePanel.tsx | 736 | ~400 |

**useProactiveClaimCheck:** ✅ INTÉGRÉ (était le problème principal)

---

## ✅ Problème Résolu: useProactiveClaimCheck

### Ce qui a été fait

1. **Hook modifié** avec `refetch` et `checkClaim` exposés
2. **Import décommenté** dans VotePanel.tsx
3. **Code inline remplacé** par appel au hook (~50 lignes économisées)

### API du hook

```tsx
const {
  proactiveClaimInfo,
  isLoading: claimCheckLoading,
  refetch: refetchClaimCheck,
  checkClaim,
  reset,
} = useProactiveClaimCheck({
  founderAtomId: founder.atomId,
  selectedPredicateWithAtom,
  selectedTotemId,
  totemMode,
});
```

---

## Extractions Optionnelles (Pour atteindre ~400 lignes)

### Étape 1: Notifications

- [ ] **1.1** Créer `vote/SuccessNotification.tsx`
  - Lignes source: ~545-584
  - Props: `{ success, onClose }`
  - Économie: ~40 lignes

- [ ] **1.2** Créer `vote/ErrorNotification.tsx`
  - Lignes source: ~585-620
  - Props: `{ error, onClose }`
  - Économie: ~35 lignes

### Étape 2: Bouton Submit

- [ ] **2.1** Créer `vote/SubmitButton.tsx`
  - Lignes source: ~700-730
  - Props: `{ isValid, isSubmitting, hasExistingClaim, onClick }`
  - Économie: ~30 lignes

### Étape 3: Hook Submit (Avancé)

- [ ] **3.1** Créer `hooks/useVoteSubmit.ts`
  - Extraire toute la logique de `handleSubmit`
  - Retourne: `{ submit, isSubmitting, error, success }`
  - Économie: ~100 lignes

---

## Estimation

| Action | Lignes Économisées |
|--------|-------------------|
| SuccessNotification | ~40 |
| ErrorNotification | ~35 |
| SubmitButton | ~30 |
| useVoteSubmit | ~100 |
| **Total** | **~205 lignes** |

**Résultat attendu:** 736 - 205 = **~530 lignes**

---

## Priorité

Ces extractions sont **optionnelles**. Le refactoring principal est terminé avec:
- ✅ 7 composants extraits
- ✅ 2 hooks intégrés
- ✅ -35% de réduction (1136 → 736 lignes)
- ✅ Typecheck sans erreur
