const { pool } = require("../config/dbConnection.js");
const logger = require('../config/logger/loggerClient.js');

class TicketParticipanteModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async add(data) {
        try {
            const { id_ticket_soporte, id_usuario, id_usuario_agrego, rol = 'participante' } = data;

            // Verificar si ya existe
            const [existing] = await this.connection.execute(
                'SELECT id FROM ticket_participante WHERE id_ticket_soporte = ? AND id_usuario = ? AND estado_registro = 1',
                [id_ticket_soporte, id_usuario]
            );

            if (existing.length > 0) {
                return existing[0].id;
            }

            const [result] = await this.connection.execute(
                `INSERT INTO ticket_participante (id_ticket_soporte, id_usuario, id_usuario_agrego, rol)
                VALUES (?, ?, ?, ?)`,
                [id_ticket_soporte, id_usuario, id_usuario_agrego, rol]
            );

            return result.insertId;
        } catch (error) {
            logger.error(`[ticketParticipante.model.js] Error al agregar participante: ${error.message}`);
            throw new Error(`Error al agregar participante: ${error.message}`);
        }
    }

    async remove(idTicket, idUsuario) {
        try {
            const [result] = await this.connection.execute(
                'UPDATE ticket_participante SET estado_registro = 0 WHERE id_ticket_soporte = ? AND id_usuario = ?',
                [idTicket, idUsuario]
            );
            return result.affectedRows > 0;
        } catch (error) {
            logger.error(`[ticketParticipante.model.js] Error al remover participante: ${error.message}`);
            throw new Error(`Error al remover participante: ${error.message}`);
        }
    }

    async findByTicket(idTicket) {
        try {
            const [rows] = await this.connection.execute(
                `SELECT tp.*, u.username
                FROM ticket_participante tp
                LEFT JOIN usuario u ON u.id = tp.id_usuario
                WHERE tp.id_ticket_soporte = ? AND tp.estado_registro = 1
                ORDER BY tp.fecha_registro ASC`,
                [idTicket]
            );
            return rows;
        } catch (error) {
            logger.error(`[ticketParticipante.model.js] Error al obtener participantes: ${error.message}`);
            throw new Error(`Error al obtener participantes: ${error.message}`);
        }
    }
}

module.exports = TicketParticipanteModel;
