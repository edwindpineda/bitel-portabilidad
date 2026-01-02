const { pool } = require("../config/dbConnection.js");

class SucursalModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll(id_empresa = null) {
    try {
      let query = `SELECT id, nombre, direccion, telefono, email, estado, fecha_registro, id_empresa
         FROM sucursal
         WHERE estado = 'activo'`;
      const params = [];

      if (id_empresa) {
        query += ` AND id_empresa = ?`;
        params.push(id_empresa);
      }

      query += ` ORDER BY nombre`;

      const [rows] = await this.connection.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener sucursales: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const [rows] = await this.connection.execute(
        `SELECT id, nombre, direccion, telefono, email, estado, fecha_registro
         FROM sucursal
         WHERE id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener sucursal: ${error.message}`);
    }
  }

  async create({ nombre, direccion, telefono, email, id_empresa }) {
    try {
      const [result] = await this.connection.execute(
        `INSERT INTO sucursal (nombre, direccion, telefono, email, estado, fecha_registro, usuario_registro, id_empresa)
         VALUES (?, ?, ?, ?, 'activo', NOW(), 'admin', ?)`,
        [nombre, direccion, telefono, email, id_empresa]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al crear sucursal: ${error.message}`);
    }
  }

  async update(id, { nombre, direccion, telefono, email, id_empresa }) {
    try {
      let query = `UPDATE sucursal SET nombre = ?, direccion = ?, telefono = ?, email = ? WHERE id = ?`;
      const params = [nombre, direccion, telefono, email, id];

      if (id_empresa) {
        query = `UPDATE sucursal SET nombre = ?, direccion = ?, telefono = ?, email = ? WHERE id = ? AND id_empresa = ?`;
        params.push(id_empresa);
      }

      const [result] = await this.connection.execute(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al actualizar sucursal: ${error.message}`);
    }
  }

  async delete(id, id_empresa = null) {
    try {
      let query = `UPDATE sucursal SET estado = 'inactivo' WHERE id = ?`;
      const params = [id];

      if (id_empresa) {
        query = `UPDATE sucursal SET estado = 'inactivo' WHERE id = ? AND id_empresa = ?`;
        params.push(id_empresa);
      }

      const [result] = await this.connection.execute(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar sucursal: ${error.message}`);
    }
  }
}

module.exports = SucursalModel;
