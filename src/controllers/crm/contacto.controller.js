const TblContactoApiModel = require("../../models/tblContacto.model.js");
const logger = require('../../config/logger/loggerClient.js');

class ContactoController {

  async getAll(req, res) {
    try {
      const { offset } = req.params;

      const contactoModel = new TblContactoApiModel();
      const contactos = await contactoModel.getAll(offset);

      return res.status(200).json({ data: contactos });
    }
    catch (error) {
      logger.error(`[auditoria.controller.js] Error al obtener contactos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener informaci�n de auditor�a" });
    }
  }
}

module.exports = new ContactoController();
