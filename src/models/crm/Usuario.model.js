const connectDB = require('../../config/dbConnection');

class UsuarioModel {

  /**
   * Buscar usuario por username
   */
  async findByUsername(username) {
    try {
      const connection = await connectDB.getConnection();
      const [rows] = await connection.query(
        `SELECT u.*, r.nombre as rol_nombre
         FROM usuario u
         LEFT JOIN rol r ON u.id_rol = r.id
         WHERE u.username = ? AND u.estado_registro = 'activo'`,
        [username]
      );
      connection.release();
      return rows[0] || null;
    } catch (error) {
      throw new Error(`[UsuarioModel.findByUsername] ${error.message}`);
    }
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email) {
    try {
      const connection = await connectDB.getConnection();
      const [rows] = await connection.query(
        `SELECT u.*, r.nombre as rol_nombre
         FROM usuario u
         LEFT JOIN rol r ON u.id_rol = r.id
         WHERE u.email = ? AND u.estado_registro = 'activo'`,
        [email]
      );
      connection.release();
      return rows[0] || null;
    } catch (error) {
      throw new Error(`[UsuarioModel.findByEmail] ${error.message}`);
    }
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id) {
    try {
      const connection = await connectDB.getConnection();
      const [rows] = await connection.query(
        `SELECT u.*, r.nombre as rol_nombre
         FROM usuario u
         LEFT JOIN rol r ON u.id_rol = r.id
         WHERE u.id = ? AND u.estado_registro = 'activo'`,
        [id]
      );
      connection.release();
      return rows[0] || null;
    } catch (error) {
      throw new Error(`[UsuarioModel.findById] ${error.message}`);
    }
  }

  /**
   * Crear nuevo usuario
   */
  async create({ username, email, password, id_rol = 3 }) {
    try {
      const connection = await connectDB.getConnection();
      const [result] = await connection.query(
        `INSERT INTO usuario (username, email, password, id_rol, estado_registro, fecha_registro, usuario_registro)
         VALUES (?, ?, ?, ?, 'activo', NOW(), 'sistema')`,
        [username, email, password, id_rol]
      );
      connection.release();
      return result.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('username')) {
          throw new Error('El nombre de usuario ya existe');
        }
        if (error.message.includes('email')) {
          throw new Error('El email ya está registrado');
        }
      }
      throw new Error(`[UsuarioModel.create] ${error.message}`);
    }
  }

  /**
   * Actualizar token de reset de contraseña
   */
  async updateResetToken(userId, resetToken, expiration) {
    try {
      const connection = await connectDB.getConnection();
      await connection.query(
        `UPDATE usuario
         SET reset_token = ?, reset_expiracion = ?, fecha_actualizacion = NOW()
         WHERE id = ?`,
        [resetToken, expiration, userId]
      );
      connection.release();
      return true;
    } catch (error) {
      throw new Error(`[UsuarioModel.updateResetToken] ${error.message}`);
    }
  }

  /**
   * Limpiar token de reset
   */
  async clearResetToken(userId) {
    try {
      const connection = await connectDB.getConnection();
      await connection.query(
        `UPDATE usuario
         SET reset_token = NULL, reset_expiracion = NULL, fecha_actualizacion = NOW()
         WHERE id = ?`,
        [userId]
      );
      connection.release();
      return true;
    } catch (error) {
      throw new Error(`[UsuarioModel.clearResetToken] ${error.message}`);
    }
  }

  /**
   * Actualizar contraseña
   */
  async updatePassword(userId, newPassword) {
    try {
      const connection = await connectDB.getConnection();
      await connection.query(
        `UPDATE usuario
         SET password = ?, fecha_actualizacion = NOW()
         WHERE id = ?`,
        [newPassword, userId]
      );
      connection.release();
      return true;
    } catch (error) {
      throw new Error(`[UsuarioModel.updatePassword] ${error.message}`);
    }
  }

  /**
   * Obtener permisos del usuario (módulos)
   */
  async getPermissions(userId) {
    try {
      const connection = await connectDB.getConnection();
      const [rows] = await connection.query(
        `SELECT m.*
         FROM modulo m
         INNER JOIN rol_modulo rm ON m.id = rm.modulo_id
         INNER JOIN usuario u ON u.id_rol = rm.rol_id
         WHERE u.id = ? AND m.estado_registro = 'activo' AND rm.estado_registro = 'activo'`,
        [userId]
      );
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(`[UsuarioModel.getPermissions] ${error.message}`);
    }
  }
}

module.exports = new UsuarioModel();
