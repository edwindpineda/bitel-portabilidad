const { pool } = require("../config/dbConnection.js");
const logger = require('../config/logger/loggerClient.js');

class JobQueueModel {
    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    /**
     * Crea un nuevo job en la cola
     */
    async create({
        tipo = 'llamadas_masivas',
        id_campania,
        id_campania_ejecucion,
        id_empresa,
        config_json,
        filtro_numeros = null,
        es_rellamada = false,
        total_registros = 0,
        max_rondas = 1
    }) {
        try {
            const [rows] = await this.connection.query(
                `INSERT INTO job_queue
                (tipo, id_campania, id_campania_ejecucion, id_empresa, config_json, filtro_numeros, es_rellamada, total_registros, max_rondas, estado)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
                RETURNING id`,
                [
                    tipo,
                    id_campania,
                    id_campania_ejecucion,
                    id_empresa,
                    JSON.stringify(config_json),
                    filtro_numeros ? JSON.stringify(filtro_numeros) : null,
                    es_rellamada,
                    total_registros,
                    max_rondas
                ]
            );
            logger.info(`[JobQueueModel] Job creado con ID: ${rows[0].id}`);
            return rows[0].id;
        } catch (error) {
            logger.error(`[JobQueueModel] Error al crear job: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtiene el siguiente job pendiente y lo marca como 'processing'
     * Usa FOR UPDATE SKIP LOCKED para evitar conflictos en entornos concurrentes
     */
    async claimNextPending() {
        const client = await this.connection.connect();
        try {
            await client.query('BEGIN');

            // Seleccionar y bloquear el siguiente job pendiente
            const { rows } = await client.query(
                `SELECT * FROM job_queue
                WHERE estado = 'pending'
                ORDER BY fecha_registro ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED`
            );

            if (rows.length === 0) {
                await client.query('COMMIT');
                return null;
            }

            const job = rows[0];

            // Marcarlo como processing
            await client.query(
                `UPDATE job_queue
                SET estado = 'processing', fecha_inicio = CURRENT_TIMESTAMP, fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = $1`,
                [job.id]
            );

            await client.query('COMMIT');

            logger.info(`[JobQueueModel] Job ${job.id} claimed para procesamiento`);
            return {
                ...job,
                config_json: typeof job.config_json === 'string' ? JSON.parse(job.config_json) : job.config_json,
                filtro_numeros: job.filtro_numeros ? (typeof job.filtro_numeros === 'string' ? JSON.parse(job.filtro_numeros) : job.filtro_numeros) : null
            };
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`[JobQueueModel] Error al claim job: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Actualiza el progreso de un job
     */
    async updateProgress(id, { registros_procesados, ultimo_id_procesado, llamadas_enviadas, llamadas_fallidas, ronda_actual }) {
        try {
            const updates = [];
            const params = [];
            let paramIndex = 1;

            if (registros_procesados !== undefined) {
                updates.push(`registros_procesados = $${paramIndex++}`);
                params.push(registros_procesados);
            }
            if (ultimo_id_procesado !== undefined) {
                updates.push(`ultimo_id_procesado = $${paramIndex++}`);
                params.push(ultimo_id_procesado);
            }
            if (llamadas_enviadas !== undefined) {
                updates.push(`llamadas_enviadas = $${paramIndex++}`);
                params.push(llamadas_enviadas);
            }
            if (llamadas_fallidas !== undefined) {
                updates.push(`llamadas_fallidas = $${paramIndex++}`);
                params.push(llamadas_fallidas);
            }
            if (ronda_actual !== undefined) {
                updates.push(`ronda_actual = $${paramIndex++}`);
                params.push(ronda_actual);
            }

            updates.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
            params.push(id);

            await this.connection.query(
                `UPDATE job_queue SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
                params
            );
        } catch (error) {
            logger.error(`[JobQueueModel] Error al actualizar progreso job ${id}: ${error.message}`);
        }
    }

    /**
     * Marca un job como completado
     */
    async markCompleted(id, stats = {}) {
        try {
            await this.connection.query(
                `UPDATE job_queue
                SET estado = 'completed',
                    fecha_fin = CURRENT_TIMESTAMP,
                    fecha_actualizacion = CURRENT_TIMESTAMP,
                    llamadas_enviadas = COALESCE($2, llamadas_enviadas),
                    llamadas_fallidas = COALESCE($3, llamadas_fallidas)
                WHERE id = $1`,
                [id, stats.llamadas_enviadas || null, stats.llamadas_fallidas || null]
            );
            logger.info(`[JobQueueModel] Job ${id} marcado como completado`);
        } catch (error) {
            logger.error(`[JobQueueModel] Error al marcar job ${id} como completado: ${error.message}`);
        }
    }

    /**
     * Marca un job como fallido
     */
    async markFailed(id, errorMensaje) {
        try {
            await this.connection.query(
                `UPDATE job_queue
                SET estado = 'failed',
                    fecha_fin = CURRENT_TIMESTAMP,
                    fecha_actualizacion = CURRENT_TIMESTAMP,
                    error_mensaje = $2
                WHERE id = $1`,
                [id, errorMensaje]
            );
            logger.error(`[JobQueueModel] Job ${id} marcado como fallido: ${errorMensaje}`);
        } catch (error) {
            logger.error(`[JobQueueModel] Error al marcar job ${id} como fallido: ${error.message}`);
        }
    }

    /**
     * Cancela un job (solo si está pending o processing)
     */
    async cancel(id) {
        try {
            const [result] = await this.connection.query(
                `UPDATE job_queue
                SET estado = 'cancelled',
                    fecha_fin = CURRENT_TIMESTAMP,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = $1 AND estado IN ('pending', 'processing')
                RETURNING id`,
                [id]
            );
            if (result.length > 0) {
                logger.info(`[JobQueueModel] Job ${id} cancelado`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error(`[JobQueueModel] Error al cancelar job ${id}: ${error.message}`);
            return false;
        }
    }

    /**
     * Obtiene un job por ID
     */
    async getById(id) {
        try {
            const [rows] = await this.connection.query(
                'SELECT * FROM job_queue WHERE id = $1',
                [id]
            );
            if (rows.length === 0) return null;

            const job = rows[0];
            return {
                ...job,
                config_json: typeof job.config_json === 'string' ? JSON.parse(job.config_json) : job.config_json,
                filtro_numeros: job.filtro_numeros ? (typeof job.filtro_numeros === 'string' ? JSON.parse(job.filtro_numeros) : job.filtro_numeros) : null
            };
        } catch (error) {
            logger.error(`[JobQueueModel] Error al obtener job ${id}: ${error.message}`);
            return null;
        }
    }

    /**
     * Obtiene jobs por ejecución
     */
    async getByEjecucion(idEjecucion) {
        try {
            const [rows] = await this.connection.query(
                'SELECT * FROM job_queue WHERE id_campania_ejecucion = $1 ORDER BY fecha_registro DESC',
                [idEjecucion]
            );
            return rows.map(job => ({
                ...job,
                config_json: typeof job.config_json === 'string' ? JSON.parse(job.config_json) : job.config_json
            }));
        } catch (error) {
            logger.error(`[JobQueueModel] Error al obtener jobs por ejecución: ${error.message}`);
            return [];
        }
    }

    /**
     * Recupera jobs que estaban processing pero el servidor se reinició
     * Los vuelve a poner en pending para ser reprocesados
     */
    async recoverStaleJobs(timeoutMinutes = 30) {
        try {
            const [result] = await this.connection.query(
                `UPDATE job_queue
                SET estado = 'pending', fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE estado = 'processing'
                AND fecha_inicio < NOW() - INTERVAL '${timeoutMinutes} minutes'
                RETURNING id`
            );
            if (result.length > 0) {
                logger.warn(`[JobQueueModel] Recuperados ${result.length} jobs estancados`);
            }
            return result.length;
        } catch (error) {
            logger.error(`[JobQueueModel] Error al recuperar jobs estancados: ${error.message}`);
            return 0;
        }
    }

    /**
     * Cuenta jobs pendientes
     */
    async countPending() {
        try {
            const [rows] = await this.connection.query(
                "SELECT COUNT(*)::integer as total FROM job_queue WHERE estado = 'pending'"
            );
            return rows[0]?.total || 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Cuenta jobs en proceso
     */
    async countProcessing() {
        try {
            const [rows] = await this.connection.query(
                "SELECT COUNT(*)::integer as total FROM job_queue WHERE estado = 'processing'"
            );
            return rows[0]?.total || 0;
        } catch (error) {
            return 0;
        }
    }
}

module.exports = JobQueueModel;
