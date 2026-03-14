import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const getEnv = (key) => {
    const foundKey = Object.keys(process.env).find(k => k.toLowerCase() === key.toLowerCase());
    return foundKey ? process.env[foundKey] : undefined;
  };

  const clientId = getEnv('GOOGLE_CLIENT_ID');
  const clientSecret = getEnv('GOOGLE_CLIENT_SECRET');
  
  const protocol = req.headers['x-forwarded-proto'] || (req.connection.encrypted ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = getEnv('GOOGLE_REDIRECT_URI') || `${protocol}://${host}/api/auth/google/callback`;

  if (!clientId) {
    return res.status(500).json({ error: 'Missing GOOGLE_CLIENT_ID in Vercel environment variables' });
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Falta código de autorización en la URL.' });
  }

  try {
    // Intercambiar el código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Nos interesa especialmente el refresh_token
    if (!tokens.refresh_token) {
      console.warn("No refresh_token returned. User might need to disconnect the app from their Google account and try again to force consent.");
    }

    // Guardar tokens en la tabla system_config de Supabase
    // NOTA: Usamos service_role key o RPC para saltar el RLS si es necesario, 
    // pero anon_key + user session requeriría enviar un token de Supabase en la petición.
    // Asumiremos que tenemos SUPABASE_SERVICE_ROLE_KEY cargada en Vercel para mayor seguridad.
    const serviceClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    );

    const { error: dbError } = await serviceClient
      .from('system_config')
      .upsert({ 
        key: 'google_oauth', 
        value: tokens,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (dbError) {
      throw dbError;
    }

    // Redirigir de vuelta al panel de admin con éxito
    return res.redirect('/admin.html?google_auth=success');

  } catch (error) {
    console.error('Error in Google OAuth Callback:', error);
    return res.redirect('/admin.html?google_auth=error&msg=' + encodeURIComponent(error.message));
  }
}
