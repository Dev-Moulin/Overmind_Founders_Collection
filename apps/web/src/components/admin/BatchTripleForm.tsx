/**
 * BatchTripleForm - Form for creating multiple triples in a single transaction
 *
 * Allows admin to add multiple triples, validate them, and submit in batch.
 * Shows cost estimation and validation errors.
 *
 * @see Phase 8 in TODO_Implementation.md
 */

import { useState, useCallback, useMemo } from 'react';
import { type Hex, parseEther } from 'viem';
import {
  useBatchTriples,
  type BatchTripleItem,
  type TripleValidation,
  type BatchTripleCost,
} from '../../hooks';
import { useProtocolConfig } from '../../hooks';

/**
 * Form item with UI state
 */
interface FormItem {
  id: string;
  subjectId: string;
  predicateId: string;
  objectId: string;
  depositAmount: string;
  validation?: TripleValidation;
}

/**
 * Create a new empty form item
 */
function createEmptyItem(): FormItem {
  return {
    id: crypto.randomUUID(),
    subjectId: '',
    predicateId: '',
    objectId: '',
    depositAmount: '',
  };
}

export function BatchTripleForm() {
  const {
    createBatch,
    validateItems,
    estimateCost,
    loading,
    validating,
    error,
    clearError,
  } = useBatchTriples();

  const { config: protocolConfig, loading: configLoading } = useProtocolConfig();

  // Form state
  const [items, setItems] = useState<FormItem[]>([createEmptyItem()]);
  const [costEstimate, setCostEstimate] = useState<BatchTripleCost | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Add a new empty item
   */
  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createEmptyItem()]);
    setCostEstimate(null);
  }, []);

  /**
   * Remove an item by id
   */
  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      // Keep at least one item
      return filtered.length > 0 ? filtered : [createEmptyItem()];
    });
    setCostEstimate(null);
  }, []);

  /**
   * Update an item field
   */
  const updateItem = useCallback(
    (id: string, field: keyof FormItem, value: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value, validation: undefined } : item
        )
      );
      setCostEstimate(null);
    },
    []
  );

  /**
   * Convert form items to batch items
   */
  const toBatchItems = useCallback((formItems: FormItem[]): BatchTripleItem[] => {
    return formItems
      .filter(
        (item) =>
          item.subjectId.startsWith('0x') &&
          item.predicateId.startsWith('0x') &&
          item.objectId.startsWith('0x')
      )
      .map((item) => ({
        subjectId: item.subjectId as Hex,
        predicateId: item.predicateId as Hex,
        objectId: item.objectId as Hex,
        depositAmount: item.depositAmount
          ? parseEther(item.depositAmount)
          : undefined,
      }));
  }, []);

  /**
   * Check if form is valid
   */
  const isFormValid = useMemo(() => {
    return items.every(
      (item) =>
        item.subjectId.startsWith('0x') &&
        item.subjectId.length === 66 &&
        item.predicateId.startsWith('0x') &&
        item.predicateId.length === 66 &&
        item.objectId.startsWith('0x') &&
        item.objectId.length === 66
    );
  }, [items]);

  /**
   * Check if any items have validation errors
   */
  const hasValidationErrors = useMemo(() => {
    return items.some((item) => item.validation?.exists || item.validation?.error);
  }, [items]);

  /**
   * Validate all items
   */
  const handleValidate = useCallback(async () => {
    clearError();
    setSuccess(null);

    const batchItems = toBatchItems(items);
    if (batchItems.length === 0) return;

    try {
      const validations = await validateItems(batchItems);

      // Update items with validation results
      setItems((prev) => {
        const newItems = [...prev];
        validations.forEach((validation) => {
          // Find the corresponding form item
          const validBatchIndex = validation.index;
          let batchIndex = 0;
          for (let i = 0; i < newItems.length; i++) {
            const item = newItems[i];
            if (
              item.subjectId.startsWith('0x') &&
              item.predicateId.startsWith('0x') &&
              item.objectId.startsWith('0x')
            ) {
              if (batchIndex === validBatchIndex) {
                newItems[i] = { ...item, validation };
                break;
              }
              batchIndex++;
            }
          }
        });
        return newItems;
      });

      // Estimate cost
      const cost = await estimateCost(batchItems);
      setCostEstimate(cost);
    } catch (err) {
      console.error('[BatchTripleForm] Validation error:', err);
    }
  }, [items, toBatchItems, validateItems, estimateCost, clearError]);

  /**
   * Submit batch creation
   */
  const handleSubmit = useCallback(async () => {
    if (!isFormValid || hasValidationErrors) return;

    clearError();
    setSuccess(null);

    const batchItems = toBatchItems(items);
    if (batchItems.length === 0) return;

    try {
      const result = await createBatch(batchItems);
      setSuccess(
        `${result.tripleCount} triples créés avec succès! TX: ${result.transactionHash.slice(0, 10)}...`
      );
      // Reset form
      setItems([createEmptyItem()]);
      setCostEstimate(null);
    } catch (err) {
      console.error('[BatchTripleForm] Submit error:', err);
    }
  }, [items, toBatchItems, isFormValid, hasValidationErrors, createBatch, clearError]);

  /**
   * Clear all items
   */
  const handleClear = useCallback(() => {
    setItems([createEmptyItem()]);
    setCostEstimate(null);
    setSuccess(null);
    clearError();
  }, [clearError]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Batch Triple Creation</h2>
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={addItem}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            + Add Triple
          </button>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-green-400">{success}</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-red-400">{error.message}</span>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border ${
              item.validation?.exists || item.validation?.error
                ? 'bg-red-500/10 border-red-500/30'
                : item.validation && !item.validation.error
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-white/5 border-white/10'
            }`}
          >
            {/* Item header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/60">
                Triple #{index + 1}
              </span>
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Validation error */}
            {item.validation?.error && (
              <div className="mb-3 p-2 bg-red-500/20 rounded text-sm text-red-400">
                {item.validation.error}
                {item.validation.existingTermId && (
                  <span className="block mt-1 text-xs text-red-300/80">
                    Existing ID: {item.validation.existingTermId.slice(0, 20)}...
                  </span>
                )}
              </div>
            )}

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">
                  Subject ID
                </label>
                <input
                  type="text"
                  value={item.subjectId}
                  onChange={(e) => updateItem(item.id, 'subjectId', e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">
                  Predicate ID
                </label>
                <input
                  type="text"
                  value={item.predicateId}
                  onChange={(e) => updateItem(item.id, 'predicateId', e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">
                  Object ID
                </label>
                <input
                  type="text"
                  value={item.objectId}
                  onChange={(e) => updateItem(item.id, 'objectId', e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Deposit amount (optional) */}
            <div className="mt-3">
              <label className="block text-xs text-white/60 mb-1">
                Deposit Amount (optional, uses min if empty)
              </label>
              <input
                type="text"
                value={item.depositAmount}
                onChange={(e) => updateItem(item.id, 'depositAmount', e.target.value)}
                placeholder={protocolConfig?.formattedMinDeposit || '0.0001'}
                className="w-full md:w-1/3 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Cost estimation */}
      {costEstimate && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h3 className="text-sm font-medium text-blue-400 mb-2">
            Estimation des coûts
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="block text-white/60">Coût base/triple</span>
              <span className="text-white">{costEstimate.formatted.baseCostPerTriple} tTRUST</span>
            </div>
            <div>
              <span className="block text-white/60">Total base</span>
              <span className="text-white">{costEstimate.formatted.totalBaseCost} tTRUST</span>
            </div>
            <div>
              <span className="block text-white/60">Total dépôts</span>
              <span className="text-white">{costEstimate.formatted.totalDeposits} tTRUST</span>
            </div>
            <div>
              <span className="block text-white/60 font-medium">Total</span>
              <span className="text-white font-bold">{costEstimate.formatted.grandTotal} tTRUST</span>
            </div>
          </div>
        </div>
      )}

      {/* Protocol config info */}
      {!configLoading && protocolConfig && (
        <div className="text-xs text-white/40">
          Min deposit: {protocolConfig.formattedMinDeposit} tTRUST |
          Triple cost: {protocolConfig.formattedTripleCost} tTRUST
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleValidate}
          disabled={!isFormValid || validating}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            isFormValid && !validating
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {validating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Validating...
            </span>
          ) : (
            'Validate & Estimate'
          )}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || hasValidationErrors || !costEstimate || loading}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            isFormValid && !hasValidationErrors && costEstimate && !loading
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating...
            </span>
          ) : (
            `Create ${items.length} Triple${items.length > 1 ? 's' : ''}`
          )}
        </button>
      </div>
    </div>
  );
}
