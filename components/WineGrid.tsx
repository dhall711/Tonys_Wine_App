'use client';

import { Wine } from '@/lib/types';
import { WineCard } from './WineCard';
import { WineCardCompact } from './WineCardCompact';
import { WineCardList } from './WineCardList';

type ViewMode = 'grid' | 'compact' | 'list';

interface WineGridProps {
  wines: Wine[];
  onImageClick?: (imageSrc: string) => void;
  onFindSimilar?: (wine: Wine) => void;
  consumedCounts?: Map<string, number>;
  viewMode?: ViewMode;
}

export function WineGrid({ wines, onImageClick, onFindSimilar, consumedCounts = new Map(), viewMode = 'grid' }: WineGridProps) {
  if (wines.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">No wines match your search</div>
        <p className="text-gray-500 mt-2">Try adjusting your filters or search term</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {wines.map(wine => (
          <WineCardList
            key={wine.id}
            wine={wine}
            onImageClick={onImageClick}
            onFindSimilar={onFindSimilar}
            consumedCount={consumedCounts.get(wine.id) || 0}
          />
        ))}
      </div>
    );
  }

  if (viewMode === 'compact') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {wines.map(wine => (
          <WineCardCompact
            key={wine.id}
            wine={wine}
            onImageClick={onImageClick}
            consumedCount={consumedCounts.get(wine.id) || 0}
          />
        ))}
      </div>
    );
  }

  // Default grid view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {wines.map(wine => (
        <WineCard 
          key={wine.id} 
          wine={wine} 
          onImageClick={onImageClick}
          onFindSimilar={onFindSimilar}
          consumedCount={consumedCounts.get(wine.id) || 0}
        />
      ))}
    </div>
  );
}
