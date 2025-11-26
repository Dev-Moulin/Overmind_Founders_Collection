# Architecture des Catégories via Triples OFC

**Date de création** : 26 novembre 2025
**Statut** : ✅ Code implémenté - ⏳ Test on-chain à faire

---

## État d'implémentation

| Tâche | Statut |
|-------|--------|
| `categories.json` créé | ✅ |
| `useIntuition.ts` - `createClaimWithCategory()` | ✅ |
| Subscriptions WebSocket | ✅ |
| Queries HTTP | ✅ |
| `VotePanel.tsx` - Sélecteur catégories | ✅ |
| Fallback rétrocompatibilité | ✅ |
| Atoms on-chain (has_category + OFC:*) | ⏳ Au premier usage |
| Test flow complet | ⏳ |

---

## Contexte et Problème

### Problème initial
Le champ `description` des atoms n'est **pas disponible dans les subscriptions WebSocket** d'INTUITION. Seules les requêtes HTTP peuvent récupérer ce champ.

### Ancienne approche (description)
```
Atom Totem: { label: "Lion", description: "Categorie : Animal" }
```
- ✅ Fonctionne en HTTP
- ❌ Ne fonctionne pas en WebSocket (field not found)

### Nouvelle approche (triples OFC:)
Utiliser des **triples** pour stocker la catégorie, car les triples sont queryables en WebSocket.

---

## Architecture des Triples

### Pour chaque nouveau totem, on crée 2 triples :

```
Triple 1 (Vote principal):
  [Founder] [represented_by] [Totem]

Triple 2 (Catégorie):
  [Totem] [has_category] [OFC:Animal]
```

### Nomenclature OFC:

**OFC** = **O**vermind **F**ounders **C**ollection

Le préfixe `OFC:` permet de :
1. **Identifier nos atoms** vs les autres sur INTUITION
2. **Filtrer facilement** avec `label LIKE 'OFC:%'`
3. **Rester concis** (3 lettres)

---

## Atoms à créer (une seule fois)

### Prédicat
```json
{
  "label": "has_category",
  "description": "Predicate for categorizing totems in OFC"
}
```

### Catégories
```json
[
  { "label": "OFC:Animal", "emoji": "🦁" },
  { "label": "OFC:Objet", "emoji": "🔮" },
  { "label": "OFC:Trait", "emoji": "✨" },
  { "label": "OFC:Concept", "emoji": "💡" },
  { "label": "OFC:Element", "emoji": "🔥" },
  { "label": "OFC:Mythologie", "emoji": "🐉" }
]
```

---

## Queries GraphQL

### Query HTTP : Récupérer les catégories d'un totem
```graphql
query GetTotemCategory($totemId: String!) {
  triples(
    where: {
      subject_id: { _eq: $totemId }
      predicate: { label: { _eq: "has_category" } }
      object: { label: { _like: "OFC:%" } }
    }
  ) {
    object {
      label  # "OFC:Animal"
    }
  }
}
```

### Subscription WebSocket : Catégories en temps réel
```graphql
subscription SubscribeTotemCategories {
  triples(
    where: {
      predicate: { label: { _eq: "has_category" } }
      object: { label: { _like: "OFC:%" } }
    }
  ) {
    subject {
      term_id
      label
    }
    object {
      label  # "OFC:Animal", "OFC:Objet", etc.
    }
    created_at
  }
}
```

### Query : Tous les totems d'une catégorie
```graphql
query GetTotemsByCategory($category: String!) {
  triples(
    where: {
      predicate: { label: { _eq: "has_category" } }
      object: { label: { _eq: $category } }  # "OFC:Animal"
    }
  ) {
    subject {
      term_id
      label
      image
    }
  }
}
```

---

## Flux de création d'un totem

### Fonction implémentée : `createClaimWithCategory()`

```typescript
// Appel depuis VotePanel.tsx
const result = await createClaimWithCategory({
  subjectId: founder.atomId as Hex,      // Atom du fondateur
  predicate: "represented_by",           // Prédicat du vote
  objectName: "Lion",                    // Nom du totem
  categoryId: "animal",                  // ID catégorie (from categories.json)
  depositAmount: "0.001",                // Montant TRUST
});

// Résultat
// result.triple         → Triple 1 : [Founder] [predicate] [Totem]
// result.categoryTriple → Triple 2 : [Totem] [has_category] [OFC:Animal]
```

### Détails internes

La fonction `createClaimWithCategory()` dans `useIntuition.ts` :

1. **Get/Create predicate atom** (si string, sinon utilise Hex existant)
2. **Get/Create object atom** (totem)
3. **Vérifie si triple existe** → `ClaimExistsError` si oui
4. **Crée Triple 1** : `[Founder] [predicate] [Totem]` avec le dépôt user
5. **Crée Triple 2** : `[Totem] [has_category] [OFC:Category]` avec min_deposit

---

## Coûts

### Par nouveau totem
| Action | Coût estimé |
|--------|-------------|
| Triple 1 (vote) | ~triple_cost + dépôt user |
| Triple 2 (catégorie) | ~triple_cost + min_deposit |
| **Total** | **~2x triple_cost** |

### Atoms de catégorie (une seule fois)
| Action | Coût estimé |
|--------|-------------|
| Atom "has_category" | ~atom_cost |
| 6 atoms OFC:* | ~6x atom_cost |
| **Total setup** | **~7x atom_cost** |

---

## Fichiers implémentés

### 1. `packages/shared/src/data/categories.json` ✅
Configuration des 6 catégories OFC avec le prédicat has_category.

```json
{
  "predicate": {
    "id": "has-category",
    "label": "has_category",
    "description": "Predicate for categorizing totems in OFC",
    "termId": null  // Sera rempli après création on-chain
  },
  "categories": [
    { "id": "animal", "label": "OFC:Animal", "name": "Animal", "termId": null },
    { "id": "objet", "label": "OFC:Objet", "name": "Objet", "termId": null },
    { "id": "trait", "label": "OFC:Trait", "name": "Trait", "termId": null },
    { "id": "concept", "label": "OFC:Concept", "name": "Concept", "termId": null },
    { "id": "element", "label": "OFC:Element", "name": "Element", "termId": null },
    { "id": "mythologie", "label": "OFC:Mythologie", "name": "Mythologie", "termId": null }
  ]
}
```

### 2. `apps/web/src/hooks/useIntuition.ts` ✅
- `createClaimWithCategory()` - Crée 2 triples (vote + catégorie)
- Interface TypeScript `CategoryConfig`
- Gestion automatique des atoms (get or create)

### 3. `apps/web/src/lib/graphql/subscriptions.ts` ✅
- `SUBSCRIBE_TOTEM_CATEGORIES` - Temps réel sur toutes les catégories
- `SUBSCRIBE_CATEGORIES_BY_TOTEMS` - Batch subscription par IDs

### 4. `apps/web/src/lib/graphql/queries.ts` ✅
- `GET_TOTEM_CATEGORY` - Catégorie d'un totem
- `GET_CATEGORIES_BY_TOTEMS` - Batch query
- `GET_ALL_TOTEM_CATEGORIES` - Toutes les catégories
- `GET_TOTEMS_BY_CATEGORY` - Totems d'une catégorie

### 5. `apps/web/src/components/VotePanel.tsx` ✅
- Import `typedCategoriesConfig` depuis categories.json
- Sélecteur de catégorie dans l'UI
- Preview du triple `[Totem] [has_category] [OFC:*]`
- Utilise `createClaimWithCategory` au lieu de `createClaimWithDescription`
- Fallback vers description pour rétrocompatibilité

---

## Migration des données existantes

### Totems existants sans triple de catégorie
Les totems créés avec l'ancienne méthode (description) n'auront pas de triple de catégorie.

**Options** :
1. **Ignorer** : Ils apparaîtront sans catégorie (filtrable via "Tous")
2. **Script de migration** : Créer les triples de catégorie pour les totems existants (coûteux)
3. **Fallback** : Garder la lecture de `description` en HTTP comme fallback

**Recommandation** : Option 3 (fallback) pour la rétrocompatibilité.

---

## Avantages de cette architecture

1. **WebSocket compatible** : Les catégories sont queryables en temps réel
2. **Standard INTUITION** : Utilise le système de triples natif
3. **Filtrage puissant** : Query par prédicat + objet
4. **Extensible** : Facile d'ajouter de nouvelles catégories
5. **Visible sur l'explorer** : Les relations sont visibles sur portal.intuition.systems

## Inconvénients

1. **Coût double** : 2 triples par totem au lieu de 1
2. **Complexité** : 2 transactions au lieu de 1
3. **Atomicité** : Si le 2ème triple échoue, le totem existe sans catégorie
4. **Setup initial** : Créer les atoms de catégorie (une seule fois)

---

## Prochaines étapes

1. [x] ✅ Créer `categories.json` avec la config
2. [ ] ⏳ Créer les atoms on-chain (has_category + OFC:*) - **Au premier usage**
3. [x] ✅ Modifier `useIntuition.ts` pour créer les 2 triples
4. [x] ✅ Ajouter les queries/subscriptions GraphQL
5. [x] ✅ Mettre à jour `VotePanel.tsx`
6. [ ] ⏳ Tester le flow complet on-chain
7. [ ] ⏳ Documenter les atomIds créés (après test)

---

**Dernière mise à jour** : 26 novembre 2025
