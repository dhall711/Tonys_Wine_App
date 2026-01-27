// User data persistence using localStorage

import { UserData, ConsumptionEvent, Wine } from './types';

const STORAGE_KEY = 'wine-catalog-user-data';

// Generate a unique ID for consumption events
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get user data from localStorage
export function getUserData(): UserData {
  if (typeof window === 'undefined') {
    return { consumedWines: {}, consumptionHistory: {}, userNotes: {}, purchaseDates: {}, addedWines: [], deletedWines: [] };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Ensure consumptionHistory exists (migration)
      if (!data.consumptionHistory) {
        data.consumptionHistory = {};
        // Migrate old consumedWines to consumptionHistory
        if (data.consumedWines) {
          for (const [wineId, info] of Object.entries(data.consumedWines)) {
            const consumption = info as { date: string; notes: string };
            data.consumptionHistory[wineId] = [{
              id: generateId(),
              date: consumption.date,
              notes: consumption.notes
            }];
          }
        }
      }
      // Ensure deletedWines exists (migration)
      if (!data.deletedWines) {
        data.deletedWines = [];
      }
      return data;
    }
  } catch (e) {
    console.error('Error reading user data:', e);
  }
  
  return { consumedWines: {}, consumptionHistory: {}, userNotes: {}, purchaseDates: {}, addedWines: [], deletedWines: [] };
}

// Save user data to localStorage
export function saveUserData(data: UserData): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving user data:', e);
  }
}

// Add a consumption event for a wine
export function addConsumption(wineId: string, date: string, notes: string = ''): ConsumptionEvent {
  const data = getUserData();
  if (!data.consumptionHistory[wineId]) {
    data.consumptionHistory[wineId] = [];
  }
  
  const event: ConsumptionEvent = {
    id: generateId(),
    date,
    notes
  };
  
  data.consumptionHistory[wineId].push(event);
  saveUserData(data);
  return event;
}

// Remove a specific consumption event
export function removeConsumption(wineId: string, eventId: string): void {
  const data = getUserData();
  if (data.consumptionHistory[wineId]) {
    data.consumptionHistory[wineId] = data.consumptionHistory[wineId].filter(e => e.id !== eventId);
    if (data.consumptionHistory[wineId].length === 0) {
      delete data.consumptionHistory[wineId];
    }
    saveUserData(data);
  }
}

// Get all consumption events for a wine
export function getConsumptionHistory(wineId: string): ConsumptionEvent[] {
  const data = getUserData();
  return data.consumptionHistory[wineId] || [];
}

// Get the count of consumed bottles for a wine
export function getConsumedCount(wineId: string): number {
  const data = getUserData();
  return data.consumptionHistory[wineId]?.length || 0;
}

// Check if all bottles of a wine are consumed
export function isFullyConsumed(wineId: string, totalQuantity: number): boolean {
  return getConsumedCount(wineId) >= totalQuantity;
}

// Get remaining bottle count
export function getRemainingCount(wineId: string, totalQuantity: number): number {
  return Math.max(0, totalQuantity - getConsumedCount(wineId));
}

// Legacy functions for backward compatibility
export function markWineConsumed(wineId: string, date: string, notes: string = ''): void {
  addConsumption(wineId, date, notes);
}

export function unmarkWineConsumed(wineId: string): void {
  const data = getUserData();
  delete data.consumptionHistory[wineId];
  delete data.consumedWines[wineId];
  saveUserData(data);
}

export function isWineConsumed(wineId: string): boolean {
  const data = getUserData();
  return (data.consumptionHistory[wineId]?.length || 0) > 0;
}

export function getConsumptionInfo(wineId: string): { date: string; notes: string } | null {
  const history = getConsumptionHistory(wineId);
  if (history.length > 0) {
    // Return the most recent consumption
    const latest = history[history.length - 1];
    return { date: latest.date, notes: latest.notes };
  }
  return null;
}

// Save user note for a wine
export function saveUserNote(wineId: string, note: string): void {
  const data = getUserData();
  if (note.trim()) {
    data.userNotes[wineId] = note;
  } else {
    delete data.userNotes[wineId];
  }
  saveUserData(data);
}

// Get user note for a wine
export function getUserNote(wineId: string): string {
  const data = getUserData();
  return data.userNotes[wineId] || '';
}

// Save purchase date for a wine
export function savePurchaseDate(wineId: string, date: string): void {
  const data = getUserData();
  if (date.trim()) {
    if (!data.purchaseDates) data.purchaseDates = {};
    data.purchaseDates[wineId] = date;
  } else {
    delete data.purchaseDates?.[wineId];
  }
  saveUserData(data);
}

// Get purchase date for a wine (user-edited or original)
export function getPurchaseDate(wineId: string): string | null {
  const data = getUserData();
  return data.purchaseDates?.[wineId] || null;
}

// Add a new wine to the collection
export function addWine(wine: Wine): Wine {
  const data = getUserData();
  if (!data.addedWines) data.addedWines = [];
  
  // Generate a unique ID for the new wine
  const newWine = {
    ...wine,
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  data.addedWines.push(newWine);
  saveUserData(data);
  return newWine;
}

// Get all user-added wines
export function getAddedWines(): Wine[] {
  const data = getUserData();
  return data.addedWines || [];
}

// Update a user-added wine
export function updateAddedWine(wineId: string, updates: Partial<Wine>): void {
  const data = getUserData();
  if (!data.addedWines) return;
  
  const index = data.addedWines.findIndex(w => w.id === wineId);
  if (index !== -1) {
    data.addedWines[index] = { ...data.addedWines[index], ...updates };
    saveUserData(data);
  }
}

// Delete a user-added wine
export function deleteAddedWine(wineId: string): void {
  const data = getUserData();
  if (!data.addedWines) return;
  
  data.addedWines = data.addedWines.filter(w => w.id !== wineId);
  saveUserData(data);
}

// Check if a wine was user-added
export function isUserAddedWine(wineId: string): boolean {
  return wineId.startsWith('user-');
}

// Delete any wine (catalog or user-added)
export function deleteWine(wineId: string): void {
  const data = getUserData();
  
  // If it's a user-added wine, remove from addedWines array
  if (isUserAddedWine(wineId) && data.addedWines) {
    data.addedWines = data.addedWines.filter(w => w.id !== wineId);
  }
  
  // Add to deleted list (for both catalog and user-added)
  if (!data.deletedWines) {
    data.deletedWines = [];
  }
  if (!data.deletedWines.includes(wineId)) {
    data.deletedWines.push(wineId);
  }
  
  // Clean up related data
  delete data.consumptionHistory[wineId];
  delete data.consumedWines[wineId];
  delete data.userNotes[wineId];
  delete data.purchaseDates?.[wineId];
  
  saveUserData(data);
}

// Restore a deleted wine
export function restoreWine(wineId: string): void {
  const data = getUserData();
  if (!data.deletedWines) return;
  
  data.deletedWines = data.deletedWines.filter(id => id !== wineId);
  saveUserData(data);
}

// Check if a wine is deleted
export function isWineDeleted(wineId: string): boolean {
  const data = getUserData();
  return data.deletedWines?.includes(wineId) || false;
}

// Get all deleted wine IDs
export function getDeletedWineIds(): string[] {
  const data = getUserData();
  return data.deletedWines || [];
}

// Export added wines as JSON
export function exportAddedWines(): string {
  const wines = getAddedWines();
  return JSON.stringify(wines, null, 2);
}
