const { pool } = require("../config/dbConnection.js");

class TipificacionModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll(id_empresa = null) {
    let query = `SELECT * FROM tipificacion WHERE 1=1`;
    const params = [];

    if (id_empresa) {
      query += ' AND id_empresa = ?';
      params.push(id_empresa);
    }

    query += ' ORDER BY orden ASC, nombre ASC';

    const [rows] = await this.connection.execute(query, params);
    return rows;
  }

  async getAllForBot(id_empresa = null) {
    let query = `SELECT * FROM tipificacion WHERE flag_bot = 1`;
    const params = [];

    if (id_empresa) {
      query += ' AND id_empresa = ?';
      params.push(id_empresa);
    }

    query += ' ORDER BY orden ASC, nombre ASC';

    const [rows] = await this.connection.execute(query, params);
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
    const { nombre, definicion, orden, color, flag_asesor, flag_bot, id_empresa = null } = data;
    const [result] = await this.connection.execute(
      `INSERT INTO tipificacion (nombre, definicion, orden, color, flag_asesor, flag_bot, id_empresa) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, definicion || null, orden || 0, color || null, flag_asesor, flag_bot, id_empresa]
    );
    return result.insertId;
  }

  async update(id, data) {
    const { nombre, definicion, orden, color, flag_asesor, flag_bot, id_empresa = null } = data;
    const ordenValue = orden !== undefined && orden !== null ? orden : 0;

    let query = `UPDATE tipificacion SET nombre = ?, definicion = ?, orden = ?, color = ?, flag_asesor = ?, flag_bot = ? WHERE id = ?`;
    const params = [nombre, definicion || null, ordenValue, color || null, flag_asesor, flag_bot, id];

    if (id_empresa) {
      query = `UPDATE tipificacion SET nombre = ?, definicion = ?, orden = ?, color = ?, flag_asesor = ?, flag_bot = ? WHERE id = ? AND id_empresa = ?`;
      params.push(id_empresa);
    }

    await this.connection.execute(query, params);
    return true;
  }

  async delete(id, id_empresa = null) {
    let query = `DELETE FROM tipificacion WHERE id = ?`;
    const params = [id];

    if (id_empresa) {
      query = `DELETE FROM tipificacion WHERE id = ? AND id_empresa = ?`;
      params.push(id_empresa);
    }

    await this.connection.execute(query, params);
    return true;
  }
}

module.exports = TipificacionModel;
