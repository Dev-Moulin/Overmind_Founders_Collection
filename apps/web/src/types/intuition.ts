/**
 * Intuition protocol operation types
 */

import type { Hex } from 'viem';

/**
 * Type for categories.json config structure
 * Updated for 3-triple system
 */
export interface CategoryConfig {
  predicate: {
    id: string;
    label: string;
    description: string;
    termId: string | null; // Created by admin
  };
  tagPredicate: {
    id: string;
    label: string;
    description: string;
    termId: string | null; // Created by admin
  };
  systemObject: {
    id: string;
    label: string;
    description: string;
    termId: string | null; // Created by admin
  };
  categories: Array<{
    id: string;
    label: string;
    name: string;
    termId: string | null; // Created by admin
  }>;
}

/**
 * Result of creating an atom
 */
export interface CreateAtomResult {
  uri: string;
  transactionHash: string;
  termId: Hex;
}

/**
 * Result of creating a triple (claim)
 */
export interface CreateTripleResult {
  transactionHash: string;
  tripleId: Hex;
  subjectId: Hex;
  predicateId: Hex;
  objectId: Hex;
}

/**
 * Data for founder atom creation
 */
export interface FounderData {
  name: string;
  shortBio: string;
  fullBio?: string;
  twitter?: string | null;
  linkedin?: string | null;
  github?: string | null;
  image?: string;
}

/**
 * Custom error for when a claim already exists
 * Contains the existing triple info so UI can redirect to vote page
 */
export class ClaimExistsError extends Error {
  public readonly termId: Hex;
  public readonly counterTermId?: Hex;
  public readonly subjectLabel: string;
  public readonly predicateLabel: string;
  public readonly objectLabel: string;
  public readonly forVotes?: string;
  public readonly againstVotes?: string;

  constructor(data: {
    termId: Hex;
    counterTermId?: Hex;
    subjectLabel: string;
    predicateLabel: string;
    objectLabel: string;
    forVotes?: string;
    againstVotes?: string;
  }) {
    super(
      `Ce claim existe déjà : "${data.subjectLabel} ${data.predicateLabel} ${data.objectLabel}". ` +
      `Vous pouvez voter dessus au lieu de le recréer.`
    );
    this.name = 'ClaimExistsError';
    this.termId = data.termId;
    this.counterTermId = data.counterTermId;
    this.subjectLabel = data.subjectLabel;
    this.predicateLabel = data.predicateLabel;
    this.objectLabel = data.objectLabel;
    this.forVotes = data.forVotes;
    this.againstVotes = data.againstVotes;
  }
}
