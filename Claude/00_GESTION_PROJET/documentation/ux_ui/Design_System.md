# Design System & UI/UX - INTUITION Founders Totem

## 🎯 Contrainte prioritaire : **GRATUIT !**

Toutes les solutions UI/UX sont **100% gratuites** (open-source).

**Coût total : $0/mois**

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Public cible](#public-cible)
3. [Stack UI/UX](#stack-uiux)
4. [Palette de couleurs](#palette-de-couleurs)
5. [Typographie](#typographie)
6. [Design System](#design-system)
7. [Composants UI](#composants-ui)
8. [Responsive Design](#responsive-design)
9. [Accessibilité (a11y)](#accessibilité-a11y)
10. [Animations & Micro-interactions](#animations--micro-interactions)
11. [Glassmorphism](#glassmorphism)
12. [Loading States](#loading-states)
13. [Structure des pages](#structure-des-pages)
14. [Checklist d'implémentation](#checklist-dimplémentation)

---

## Vue d'ensemble

### Objectif UX

Créer une interface **minimaliste, élégante et immersive** pour permettre à la communauté INTUITION de proposer et voter pour les totems des 42 fondateurs.

### Principes de design

1. **Dark mode uniquement** : Interface sombre avec effet glassmorphism
2. **Web3 aesthetic** : Design moderne, futuriste, crypto-natif
3. **Minimalisme** : Focus sur le contenu, pas de distractions
4. **Accessibilité maximale** : WCAG 2.1 AAA (dans la mesure du possible)
5. **Performance** : Lightweight, optimisé pour mobile et desktop

---

## Public cible

### Qui utilise la plateforme ?

**Communauté INTUITION** (pas seulement les 42 fondateurs) :
- Membres ayant reçu l'airdrop du 5 novembre 2025
- Crypto-natifs et nouveaux venus Web3
- Utilisateurs mobile et desktop (50/50)

### Besoins UX

- ✅ Connexion wallet simple et rapide (RainbowKit)
- ✅ Comprendre le concept des totems sans friction
- ✅ Proposer des totems facilement
- ✅ Voter de manière intuitive
- ✅ Voir les résultats en temps réel
- ✅ Navigation fluide mobile ↔ desktop

---

## Stack UI/UX

### Technologies choisies

| Catégorie | Technologie | Raison | Coût |
|-----------|-------------|--------|------|
| **CSS Framework** | Tailwind CSS v4 | Utility-first, performance, dark mode natif | $0 |
| **Component Library** | shadcn/ui + glasscn-ui | Accessible, customisable, glassmorphism | $0 |
| **Icons** | Lucide React | Open-source, React-optimized, 1000+ icons | $0 |
| **Animations** | Framer Motion + CSS | Performant, déclaratif, flexible | $0 |
| **Fonts** | Inter (Google Fonts) | Moderne, lisible, optimisée écrans | $0 |
| **Toast Notifications** | sonner | Déjà dans le stack (gestion erreurs) | $0 |
| **Dark Mode** | next-themes | Toggle automatique, localStorage | $0 |

**Coût total : $0/mois**

### Installation

```bash
# Tailwind CSS + plugins
pnpm add -D tailwindcss postcss autoprefixer
pnpm add -D @tailwindcss/typography @tailwindcss/forms
pnpm add -D tailwindcss-animate

# shadcn/ui (CLI pour installer composants)
pnpm dlx shadcn-ui@latest init

# glasscn-ui (extension glassmorphism)
pnpm add glasscn-ui

# Icons
pnpm add lucide-react

# Animations
pnpm add framer-motion

# Fonts
# Via Google Fonts CDN ou @fontsource/inter

# Toast notifications (déjà installé)
pnpm add sonner

# Dark mode
pnpm add next-themes
```

---

## Palette de couleurs

### Couleurs INTUITION (extraites du site officiel)

#### Couleurs principales

```css
/* Background */
--background: #0a0a0a;           /* Noir profond */
--background-secondary: #1a1a1a; /* Gris très sombre */

/* Foreground (texte) */
--foreground: #ffffff;           /* Blanc pur */
--foreground-muted: #a9a9a9;     /* Gris clair */
--foreground-subtle: #555555;    /* Gris moyen */

/* Accents */
--accent-white: #ffffff;         /* Blanc avec glow */
--accent-gradient: linear-gradient(
  180deg,
  rgba(255, 255, 255, 0.1) 0%,
  rgba(255, 255, 255, 0) 100%
);

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.1);
--border-gradient: radial-gradient(
  farthest-corner at 60% 0,
  #ddd 30%,
  #858585 55%,
  transparent 75%
);

/* Glass effect */
--glass-bg: rgba(34, 34, 34, 0.8);
--glass-border: rgba(255, 255, 255, 0.1);
```

#### Couleurs sémantiques (Web3 style)

```css
/* Success (green) */
--success: #10b981;        /* Emerald-500 */
--success-muted: #059669;  /* Emerald-600 */

/* Warning (amber) */
--warning: #f59e0b;        /* Amber-500 */
--warning-muted: #d97706;  /* Amber-600 */

/* Error (red) */
--error: #ef4444;          /* Red-500 */
--error-muted: #dc2626;    /* Red-600 */

/* Info (blue) */
--info: #3b82f6;           /* Blue-500 */
--info-muted: #2563eb;     /* Blue-600 */

/* Primary (vous pouvez choisir) */
--primary: #8b5cf6;        /* Violet-500 (Web3 vibe) */
--primary-muted: #7c3aed;  /* Violet-600 */
```

### Configuration Tailwind

```js
// tailwind.config.js
export default {
  darkMode: ['class'], // Dark mode uniquement
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0a0a0a',
          secondary: '#1a1a1a',
        },
        foreground: {
          DEFAULT: '#ffffff',
          muted: '#a9a9a9',
          subtle: '#555555',
        },
        accent: {
          white: '#ffffff',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.1)',
        },
        glass: {
          bg: 'rgba(34, 34, 34, 0.8)',
          border: 'rgba(255, 255, 255, 0.1)',
        },
        success: {
          DEFAULT: '#10b981',
          muted: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          muted: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',
          muted: '#dc2626',
        },
        info: {
          DEFAULT: '#3b82f6',
          muted: '#2563eb',
        },
        primary: {
          DEFAULT: '#8b5cf6',
          muted: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};
```

---

## Typographie

### Police principale : Inter

**Pourquoi Inter ?**
- ✅ Conçue pour les interfaces digitales
- ✅ Lisibilité optimale sur écrans
- ✅ Support complet des caractères
- ✅ Gratuite (Google Fonts ou @fontsource)
- ✅ Variable font (ajustement fin du poids)

### Hiérarchie typographique

```css
/* Headings */
h1: 3rem (48px)    - font-bold - line-height: 1.2
h2: 2.25rem (36px) - font-bold - line-height: 1.3
h3: 1.875rem (30px) - font-semibold - line-height: 1.4
h4: 1.5rem (24px)  - font-semibold - line-height: 1.5
h5: 1.25rem (20px) - font-medium - line-height: 1.5
h6: 1rem (16px)    - font-medium - line-height: 1.5

/* Body */
body: 1rem (16px)     - font-normal - line-height: 1.6
small: 0.875rem (14px) - font-normal - line-height: 1.6
xs: 0.75rem (12px)    - font-normal - line-height: 1.5
```

### Classes Tailwind

```tsx
// Headings
<h1 className="text-5xl font-bold leading-tight">
<h2 className="text-4xl font-bold leading-tight">
<h3 className="text-3xl font-semibold">
<h4 className="text-2xl font-semibold">

// Body
<p className="text-base leading-relaxed">
<small className="text-sm text-foreground-muted">
<span className="text-xs text-foreground-subtle">
```

---

## Design System

### Espacement

Suivre l'échelle Tailwind (4px base) :

```css
0   → 0px
1   → 4px
2   → 8px
3   → 12px
4   → 16px
6   → 24px
8   → 32px
12  → 48px
16  → 64px
20  → 80px
24  → 96px
```

### Breakpoints (Mobile-first)

```css
sm:  640px   /* Small devices (landscape phones) */
md:  768px   /* Medium devices (tablets) */
lg:  1024px  /* Large devices (laptops/desktops) */
xl:  1280px  /* Extra large devices (large desktops) */
2xl: 1536px  /* 2X large devices (ultra-wide) */
```

### Border Radius

```css
rounded-none:   0px
rounded-sm:     2px
rounded:        4px
rounded-md:     6px
rounded-lg:     8px
rounded-xl:     12px
rounded-2xl:    16px
rounded-3xl:    24px
rounded-full:   9999px
```

### Shadows

```css
/* Subtle shadows pour glassmorphism */
shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.05)
shadow:      0 1px 3px rgba(0, 0, 0, 0.1)
shadow-md:   0 4px 6px rgba(0, 0, 0, 0.1)
shadow-lg:   0 10px 15px rgba(0, 0, 0, 0.1)
shadow-xl:   0 20px 25px rgba(0, 0, 0, 0.1)

/* Glow effects (custom) */
shadow-glow:     0 0 4px rgba(255, 255, 255, 0.3)
shadow-glow-lg:  0 0 20px rgba(255, 255, 255, 0.2)
```

Configuration Tailwind :

```js
// tailwind.config.js
theme: {
  extend: {
    boxShadow: {
      'glow': '0 0 4px rgba(255, 255, 255, 0.3)',
      'glow-lg': '0 0 20px rgba(255, 255, 255, 0.2)',
    },
  },
}
```

---

## Composants UI

### shadcn/ui - Composants de base

Installer via CLI (choisir dark mode) :

```bash
pnpm dlx shadcn-ui@latest init
```

Configuration :

```
✔ Would you like to use TypeScript? … yes
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Slate
✔ Where is your global CSS file? … src/index.css
✔ Would you like to use CSS variables for colors? … yes
✔ Where is your tailwind.config.js located? … tailwind.config.js
✔ Configure the import alias for components: … @/components
✔ Configure the import alias for utils: … @/lib/utils
✔ Are you using React Server Components? … no
```

### Composants nécessaires

```bash
# Installer les composants shadcn/ui nécessaires
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add card
pnpm dlx shadcn-ui@latest add input
pnpm dlx shadcn-ui@latest add textarea
pnpm dlx shadcn-ui@latest add select
pnpm dlx shadcn-ui@latest add dialog
pnpm dlx shadcn-ui@latest add dropdown-menu
pnpm dlx shadcn-ui@latest add tooltip
pnpm dlx shadcn-ui@latest add badge
pnpm dlx shadcn-ui@latest add avatar
pnpm dlx shadcn-ui@latest add tabs
pnpm dlx shadcn-ui@latest add skeleton
pnpm dlx shadcn-ui@latest add progress
pnpm dlx shadcn-ui@latest add separator
```

### glasscn-ui - Extension glassmorphism

Pour ajouter l'effet glassmorphism aux composants shadcn/ui :

```bash
pnpm add glasscn-ui
```

Exemple d'utilisation :

```tsx
import { GlassCard } from 'glasscn-ui';

<GlassCard
  blur="md"           // sm, md, lg, xl
  opacity={80}        // 0-100
  className="p-6"
>
  <h2>Contenu glassmorphic</h2>
</GlassCard>
```

### Composants custom

Créer des composants personnalisés pour :

#### 1. GlassCard (carte glassmorphic)

```tsx
// src/components/ui/glass-card.tsx
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: 'sm' | 'md' | 'lg' | 'xl';
}

export function GlassCard({
  className,
  blur = 'md',
  children,
  ...props
}: GlassCardProps) {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-glass-border bg-glass-bg',
        blurClasses[blur],
        'shadow-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

#### 2. FounderCard (carte fondateur)

```tsx
// src/components/founder-card.tsx
import { GlassCard } from '@/components/ui/glass-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface FounderCardProps {
  id: string;
  name: string;
  avatar?: string;
  proposalCount: number;
  onClick?: () => void;
}

export function FounderCard({
  name,
  avatar,
  proposalCount,
  onClick
}: FounderCardProps) {
  return (
    <GlassCard
      className="p-6 cursor-pointer hover:shadow-glow-lg transition-all"
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-4">
        <Avatar className="w-20 h-20">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
        </Avatar>

        <h3 className="text-lg font-semibold text-center">{name}</h3>

        <Badge variant="secondary">
          {proposalCount} proposition{proposalCount > 1 ? 's' : ''}
        </Badge>
      </div>
    </GlassCard>
  );
}
```

#### 3. TotemCard (carte totem)

```tsx
// src/components/totem-card.tsx
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

interface TotemCardProps {
  type: 'objet' | 'animal' | 'trait' | 'univers';
  name: string;
  description: string;
  votes: number;
  onVote?: () => void;
}

const typeIcons = {
  objet: '🎯',
  animal: '🦁',
  trait: '⭐',
  univers: '🌌',
};

export function TotemCard({
  type,
  name,
  description,
  votes,
  onVote
}: TotemCardProps) {
  return (
    <GlassCard className="p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{typeIcons[type]}</span>
          <div>
            <h3 className="text-xl font-semibold">{name}</h3>
            <Badge variant="outline" className="mt-1">
              {type}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1 text-foreground-muted">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm">{votes}</span>
        </div>
      </div>

      <p className="text-sm text-foreground-muted leading-relaxed">
        {description}
      </p>

      <Button
        onClick={onVote}
        className="w-full"
        variant="default"
      >
        Voter avec $TRUST
      </Button>
    </GlassCard>
  );
}
```

---

## Responsive Design

### Approche Mobile-First

Concevoir d'abord pour mobile, puis adapter pour desktop.

```tsx
// Mobile par défaut, desktop avec breakpoints
<div className="
  flex flex-col gap-4      /* Mobile: stack vertical */
  md:flex-row md:gap-6     /* Tablet+: horizontal */
  lg:gap-8                 /* Desktop: plus d'espace */
">
```

### Grilles responsive

#### Liste des fondateurs (42 cartes)

```tsx
<div className="
  grid grid-cols-1          /* Mobile: 1 colonne */
  sm:grid-cols-2            /* Small: 2 colonnes */
  md:grid-cols-3            /* Tablet: 3 colonnes */
  lg:grid-cols-4            /* Desktop: 4 colonnes */
  xl:grid-cols-6            /* Large: 6 colonnes */
  gap-4 md:gap-6
">
  {founders.map(founder => (
    <FounderCard key={founder.id} {...founder} />
  ))}
</div>
```

#### Liste des totems (propositions)

```tsx
<div className="
  grid grid-cols-1          /* Mobile: 1 colonne */
  md:grid-cols-2            /* Tablet: 2 colonnes */
  lg:grid-cols-3            /* Desktop: 3 colonnes */
  gap-6
">
  {totems.map(totem => (
    <TotemCard key={totem.id} {...totem} />
  ))}
</div>
```

### Navigation responsive

```tsx
// Header avec burger menu mobile
<header className="
  sticky top-0 z-50
  backdrop-blur-lg bg-background/80
  border-b border-border-subtle
">
  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      {/* Logo */}
      <Logo />

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-6">
        <NavLink href="/propose">Proposer</NavLink>
        <NavLink href="/vote">Voter</NavLink>
        <NavLink href="/results">Résultats</NavLink>
      </nav>

      {/* Mobile burger */}
      <button className="md:hidden">
        <Menu className="w-6 h-6" />
      </button>

      {/* Connect wallet (toujours visible) */}
      <ConnectButton />
    </div>
  </div>
</header>
```

---

## Accessibilité (a11y)

### Objectif : WCAG 2.1 AAA

Niveau AAA = accessibilité maximale (au-delà du standard AA).

### Contraste des couleurs

#### WCAG requirements

| Niveau | Texte normal | Texte large |
|--------|--------------|-------------|
| AA     | 4.5:1        | 3:1         |
| AAA    | 7:1          | 4.5:1       |

#### Vérification des contrastes

Utiliser des outils gratuits :
- https://webaim.org/resources/contrastchecker/
- https://www.inclusivecolors.com/ (spécial Tailwind)

#### Contrastes garantis

```css
/* Texte blanc sur fond noir : 21:1 (parfait AAA) */
color: #ffffff on background: #0a0a0a

/* Texte gris clair sur fond noir : 10.7:1 (AAA) */
color: #a9a9a9 on background: #0a0a0a

/* Éviter texte gris moyen (#555) en petite taille */
/* Utiliser pour texte large uniquement */
```

### Glassmorphism et accessibilité

**⚠️ Attention** : Le glassmorphism réduit le contraste.

**Solutions** :

1. **Utiliser glassmorphism uniquement pour les containers** (pas pour le texte)
2. **Assurer un fond suffisamment opaque** derrière le texte
3. **Ajouter backdrop-blur pour améliorer la lisibilité**

```tsx
// ❌ Mauvais : texte sur fond glassmorphic sans arrière-plan
<GlassCard className="bg-glass-bg">
  <p className="text-foreground-muted">Texte difficile à lire</p>
</GlassCard>

// ✅ Bon : texte sur fond plus opaque
<GlassCard className="bg-background-secondary/90 backdrop-blur-lg">
  <p className="text-foreground">Texte lisible</p>
</GlassCard>
```

### Navigation au clavier

Tous les éléments interactifs doivent être accessibles au clavier.

```tsx
// Focus visible sur tous les éléments
<Button className="
  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-primary
  focus-visible:ring-offset-2
  focus-visible:ring-offset-background
">
  Voter
</Button>
```

### ARIA labels

```tsx
// Button avec icon uniquement
<button aria-label="Fermer le menu">
  <X className="w-5 h-5" />
</button>

// Input avec label visible
<label htmlFor="totem-name" className="text-sm font-medium">
  Nom du totem
</label>
<input
  id="totem-name"
  aria-required="true"
  aria-describedby="totem-name-help"
/>
<small id="totem-name-help" className="text-foreground-subtle">
  Maximum 50 caractères
</small>
```

### Sémantique HTML

```tsx
// ✅ Utiliser les bons éléments HTML
<header>
<nav>
<main>
<article>
<section>
<footer>

// ✅ Headings hiérarchiques
<h1>Titre principal</h1>
  <h2>Section</h2>
    <h3>Sous-section</h3>
```

### Screen readers

```tsx
// Cacher visuellement mais garder pour screen readers
<span className="sr-only">Nombre de votes :</span>
<span aria-hidden="true">🔥</span>
<span>1,234</span>

// Skip to main content
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Aller au contenu principal
</a>

<main id="main-content">
  {/* Contenu */}
</main>
```

---

## Animations & Micro-interactions

### Framer Motion

Installer :

```bash
pnpm add framer-motion
```

### Animations subtiles (minimalisme)

#### 1. Fade in on mount

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>
```

#### 2. Slide up on mount

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  {children}
</motion.div>
```

#### 3. Stagger children (liste)

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.div
  variants={container}
  initial="hidden"
  animate="show"
  className="grid grid-cols-1 md:grid-cols-3 gap-6"
>
  {items.map(item => (
    <motion.div key={item.id} variants={item}>
      <Card {...item} />
    </motion.div>
  ))}
</motion.div>
```

#### 4. Hover scale (cards)

```tsx
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 300 }}
>
  <GlassCard>{children}</GlassCard>
</motion.div>
```

#### 5. Button pulse (CTA)

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="..."
>
  Voter maintenant
</motion.button>
```

### CSS animations (lightweight)

Pour les animations simples, préférer CSS :

```css
/* Glow on hover */
.card-glow {
  transition: box-shadow 0.3s ease;
}

.card-glow:hover {
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
}

/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.3s ease-in;
}
```

### Reduced motion (a11y)

Respecter les préférences utilisateur :

```tsx
import { useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();

<motion.div
  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
  animate={{ opacity: 1, y: 0 }}
>
  {children}
</motion.div>
```

---

## Glassmorphism

### Qu'est-ce que le glassmorphism ?

Effet de "verre givré" avec :
- ✅ Fond translucide (opacity)
- ✅ Flou en arrière-plan (backdrop-filter: blur)
- ✅ Bordure subtile semi-transparente
- ✅ Légers reflets de lumière

### Implémentation Tailwind

```tsx
// Classe custom dans tailwind.config.js
// (ou utiliser glasscn-ui)

<div className="
  bg-glass-bg                    /* rgba(34, 34, 34, 0.8) */
  backdrop-blur-md               /* Flou */
  border border-glass-border     /* Border subtile */
  rounded-xl                     /* Coins arrondis */
  shadow-glow                    /* Léger glow */
">
  {children}
</div>
```

### Niveaux de blur

```tsx
backdrop-blur-none   /* 0px */
backdrop-blur-sm     /* 4px */
backdrop-blur        /* 8px (default) */
backdrop-blur-md     /* 12px (recommended) */
backdrop-blur-lg     /* 16px */
backdrop-blur-xl     /* 24px */
backdrop-blur-2xl    /* 40px */
backdrop-blur-3xl    /* 64px */
```

### Exemples d'usage

#### Card glassmorphic

```tsx
<div className="
  relative overflow-hidden
  bg-glass-bg backdrop-blur-md
  border border-glass-border
  rounded-2xl
  p-6
  shadow-glow
  hover:shadow-glow-lg
  transition-shadow duration-300
">
  <h3 className="text-xl font-semibold mb-2">Titre</h3>
  <p className="text-foreground-muted">Description</p>
</div>
```

#### Navigation glassmorphic

```tsx
<header className="
  sticky top-0 z-50
  bg-background/60          /* Semi-transparent */
  backdrop-blur-lg          /* Flou fort */
  border-b border-glass-border
">
  <nav className="container mx-auto px-4 py-4">
    {/* Nav items */}
  </nav>
</header>
```

#### Modal glassmorphic

```tsx
<Dialog>
  <DialogContent className="
    bg-background-secondary/95
    backdrop-blur-xl
    border-2 border-glass-border
    shadow-glow-lg
  ">
    {children}
  </DialogContent>
</Dialog>
```

### Optimisation performance

**⚠️ Attention** : `backdrop-blur` est gourmand en GPU.

**Solutions** :

1. **Limiter le nombre d'éléments glassmorphic** (max 5-10 par page)
2. **Éviter backdrop-blur sur éléments animés**
3. **Utiliser will-change pour optimiser** :

```css
.glass-card {
  will-change: transform;
}
```

4. **Désactiver blur sur mobile si nécessaire** :

```tsx
<div className="
  backdrop-blur-none        /* Mobile */
  md:backdrop-blur-md       /* Desktop */
">
```

---

## Loading States

### Skeleton screens

Utiliser le composant `Skeleton` de shadcn/ui :

```bash
pnpm dlx shadcn-ui@latest add skeleton
```

#### Skeleton pour FounderCard

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function FounderCardSkeleton() {
  return (
    <GlassCard className="p-6">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="w-20 h-20 rounded-full" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    </GlassCard>
  );
}
```

#### Skeleton pour TotemCard

```tsx
export function TotemCardSkeleton() {
  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-6 w-12" />
      </div>

      <Skeleton className="h-16 w-full mb-4" />
      <Skeleton className="h-10 w-full rounded" />
    </GlassCard>
  );
}
```

#### Skeleton pour liste

```tsx
export function FoundersListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <FounderCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### Spinners

Pour les actions rapides (votes, soumissions) :

```tsx
import { Loader2 } from 'lucide-react';

<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Chargement...
    </>
  ) : (
    'Voter'
  )}
</Button>
```

### Progress bars

Pour les transactions blockchain :

```tsx
import { Progress } from '@/components/ui/progress';

<div className="space-y-2">
  <p className="text-sm text-foreground-muted">
    Transaction en cours...
  </p>
  <Progress value={progress} className="w-full" />
  <p className="text-xs text-foreground-subtle">
    {progress}% complété
  </p>
</div>
```

---

## Structure des pages

### 1. Page d'accueil (Landing)

```
┌─────────────────────────────────────┐
│ Header (glassmorphic, sticky)       │
├─────────────────────────────────────┤
│                                     │
│  Hero Section                       │
│  - Titre : "Founders Totem"         │
│  - Sous-titre : pitch                │
│  - CTA : "Connect Wallet"           │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Comment ça marche                  │
│  - 3 étapes (proposer, voter, NFT)  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Les 42 fondateurs                  │
│  - Grille de 42 avatars (aperçu)    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Stats en temps réel                │
│  - Total propositions               │
│  - Total votes                      │
│                                     │
├─────────────────────────────────────┤
│ Footer                              │
└─────────────────────────────────────┘
```

### 2. Page Proposer

```
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│                                     │
│  Titre : "Proposer un totem"        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Grille des 42 fondateurs      │  │
│  │ (FounderCard cliquable)       │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [Modal : Formulaire proposition]   │
│  - Type totem (radio)               │
│  - Nom (input)                      │
│  - Description (textarea)           │
│  - Bouton "Créer Atom + Triple"     │
│                                     │
└─────────────────────────────────────┘
```

### 3. Page Voter

```
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│                                     │
│  Titre : "Voter pour les totems"    │
│                                     │
│  Filtres :                          │
│  - Par fondateur (select)           │
│  - Par type (tabs)                  │
│  - Trier par (votes, récent)        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Liste des TotemCard           │  │
│  │ (avec bouton "Voter")         │  │
│  └───────────────────────────────┘  │
│                                     │
│  Pagination                         │
│                                     │
└─────────────────────────────────────┘
```

### 4. Page Résultats

```
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│                                     │
│  Titre : "Résultats en temps réel"  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Grille 42 fondateurs          │  │
│  │                               │  │
│  │ Chaque carte montre :         │  │
│  │ - Avatar fondateur            │  │
│  │ - Top 3 totems (podium)       │  │
│  │ - Votes pour chaque totem     │  │
│  └───────────────────────────────┘  │
│                                     │
│  [Clic → Modal détails fondateur]   │
│                                     │
└─────────────────────────────────────┘
```

---

## Checklist d'implémentation

### Phase 1 : Setup de base

- [ ] ✅ Installer Tailwind CSS + plugins
- [ ] ✅ Configurer tailwind.config.js (couleurs, fonts, shadows)
- [ ] ✅ Installer shadcn/ui (CLI init)
- [ ] ✅ Installer composants shadcn/ui nécessaires
- [ ] ✅ Installer glasscn-ui (ou créer composant GlassCard custom)
- [ ] ✅ Installer Lucide React (icons)
- [ ] ✅ Installer Framer Motion
- [ ] ✅ Installer next-themes (dark mode)
- [ ] ✅ Configurer Inter font (Google Fonts ou @fontsource)

### Phase 2 : Design System

- [ ] ✅ Créer palette de couleurs (CSS variables)
- [ ] ✅ Définir hiérarchie typographique
- [ ] ✅ Créer composants de base (GlassCard, Button variants)
- [ ] ✅ Configurer espacement et breakpoints
- [ ] ✅ Tester contrastes (WCAG AAA)

### Phase 3 : Composants métier

- [ ] ✅ Créer FounderCard
- [ ] ✅ Créer TotemCard
- [ ] ✅ Créer Header/Navigation
- [ ] ✅ Créer Footer
- [ ] ✅ Créer Modal proposition
- [ ] ✅ Créer Skeleton screens

### Phase 4 : Pages

- [ ] ✅ Créer layout principal
- [ ] ✅ Page Landing
- [ ] ✅ Page Proposer
- [ ] ✅ Page Voter
- [ ] ✅ Page Résultats

### Phase 5 : Responsive

- [ ] ✅ Tester mobile (320px-768px)
- [ ] ✅ Tester tablet (768px-1024px)
- [ ] ✅ Tester desktop (1024px+)
- [ ] ✅ Burger menu mobile

### Phase 6 : Accessibilité

- [ ] ✅ Vérifier navigation clavier (Tab, Enter, Esc)
- [ ] ✅ Ajouter focus-visible sur tous les éléments interactifs
- [ ] ✅ Ajouter ARIA labels
- [ ] ✅ Tester avec screen reader (NVDA, JAWS, VoiceOver)
- [ ] ✅ Respecter reduced motion preference

### Phase 7 : Animations

- [ ] ✅ Fade in on mount (pages)
- [ ] ✅ Stagger children (listes)
- [ ] ✅ Hover effects (cards, buttons)
- [ ] ✅ Loading states (spinners, skeletons, progress)

### Phase 8 : Optimisation

- [ ] ✅ Limiter nombre d'éléments glassmorphic
- [ ] ✅ Optimiser images (lazy loading, WebP)
- [ ] ✅ Code splitting (React.lazy)
- [ ] ✅ Lighthouse audit (Performance, Accessibility, Best Practices)

---

## Ressources

### Documentation

- **Tailwind CSS** : https://tailwindcss.com/docs
- **shadcn/ui** : https://ui.shadcn.com/
- **glasscn-ui** : https://itsjavi.com/projects/glasscn-ui/
- **Framer Motion** : https://www.framer.com/motion/
- **Lucide Icons** : https://lucide.dev/
- **WCAG 2.1** : https://www.w3.org/WAI/WCAG21/quickref/

### Outils

- **Contrast Checker** : https://webaim.org/resources/contrastchecker/
- **Inclusive Colors** : https://www.inclusivecolors.com/
- **Can I Use** : https://caniuse.com/ (support backdrop-blur)

### Inspiration

- **INTUITION Hub** : https://testnet.hub.intuition.systems/
- **Web3 UI Examples** : https://web3ui.design/

---

## Coût total : $0/mois ✅

Toutes les solutions sont **gratuites** et **open-source**.

---

## Prochaines étapes

1. ✅ Valider cette documentation
2. ⏳ Créer PR pour validation
3. ⏳ Implémenter le design system
4. ⏳ Créer les composants UI
5. ⏳ Builder les pages
6. ⏳ Tests accessibilité
7. ⏳ Tests responsive
8. ⏳ Deploy preview sur Vercel

