/**
 * Types de totems possibles
 */
export type TotemType = 'animal' | 'objet' | 'trait' | 'univers';

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
