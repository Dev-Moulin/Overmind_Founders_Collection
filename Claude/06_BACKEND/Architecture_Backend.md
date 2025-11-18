# 🔧 Backend Architecture - Choix Technique

**Date de création** : 18 novembre 2025
**Statut** : ✅ Recherche complète
**Issue GitHub** : #1

## 🎯 Objectif

Déterminer l'architecture backend optimale pour le projet INTUITION Founders Totem en comparant trois approches : **Express**, **Fastify**, et **tRPC**.

---

## 📊 Tableau Comparatif des Frameworks

| Critère | Express | Fastify | tRPC |
|---------|---------|---------|------|
| **Performance** | 20-30k req/s | 70-80k req/s | N/A (surcouche) |
| **Latence moyenne** | ~92ms | ~21ms | Dépend du framework sous-jacent |
| **TypeScript** | Support basique | Support natif excellent | TypeScript OBLIGATOIRE |
| **Courbe d'apprentissage** | ⭐⭐ Facile | ⭐⭐⭐ Moyenne | ⭐⭐⭐⭐ Difficile |
| **Écosystème** | Énorme | Grandissant | Nouveau mais actif |
| **Maturité** | 15+ ans | ~8 ans | ~3-4 ans |
| **Type Safety** | ❌ Non | ⚠️ Partiel | ✅ End-to-end |
| **API Publique** | ✅ Excellent | ✅ Excellent | ❌ Non recommandé |
| **Monorepo** | ⚠️ Possible | ⚠️ Possible | ✅ Optimisé pour |

---

## 🔍 Analyse Détaillée des Frameworks

### 1. Express.js

#### ✅ Avantages
- **Maturité** : 15+ ans d'existence, énorme communauté
- **Écosystème** : Milliers de middlewares disponibles
- **Documentation** : Extensive et de nombreux tutoriels
- **Facilité** : Courbe d'apprentissage très douce
- **Compatibilité** : Fonctionne avec tout, partout
- **Développeurs** : Facile de trouver des devs qui connaissent Express

#### ❌ Inconvénients
- **Performance** : 2-4x plus lent que Fastify
- **TypeScript** : Support limité, beaucoup de types `any`
- **Architecture** : Pas de structure imposée (peut devenir désordonné)
- **Validation** : Pas de validation de schéma intégrée
- **Moderne** : Paradigmes datés pour 2025

---

### 2. Fastify

#### ✅ Avantages
- **Performance** : 3-4x plus rapide qu'Express (70-80k req/s)
- **TypeScript** : Support natif excellent
- **Moderne** : Architecture moderne, async/await first
- **Validation** : Schéma JSON intégré avec Ajv
- **Plugins** : Système de plugins puissant
- **CPU** : Utilise moins de CPU (important pour coûts cloud)
- **Sérialisation** : 38% plus rapide qu'Express pour JSON
- **Logging** : Logger performant intégré (Pino)

#### ❌ Inconvénients
- **Écosystème** : Plus petit qu'Express (mais en croissance)
- **Courbe d'apprentissage** : Un peu plus complexe qu'Express
- **Compatibilité** : Certains middlewares Express ne fonctionnent pas directement
- **Mémoire** : Utilise plus de RAM qu'Express

---

### 3. tRPC

#### ✅ Avantages
- **Type Safety** : Type safety end-to-end automatique
- **DX** : Developer Experience exceptionnelle
- **Autocomplétion** : IntelliSense complet frontend ↔️ backend
- **Moins de code** : Pas besoin de définir types séparément
- **React Query** : Intégration native avec TanStack Query
- **Validation** : Utilise Zod pour validation type-safe
- **Monorepo** : Conçu pour architectures monorepo
- **Vite** : Intégration parfaite avec Vite

#### ❌ Inconvénients
- **TypeScript ONLY** : Impossible d'utiliser JavaScript
- **Monorepo recommandé** : Complexe à setup sans monorepo
- **Courbe d'apprentissage** : Plus raide que REST classique
- **API Publique** : ❌ NON adapté pour APIs publiques
- **Dépendance** : Tourne SUR Express/Fastify (pas standalone)
- **Abstraction** : Certains devs trouvent ça trop abstrait
- **Nouveauté** : Moins de ressources/tutoriels que REST

---

## 💰 Comparaison Complète des Hébergements

### Tableau Comparatif des Plateformes

| Plateforme | Free Tier | Starter | Pro | Backend Support | Best For |
|------------|-----------|---------|-----|-----------------|----------|
| **Railway** | $1 crédit | $5/mois + usage | $20/mois + usage | ✅ Excellent | Backend Node.js |
| **Render** | ✅ Limité | $7-25/mois | $85/mois | ✅ Excellent | Apps full-stack |
| **Fly.io** | ✅ 3 VMs | $5/mois | Usage-based | ✅ Excellent | Apps distribuées |
| **Heroku** | ❌ Supprimé | $25-50/mois | $250+/mois | ✅ Excellent | Enterprise (cher) |
| **Vercel** | ✅ Generous | $20/mois | Custom | ⚠️ Limité | Frontend + API légers |
| **Netlify** | ✅ 100GB | $15/mois | Custom | ⚠️ Limité | Frontend + Functions |
| **DigitalOcean** | ✅ 3 apps | $3/app | Flexible | ✅ Excellent | Flexible, abordable |

---

### 1. Railway ⭐ RECOMMANDÉ

#### 💰 Prix
- **Free** : $1 crédit post-trial (~500h instance basique)
- **Hobby** : $5/mois + $0.0002/CPU-sec
- **Pro** : $20/mois + usage

#### ✅ Avantages
- Usage-based pricing (paye ce que tu utilises)
- Déploiement depuis GitHub ultra simple
- Support MySQL/Postgres/Redis inclus
- Pas de carte bancaire nécessaire pour commencer
- Sleep automatique après 10min inactivité (économie)
- Interface moderne et intuitive
- **~$10-15/mois pour un backend léger**

#### ❌ Inconvénients
- Coûts peuvent exploser lors de pics de trafic
- Moins prévisible que flat pricing

#### 🎯 Idéal pour
✅ Notre projet : backend Node.js léger, déploiement facile, coûts contrôlés

---

### 2. Render

#### 💰 Prix
- **Free** : Limité (hobby projects)
- **Basic** : $7/mois (ressources fixes, pas de surprise)
- **Standard** : $25/mois (2GB RAM, 1 CPU)
- **Pro** : $85/mois (4GB RAM, 2 CPU)
- **Professional tier** : $19/user/mois + compute

#### ✅ Avantages
- Free tier disponible
- Économie de 80% vs Heroku
- Managed databases incluses
- Support Docker natif
- Pull request previews
- Pricing prévisible

#### ❌ Inconvénients
- Baseline de $19/mois sur plans non-free
- Moins flexible que Railway

#### 🎯 Idéal pour
✅ Projets avec trafic prévisible, besoin de databases

---

### 3. Fly.io

#### 💰 Prix
- **Free** : 3 shared-cpu VMs + 3GB storage
- **Starter** : ~$5/mois
- **Pro** : Usage-based
- **Postgres** : À partir de $3/mois

#### ✅ Avantages
- Déploiement multi-régions (low latency global)
- Contrôle granulaire de l'infrastructure
- Excellent pour apps distribuées
- Pricing compétitif

#### ❌ Inconvénients
- Plus complexe à configurer
- Nécessite plus de connaissances infra

#### 🎯 Idéal pour
✅ Apps nécessitant low-latency globale, contrôle avancé

---

### 4. Heroku

#### 💰 Prix
- **Free** : ❌ Supprimé en novembre 2022
- **Basic** : $25-50/mois (1GB Standard Dyno)
- **Standard** : $50/mois
- **Performance** : $250+/mois (2.5GB)
- **Postgres** : ~$50/mois pour version décente

#### ✅ Avantages
- Marketplace d'add-ons immense
- Très mature et stable
- Documentation exhaustive
- Bonne pour entreprises avec budget

#### ❌ Inconvénients
- ❌ **CHER** : 2-4x plus cher que alternatives
- Pannes fréquentes en 2025 (15h45 en juin, 8h30 en juin)
- Free tier supprimé
- Non recommandé pour indie projects

#### 🎯 Idéal pour
⚠️ Startups avec funding, pas pour projets personnels

---

### 5. Vercel

#### 💰 Prix
- **Hobby** : Gratuit (limites généreuses)
- **Pro** : $20/user/mois
- **Enterprise** : Custom

#### ✅ Avantages
- Excellent pour frontend (Next.js, React)
- CDN global ultra rapide
- Serverless functions incluses
- Déploiement automatique depuis Git
- Free tier généreux

#### ❌ Inconvénients Backend
- ❌ **Limite 250 MB** par function (uncompressed)
- ❌ **Limite 4.5 MB** de request body
- ❌ **Pas de background jobs** persistants
- ❌ **Pas de WebSockets** persistants
- ❌ **Limite 12 functions** sur plan Hobby
- ❌ **60 secondes max** d'exécution
- Read-only filesystem (sauf /tmp 500MB)
- Langages limités

#### 🎯 Idéal pour
✅ Frontend + API légers
❌ Backend complexe, long-running tasks

---

### 6. Netlify

#### 💰 Prix
- **Free** : 100GB bandwidth
- **Starter** : $15/user/mois
- **Pro** : Custom

#### ✅ Avantages
- Excellent pour static sites
- Netlify Functions (serverless)
- CDN global
- CI/CD intégré

#### ❌ Inconvénients
- Limité pour backend complexe
- Similaire aux limites Vercel
- Moins flexible que Railway/Render

#### 🎯 Idéal pour
✅ Sites statiques + functions légères
❌ Backend full-featured

---

### 7. DigitalOcean App Platform

#### 💰 Prix
- **Free** : 3 static apps (1GB transfer/mois)
- **Static** : $3/app/mois
- **Container/Web Service** : Pricing flexible basé sur ressources choisies

#### ✅ Avantages
- Très abordable
- Flexible (choix des ressources)
- Bonne réputation infra
- Alternative cost-effective à Vercel/Heroku

#### ❌ Inconvénients
- Moins "magique" que Railway/Render
- Interface moins moderne

#### 🎯 Idéal pour
✅ Budget serré, contrôle des coûts

---

## 🎯 Analyse pour Notre Projet

### Besoins Spécifiques

Notre projet INTUITION Founders Totem nécessite :

1. ✅ **Whitelist Management** : Vérifier éligibilité des wallets (airdrop Nov 5)
2. ✅ **Modération** : Filtrage de contenu inapproprié
3. ⚠️ **API REST ?** : Potentiellement pour intégrations futures
4. ✅ **GraphQL** : On utilise déjà INTUITION GraphQL API
5. ✅ **IPFS/Pinata** : Upload d'images (backend ou frontend direct?)
6. ✅ **Performance** : Pas critique (quelques centaines d'users max)
7. ✅ **TypeScript** : Stack complète TypeScript (React + Vite)
8. ✅ **Monorepo** : Structure actuelle en monorepo
9. ✅ **Budget** : Limité (projet communautaire)

### Options Backend

#### 🤔 Option A : Backend Minimal (RECOMMANDÉ)

**Stack** : Fastify + Railway

**Endpoints** :
- `GET /api/whitelist/check/:address` - Vérification éligibilité
- `POST /api/moderate/text` - Modération de contenu
- `POST /api/upload/image` - Upload Pinata (optionnel)

**Coût estimé** : ~$10-15/mois sur Railway

**Avantages** :
- ✅ Sécurisé (clés API cachées côté serveur)
- ✅ Contrôle total sur modération
- ✅ Évolutif si besoin
- ✅ Coûts prévisibles

**Inconvénients** :
- ❌ Serveur à maintenir
- ❌ Coûts mensuels

---

#### 🤔 Option B : Sans Backend (Alternative)

**Stack** : Frontend only sur Vercel/Netlify

**Solutions** :
- Whitelist : Fichier JSON statique dans `/public/whitelist.json`
- Modération : Library frontend `bad-words` ou similaire
- Upload Pinata : Direct avec clé API publique restreinte

**Coût estimé** : $0/mois (free tier)

**Avantages** :
- ✅ Pas de serveur à maintenir
- ✅ Gratuit
- ✅ Simple

**Inconvénients** :
- ❌ Liste de mots interdits visible dans bundle JS
- ❌ Clé Pinata visible (même avec restrictions)
- ❌ Pas de rate limiting côté serveur
- ❌ Pas de logs centralisés
- ❌ Contournable facilement

---

## 🏆 Recommandation Finale

### 🎯 Contrainte Prioritaire : **GRATUIT d'abord !**

Le projet aura peu de trafic au début → Solution **100% gratuite** puis migration si nécessaire.

---

### ✅ CHOIX : Option GRATUITE - Render Free Tier

#### 🆓 Solution Gratuite Recommandée

**Stack** : Fastify + Render Free Tier

**Pourquoi Render Free ?**
1. ✅ **100% GRATUIT** pour commencer
2. ✅ Backend Node.js complet supporté
3. ✅ Pas de limite de temps (contrairement à Heroku avant)
4. ✅ Auto-sleep après inactivité (comme Railway)
5. ✅ 750h/mois de compute gratuit
6. ✅ Déploiement depuis GitHub automatique
7. ✅ Logs et monitoring inclus
8. ✅ Migration facile vers plan payant si besoin

**Limitations Free Tier** :
- ⚠️ Sleep après 15min inactivité (réveil en ~30s)
- ⚠️ 512MB RAM max
- ⚠️ 0.1 CPU partagé
- ⚠️ Pas de custom domain sur free
- ⚠️ 100GB bandwidth/mois

**Pour notre cas** : ✅ PARFAIT
- Peu de trafic attendu
- Endpoints simples et légers
- 512MB RAM largement suffisant
- Sleep acceptable (users attendent 30s au pire)

---

### 🔄 Plan de Migration si Croissance

#### Phase 1 : GRATUIT (Lancement)
**Hébergement** : Render Free Tier
**Coût** : **$0/mois** 🎉
**Capacité** : Quelques centaines de requêtes/jour

#### Phase 2 : Croissance Modérée
**Hébergement** : Render Starter ($7/mois) ou Railway Hobby ($5/mois)
**Coût** : **$5-10/mois**
**Capacité** : Milliers de requêtes/jour

#### Phase 3 : Forte Croissance
**Hébergement** : Render Standard ($25/mois) ou Railway Pro
**Coût** : **$25-40/mois**
**Capacité** : Dizaines de milliers de requêtes/jour

---

### 🆚 Alternatives Gratuites Comparées

| Plateforme | Free Tier | Auto-Sleep | Limitations | Verdict |
|------------|-----------|------------|-------------|---------|
| **Render** | ✅ 750h/mois | ✅ 15min | 512MB RAM | 🏆 **RECOMMANDÉ** |
| **Railway** | ⚠️ $1 crédit | ✅ 10min | ~500h gratuit | ✅ Bon aussi |
| **Fly.io** | ✅ 3 VMs | ✅ Auto | 256MB RAM/VM | ✅ Technique |
| **Vercel** | ✅ Généreux | ❌ Non | Serverless limité | ⚠️ API légers seulement |
| **Netlify** | ✅ 100GB | ❌ Non | Functions limitées | ⚠️ API légers seulement |
| **Heroku** | ❌ SUPPRIMÉ | - | - | ❌ Plus gratuit |

---

### 🎯 Pourquoi Fastify quand même ?

Même avec free tier, Fastify reste le meilleur choix :

1. ✅ **Performance** : Moins de CPU/RAM utilisé = tient dans 512MB
2. ✅ **TypeScript natif** : Cohérence avec frontend
3. ✅ **Léger** : Bundle plus petit qu'Express
4. ✅ **Moderne** : Architecture 2025
5. ✅ **Validation intégrée** : Zod/Ajv out-of-the-box
6. ✅ **Logging performant** : Pino (moins de RAM)

**Express** : ❌ Plus lourd, moins performant
**tRPC** : ❌ Overkill pour 3 endpoints

---

### 💡 Stratégie Optimisée pour Trafic Faible

#### Backend Minimal avec Cache Intelligent

```typescript
// Cache la whitelist en mémoire au démarrage
// → Évite appels API répétés
const whitelistCache = await loadWhitelist();

// Rate limiting agressif sur free tier
fastify.register(rateLimit, {
  max: 10,        // 10 requêtes
  timeWindow: 60  // par minute
});

// Modération avec cache
const moderationCache = new Map(); // En mémoire
```

**Avantages** :
- ✅ Moins de compute = reste dans free tier plus longtemps
- ✅ Répond plus vite même avec 0.1 CPU
- ✅ Moins de RAM utilisée

---

### 🚀 Migration Facile si Besoin

Si le projet décolle et qu'on dépasse le free tier :

**Option 1 : Render Starter ($7/mois)**
- Plus de compute
- Pas de sleep
- Migration en 1 clic

**Option 2 : Railway Hobby ($5/mois + usage)**
- Usage-based pricing
- Plus flexible
- ~$10-15/mois total

**Option 3 : Optimiser encore plus**
- Ajouter Redis cache externe
- CDN pour assets statiques
- Rester sur free tier plus longtemps

---

## 📦 Architecture Recommandée

### Structure du Projet

```
/
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   ├── vite.config.ts
│   └── package.json
│
└── backend/                # Fastify + TypeScript
    ├── src/
    │   ├── routes/
    │   │   ├── whitelist.ts    # GET /api/whitelist/check/:address
    │   │   ├── moderation.ts   # POST /api/moderate/text
    │   │   └── upload.ts       # POST /api/upload/image (Pinata)
    │   ├── services/
    │   │   ├── whitelist.service.ts
    │   │   ├── moderation.service.ts
    │   │   └── pinata.service.ts
    │   ├── schemas/            # Validation schemas (Zod)
    │   ├── app.ts              # Fastify app setup
    │   └── server.ts           # Server entry point
    ├── tsconfig.json
    └── package.json
```

### Endpoints API

```typescript
// 1. Vérification whitelist
GET /api/whitelist/check/:address
Response: {
  eligible: boolean,
  reason?: string
}

// 2. Modération de texte
POST /api/moderate/text
Body: {
  text: string,
  type: 'name' | 'description'
}
Response: {
  allowed: boolean,
  flagged: string[]
}

// 3. Upload image (optionnel)
POST /api/upload/image
Body: FormData with image file
Response: {
  ipfsHash: string,
  url: string
}
```

---

## 🛠️ Stack Technique Finale

### Backend
- **Framework** : Fastify v5.x
- **Language** : TypeScript 5.x
- **Validation** : Zod
- **Logging** : Pino (intégré)
- **Testing** : Vitest + Supertest
- **CORS** : @fastify/cors
- **Rate Limiting** : @fastify/rate-limit

### Hébergement
- **Plateforme** : Render
- **Plan** : Free Tier (750h/mois)
- **Coût estimé** : **$0/mois** 🎉
- **Database** : PostgreSQL gratuit sur Render (si besoin futur)
- **Migration** : Render Starter ($7/mois) si croissance

### Installation

```bash
# Backend
pnpm create fastify@latest backend
cd backend
pnpm install zod @fastify/cors @fastify/rate-limit pino
pnpm install -D @types/node vitest tsx

# Déploiement Render (GRATUIT)
# 1. Créer compte sur render.com
# 2. New → Web Service
# 3. Connecter GitHub repo
# 4. Root directory: backend
# 5. Build: pnpm install
# 6. Start: pnpm start
# 7. Ajouter variables d'environnement
# 8. Deploy automatique à chaque push sur main
```

---

## 📈 Évolution Future

### Phase 1 : Backend Minimal (Lancement)
- 3 endpoints simples
- Hébergement : **Render Free Tier**
- **Coût : $0/mois** 🎉
- ✅ Suffisant pour lancement et petit trafic

### Phase 2 : Backend Intermédiaire (Croissance)
- + Base de données PostgreSQL
- + Cache en mémoire optimisé
- + Analytics de base
- Hébergement : **Render Starter ($7/mois)** ou Railway Hobby
- **Coût : $7-15/mois**

### Phase 3 : Backend Avancé (Forte croissance)
- + Redis externe pour cache
- + Admin dashboard
- + Notifications
- + API publique documentée
- + Monitoring avancé (Sentry)
- Hébergement : **Render Standard ($25/mois)**
- **Coût : $25-40/mois**
- Migration possible vers AWS/GCP si besoin

---

## 🎓 Ressources

### Documentation Officielle
- [Fastify Official Docs](https://fastify.dev/)
- [Fastify TypeScript Guide](https://fastify.dev/docs/latest/Reference/TypeScript/)
- [Railway Documentation](https://docs.railway.app/)
- [Zod Documentation](https://zod.dev/)

### Comparaisons Hébergement
- [Heroku vs Render vs Railway vs Fly.io 2025](https://blog.boltops.com/2025/05/01/heroku-vs-render-vs-vercel-vs-fly-io-vs-railway-meet-blossom-an-alternative/)
- [Best PaaS Backend Hosting](https://nixsanctuary.com/best-paas-backend-hosting-heroku-vs-render-vs-flyio-vs-railwayapp/)

### Tutoriels Framework
- [Express vs Fastify 2025](https://medium.com/codetodeploy/express-or-fastify-in-2025-whats-the-right-node-js-framework-for-you-6ea247141a86)
- [tRPC vs REST Analysis](https://www.wisp.blog/blog/when-to-choose-rest-over-trpc-a-comparative-analysis)

---

## ✅ Résumé de la Décision

### Framework Backend
🏆 **Fastify** - Performance, TypeScript natif, moderne, léger

### Hébergement
🏆 **Render Free Tier** - **100% GRATUIT pour commencer** 🎉

### Justification
1. ✅ **COÛT : $0/mois** - Parfait pour lancement avec peu de trafic
2. ✅ Stack TypeScript cohérente (frontend ↔️ backend)
3. ✅ Sécurité renforcée (clés API côté serveur)
4. ✅ Migration facile vers plan payant si croissance
5. ✅ DX excellente (déploiement simple, logs clairs)
6. ✅ Communauté active et documentation à jour 2025
7. ✅ Fastify = moins de CPU/RAM = tient dans 512MB free tier

---

**Dernière mise à jour** : 18 novembre 2025
**Validé par** : Recherches approfondies 2025 (Heroku, Railway, Render, Fly.io, Vercel, Netlify, DigitalOcean)
**Prochaine étape** : Issue #2 - Documentation Sécurité
