const { pool } = require("../config/dbConnection.js");
const logger = require('../config/logger/loggerClient.js');

class TicketComentarioLecturaModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async markAsRead(idTicket, idUsuario, idUltimoComentario) {
        try {
            // Verificar si ya existe registro
            const [existing] = await this.connection.execute(
                'SELECT id FROM ticket_comentario_lectura WHERE id_ticket_soporte = ? AND id_usuario = ?',
                [idTicket, idUsuario]
            );

            if (existing.length > 0) {
                await this.connection.execute(
                    'UPDATE ticket_comentario_lectura SET id_ultimo_comentario_visto = ?, fecha_ultima_lectura = CURRENT_TIMESTAMP WHERE id = ?',
                    [idUltimoComentario, existing[0].id]
                );
            } else {
                await this.connection.execute(
                    'INSERT INTO ticket_comentario_lectura (id_ticket_soporte, id_usuario, id_ultimo_comentario_visto, fecha_ultima_lectura) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
                    [idTicket, idUsuario, idUltimoComentario]
                );
            }

            return true;
        } catch (error) {
            logger.error(`[ticketComentarioLectura.model.js] Error al marcar como leido: ${error.message}`);
            throw new Error(`Error al marcar como leido: ${error.message}`);
        }
    }

    async getUnreadCount(idTicket, idUsuario) {
        try {
            const [rows] = await this.connection.execute(
                `SELECT COUNT(*) as total FROM ticket_comentario tc
                WHERE tc.id_ticket_soporte = ? AND tc.estado_registro = 1
                AND tc.id > COALESCE(
                    (SELECT id_ultimo_comentario_visto FROM ticket_comentario_lectura
                     WHERE id_ticket_soporte = ? AND id_usuario = ?), 0
                )`,
                [idTicket, idTicket, idUsuario]
            );
            return parseInt(rows[0].total);
        } catch (error) {
            logger.error(`[ticketComentarioLectura.model.js] Error al obtener no leidos: ${error.message}`);
            throw new Error(`Error al obtener no leidos: ${error.message}`);
        }
    }
}

module.exports = TicketComentarioLecturaModel;
