-- Migration: Sistema de Resultados y Flujo de Aprobación
-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear tabla para resultados generados por IA
CREATE TABLE IF NOT EXISTS agent_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES ai_agents(id),
  output_type TEXT NOT NULL, -- 'followup_draft', 'roi_pitch', 'sentiment_analysis'
  content JSONB NOT NULL,    -- { body: "...", subject: "...", metadata: {...} }
  status TEXT DEFAULT 'draft', -- 'draft', 'approved', 'declined', 'sent'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar lectura pública para el panel de admin
ALTER TABLE agent_results DISABLE ROW LEVEL SECURITY;
