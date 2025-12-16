const { pool } = require("../config/dbConnection.js");

class PlanesTarifariosModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll() {
    const [rows] = await this.connection.execute(
      `SELECT id, nombre, precio_regular, precio_promocional, descripcion, principal, imagen_url, created_at, updated_at
       FROM planes_tarifarios ORDER BY nombre`
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await this.connection.execute(
      `SELECT id, nombre, precio_regular, precio_promocional, descripcion, principal, imagen_url, created_at, updated_at
       FROM planes_tarifarios WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { nombre, precio_regular, precio_promocional, descripcion, principal, imagen_url } = data;
    const [result] = await this.connection.execute(
      `INSERT INTO planes_tarifarios (nombre, precio_regular, precio_promocional, descripcion, principal, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, precio_regular, precio_promocional || null, descripcion || null, principal ?? 1, imagen_url || null]
    );
    return result.insertId;
  }

  async update(id, data) {
    const { nombre, precio_regular, precio_promocional, descripcion, principal, imagen_url } = data;
    await this.connection.execute(
      `UPDATE planes_tarifarios
       SET nombre = ?, precio_regular = ?, precio_promocional = ?, descripcion = ?, principal = ?, imagen_url = ?
       WHERE id = ?`,
      [nombre, precio_regular, precio_promocional || null, descripcion || null, principal ?? 1, imagen_url || null, id]
    );
    return true;
  }

  async delete(id) {
    await this.connection.execute(
      `DELETE FROM planes_tarifarios WHERE id = ?`,
      [id]
    );
    return true;
  }
}

module.exports = PlanesTarifariosModel;
