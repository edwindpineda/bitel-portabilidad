const { pool } = require("../config/dbConnection.js");

class ProveedorModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll(id_empresa = null) {
    let query = `SELECT id, nombre, id_empresa, estado_registro, created_at, updated_at
       FROM proveedor WHERE estado_registro = 1`;
    const params = [];

    if (id_empresa) {
      query += ` AND id_empresa = ?`;
      params.push(id_empresa);
    }

    query += ` ORDER BY nombre`;

    const [rows] = await this.connection.execute(query, params);
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
    const { nombre, id_empresa } = data;
    const [result] = await this.connection.execute(
      `INSERT INTO proveedor (nombre, id_empresa) VALUES (?, ?)`,
      [nombre, id_empresa]
    );
    return result.insertId;
  }

  async update(id, data) {
    const { nombre, id_empresa } = data;
    let query = `UPDATE proveedor SET nombre = ? WHERE id = ?`;
    const params = [nombre, id];

    if (id_empresa) {
      query = `UPDATE proveedor SET nombre = ? WHERE id = ? AND id_empresa = ?`;
      params.push(id_empresa);
    }

    await this.connection.execute(query, params);
    return true;
  }

  async delete(id, id_empresa = null) {
    let query = `UPDATE proveedor SET estado_registro = 0 WHERE id = ?`;
    const params = [id];

    if (id_empresa) {
      query = `UPDATE proveedor SET estado_registro = 0 WHERE id = ? AND id_empresa = ?`;
      params.push(id_empresa);
    }

    const [result] = await this.connection.execute(query, params);
    return result.affectedRows > 0;
  }
}

module.exports = ProveedorModel;
