import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'https://tu-proyecto.vercel.app/api/auth/google/callback'
  );

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
