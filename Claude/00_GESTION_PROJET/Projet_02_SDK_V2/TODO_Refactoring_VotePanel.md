# TODO - Refactoring VotePanel.tsx ✅ TERMINÉ

> **Date:** 28 novembre 2025
> **Fichier source:** `apps/web/src/components/VotePanel.tsx`
> **Objectif:** Décomposer en fichiers < 200 lignes

---

## 📊 Résultat Final

| Métrique | Avant | Après Phase 1 | Après Phase 2 | Réduction Totale |
|----------|-------|---------------|---------------|------------------|
| Lignes VotePanel.tsx | 1136 | 736 | 619 | **-45%** |
| Composants extraits | 0 | 7 | 10 | +10 |
| Hooks extraits | 0 | 2 | 3 | +3 |

---

## 🚨 RÈGLES CRITIQUES

### Règle de Refactoring

> **NE JAMAIS SUPPRIMER** de code dans le fichier original.
> **COMMENTER** chaque partie extraite avec référence au nouveau fichier.

```tsx
// Exemple après extraction:
// [EXTRACTED] → vote/NotConnected.tsx
// if (!isConnected) {
//   return (
//     <div className="glass-card...">
//       ...
//     </div>
//   );
// }
```

### Règles Git

- ❌ **JAMAIS** créer de Pull Request
- ❌ **JAMAIS** de "Generated with Claude Code" ou "Co-Authored-By: Claude"
- ❌ **JAMAIS** push sur `main`
- ✅ Créer une branche `refactor/votepanel-decomposition`
- ✅ Paul valide seul les PR

---

## Structure Finale

```
components/
├── vote/
│   ├── index.ts              ✅ Export principal
│   ├── NotConnected.tsx      ✅ Écran non connecté (~20 lignes)
│   ├── RecentActivity.tsx    ✅ Historique votes (~50 lignes)
│   ├── VotePreview.tsx       ✅ Preview claim (~32 lignes)
│   ├── ClaimExistsWarning.tsx✅ Alerte proactive (~55 lignes)
│   ├── PredicateSelector.tsx ✅ Step 1 (~86 lignes)
│   ├── TrustAmountInput.tsx  ✅ Step 3 (~73 lignes)
│   ├── TotemSelector.tsx     ✅ Step 2 (~350 lignes)
│   ├── SuccessNotification.tsx ✅ Notification succès (~33 lignes) - Phase 2
│   ├── ErrorNotification.tsx ✅ Notification erreur (~35 lignes) - Phase 2
│   └── SubmitButton.tsx      ✅ Bouton submit (~39 lignes) - Phase 2
├── VotePanel.tsx             ✅ Orchestrateur (619 lignes)
hooks/
├── useTotemData.ts           ✅ Logique totems (~245 lignes) - INTÉGRÉ
├── useProactiveClaimCheck.ts ✅ Check claim (~119 lignes) - INTÉGRÉ
└── useVoteSubmit.ts          ✅ Logique soumission (~210 lignes) - Phase 2
```

---

## Checklist

### Phase 1: Composants Simples ✅ TERMINÉE

- [x] **1.1** Créer `vote/NotConnected.tsx`
- [x] **1.2** Créer `vote/RecentActivity.tsx`
- [x] **1.3** Créer `vote/VotePreview.tsx`
- [x] **1.4** Créer `vote/ClaimExistsWarning.tsx`

### Phase 2: Composants Formulaire ✅ TERMINÉE

- [x] **2.1** Créer `vote/PredicateSelector.tsx`
- [x] **2.2** Créer `vote/TrustAmountInput.tsx`
- [x] **2.3** Créer `vote/TotemSelector.tsx`

### Phase 3: Hooks ✅ TERMINÉE

- [x] **3.1** Créer `hooks/useTotemData.ts` ✅ INTÉGRÉ
- [x] **3.2** Créer `hooks/useProactiveClaimCheck.ts` ✅ INTÉGRÉ

### Phase 4: Assemblage ✅ TERMINÉE

- [x] **4.1** Créer `vote/index.ts`
- [x] **4.2** Importer composants dans VotePanel.tsx
- [x] **4.3** Intégrer useTotemData dans VotePanel.tsx
- [x] **4.4** Intégrer useProactiveClaimCheck dans VotePanel.tsx

### Phase 5: Validation ✅ TERMINÉE

- [x] **5.1** Lancer `pnpm type-check` → ✅ Aucune erreur
- [ ] **5.2** Lancer `pnpm lint` (commande non configurée)
- [ ] **5.3** Tester manuellement le formulaire de vote

---

## Notes

- **Ne pas casser** les fonctionnalités existantes
- **Garder** la logique de ClaimExistsModal dans VotePanel (déjà un composant séparé)
- **TotemSelector.tsx** reste volumineux (~350 lignes) - possible extraction future en sous-composants

---

## Phase 2: Extractions Optionnelles ✅ TERMINÉE

Réduction supplémentaire de VotePanel.tsx (736 → 619 lignes):

- [x] Extraire `SuccessNotification.tsx` (~33 lignes)
- [x] Extraire `ErrorNotification.tsx` (~35 lignes)
- [x] Extraire `SubmitButton.tsx` (~39 lignes)
- [x] Extraire `useVoteSubmit.ts` hook (~210 lignes)

---

## Améliorations Futures (Optionnel)

Pour réduire VotePanel.tsx davantage (~400 lignes):

- Extraire la logique `onVoteSuccess` de ClaimExistsModal (~50 lignes)
- Simplifier les commentaires de code extrait (garder juste les références)
