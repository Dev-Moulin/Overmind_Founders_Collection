import { z } from 'zod';

/**
 * Totem types enum
 */
export const TotemTypeSchema = z.enum(['Object', 'Animal', 'Trait', 'Universe']);
export type TotemType = z.infer<typeof TotemTypeSchema>;

/**
 * Schema for totem proposal form
 */
export const TotemProposalSchema = z.object({
  founderId: z.string().min(1, 'Fondateur requis'),

  totemName: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(50, 'Maximum 50 caractères')
    .regex(
      /^[a-zA-Z0-9\s\-'àâäéèêëïîôùûüç]+$/,
      'Caractères alphanumériques uniquement'
    ),

  predicate: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(50, 'Maximum 50 caractères'),

  description: z
    .string()
    .min(10, 'Minimum 10 caractères')
    .max(500, 'Maximum 500 caractères')
    .optional(),

  trustAmount: z
    .string()
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Montant doit être supérieur à 0' }
    ),
});

export type TotemProposal = z.infer<typeof TotemProposalSchema>;

/**
 * Schema for image file validation
 */
export const ImageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 5 * 1024 * 1024, {
    message: 'Image trop volumineuse (max 5MB)',
  })
  .refine(
    (file) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
    { message: 'Format accepté: JPG, PNG, WebP ou GIF' }
  )
  .optional();

export type ImageFile = z.infer<typeof ImageFileSchema>;
