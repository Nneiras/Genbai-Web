-- Table to store leads from the landing page
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT, -- For WhatsApp integration
  industry TEXT,
  message TEXT,
  status TEXT DEFAULT 'new', -- new, contacted, interested, closed
  quote_status TEXT DEFAULT 'pending', -- pending, in_progress, sent, accepted, no_response
  product_acquired TEXT DEFAULT 'none', -- ContaIA, QuickPay, FeedbackHub, none
  is_archived BOOLEAN DEFAULT false,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for conversations with AI agents
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  channel TEXT, -- chat, email, whatsapp
  transcript JSONB,
  summary TEXT,

-- AI Agents Configuration
CREATE TABLE IF NOT EXISTS ai_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  workflow_steps JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Initial Agents Seed
INSERT INTO ai_agents (id, name, description, system_prompt, workflow_steps)
VALUES 
('chatbot-admin', 'Atención Pública', 'Chatbot para resolver dudas de clientes en la web.', 'Eres un asistente experto en GENBAI...', '[{"step": "Identificar intención", "active": true}, {"step": "Consultar FAQ", "active": true}]'),
('lead-strategist', 'Generador de Ideas', 'IA para generar ideas por rubro y cotizaciones.', 'Eres un estratega de negocios...', '[{"step": "Analizar industria", "active": true}, {"step": "Proponer producto", "active": true}]'),
('followup-specialist', 'Analista de Leads', 'Analiza leads y seguimiento permanente.', 'Eres un analista de CRM...', '[{"step": "Verificar estado", "active": true}, {"step": "Programar follow-up", "active": true}]')
ON CONFLICT (id) DO NOTHING;

-- Table for budgets/proposals generated
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  project_details JSONB,
  total_amount NUMERIC(12, 2),
  status TEXT DEFAULT 'draft', -- draft, sent, accepted, rejected
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow anyone to insert leads from the landing page)
CREATE POLICY "Enable insert for everyone" ON leads FOR INSERT TO public WITH CHECK (true);

-- Policy to allow anyone to read leads (Admin panel uses PIN gate but is technically anon)
CREATE POLICY "Allow anyone to read leads" ON leads FOR SELECT TO public USING (true);

-- Policy to allow anyone to update leads (Status and Archiving)
CREATE POLICY "Allow anyone to update leads" ON leads FOR UPDATE TO public USING (true);

-- Policy to allow anyone to delete leads
CREATE POLICY "Allow anyone to delete leads" ON leads FOR DELETE TO public USING (true);
