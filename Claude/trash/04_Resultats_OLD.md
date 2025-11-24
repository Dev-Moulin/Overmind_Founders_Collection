# Voir les résultats

## Vue d'ensemble

Les résultats sont visibles **en temps réel** pendant toute la période de vote et restent consultables après la fin.

Le totem gagnant pour chaque fondateur est celui qui a reçu le plus de $TRUST dans son vault FOR.

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
│ 💰 150 $TRUST • 12 votants       │
│ 5 totems proposés au total       │
│                                  │
│ [ Voir détails ]                 │
└──────────────────────────────────┘
```

### Tri et filtres
- Par défaut : ordre alphabétique des fondateurs
- Option : tri par nombre total de votes
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

💰 150 $TRUST déposés
👥 12 votants
📅 Proposé le 15 nov 2025 par 0x1234...5678
```

### Section 2 : Classement complet

Liste de tous les totems proposés, triés par nombre de votes :

| Rang | Totem | Type | $TRUST | Votants | Détails |
|------|-------|------|--------|---------|---------|
| 🥇 | Lion | Animal | 150 | 12 | [Voir] |
| 🥈 | Épée japonaise | Objet | 80 | 7 | [Voir] |
| 🥉 | Soleil | Univers | 45 | 5 | [Voir] |
| 4 | Leadership | Trait | 20 | 3 | [Voir] |
| 5 | Phénix | Animal | 10 | 2 | [Voir] |

### Section 3 : Statistiques

- **Total de $TRUST déposés** : 305
- **Nombre de propositions** : 5
- **Nombre de votants uniques** : 18
- **Proposition la plus récente** : il y a 2h
- **Vote le plus récent** : il y a 15 min

## Page de détails d'un totem

Clic sur "Voir détails" d'un totem :

### Informations générales
- Nom et type
- Description complète
- Image haute résolution
- Proposé par (adresse + date)

### Votes détaillés

**Vue agrégée** :
- Total $TRUST déposé
- Nombre de votants
- Distribution des votes (graphique)

**Liste des votants** :
```
┌─────────────────────────────────────────────┐
│ Adresse           Montant        Date       │
├─────────────────────────────────────────────┤
│ 0x1234...5678    50 $TRUST      Il y a 1h  │
│ 0xabcd...ef01    25 $TRUST      Il y a 2h  │
│ 0x9876...5432    20 $TRUST      Il y a 3h  │
│ ...                                         │
└─────────────────────────────────────────────┘
```

### Graphiques et visualisations

**Timeline des votes** :
- Graphique montrant l'évolution du nombre de $TRUST au fil du temps
- Permet de voir les périodes de forte activité

**Répartition des votes** :
- Pie chart : % de $TRUST par totem pour ce fondateur
- Bar chart : comparaison des totems

## Recherche et navigation

### Barre de recherche
- Recherche par nom de fondateur
- Recherche par nom de totem
- Recherche par adresse wallet

### Filtres avancés
- Par type de totem (animal/objet/trait/univers)
- Par période (votes des dernières 24h, 7j, etc.)
- Par montant minimum de votes

## Vue "Mes votes"

Page personnelle pour voir tous ses votes :

### Récapitulatif
- Nombre total de votes effectués
- Montant total de $TRUST déposé
- Nombre de fondateurs votés

### Liste des votes
```
┌────────────────────────────────────────────────┐
│ Joseph Lubin → Lion                           │
│ 25 $TRUST • Il y a 2h                         │
│ Position actuelle : 🥇 (150 $TRUST au total)  │
│ [ Ajouter des votes ] [ Voir résultats ]      │
├────────────────────────────────────────────────┤
│ Andrew Keys → Katana                          │
│ 10 $TRUST • Il y a 5h                         │
│ Position actuelle : 🥈 (45 $TRUST au total)   │
│ [ Ajouter des votes ] [ Voir résultats ]      │
└────────────────────────────────────────────────┘
```

## Exportation des résultats

### Pour l'admin (Overmind)

**Export JSON** :
```json
{
  "founder": "Joseph Lubin",
  "winning_totem": {
    "name": "Lion",
    "type": "animal",
    "description": "Symbole de force et leadership",
    "image": "ipfs://QmXxxx...",
    "votes": {
      "total_trust": "150000000000000000000",
      "voter_count": 12
    },
    "triple_id": "0x...",
    "creator": "0x1234...5678"
  },
  "all_proposals": [...]
}
```

**Export CSV** :
```csv
Founder,Totem,Type,TRUST,Voters,TripleID
Joseph Lubin,Lion,Animal,150,12,0x...
Joseph Lubin,Épée japonaise,Objet,80,7,0x...
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
      "trait_type": "Total Votes",
      "value": "150 TRUST"
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
- 📊 Statistiques finales
- 🎨 Lancement de la création des NFTs

### Communication

**Éléments à partager** :
- Image de tous les 42 totems gagnants
- Top 10 des totems les plus votés
- Statistiques globales :
  - Total de $TRUST déposé : X
  - Total de propositions : Y
  - Total de votants : Z
  - Total de votes : W

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
      deposits_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;
```

**React Query** (polling) :
```typescript
useQuery({
  queryKey: ['triple', tripleId],
  queryFn: () => getTripleDetails(tripleId),
  refetchInterval: 5000  // Actualisation toutes les 5s
});
```

### Notifications live

**Événements affichés** :
- 🔔 "Nouveau vote pour Lion !"
- 🏆 "Lion vient de dépasser Épée !"
- 🎉 "100 $TRUST atteints pour Lion !"

## Vérification on-chain

Tout utilisateur peut vérifier les résultats directement sur la blockchain :

**Via INTUITION Explorer** :
- Lien direct vers le Triple
- Visualisation du vault FOR
- Liste de toutes les transactions

**Via Base Explorer (Basescan)** :
- Vérification des transactions de deposit
- Audit trail complet

## Récupération des données

### Query pour le totem gagnant

```typescript
const query = `
  query GetWinningTotem($founderId: String!) {
    triples(
      where: {
        subject_id: { _eq: $founderId }
        predicate: { label: { _eq: "represented_by" } }
      }
      order_by: { positiveVault: { totalAssets: desc } }
      limit: 1
    ) {
      id
      object {
        id
        label
        image
        description
      }
      positiveVault {
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

### Query pour tous les résultats

```typescript
const query = `
  query GetAllResults {
    founders: atoms(
      where: {
        label: { _in: ["Joseph Lubin", "Andrew Keys", ...] }
      }
    ) {
      id
      label
      outgoing_triples(
        where: { predicate: { label: { _eq: "represented_by" } } }
        order_by: { positiveVault: { totalAssets: desc } }
      ) {
        id
        object {
          label
          image
        }
        positiveVault {
          totalAssets
        }
        deposits_aggregate {
          aggregate { count }
        }
      }
    }
  }
`;
```

## Interface responsive

### Desktop
- Grille 3-4 colonnes pour les fondateurs
- Sidebar avec filtres
- Graphiques détaillés

### Tablet
- Grille 2 colonnes
- Filtres en modal
- Graphiques simplifiés

### Mobile
- Liste verticale
- Swipe pour naviguer
- Vue compacte
- Bottom sheet pour détails

## Accessibilité

- ♿ Support lecteurs d'écran
- ⌨️ Navigation au clavier
- 🎨 Contraste élevé
- 📱 Touch-friendly (boutons min 44px)

## Performance

- ⚡ Cache des résultats côté client
- 🔄 Lazy loading des images
- 📦 Pagination si > 100 propositions
- 🎯 Optimistic UI updates

---

## 📋 Issues GitHub créées à partir de ce fichier

- **Issue #43** : Frontend - Créer page Results globale (tous les fondateurs)
- **Issue #44** : Frontend - Créer page FounderDetails (résultats détaillés par fondateur)
- **Issue #45** : Frontend - Créer page TotemDetails (détails complets d un totem)
- **Issue #46** : Backend - Créer requêtes GraphQL pour statistiques et résultats
- **Issue #47** : Backend - Créer endpoint export résultats (JSON/CSV/NFT metadata)

**Total : 5 issues**
**Statut : ⏳ Issues créées (code à développer)**
