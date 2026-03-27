const { pool } = require("../config/dbConnection.js");
const logger = require('../config/logger/loggerClient.js');
const sentimientoService = require('../services/analisis/sentimiento.service.js');
const TranscripcionModel = require("../models/transcripcion.model.js");

// Intervalo: cada 1 hora
const INTERVALO_MS = 60 * 60 * 1000;
const LIMITE_POR_CICLO = 50;

/**
 * Procesa chats/mensajes inactivos por más de 24 horas que no tienen análisis de sentimiento.
 */
async function procesarChatsInactivos() {
    try {
        const [candidatos] = await pool.execute(
            `SELECT c.id as id_chat, c.id_empresa
            FROM chat c
            INNER JOIN mensaje m ON m.id_chat = c.id
            LEFT JOIN analisis_sentimiento as2 ON as2.id_chat = c.id AND as2.estado_registro = 1
            WHERE c.estado_registro = 1
              AND as2.id IS NULL
              AND m.estado_registro = 1
            GROUP BY c.id, c.id_empresa
            HAVING MAX(m.fecha_registro) < NOW() - INTERVAL '24 hours'
               AND COUNT(m.id) >= 3
            ORDER BY MAX(m.fecha_registro) DESC
            LIMIT ?`,
            [LIMITE_POR_CICLO]
        );

        if (candidatos.length === 0) {
            logger.info(`[cron:sentimiento] Sin chats pendientes de análisis`);
            return;
        }

        logger.info(`[cron:sentimiento] Procesando ${candidatos.length} chats inactivos (+24h)`);
        let procesados = 0;
        let errores = 0;

        for (const candidato of candidatos) {
            try {
                const [mensajes] = await pool.execute(
                    `SELECT direccion, contenido FROM mensaje
                    WHERE id_chat = ? AND estado_registro = 1 AND contenido IS NOT NULL AND contenido != ''
                    ORDER BY fecha_registro ASC`,
                    [candidato.id_chat]
                );
                if (mensajes.length >= 3) {
                    await sentimientoService.analizarChat(candidato.id_chat, mensajes, candidato.id_empresa);
                    procesados++;
                }
            } catch (err) {
                logger.error(`[cron:sentimiento] Error procesando chat ${candidato.id_chat}: ${err.message}`);
                errores++;
            }
        }
        logger.info(`[cron:sentimiento] Chats procesados: ${procesados}, errores: ${errores}`);
    } catch (error) {
        logger.error(`[cron:sentimiento] Error en procesarChatsInactivos: ${error.message}`);
    }
}

/**
 * Backfill: procesa llamadas históricas con transcripción que no tienen análisis.
 * Se ejecuta al arrancar el server y cada hora hasta que no queden pendientes.
 */
async function procesarLlamadasHistoricas() {
    try {
        const [candidatos] = await pool.execute(
            `SELECT l.id as id_llamada, l.id_empresa, l.fecha_registro
            FROM llamada l
            INNER JOIN transcripcion t ON t.id_llamada = l.id AND t.estado_registro = 1
            LEFT JOIN analisis_sentimiento a ON a.id_llamada = l.id AND a.estado_registro = 1
            WHERE l.estado_registro = 1 AND a.id IS NULL
            GROUP BY l.id, l.id_empresa, l.fecha_registro
            ORDER BY l.fecha_registro DESC
            LIMIT ?`,
            [LIMITE_POR_CICLO]
        );

        if (candidatos.length === 0) {
            logger.info(`[cron:sentimiento] Sin llamadas históricas pendientes de análisis`);
            return;
        }

        logger.info(`[cron:sentimiento] Backfill: procesando ${candidatos.length} llamadas históricas`);
        const transcripcionModel = new TranscripcionModel();
        let procesados = 0;
        let errores = 0;

        for (const c of candidatos) {
            try {
                const transcripcion = await transcripcionModel.getByLlamada(c.id_llamada);
                if (transcripcion.length > 0) {
                    await sentimientoService.analizarLlamada(c.id_llamada, transcripcion, c.id_empresa);
                    procesados++;
                }
            } catch (err) {
                logger.error(`[cron:sentimiento] Backfill error llamada ${c.id_llamada}: ${err.message}`);
                errores++;
            }
        }
        logger.info(`[cron:sentimiento] Backfill llamadas: ${procesados} procesadas, ${errores} errores`);
    } catch (error) {
        logger.error(`[cron:sentimiento] Error en procesarLlamadasHistoricas: ${error.message}`);
    }
}

/**
 * Ciclo principal: backfill llamadas + chats inactivos
 */
async function ejecutarCiclo() {
    logger.info(`[cron:sentimiento] === Iniciando ciclo ===`);
    await procesarLlamadasHistoricas();
    await procesarChatsInactivos();
    logger.info(`[cron:sentimiento] === Ciclo completado ===`);
}

/**
 * Inicia el cron de análisis de sentimiento
 */
function iniciarCronSentimiento() {
    logger.info(`[cron:sentimiento] Cron iniciado - intervalo: 60 min`);

    // Ejecutar primera vez después de 30 segundos
    setTimeout(() => {
        ejecutarCiclo();
        // Repetir cada hora
        setInterval(ejecutarCiclo, INTERVALO_MS);
    }, 30000);
}

module.exports = { iniciarCronSentimiento };
