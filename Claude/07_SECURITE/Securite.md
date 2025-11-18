# 🔒 Sécurité - Documentation Complète

**Date de création** : 18 novembre 2025
**Statut** : ✅ Recherche complète
**Issue GitHub** : #2

## 🎯 Objectif

Documenter toutes les mesures de sécurité nécessaires pour protéger l'application INTUITION Founders Totem contre les vulnérabilités connues et les vecteurs d'attaque courants.

---

## 📊 OWASP Top 10:2025 - Vue d'ensemble

Le **OWASP Top 10:2025** (Release Candidate publié le 6 novembre 2025) liste les risques de sécurité les plus critiques :

| Rang | Risque | Pertinence pour notre projet |
|------|--------|------------------------------|
| **A01** | Broken Access Control | ✅ Critique (whitelist, routes protégées) |
| **A02** | Security Misconfiguration | ✅ Haute (headers, CORS, CSP) |
| **A03** | Software Supply Chain Failures | ✅ Moyenne (dépendances npm) |
| **A04** | Cryptographic Failures | ⚠️ Faible (pas de données sensibles stockées) |
| **A05** | Injection (XSS, SQL) | ✅ Haute (inputs utilisateurs) |
| **A06** | Insecure Design | ✅ Moyenne (architecture) |
| **A07** | Identification Failures | ✅ Haute (wallet authentication) |
| **A08** | Data Integrity Failures | ⚠️ Moyenne (on-chain data) |
| **A09** | Logging & Monitoring | ✅ Haute (détection d'attaques) |
| **A10** | Exceptional Conditions | ✅ Moyenne (error handling) |

---

## 🛡️ Frontend Security (React + Vite)

### 1. Protection XSS (Cross-Site Scripting)

#### ✅ Protections Natives de React

**React échappe automatiquement** toutes les valeurs dans les expressions JSX :

```typescript
// ✅ SÉCURISÉ - React échappe automatiquement
const userInput = "<script>alert('XSS')</script>";
return <div>{userInput}</div>;
// Rendu : &lt;script&gt;alert('XSS')&lt;/script&gt;
```

#### ❌ Cas Dangereux à Éviter

**1. dangerouslySetInnerHTML**

```typescript
// ❌ DANGEREUX - XSS possible
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SÉCURISÉ - Utiliser DOMPurify
import DOMPurify from 'dompurify';

const sanitizedHTML = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

**2. URLs Dynamiques**

```typescript
// ❌ DANGEREUX - JavaScript injection possible
<a href={userInput}>Lien</a>

// ✅ SÉCURISÉ - Valider les URLs
const isSafeUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

{isSafeUrl(userInput) && <a href={userInput}>Lien</a>}
```

**3. Manipulation directe du DOM**

```typescript
// ❌ DANGEREUX - Éviter refs + innerHTML
const ref = useRef<HTMLDivElement>(null);
ref.current.innerHTML = userInput; // XSS !

// ✅ SÉCURISÉ - Utiliser React
return <div>{userInput}</div>;
```

#### 📦 Bibliothèques Recommandées

```bash
pnpm install dompurify
pnpm install -D @types/dompurify
```

```typescript
// utils/sanitize.ts
import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
};
```

---

### 2. Content Security Policy (CSP)

#### Qu'est-ce que CSP ?

CSP est une **couche de sécurité supplémentaire** qui aide à prévenir les attaques XSS, clickjacking et injection de code en contrôlant quelles ressources le navigateur peut charger.

#### ⚙️ Configuration pour Vite

**Option 1 : Plugin Vite CSP Guard (Recommandé)**

```bash
pnpm install -D vite-plugin-csp-guard
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cspPlugin from 'vite-plugin-csp-guard';

export default defineConfig({
  plugins: [
    react(),
    cspPlugin({
      dev: {
        run: true // Activer CSP en dev
      },
      policy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"], // Vite nécessite unsafe-inline en dev
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': [
          "'self'",
          'https://testnet.intuition.sh', // GraphQL API
          'https://sepolia.basescan.org'
        ],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"]
      }
    })
  ]
});
```

**Option 2 : Headers serveur (Production)**

```nginx
# Nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://testnet.intuition.sh;";
```

#### 📋 CSP pour Notre Projet

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://gateway.pinata.cloud;
  font-src 'self';
  connect-src 'self' https://testnet.intuition.sh https://sepolia.basescan.org wss://sepolia.base.org;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

---

### 3. Validation des Inputs (Frontend)

#### Utilisation de Zod

```typescript
// schemas/totem.schema.ts
import { z } from 'zod';

export const TotemProposalSchema = z.object({
  founderId: z.string().uuid(),
  totemName: z.string()
    .min(3, "Minimum 3 caractères")
    .max(50, "Maximum 50 caractères")
    .regex(/^[a-zA-Z0-9\s\-']+$/, "Caractères alphanumériques uniquement"),

  totemType: z.enum(['Object', 'Animal', 'Trait', 'Universe']),

  description: z.string()
    .min(10, "Minimum 10 caractères")
    .max(500, "Maximum 500 caractères"),

  imageFile: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "Max 5MB")
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      "Format: JPG, PNG ou WebP uniquement"
    )
    .optional()
});

export type TotemProposal = z.infer<typeof TotemProposalSchema>;
```

#### Intégration avec React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const ProposalForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<TotemProposal>({
    resolver: zodResolver(TotemProposalSchema)
  });

  const onSubmit = async (data: TotemProposal) => {
    // La validation Zod a déjà été faite
    // Envoyer au backend
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ... */}
    </form>
  );
};
```

---

### 4. Sécurité des Wallet Connections

#### Validation des Signatures

```typescript
// utils/auth.ts
import { verifyMessage } from 'viem';

export const verifyWalletSignature = async (
  address: `0x${string}`,
  message: string,
  signature: `0x${string}`
): Promise<boolean> => {
  try {
    const verified = await verifyMessage({
      address,
      message,
      signature
    });
    return verified;
  } catch {
    return false;
  }
};
```

#### Protection contre les Replay Attacks

```typescript
// Générer un nonce unique par session
const generateAuthMessage = (address: string): string => {
  const nonce = crypto.randomUUID();
  const timestamp = Date.now();

  return `Sign this message to authenticate with INTUITION Founders Totem.

Address: ${address}
Nonce: ${nonce}
Timestamp: ${timestamp}`;
};
```

---

## 🔐 Backend Security (Fastify)

### 1. Protection CSRF

#### Installation

```bash
pnpm install @fastify/csrf-protection @fastify/cookie
```

#### Configuration

```typescript
// server.ts
import fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';

const app = fastify();

// Cookies requis pour CSRF
await app.register(fastifyCookie);

// Protection CSRF
await app.register(fastifyCsrf, {
  cookieOpts: {
    signed: true,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  }
});

// Route pour obtenir le token CSRF
app.get('/api/csrf-token', async (request, reply) => {
  const token = await reply.generateCsrf();
  return { csrfToken: token };
});

// Routes protégées
app.post('/api/moderate/text', {
  onRequest: app.csrfProtection // Middleware CSRF
}, async (request, reply) => {
  // Handler
});
```

#### Côté Frontend

```typescript
// utils/api.ts
let csrfToken: string | null = null;

export const fetchCsrfToken = async () => {
  const res = await fetch('/api/csrf-token', {
    credentials: 'include'
  });
  const { csrfToken: token } = await res.json();
  csrfToken = token;
};

export const apiPost = async (url: string, data: any) => {
  if (!csrfToken) await fetchCsrfToken();

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken!
    },
    credentials: 'include',
    body: JSON.stringify(data)
  });
};
```

---

### 2. Rate Limiting

#### Installation

```bash
pnpm install @fastify/rate-limit
```

#### Configuration Multi-niveaux

```typescript
// config/rate-limits.ts
import type { RateLimitPluginOptions } from '@fastify/rate-limit';

// Limite globale (DDoS protection)
export const globalRateLimit: RateLimitPluginOptions = {
  max: 100,           // 100 requêtes
  timeWindow: 60000,  // par minute
  cache: 10000,       // Cache 10k IPs
  allowList: [
    '127.0.0.1',      // Localhost pour tests
  ],
  redis: process.env.REDIS_URL ? {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  } : undefined,
  keyGenerator: (req) => {
    // Utiliser IP réelle derrière proxy
    return req.headers['x-forwarded-for'] as string || req.ip;
  },
  errorResponseBuilder: (req, context) => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry after ${context.after}`
    };
  }
};

// Limite stricte pour endpoints sensibles
export const strictRateLimit: RateLimitPluginOptions = {
  max: 10,            // 10 requêtes
  timeWindow: 60000,  // par minute
  skipOnError: false
};

// Limite pour modération (éviter spam)
export const moderationRateLimit: RateLimitPluginOptions = {
  max: 20,
  timeWindow: 60000
};
```

#### Application

```typescript
// server.ts
import rateLimit from '@fastify/rate-limit';
import { globalRateLimit, strictRateLimit, moderationRateLimit } from './config/rate-limits';

// Rate limit global
await app.register(rateLimit, globalRateLimit);

// Rate limit spécifique par route
app.post('/api/moderate/text', {
  config: {
    rateLimit: moderationRateLimit
  }
}, async (request, reply) => {
  // Handler
});

app.post('/api/whitelist/check/:address', {
  config: {
    rateLimit: strictRateLimit
  }
}, async (request, reply) => {
  // Handler
});
```

---

### 3. Headers de Sécurité (Helmet)

#### Installation

```bash
pnpm install @fastify/helmet
```

#### Configuration

```typescript
// server.ts
import helmet from '@fastify/helmet';

await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind CSS
      imgSrc: ["'self'", "data:", "https://gateway.pinata.cloud"],
      connectSrc: [
        "'self'",
        "https://testnet.intuition.sh",
        "https://sepolia.basescan.org"
      ],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Nécessaire pour certains wallets
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});
```

---

### 4. CORS Configuration

#### Installation

```bash
pnpm install @fastify/cors
```

#### Configuration Stricte

```typescript
// server.ts
import cors from '@fastify/cors';

await app.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://intuition-founders-totem.vercel.app'] // Votre domaine
    : ['http://localhost:5173'], // Vite dev server
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400 // 24h
});
```

---

### 5. Validation des Inputs (Backend)

#### Schémas Zod Backend

```typescript
// schemas/backend/moderation.schema.ts
import { z } from 'zod';

export const ModerationRequestSchema = z.object({
  text: z.string()
    .min(1, "Le texte est requis")
    .max(1000, "Maximum 1000 caractères")
    .transform((str) => str.trim()),

  type: z.enum(['name', 'description'])
});

export const WhitelistCheckSchema = z.object({
  address: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Adresse Ethereum invalide")
    .transform((addr) => addr.toLowerCase())
});
```

#### Validation dans les Routes

```typescript
// routes/moderation.ts
import { ModerationRequestSchema } from '../schemas/backend/moderation.schema';

app.post('/api/moderate/text', async (request, reply) => {
  try {
    // Validation
    const validated = ModerationRequestSchema.parse(request.body);

    // Traitement
    const result = await moderateText(validated.text, validated.type);

    return reply.code(200).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation Error',
        details: error.errors
      });
    }
    throw error;
  }
});
```

---

### 6. Sanitization Backend

#### DOMPurify côté serveur

```bash
pnpm install isomorphic-dompurify
```

```typescript
// utils/sanitize.server.ts
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeUserInput = (input: string): string => {
  // Supprimer tout HTML
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Aucun tag HTML autorisé
    ALLOWED_ATTR: []
  });
};

// Pour les descriptions avec formatage basique
export const sanitizeDescription = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
};
```

---

## 🔑 Gestion des Secrets et Clés API

### 1. Variables d'Environnement

#### Structure .env

```bash
# .env (NE JAMAIS COMMITER)

# Backend
NODE_ENV=production
PORT=3000
BACKEND_SECRET_KEY=your-secret-key-here-min-32-chars

# Pinata (IPFS)
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key

# Redis (optionnel, pour rate limiting distribué)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Monitoring (optionnel)
SENTRY_DSN=https://...

# CORS
FRONTEND_URL=https://your-frontend-domain.com
```

#### .env.example (À commiter)

```bash
# .env.example
NODE_ENV=development
PORT=3000
BACKEND_SECRET_KEY=generate-with-crypto-randomBytes

PINATA_API_KEY=
PINATA_SECRET_KEY=

REDIS_URL=
REDIS_HOST=localhost
REDIS_PORT=6379

SENTRY_DSN=

FRONTEND_URL=http://localhost:5173
```

#### Validation des Env Variables

```typescript
// config/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.string().transform(Number),
  BACKEND_SECRET_KEY: z.string().min(32),
  PINATA_API_KEY: z.string().min(1),
  PINATA_SECRET_KEY: z.string().min(1),
  REDIS_URL: z.string().optional(),
  FRONTEND_URL: z.string().url()
});

export const validateEnv = () => {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
};

export const env = validateEnv();
```

---

### 2. Rotation des Clés

#### Bonnes Pratiques

- ✅ **Rotation mensuelle** des clés API non critiques
- ✅ **Rotation immédiate** si suspicion de compromission
- ✅ **Logs d'accès** aux secrets (si utilisation d'un vault)
- ✅ **Clés différentes** pour dev/staging/prod

#### Exemple avec Pinata

```typescript
// services/pinata.service.ts
export class PinataService {
  private apiKey: string;
  private secretKey: string;

  constructor() {
    this.apiKey = process.env.PINATA_API_KEY!;
    this.secretKey = process.env.PINATA_SECRET_KEY!;
  }

  // Vérifier la validité des clés au démarrage
  async validateKeys(): Promise<boolean> {
    try {
      const res = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretKey
        }
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
```

---

### 3. Secrets Management (Production)

#### Option 1 : Render Environment Variables

```bash
# Dans Render Dashboard
# Settings → Environment → Add Environment Variable

PINATA_API_KEY=***
PINATA_SECRET_KEY=***
```

#### Option 2 : HashiCorp Vault (Avancé)

```typescript
// Si migration vers solution avancée
import Vault from 'node-vault';

const vault = Vault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

const secrets = await vault.read('secret/data/intuition-founders');
```

---

## 🚨 Logging et Monitoring

### 1. Configuration Pino (Fastify)

```typescript
// config/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  } : undefined,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.apiKey'
    ],
    censor: '***REDACTED***'
  }
});

// server.ts
const app = fastify({
  logger
});
```

### 2. Events de Sécurité à Logger

```typescript
// middleware/security-logger.ts
export const securityLogger = (app: FastifyInstance) => {
  // Rate limit exceeded
  app.addHook('onSend', async (request, reply) => {
    if (reply.statusCode === 429) {
      app.log.warn({
        event: 'rate_limit_exceeded',
        ip: request.ip,
        url: request.url,
        userAgent: request.headers['user-agent']
      });
    }
  });

  // Failed CSRF validation
  app.setErrorHandler((error, request, reply) => {
    if (error.statusCode === 403 && error.message.includes('CSRF')) {
      app.log.error({
        event: 'csrf_validation_failed',
        ip: request.ip,
        url: request.url
      });
    }
  });

  // Suspicious input patterns
  app.addHook('preValidation', async (request) => {
    const body = JSON.stringify(request.body);

    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(body))) {
      app.log.warn({
        event: 'suspicious_input_detected',
        ip: request.ip,
        url: request.url,
        pattern: 'XSS attempt'
      });
    }
  });
};
```

---

### 3. Intégration Sentry (Optionnel)

```bash
pnpm install @sentry/node @sentry/profiling-node
```

```typescript
// config/sentry.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export const initSentry = () => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new ProfilingIntegration()
    ],
    tracesSampleRate: 0.1, // 10% des transactions
    profilesSampleRate: 0.1,
    beforeSend(event, hint) {
      // Filtrer les données sensibles
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    }
  });
};

// server.ts
initSentry();
```

---

## 📋 Checklist de Sécurité

### Frontend

- [ ] ✅ React échappe automatiquement les inputs (par défaut)
- [ ] ✅ DOMPurify installé pour dangerouslySetInnerHTML
- [ ] ✅ Validation URLs avec protocole whitelist
- [ ] ✅ Zod schemas pour tous les formulaires
- [ ] ✅ React Hook Form + zodResolver
- [ ] ✅ CSP configuré via plugin Vite
- [ ] ✅ Pas de manipulation directe du DOM (refs + innerHTML)
- [ ] ✅ Vérification signatures wallet avec viem
- [ ] ✅ Nonce + timestamp pour authentification

### Backend

- [ ] ✅ @fastify/csrf-protection installé et configuré
- [ ] ✅ @fastify/rate-limit avec limites multi-niveaux
- [ ] ✅ @fastify/helmet pour headers de sécurité
- [ ] ✅ @fastify/cors avec origin stricte
- [ ] ✅ Validation Zod sur toutes les routes
- [ ] ✅ Sanitization avec DOMPurify isomorphic
- [ ] ✅ Variables d'environnement validées au démarrage
- [ ] ✅ .env dans .gitignore
- [ ] ✅ .env.example à jour
- [ ] ✅ Logging Pino avec redaction
- [ ] ✅ Events de sécurité loggés
- [ ] ✅ Sentry configuré (production)

### Déploiement

- [ ] ✅ Secrets stockés dans Render Environment Variables
- [ ] ✅ HTTPS obligatoire (Render fournit SSL gratuit)
- [ ] ✅ HSTS headers activés
- [ ] ✅ Rate limiting avec Redis (si multi-instances)
- [ ] ✅ Monitoring actif (logs + alertes)
- [ ] ✅ Plan de rotation des clés documenté

---

## 🎓 Ressources

### Documentation Officielle

- [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
- [React Security Best Practices](https://snyk.io/blog/best-practices-react-typescript-security/)
- [Fastify Security](https://fastify.dev/docs/latest/Guides/Security/)
- [Zod Documentation](https://zod.dev/)
- [DOMPurify](https://github.com/cure53/DOMPurify)

### Plugins Fastify

- [@fastify/csrf-protection](https://github.com/fastify/csrf-protection)
- [@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit)
- [@fastify/helmet](https://github.com/fastify/fastify-helmet)
- [@fastify/cors](https://github.com/fastify/fastify-cors)

### Outils de Sécurité

- [Vite Plugin CSP Guard](https://vite-csp.tsotne.co.uk/)
- [Snyk](https://snyk.io/) - Scan des vulnérabilités npm
- [npm audit](https://docs.npmjs.com/cli/v10/commands/npm-audit) - Audit intégré

---

## 🔄 Maintenance Continue

### Audit Mensuel

```bash
# Vérifier les vulnérabilités des dépendances
pnpm audit

# Mettre à jour les packages avec des failles
pnpm audit fix

# Scanner avec Snyk (optionnel)
npx snyk test
```

### Tests de Sécurité

```bash
# Tester les headers de sécurité
curl -I https://your-api.com/

# Tester rate limiting
ab -n 200 -c 10 https://your-api.com/api/test

# Tester CORS
curl -H "Origin: https://evil.com" https://your-api.com/api/test
```

---

## ✅ Résumé des Décisions

### Protection XSS
✅ **React** - Échappement automatique
✅ **DOMPurify** - Sanitization si HTML nécessaire
✅ **Zod** - Validation stricte des inputs

### Protection CSRF
✅ **@fastify/csrf-protection** - Tokens signés
✅ **Cookies httpOnly + sameSite=strict**

### Rate Limiting
✅ **@fastify/rate-limit** - Multi-niveaux
✅ **100 req/min** global
✅ **10-20 req/min** endpoints sensibles

### Headers de Sécurité
✅ **@fastify/helmet** - Headers automatiques
✅ **CSP** strict via Vite plugin
✅ **HSTS** avec preload

### Gestion des Secrets
✅ **Variables d'environnement**
✅ **Validation Zod au démarrage**
✅ **Render Environment Variables** (production)

### Logging & Monitoring
✅ **Pino** - Logs structurés avec redaction
✅ **Events de sécurité** loggés
✅ **Sentry** - Optionnel pour production

---

**Dernière mise à jour** : 18 novembre 2025
**Validé par** : Recherches OWASP 2025, best practices React/Fastify 2025
**Prochaine étape** : Issue #3 - Modération du Contenu

---

## 📋 Issues GitHub créées à partir de ce fichier

- **Issue #58** : Frontend - Configurer DOMPurify pour sanitization XSS
- **Issue #59** : Frontend - Configurer Content Security Policy (CSP)
- **Issue #60** : Frontend - Implémenter validation Zod pour tous les formulaires
- **Issue #61** : Frontend - Sécuriser authentification wallet (nonce + signature)
- **Issue #62** : Backend - Implémenter protection CSRF
- **Issue #63** : Backend - Implémenter logging sécurité avec Pino
- **Issue #64** : Backend - Configurer gestion des secrets et variables d'environnement

**Total : 7 issues**
**Statut : ⏳ Issues créées (code à développer)**
