const bcrypt = require('bcrypt');
const UsuarioModel = require('../../models/crm/Usuario.model');
const JWTService = require('../../services/crm/jwt.service');
const logger = require('../../config/logger/loggerClient');

class AuthController {

  /**
   * Registro de nuevo usuario
   * POST /api/crm/auth/register
   */
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Validar campos requeridos
      if (!username || !email || !password) {
        return res.clientError(400, 'Todos los campos son obligatorios');
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.clientError(400, 'Email inválido');
      }

      // Validar longitud de username
      if (username.length < 3) {
        return res.clientError(400, 'El usuario debe tener al menos 3 caracteres');
      }

      // Validar longitud de password
      if (password.length < 6) {
        return res.clientError(400, 'La contraseña debe tener al menos 6 caracteres');
      }

      // Verificar si el usuario ya existe
      const existingUser = await UsuarioModel.findByUsername(username);
      if (existingUser) {
        return res.clientError(400, 'El nombre de usuario ya está en uso');
      }

      // Verificar si el email ya existe
      const existingEmail = await UsuarioModel.findByEmail(email);
      if (existingEmail) {
        return res.clientError(400, 'El email ya está registrado');
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario (rol por defecto: 3 = Asesor)
      const userId = await UsuarioModel.create({
        username,
        email,
        password: hashedPassword,
        id_rol: 3 // Rol Asesor por defecto
      });

      logger.info(`[auth.controller] Usuario registrado: ${username} (ID: ${userId})`);

      return res.success(201, 'Usuario registrado correctamente', {
        userId,
        username,
        email
      });

    } catch (error) {
      logger.error(`[auth.controller.register] ${error.message}`);
      return res.serverError(500, error.message || 'Error al registrar usuario');
    }
  }

  /**
   * Inicio de sesión
   * POST /api/crm/auth/login
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validar campos requeridos
      if (!username || !password) {
        return res.clientError(400, 'Usuario y contraseña son obligatorios');
      }

      // Buscar usuario
      const user = await UsuarioModel.findByUsername(username);
      if (!user) {
        return res.clientError(401, 'Credenciales inválidas');
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.clientError(401, 'Credenciales inválidas');
      }

      // Generar token JWT
      const token = JWTService.generate({
        userId: user.id,
        username: user.username,
        rolId: user.id_rol,
        rolNombre: user.rol_nombre
      });

      logger.info(`[auth.controller] Usuario inició sesión: ${username}`);

      // Retornar token y datos del usuario (sin password)
      const { password: _, ...userData } = user;

      return res.success(200, 'Inicio de sesión exitoso', {
        token,
        user: userData
      });

    } catch (error) {
      logger.error(`[auth.controller.login] ${error.message}`);
      return res.serverError(500, 'Error al iniciar sesión');
    }
  }

  /**
   * Obtener datos del usuario autenticado
   * GET /api/crm/auth/me
   */
  async me(req, res) {
    try {
      // El middleware de auth ya verificó el token y agregó req.user
      const userId = req.user.userId;

      // Buscar usuario
      const user = await UsuarioModel.findById(userId);
      if (!user) {
        return res.clientError(404, 'Usuario no encontrado');
      }

      // Obtener permisos
      const permissions = await UsuarioModel.getPermissions(userId);

      // Retornar datos sin password
      const { password: _, ...userData } = user;

      return res.success(200, 'Datos del usuario obtenidos correctamente', {
        ...userData,
        permissions
      });

    } catch (error) {
      logger.error(`[auth.controller.me] ${error.message}`);
      return res.serverError(500, 'Error al obtener datos del usuario');
    }
  }

  /**
   * Solicitar reset de contraseña
   * POST /api/crm/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const { username } = req.body;

      if (!username) {
        return res.clientError(400, 'El username es obligatorio');
      }

      // Buscar usuario
      const user = await UsuarioModel.findByUsername(username);
      if (!user) {
        // Por seguridad, no revelamos si el usuario existe o no
        return res.success(200, 'Si el usuario existe, recibirá un email con instrucciones');
      }

      // Generar token de reset (válido por 1 hora)
      const resetToken = JWTService.generate({ userId: user.id });
      const expiration = new Date(Date.now() + 3600000); // 1 hora

      // Guardar token en la BD
      await UsuarioModel.updateResetToken(user.id, resetToken, expiration);

      // TODO: Enviar email con el token
      // Por ahora solo retornamos el token (en producción NUNCA hacer esto)
      logger.info(`[auth.controller] Reset password solicitado para: ${username}`);

      return res.success(200, 'Si el usuario existe, recibirá un email con instrucciones', {
        // TODO: Remover esto en producción
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });

    } catch (error) {
      logger.error(`[auth.controller.forgotPassword] ${error.message}`);
      return res.serverError(500, 'Error al procesar solicitud');
    }
  }

  /**
   * Reset de contraseña
   * POST /api/crm/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.clientError(400, 'Token y nueva contraseña son obligatorios');
      }

      if (newPassword.length < 6) {
        return res.clientError(400, 'La contraseña debe tener al menos 6 caracteres');
      }

      // Verificar token
      let decoded;
      try {
        decoded = JWTService.verify(token);
      } catch (error) {
        return res.clientError(400, 'Token inválido o expirado');
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      await UsuarioModel.updatePassword(decoded.userId, hashedPassword);

      // Limpiar token de reset
      await UsuarioModel.clearResetToken(decoded.userId);

      logger.info(`[auth.controller] Contraseña reseteada para userId: ${decoded.userId}`);

      return res.success(200, 'Contraseña actualizada correctamente');

    } catch (error) {
      logger.error(`[auth.controller.resetPassword] ${error.message}`);
      return res.serverError(500, 'Error al resetear contraseña');
    }
  }
}

module.exports = new AuthController();
