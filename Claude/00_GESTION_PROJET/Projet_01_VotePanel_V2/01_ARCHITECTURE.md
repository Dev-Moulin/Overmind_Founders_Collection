# Architecture - VotePanel V2

> **Date** : 27 novembre 2025

---

## 1. Vue d'ensemble

### Concept

L'utilisateur arrive sur la HomePage, voit la grille des 42 fondateurs, clique sur un fondateur et peut :
1. **Créer un vote** (nouveau claim) - si la combinaison Fondateur + Prédicat + Totem n'existe pas
2. **Voter sur un existant** - si le claim existe déjà (bonding curve)

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER                                                    [Connect] │
├───────────────────────────┬─────────────────────────────────────────┤
│                           │                                         │
│   FOUNDER EXPANDED VIEW   │              VOTE PANEL                 │
│   (1/3 écran)             │              (2/3 écran)                │
│                           │                                         │
│   ┌─────────────────┐     │   ┌─────────────────────────────────┐   │
│   │     Photo       │     │   │ Créer un vote totem             │   │
│   │     128x128     │     │   │                                 │   │
│   └─────────────────┘     │   │ 1. Prédicat [Accordion ▼]       │   │
│                           │   │    ○ is represented by          │   │
│   Joseph Lubin            │   │    ○ has totem                  │   │
│   @ethereumJoseph         │   │    ...                          │   │
│                           │   │                                 │   │
│   Co-founder of           │   │ 2. Totem [Accordion ▼]          │   │
│   Ethereum and            │   │    [Existant] [Nouveau]         │   │
│   ConsenSys...            │   │    ...                          │   │
│                           │   │                                 │   │
│   ───────────────────     │   │ 3. Montant TRUST                │   │
│                           │   │    [____] TRUST                 │   │
│   Propositions: 5         │   │    Balance: 1,234 TRUST         │   │
│   Total TRUST: 150        │   │                                 │   │
│   Totem gagnant: Lion     │   │ Preview:                        │   │
│                           │   │ "Joseph Lubin is represented    │   │
│   [× Fermer]              │   │  by Lion"                       │   │
│                           │   │                                 │   │
│                           │   │ [Créer le vote]                 │   │
│                           │   └─────────────────────────────────┘   │
│                           │                                         │
└───────────────────────────┴─────────────────────────────────────────┘
```

---

## 2. Distinction Créer vs Voter

### Tableau récapitulatif

| Action | Condition | Coût | Ce qui se passe |
|--------|-----------|------|-----------------|
| **Créer un vote** | Claim n'existe pas | `triple_cost` + dépôt | Crée un nouveau triple + vault |
| **Voter sur existant** | Claim existe déjà | Dépôt seulement | Ajoute TRUST au vault existant (bonding curve) |

### Bonding Curve (rappel)

Quand on vote sur un claim existant :
- Le TRUST est ajouté au vault du triple
- On reçoit des **shares** proportionnelles
- Le prix des shares augmente avec la demande
- On peut retirer (redeem) mais le montant varie selon le prix actuel

> Voir [Bonding_Curves.md](../documentation/structure_donnees/Bonding_Curves.md) pour les détails

---

## 3. Flow utilisateur

### A. Créer un vote (nouveau claim)

```
1. User clique sur un fondateur
2. Sélectionne un prédicat (ex: "is represented by")
3. Choisit/crée un totem (ex: "Lion" catégorie "Animaux")
4. Entre le montant TRUST
5. Clique "Créer le vote"
6. Transaction :
   a. Si nouveau totem → créer atom avec description "Categorie : Animaux"
   b. Si nouveau prédicat → créer atom (rare, prédicats fixes)
   c. Créer le triple (claim)
   d. Déposer le TRUST initial
7. Succès → Afficher confirmation + rafraîchir données
```

### B. Voter sur existant

```
1. User sélectionne une combinaison qui existe déjà
2. Système détecte que le claim existe
3. Modal s'affiche : "Ce claim existe déjà ! Voulez-vous voter dessus ?"
4. User clique "Voter sur ce claim"
5. Bascule vers interface "Voter sur existant"
6. User entre le montant TRUST
7. Transaction : Déposer dans le vault existant
8. Succès → Afficher confirmation + nouvelles shares
```

---

## 4. Données et Synchronisation

### Sources de données

| Données | Query/Subscription | Temps réel |
|---------|-------------------|------------|
| Tous les triples | `GET_TRIPLES_BY_PREDICATES` → Subscription | Oui (WebSocket) |
| Proposals du fondateur | `GET_FOUNDER_PROPOSALS` → Subscription | Oui (WebSocket) |
| Votes FOR/AGAINST | `triple_vault.total_assets` / `counter_term.total_assets` | Oui (WebSocket) |
| Config protocole | `useProtocolConfig` | Non (stable) |
| Balance user | `useBalance` (wagmi) | Oui (auto) |

### WebSocket Subscriptions

L'API INTUITION (Hasura) supporte les subscriptions GraphQL :

```typescript
// Exemple de subscription pour les votes en temps réel
const SUBSCRIBE_FOUNDER_PROPOSALS = gql`
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
`;
```

### Avantages WebSocket vs Polling

| Aspect | Polling 30s | WebSocket |
|--------|-------------|-----------|
| Latence | 0-30 secondes | < 1 seconde |
| Requêtes/min/user | 2-3 | 0 (push) |
| Charge serveur | Élevée | Faible |
| Batterie mobile | Consomme | Passive |

---

## 5. Composants

### Existants (créés)

| Composant | Fichier | Description |
|-----------|---------|-------------|
| `VotePanel` | `components/VotePanel.tsx` | Panneau principal de création de vote |
| `FounderExpandedView` | `components/FounderExpandedView.tsx` | Vue détaillée du fondateur |
| `FounderHomeCard` | `components/FounderHomeCard.tsx` | Card dans la grille |

### À créer

| Composant | Fichier | Description |
|-----------|---------|-------------|
| `VoteOnExisting` | `components/VoteOnExisting.tsx` | Interface pour voter sur claim existant |
| `ClaimExistsModal` | `components/ClaimExistsModal.tsx` | Modal quand claim existe déjà |
| `RefreshIndicator` | `components/RefreshIndicator.tsx` | Indicateur "Actualisé" |

---

## 6. Hooks

### Existants (créés/modifiés)

| Hook | Description |
|------|-------------|
| `useIntuition` | SDK INTUITION - `createClaim`, `createClaimWithDescription` |
| `useFounderProposals` | Fetch proposals d'un fondateur |
| `useProtocolConfig` | Config protocole (coûts, frais, minDeposit) |

### À créer

| Hook | Description |
|------|-------------|
| `useWindowFocus` | Détecter si onglet visible (pause subscriptions) |
| `useFounderSubscription` | Subscription WebSocket pour un fondateur |
| `useVoteOnExisting` | Logique pour voter sur claim existant |

---

## 7. Prédicats

### Liste fixe (6 prédicats)

Les utilisateurs **ne peuvent pas créer** de nouveaux prédicats.

| ID | Label | termId (à vérifier) |
|----|-------|---------------------|
| is-represented-by | is represented by | `0x...` |
| has-totem | has totem | `0x...` |
| is-symbolized-by | is symbolized by | `0x...` |
| embodies | embodies | `0x...` |
| channels | channels | `0x...` |
| resonates-with | resonates with | `0x...` |

Stockés dans : `packages/shared/src/data/predicates.json`

---

## 8. Catégories

### Stockage dans description

Les catégories sont stockées dans le champ `description` de l'atom totem :

```
description: "Categorie : Animaux"
```

### Catégories suggérées

| Catégorie | Emoji | Exemples |
|-----------|-------|----------|
| Animaux | 🦁 | Lion, Aigle, Loup, Hibou |
| Objets | ⚔️ | Clé maître, Boussole, Épée |
| Traits | ⭐ | Visionnaire, Leader, Innovateur |
| Superpowers | ⚡ | Transformation, Connexion |

### Filtrage

Pour identifier les totems créés via notre app :
```typescript
const isOurTotem = object.description?.startsWith('Categorie : ');
```

---

## 9. Sécurité et Validation

### Validations côté client

1. **Wallet connecté** → `isReady` de useIntuition
2. **Fondateur a un atomId** → Vérifier `founder.atomId`
3. **Montant valide** → `isDepositValid(amount)` avec minDeposit
4. **Balance suffisante** → Comparer avec `balanceData`

### Vérification claim existant

Avant création, le hook vérifie si le triple existe :
```typescript
const existingTriple = await findTriple(subjectId, predicateId, objectId);
if (existingTriple) {
  throw new ClaimExistsError({ ... });
}
```

---

## 10. Erreurs et Messages

### Messages d'erreur améliorés

| Erreur technique | Message utilisateur |
|-----------------|---------------------|
| `InsufficientBalance` | Balance tTRUST insuffisante. Assurez-vous d'avoir assez de tTRUST. |
| `TripleExists` | Ce claim existe déjà. Vous pouvez voter dessus. |
| `ClaimExistsError` | Ce claim existe déjà ! "X Y Z" - Voter dessus ? |

### Notifications

- **Succès** : Notification verte avec détails du claim créé
- **Erreur** : Notification rouge avec message + lien console
- **Info** : Modal pour claim existant

---

**Voir aussi** :
- [02_ETAT_IMPLEMENTATION.md](./02_ETAT_IMPLEMENTATION.md) - État actuel
- [03_RECHERCHES.md](./03_RECHERCHES.md) - Recherches techniques
- [TODO_Synchronisation_et_UX.md](./TODO_Synchronisation_et_UX.md) - Tâches
