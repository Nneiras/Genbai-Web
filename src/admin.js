import { supabase } from './lib/supabase'

// --- Auth Gate (PIN: 3687) ---
const gateOverlay = document.getElementById('admin-gate');
const pinInput = document.getElementById('admin-pin');
const gateError = document.getElementById('gate-error');
const adminLayout = document.querySelector('.admin-layout');
const ADMIN_PIN = '3687';

function checkAuth() {
    if (sessionStorage.getItem('adminAuthed') === 'true') {
        gateOverlay.style.display = 'none';
        adminLayout.style.display = 'flex';
        return true;
    }
    return false;
}

pinInput?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (val.length === 4) {
        if (val === ADMIN_PIN) {
            sessionStorage.setItem('adminAuthed', 'true');
            gateOverlay.style.fadeOut = '0.3s';
            setTimeout(() => {
                gateOverlay.style.display = 'none';
                adminLayout.style.display = 'flex';
            }, 300);
        } else {
            gateError.innerText = 'Clave incorrecta';
            pinInput.value = '';
            pinInput.classList.add('shake');
            setTimeout(() => pinInput.classList.remove('shake'), 400);
        }
    } else {
        gateError.innerText = '';
    }
});

// Initial Auth Check
if (checkAuth()) {
    console.log('Admin Authenticated');
}

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
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.admin-view');
const pageTitle = document.getElementById('page-title');

/**
 * Handle Tab Switching
 */
function switchView(targetId) {
    const viewId = `view-${targetId.replace('#', '')}`;
    const targetView = document.getElementById(viewId);

    if (targetView) {
        // Update active class on views
        views.forEach(v => v.classList.remove('active'));
        targetView.classList.add('active');

        // Update active class on nav
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === targetId) {
                item.classList.add('active');
            }
        });

        // Update title
        const titles = {
            '#dashboard': 'Panel de Control',
            '#leads': 'Gestión de Leads',
            '#agentes': 'Agentes IA',
            '#config': 'Configuración'
        };
        pageTitle.innerText = titles[targetId] || 'GENBAI Admin';
    }
}

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = item.getAttribute('href');
        window.location.hash = target;
        switchView(target);
    });
});

// Initial View based on hash
const initialHash = window.location.hash || '#dashboard';
switchView(initialHash);

window.addEventListener('hashchange', () => {
    switchView(window.location.hash);
});

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
                <td>
                    <div style="font-size: 0.9rem; font-weight: 500;">${lead.industry || '---'}</div>
                    <div style="font-size: 0.75rem; color: var(--accent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">
                        ${lead.message?.includes('AUDITORÍA') ? '🔍 Auditoría IA' : '📧 Contacto Directo'}
                    </div>
                </td>
                <td>${lead.email}</td>
                <td title="${lead.message}">${lead.message || '---'}</td>
                <td>
                    <select class="status-select status-${lead.status}" onchange="updateLeadStatus('${lead.id}', this.value)">
                        <option value="new" ${lead.status === 'new' ? 'selected' : ''}>NUEVO ${isOld ? '⚠️' : ''}</option>
                        <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>CONTACTADO</option>
                        <option value="interested" ${lead.status === 'interested' ? 'selected' : ''}>INTERESADO</option>
                        <option value="closed" ${lead.status === 'closed' ? 'selected' : ''}>CERRADO</option>
                    </select>
                </td>
                <td>${lastContact}</td>
                <td>
                    <div class="action-btns">
                        <a href="https://wa.me/${lead.phone?.replace(/\D/g, '') || ''}" target="_blank" class="btn-icon" title="WhatsApp">💬</a>
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
    const totalCount = leads.length;
    const today = new Date().setHours(0,0,0,0);
    const newToday = leads.filter(l => new Date(l.created_at) >= today).length;

    // Both IDs (leads view and dashboard view)
    const elements = {
        'total-leads': totalCount,
        'total-leads-dash': totalCount,
        'new-leads': newToday,
        'new-leads-dash': newToday
    };

    Object.entries(elements).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    });
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
window.updateLeadStatus = async (id, newStatus) => {
    try {
        const updates = { 
            status: newStatus,
            last_contacted_at: newStatus === 'contacted' ? new Date().toISOString() : undefined
        };
        
        const { error } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', id);
            
        if (error) throw error;
        fetchLeads();
    } catch (err) {
        console.error('Error updating status:', err);
        alert('Error al actualizar estado');
    }
};

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
