const { pool } = require("../config/dbConnection.js");

class ArgumentoVentaModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll() {
    const [rows] = await this.connection.execute(
      `SELECT id, titulo, argumento, estado_registro, fecha_registro, fecha_actualizacion
       FROM argumento_venta WHERE estado_registro = 1 ORDER BY id ASC`
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await this.connection.execute(
      `SELECT id, titulo, argumento, estado_registro, fecha_registro, fecha_actualizacion
       FROM argumento_venta WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { titulo, argumento } = data;
    const [result] = await this.connection.execute(
      `INSERT INTO argumento_venta (titulo, argumento) VALUES (?, ?)`,
      [titulo, argumento]
    );
    return result.insertId;
  }

  async update(id, data) {
    const { titulo, argumento } = data;
    await this.connection.execute(
      `UPDATE argumento_venta SET titulo = ?, argumento = ? WHERE id = ?`,
      [titulo, argumento, id]
    );
    return true;
  }

  async delete(id) {
    await this.connection.execute(
      `UPDATE argumento_venta SET estado_registro = 0 WHERE id = ?`,
      [id]
    );
    return true;
  }
}

module.exports = ArgumentoVentaModel;
