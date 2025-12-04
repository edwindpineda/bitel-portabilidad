const { pool } = require("../config/dbConnection.js");

class TblAuditoriaApiModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    /**
     * Inserta un nuevo registro en la tabla auditoria_api
     * @param {Object} data - Datos del registro
     * @param {string} data.phone - Número de teléfono
     * @param {string} data.question - Pregunta realizada
     * @param {string} data.tipo_usuario - Tipo de usuario ('user' o 'developer')
     * @param {string} data.fecha_ingreso - Fecha de ingreso (formato: YYYY-MM-DD)
     * @param {number} data.id_contacto - ID del contacto (opcional)
     * @param {number} data.id_cliente_rest - ID del cliente REST (opcional)
     * @param {Object|string} data.respuesta_api - Respuesta de la API como JSON (opcional)
     * @returns {Promise<number>} - ID del registro insertado
     */
    async insert({
        phone,
        question,
        tipo_usuario,
        fecha_ingreso,
        id_contacto = null,
        id_cliente_rest = null,
        respuesta_api
    }) {
        try {
            const [result] = await this.connection.execute(
                `INSERT INTO auditoria_api 
                 (phone, question, tipo_usuario, fecha_ingreso, id_contacto, id_cliente_rest, respuesta_api) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [phone, question, tipo_usuario, fecha_ingreso, id_contacto, id_cliente_rest, JSON.stringify(respuesta_api)]
            );

            return result.insertId;
        } catch (error) {
            throw new Error(`Error al insertar en auditoria_api: ${error.message}`);
        }
    }

    async getChatsByContacto (contacto) {
        try {
            const [rows] = await this.connection.execute(
                "SELECT question, respuesta_api, created_at FROM auditoria_api WHERE phone = ?",
                [contacto]
            );

            return rows;
        }
        catch (error) {
            throw new Error(`Error al obtener info de auditoria_api: ${error.message}`);
        }
    }
}

module.exports = TblAuditoriaApiModel;
