import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type for database wine record (snake_case)
export interface DbWine {
  id: string;
  producer: string;
  name: string;
  vintage: string | null;
  region: string | null;
  appellation: string | null;
  country: string | null;
  grape_varieties: string | null;
  blend_percentage: string | null;
  alcohol: string | null;
  bottle_size: string | null;
  wine_type: string | null;
  color: string | null;
  body: string | null;
  tannin_level: string | null;
  acidity_level: string | null;
  oak_treatment: string | null;
  aging_potential: string | null;
  drink_window_start: string | null;
  drink_window_end: string | null;
  current_status: string | null;
  peak_drinking: string | null;
  purchase_date: string | null;
  purchase_price: string | null;
  purchase_location: string | null;
  quantity: string | null;
  consumed: string | null;
  date_consumed: string | null;
  consumption_notes: string | null;
  storage_location: string | null;
  cellar_temperature: string | null;
  tasting_notes: string | null;
  aroma_notes: string | null;
  food_pairings: string | null;
  rating: string | null;
  front_image: string | null;
  back_image: string | null;
  notes: string | null;
  is_user_added: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbConsumption {
  id: string;
  wine_id: string;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface DbUserNote {
  wine_id: string;
  note: string | null;
  updated_at: string;
}

export interface DbPurchaseDate {
  wine_id: string;
  purchase_date: string | null;
  updated_at: string;
}
