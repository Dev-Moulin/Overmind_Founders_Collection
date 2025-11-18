/**
 * Représente un fondateur de l'écosystème INTUITION
 */
export interface Founder {
  id: string;
  name: string;
  description?: string;
  atomId?: string; // ID de l'Atom INTUITION
  image?: string;
}
