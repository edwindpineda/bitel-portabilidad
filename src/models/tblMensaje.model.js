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

    /**
     * Crea un nuevo mensaje para un contacto
     * @param {number} idContacto - ID del contacto
     * @param {string} contenido - Contenido del mensaje
     * @param {string} direccion - Direccion del mensaje ('in' o 'out')
     * @param {string} wid - Id de la conversacion 
     * @returns {Promise<Object>} - Mensaje creado
     */
    async create(idContacto, contenido, direccion = 'out', wid) {
        try {
            const [result] = await this.connection.execute(
                `INSERT INTO mensaje (id_contacto, direccion, tipo_mensaje, wid_mensaje, contenido, fecha_hora, fecha_registro, estado_registro)
                 VALUES (?, ?, 'text', ?, ?, NOW(), NOW(), 1)`,
                [idContacto, direccion, wid,contenido]
            );

            return {
                id: result.insertId,
                id_contacto: idContacto,
                direccion,
                contenido,
                wid,
                fecha_registro: new Date()
            };
        } catch (error) {
            throw new Error(`Error al crear mensaje: ${error.message}`);
        }
    }
}

module.exports = TblMensajeModel;
