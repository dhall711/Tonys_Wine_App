// Wine data types for the catalog

export interface Wine {
  id: string;
  producer: string;
  name: string;
  vintage: string;
  region: string;
  appellation: string;
  country: string;
  grapeVarieties: string;
  blendPercentage: string;
  alcohol: string;
  bottleSize: string;
  wineType: string;
  color: string;
  body: string;
  tanninLevel: string;
  acidityLevel: string;
  oakTreatment: string;
  agingPotential: string;
  drinkWindowStart: string;
  drinkWindowEnd: string;
  currentStatus: string;
  peakDrinking: string;
  purchaseDate: string;
  purchasePrice: string;
  purchaseLocation: string;
  quantity: string;
  consumed: string;
  dateConsumed: string;
  consumptionNotes: string;
  storageLocation: string;
  cellarTemperature: string;
  tastingNotes: string;
  aromaNotes: string;
  foodPairings: string;
  rating: string;
  frontImage: string;
  backImage: string;
  notes: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FilterOptions {
  countries: string[];
  regions: string[];
  wineTypes: string[];
  vintages: string[];
  bodies: string[];
  tanninLevels: string[];
  acidityLevels: string[];
  drinkWindowStatuses: string[];
  grapeVarieties: string[];
}

export interface Filters {
  country: string;
  region: string;
  wineType: string;
  vintage: string;
  body: string;
  tanninLevel: string;
  acidityLevel: string;
  drinkWindowStatus: string;
  grapeVariety: string;
}

export interface ConsumptionEvent {
  id: string;
  date: string;
  notes: string;
}

export interface UserData {
  // Legacy single consumption (deprecated, kept for migration)
  consumedWines: { [wineId: string]: { date: string; notes: string } };
  // New: array of consumption events per wine
  consumptionHistory: { [wineId: string]: ConsumptionEvent[] };
  userNotes: { [wineId: string]: string };
  // User-edited purchase dates
  purchaseDates: { [wineId: string]: string };
  // User-added wines
  addedWines: Wine[];
  // Deleted wine IDs (both catalog and user-added)
  deletedWines: string[];
}

export interface SimilarityScore {
  wine: Wine;
  score: number;
  matchReasons: string[];
}

export type SortOption = 
  | 'drink-soon'
  | 'status-priority'
  | 'producer-az'
  | 'wine-name-az'
  | 'vintage-newest'
  | 'vintage-oldest'
  | 'region'
  | 'rating';
