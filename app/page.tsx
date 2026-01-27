'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Wine, Filters, SortOption } from '@/lib/types';
import { WineGrid } from '@/components/WineGrid';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ImageModal } from '@/components/ImageModal';
import { ChatWidget } from '@/components/ChatWidget';
import { SimilarWinesModal } from '@/components/SimilarWinesModal';
import { getCatalogWines, getFilterOptions, searchWines, filterWines, sortWines } from '@/lib/wines';
import { getUserData, getAddedWines, getDeletedWineIds } from '@/lib/userData';
import { AddWineModal } from '@/components/AddWineModal';

// Helper to parse filters from URL
function getFiltersFromParams(searchParams: URLSearchParams): Filters {
  return {
    country: searchParams.get('country') || '',
    region: searchParams.get('region') || '',
    wineType: searchParams.get('wineType') || '',
    vintage: searchParams.get('vintage') || '',
    body: searchParams.get('body') || '',
    tanninLevel: searchParams.get('tanninLevel') || '',
    acidityLevel: searchParams.get('acidityLevel') || '',
    drinkWindowStatus: searchParams.get('drinkWindowStatus') || '',
    grapeVariety: searchParams.get('grapeVariety') || '',
  };
}

// Loading fallback for Suspense
function HomePageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine-red mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading collection...</p>
      </div>
    </div>
  );
}

// Wrapper component with Suspense
export default function HomePage() {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const catalogWines = useMemo(() => getCatalogWines(), []);
  const [userAddedWines, setUserAddedWines] = useState<Wine[]>([]);
  const [deletedWineIds, setDeletedWineIds] = useState<string[]>([]);
  const [showAddWineModal, setShowAddWineModal] = useState(false);
  
  // Load user-added wines and deleted IDs on mount
  useEffect(() => {
    setUserAddedWines(getAddedWines());
    setDeletedWineIds(getDeletedWineIds());
  }, []);
  
  // Combine catalog wines with user-added wines, excluding deleted
  const allWines = useMemo(() => {
    const combined = [...catalogWines, ...userAddedWines];
    return combined.filter(wine => !deletedWineIds.includes(wine.id));
  }, [catalogWines, userAddedWines, deletedWineIds]);
  
  const filterOptions = useMemo(() => getFilterOptions(allWines), [allWines]);
  
  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<Filters>(() => getFiltersFromParams(searchParams));
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showConsumed, setShowConsumed] = useState(searchParams.get('showConsumed') === 'true');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'drink-soon');
  const [similarWineTarget, setSimilarWineTarget] = useState<Wine | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'list'>((searchParams.get('view') as 'grid' | 'compact' | 'list') || 'grid');

  // Update URL when filters change
  const updateURL = useCallback((newFilters: Filters, newSearch: string, newSort: SortOption, newShowConsumed: boolean, newViewMode: string) => {
    const params = new URLSearchParams();
    
    if (newSearch) params.set('q', newSearch);
    if (newSort !== 'drink-soon') params.set('sort', newSort);
    if (newShowConsumed) params.set('showConsumed', 'true');
    if (newViewMode !== 'grid') params.set('view', newViewMode);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    
    const queryString = params.toString();
    router.replace(queryString ? `/?${queryString}` : '/', { scroll: false });
  }, [router]);
  
  const handleWineAdded = (wine: Wine) => {
    setUserAddedWines(prev => [...prev, wine]);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [consumedCounts, setConsumedCounts] = useState<Map<string, number>>(new Map());

  // Load consumed counts from localStorage
  useEffect(() => {
    const userData = getUserData();
    const counts = new Map<string, number>();
    
    // Count from consumptionHistory
    for (const [wineId, events] of Object.entries(userData.consumptionHistory || {})) {
      counts.set(wineId, (events as unknown[]).length);
    }
    
    setConsumedCounts(counts);
  }, []);

  // Apply search, filters, and sorting
  const filteredWines = useMemo(() => {
    let wines = allWines;
    
    // Filter out fully consumed wines unless showConsumed is true
    if (!showConsumed) {
      wines = wines.filter(w => {
        const quantity = parseInt(w.quantity) || 1;
        const consumed = consumedCounts.get(w.id) || 0;
        return consumed < quantity; // Show if any bottles remain
      });
    }
    
    wines = searchWines(wines, searchQuery);
    wines = filterWines(wines, filters);
    wines = sortWines(wines, sortBy);
    return wines;
  }, [allWines, searchQuery, filters, showConsumed, consumedCounts, sortBy]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL(newFilters, searchQuery, sortBy, showConsumed, viewMode);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateURL(filters, value, sortBy, showConsumed, viewMode);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    updateURL(filters, searchQuery, value, showConsumed, viewMode);
  };

  const handleShowConsumedChange = (value: boolean) => {
    setShowConsumed(value);
    updateURL(filters, searchQuery, sortBy, value, viewMode);
  };

  const handleViewModeChange = (value: 'grid' | 'compact' | 'list') => {
    setViewMode(value);
    updateURL(filters, searchQuery, sortBy, showConsumed, value);
  };

  const handleClearFilters = () => {
    const emptyFilters: Filters = {
      country: '',
      region: '',
      wineType: '',
      vintage: '',
      body: '',
      tanninLevel: '',
      acidityLevel: '',
      drinkWindowStatus: '',
      grapeVariety: '',
    };
    setSearchQuery('');
    setFilters(emptyFilters);
    router.replace('/', { scroll: false });
  };

  // Calculate stats
  const { activeWineCount, totalBottles } = useMemo(() => {
    let activeCount = 0;
    let bottles = 0;
    
    for (const wine of allWines) {
      const quantity = parseInt(wine.quantity) || 1;
      const consumed = consumedCounts.get(wine.id) || 0;
      const remaining = Math.max(0, quantity - consumed);
      
      if (remaining > 0) {
        activeCount++;
        bottles += remaining;
      }
    }
    
    return { activeWineCount: activeCount, totalBottles: bottles };
  }, [allWines, consumedCounts]);

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur border-b border-white/10 h-16">
        <div className="h-full px-4 md:pl-72 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
              aria-label="Open filters"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
            <button onClick={scrollToTop} className="hidden sm:block">
              <img 
                src="/logo.png" 
                alt="Lucero Wine Collection" 
                className="h-14 w-auto hover:opacity-80 transition-opacity cursor-pointer"
              />
            </button>
            <div>
              <h1 className="text-xl font-light text-white tracking-wide">Lucero Wine Collection</h1>
              <p className="text-xs text-gray-400">
                {activeWineCount} wines &middot; {totalBottles} bottles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddWineModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add Wine</span>
            </button>
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-wine-red hover:bg-wine-red-dark text-white rounded-lg transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="hidden sm:inline">Sommelier</span>
            </button>
          </div>
        </div>
      </header>

      {/* Filter Sidebar */}
      <FilterSidebar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        options={filterOptions}
        resultCount={filteredWines.length}
        totalCount={showConsumed ? allWines.length : activeWineCount}
        showConsumed={showConsumed}
        onShowConsumedChange={handleShowConsumedChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isMobileOpen={isMobileFilterOpen}
        onMobileClose={() => setIsMobileFilterOpen(false)}
      />

      {/* Main Content */}
      <main className="pt-20 pb-24 md:pb-8 px-4 md:pl-72">
        {/* Mobile Quick Filters */}
        <div className="md:hidden mb-4 -mx-4 px-4 py-2 bg-gray-800/50 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => handleFilterChange('wineType', filters.wineType === 'Red' ? '' : 'Red')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filters.wineType === 'Red' 
                  ? 'bg-wine-red text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              🍷 Red
            </button>
            <button
              onClick={() => handleFilterChange('wineType', filters.wineType === 'White' ? '' : 'White')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filters.wineType === 'White' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              🥂 White
            </button>
            <button
              onClick={() => handleFilterChange('wineType', filters.wineType === 'Rosé' ? '' : 'Rosé')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filters.wineType === 'Rosé' 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              🌸 Rosé
            </button>
            <button
              onClick={() => handleFilterChange('drinkWindowStatus', filters.drinkWindowStatus === 'At Peak' ? '' : 'At Peak')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filters.drinkWindowStatus === 'At Peak' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              ⭐ At Peak
            </button>
            <button
              onClick={() => handleFilterChange('drinkWindowStatus', filters.drinkWindowStatus === 'Ready to Drink' ? '' : 'Ready to Drink')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filters.drinkWindowStatus === 'Ready to Drink' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              ✓ Ready
            </button>
          </div>
        </div>

        <WineGrid 
          wines={filteredWines}
          onImageClick={setSelectedImage}
          onFindSimilar={setSimilarWineTarget}
          consumedCounts={consumedCounts}
          viewMode={viewMode}
        />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-40">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={scrollToTop}
            className="flex flex-col items-center justify-center p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-0.5">Home</span>
          </button>
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex flex-col items-center justify-center p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-xs mt-0.5">Filters</span>
          </button>
          <button
            onClick={() => setShowAddWineModal(true)}
            className="flex flex-col items-center justify-center p-2 -mt-4"
          >
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs mt-0.5 text-gray-400">Add</span>
          </button>
          <button
            onClick={() => {
              const newMode = viewMode === 'grid' ? 'compact' : viewMode === 'compact' ? 'list' : 'grid';
              handleViewModeChange(newMode);
            }}
            className="flex flex-col items-center justify-center p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {viewMode === 'grid' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              ) : viewMode === 'compact' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h16v4H4v-4z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
            <span className="text-xs mt-0.5 capitalize">{viewMode}</span>
          </button>
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex flex-col items-center justify-center p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-xs mt-0.5">Chat</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 text-sm md:pl-64">
        <p>Lucero Wine Collection &middot; Est. 2025</p>
      </footer>

      {/* Modals */}
      <ImageModal 
        imageSrc={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
      
      <ChatWidget 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      <SimilarWinesModal
        targetWine={similarWineTarget}
        onClose={() => setSimilarWineTarget(null)}
      />

      <AddWineModal
        isOpen={showAddWineModal}
        onClose={() => setShowAddWineModal(false)}
        onWineAdded={handleWineAdded}
      />

    </div>
  );
}
