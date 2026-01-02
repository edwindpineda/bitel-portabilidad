const { pool } = require("../config/dbConnection.js");

class PeriodicidadRecordatorioModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll(id_empresa = null) {
    let query = `SELECT id, nombre, cada_horas, id_empresa, estado_registro, fecha_registro, fecha_actualizacion
       FROM periodicidad_recordatorio WHERE estado_registro = 1`;
    const params = [];

    if (id_empresa) {
      query += ' AND id_empresa = ?';
      params.push(id_empresa);
    }

    query += ' ORDER BY cada_horas ASC';

    const [rows] = await this.connection.execute(query, params);
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
    const { nombre, cada_horas, id_empresa = null } = data;
    const [result] = await this.connection.execute(
      `INSERT INTO periodicidad_recordatorio (nombre, cada_horas, id_empresa) VALUES (?, ?, ?)`,
      [nombre, cada_horas, id_empresa]
    );
    return result.insertId;
  }

  async update(id, data) {
    const { nombre, cada_horas, id_empresa = null } = data;

    let query = `UPDATE periodicidad_recordatorio SET nombre = ?, cada_horas = ? WHERE id = ?`;
    const params = [nombre, cada_horas, id];

    if (id_empresa) {
      query = `UPDATE periodicidad_recordatorio SET nombre = ?, cada_horas = ? WHERE id = ? AND id_empresa = ?`;
      params.push(id_empresa);
    }

    await this.connection.execute(query, params);
    return true;
  }

  async delete(id, id_empresa = null) {
    let query = `UPDATE periodicidad_recordatorio SET estado_registro = 0 WHERE id = ?`;
    const params = [id];

    if (id_empresa) {
      query = `UPDATE periodicidad_recordatorio SET estado_registro = 0 WHERE id = ? AND id_empresa = ?`;
      params.push(id_empresa);
    }

    await this.connection.execute(query, params);
    return true;
  }
}

module.exports = PeriodicidadRecordatorioModel;
