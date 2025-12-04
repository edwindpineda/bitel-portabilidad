const { pool } = require("../config/dbConnection.js");

class TblClienteRestModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async getById(id) {
        const [rows] = await this.connection.execute(
            "SELECT * FROM prospecto WHERE id = ?",
            [id]
        );

        return rows[0];
    }

    // Obtener el consumo total de un usuario
    async getConsumoTotal(tipo_usuario) {
        const [rows] = await this.connection.execute(
            'SELECT SUM(count_consumo) AS total_consumo FROM prospecto WHERE tipo_usuario = ?',
            [tipo_usuario]
        );

        return rows.length > 0 ? rows[0].total_consumo : 0;
    }

    /**
     * Busca un registro por fecha y tipo de usuario
     * @param {string} fechaConsumo - Fecha del consumo (formato: YYYY-MM-DD)
     * @param {string} tipo_usuario - Tipo de usuario
     * @returns {Promise<Object|null>} - Objeto del registro o null si no existe
     */
    async selectByFechaAndTipo(fechaConsumo, tipo_usuario) {
        try {
    
            const [rows] = await this.connection.execute(
                'SELECT * FROM prospecto WHERE fecha_consumo = ? AND tipo_usuario = ?',
                [fechaConsumo, tipo_usuario]
            );

            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al buscar registro: ${error.message}`);
        }
    }

    async selectByCelular(userType, celular) {
        try {
    
            const [rows] = await this.connection.execute(
                'SELECT * FROM prospecto WHERE tipo_usuario = ? AND celular = ?',
                [userType, celular]
            );

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
    async createProspecto(tipo_usuario, id_estado, phone) {
        try {
            const [result] = await this.connection.execute(
                'INSERT INTO prospecto (tipo_usuario, id_estado, celular) VALUES (?, ?, ?)',
                [tipo_usuario, id_estado, phone]
            );

                const [rows] = await this.connection.execute(
                `SELECT * FROM prospecto WHERE id = ?`,
                [result.insertId]
            );

            return rows[0];
        } catch (error) {
            throw new Error(`Error al crear consumo: ${error.message}`);
        }
    }

    /**
     * Actualiza el contador de consumo para una fecha y tipo de usuario específicos
     * @param {string} fechaConsumo - Fecha del consumo (formato: YYYY-MM-DD)
     * @param {string} tipo_usuario - Tipo de usuario
     * @returns {Promise<boolean>} - true si se actualizó correctamente
     */
    async updateConsumo(fechaConsumo, tipo_usuario) {
        try {
            const [result] = await this.connection.execute(
                'UPDATE prospecto SET count_consumo = count_consumo + 1 WHERE fecha_consumo = ? AND tipo_usuario = ?',
                [fechaConsumo, tipo_usuario]
            );

            if (result.affectedRows === 0) {
                throw new Error('No se pudo actualizar el consumo');
            }

            return true;
        } catch (error) {
            console.log("error", error);
            throw new Error(`Error al actualizar consumo: ${error.message}`);
        }
    }

    async updateEstado(id, id_estado) {
        try {
            const [result] = await this.connection.execute(
                'UPDATE prospecto SET id_estado = ? WHERE id = ?',
                [id_estado, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('No se pudo actualizar el consumo');
            }

            return true;
        } catch (error) {
            console.log("error", error);
            throw new Error(`Error al actualizar consumo: ${error.message}`);
        }
    }

    async updateDatosProspecto(nombre_completo, dni, direccion, id_plan, celular, id) {
        try {
            const [result] = await this.connection.execute(
                'UPDATE prospecto SET nombre_completo = ?, dni = ?, direccion = ?, id_plan = ?, celular = ? WHERE id = ?',
                [nombre_completo, dni, direccion, id_plan, celular, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('No se pudo actualizar el consumo');
            }

            return true;
        } catch (error) {
            console.log("error", error);
            throw new Error(`Error al actualizar datos del prospecto: ${error.message}`);
        }
    }

    /**
     * Obtiene todos los registros de consumo por tipo de usuario
     * @param {string} tipo_usuario - Tipo de usuario
     * @returns {Promise<Array>} - Array de registros de consumo
     */
    async getAllConsumoByTipo(tipo_usuario) {
        try {
            const [rows] = await this.connection.execute(
                'SELECT fecha_consumo, count_consumo FROM prospecto WHERE tipo_usuario = ?',
                [tipo_usuario]
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener consumo por tipo: ${error.message}`);
        }
    }

    /**
     * Obtiene el consumo de un día específico por tipo de usuario
     * @param {string} fechaConsumo - Fecha del consumo (formato: YYYY-MM-DD)
     * @param {string} tipo_usuario - Tipo de usuario
     * @returns {Promise<Object|null>} - Objeto del registro o null si no existe
     */
    async getConsumoByFechaAndTipo(fechaConsumo, tipo_usuario) {
        try {
            const [rows] = await this.connection.execute(
                'SELECT fecha_consumo, count_consumo FROM prospecto WHERE fecha_consumo = ? AND tipo_usuario = ?',
                [fechaConsumo, tipo_usuario]
            );
            
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener consumo por fecha y tipo: ${error.message}`);
        }
    }
}

module.exports = TblClienteRestModel;