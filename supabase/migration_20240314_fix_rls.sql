-- Migration: Fix RLS Policies for MVP Testing
-- Execute this in Supabase SQL Editor to allow the web frontend to read and write without being logged in via Supabase Auth.

-- 1. Fix RLS on agent_results so the front-end can read the drafts
DROP POLICY IF EXISTS "Admins can view agent results" ON agent_results;
CREATE POLICY "Admins can view agent results" 
ON agent_results FOR SELECT 
TO public 
USING (true);

-- Ensure INSERT is also public
DROP POLICY IF EXISTS "Admins can insert agent results" ON agent_results;
CREATE POLICY "Admins can insert agent results" 
ON agent_results FOR INSERT 
TO public 
WITH CHECK (true);

-- Ensure UPDATE is public (for marking drafts as 'sent')
DROP POLICY IF EXISTS "Admins can update agent results" ON agent_results;
CREATE POLICY "Admins can update agent results" 
ON agent_results FOR UPDATE 
TO public 
USING (true)
WITH CHECK (true);

-- 2. Fix RLS on communications so the Vercel backend and Front-end can read/write
DROP POLICY IF EXISTS "Admins can view all communications" ON communications;
CREATE POLICY "Admins can view all communications" 
ON communications FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Admins can insert communications" ON communications;
CREATE POLICY "Admins can insert communications" 
ON communications FOR INSERT 
TO public 
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update communications" ON communications;
CREATE POLICY "Admins can update communications" 
ON communications FOR UPDATE 
TO public 
USING (true)
WITH CHECK (true);
