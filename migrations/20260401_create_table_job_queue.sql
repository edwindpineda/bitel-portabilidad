-- Tabla para cola de trabajos de llamadas masivas
-- Permite procesar grandes volúmenes de registros en background con paginación

CREATE TABLE IF NOT EXISTS job_queue (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL DEFAULT 'llamadas_masivas',
    id_campania INTEGER NOT NULL,
    id_campania_ejecucion INTEGER NOT NULL,
    id_empresa INTEGER NOT NULL,

    -- Configuración del job
    config_json JSONB NOT NULL, -- tipificaciones, prompt, voice, canal, etc.
    filtro_numeros JSONB DEFAULT NULL, -- Para rellamadas específicas
    es_rellamada BOOLEAN DEFAULT FALSE,

    -- Estado del job
    estado VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, cancelled

    -- Progreso y paginación
    total_registros INTEGER DEFAULT 0,
    registros_procesados INTEGER DEFAULT 0,
    ultimo_id_procesado INTEGER DEFAULT 0, -- Para paginación con cursor
    ronda_actual INTEGER DEFAULT 1,
    max_rondas INTEGER DEFAULT 1,

    -- Estadísticas
    llamadas_enviadas INTEGER DEFAULT 0,
    llamadas_fallidas INTEGER DEFAULT 0,

    -- Mensajes de error
    error_mensaje TEXT DEFAULT NULL,

    -- Auditoría
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio TIMESTAMP DEFAULT NULL,
    fecha_fin TIMESTAMP DEFAULT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Índices para búsquedas rápidas
    CONSTRAINT fk_job_campania FOREIGN KEY (id_campania) REFERENCES campania(id),
    CONSTRAINT fk_job_ejecucion FOREIGN KEY (id_campania_ejecucion) REFERENCES campania_ejecucion(id),
    CONSTRAINT fk_job_empresa FOREIGN KEY (id_empresa) REFERENCES empresa(id)
);

-- Índices para el worker que busca trabajos pendientes
CREATE INDEX IF NOT EXISTS idx_job_queue_estado ON job_queue(estado);
CREATE INDEX IF NOT EXISTS idx_job_queue_estado_fecha ON job_queue(estado, fecha_registro);
CREATE INDEX IF NOT EXISTS idx_job_queue_campania ON job_queue(id_campania);
CREATE INDEX IF NOT EXISTS idx_job_queue_ejecucion ON job_queue(id_campania_ejecucion);

-- Comentarios
COMMENT ON TABLE job_queue IS 'Cola de trabajos para procesamiento de llamadas masivas en background';
COMMENT ON COLUMN job_queue.estado IS 'pending: esperando, processing: en proceso, completed: terminado, failed: error, cancelled: cancelado';
COMMENT ON COLUMN job_queue.ultimo_id_procesado IS 'Cursor para paginación - último ID de base_numero_detalle procesado';
COMMENT ON COLUMN job_queue.config_json IS 'Configuración: {tipificaciones, prompt, voiceCode, toolRuta, canal, configLlamadas}';
