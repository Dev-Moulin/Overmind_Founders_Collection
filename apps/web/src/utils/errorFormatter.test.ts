import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatError,
  isUserRejection,
  isRetryableError,
} from './errorFormatter';

describe('errorFormatter', () => {
  // Mock console.error to avoid noise in test output
  const originalConsoleError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('formatError', () => {
    describe('wallet errors', () => {
      it('should format user rejection error', () => {
        const error = new Error('User rejected the request');
        const result = formatError(error);

        expect(result.title).toBe('Transaction annulée');
        expect(result.message).toContain('annulé');
        expect(result.canRetry).toBe(true);
      });

      it('should format insufficient funds error', () => {
        const error = new Error('insufficient funds for gas');
        const result = formatError(error);

        expect(result.title).toBe('Solde insuffisant');
        expect(result.message).toContain('fonds');
        expect(result.action).toContain('ETH');
        expect(result.canRetry).toBe(false);
      });

      it('should format wrong network error', () => {
        const error = new Error('wrong network connected');
        const result = formatError(error);

        expect(result.title).toBe('Mauvais réseau');
        expect(result.message).toContain('Base Sepolia');
        expect(result.canRetry).toBe(true);
      });

      it('should format wallet locked error', () => {
        const error = new Error('wallet is locked');
        const result = formatError(error);

        expect(result.title).toBe('Wallet verrouillé');
        expect(result.canRetry).toBe(true);
      });

      it('should format not connected error', () => {
        const error = new Error('not connected to wallet');
        const result = formatError(error);

        expect(result.title).toBe('Wallet non connecté');
        expect(result.canRetry).toBe(false);
      });
    });

    describe('smart contract errors', () => {
      it('should format execution reverted error', () => {
        const error = new Error('execution reverted');
        const result = formatError(error);

        expect(result.title).toBe('Transaction échouée');
        expect(result.message).toContain('smart contract');
        expect(result.canRetry).toBe(true);
      });

      it('should format invalid parameters error', () => {
        const error = new Error('invalid parameters provided');
        const result = formatError(error);

        expect(result.title).toBe('Paramètres invalides');
        expect(result.canRetry).toBe(false);
      });

      it('should format permission denied error', () => {
        const error = new Error('permission denied');
        const result = formatError(error);

        expect(result.title).toBe('Permission refusée');
        expect(result.canRetry).toBe(false);
      });
    });

    describe('network errors', () => {
      it('should format timeout error', () => {
        const error = new Error('request timed out');
        const result = formatError(error);

        expect(result.title).toBe('Délai expiré');
        expect(result.message).toContain('temps');
        expect(result.canRetry).toBe(true);
      });

      it('should format network error', () => {
        const error = new Error('network error occurred');
        const result = formatError(error);

        expect(result.title).toBe('Erreur réseau');
        expect(result.canRetry).toBe(true);
      });

      it('should format RPC error', () => {
        const error = new Error('rpc error: connection failed');
        const result = formatError(error);

        expect(result.title).toBe('Erreur RPC');
        expect(result.canRetry).toBe(true);
      });
    });

    describe('GraphQL errors', () => {
      it('should format GraphQL query error', () => {
        const error = new Error('GraphQL query failed');
        const result = formatError(error);

        expect(result.title).toBe('Erreur de chargement');
        expect(result.canRetry).toBe(true);
      });

      it('should format not found error', () => {
        const error = new Error('Resource not found (404)');
        const result = formatError(error);

        expect(result.title).toBe('Donnée introuvable');
        expect(result.canRetry).toBe(false);
      });

      it('should format rate limit error', () => {
        const error = new Error('rate limit exceeded');
        const result = formatError(error);

        expect(result.title).toBe('Limite atteinte');
        expect(result.message).toContain('requêtes');
        expect(result.canRetry).toBe(true);
      });
    });

    describe('INTUITION SDK errors', () => {
      it('should format atom creation error', () => {
        const error = new Error('atom creation failed');
        const result = formatError(error);

        expect(result.title).toBe("Création d'atome échouée");
        expect(result.canRetry).toBe(true);
      });

      it('should format triple creation error', () => {
        const error = new Error('triple creation failed');
        const result = formatError(error);

        expect(result.title).toBe('Création de triple échouée');
        expect(result.canRetry).toBe(true);
      });

      it('should format vault deposit error', () => {
        const error = new Error('vault deposit failed');
        const result = formatError(error);

        expect(result.title).toBe('Dépôt échoué');
        expect(result.canRetry).toBe(true);
      });

      it('should format IPFS upload error', () => {
        const error = new Error('ipfs upload failed');
        const result = formatError(error);

        expect(result.title).toBe('Upload IPFS échoué');
        expect(result.canRetry).toBe(true);
      });
    });

    describe('unknown errors', () => {
      it('should format unknown Error object', () => {
        const error = new Error('Some unknown error message');
        const result = formatError(error);

        expect(result.title).toBe('Erreur inattendue');
        expect(result.message).toContain('inattendue');
        expect(result.canRetry).toBe(true);
      });

      it('should format string error', () => {
        const error = 'Something went wrong';
        const result = formatError(error);

        expect(result.title).toBe('Erreur inattendue');
        expect(result.canRetry).toBe(true);
      });

      it('should format object with message property', () => {
        const error = { message: 'Custom error object' };
        const result = formatError(error);

        expect(result.title).toBe('Erreur inattendue');
        expect(result.canRetry).toBe(true);
      });

      it('should format null/undefined', () => {
        const result1 = formatError(null);
        const result2 = formatError(undefined);

        expect(result1.title).toBe('Erreur inattendue');
        expect(result2.title).toBe('Erreur inattendue');
      });
    });

    describe('error logging', () => {
      it('should log error to console', () => {
        const error = new Error('Test error');
        formatError(error);

        expect(console.error).toHaveBeenCalledWith('[Error]', error);
      });
    });
  });

  describe('isUserRejection', () => {
    it('should return true for user rejection errors', () => {
      expect(isUserRejection(new Error('User rejected request'))).toBe(true);
      expect(isUserRejection(new Error('user denied transaction'))).toBe(true);
      expect(isUserRejection(new Error('User cancelled the operation'))).toBe(
        true
      );
    });

    it('should return false for non-rejection errors', () => {
      expect(isUserRejection(new Error('insufficient funds'))).toBe(false);
      expect(isUserRejection(new Error('network error'))).toBe(false);
      expect(isUserRejection('some other error')).toBe(false);
    });

    it('should handle non-Error types', () => {
      expect(isUserRejection('user rejected')).toBe(true);
      expect(isUserRejection(null)).toBe(false);
      expect(isUserRejection(undefined)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      expect(isRetryableError(new Error('User rejected request'))).toBe(true);
      expect(isRetryableError(new Error('timeout occurred'))).toBe(true);
      expect(isRetryableError(new Error('network error'))).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      expect(isRetryableError(new Error('insufficient funds'))).toBe(false);
      expect(isRetryableError(new Error('permission denied'))).toBe(false);
      expect(isRetryableError(new Error('invalid parameters'))).toBe(false);
    });

    it('should default to true for unknown errors', () => {
      expect(isRetryableError(new Error('unknown error xyz'))).toBe(true);
    });
  });
});
