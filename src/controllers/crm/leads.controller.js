const ProspectoModel = require("../../models/prospecto.model.js");
const { pool } = require("../../config/dbConnection.js");
const logger = require('../../config/logger/loggerClient.js');

class LeadsController {
  async getLeads(req, res) {
    try {
      // Obtener info del usuario autenticado
      const { userId, rolId, idEmpresa } = req.user || {};

      logger.info(`[leads.controller.js] getLeads - userId: ${userId}, rolId: ${rolId}, idEmpresa: ${idEmpresa}`);

      const leads = await ProspectoModel.getAllByTipoUsuario('user', userId, rolId, idEmpresa);
      return res.status(200).json({ data: leads });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener leads: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener leads" });
    }
  }

  async getLeadById(req, res) {
    try {
      const { id } = req.params;
      const lead = await ProspectoModel.getById(id);

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
        await ProspectoModel.updateProspecto(leadId, { id_asesor });
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

      await ProspectoModel.updateProspecto(id, req.body);
      logger.info(`[leads.controller.js] Lead ${id} actualizado correctamente`);

      return res.status(200).json({ msg: "Lead actualizado correctamente" });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al actualizar lead: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar lead" });
    }
  }
}

module.exports = new LeadsController();
