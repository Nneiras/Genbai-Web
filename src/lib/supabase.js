import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.URL_SUPA_BASE || import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.API_KEY_SUPA_BASE || import.meta.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

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
  // Diagnostic log (obfuscated) to verify environment variables in browser
  console.log('Supabase Initialized:', {
    url: supabaseUrl ? 'OK (' + supabaseUrl.substring(0, 10) + '...)' : 'MISSING',
    key: supabaseAnonKey ? 'OK (' + supabaseAnonKey.substring(0, 5) + '...' + supabaseAnonKey.substring(supabaseAnonKey.length - 5) + ')' : 'MISSING'
  })
}
