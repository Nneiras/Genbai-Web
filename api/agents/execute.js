import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { agentId, leadId } = req.body;
  
  if (!agentId || !leadId) {
    return res.status(400).json({ error: 'Faltan parámetros agentId o leadId' });
  }

  try {
    const getEnv = (key) => {
      const foundKey = Object.keys(process.env).find(k => k.toLowerCase() === key.toLowerCase());
      return foundKey ? process.env[foundKey] : undefined;
    };

    const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('URL_SUPA_BASE') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || getEnv('API_KEY_SUPA_BASE');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing matching in Vercel. Need VITE_SUPABASE_URL or URL_SUPA_BASE');
    }

    const serviceClient = createClient(supabaseUrl, supabaseKey);

    // 1. Obtener configuración del agente
    const { data: agent, error: agentError } = await serviceClient
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) throw new Error('Agente no encontrado');

    // 2. Obtener datos del lead
    const { data: lead, error: leadError } = await serviceClient
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) throw new Error('Lead no encontrado');

    // Registrar inicio de ejecución
    await logCommunication(serviceClient, agentId, leadId, 'system', 'Inicio de Ejecución', `Iniciando agente ${agent.name} para lead ${lead.name}`, 'completed');

    const steps = agent.workflow_steps || [];
    let draftResult = null;

    for (const step of steps) {
      if (step.type === 'analysis') {
         await logCommunication(serviceClient, agentId, leadId, 'analysis', `Ejecutando: ${step.action_name}`, `Simulando análisis con IA basándose en el rubro: ${lead.industry || 'Desconocido'}`, 'completed');
         // Here we would call Gemini ideally.
      } else if (step.type === 'email') {
         // Replace basic variables
         let personalizedBody = step.base_template || '';
         personalizedBody = personalizedBody.replace(/{nombre_lead}/g, lead.name);
         personalizedBody = personalizedBody.replace(/{nombre}/g, lead.name);
         personalizedBody = personalizedBody.replace(/{rubro}/g, lead.industry || 'tu industria');
         
         const personalizedSubject = (step.subject || 'Contacto').replace(/{nombre_lead}/g, lead.name);

         await logCommunication(serviceClient, agentId, leadId, 'email', `Generación Email: ${personalizedSubject}`, personalizedBody, 'pending', { subject: personalizedSubject });
         
         // Generar resultado para enviar luego (Simulación)
         draftResult = { subject: personalizedSubject, body: personalizedBody };
      }
    }

    // Si hubo algún email generado, guardarlo en agent_results para la revisión final (Human in the loop)
    if (draftResult) {
        const { error: resultError } = await serviceClient
            .from('agent_results')
            .insert([{
                lead_id: leadId,
                agent_id: agentId,
                output_type: 'email_draft',
                content: draftResult,
                status: 'draft'
            }]);
        if (resultError) throw resultError;
        await logCommunication(serviceClient, agentId, leadId, 'system', 'Flujo Completado', 'Borrador de correo generado y pendiente de revisión.', 'completed');
    } else {
        await logCommunication(serviceClient, agentId, leadId, 'system', 'Flujo Completado', 'Análisis completado sin generación de correos.', 'completed');
    }

    return res.status(200).json({ success: true, message: 'Ejecución del agente procesada correctamente.' });
  } catch (error) {
    console.error('Error executing agent flow:', error);
    return res.status(500).json({ error: error.message || 'Error Interno.' });
  }
}

async function logCommunication(supabaseClient, agentId, leadId, type, subject, content, status, metadata = {}) {
    try {
        await supabaseClient.from('communications').insert([{
            agent_id: agentId,
            lead_id: leadId,
            type: type, // 'email', 'analysis', 'system', 'escalation'
            subject: subject,
            content: content,
            status: status,
            metadata: metadata,
            created_at: new Date().toISOString()
        }]);
    } catch (e) {
        console.error('Failed to log communication:', e);
    }
}
