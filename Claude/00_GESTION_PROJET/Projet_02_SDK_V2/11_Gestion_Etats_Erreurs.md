# Gestion des états de chargement et feedback utilisateur

Une attention particulière doit être portée à la gestion des états asynchrones afin d'offrir une bonne expérience utilisateur durant le processus transactionnel.

---

## Les principaux états à gérer

### 1. Wallet en attente de signature

**Moment** : L'utilisateur a soumis le formulaire (création ou vote) et son wallet est ouvert en attente de confirmation.

**Indicateur Wagmi** : `isPending = true` sur la mutation tant que la transaction n'a pas été signée/envoyée.

**Action UI** :
- Griser ou désactiver le bouton déclencheur
- Afficher un libellé du type "En attente de confirmation du wallet..."
- Inciter l'utilisateur à valider dans MetaMask

```typescript
<button disabled={isPending}>
  {isPending ? 'En attente de confirmation...' : 'Créer'}
</button>
```

---

### 2. Transaction minée (confirmation réseau)

**Moment** : Après la signature, la transaction part sur le réseau. Il peut s'écouler quelques secondes (voire minutes) avant qu'elle soit incluse dans un bloc miné.

**Indicateur Wagmi** : `isLoading` (ou alias `isConfirming`) via `useWaitForTransactionReceipt` reste à `true` jusqu'à confirmation.

**Action UI** :
- Informer l'utilisateur que son action est en cours de traitement on-chain
- Afficher "Transaction en cours de validation sur le réseau..."

```typescript
{isConfirming && <p>Transaction en cours de validation...</p>}
```

---

### 3. Transaction finalisée avec succès

**Indicateur Wagmi** : `isSuccess` / `isConfirmed` à `true`

**Action UI** :
- Afficher un message de succès
- Exemples : "✅ Totem créé avec succès !" ou "✅ Vote pris en compte !"

```typescript
{isConfirmed && <p>✅ Transaction confirmée.</p>}
```

---

## Notification de succès/échec

En complément des messages inline dans la page, on peut intégrer un **système de notification** pour plus de visibilité.

### Intégration avec react-hot-toast

La combinaison de `useWaitForTransactionReceipt` avec une librairie comme `react-hot-toast` permet de notifier l'utilisateur dès que la transaction est validée ou en cas d'erreur.

```typescript
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

function useTransactionNotification(isSuccess, isError, error) {
  useEffect(() => {
    if (isSuccess) {
      toast.success('🎉 Totem créé !');
    }
    if (isError) {
      toast.error('❌ Transaction échouée');
    }
  }, [isSuccess, isError]);
}
```

C'est un choix UX facultatif mais apprécié, qui évite à l'utilisateur d'avoir les yeux rivés sur un statut.

---

## Gestion des erreurs

Plusieurs points peuvent échouer :
- L'utilisateur peut **annuler** la transaction dans son wallet
- La transaction peut être **refusée** (ex : revert du contrat ou manque de gas)

### Détection des erreurs

**Hook useWriteContract** : fournit directement un champ `error` exploitable

```typescript
const { error, writeContract } = useWriteContract();

// Affichage
{error && <p>Erreur: {error.shortMessage}</p>}
```

**Hook useWaitForTransactionReceipt** : donne un état `isError` si la transaction a été minée mais a échoué (status failed)

### Types d'erreurs courantes

| Type | Cause | Message suggéré |
|------|-------|-----------------|
| `UserRejectedRequestError` | L'utilisateur a annulé dans MetaMask | "Opération annulée" |
| Revert du contrat | Condition non respectée dans le smart contract | Message du contrat |
| Out of gas | Gas insuffisant | "Gas insuffisant pour la transaction" |
| Network error | Problème réseau | "Erreur de connexion au réseau" |

### Adaptation du message d'erreur

> « Si l'utilisateur refuse la transaction ou si le contrat génère une réversion, on peut afficher un message d'erreur à l'utilisateur »

Pour une meilleure UX, on peut filtrer le type d'erreur et adapter le texte :

```typescript
function getErrorMessage(error: Error): string {
  if (error.name === 'UserRejectedRequestError') {
    return 'Opération annulée';
  }
  if (error.message.includes('revert')) {
    return `Erreur du contrat: ${error.message}`;
  }
  return error.shortMessage || 'Une erreur est survenue';
}
```

Dans l'exemple Wagmi, ils affichent `error.shortMessage` (une version simplifiée de l'erreur fournie par Viem) si disponible.

### Réactivation de l'interface

L'important est de :
1. Rendre l'erreur **visible**
2. **Réactiver l'interface** pour permettre une nouvelle tentative si approprié

```typescript
{error && (
  <div className="error">
    <p>{getErrorMessage(error)}</p>
    <button onClick={() => reset()}>Réessayer</button>
  </div>
)}
```

---

## Tableau récapitulatif des états

| Phase | Indicateur | isPending | isLoading | isSuccess | isError |
|-------|------------|-----------|-----------|-----------|---------|
| Attente signature | Wallet ouvert | ✅ | - | - | - |
| Transaction envoyée | Hash obtenu | ❌ | ✅ | - | - |
| Minage en cours | Attente bloc | ❌ | ✅ | - | - |
| Succès | Confirmée | ❌ | ❌ | ✅ | - |
| Échec | Revert/Erreur | ❌ | ❌ | - | ✅ |

---

## Synthèse du flux utilisateur complet

### 1. Connexion du wallet

1. L'utilisateur ouvre l'application et clique sur "Connecter le wallet"
2. Via Wagmi (ou un composant RainbowKit), l'application se connecte à MetaMask
3. Une fois connecté, l'adresse de l'utilisateur est connue et affichée (confirmation de la connexion réussie)

### 2. Création d'un totem

1. L'utilisateur remplit un formulaire pour créer un nouveau totem (ex : en saisissant un titre/description et en choisissant une catégorie)
2. Il valide en cliquant "Créer"
3. L'application récupère les données du formulaire et appelle la fonction de contrat `createTotem` correspondante via `writeContract`
4. Le wallet demande alors à l'utilisateur de confirmer la transaction de création

### 3. Confirmation transaction création

- Tant que l'utilisateur n'a pas approuvé ou refusé dans son wallet, l'UI affiche un état "En attente de confirmation…"
- Dès qu'il confirme, le bouton "Créer" se grise et indique par exemple "Transaction en cours..."
- Le hash de transaction peut être affiché pour transparence
- L'application attend la confirmation réseau (minage du bloc) avec `useWaitForTransactionReceipt`

### 4. Résultat création

- Quand la transaction est confirmée on-chain, l'application notifie l'utilisateur que le totem est créé (message de succès, éventuellement toast de notification)
- Le formulaire de création peut être réinitialisé
- Si la transaction a échoué (ou a été rejetée), un message d'erreur s'affiche à la place (et le bouton "Créer" redevient actif pour réessayer)

### 5. Affichage des totems

- La liste des totems, incluant le nouveau, est affichée sur l'interface
- L'application peut utiliser un hook de lecture (`useReadContract`) ou écouter un événement pour mettre à jour la liste immédiatement après la création

### 6. Vote pour/contre

- Un utilisateur décide de voter sur un totem
- Il clique soit sur "Vote For 👍" soit "Vote Against 👎" associé au totem
- L'application appelle la fonction de vote du contrat avec le booléen correspondant
- Le wallet de l'utilisateur demande une confirmation de transaction de vote

### 7. Confirmation transaction vote

- Comme pour la création, l'UI indique que la transaction de vote est en cours
- Le bouton de vote cliqué est désactivé (et possiblement les deux boutons pour éviter plusieurs votes simultanés selon la logique du contrat)
- L'utilisateur confirme la transaction dans MetaMask, puis l'appli attend le minage via `useWaitForTransactionReceipt`

### 8. Résultat vote

- Quand le vote est enregistré on-chain, un message de succès apparaît ("Votre vote a bien été pris en compte")
- Les compteurs de votes pour/contre du totem peuvent être mis à jour (soit en recalculant via une lecture du contrat, soit en incrémentant localement si on a cette info)
- En cas d'échec ou de rejet utilisateur, un message d'erreur s'affiche et les boutons de vote redeviennent actifs pour permettre un nouvel essai

---

## En résumé

Chaque étape de l'interaction doit être accompagnée d'un feedback :
- Une **indication visuelle** pendant l'attente
- Une **confirmation** de la réussite
- Un **message d'erreur** clair si échec

Ceci évite que l'utilisateur ne soit perdu sans savoir si son action a été prise en compte ou non.

---

## Sources

- [Wagmi useWriteContract](https://wagmi.sh/react/hooks/useWriteContract)
- [Wagmi useWaitForTransactionReceipt](https://wagmi.sh/react/hooks/useWaitForTransactionReceipt)
- [Wagmi FAQ](https://wagmi.sh/react/faq)
- [Medium - Dive deep into Wagmi](https://medium.com/@salman.ashraf/dive-deep-into-wagmi-the-definitive-guide-for-web3-developers-9f804c8eb5a4)
