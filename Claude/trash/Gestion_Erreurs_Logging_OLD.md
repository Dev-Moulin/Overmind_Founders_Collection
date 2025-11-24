# ⚠️ Gestion des Erreurs et Logging - INTUITION Founders Totem

**Date de création** : 18 novembre 2025
**Dernière mise à jour** : 18 novembre 2025
**Statut** : ✅ Complet

---

## 📋 Table des matières

1. [Introduction](#-introduction)
2. [Stratégie 100% gratuite](#-stratégie-100-gratuite)
3. [Error Boundaries React](#-error-boundaries-react)
4. [Gestion erreurs asynchrones](#-gestion-erreurs-asynchrones)
5. [Error Handler Backend](#-error-handler-backend)
6. [Logging avec Pino](#-logging-avec-pino)
7. [Messages utilisateur](#-messages-utilisateur)
8. [Retry Strategy](#-retry-strategy)
9. [Monitoring gratuit](#-monitoring-gratuit)
10. [Plan d'implémentation](#-plan-dimplémentation)

---

## 🎯 Introduction

Une gestion robuste des erreurs et un système de logging efficace sont essentiels pour :

- **Expérience utilisateur** : Messages clairs, pas de crash
- **Débogage** : Logs structurés pour identifier les problèmes
- **Résilience** : Retry automatique pour pannes temporaires
- **Amélioration** : Apprendre des erreurs pour améliorer l'app

### 🎯 Contrainte prioritaire : **GRATUIT !**

Comme pour le backend, on privilégie une approche **100% gratuite** pour démarrer :

- ✅ **Pas de service payant** (Sentry, Datadog, etc.)
- ✅ **Open-source uniquement**
- ✅ **Console + Pino** pour le logging
- ✅ **React Error Boundary** pour le frontend
- ✅ **Migration facile** vers solutions payantes si besoin

---

## 💰 Stratégie 100% gratuite

### Stack recommandée

| Composant | Solution | Coût | Notes |
|-----------|----------|------|-------|
| **Error Boundaries** | react-error-boundary | $0 | Open-source |
| **Toast notifications** | sonner | $0 | Open-source, léger |
| **Logging Backend** | Pino | $0 | Fastest logger Node.js |
| **Pretty print dev** | pino-pretty | $0 | Dev only |
| **Error tracking** | Console + fichiers | $0 | Logs dans stdout/files |
| **Monitoring** | Render Logs | $0 | Inclus dans Render Free |
| **Retry logic** | Custom implementation | $0 | 50 lignes de code |

**Total : $0/mois** ✅

---

### Migration future (optionnel)

Si le projet grandit, on pourra migrer vers :
- **Sentry** : $29/mois (monitoring avancé, alertes, session replays)
- **Datadog** : $15/mois par host (logs centralisés, APM)
- **BetterStack** : $10/mois (logs + monitoring)

Mais pour le MVP : **$0/mois** !

---

## 🎨 Error Boundaries React

### 1. Installation

```bash
pnpm add react-error-boundary
```

### 2. Composant ErrorBoundary

```tsx
// frontend/src/components/ErrorBoundary.tsx
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">
          Oups, quelque chose s'est mal passé
        </h2>

        <p className="text-sm text-center text-gray-600 mb-6">
          Une erreur inattendue s'est produite. Veuillez réessayer.
        </p>

        {import.meta.env.DEV && (
          <details className="mb-4 p-3 bg-gray-100 rounded text-xs">
            <summary className="cursor-pointer font-medium">Détails de l'erreur</summary>
            <pre className="mt-2 overflow-auto">{error.message}</pre>
          </details>
        )}

        <div className="flex gap-3">
          <button
            onClick={resetErrorBoundary}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Réessayer
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Accueil
          </button>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log en console (gratuit)
        console.error('Error caught by boundary:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
```

### 3. Usage dans l'app

```tsx
// frontend/src/App.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Error boundary par section */}
        <Route path="/propose" element={
          <ErrorBoundary>
            <ProposePage />
          </ErrorBoundary>
        } />

        <Route path="/vote" element={
          <ErrorBoundary>
            <VotePage />
          </ErrorBoundary>
        } />
      </Routes>
    </ErrorBoundary>
  );
}
```

---

## 🔄 Gestion erreurs asynchrones

### Hook personnalisé

```tsx
// frontend/src/hooks/useAsyncError.ts
import { useState, useCallback } from 'react';

interface AsyncError {
  message: string;
  code?: string;
  statusCode?: number;
}

export function useAsyncError() {
  const [error, setError] = useState<AsyncError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: AsyncError) => void;
    }
  ): Promise<T | null> => {
    setError(null);
    setIsLoading(true);

    try {
      const data = await asyncFunction();
      options?.onSuccess?.(data);
      return data;
    } catch (err: any) {
      const asyncError: AsyncError = {
        message: err.message || 'Une erreur est survenue',
        code: err.code,
        statusCode: err.response?.status
      };

      setError(asyncError);
      options?.onError?.(asyncError);

      // Log en console
      console.error('Async error:', asyncError);

      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { error, isLoading, execute, clearError };
}
```

### Usage

```tsx
// frontend/src/components/TotemForm.tsx
import { useAsyncError } from '@/hooks/useAsyncError';
import { toast } from 'sonner';

function TotemForm() {
  const { error, isLoading, execute } = useAsyncError();

  const handleSubmit = async (data: TotemData) => {
    await execute(
      () => createTotem(data),
      {
        onSuccess: () => toast.success('Totem créé !'),
        onError: (err) => toast.error(getErrorMessage(err))
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Fields */}
      <button disabled={isLoading}>
        {isLoading ? 'Création...' : 'Créer'}
      </button>
    </form>
  );
}
```

---

## 🔧 Error Handler Backend

### 1. Classes d'erreurs

```typescript
// backend/src/errors/AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}
```

### 2. Error Handler Fastify

```typescript
// backend/src/plugins/errorHandler.ts
import { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '@/errors/AppError';

export async function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | AppError, request: FastifyRequest, reply: FastifyReply) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Log l'erreur avec Pino
    request.log.error({
      err: error,
      req: {
        method: request.method,
        url: request.url,
        params: request.params,
        query: request.query
      }
    }, 'Request error');

    // AppError (erreurs opérationnelles)
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode
        }
      });
    }

    // Erreurs de validation
    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          statusCode: 400,
          details: error.validation
        }
      });
    }

    // Erreur 500 générique
    const statusCode = error.statusCode || 500;
    const message = isProduction && statusCode === 500
      ? 'Internal server error'
      : error.message;

    return reply.status(statusCode).send({
      error: {
        code: 'INTERNAL_ERROR',
        message,
        statusCode,
        ...(isProduction ? {} : { stack: error.stack })
      }
    });
  });
}
```

### 3. Usage dans les routes

```typescript
// backend/src/routes/totem.ts
import { FastifyPluginAsync } from 'fastify';
import { ValidationError, NotFoundError, ForbiddenError } from '@/errors/AppError';

export const totemRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/totem', async (request, reply) => {
    const { totemName, founderId } = request.body;

    // Validation
    if (!totemName || totemName.length < 3) {
      throw new ValidationError('Totem name must be at least 3 characters');
    }

    // Vérifier que le founder existe
    const founder = await db.founder.findById(founderId);
    if (!founder) {
      throw new NotFoundError('Founder');
    }

    // Vérifier autorisation
    if (!request.user.isWhitelisted) {
      throw new ForbiddenError('Your wallet is not whitelisted');
    }

    const totem = await createTotem({ totemName, founderId });
    return reply.status(201).send({ totem });
  });
};
```

---

## 📊 Logging avec Pino

### 1. Installation

```bash
pnpm add pino pino-pretty
```

### 2. Configuration

```typescript
// backend/src/config/logger.ts
import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const pinoConfig = {
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),

  // Pretty print en dev, JSON en prod
  transport: isDev ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  } : undefined,

  // Masquer les données sensibles
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.apiKey'
    ],
    remove: true
  },

  // Serializers
  serializers: {
    req: (req: any) => ({
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      ip: req.ip
    }),
    res: (res: any) => ({
      statusCode: res.statusCode
    }),
    err: pino.stdSerializers.err
  }
};
```

### 3. Usage avec Fastify

```typescript
// backend/src/server.ts
import fastify from 'fastify';
import { pinoConfig } from '@/config/logger';

const app = fastify({
  logger: pinoConfig
});

// Les logs sont automatiques pour chaque requête
```

### 4. Logging structuré

```typescript
// backend/src/routes/totem.ts
fastify.post('/api/totem', async (request, reply) => {
  const { totemName, founderId, userId } = request.body;

  // Log structuré
  request.log.info({
    event: 'totem_creation_started',
    userId,
    founderId,
    totemName
  }, 'User creating totem');

  try {
    const totem = await createTotem({ totemName, founderId });

    request.log.info({
      event: 'totem_created',
      totemId: totem.id,
      userId
    }, 'Totem created successfully');

    return reply.status(201).send({ totem });
  } catch (error) {
    request.log.error({
      event: 'totem_creation_failed',
      err: error,
      userId,
      founderId
    }, 'Failed to create totem');

    throw error;
  }
});
```

### 5. Child loggers

```typescript
// backend/src/services/totem.service.ts
import { FastifyBaseLogger } from 'fastify';

export class TotemService {
  private logger: FastifyBaseLogger;

  constructor(logger: FastifyBaseLogger) {
    // Child logger avec contexte
    this.logger = logger.child({ service: 'TotemService' });
  }

  async createTotem(data: TotemData) {
    this.logger.info({ data }, 'Creating totem');

    try {
      const totem = await this.repository.create(data);
      this.logger.info({ totemId: totem.id }, 'Totem created');
      return totem;
    } catch (error) {
      this.logger.error({ err: error, data }, 'Failed to create totem');
      throw error;
    }
  }
}
```

---

## 💬 Messages utilisateur

### 1. Toast avec Sonner (gratuit)

**Installation** :

```bash
pnpm add sonner
```

**Configuration** :

```tsx
// frontend/src/App.tsx
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={5000}
      />
      {/* App */}
    </>
  );
}
```

**Usage** :

```tsx
import { toast } from 'sonner';

// Succès
toast.success('Totem créé avec succès !');

// Erreur
toast.error('Échec de la création du totem');

// Warning
toast.warning('Transaction en attente...');

// Info
toast.info('Connexion à votre wallet...');

// Promise
toast.promise(
  createTotem(data),
  {
    loading: 'Création en cours...',
    success: 'Totem créé !',
    error: 'Échec de la création'
  }
);
```

### 2. Messages clairs

| ❌ Mauvais | ✅ Bon |
|-----------|--------|
| "Unauthorized" | "Veuillez connecter votre wallet" |
| "Forbidden" | "Votre wallet n'est pas autorisé" |
| "Not found" | "Le totem n'existe pas" |
| "Validation failed" | "Le nom doit contenir 3-50 caractères" |
| "Internal error" | "Une erreur est survenue. Veuillez réessayer." |
| "Network error" | "Problème de connexion. Vérifiez votre internet." |

### 3. Helper pour messages

```typescript
// frontend/src/utils/errorMessages.ts
export function getErrorMessage(error: any): string {
  const statusCode = error?.statusCode || error?.response?.status;

  // Erreurs HTTP
  if (statusCode) {
    switch (statusCode) {
      case 400:
      case 422:
        return error.message || 'Données invalides';
      case 401:
        return 'Veuillez connecter votre wallet';
      case 403:
        return 'Vous n\'êtes pas autorisé';
      case 404:
        return 'Ressource introuvable';
      case 429:
        return 'Trop de requêtes. Patientez quelques instants.';
      case 500:
      case 502:
      case 503:
        return 'Erreur serveur. Veuillez réessayer.';
      default:
        return error.message || 'Une erreur est survenue';
    }
  }

  // Erreurs blockchain
  if (error.name === 'UserRejectedRequestError') {
    return 'Transaction annulée';
  }

  if (error.message?.includes('insufficient funds')) {
    return 'Fonds insuffisants';
  }

  if (error.message?.includes('gas')) {
    return 'Gas insuffisant. Vérifiez votre balance ETH.';
  }

  // Erreur générique
  return error.message || 'Une erreur est survenue';
}
```

---

## 🔄 Retry Strategy

### Exponential Backoff (gratuit)

```typescript
// shared/utils/retry.ts
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number) => void;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 32000,
    shouldRetry = () => true,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Vérifier si retryable
      if (!shouldRetry(error) || attempt === maxRetries) {
        throw error;
      }

      // Calculer délai avec jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 1000;
      const delay = exponentialDelay + jitter;

      onRetry?.(attempt + 1);

      // Attendre
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

### Usage pour API calls

```typescript
// frontend/src/utils/api.ts
import { retryWithBackoff } from '@shared/utils/retry';

export async function fetchWithRetry(url: string, options?: RequestInit) {
  return retryWithBackoff(
    () => fetch(url, options).then(async (res) => {
      if (!res.ok) {
        const error: any = new Error(`HTTP ${res.status}`);
        error.statusCode = res.status;
        throw error;
      }
      return res.json();
    }),
    {
      maxRetries: 3,
      baseDelay: 1000,
      shouldRetry: (error) => {
        const code = error?.statusCode;
        // Retry uniquement sur 5xx et timeouts
        return !code || code >= 500 || error.message.includes('timeout');
      },
      onRetry: (attempt) => {
        console.log(`Retry attempt ${attempt} for ${url}`);
      }
    }
  );
}
```

---

## 📊 Monitoring gratuit

### 1. Logs Render (inclus gratuit)

Render Free Tier inclut les logs :
- **7 jours de rétention**
- **Accès CLI** : `render logs <service-id>`
- **Dashboard web** : Voir les logs en temps réel

### 2. Console structuré

```typescript
// frontend/src/utils/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  info: (message: string, data?: any) => {
    if (isDev) {
      console.log(`ℹ️ ${message}`, data || '');
    }
  },

  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error || '');
  },

  warn: (message: string, data?: any) => {
    console.warn(`⚠️ ${message}`, data || '');
  },

  debug: (message: string, data?: any) => {
    if (isDev) {
      console.debug(`🐛 ${message}`, data || '');
    }
  }
};
```

### 3. Logs dans fichiers (Backend)

```typescript
// backend/src/config/logger.ts
import pino from 'pino';
import path from 'path';

export const pinoConfig = {
  level: 'info',

  // Écrire dans stdout (capturé par Render)
  // OU dans un fichier en local
  ...(process.env.LOG_FILE ? {
    transport: {
      targets: [
        {
          target: 'pino/file',
          options: { destination: path.join(process.cwd(), 'logs', 'app.log') }
        },
        {
          target: 'pino-pretty',
          options: { colorize: true }
        }
      ]
    }
  } : {})
};
```

### 4. Health check endpoint

```typescript
// backend/src/routes/health.ts
export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  });
};
```

### 5. Monitoring externe gratuit

**UptimeRobot** (gratuit) :
- 50 monitors gratuits
- Checks toutes les 5 minutes
- Alertes email

**Configuration** :
1. Créer compte sur [uptimerobot.com](https://uptimerobot.com)
2. Ajouter monitor HTTP(s)
3. URL : `https://votre-api.render.com/health`
4. Intervalle : 5 minutes
5. Alertes email si down

---

## 📋 Plan d'implémentation

### Phase 1 : MVP Gratuit (1 semaine)

**Objectif** : Gestion d'erreurs basique + logging fonctionnel

✅ **Frontend**
- [ ] Installer `react-error-boundary`
- [ ] Créer composant ErrorBoundary
- [ ] Hook `useAsyncError`
- [ ] Installer `sonner` pour toasts
- [ ] Helper `getErrorMessage`

✅ **Backend**
- [ ] Installer `pino` + `pino-pretty`
- [ ] Classes d'erreurs (`AppError`, etc.)
- [ ] Error handler centralisé Fastify
- [ ] Logs structurés dans routes
- [ ] Endpoint `/health`

✅ **Retry & Resilience**
- [ ] Fonction `retryWithBackoff`
- [ ] Wrapper `fetchWithRetry`
- [ ] Retry pour transactions blockchain

✅ **Tests**
- [ ] Tester error boundaries
- [ ] Tester error handler
- [ ] Vérifier logs dev et prod

**Coût : $0/mois** ✅

---

### Phase 2 : Production (optionnel, si besoin)

**Objectif** : Monitoring avancé

🔄 **Monitoring Sentry** (si budget)
- [ ] Compte Sentry Free (5k erreurs/mois)
- [ ] Setup frontend (`@sentry/react`)
- [ ] Setup backend (`@sentry/node`)
- [ ] Alertes email

🔄 **Logs centralisés** (si scale)
- [ ] BetterStack Free (1GB/mois)
- [ ] OU Datadog Free (500MB/jour)

**Coût : $0-29/mois** (si upgrade Sentry Team)

---

## 🎯 Checklist finale

### Configuration
- [ ] `react-error-boundary` installé
- [ ] `pino` + `pino-pretty` installés
- [ ] `sonner` installé
- [ ] Retry logic implémenté

### Frontend
- [ ] Error boundary racine
- [ ] Error boundaries par section
- [ ] Hook `useAsyncError`
- [ ] Toasts avec Sonner
- [ ] Messages clairs pour utilisateurs

### Backend
- [ ] Classes d'erreurs personnalisées
- [ ] Error handler Fastify
- [ ] Logs Pino structurés
- [ ] Redaction données sensibles
- [ ] Endpoint `/health`

### Monitoring
- [ ] Logs accessibles dans Render
- [ ] UptimeRobot configuré (gratuit)
- [ ] Alertes email si down

### Tests
- [ ] Error boundaries testés
- [ ] Retry logic testé
- [ ] Messages d'erreur vérifiés
- [ ] Logs en dev et prod

---

## 💰 Récapitulatif des coûts

| Service | Phase 1 (MVP) | Phase 2 (optionnel) |
|---------|---------------|---------------------|
| **react-error-boundary** | $0 | $0 |
| **Pino** | $0 | $0 |
| **sonner** | $0 | $0 |
| **Render Logs** | $0 (inclus) | $0 (inclus) |
| **UptimeRobot** | $0 (50 monitors) | $0 |
| **Sentry** | N/A | $0 (Free) ou $29/mois |
| **Total** | **$0/mois** ✅ | **$0-29/mois** |

---

## 📝 Ressources

### Packages
- [react-error-boundary](https://www.npmjs.com/package/react-error-boundary)
- [pino](https://www.npmjs.com/package/pino)
- [pino-pretty](https://www.npmjs.com/package/pino-pretty)
- [sonner](https://www.npmjs.com/package/sonner)

### Documentation
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Fastify Error Handling](https://fastify.dev/docs/latest/Reference/Errors/)
- [Pino Documentation](https://getpino.io/)

### Services gratuits
- [UptimeRobot](https://uptimerobot.com) - Monitoring gratuit
- [Render Logs](https://render.com) - Inclus dans Free tier
- [Sentry Free](https://sentry.io/pricing/) - 5k erreurs/mois

---

## 🏁 Conclusion

### Stack recommandée : 100% GRATUITE

**Phase 1 (MVP)** :
- ✅ `react-error-boundary` pour error boundaries
- ✅ `sonner` pour toasts utilisateur
- ✅ `pino` pour logging backend
- ✅ Render Logs pour monitoring
- ✅ UptimeRobot pour health checks
- ✅ **Coût : $0/mois**

**Phase 2 (si besoin)** :
- 🔄 Sentry Free (5k erreurs/mois) ou Team ($29/mois)
- 🔄 **Coût : $0-29/mois**

### Prochaines étapes

1. ✅ Implémenter Phase 1 (gratuit)
2. ⏳ Tester en dev et staging
3. ⏳ Monitorer avec Render + UptimeRobot
4. ⏳ Décider si upgrade vers Sentry si besoin

---

**Dernière mise à jour** : 18 novembre 2025
**Auteur** : Documentation Master - INTUITION Founders Totem
**Statut** : ✅ Complet
