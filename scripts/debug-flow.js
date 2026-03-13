import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugFlow() {
  const testId = `test-${Date.now()}`
  console.log(`Starting debug flow for ID: ${testId}`)

  // 1. Insert
  const { data: insertData, error: insertError } = await supabase
    .from('leads')
    .insert([{ name: 'Debug Bot', email: 'debug@genbai.com', message: testId }])
  
  if (insertError) {
    console.error('Insert failed:', insertError.message)
  } else {
    console.log('Insert signal sent (No error)')
  }

  // 2. Fetch immediately
  const { data: fetchData, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('message', testId)

  if (fetchError) {
    console.error('Fetch failed:', fetchError.message)
  } else {
    console.log('Fetch results:', fetchData.length, 'rows')
  }

  process.exit(0)
}

debugFlow()
