import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const serviceClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    );

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
