'use client';

import { Wine } from '@/lib/types';
import { getDrinkWindowStatus } from '@/lib/wines';
import Link from 'next/link';

interface WineCardListProps {
  wine: Wine;
  onImageClick?: (imageSrc: string) => void;
  onFindSimilar?: (wine: Wine) => void;
  consumedCount?: number;
}

export function WineCardList({ wine, onImageClick, onFindSimilar, consumedCount = 0 }: WineCardListProps) {
  const totalQuantity = parseInt(wine.quantity) || 1;
  const remainingBottles = Math.max(0, totalQuantity - consumedCount);
  const fullyConsumed = remainingBottles === 0;
  const drinkStatus = getDrinkWindowStatus(wine);

  const getStatusBadge = () => {
    switch (drinkStatus) {
      case 'At Peak':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-500 text-white">Peak</span>;
      case 'Ready to Drink':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">Ready</span>;
      case 'Too Young':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">Young</span>;
      case 'Past Prime':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Past</span>;
      default:
        return null;
    }
  };

  const getTypeColor = () => {
    const type = wine.wineType?.toLowerCase() || '';
    if (type.includes('white')) return 'border-l-amber-500';
    if (type.includes('rosé') || type.includes('rose')) return 'border-l-pink-500';
    return 'border-l-wine-red';
  };

  return (
    <div className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden border-l-4 ${getTypeColor()} ${fullyConsumed ? 'opacity-50' : ''}`}>
      <div className="flex items-stretch">
        {/* Image */}
        <div className="w-20 h-24 flex-shrink-0 bg-gray-100">
          {wine.frontImage ? (
            <img
              src={wine.frontImage}
              alt={wine.name}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onImageClick?.(wine.frontImage)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No img
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 truncate">{wine.producer}</p>
              <h3 className="font-semibold text-gray-900 truncate">{wine.name}</h3>
              <p className="text-sm text-gray-600">
                {wine.vintage || 'NV'} &middot; {wine.region}, {wine.country}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {getStatusBadge()}
              {!fullyConsumed && (
                <span className="text-xs text-gray-500">
                  {remainingBottles}/{totalQuantity}
                </span>
              )}
            </div>
          </div>
          
          {/* Extra info row */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>{wine.wineType}</span>
            {wine.grapeVarieties && (
              <span className="truncate max-w-32">{wine.grapeVarieties}</span>
            )}
            {wine.drinkWindowStart && wine.drinkWindowEnd && (
              <span>Drink {wine.drinkWindowStart}-{wine.drinkWindowEnd}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col justify-center gap-1 px-2 border-l border-gray-100">
          <Link
            href={`/wine/${wine.id}`}
            className="p-2 text-gray-400 hover:text-wine-red rounded-full hover:bg-gray-100"
            title="View Details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          {onFindSimilar && (
            <button
              onClick={() => onFindSimilar(wine)}
              className="p-2 text-gray-400 hover:text-wine-red rounded-full hover:bg-gray-100"
              title="Find Similar"
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
