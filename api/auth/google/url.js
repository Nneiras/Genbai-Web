import { google } from 'googleapis';

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
  const redirectUri = getEnv('GOOGLE_REDIRECT_URI') || 'https://tu-proyecto.vercel.app/api/auth/google/callback';

  if (!clientId) {
    return res.status(500).json({ error: 'Missing GOOGLE_CLIENT_ID in Vercel environment variables' });
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // Permisos requeridos (scopes)
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',     // Obtiene un refresh_token
    prompt: 'consent',          // Fuerza la pantalla de consentimiento
    scope: scopes,
  });

  return res.status(200).json({ url: authorizationUrl });
}
