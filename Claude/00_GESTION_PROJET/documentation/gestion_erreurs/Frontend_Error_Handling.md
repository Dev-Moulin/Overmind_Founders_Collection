# Frontend Error Handling - INTUITION Founders Totem

**Derniere mise a jour** : 21 novembre 2025
**Architecture** : Frontend-only (pas de backend)

---

## Vue d'ensemble

Gestion des erreurs 100% frontend pour l'application. Toutes les operations passent directement par le SDK INTUITION et GraphQL.

**Stack** :
- `react-error-boundary` - Error boundaries React
- `sonner` - Toast notifications
- Retry logic custom pour appels API/SDK

**Cout total : $0/mois**

---

## 1. Error Boundaries React

### Installation

```bash
pnpm add react-error-boundary
```

### Composant ErrorBoundary

```tsx
// src/components/ErrorBoundary.tsx
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-background-secondary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-center mb-2">
          Oups, quelque chose s'est mal passe
        </h2>

        <p className="text-sm text-center text-foreground-muted mb-6">
          Une erreur inattendue s'est produite. Veuillez reessayer.
        </p>

        {import.meta.env.DEV && (
          <details className="mb-4 p-3 bg-glass-bg rounded text-xs">
            <summary className="cursor-pointer font-medium">Details de l'erreur</summary>
            <pre className="mt-2 overflow-auto">{error.message}</pre>
          </details>
        )}

        <div className="flex gap-3">
          <button
            onClick={resetErrorBoundary}
            className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary-muted transition"
          >
            Reessayer
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 px-4 py-2 bg-glass-bg rounded hover:bg-background-secondary transition"
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

### Usage dans l'app

```tsx
// src/App.tsx
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

## 2. Hook useAsyncError

```tsx
// src/hooks/useAsyncError.ts
import { useState, useCallback } from 'react';

interface AsyncError {
  message: string;
  code?: string;
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
        code: err.code
      };

      setError(asyncError);
      options?.onError?.(asyncError);
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

---

## 3. Toast avec Sonner

### Configuration

```tsx
// src/App.tsx
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={5000}
        theme="dark"
      />
      {/* App */}
    </>
  );
}
```

### Usage

```tsx
import { toast } from 'sonner';

// Succes
toast.success('Totem cree avec succes !');

// Erreur
toast.error('Echec de la creation du totem');

// Warning
toast.warning('Transaction en attente...');

// Info
toast.info('Connexion a votre wallet...');

// Promise (pour operations async)
toast.promise(
  createTotem(data),
  {
    loading: 'Creation en cours...',
    success: 'Totem cree !',
    error: 'Echec de la creation'
  }
);
```

---

## 4. Messages utilisateur clairs

### Helper getErrorMessage

```typescript
// src/utils/errorMessages.ts
export function getErrorMessage(error: any): string {
  // Erreurs blockchain
  if (error.name === 'UserRejectedRequestError') {
    return 'Transaction annulee';
  }

  if (error.message?.includes('insufficient funds')) {
    return 'Fonds insuffisants';
  }

  if (error.message?.includes('gas')) {
    return 'Gas insuffisant. Verifiez votre balance ETH.';
  }

  // Erreurs GraphQL
  if (error.message?.includes('GraphQL')) {
    return 'Erreur de chargement des donnees. Veuillez reessayer.';
  }

  // Erreurs reseau
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'Probleme de connexion. Verifiez votre internet.';
  }

  // Erreur generique
  return error.message || 'Une erreur est survenue';
}
```

### Mapping erreurs

| Code technique | Message utilisateur |
|----------------|---------------------|
| `UserRejectedRequestError` | "Transaction annulee" |
| `insufficient funds` | "Fonds insuffisants" |
| `gas` | "Gas insuffisant. Verifiez votre balance ETH." |
| Network error | "Probleme de connexion. Verifiez votre internet." |
| GraphQL error | "Erreur de chargement des donnees. Veuillez reessayer." |

---

## 5. Retry Strategy

### Exponential Backoff

```typescript
// src/utils/retry.ts
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

      if (!shouldRetry(error) || attempt === maxRetries) {
        throw error;
      }

      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 1000;
      const delay = exponentialDelay + jitter;

      onRetry?.(attempt + 1);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

### Usage pour GraphQL/SDK

```typescript
// src/hooks/useGraphQLQuery.ts
import { retryWithBackoff } from '@/utils/retry';

export async function fetchGraphQLWithRetry(query: string, variables: any) {
  return retryWithBackoff(
    () => fetchGraphQL(query, variables),
    {
      maxRetries: 3,
      baseDelay: 1000,
      shouldRetry: (error) => {
        // Retry sur erreurs reseau uniquement
        return error.message?.includes('network') ||
               error.message?.includes('fetch');
      },
      onRetry: (attempt) => {
        console.log(`Retry attempt ${attempt} for GraphQL query`);
      }
    }
  );
}
```

---

## 6. Erreurs specifiques Web3/INTUITION

### Erreurs wallet

```typescript
// src/utils/walletErrors.ts
export function getWalletErrorMessage(error: any): string {
  // User rejected
  if (error.code === 4001 || error.name === 'UserRejectedRequestError') {
    return 'Transaction annulee par l\'utilisateur';
  }

  // Chain non supportee
  if (error.code === 4902) {
    return 'Reseau non configure. Ajoutez INTUITION L3 Testnet a votre wallet.';
  }

  // Wallet locked
  if (error.code === -32002) {
    return 'Wallet verrouille. Deverrouillez votre wallet.';
  }

  // Not connected
  if (error.message?.includes('not connected')) {
    return 'Wallet non connecte. Veuillez vous connecter.';
  }

  return 'Erreur wallet. Veuillez reessayer.';
}
```

### Erreurs INTUITION SDK

```typescript
// src/utils/intuitionErrors.ts
export function getIntuitionErrorMessage(error: any): string {
  // Atom already exists
  if (error.message?.includes('already exists')) {
    return 'Cet atom existe deja.';
  }

  // Triple already exists
  if (error.message?.includes('triple')) {
    return 'Cette proposition existe deja.';
  }

  // Insufficient stake
  if (error.message?.includes('stake') || error.message?.includes('deposit')) {
    return 'Montant de stake insuffisant.';
  }

  return 'Erreur INTUITION. Veuillez reessayer.';
}
```

---

## 7. Logging Frontend

### Logger simple

```typescript
// src/utils/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  info: (message: string, data?: any) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, data || '');
    }
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },

  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  },

  debug: (message: string, data?: any) => {
    if (isDev) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
};
```

---

## Checklist Implementation

### Configuration
- [ ] `react-error-boundary` installe
- [ ] `sonner` installe et configure
- [ ] Retry logic implemente

### Composants
- [ ] Error boundary racine
- [ ] Error boundaries par section
- [ ] Hook `useAsyncError`
- [ ] Toasts avec Sonner

### Helpers
- [ ] `getErrorMessage` pour erreurs generiques
- [ ] `getWalletErrorMessage` pour erreurs wallet
- [ ] `getIntuitionErrorMessage` pour erreurs SDK
- [ ] Logger frontend

### Tests
- [ ] Error boundaries testes
- [ ] Retry logic teste
- [ ] Messages d'erreur verifies

---

## Ressources

- [react-error-boundary](https://www.npmjs.com/package/react-error-boundary)
- [sonner](https://sonner.emilkowal.ski/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
