const TblAuditoriaApiModel = require("../../models/tblAuditoriaApi.model.js");
const logger = require('../../config/logger/loggerClient.js');

class AuditoriaController {

  async getAll(req, res) {
    try {
      const auditoriaModel = new TblAuditoriaApiModel();
      const auditorias = await auditoriaModel.getAll();

      return res.status(200).json({ data: auditorias });
    }
    catch (error) {
      logger.error(`[auditoria.controller.js] Error al obtener auditorias: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener información de auditoría" });
    }
  }
}

module.exports = new AuditoriaController();
