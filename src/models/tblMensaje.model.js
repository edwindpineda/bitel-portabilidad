const { pool } = require("../config/dbConnection.js");

class TblMensajeModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    /**
     * Obtiene los mensajes de un contacto por su ID
     * @param {number} idContacto - ID del contacto
     * @returns {Promise<Array>} - Array de mensajes
     */
    async getByContactoId(idContacto) {
        try {
            const [rows] = await this.connection.execute(
                `SELECT id, id_contacto, direccion, tipo_mensaje, contenido,
                        contenido_archivo, fecha_hora, fecha_registro
                 FROM mensaje
                 WHERE id_contacto = ? AND estado_registro = 1
                 ORDER BY fecha_registro ASC`,
                [idContacto]
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener mensajes del contacto: ${error.message}`);
        }
    }
}

module.exports = TblMensajeModel;
