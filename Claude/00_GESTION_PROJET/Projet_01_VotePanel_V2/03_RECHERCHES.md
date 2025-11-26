# Recherches Techniques - VotePanel V2

> **Date** : 27 novembre 2025

---

## 1. WebSocket Subscriptions vs Polling

### Résultat de recherche

**L'API INTUITION (Hasura) supporte les WebSocket subscriptions.**

### Configuration WebSocket INTUITION

```
URL WebSocket : wss://testnet.intuition.sh/v1/graphql
Protocole : graphql-ws (recommandé par Hasura)
```

### Comparaison

| Aspect | Polling (30s) | WebSocket Subscription |
|--------|---------------|------------------------|
| Latence | 0-30 secondes | < 1 seconde |
| Requêtes/min/user | 2-3 | 0 (push server) |
| Charge serveur | Élevée (répétitive) | Faible (connexion unique) |
| Batterie mobile | Consomme | Passive (idle) |
| Complexité setup | Faible | Moyenne |

### Décision

**WebSocket subscriptions** - Meilleur sur tous les critères, supporté par l'API.

---

## 2. Configuration Apollo Client avec WebSocket

### Package recommandé

```bash
pnpm add graphql-ws
```

> **Note** : `graphql-ws` est le package moderne recommandé par Hasura et Apollo.
> L'ancien `subscriptions-transport-ws` est déprécié.

### Implémentation

```typescript
// apps/web/src/lib/apollo-client.ts

import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// HTTP Link pour queries et mutations
const httpLink = new HttpLink({
  uri: 'https://testnet.intuition.sh/v1/graphql',
});

// WebSocket Link pour subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'wss://testnet.intuition.sh/v1/graphql',
    // Reconnexion automatique
    retryAttempts: 5,
    shouldRetry: () => true,
    // Lazy connection (connecte seulement quand subscription active)
    lazy: true,
    // Callback quand connexion établie
    on: {
      connected: () => console.log('[Apollo] WebSocket connected'),
      closed: () => console.log('[Apollo] WebSocket closed'),
      error: (err) => console.error('[Apollo] WebSocket error:', err),
    },
  })
);

// Split : HTTP pour queries, WS pour subscriptions
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
```

### Exemple de Subscription GraphQL

```graphql
subscription SubscribeFounderProposals($founderName: String!) {
  triples(
    where: { subject: { label: { _eq: $founderName } } }
    order_by: { created_at: desc }
  ) {
    term_id
    predicate { label }
    object { label, description }
    triple_vault { total_assets }
    counter_term { total_assets }
  }
}
```

### Hook useSubscription

```typescript
import { useSubscription } from '@apollo/client';
import { SUBSCRIBE_FOUNDER_PROPOSALS } from '../lib/graphql/subscriptions';

export function useFounderSubscription(founderName: string) {
  const { data, loading, error } = useSubscription(
    SUBSCRIBE_FOUNDER_PROPOSALS,
    {
      variables: { founderName },
      skip: !founderName,
    }
  );

  return {
    proposals: data?.triples || [],
    loading,
    error,
  };
}
```

---

## 3. Apollo Cache Strategy

### Résultat de recherche

Pour notre cas d'usage (données qui changent fréquemment + besoin d'affichage rapide), la stratégie recommandée est :

### Stratégie retenue : `cache-and-network`

```typescript
const { data } = useQuery(GET_FOUNDER_PROPOSALS, {
  variables: { founderName },
  fetchPolicy: 'cache-and-network',
  nextFetchPolicy: 'cache-first',
});
```

### Explication

| fetchPolicy | Comportement |
|-------------|--------------|
| `cache-first` | Utilise cache, fetch seulement si pas en cache |
| `network-only` | Toujours fetch, ignore cache |
| `cache-and-network` | **Affiche cache immédiatement** + fetch en background + met à jour |
| `no-cache` | Toujours fetch, ne stocke pas en cache |

### Pourquoi `cache-and-network` ?

1. **UX rapide** : L'utilisateur voit les données instantanément (depuis cache)
2. **Données fraîches** : Mise à jour automatique en background
3. **Pas de spinner inutile** : Pas de loading state si cache disponible

### `nextFetchPolicy: 'cache-first'`

Après le premier fetch, les re-renders utilisent le cache. Évite les refetch inutiles lors de :
- Changement d'onglet React
- Re-mount du composant
- Changement de state parent

---

## 4. Pause Subscriptions quand Onglet Masqué

### Problème

Les subscriptions WebSocket continuent de recevoir des données même quand l'onglet est masqué. Cela :
- Consomme de la batterie (mobile)
- Utilise de la bande passante inutilement
- Peut causer des re-renders inutiles

### Solution : Hook `useWindowFocus`

```typescript
// apps/web/src/hooks/useWindowFocus.ts

import { useState, useEffect } from 'react';

export function useWindowFocus() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
```

### Utilisation avec Subscriptions

```typescript
function VotePanel({ founder }) {
  const isWindowVisible = useWindowFocus();

  // Skip subscription quand onglet masqué
  const { data } = useSubscription(SUBSCRIBE_FOUNDER_PROPOSALS, {
    variables: { founderName: founder.name },
    skip: !isWindowVisible, // ← Pause quand onglet masqué
  });

  // ...
}
```

### Avantages

- Économie batterie sur mobile
- Réduction charge serveur
- Reconnexion automatique quand onglet redevient visible

---

## 5. Indicateur "Actualisé"

### Concept

Afficher un feedback visuel après chaque mise à jour des données :

```
"Actualisé" → fade out après 3 secondes
```

### Implémentation

```typescript
const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);

// Quand nouvelles données arrivent
useEffect(() => {
  if (data) {
    setShowRefreshIndicator(true);
    const timer = setTimeout(() => setShowRefreshIndicator(false), 3000);
    return () => clearTimeout(timer);
  }
}, [data]);

// Dans le JSX
{showRefreshIndicator && (
  <span className="text-green-400 text-xs animate-fade-out">
    Actualisé
  </span>
)}
```

### CSS Animation

```css
@keyframes fade-out {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

.animate-fade-out {
  animation: fade-out 3s ease-out forwards;
}
```

---

## 6. Gestion du Cache après Création

### Problème

Quand on crée un nouveau claim, le cache Apollo ne contient pas encore ce claim.

### Solutions

#### Option A : Refetch (simple)

```typescript
const handleSubmit = async () => {
  await createClaim(params);
  // Force refetch pour mettre à jour le cache
  await refetch();
};
```

#### Option B : Update cache manuellement (optimiste)

```typescript
const [createClaim] = useMutation(CREATE_CLAIM, {
  update(cache, { data }) {
    // Ajouter le nouveau claim au cache
    cache.modify({
      fields: {
        triples(existingTriples = []) {
          return [data.newTriple, ...existingTriples];
        }
      }
    });
  }
});
```

### Recommandation

**Option A (refetch)** est suffisante pour notre cas. Le refetch est rapide et simple. L'option B est utile pour des UX "optimistes" où on veut voir le résultat avant confirmation blockchain.

---

## 7. Références Documentation

### Apollo Client

- [Subscriptions over WebSocket](https://www.apollographql.com/docs/react/data/subscriptions/)
- [Fetch policies](https://www.apollographql.com/docs/react/data/queries/#fetch-policies)
- [Cache configuration](https://www.apollographql.com/docs/react/caching/cache-configuration/)

### Hasura

- [GraphQL Subscriptions](https://hasura.io/docs/latest/subscriptions/postgres/)
- [WebSocket protocol](https://hasura.io/docs/latest/subscriptions/postgres/livequery/use-cases/)

### graphql-ws

- [GitHub: graphql-ws](https://github.com/enisdenjo/graphql-ws)
- [Recipes for Apollo Client](https://github.com/enisdenjo/graphql-ws#apollo-client)

---

## 8. Checklist Implémentation

### Setup WebSocket

- [ ] Installer `graphql-ws`
- [ ] Créer/modifier `apollo-client.ts` avec split link
- [ ] Tester connexion WebSocket dans console

### Subscriptions

- [ ] Créer fichier `subscriptions.ts` avec les subscriptions GraphQL
- [ ] Créer hook `useFounderSubscription`
- [ ] Intégrer dans VotePanel

### Optimisations

- [ ] Créer hook `useWindowFocus`
- [ ] Intégrer skip quand onglet masqué
- [ ] Ajouter indicateur "Actualisé"

### Tests

- [ ] Tester temps réel : créer claim dans autre onglet, vérifier mise à jour
- [ ] Tester pause : masquer onglet, vérifier pas de re-renders
- [ ] Tester reconnexion : couper WiFi, reconnecter

---

**Voir aussi** :
- [01_ARCHITECTURE.md](./01_ARCHITECTURE.md) - Architecture technique
- [02_ETAT_IMPLEMENTATION.md](./02_ETAT_IMPLEMENTATION.md) - État actuel
