-- Migration: Tabla de actividades de agentes y Actualización de Pasos
-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear tabla de logs de actividad
CREATE TABLE IF NOT EXISTS agent_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES ai_agents(id),
  lead_id UUID REFERENCES leads(id),
  action TEXT NOT NULL,
  status TEXT DEFAULT 'success', -- success, error, info
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar lectura pública (o bajo tu criterio de seguridad)
ALTER TABLE agent_activities DISABLE ROW LEVEL SECURITY;

-- 3. Actualizar los Pasos de los agentes con las ideas profesionales aprobadas
UPDATE ai_agents SET workflow_steps = '[
  {"step": "Analizar Consulta", "active": true}, 
  {"step": "RAG Search (Docs)", "active": true}, 
  {"step": "Drafting respuesta", "active": true}, 
  {"step": "Escalar si es necesario", "active": true}
]' WHERE id = 'chatbot-admin';

UPDATE ai_agents SET workflow_steps = '[
  {"step": "Perfilado Industria", "active": true}, 
  {"step": "Detección de Dolores", "active": true}, 
  {"step": "Match de Producto", "active": true}, 
  {"step": "Generar Pitch ROI", "active": true}
]' WHERE id = 'lead-strategist';

UPDATE ai_agents SET workflow_steps = '[
  {"step": "Auditoría de Silencio", "active": true}, 
  {"step": "Análisis de Sentimiento", "active": true}, 
  {"step": "Draft Follow-up", "active": true}, 
  {"step": "Update Priority Score", "active": true}
]' WHERE id = 'followup-specialist';
