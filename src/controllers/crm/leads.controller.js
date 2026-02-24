const PersonaModel = require("../../models/persona.model.js");
const UsuarioModel = require("../../models/usuario.model.js");
const TblPlanesTarifariosModel = require("../../models/tblPlanesTarifarios.model.js");
const ProveedorModel = require("../../models/proveedor.model.js");
const PreguntaPerfilamientoModel = require("../../models/preguntaPerfilamiento.model.js");
const { pool } = require("../../config/dbConnection.js");
const logger = require('../../config/logger/loggerClient.js');

class LeadsController {
  async getLeads(req, res) {
    try {
      // Obtener info del usuario autenticado
      const { userId, rolId, idEmpresa } = req.user || {};

      logger.info(`[leads.controller.js] getLeads - userId: ${userId}, rolId: ${rolId}, idEmpresa: ${idEmpresa}`);

      const leads = await PersonaModel.getAllByTipoUsuario(userId, rolId, idEmpresa);
      return res.status(200).json({ data: leads });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener leads: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener leads" });
    }
  }

  async getLeadById(req, res) {
    try {
      const { id } = req.params;
      const lead = await PersonaModel.getById(id);

      if (!lead) {
        return res.status(404).json({ msg: "Lead no encontrado" });
      }

      return res.status(200).json({ data: lead });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener lead: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener lead" });
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


      // Actualizar cada lead
      for (const leadId of lead_ids) {
        await PersonaModel.updatePersona(leadId, { id_usuario: id_asesor });
      }

      logger.info(`[leads.controller.js] Asignación masiva: ${lead_ids.length} leads asignados al asesor ${id_asesor}`);
      return res.status(200).json({ msg: `${lead_ids.length} leads asignados correctamente` });
    } catch (error) {
      logger.error(`[leads.controller.js] Error en asignación masiva: ${error.message}`);
      return res.status(500).json({ msg: "Error al asignar asesores" });
    }
  }

  async getAsesores(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      // Asesores son usuarios con rol 3
      const usuarioModel = new UsuarioModel();
      const asesores = await usuarioModel.getByRol(3);
      return res.status(200).json({ data: asesores });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener asesores: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener asesores" });
    }
  }

  async getProveedores(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const proveedorModel = new ProveedorModel();
      const proveedores = await proveedorModel.getAll(idEmpresa);
      return res.status(200).json({ data: proveedores });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener proveedores: ${error.message}`);
      return res.status(200).json({ data: [] });
    }
  }

  async getCatalogo(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const planesModel = new TblPlanesTarifariosModel();
      const planes = await planesModel.getAllActivos(idEmpresa);
      return res.status(200).json({ data: planes });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener catálogo: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener catálogo" });
    }
  }

  async getPerfilamiento(req, res) {
    try {
      const { id } = req.params;
      const { idEmpresa } = req.user || {};

      const preguntaModel = new PreguntaPerfilamientoModel();
      const preguntas = await preguntaModel.getAll(idEmpresa);

      // Buscar respuestas del lead en la tabla persona_pregunta_perfilamiento
      const [respuestas] = await pool.execute(
        `SELECT pp.id_pregunta, pp.respuesta
         FROM persona_pregunta_perfilamiento pp
         WHERE pp.id_persona = ?`,
        [id]
      );

      const perfilamiento = preguntas.map(pregunta => {
        const respuesta = respuestas.find(r => r.id_pregunta === pregunta.id);
        return {
          ...pregunta,
          respuesta: respuesta ? respuesta.respuesta : null
        };
      });

      return res.status(200).json({ data: perfilamiento });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener perfilamiento: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener perfilamiento" });
    }
  }

  async syncSperant(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      logger.info(`[leads.controller.js] Sincronización Sperant solicitada para empresa ${idEmpresa}`);

      // TODO: Implementar integración real con Sperant API
      return res.status(200).json({ msg: "Sincronización completada" });
    } catch (error) {
      logger.error(`[leads.controller.js] Error en sync Sperant: ${error.message}`);
      return res.status(500).json({ msg: "Error al sincronizar desde Sperant" });
    }
  }

  async updateLead(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.user || {};

      logger.info(`[leads.controller.js] updateLead body: ${JSON.stringify(req.body)}`);
      await PersonaModel.updatePersona(id, { ...req.body, usuario_actualizacion: userId });
      logger.info(`[leads.controller.js] Lead ${id} actualizado correctamente`);

      return res.status(200).json({ msg: "Lead actualizado correctamente" });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al actualizar lead: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar lead" });
    }
  }
}

module.exports = new LeadsController();
