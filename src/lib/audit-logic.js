import { generateAuditPlan } from './gemini.js';
import { supabase } from './supabase.js';

/**
 * AI Audit Logic - GENBAI
 */

export function initAudit() {
    const rubroBtns = document.querySelectorAll('#rubro-options .option-btn');
    const procesoBtns = document.querySelectorAll('#proceso-options .option-btn');
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

    function updateSelection(type, value, btns) {
        selection[type] = value;
        btns.forEach(btn => btn.classList.remove('selected'));
        event.currentTarget.classList.add('selected');
        
        if (selection.rubro && selection.proceso) {
            nextBtn.style.display = 'block';
        }
    }

    rubroBtns.forEach(btn => btn.addEventListener('click', (e) => {
        updateSelection('rubro', btn.dataset.value, rubroBtns);
    }));

    procesoBtns.forEach(btn => btn.addEventListener('click', (e) => {
        updateSelection('proceso', btn.dataset.value, procesoBtns);
    }));

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
        // Simple Markdown-ish to HTML conversion for the report
        const formattedPlan = plan
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/### (.*)/g, '<h4>$1</h4>');

        reportContent.innerHTML = `
            <div class="report-header">
                <span class="hero-tagline">Resultado de tu Auditoría</span>
                <h3>Plan Estratégico para ${nombre}</h3>
            </div>
            <div class="report-body">
                <div class="report-section">
                    <p>${formattedPlan}</p>
                </div>
                
                <div class="metrics-visual">
                    <div class="metric-box">
                        <div class="metric-value">70%</div>
                        <div class="metric-label">Eficiencia Operativa</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-value">X10</div>
                        <div class="metric-label">Escalabilidad</div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 3rem;">
                    <p style="margin-bottom: 1.5rem;">¿Te gustaría implementar este plan con nosotros?</p>
                    <button id="cta-quote" class="btn-primary" style="padding: 1rem 2rem;">Solicitar Cotización de este Plan</button>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 1rem;">Un consultor senior analizará la complejidad y te contactará.</p>
                </div>
            </div>
        `;

        reportOverlay.style.display = 'block';
        document.body.style.overflow = 'hidden';

        document.getElementById('cta-quote')?.addEventListener('click', () => {
             reportOverlay.style.display = 'none';
             document.body.style.overflow = 'auto';
             // Scroll to main contact or open chatbot
             document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
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
