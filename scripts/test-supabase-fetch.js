import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Credentials missing in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFetch() {
  console.log('Testing Supabase Fetch...')
  
  const { data, error } = await supabase
    .from('leads')
    .select('*')

  if (error) {
    console.error('Fetch failed:', error.message)
    console.error('Details:', error.details)
    process.exit(1)
  }

  console.log('Fetch successful! Leads found:', data.length)
  if (data.length > 0) {
    console.log('Sample lead:', data[0])
  }
  process.exit(0)
}

testFetch()
