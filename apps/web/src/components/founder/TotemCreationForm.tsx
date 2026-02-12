/**
 * TotemCreationForm - Form for creating a new totem
 *
 * Allows users to:
 * - Enter a totem name
 * - Select an existing category OR create a new one via input
 * - Create the totem directly (atom + category triple) without deposit
 *
 * Data is transmitted in real-time to the parent (VoteTotemPanel)
 * Predicate selection and validation happen in the right panel
 *
 * NEW FLOW (Test pour résoudre bug counterTermId):
 * - Le bouton "Créer le Totem" crée atom + triple avec assets=0
 * - L'utilisateur peut ensuite voter sur le totem comme s'il existait déjà
 *
 * @see 18_Design_Decisions_V2.md section 13 - Onglet "Création"
 * @see 15.9_REFACTORISATION_useBatchVote.md - Nouvelle approche création/dépôt séparés
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import categoriesData from '../../../../../packages/shared/src/data/categories.json';
import type { CategoryConfigType } from '../../types/category';
import type { DynamicCategory, OFCTotem } from '../../hooks/data/useAllOFCTotems';
import {
  useCreateTotemWithTriples,
  type TotemCreationResult,
} from '../../hooks/blockchain/claims/useCreateTotemWithTriples';
import { uploadImageToPinata } from '../../utils/pinataUpload';
import { useFuzzySearch } from '../../hooks/search/useFuzzySearch';

// Type the JSON imports
const typedCategoriesConfig = categoriesData as CategoryConfigType;

/** Data for a new totem to be created */
export interface NewTotemData {
  name: string;
  category: string;
  categoryTermId: string | null; // null if new category
  isNewCategory: boolean;
  image?: string;
  categoryImage?: string;
}

interface TotemCreationFormProps {
  /** Called on every change with current form data (real-time sync with right panel) */
  onChange: (data: NewTotemData | null) => void;
  /** Dynamic categories from blockchain (user-created) */
  dynamicCategories?: DynamicCategory[];
  /** Existing totems for duplicate detection */
  existingTotems?: OFCTotem[];
  /** Called when a totem is successfully created on-chain */
  onTotemCreated?: (result: TotemCreationResult) => void;
}

/** Initial categories from the system (static JSON) */
const STATIC_CATEGORIES = typedCategoriesConfig.categories;

export function TotemCreationForm({
  onChange,
  dynamicCategories = [],
  existingTotems = [],
  onTotemCreated,
}: TotemCreationFormProps) {
  const { t } = useTranslation();

  // Form state
  const [totemName, setTotemName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [catImageFile, setCatImageFile] = useState<File | null>(null);
  const [catImagePreview, setCatImagePreview] = useState<string | null>(null);
  const [isCatDragging, setIsCatDragging] = useState(false);
  const catFileInputRef = useRef<HTMLInputElement>(null);

  // State for handling "totem already exists" confirmation
  const [pendingResult, setPendingResult] = useState<TotemCreationResult | null>(null);

  // Hook for creating totem (atom + category triple) without deposit
  const { createTotem, step, error: createError, isLoading, reset: resetCreate } = useCreateTotemWithTriples();

  // Merge static categories with dynamic ones (from blockchain)
  // Dynamic categories that match static ones are skipped (static has priority for termId)
  const allCategories = useMemo(() => {
    const staticLabels = new Set(STATIC_CATEGORIES.map((c) => c.label));
    const merged = [...STATIC_CATEGORIES];

    // Add dynamic categories that don't exist in static list
    dynamicCategories.forEach((dynCat) => {
      if (dynCat.label && !staticLabels.has(dynCat.label)) {
        merged.push({
          id: dynCat.termId,
          label: dynCat.label,
          name: dynCat.label,
          termId: dynCat.termId,
          image: dynCat.image,
        });
      }
    });

    return merged.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  }, [dynamicCategories]);

  // Fuzzy search: filter categories as user types
  const categoryMatches = useFuzzySearch(allCategories, ['label'], customCategoryInput);
  const visibleCategories = customCategoryInput.trim().length < 2
    ? allCategories
    : categoryMatches.map(r => r.item);

  // Fuzzy search: detect similar existing totems
  const totemMatches = useFuzzySearch(existingTotems, ['label'], totemName);

  // Determine if using a custom category (input has text and no chip selected)
  const isNewCategory = customCategoryInput.trim().length > 0 && selectedCategory === '';

  // Effective category: custom input takes priority over chip selection
  const effectiveCategory = isNewCategory ? customCategoryInput.trim() : selectedCategory;
  const effectiveCategoryTermId = isNewCategory
    ? null
    : allCategories.find((c) => c.label === selectedCategory)?.termId || null;

  // Form validation
  const isValid = useMemo(() => {
    const hasTotemName = totemName.trim().length >= 2;
    const hasCategory = effectiveCategory.length >= 2;
    return hasTotemName && hasCategory;
  }, [totemName, effectiveCategory]);

  // Keep stable reference to onChange to avoid infinite loops
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Effective image: URL input takes priority, then file preview (uploaded later)
  const effectiveImageUrl = imageUrl.trim() || undefined;
  const effectiveCatImageUrl = catImageUrl.trim() || undefined;

  // Transmit data to parent on every change (without onChange in deps to avoid infinite loop)
  useEffect(() => {
    if (isValid) {
      onChangeRef.current({
        name: totemName.trim(),
        category: effectiveCategory,
        categoryTermId: effectiveCategoryTermId,
        isNewCategory,
        image: effectiveImageUrl,
        categoryImage: isNewCategory ? effectiveCatImageUrl : undefined,
      });
    } else {
      onChangeRef.current(null); // Signal invalid/incomplete data
    }
  }, [totemName, effectiveCategory, effectiveCategoryTermId, isNewCategory, isValid, effectiveImageUrl, effectiveCatImageUrl]);

  // Handle category chip selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCustomCategoryInput(category); // Fill input with selected category
  };

  // Handle custom category input
  const handleCustomCategoryChange = (value: string) => {
    setCustomCategoryInput(value);
    if (value.trim().length > 0) {
      setSelectedCategory(''); // Deselect chip when typing custom category
    }
  };

  // Handle image URL input
  const handleImageUrlChange = (value: string) => {
    setImageUrl(value);
    if (value.trim()) {
      setImagePreview(value.trim());
      setImageFile(null);
    } else if (!imageFile) {
      setImagePreview(null);
    }
  };

  // Handle image file (from input or drop)
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    setImageUrl('');
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Remove image
  const handleRemoveImage = () => {
    if (imagePreview && imageFile) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageUrl('');
    setImageFile(null);
    setImagePreview(null);
  };

  // Category image handlers
  const handleCatFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setCatImageFile(file);
    setCatImageUrl('');
    setCatImagePreview(URL.createObjectURL(file));
  };

  const handleCatImageUrlChange = (value: string) => {
    setCatImageUrl(value);
    if (value.trim()) {
      setCatImagePreview(value.trim());
      setCatImageFile(null);
    } else if (!catImageFile) {
      setCatImagePreview(null);
    }
  };

  const handleRemoveCatImage = () => {
    if (catImagePreview && catImageFile) {
      URL.revokeObjectURL(catImagePreview);
    }
    setCatImageUrl('');
    setCatImageFile(null);
    setCatImagePreview(null);
  };

  // Handle totem creation (NEW: create atom + category triple without deposit)
  const handleCreateTotem = async () => {
    if (!isValid) return;

    // Show info toast for atom creation
    toast.info(t('creation.verifyingTotem'), { id: 'totem-creation' });

    // Upload files to Pinata if needed
    let finalImageUrl = effectiveImageUrl;
    let finalCatImageUrl = effectiveCatImageUrl;
    const filesToUpload: { file: File; target: 'totem' | 'category' }[] = [];
    if (imageFile && !imageUrl.trim()) filesToUpload.push({ file: imageFile, target: 'totem' });
    if (isNewCategory && catImageFile && !catImageUrl.trim()) filesToUpload.push({ file: catImageFile, target: 'category' });

    if (filesToUpload.length > 0) {
      try {
        setIsUploading(true);
        toast.info(t('creation.uploading'), { id: 'totem-creation' });
        for (const { file, target } of filesToUpload) {
          const url = await uploadImageToPinata(file);
          if (target === 'totem') finalImageUrl = url;
          else finalCatImageUrl = url;
        }
      } catch (uploadErr) {
        toast.error(t('creation.uploadError'), { id: 'totem-creation' });
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const result = await createTotem({
      name: totemName.trim(),
      category: effectiveCategory,
      categoryTermId: effectiveCategoryTermId,
      isNewCategory,
      image: finalImageUrl,
      categoryImage: isNewCategory ? finalCatImageUrl : undefined,
    });

    if (result) {
      // Check if totem already existed - ask user confirmation
      if (result.totemAlreadyExisted) {
        toast.info(
          t('creation.totemAlreadyExists', { name: result.totemName }),
          { id: 'totem-creation', duration: 3000 }
        );
        // Store result for confirmation dialog
        setPendingResult(result);
        return;
      }

      // Success - show what was created
      toast.success(
        t('creation.totemCreatedSuccess', { name: result.totemName, category: result.categoryName }),
        { id: 'totem-creation', duration: 5000 }
      );

      // Reset form and notify parent
      handleConfirmAndRedirect(result);
    } else if (createError) {
      // Error occurred
      toast.error(t('creation.creationError', { error: createError }), { id: 'totem-creation' });
    }
  };

  // Confirm using existing totem or newly created one
  const handleConfirmAndRedirect = (result: TotemCreationResult) => {
    // Reset form
    setTotemName('');
    handleRemoveImage();
    handleRemoveCatImage();
    setSelectedCategory('');
    setCustomCategoryInput('');
    setPendingResult(null);
    resetCreate();

    // Notify parent to redirect to vote panel with totem pre-filled
    onTotemCreated?.(result);
  };

  // Cancel using existing totem
  const handleCancelPending = () => {
    setPendingResult(null);
    resetCreate();
    toast.info(t('creation.creationCancelled'), { id: 'totem-creation' });
  };

  // Get button label based on creation step
  const getCreateButtonLabel = () => {
    switch (step) {
      case 'creating_totem':
        return t('creation.creatingTotem');
      case 'creating_category':
        return t('creation.creatingCategory');
      case 'creating_triple':
        return t('creation.creatingTriple');
      default:
        return t('creation.createTotem');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Form Fields */}
      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* 1. Totem Name */}
        <div>
          <label className="block text-xs text-white/60 mb-1.5">
            {t('creation.totemName')}
          </label>
          <input
            type="text"
            value={totemName}
            onChange={(e) => setTotemName(e.target.value)}
            placeholder={t('creation.totemNamePlaceholder')}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-slate-500/50 focus:ring-1 focus:ring-slate-500/30"
          />
          {/* Similar totem suggestions */}
          {totemMatches.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {totemMatches.slice(0, 3).map((match) => (
                <button
                  key={match.item.id}
                  onClick={() => {
                    setTotemName(match.item.label);
                    if (match.item.category) handleCategorySelect(match.item.category);
                  }}
                  className="w-full text-left text-[10px] text-amber-400/70 hover:text-amber-300 transition-colors px-2 py-1 bg-amber-500/5 border border-amber-500/10 rounded-md"
                >
                  {t('creation.similarTotemFound', { name: match.item.label, category: match.item.category || '?' })}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Image (optional) — drop zone + URL input */}
        <div>
          <label className="block text-xs text-white/60 mb-1.5">
            {t('creation.totemImage')}
          </label>

          {imagePreview ? (
            /* Image preview with remove button */
            <div className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-lg">
              <img
                src={imagePreview}
                alt="preview"
                className="w-12 h-12 rounded-lg object-cover border border-white/20"
                onError={() => setImagePreview(null)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/60 truncate">
                  {imageFile ? imageFile.name : imageUrl}
                </p>
              </div>
              <button
                onClick={handleRemoveImage}
                className="text-xs text-red-400/70 hover:text-red-400 transition-colors shrink-0 px-2"
              >
                {t('creation.removeImage')}
              </button>
            </div>
          ) : (
            /* Drop zone + click to browse */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-1 p-4 border border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragging
                  ? 'border-slate-400 bg-slate-500/20'
                  : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
              }`}
            >
              <p className="text-xs text-white/50">
                {t('creation.dropOrClick')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* URL input — always visible when no preview */}
          {!imagePreview && (
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              placeholder={t('creation.imageUrlPlaceholder')}
              className="w-full mt-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-slate-500/50 focus:ring-1 focus:ring-slate-500/30"
            />
          )}
        </div>

        {/* 3. Category Selection */}
        <div>
          <label className="block text-xs text-white/60 mb-1.5">
            {t('creation.category')}
          </label>

          {/* Category chips - flex wrap limited to ~3 rows, scroll for overflow */}
          <div className="flex flex-wrap gap-1.5 mb-2 max-h-[96px] overflow-y-auto pr-1 scrollbar-thin">
            {visibleCategories.map((cat) => {
              const isDynamic = !STATIC_CATEGORIES.some((s) => s.label === cat.label);
              const isActive = selectedCategory === cat.label;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.label)}
                  className={`flex items-center gap-1.5 pl-[5px] pr-[7px] pt-[3px] pb-[4px] my-[2px] rounded-full transition-all ${
                    isActive
                      ? 'bg-slate-500/30 animate-blur-to-focus animate-ring-pulse'
                      : isDynamic
                        ? 'bg-white/5 ring-1 ring-dashed ring-white/20 hover:bg-white/10'
                        : 'bg-white/10 hover:bg-white/15'
                  }`}
                  title={isDynamic ? t('creation.communityCategory') : undefined}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 overflow-hidden ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
                  }`}>
                    {cat.image
                      ? <img src={cat.image} alt="" className="w-full h-full object-cover" />
                      : cat.label.charAt(0).toUpperCase()
                    }
                  </div>
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-white' : 'text-white/60'
                  }`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom category input - always visible */}
          <div>
            <input
              type="text"
              value={customCategoryInput}
              onChange={(e) => handleCustomCategoryChange(e.target.value)}
              placeholder={t('creation.newCategoryPlaceholder')}
              className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-sm text-white placeholder-white/30 focus:outline-none transition-colors ${
                isNewCategory
                  ? 'border-slate-500/50 ring-1 ring-slate-500/30'
                  : 'border-white/10 focus:border-slate-500/50 focus:ring-1 focus:ring-slate-500/30'
              }`}
            />
            {isNewCategory && (
              categoryMatches.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {categoryMatches.slice(0, 3).map((match) => (
                    <button
                      key={match.item.id}
                      onClick={() => handleCategorySelect(match.item.label)}
                      className="w-full text-left text-[10px] text-amber-400/70 hover:text-amber-300 transition-colors px-2 py-1 bg-amber-500/5 border border-amber-500/10 rounded-md"
                    >
                      {t('creation.similarCategoryFound', { name: match.item.label })}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-orange-400/70 mt-1">
                  {t('creation.newCategoryInfo')}
                </p>
              )
            )}

            {/* Category image — only when creating a new category */}
            {isNewCategory && (
              <div className="mt-2">
                <label className="block text-[10px] text-white/40 mb-1">
                  {t('creation.categoryImage')}
                </label>
                {catImagePreview ? (
                  <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-lg">
                    <img
                      src={catImagePreview}
                      alt=""
                      className="w-8 h-8 rounded-md object-cover border border-white/20"
                      onError={() => setCatImagePreview(null)}
                    />
                    <span className="text-[10px] text-white/50 truncate flex-1">
                      {catImageFile ? catImageFile.name : catImageUrl}
                    </span>
                    <button
                      onClick={handleRemoveCatImage}
                      className="text-[10px] text-red-400/70 hover:text-red-400 shrink-0 px-1"
                    >
                      {t('creation.removeImage')}
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsCatDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsCatDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsCatDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleCatFile(f); }}
                    onClick={() => catFileInputRef.current?.click()}
                    className={`flex items-center justify-center p-2 border border-dashed rounded-lg cursor-pointer transition-colors ${
                      isCatDragging
                        ? 'border-slate-400 bg-slate-500/20'
                        : 'border-white/15 bg-white/5 hover:border-white/25'
                    }`}
                  >
                    <p className="text-[10px] text-white/40">{t('creation.dropOrClick')}</p>
                    <input
                      ref={catFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCatFile(f); }}
                      className="hidden"
                    />
                  </div>
                )}
                {!catImagePreview && (
                  <input
                    type="text"
                    value={catImageUrl}
                    onChange={(e) => handleCatImageUrlChange(e.target.value)}
                    placeholder={t('creation.imageUrlPlaceholder')}
                    className="w-full mt-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white placeholder-white/25 focus:outline-none focus:border-slate-500/50"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview - shows when form is valid */}
        {isValid && (
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-[10px] text-white/40 mb-2">{t('creation.preview')}</p>
            <div className="flex items-center gap-2 text-xs">
              {imagePreview && (
                <img src={imagePreview} alt="" className="w-8 h-8 rounded-md object-cover border border-white/20 shrink-0" />
              )}
              <p className="text-white/70">
                <span className="text-white font-medium">{totemName}</span>
                <span className="text-white/40"> • </span>
                <span className="text-slate-400">{effectiveCategory}</span>
                {isNewCategory && (
                  <span className="text-orange-400/70 ml-1 text-[10px]">
                    ({t('creation.new')})
                  </span>
                )}
              </p>
            </div>
            <p className="text-[10px] text-white/30 mt-2">
              {t('creation.selectPredicateInPanel')}
            </p>
          </div>
        )}

        {/* Confirmation dialog when totem already exists */}
        {pendingResult && (
          <div className="mt-4 pt-4 border-t border-orange-500/30">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
              <p className="text-sm text-orange-300 mb-2">
                {t('creation.totemExists')}
              </p>
              <p className="text-xs text-white/60 mb-3">
                <span className="text-white font-medium">{pendingResult.totemName}</span>
                <span className="text-white/40"> • </span>
                <span className="text-slate-400">{pendingResult.categoryName}</span>
              </p>
              <p className="text-[10px] text-white/50 mb-3">
                {t('creation.useExistingTotem')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirmAndRedirect(pendingResult)}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all"
                >
                  {t('creation.useThisTotem')}
                </button>
                <button
                  onClick={handleCancelPending}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Totem Button - NEW: Creates atom + category triple without deposit */}
        {isValid && !pendingResult && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[10px] text-white/50 mb-2">
              {t('creation.createTotemInfo')}
            </p>
            <button
              onClick={handleCreateTotem}
              disabled={isLoading || isUploading}
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                isLoading || isUploading
                  ? 'bg-slate-600/30 text-white/50 cursor-wait'
                  : 'bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20'
              }`}
            >
              {isLoading && (
                <span className="inline-block w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {getCreateButtonLabel()}
            </button>
            {createError && (
              <p className="text-[10px] text-red-400 mt-2">{createError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
