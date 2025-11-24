# Voir les résultats

## Vue d'ensemble

Les résultats sont visibles **en temps réel** pendant toute la période de vote et restent consultables après la fin.

⚠️ **IMPORTANT - Agrégation des votes** :
Le totem gagnant pour chaque fondateur est celui qui a le **score NET le plus élevé** après agrégation de tous les triples (claims) pointant vers ce totem.

**Pourquoi l'agrégation est critique** :
- Un même totem peut avoir **plusieurs claims** avec des prédicats différents
- Exemple : `[Joseph] [represented_by] [Lion]` + `[Joseph] [embodies] [Lion]`
- Il faut **additionner** tous les votes de ces claims pour obtenir le score total du Lion

## Page des résultats globaux

### Vue d'ensemble des 42 fondateurs

Affichage en grille avec pour chaque fondateur :

```
┌──────────────────────────────────┐
│ Joseph Lubin                     │
│                                  │
│ 🏆 Totem gagnant: Lion          │
│ [Image du lion]                  │
│                                  │
│ 💰 150 $TRUST NET • 3 claims     │
│ 12 votants • 5 totems proposés   │
│                                  │
│ [ Voir détails ]                 │
└──────────────────────────────────┘
```

**Calcul du score NET** :
- Score NET = (Total FOR - Total AGAINST) pour tous les claims du totem
- Le totem avec le score NET le plus élevé gagne

### Tri et filtres
- Par défaut : ordre alphabétique des fondateurs
- Option : tri par score NET total
- Option : tri par nombre de propositions
- Filtrage par type de totem gagnant (animal/objet/trait/univers)

## Page de résultats détaillés (par fondateur)

### Section 1 : Totem gagnant

**Mis en avant avec bannière** :
```
🏆 TOTEM GAGNANT

Lion
Symbole de force et leadership

[Grande image du lion]

💰 150 $TRUST NET (170 FOR - 20 AGAINST)
📊 3 claims • 12 votants
📅 Proposé le 15 nov 2025 par 0x1234...5678

Claims agrégés :
- [represented_by] : +80 NET (90 FOR - 10 AGAINST)
- [embodies] : +50 NET (60 FOR - 10 AGAINST)
- [channels] : +20 NET (20 FOR - 0 AGAINST)
```

### Section 2 : Classement complet

Liste de tous les totems proposés, triés par score NET :

| Rang | Totem | Type | NET | FOR | AGAINST | Claims | Votants | Détails |
|------|-------|------|-----|-----|---------|--------|---------|---------|
| 🥇 | Lion | Animal | 150 | 170 | 20 | 3 | 12 | [Voir] |
| 🥈 | Épée | Objet | 80 | 85 | 5 | 2 | 7 | [Voir] |
| 🥉 | Soleil | Univers | 45 | 45 | 0 | 1 | 5 | [Voir] |
| 4 | Leadership | Trait | 20 | 22 | 2 | 1 | 3 | [Voir] |
| 5 | Phénix | Animal | -5 | 10 | 15 | 2 | 4 | [Voir] |

**Note** : Un totem peut avoir un score NET négatif si AGAINST > FOR

### Section 3 : Statistiques

- **Score NET total** : 290
- **Total FOR** : 332 $TRUST
- **Total AGAINST** : 42 $TRUST
- **Nombre de totems** : 5
- **Nombre total de claims** : 9
- **Nombre de votants uniques** : 18
- **Claim le plus récent** : il y a 2h
- **Vote le plus récent** : il y a 15 min

## Page de détails d'un totem

Clic sur "Voir détails" d'un totem :

### Informations générales
- Nom et type
- Description complète
- Image haute résolution
- Proposé par (adresse + date du premier claim)

### Votes détaillés

**Vue agrégée par totem** :
- Score NET total : 150 $TRUST
- Total FOR : 170 $TRUST
- Total AGAINST : 20 $TRUST
- Nombre de claims : 3
- Nombre de votants uniques : 12

**Détail par claim** :
```
┌─────────────────────────────────────────────────────────┐
│ Claim #1 : [Joseph Lubin] [represented_by] [Lion]     │
│ NET: +80 (90 FOR - 10 AGAINST) • 7 votants            │
│ Triple ID: 0xabc...                                     │
├─────────────────────────────────────────────────────────┤
│ Claim #2 : [Joseph Lubin] [embodies] [Lion]           │
│ NET: +50 (60 FOR - 10 AGAINST) • 5 votants            │
│ Triple ID: 0xdef...                                     │
├─────────────────────────────────────────────────────────┤
│ Claim #3 : [Joseph Lubin] [channels] [Lion]           │
│ NET: +20 (20 FOR - 0 AGAINST) • 3 votants             │
│ Triple ID: 0xghi...                                     │
└─────────────────────────────────────────────────────────┘
```

**Liste des votants (tous claims confondus)** :
```
┌──────────────────────────────────────────────────────┐
│ Adresse         Claim         FOR/AGAINST   Date    │
├──────────────────────────────────────────────────────┤
│ 0x1234...5678  represented_by  50 FOR   Il y a 1h  │
│ 0xabcd...ef01  embodies        25 FOR   Il y a 2h  │
│ 0x9876...5432  represented_by  20 AGAINST Il y a 3h│
│ ...                                                  │
└──────────────────────────────────────────────────────┘
```

### Graphiques et visualisations

**Timeline des votes** :
- Graphique montrant l'évolution du score NET au fil du temps
- Courbes FOR et AGAINST séparées
- Points marquant la création de nouveaux claims

**Répartition par claim** :
- Bar chart : contribution de chaque claim au score NET total
- Pie chart : % de votes FOR par claim

## Recherche et navigation

### Barre de recherche
- Recherche par nom de fondateur
- Recherche par nom de totem
- Recherche par adresse wallet

### Filtres avancés
- Par type de totem (animal/objet/trait/univers)
- Par période (votes des dernières 24h, 7j, etc.)
- Par score NET minimum
- Par nombre de claims

## Vue "Mes votes"

Page personnelle pour voir tous ses votes :

### Récapitulatif
- Nombre total de votes effectués
- Montant total de $TRUST déposé (FOR + AGAINST)
- Nombre de fondateurs votés
- Nombre de totems votés

### Liste des votes
```
┌────────────────────────────────────────────────────────┐
│ Joseph Lubin → Lion [represented_by]                  │
│ 25 $TRUST FOR • Il y a 2h                             │
│ Totem NET actuel : +150 (🥇 sur 5 totems)             │
│ [ Ajouter des votes ] [ Voir résultats ]              │
├────────────────────────────────────────────────────────┤
│ Andrew Keys → Katana [embodies]                       │
│ 10 $TRUST FOR • Il y a 5h                             │
│ Totem NET actuel : +45 (🥈 sur 3 totems)              │
│ [ Ajouter des votes ] [ Voir résultats ]              │
└────────────────────────────────────────────────────────┘
```

## Exportation des résultats

### Pour l'admin (Overmind)

**Export JSON avec agrégation** :
```json
{
  "founder": "Joseph Lubin",
  "winning_totem": {
    "name": "Lion",
    "type": "animal",
    "description": "Symbole de force et leadership",
    "image": "ipfs://QmXxxx...",
    "aggregated_votes": {
      "net_score": "150000000000000000000",
      "total_for": "170000000000000000000",
      "total_against": "20000000000000000000",
      "claim_count": 3,
      "voter_count": 12
    },
    "claims": [
      {
        "triple_id": "0xabc...",
        "predicate": "represented_by",
        "net_score": "80000000000000000000",
        "for": "90000000000000000000",
        "against": "10000000000000000000"
      },
      {
        "triple_id": "0xdef...",
        "predicate": "embodies",
        "net_score": "50000000000000000000",
        "for": "60000000000000000000",
        "against": "10000000000000000000"
      }
    ],
    "creator": "0x1234...5678"
  },
  "all_totems": [...]
}
```

**Export CSV avec agrégation** :
```csv
Founder,Totem,Type,NET_TRUST,FOR_TRUST,AGAINST_TRUST,Claims,Voters
Joseph Lubin,Lion,Animal,150,170,20,3,12
Joseph Lubin,Épée japonaise,Objet,80,85,5,2,7
...
```

### Métadonnées NFT

Export automatique des métadonnées pour les NFTs 3D :
```json
{
  "name": "Joseph Lubin - Lion Totem",
  "description": "INTUITION Founders Collection - Joseph Lubin represented by Lion",
  "image": "ipfs://...",
  "attributes": [
    {
      "trait_type": "Founder",
      "value": "Joseph Lubin"
    },
    {
      "trait_type": "Totem Type",
      "value": "Animal"
    },
    {
      "trait_type": "Totem",
      "value": "Lion"
    },
    {
      "trait_type": "NET Score",
      "value": "150 TRUST"
    },
    {
      "trait_type": "FOR Votes",
      "value": "170 TRUST"
    },
    {
      "trait_type": "AGAINST Votes",
      "value": "20 TRUST"
    },
    {
      "trait_type": "Number of Claims",
      "value": 3
    },
    {
      "trait_type": "Voter Count",
      "value": 12
    },
    {
      "trait_type": "Selection Date",
      "value": "2025-11-22"
    }
  ]
}
```

## Après la fin du vote

### Annonce des résultats officiels

**Page spéciale "Résultats finaux"** :
- Message de félicitations
- Annonce de la prochaine étape (création des NFTs 3D)
- Remerciements aux participants

### Statut "Finalisé"

Une fois la période de vote terminée :
- ✅ Résultats figés (plus de modifications)
- 🔒 Plus de votes possibles
- 📊 Statistiques finales avec agrégation complète
- 🎨 Lancement de la création des NFTs

### Communication

**Éléments à partager** :
- Image de tous les 42 totems gagnants
- Top 10 des totems par score NET
- Statistiques globales :
  - Total NET : X $TRUST
  - Total FOR : Y $TRUST
  - Total AGAINST : Z $TRUST
  - Total de claims : W
  - Total de votants : V

## Affichage temps réel

### Technologies

**GraphQL Subscriptions** :
```typescript
const subscription = `
  subscription OnTripleVotesUpdated($tripleId: String!) {
    triples_by_pk(id: $tripleId) {
      positiveVault {
        totalAssets
      }
      negativeVault {
        totalAssets
      }
      deposits_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;
```

**Apollo Client** (polling) :
```typescript
useQuery(GET_ALL_PROPOSALS, {
  queryKey: ['founder-proposals', founderId],
  fetchPolicy: 'cache-and-network',
  pollInterval: 5000  // Actualisation toutes les 5s
});
```

### Notifications live

**Événements affichés** :
- 🔔 "Nouveau vote FOR pour Lion [represented_by] !"
- 🏆 "Lion vient de dépasser Épée ! (NET: +150)"
- 🎉 "100 $TRUST NET atteints pour Lion !"
- 📊 "Nouveau claim créé : [Joseph] [embodies] [Lion]"

## Vérification on-chain

Tout utilisateur peut vérifier les résultats directement sur la blockchain :

**Via INTUITION Explorer** :
- Lien direct vers chaque Triple (claim)
- Visualisation des vaults FOR et AGAINST
- Liste de toutes les transactions
- Agrégation transparente des scores

**Via INTUITION L3 Testnet Explorer** :
- Vérification des transactions de deposit
- Audit trail complet
- Contrats MultiVault visibles

## Récupération des données - AVEC AGRÉGATION

### ⚠️ APPROCHE INCORRECTE (Ne pas utiliser)

```typescript
// ❌ INCORRECT : Ne récupère qu'UN seul triple par totem
const wrongQuery = `
  query GetWinningTotem($founderId: String!) {
    triples(
      where: {
        subject_id: { _eq: $founderId }
        predicate: { label: { _eq: "represented_by" } }
      }
      order_by: { positiveVault: { totalAssets: desc } }
      limit: 1
    ) {
      ...
    }
  }
`;
```

**Problème** : Si le totem a plusieurs claims avec différents prédicats, cette query ne récupère que le premier claim, pas le total agrégé !

### ✅ APPROCHE CORRECTE (Utiliser celle-ci)

**Étape 1 : Récupérer TOUS les triples du fondateur**

```typescript
const query = `
  query GetFounderTriples($founderId: String!) {
    triples(
      where: {
        subject_id: { _eq: $founderId }
      }
    ) {
      id
      predicate {
        label
      }
      object {
        id
        label
        image
        description
      }
      positiveVault {
        totalAssets
      }
      negativeVault {
        totalAssets
      }
      creator {
        id
      }
      created_at
    }
  }
`;
```

**Étape 2 : Agréger côté client avec la fonction utils**

```typescript
import { aggregateTriplesByObject, getWinningTotem } from '@/utils/aggregateVotes';

// Récupérer les données
const { data } = useQuery(GET_FOUNDER_TRIPLES, {
  variables: { founderId }
});

// Agréger par totem (object)
const aggregatedTotems = aggregateTriplesByObject(data.triples);

// Obtenir le totem gagnant
const winningTotem = getWinningTotem(aggregatedTotems);

// aggregatedTotems contient :
// [
//   {
//     objectId: "0x...",
//     object: { label: "Lion", image: "ipfs://..." },
//     netScore: 150n,  // 170 - 20
//     totalFor: 170n,
//     totalAgainst: 20n,
//     claimCount: 3,
//     claims: [
//       {
//         tripleId: "0xabc...",
//         predicate: "represented_by",
//         netScore: 80n,
//         trustFor: 90n,
//         trustAgainst: 10n
//       },
//       // ... autres claims
//     ]
//   },
//   // ... autres totems
// ]
```

### Query pour tous les résultats (42 fondateurs)

```typescript
const query = `
  query GetAllFoundersTriples {
    triples(
      where: {
        subject: {
          label: { _in: ["Joseph Lubin", "Andrew Keys", ...] }
        }
      }
    ) {
      id
      subject {
        id
        label
        image
      }
      predicate {
        label
      }
      object {
        id
        label
        image
        description
      }
      positiveVault {
        totalAssets
      }
      negativeVault {
        totalAssets
      }
      created_at
    }
  }
`;

// Puis agréger par fondateur ET par totem
const resultsByFounder = groupBy(data.triples, 'subject.id');
const aggregatedResults = Object.entries(resultsByFounder).map(([founderId, triples]) => ({
  founder: triples[0].subject,
  totems: aggregateTriplesByObject(triples),
  winningTotem: getWinningTotem(aggregateTriplesByObject(triples))
}));
```

## Interface responsive

### Desktop
- Grille 3-4 colonnes pour les fondateurs
- Sidebar avec filtres
- Graphiques détaillés par claim
- Tableau d'agrégation visible

### Tablet
- Grille 2 colonnes
- Filtres en modal
- Graphiques simplifiés
- Vue résumée de l'agrégation

### Mobile
- Liste verticale
- Swipe pour naviguer
- Vue compacte (score NET seulement)
- Bottom sheet pour détails des claims

## Accessibilité

- ♿ Support lecteurs d'écran
- ⌨️ Navigation au clavier
- 🎨 Contraste élevé
- 📱 Touch-friendly (boutons min 44px)

## Performance

- ⚡ Cache des résultats agrégés côté client (Apollo Client)
- 🔄 Lazy loading des images
- 📦 Pagination si > 100 propositions
- 🎯 Optimistic UI updates
- 💾 localStorage pour cache des agrégations fréquentes

---

## 📋 Issues GitHub créées à partir de ce fichier

### ✅ Issues CLOSED (Complétées)
- **Issue #43** : Frontend - Créer page Results globale (tous les fondateurs avec agrégation) ✅
- **Issue #44** : Frontend - Créer page FounderDetails (résultats détaillés avec agrégation) ✅
- **Issue #45** : Frontend - Créer page TotemDetails (détails des claims multiples) ✅

### ⏳ Issues OPEN (À développer)
- **Issue #46** : Frontend - Créer requêtes GraphQL pour statistiques et résultats (avec agrégation)
- **Issue #47** : Frontend - Fonction export résultats (JSON/CSV/NFT metadata) côté client

**Total : 5 issues (3 closed, 2 open)**

**Note** : Issues #46 et #47 sont **Frontend** (pas Backend) car architecture frontend-only.

**Note importante** : Les commentaires détaillés sur l'agrégation ont été ajoutés sur les issues #33, #34, #46, #47 le 21/11/2025.

---

**Dernière mise à jour** : 21 novembre 2025
**Architecture** : Frontend-only (pas de backend)
**Réseau** : INTUITION L3 Testnet (chain ID: 13579)
**Fonction d'agrégation** : `utils/aggregateVotes.ts` (déjà implémentée avec 17 tests)
