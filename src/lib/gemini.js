/**
 * GENBAI AI Agent Bridge (Powered by Gemini)
 */

const API_KEY = import.meta.env.GOOGLE_API_GEMINI;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `
Eres GenAI, el asistente experto en inteligencia artificial de GENBAI (genbai.com).
Tu misión es asesorar a dueños de Pymes y comercios sobre cómo transformar sus negocios con IA.

CONTEXTO DE GENBAI:
- Empresa: GENBAI.
- Qué hacemos: Implementamos soluciones de IA personalizadas (chatbots, automatización, CRM, auditorías).
- Target: Pequeñas y medianas empresas que buscan eficiencia radical.
- Servicios Principales: 
  1. Atención Pública (Chatbots como tú).
  2. Generación de Contenido (Blogs/Social Media).
  3. Presupuestación Inteligente (Cotizadores auto).
- Contacto: info@genbai.com | WhatsApp: Enlace en la web.

TONO Y ESTILO:
- Profesional, innovador, pero cercano y claro (evita tecnicismos innecesarios).
- Idioma: Español.
- Sé conciso y orientado a la acción. 

REGLAS:
- Si no sabes algo sobre GENBAI, invita al usuario a contactar por el formulario de la web.
- No inventes precios específicos sin auditoría previa.
- Siempre intenta llevar al usuario hacia el formulario de contacto o el botón de auditoría.
`;

export async function sendMessageToGemini(history) {
    if (!API_KEY) {
        console.error("Gemini API Key missing");
        return "Lo siento, mi conexión con el servidor de IA está desactivada temporalmente. Por favor, usa el formulario de contacto.";
    }

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
                    ...history
                ],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Hubo un pequeño error técnico al procesar tu mensaje. ¡Pero ya estamos trabajando en ello!";
    }
}

export async function generateAuditPlan(rubro, proceso, nombre) {
    const AUDIT_PROMPT = `
    Eres el consultor senior de IA de GENBAI. 
    Genera un informe técnico y estratégico para ${nombre}, que opera en el rubro ${rubro} y quiere optimizar el proceso de ${proceso}.

    ESTRUCTURA DEL INFORME (Markdown):
    1. **Análisis del Rubro**: Describe brevemente los retos actuales de ${rubro}.
    2. **Propuesta de Solución**: Describe una solución de IA específica para ${proceso} (ej: un bot, un modelo predictivo, etc).
    3. **Plan de Implementación**: 3 pasos clave (Corto, Mediano y Largo Plazo).
    4. **Métricas de Impacto**:
       - Retorno de Inversión (ROI) estimado: [X]%
       - Reducción de tiempo manual: [X]%
    
    Usa un tono premium, convincente y profesional.
    `;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: AUDIT_PROMPT }] }],
                generationConfig: { temperature: 0.8 }
            })
        });
        const data = await response.json();
        
        if (data.error) {
            if (data.error.code === 429) {
                return "Estamos recibiendo muchas solicitudes. Por favor, intenta de nuevo en unos minutos o contacta a un asesor directamente.";
            }
            throw new Error(data.error.message);
        }

        if (!data.candidates || !data.candidates[0]) {
            throw new Error("No se pudo generar una respuesta clara.");
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Audit Generation Error:", error);
        return "No pudimos generar el informe detallado en este momento. Por favor contacta a un asesor.";
    }
}
