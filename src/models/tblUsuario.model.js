const { pool } = require("../config/dbConnection.js");

class TblUsuarioModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll() {
    try {
      const [rows] = await this.connection.execute(
        `SELECT u.id, u.username, u.id_rol, u.id_sucursal, u.id_padre, u.estado_registro, u.fecha_registro,
                r.nombre as rol_nombre,
                s.nombre as sucursal_nombre,
                p.username as padre_username
         FROM usuario u
         LEFT JOIN rol r ON u.id_rol = r.id
         LEFT JOIN sucursal s ON u.id_sucursal = s.id
         LEFT JOIN usuario p ON u.id_padre = p.id
         WHERE u.estado_registro = 1
         ORDER BY u.username`
      );
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  async getByRol(idRol) {
    try {
      const [rows] = await this.connection.execute(
        `SELECT u.id, u.username, u.id_padre, u.id_sucursal,
                s.nombre as sucursal_nombre,
                p.username as padre_username
         FROM usuario u
         LEFT JOIN sucursal s ON u.id_sucursal = s.id
         LEFT JOIN usuario p ON u.id_padre = p.id
         WHERE u.id_rol = ? AND u.estado_registro = 1
         ORDER BY u.id`,
        [idRol]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener usuarios por rol: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const [rows] = await this.connection.execute(
        `SELECT u.*, r.nombre as rol_nombre
         FROM usuario u
         LEFT JOIN rol r ON u.id_rol = r.id
         WHERE u.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  async getByUserAndPass(username, password) {
    try {
      const [rows] = await this.connection.execute(
        `SELECT u.*, r.nombre as rol_nombre
         FROM usuario u
         INNER JOIN rol r ON u.id_rol = r.id
         WHERE u.username = ? AND u.password = ? AND u.estado_registro = 1`,
        [username, password]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  async create({ id_rol, username, password, id_sucursal, id_padre }) {
    try {
      const [result] = await this.connection.execute(
        `INSERT INTO usuario (id_rol, username, password, id_sucursal, id_padre, estado_registro, fecha_registro, usuario_registro, fecha_actualizacion, usuario_actualizacion)
         VALUES (?, ?, ?, ?, ?, 1, NOW(), 'admin', NOW(), 'admin')`,
        [id_rol, username, password, id_sucursal || null, id_padre || null]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  async update(id, { id_rol, username, password, id_sucursal, id_padre }) {
    try {
      let query = `UPDATE usuario SET id_rol = ?, username = ?, id_sucursal = ?, id_padre = ?, fecha_actualizacion = NOW()`;
      let params = [id_rol, username, id_sucursal || null, id_padre || null];

      if (password) {
        query += `, password = ?`;
        params.push(password);
      }

      query += ` WHERE id = ?`;
      params.push(id);

      const [result] = await this.connection.execute(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const [result] = await this.connection.execute(
        'UPDATE usuario SET estado_registro = 0 WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }

  async existsUsername(username, excludeId = null) {
    try {
      let query = "SELECT id FROM usuario WHERE username = ? AND estado_registro = 1";
      let params = [username];

      if (excludeId) {
        query += " AND id != ?";
        params.push(excludeId);
      }

      const [rows] = await this.connection.execute(query, params);
      return rows.length > 0;
    } catch (error) {
      throw new Error(`Error al verificar username: ${error.message}`);
    }
  }

  async verifyPassword(id, password) {
    try {
      const [rows] = await this.connection.execute(
        `SELECT id FROM usuario WHERE id = ? AND password = ? AND estado_registro = 1`,
        [id, password]
      );
      return rows.length > 0;
    } catch (error) {
      throw new Error(`Error al verificar contraseña: ${error.message}`);
    }
  }

  async updatePassword(id, newPassword) {
    try {
      const [result] = await this.connection.execute(
        `UPDATE usuario SET password = ?, fecha_actualizacion = NOW() WHERE id = ?`,
        [newPassword, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al actualizar contraseña: ${error.message}`);
    }
  }
}

module.exports = TblUsuarioModel;