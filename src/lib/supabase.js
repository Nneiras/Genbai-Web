import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export let supabase

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. CRM features will be disabled.')
  // Mock client to prevent errors in other scripts
  supabase = {
    from: () => ({
      insert: async () => ({ error: { message: 'Supabase credentials missing' }, data: null }),
      select: async () => ({ error: { message: 'Supabase credentials missing' }, data: [] }),
      update: async () => ({ error: { message: 'Supabase credentials missing' }, data: null }),
      delete: async () => ({ error: { message: 'Supabase credentials missing' }, data: null })
    })
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}
