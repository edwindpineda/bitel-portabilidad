const PagoService = require("../../pago/pago.service");
const logger = require("../../../config/logger/loggerClient");
const { pool } = require("../../../config/dbConnection.js");

class ToolExecutor {

    constructor(chatId) {
        this.lastEnlaceUrl = null;
        this.chatId = chatId;
    }

    async execute(toolName, args) {
        switch (toolName) {
            case "obtenerLinkPago":
                return this._obtenerLinkPago(args);
            case "obtenerLinkCambio":
                return this._obtenerLinkCambio(args);
            default:
                logger.warn(`[ToolExecutor] Tool desconocido: ${toolName}`);
                return JSON.stringify({ error: `Tool desconocido: ${toolName}` });
        }
    }

    async _obtenerLinkPago({grupo_familiar}) {
        logger.info("[ToolExecutor] obtenerLinkPago");

        let enlace = null;
        let errorDetalle = null;

        try {
            enlace = await PagoService.generarLinkPago(grupo_familiar);
            if (!enlace) errorDetalle = "El servicio no devolvió un enlace";
        } catch (err) {
            errorDetalle = err.message || "Error desconocido al generar el enlace de pago";
        }

        if (this.chatId) {
            await pool.execute(
                `INSERT INTO envio_link_pago (id_chat, enviado_link, error_detalle) VALUES (?, ?, ?)`,
                [this.chatId, enlace !== null, errorDetalle]
            );
        }

        if (!enlace) return JSON.stringify({ error: errorDetalle });

        this.lastEnlaceUrl = enlace;
        return JSON.stringify({ enlace });
    }

    async _obtenerLinkCambio({grupo_familiar}) {
        logger.info("[ToolExecutor] obtenerLinkCambio");
        const enlace = await PagoService.generarLinkCambio(grupo_familiar);
        if (!enlace) return JSON.stringify({ error: "No se pudo generar el enlace de cambio de tarjeta" });
        this.lastEnlaceUrl = enlace;
        return JSON.stringify({ enlace });
    }
}

module.exports = ToolExecutor;
