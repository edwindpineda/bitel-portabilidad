const { pool } = require("../config/dbConnection.js");

class ProveedorModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll() {
    const [rows] = await this.connection.execute(
      `SELECT id, nombre, created_at, updated_at
       FROM proveedor ORDER BY nombre`
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await this.connection.execute(
      `SELECT id, nombre, created_at, updated_at
       FROM proveedor WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { nombre } = data;
    const [result] = await this.connection.execute(
      `INSERT INTO proveedor (nombre) VALUES (?)`,
      [nombre]
    );
    return result.insertId;
  }

  async update(id, data) {
    const { nombre } = data;
    await this.connection.execute(
      `UPDATE proveedor SET nombre = ? WHERE id = ?`,
      [nombre, id]
    );
    return true;
  }

  async delete(id) {
    await this.connection.execute(
      `DELETE FROM proveedor WHERE id = ?`,
      [id]
    );
    return true;
  }
}

module.exports = ProveedorModel;
