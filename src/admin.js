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
let selectedLeadIds = new Set();
const leadsBody = document.getElementById('leads-body');
const searchInput = document.getElementById('lead-search');
const statusFilter = document.getElementById('status-filter');
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.admin-view');
const pageTitle = document.getElementById('page-title');
const bulkBar = document.getElementById('bulk-actions-bar');
const selectedCountEl = document.getElementById('selected-count');

/**
 * Handle Tab Switching
 */
function switchView(targetId) {
    const viewId = `view-${targetId.replace('#', '')}`;
    const targetView = document.getElementById(viewId);

    if (targetView) {
        views.forEach(v => v.classList.remove('active'));
        targetView.classList.add('active');

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === targetId) {
                item.classList.add('active');
            }
        });

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
        
        // Refresh Lucide icons
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        console.error('Error fetching leads:', err);
        leadsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #ef4444;">Error al cargar leads.</td></tr>`;
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
        const isSelected = selectedLeadIds.has(lead.id);
        const isAudit = lead.message?.includes('AUDITORÍA IA');

        return `
            <tr class="lead-row-main" id="lead-${lead.id}" onclick="toggleExpand('${lead.id}', event)">
                <td onclick="event.stopPropagation()">
                    <input type="checkbox" class="admin-checkbox lead-check" ${isSelected ? 'checked' : ''} onchange="toggleSelect('${lead.id}', this.checked)">
                </td>
                <td>
                    <div style="font-weight: 600;">${lead.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${lead.email}</div>
                </td>
                <td>
                    <div style="font-size: 0.9rem; font-weight: 500;">${lead.industry || '---'}</div>
                    <div style="font-size: 0.75rem; color: var(--accent);">${lead.created_at ? date : ''}</div>
                </td>
                <td>
                    <div class="expand-trigger">
                        <i data-lucide="chevron-down" class="expand-icon"></i>
                        <span style="font-size: 0.85rem; color: var(--text-secondary);">Ver detalles</span>
                    </div>
                </td>
                <td>
                    <select class="status-select status-${lead.status}" onchange="event.stopPropagation(); updateLeadStatus('${lead.id}', this.value)">
                        <option value="new" ${lead.status === 'new' ? 'selected' : ''}>NUEVO</option>
                        <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>CONTACTADO</option>
                        <option value="interested" ${lead.status === 'interested' ? 'selected' : ''}>INTERESADO</option>
                        <option value="closed" ${lead.status === 'closed' ? 'selected' : ''}>CERRADO</option>
                    </select>
                </td>
                <td onclick="event.stopPropagation()">
                    <div class="action-btns">
                        <a href="https://wa.me/${lead.phone?.replace(/\D/g, '') || ''}" target="_blank" class="btn-icon" title="WhatsApp">
                            <i data-lucide="message-circle"></i>
                        </a>
                        <button class="btn-icon btn-archive" onclick="archiveLead('${lead.id}')" title="Archivar">
                            <i data-lucide="archive"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteLead('${lead.id}')" title="Eliminar">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
            <tr class="detail-row" id="detail-${lead.id}">
                <td colspan="6">
                    <div class="detail-content">
                        <div class="audit-detail-card">
                            <h4><i data-lucide="file-text"></i> Contenido del Mensaje / Auditoría</h4>
                            <div>${lead.message || 'Sin detalles adicionales.'}</div>
                        </div>
                        <div style="display: flex; gap: 1rem; align-items: center; color: var(--text-secondary); font-size: 0.8rem;">
                            <span>ID: ${lead.id}</span>
                            <span>•</span>
                            <span>Email: <a href="mailto:${lead.email}" style="color: var(--accent);">${lead.email}</a></span>
                            ${lead.phone ? `<span>•</span><span>Tel: ${lead.phone}</span>` : ''}
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    if (window.lucide) lucide.createIcons();
}

/**
 * Support Functions for UI interactions
 */
window.toggleExpand = (id, event) => {
    // Don't expand if clicking certain children handled by stopPropagation
    const row = document.getElementById(`lead-${id}`);
    const detail = document.getElementById(`detail-${id}`);
    
    const isActive = row.classList.contains('active');
    
    // Close others
    document.querySelectorAll('.lead-row-main').forEach(r => r.classList.remove('active'));
    document.querySelectorAll('.detail-row').forEach(d => d.classList.remove('active'));
    
    if (!isActive) {
        row.classList.add('active');
        detail.classList.add('active');
    }
};

window.toggleSelect = (id, checked) => {
    if (checked) {
        selectedLeadIds.add(id);
    } else {
        selectedLeadIds.delete(id);
    }
    updateBulkBar();
};

document.getElementById('select-all-leads')?.addEventListener('change', (e) => {
    const checked = e.target.checked;
    const checkboxes = document.querySelectorAll('.lead-check');
    checkboxes.forEach(cb => {
        cb.checked = checked;
        const id = cb.closest('tr').id.replace('lead-', '');
        if (checked) selectedLeadIds.add(id); else selectedLeadIds.delete(id);
    });
    updateBulkBar();
});

function updateBulkBar() {
    const count = selectedLeadIds.size;
    selectedCountEl.innerText = count;
    if (count > 0) {
        bulkBar.classList.add('active');
    } else {
        bulkBar.classList.remove('active');
    }
}

/**
 * Stats and Filters
 */
function updateStats(leads) {
    const totalCount = leads.length;
    const today = new Date().setHours(0,0,0,0);
    const newToday = leads.filter(l => new Date(l.created_at) >= today).length;

    const elements = {
        'total-leads-dash': totalCount,
        'new-leads-dash': newToday
    };

    Object.entries(elements).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    });
}

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

// --- Bulk Actions ---
document.getElementById('bulk-status')?.addEventListener('change', async (e) => {
    const newStatus = e.target.value;
    if (!newStatus || selectedLeadIds.size === 0) return;
    
    if (confirm(`¿Actualizar ${selectedLeadIds.size} leads a "${newStatus}"?`)) {
        try {
            const { error } = await supabase
                .from('leads')
                .update({ status: newStatus })
                .in('id', Array.from(selectedLeadIds));
                
            if (error) throw error;
            selectedLeadIds.clear();
            updateBulkBar();
            fetchLeads();
        } catch (err) {
            alert('Error en actualización masiva');
        }
    }
    e.target.value = ""; // Reset select
});

document.getElementById('bulk-archive')?.addEventListener('click', async () => {
    if (selectedLeadIds.size === 0) return;
    if (confirm(`¿Archivar ${selectedLeadIds.size} leads?`)) {
        try {
            const { error } = await supabase
                .from('leads')
                .update({ is_archived: true })
                .in('id', Array.from(selectedLeadIds));
            if (error) throw error;
            selectedLeadIds.clear();
            updateBulkBar();
            fetchLeads();
        } catch (err) {
            alert('Error al archivar masivamente');
        }
    }
});

document.getElementById('bulk-delete')?.addEventListener('click', async () => {
    if (selectedLeadIds.size === 0) return;
    if (confirm(`¿ELIMINAR PERMANENTEMENTE ${selectedLeadIds.size} leads? Esta acción no se puede deshacer.`)) {
        try {
            const { error } = await supabase
                .from('leads')
                .delete()
                .in('id', Array.from(selectedLeadIds));
            if (error) throw error;
            selectedLeadIds.clear();
            updateBulkBar();
            fetchLeads();
        } catch (err) {
            alert('Error al eliminar masivamente');
        }
    }
});

// --- Individual Actions (Global) ---
window.updateLeadStatus = async (id, newStatus) => {
    try {
        const { error } = await supabase
            .from('leads')
            .update({ status: newStatus })
            .eq('id', id);
        if (error) throw error;
        fetchLeads();
    } catch (err) {
        alert('Error al cargar leads');
    }
};

window.archiveLead = async (id) => {
    if (!confirm('¿Archivar este lead?')) return;
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
    if (!confirm('¿ELIMINAR PERMANENTEMENTE este lead?')) return;
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

fetchLeads();
console.log('GENBAI Admin Initialized');
