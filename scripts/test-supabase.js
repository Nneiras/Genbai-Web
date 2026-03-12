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

async function testInsert() {
  console.log('Testing Supabase connection...')
  console.log(`URL: ${supabaseUrl}`)
  
  const { data, error } = await supabase
    .from('leads')
    .insert([
      { 
        name: 'Test Bot', 
        email: 'test@genbai.com', 
        message: 'Connetion test from diagnostic script',
        status: 'new'
      }
    ])
    .select()

  if (error) {
    console.error('Insert failed:', error.message)
    console.error('Details:', error.details)
    console.error('Hint:', error.hint)
    process.exit(1)
  }

  console.log('Insert successful!', data)
  process.exit(0)
}

testInsert()
