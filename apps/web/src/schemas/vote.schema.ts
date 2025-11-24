import { z } from 'zod';

/**
 * Minimum TRUST amount for deposits (INTUITION protocol requirement)
 */
export const MIN_TRUST_AMOUNT = 1;

/**
 * Schema for vote form
 */
export const VoteFormSchema = z.object({
  claimId: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'ID de claim invalide'),

  amount: z
    .string()
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= MIN_TRUST_AMOUNT;
      },
      { message: `Montant minimum: ${MIN_TRUST_AMOUNT} TRUST` }
    ),

  isFor: z.boolean(),
});

export type VoteForm = z.infer<typeof VoteFormSchema>;

/**
 * Schema for withdraw form
 */
export const WithdrawFormSchema = z.object({
  termId: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'ID de term invalide'),

  shares: z
    .string()
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Shares doit être supérieur à 0' }
    ),

  isPositive: z.boolean(),
});

export type WithdrawForm = z.infer<typeof WithdrawFormSchema>;
