'use client';

import { Wine, SimilarityScore } from '@/lib/types';
import { findSimilarWines, getAllWines } from '@/lib/wines';
import { useMemo } from 'react';
import Link from 'next/link';

interface SimilarWinesModalProps {
  targetWine: Wine | null;
  onClose: () => void;
}

export function SimilarWinesModal({ targetWine, onClose }: SimilarWinesModalProps) {
  const allWines = useMemo(() => getAllWines(), []);
  
  const similarWines = useMemo(() => {
    if (!targetWine) return [];
    return findSimilarWines(targetWine, allWines, 6);
  }, [targetWine, allWines]);

  if (!targetWine) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-wine-red to-wine-red-dark text-white p-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold">Similar Wines</h2>
              <p className="text-sm opacity-80 mt-1">
                Wines similar to <span className="font-medium">{targetWine.producer} {targetWine.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-2xl hover:opacity-80"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {similarWines.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No similar wines found in your collection.
            </p>
          ) : (
            <div className="space-y-4">
              {similarWines.map(({ wine, score, matchReasons }) => (
                <div 
                  key={wine.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* Image */}
                  {wine.frontImage ? (
                    <img
                      src={wine.frontImage}
                      alt={wine.name}
                      className="w-16 h-24 object-cover rounded shadow"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-gray-500">{wine.producer}</p>
                        <h3 className="font-semibold text-gray-900">{wine.name}</h3>
                        <p className="text-sm text-gray-600">{wine.vintage || 'NV'} &middot; {wine.region}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-wine-red/10 text-wine-red px-2 py-1 rounded-full">
                        <span className="text-sm font-semibold">{score}%</span>
                        <span className="text-xs">match</span>
                      </div>
                    </div>

                    {/* Match Reasons */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {matchReasons.slice(0, 4).map((reason, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>

                    {/* View Link */}
                    <Link
                      href={`/wine/${wine.id}`}
                      onClick={onClose}
                      className="inline-block mt-2 text-sm text-wine-red hover:text-wine-red-dark font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
