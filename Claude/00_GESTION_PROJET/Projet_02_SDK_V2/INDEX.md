# Projet 02 - SDK INTUITION V2

Documentation de recherche sur le SDK INTUITION V2 pour la refonte du système de vote.

## Documents

### Doc 1 : SDK Intuition V2 (Réseaux, Fonctions, Comportements)

| # | Fichier | Contenu |
|---|---------|---------|
| 1 | [01_Reseaux_Endpoints.md](./01_Reseaux_Endpoints.md) | Réseaux supportés, RPC, explorateurs, contrats MultiVault |
| 2 | [02_Creation_Atoms.md](./02_Creation_Atoms.md) | createAtomFromString, createAtomFromThing, createAtomFromEthereumAccount, coûts, retours |
| 3 | [03_Creation_Triples.md](./03_Creation_Triples.md) | createTripleStatement, batchCreateTripleStatements, atomicité, limites batch |
| 4 | [04_Depots_TRUST.md](./04_Depots_TRUST.md) | deposit, batchDepositStatement, frais, shares, événements |
| 5 | [05_Retraits_Redeem.md](./05_Retraits_Redeem.md) | redeem, redeemBatch, exit fees, previewRedeem, minAssets |
| 6 | [06_Comportements_Erreurs.md](./06_Comportements_Erreurs.md) | Atomicité, erreurs courantes, bonding curves, optimisation gas |

### Doc 2 : Implémentation Front-end (Wagmi, Vote FOR/AGAINST)

| # | Fichier | Contenu |
|---|---------|---------|
| 7 | [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md) | Configuration Wagmi, providers, connexion wallet, RainbowKit |
| 8 | [08_Transactions_Write.md](./08_Transactions_Write.md) | useWriteContract, création totem, envoi transaction, isPending |
| 9 | [09_Confirmation_Transaction.md](./09_Confirmation_Transaction.md) | useWaitForTransactionReceipt, minage, isLoading, isSuccess |
| 10 | [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md) | Implémentation vote FOR/AGAINST, VoteButton, mise à jour compteurs |
| 11 | [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md) | États asynchrones, feedback UX, gestion erreurs, flux complet |

### Doc 3 : Architecture Smart Contracts V2 (Détails techniques)

| # | Fichier | Contenu |
|---|---------|---------|
| 12 | [12_CreateTriple_Details.md](./12_CreateTriple_Details.md) | Détails createTripleStatement/batch, validation, hash, événements, getTripleCost |
| 13 | [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md) | deposit, depositBatch, redeem, curveId, minShares, previewDeposit, BondingCurveRegistry |
| 14 | [14_Architecture_Contrats.md](./14_Architecture_Contrats.md) | IntuitionRouter, IntuitionLogic, MultiVault, AtomStore, TripleStore, TrustBonding |
| 15 | [15_Validation_Atomes_Triples.md](./15_Validation_Atomes_Triples.md) | Règles validation, unicité, calculateAtomId, triplesByHash, frais création |
| 16 | [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md) | whenNotPaused, nonReentrant, timelocks, access control, gas limits |

### Doc 4 : Référence Contrat V2 (Recherche Internet)

| # | Fichier | Contenu |
|---|---------|---------|
| 17 | [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md) | Signatures réelles contrat V2, batch functions, structures, différences SDK vs contrat, **Multicall3 ABANDONNÉ** (incompatible msg.sender) |

### Doc 5 : Tests & Règles Portal INTUITION (Observations Manuelles)

| # | Fichier | Contenu |
|---|---------|---------|
| 19 | [19_INTUITION_Portal_Rules.md](./19_INTUITION_Portal_Rules.md) | Règles exactes du protocole observées sur le portal testnet, matrice de compatibilité Support/Oppose × Linear/Progressive |
| 20 | [20_BUGS_ANALYSIS.md](./20_BUGS_ANALYSIS.md) | **NOUVEAU** - Analyse centralisée des bugs, statuts, corrections appliquées, tests du 30/12/2025 |

---

## Index de recherche

### Réseaux & Endpoints (Doc 1)
- Intuition Mainnet L3 : Chain ID 1155, token $TRUST → [01_Reseaux_Endpoints.md](./01_Reseaux_Endpoints.md)
- Intuition Testnet L3 : Chain ID 13579, token $tTRUST → [01_Reseaux_Endpoints.md](./01_Reseaux_Endpoints.md)
- RPC mainnet : `https://rpc.intuition.systems` → [01_Reseaux_Endpoints.md](./01_Reseaux_Endpoints.md)
- RPC testnet : `https://testnet.rpc.intuition.systems` → [01_Reseaux_Endpoints.md](./01_Reseaux_Endpoints.md)
- WebSocket mainnet : `wss://rpc.intuition.systems` → [01_Reseaux_Endpoints.md](./01_Reseaux_Endpoints.md)
- WebSocket testnet : `wss://testnet.rpc.intuition.systems` → [01_Reseaux_Endpoints.md](./01_Reseaux_Endpoints.md)
- Explorateur mainnet : `https://explorer.intuition.systems` → [01_Reseaux_Endpoints.md](./01_Reseaux_Endpoints.md)
- Explorateur testnet : `https://testnet.explorer.intuition.systems` → [01_Reseaux_Endpoints.md](./01_Reseaux_Endpoints.md)
- MultiVault mainnet : `0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e` → [01_Reseaux_Endpoints.md](./01_Reseaux_Endpoints.md)
- MultiVault testnet : `0x2Ece8D4dEdcB9918A398528f3fa4688b1d2CAB91` → [01_Reseaux_Endpoints.md](./01_Reseaux_Endpoints.md)
- `getMultiVaultAddressFromChainId` → [01_Reseaux_Endpoints.md](./01_Reseaux_Endpoints.md)
- `getEthMultiVaultAddressFromChainId` → [01_Reseaux_Endpoints.md](./01_Reseaux_Endpoints.md)

### Création d'Atoms (Doc 1)
- `createAtomFromString` → [02_Creation_Atoms.md](./02_Creation_Atoms.md)
- `createAtomFromThing` → [02_Creation_Atoms.md](./02_Creation_Atoms.md)
- `createAtomFromEthereumAccount` → [02_Creation_Atoms.md](./02_Creation_Atoms.md)
- `createAtomFromIpfsUpload` → [02_Creation_Atoms.md](./02_Creation_Atoms.md)
- `batchCreateAtoms` → [02_Creation_Atoms.md](./02_Creation_Atoms.md)
- Frais création atom : 0.1 TRUST → [02_Creation_Atoms.md](./02_Creation_Atoms.md)
- Taille max atom : 1000 octets → [02_Creation_Atoms.md](./02_Creation_Atoms.md)
- Hash keccak256 pour termId → [02_Creation_Atoms.md](./02_Creation_Atoms.md)
- AtomWallet → [02_Creation_Atoms.md](./02_Creation_Atoms.md)
- Événement AtomCreated → [02_Creation_Atoms.md](./02_Creation_Atoms.md)

### Création de Triples (Doc 1)
- `createTripleStatement` → [03_Creation_Triples.md](./03_Creation_Triples.md)
- `batchCreateTripleStatements` → [03_Creation_Triples.md](./03_Creation_Triples.md)
- Hash triple : `keccak256(subjectId, predicateId, objectId)` → [03_Creation_Triples.md](./03_Creation_Triples.md)
- Atomicité batch (tout ou rien) → [03_Creation_Triples.md](./03_Creation_Triples.md)
- Frais création triple : 0.1 TRUST → [03_Creation_Triples.md](./03_Creation_Triples.md)
- Événement TripleCreated → [03_Creation_Triples.md](./03_Creation_Triples.md)
- Limites batch (gas, taille transaction) → [03_Creation_Triples.md](./03_Creation_Triples.md)

### Dépôts (Signalement TRUST) (Doc 1)
- `deposit` → [04_Depots_TRUST.md](./04_Depots_TRUST.md)
- `batchDepositStatement` → [04_Depots_TRUST.md](./04_Depots_TRUST.md)
- `depositBatch` (contrat) → [04_Depots_TRUST.md](./04_Depots_TRUST.md)
- Frais entrée : 0.5% → [04_Depots_TRUST.md](./04_Depots_TRUST.md)
- Frais protocole : 1.25% → [04_Depots_TRUST.md](./04_Depots_TRUST.md)
- Redistribution triple vers atoms : 0.9% → [04_Depots_TRUST.md](./04_Depots_TRUST.md)
- Dépôt minimum : 0.01 TRUST → [04_Depots_TRUST.md](./04_Depots_TRUST.md)
- Minimum shares : 1e6 wei → [04_Depots_TRUST.md](./04_Depots_TRUST.md)
- Shares (parts de vault) → [04_Depots_TRUST.md](./04_Depots_TRUST.md)
- Événement Deposited → [04_Depots_TRUST.md](./04_Depots_TRUST.md)

### Retraits (Redeem) (Doc 1)
- `redeem` → [05_Retraits_Redeem.md](./05_Retraits_Redeem.md)
- `redeemBatch` → [05_Retraits_Redeem.md](./05_Retraits_Redeem.md)
- `previewRedeem` → [05_Retraits_Redeem.md](./05_Retraits_Redeem.md)
- Frais sortie (exit fee) : 0.75% → [05_Retraits_Redeem.md](./05_Retraits_Redeem.md)
- Protection minAssets → [05_Retraits_Redeem.md](./05_Retraits_Redeem.md)
- Événement Redeemed → [05_Retraits_Redeem.md](./05_Retraits_Redeem.md)

### Erreurs & Comportements SDK (Doc 1)
- Doublons (term already exists) → [06_Comportements_Erreurs.md](./06_Comportements_Erreurs.md)
- MinimumDepositNotMet → [06_Comportements_Erreurs.md](./06_Comportements_Erreurs.md)
- Insufficient value for fees → [06_Comportements_Erreurs.md](./06_Comportements_Erreurs.md)
- Pausable: paused → [06_Comportements_Erreurs.md](./06_Comportements_Erreurs.md)
- Out of gas (batch trop grand) → [06_Comportements_Erreurs.md](./06_Comportements_Erreurs.md)
- Atomicité des opérations → [06_Comportements_Erreurs.md](./06_Comportements_Erreurs.md)
- Bonding curves (Offset Progressive) → [06_Comportements_Erreurs.md](./06_Comportements_Erreurs.md)
- `previewDeposit` → [06_Comportements_Erreurs.md](./06_Comportements_Erreurs.md)
- `currentSharePrice` → [06_Comportements_Erreurs.md](./06_Comportements_Erreurs.md)
- `isTermCreated` → [06_Comportements_Erreurs.md](./06_Comportements_Erreurs.md)
- `whenNotPaused` → [06_Comportements_Erreurs.md](./06_Comportements_Erreurs.md)
- Optimisation gas (batching) → [06_Comportements_Erreurs.md](./06_Comportements_Erreurs.md)

### Configuration Wagmi & Connexion (Doc 2)
- Wagmi → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- Viem → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- `createConfig` → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- `configureChains` → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- `<WagmiConfig>` / `<WagmiProvider>` → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- `useConnect` → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- `useAccount` → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- `useDisconnect` → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- Connectors (MetaMask, WalletConnect) → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- RainbowKit → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- ConnectKit → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- Web3Modal → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- Injected connector → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- Clé privée (pourquoi ne pas stocker) → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)
- DApp trustless → [07_Config_Wagmi_Connexion.md](./07_Config_Wagmi_Connexion.md)

### Transactions Write (Doc 2)
- `useWriteContract` → [08_Transactions_Write.md](./08_Transactions_Write.md)
- `useContractWrite` (ancienne version) → [08_Transactions_Write.md](./08_Transactions_Write.md)
- `writeContract()` → [08_Transactions_Write.md](./08_Transactions_Write.md)
- ABI (Application Binary Interface) → [08_Transactions_Write.md](./08_Transactions_Write.md)
- `functionName` → [08_Transactions_Write.md](./08_Transactions_Write.md)
- `args` (arguments fonction) → [08_Transactions_Write.md](./08_Transactions_Write.md)
- `isPending` → [08_Transactions_Write.md](./08_Transactions_Write.md)
- `txHash` (hash de transaction) → [08_Transactions_Write.md](./08_Transactions_Write.md)
- Création totem → [08_Transactions_Write.md](./08_Transactions_Write.md)
- Formulaire React → [08_Transactions_Write.md](./08_Transactions_Write.md)
- Lien Etherscan → [08_Transactions_Write.md](./08_Transactions_Write.md)

### Confirmation Transaction (Doc 2)
- `useWaitForTransactionReceipt` → [09_Confirmation_Transaction.md](./09_Confirmation_Transaction.md)
- `useWaitForTransaction` (ancienne version) → [09_Confirmation_Transaction.md](./09_Confirmation_Transaction.md)
- `isLoading` → [09_Confirmation_Transaction.md](./09_Confirmation_Transaction.md)
- `isSuccess` → [09_Confirmation_Transaction.md](./09_Confirmation_Transaction.md)
- `isConfirming` → [09_Confirmation_Transaction.md](./09_Confirmation_Transaction.md)
- `isConfirmed` → [09_Confirmation_Transaction.md](./09_Confirmation_Transaction.md)
- `isError` → [09_Confirmation_Transaction.md](./09_Confirmation_Transaction.md)
- Minage de bloc → [09_Confirmation_Transaction.md](./09_Confirmation_Transaction.md)
- TransactionReceipt → [09_Confirmation_Transaction.md](./09_Confirmation_Transaction.md)

### Vote FOR/AGAINST (Doc 2)
- Vote FOR → [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md)
- Vote AGAINST → [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md)
- `voteOnTotem` → [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md)
- `voteFor` / `voteAgainst` → [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md)
- VoteButton composant → [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md)
- TotemCard composant → [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md)
- totemId → [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md)
- forOrAgainst (booléen) → [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md)
- `useReadContract` → [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md)
- `useWatchContractEvent` → [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md)
- Événement VoteCast → [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md)
- Compteurs de vote → [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md)
- `refetch()` → [10_Vote_ForAgainst.md](./10_Vote_ForAgainst.md)

### Gestion États & Erreurs Front-end (Doc 2)
- États asynchrones → [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md)
- Feedback utilisateur → [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md)
- `isPending` (attente signature) → [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md)
- `isLoading` (minage) → [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md)
- `isSuccess` (confirmée) → [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md)
- `isError` (échec) → [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md)
- react-hot-toast → [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md)
- Toast notifications → [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md)
- `UserRejectedRequestError` → [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md)
- `error.shortMessage` → [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md)
- Revert du contrat → [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md)
- Out of gas → [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md)
- Flux utilisateur complet → [11_Gestion_Etats_Erreurs.md](./11_Gestion_Etats_Erreurs.md)

### Détails createTriple (Doc 3)
- `createTripleStatement` (détails) → [12_CreateTriple_Details.md](./12_CreateTriple_Details.md)
- `batchCreateTripleStatements` (détails) → [12_CreateTriple_Details.md](./12_CreateTriple_Details.md)
- `createTriples` (fonction unifiée V2) → [12_CreateTriple_Details.md](./12_CreateTriple_Details.md)
- `getTripleCost()` → [12_CreateTriple_Details.md](./12_CreateTriple_Details.md)
- `triplesByHash` (mapping anti-doublon) → [12_CreateTriple_Details.md](./12_CreateTriple_Details.md)
- Validation composants (atomes existants) → [12_CreateTriple_Details.md](./12_CreateTriple_Details.md)
- Atomicité batch détaillée → [12_CreateTriple_Details.md](./12_CreateTriple_Details.md)
- Coût gas création triple → [12_CreateTriple_Details.md](./12_CreateTriple_Details.md)

### Dépôts/Retraits & Bonding Curves (Doc 3)
- `deposit` (contrat V2) → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)
- `depositBatch` (contrat V2) → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)
- `redeem` (contrat V2) → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)
- `redeemBatch` (contrat V2) → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)
- `curveId` (identifiant courbe) → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)
- `minShares` (protection slippage dépôt) → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)
- `minAssets` (protection slippage retrait) → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)
- `previewDeposit` / `getVaultShares` → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)
- `previewRedeem` → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)
- BondingCurveRegistry → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)
- LinearCurve → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)
- OffsetProgressiveCurve → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)
- Événement Deposited (contrat) → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)
- Événement Redeemed (contrat) → [13_Deposit_Redeem_BondingCurve.md](./13_Deposit_Redeem_BondingCurve.md)

### Architecture Contrats (Doc 3)
- IntuitionRouter → [14_Architecture_Contrats.md](./14_Architecture_Contrats.md)
- IntuitionLogic → [14_Architecture_Contrats.md](./14_Architecture_Contrats.md)
- EthMultiVaultV2 / MultiVault → [14_Architecture_Contrats.md](./14_Architecture_Contrats.md)
- AtomStore → [14_Architecture_Contrats.md](./14_Architecture_Contrats.md)
- TripleStore → [14_Architecture_Contrats.md](./14_Architecture_Contrats.md)
- TrustBonding → [14_Architecture_Contrats.md](./14_Architecture_Contrats.md)
- `tripleAtomShares` (mapping) → [14_Architecture_Contrats.md](./14_Architecture_Contrats.md)
- Répartition tripartite (dépôt triple → 3 atomes) → [14_Architecture_Contrats.md](./14_Architecture_Contrats.md)
- `calculateAtomId` → [14_Architecture_Contrats.md](./14_Architecture_Contrats.md)
- `calculateTripleId` → [14_Architecture_Contrats.md](./14_Architecture_Contrats.md)
- Flux création triple avec dépôt → [14_Architecture_Contrats.md](./14_Architecture_Contrats.md)
- Architecture modulaire → [14_Architecture_Contrats.md](./14_Architecture_Contrats.md)

### Validation Atomes & Triples (Doc 3)
- Règles validation atomes → [15_Validation_Atomes_Triples.md](./15_Validation_Atomes_Triples.md)
- Règles validation triples → [15_Validation_Atomes_Triples.md](./15_Validation_Atomes_Triples.md)
- `calculateAtomId` (hash données) → [15_Validation_Atomes_Triples.md](./15_Validation_Atomes_Triples.md)
- Unicité atomes (hash unique) → [15_Validation_Atomes_Triples.md](./15_Validation_Atomes_Triples.md)
- Unicité triples (triplesByHash) → [15_Validation_Atomes_Triples.md](./15_Validation_Atomes_Triples.md)
- Composants existants requis → [15_Validation_Atomes_Triples.md](./15_Validation_Atomes_Triples.md)
- Pas de triples comme composants → [15_Validation_Atomes_Triples.md](./15_Validation_Atomes_Triples.md)
- Relations réflexives (autorisées) → [15_Validation_Atomes_Triples.md](./15_Validation_Atomes_Triples.md)
- AtomCreationFee → [15_Validation_Atomes_Triples.md](./15_Validation_Atomes_Triples.md)
- TripleCreationFee → [15_Validation_Atomes_Triples.md](./15_Validation_Atomes_Triples.md)
- Dépôt initial optionnel → [15_Validation_Atomes_Triples.md](./15_Validation_Atomes_Triples.md)
- Taille max données atome → [15_Validation_Atomes_Triples.md](./15_Validation_Atomes_Triples.md)

### Sécurité & Modificateurs (Doc 3)
- `whenNotPaused` → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- `nonReentrant` → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- OpenZeppelin Pausable → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- OpenZeppelin ReentrancyGuard → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- Timelocks (Upgrades, Parameters) → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- Proxy Admin → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- `SET_ADMIN`, `SET_EXIT_FEE` → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- Emergency redeem → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- Vérification tableaux (longueur) → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- Vérification montants (msg.value) → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- Block gas limit → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- Erreurs custom (TripleExists, NotAtom) → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- Audits sécurité → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- Initializable / reinitialize → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)
- UUPS proxies → [16_Securite_Modificateurs.md](./16_Securite_Modificateurs.md)

### EthMultiVault V2 Référence (Doc 4)
- `batchDeposit` (contrat V2 réel) → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `batchDepositCurve` → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `batchRedeem` (pourcentage) → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `batchRedeemCurve` → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `batchCreateAtom` → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `batchCreateTriple` → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `previewDeposit` (V2) → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `previewDepositCurve` → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `previewRedeem` (V2) → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `previewRedeemCurve` → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `GeneralConfig` structure → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `VaultFees` structure → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `AtomConfig` structure → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `TripleConfig` structure → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `BondingCurveConfig` structure → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `getAtomCost` (V2) → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- `getTripleCost` (V2) → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- Différences SDK vs Contrat → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- Basis points (calcul frais) → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- Frais max 10% → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- Adresse EthMultiVault Base → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)
- ~~Multicall3~~ **ABANDONNÉ** → [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md#15-transaction-atomique-redeem--deposit---impossible-via-multicall3)
- Switch position FOR→AGAINST → **2 transactions séquentielles** (redeemBatch + depositBatch)

### Règles Portal INTUITION (Doc 5)
- Support (FOR) / Oppose (AGAINST) → [19_INTUITION_Portal_Rules.md](./19_INTUITION_Portal_Rules.md)
- Linear vs Offset Progressive → [19_INTUITION_Portal_Rules.md](./19_INTUITION_Portal_Rules.md#2-curves-bonding-curves)
- Matrice compatibilité Support/Oppose × Linear/Progressive → [19_INTUITION_Portal_Rules.md](./19_INTUITION_Portal_Rules.md#4-règles-de-compatibilité-crucial)
- Règle "pas Support ET Oppose sur même curve" → [19_INTUITION_Portal_Rules.md](./19_INTUITION_Portal_Rules.md#4-règles-de-compatibilité-crucial)
- Blocage si positions sur les deux curves → [19_INTUITION_Portal_Rules.md](./19_INTUITION_Portal_Rules.md#cas-spécial--positions-sur-les-deux-curves)
- Workflow changement direction → [19_INTUITION_Portal_Rules.md](./19_INTUITION_Portal_Rules.md#6-workflow-pour-changer-de-direction-même-curve)
- Création triple force Support → [19_INTUITION_Portal_Rules.md](./19_INTUITION_Portal_Rules.md#8-création-de-triple)

### Bugs & Analyse (Doc 5)
- Liste des bugs identifiés → [20_BUGS_ANALYSIS.md](./20_BUGS_ANALYSIS.md)
- Bug B1 Progressive→Linear (CORRIGÉ) → [20_BUGS_ANALYSIS.md](./20_BUGS_ANALYSIS.md#b1--progressive--linear-)
- Bug B2 TripleExists (CORRIGÉ) → [20_BUGS_ANALYSIS.md](./20_BUGS_ANALYSIS.md#b2--tripleexists-error-)
- Bug B3 "il manque 0.0000" → [20_BUGS_ANALYSIS.md](./20_BUGS_ANALYSIS.md#b3--il-manque-00000-trust-)
- Bug B4 AGAINST→FOR → [20_BUGS_ANALYSIS.md](./20_BUGS_ANALYSIS.md#b4--direction-against--for--haute-priorité)
- Tests du 30/12/2025 → [20_BUGS_ANALYSIS.md](./20_BUGS_ANALYSIS.md#résultats-tests-du-30122025)

---

## Sources principales

### Documentation officielle Intuition
- [SDK v2 Overview](https://docs.intuition.systems/docs/developer-tools/sdks/overview)
- [SDK Getting Started](https://docs.intuition.systems/docs/developer-tools/sdks/getting-started)
- [Contracts Deployments](https://docs.intuition.systems/docs/developer-tools/contracts/deployments)
- [Smart Contracts Overview](https://docs.intuition.systems/docs/protocol/contracts)
- [Bonding Curves](https://docs.intuition.systems/docs/protocol/tokenomics/trust/bonding-curve)
- [Deposit and Return](https://docs.intuition.systems/docs/protocol/tokenomics/trust/deposit-and-return)
- [GraphQL API](https://docs.intuition.systems/docs/developer-tools/graphql/overview)
- [Migration v1 → v2](https://docs.intuition.systems/docs/updates/migration-1-5)

### GitHub & NPM Intuition
- [intuition-ts (GitHub)](https://github.com/0xIntuition/intuition-ts)
- [@0xintuition/sdk (NPM)](https://www.npmjs.com/package/@0xintuition/sdk)
- [@0xintuition/protocol (NPM)](https://www.npmjs.com/package/@0xintuition/protocol)
- [intuition-contracts-v2 (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2)
- [SDK Docs (GitHub Pages)](https://0xintuition.github.io/intuition-ts/)
- [TRUST Token (GitHub)](https://github.com/0xIntuition/trust-token)

### Contrats Solidity (GitHub)
- [EthMultiVaultV2.sol](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/vaults/EthMultiVaultV2.sol)
- [IntuitionRouter.sol](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/IntuitionRouter.sol)
- [IntuitionLogic.sol](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/lib/IntuitionLogic.sol)
- [AtomStore.sol](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/stores/AtomStore.sol)
- [TripleStore.sol](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/stores/TripleStore.sol)
- [TrustBonding.sol](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/TrustBonding.sol)
- [Bonding curves](https://github.com/0xIntuition/intuition-contracts-v2/tree/main/contracts/bonding-curves)
- [VaultEvents.sol](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/events/VaultEvents.sol)

### Documentation officielle Wagmi / Viem
- [Wagmi Getting Started](https://wagmi.sh/react/getting-started)
- [useWriteContract](https://wagmi.sh/react/hooks/useWriteContract)
- [useWaitForTransactionReceipt](https://wagmi.sh/react/hooks/useWaitForTransactionReceipt)
- [useAccount](https://wagmi.sh/react/hooks/useAccount)
- [useConnect](https://wagmi.sh/react/hooks/useConnect)
- [useDisconnect](https://wagmi.sh/react/hooks/useDisconnect)
- [useReadContract](https://wagmi.sh/react/hooks/useReadContract)
- [useWatchContractEvent](https://wagmi.sh/react/hooks/useWatchContractEvent)
- [Wagmi FAQ](https://wagmi.sh/react/faq)
- [Contract Write Example](https://wagmi.sh/react/examples/contract-write)
- [Viem readContract](https://viem.sh/docs/contract/readContract.html)
- [Viem writeContract](https://viem.sh/docs/contract/writeContract.html)

### Références techniques annexes
- [wagmi (GitHub)](https://github.com/wagmi-dev/wagmi)
- [viem (GitHub)](https://github.com/wevm/viem)
- [RainbowKit Docs](https://docs.family.co/rainbowkit)
- [RainbowKit (GitHub)](https://github.com/wevm/rainbowkit)
- [Intuition Gitbook](https://intuition.gitbook.io)

---

## 🆕 RESULTS PAGE - Spécification (10 décembre 2025)

### Objectif

Afficher les résultats des votes pour tous les fondateurs avec leur **Top 5 totems**.

### Métriques à afficher (par totem)

| Métrique | Calcul | Description |
|----------|--------|-------------|
| **Net Votes** | Nb wallets FOR - Nb wallets AGAINST | Consensus communautaire (1 wallet = 1 voix) |
| **Total TRUST** | FOR TRUST + AGAINST TRUST | Force de conviction / engagement financier |

### Pourquoi deux métriques ?

- **Net Votes** = consensus démocratique (chaque wallet compte également)
- **Total TRUST** = conviction financière (skin in the game)

Un totem peut avoir :
- +40 Net Votes mais 100 TRUST total (beaucoup de petits votes)
- +10 Net Votes mais 5000 TRUST total (quelques gros votes convaincus)

Les deux informations sont importantes pour comprendre le résultat.

### Format d'affichage

**Layout** : Grille de cards (comme HomePage)

**Chaque card fondateur contient** :
1. Photo + nom du fondateur
2. Top 5 totems (triés par Net Votes)
3. Deux graphiques Bar Chart empilés :
   - Chart 1 : Net Votes (wallets FOR vs AGAINST)
   - Chart 2 : Total TRUST (FOR TRUST vs AGAINST TRUST)

### Exemple visuel (une card)

```
┌─────────────────────────────────────────────┐
│ [Photo] Vitalik Buterin                     │
├─────────────────────────────────────────────┤
│ TOP 5 TOTEMS                                │
│                                             │
│ 1. Owl      ████████████ 45  ███ 12  (+33)  │  ← FOR vert, AGAINST rouge
│ 2. Phoenix  █████████ 38     ██ 8   (+30)   │
│ 3. Lion     ██████ 25        █ 5    (+20)   │
│ 4. Eagle    ████ 18          ███ 10 (+8)    │
│ 5. Wolf     ███ 15           ███ 12 (+3)    │
│                                             │
│ [Chart: Net Votes]  [Chart: Total TRUST]    │
└─────────────────────────────────────────────┘
```

### Données nécessaires

Pour chaque totem, on a besoin de :
- `walletsFor` : nombre de wallets uniques ayant voté FOR
- `walletsAgainst` : nombre de wallets uniques ayant voté AGAINST
- `trustFor` : montant total TRUST voté FOR
- `trustAgainst` : montant total TRUST voté AGAINST

### Hook existant à adapter

`useTopTotems.ts` existe déjà mais calcule uniquement le TRUST. Il faut l'adapter pour inclure le **count de wallets**.

### Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `pages/ResultsPage.tsx` | **CRÉER** - Page principale |
| `components/results/FounderResultCard.tsx` | **CRÉER** - Card par fondateur |
| `components/results/TotemResultsChart.tsx` | **CRÉER** - Bar chart empilé |
| `hooks/data/useTopTotemsWithVoters.ts` | **CRÉER** - Hook avec count wallets |
| `hooks/data/useAllFoundersResults.ts` | **CRÉER** - Agrégation tous fondateurs |
| `router.tsx` | **MODIFIER** - Ajouter route /results |
| `i18n/locales/*.json` | **MODIFIER** - Traductions |

---

**Créé** : 28/11/2025
**Mis à jour** : 06/01/2026 - Corrections bugs B5 & B6

---

## Dernières mises à jour (6 janvier 2026)

### Corrections Bugs B5 & B6

#### B5 : Affichage étapes incorrect ✅

**Problème** : L'UI affichait "1/1" alors qu'il y avait 3+ transactions MetaMask.

**Solution** : Pattern `useRef` avec compteur centralisé `stepCounterRef` et fonction `incrementStep()` appelée après chaque `waitForTransactionReceipt`.

**Fichier** : `apps/web/src/hooks/blockchain/useBatchVote.ts`

#### B6 : Doublons dans "My Votes" ✅

**Problème** : Les totems apparaissaient plusieurs fois (Linear + Progressive fusionnés).

**Analyse** : MultiVault V2 permet 4 positions indépendantes par totem :
- Linear FOR, Linear AGAINST, Progressive FOR, Progressive AGAINST

**Solution** : Nouvelle clé de consolidation `${totem}_${direction}_${curveId}` + badge visuel "L" (vert) ou "P" (violet).

**Fichiers** :
- `apps/web/src/lib/graphql/queries.ts` - Ajout `curve_id`
- `apps/web/src/hooks/data/useUserVotesForFounder.ts` - Consolidation par curve
- `apps/web/src/components/vote/MyVotesItem.tsx` - Badge L/P

#### Problème potentiel identifié

**Observation** : Tous les votes affichent "P" même pour les Linear. À investiguer.

**Voir** : [20_BUGS_ANALYSIS.md](./20_BUGS_ANALYSIS.md#b5--affichage-étapes-incorrect-) et [TODO_FIX_01_Discussion.md §18](./TODO_FIX_01_Discussion.md#18-fix-step-counter--my-votes-consolidation---6-janvier-2026)

---

## Mises à jour précédentes (30 décembre 2025)

### Corrections Bugs B1 & B2 + Tests de Validation

**Nouvelle documentation** : [20_BUGS_ANALYSIS.md](./20_BUGS_ANALYSIS.md)

#### Bugs Corrigés ✅

| Bug | Description | Fichier |
|-----|-------------|---------|
| **B1** | Progressive → Linear | `useBatchVote.ts` - Process 3-step implémenté |
| **B2** | TripleExists error | `useBatchVote.ts` - Vérification GraphQL ajoutée |

#### Nouveaux Bugs Identifiés

| Bug | Description | Priorité | Statut |
|-----|-------------|----------|--------|
| **B4** | AGAINST → FOR (direction ignorée) | HAUTE | ✅ CORRIGÉ |
| **B5** | Affichage étapes incorrect (1/1 vs 3 tx) | BASSE | ✅ CORRIGÉ |
| **B6** | Doublons dans "my vote" | MOYENNE | ✅ CORRIGÉ |
| **B8** | Montant total incorrect | MOYENNE | ❌ À CORRIGER |

#### Résultat Test du 30/12
- **Progressive fonctionne** : Les votes finissent bien en "Offset Progressive" ✅
- **Direction cassée** : AGAINST devient FOR sur le testnet ❌

**Voir** : [20_BUGS_ANALYSIS.md](./20_BUGS_ANALYSIS.md)

---

## Mises à jour précédentes (29 décembre 2025)

### Tests Manuels Portal INTUITION

Tests approfondis effectués sur le portal testnet INTUITION pour comprendre le comportement exact du protocole.

**Documentation** : [19_INTUITION_Portal_Rules.md](./19_INTUITION_Portal_Rules.md)

#### Règles Découvertes

1. **Deux curves indépendantes** : Linear (curveId=1) et Offset Progressive (curveId=2)
2. **Règle fondamentale** : Impossible d'avoir Support ET Oppose sur la même curve
3. **Blocage total** : Si positions des deux côtés sur les deux curves, l'utilisateur est bloqué
4. **Création triple** : Force toujours un dépôt initial en Support (FOR)

---

## Mises à jour précédentes (20 décembre 2025)

### Support Linear/Progressive Bonding Curves

Implémentation du support pour les deux types de bonding curves INTUITION V2 :
- **Linear** (curveId = 1) : Courbe linéaire standard
- **Progressive** (curveId = 4) : Courbe progressive avec offset

#### Fichiers créés

| Fichier | Description |
|---------|-------------|
| `hooks/data/useTopTotemsByCurve.ts` | Hook pour récupérer les totems avec breakdown Linear/Progressive |
| `components/stats/CurveStatsPanel.tsx` | Panel affichant les stats par curve avec toggle |

#### Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `hooks/data/useFoundersForHomePage.ts` | Ajout `linearWinner`/`progressiveWinner` par fondateur, fix FOR/AGAINST via `termToTripleMap` |
| `hooks/data/useVotesTimeline.ts` | Ajout paramètre `curveFilter`, fix FOR/AGAINST via `termToInfoMap`, récupération `counter_term_id` |
| `hooks/blockchain/useVote.ts` | Ajout paramètre `curveId` pour voter sur Linear ou Progressive |
| `hooks/blockchain/useWithdraw.ts` | Ajout paramètre `curveId` pour retirer de Linear ou Progressive |
| `components/founder/FounderCenterPanel.tsx` | Intégration `CurveStatsPanel`, état `curveFilter` partagé |
| `components/founder/FounderExpandedView.tsx` | Lifting de l'état `curveFilter` au niveau parent |
| `components/founder/FounderInfoPanel.tsx` | Affichage du winner selon le `curveFilter` sélectionné |
| `components/founder/VoteTotemPanel.tsx` | Sélecteur de curve (Linear/Progressive) |
| `lib/graphql/queries.ts` | Ajout `counter_term { id }` dans les queries |

#### Correction critique : FOR/AGAINST detection

**Problème identifié** : Le code utilisait `vault_type` pour déterminer si un vote était FOR ou AGAINST, ce qui n'est pas fiable dans INTUITION V2.

**Solution** : Dans INTUITION V2 :
- Dépôt sur `term_id` du triple = vote **FOR**
- Dépôt sur `counter_term_id` du triple = vote **AGAINST**

Les hooks `useFoundersForHomePage` et `useVotesTimeline` créent maintenant un map `termId/counterTermId → { isFor: boolean }` pour correctement classifier les votes.

#### État actuel

- ✅ Hooks de vote/withdraw supportent `curveId`
- ✅ TradingChart filtrable par curve
- ✅ CurveStatsPanel avec toggle Linear/Progressive/All
- ✅ Winners par curve affichés dans FounderInfoPanel
- ⚠️ **À TESTER** : Vérifier que les données s'affichent correctement

---

## Mises à jour précédentes (10 décembre 2025)

### Clarification Catégories Dynamiques

La documentation `18_Design_Decisions_V2.md` a été mise à jour pour clarifier que les catégories sont **dynamiques** :

- L'utilisateur peut créer un totem dans une **catégorie existante** (Animal, Objet, etc.) → 2 triples
- L'utilisateur peut créer un totem dans une **nouvelle catégorie** (ex: "IA", "Film") → 3 triples

Le système vérifie automatiquement si le Triple 3 `[Catégorie] → [tag category] → [Overmind Founders Collection]` existe et le crée si nécessaire.

**Fichier modifié** : `18_Design_Decisions_V2.md` (sections 1 et 12)

---

### Fix Graphiques Radar - TopTotemsRadar & RelationsRadar

Trois améliorations UX appliquées aux graphiques radar :

1. **Tooltip dynamique par quadrant** - Le tooltip se positionne dans le coin opposé au curseur pour ne jamais masquer les données survolées

2. **Click sur les points du radar** - En plus des labels textuels, il est maintenant possible de cliquer sur les points colorés (bleu FOR / orange AGAINST) pour sélectionner un totem

3. **Suppression de l'outline de focus** - L'outline blanc qui apparaissait au clic sur le conteneur a été supprimé via Tailwind (`**:outline-none`) et `tabIndex={-1}`

**Fichier principal modifié** : `components/graph/TopTotemsRadar.tsx`

**Voir** : [TODO_FIX_01_Discussion.md §15](./TODO_FIX_01_Discussion.md#15-fix-graphiques-radar---interactions--tooltip---10-décembre-2025)

---

## Mises à jour précédentes (9 décembre 2025)

### Multicall3 - ABANDONNÉ

La tentative d'utiliser Multicall3 pour combiner `redeemBatch` + `depositBatch` en une seule transaction a échoué.

**Raison** : `redeemBatch` vérifie `_isApprovedToRedeem(msg.sender, receiver)`. Via Multicall3, `msg.sender` = adresse Multicall3 (pas le wallet utilisateur), donc la vérification échoue.

**Solution actuelle** : 2 transactions séquentielles (2 signatures utilisateur).

Voir [TODO_FIX_01_Discussion.md §14](./TODO_FIX_01_Discussion.md#14-transaction-atomique-redeem--deposit-multicall3---abandonné) pour les détails.

---

## Mises à jour précédentes (8 décembre 2025)

### Réorganisation Structure (en cours)

Suite à l'identification d'une sur-ingénierie (38 hooks, 46 composants), une réorganisation de la structure est planifiée.

**Objectif** : Organiser les hooks et composants par domaine/responsabilité pour :
- Identifier les doublons potentiels
- Faciliter la maintenance
- Améliorer la lisibilité du code

**Hooks identifiés pour consolidation potentielle** :
- `useVoteStats.ts` et `useVoteMarketStats.ts`
- `useUserVotes.ts` et `useUserVotesForFounder.ts`
- `useBatchVote.ts`, `useBatchDeposit.ts`, `useBatchRedeem.ts`

**Voir** : [TODO_FIX_01_Discussion.md](./TODO_FIX_01_Discussion.md#9-réorganisation-structure-planifiée)

---

## Mises à jour précédentes (5 décembre 2025)

### Internationalisation (i18n) complète

L'application supporte désormais l'anglais et le français avec basculement dynamique.

**Fichiers de traduction:**
- `apps/web/src/i18n/locales/en.json` - Traductions anglaises
- `apps/web/src/i18n/locales/fr.json` - Traductions françaises

**Composants mis à jour avec i18n:**
| Composant | Clés de traduction |
|-----------|-------------------|
| `VoteGraph.tsx` | `common.noRelationFound`, `common.founder`, `common.relation` |
| `TradingChart.tsx` | `common.noData` |
| `FounderExpandedView.tsx` | `founderExpanded.voteCart` |
| `FounderInfoPanel.tsx` | `common.close`, `common.proposals` |
| `RefreshIndicator.tsx` | `refreshIndicator.*` (complet) |
| `VotePanel.tsx` | Multiples clés vote/common |
| `VoteCartPanel.tsx` | `founderExpanded.*` (summary, deposits, fees, etc.) |
| `VoteMarket.tsx` | `founderExpanded.noVotesYet` |
| `FoundersTab.tsx` (Admin) | `admin.*` (loadingAtoms, graphqlError, etc.) |

**Nouvelles sections de traduction:**
- `refreshIndicator` : États de connexion temps réel
- `admin` : Interface d'administration complète
- Extensions `founderExpanded` : summary, deposits, entryFees, atomCreation, withdrawals, netTotal, etc.
