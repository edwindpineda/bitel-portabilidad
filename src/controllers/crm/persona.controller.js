const PersonaModel = require("../../models/persona.model.js");
const logger = require('../../config/logger/loggerClient.js');

class PersonaController {
  async getById(req, res) {
    try {
      const { id } = req.params;
      const persona = await PersonaModel.getById(id);

      if (!persona) {
        return res.status(404).json({ msg: "Persona no encontrada" });
      }

      return res.status(200).json({ data: persona });
    } catch (error) {
      logger.error(`[persona.controller.js] Error al obtener persona: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener persona" });
    }
  }

  async create(req, res) {
    try {
      const { userId } = req.user || {};
      const persona = await PersonaModel.createPersona({ ...req.body, usuario_registro: userId });

      return res.status(201).json({ data: persona });
    } catch (error) {
      logger.error(`[persona.controller.js] Error al crear persona: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear persona" });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.user || {};

      await PersonaModel.updatePersona(id, { ...req.body, usuario_actualizacion: userId });

      return res.status(200).json({ msg: "Persona actualizada correctamente" });
    } catch (error) {
      logger.error(`[persona.controller.js] Error al actualizar persona: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar persona" });
    }
  }

  async bulkAssign(req, res) {
    try {
      const { persona_ids, id_asesor } = req.body;

      if (!persona_ids || !Array.isArray(persona_ids) || persona_ids.length === 0) {
        return res.status(400).json({ msg: "Debe seleccionar al menos una persona" });
      }

      if (!id_asesor) {
        return res.status(400).json({ msg: "Debe seleccionar un asesor" });
      }

      for (const personaId of persona_ids) {
        await PersonaModel.updatePersona(personaId, { id_usuario: id_asesor });
      }

      logger.info(`[persona.controller.js] Asignación masiva: ${persona_ids.length} personas asignadas al asesor ${id_asesor}`);
      return res.status(200).json({ msg: `${persona_ids.length} personas asignadas correctamente` });
    } catch (error) {
      logger.error(`[persona.controller.js] Error en asignación masiva: ${error.message}`);
      return res.status(500).json({ msg: "Error al asignar asesores" });
    }
  }
}

module.exports = new PersonaController();
