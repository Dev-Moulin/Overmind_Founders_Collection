# Voter pour les totems

## Vue d'ensemble

Les utilisateurs éligibles votent pour leurs totems préférés en déposant du **$TRUST** dans les vaults des Triples (claims).

Plus un utilisateur dépose de $TRUST, plus il montre sa conviction que ce totem représente bien le fondateur.

## Système de vote INTUITION

### Vaults FOR et AGAINST

Chaque Triple (proposition/claim) possède **2 vaults** :
- **Vault FOR** (affirmatif) : "Je suis d'accord, ce totem représente bien ce fondateur"
- **Vault AGAINST** (négatif) : "Je ne suis pas d'accord"

**Pour ce projet** :
- Les utilisateurs peuvent voter **FOR ou AGAINST**
- Le score NET de chaque claim = FOR - AGAINST
- Le totem gagnant est calculé par **agrégation** de tous ses claims

### Principe du vote
1. L'utilisateur choisit un totem pour un fondateur
2. Il décide combien de $TRUST déposer (minimum : 1 $TRUST)
3. Il choisit FOR ou AGAINST
4. Il effectue une transaction pour déposer dans le vault
5. Le $TRUST est **récupérable** après la fin du vote

## Étape 1 : Voir les propositions

### Page d'un fondateur
- Liste de tous les totems proposés pour ce fondateur
- Pour chaque totem (vue agrégée) :
  - Nom et type (objet/animal/trait/univers)
  - Description
  - Image de référence
  - **Score NET agrégé** (total FOR - total AGAINST de tous les claims)
  - Nombre de claims
  - Nombre de votants uniques
  - Proposé par (adresse wallet du premier claim)

### Tri et filtrage
- Par défaut : triés par score NET agrégé (plus haut en haut)
- Option de tri par date de création
- Option de tri par nombre de claims
- Filtrage par type (objets, animaux, etc.)

## Étape 2 : Sélectionner un totem

L'utilisateur clique sur "Voter pour ce totem"

### Informations affichées
- Récapitulatif du totem
- Score NET agrégé : "X $TRUST NET (Y FOR - Z AGAINST)"
- Nombre de claims : "N claims"
- Liste des claims existants :
  - `[Joseph Lubin] [represented_by] [Lion]` - +80 NET
  - `[Joseph Lubin] [embodies] [Lion]` - +50 NET
- Son solde de $TRUST disponible
- Bouton "Déposer des $TRUST"

## Étape 3 : Choisir le montant et le sens du vote

### Interface
```
Voter pour : Lion

Choisissez un claim existant ou créez-en un nouveau :
[●] [Joseph Lubin] [represented_by] [Lion] (80 NET)
[ ] [Joseph Lubin] [embodies] [Lion] (50 NET)
[ ] Créer un nouveau claim avec un autre prédicat

Type de vote :
[●] FOR - Je suis d'accord
[ ] AGAINST - Je ne suis pas d'accord

Combien de $TRUST voulez-vous déposer ?

[ 1 ] [ 5 ] [ 10 ] [ 25 ] [ 50 ] [ Custom ]

Votre solde : 100 $TRUST

[ Slider: 1 ----●---- 100 ]

Total à déposer : 10 $TRUST FOR
```

### Contraintes
- **Minimum** : 1 $TRUST
- **Maximum** : Solde disponible du wallet
- **Décimales** : Jusqu'à 18 décimales (ERC-20 standard)

### Règles de vote
- **1 wallet = plusieurs votes possibles**
- Un wallet peut voter FOR et/ou AGAINST sur le **même claim**
- Un wallet peut voter sur **plusieurs claims différents** pour le même totem
- Le même wallet peut **ajouter du $TRUST** plusieurs fois

## Étape 4 : Transaction de dépôt

### Si première fois : Approval du token $TRUST

Avant de déposer, l'utilisateur doit **approuver** le contrat pour utiliser ses $TRUST :

```typescript
// Transaction 1 : Approval
// Géré automatiquement par le hook useVote
await approve(
  vaultAddress,     // Adresse du MultiVault (INTUITION L3 Testnet)
  amount           // Montant à approuver
);
```

**L'utilisateur doit :**
1. Approuver dans son wallet
2. Payer le gas (~$0.001 ETH sur INTUITION L3 Testnet)
3. Attendre confirmation

### Dépôt du $TRUST

```typescript
// Transaction 2 : Deposit
// Utilise batchDepositStatement du SDK INTUITION
await depositTriple(
  tripleId,        // ID du Triple (claim)
  amount,          // Montant de $TRUST
  isPositive       // true = FOR, false = AGAINST
);
```

**L'utilisateur doit :**
1. Confirmer dans son wallet
2. Payer le gas (~$0.001 ETH)
3. Attendre confirmation

**Implémentation** : Le hook `useVote` (issue #38) gère tout ce processus automatiquement avec gestion d'états et toasts.

## Étape 5 : Confirmation

Une fois la transaction validée :
- ✅ Message de succès
- Affichage du nouveau score NET du totem (agrégé)
- Mise à jour du score du claim voté
- Mise à jour de son solde $TRUST
- Hash de transaction
- Lien vers l'explorer INTUITION

## Règles du vote

### Période de vote
- **Début** : Dès l'ouverture du site (date à définir)
- **Fin** : Date limite annoncée (ex: 7 jours)
- Après la fin : plus de votes possibles, seulement consultation

### Retrait du $TRUST

⚠️ **Important** : Les utilisateurs peuvent retirer leur $TRUST **AVANT la fin du vote**.

Mais pour notre projet :
- On encourage à **ne pas retirer** avant la fin
- Option de "lock" son vote (engagement à ne pas retirer)
- Possibilité de désactiver les retraits pendant la période de vote

**Implémentation** : Le hook `useWithdraw` (issue #41) gérera les retraits.

### Modification de vote

Si un utilisateur change d'avis :
1. Il peut retirer son $TRUST du premier claim
2. Le redéposer sur un autre claim ou totem
3. **Ou** simplement voter pour un autre claim sans retirer (vote multiple)
4. **Ou** voter AGAINST sur un claim qu'il avait voté FOR

## Interface utilisateur

### Affichage en temps réel

Les votes sont mis à jour en temps réel grâce à :
- Apollo Client avec `cache-and-network` policy
- Polling toutes les 5 secondes
- Mise à jour automatique des compteurs agrégés
- Recalcul automatique des scores NET

### Exemple de carte de totem (vue agrégée)

```
┌─────────────────────────────────────┐
│ 🦁 Lion                             │
│                                     │
│ [Image du lion]                     │
│                                     │
│ Symbole de force et leadership      │
│                                     │
│ 💰 150 NET (170 FOR - 20 AGAINST)   │
│ 📊 3 claims • 12 votants            │
│ Proposé par 0x1234...5678           │
│                                     │
│ [ Voter pour ce totem ]             │
└─────────────────────────────────────┘
```

### Feedback visuel pendant le vote

```
1. Clic sur "Voter"
   ↓
2. Modal "Combien de $TRUST ?"
   Choix FOR/AGAINST
   Choix du claim
   ↓
3. [Si nécessaire] Transaction Approval
   ↓ "Approving... Step 1/2" (ou 1/3)
4. Transaction Deposit
   ↓ "Depositing... Step 2/2" (ou 2/3)
5. ✅ "Vote confirmé !"
   Fermeture automatique du modal
   Mise à jour des scores agrégés
```

**Note** : Le `VoteModal` utilise le hook `useVote` qui gère toute cette logique avec `sonner` toasts.

## Gestion des erreurs

### Erreur : Solde insuffisant
- "Vous n'avez que X $TRUST disponibles"
- Ajuster le montant automatiquement
- Lien pour acheter du $TRUST

### Erreur : Approval échoué
- "L'approval a échoué"
- Bouton "Réessayer"
- Explication de pourquoi c'est nécessaire

### Erreur : Transaction rejetée
- "Vous avez rejeté la transaction"
- Bouton "Réessayer"

### Erreur : Vote terminé
- "La période de vote est terminée"
- Redirection vers les résultats

### Erreur : Réseau incorrect
- "Veuillez vous connecter à INTUITION L3 Testnet"
- Bouton pour changer de réseau

**Implémentation** : Le hook `useVote` (issue #38) gère toutes ces erreurs automatiquement.

## Récupération des votes

### Via GraphQL

Pour afficher les votes d'un utilisateur :
```typescript
const query = `
  query GetUserVotes($walletAddress: String!) {
    deposits(
      where: {
        sender_id: { _eq: $walletAddress }
      }
    ) {
      term {
        ... on triples {
          id
          subject { label }
          predicate { label }
          object { label }
        }
      }
      shares
      assets_after_fees
      is_in_positive_vault
      created_at
    }
  }
`;
```

Pour afficher les votes d'un Triple (claim) :
```typescript
const query = `
  query GetTripleVotes($tripleId: String!) {
    triples_by_pk(id: $tripleId) {
      positiveVault {
        totalAssets
        totalShares
      }
      negativeVault {
        totalAssets
        totalShares
      }
    }
    deposits(
      where: {
        term_id: { _eq: $tripleId }
      }
    ) {
      sender_id
      shares
      assets_after_fees
      is_in_positive_vault
      created_at
    }
  }
`;
```

## Mécanisme de classement - AVEC AGRÉGATION

⚠️ **IMPORTANT** : Le mécanisme de classement utilise l'agrégation !

### ❌ APPROCHE INCORRECTE
```
Le totem gagnant est celui avec le plus de $TRUST dans vault FOR
```

### ✅ APPROCHE CORRECTE

**Le totem gagnant pour chaque fondateur est celui avec le score NET agrégé le plus élevé.**

**Score NET d'un totem** = Somme de tous les scores NET de ses claims

**Score NET d'un claim** = FOR - AGAINST

**Exemple pour Joseph Lubin** :

```
Totem: Lion
├─ Claim 1: [Joseph] [represented_by] [Lion]
│  ├─ FOR: 90 $TRUST
│  ├─ AGAINST: 10 $TRUST
│  └─ NET: +80 $TRUST
├─ Claim 2: [Joseph] [embodies] [Lion]
│  ├─ FOR: 60 $TRUST
│  ├─ AGAINST: 10 $TRUST
│  └─ NET: +50 $TRUST
└─ Claim 3: [Joseph] [channels] [Lion]
   ├─ FOR: 20 $TRUST
   ├─ AGAINST: 0 $TRUST
   └─ NET: +20 $TRUST

Totem Lion TOTAL:
- NET: +150 $TRUST (80 + 50 + 20)
- FOR: 170 $TRUST
- AGAINST: 20 $TRUST
```

**Classement final** :
1. Lion : **+150 NET** → **Gagnant** 🥇
2. Épée : +80 NET → 🥈
3. Soleil : +45 NET → 🥉
4. Leadership : +20 NET
5. Phénix : -5 NET (10 FOR - 15 AGAINST)

**Implémentation** : Utiliser `aggregateTriplesByObject()` et `getWinningTotem()` de `utils/aggregateVotes.ts`.

## Transparence

Tous les votes sont publics et vérifiables :
- Liste de tous les votants (adresses)
- Montants déposés par chacun (FOR et AGAINST)
- Claim voté
- Timestamps des votes
- Historique complet on-chain
- Agrégation transparente et vérifiable

## Coûts

### Par vote
- **Approval** (une seule fois) : ~0.001 ETH gas
- **Deposit** : ~0.001 ETH gas
- **Frais de protocol** : ~7% (5% creator fees + 2% protocol fees) du montant déposé

### Total estimé (INTUITION L3 Testnet)
- Premier vote : ~$0.006 USD (approval + deposit)
- Votes suivants : ~$0.003 USD (deposit seulement)

## Incitations et gamification (optionnel)

### Badges
- "Early Voter" : a voté dans les premières 24h
- "Whale" : a déposé plus de 100 $TRUST
- "Polymath" : a voté pour tous les fondateurs
- "Contrarian" : a voté AGAINST sur un totem gagnant
- "Claim Creator" : a créé un nouveau claim avec prédicat unique

### Leaderboard
- Top votants par volume de $TRUST (NET)
- Top votants par nombre de votes
- Top claims par score NET

### Notifications
- "Un nouveau claim a été créé pour Lion !"
- "Lion vient de dépasser Épée ! (+150 NET)"
- "Plus que 24h pour voter"

## Exemple complet de vote

**Utilisateur** : 0xAlice...1234

**Action** : Vote FOR pour "Lion" pour Joseph Lubin (claim existant [represented_by])

**Étapes** :
1. Consulte les propositions pour Joseph Lubin
2. Voit "Lion" avec 100 NET (120 FOR - 20 AGAINST) agrégé
3. Clique "Voter pour ce totem"
4. Voit les 2 claims existants :
   - `[Joseph] [represented_by] [Lion]` - +80 NET
   - `[Joseph] [embodies] [Lion]` - +20 NET
5. Choisit le claim `[represented_by]`
6. Choisit "FOR"
7. Décide de déposer 25 $TRUST
8. [Si première fois] Approuve le contrat (tx1)
9. Dépose 25 $TRUST FOR (tx2)
10. ✅ Son vote est enregistré
11. Claim `[represented_by]` passe à +105 NET (115 FOR - 10 AGAINST)
12. Totem Lion passe à +125 NET total (agrégé)
13. Alice peut voir son vote dans "Mes votes"

---

## 📋 Issues GitHub créées à partir de ce fichier

### ✅ Issues CLOSED (Complétées)
- **Issue #38** : Frontend - Créer hook useVote pour gérer les transactions de vote ✅ (PR #118)

### ⏳ Issues OPEN (À développer)
- **Issue #35** : Frontend - Créer page Vote avec liste des propositions d'un fondateur
- **Issue #36** : Frontend - Créer composant TotemCard (affichage totem avec vote agrégé)
- **Issue #37** : Frontend - Créer composant VoteModal (choisir montant TRUST + FOR/AGAINST)
- **Issue #39** : Frontend - Créer requêtes GraphQL pour récupérer les votes
- **Issue #40** : Frontend - Créer page MyVotes (historique des votes utilisateur)
- **Issue #41** : Frontend - Créer hook useWithdraw pour retirer TRUST après vote
- **Issue #42** : Frontend - Gérer les erreurs de vote (rejection, balance, network)

**Total : 8 issues (1 closed, 7 open)**

**Note** : Issue #39 est **Frontend** (pas Backend) car architecture frontend-only.

---

**Dernière mise à jour** : 21 novembre 2025
**Architecture** : Frontend-only (pas de backend)
**Réseau** : INTUITION L3 Testnet (chain ID: 13579)
**Fonction d'agrégation** : `utils/aggregateVotes.ts` (déjà implémentée avec 17 tests)
**Hook useVote** : `hooks/useVote.ts` (déjà implémenté avec gestion complète des erreurs)
