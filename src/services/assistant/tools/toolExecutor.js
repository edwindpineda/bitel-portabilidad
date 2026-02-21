const PagoService = require("../../pago/pago.service");
const logger = require("../../../config/logger/loggerClient");

class ToolExecutor {

    async execute(toolName, args) {
        switch (toolName) {
            case "obtenerLinkPago":
                return this._obtenerLinkPago();
            case "obtenerLinkCambio":
                return this._obtenerLinkCambio();
            default:
                logger.warn(`[ToolExecutor] Tool desconocido: ${toolName}`);
                return JSON.stringify({ error: `Tool desconocido: ${toolName}` });
        }
    }

    async _obtenerLinkPago() {
        logger.info("[ToolExecutor] obtenerLinkPago");
        const enlace = await PagoService.generarLinkPago();
        if (!enlace) return JSON.stringify({ error: "No se pudo generar el enlace de pago" });
        return JSON.stringify({ enlace });
    }

    async _obtenerLinkCambio() {
        logger.info("[ToolExecutor] obtenerLinkCambio");
        const enlace = await PagoService.generarLinkCambio();
        if (!enlace) return JSON.stringify({ error: "No se pudo generar el enlace de cambio de tarjeta" });
        return JSON.stringify({ enlace });
    }
}

module.exports = ToolExecutor;
