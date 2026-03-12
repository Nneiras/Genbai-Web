import { generateAuditPlan } from './gemini.js';
import { supabase } from './supabase.js';

/**
 * AI Audit Logic - GENBAI
 */

export function initAudit() {
    const rubroSelect = document.getElementById('rubro-select');
    const procesoSelect = document.getElementById('proceso-select');
    const nextBtn = document.getElementById('next-to-form');
    const auditForm = document.getElementById('audit-form');
    const steps = {
        1: document.getElementById('step-1'),
        2: document.getElementById('step-2'),
        3: document.getElementById('step-3')
    };
    const reportOverlay = document.getElementById('report-overlay');
    const reportContent = document.getElementById('report-content');
    const closeReport = document.getElementById('close-report');

    let selection = { rubro: '', proceso: '' };

    function checkSelection() {
        if (rubroSelect.value && procesoSelect.value) {
            nextBtn.style.display = 'block';
            selection.rubro = rubroSelect.value;
            selection.proceso = procesoSelect.value;
        }
    }

    rubroSelect?.addEventListener('change', checkSelection);
    procesoSelect?.addEventListener('change', checkSelection);

    nextBtn?.addEventListener('click', () => {
        steps[1].classList.remove('active');
        steps[2].classList.add('active');
    });

    auditForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('audit-name').value;
        const email = document.getElementById('audit-email').value;

        // Step 3: Loading
        steps[2].classList.remove('active');
        steps[3].classList.add('active');

        // Save Lead to Supabase
        await saveAuditLead(nombre, email, selection.rubro, selection.proceso);

        // Generate Plan with Gemini
        const plan = await generateAuditPlan(selection.rubro, selection.proceso, nombre);

        // Show Report
        showReport(plan, nombre);
    });

    async function saveAuditLead(name, email, rubro, proceso) {
        try {
            const { error } = await supabase.from('leads').insert([{
                name: name,
                email: email,
                industry: rubro,
                message: `AUDITORÍA IA: Interesado en optimizar ${proceso}.`,
                status: 'new'
            }]);
            if (error) throw error;
        } catch (err) {
            console.error("Error saving audit lead:", err);
        }
    }

    function showReport(plan, nombre) {
        const formattedPlan = plan
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/### (.*)/g, '<h4>$1</h4>');

        reportContent.innerHTML = `
            <div class="report-header">
                <span class="hero-tagline">Reporte de Auditoría IA</span>
                <h3>Plan Estratégico: ${nombre}</h3>
            </div>
            <div class="report-body">
                <div class="report-section">
                    <p>${formattedPlan}</p>
                </div>
                
                <div class="projection-chart">
                    <h4>Proyección de Eficiencia</h4>
                    <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 20px;">Reducción estimada de carga operativa manual.</p>
                    <div class="chart-bars">
                        <div class="bar-container">
                            <div class="bar before"></div>
                            <span class="bar-label">Actual</span>
                        </div>
                        <div class="bar-container">
                            <div class="bar after" id="ai-bar"></div>
                            <span class="bar-label">Con IA</span>
                        </div>
                    </div>
                </div>

                <div class="metrics-visual">
                    <div class="metric-box">
                        <div class="metric-value">75%</div>
                        <div class="metric-label">ROI Estimado</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-value">X5</div>
                        <div class="metric-label">Velocidad</div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 4rem; padding: 2rem; background: rgba(59, 130, 246, 0.05); border-radius: 20px;">
                    <div id="quote-success-msg" style="display: none; animation: fadeIn 0.5s;">
                        <h4 style="color: #4ade80; margin-bottom: 10px;">¡Solicitud recibida!</h4>
                        <p>Un consultor senior analizará tu caso y te enviará la propuesta detallada por email en menos de 24hs.</p>
                    </div>
                    <div id="quote-actions">
                        <p style="margin-bottom: 1.5rem; font-weight: 500;">¿Te gustaría implementar este plan?</p>
                        <button id="cta-quote" class="btn-primary" style="padding: 1.2rem 3rem; font-size: 1.1rem;">Solicitar Cotización Detallada</button>
                        <p style="font-size: 0.8rem; color: var(--text-dim); margin-top: 1rem;">Recibirás el presupuesto formal en tu casilla de correo.</p>
                    </div>
                </div>
            </div>
        `;

        reportOverlay.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Animate bar
        setTimeout(() => {
            const bar = document.getElementById('ai-bar');
            if (bar) bar.style.height = '30%';
        }, 300);

        document.getElementById('cta-quote')?.addEventListener('click', async () => {
             const btn = document.getElementById('cta-quote');
             btn.innerText = "Procesando...";
             btn.disabled = true;

             // Log quote request in Supabase (Update lead or send special event)
             await supabase.from('leads').insert([{
                 name: nombre,
                 email: document.getElementById('audit-email').value,
                 industry: selection.rubro,
                 message: `SOLICITUD COTIZACIÓN AUDITORÍA: El usuario ${nombre} quiere cotizar el plan generado para ${selection.proceso}.`,
                 status: 'interested'
             }]);

             document.getElementById('quote-actions').style.display = 'none';
             document.getElementById('quote-success-msg').style.display = 'block';
        });
    }

    closeReport?.addEventListener('click', () => {
        reportOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Reset process
        steps[3].classList.remove('active');
        steps[1].classList.add('active');
    });
}
