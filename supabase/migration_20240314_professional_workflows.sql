-- Migration: Professional Agent Workflows & Templates (v2)
-- Execute this in your Supabase SQL Editor to load the new professional configurations.

-- ==============================================================================
-- 1. Agente: Generador de Ideas (Lead Strategist)
-- Objetivo: Analizar a fondo el lead, encontrar un cuello de botella y redactar un correo de pitch o idea de mejora centrándose en el ROI.
-- ==============================================================================
UPDATE ai_agents SET 
  system_prompt = 'Actúa como un CTO Externo y Consultor de Negocios Senior. Tu tarea es analizar el informe de auditoría del Lead y extraer un proceso crítico que puede ser automatizado con GENBAI. Tu estilo debe ser directo, profesional, orientado a resultados y altamente personalizado. NUNCA envíes emails genéricos.',
  workflow_steps = '[
    {
        "type": "analysis",
        "action_name": "Analizar la Industria y Tamaño de la Empresa para detectar ineficiencias típicas."
    },
    {
        "type": "analysis",
        "action_name": "Seleccionar el Producto de GENBAI más adecuado basándose en el análisis anterior."
    },
    {
        "type": "email",
        "subject": "Ideas de automatización para {nombre_lead}",
        "base_template": "Hola {nombre_lead},\n\nEstuve revisando el perfil de tu empresa en la industria de {industria} y noté que, como a muchas empresas de tu tamaño, los procesos manuales suelen generar cuellos de botella importantes.\n\nHe estado pensando en cómo aplicar soluciones de Inteligencia Artificial para tu caso particular. [INSERTA TUS IDEAS DE AUTOMATIZACION Y PRODUCTO RECOMENDADO BASADO EN EL ANALISIS PREVIO AQUI].\n\n¿Tienes 15 minutos en la semana para que te muestre un prototipo de esto?\n\nSaludos,\nEquipo GENBAI"
    }
  ]'::jsonb
WHERE id = 'lead-strategist';

-- ==============================================================================
-- 2. Agente: Analista de Leads (Follow-up Specialist)
-- Objetivo: Reactivar clientes inactivos o hacer seguimiento después del envío de presupuesto.
-- ==============================================================================
UPDATE ai_agents SET 
  system_prompt = 'Eres un experto en Psicología del Consumidor, Neuroventas y Follow-up. Tu objetivo es reactivar la comunicación con el lead de forma elegante y no invasiva, aportando valor en cada contacto. Detecta el "punto de dolor" principal del lead y recuérdaselo sutilmente.',
  workflow_steps = '[
    {
        "type": "analysis",
        "action_name": "Leer el historial de notas o cotizaciones del cliente para entender su estado actual."
    },
    {
        "type": "analysis",
        "action_name": "Determinar un caso de estudio o beneficio cuantificable relacionado a su rubro."
    },
    {
        "type": "email",
        "subject": "Siguiente paso para tu automatización en {industria}",
        "base_template": "Hola {nombre_lead},\n\nTe escribo para darle seguimiento a nuestra propuesta de automatización.\n\nSé que muchas veces se posponen estos proyectos por falta de tiempo, pero justamente en esto te ayuda la IA. [INSERTA EL CASO DE ESTUDIO O BENEFICIO PUNTUAL BASADO EN TU ANALISIS AQUI QUE RESUELVA SU PUNTO DE DOLOR].\n\n¿Pudiste revisar el último documento que te enviamos? Me encantaría escuchar tus dudas.\n\nQuedo a tu disposición,\nEquipo GENBAI"
    }
  ]'::jsonb
WHERE id = 'followup-specialist';

-- ==============================================================================
-- 3. Agente: Atención Pública (Chatbot Administrator / Welcome)
-- Objetivo: Dar la bienvenida inicial y perfilar al usuario rápidamente antes de derivarlo.
-- ==============================================================================
UPDATE ai_agents SET 
  system_prompt = 'Eres el Asistente de Atención Inicial de GENBAI. Eres rápido, amigable y muy resolutivo. Tu objetivo es conectar emocionalmente con el usuario en el primer impacto y asegurarte de tener la información base de la empresa.',
  workflow_steps = '[
    {
        "type": "analysis",
        "action_name": "Analizar la intención del Lead: ¿Es una consulta de soporte, o interés técnico y comercial?"
    },
    {
        "type": "email",
        "subject": "¡Bienvenido a GENBAI, {nombre_lead}!",
        "base_template": "Hola {nombre_lead},\n\n¡Gracias por tu interés en GENBAI! \n\nSoy el asistente virtual que está revisando tu solicitud inicial para automatizar áreas en el rubro de {industria}. \n\nPara que un consultor se ponga en contacto contigo con un plan 100% hecho a tu medida, ¿podrías comentarme en una sola línea cuál es el proceso que más tiempo humano te consume hoy en día?\n\n[AGREGA UNA FRASE PERSONALIZADA DE BIENVENIDA SEGUN LA INTENCION DEL LEAD].\n\nEsperamos tu respuesta,\nGENBAI AI Automations"
    }
  ]'::jsonb
WHERE id = 'chatbot-admin';
