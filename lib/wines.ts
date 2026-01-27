// Wine data utilities
import { Wine, FilterOptions, Filters, SimilarityScore, SortOption } from './types';
import wineData from '@/data/wine-catalog.json';

// Get user-added wines from localStorage (client-side only)
function getStoredUserWines(): Wine[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('wine-catalog-user-data');
    if (stored) {
      const data = JSON.parse(stored);
      return data.addedWines || [];
    }
  } catch (e) {
    console.error('Error reading user wines:', e);
  }
  return [];
}

// Get deleted wine IDs from localStorage (client-side only)
function getStoredDeletedWineIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('wine-catalog-user-data');
    if (stored) {
      const data = JSON.parse(stored);
      return data.deletedWines || [];
    }
  } catch (e) {
    console.error('Error reading deleted wines:', e);
  }
  return [];
}

// Get all wines (catalog + user-added, excluding deleted)
export function getAllWines(): Wine[] {
  const catalogWines = wineData as Wine[];
  const userWines = getStoredUserWines();
  const deletedIds = getStoredDeletedWineIds();
  const combined = [...catalogWines, ...userWines];
  return combined.filter(wine => !deletedIds.includes(wine.id));
}

// Get catalog wines only (for server-side use)
export function getCatalogWines(): Wine[] {
  return wineData as Wine[];
}

// Get a single wine by ID (checks both catalog and user-added)
export function getWineById(id: string): Wine | undefined {
  // First check catalog
  const catalogWine = (wineData as Wine[]).find(wine => wine.id === id);
  if (catalogWine) return catalogWine;
  
  // Then check user-added wines
  const userWines = getStoredUserWines();
  return userWines.find(wine => wine.id === id);
}

// Get active (not consumed) wines
export function getActiveWines(): Wine[] {
  return (wineData as Wine[]).filter(
    wine => !wine.consumed || wine.consumed.toLowerCase() !== 'yes'
  );
}

// Get drink window status for a wine
export function getDrinkWindowStatus(wine: Wine): string {
  const currentYear = new Date().getFullYear();
  const startYear = parseInt(wine.drinkWindowStart) || 0;
  const endYear = parseInt(wine.drinkWindowEnd) || 9999;
  
  if (currentYear < startYear) return 'Too Young';
  if (currentYear > endYear) return 'Past Prime';
  if (currentYear >= startYear && currentYear <= endYear) {
    // Check if in peak
    if (wine.peakDrinking) {
      const peakMatch = wine.peakDrinking.match(/(\d{4})-(\d{4})/);
      if (peakMatch) {
        const peakStart = parseInt(peakMatch[1]);
        const peakEnd = parseInt(peakMatch[2]);
        if (currentYear >= peakStart && currentYear <= peakEnd) return 'At Peak';
      }
    }
    return 'Ready to Drink';
  }
  return 'Unknown';
}

// Extract individual grape varieties from the collection
function extractGrapeVarieties(wines: Wine[]): string[] {
  const grapeSet = new Set<string>();
  
  for (const wine of wines) {
    if (!wine.grapeVarieties) continue;
    
    // Split by comma, semicolon, or "and"
    const grapes = wine.grapeVarieties.split(/[,;]|\band\b/i);
    
    for (let grape of grapes) {
      // Clean up the grape name
      grape = grape.trim()
        .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthetical info
        .replace(/\s*\d+%?\s*/g, '') // Remove percentages
        .replace(/min\s*/i, '') // Remove "min"
        .replace(/^\s*-\s*/, '') // Remove leading dashes
        .trim();
      
      if (grape.length > 2) {
        // Capitalize first letter
        grape = grape.charAt(0).toUpperCase() + grape.slice(1).toLowerCase();
        grapeSet.add(grape);
      }
    }
  }
  
  return [...grapeSet].sort();
}

// Get unique filter options from the wine data
export function getFilterOptions(wines?: Wine[]): FilterOptions {
  // Use provided wines or get all wines (including user-added)
  const allWines = wines || getAllWines();
  
  const countries = [...new Set(allWines.map(w => w.country).filter(Boolean))].sort();
  const regions = [...new Set(allWines.map(w => w.region).filter(Boolean))].sort();
  const wineTypes = [...new Set(allWines.map(w => w.wineType).filter(Boolean))].sort();
  const vintages = [...new Set(allWines.map(w => w.vintage).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a)); // Newest first
  const bodies = [...new Set(allWines.map(w => w.body).filter(Boolean))].sort();
  const tanninLevels = [...new Set(allWines.map(w => w.tanninLevel).filter(Boolean))].sort();
  const acidityLevels = [...new Set(allWines.map(w => w.acidityLevel).filter(Boolean))].sort();
  const drinkWindowStatuses = ['Ready to Drink', 'At Peak', 'Too Young', 'Past Prime'];
  const grapeVarieties = extractGrapeVarieties(allWines);
  
  return { countries, regions, wineTypes, vintages, bodies, tanninLevels, acidityLevels, drinkWindowStatuses, grapeVarieties };
}

// Search wines by text query
export function searchWines(wines: Wine[], query: string): Wine[] {
  if (!query.trim()) return wines;
  
  const lowerQuery = query.toLowerCase();
  return wines.filter(wine => 
    wine.producer.toLowerCase().includes(lowerQuery) ||
    wine.name.toLowerCase().includes(lowerQuery) ||
    wine.region.toLowerCase().includes(lowerQuery) ||
    wine.country.toLowerCase().includes(lowerQuery) ||
    wine.grapeVarieties.toLowerCase().includes(lowerQuery) ||
    wine.tastingNotes.toLowerCase().includes(lowerQuery) ||
    wine.notes.toLowerCase().includes(lowerQuery)
  );
}

// Filter wines by criteria
export function filterWines(wines: Wine[], filters: Filters): Wine[] {
  return wines.filter(wine => {
    if (filters.country && wine.country !== filters.country) return false;
    if (filters.region && wine.region !== filters.region) return false;
    if (filters.wineType && wine.wineType !== filters.wineType) return false;
    if (filters.vintage && wine.vintage !== filters.vintage) return false;
    if (filters.body && wine.body !== filters.body) return false;
    if (filters.tanninLevel && wine.tanninLevel !== filters.tanninLevel) return false;
    if (filters.acidityLevel && wine.acidityLevel !== filters.acidityLevel) return false;
    if (filters.drinkWindowStatus && getDrinkWindowStatus(wine) !== filters.drinkWindowStatus) return false;
    if (filters.grapeVariety) {
      // Check if the wine contains this grape variety (case-insensitive)
      const grapeFilter = filters.grapeVariety.toLowerCase();
      const wineGrapes = wine.grapeVarieties?.toLowerCase() || '';
      if (!wineGrapes.includes(grapeFilter)) return false;
    }
    return true;
  });
}

// Sort wines by various criteria
export function sortWines(wines: Wine[], sortBy: SortOption): Wine[] {
  const sorted = [...wines];
  const currentYear = new Date().getFullYear();
  
  switch (sortBy) {
    case 'drink-soon':
      // Sort by drink window end date (soonest first), then by status priority
      return sorted.sort((a, b) => {
        const aEnd = parseInt(a.drinkWindowEnd) || 9999;
        const bEnd = parseInt(b.drinkWindowEnd) || 9999;
        const aStart = parseInt(a.drinkWindowStart) || 0;
        const bStart = parseInt(b.drinkWindowStart) || 0;
        
        // Past prime wines first (urgent)
        const aPastPrime = currentYear > aEnd;
        const bPastPrime = currentYear > bEnd;
        if (aPastPrime && !bPastPrime) return -1;
        if (!aPastPrime && bPastPrime) return 1;
        
        // Then sort by end date (soonest window closing first)
        if (aEnd !== bEnd) return aEnd - bEnd;
        
        // If same end date, sort by start date
        return aStart - bStart;
      });
      
    case 'status-priority':
      // At Peak > Ready > Too Young > Past Prime
      return sorted.sort((a, b) => {
        const statusOrder = (wine: Wine): number => {
          const status = getDrinkWindowStatus(wine);
          switch (status) {
            case 'At Peak': return 0;
            case 'Ready to Drink': return 1;
            case 'Too Young': return 2;
            case 'Past Prime': return 3;
            default: return 4;
          }
        };
        return statusOrder(a) - statusOrder(b);
      });
      
    case 'producer-az':
      return sorted.sort((a, b) => 
        a.producer.localeCompare(b.producer) || a.name.localeCompare(b.name)
      );
      
    case 'wine-name-az':
      return sorted.sort((a, b) => 
        a.name.localeCompare(b.name) || a.producer.localeCompare(b.producer)
      );
      
    case 'vintage-newest':
      return sorted.sort((a, b) => {
        const aVintage = parseInt(a.vintage) || 0;
        const bVintage = parseInt(b.vintage) || 0;
        return bVintage - aVintage || a.producer.localeCompare(b.producer);
      });
      
    case 'vintage-oldest':
      return sorted.sort((a, b) => {
        const aVintage = parseInt(a.vintage) || 9999;
        const bVintage = parseInt(b.vintage) || 9999;
        return aVintage - bVintage || a.producer.localeCompare(b.producer);
      });
      
    case 'region':
      return sorted.sort((a, b) => 
        a.country.localeCompare(b.country) || 
        a.region.localeCompare(b.region) || 
        a.producer.localeCompare(b.producer)
      );
      
    case 'rating':
      return sorted.sort((a, b) => {
        const aRating = parseInt(a.rating) || 0;
        const bRating = parseInt(b.rating) || 0;
        return bRating - aRating || a.producer.localeCompare(b.producer);
      });
      
    default:
      return sorted;
  }
}

// Find similar wines based on characteristics
export function findSimilarWines(targetWine: Wine, allWines: Wine[], limit: number = 6): SimilarityScore[] {
  const scores: SimilarityScore[] = [];
  
  for (const wine of allWines) {
    if (wine.id === targetWine.id) continue;
    
    let score = 0;
    const matchReasons: string[] = [];
    
    // Wine type match (high weight)
    if (wine.wineType === targetWine.wineType) {
      score += 25;
      matchReasons.push(`Same type (${wine.wineType})`);
    }
    
    // Body match
    if (wine.body && wine.body === targetWine.body) {
      score += 15;
      matchReasons.push(`Same body (${wine.body})`);
    }
    
    // Tannin level match
    if (wine.tanninLevel && wine.tanninLevel === targetWine.tanninLevel && wine.tanninLevel !== 'N/A') {
      score += 10;
      matchReasons.push(`Similar tannins (${wine.tanninLevel})`);
    }
    
    // Acidity level match
    if (wine.acidityLevel && wine.acidityLevel === targetWine.acidityLevel) {
      score += 10;
      matchReasons.push(`Similar acidity (${wine.acidityLevel})`);
    }
    
    // Same country
    if (wine.country === targetWine.country) {
      score += 8;
      matchReasons.push(`Same country (${wine.country})`);
    }
    
    // Same region (high weight)
    if (wine.region && wine.region === targetWine.region) {
      score += 15;
      matchReasons.push(`Same region (${wine.region})`);
    }
    
    // Grape variety overlap
    if (targetWine.grapeVarieties && wine.grapeVarieties) {
      const targetGrapes = targetWine.grapeVarieties.toLowerCase().split(/[,;]/);
      const wineGrapes = wine.grapeVarieties.toLowerCase().split(/[,;]/);
      const overlap = targetGrapes.filter(g => 
        wineGrapes.some(wg => wg.trim().includes(g.trim()) || g.trim().includes(wg.trim()))
      );
      if (overlap.length > 0) {
        score += 12 * Math.min(overlap.length, 2);
        matchReasons.push(`Shared grapes`);
      }
    }
    
    // Oak treatment match
    if (wine.oakTreatment && wine.oakTreatment === targetWine.oakTreatment && wine.oakTreatment !== 'Unknown') {
      score += 5;
    }
    
    // Tasting notes similarity (keyword matching)
    if (targetWine.tastingNotes && wine.tastingNotes) {
      const targetKeywords = extractTastingKeywords(targetWine.tastingNotes);
      const wineKeywords = extractTastingKeywords(wine.tastingNotes);
      const sharedKeywords = targetKeywords.filter(k => wineKeywords.includes(k));
      if (sharedKeywords.length >= 2) {
        score += 5 + Math.min(sharedKeywords.length, 4) * 2;
        matchReasons.push(`Similar flavors`);
      }
    }
    
    if (score > 0) {
      scores.push({ wine, score, matchReasons });
    }
  }
  
  // Sort by score descending and limit results
  return scores.sort((a, b) => b.score - a.score).slice(0, limit);
}

// Extract keywords from tasting notes
function extractTastingKeywords(notes: string): string[] {
  const keywords = [
    'cherry', 'plum', 'blackberry', 'raspberry', 'strawberry', 'blueberry',
    'apple', 'pear', 'peach', 'apricot', 'citrus', 'lemon', 'grapefruit', 'orange',
    'vanilla', 'oak', 'spice', 'pepper', 'cinnamon', 'clove',
    'chocolate', 'coffee', 'tobacco', 'leather', 'earth', 'mineral',
    'floral', 'rose', 'violet', 'honey', 'butter',
    'tar', 'truffle', 'herbs', 'mint', 'eucalyptus'
  ];
  
  const lower = notes.toLowerCase();
  return keywords.filter(k => lower.includes(k));
}

// Get wine summary for AI context (compact format)
export function getWineSummaryForAI(): string {
  const wines = getActiveWines();
  return wines.map(w => 
    `${w.producer} ${w.name} (${w.vintage || 'NV'}) - ${w.wineType} from ${w.country}, ${w.region}${w.grapeVarieties ? ` - ${w.grapeVarieties}` : ''}`
  ).join('\n');
}
