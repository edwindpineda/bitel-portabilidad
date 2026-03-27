/**
 * Controlador n8n para mensajes de recuperación (mensaje_visto)
 *
 * Endpoints:
 * - POST /n8n/mensaje-visto/procesar - Procesa los últimos 5 mensajes por chat de una empresa,
 *   identifica URLs de cobranzas y registra en mensaje_visto
 */

const MensajeVistoModel = require('../../models/mensajeVisto.model.js');
const logger = require('../../config/logger/loggerClient.js');

const mensajeVistoModel = new MensajeVistoModel();

class N8nMensajeVistoController {

  /**
   * POST /n8n/mensaje-visto/procesar
   *
   * Busca en los últimos 5 mensajes de cada chat de la empresa indicada
   * aquellos que contengan una URL con dominio https://cobranzas-auna.oncosalud.pe.
   * Si la encuentra y no está ya registrada, crea un registro en mensaje_visto.
   *
   * Body:
   * - id_empresa (required): ID de la empresa a procesar
   * - tipo_recuperacion (optional): tipo de recuperación a registrar
   */
  async procesar(req, res) {
    try {
      const { id_empresa, tipo_recuperacion } = req.body;

      if (!id_empresa) {
        return res.status(400).json({ success: false, error: 'id_empresa es requerido' });
      }

      const mensajes = await mensajeVistoModel.getUltimosConUrlCobranzas(id_empresa);

      const registrados = [];
      const omitidos = [];

      for (const msg of mensajes) {
        const yaExiste = await mensajeVistoModel.existeRegistro(msg.id_mensaje);

        if (yaExiste) {
          omitidos.push({ id_mensaje: msg.id_mensaje, id_chat: msg.id_chat, razon: 'ya registrado' });
          continue;
        }

        const idRegistro = await mensajeVistoModel.registrar({
          id_mensaje: msg.id_mensaje,
          id_usuario: msg.id_usuario || 0,
          id_contacto: msg.id_chat,
          tipo_recuperacion: tipo_recuperacion || null
        });

        registrados.push({
          id: idRegistro,
          id_mensaje: msg.id_mensaje,
          id_chat: msg.id_chat,
          contenido: msg.contenido
        });
      }

      logger.info(`[n8nMensajeVisto] procesar empresa ${id_empresa}: ${mensajes.length} mensajes encontrados, ${registrados.length} registrados, ${omitidos.length} omitidos`);

      return res.json({
        success: true,
        id_empresa,
        total_mensajes_con_url: mensajes.length,
        total_registrados: registrados.length,
        total_omitidos: omitidos.length,
        registrados,
        omitidos
      });

    } catch (error) {
      logger.error(`[n8nMensajeVisto] Error procesar: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/mensaje-visto/preview
   *
   * Vista previa: lista los mensajes que serían procesados sin registrar nada.
   * Útil para verificar antes de ejecutar.
   *
   * Query params:
   * - id_empresa (required): ID de la empresa
   */
  async preview(req, res) {
    try {
      const { id_empresa } = req.query;

      if (!id_empresa) {
        return res.status(400).json({ success: false, error: 'id_empresa es requerido' });
      }

      const mensajes = await mensajeVistoModel.getUltimosConUrlCobranzas(parseInt(id_empresa));

      const resultado = [];
      for (const msg of mensajes) {
        const yaExiste = await mensajeVistoModel.existeRegistro(msg.id_mensaje);
        resultado.push({
          id_mensaje: msg.id_mensaje,
          id_chat: msg.id_chat,
          id_persona: msg.id_persona,
          contenido: msg.contenido,
          fecha_hora: msg.fecha_hora,
          ya_registrado: yaExiste
        });
      }

      return res.json({
        success: true,
        id_empresa: parseInt(id_empresa),
        total: resultado.length,
        mensajes: resultado
      });

    } catch (error) {
      logger.error(`[n8nMensajeVisto] Error preview: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new N8nMensajeVistoController();
