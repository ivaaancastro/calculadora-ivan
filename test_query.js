import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('activities')
    .select('id, strava_id')
    .not('strava_id', 'is', null)
    .is('streams_data', null)
    .limit(5);
    
  console.log("Error:", error);
  console.log("Data length:", data?.length);
  console.log("Data:", data);
}

check();
