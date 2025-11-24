import { z } from 'zod';

/**
 * Ethereum address validation schema
 */
export const EthereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide');

export type EthereumAddress = z.infer<typeof EthereumAddressSchema>;

/**
 * Hex string validation schema
 */
export const HexStringSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]+$/, 'Format hexadécimal invalide');

export type HexString = z.infer<typeof HexStringSchema>;

/**
 * Transaction hash validation schema
 */
export const TransactionHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Hash de transaction invalide');

export type TransactionHash = z.infer<typeof TransactionHashSchema>;

/**
 * TRUST amount validation (as string for precision)
 */
export const TrustAmountSchema = z
  .string()
  .refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    { message: 'Montant invalide' }
  );

export type TrustAmount = z.infer<typeof TrustAmountSchema>;
