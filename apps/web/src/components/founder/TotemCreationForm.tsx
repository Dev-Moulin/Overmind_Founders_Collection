/**
 * TotemCreationForm - Form for creating a new totem
 *
 * Allows users to:
 * - Enter a totem name
 * - Select an existing category OR create a new one via input
 *
 * Data is transmitted in real-time to the parent (VoteTotemPanel)
 * Predicate selection and validation happen in the right panel
 * Actual blockchain creation happens when the cart is validated
 *
 * @see 18_Design_Decisions_V2.md section 13 - Onglet "Création"
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import categoriesData from '../../../../../packages/shared/src/data/categories.json';
import type { CategoryConfigType } from '../../types/category';
import type { DynamicCategory } from '../../hooks/data/useAllOFCTotems';

// Type the JSON imports
const typedCategoriesConfig = categoriesData as CategoryConfigType;

/** Data for a new totem to be created */
export interface NewTotemData {
  name: string;
  category: string;
  categoryTermId: string | null; // null if new category
  isNewCategory: boolean;
}

interface TotemCreationFormProps {
  /** Called on every change with current form data (real-time sync with right panel) */
  onChange: (data: NewTotemData | null) => void;
  /** Dynamic categories from blockchain (user-created) */
  dynamicCategories?: DynamicCategory[];
}

/** Initial categories from the system (static JSON) */
const STATIC_CATEGORIES = typedCategoriesConfig.categories;

export function TotemCreationForm({ onChange, dynamicCategories = [] }: TotemCreationFormProps) {
  const { t } = useTranslation();

  // Form state
  const [totemName, setTotemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Merge static categories with dynamic ones (from blockchain)
  // Dynamic categories that match static ones are skipped (static has priority for termId)
  const allCategories = useMemo(() => {
    const staticLabels = new Set(STATIC_CATEGORIES.map((c) => c.label));
    const merged = [...STATIC_CATEGORIES];

    // Add dynamic categories that don't exist in static list
    dynamicCategories.forEach((dynCat) => {
      if (!staticLabels.has(dynCat.label)) {
        merged.push({
          id: dynCat.termId,
          label: dynCat.label,
          name: dynCat.label,
          termId: dynCat.termId,
        });
      }
    });

    return merged.sort((a, b) => a.label.localeCompare(b.label));
  }, [dynamicCategories]);

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

  // Transmit data to parent on every change (without onChange in deps to avoid infinite loop)
  useEffect(() => {
    if (isValid) {
      onChangeRef.current({
        name: totemName.trim(),
        category: effectiveCategory,
        categoryTermId: effectiveCategoryTermId,
        isNewCategory,
      });
    } else {
      onChangeRef.current(null); // Signal invalid/incomplete data
    }
  }, [totemName, effectiveCategory, effectiveCategoryTermId, isNewCategory, isValid]);

  // Handle category chip selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCustomCategoryInput(''); // Clear custom input when selecting a chip
  };

  // Handle custom category input
  const handleCustomCategoryChange = (value: string) => {
    setCustomCategoryInput(value);
    if (value.trim().length > 0) {
      setSelectedCategory(''); // Deselect chip when typing custom category
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Form Fields */}
      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* 1. Totem Name */}
        <div>
          <label className="block text-xs text-white/60 mb-1.5">
            {t('creation.totemName') || 'Nom du totem'}
          </label>
          <input
            type="text"
            value={totemName}
            onChange={(e) => setTotemName(e.target.value)}
            placeholder={t('creation.totemNamePlaceholder') || 'Ex: Phoenix, Innovation...'}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-slate-500/50 focus:ring-1 focus:ring-slate-500/30"
          />
        </div>

        {/* 2. Category Selection */}
        <div>
          <label className="block text-xs text-white/60 mb-1.5">
            {t('creation.category') || 'Catégorie'}
          </label>

          {/* Category chips - existing categories (static + dynamic from blockchain) */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {allCategories.map((cat) => {
              // Check if this is a dynamic category (not in STATIC_CATEGORIES)
              const isDynamic = !STATIC_CATEGORIES.some((s) => s.label === cat.label);
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.label)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                    selectedCategory === cat.label
                      ? 'bg-slate-500/40 text-white ring-1 ring-slate-500/50'
                      : isDynamic
                        ? 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-dashed border-white/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                  title={isDynamic ? t('creation.communityCategory') || 'Catégorie communautaire' : undefined}
                >
                  {cat.label}
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
              placeholder={t('creation.newCategoryPlaceholder') || 'Ou créez une nouvelle catégorie...'}
              className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-sm text-white placeholder-white/30 focus:outline-none transition-colors ${
                isNewCategory
                  ? 'border-slate-500/50 ring-1 ring-slate-500/30'
                  : 'border-white/10 focus:border-slate-500/50 focus:ring-1 focus:ring-slate-500/30'
              }`}
            />
            {isNewCategory && (
              <p className="text-[10px] text-orange-400/70 mt-1">
                {t('creation.newCategoryInfo') || 'Une nouvelle catégorie sera créée'}
              </p>
            )}
          </div>
        </div>

        {/* Preview - shows when form is valid */}
        {isValid && (
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-[10px] text-white/40 mb-2">{t('creation.preview') || 'Aperçu'}</p>
            <div className="space-y-1 text-xs">
              <p className="text-white/70">
                <span className="text-white font-medium">{totemName}</span>
                <span className="text-white/40"> • </span>
                <span className="text-slate-400">{effectiveCategory}</span>
                {isNewCategory && (
                  <span className="text-orange-400/70 ml-1 text-[10px]">
                    ({t('creation.new') || 'nouveau'})
                  </span>
                )}
              </p>
            </div>
            <p className="text-[10px] text-white/30 mt-2">
              {t('creation.selectPredicateInPanel') || 'Sélectionnez la relation dans le panneau de droite'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
