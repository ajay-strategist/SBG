import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nqqcmxxqsfldrjxfedou.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NOL7j-QaSU2-HK11qoM_Cg_xX5lypHg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
