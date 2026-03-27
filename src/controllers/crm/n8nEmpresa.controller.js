/**
 * Controlador n8n para gestión de Empresas
 *
 * Endpoints:
 * - GET /n8n/empresa/listar - Listar empresas activas
 * - GET /n8n/empresa/estadisticas-chats - Estadísticas de chats sin respuesta por empresa
 * - GET /n8n/empresa/resumen-pendientes - Resumen de empresas con envíos masivos pendientes
 */

const { pool } = require('../../config/dbConnection.js');
const logger = require('../../config/logger/loggerClient.js');

class N8nEmpresaController {

  /**
   * GET /n8n/empresa/listar
   *
   * Lista todas las empresas activas del sistema.
   * Útil para iterar por empresa en workflows de n8n.
   *
   * Query params:
   * - incluir_estadisticas: Si es 'true', incluye conteo de chats sin respuesta (default: false)
   */
  async listar(req, res) {
    try {
      const { incluir_estadisticas } = req.query;
      const conEstadisticas = incluir_estadisticas === 'true';

      if (conEstadisticas) {
        const [empresas] = await pool.execute(`
          WITH chats_pendientes AS (
            SELECT
              c.id_empresa,
              COUNT(DISTINCT c.id) as total_chats_pendientes
            FROM chat c
            INNER JOIN LATERAL (
              SELECT direccion, fecha_hora
              FROM mensaje
              WHERE id_chat = c.id AND estado_registro = 1
              ORDER BY fecha_hora DESC
              LIMIT 1
            ) ultimo_msg ON true
            WHERE c.estado_registro = 1
              AND ultimo_msg.direccion = 'out'
              AND EXTRACT(EPOCH FROM (NOW() - ultimo_msg.fecha_hora)) / 3600 >= 1
              AND EXTRACT(EPOCH FROM (NOW() - ultimo_msg.fecha_hora)) / 3600 < 72
            GROUP BY c.id_empresa
          ),
          envios_pendientes AS (
            SELECT
              emw.id_empresa,
              COUNT(*) as total_envios_pendientes
            FROM envio_masivo_whatsapp emw
            WHERE emw.estado_envio = 'pendiente'
              AND (emw.estado_registro = 1 OR emw.estado_registro IS NULL)
            GROUP BY emw.id_empresa
          )
          SELECT
            e.id,
            e.nombre_comercial,
            e.razon_social,
            COALESCE(cp.total_chats_pendientes, 0) as chats_sin_respuesta,
            COALESCE(ep.total_envios_pendientes, 0) as envios_pendientes
          FROM empresa e
          LEFT JOIN chats_pendientes cp ON cp.id_empresa = e.id
          LEFT JOIN envios_pendientes ep ON ep.id_empresa = e.id
          WHERE e.estado_registro = 1
          ORDER BY e.nombre_comercial ASC
        `);

        logger.info(`[n8nEmpresa] listar: ${empresas.length} empresas (con estadísticas)`);

        return res.json({
          success: true,
          total: empresas.length,
          empresas
        });

      } else {
        const [empresas] = await pool.execute(
          `SELECT id, nombre_comercial, razon_social
           FROM empresa
           WHERE estado_registro = 1
           ORDER BY nombre_comercial ASC`
        );

        logger.info(`[n8nEmpresa] listar: ${empresas.length} empresas`);

        return res.json({
          success: true,
          total: empresas.length,
          empresas
        });
      }

    } catch (error) {
      logger.error(`[n8nEmpresa] Error listar: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/empresa/estadisticas-chats
   *
   * Obtiene estadísticas detalladas de chats sin respuesta agrupadas por empresa.
   * Útil para decidir qué empresas procesar y con qué prioridad.
   *
   * Query params:
   * - id_empresa: Filtrar por empresa específica (opcional)
   */
  async estadisticasChats(req, res) {
    try {
      const { id_empresa } = req.query;

      let query = `
        WITH chats_por_rango AS (
          SELECT
            c.id_empresa,
            CASE
              WHEN horas < 8 THEN '1h'
              WHEN horas < 24 THEN '8h'
              WHEN horas < 48 THEN '24h'
              WHEN horas < 72 THEN '48h'
              ELSE '72h'
            END as tipo_rango,
            COUNT(*) as total
          FROM (
            SELECT
              c.id_empresa,
              EXTRACT(EPOCH FROM (NOW() - ultimo_msg.fecha_hora)) / 3600 as horas
            FROM chat c
            INNER JOIN LATERAL (
              SELECT direccion, fecha_hora
              FROM mensaje
              WHERE id_chat = c.id AND estado_registro = 1
              ORDER BY fecha_hora DESC
              LIMIT 1
            ) ultimo_msg ON true
            WHERE c.estado_registro = 1
              AND ultimo_msg.direccion = 'out'
              AND EXTRACT(EPOCH FROM (NOW() - ultimo_msg.fecha_hora)) / 3600 >= 1
              AND EXTRACT(EPOCH FROM (NOW() - ultimo_msg.fecha_hora)) / 3600 < 72
          ) sub
          INNER JOIN chat c ON c.id_empresa = sub.id_empresa
          GROUP BY c.id_empresa, tipo_rango
        ),
        envios_pendientes AS (
          SELECT
            emw.id_empresa,
            emw.estado_envio,
            COUNT(*) as total
          FROM envio_masivo_whatsapp emw
          WHERE (emw.estado_registro = 1 OR emw.estado_registro IS NULL)
            AND emw.estado_envio = 'pendiente'
          GROUP BY emw.id_empresa, emw.estado_envio
        ),
        envios_entregados AS (
          SELECT
            emw.id_empresa,
            COUNT(*) as total
          FROM envio_masivo_whatsapp emw
          WHERE (emw.estado_registro = 1 OR emw.estado_registro IS NULL)
            AND emw.estado_envio = 'entregado'
          GROUP BY emw.id_empresa
        )
        SELECT
          e.id as id_empresa,
          e.nombre_comercial,
          COALESCE(
            (SELECT json_object_agg(tipo_rango, total) FROM chats_por_rango WHERE id_empresa = e.id),
            '{}'::json
          ) as chats_por_rango,
          COALESCE((SELECT SUM(total) FROM chats_por_rango WHERE id_empresa = e.id), 0) as total_chats_sin_respuesta,
          COALESCE((SELECT total FROM envios_pendientes WHERE id_empresa = e.id), 0) as envios_pendientes,
          COALESCE((SELECT total FROM envios_entregados WHERE id_empresa = e.id), 0) as envios_entregados
        FROM empresa e
        WHERE e.estado_registro = 1
      `;

      const params = [];

      if (id_empresa) {
        query += ` AND e.id = ?`;
        params.push(parseInt(id_empresa));
      }

      query += ` ORDER BY total_chats_sin_respuesta DESC, e.nombre_comercial ASC`;

      const [estadisticas] = await pool.execute(query, params);

      const totales = {
        empresas_con_chats_pendientes: estadisticas.filter(e => parseInt(e.total_chats_sin_respuesta || 0) > 0).length,
        total_chats_sin_respuesta: estadisticas.reduce((sum, e) => sum + parseInt(e.total_chats_sin_respuesta || 0), 0)
      };

      logger.info(`[n8nEmpresa] estadisticasChats: ${estadisticas.length} empresas, ${totales.total_chats_sin_respuesta} chats sin respuesta`);

      return res.json({
        success: true,
        totales,
        empresas: estadisticas
      });

    } catch (error) {
      logger.error(`[n8nEmpresa] Error estadisticasChats: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/empresa/resumen-pendientes
   *
   * Resumen de empresas con envíos masivos pendientes de envío.
   * Ideal para el workflow de n8n que itera por empresa.
   *
   * Retorna solo empresas que tienen pendientes > 0
   */
  async resumenPendientes(req, res) {
    try {
      const [empresas] = await pool.execute(`
        SELECT
          emw.id_empresa,
          e.nombre_comercial,
          COUNT(*) as total_pendientes,
          SUM(emw.cantidad) as total_destinatarios
        FROM envio_masivo_whatsapp emw
        INNER JOIN empresa e ON e.id = emw.id_empresa
        WHERE emw.estado_envio = 'pendiente'
          AND (emw.estado_registro = 1 OR emw.estado_registro IS NULL)
          AND e.estado_registro = 1
          AND emw.fecha_envio <= CURRENT_TIMESTAMP
        GROUP BY emw.id_empresa, e.nombre_comercial
        HAVING COUNT(*) > 0
        ORDER BY COUNT(*) DESC
      `);

      logger.info(`[n8nEmpresa] resumenPendientes: ${empresas.length} empresas con pendientes`);

      return res.json({
        success: true,
        total_empresas: empresas.length,
        total_pendientes: empresas.reduce((sum, e) => sum + parseInt(e.total_pendientes), 0),
        empresas
      });

    } catch (error) {
      logger.error(`[n8nEmpresa] Error resumenPendientes: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new N8nEmpresaController();
