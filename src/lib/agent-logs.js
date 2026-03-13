import { supabase } from './supabase.js';

/**
 * Utility to log agent activities to Supabase
 */
export async function logAgentAction(agentId, action, details = '', status = 'success', leadId = null) {
    try {
        const { error } = await supabase
            .from('agent_activities')
            .insert([{
                agent_id: agentId,
                lead_id: leadId,
                action: action,
                status: status,
                details: details
            }]);
            
        if (error) throw error;
        console.log(`Log recorded: [${agentId}] ${action}`);
    } catch (err) {
        console.error('Error recording agent log:', err);
    }
}

/**
 * Fetch logs for a specific agent
 */
export async function fetchAgentLogs(agentId) {
    try {
        const { data, error } = await supabase
            .from('agent_activities')
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false })
            .limit(50);
            
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching agent logs:', err);
        return [];
    }
}
