// Wine service - handles database operations via Supabase
import { supabase, DbWine, DbConsumption } from './supabase';
import { Wine, ConsumptionEvent } from './types';

// Convert database wine (snake_case) to frontend wine (camelCase)
function dbToWine(db: DbWine): Wine {
  return {
    id: db.id,
    producer: db.producer,
    name: db.name,
    vintage: db.vintage || '',
    region: db.region || '',
    appellation: db.appellation || '',
    country: db.country || '',
    grapeVarieties: db.grape_varieties || '',
    blendPercentage: db.blend_percentage || '',
    alcohol: db.alcohol || '',
    bottleSize: db.bottle_size || '',
    wineType: db.wine_type || '',
    color: db.color || '',
    body: db.body || '',
    tanninLevel: db.tannin_level || '',
    acidityLevel: db.acidity_level || '',
    oakTreatment: db.oak_treatment || '',
    agingPotential: db.aging_potential || '',
    drinkWindowStart: db.drink_window_start || '',
    drinkWindowEnd: db.drink_window_end || '',
    currentStatus: db.current_status || '',
    peakDrinking: db.peak_drinking || '',
    purchaseDate: db.purchase_date || '',
    purchasePrice: db.purchase_price || '',
    purchaseLocation: db.purchase_location || '',
    quantity: db.quantity || '1',
    consumed: db.consumed || '',
    dateConsumed: db.date_consumed || '',
    consumptionNotes: db.consumption_notes || '',
    storageLocation: db.storage_location || '',
    cellarTemperature: db.cellar_temperature || '',
    tastingNotes: db.tasting_notes || '',
    aromaNotes: db.aroma_notes || '',
    foodPairings: db.food_pairings || '',
    rating: db.rating || '',
    frontImage: db.front_image || '',
    backImage: db.back_image || '',
    notes: db.notes || '',
  };
}

// Convert frontend wine to database format
function wineToDb(wine: Partial<Wine> & { id: string }, isUserAdded: boolean = false): Partial<DbWine> {
  return {
    id: wine.id,
    producer: wine.producer || '',
    name: wine.name || '',
    vintage: wine.vintage || null,
    region: wine.region || null,
    appellation: wine.appellation || null,
    country: wine.country || null,
    grape_varieties: wine.grapeVarieties || null,
    blend_percentage: wine.blendPercentage || null,
    alcohol: wine.alcohol || null,
    bottle_size: wine.bottleSize || null,
    wine_type: wine.wineType || null,
    color: wine.color || null,
    body: wine.body || null,
    tannin_level: wine.tanninLevel || null,
    acidity_level: wine.acidityLevel || null,
    oak_treatment: wine.oakTreatment || null,
    aging_potential: wine.agingPotential || null,
    drink_window_start: wine.drinkWindowStart || null,
    drink_window_end: wine.drinkWindowEnd || null,
    current_status: wine.currentStatus || null,
    peak_drinking: wine.peakDrinking || null,
    purchase_date: wine.purchaseDate || null,
    purchase_price: wine.purchasePrice || null,
    purchase_location: wine.purchaseLocation || null,
    quantity: wine.quantity || '1',
    consumed: wine.consumed || null,
    date_consumed: wine.dateConsumed || null,
    consumption_notes: wine.consumptionNotes || null,
    storage_location: wine.storageLocation || null,
    cellar_temperature: wine.cellarTemperature || null,
    tasting_notes: wine.tastingNotes || null,
    aroma_notes: wine.aromaNotes || null,
    food_pairings: wine.foodPairings || null,
    rating: wine.rating || null,
    front_image: wine.frontImage || null,
    back_image: wine.backImage || null,
    notes: wine.notes || null,
    is_user_added: isUserAdded,
    is_deleted: false,
  };
}

// Fetch all wines (not deleted)
export async function fetchAllWines(): Promise<Wine[]> {
  const { data, error } = await supabase
    .from('wines')
    .select('*')
    .eq('is_deleted', false)
    .order('producer', { ascending: true });

  if (error) {
    console.error('Error fetching wines:', error);
    throw error;
  }

  return (data || []).map(dbToWine);
}

// Fetch single wine by ID
export async function fetchWineById(id: string): Promise<Wine | null> {
  const { data, error } = await supabase
    .from('wines')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching wine:', error);
    throw error;
  }

  return data ? dbToWine(data) : null;
}

// Add a new wine
export async function addWineToDb(wine: Wine, isUserAdded: boolean = true): Promise<Wine> {
  const dbWine = wineToDb(wine, isUserAdded);
  
  const { data, error } = await supabase
    .from('wines')
    .insert(dbWine)
    .select()
    .single();

  if (error) {
    console.error('Error adding wine:', error);
    throw error;
  }

  return dbToWine(data);
}

// Update a wine
export async function updateWineInDb(id: string, updates: Partial<Wine>): Promise<Wine> {
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  
  // Map camelCase to snake_case for updates
  if (updates.producer !== undefined) dbUpdates.producer = updates.producer;
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.vintage !== undefined) dbUpdates.vintage = updates.vintage;
  if (updates.region !== undefined) dbUpdates.region = updates.region;
  if (updates.country !== undefined) dbUpdates.country = updates.country;
  if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
  if (updates.purchaseDate !== undefined) dbUpdates.purchase_date = updates.purchaseDate;
  // Add more fields as needed...

  const { data, error } = await supabase
    .from('wines')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating wine:', error);
    throw error;
  }

  return dbToWine(data);
}

// Soft delete a wine
export async function deleteWineFromDb(id: string): Promise<void> {
  const { error } = await supabase
    .from('wines')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deleting wine:', error);
    throw error;
  }
}

// Restore a deleted wine
export async function restoreWineInDb(id: string): Promise<void> {
  const { error } = await supabase
    .from('wines')
    .update({ is_deleted: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error restoring wine:', error);
    throw error;
  }
}

// Consumption history functions
export async function fetchConsumptionHistory(wineId: string): Promise<ConsumptionEvent[]> {
  const { data, error } = await supabase
    .from('consumption_history')
    .select('*')
    .eq('wine_id', wineId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching consumption history:', error);
    throw error;
  }

  return (data || []).map((c: DbConsumption) => ({
    id: c.id,
    date: c.date,
    notes: c.notes || '',
  }));
}

export async function addConsumptionToDb(wineId: string, date: string, notes: string = ''): Promise<ConsumptionEvent> {
  const id = `consumption-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const { data, error } = await supabase
    .from('consumption_history')
    .insert({ id, wine_id: wineId, date, notes })
    .select()
    .single();

  if (error) {
    console.error('Error adding consumption:', error);
    throw error;
  }

  return {
    id: data.id,
    date: data.date,
    notes: data.notes || '',
  };
}

export async function removeConsumptionFromDb(consumptionId: string): Promise<void> {
  const { error } = await supabase
    .from('consumption_history')
    .delete()
    .eq('id', consumptionId);

  if (error) {
    console.error('Error removing consumption:', error);
    throw error;
  }
}

// User notes functions
export async function fetchUserNote(wineId: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_notes')
    .select('note')
    .eq('wine_id', wineId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return ''; // Not found
    console.error('Error fetching user note:', error);
    throw error;
  }

  return data?.note || '';
}

export async function saveUserNoteToDb(wineId: string, note: string): Promise<void> {
  const { error } = await supabase
    .from('user_notes')
    .upsert({ 
      wine_id: wineId, 
      note, 
      updated_at: new Date().toISOString() 
    });

  if (error) {
    console.error('Error saving user note:', error);
    throw error;
  }
}

// Purchase date override functions
export async function fetchPurchaseDate(wineId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_purchase_dates')
    .select('purchase_date')
    .eq('wine_id', wineId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching purchase date:', error);
    throw error;
  }

  return data?.purchase_date || null;
}

export async function savePurchaseDateToDb(wineId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('user_purchase_dates')
    .upsert({ 
      wine_id: wineId, 
      purchase_date: date, 
      updated_at: new Date().toISOString() 
    });

  if (error) {
    console.error('Error saving purchase date:', error);
    throw error;
  }
}

// Bulk import wines (for initial migration)
export async function bulkImportWines(wines: Wine[], isUserAdded: boolean = false): Promise<number> {
  const dbWines = wines.map(w => wineToDb(w, isUserAdded));
  
  const { data, error } = await supabase
    .from('wines')
    .upsert(dbWines, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('Error bulk importing wines:', error);
    throw error;
  }

  return data?.length || 0;
}
