/**
 * Formatted error for user display
 */
export interface FormattedError {
  title: string;
  message: string;
  action?: string;
  canRetry: boolean;
}

/**
 * Error patterns to match against error messages
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp | string;
  title: string;
  message: string;
  action?: string;
  canRetry: boolean;
}> = [
  // Wallet Errors
  {
    pattern: /user rejected|user denied|user cancelled/i,
    title: 'Transaction annulée',
    message: 'Vous avez annulé la transaction dans votre wallet.',
    canRetry: true,
  },
  {
    pattern: /insufficient funds|insufficient balance/i,
    title: 'Solde insuffisant',
    message:
      "Vous n'avez pas assez de fonds pour payer les frais de transaction.",
    action: 'Ajoutez des ETH à votre wallet sur Base Sepolia.',
    canRetry: false,
  },
  {
    pattern: /wrong network|unsupported chain/i,
    title: 'Mauvais réseau',
    message: 'Veuillez vous connecter au réseau Base Sepolia dans votre wallet.',
    action: 'Changez de réseau et réessayez.',
    canRetry: true,
  },
  {
    pattern: /wallet is locked/i,
    title: 'Wallet verrouillé',
    message: 'Votre wallet est verrouillé.',
    action: 'Déverrouillez votre wallet et réessayez.',
    canRetry: true,
  },
  {
    pattern: /not connected|no wallet/i,
    title: 'Wallet non connecté',
    message: 'Veuillez connecter votre wallet pour continuer.',
    canRetry: false,
  },

  // Smart Contract Errors
  {
    pattern: /execution reverted/i,
    title: 'Transaction échouée',
    message:
      'La transaction a été rejetée par le smart contract. Vérifiez les paramètres et réessayez.',
    canRetry: true,
  },
  {
    pattern: /invalid parameters/i,
    title: 'Paramètres invalides',
    message: 'Les paramètres fournis sont invalides.',
    canRetry: false,
  },
  {
    pattern: /permission denied|not authorized/i,
    title: 'Permission refusée',
    message: "Vous n'avez pas la permission d'effectuer cette action.",
    canRetry: false,
  },

  // Network Errors
  {
    pattern: /timeout|timed out/i,
    title: 'Délai expiré',
    message: 'La transaction a pris trop de temps.',
    action: 'Vérifiez votre connexion et réessayez.',
    canRetry: true,
  },
  {
    pattern: /network error|failed to fetch/i,
    title: 'Erreur réseau',
    message: 'Impossible de se connecter au réseau.',
    action: 'Vérifiez votre connexion internet et réessayez.',
    canRetry: true,
  },
  {
    pattern: /rpc error/i,
    title: 'Erreur RPC',
    message: 'Erreur de communication avec le réseau blockchain.',
    canRetry: true,
  },

  // GraphQL Errors
  {
    pattern: /graphql|query failed/i,
    title: 'Erreur de chargement',
    message: 'Impossible de charger les données.',
    canRetry: true,
  },
  {
    pattern: /not found|404/i,
    title: 'Donnée introuvable',
    message: "La donnée demandée n'existe pas ou n'a pas été trouvée.",
    canRetry: false,
  },
  {
    pattern: /rate limit/i,
    title: 'Limite atteinte',
    message: 'Trop de requêtes. Veuillez attendre un moment.',
    canRetry: true,
  },

  // INTUITION SDK Errors
  {
    pattern: /atom creation failed/i,
    title: "Création d'atome échouée",
    message: "Impossible de créer l'atome sur INTUITION.",
    canRetry: true,
  },
  {
    pattern: /triple creation failed/i,
    title: 'Création de triple échouée',
    message: 'Impossible de créer le triple sur INTUITION.',
    canRetry: true,
  },
  {
    pattern: /vault deposit failed/i,
    title: 'Dépôt échoué',
    message: 'Impossible de déposer dans le vault.',
    canRetry: true,
  },
  {
    pattern: /ipfs upload failed/i,
    title: 'Upload IPFS échoué',
    message: "Impossible d'uploader l'image sur IPFS.",
    canRetry: true,
  },
];

/**
 * Format an error into a user-friendly message
 *
 * @param error - The error to format (Error object, string, or unknown)
 * @returns Formatted error with title, message, optional action, and retry flag
 *
 * @example
 * ```ts
 * try {
 *   await sendTransaction();
 * } catch (err) {
 *   const formatted = formatError(err);
 *   console.log(formatted.title); // "Transaction annulée"
 *   console.log(formatted.message); // "Vous avez annulé..."
 * }
 * ```
 */
export function formatError(error: Error | unknown): FormattedError {
  // Get error message string
  let errorMessage = '';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as { message: unknown }).message);
  } else {
    errorMessage = 'Unknown error';
  }

  // Log technical error to console for debugging
  console.error('[Error]', error);

  // Try to match error against known patterns
  for (const pattern of ERROR_PATTERNS) {
    const matches =
      typeof pattern.pattern === 'string'
        ? errorMessage.includes(pattern.pattern)
        : pattern.pattern.test(errorMessage);

    if (matches) {
      return {
        title: pattern.title,
        message: pattern.message,
        action: pattern.action,
        canRetry: pattern.canRetry,
      };
    }
  }

  // Default error message for unknown errors
  return {
    title: 'Erreur inattendue',
    message:
      "Une erreur inattendue s'est produite. Veuillez réessayer ou contacter le support.",
    action: errorMessage.length < 100 ? errorMessage : undefined,
    canRetry: true,
  };
}

/**
 * Check if an error is a user rejection (cancelled transaction)
 *
 * @param error - The error to check
 * @returns true if the error is a user rejection
 */
export function isUserRejection(error: unknown): boolean {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  return /user rejected|user denied|user cancelled/i.test(errorMessage);
}

/**
 * Check if an error is retryable
 *
 * @param error - The error to check
 * @returns true if the error can be retried
 */
export function isRetryableError(error: unknown): boolean {
  return formatError(error).canRetry;
}
