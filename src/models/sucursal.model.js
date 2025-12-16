const { pool } = require("../config/dbConnection.js");

class SucursalModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll() {
    try {
      const [rows] = await this.connection.execute(
        `SELECT id, nombre, direccion, telefono, email, estado, fecha_registro
         FROM sucursal
         WHERE estado = 'activo'
         ORDER BY nombre`
      );
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

  async create({ nombre, direccion, telefono, email }) {
    try {
      const [result] = await this.connection.execute(
        `INSERT INTO sucursal (nombre, direccion, telefono, email, estado, fecha_registro, usuario_registro)
         VALUES (?, ?, ?, ?, 'activo', NOW(), 'admin')`,
        [nombre, direccion, telefono, email]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al crear sucursal: ${error.message}`);
    }
  }

  async update(id, { nombre, direccion, telefono, email }) {
    try {
      const [result] = await this.connection.execute(
        `UPDATE sucursal SET nombre = ?, direccion = ?, telefono = ?, email = ?
         WHERE id = ?`,
        [nombre, direccion, telefono, email, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al actualizar sucursal: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const [result] = await this.connection.execute(
        `UPDATE sucursal SET estado = 'inactivo'
         WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar sucursal: ${error.message}`);
    }
  }
}

module.exports = SucursalModel;
