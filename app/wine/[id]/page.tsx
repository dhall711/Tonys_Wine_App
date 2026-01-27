'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { getWineById, getAllWines, findSimilarWines, getDrinkWindowStatus } from '@/lib/wines';
import { getUserNote, saveUserNote, getConsumptionHistory, addConsumption, removeConsumption, getRemainingCount, isFullyConsumed, getPurchaseDate, savePurchaseDate, isUserAddedWine, deleteWine } from '@/lib/userData';
import { ConsumptionEvent } from '@/lib/types';
import { ImageModal } from '@/components/ImageModal';
import Link from 'next/link';

export default function WineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const wine = useMemo(() => getWineById(params.id as string), [params.id]);
  const allWines = useMemo(() => getAllWines(), []);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [consumptionHistory, setConsumptionHistory] = useState<ConsumptionEvent[]>([]);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [consumeDate, setConsumeDate] = useState(new Date().toISOString().split('T')[0]);
  const [consumeNotes, setConsumeNotes] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [isEditingPurchaseDate, setIsEditingPurchaseDate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isUserAdded = wine ? isUserAddedWine(wine.id) : false;
  const totalQuantity = parseInt(wine?.quantity || '1') || 1;
  const remainingBottles = wine ? getRemainingCount(wine.id, totalQuantity) : 0;
  const fullyConsumed = wine ? isFullyConsumed(wine.id, totalQuantity) : false;

  // Load user data
  useEffect(() => {
    if (wine) {
      setUserNote(getUserNote(wine.id));
      setConsumptionHistory(getConsumptionHistory(wine.id));
      // Load user-edited purchase date or fall back to original
      const userPurchaseDate = getPurchaseDate(wine.id);
      setPurchaseDate(userPurchaseDate || wine.purchaseDate || '');
    }
  }, [wine]);

  // Refresh consumption history
  const refreshConsumptionHistory = () => {
    if (wine) {
      setConsumptionHistory(getConsumptionHistory(wine.id));
    }
  };

  const similarWines = useMemo(() => {
    if (!wine) return [];
    return findSimilarWines(wine, allWines, 4);
  }, [wine, allWines]);

  if (!wine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">Wine not found</h1>
          <Link href="/" className="text-wine-gold hover:underline">
            Return to catalog
          </Link>
        </div>
      </div>
    );
  }

  const getHeaderColor = () => {
    const type = wine.wineType?.toLowerCase() || '';
    if (type.includes('white')) return 'bg-gradient-to-r from-amber-500 to-amber-700';
    if (type.includes('rosé') || type.includes('rose')) return 'bg-gradient-to-r from-pink-400 to-pink-600';
    return 'bg-gradient-to-r from-wine-red to-wine-red-dark';
  };

  const drinkStatus = getDrinkWindowStatus(wine);

  const handleSaveNote = () => {
    saveUserNote(wine.id, userNote);
    setIsEditingNote(false);
  };

  const handleAddConsumption = () => {
    addConsumption(wine.id, consumeDate, consumeNotes);
    refreshConsumptionHistory();
    setShowConsumeModal(false);
    setConsumeNotes('');
    setConsumeDate(new Date().toISOString().split('T')[0]);
  };

  const handleRemoveConsumption = (eventId: string) => {
    if (confirm('Remove this consumption record?')) {
      removeConsumption(wine.id, eventId);
      refreshConsumptionHistory();
    }
  };

  const handleSavePurchaseDate = () => {
    savePurchaseDate(wine.id, purchaseDate);
    setIsEditingPurchaseDate(false);
  };

  const handleCancelPurchaseDateEdit = () => {
    const userPurchaseDate = getPurchaseDate(wine.id);
    setPurchaseDate(userPurchaseDate || wine.purchaseDate || '');
    setIsEditingPurchaseDate(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to catalog
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors text-sm"
                title="Delete this wine"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
              <Link href="/" className="flex items-center gap-2">
                <img 
                  src="/logo.png" 
                  alt="Lucero Wine Collection" 
                  className="h-14 w-auto"
                />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Wine Details */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${fullyConsumed ? 'ring-2 ring-gray-400' : ''}`}>
          {/* Hero Header */}
          <div className={`${getHeaderColor()} text-white p-6 md:p-8 relative`}>
            <div className="absolute top-4 left-4 flex gap-2">
              {isUserAdded && (
                <div className="px-3 py-1 bg-green-500/80 rounded-full text-sm font-medium">
                  Added by You
                </div>
              )}
              {fullyConsumed && (
                <div className="px-3 py-1 bg-black/50 rounded-full text-sm font-medium">
                  All Consumed
                </div>
              )}
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm opacity-80 uppercase tracking-wider">{wine.producer}</p>
                <h1 className="text-2xl md:text-3xl font-bold mt-1">{wine.name}</h1>
                <p className="text-xl mt-2">{wine.vintage || 'Non-Vintage'}</p>
              </div>
              <div className="text-right">
                <div className="bg-wine-gold text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
                  {remainingBottles} of {totalQuantity} remaining
                </div>
                {wine.rating && (
                  <div className="mt-2 text-3xl font-bold">{wine.rating}</div>
                )}
              </div>
            </div>
          </div>

          {/* Drink Status Banner */}
          <div className={`px-6 py-3 flex items-center justify-between ${
            drinkStatus === 'At Peak' ? 'bg-green-100 text-green-800' :
            drinkStatus === 'Ready to Drink' ? 'bg-blue-100 text-blue-800' :
            drinkStatus === 'Too Young' ? 'bg-yellow-100 text-yellow-800' :
            drinkStatus === 'Past Prime' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-600'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{drinkStatus}</span>
              {wine.drinkWindowStart && wine.drinkWindowEnd && (
                <span className="text-sm opacity-80">
                  (Drink {wine.drinkWindowStart}-{wine.drinkWindowEnd})
                </span>
              )}
            </div>
            {remainingBottles > 0 && (
              <button
                onClick={() => setShowConsumeModal(true)}
                className="px-3 py-1 bg-white/80 hover:bg-white rounded-full text-sm font-medium transition-colors"
              >
                Log Consumption
              </button>
            )}
          </div>

          {/* Consumption History */}
          {consumptionHistory.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Consumption History ({consumptionHistory.length} bottle{consumptionHistory.length !== 1 ? 's' : ''})
              </h3>
              <div className="space-y-2">
                {consumptionHistory.map((event, index) => (
                  <div key={event.id} className="flex items-start justify-between bg-white rounded-lg px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">
                        Bottle {index + 1}:
                      </span>{' '}
                      <span className="text-gray-600">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                      {event.notes && (
                        <p className="text-gray-500 mt-1 text-xs">{event.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveConsumption(event.id)}
                      className="text-gray-400 hover:text-red-500 ml-2"
                      title="Remove this record"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          <div className="flex flex-wrap justify-center gap-4 p-6 bg-gray-50">
            {wine.frontImage && (
              <img
                src={wine.frontImage}
                alt="Front label"
                className="max-h-64 rounded-lg shadow-md cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setSelectedImage(wine.frontImage)}
              />
            )}
            {wine.backImage && wine.backImage !== wine.frontImage && (
              <img
                src={wine.backImage}
                alt="Back label"
                className="max-h-64 rounded-lg shadow-md cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setSelectedImage(wine.backImage)}
              />
            )}
          </div>

          {/* Details Grid */}
          <div className="p-6 space-y-6">
            {/* User Notes Section */}
            <section className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">My Notes</h2>
                {!isEditingNote && (
                  <button
                    onClick={() => setIsEditingNote(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {userNote ? 'Edit' : 'Add Note'}
                  </button>
                )}
              </div>
              {isEditingNote ? (
                <div className="space-y-2">
                  <textarea
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="Add your personal notes about this wine..."
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNote}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setUserNote(getUserNote(wine.id));
                        setIsEditingNote(false);
                      }}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : userNote ? (
                <p className="text-gray-700">{userNote}</p>
              ) : (
                <p className="text-gray-500 italic text-sm">No personal notes yet</p>
              )}
            </section>

            {/* Basic Info */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Wine Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoItem label="Region" value={wine.region} />
                <InfoItem label="Country" value={wine.country} />
                <InfoItem label="Appellation" value={wine.appellation} />
                <InfoItem label="Wine Type" value={wine.wineType} />
                <InfoItem label="Color" value={wine.color} />
                <InfoItem label="Alcohol" value={wine.alcohol ? `${wine.alcohol}%` : undefined} />
                <InfoItem label="Grape Varieties" value={wine.grapeVarieties} className="col-span-2 md:col-span-3" />
              </div>
            </section>

            {/* Structure */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Structure</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoItem label="Body" value={wine.body} />
                <InfoItem label="Tannins" value={wine.tanninLevel} />
                <InfoItem label="Acidity" value={wine.acidityLevel} />
                <InfoItem label="Oak" value={wine.oakTreatment} />
              </div>
            </section>

            {/* Drinking Window */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Drinking Window</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoItem label="Drink From" value={wine.drinkWindowStart} />
                <InfoItem label="Drink Until" value={wine.drinkWindowEnd} />
                <InfoItem label="Peak Drinking" value={wine.peakDrinking} />
                <InfoItem label="Current Status" value={wine.currentStatus} />
                <InfoItem label="Aging Potential" value={wine.agingPotential ? `${wine.agingPotential} years` : undefined} />
              </div>
            </section>

            {/* Tasting Notes */}
            {(wine.tastingNotes || wine.aromaNotes) && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Tasting Notes</h2>
                {wine.tastingNotes && (
                  <div className="bg-rose-50 p-4 rounded-lg mb-3 border-l-4 border-wine-red">
                    <p className="text-sm font-medium text-gray-700 mb-1">Palate</p>
                    <p className="text-gray-600">{wine.tastingNotes}</p>
                  </div>
                )}
                {wine.aromaNotes && (
                  <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
                    <p className="text-sm font-medium text-gray-700 mb-1">Aromas</p>
                    <p className="text-gray-600">{wine.aromaNotes}</p>
                  </div>
                )}
              </section>
            )}

            {/* Food Pairings */}
            {wine.foodPairings && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Food Pairings</h2>
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <p className="text-gray-600">{wine.foodPairings}</p>
                </div>
              </section>
            )}

            {/* Winemaker Notes */}
            {wine.notes && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Winemaker Notes</h2>
                <p className="text-gray-600">{wine.notes}</p>
              </section>
            )}

            {/* Similar Wines */}
            {similarWines.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Similar Wines in Your Collection</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {similarWines.map(({ wine: similar, score, matchReasons }) => (
                    <Link
                      key={similar.id}
                      href={`/wine/${similar.id}`}
                      className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                    >
                      {similar.frontImage && (
                        <img
                          src={similar.frontImage}
                          alt={similar.name}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      )}
                      <p className="text-xs text-gray-500">{similar.producer}</p>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{similar.name}</p>
                      <p className="text-xs text-gray-500">{similar.vintage || 'NV'}</p>
                      <div className="mt-1 text-xs text-wine-red font-medium">{score}% match</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Purchase Info */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Purchase Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Editable Purchase Date */}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Purchase Date</p>
                    {!isEditingPurchaseDate && (
                      <button
                        onClick={() => setIsEditingPurchaseDate(true)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {isEditingPurchaseDate ? (
                    <div className="mt-1 space-y-2">
                      <input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSavePurchaseDate}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelPurchaseDateEdit}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {purchaseDate ? new Date(purchaseDate).toLocaleDateString() : '—'}
                    </p>
                  )}
                </div>
                <InfoItem label="Price" value={wine.purchasePrice} />
                <InfoItem label="Location" value={wine.purchaseLocation} />
              </div>
            </section>
          </div>
        </div>
      </main>

      <ImageModal 
        imageSrc={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      {/* Consume Modal */}
      {showConsumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowConsumeModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Log Bottle Consumption</h3>
            <p className="text-sm text-gray-600 mb-4">
              Recording 1 bottle. You have {remainingBottles} remaining.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Consumed</label>
                <input
                  type="date"
                  value={consumeDate}
                  onChange={(e) => setConsumeDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={consumeNotes}
                  onChange={(e) => setConsumeNotes(e.target.value)}
                  placeholder="How was it? Where did you enjoy it?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddConsumption}
                  className="flex-1 py-2 bg-wine-red hover:bg-wine-red-dark text-white rounded-lg font-medium transition-colors"
                >
                  Log Consumption
                </button>
                <button
                  onClick={() => setShowConsumeModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Wine</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>{wine.producer} {wine.name}</strong> from your collection?
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteWine(wine.id);
                    router.push('/');
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Delete Wine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, className = '' }: { label: string; value?: string; className?: string }) {
  if (!value || value === 'N/A') return null;
  
  return (
    <div className={className}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-gray-900 font-medium">{value}</p>
    </div>
  );
}
