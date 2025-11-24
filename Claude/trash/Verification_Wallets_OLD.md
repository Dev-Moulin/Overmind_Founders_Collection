# Vérification des wallets éligibles

## Objectif

Seuls les wallets qui ont reçu l'airdrop INTUITION du **5 novembre 2025** peuvent participer au vote.

Ce dossier contient la documentation sur comment vérifier l'éligibilité des wallets.

## Statut actuel

⏳ **En attente des informations de l'équipe INTUITION**

Nous devons clarifier avec l'équipe INTUITION comment obtenir et vérifier la liste des adresses éligibles.

## Questions à poser à l'équipe INTUITION

### 1. Accès à la whitelist

**Question** : Comment obtenir la liste complète des adresses qui ont reçu l'airdrop du 5 novembre 2025 ?

**Options possibles** :
- API publique qui vérifie si une adresse est éligible
- Liste CSV/JSON exportable
- Smart contract on-chain qu'on peut query
- Accès à une base de données

### 2. Méthode de vérification

**Question** : Quelle est la méthode recommandée pour vérifier qu'un wallet est éligible ?

**Options possibles** :
- Query d'un contrat d'airdrop on-chain
- Appel à une API REST INTUITION
- Query GraphQL sur l'API INTUITION
- Vérification côté backend avec liste fournie

### 3. Sécurité et confidentialité

**Question** : Y a-t-il des considérations de sécurité ou de confidentialité concernant la liste des adresses ?

**Points à clarifier** :
- La liste est-elle publique ou privée ?
- Peut-on la stocker dans notre backend ?
- Doit-on la query en temps réel ?
- Y a-t-il des restrictions RGPD/vie privée ?

### 4. Maintien de la liste

**Question** : La liste est-elle figée ou peut-elle évoluer ?

**Points à clarifier** :
- La liste peut-elle être modifiée après le 5 novembre ?
- Y a-t-il des ajouts/suppressions possibles ?
- Comment être notifié des changements ?

### 5. Volume et performance

**Question** : Combien d'adresses ont reçu l'airdrop ?

**Important pour** :
- Choisir la méthode de stockage
- Optimiser les performances
- Estimer les besoins backend

## Solutions techniques envisagées

En fonction des réponses, voici les approches possibles :

### Option A : Query on-chain

Si un smart contract d'airdrop existe :

```typescript
import { readContract } from 'viem';

const isEligible = await readContract({
  address: AIRDROP_CONTRACT_ADDRESS,
  abi: airdropAbi,
  functionName: 'hasReceivedAirdrop',
  args: [userAddress]
});
```

**Avantages** :
- Données toujours à jour
- Pas besoin de backend
- Trustless

**Inconvénients** :
- Dépend d'un contrat existant
- Coût en RPC calls

### Option B : API INTUITION

Si INTUITION fournit une API :

```typescript
const response = await fetch(
  `https://api.intuition.systems/airdrop/check/${userAddress}`
);
const { isEligible } = await response.json();
```

**Avantages** :
- Simple à implémenter
- Maintenue par INTUITION
- Pas de stockage de notre côté

**Inconvénients** :
- Dépendance à leur API
- Rate limiting possible

### Option C : Liste locale (backend)

Si INTUITION fournit une liste exportable :

```typescript
// Backend
const whitelist = new Set(await loadWhitelistFromFile());

app.get('/api/check-eligibility/:address', (req, res) => {
  const isEligible = whitelist.has(req.params.address.toLowerCase());
  res.json({ isEligible });
});
```

**Avantages** :
- Rapide (lookup local)
- Pas de dépendance externe
- Contrôle total

**Inconvénients** :
- Doit stocker la liste
- Doit la mettre à jour si changements

### Option D : GraphQL INTUITION

Si queryable via leur GraphQL :

```typescript
const query = `
  query CheckAirdrop($address: String!) {
    airdrop_recipients(where: { address: { _eq: $address } }) {
      address
      claimed
    }
  }
`;

const result = await client.request(query, { address: userAddress });
const isEligible = result.airdrop_recipients.length > 0;
```

**Avantages** :
- Utilise l'infrastructure existante
- Pas de maintenance de liste
- Données centralisées

**Inconvénients** :
- Dépend du schema GraphQL
- Possible rate limiting

## Implémentation temporaire (testnet)

Pour le développement sur testnet, on utilise une **whitelist manuelle** :

```typescript
// config/testnet-whitelist.ts
export const TESTNET_WHITELIST = [
  '0x1234567890123456789012345678901234567890', // Wallet de test 1
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // Wallet de test 2
  // ... autres wallets de test
];

// utils/checkEligibility.ts
export function isEligibleTestnet(address: string): boolean {
  return TESTNET_WHITELIST.includes(address.toLowerCase());
}
```

## Migration vers mainnet

Une fois les informations reçues d'INTUITION, on remplacera la whitelist temporaire par la solution appropriée.

**Checklist migration** :
- [ ] Récupérer la liste/méthode officielle d'INTUITION
- [ ] Implémenter la vérification selon leur recommandation
- [ ] Tester avec plusieurs adresses connues
- [ ] Vérifier les performances
- [ ] Mettre à jour la documentation
- [ ] Remplacer le code testnet

## Contact INTUITION

**Où poser ces questions** :
- Discord INTUITION (canal #dev ou #support)
- Email : dev@intuition.systems (à confirmer)
- GitHub discussions : https://github.com/0xIntuition/intuition-ts/discussions

## Prochaines étapes

1. ✅ Documenter les questions à poser
2. ⏳ Contacter l'équipe INTUITION
3. ⏳ Recevoir les réponses et recommandations
4. ⏳ Choisir la solution technique appropriée
5. ⏳ Implémenter la vérification
6. ⏳ Tester avec des cas réels
7. ⏳ Documenter la solution finale

## Alternatives si pas de réponse

Si l'équipe INTUITION ne peut pas fournir la liste :

### Alternative 1 : Query les events on-chain

Rechercher les events d'airdrop sur Base Mainnet autour du 5 novembre :

```typescript
import { parseAbi, createPublicClient } from 'viem';

const events = await publicClient.getLogs({
  address: TRUST_TOKEN_ADDRESS,
  event: parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)']),
  fromBlock: AIRDROP_START_BLOCK,
  toBlock: AIRDROP_END_BLOCK,
  args: {
    from: AIRDROP_DISTRIBUTOR_ADDRESS // Si connu
  }
});

const recipients = events.map(e => e.args.to);
```

### Alternative 2 : Basé sur balance $TRUST

Vérifier si le wallet possède du $TRUST (approximatif) :

```typescript
const balance = await readContract({
  address: TRUST_TOKEN_ADDRESS,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [userAddress]
});

const isEligible = balance > 0n;
```

**⚠️ Problème** : Ne distingue pas airdrop vs achat de tokens

### Alternative 3 : Liste manuelle communautaire

Créer une liste collaborative avec la communauté :
- Demander aux membres de soumettre leurs adresses
- Vérifier manuellement chaque adresse
- Construire progressivement la whitelist

**⚠️ Problème** : Incomplet et chronophage

## Notes importantes

- La solution finale doit être **vérifiable** et **transparente**
- On doit pouvoir expliquer pourquoi quelqu'un est éligible ou non
- La vérification doit être **rapide** (< 1 seconde)
- On doit gérer les **erreurs réseau** gracieusement

## Mise à jour de ce document

Ce document sera mis à jour une fois les réponses d'INTUITION reçues avec la solution technique finale choisie et implémentée.

**Dernière mise à jour** : 17 novembre 2025
