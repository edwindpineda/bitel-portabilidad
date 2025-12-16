const TblContactoApiModel = require("../../models/tblContacto.model.js");
const TblMensajeModel = require("../../models/tblMensaje.model.js");
const TblMensajeVistoUsuarioModel = require("../../models/tblMensajeVistoUsuario.model.js");
const logger = require('../../config/logger/loggerClient.js');

class ContactoController {

  async getAll(req, res) {
    try {
      const { offset } = req.params;
      const { id_estado, id_tipificacion } = req.query;

      // Obtener info del usuario autenticado
      const { userId, rolId } = req.user || {};

      // Si el rol es >= 3, filtrar solo los contactos de prospectos asignados a este asesor
      let id_asesor = null;
      if (rolId && rolId >= 3 && userId) {
        id_asesor = userId;
      }

      // Convertir a enteros o null
      const estadoFilter = id_estado ? parseInt(id_estado, 10) : null;
      const tipificacionFilter = id_tipificacion ? parseInt(id_tipificacion, 10) : null;

      const contactoModel = new TblContactoApiModel();
      const contactos = await contactoModel.getAll(offset, id_asesor, estadoFilter, tipificacionFilter, userId);
      const total = await contactoModel.getTotal(id_asesor, estadoFilter, tipificacionFilter);

      return res.status(200).json({ data: contactos, total });
    }
    catch (error) {
      logger.error(`[contacto.controller.js] Error al obtener contactos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener contactos" });
    }
  }

  async getMensajes(req, res) {
    try {
      const { idContacto } = req.params;

      const mensajeModel = new TblMensajeModel();
      const mensajes = await mensajeModel.getByContactoId(idContacto);

      return res.status(200).json({ data: mensajes });
    }
    catch (error) {
      logger.error(`[contacto.controller.js] Error al obtener mensajes: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener mensajes" });
    }
  }

  async search(req, res) {
    try {
      const { query } = req.params;
      const offset = parseInt(req.query.offset) || 0;
      const { id_estado, id_tipificacion } = req.query;

      // Obtener info del usuario autenticado
      const { userId, rolId } = req.user || {};

      // Si el rol es >= 3, filtrar solo los contactos de prospectos asignados a este asesor
      let id_asesor = null;
      if (rolId && rolId >= 3 && userId) {
        id_asesor = userId;
      }

      // Convertir a enteros o null
      const estadoFilter = id_estado ? parseInt(id_estado, 10) : null;
      const tipificacionFilter = id_tipificacion ? parseInt(id_tipificacion, 10) : null;

      const contactoModel = new TblContactoApiModel();
      const contactos = await contactoModel.search(query, offset, id_asesor, estadoFilter, tipificacionFilter, userId);
      const total = await contactoModel.getSearchTotal(query, id_asesor, estadoFilter, tipificacionFilter);

      return res.status(200).json({ data: contactos, total });
    }
    catch (error) {
      logger.error(`[contacto.controller.js] Error al buscar contactos: ${error.message}`);
      return res.status(500).json({ msg: "Error al buscar contactos" });
    }
  }

  async createMensaje(req, res) {
    try {
      const { idContacto } = req.params;
      const { contenido } = req.body;

      if (!contenido || !contenido.trim()) {
        return res.status(400).json({ msg: "El contenido del mensaje es requerido" });
      }

      const mensajeModel = new TblMensajeModel();
      const mensaje = await mensajeModel.create(idContacto, contenido.trim(), 'out');

      return res.status(201).json({ data: mensaje, msg: "Mensaje enviado correctamente" });
    }
    catch (error) {
      logger.error(`[contacto.controller.js] Error al crear mensaje: ${error.message}`);
      return res.status(500).json({ msg: "Error al enviar mensaje" });
    }
  }

  async toggleBotActivo(req, res) {
    try {
      const { idContacto } = req.params;

      const contactoModel = new TblContactoApiModel();
      const bot_activo = await contactoModel.toggleBotActivo(idContacto);

      return res.status(200).json({ data: { bot_activo }, msg: "Estado del bot actualizado" });
    }
    catch (error) {
      logger.error(`[contacto.controller.js] Error al cambiar estado del bot: ${error.message}`);
      return res.status(500).json({ msg: "Error al cambiar estado del bot" });
    }
  }

  async markAsRead(req, res) {
    try {
      const { idContacto } = req.params;
      const { idMensaje } = req.body;
      const { userId } = req.user || {};

      if (!userId) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      if (!idMensaje) {
        return res.status(400).json({ msg: "ID del mensaje es requerido" });
      }

      const mensajeVistoModel = new TblMensajeVistoUsuarioModel();
      // Marcar todos los mensajes del contacto como vistos hasta el mensaje especificado
      await mensajeVistoModel.markAllAsReadForContact(userId, idContacto, idMensaje);

      return res.status(200).json({ msg: "Mensajes marcados como vistos" });
    }
    catch (error) {
      logger.error(`[contacto.controller.js] Error al marcar mensaje como visto: ${error.message}`);
      return res.status(500).json({ msg: "Error al marcar mensaje como visto" });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const { userId, rolId } = req.user || {};

      if (!userId) {
        return res.status(401).json({ msg: "Usuario no autenticado" });
      }

      // Si el rol es >= 3, filtrar solo los contactos de prospectos asignados a este asesor
      let id_asesor = null;
      if (rolId && rolId >= 3) {
        id_asesor = userId;
      }

      const mensajeVistoModel = new TblMensajeVistoUsuarioModel();
      const unreadCount = await mensajeVistoModel.getUnreadContactsCount(userId, id_asesor);

      return res.status(200).json({ data: { unreadCount } });
    }
    catch (error) {
      logger.error(`[contacto.controller.js] Error al obtener conteo de no leidos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener conteo de no leidos" });
    }
  }
}

module.exports = new ContactoController();
