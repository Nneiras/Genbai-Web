/**
 * GENBAI AI Agent Bridge (Powered by Gemini)
 */

const API_KEY = import.meta.env.GOOGLE_API_GEMINI;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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
