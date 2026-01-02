const ProspectoModel = require("../../models/tblProspectos.model.js");
const { pool } = require("../../config/dbConnection.js");
const logger = require('../../config/logger/loggerClient.js');

class LeadsController {
  async getLeads(req, res) {
    try {
      const prospectoModel = new ProspectoModel();

      // Obtener info del usuario autenticado
      const { userId, rolId, idEmpresa } = req.user || {};

      logger.info(`[leads.controller.js] getLeads - userId: ${userId}, rolId: ${rolId}, idEmpresa: ${idEmpresa}`);

      const leads = await prospectoModel.getAllByTipoUsuario('user', userId, rolId, idEmpresa);
      return res.status(200).json({ data: leads });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener leads: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener leads" });
    }
  }

  async getLeadById(req, res) {
    try {
      const { id } = req.params;
      const prospectoModel = new ProspectoModel();
      const lead = await prospectoModel.getById(id);

      if (!lead) {
        return res.status(404).json({ msg: "Lead no encontrado" });
      }

      return res.status(200).json({ data: lead });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener lead: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener lead" });
    }
  }

  async assignAsesor(req, res) {
    try {
      const { id } = req.params;
      const { id_asesor } = req.body;
      const prospectoModel = new ProspectoModel();

      const lead = await prospectoModel.getById(id);
      if (!lead) {
        return res.status(404).json({ msg: "Lead no encontrado" });
      }

      await prospectoModel.updateAsesor(id, id_asesor);
      return res.status(200).json({ msg: "Asesor asignado correctamente" });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al asignar asesor: ${error.message}`);
      return res.status(500).json({ msg: "Error al asignar asesor" });
    }
  }

  async getAsesores(req, res) {
    try {
      const { userId, rolId, idEmpresa } = req.user || {};

      // Convertir rolId a número para comparación segura
      const rolIdNum = parseInt(rolId, 10);

      logger.info(`[leads.controller.js] getAsesores - userId: ${userId}, rolId: ${rolId}, rolIdNum: ${rolIdNum}, idEmpresa: ${idEmpresa}`);

      let query = '';
      let params = [];

      if (rolIdNum === 1) {
        // Rol 1 (admin): ver todos los asesores (id_rol = 3) de su empresa
        query = `SELECT id, username, email FROM usuario WHERE id_rol = 3 AND estado_registro = 1`;
        if (idEmpresa) {
          query += ` AND id_empresa = ?`;
          params.push(idEmpresa);
        }
      } else if (rolIdNum === 2) {
        // Rol 2 (supervisor): ver solo asesores con id_padre = userId del logueado
        query = `SELECT id, username, email FROM usuario WHERE id_rol = 3 AND id_padre = ? AND estado_registro = 1`;
        params = [userId];
        if (idEmpresa) {
          query += ` AND id_empresa = ?`;
          params.push(idEmpresa);
        }
      } else {
        // Otros roles no pueden ver asesores
        logger.info(`[leads.controller.js] getAsesores - Rol ${rolIdNum} no tiene permisos para ver asesores`);
        return res.status(200).json({ data: [] });
      }

      logger.info(`[leads.controller.js] getAsesores - Query: ${query}`);
      const [rows] = await pool.execute(query, params);
      logger.info(`[leads.controller.js] getAsesores - Asesores encontrados: ${rows.length}`);
      return res.status(200).json({ data: rows });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener asesores: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener asesores" });
    }
  }

  async bulkAssignAsesor(req, res) {
    try {
      const { lead_ids, id_asesor } = req.body;

      if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
        return res.status(400).json({ msg: "Debe seleccionar al menos un lead" });
      }

      if (!id_asesor) {
        return res.status(400).json({ msg: "Debe seleccionar un asesor" });
      }

      const prospectoModel = new ProspectoModel();

      // Actualizar cada lead
      for (const leadId of lead_ids) {
        await prospectoModel.updateAsesor(leadId, id_asesor);
      }

      logger.info(`[leads.controller.js] Asignación masiva: ${lead_ids.length} leads asignados al asesor ${id_asesor}`);
      return res.status(200).json({ msg: `${lead_ids.length} leads asignados correctamente` });
    } catch (error) {
      logger.error(`[leads.controller.js] Error en asignación masiva: ${error.message}`);
      return res.status(500).json({ msg: "Error al asignar asesores" });
    }
  }

  async updateLead(req, res) {
    try {
      const { id } = req.params;
      const prospectoModel = new ProspectoModel();

      const lead = await prospectoModel.getById(id);
      if (!lead) {
        return res.status(404).json({ msg: "Lead no encontrado" });
      }

      await prospectoModel.updateProspecto(id, req.body);
      logger.info(`[leads.controller.js] Lead ${id} actualizado correctamente`);

      return res.status(200).json({ msg: "Lead actualizado correctamente" });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al actualizar lead: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar lead" });
    }
  }

  async getProveedores(req, res) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, nombre FROM proveedor ORDER BY nombre'
      );
      return res.status(200).json({ data: rows });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener proveedores: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener proveedores" });
    }
  }

  async getPlanes(req, res) {
    try {
      const { idEmpresa } = req.user || {};

      let query = 'SELECT id, nombre FROM catalogo WHERE activo = 1';
      const params = [];

      if (idEmpresa) {
        query += ' AND id_empresa = ?';
        params.push(idEmpresa);
      }

      query += ' ORDER BY nombre';

      const [rows] = await pool.execute(query, params);
      return res.status(200).json({ data: rows });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener planes: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener planes" });
    }
  }

  async getPerfilamiento(req, res) {
    try {
      const { id } = req.params;

      const [rows] = await pool.execute(`
        SELECT
          pp.pregunta,
          ppp.respuesta
        FROM prospecto_pregunta_perfilamiento ppp
        INNER JOIN pregunta_perfilamiento pp ON pp.id = ppp.id_pregunta
        WHERE ppp.id_prospecto = ?
        ORDER BY pp.orden ASC
      `, [id]);

      return res.status(200).json({ data: rows });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener perfilamiento: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener perfilamiento" });
    }
  }
}

module.exports = new LeadsController();
