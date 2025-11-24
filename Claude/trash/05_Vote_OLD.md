# Voter pour les totems

## Vue d'ensemble

Les utilisateurs éligibles votent pour leurs totems préférés en déposant du **$TRUST** dans le vault FOR du Triple.

Plus un utilisateur dépose de $TRUST, plus il montre sa conviction que ce totem représente bien le fondateur.

## Système de vote INTUITION

### Vaults FOR et AGAINST

Chaque Triple (proposition) possède **2 vaults** :
- **Vault FOR** (affirmatif) : "Je suis d'accord, ce totem représente bien ce fondateur"
- **Vault AGAINST** (négatif) : "Je ne suis pas d'accord"

Pour ce projet, on utilise **uniquement le vault FOR**.

### Principe du vote
1. L'utilisateur choisit un totem pour un fondateur
2. Il décide combien de $TRUST déposer (minimum : 1 $TRUST)
3. Il effectue une transaction pour déposer dans le vault FOR
4. Le $TRUST est **récupérable** après la fin du vote

## Étape 1 : Voir les propositions

### Page d'un fondateur
- Liste de tous les totems proposés pour ce fondateur
- Pour chaque totem :
  - Nom et type (objet/animal/trait/univers)
  - Description
  - Image de référence
  - **Nombre de $TRUST déposés** (vault FOR balance)
  - Nombre de votants
  - Proposé par (adresse wallet)

### Tri et filtrage
- Par défaut : triés par nombre de $TRUST (plus de votes en haut)
- Option de tri par date de création
- Filtrage par type (objets, animaux, etc.)

## Étape 2 : Sélectionner un totem

L'utilisateur clique sur "Voter pour ce totem"

### Informations affichées
- Récapitulatif du totem
- Votes actuels : "X $TRUST déposés par Y votants"
- Son solde de $TRUST disponible
- Bouton "Déposer des $TRUST"

## Étape 3 : Choisir le montant

### Interface
```
Combien de $TRUST voulez-vous déposer ?

[ 1 ] [ 5 ] [ 10 ] [ 25 ] [ 50 ] [ Custom ]

Votre solde : 100 $TRUST

[ Slider: 1 ----●---- 100 ]

Total à déposer : 10 $TRUST
```

### Contraintes
- **Minimum** : 1 $TRUST
- **Maximum** : Solde disponible du wallet
- **Décimales** : Jusqu'à 18 décimales (ERC-20 standard)

### Règles de vote
- **1 wallet = plusieurs votes possibles**
- Un wallet peut voter pour **plusieurs totems différents** pour le même fondateur
- Le même wallet peut **ajouter du $TRUST** au même totem plusieurs fois

## Étape 4 : Transaction de dépôt

### Si première fois : Approval du token $TRUST

Avant de déposer, l'utilisateur doit **approuver** le contrat pour utiliser ses $TRUST :

```typescript
// Transaction 1 : Approval
await approve(
  vaultAddress,     // Adresse du MultiVault
  amount           // Montant à approuver
);
```

**L'utilisateur doit :**
1. Approuver dans son wallet
2. Payer le gas (~$0.001 ETH)
3. Attendre confirmation

### Dépôt du $TRUST

```typescript
// Transaction 2 : Deposit
await depositTriple(
  tripleId,        // ID du Triple (proposition)
  amount,          // Montant de $TRUST
  true             // isPositive = FOR (pas AGAINST)
);
```

**L'utilisateur doit :**
1. Confirmer dans son wallet
2. Payer le gas (~$0.001 ETH)
3. Attendre confirmation

## Étape 5 : Confirmation

Une fois la transaction validée :
- ✅ Message de succès
- Affichage du nouveau total de votes
- Mise à jour de son solde $TRUST
- Hash de transaction
- Lien vers l'explorer

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

### Modification de vote

Si un utilisateur change d'avis :
1. Il peut retirer son $TRUST du premier totem
2. Le redéposer sur un autre totem
3. **Ou** simplement voter pour un autre totem sans retirer (vote multiple)

## Interface utilisateur

### Affichage en temps réel

Les votes sont mis à jour en temps réel grâce à :
- WebSocket GraphQL subscriptions
- Polling toutes les 5 secondes
- Mise à jour automatique des compteurs

### Exemple de carte de totem

```
┌─────────────────────────────────────┐
│ 🦁 Lion                             │
│                                     │
│ [Image du lion]                     │
│                                     │
│ Symbole de force et leadership      │
│                                     │
│ 💰 125 $TRUST • 8 votants           │
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
   ↓
3. [Si nécessaire] Transaction Approval
   ↓ "Approving... 1/2"
4. Transaction Deposit
   ↓ "Depositing... 2/2"
5. ✅ "Vote confirmé !"
```

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
          object { label }
        }
      }
      shares
      assets_after_fees
      created_at
    }
  }
`;
```

Pour afficher les votes d'un Triple :
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
      created_at
    }
  }
`;
```

## Mécanisme de classement

Le totem gagnant pour chaque fondateur est celui avec :
- **Le plus de $TRUST dans le vault FOR**

Exemple pour Joseph Lubin :
1. Lion : 150 $TRUST → **Gagnant**
2. Épée : 80 $TRUST
3. Soleil : 45 $TRUST

## Transparence

Tous les votes sont publics et vérifiables :
- Liste de tous les votants (adresses)
- Montants déposés par chacun
- Timestamps des votes
- Historique complet on-chain

## Coûts

### Par vote
- **Approval** (une seule fois) : ~0.001 ETH gas
- **Deposit** : ~0.001 ETH gas
- **Frais de protocol** : ~7% (5% creator fees + 2% protocol fees) du montant déposé

### Total estimé
- Premier vote : ~$0.006 USD (approval + deposit)
- Votes suivants : ~$0.003 USD (deposit seulement)

## Incitations et gamification (optionnel)

### Badges
- "Early Voter" : a voté dans les premières 24h
- "Whale" : a déposé plus de 100 $TRUST
- "Polymath" : a voté pour tous les fondateurs

### Leaderboard
- Top votants par volume de $TRUST
- Top votants par nombre de votes

### Notifications
- "Un nouveau totem a dépassé votre favori !"
- "Plus que 24h pour voter"

## Exemple complet de vote

**Utilisateur** : 0xAlice...1234

**Action** : Vote pour "Lion" pour Joseph Lubin

**Étapes** :
1. Consulte les propositions pour Joseph Lubin
2. Voit "Lion" avec 100 $TRUST déjà déposés
3. Décide de déposer 25 $TRUST
4. Clique "Voter pour ce totem"
5. Entre 25 dans le formulaire
6. [Si première fois] Approuve le contrat (tx1)
7. Dépose 25 $TRUST (tx2)
8. ✅ Son vote est enregistré
9. Lion passe à 125 $TRUST (9 votants au lieu de 8)
10. Alice peut voir son vote dans "Mes votes"

---

## 📋 Issues GitHub créées à partir de ce fichier

- **Issue #35** : Frontend - Créer page Vote avec liste des propositions d un fondateur
- **Issue #36** : Frontend - Créer composant TotemCard (affichage totem avec vote)
- **Issue #37** : Frontend - Créer composant VoteModal (choisir montant TRUST à déposer)
- **Issue #38** : Frontend - Créer hook useVote pour gérer les transactions de vote
- **Issue #39** : Backend - Créer requêtes GraphQL pour récupérer les votes
- **Issue #40** : Frontend - Créer page MyVotes (historique des votes utilisateur)
- **Issue #41** : Frontend - Créer hook useWithdraw pour retirer TRUST après vote
- **Issue #42** : Frontend - Gérer les erreurs de vote (rejection, balance, network)

**Total : 8 issues**
**Statut : ⏳ Issues créées (code à développer)**
