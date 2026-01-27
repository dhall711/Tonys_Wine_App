'use client';

import { Wine } from '@/lib/types';
import { getDrinkWindowStatus } from '@/lib/wines';
import Link from 'next/link';

interface WineCardCompactProps {
  wine: Wine;
  onImageClick?: (imageSrc: string) => void;
  consumedCount?: number;
}

export function WineCardCompact({ wine, onImageClick, consumedCount = 0 }: WineCardCompactProps) {
  const totalQuantity = parseInt(wine.quantity) || 1;
  const remainingBottles = Math.max(0, totalQuantity - consumedCount);
  const fullyConsumed = remainingBottles === 0;
  const drinkStatus = getDrinkWindowStatus(wine);

  const getStatusColor = () => {
    switch (drinkStatus) {
      case 'At Peak': return 'bg-green-500';
      case 'Ready to Drink': return 'bg-blue-500';
      case 'Too Young': return 'bg-yellow-500';
      case 'Past Prime': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getTypeColor = () => {
    const type = wine.wineType?.toLowerCase() || '';
    if (type.includes('white')) return 'border-amber-400';
    if (type.includes('rosé') || type.includes('rose')) return 'border-pink-400';
    return 'border-wine-red';
  };

  return (
    <Link href={`/wine/${wine.id}`}>
      <div className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden border-l-4 ${getTypeColor()} ${fullyConsumed ? 'opacity-50' : ''}`}>
        {/* Image */}
        <div className="aspect-square bg-gray-100 relative">
          {wine.frontImage ? (
            <img
              src={wine.frontImage}
              alt={wine.name}
              className="w-full h-full object-cover"
              onClick={(e) => {
                e.preventDefault();
                onImageClick?.(wine.frontImage);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No image
            </div>
          )}
          
          {/* Status dot */}
          <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${getStatusColor()}`} title={drinkStatus} />
          
          {/* Bottle count */}
          {!fullyConsumed && remainingBottles > 0 && (
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
              {remainingBottles}
            </div>
          )}
          
          {fullyConsumed && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-medium">Consumed</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2">
          <p className="text-xs text-gray-500 truncate">{wine.producer}</p>
          <p className="text-sm font-medium text-gray-900 truncate">{wine.name}</p>
          <p className="text-xs text-gray-600">{wine.vintage || 'NV'}</p>
        </div>
      </div>
    </Link>
  );
}
