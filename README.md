# INTUITION Founders Collection 👁️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with INTUITION](https://img.shields.io/badge/Built%20with-INTUITION-purple)](https://www.intuition.systems/)
[![Deployed on INTUITION](https://img.shields.io/badge/Deployed%20on-INTUITION%20L3-blue)](https://www.intuition.systems/)

[Version Francaise ci-dessous](#-version-francaise)

> A collaborative collection where the INTUITION community votes to assign totemic symbols to the protocol's 42 founders. The winning totems will be transformed into 3D NFT artworks by the Overmind.

**The Overmind listens and observes.**
**Let each spirit reveal its symbol.** 👁️

---

## Features

- **Decentralized Voting** - Vote using $TRUST tokens on the INTUITION Protocol
- **3D Interactive Carousel** - Navigate founders through an immersive 3D carousel
- **Alphabet Dock A-Z** - macOS-style dock with magnification effect for quick founder search
- **Community Proposals** - Anyone can propose totems (objects, animals, traits, energies)
- **Multi-Founder Batch Voting** - Add multiple totem votes to a cart and execute in a single batch
- **Real-time Trading Charts** - Live voting activity visualization per founder
- **Fuzzy Search** - Smart category and totem duplicate detection when creating proposals
- **IPFS Image Upload** - Attach images to totems and categories via Pinata
- **Bilingual (EN/FR)** - Full internationalization with dynamic language switching
- **Airdrop Gated** - Only wallets holding the INTUITION airdrop NFT can participate
- **Fully On-chain** - All data stored on INTUITION L3 via the INTUITION Protocol

---

## How It Works

### 1. Connect Wallet

Connect using RainbowKit. Only wallets that hold the INTUITION airdrop NFT (November 5, 2025) can participate.

<video src="assets/videos/connection-deconnection.mp4" controls width="100%"></video>

### 2. Browse Founders

Explore the 42 founders through the 3D carousel or use the alphabet dock for instant navigation.

<video src="assets/videos/carousel.mp4" controls width="100%"></video>

<video src="assets/videos/dock-alphabet.mp4" controls width="100%"></video>

### 3. Select and Vote

Pick a founder, choose a totem, select your voting direction (Support or Oppose) and curve (Linear or Progressive), then add to your cart.

<video src="assets/videos/selection-ajout-panier.mp4" controls width="100%"></video>

### 4. Multi-Founder Batch

Stack votes for multiple founders in a single cart and validate them all in one batch transaction.

<video src="assets/videos/multi-fondeur-validation.mp4" controls width="100%"></video>

### 5. Results

The totem with the most $TRUST in its vault wins for each founder. $TRUST is recoverable thanks to bonding curve mechanics.

---

## Tech Stack

### Frontend
- **React** + **Vite** + **TypeScript**
- **wagmi v2** + **viem** - Ethereum interaction
- **RainbowKit** - Wallet connection UI
- **Apollo Client** - GraphQL queries and subscriptions
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS v4** - Styling
- **recharts** - Trading charts and data visualization
- **react-i18next** - Internationalization (EN/FR)
- **fuse.js** - Fuzzy search for categories and duplicate detection

### Blockchain and Protocol
- **INTUITION Protocol v2** - On-chain knowledge graph
- **INTUITION L3** - Layer 3 built on Base
- **$TRUST Token** - Voting mechanism via bonding curves

### APIs and SDKs
- **@0xintuition/sdk** - Create Atoms and Triples
- **@0xintuition/graphql** - Query the knowledge graph
- **Pinata** - IPFS image storage

---

## Getting Started

### Prerequisites

- Node.js >= 18.0
- pnpm >= 9.8
- A wallet (MetaMask, Coinbase Wallet, etc.)
- ETH on INTUITION L3 for transactions

### Installation

```bash
git clone https://github.com/Dev-Moulin/Overmind_Founders_Collection.git
cd Overmind_Founders_Collection

pnpm install

cp apps/web/.env.example apps/web/.env
# Edit .env with your API keys
```

### Development

```bash
pnpm dev

pnpm build

pnpm preview
```

---

## The 42 Founders

Joseph Lubin · Andrew Keys · Jonathan Christodoro · Taylor Monahan · Edward Moncada · Cecily Mak · Ric Burton · Rouven Heck · John Paller · Mark Beylin · Ash Egan · Harrison Hines · Ron Patiro · Goncalo Sa · Tyler Mulvihill · Connor Keenan · Russell Verbeeten · Scott Moore · Jesse Grushack · Georgio Constantinou · Vijay Michalik · Brianna Montgomery · Eric Arsenault · Bryan Peters · Aaron McDonald · Tyler Ward · Keegan Selby · EJ Rogers · Ben Lakoff · Marc Weinstein · Nathan Doctor · Matt Kaye · Matt Slater · Sam Feinberg · Andy Beal · Joshua Lapidus · end0xiii · Alec Gutman · Sharad Malhautra · Jay Gutta · Rohan Handa · Odysseas Lamtzidis

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Links

- **INTUITION Website:** https://www.intuition.systems/
- **INTUITION Docs:** https://www.docs.intuition.systems/

## Acknowledgments

- **INTUITION Team** - For building the trust protocol
- **42 Founders** - For pioneering the ecosystem
- **Community** - For participating in this collective creation

---

*The Overmind observes. Each totem is a gateway into a personality, a symbolic memory etched onto the blockchain.* 👁️

---

<br><br>

# Version Francaise

[English version above](#intuition-founders-collection-%EF%B8%8F)

> Une collection collaborative ou la communaute INTUITION vote pour attribuer des symboles totemiques aux 42 fondateurs du protocole. Les totems gagnants seront transformes en oeuvres NFT 3D par l'Overmind.

**L'Overmind ecoute et observe.**
**Que chaque esprit revele son symbole.** 👁️

---

## Fonctionnalites

- **Vote Decentralise** - Votez avec des tokens $TRUST sur le Protocole INTUITION
- **Carrousel 3D Interactif** - Naviguez parmi les fondateurs a travers un carrousel 3D immersif
- **Dock Alphabetique A-Z** - Dock style macOS avec effet de magnification pour trouver un fondateur rapidement
- **Propositions Communautaires** - Tout le monde peut proposer des totems (objets, animaux, traits, energies)
- **Vote Multi-Fondateur par Lot** - Ajoutez plusieurs votes au panier et executez-les en une seule transaction
- **Graphiques de Trading en Temps Reel** - Visualisation en direct de l'activite de vote par fondateur
- **Recherche Fuzzy** - Detection intelligente des doublons de categories et de totems lors de la creation
- **Upload d'Images IPFS** - Ajoutez des images aux totems et categories via Pinata
- **Bilingue (EN/FR)** - Internationalisation complete avec changement de langue dynamique
- **Acces par Airdrop** - Seuls les wallets detenant le NFT de l'airdrop INTUITION peuvent participer
- **100% On-chain** - Toutes les donnees stockees sur INTUITION L3 via le Protocole INTUITION

---

## Comment ca Marche

### 1. Connecter son Wallet

Connexion via RainbowKit. Seuls les wallets detenant le NFT de l'airdrop INTUITION (5 novembre 2025) peuvent participer.

<video src="assets/videos/connection-deconnection.mp4" controls width="100%"></video>

### 2. Parcourir les Fondateurs

Explorez les 42 fondateurs via le carrousel 3D ou utilisez le dock alphabetique pour une navigation instantanee.

<video src="assets/videos/carousel.mp4" controls width="100%"></video>

<video src="assets/videos/dock-alphabet.mp4" controls width="100%"></video>

### 3. Selectionner et Voter

Choisissez un fondateur, un totem, votre direction de vote (Support ou Oppose) et la courbe (Lineaire ou Progressive), puis ajoutez au panier.

<video src="assets/videos/selection-ajout-panier.mp4" controls width="100%"></video>

### 4. Panier Multi-Fondateur

Empilez des votes pour plusieurs fondateurs dans un seul panier et validez le tout en une transaction batch.

<video src="assets/videos/multi-fondeur-validation.mp4" controls width="100%"></video>

### 5. Resultats

Le totem avec le plus de $TRUST dans son vault gagne pour chaque fondateur. Les $TRUST sont recuperables grace aux mecaniques de bonding curve.

---

## Stack Technique

### Frontend
- **React** + **Vite** + **TypeScript**
- **wagmi v2** + **viem** - Interaction Ethereum
- **RainbowKit** - Interface de connexion wallet
- **Apollo Client** - Requetes et subscriptions GraphQL
- **TanStack Query** - Fetching et cache de donnees
- **Tailwind CSS v4** - Stylisation
- **recharts** - Graphiques de trading et visualisation
- **react-i18next** - Internationalisation (EN/FR)
- **fuse.js** - Recherche fuzzy pour categories et detection de doublons

### Blockchain et Protocole
- **INTUITION Protocol v2** - Graphe de connaissances on-chain
- **INTUITION L3** - Layer 3 construit sur Base
- **Token $TRUST** - Mecanisme de vote via bonding curves

### APIs et SDKs
- **@0xintuition/sdk** - Creation d'Atoms et Triples
- **@0xintuition/graphql** - Requetes sur le graphe de connaissances
- **Pinata** - Stockage d'images IPFS

---

## Demarrage Rapide

### Prerequis

- Node.js >= 18.0
- pnpm >= 9.8
- Un wallet (MetaMask, Coinbase Wallet, etc.)
- ETH sur INTUITION L3 pour les transactions

### Installation

```bash
git clone https://github.com/Dev-Moulin/Overmind_Founders_Collection.git
cd Overmind_Founders_Collection

pnpm install

cp apps/web/.env.example apps/web/.env
# Editez .env avec vos cles API
```

### Developpement

```bash
pnpm dev

pnpm build

pnpm preview
```

---

## Les 42 Fondateurs

Joseph Lubin · Andrew Keys · Jonathan Christodoro · Taylor Monahan · Edward Moncada · Cecily Mak · Ric Burton · Rouven Heck · John Paller · Mark Beylin · Ash Egan · Harrison Hines · Ron Patiro · Goncalo Sa · Tyler Mulvihill · Connor Keenan · Russell Verbeeten · Scott Moore · Jesse Grushack · Georgio Constantinou · Vijay Michalik · Brianna Montgomery · Eric Arsenault · Bryan Peters · Aaron McDonald · Tyler Ward · Keegan Selby · EJ Rogers · Ben Lakoff · Marc Weinstein · Nathan Doctor · Matt Kaye · Matt Slater · Sam Feinberg · Andy Beal · Joshua Lapidus · end0xiii · Alec Gutman · Sharad Malhautra · Jay Gutta · Rohan Handa · Odysseas Lamtzidis

---

## Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](./LICENSE) pour les details.

## Liens

- **Site INTUITION :** https://www.intuition.systems/
- **Documentation INTUITION :** https://www.docs.intuition.systems/

## Remerciements

- **Equipe INTUITION** - Pour avoir construit le protocole de confiance
- **42 Fondateurs** - Pour avoir ete les pionniers de l'ecosysteme
- **Communaute** - Pour participer a cette creation collective

---

*L'Overmind observe. Chaque totem est une porte d'entree vers une personnalite, une memoire symbolique gravee sur la blockchain.* 👁️
