/**
 * Type guards and utilities for handling potentially null GraphQL triple data
 *
 * The INTUITION GraphQL API can return triples with null object/subject/predicate
 * due to data integrity issues. These utilities provide a centralized way to
 * filter and validate triple data before use.
 *
 * @example
 * ```ts
 * // Filter invalid triples from an array
 * const validTriples = filterValidTriples(rawTriples);
 *
 * // Check a single triple
 * if (isValidTriple(triple)) {
 *   // TypeScript now knows triple.object is not null
 *   console.log(triple.object.term_id);
 * }
 * ```
 */

/**
 * Base triple structure from GraphQL (with potentially null fields)
 */
export interface RawTriple {
  term_id: string;
  __typename?: string;
  subject?: {
    term_id: string;
    label: string;
    image?: string;
    emoji?: string;
  } | null;
  predicate?: {
    term_id: string;
    label: string;
    image?: string;
    emoji?: string;
  } | null;
  object?: {
    term_id: string;
    label: string;
    image?: string;
    emoji?: string;
    description?: string;
  } | null;
  votes?: {
    forVotes: string;
    againstVotes: string;
    netVotes: string;
  } | null;
  triple_vault?: {
    total_assets: string;
  } | null;
  counter_term?: {
    id: string;
    total_assets: string;
  } | null;
}

/**
 * Valid triple with guaranteed non-null subject, predicate, and object
 */
export interface ValidTriple {
  term_id: string;
  __typename?: string;
  subject: {
    term_id: string;
    label: string;
    image?: string;
    emoji?: string;
  };
  predicate: {
    term_id: string;
    label: string;
    image?: string;
    emoji?: string;
  };
  object: {
    term_id: string;
    label: string;
    image?: string;
    emoji?: string;
    description?: string;
  };
  votes?: {
    forVotes: string;
    againstVotes: string;
    netVotes: string;
  } | null;
  triple_vault?: {
    total_assets: string;
  } | null;
  counter_term?: {
    id: string;
    total_assets: string;
  } | null;
}

/**
 * Type guard to check if a triple has valid subject, predicate, and object
 *
 * @param triple - Raw triple from GraphQL
 * @returns true if triple has non-null subject, predicate, and object with term_ids
 */
export function isValidTriple(triple: RawTriple): triple is ValidTriple {
  return (
    triple.subject !== null &&
    triple.subject !== undefined &&
    typeof triple.subject.term_id === 'string' &&
    triple.predicate !== null &&
    triple.predicate !== undefined &&
    typeof triple.predicate.term_id === 'string' &&
    triple.object !== null &&
    triple.object !== undefined &&
    typeof triple.object.term_id === 'string'
  );
}

/**
 * Check if a triple has a valid object (minimum requirement for many operations)
 */
export function hasValidObject(triple: RawTriple): boolean {
  return (
    triple.object !== null &&
    triple.object !== undefined &&
    typeof triple.object.term_id === 'string'
  );
}

/**
 * Filter an array of triples to only include valid ones
 *
 * @param triples - Array of raw triples from GraphQL
 * @param _source - Optional source identifier (unused, kept for API compatibility)
 * @returns Array of valid triples with guaranteed non-null fields
 */
export function filterValidTriples(
  triples: RawTriple[],
  _source?: string
): ValidTriple[] {
  return triples.filter((triple): triple is ValidTriple => isValidTriple(triple));
}

/**
 * Filter triples that have at least a valid object
 * Use this when you only need to access object properties
 *
 * @param triples - Array of raw triples
 * @param source - Optional source identifier for logging
 * @returns Array of triples with valid object
 */
export function filterTriplesWithValidObject<T extends RawTriple>(
  triples: T[],
  source?: string
): T[] {
  return triples.filter((triple) => {
    if (!hasValidObject(triple)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[${source || 'tripleGuards'}] Skipping triple with null object:`,
          triple.term_id
        );
      }
      return false;
    }
    return true;
  });
}

/**
 * Safe accessor for triple object term_id
 * Returns undefined if object is null
 */
export function getObjectTermId(triple: RawTriple): string | undefined {
  return triple.object?.term_id;
}

/**
 * Safe accessor for triple object label
 * Returns fallback if object is null
 */
export function getObjectLabel(triple: RawTriple, fallback = 'Unknown'): string {
  return triple.object?.label ?? fallback;
}
