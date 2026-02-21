const { pool } = require("../config/dbConnection.js");
const logger = require('../config/logger/loggerClient.js');

class ProspectoModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async getById(id) {
        const [rows] = await this.connection.execute(
            "SELECT * FROM prospecto WHERE id = ? AND estado_registro = 1",
            [id]
        );

        return rows[0];
    }

    async selectByCelular(phone, id_empresa = null) {
        try {
            let query = `SELECT * FROM prospecto WHERE celular = ? AND estado_registro = 1`;

            const params = [phone];

            if (id_empresa) {
                query += ` AND id_empresa = ?`;
                params.push(id_empresa);
            }

            const [rows] = await this.connection.execute(query, params);

            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al buscar registro: ${error.message}`);
        }
    }


    /**
     * Crea un nuevo registro de consumo
     * @param {string} fechaConsumo - Fecha del consumo (formato: YYYY-MM-DD)
     * @param {string} tipo_usuario - Tipo de usuario
     * @returns {Promise<number>} - ID del registro creado
     */
    async createProspecto({ id_estado, celular, id_usuario, id_empresa, usuario_registro }) {
        try {
            const [result] = await this.connection.execute(
                'INSERT INTO prospecto (id_estado, celular, id_usuario, id_empresa, usuario_registro, usuario_actualizacion) VALUES (?, ?, ?, ?, ?, 1)',
                [id_estado, celular, id_usuario, id_empresa, usuario_registro]
            );

            const [rows] = await this.connection.execute(
                `SELECT * FROM prospecto WHERE id = ? AND estado_registro = 1`,
                [result.insertId]
            );

            return rows[0];
        } catch (error) {
            throw new Error(`Error al crear prospecto: ${error.message}`);
        }
    }

    static UPDATABLE_FIELDS = [
        'id_estado', 'id_usuario', 'nombre_completo', 'dni', 'direccion',
        'celular', 'id_tipificacion', 'usuario_actualizacion', 'id_empresa'
    ];

    async updateProspecto(id, data) {
        try {
            const fields = [];
            const values = [];

            for (const [key, value] of Object.entries(data)) {
                if (ProspectoModel.UPDATABLE_FIELDS.includes(key)) {
                    fields.push(`${key} = ?`);
                    values.push(value ?? null);
                }
            }

            if (fields.length === 0) {
                throw new Error('No se proporcionaron campos válidos para actualizar');
            }

            values.push(id);

            const query = `UPDATE prospecto SET ${fields.join(', ')} WHERE id = ?`;
            const [result] = await this.connection.execute(query, values);

            if (result.affectedRows === 0) {
                throw new Error('Prospecto no encontrado');
            }

            return true;
        } catch (error) {
            logger.error(`[prospecto.model.js] Error al actualizar prospecto: ${error.message}`);
            throw new Error(`Error al actualizar prospecto: ${error.message}`);
        }
    }

    /**
     * Obtiene todos los registros de consumo por tipo de usuario
     * @param {string} tipo_usuario - Tipo de usuario
     * @returns {Promise<Array>} - Array de registros de consumo
     */
    async getAsignacionesAsesor() {
        try {
            const [rows] = await this.connection.execute(
                'SELECT id_usuario FROM prospecto WHERE estado_registro = 1 ORDER BY fecha_registro DESC LIMIT 1',
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener asignaciones por tipo: ${error.message}`);
        }
    }
}

module.exports = new ProspectoModel();