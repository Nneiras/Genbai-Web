-- Migration: Agregado de columnas a Leads y Creación de tabla de Agentes
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Actualizar tabla de Leads con nuevas columnas de seguimiento
ALTER TABLE leads ADD COLUMN IF NOT EXISTS quote_status TEXT DEFAULT 'pending';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS product_acquired TEXT DEFAULT 'none';

-- 2. Crear tabla para configuración de Agentes IA
CREATE TABLE IF NOT EXISTS ai_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  workflow_steps JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Cargar configuración inicial de los 3 agentes solicitados
INSERT INTO ai_agents (id, name, description, system_prompt, workflow_steps)
VALUES 
('chatbot-admin', 'Atención Pública', 'Chatbot para resolver dudas de clientes en la web.', 'Eres un asistente experto en GENBAI...', '[{"step": "Identificar intención", "active": true}, {"step": "Consultar FAQ", "active": true}]'),
('lead-strategist', 'Generador de Ideas', 'IA para generar ideas por rubro y cotizaciones.', 'Eres un estratega de negocios...', '[{"step": "Analizar industria", "active": true}, {"step": "Proponer producto", "active": true}]'),
('followup-specialist', 'Analista de Leads', 'Analiza leads y seguimiento permanente.', 'Eres un analista de CRM...', '[{"step": "Verificar estado", "active": true}, {"step": "Programar follow-up", "active": true}]')
ON CONFLICT (id) DO NOTHING;
