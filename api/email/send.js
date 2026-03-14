import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing to, subject, or body fields.' });
  }

  try {
    // 1. Obtener el Refresh Token de la Base de Datos (solo accesible para el sistema)
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
      throw new Error("No hay un refresh_token válido guardado en system_config de Supabase. Conecta Google Admin primero.");
    }

    // 2. Configurar cliente OAuth2
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/api/auth/google/callback'
    );

    oauth2Client.setCredentials({ refresh_token: config.value.refresh_token });

    // 3. Inicializar Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 4. Construir el Coreo (MIME standard RFC 2822 format)
    // Para simplificar, usamos utf-8 base64 url-safe
    const emailHeaderStr = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      body
    ].join('\r\n');

    const encodedEmail = Buffer.from(emailHeaderStr)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 5. Enviar usando "me" (el usuario que autorizó la app)
    const emailRes = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    return res.status(200).json({ success: true, messageId: emailRes.data.id });

  } catch (error) {
    console.error('Error sending email via Gmail API:', error);
    return res.status(500).json({ error: error.message || 'Error sending email' });
  }
}
