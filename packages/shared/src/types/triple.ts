/**
 * Représente un Triple INTUITION (Founder -> represented_by -> Totem)
 */
export interface Triple {
  id: string;
  subjectId: string; // ID du fondateur (Atom)
  predicateId: string; // ID du prédicat "represented_by" (Atom)
  objectId: string; // ID du totem (Atom)
  vaultId: string; // ID du vault FOR (contient les votes)
  totalTrust: string; // Montant total de $TRUST déposé (en wei)
  voterCount: number; // Nombre de votants uniques
  createdAt: string; // Date de création du Triple
  creator: string; // Adresse du créateur
}

/**
 * Représente un vote (deposit) sur un Triple
 */
export interface Vote {
  id: string;
  tripleId: string;
  voter: string; // Adresse du votant
  amount: string; // Montant en $TRUST (en wei)
  timestamp: string;
  transactionHash: string;
}
