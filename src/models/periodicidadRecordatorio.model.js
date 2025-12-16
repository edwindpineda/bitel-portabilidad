const { pool } = require("../config/dbConnection.js");

class PeriodicidadRecordatorioModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll() {
    const [rows] = await this.connection.execute(
      `SELECT id, nombre, cada_horas, estado_registro, fecha_registro, fecha_actualizacion
       FROM periodicidad_recordatorio WHERE estado_registro = 1 ORDER BY cada_horas ASC`
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await this.connection.execute(
      `SELECT id, nombre, cada_horas, estado_registro, fecha_registro, fecha_actualizacion
       FROM periodicidad_recordatorio WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { nombre, cada_horas } = data;
    const [result] = await this.connection.execute(
      `INSERT INTO periodicidad_recordatorio (nombre, cada_horas) VALUES (?, ?)`,
      [nombre, cada_horas]
    );
    return result.insertId;
  }

  async update(id, data) {
    const { nombre, cada_horas } = data;
    await this.connection.execute(
      `UPDATE periodicidad_recordatorio SET nombre = ?, cada_horas = ? WHERE id = ?`,
      [nombre, cada_horas, id]
    );
    return true;
  }

  async delete(id) {
    await this.connection.execute(
      `UPDATE periodicidad_recordatorio SET estado_registro = 0 WHERE id = ?`,
      [id]
    );
    return true;
  }
}

module.exports = PeriodicidadRecordatorioModel;
