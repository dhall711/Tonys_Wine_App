'use client';

import { Wine } from '@/lib/types';
import { getDrinkWindowStatus } from '@/lib/wines';
import Link from 'next/link';

interface WineCardProps {
  wine: Wine;
  onImageClick?: (imageSrc: string) => void;
  onFindSimilar?: (wine: Wine) => void;
  consumedCount?: number;
}

export function WineCard({ wine, onImageClick, onFindSimilar, consumedCount = 0 }: WineCardProps) {
  const totalQuantity = parseInt(wine.quantity) || 1;
  const remainingBottles = Math.max(0, totalQuantity - consumedCount);
  const fullyConsumed = remainingBottles === 0;
  const isUserAdded = wine.id.startsWith('user-');
  const getHeaderColor = () => {
    const type = wine.wineType?.toLowerCase() || '';
    if (type.includes('white')) return 'bg-gradient-to-r from-amber-500 to-amber-700';
    if (type.includes('rosé') || type.includes('rose')) return 'bg-gradient-to-r from-pink-400 to-pink-600';
    return 'bg-gradient-to-r from-wine-red to-wine-red-dark';
  };

  const drinkStatus = getDrinkWindowStatus(wine);
  
  const getStatusBadge = () => {
    switch (drinkStatus) {
      case 'At Peak':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500 text-white font-medium">At Peak</span>;
      case 'Ready to Drink':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Ready</span>;
      case 'Too Young':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Too Young</span>;
      case 'Past Prime':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Past Prime</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Unknown</span>;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ${fullyConsumed ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className={`${getHeaderColor()} text-white p-4 relative`}>
        {fullyConsumed && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 rounded text-xs font-medium">
            All Consumed
          </div>
        )}
        {isUserAdded && !fullyConsumed && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-green-500/80 rounded text-xs font-medium">
            Added
          </div>
        )}
        {wine.rating && !fullyConsumed && (
          <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-wine-gold flex items-center justify-center text-sm font-bold text-gray-900">
            {wine.rating}
          </div>
        )}
        <div className="text-sm opacity-90 uppercase tracking-wider">{wine.producer}</div>
        <div className="text-lg font-semibold mt-1 flex items-center gap-2 flex-wrap">
          {wine.name}
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            fullyConsumed 
              ? 'bg-gray-500 text-white' 
              : consumedCount > 0 
                ? 'bg-amber-400 text-gray-900' 
                : 'bg-wine-gold text-gray-900'
          }`}>
            {fullyConsumed 
              ? `${totalQuantity} consumed` 
              : consumedCount > 0 
                ? `${remainingBottles}/${totalQuantity} left`
                : `${totalQuantity} bottle${totalQuantity !== 1 ? 's' : ''}`
            }
          </span>
        </div>
        <div className="text-xl opacity-90">{wine.vintage || 'NV'}</div>
      </div>

      {/* Images */}
      <div className="flex justify-center gap-3 p-4 bg-gray-50 min-h-[160px] items-center">
        {wine.frontImage ? (
          <img
            src={wine.frontImage}
            alt={`${wine.name} front label`}
            className="max-h-36 rounded shadow cursor-pointer hover:scale-105 transition-transform"
            onClick={() => onImageClick?.(wine.frontImage)}
          />
        ) : (
          <span className="text-gray-400 text-sm italic">No front image</span>
        )}
        {wine.backImage && wine.backImage !== wine.frontImage && (
          <img
            src={wine.backImage}
            alt={`${wine.name} back label`}
            className="max-h-36 rounded shadow cursor-pointer hover:scale-105 transition-transform"
            onClick={() => onImageClick?.(wine.backImage)}
          />
        )}
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500 text-xs uppercase">Region</span>
            <div className="font-medium">{wine.region}, {wine.country}</div>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase">Type</span>
            <div className="font-medium">{wine.wineType}</div>
          </div>
          {wine.grapeVarieties && (
            <div className="col-span-2">
              <span className="text-gray-500 text-xs uppercase">Grapes</span>
              <div className="font-medium text-sm truncate">{wine.grapeVarieties}</div>
            </div>
          )}
          <div>
            <span className="text-gray-500 text-xs uppercase">Drink Window</span>
            <div className="font-medium">
              {wine.drinkWindowStart && wine.drinkWindowEnd 
                ? `${wine.drinkWindowStart}-${wine.drinkWindowEnd}` 
                : '—'}
            </div>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase">Status</span>
            <div>{getStatusBadge()}</div>
          </div>
        </div>

        {wine.tastingNotes && (
          <div className="text-sm text-gray-700 bg-rose-50 p-3 rounded-lg border-l-3 border-wine-red line-clamp-3">
            <strong>Palate:</strong> {wine.tastingNotes}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link 
            href={`/wine/${wine.id}`}
            className="flex-1 text-center py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            View Details
          </Link>
          {onFindSimilar && (
            <button
              onClick={() => onFindSimilar(wine)}
              className="py-2 px-3 bg-wine-red/10 hover:bg-wine-red/20 rounded-lg text-sm font-medium text-wine-red transition-colors"
              title="Find Similar Wines"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
