# TODO - Refactoring AdminAuditPage.tsx

> **Date:** 28 novembre 2025
> **Fichier source:** `apps/web/src/pages/AdminAuditPage.tsx`
> **Objectif:** Décomposer en fichiers < 200 lignes

---

## Résultat Final

| Métrique | Avant | Après Phase 1 | Après Phases 2+3 |
|----------|-------|---------------|------------------|
| Lignes AdminAuditPage.tsx | 1228 | 305 | 229 |
| Composants extraits | 0 | 4 | 9 |
| Hooks extraits | 0 | 0 | 2 |
| Réduction totale | - | -75% | **-81%** |

### Composants créés

| Fichier | Lignes | Phase |
|---------|--------|-------|
| FoundersTab.tsx | 206 | 1 |
| PredicatesTab.tsx | 113 | 1 |
| ObjectsTab.tsx | 251 | 1 |
| OfcCategoriesTab.tsx | 207 | 1 |
| AccessDenied.tsx | 17 | 2 |
| AdminHeader.tsx | 10 | 2 |
| AdminTabs.tsx | 36 | 2 |
| ErrorMessage.tsx | 11 | 2 |
| CreatedItemsList.tsx | 30 | 2 |
| index.ts | 9 | 1-2 |

### Hooks créés

| Fichier | Lignes | Phase |
|---------|--------|-------|
| useAdminAtoms.ts | 113 | 3 |
| useAdminActions.ts | 175 | 3 |

---

## RÈGLES CRITIQUES

### Règles Git

- JAMAIS créer de Pull Request
- JAMAIS de "Generated with Claude Code" ou "Co-Authored-By: Claude"
- JAMAIS push sur `main`
- Paul valide seul les PR

---

## Structure Finale

```
pages/
├── AdminAuditPage.tsx        → Orchestrateur (229 lignes)
components/
├── admin/
│   ├── index.ts              ✅ Export principal
│   ├── FoundersTab.tsx       ✅ Tab fondateurs (206 lignes)
│   ├── PredicatesTab.tsx     ✅ Tab prédicats (113 lignes)
│   ├── ObjectsTab.tsx        ✅ Tab objets/totems (251 lignes)
│   ├── OfcCategoriesTab.tsx  ✅ Tab catégories OFC (207 lignes)
│   ├── AccessDenied.tsx      ✅ Écran accès refusé (17 lignes)
│   ├── AdminHeader.tsx       ✅ Header admin (10 lignes)
│   ├── AdminTabs.tsx         ✅ Navigation tabs (36 lignes)
│   ├── ErrorMessage.tsx      ✅ Message d'erreur (11 lignes)
│   └── CreatedItemsList.tsx  ✅ Liste items créés (30 lignes)
hooks/
├── useAdminAtoms.ts          ✅ Queries GraphQL + Maps (113 lignes)
└── useAdminActions.ts        ✅ Handlers création (175 lignes)
```

---

## Checklist

### Phase 1: Extraction des Tabs ✅ TERMINÉE

- [x] **1.1** Créer `components/admin/FoundersTab.tsx`
- [x] **1.2** Créer `components/admin/PredicatesTab.tsx`
- [x] **1.3** Créer `components/admin/ObjectsTab.tsx`
- [x] **1.4** Créer `components/admin/OfcCategoriesTab.tsx`
- [x] **1.5** Créer `components/admin/index.ts`

### Phase 2: Composants UI Simples ✅ TERMINÉE

- [x] **2.1** Extraire `AccessDenied.tsx` (17 lignes)
- [x] **2.2** Extraire `AdminHeader.tsx` (10 lignes)
- [x] **2.3** Extraire `AdminTabs.tsx` (36 lignes)
- [x] **2.4** Extraire `ErrorMessage.tsx` (11 lignes)
- [x] **2.5** Extraire `CreatedItemsList.tsx` (30 lignes)

### Phase 3: Hooks ✅ TERMINÉE

- [x] **3.1** Créer `hooks/useAdminAtoms.ts` (113 lignes)
- [x] **3.2** Créer `hooks/useAdminActions.ts` (175 lignes)

### Phase 4: Validation ✅ TERMINÉE

- [x] **4.1** Lancer `pnpm type-check` → Aucune erreur
- [ ] **4.2** Tester manuellement la page admin

---

## Notes

- Les 4 tabs ont été extraits avec succès (Phase 1)
- 5 composants UI simples extraits (Phase 2)
- 2 hooks créés pour séparer logique data/actions (Phase 3)
- Les constantes (PREDICATES, TOTEM_CATEGORIES, OFC_ATOMS) restent dans AdminAuditPage car elles définissent les données métier
- ObjectsTab a besoin de `allTotemLabels` en prop supplémentaire
- La fonction `getImageSource` a été déplacée dans FoundersTab
- AdminTabs exporte les types `TabType` et `TabConfig` pour typage
