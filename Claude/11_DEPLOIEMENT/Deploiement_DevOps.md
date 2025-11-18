# 🚀 Déploiement & DevOps - INTUITION Founders Totem

**Date de création** : 18 novembre 2025
**Dernière mise à jour** : 18 novembre 2025
**Statut** : ✅ Complet

---

## 📋 Table des matières

1. [Introduction](#-introduction)
2. [Stratégie 100% gratuite](#-stratégie-100-gratuite)
3. [Hébergement Frontend](#-hébergement-frontend)
4. [Hébergement Backend](#-hébergement-backend)
5. [CI/CD avec GitHub Actions](#-cicd-avec-github-actions)
6. [Environnements](#-environnements)
7. [Variables d'environnement](#-variables-denvironnement)
8. [Domaine et DNS](#-domaine-et-dns)
9. [Monitoring et Alertes](#-monitoring-et-alertes)
10. [Plan d'implémentation](#-plan-dimplémentation)

---

## 🎯 Introduction

Un déploiement efficace et un pipeline DevOps robuste sont essentiels pour :

- **Rapidité** : Déploiements automatiques en quelques minutes
- **Fiabilité** : Tests automatiques avant chaque déploiement
- **Sécurité** : Gestion sécurisée des secrets et variables
- **Monitoring** : Alertes en cas de problème
- **Rollback** : Retour rapide à une version stable si besoin

### 🎯 Contrainte prioritaire : **GRATUIT !**

Comme pour tout le reste du projet, on privilégie une stack **100% gratuite** :

- ✅ **Hébergement gratuit** (Vercel + Render)
- ✅ **CI/CD gratuit** (GitHub Actions)
- ✅ **DNS gratuit** (Cloudflare)
- ✅ **SSL gratuit** (Let's Encrypt via plateformes)
- ✅ **Monitoring gratuit** (UptimeRobot + Render Logs)

---

## 💰 Stratégie 100% gratuite

### Stack recommandée

| Composant | Solution | Coût | Limites Free Tier |
|-----------|----------|------|-------------------|
| **Frontend hosting** | Vercel | $0 | 6000 min build/mois, 100GB bandwidth |
| **Backend hosting** | Render Free | $0 | 750h/mois, 512MB RAM, sleep après 15min |
| **CI/CD** | GitHub Actions | $0 | Illimité pour repos publics |
| **DNS** | Cloudflare | $0 | Illimité |
| **SSL** | Let's Encrypt | $0 | Auto via Vercel/Render |
| **Monitoring** | UptimeRobot | $0 | 50 monitors, checks 5min |
| **Domain** | nic.us.kg | $0 | .us.kg gratuit (1 an renouvelable) |

**Total : $0/mois** ✅

---

### Alternatives si budget

| Service | Plan payant | Prix | Avantages |
|---------|-------------|------|-----------|
| **Vercel Pro** | Vercel Pro | $20/mois | Pas de sleep, analytics avancées |
| **Render Starter** | Render Starter | $7/mois | Pas de sleep, 512MB RAM |
| **Custom domain** | .com via Cloudflare | $9/an | Domaine professionnel |

---

## 🎨 Hébergement Frontend

### Vercel vs Netlify

| Critère | Vercel Free | Netlify Free | Recommandation |
|---------|-------------|--------------|----------------|
| **Build minutes** | 6000/mois | 300/mois | ✅ Vercel |
| **Bandwidth** | 100GB/mois | 100GB/mois | = |
| **Collaborators** | Illimité | 1 seul | ✅ Vercel |
| **Serverless functions** | 100 GB-s | 125k requêtes | = |
| **Ecosystem** | Optimisé React/Next.js | Framework agnostic | ✅ Vercel |
| **Performance** | Excellent | Excellent | = |

**Verdict : Vercel** ✅
- 20x plus de build minutes (6000 vs 300)
- Collaborateurs illimités
- Meilleure intégration React/Vite

---

### Configuration Vercel

#### 1. Créer compte et lier GitHub

1. Aller sur [vercel.com](https://vercel.com)
2. Sign up avec GitHub
3. Import project → Sélectionner le repo

#### 2. Configuration du projet

```json
// vercel.json
{
  "framework": "vite",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "devCommand": "pnpm dev",
  "env": {
    "VITE_INTUITION_API_URL": "https://api.intuition.systems/graphql",
    "VITE_BASE_CHAIN_ID": "8453"
  }
}
```

#### 3. Variables d'environnement

Dans Vercel Dashboard → Settings → Environment Variables :

**Production** :
```
VITE_INTUITION_API_URL=https://api.intuition.systems/graphql
VITE_BASE_CHAIN_ID=8453
VITE_WALLETCONNECT_PROJECT_ID=<your_project_id>
VITE_ALCHEMY_API_KEY=<your_alchemy_key>
```

**Preview** (optionnel) :
```
VITE_INTUITION_API_URL=https://testnet.api.intuition.systems/graphql
VITE_BASE_CHAIN_ID=84532
```

#### 4. Domaines

**Default** : `<project-name>.vercel.app` (gratuit)

**Custom domain** (optionnel) :
1. Ajouter domaine dans Vercel
2. Configurer DNS chez le registrar
3. SSL automatique via Let's Encrypt

---

### Déploiement automatique

**Trigger** :
- ✅ Push sur `main` → Deploy production
- ✅ Push sur autre branche → Deploy preview
- ✅ Pull Request → Deploy preview automatique

**Preview URLs** :
Chaque PR génère une URL unique : `<branch-name>.<project>.vercel.app`

---

## 🔧 Hébergement Backend

### Render Free Tier

**Caractéristiques** :
- ✅ 750 heures/mois de compute
- ✅ 512MB RAM
- ✅ Auto-sleep après 15 minutes d'inactivité
- ✅ Réveil automatique (~30s) à la première requête
- ✅ Logs 7 jours de rétention
- ✅ SSL gratuit
- ✅ Deploy automatique depuis GitHub

**Limitations** :
- ⚠️ Sleep après 15min → Première requête lente (~30s)
- ⚠️ 512MB RAM max
- ⚠️ 0.1 CPU partagé

---

### Configuration Render

#### 1. Créer le service

1. Aller sur [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Sélectionner le repo backend

#### 2. Configuration

```yaml
# render.yaml
services:
  - type: web
    name: intuition-totem-api
    runtime: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    env: node
    plan: free
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: LOG_LEVEL
        value: info
```

#### 3. Variables d'environnement

Dans Render Dashboard → Environment :

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<postgres_url>
REDIS_URL=<redis_url>
BACKEND_SECRET_KEY=<generate_secure_key>
PINATA_API_KEY=<your_pinata_key>
PINATA_SECRET_KEY=<your_pinata_secret>
INTUITION_API_URL=https://api.intuition.systems/graphql
```

#### 4. Health check

```typescript
// backend/src/routes/health.ts
export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  });
};
```

---

### Gérer le cold start (sleep)

**Stratégies** :

1. **UptimeRobot ping** (gratuit)
   - Ping toutes les 5 minutes
   - Garde le service actif 24/7
   - Gratuit jusqu'à 50 monitors

2. **Cron job externe** (gratuit)
   - cron-job.org (gratuit)
   - Ping `/health` toutes les 10 minutes

3. **Frontend ping** (optionnel)
   ```typescript
   // Ping au chargement de l'app pour réveiller le backend
   useEffect(() => {
     fetch('https://api.your-backend.onrender.com/health')
       .catch(() => {});
   }, []);
   ```

4. **Upgrade Render Starter** ($7/mois)
   - Pas de sleep
   - Instance dédiée

---

## ⚙️ CI/CD avec GitHub Actions

### Configuration gratuite

**Limites Free Tier** :
- ✅ **Illimité** pour repos publics
- ✅ 2000 minutes/mois pour repos privés
- ✅ Linux, macOS, Windows runners

---

### Workflow Frontend

```yaml
# .github/workflows/frontend.yml
name: Frontend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'frontend/**'
  pull_request:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: 'frontend/pnpm-lock.yaml'

      - name: Install dependencies
        working-directory: frontend
        run: pnpm install --frozen-lockfile

      - name: Lint
        working-directory: frontend
        run: pnpm lint

      - name: Type check
        working-directory: frontend
        run: pnpm type-check

      - name: Build
        working-directory: frontend
        run: pnpm build
        env:
          VITE_INTUITION_API_URL: ${{ secrets.VITE_INTUITION_API_URL }}
          VITE_BASE_CHAIN_ID: ${{ secrets.VITE_BASE_CHAIN_ID }}

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

### Workflow Backend

```yaml
# .github/workflows/backend.yml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
  pull_request:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: 'backend/pnpm-lock.yaml'

      - name: Install dependencies
        working-directory: backend
        run: pnpm install --frozen-lockfile

      - name: Lint
        working-directory: backend
        run: pnpm lint

      - name: Type check
        working-directory: backend
        run: pnpm type-check

      - name: Build
        working-directory: backend
        run: pnpm build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```

---

### Secrets GitHub

Dans repo → Settings → Secrets and variables → Actions :

```
# Vercel
VERCEL_TOKEN=<vercel_api_token>
VERCEL_ORG_ID=<org_id>
VERCEL_PROJECT_ID=<project_id>

# Render
RENDER_DEPLOY_HOOK_URL=<deploy_hook_url>

# Environment variables
VITE_INTUITION_API_URL=https://api.intuition.systems/graphql
VITE_BASE_CHAIN_ID=8453
```

---

## 🌍 Environnements

### Structure recommandée

| Environnement | Branch | URL | Usage |
|---------------|--------|-----|-------|
| **Development** | `develop` | `dev.*.vercel.app` | Développement actif |
| **Staging** | `staging` | `staging.*.vercel.app` | Tests avant prod |
| **Production** | `main` | `app.yoursite.com` | Production publique |

---

### Configuration par environnement

#### Frontend (.env files)

```bash
# .env (base, commité)
VITE_APP_NAME="INTUITION Founders Totem"
VITE_APP_VERSION="1.0.0"

# .env.development (dev, commité)
VITE_INTUITION_API_URL=https://testnet.api.intuition.systems/graphql
VITE_BASE_CHAIN_ID=84532

# .env.production (prod, commité)
VITE_INTUITION_API_URL=https://api.intuition.systems/graphql
VITE_BASE_CHAIN_ID=8453

# .env.local (secrets, PAS commité)
VITE_WALLETCONNECT_PROJECT_ID=abc123
VITE_ALCHEMY_API_KEY=xyz789
```

#### Backend (.env files)

```bash
# .env.development
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
DATABASE_URL=postgresql://localhost:5432/totem_dev

# .env.production
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
DATABASE_URL=<production_db_url>
```

---

## 🔐 Variables d'environnement

### Best practices

1. **Préfixe VITE_** pour frontend
   ```typescript
   // ✅ Accessible dans le code
   const apiUrl = import.meta.env.VITE_API_URL;

   // ❌ Non accessible (pas de préfixe VITE_)
   const secret = import.meta.env.SECRET_KEY;
   ```

2. **Ne JAMAIS commiter les secrets**
   ```gitignore
   # .gitignore
   .env.local
   .env.*.local
   .env.production.local
   ```

3. **Validation au démarrage**
   ```typescript
   // backend/src/config/env.ts
   import { z } from 'zod';

   const EnvSchema = z.object({
     NODE_ENV: z.enum(['development', 'test', 'production']),
     PORT: z.string().transform(Number),
     DATABASE_URL: z.string().url(),
     BACKEND_SECRET_KEY: z.string().min(32)
   });

   export const env = EnvSchema.parse(process.env);
   ```

4. **Documentation**
   ```bash
   # .env.example (commité)
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   BACKEND_SECRET_KEY=generate_with_openssl_rand_base64_32
   ```

---

### Accès dans le code

**Frontend** :
```typescript
// frontend/src/config/env.ts
export const config = {
  api: {
    url: import.meta.env.VITE_INTUITION_API_URL,
    chainId: Number(import.meta.env.VITE_BASE_CHAIN_ID)
  },
  wallet: {
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
  }
};
```

**Backend** :
```typescript
// backend/src/config/env.ts
import 'dotenv/config';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  database: {
    url: process.env.DATABASE_URL!
  },
  secrets: {
    key: process.env.BACKEND_SECRET_KEY!
  }
};
```

---

## 🌐 Domaine et DNS

### Option 1 : Domaine gratuit (.us.kg)

**nic.us.kg** offre des domaines gratuits :
- ✅ Gratuit pendant 1 an (renouvelable)
- ✅ Maximum 3 domaines par utilisateur
- ✅ Approbation rapide (24-48h)

**Étapes** :
1. Aller sur [nic.us.kg](https://nic.us.kg)
2. Créer un compte
3. Enregistrer `yourproject.us.kg`
4. Configurer DNS avec Cloudflare

---

### Option 2 : Domaine payant (.com)

**Cloudflare Registrar** (at-cost) :
- Prix : ~$9/an pour .com
- Pas de markup (prix coûtant)
- DNS inclus

**Autres registrars** :
- Namecheap : ~$13/an
- Google Domains : ~$12/an
- Gandi : ~$15/an

---

### Configuration DNS (Cloudflare)

1. **Ajouter site à Cloudflare**
   - Sign up sur [cloudflare.com](https://cloudflare.com)
   - Add site → Enter domain
   - Plan Free ($0)

2. **Configurer nameservers**
   Chez le registrar, changer pour Cloudflare NS :
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```

3. **Records DNS**
   ```
   # Frontend (Vercel)
   Type: CNAME
   Name: @
   Content: cname.vercel-dns.com
   Proxy: ON (orange cloud)

   Type: CNAME
   Name: www
   Content: cname.vercel-dns.com
   Proxy: ON

   # Backend (Render)
   Type: CNAME
   Name: api
   Content: yourapp.onrender.com
   Proxy: ON
   ```

4. **SSL/TLS**
   - Mode : Full (strict)
   - Auto SSL via Cloudflare
   - Edge certificates gratuits

---

### URLs finales

```
https://yourproject.us.kg → Frontend (Vercel)
https://www.yourproject.us.kg → Frontend (Vercel)
https://api.yourproject.us.kg → Backend (Render)
```

---

## 📊 Monitoring et Alertes

### UptimeRobot (gratuit)

**Configuration** :

1. **Créer compte** : [uptimerobot.com](https://uptimerobot.com)

2. **Monitor Frontend**
   ```
   Type: HTTPS
   URL: https://yourproject.us.kg
   Interval: 5 minutes
   Alert: Email si down > 5 minutes
   ```

3. **Monitor Backend**
   ```
   Type: HTTPS
   URL: https://api.yourproject.us.kg/health
   Interval: 5 minutes
   Alert: Email si down > 5 minutes
   Keyword: "ok" (cherche dans response)
   ```

4. **Ping pour éviter sleep**
   - Render Free sleep après 15min
   - UptimeRobot ping toutes les 5min
   - = Backend reste actif 24/7

---

### Render Logs

**Accès logs** :
- Dashboard Render → Service → Logs
- CLI : `render logs <service-id>`
- Rétention : 7 jours gratuit

**Filtrage** :
```bash
# Voir erreurs uniquement
render logs <service-id> --level error

# Tail en temps réel
render logs <service-id> --tail
```

---

### Vercel Analytics (optionnel)

**Vercel Free inclut** :
- Web Vitals (Core Web Vitals)
- Visitors count (basique)
- Top pages

**Vercel Pro ($20/mois)** :
- Analytics avancées
- Real User Monitoring
- Custom events

---

## 📋 Plan d'implémentation

### Phase 1 : Setup de base (1-2 jours)

**Frontend** :
- [ ] Créer compte Vercel
- [ ] Lier repo GitHub
- [ ] Configurer variables d'environnement
- [ ] Premier déploiement
- [ ] Vérifier build et preview

**Backend** :
- [ ] Créer compte Render
- [ ] Créer Web Service
- [ ] Configurer variables d'environnement
- [ ] Créer endpoint `/health`
- [ ] Premier déploiement
- [ ] Tester API

**CI/CD** :
- [ ] Créer `.github/workflows/frontend.yml`
- [ ] Créer `.github/workflows/backend.yml`
- [ ] Ajouter secrets GitHub
- [ ] Tester workflows sur PR

---

### Phase 2 : Configuration avancée (2-3 jours)

**Environnements** :
- [ ] Branch `develop` pour dev
- [ ] Branch `staging` pour staging
- [ ] Déploiement auto par branche

**Domaine** :
- [ ] Enregistrer domaine gratuit (.us.kg)
- [ ] Configurer Cloudflare DNS
- [ ] Ajouter domaine à Vercel
- [ ] Configurer SSL

**Monitoring** :
- [ ] Créer compte UptimeRobot
- [ ] Monitor frontend
- [ ] Monitor backend
- [ ] Alertes email

---

### Phase 3 : Optimisations (1-2 jours)

**Performance** :
- [ ] Activer Vercel Edge caching
- [ ] Optimiser build Vite
- [ ] Compress assets

**Sécurité** :
- [ ] Configurer CSP headers
- [ ] Rate limiting sur API
- [ ] CORS strict

**Documentation** :
- [ ] README déploiement
- [ ] Runbook incident response
- [ ] Guide rollback

---

## 🎯 Checklist finale

### Configuration initiale
- [ ] Compte Vercel créé
- [ ] Compte Render créé
- [ ] Compte Cloudflare créé (optionnel)
- [ ] Compte UptimeRobot créé

### Frontend
- [ ] Déploiement Vercel fonctionnel
- [ ] Variables d'environnement configurées
- [ ] Preview deployments actifs
- [ ] Custom domain configuré (optionnel)

### Backend
- [ ] Déploiement Render fonctionnel
- [ ] Endpoint `/health` actif
- [ ] Variables d'environnement configurées
- [ ] Logs accessibles

### CI/CD
- [ ] Workflows GitHub Actions créés
- [ ] Tests automatiques sur PR
- [ ] Déploiement auto sur merge
- [ ] Secrets GitHub configurés

### DNS & Domaine
- [ ] Domaine enregistré (gratuit ou payant)
- [ ] DNS Cloudflare configuré
- [ ] SSL actif
- [ ] Redirection www → apex

### Monitoring
- [ ] UptimeRobot monitors actifs
- [ ] Alertes email configurées
- [ ] Render logs vérifiés
- [ ] Health checks fonctionnels

---

## 💰 Récapitulatif des coûts

| Service | Plan | Coût | Notes |
|---------|------|------|-------|
| **Vercel** | Free | $0 | 6000 min build, 100GB bandwidth |
| **Render** | Free | $0 | 750h/mois, sleep après 15min |
| **GitHub Actions** | Free | $0 | Illimité pour repos publics |
| **Cloudflare DNS** | Free | $0 | DNS + SSL inclus |
| **UptimeRobot** | Free | $0 | 50 monitors, checks 5min |
| **Domain .us.kg** | Free | $0 | 1 an renouvelable |
| **Total MVP** | | **$0/mois** | ✅ |

### Upgrades optionnels

| Service | Plan | Coût/mois | Avantages |
|---------|------|-----------|-----------|
| Render Starter | Starter | $7 | Pas de sleep, instance dédiée |
| Vercel Pro | Pro | $20 | Analytics avancées, sans limites |
| Domain .com | Registrar | ~$1/mois | Domaine professionnel |
| **Total avec upgrades** | | **$28/mois** | Si scale |

---

## 📝 Ressources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Cloudflare Documentation](https://developers.cloudflare.com/)
- [Vite Env Variables](https://vite.dev/guide/env-and-mode)

### Outils
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Render Dashboard](https://dashboard.render.com/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [UptimeRobot Dashboard](https://uptimerobot.com/dashboard)

### Domaines gratuits
- [nic.us.kg](https://nic.us.kg) - Domaines .us.kg gratuits

---

## 🏁 Conclusion

### Stack recommandée : 100% GRATUITE

**Hébergement** :
- ✅ Frontend : Vercel Free (6000 min build/mois)
- ✅ Backend : Render Free (750h/mois)

**CI/CD** :
- ✅ GitHub Actions (illimité pour repos publics)

**DNS & Domaine** :
- ✅ Cloudflare DNS (gratuit)
- ✅ Domain .us.kg (gratuit 1 an)

**Monitoring** :
- ✅ UptimeRobot (50 monitors gratuits)
- ✅ Render Logs (7 jours rétention)

**Coût total : $0/mois** ✅

### Prochaines étapes

1. ✅ Setup Vercel + Render
2. ⏳ Configurer CI/CD GitHub Actions
3. ⏳ Enregistrer domaine gratuit
4. ⏳ Configurer monitoring UptimeRobot
5. ⏳ Premier déploiement production

---

**Dernière mise à jour** : 18 novembre 2025
**Auteur** : Documentation Master - INTUITION Founders Totem
**Statut** : ✅ Complet
