import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const getEnv = (key) => {
      const foundKey = Object.keys(process.env).find(k => k.toLowerCase() === key.toLowerCase());
      return foundKey ? process.env[foundKey] : undefined;
    };

    const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('URL_SUPA_BASE');
    const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || getEnv('API_KEY_SUPA_BASE');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing in Vercel');
      return res.status(500).json({ connected: false, error: 'Supabase credentials missing' });
    }

    const serviceClient = createClient(supabaseUrl, supabaseKey);

    const { data: config, error: dbError } = await serviceClient
      .from('system_config')
      .select('value')
      .eq('key', 'google_oauth')
      .single();

    if (dbError || !config || !config.value || !config.value.refresh_token) {
      return res.status(200).json({ connected: false });
    }

    return res.status(200).json({ connected: true });
  } catch (error) {
    console.error('Error checking Google Auth status:', error);
    return res.status(500).json({ connected: false, error: 'Internal Server Error' });
  }
}
