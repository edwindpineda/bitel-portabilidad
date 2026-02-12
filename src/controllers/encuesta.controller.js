const EncuestaModel = require("../models/encuesta.model.js");
const logger = require('../config/logger/loggerClient.js');

class EncuestaController {

  async crearEncuesta(req, res) {
    try {
      const {
        nombre_contacto,
        participacion_encuesta,
        p1_piensa_votar,
        p2_intencion_voto,
        p2_observaciones,
        p3a_sabe_como_votar,
        p3a_refuerzo_pedagogico,
        p3b_conoce_candidato,
        p4_autoriza_whatsapp,
        whatsapp_contacto,
        notas_adicionales
      } = req.body;

      const encuesta = new EncuestaModel();

      const id = await encuesta.create({
        nombre_contacto,
        participacion_encuesta,
        p1_piensa_votar,
        p2_intencion_voto,
        p2_observaciones,
        p3a_sabe_como_votar,
        p3a_refuerzo_pedagogico,
        p3b_conoce_candidato,
        p4_autoriza_whatsapp,
        whatsapp_contacto,
        notas_adicionales
      });

      return res.status(201).json({ msg: "Encuesta guardada exitosamente", data: { id } });
    }
    catch (error) {
      logger.error(`[encuesta.controller.js] Error al crear encuesta: ${error.message}`);
      return res.status(500).json({ msg: "Error al guardar encuesta" });
    }
  }

  async getEncuestas(req, res) {
    try {
      const encuesta = new EncuestaModel();
      const encuestas = await encuesta.getAll();
      return res.status(200).json({ msg: "Encuesta obtenidas", data: { encuestas } });
    }
    catch (error) {
      logger.error(`[encuesta.controller.js] Error al obtener encuestas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener encuestas" });
    }
  }
}

module.exports = new EncuestaController();