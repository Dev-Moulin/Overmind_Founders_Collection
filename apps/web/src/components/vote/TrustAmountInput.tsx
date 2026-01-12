import { formatEther } from 'viem';
import { PresetButtons } from './PresetButtons';
import { truncateAmount } from '../../utils/formatters';

/**
 * TrustAmountInput - Input pour le montant TRUST avec validation (Step 3)
 * Extrait de VotePanel.tsx lignes 988-1029
 *
 * Phase 6: Ajout PresetButtons pour sélection rapide
 */

interface ProtocolConfig {
  formattedMinDeposit: string;
  formattedEntryFee: string;
}

interface TrustAmountInputProps {
  value: string;
  onChange: (value: string) => void;
  balance: bigint | undefined;
  protocolConfig: ProtocolConfig | null;
  configLoading: boolean;
  isDepositValid: (amount: string) => boolean;
}

export function TrustAmountInput({
  value,
  onChange,
  balance,
  protocolConfig,
  configLoading,
  isDepositValid,
}: TrustAmountInputProps) {
  // Format balance for PresetButtons
  const formattedBalance = balance !== undefined
    ? truncateAmount(Number(formatEther(balance)))
    : undefined;

  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-white/70 mb-3">3. Montant TRUST</h4>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={protocolConfig?.formattedMinDeposit || '0.001'}
          step="0.001"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-slate-500/50"
        />
        <span className="text-white/60">TRUST</span>
      </div>

      {/* Preset buttons for quick amount selection */}
      {protocolConfig && formattedBalance && (
        <PresetButtons
          value={value}
          onChange={onChange}
          balance={formattedBalance}
          minAmount={protocolConfig.formattedMinDeposit}
          className="mt-3"
        />
      )}

      <div className="text-xs text-white/40 mt-2 space-y-1">
        <p>Balance: {balance !== undefined ? `${truncateAmount(Number(formatEther(balance)), 3)} TRUST` : 'Chargement...'}</p>
        {configLoading ? (
          <p>Chargement config protocole...</p>
        ) : protocolConfig ? (
          <>
            <p className="flex items-center gap-2">
              Minimum requis: {protocolConfig.formattedMinDeposit} TRUST
              {!isDepositValid(value) && value && (
                <button
                  type="button"
                  onClick={() => onChange(protocolConfig.formattedMinDeposit)}
                  className="text-slate-400 hover:text-slate-300 underline"
                >
                  Mettre au minimum
                </button>
              )}
            </p>
            <p>Frais d'entrée: {protocolConfig.formattedEntryFee}</p>
            {!isDepositValid(value) && value && parseFloat(value) > 0 && (
              <p className="text-red-400 font-medium">
                Montant inférieur au minimum ({protocolConfig.formattedMinDeposit} TRUST)
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
