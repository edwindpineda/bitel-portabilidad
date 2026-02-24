const PersonaModel = require("../../models/persona.model.js");
const logger = require('../../config/logger/loggerClient.js');

class ClientesController {
    async getClientes(req, res) {
        try {
            const { userId, rolId, idEmpresa } = req.user || {};
            const clientes = await PersonaModel.getAllClientes(userId, rolId, idEmpresa);
            return res.status(200).json({ data: clientes });
        } catch (error) {
            logger.error(`[clientes.controller.js] Error al obtener clientes: ${error.message}`);
            return res.status(500).json({ msg: "Error al obtener clientes" });
        }
    }

    async getClienteById(req, res) {
        try {
            const { id } = req.params;
            const cliente = await PersonaModel.getById(id);
            if (!cliente || cliente.id_tipo_persona !== 2) {
                return res.status(404).json({ msg: "Cliente no encontrado" });
            }
            return res.status(200).json({ data: cliente });
        } catch (error) {
            logger.error(`[clientes.controller.js] Error al obtener cliente: ${error.message}`);
            return res.status(500).json({ msg: "Error al obtener cliente" });
        }
    }
}

module.exports = new ClientesController();
