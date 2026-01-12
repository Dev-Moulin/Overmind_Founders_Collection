/**
 * Protocol configuration types
 */

/**
 * Configuration du protocole INTUITION
 */
export interface ProtocolConfig {
  // Coûts de base (wei)
  atomCost: string;
  tripleCost: string;
  minDeposit: string;

  // Coûts formatés (TRUST) - cleaned up for DISPLAY only
  formattedAtomCost: string;
  formattedTripleCost: string;
  formattedMinDeposit: string;

  // EXACT values (not truncated) - use these for calculations and preset buttons
  exactFormattedTripleCost: string;
  exactFormattedMinDeposit: string;
  exactMinForNewTriple: string; // tripleBaseCost + minDeposit = what user needs for new triple

  // Frais (basis points, ex: 700 = 7%)
  entryFee: string;
  exitFee: string;
  protocolFee: string;
  feeDenominator: string;

  // Frais formatés (pourcentage)
  formattedEntryFee: string;
  formattedExitFee: string;
  formattedProtocolFee: string;
}
