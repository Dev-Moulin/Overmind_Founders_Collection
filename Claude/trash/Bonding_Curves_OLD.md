# Bonding Curves et mécanisme de Vault

## Vue d'ensemble

INTUITION Protocol utilise des **bonding curves** (courbes de liaison) pour gérer le prix et la liquidité des Atoms et Triples.

Chaque Atom/Triple a un **vault** (coffre) qui fonctionne comme un mini-marché automatisé.

## Principe de base

### Deposit (Acheter des shares)

Quand tu déposes du $TRUST dans un vault :
1. Tu envoies du $TRUST
2. Le vault te donne des **shares** (parts)
3. Le prix augmente selon la bonding curve
4. Plus de gens déposent = prix plus élevé

### Redeem (Vendre des shares)

Quand tu retires (redeem) :
1. Tu rends tes shares
2. Le vault te rend du $TRUST
3. Le prix descend selon la bonding curve
4. Tu récupères **selon le prix actuel** (pas forcément ce que tu as mis)

## Réponse à la question importante

### Est-ce que je récupère exactement ce que j'ai déposé ?

**NON, pas exactement.**

Le montant que tu récupères dépend de :
- **Le prix actuel** sur la bonding curve
- **Combien d'autres personnes** ont déposé/retiré après toi
- **Les frais** appliqués

### Scénarios possibles

#### Scénario 1 : Gain 📈

```
Tu déposes : 10 $TRUST → tu reçois 10 shares
Beaucoup de gens déposent après toi
Le prix monte
Tu redeem : 10 shares → tu récupères 12 $TRUST
Gain : +2 $TRUST (20%)
```

#### Scénario 2 : Perte 📉

```
Tu déposes : 10 $TRUST → tu reçois 10 shares
Beaucoup de gens retirent après toi
Le prix baisse
Tu redeem : 10 shares → tu récupères 8 $TRUST
Perte : -2 $TRUST (20%)
```

#### Scénario 3 : Stable (rare) ➡️

```
Tu déposes : 10 $TRUST → tu reçois 10 shares
Personne ne dépose/retire
Le prix reste stable
Tu redeem : 10 shares → tu récupères ~10 $TRUST (moins frais)
```

## Comment ça marche techniquement

### Les formules (simplifié)

Les bonding curves INTUITION utilisent des **power functions** :

```
Prix = (Supply) ^ n × m

Où :
- Supply = nombre total de shares existantes
- n = exposant (ex: 2 pour quadratique)
- m = multiplicateur de pente (ex: 1/400)
```

### Types de courbes

INTUITION supporte plusieurs types :
- **LinearCurve** : Prix augmente de façon linéaire
- **OffsetProgressiveCurve** : Prix augmente de plus en plus vite

### Calcul des shares reçues

Quand tu déposes X $TRUST :

```
Shares reçues = Fonction(
  montant déposé,
  supply actuelle,
  type de courbe,
  paramètres de la courbe
)
```

C'est calculé par **intégration** de la courbe de prix.

### Calcul du $TRUST récupéré

Quand tu redeem Y shares :

```
$TRUST récupéré = Fonction(
  shares brûlées,
  supply actuelle,
  type de courbe,
  paramètres de la courbe
) - frais
```

## Les frais

### Frais au deposit

Quand tu déposes :
- **Creator fees** : 5% (va au créateur de l'Atom/Triple)
- **Protocol fees** : 2% (va au protocole)
- **Total** : ~7% de frais

### Frais au redeem

Détails non trouvés dans la documentation, mais probablement similaires.

## Données dans le GraphQL

### Structure d'un Vault

```typescript
{
  id: string,
  totalShares: string,    // Total de shares émises
  totalAssets: string,    // Total de $TRUST dans le vault
  curveId: number,        // Quel type de courbe
  isActive: boolean
}
```

### Relation shares/assets

Le ratio `totalAssets / totalShares` donne le **prix actuel** d'une share.

**Exemple** :
```
totalAssets = 150 $TRUST
totalShares = 100 shares
Prix par share = 150 / 100 = 1.5 $TRUST
```

Si quelqu'un dépose 15 $TRUST maintenant :
- Il reçoit environ 10 shares (15 / 1.5)
- totalShares passe à 110
- totalAssets passe à 165
- Nouveau prix = 165 / 110 = 1.5 $TRUST (simplifié)

**Note** : En réalité c'est plus complexe avec la bonding curve.

## Impact pour notre projet de vote

### Ce qui est important

1. **Les users connaissent ce système**
   - La communauté INTUITION comprend les bonding curves
   - Pas besoin d'expliquer en détail dans l'UI

2. **Récupération du $TRUST**
   - Les users PEUVENT retirer leur $TRUST à tout moment
   - Mais le montant varie selon le prix actuel

3. **Pour notre vote**
   - Le classement se fait sur `totalAssets` du vault FOR
   - Plus de $TRUST déposé = totem plus populaire
   - Simple et clair

### Ce qu'il faut afficher

Dans l'interface, montrer :
- **Montant total déposé** : `positiveVault.totalAssets`
- **Nombre de votants** : nombre de deposits uniques
- **Pas besoin** de montrer le prix des shares

### Gestion de la période de vote

**Option 1 : Laisser libre**
- Les gens peuvent retirer pendant et après le vote
- Tu prends un "snapshot" à la date de fin
- Les résultats sont basés sur ce snapshot

**Option 2 : Lock (si possible)**
- Désactiver les retraits pendant le vote
- Nécessite peut-être un smart contract custom
- Plus complexe à implémenter

**Recommandation : Option 1** (snapshot)

## Migration Beta → Mainnet 2025

### Système de redemption spécial

Pour la migration vers mainnet, INTUITION a créé un système :
- **"One-click ETH redemption portal"**
- Permet de retirer le montant original déposé
- Pas de "rush to exit" sur les bonding curves
- "Fair unwind" : tout le monde récupère équitablement

Ce système pourrait servir d'inspiration si tu veux un système de retrait équitable après le vote.

## Code exemples

### Récupérer le montant total déposé (votes)

```typescript
const query = `
  query GetTripleVotes($tripleId: String!) {
    triples_by_pk(id: $tripleId) {
      positiveVault {
        totalAssets    # Total de $TRUST déposé
        totalShares    # Total de shares émises
      }
      negativeVault {
        totalAssets
        totalShares
      }
    }
  }
`;
```

### Afficher le montant en $TRUST

```typescript
import { formatEther } from 'viem';

const totalTrust = formatEther(vault.totalAssets);
// "150.5" $TRUST
```

### Compter les votants uniques

```graphql
query GetVoters($tripleId: String!) {
  deposits_aggregate(
    where: {
      term_id: { _eq: $tripleId }
      vault_type: { _eq: "triple_positive" }
    }
    distinct_on: sender_id
  ) {
    aggregate {
      count  # Nombre de votants uniques
    }
  }
}
```

## Points clés à retenir

1. ✅ **Ce n'est PAS un vote simple 1 personne = 1 voix**
   - C'est un système de stake avec bonding curve
   - Plus tu stakes, plus tu montres ta conviction

2. ✅ **Le $TRUST est récupérable**
   - Mais le montant varie selon le prix actuel
   - Possible de gagner ou perdre

3. ✅ **Pour notre classement**
   - On classe par `totalAssets` (montant total déposé)
   - Le totem avec le plus de $TRUST gagne
   - Simple et transparent

4. ⚠️ **Frais à prévoir**
   - ~7% de frais au deposit
   - Les users doivent en être conscients

5. 📊 **Données en temps réel**
   - GraphQL permet de suivre les votes en temps réel
   - Subscriptions pour updates live

## Ressources

### Articles
- **Bonding Curves Explained** : https://medium.com/0xintuition/information-markets-introducing-intuitions-bonding-curves-7a015b47191c
- **TRUST Tokenomics** : https://medium.com/0xintuition/intuition-trust-tokenomics-17af2ffeb138
- **Bonding Curves In Depth** : https://blakeir.com/bonding-curves-in-depth-intuition-parametrization

### Contrats
- **Smart Contracts v2** : https://github.com/0xIntuition/intuition-contracts-v2
- Contrats : LinearCurve, OffsetProgressiveCurve, TrustBonding

### Documentation
- **GraphQL Schema** : Voir Schema_GraphQL.md
- **Vaults, Deposits, Positions** : Types documentés dans le schema

## Questions ouvertes

Ces informations n'ont pas été trouvées dans la doc :
1. ❓ Formule exacte utilisée pour calculer les shares
2. ❓ Frais exacts au redeem
3. ❓ Possibilité de "lock" les retraits temporairement
4. ❓ Comment implémenter un snapshot équitable

**À clarifier avec l'équipe INTUITION si nécessaire.**
