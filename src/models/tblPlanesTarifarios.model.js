const { pool } = require("../config/dbConnection.js");

class TblPlanesTarifariosModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    /**
     * Obtiene todos los planes tarifarios activos
     * @returns {Promise<Array>} - Array de planes tarifarios
     */
    async getAllActivos() {
        try {
            const [rows] = await this.connection.execute(
                'SELECT * FROM tbl_planes_tarifarios WHERE activo = 1 ORDER BY precio_promocional ASC'
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener planes activos: ${error.message}`);
        }
    }

    /**
     * Obtiene todos los planes tarifarios (activos e inactivos)
     * @returns {Promise<Array>} - Array de planes tarifarios
     */
    async getAll() {
        try {
            const [rows] = await this.connection.execute(
                'SELECT * FROM tbl_planes_tarifarios ORDER BY precio_promocional ASC'
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener planes: ${error.message}`);
        }
    }

    /**
     * Obtiene planes por tipo (prepago, postpago o portabilidad)
     * @param {string} tipo_plan - 'prepago', 'postpago' o 'portabilidad'
     * @returns {Promise<Array>} - Array de planes del tipo especificado
     */
    async getByTipoPlan(tipo_plan) {
        try {
            const [rows] = await this.connection.execute(
                'SELECT * FROM tbl_planes_tarifarios WHERE tipo_plan = ? AND activo = 1 ORDER BY precio_promocional ASC',
                [tipo_plan]
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener planes por tipo: ${error.message}`);
        }
    }

    /**
     * Obtiene planes de portabilidad activos (ordenados del más caro al más barato para mostrar el Premium primero)
     * @returns {Promise<Array>} - Array de planes de portabilidad
     */
    async getPlanesPortabilidad() {
        try {
            const [rows] = await this.connection.execute(
                'SELECT * FROM tbl_planes_tarifarios WHERE tipo_plan = "portabilidad" AND activo = 1 ORDER BY precio_promocional DESC'
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener planes de portabilidad: ${error.message}`);
        }
    }

    /**
     * Obtiene un plan tarifario por ID
     * @param {number} id - ID del plan
     * @returns {Promise<Object|null>} - Objeto del plan o null si no existe
     */
    async getById(id) {
        try {
            const [rows] = await this.connection.execute(
                'SELECT * FROM tbl_planes_tarifarios WHERE id = ?',
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener plan por ID: ${error.message}`);
        }
    }

    /**
     * Crea un nuevo plan tarifario Bitel
     * @param {Object} plan - Datos del plan
     * @returns {Promise<number>} - ID del plan creado
     */
    async create({
        nombre,
        tipo_plan,
        precio_regular,
        precio_promocional,
        meses_promocion,
        internet_ilimitado,
        gigas_alta_velocidad,
        minutos_ilimitados,
        sms_ilimitados,
        gigas_acumulables,
        bono_adicional,
        streaming_incluido,
        vigencia_dias,
        descripcion,
        requisitos,
        activo = 1
    }) {
        try {
            const [result] = await this.connection.execute(
                `INSERT INTO tbl_planes_tarifarios
                (nombre, tipo_plan, precio_regular, precio_promocional, meses_promocion, internet_ilimitado, gigas_alta_velocidad, minutos_ilimitados, sms_ilimitados, gigas_acumulables, bono_adicional, streaming_incluido, vigencia_dias, descripcion, requisitos, activo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [nombre, tipo_plan, precio_regular, precio_promocional, meses_promocion, internet_ilimitado, gigas_alta_velocidad, minutos_ilimitados, sms_ilimitados, gigas_acumulables, bono_adicional, streaming_incluido, vigencia_dias, descripcion, requisitos, activo]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Error al crear plan: ${error.message}`);
        }
    }

    /**
     * Actualiza un plan tarifario
     * @param {number} id - ID del plan
     * @param {Object} plan - Datos a actualizar
     * @returns {Promise<boolean>} - true si se actualizó correctamente
     */
    async update(id, {
        nombre,
        tipo_plan,
        precio_regular,
        precio_promocional,
        meses_promocion,
        internet_ilimitado,
        gigas_alta_velocidad,
        minutos_ilimitados,
        sms_ilimitados,
        gigas_acumulables,
        bono_adicional,
        streaming_incluido,
        vigencia_dias,
        descripcion,
        requisitos,
        activo
    }) {
        try {
            const [result] = await this.connection.execute(
                `UPDATE tbl_planes_tarifarios
                SET nombre = ?, tipo_plan = ?, precio_regular = ?, precio_promocional = ?, meses_promocion = ?,
                    internet_ilimitado = ?, gigas_alta_velocidad = ?, minutos_ilimitados = ?, sms_ilimitados = ?,
                    gigas_acumulables = ?, bono_adicional = ?, streaming_incluido = ?, vigencia_dias = ?,
                    descripcion = ?, requisitos = ?, activo = ?
                WHERE id = ?`,
                [nombre, tipo_plan, precio_regular, precio_promocional, meses_promocion, internet_ilimitado, gigas_alta_velocidad, minutos_ilimitados, sms_ilimitados, gigas_acumulables, bono_adicional, streaming_incluido, vigencia_dias, descripcion, requisitos, activo, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar plan: ${error.message}`);
        }
    }

    /**
     * Desactiva un plan tarifario (soft delete)
     * @param {number} id - ID del plan
     * @returns {Promise<boolean>} - true si se desactivó correctamente
     */
    async softDelete(id) {
        try {
            const [result] = await this.connection.execute(
                'UPDATE tbl_planes_tarifarios SET activo = 0 WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al desactivar plan: ${error.message}`);
        }
    }

    /**
     * Elimina un plan tarifario permanentemente
     * @param {number} id - ID del plan
     * @returns {Promise<boolean>} - true si se eliminó correctamente
     */
    async delete(id) {
        try {
            const [result] = await this.connection.execute(
                'DELETE FROM tbl_planes_tarifarios WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar plan: ${error.message}`);
        }
    }
}

module.exports = TblPlanesTarifariosModel;
