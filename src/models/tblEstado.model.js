const { pool } = require("../config/dbConnection.js");

class TblEstadoModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getById(id) {
    try {
      const [rows] = await this.connection.execute(
        "SELECT * FROM estado WHERE id = ?",
        [id]
      );

      return rows[0];
    }
    catch (error) {
      throw new Error(`Error al obtener estado: ${error.message}`);
    }
  }

  async create({
    nombre,
    color,
    fecha_registro,
    fecha_actualizacion
  }) {
    try {
      const [result] = await this.connection.execute(
        "INSERT INTO estado (nombre, color, fecha_registro, fecha_actualizacion) VALUES (?, ?, ?, ?)",
        [nombre, color, fecha_registro, fecha_actualizacion]
      );

      return result.insertId;
    }
    catch (error) {
      throw new Error(`Error al crear estado: ${error.message}`);
    }
  }

  async update(id, {
    nombre,
    color,
    fecha_actualizacion
  }) {
    try {
      const [result] = await this.connection.execute(
        "UPDATE estado SET nombre = ?, color = ?, fecha_actualizacion = ? WHERE id = ?",
        [nombre, color, fecha_actualizacion, id]
      );

      return result.affectedRows > 0;
    }
    catch (error) {
      throw new Error(`Error al actualizar estado: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const [result] = await this.connection.execute(
        "DELETE FROM estado WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar estado: ${error.message}`);
    }
  }
}

module.exports = TblEstadoModel;
