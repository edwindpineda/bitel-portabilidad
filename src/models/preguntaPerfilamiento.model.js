const { pool } = require("../config/dbConnection.js");

class PreguntaPerfilamientoModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll() {
    const [rows] = await this.connection.execute(
      `SELECT id, pregunta, orden, estado_registro, fecha_registro, fecha_actualizacion
       FROM pregunta_perfilamiento WHERE estado_registro = 1 ORDER BY orden ASC`
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await this.connection.execute(
      `SELECT id, pregunta, orden, estado_registro, fecha_registro, fecha_actualizacion
       FROM pregunta_perfilamiento WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { pregunta, orden } = data;
    const [result] = await this.connection.execute(
      `INSERT INTO pregunta_perfilamiento (pregunta, orden) VALUES (?, ?)`,
      [pregunta, orden || 0]
    );
    return result.insertId;
  }

  async update(id, data) {
    const { pregunta, orden } = data;
    await this.connection.execute(
      `UPDATE pregunta_perfilamiento SET pregunta = ?, orden = ? WHERE id = ?`,
      [pregunta, orden || 0, id]
    );
    return true;
  }

  async delete(id) {
    await this.connection.execute(
      `UPDATE pregunta_perfilamiento SET estado_registro = 0 WHERE id = ?`,
      [id]
    );
    return true;
  }
}

module.exports = PreguntaPerfilamientoModel;
