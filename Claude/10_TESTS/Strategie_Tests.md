# 🧪 Stratégie de Tests - INTUITION Founders Totem

**Date de création** : 18 novembre 2025
**Dernière mise à jour** : 18 novembre 2025
**Statut** : ✅ Complet

---

## 📋 Table des matières

1. [Introduction](#-introduction)
2. [Stratégie 100% gratuite](#-stratégie-100-gratuite)
3. [Tests unitaires](#-tests-unitaires)
4. [Tests d'intégration](#-tests-dintégration)
5. [Tests E2E](#-tests-e2e)
6. [Tests blockchain/Web3](#-tests-blockchainweb3)
7. [Coverage et qualité](#-coverage-et-qualité)
8. [CI/CD Integration](#-cicd-integration)
9. [Plan d'implémentation](#-plan-dimplémentation)

---

## 🎯 Introduction

Une stratégie de tests complète est essentielle pour :

- **Confiance** : Déployer sans stress en production
- **Qualité** : Détecter les bugs avant qu'ils atteignent les users
- **Documentation** : Les tests servent de doc vivante
- **Refactoring** : Modifier le code en toute sécurité
- **Régressions** : Éviter de recasser ce qui marchait

### 🎯 Contrainte prioritaire : **GRATUIT !**

Comme tout le projet, on utilise une stack de tests **100% gratuite** :

- ✅ **Vitest** (gratuit, open-source, 10-20x plus rapide que Jest)
- ✅ **React Testing Library** (gratuit, best practices)
- ✅ **Playwright** (gratuit, cross-browser E2E)
- ✅ **Anvil** (gratuit, blockchain locale)
- ✅ **GitHub Actions** (gratuit pour repos publics)

---

## 💰 Stratégie 100% gratuite

### Stack recommandée

| Type de test | Framework | Coût | Notes |
|--------------|-----------|------|-------|
| **Tests unitaires** | Vitest | $0 | 10-20x plus rapide que Jest |
| **Tests composants** | React Testing Library | $0 | Best practices officielles |
| **Tests E2E** | Playwright | $0 | Cross-browser, parallélisation native |
| **Mock blockchain** | Anvil (Foundry) | $0 | Blockchain locale pour tests |
| **Coverage** | Vitest coverage (c8) | $0 | Inclus dans Vitest |
| **CI/CD** | GitHub Actions | $0 | Illimité pour repos publics |

**Total : $0/mois** ✅

---

## 🧪 Tests unitaires

### Vitest vs Jest (2025)

| Critère | Vitest | Jest | Gagnant |
|---------|--------|------|---------|
| **Performance** | 10-20x plus rapide | Standard | ✅ Vitest |
| **Setup Vite** | Zero config | Configuration complexe | ✅ Vitest |
| **TypeScript** | Native support | Besoin ts-jest | ✅ Vitest |
| **ESM** | Native support | Problématique | ✅ Vitest |
| **Watch mode** | HMR instantané | Standard | ✅ Vitest |
| **UI** | Browser UI intégré | Aucun | ✅ Vitest |
| **Écosystème** | Croissant | Mature | = |

**Verdict : Vitest** ✅ (parfait pour Vite + React)

---

### Installation Vitest

```bash
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom
```

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment
    environment: 'jsdom', // ou 'happy-dom' (plus rapide)

    // Setup files
    setupFiles: ['./src/test/setup.ts'],

    // Globals (pour éviter imports partout)
    globals: true,

    // Coverage
    coverage: {
      provider: 'v8', // ou 'istanbul'
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**'
      ]
    },

    // UI
    ui: true,

    // Include/exclude
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### Setup file

```typescript
// src/test/setup.ts
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest matchers
expect.extend(matchers);

// Cleanup après chaque test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});
```

---

### Tests unitaires : Fonctions utilitaires

```typescript
// src/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatWalletAddress, formatTokenAmount } from './format';

describe('formatWalletAddress', () => {
  it('should format full address to shortened version', () => {
    const address = '0x1234567890123456789012345678901234567890';
    expect(formatWalletAddress(address)).toBe('0x1234...7890');
  });

  it('should handle short addresses', () => {
    const address = '0x123';
    expect(formatWalletAddress(address)).toBe('0x123');
  });

  it('should return empty string for null', () => {
    expect(formatWalletAddress(null)).toBe('');
  });
});

describe('formatTokenAmount', () => {
  it('should format large numbers with K/M suffix', () => {
    expect(formatTokenAmount(1500)).toBe('1.5K');
    expect(formatTokenAmount(1500000)).toBe('1.5M');
  });

  it('should handle decimals', () => {
    expect(formatTokenAmount(1234.56)).toBe('1.23K');
  });
});
```

---

## 🎨 Tests d'intégration

### React Testing Library

**Philosophie** :
> "The more your tests resemble the way your software is used, the more confidence they can give you."

**Principes** :
- ✅ Tester du point de vue utilisateur
- ✅ Utiliser `screen` object
- ✅ Préférer `userEvent` à `fireEvent`
- ✅ Utiliser matchers spécifiques (`toBeDisabled()` vs `.disabled.toBe(true)`)
- ❌ Ne pas tester les détails d'implémentation

---

### Test d'un composant simple

```typescript
// src/components/TotemCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { TotemCard } from './TotemCard';

describe('TotemCard', () => {
  const mockTotem = {
    id: '1',
    name: 'Phoenix',
    type: 'Animal',
    votes: 42,
    imageUrl: 'https://example.com/phoenix.jpg'
  };

  it('should render totem information', () => {
    render(<TotemCard totem={mockTotem} />);

    expect(screen.getByText('Phoenix')).toBeInTheDocument();
    expect(screen.getByText('Animal')).toBeInTheDocument();
    expect(screen.getByText('42 votes')).toBeInTheDocument();
  });

  it('should call onVote when vote button is clicked', async () => {
    const user = userEvent.setup();
    const onVote = vi.fn();

    render(<TotemCard totem={mockTotem} onVote={onVote} />);

    const voteButton = screen.getByRole('button', { name: /vote/i });
    await user.click(voteButton);

    expect(onVote).toHaveBeenCalledWith(mockTotem.id);
  });

  it('should disable vote button when loading', () => {
    render(<TotemCard totem={mockTotem} isLoading />);

    const voteButton = screen.getByRole('button', { name: /vote/i });
    expect(voteButton).toBeDisabled();
  });
});
```

---

### Test avec Context/Providers

```typescript
// src/test/utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';

// Config wagmi pour tests
const testConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http()
  }
});

// QueryClient pour tests (pas de retry)
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      }
    }
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <WagmiProvider config={testConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Wrapper custom render
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

**Usage** :

```typescript
// src/components/TotemList.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@/test/utils'; // Custom render
import { TotemList } from './TotemList';

describe('TotemList', () => {
  it('should fetch and display totems', async () => {
    render(<TotemList founderId="1" />);

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data
    await waitFor(() => {
      expect(screen.getByText('Phoenix')).toBeInTheDocument();
    });

    // Check totem count
    const totemCards = screen.getAllByTestId('totem-card');
    expect(totemCards).toHaveLength(3);
  });
});
```

---

### Mock des API calls

```typescript
// src/api/totem.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchTotems, createTotem } from './totem';

// Mock fetch global
global.fetch = vi.fn();

describe('Totem API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchTotems', () => {
    it('should fetch totems successfully', async () => {
      const mockTotems = [
        { id: '1', name: 'Phoenix' },
        { id: '2', name: 'Dragon' }
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTotems })
      });

      const result = await fetchTotems('founder-1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/totems'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockTotems);
    });

    it('should handle API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(fetchTotems('founder-1')).rejects.toThrow();
    });
  });
});
```

---

## 🌐 Tests E2E

### Playwright vs Cypress (2025)

| Critère | Playwright | Cypress | Gagnant |
|---------|-----------|---------|---------|
| **Cross-browser** | Chrome, Firefox, Safari | Chrome, Firefox (pas Safari) | ✅ Playwright |
| **Performance** | 35-45% plus rapide en parallel | Sériel par défaut | ✅ Playwright |
| **Parallelization** | Native, gratuite | Payante (Dashboard) | ✅ Playwright |
| **Multi-langages** | JS, TS, Python, C#, Java | JS, TS uniquement | ✅ Playwright |
| **DX** | Excellent | Excellent (meilleur debugging) | = |
| **Setup** | Simple | Très simple | 🟡 Cypress |
| **Multi-tab** | Natif | Limité | ✅ Playwright |

**Verdict : Playwright** ✅ (meilleure couverture cross-browser, gratuit)

---

### Installation Playwright

```bash
pnpm add -D @playwright/test
pnpm exec playwright install # Install browsers
```

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Timeout
  timeout: 30000,

  // Retry
  retries: process.env.CI ? 2 : 0,

  // Workers (parallel)
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],

  // Base URL
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  // Projects (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    // Mobile
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],

  // Dev server
  webServer: {
    command: 'pnpm dev',
    port: 5173,
    reuseExistingServer: !process.env.CI
  }
});
```

---

### Test E2E basique

```typescript
// e2e/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display founders list', async ({ page }) => {
    await page.goto('/');

    // Wait for page load
    await expect(page.getByRole('heading', { name: /founders/i })).toBeVisible();

    // Check founders cards
    const founderCards = page.getByTestId('founder-card');
    await expect(founderCards).toHaveCount(42);
  });

  test('should navigate to founder detail', async ({ page }) => {
    await page.goto('/');

    // Click first founder
    await page.getByTestId('founder-card').first().click();

    // Check navigation
    await expect(page).toHaveURL(/\/founder\/\d+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
```

---

### Test E2E avec wallet

```typescript
// e2e/wallet-connection.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Wallet Connection', () => {
  test('should connect wallet', async ({ page }) => {
    await page.goto('/');

    // Click connect button
    await page.getByRole('button', { name: /connect wallet/i }).click();

    // Select wallet (RainbowKit modal)
    await page.getByText(/metamask/i).click();

    // Check connected state
    await expect(page.getByTestId('wallet-address')).toBeVisible();
    await expect(page.getByTestId('wallet-address')).toContainText(/0x/);
  });

  test('should create totem proposal when connected', async ({ page, context }) => {
    // Setup: Connect wallet first (via browser storage injection)
    await context.addInitScript(() => {
      localStorage.setItem('wagmi.wallet', 'metamask');
      localStorage.setItem('wagmi.connected', 'true');
    });

    await page.goto('/propose');

    // Fill form
    await page.getByLabel(/totem name/i).fill('Phoenix');
    await page.getByLabel(/description/i).fill('A mythical bird that rises from ashes');
    await page.getByRole('button', { name: /submit/i }).click();

    // Check success
    await expect(page.getByText(/proposal created/i)).toBeVisible();
  });
});
```

---

## 🔗 Tests blockchain/Web3

### Mock wagmi avec Anvil

**Anvil** : Blockchain Ethereum locale pour tests (Foundry)

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Start Anvil
anvil
```

### Configuration test avec Mock Connector

```typescript
// src/test/wagmi.ts
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';

export const testConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    mock({
      accounts: [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Anvil account #0
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'  // Anvil account #1
      ]
    })
  ],
  transports: {
    [mainnet.id]: http('http://127.0.0.1:8545'), // Anvil local
    [sepolia.id]: http('http://127.0.0.1:8545')
  }
});
```

### Test avec blockchain mock

```typescript
// src/components/VoteButton.test.tsx
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { userEvent } from '@testing-library/user-event';
import { VoteButton } from './VoteButton';
import { spawn, ChildProcess } from 'child_process';

describe('VoteButton (with Anvil)', () => {
  let anvilProcess: ChildProcess;

  beforeAll(async () => {
    // Start Anvil before tests
    anvilProcess = spawn('anvil', ['--port', '8545']);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for Anvil to start
  });

  afterAll(() => {
    // Stop Anvil after tests
    anvilProcess.kill();
  });

  it('should vote on blockchain', async () => {
    const user = userEvent.setup();

    render(<VoteButton totemId="1" amount="100" />);

    const voteButton = screen.getByRole('button', { name: /vote/i });
    await user.click(voteButton);

    // Wait for transaction
    await waitFor(
      () => {
        expect(screen.getByText(/transaction confirmed/i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });
});
```

---

## 📊 Coverage et qualité

### Configuration coverage

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],

      // Thresholds
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,

      // Exclude
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'src/main.tsx'
      ]
    }
  }
});
```

### Commandes

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### Voir le coverage

```bash
# Run tests avec coverage
pnpm test:coverage

# Ouvrir rapport HTML
open coverage/index.html
```

---

## ⚙️ CI/CD Integration

### GitHub Actions workflow

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
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

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test:run

      - name: Generate coverage
        run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info

  e2e-tests:
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

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 📋 Plan d'implémentation

### Phase 1 : Setup de base (1-2 jours)

**Tests unitaires** :
- [ ] Installer Vitest + React Testing Library
- [ ] Configurer `vitest.config.ts`
- [ ] Créer `setup.ts` file
- [ ] Écrire premiers tests utilitaires
- [ ] Custom render avec providers

**Tests composants** :
- [ ] Tester composants simples (Button, Card)
- [ ] Tester composants avec state
- [ ] Tester formulaires
- [ ] Mock API calls

---

### Phase 2 : Tests E2E (2-3 jours)

**Playwright** :
- [ ] Installer Playwright
- [ ] Configurer `playwright.config.ts`
- [ ] Test navigation homepage
- [ ] Test wallet connection
- [ ] Test création totem

**Coverage** :
- [ ] Configurer coverage thresholds
- [ ] Générer rapport HTML
- [ ] Intégrer Codecov (gratuit pour open-source)

---

### Phase 3 : Web3 Tests (2-3 jours)

**Blockchain tests** :
- [ ] Installer Anvil (Foundry)
- [ ] Configurer Mock Connector
- [ ] Test vote transaction
- [ ] Test création Atom/Triple
- [ ] Test erreurs blockchain

---

### Phase 4 : CI/CD (1 jour)

**GitHub Actions** :
- [ ] Workflow tests unitaires
- [ ] Workflow tests E2E
- [ ] Upload coverage Codecov
- [ ] Badge dans README

---

## 🎯 Checklist finale

### Configuration
- [ ] Vitest installé et configuré
- [ ] React Testing Library installé
- [ ] Playwright installé
- [ ] Anvil (Foundry) installé
- [ ] Scripts npm configurés

### Tests unitaires
- [ ] Fonctions utilitaires testées
- [ ] Composants simples testés
- [ ] Composants avec state testés
- [ ] Hooks testés
- [ ] API calls mockés

### Tests E2E
- [ ] Navigation testée
- [ ] Wallet connection testée
- [ ] Création totem testée
- [ ] Vote testé
- [ ] Cross-browser (Chrome, Firefox, Safari)

### Tests Web3
- [ ] Mock Connector configuré
- [ ] Anvil local configuré
- [ ] Transactions testées
- [ ] Erreurs blockchain testées

### CI/CD
- [ ] Workflow GitHub Actions créé
- [ ] Tests run sur PR
- [ ] Coverage uploadé Codecov
- [ ] Badge dans README

### Coverage
- [ ] Minimum 80% statements
- [ ] Minimum 75% branches
- [ ] Minimum 80% functions
- [ ] Minimum 80% lines

---

## 💰 Récapitulatif des coûts

| Service | Coût | Notes |
|---------|------|-------|
| **Vitest** | $0 | Open-source |
| **React Testing Library** | $0 | Open-source |
| **Playwright** | $0 | Open-source |
| **Anvil (Foundry)** | $0 | Open-source |
| **GitHub Actions** | $0 | Illimité repos publics |
| **Codecov** | $0 | Gratuit open-source |
| **Total** | **$0/mois** | ✅ |

---

## 📝 Ressources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Foundry/Anvil](https://book.getfoundry.sh/anvil/)
- [wagmi Testing](https://wagmi.sh/react/guides/testing)

### Best practices
- [Common mistakes with RTL](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

## 🏁 Conclusion

### Stack recommandée : 100% GRATUITE

**Tests unitaires** :
- ✅ Vitest (10-20x plus rapide que Jest)
- ✅ React Testing Library (best practices)
- ✅ Zero config avec Vite

**Tests E2E** :
- ✅ Playwright (cross-browser, parallélisation native)
- ✅ Safari support (vs Cypress)
- ✅ 35-45% plus rapide en parallel

**Tests Web3** :
- ✅ Mock Connector (wagmi)
- ✅ Anvil blockchain locale (Foundry)
- ✅ Tests réalistes sans coût gas

**CI/CD** :
- ✅ GitHub Actions (illimité repos publics)
- ✅ Codecov (gratuit open-source)

**Coût total : $0/mois** ✅

### Objectifs coverage

- ✅ Minimum 80% statements
- ✅ Minimum 75% branches
- ✅ Minimum 80% functions
- ✅ Minimum 80% lines

### Prochaines étapes

1. ✅ Setup Vitest + RTL
2. ⏳ Écrire tests unitaires composants
3. ⏳ Setup Playwright E2E
4. ⏳ Intégrer Anvil pour Web3 tests
5. ⏳ CI/CD GitHub Actions

---

**Dernière mise à jour** : 18 novembre 2025
**Auteur** : Documentation Master - INTUITION Founders Totem
**Statut** : ✅ Complet
