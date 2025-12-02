const { pool } = require("../config/dbConnection.js");

class TblUsuarioModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getById(id) {
    try {
      const [rows] = await this.connection.execute(
        "SELECT * FROM usuario WHERE id = ?",
        [id]
      );

      return rows[0];
    }
    catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  async getByUserAndPass(username, password) {
    try {
      const [rows] = await this.connection.execute(
        "SELECT * FROM usuario WHERE username = ? AND password = ?",
        [username, password]
      );

      return rows[0];
    }
    catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  async create({
    id_rol,
    username,
    wa_id,
    password,
    reset_token,
    reset_expiracion,
    fecha_registro,
    usuario_registro,
    fecha_actualizacion,
    usuario_actualizacion,
    estado_registro
  }) {
    try {
      const [result] = await this.connection.execute(
        "INSERT INTO usuario VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id_rol, username, wa_id, password, reset_token, reset_expiracion, fecha_registro, usuario_registro, fecha_actualizacion, usuario_actualizacion, estado_registro]
      );

      return result.insertId;
    }
    catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  async update(id, {
    id_rol,
    username,
    wa_id,
    password,
    reset_token,
    reset_expiracion,
    fecha_registro,
    usuario_registro,
    fecha_actualizacion,
    usuario_actualizacion,
    estado_registro
  }) {
    try {
      const [result] = await this.connection.execute(
        "UPDATE usuario SET id_rol = ?, username = ?, wa_id = ?, password = ?, reset_token = ?, reset_expiracion = ?, fecha_registro = ?, usuario_registro = ?, fecha_actualizacion = ?, usuario_actualizacion = ?, estado_registro = ? WHERE id = ?",
        [id_rol, username, wa_id, password, reset_token, reset_expiracion, fecha_registro, usuario_registro, fecha_actualizacion, usuario_actualizacion, estado_registro, id]
      );

      return result.affectedRows > 0;
    }
    catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  async delete(id) {
        try {
            const [result] = await this.connection.execute(
                'DELETE FROM usuario WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar usuario: ${error.message}`);
        }
    }
}

module.exports = TblUsuarioModel;