/**
 * Controlador n8n para recuperación de cobranzas
 *
 * Endpoints:
 * - POST /n8n/recuperacion/marcar-visto-masivo - Busca mensajes con URL de cobranzas
 *   en los últimos 5 mensajes por chat de una empresa y los registra en bulk en mensaje_visto
 */

const MensajeVistoModel = require('../../models/mensajeVisto.model.js');
const logger = require('../../config/logger/loggerClient.js');

const mensajeVistoModel = new MensajeVistoModel();

class N8nRecuperacionController {

  /**
   * POST /n8n/recuperacion/marcar-visto-masivo
   *
   * 1. Obtiene de una sola query los mensajes candidatos (últimos 5 por chat,
   *    con URL de cobranzas, que no estén ya en mensaje_visto).
   * 2. Hace un bulk insert de todos los candidatos.
   *
   * Body:
   * - id_empresa (required): ID de la empresa a procesar
   * - tipo_recuperacion (optional): tipo de recuperación a registrar
   */
  async marcarVistoMasivo(req, res) {
    try {
      const { id_empresa } = req.body;

      if (!id_empresa) {
        return res.status(400).json({ success: false, error: 'id_empresa es requerido' });
      }

      const candidatos = await mensajeVistoModel.getCandidatosNuevos(id_empresa);

      if (candidatos.length === 0) {
        logger.info(`[n8nRecuperacion] marcar-visto-masivo empresa ${id_empresa}: sin mensajes nuevos`);
        return res.json({
          success: true,
          id_empresa,
          total_candidatos: 0,
          total_insertados: 0
        });
      }

      const registros = candidatos.map(msg => ({
        id_mensaje: msg.id_mensaje,
        id_usuario: msg.id_usuario,
        id_contacto: msg.id_chat,
        tipo_recuperacion: null
      }));

      const totalInsertados = await mensajeVistoModel.bulkCreate(registros);

      logger.info(`[n8nRecuperacion] marcar-visto-masivo empresa ${id_empresa}: ${candidatos.length} candidatos, ${totalInsertados} insertados`);

      return res.json({
        success: true,
        id_empresa,
        total_candidatos: candidatos.length,
        total_insertados: totalInsertados,
        mensajes: candidatos.map(m => ({
          id_mensaje: m.id_mensaje,
          id_chat: m.id_chat,
          contenido: m.contenido
        }))
      });

    } catch (error) {
      logger.error(`[n8nRecuperacion] Error marcar-visto-masivo: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new N8nRecuperacionController();
