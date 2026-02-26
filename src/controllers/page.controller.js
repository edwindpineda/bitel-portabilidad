const PagoService = require("../services/pago/pago.service.js");
const logger = require('../config/logger/loggerClient');

class PagoController {
  async linkPago(req, res) {
    try {
      const { grupo_familiar } = req.body;
      const enlace = await PagoService.generarLinkPago(grupo_familiar);
      if (enlace) {
        return res.status(200).json({ msg: "Enlace creado con exito", enlace: enlace });
      } else {
        return res.status(401).json({ msg: "Enlace no otorgado"});
      }

    } catch (error) {
      logger.error(`[pago.controller.js] Error al crear enlace de pago: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear enlace de pago" });
    }
  }

  async linkCambio(req, res) {
    try {
      const { grupo_familiar } = req.body;
      const enlace = await PagoService.generarLinkCambio(grupo_familiar);
      if (enlace) {
        return res.status(200).json({ msg: "Enlace creado con exito", enlace: enlace });
      } else {
        return res.status(401).json({ msg: "Enlace no otorgado"});
      }

    } catch (error) {
      logger.error(`[pago.controller.js] Error al crear enlace de cambio tarjeta: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear enlace de cambio tarjeta" });
    }
  }
}

module.exports = new PagoController();