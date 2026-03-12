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
let allAgents = [];
let selectedLeadIds = new Set();
let currentEditingAgent = null;
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
if (initialHash === '#config') fetchAgents();

window.addEventListener('hashchange', () => {
    switchView(window.location.hash);
    if (window.location.hash === '#config') fetchAgents();
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

// --- Sidebar Toggle ---
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');

if (sidebar && sidebarToggle) {
    // Restore state
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar.classList.add('collapsed');
    }

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        // Refresh icons if needed
        if (window.lucide) lucide.createIcons();
    });
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
        const createdAt = new Date(lead.created_at);
        const dateStr = createdAt.toLocaleDateString();
        const timeStr = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const isSelected = selectedLeadIds.has(lead.id);

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
                    <div style="font-size: 0.75rem; color: var(--accent);">${dateStr} <span style="opacity: 0.6; margin-left: 4px;">${timeStr}</span></div>
                </td>
                <td>
                    <div class="expand-trigger">
                        <i data-lucide="chevron-down" class="expand-icon"></i>
                        <span style="font-size: 0.85rem; color: var(--text-secondary);">Ver detalles</span>
                    </div>
                </td>
                <td>
                    <select class="status-select quote-${lead.quote_status || 'pending'}" onchange="event.stopPropagation(); updateLeadQuoteStatus('${lead.id}', this.value)">
                        <option value="pending" ${(!lead.quote_status || lead.quote_status === 'pending') ? 'selected' : ''}>PENDIENTE</option>
                        <option value="in_progress" ${lead.quote_status === 'in_progress' ? 'selected' : ''}>EN PROCESO</option>
                        <option value="sent" ${lead.quote_status === 'sent' ? 'selected' : ''}>ENVIADA</option>
                        <option value="no_response" ${lead.quote_status === 'no_response' ? 'selected' : ''}>SIN RESPUESTA</option>
                        <option value="accepted" ${lead.quote_status === 'accepted' ? 'selected' : ''}>ACEPTADA</option>
                    </select>
                </td>
                <td>
                    <select class="status-select product-${lead.product_acquired || 'none'}" onchange="event.stopPropagation(); updateLeadProduct('${lead.id}', this.value)">
                        <option value="none" ${(!lead.product_acquired || lead.product_acquired === 'none') ? 'selected' : ''}>NINGUNO</option>
                        <option value="ContaIA" ${lead.product_acquired === 'ContaIA' ? 'selected' : ''}>ContaIA</option>
                        <option value="QuickPay" ${lead.product_acquired === 'QuickPay' ? 'selected' : ''}>QuickPay</option>
                        <option value="FeedbackHub" ${lead.product_acquired === 'FeedbackHub' ? 'selected' : ''}>FeedbackHub</option>
                    </select>
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
                        <a href="mailto:${lead.email}" class="btn-icon" title="Enviar Email">
                            <i data-lucide="mail"></i>
                        </a>
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
        // No fetchLeads here to avoid re-rendering entire list unless needed, 
        // but status classes need update. For now fetchLeads is safer.
        fetchLeads();
    } catch (err) {
        alert('Error al actualizar estado');
    }
};

window.updateLeadQuoteStatus = async (id, newQuoteStatus) => {
    try {
        const { error } = await supabase
            .from('leads')
            .update({ quote_status: newQuoteStatus })
            .eq('id', id);
        if (error) throw error;
        fetchLeads();
    } catch (err) {
        alert('Error al actualizar cotización');
    }
};

window.updateLeadProduct = async (id, newProduct) => {
    try {
        const { error } = await supabase
            .from('leads')
            .update({ product_acquired: newProduct })
            .eq('id', id);
        if (error) throw error;
        fetchLeads();
    } catch (err) {
        alert('Error al actualizar producto');
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

// --- AI Agents Management ---
const agentsListContainer = document.getElementById('agents-list');
const agentEditor = document.getElementById('agent-editor');
const stepsContainer = document.getElementById('steps-container');

async function fetchAgents() {
    try {
        const { data, error } = await supabase
            .from('ai_agents')
            .select('*')
            .order('name');
        if (error) throw error;
        allAgents = data;
        renderAgents(allAgents);
    } catch (err) {
        console.error('Error fetching agents:', err);
        if (agentsListContainer) agentsListContainer.innerHTML = '<div class="glass kpi-card">Error al cargar agentes.</div>';
    }
}

function renderAgents(agents) {
    if (!agentsListContainer) return;
    agentsListContainer.innerHTML = agents.map(agent => `
        <div class="glass kpi-card agent-card" onclick="openAgentEditor('${agent.id}')">
            <div class="agent-card-header">
                <div class="agent-icon-box">🤖</div>
                <span class="status-badge ${agent.is_active ? 'status-new' : 'status-closed'}">
                    ${agent.is_active ? 'ACTIVO' : 'PAUSADO'}
                </span>
            </div>
            <h3>${agent.name}</h3>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">${agent.description || 'Sin descripción'}</p>
            <div class="agent-card-footer">
                <span class="steps-count"><i data-lucide="list"></i> ${JSON.parse(JSON.stringify(agent.workflow_steps || [])).length} pasos</span>
                <span class="edit-link">Configurar <i data-lucide="chevron-right"></i></span>
            </div>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

window.openAgentEditor = (id) => {
    const agent = allAgents.find(a => a.id === id);
    if (!agent) return;
    currentEditingAgent = { ...agent, workflow_steps: [...(agent.workflow_steps || [])] };
    
    document.getElementById('edit-agent-name').innerText = agent.name;
    document.getElementById('edit-agent-id').innerText = `ID: ${agent.id}`;
    document.getElementById('edit-agent-prompt').value = agent.system_prompt || '';
    
    renderEditorSteps();
    agentEditor.style.display = 'block';
    agentEditor.classList.add('active');
};

function renderEditorSteps() {
    if (!stepsContainer) return;
    stepsContainer.innerHTML = currentEditingAgent.workflow_steps.map((stepObj, index) => `
        <div class="step-item">
            <div class="step-number">${index + 1}</div>
            <input type="text" value="${stepObj.step}" onchange="updateStepText(${index}, this.value)" class="step-input">
            <button class="btn-icon" onclick="removeStep(${index})"><i data-lucide="trash-2"></i></button>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

window.updateStepText = (index, value) => {
    currentEditingAgent.workflow_steps[index].step = value;
};

window.removeStep = (index) => {
    currentEditingAgent.workflow_steps.splice(index, 1);
    renderEditorSteps();
};

document.getElementById('add-step')?.addEventListener('click', () => {
    currentEditingAgent.workflow_steps.push({ step: 'Nuevo paso...', active: true });
    renderEditorSteps();
});

document.getElementById('close-agent-editor')?.addEventListener('click', () => {
    agentEditor.style.display = 'none';
    agentEditor.classList.remove('active');
    currentEditingAgent = null;
});

document.getElementById('save-agent')?.addEventListener('click', async () => {
    if (!currentEditingAgent) return;
    
    const prompt = document.getElementById('edit-agent-prompt').value;
    
    try {
        const { error } = await supabase
            .from('ai_agents')
            .update({
                system_prompt: prompt,
                workflow_steps: currentEditingAgent.workflow_steps,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentEditingAgent.id);
            
        if (error) throw error;
        
        // Update local state and UI
        const idx = allAgents.findIndex(a => a.id === currentEditingAgent.id);
        if (idx !== -1) {
            allAgents[idx].system_prompt = prompt;
            allAgents[idx].workflow_steps = currentEditingAgent.workflow_steps;
        }
        
        renderAgents(allAgents);
        document.getElementById('close-agent-editor').click();
        alert('Configuración guardada correctamente.');
    } catch (err) {
        console.error('Error saving agent:', err);
        alert('Error al guardar la configuración.');
    }
});

// Update view logic to fetch agents removed as it is now in the nav section

fetchLeads();
console.log('GENBAI Admin Initialized');
