-- Creación de tabla para configuración global del sistema (tokens de APIs, etc.)
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- SOLO los super_admins (usuarios autenticados) pueden ver o modificar esta configuración
CREATE POLICY "Admins can view system config" ON system_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can update system config" ON system_config
    FOR ALL USING (auth.role() = 'authenticated');

-- Insertar fila inicial vacía para google
INSERT INTO system_config (key, value)
VALUES ('google_oauth', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
