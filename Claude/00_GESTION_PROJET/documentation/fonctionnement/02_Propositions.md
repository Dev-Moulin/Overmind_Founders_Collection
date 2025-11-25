# Proposer des totems

## Vue d'ensemble

Un utilisateur éligible peut proposer des totems pour représenter les 42 fondateurs d'INTUITION.
Chaque proposition crée automatiquement des **Atoms** et un **Triple** sur le protocol INTUITION.

## Étape 1 : Sélectionner un fondateur

L'utilisateur voit la liste des 42 fondateurs :
- Affichage en grille ou liste
- Photo/Avatar si disponible
- Nom complet
- Statut : "X propositions" pour ce fondateur

Clic sur un fondateur pour proposer un totem.

## Étape 2 : Remplir le formulaire de proposition

### Informations requises

**Type de totem** (choix unique) :
- 🎯 Objet
- 🦁 Animal
- ⭐ Trait de personnalité
- 🌌 Univers/Énergie

**Nom du totem** :
- Texte court (max 50 caractères)
- Exemple : "Lion", "Épée japonaise", "Enthousiasme"

**Description** (optionnelle) :
- Texte long (max 500 caractères)
- Pourquoi ce totem représente ce fondateur
- Exemple : "Le lion représente le leadership et la force de Joseph dans l'écosystème Ethereum"

**Image de référence** (optionnelle) :
- Upload d'une image
- **Gérée automatiquement par le SDK INTUITION** (upload IPFS intégré)
- Formats acceptés : PNG, JPG, GIF
- Taille max : 5 MB

## Étape 3 : Validation et prévisualisation

Avant de soumettre :
- Aperçu de la proposition
- Vérification des informations
- Estimation des frais (en $TRUST et ETH pour le gas)

Bouton "Confirmer la proposition"

## Étape 4 : Transactions blockchain

### Transaction 1 : Créer l'Atom du totem (si nouveau)

Si le totem n'existe pas déjà dans le système :
```typescript
// Créer l'Atom pour le totem
// Le SDK INTUITION gère automatiquement l'upload IPFS de l'image
const totemAtom = await createAtomFromThing({
  name: "Lion",
  description: "Symbole de force et leadership",
  image: "ipfs://QmXxxx...",  // Géré par le SDK
  url: "https://totems.intuition.systems/lion"
});
```

**L'utilisateur doit :**
1. Approuver la transaction dans son wallet
2. Payer les frais de gas (quelques centimes en ETH)
3. Attendre la confirmation (5-10 secondes sur INTUITION L3 Testnet)

### Transaction 2 : Créer le Triple (proposition)

Création du lien entre fondateur et totem :
```typescript
// Triple = [Joseph Lubin] [represented_by] [Lion]
const triple = await createTripleStatement(
  founderAtomId,      // Joseph Lubin
  predicateAtomId,    // represented_by
  totemAtomId         // Lion
);
```

**⚠️ Note technique V2 :**
Le SDK alpha a un bug avec le contrat V2. L'appel direct au contrat est utilisé :
```typescript
// V2: assets[0] = tripleBaseCost + userDeposit
// V2: msg.value = sum(assets)
const totalAssetValue = tripleBaseCost + depositAmountWei;

await publicClient.simulateContract({
  functionName: 'createTriples',
  args: [[subjectId], [predicateId], [objectId], [totalAssetValue]],
  value: totalAssetValue,
});
```

**Frais appliqués :**
- 5% creator fees (reversés au créateur)
- 2% protocol fees
- Gas fees (INTUITION L3 Testnet)

## Étape 5 : Confirmation

Une fois les transactions validées :
- ✅ Message de succès
- Affichage de la proposition créée
- Lien vers l'explorer INTUITION
- Hash de transaction
- Retour à la liste des fondateurs

## Règles et limites

### Limites par utilisateur
- **Maximum 3 propositions par fondateur** par wallet
- Pas de limite sur le nombre total de propositions

### Validation des propositions
- Le nom du totem ne peut pas être vide
- Pas de contenu offensant ou inapproprié
- Modération possible en phase ultérieure

### Réutilisation de totems
Si quelqu'un propose "Lion" pour Joseph Lubin et qu'un autre propose "Lion" pour Andrew Keys :
- Le même Atom "Lion" est réutilisé
- Seuls les Triples sont différents :
  - `[Joseph Lubin] [represented_by] [Lion]`
  - `[Andrew Keys] [represented_by] [Lion]`

## Interface utilisateur

### Exemple de flux
```
1. Page d'accueil
   ↓
2. Grille des 42 fondateurs
   ↓
3. Clic sur "Joseph Lubin"
   ↓
4. Formulaire de proposition
   ↓
5. Prévisualisation
   ↓
6. Confirmation wallet (2 transactions)
   ↓
7. Page de succès
```

### Feedback visuel
- Loading spinner pendant les transactions
- Progression : "1/2 transactions confirmées"
- Messages d'erreur clairs si échec
- Possibilité de réessayer

## Gestion des erreurs

### Erreur : Transaction rejetée
- "Vous avez rejeté la transaction"
- Bouton "Réessayer"

### Erreur : Pas assez de gas
- "Fonds insuffisants pour payer le gas"
- Montant nécessaire affiché
- Lien pour acheter de l'ETH

### Erreur : Triple déjà existant
- "Cette proposition existe déjà"
- Redirection automatique vers la page de vote avec le totem pré-filtré
- Option de voter pour celle-ci

**Implémentation technique :**
```typescript
// Avant création du triple, vérification via GraphQL
const existingTriple = await findTriple(subjectId, predicateId, objectId);
if (existingTriple) {
  throw new ClaimExistsError({
    termId: existingTriple.termId,
    subjectLabel: existingTriple.subjectLabel,
    predicateLabel: existingTriple.predicateLabel,
    objectLabel: existingTriple.objectLabel,
  });
}

// Dans ProposePage.tsx - redirection automatique
if (err instanceof ClaimExistsError) {
  navigate(`/vote?search=${encodeURIComponent(err.objectLabel)}`);
}
```

### Erreur : Limite atteinte
- "Vous avez déjà proposé 3 totems pour ce fondateur"
- Liste de vos propositions existantes

## Données stockées

### On-chain (INTUITION Protocol)
- Atom du totem (nom, description, image IPFS)
- Triple (relation fondateur-totem)
- Metadata complète

### Frontend-only (cache local)
- Cache GraphQL (Apollo Client)
- Compteurs de propositions (localStorage)
- Prédicats et objets fréquents (localStorage)

## Récupération des propositions

Via GraphQL pour afficher les propositions d'un fondateur :
```typescript
const query = `
  query GetFounderProposals($founderId: String!) {
    triples(
      where: {
        subject_id: { _eq: $founderId }
        predicate: { label: { _eq: "represented_by" } }
      }
    ) {
      id
      object {
        label
        image
        description
      }
      creator {
        id
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
```

**Note importante** : Cette requête récupère les triples bruts. Pour afficher les résultats agrégés par totem, utiliser la fonction `aggregateTriplesByObject()` du fichier `utils/aggregateVotes.ts`.

## Coûts estimés

### Frais de création d'Atom
- Gas : ~0.001 ETH (~$0.003 USD)
- Protocol fees : 2%

### Frais de création de Triple
- Gas : ~0.001 ETH (~$0.003 USD)
- Creator fees : 5%
- Protocol fees : 2%

**Total estimé par proposition : ~$0.01 USD**

## Exemple de proposition complète

**Fondateur :** Joseph Lubin

**Type :** Animal

**Nom :** Lion

**Description :** "Le lion symbolise le leadership naturel de Joseph dans l'écosystème Ethereum et blockchain. Comme un lion qui guide sa troupe, Joseph a guidé ConsenSys et l'industrie vers de nouveaux horizons."

**Image :** [Upload d'une image de lion - gérée par SDK INTUITION]

**Résultat :**
- Atom créé : "Lion" (ou réutilisé si existant)
- Triple créé : `[Joseph Lubin] [represented_by] [Lion]`
- Visible dans le knowledge graph INTUITION
- Prêt à recevoir des votes

---

## 📋 Issues GitHub créées à partir de ce fichier

### ✅ Issues CLOSED (Complétées)
- **Issue #25** : Frontend - Créer page Proposer avec grille des 42 fondateurs ✅
- **Issue #26** : Frontend - Créer composant FounderCard ✅
- **Issue #27** : Frontend - Créer composant ProposalModal (formulaire de proposition) ✅
- **Issue #29** : Frontend - Intégrer INTUITION SDK - Création d'Atom (createAtomFromThing) ✅
- **Issue #30** : Frontend - Intégrer INTUITION SDK - Création de Triple (createTripleStatement) ✅

### ⏳ Issues OPEN (À développer)
- **Issue #28** : Frontend - Créer composant ImageUpload (SDK INTUITION gère l'upload IPFS)
- **Issue #31** : Frontend - Créer composant TransactionProgress (suivi des transactions)
- **Issue #32** : Frontend - Gérer les erreurs de proposition (rejection, gas, duplicates)
- **Issue #33** : Frontend - Créer requêtes GraphQL pour récupérer les propositions (avec agrégation)
- **Issue #34** : Frontend - Créer requêtes GraphQL pour récupérer les propositions (doublon de #33)

**Total : 10 issues (5 closed, 5 open)**

**Note** : Issue #100 (IPFS upload Pinata) a été **annulée** car le SDK INTUITION gère déjà l'upload IPFS automatiquement.

---

**Dernière mise à jour** : 25 novembre 2025
**Architecture** : Frontend-only (pas de backend)
**Réseau** : INTUITION L3 Testnet (chain ID: 13579)
