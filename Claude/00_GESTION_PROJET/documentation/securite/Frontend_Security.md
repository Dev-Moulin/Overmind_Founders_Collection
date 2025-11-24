# Frontend Security - INTUITION Founders Totem

**Dernière mise à jour** : 21 novembre 2025
**Architecture** : Frontend-only (pas de backend)

---

## Vue d'ensemble

Ce document décrit les mesures de sécurité frontend pour l'application. Le projet utilise une **architecture frontend-only** - toutes les opérations blockchain passent directement par le SDK INTUITION et les smart contracts.

---

## OWASP Top 10:2025 - Pertinence Frontend

| Risque | Pertinence | Mitigation |
|--------|------------|------------|
| **A01** Broken Access Control | ✅ Haute | Vérification NFT on-chain |
| **A02** Security Misconfiguration | ✅ Haute | CSP, CORS headers |
| **A05** Injection (XSS) | ✅ Haute | React escaping, DOMPurify |
| **A07** Identification Failures | ✅ Haute | Wallet signature verification |

---

## 1. Protection XSS (Cross-Site Scripting)

### Protections Natives de React

React échappe automatiquement toutes les valeurs dans les expressions JSX :

```typescript
// ✅ SÉCURISÉ - React échappe automatiquement
const userInput = "<script>alert('XSS')</script>";
return <div>{userInput}</div>;
// Rendu : &lt;script&gt;alert('XSS')&lt;/script&gt;
```

### Cas Dangereux à Éviter

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

### Bibliothèques Recommandées

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

## 2. Content Security Policy (CSP)

### Configuration pour Vite

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
      dev: { run: true },
      policy: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': [
          "'self'",
          'https://api-testnet.intuition.systems',  // GraphQL API
          'https://testnet.rpc.intuition.systems',  // RPC
          'wss://testnet.rpc.intuition.systems',    // WebSocket
          'https://mainnet.base.org'                // Base (NFT check)
        ],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"]
      }
    })
  ]
});
```

---

## 3. Validation des Inputs

### Utilisation de Zod

```typescript
// schemas/totem.schema.ts
import { z } from 'zod';

export const TotemProposalSchema = z.object({
  founderId: z.string().regex(/^0x[a-fA-F0-9]+$/),

  totemName: z.string()
    .min(3, "Minimum 3 caractères")
    .max(50, "Maximum 50 caractères")
    .regex(/^[a-zA-Z0-9\s\-']+$/, "Caractères alphanumériques uniquement"),

  predicate: z.string()
    .min(3, "Minimum 3 caractères")
    .max(100, "Maximum 100 caractères"),

  description: z.string()
    .min(10, "Minimum 10 caractères")
    .max(500, "Maximum 500 caractères")
    .optional()
});

export type TotemProposal = z.infer<typeof TotemProposalSchema>;
```

### Intégration avec React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const ProposalForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<TotemProposal>({
    resolver: zodResolver(TotemProposalSchema)
  });

  const onSubmit = async (data: TotemProposal) => {
    // La validation Zod a déjà été faite
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ... */}
    </form>
  );
};
```

---

## 4. Sécurité Wallet

### Vérification NFT (Whitelist)

```typescript
// hooks/useNFTVerification.ts
import { useReadContract } from 'wagmi';
import { base } from 'wagmi/chains';

const NFT_CONTRACT = '0x...'; // Overmind Founders Collection

export function useNFTVerification(address?: `0x${string}`) {
  const { data: balance } = useReadContract({
    address: NFT_CONTRACT,
    abi: ERC721_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: base.id, // Base Mainnet pour NFT
    enabled: !!address
  });

  return {
    isEligible: balance ? balance > 0n : false,
    isLoading: balance === undefined
  };
}
```

### Validation des Signatures (si nécessaire)

```typescript
import { verifyMessage } from 'viem';

export const verifyWalletSignature = async (
  address: `0x${string}`,
  message: string,
  signature: `0x${string}`
): Promise<boolean> => {
  try {
    return await verifyMessage({ address, message, signature });
  } catch {
    return false;
  }
};
```

---

## 5. Variables d'Environnement

### Configuration sécurisée

```env
# .env.example
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_INTUITION_API_URL=https://api-testnet.intuition.systems/v1/graphql
```

**Règles :**
- ✅ Préfixer avec `VITE_` pour exposer au frontend
- ✅ Ne jamais commiter `.env` (ajouter au `.gitignore`)
- ✅ Utiliser `.env.example` comme template
- ❌ Ne jamais stocker de clés privées côté frontend

---

## 6. Sécurité des Dépendances

### Audit régulier

```bash
# Vérifier les vulnérabilités
pnpm audit

# Mettre à jour les dépendances
pnpm update --latest
```

### Lockfile

Toujours commiter `pnpm-lock.yaml` pour garantir des builds reproductibles.

---

## 7. Bonnes Pratiques

### À faire

- ✅ Utiliser React pour le rendu (échappe automatiquement)
- ✅ Valider tous les inputs avec Zod
- ✅ Vérifier l'éligibilité NFT avant toute action
- ✅ Utiliser HTTPS uniquement
- ✅ Configurer CSP headers
- ✅ Auditer les dépendances régulièrement

### À éviter

- ❌ `dangerouslySetInnerHTML` sans sanitization
- ❌ `eval()` ou `new Function()`
- ❌ Stocker des données sensibles en localStorage
- ❌ Faire confiance aux données utilisateur sans validation
- ❌ Exposer des clés privées ou secrets

---

## 8. Ressources

- **React Security** : https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html
- **OWASP Cheat Sheet** : https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- **Viem Security** : https://viem.sh/docs/actions/public/verifyMessage.html
- **wagmi Docs** : https://wagmi.sh/react/guides/security

---

## Checklist Déploiement

- [ ] CSP headers configurés
- [ ] Variables d'environnement sécurisées
- [ ] Audit dépendances passé
- [ ] HTTPS activé
- [ ] Validation inputs en place
- [ ] Vérification NFT fonctionnelle
