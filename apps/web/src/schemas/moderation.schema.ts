import { z } from 'zod';

/**
 * Moderation action types
 */
export const ModerationActionSchema = z.enum([
  'APPROVE',
  'REJECT',
  'FLAG',
  'REVIEW',
]);

export type ModerationAction = z.infer<typeof ModerationActionSchema>;

/**
 * Moderation reason categories
 */
export const ModerationReasonSchema = z.enum([
  'INAPPROPRIATE_CONTENT',
  'SPAM',
  'DUPLICATE',
  'OFF_TOPIC',
  'LOW_QUALITY',
  'OTHER',
]);

export type ModerationReason = z.infer<typeof ModerationReasonSchema>;

/**
 * Schema for moderation decision
 */
export const ModerationDecisionSchema = z.object({
  proposalId: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'ID de proposition invalide'),

  action: ModerationActionSchema,

  reason: ModerationReasonSchema.optional(),

  comment: z
    .string()
    .max(500, 'Commentaire trop long (max 500 caractères)')
    .optional(),

  moderatorAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide'),
});

export type ModerationDecision = z.infer<typeof ModerationDecisionSchema>;

/**
 * Schema for reporting content
 */
export const ContentReportSchema = z.object({
  contentId: z.string().regex(/^0x[a-fA-F0-9]+$/, 'ID de contenu invalide'),

  contentType: z.enum(['PROPOSAL', 'TOTEM', 'COMMENT']),

  reason: ModerationReasonSchema,

  description: z
    .string()
    .min(10, 'Description trop courte (min 10 caractères)')
    .max(1000, 'Description trop longue (max 1000 caractères)'),

  reporterAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide'),
});

export type ContentReport = z.infer<typeof ContentReportSchema>;
