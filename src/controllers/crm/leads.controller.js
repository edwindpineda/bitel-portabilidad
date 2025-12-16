const ProspectoModel = require("../../models/tblProspectos.model.js");
const logger = require('../../config/logger/loggerClient.js');

class LeadsController {
  async getLeads(req, res) {
    try {
      const prospectoModel = new ProspectoModel();

      // Obtener info del usuario autenticado
      const { userId, rolId } = req.user || {};

      // Si el rol es >= 3, filtrar solo los prospectos asignados a este asesor
      let id_asesor = null;
      if (rolId && rolId >= 3) {
        id_asesor = userId;
      }

      const leads = await prospectoModel.getAllByTipoUsuario('user', id_asesor);
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
}

module.exports = new LeadsController();
