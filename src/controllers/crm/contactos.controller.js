const { pool } = require("../../config/dbConnection.js");
const TblMensajeVistoUsuarioModel = require("../../models/tblMensajeVistoUsuario.model.js");
const logger = require('../../config/logger/loggerClient.js');

const LIMIT = 20;

class ContactosController {

  async getContactos(req, res) {
    try {
      const { userId, rolId, idEmpresa } = req.user || {};
      const offset = parseInt(req.params.offset) || 0;
      const { id_estado, id_tipificacion, id_tipificacion_asesor } = req.query;

      let query = `
        SELECT c.id, c.id_persona, c.fecha_registro, c.estado_registro,
               p.celular, p.nombre_completo, p.id_estado, p.id_tipificacion, p.id_asesor, p.id_empresa,
               e.nombre as estado_nombre, e.color as estado_color,
               t.nombre as tipificacion_nombre,
               (SELECT contenido FROM mensaje WHERE id_contacto = c.id AND estado_registro = 1 ORDER BY id DESC LIMIT 1) as ultimo_mensaje,
               (SELECT fecha_hora FROM mensaje WHERE id_contacto = c.id AND estado_registro = 1 ORDER BY id DESC LIMIT 1) as fecha_ultimo_mensaje,
               (SELECT COUNT(*) FROM mensaje WHERE id_contacto = c.id AND estado_registro = 1) as total_mensajes
        FROM contacto c
        LEFT JOIN persona p ON p.id = c.id_persona
        LEFT JOIN estado e ON e.id = p.id_estado
        LEFT JOIN tipificacion t ON t.id = p.id_tipificacion
        WHERE c.estado_registro = 1`;

      const params = [];

      if (idEmpresa) {
        query += ' AND p.id_empresa = ?';
        params.push(idEmpresa);
      }

      if (rolId && rolId >= 3 && userId) {
        query += ' AND p.id_asesor = ?';
        params.push(userId);
      }

      if (id_estado) {
        query += ' AND p.id_estado = ?';
        params.push(id_estado);
      }

      if (id_tipificacion) {
        query += ' AND p.id_tipificacion = ?';
        params.push(id_tipificacion);
      }

      if (id_tipificacion_asesor) {
        query += ' AND p.id_asesor = ?';
        params.push(id_tipificacion_asesor);
      }

      // Count total
      const countQuery = query.replace(/SELECT[\s\S]*?FROM contacto c/, 'SELECT COUNT(*) as total FROM contacto c');
      const [countResult] = await pool.execute(countQuery, params);
      const total = countResult[0]?.total || 0;

      query += ' ORDER BY fecha_ultimo_mensaje DESC LIMIT ? OFFSET ?';
      params.push(LIMIT, offset);

      const [rows] = await pool.execute(query, params);

      return res.status(200).json({ data: rows, total });
    } catch (error) {
      logger.error(`[contactos.controller.js] Error al obtener contactos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener contactos" });
    }
  }

  async searchContactos(req, res) {
    try {
      const { userId, rolId, idEmpresa } = req.user || {};
      const { query: searchQuery } = req.params;
      const offset = parseInt(req.query.offset) || 0;
      const { id_estado, id_tipificacion, id_tipificacion_asesor } = req.query;

      const searchTerm = `%${searchQuery}%`;

      let query = `
        SELECT c.id, c.id_persona, c.fecha_registro, c.estado_registro,
               p.celular, p.nombre_completo, p.id_estado, p.id_tipificacion, p.id_asesor, p.id_empresa,
               e.nombre as estado_nombre, e.color as estado_color,
               t.nombre as tipificacion_nombre,
               (SELECT contenido FROM mensaje WHERE id_contacto = c.id AND estado_registro = 1 ORDER BY id DESC LIMIT 1) as ultimo_mensaje,
               (SELECT fecha_hora FROM mensaje WHERE id_contacto = c.id AND estado_registro = 1 ORDER BY id DESC LIMIT 1) as fecha_ultimo_mensaje
        FROM contacto c
        LEFT JOIN persona p ON p.id = c.id_persona
        LEFT JOIN estado e ON e.id = p.id_estado
        LEFT JOIN tipificacion t ON t.id = p.id_tipificacion
        WHERE c.estado_registro = 1
        AND (p.celular LIKE ? OR p.nombre_completo LIKE ?)`;

      const params = [searchTerm, searchTerm];

      if (idEmpresa) {
        query += ' AND p.id_empresa = ?';
        params.push(idEmpresa);
      }

      if (rolId && rolId >= 3 && userId) {
        query += ' AND p.id_asesor = ?';
        params.push(userId);
      }

      if (id_estado) {
        query += ' AND p.id_estado = ?';
        params.push(id_estado);
      }

      if (id_tipificacion) {
        query += ' AND p.id_tipificacion = ?';
        params.push(id_tipificacion);
      }

      if (id_tipificacion_asesor) {
        query += ' AND p.id_asesor = ?';
        params.push(id_tipificacion_asesor);
      }

      const countQuery = query.replace(/SELECT[\s\S]*?FROM contacto c/, 'SELECT COUNT(*) as total FROM contacto c');
      const [countResult] = await pool.execute(countQuery, params);
      const total = countResult[0]?.total || 0;

      query += ' ORDER BY fecha_ultimo_mensaje DESC LIMIT ? OFFSET ?';
      params.push(LIMIT, offset);

      const [rows] = await pool.execute(query, params);

      return res.status(200).json({ data: rows, total });
    } catch (error) {
      logger.error(`[contactos.controller.js] Error al buscar contactos: ${error.message}`);
      return res.status(500).json({ msg: "Error al buscar contactos" });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const { userId, rolId, idEmpresa } = req.user || {};

      const mensajeVistoModel = new TblMensajeVistoUsuarioModel();
      const idAsesor = (rolId && rolId >= 3) ? userId : null;
      const unreadCount = await mensajeVistoModel.getUnreadContactsCount(userId, idAsesor, idEmpresa);

      return res.status(200).json({ data: { unreadCount } });
    } catch (error) {
      logger.error(`[contactos.controller.js] Error al obtener conteo de no leidos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener conteo de no leidos" });
    }
  }
}

module.exports = new ContactosController();
