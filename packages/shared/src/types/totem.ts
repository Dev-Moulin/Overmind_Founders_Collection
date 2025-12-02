/**
 * Totem category types (matching categories.json IDs)
 */
export type TotemType = 'animal' | 'object' | 'trait' | 'concept' | 'element' | 'mythology';

/**
 * Représente un totem proposé pour un fondateur
 */
export interface Totem {
  id: string;
  name: string;
  type: TotemType;
  description: string;
  image?: string;
  atomId?: string; // ID de l'Atom INTUITION
}
