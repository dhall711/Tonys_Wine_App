'use client';

import { FilterOptions, Filters, SortOption } from '@/lib/types';

type ViewMode = 'grid' | 'compact' | 'list';

interface FilterSidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  options: FilterOptions;
  resultCount: number;
  totalCount: number;
  showConsumed: boolean;
  onShowConsumedChange: (show: boolean) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string; icon: string }[] = [
  { value: 'grid', label: 'Grid', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { value: 'compact', label: 'Compact', icon: 'M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h16v4H4v-4z' },
  { value: 'list', label: 'List', icon: 'M4 6h16M4 12h16M4 18h16' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'drink-soon', label: 'Drink Soon First' },
  { value: 'status-priority', label: 'By Status (Peak First)' },
  { value: 'producer-az', label: 'Producer (A-Z)' },
  { value: 'wine-name-az', label: 'Wine Name (A-Z)' },
  { value: 'vintage-newest', label: 'Vintage (Newest)' },
  { value: 'vintage-oldest', label: 'Vintage (Oldest)' },
  { value: 'region', label: 'By Region' },
  { value: 'rating', label: 'By Rating' },
];

export function FilterSidebar({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  options,
  resultCount,
  totalCount,
  showConsumed,
  onShowConsumedChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  isMobileOpen,
  onMobileClose,
}: FilterSidebarProps) {
  const hasActiveFilters = searchQuery || Object.values(filters).some(v => v);

  const FilterSelect = ({ 
    label, 
    value, 
    options: opts, 
    filterKey 
  }: { 
    label: string; 
    value: string; 
    options: string[]; 
    filterKey: keyof Filters;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onFilterChange(filterKey, e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
      >
        <option value="">All</option>
        {opts.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  const sidebarContent = (
    <>
      {/* Logo & Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-center mb-3 px-2">
          <img 
            src="/logo.png" 
            alt="Lucero Wine Collection" 
            className="w-full max-w-[200px] h-auto"
          />
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          <button
            onClick={onMobileClose}
            className="md:hidden text-gray-400 hover:text-white"
            aria-label="Close filters"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          <span className="text-wine-gold font-semibold">{resultCount}</span> of {totalCount} wines
        </p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-700">
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
          Search
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Producer, wine, grape..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 pl-9 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none placeholder-gray-500"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Sort & Filter Groups */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* View Mode */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">View</h3>
          <div className="flex gap-1">
            {VIEW_MODE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onViewModeChange(opt.value)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                  viewMode === opt.value
                    ? 'bg-wine-red text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={opt.label}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opt.icon} />
                </svg>
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sort Order */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort Order</h3>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Wine Type & Grape Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Wine Type</h3>
          <FilterSelect label="Type" value={filters.wineType} options={options.wineTypes} filterKey="wineType" />
          <FilterSelect label="Grape / Style" value={filters.grapeVariety} options={options.grapeVarieties} filterKey="grapeVariety" />
          <FilterSelect label="Drink Status" value={filters.drinkWindowStatus} options={options.drinkWindowStatuses} filterKey="drinkWindowStatus" />
        </div>

        {/* Origin Section */}
        <div className="space-y-3 pt-3 border-t border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Origin</h3>
          <FilterSelect label="Country" value={filters.country} options={options.countries} filterKey="country" />
          <FilterSelect label="Region" value={filters.region} options={options.regions} filterKey="region" />
          <FilterSelect label="Vintage" value={filters.vintage} options={options.vintages} filterKey="vintage" />
        </div>

        {/* Character Section */}
        <div className="space-y-3 pt-3 border-t border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Character</h3>
          <FilterSelect label="Body" value={filters.body} options={options.bodies} filterKey="body" />
          <FilterSelect label="Tannins" value={filters.tanninLevel} options={options.tanninLevels} filterKey="tanninLevel" />
          <FilterSelect label="Acidity" value={filters.acidityLevel} options={options.acidityLevels} filterKey="acidityLevel" />
        </div>

        {/* Show Consumed Toggle */}
        <div className="pt-3 border-t border-gray-700">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showConsumed}
              onChange={(e) => onShowConsumedChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-wine-red focus:ring-wine-red focus:ring-offset-gray-800"
            />
            <span className="text-sm text-gray-300">Show consumed wines</span>
          </label>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClearFilters}
            className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 bg-gray-800 border-r border-gray-700 z-30 pt-16">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={onMobileClose}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-gray-800 flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
