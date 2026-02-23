const { pool } = require("../config/dbConnection.js");

class ProveedorModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll(id_empresa = null) {
    try {
      let query = `SELECT id, nombre, estado_registro, fecha_registro FROM proveedor WHERE estado_registro = 1`;
      const params = [];

      if (id_empresa) {
        query += ' AND id_empresa = ?';
        params.push(id_empresa);
      }

      query += ' ORDER BY nombre ASC';

      const [rows] = await this.connection.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener proveedores: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const [rows] = await this.connection.execute(
        `SELECT id, nombre, estado_registro, fecha_registro FROM proveedor WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener proveedor: ${error.message}`);
    }
  }

  async create({ nombre, id_empresa = null }) {
    try {
      const [result] = await this.connection.execute(
        `INSERT INTO proveedor (nombre, id_empresa, estado_registro, fecha_registro) VALUES (?, ?, 1, NOW())`,
        [nombre, id_empresa]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al crear proveedor: ${error.message}`);
    }
  }

  async update(id, { nombre }) {
    try {
      const [result] = await this.connection.execute(
        `UPDATE proveedor SET nombre = ?, fecha_actualizacion = NOW() WHERE id = ?`,
        [nombre, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al actualizar proveedor: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const [result] = await this.connection.execute(
        `UPDATE proveedor SET estado_registro = 0 WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar proveedor: ${error.message}`);
    }
  }
}

module.exports = ProveedorModel;
