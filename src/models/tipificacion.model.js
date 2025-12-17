const { pool } = require("../config/dbConnection.js");

class TipificacionModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll() {
    const [rows] = await this.connection.execute(
      `SELECT *
       FROM tipificacion ORDER BY orden ASC, nombre ASC`
    );
    return rows;
  }

  async getAllForBot() {
    const [rows] = await this.connection.execute(
      `SELECT *
       FROM tipificacion WHERE flag_bot = 1 ORDER BY orden ASC, nombre ASC`
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await this.connection.execute(
      `SELECT id, nombre, definicion, orden, color, fecha_registro, fecha_actualizacion
       FROM tipificacion WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { nombre, definicion, orden, color, flag_asesor, flag_bot } = data;
    const [result] = await this.connection.execute(
      `INSERT INTO tipificacion (nombre, definicion, orden, color, flag_asesor, flag_bot) VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, definicion || null, orden || 0, color || null, flag_asesor, flag_bot]
    );
    return result.insertId;
  }

  async update(id, data) {
    const { nombre, definicion, orden, color, flag_asesor, flag_bot } = data;
    const ordenValue = orden !== undefined && orden !== null ? orden : 0;
    await this.connection.execute(
      `UPDATE tipificacion SET nombre = ?, definicion = ?, orden = ?, color = ?, flag_asesor = ?, flag_bot = ? WHERE id = ?`,
      [nombre, definicion || null, ordenValue, color || null, flag_asesor, flag_bot, id]
    );
    return true;
  }

  async delete(id) {
    await this.connection.execute(
      `DELETE FROM tipificacion WHERE id = ?`,
      [id]
    );
    return true;
  }
}

module.exports = TipificacionModel;
