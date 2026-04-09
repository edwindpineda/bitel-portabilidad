const { pool } = require("../config/dbConnection.js");
const logger = require('../config/logger/loggerClient.js');

class TicketHistorialModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async create(data) {
        try {
            const { id_ticket_soporte, id_estado_anterior = null, id_estado_nuevo, id_usuario_anterior = null, id_usuario_nuevo = null, comentario = null, id_usuario } = data;

            const [result] = await this.connection.execute(
                `INSERT INTO ticket_historial
                (id_ticket_soporte, id_estado_anterior, id_estado_nuevo, id_usuario_anterior, id_usuario_nuevo, comentario, id_usuario)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id_ticket_soporte, id_estado_anterior, id_estado_nuevo, id_usuario_anterior, id_usuario_nuevo, comentario, id_usuario]
            );

            return result.insertId;
        } catch (error) {
            logger.error(`[ticketHistorial.model.js] Error al crear historial: ${error.message}`);
            throw new Error(`Error al crear historial: ${error.message}`);
        }
    }

    async findByTicket(idTicket) {
        try {
            const [rows] = await this.connection.execute(
                `SELECT th.*,
                    ea.nombre as estado_anterior_nombre, ea.color as estado_anterior_color,
                    en.nombre as estado_nuevo_nombre, en.color as estado_nuevo_color,
                    u.username,
                    uant.username as usuario_anterior_username,
                    unew.username as usuario_nuevo_username
                FROM ticket_historial th
                LEFT JOIN estado_ticket ea ON ea.id = th.id_estado_anterior
                LEFT JOIN estado_ticket en ON en.id = th.id_estado_nuevo
                LEFT JOIN usuario u ON u.id = th.id_usuario
                LEFT JOIN usuario uant ON uant.id = th.id_usuario_anterior
                LEFT JOIN usuario unew ON unew.id = th.id_usuario_nuevo
                WHERE th.id_ticket_soporte = ?
                ORDER BY th.fecha_registro ASC`,
                [idTicket]
            );
            return rows;
        } catch (error) {
            logger.error(`[ticketHistorial.model.js] Error al obtener historial: ${error.message}`);
            throw new Error(`Error al obtener historial: ${error.message}`);
        }
    }
}

module.exports = TicketHistorialModel;
