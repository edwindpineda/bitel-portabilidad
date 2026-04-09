const { pool } = require("../config/dbConnection.js");
const logger = require('../config/logger/loggerClient.js');

class TicketAdjuntoModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async create(data) {
        try {
            const { id_ticket_soporte, id_ticket_comentario = null, nombre_archivo, nombre_original, tipo_archivo, ruta_archivo, id_usuario, usuario_registro } = data;

            const [result] = await this.connection.execute(
                `INSERT INTO ticket_adjunto
                (id_ticket_soporte, id_ticket_comentario, nombre_archivo, nombre_original, tipo_archivo, ruta_archivo, id_usuario, usuario_registro)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [id_ticket_soporte, id_ticket_comentario, nombre_archivo, nombre_original, tipo_archivo, ruta_archivo, id_usuario, usuario_registro || id_usuario]
            );

            return result.insertId;
        } catch (error) {
            logger.error(`[ticketAdjunto.model.js] Error al crear adjunto: ${error.message}`);
            throw new Error(`Error al crear adjunto: ${error.message}`);
        }
    }

    async findByTicket(idTicket) {
        try {
            const [rows] = await this.connection.execute(
                `SELECT ta.*, u.username
                FROM ticket_adjunto ta
                LEFT JOIN usuario u ON u.id = ta.id_usuario
                WHERE ta.id_ticket_soporte = ? AND ta.estado_registro = 1
                ORDER BY ta.fecha_registro ASC`,
                [idTicket]
            );
            return rows;
        } catch (error) {
            logger.error(`[ticketAdjunto.model.js] Error al obtener adjuntos: ${error.message}`);
            throw new Error(`Error al obtener adjuntos: ${error.message}`);
        }
    }

    async findByComentario(idComentario) {
        try {
            const [rows] = await this.connection.execute(
                `SELECT * FROM ticket_adjunto WHERE id_ticket_comentario = ? AND estado_registro = 1 ORDER BY fecha_registro ASC`,
                [idComentario]
            );
            return rows;
        } catch (error) {
            logger.error(`[ticketAdjunto.model.js] Error al obtener adjuntos por comentario: ${error.message}`);
            throw new Error(`Error al obtener adjuntos por comentario: ${error.message}`);
        }
    }

    async delete(id, userId) {
        try {
            const [result] = await this.connection.execute(
                'UPDATE ticket_adjunto SET estado_registro = 0 WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            logger.error(`[ticketAdjunto.model.js] Error al eliminar adjunto: ${error.message}`);
            throw new Error(`Error al eliminar adjunto: ${error.message}`);
        }
    }
}

module.exports = TicketAdjuntoModel;
