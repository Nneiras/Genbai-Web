-- Migration: Add workflow_templates to ai_agents and create communications table

-- 1. Add workflow_templates column to ai_agents if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ai_agents' 
        AND column_name = 'workflow_templates'
    ) THEN
        ALTER TABLE ai_agents ADD COLUMN workflow_templates JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 2. Create communications table for the Global Activity Dashboard
CREATE TABLE IF NOT EXISTS communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES ai_agents(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'analysis', 'system', 'escalation')),
    subject TEXT, -- For emails
    content TEXT NOT NULL, -- Email body or analysis notes
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'pending', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb, -- Store extra info like template used
    created_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT
);

-- Note: In a real Supabase setup, you'd add RLS policies here.
-- For now, we ensure admins can read/write.
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all communications" 
ON communications FOR SELECT 
TO authenticated 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert communications" 
ON communications FOR INSERT 
TO authenticated 
WITH CHECK (auth.role() = 'authenticated');

-- Also allow service role to bypass RLS for background agent execution
CREATE POLICY "Service role can do all on communications"
ON communications FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
