# Modification Architecture - Suppression du Backend

**Date** : 21 novembre 2025
**Type** : Simplification architecture
**Impact** : Majeur - Suppression de toutes les issues backend
**Priorité** : 🔴 P0 (Bloquant pour issues backend)

---

## 📋 Résumé Exécutif

**Décision** : Le projet n'a **pas besoin de serveur backend** (Fastify/Express).

**Raison** : Toutes les données sont déjà on-chain via INTUITION Protocol, et la whitelist est vérifiable via un smart contract NFT existant.

---

## 🎯 Contexte de la Décision

### Ce qui était prévu initialement

L'architecture initiale prévoyait un backend Fastify avec :
- Endpoint de vérification whitelist
- Endpoint de modération de contenu
- Endpoint d'upload d'images (IPFS)
- Stockage de données côté serveur
- API REST pour le frontend

**Issues backend créées** : #51-57 (7 issues)

### Pourquoi ce n'est plus nécessaire

1. **Données déjà on-chain**
   - INTUITION Protocol stocke tout on-chain (Atoms, Triples, Signals)
   - GraphQL API fournie par INTUITION pour requêtes
   - Pas besoin de base de données backend

2. **Whitelist vérifiable on-chain**
   - NFT contract existant : `0x98e240326966e86ad6ec27e13409ffb748788f8c` (Base)
   - Vérification directe : `balanceOf(address) > 0`
   - Pas besoin de stockage backend

3. **Upload IPFS optionnel**
   - Peut se faire directement depuis le frontend (Pinata API)
   - Ou via INTUITION SDK qui gère IPFS

4. **Modération non critique**
   - Le système s'auto-régule via votes AGAINST
   - Modération peut se faire manuellement si nécessaire
   - Pas besoin d'endpoint automatisé

---

## ✅ Nouvelle Architecture Simplifiée

### Frontend Only

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│                                                      │
│  ┌────────────────┐  ┌──────────────────────────┐  │
│  │  wagmi/viem    │  │  INTUITION SDK           │  │
│  │  (blockchain)  │  │  (Atoms, Triples)        │  │
│  └────────────────┘  └──────────────────────────┘  │
│                                                      │
│  ┌────────────────┐  ┌──────────────────────────┐  │
│  │  GraphQL Client│  │  Local Storage (JSON)    │  │
│  │  (queries)     │  │  (cache prédicats/objets)│  │
│  └────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
              ↓                      ↓
    ┌─────────────────┐    ┌────────────────────┐
    │ INTUITION API   │    │  Base Blockchain   │
    │ (GraphQL)       │    │  (Smart Contracts) │
    └─────────────────┘    └────────────────────┘
```

### Composants

1. **Frontend (React + Vite)**
   - Connexion wallet (wagmi + RainbowKit)
   - Queries GraphQL (Apollo Client ou urql)
   - Interaction blockchain (viem + INTUITION SDK)
   - Cache local (localStorage ou IndexedDB)

2. **Smart Contracts**
   - INTUITION MultiVault (votes)
   - NFT Whitelist (eligibilité)

3. **Services externes**
   - INTUITION GraphQL API (queries)
   - Base RPC (transactions)
   - Pinata (IPFS - optionnel)

---

## 🔄 Ce qui Change Concrètement

### 1. Vérification Whitelist

**Avant** (avec backend) :
```typescript
// Backend endpoint
POST /api/check-whitelist
Body: { address: "0x..." }
Response: { eligible: true }
```

**Après** (frontend only) :
```typescript
// Direct blockchain read
import { readContract } from 'viem';

const NFT_CONTRACT = '0x98e240326966e86ad6ec27e13409ffb748788f8c';

async function checkWhitelist(address: Address): Promise<boolean> {
  const balance = await readContract({
    address: NFT_CONTRACT,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }],
      }
    ],
    functionName: 'balanceOf',
    args: [address],
  });

  return balance > 0n;
}
```

**Avantages** :
- ✅ Pas de serveur à maintenir
- ✅ Pas de coûts d'hébergement
- ✅ Vérification trustless (direct on-chain)
- ✅ Pas de point de défaillance central

### 2. Cache des Prédicats/Objets Nouveaux

**Avant** (avec backend) :
- Base de données pour stocker prédicats créés
- API pour récupérer la liste

**Après** (frontend only) :
```typescript
// Local cache dans localStorage
interface CachedData {
  predicates: Array<{ id: Hex; label: string }>;
  objects: Array<{ id: Hex; label: string }>;
  lastUpdated: number;
}

// Sauvegarde après création
function cacheNewPredicate(id: Hex, label: string) {
  const cache = getCache();
  cache.predicates.push({ id, label });
  cache.lastUpdated = Date.now();
  localStorage.setItem('intuition-cache', JSON.stringify(cache));
}

// Récupération combinée (cache + GraphQL)
async function getAllPredicates() {
  const cached = getCache().predicates;
  const onChain = await fetchFromGraphQL();

  // Merge et dédupliquer
  return [...cached, ...onChain];
}
```

**Avantages** :
- ✅ Pas de synchronisation serveur
- ✅ Fonctionne offline (cache)
- ✅ Données partagées via GraphQL automatiquement

### 3. Upload d'Images (IPFS)

**Avant** (avec backend) :
- Backend upload vers Pinata
- API key côté serveur

**Après** (frontend only - 2 options) :

**Option A** : Pinata directement depuis frontend
```typescript
import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway: "example-gateway.mypinata.cloud"
});

async function uploadImage(file: File): Promise<string> {
  const upload = await pinata.upload.file(file);
  return upload.IpfsHash; // QmXxxx...
}
```

**Option B** : INTUITION SDK (si supporté)
```typescript
// Utiliser createAtomFromThing avec image
const atom = await createAtomFromThing({
  name: "Lion",
  image: imageFile, // SDK gère IPFS
});
```

**Note** : Si JWT Pinata exposé côté frontend, mettre restrictions sur le dashboard Pinata (rate limiting, max size, etc.)

### 4. Modération

**Avant** (avec backend) :
- Endpoint de modération automatique
- Filtrage côté serveur

**Après** (frontend only) :
```typescript
// Validation côté frontend
function validateProposal(data: ProposalData): ValidationResult {
  const errors: string[] = [];

  // Validation basique
  if (data.name.length < 3) errors.push("Name too short");
  if (containsBadWords(data.name)) errors.push("Inappropriate content");

  return { valid: errors.length === 0, errors };
}

// Auto-régulation via votes AGAINST
// Pas besoin de modération backend automatique
```

**Avantages** :
- ✅ Système s'auto-régule (votes AGAINST)
- ✅ Modération manuelle possible si besoin
- ✅ Pas de censure centralisée

---

## ❌ Issues Backend à Supprimer/Modifier

### Issues à FERMER (backend non nécessaire)

| Issue | Titre | Raison |
|-------|-------|--------|
| **#51** | Backend - Setup Fastify project | Pas de backend nécessaire |
| **#52** | Backend - Configurer variables d'environnement | Frontend only |
| **#53** | Backend - Endpoint vérification whitelist | Vérification on-chain directe |
| **#54** | Backend - Endpoint modération | Auto-régulation via votes |
| **#55** | Backend - Upload image Pinata | Frontend direct ou via SDK |
| **#56** | Backend - Configurer CORS et sécurité | Pas de backend |
| **#57** | Backend - Déployer sur Render | Pas de backend |

**Action** : Fermer ces 7 issues avec commentaire expliquant la nouvelle architecture.

### Issues à MODIFIER (garder mais changer approche)

| Issue | Titre | Modification |
|-------|-------|--------------|
| **#21** | Vérifier réseau Base Mainnet | ✅ Garder (frontend) |
| **#22** | Endpoint whitelist | ❌ Remplacer par vérification on-chain |
| **#28** | ImageUpload avec IPFS | ✅ Garder mais frontend direct |

---

## ✅ Nouvelles Issues Créées (Frontend Only)

### Issue #96 - Frontend: Vérification whitelist on-chain ✅

**Créée le** : 21 novembre 2025
**Status** : OPEN

**Description** :
Créer un hook pour vérifier l'éligibilité d'un wallet via le smart contract NFT.

**Fichier** : `apps/web/src/hooks/useWhitelist.ts`

**Fonctionnalités** :
```typescript
export function useWhitelist(address?: Address) {
  const isEligible = // balanceOf > 0
  const isLoading = // loading state
  const error = // error state

  return { isEligible, isLoading, error };
}
```

**Contract** : `0x98e240326966e86ad6ec27e13409ffb748788f8c` (Base Mainnet)

**Tests** :
- Test avec adresse eligible
- Test avec adresse non-eligible
- Test erreur réseau

---

### Issue #97 - Frontend: Cache local prédicats/objets ✅

**Créée le** : 21 novembre 2025
**Status** : OPEN

**Description** :
Créer un système de cache local pour stocker les prédicats et objets nouvellement créés.

**Fichier** : `apps/web/src/utils/localCache.ts`

**Fonctionnalités** :
- Sauvegarde après création atom
- Récupération combinée (cache + GraphQL)
- Nettoyage automatique (TTL)
- Synchronisation avec GraphQL

**Storage** : localStorage ou IndexedDB

---

### Issue #100 - Upload IPFS ❌ ANNULÉE

**Raison** : Le SDK INTUITION gère déjà l'upload IPFS automatiquement !

**Fonctions SDK disponibles** :
```typescript
// Upload automatique dans createAtomFromThing
createAtomFromThing({
  name: string,
  description: string,
  image: string  // ✅ Gère IPFS automatiquement
})

// Upload IPFS dédié
createAtomFromIpfsUpload(metadata: object)
```

**Conclusion** : Pas besoin de gérer Pinata manuellement, le SDK s'en charge.

---

## 📊 Impact sur le Projet

### Avant (avec backend)

```
Issues totales : 74
Issues backend : 7 (#51-57)
Issues backend-related : 3 (#22, #28, #55)
Total impacté : 10 issues
```

### Après (sans backend)

```
Issues à fermer : 7
Issues à modifier : 3
Nouvelles issues : 3
Net : -7 issues

Issues totales : 67 (au lieu de 74)
```

### Avantages de la simplification

| Aspect | Avant | Après |
|--------|-------|-------|
| **Complexité** | Frontend + Backend | Frontend only |
| **Hébergement** | 2 services (Vercel + Render) | 1 service (Vercel) |
| **Coûts** | ~$7/mois (Render) | $0 (Vercel free tier) |
| **Maintenance** | 2 codebases | 1 codebase |
| **Sécurité** | API keys serveur + frontend | Frontend only |
| **Scalabilité** | Limitée par serveur | Illimitée (statique) |
| **Deploy** | 2 pipelines CI/CD | 1 pipeline |

---

## 🔄 Plan d'Action

### Étape 1 : Fermer les issues backend ✅ FAIT

**Fermées le** : 21 novembre 2025

Issues fermées avec commentaire expliquant la nouvelle architecture :
- ✅ #51 - Setup Fastify
- ✅ #52 - Variables environnement
- ✅ #53 - Endpoint whitelist
- ✅ #54 - Endpoint modération
- ✅ #55 - Endpoint Pinata
- ✅ #56 - CORS et sécurité
- ✅ #57 - Déploiement Render
- ✅ #62 - Protection CSRF
- ✅ #63 - Logging Pino
- ✅ #64 - Gestion secrets

### Étape 2 : Créer les nouvelles issues ✅ FAIT

- ✅ Créé issue #96 - Whitelist on-chain (remplace #53)
- ✅ Créé issue #97 - Cache local (remplace #62)
- ❌ Annulé issue #100 - SDK INTUITION gère déjà IPFS

### Étape 3 : Modifier les issues existantes ✅ FAIT

- ✅ Issue #22 fermée le 19 nov (whitelist backend) → Remplacée par #96
- ✅ Issue #28 reste OPEN (ImageUpload) → SDK INTUITION gère IPFS
- ✅ Issues #33, #34, #39, #46 modifiées : Backend → Frontend

### Étape 4 : Mettre à jour la documentation ✅ FAIT

- ✅ Mis à jour [ISSUES_GITHUB.md](../issues/ISSUES_GITHUB.md)
- ✅ Mis à jour [MODIFICATIONS_EN_COURS.md](./MODIFICATIONS_EN_COURS.md)
- ✅ Ce fichier (ARCHITECTURE_NO_BACKEND.md) créé et complété

---

## 📝 Notes Importantes

### Sécurité

**Frontend only = Plus sûr ?**

Oui, dans ce cas :
- ✅ Pas d'API keys côté serveur à protéger
- ✅ Pas de CORS issues
- ✅ Pas de endpoints à sécuriser
- ✅ Vérification trustless (on-chain)

**Risques à gérer** :
- ⚠️ Pinata JWT exposé côté frontend → Mettre rate limiting
- ⚠️ RPC rate limiting → Utiliser Alchemy/Infura

### Performance

**GraphQL queries directes depuis frontend** :
- Utiliser cache Apollo Client agressif
- Polling intelligent (seulement si vote actif)
- Optimistic updates pour meilleure UX

### Évolutivité

**Si backend devient nécessaire plus tard** :
- Facile à ajouter (API read-only pour stats)
- Pas de migration de données (tout on-chain)
- Backend peut être ajouté sans casser frontend

---

## 🔗 Références

- [INTUITION SDK](https://github.com/0xIntuition/intuition-ts/tree/main/packages/sdk)
- [NFT Whitelist Contract](https://basescan.org/token/0x98e240326966e86ad6ec27e13409ffb748788f8c)
- [Pinata Web3 SDK](https://docs.pinata.cloud/web3/sdk)
- [wagmi Contract Reads](https://wagmi.sh/react/api/hooks/useReadContract)

---

**Dernière mise à jour** : 21 novembre 2025
**Status** : ✅ COMPLÉTÉ - Toutes les actions terminées

**Résumé des actions** :
- ✅ 10 issues backend fermées (#51-57, #62-64)
- ✅ 2 nouvelles issues frontend créées (#96, #97)
- ✅ 1 issue annulée (#100 - SDK gère IPFS)
- ✅ Documentation mise à jour
- ✅ **Net : -8 issues** (74 → 69 issues totales)
