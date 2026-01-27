'use client';

import { useState } from 'react';
import { Wine } from '@/lib/types';
import { addWine } from '@/lib/userData';

interface AddWineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWineAdded: (wine: Wine) => void;
}

const WINE_TYPES = ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified', 'Orange/Amber'];
const BODY_OPTIONS = ['Light', 'Light-Medium', 'Medium', 'Medium-Full', 'Full'];
const TANNIN_OPTIONS = ['N/A', 'Low', 'Low-Medium', 'Medium', 'Medium-High', 'High', 'Very High'];
const ACIDITY_OPTIONS = ['Low', 'Medium', 'Medium-High', 'High'];

export function AddWineModal({ isOpen, onClose, onWineAdded }: AddWineModalProps) {
  const [formData, setFormData] = useState({
    producer: '',
    name: '',
    vintage: '',
    region: '',
    country: '',
    appellation: '',
    grapeVarieties: '',
    wineType: 'Red',
    alcohol: '',
    body: 'Medium',
    tanninLevel: 'Medium',
    acidityLevel: 'Medium',
    quantity: '1',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: '',
    purchaseLocation: '',
    drinkWindowStart: '',
    drinkWindowEnd: '',
    tastingNotes: '',
    aromaNotes: '',
    foodPairings: '',
    notes: '',
  });
  
  const [frontImageData, setFrontImageData] = useState<string>('');
  const [backImageData, setBackImageData] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Compress image for storage while keeping original for AI analysis
  const compressImage = (dataUrl: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Scale down if wider than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB for upload)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Please use an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const originalDataUrl = event.target?.result as string;
      
      // Compress for storage (keeps localStorage manageable)
      const compressedDataUrl = await compressImage(originalDataUrl, 800, 0.7);
      
      if (type === 'front') {
        setFrontImageData(compressedDataUrl);
        // Store original temporarily for AI analysis
        (window as unknown as Record<string, string>).__frontImageOriginal = originalDataUrl;
      } else {
        setBackImageData(compressedDataUrl);
        (window as unknown as Record<string, string>).__backImageOriginal = originalDataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const analyzeLabel = async (imageData: string, type: 'front' | 'back') => {
    if (!imageData) {
      setAnalysisError('Please upload an image first');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    // Use original high-res image for AI analysis if available
    const originalKey = type === 'front' ? '__frontImageOriginal' : '__backImageOriginal';
    const analysisImage = (window as unknown as Record<string, string>)[originalKey] || imageData;

    try {
      const response = await fetch('/api/analyze-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: analysisImage }),
      });

      const result = await response.json();

      if (result.error) {
        setAnalysisError(result.error);
        return;
      }

      if (result.data) {
        // Populate form with extracted data
        setFormData(prev => ({
          ...prev,
          producer: result.data.producer || prev.producer,
          name: result.data.name || prev.name,
          vintage: result.data.vintage || prev.vintage,
          country: result.data.country || prev.country,
          region: result.data.region || prev.region,
          appellation: result.data.appellation || prev.appellation,
          grapeVarieties: result.data.grapeVarieties || prev.grapeVarieties,
          wineType: result.data.wineType || prev.wineType,
          alcohol: result.data.alcohol || prev.alcohol,
          body: result.data.body || prev.body,
          tanninLevel: result.data.tanninLevel || prev.tanninLevel,
          acidityLevel: result.data.acidityLevel || prev.acidityLevel,
          drinkWindowStart: result.data.drinkWindowStart || prev.drinkWindowStart,
          drinkWindowEnd: result.data.drinkWindowEnd || prev.drinkWindowEnd,
          tastingNotes: result.data.tastingNotes || prev.tastingNotes,
          aromaNotes: result.data.aromaNotes || prev.aromaNotes,
          foodPairings: result.data.foodPairings || prev.foodPairings,
          notes: result.data.notes || prev.notes,
        }));
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.producer || !formData.name) {
      alert('Please enter at least a producer and wine name.');
      return;
    }

    setIsSubmitting(true);

    // Generate a unique ID for the new wine
    const wineId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newWine: Wine = {
      id: wineId,
      producer: formData.producer,
      name: formData.name,
      vintage: formData.vintage,
      region: formData.region,
      country: formData.country,
      appellation: formData.appellation,
      grapeVarieties: formData.grapeVarieties,
      blendPercentage: '',
      alcohol: formData.alcohol,
      bottleSize: '750ml',
      wineType: formData.wineType,
      color: '',
      body: formData.body,
      tanninLevel: formData.tanninLevel,
      acidityLevel: formData.acidityLevel,
      oakTreatment: '',
      agingPotential: '',
      drinkWindowStart: formData.drinkWindowStart,
      drinkWindowEnd: formData.drinkWindowEnd,
      currentStatus: 'Ready to Drink',
      peakDrinking: '',
      purchaseDate: formData.purchaseDate,
      purchasePrice: formData.purchasePrice,
      purchaseLocation: formData.purchaseLocation,
      quantity: formData.quantity,
      consumed: '',
      dateConsumed: '',
      consumptionNotes: '',
      storageLocation: '',
      cellarTemperature: '',
      tastingNotes: formData.tastingNotes,
      aromaNotes: formData.aromaNotes,
      foodPairings: formData.foodPairings,
      rating: '',
      frontImage: frontImageData, // Will be uploaded to storage by API
      backImage: backImageData,   // Will be uploaded to storage by API
      notes: formData.notes,
    };

    try {
      // Use API to add wine (handles image upload to Supabase Storage)
      const response = await fetch('/api/wines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWine),
      });
      
      const result = await response.json();
      
      if (result.error) {
        alert(`Error adding wine: ${result.error}`);
        setIsSubmitting(false);
        return;
      }
      
      // Also save to localStorage for offline/hybrid support
      addWine(newWine);
      
      onWineAdded(result.wine || newWine);
    } catch (error) {
      console.error('Error adding wine:', error);
      // Fallback to localStorage only
      const addedWine = addWine(newWine);
      onWineAdded(addedWine);
    }
    
    // Reset form
    setFormData({
      producer: '',
      name: '',
      vintage: '',
      region: '',
      country: '',
      appellation: '',
      grapeVarieties: '',
      wineType: 'Red',
      alcohol: '',
      body: 'Medium',
      tanninLevel: 'Medium',
      acidityLevel: 'Medium',
      quantity: '1',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: '',
      purchaseLocation: '',
      drinkWindowStart: '',
      drinkWindowEnd: '',
      tastingNotes: '',
      aromaNotes: '',
      foodPairings: '',
      notes: '',
    });
    setFrontImageData('');
    setBackImageData('');
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-4">
      <div 
        className="fixed inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-wine-red to-wine-red-dark text-white p-4 rounded-t-xl sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Add New Wine</h2>
            <button
              onClick={onClose}
              className="text-2xl hover:opacity-80"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Images with AI Analysis */}
          <section className="bg-blue-50 -mx-6 -mt-6 p-6 border-b border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-2">Step 1: Upload Label Photos</h3>
            <p className="text-xs text-blue-600 mb-4">Upload photos of the wine labels, then use AI to automatically fill in the details below.</p>
            
            {analysisError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {analysisError}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Front Label</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'front')}
                  className="w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                />
                {frontImageData && (
                  <div className="mt-3">
                    <img src={frontImageData} alt="Front label preview" className="h-28 object-contain rounded mx-auto" />
                    <button
                      type="button"
                      onClick={() => analyzeLabel(frontImageData, 'front')}
                      disabled={isAnalyzing}
                      className="mt-2 w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          AI Analyze Front
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Back Label</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'back')}
                  className="w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                />
                {backImageData && (
                  <div className="mt-3">
                    <img src={backImageData} alt="Back label preview" className="h-28 object-contain rounded mx-auto" />
                    <button
                      type="button"
                      onClick={() => analyzeLabel(backImageData, 'back')}
                      disabled={isAnalyzing}
                      className="mt-2 w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          AI Analyze Back
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {(frontImageData || backImageData) && (
              <p className="mt-3 text-xs text-blue-600 italic">
                Tip: Front labels usually have producer/wine name. Back labels often have tasting notes, alcohol %, and region details.
              </p>
            )}
          </section>

          {/* Basic Info */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producer *</label>
                <input
                  type="text"
                  name="producer"
                  value={formData.producer}
                  onChange={handleInputChange}
                  placeholder="e.g., Marchesi di Barolo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wine Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Barolo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vintage</label>
                <input
                  type="text"
                  name="vintage"
                  value={formData.vintage}
                  onChange={handleInputChange}
                  placeholder="e.g., 2020"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wine Type</label>
                <select
                  name="wineType"
                  value={formData.wineType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                >
                  {WINE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Origin */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Origin</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="e.g., Italy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  placeholder="e.g., Piemonte"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appellation</label>
                <input
                  type="text"
                  name="appellation"
                  value={formData.appellation}
                  onChange={handleInputChange}
                  placeholder="e.g., Barolo DOCG"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grape Varieties</label>
                <input
                  type="text"
                  name="grapeVarieties"
                  value={formData.grapeVarieties}
                  onChange={handleInputChange}
                  placeholder="e.g., Nebbiolo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
            </div>
          </section>

          {/* Character */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Character</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <select
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                >
                  {BODY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tannins</label>
                <select
                  name="tanninLevel"
                  value={formData.tanninLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                >
                  {TANNIN_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acidity</label>
                <select
                  name="acidityLevel"
                  value={formData.acidityLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                >
                  {ACIDITY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alcohol %</label>
                <input
                  type="text"
                  name="alcohol"
                  value={formData.alcohol}
                  onChange={handleInputChange}
                  placeholder="e.g., 14"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
            </div>
          </section>

          {/* Purchase & Quantity */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Purchase Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="text"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleInputChange}
                  placeholder="e.g., €25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="purchaseLocation"
                  value={formData.purchaseLocation}
                  onChange={handleInputChange}
                  placeholder="e.g., Enoteca Roma"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
            </div>
          </section>

          {/* Drink Window */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Drink Window</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Drink From (Year)</label>
                <input
                  type="text"
                  name="drinkWindowStart"
                  value={formData.drinkWindowStart}
                  onChange={handleInputChange}
                  placeholder="e.g., 2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Drink Until (Year)</label>
                <input
                  type="text"
                  name="drinkWindowEnd"
                  value={formData.drinkWindowEnd}
                  onChange={handleInputChange}
                  placeholder="e.g., 2035"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
            </div>
          </section>

          {/* Tasting Notes */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Tasting Notes</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Palate / Tasting Notes</label>
                <textarea
                  name="tastingNotes"
                  value={formData.tastingNotes}
                  onChange={handleInputChange}
                  placeholder="Describe the flavors and texture..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aromas</label>
                <input
                  type="text"
                  name="aromaNotes"
                  value={formData.aromaNotes}
                  onChange={handleInputChange}
                  placeholder="e.g., Cherry, rose, tar, leather"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Pairings</label>
                <input
                  type="text"
                  name="foodPairings"
                  value={formData.foodPairings}
                  onChange={handleInputChange}
                  placeholder="e.g., Braised meats, truffles, aged cheeses"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any other notes about this wine..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-red focus:border-transparent outline-none"
                />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-wine-red hover:bg-wine-red-dark text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Wine'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
