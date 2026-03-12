/**
 * GENBAI AI Agent Bridge (Powered by Gemini)
 */

const API_KEY = import.meta.env.GOOGLE_API_GEMINI;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Try different models if one fails. Added 2.0 and 2.5 based on user console.
const MODELS = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-pro",
    "gemini-pro-latest",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp"
];

/**
 * Diagnostic tool to see exactly what models your API Key can use
 */
export async function listAvailableModels() {
    try {
        const response = await fetch(`${BASE_URL}?key=${API_KEY}`);
        const data = await response.json();
        console.log("--- LISTA DE MODELOS DISPONIBLES ---");
        console.log(data.models?.map(m => m.name.split('/').pop()));
        return data.models;
    } catch (e) {
        console.error("No se pudo listar los modelos:", e);
    }
}

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
        const model = MODELS[0]; // Use first model for chat
        const response = await fetch(`${BASE_URL}/${model}:generateContent?key=${API_KEY}`, {
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

    for (const model of MODELS) {
        try {
            console.log(`Intentando generar auditoría con modelo: ${model}...`);
            const response = await fetch(`${BASE_URL}/${model}:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: AUDIT_PROMPT }] }],
                    generationConfig: { temperature: 0.8 }
                })
            });

            const data = await response.json();
            console.log(`DEBUG - Respuesta de ${model}:`, data);

            if (data.error) {
                console.warn(`Error con modelo ${model}:`, data.error.message);
                continue; // Prueba el siguiente modelo
            }

            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }
        } catch (error) {
            console.error(`Fallo crítico con modelo ${model}:`, error);
        }
    }

    return "Lo sentimos, no pudimos conectar con los servicios de IA. Por favor, intenta más tarde. RECOMIENDO: Revisa la consola para ver qué modelos tienes activos.";
}

// Auto-run discovery on load for debugging
if (import.meta.env.DEV || window.location.hostname.includes('vercel')) {
    listAvailableModels();
}
