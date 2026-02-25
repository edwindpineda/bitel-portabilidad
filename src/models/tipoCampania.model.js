const { pool } = require("../config/dbConnection.js");

class TipoCampaniaModel {
    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async getAll(id_empresa = null) {
        try {
            let query = `SELECT * FROM tipo_campania WHERE estado_registro = 1`;
            const params = [];
            if (id_empresa) {
                query += ` AND id_empresa = ?`;
                params.push(id_empresa);
            }
            query += ` ORDER BY nombre ASC`;
            const [rows] = await this.connection.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener tipos de campania: ${error.message}`);
        }
    }

    async getById(id) {
        try {
            const [rows] = await this.connection.execute(
                `SELECT * FROM tipo_campania WHERE id = ? AND estado_registro = 1`,
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener tipo de campania: ${error.message}`);
        }
    }

    async create({ id_empresa, nombre, descripcion, usuario_registro }) {
        try {
            const [result] = await this.connection.execute(
                `INSERT INTO tipo_campania (id_empresa, nombre, descripcion, estado_registro, usuario_registro)
                 VALUES (?, ?, ?, 1, ?)`,
                [id_empresa, nombre, descripcion || null, usuario_registro || null]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Error al crear tipo de campania: ${error.message}`);
        }
    }

    async update(id, { nombre, descripcion, usuario_actualizacion }) {
        try {
            const [result] = await this.connection.execute(
                `UPDATE tipo_campania SET nombre = ?, descripcion = ?,
                 usuario_actualizacion = ?, fecha_actualizacion = NOW()
                 WHERE id = ?`,
                [nombre, descripcion || null, usuario_actualizacion || null, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar tipo de campania: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            const [result] = await this.connection.execute(
                `UPDATE tipo_campania SET estado_registro = 0, fecha_actualizacion = NOW() WHERE id = ?`,
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar tipo de campania: ${error.message}`);
        }
    }
}

module.exports = TipoCampaniaModel;
