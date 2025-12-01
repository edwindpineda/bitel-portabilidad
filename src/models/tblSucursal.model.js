const { pool } = require("../config/dbConnection.js");

class TblSucursalModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getById(id) {
    try {
      const [rows] = await this.connection.execute(
        "SELECT * FROM sucursal WHERE id = ?",
        [id]
      );

      return rows[0];
    }
    catch (error) {
      throw new Error(`Error al obtener sucursal: ${error.message}`);
    }
  }

  async create({
    nombre,
    direccion,
    telefono,
    email,
    estado,
    fecha_registro,
    usuario_registro
  }) {
    try {
      const [result] = await this.connection.execute(
        "INSERT INTO sucursal (nombre, direccion, telefono, email, estado, fecha_registro, usuario_registro) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [nombre, direccion, telefono, email, estado, fecha_registro, usuario_registro]
      );

      return result.insertId;
    }
    catch (error) {
      throw new Error(`Error al crear sucursal: ${error.message}`);
    }
  }

  async update(id, {
    nombre,
    direccion,
    telefono,
    email,
    estado
  }) {
    try {
      const [result] = await this.connection.execute(
        "UPDATE sucursal SET nombre = ?, direccion = ?, telefono = ?, email = ?, estado = ? WHERE id = ?",
        [nombre, direccion, telefono, email, estado, id]
      );

      return result.affectedRows > 0;
    }
    catch (error) {
      throw new Error(`Error al actualizar sucursal: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const [result] = await this.connection.execute(
        "DELETE FROM sucursal WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar sucursal: ${error.message}`);
    }
  }
}

module.exports = TblSucursalModel;
