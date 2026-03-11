import { supabase } from './lib/supabase'

// --- Theme Management ---
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

// Initialize theme from localStorage or default to dark
const currentTheme = localStorage.getItem('theme') || 'dark';
htmlElement.setAttribute('data-theme', currentTheme);

themeToggle.addEventListener('click', () => {
    const isDark = htmlElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// --- Leads Management ---
let allLeads = [];
const leadsBody = document.getElementById('leads-body');
const searchInput = document.getElementById('lead-search');
const statusFilter = document.getElementById('status-filter');

/**
 * Fetch leads from Supabase
 */
async function fetchLeads() {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('is_archived', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allLeads = data;
        renderLeads(allLeads);
        updateStats(allLeads);
    } catch (err) {
        console.error('Error fetching leads:', err);
        leadsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #ef4444;">Error al cargar leads. Revisa la configuración de Supabase.</td></tr>`;
    }
}

/**
 * Render leads table
 */
function renderLeads(leads) {
    if (leads.length === 0) {
        leadsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">No se encontraron leads.</td></tr>`;
        return;
    }

    leadsBody.innerHTML = leads.map(lead => {
        const date = new Date(lead.created_at).toLocaleDateString();
        const lastContact = lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : '---';
        
        // Alert logic: If new and older than 24h
        const isOld = (lead.status === 'new' && (new Date() - new Date(lead.created_at)) > 86400000);
        const alertClass = isOld ? 'style="border-left: 4px solid #ef4444;"' : '';

        return `
            <tr ${alertClass}>
                <td>
                    <div style="font-weight: 600;">${lead.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${date}</div>
                </td>
                <td>${lead.industry || '---'}</td>
                <td>${lead.email}</td>
                <td>
                    <span class="status-badge status-${lead.status}">
                        ${lead.status.toUpperCase()}
                        ${isOld ? ' ⚠️' : ''}
                    </span>
                </td>
                <td>${lastContact}</td>
                <td>
                    <div class="action-btns">
                        <a href="https://wa.me/${lead.phone || ''}" target="_blank" class="btn-icon" title="WhatsApp">💬</a>
                        <button class="btn-icon btn-archive" onclick="archiveLead('${lead.id}')" title="Archivar">📦</button>
                        <button class="btn-icon btn-delete" onclick="deleteLead('${lead.id}')" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Update Dashboard Stats
 */
function updateStats(leads) {
    document.getElementById('total-leads').innerText = leads.length;
    const today = new Date().setHours(0,0,0,0);
    const newToday = leads.filter(l => new Date(l.created_at) >= today).length;
    document.getElementById('new-leads').innerText = newToday;
}

/**
 * Filter and Search
 */
function handleFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusVal = statusFilter.value;

    const filtered = allLeads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchTerm) || lead.email.toLowerCase().includes(searchTerm);
        const matchesStatus = statusVal === 'all' || lead.status === statusVal;
        return matchesSearch && matchesStatus;
    });

    renderLeads(filtered);
}

searchInput.addEventListener('input', handleFilters);
statusFilter.addEventListener('change', handleFilters);

// --- Actions (Exposed to Global for Simple onclick) ---
window.archiveLead = async (id) => {
    if (!confirm('¿Seguro que deseas archivar este lead?')) return;
    try {
        const { error } = await supabase
            .from('leads')
            .update({ is_archived: true })
            .eq('id', id);
        if (error) throw error;
        fetchLeads();
    } catch (err) {
        alert('Error al archivar');
    }
};

window.deleteLead = async (id) => {
    if (!confirm('¿Seguro que deseas ELIMINAR permanentemente este lead?')) return;
    try {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);
        if (error) throw error;
        fetchLeads();
    } catch (err) {
        alert('Error al eliminar');
    }
};

// Initial Fetch
fetchLeads();
console.log('GENBAI Admin Initialized');
