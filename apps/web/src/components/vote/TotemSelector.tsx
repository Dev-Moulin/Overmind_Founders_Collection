import type { CategoryConfigType } from '../../types/category';
import categoriesConfig from '../../../../../packages/shared/src/data/categories.json';

const typedCategoriesConfig = categoriesConfig as CategoryConfigType;

/**
 * TotemSelector - Accordion pour sélectionner ou créer un totem (Step 2)
 * Extrait de VotePanel.tsx lignes 705-985
 */

export interface TotemData {
  id: string;
  label: string;
  image?: string;
  category?: string;
  trustScore?: number;
}

interface TotemSelectorProps {
  // State
  founderName: string;
  isOpen: boolean;
  totemMode: 'existing' | 'new';
  selectedTotemId: string;
  selectedTotem: TotemData | undefined;
  newTotemName: string;
  newTotemCategory: string;
  searchQuery: string;
  // Data
  existingTotems: TotemData[];
  allExistingTotems: TotemData[];
  filteredAllTotems: TotemData[];
  totemsByCategory: Map<string, TotemData[]>;
  dynamicCategories: string[];
  // Callbacks
  onToggle: () => void;
  onModeChange: (mode: 'existing' | 'new') => void;
  onSelectTotem: (totemId: string) => void;
  onNewTotemNameChange: (name: string) => void;
  onNewTotemCategoryChange: (category: string) => void;
  onSearchQueryChange: (query: string) => void;
  onCloseAccordion: () => void;
}

export function TotemSelector({
  founderName,
  isOpen,
  totemMode,
  selectedTotemId,
  selectedTotem,
  newTotemName,
  newTotemCategory,
  searchQuery,
  existingTotems,
  allExistingTotems,
  filteredAllTotems,
  totemsByCategory,
  dynamicCategories,
  onToggle,
  onModeChange,
  onSelectTotem,
  onNewTotemNameChange,
  onNewTotemCategoryChange,
  onSearchQueryChange,
  onCloseAccordion,
}: TotemSelectorProps) {
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white/70">2. Totem</span>
          {(selectedTotem || newTotemName) && (
            <span className="text-sm text-slate-400">
              : {totemMode === 'existing' ? selectedTotem?.label : newTotemName}
              {totemMode === 'new' && ' (nouveau)'}
            </span>
          )}
        </div>
        <span className={`text-xs text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Dropdown content with smooth transition */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-4 p-3 bg-white/5 border border-white/10 rounded-lg max-h-80 overflow-y-auto">
          {/* Mode tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => onModeChange('existing')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                totemMode === 'existing'
                  ? 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              Totem existant
            </button>
            <button
              onClick={() => onModeChange('new')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                totemMode === 'new'
                  ? 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              Créer nouveau
            </button>
          </div>

          {totemMode === 'existing' ? (
            <>
              {/* Totems existants de CE fondateur (avec scores) */}
              {existingTotems.length > 0 && (
                <div>
                  <p className="text-xs text-white/50 mb-2">Totems de {founderName} :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {existingTotems.slice(0, 8).map((totem) => (
                      <button
                        key={totem.id}
                        type="button"
                        onClick={() => {
                          onSelectTotem(totem.id);
                          onNewTotemNameChange('');
                          onCloseAccordion();
                        }}
                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                          selectedTotemId === totem.id
                            ? 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
                            : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {totem.label} ({totem.trustScore?.toFixed(1) || '0'})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tous les totems existants (groupés par catégorie) */}
              {allExistingTotems.length > 0 && (
                <div>
                  <p className="text-xs text-white/50 mb-2">Tous les totems ({allExistingTotems.length}) :</p>
                  {/* Search filter */}
                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => onSearchQueryChange(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-slate-500/50"
                    />
                  </div>

                  {/* Grouped by category */}
                  {searchQuery ? (
                    // Search mode: flat list
                    <div className="flex flex-wrap gap-1.5">
                      {filteredAllTotems.slice(0, 15).map((totem) => (
                        <button
                          key={totem.id}
                          type="button"
                          onClick={() => {
                            onSelectTotem(totem.id);
                            onNewTotemNameChange('');
                            onCloseAccordion();
                          }}
                          className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                            selectedTotemId === totem.id
                              ? 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          {totem.label}
                          {totem.category && <span className="text-white/40 ml-1">({totem.category})</span>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    // Normal mode: grouped by category
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {Array.from(totemsByCategory.entries()).map(([category, totems]) => (
                        <div key={category}>
                          <p className="text-xs text-slate-400 font-medium mb-1.5">
                            {category} ({totems.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {totems.slice(0, 10).map((totem) => (
                              <button
                                key={totem.id}
                                type="button"
                                onClick={() => {
                                  onSelectTotem(totem.id);
                                  onNewTotemNameChange('');
                                  onCloseAccordion();
                                }}
                                className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                                  selectedTotemId === totem.id
                                    ? 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                                }`}
                              >
                                {totem.label}
                              </button>
                            ))}
                            {totems.length > 10 && (
                              <span className="text-xs text-white/40 self-center">+{totems.length - 10} autres</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Catégories disponibles (OFC: system - prédéfinies + dynamiques) */}
              <div>
                <p className="text-xs text-white/50 mb-2">Créer avec catégorie :</p>
                <div className="flex flex-wrap gap-1.5">
                  {/* Catégories prédéfinies */}
                  {typedCategoriesConfig.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onModeChange('new');
                        onNewTotemCategoryChange(cat.name);
                        onSelectTotem('');
                      }}
                      className="px-2 py-1 text-xs rounded-lg transition-colors bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                    >
                      {cat.name}
                    </button>
                  ))}
                  {/* Catégories dynamiques (créées on-chain mais pas dans config) */}
                  {dynamicCategories
                    .filter(cat => !typedCategoriesConfig.categories.some(c => c.name === cat))
                    .map((cat) => (
                      <button
                        key={`dynamic-${cat}`}
                        type="button"
                        onClick={() => {
                          onModeChange('new');
                          onNewTotemCategoryChange(cat);
                          onSelectTotem('');
                        }}
                        className="px-2 py-1 text-xs rounded-lg transition-colors bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30"
                        title="Catégorie créée dynamiquement"
                      >
                        {cat} ✨
                      </button>
                    ))}
                </div>
              </div>

              {allExistingTotems.length === 0 && existingTotems.length === 0 && (
                <p className="text-xs text-white/40 text-center py-4">
                  Pas trouvé ? Créez-en un nouveau !
                </p>
              )}
            </>
          ) : (
            <>
              {/* Création de nouveau totem */}
              <div className="space-y-3">
                {/* Nom du totem */}
                <div>
                  <label className="block text-xs text-white/50 mb-1">Nom du totem *</label>
                  <input
                    type="text"
                    placeholder="Ex: Lion, Compass, Visionary..."
                    value={newTotemName}
                    onChange={(e) => onNewTotemNameChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-slate-500/50"
                  />
                </div>

                {/* Catégorie - sélection ou création nouvelle */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block text-xs text-white/50">Catégorie</label>
                    {newTotemName && !newTotemCategory && (
                      <span className="text-xs text-red-400 animate-pulse">obligatoire</span>
                    )}
                  </div>
                  {/* Catégories prédéfinies */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {typedCategoriesConfig.categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => onNewTotemCategoryChange(cat.name)}
                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                          newTotemCategory === cat.name
                            ? 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
                            : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                    {/* Catégories dynamiques existantes */}
                    {dynamicCategories
                      .filter(cat => !typedCategoriesConfig.categories.some(c => c.name === cat))
                      .map((cat) => (
                        <button
                          key={`dynamic-${cat}`}
                          type="button"
                          onClick={() => onNewTotemCategoryChange(cat)}
                          className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                            newTotemCategory === cat
                              ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                              : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
                          }`}
                        >
                          {cat} ✨
                        </button>
                      ))}
                  </div>
                  {/* Input pour nouvelle catégorie */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ou créer nouvelle catégorie..."
                      value={!typedCategoriesConfig.categories.some(c => c.name === newTotemCategory) && !dynamicCategories.includes(newTotemCategory) ? newTotemCategory : ''}
                      onChange={(e) => onNewTotemCategoryChange(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-slate-500/50"
                    />
                  </div>
                  {newTotemCategory && (
                    <p className="text-xs text-white/40 mt-2">
                      Triple créé: <span className="text-slate-400">[{newTotemName || '...'}] [has category] [{newTotemCategory}]</span>
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
