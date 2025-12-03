const TblAuditoriaApiModel = require("../../models/tblAuditoriaApi.model.js");
const logger = require('../../config/logger/loggerClient.js');

class AuditoriaController {

  async getChatsByContacto(req, res) {
    try {
      const { contacto } = req.params

      const auditoriaModel = new TblAuditoriaApiModel();
      const auditorias = await auditoriaModel.getChatsByContacto(contacto);

      return res.status(200).json({ data: auditorias });
    }
    catch (error) {
      logger.error(`[auditoria.controller.js] Error al obtener auditorias: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener informaci�n de auditor�a" });
    }
  }
}

module.exports = new AuditoriaController();
