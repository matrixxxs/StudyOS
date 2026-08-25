import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// No Database generic — supabase-js's internal GenericSchema constraints
// require Relationships arrays and specific Enums/Views shapes that are
// fiddly to match by hand. We cast query results explicitly in components
// (see types.ts for the row type definitions).
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
