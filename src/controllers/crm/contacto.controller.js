const TblContactoApiModel = require("../../models/tblContacto.model.js");
const TblMensajeModel = require("../../models/tblMensaje.model.js");
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
      const contactos = await contactoModel.getAll(offset, id_asesor, estadoFilter, tipificacionFilter);
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
      const contactos = await contactoModel.search(query, offset, id_asesor, estadoFilter, tipificacionFilter);
      const total = await contactoModel.getSearchTotal(query, id_asesor, estadoFilter, tipificacionFilter);

      return res.status(200).json({ data: contactos, total });
    }
    catch (error) {
      logger.error(`[contacto.controller.js] Error al buscar contactos: ${error.message}`);
      return res.status(500).json({ msg: "Error al buscar contactos" });
    }
  }
}

module.exports = new ContactoController();
