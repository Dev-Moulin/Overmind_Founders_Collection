# 08 - utils/voteCalculations.ts ✅ TERMINÉ

## Résultat

| Action | Status |
|--------|--------|
| Créer `utils/voteCalculations.ts` | ✅ |
| Migrer `calculateVoteCounts` | ✅ |
| Migrer `calculatePercentage` | ✅ |
| Migrer `enrichTripleWithVotes` | ✅ |
| Mettre à jour `useFounderProposals.ts` | ✅ |
| Mettre à jour `useFounderSubscription.ts` | ✅ |
| Mettre à jour `utils/index.ts` | ✅ |
| Build final | ✅ |

---

## Fichier créé

**`apps/web/src/utils/voteCalculations.ts`** :
- `calculateVoteCounts` - Calcule FOR/AGAINST/NET
- `calculatePercentage` - Calcule % FOR
- `enrichTripleWithVotes` - Enrichit triple avec votes

---

## Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `hooks/useFounderProposals.ts` | Import depuis utils/voteCalculations |
| `hooks/useFounderSubscription.ts` | Import depuis utils/voteCalculations |
| `utils/index.ts` | Export des 3 fonctions |

---

## Duplication éliminée

Les 3 fonctions étaient dupliquées dans :
- `useFounderProposals.ts` (lignes 20-66) ❌ Supprimé
- `useFounderSubscription.ts` (lignes 16-58) ❌ Supprimé

→ Maintenant centralisées dans `utils/voteCalculations.ts`

---

## Date

28/11/2025
