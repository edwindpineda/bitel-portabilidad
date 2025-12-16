const UsuarioModel = require("../../models/tblUsuario.model.js");
const ModuloModel = require("../../models/modulo.model.js");
const logger = require('../../config/logger/loggerClient.js');
const JWTService = require('../../services/crm/jwt.service');

class UsuarioController {

  async loginUsuario(req, res) {
    try {
      const { username, password } = req.body;

      const usuarioModel = new UsuarioModel();
      const usuario = await usuarioModel.getByUserAndPass(username, password);

      if (usuario) {

        const token = JWTService.generate({
          userId: usuario.id,
          username: usuario.username,
          rolId: usuario.id_rol,
          rolNombre: usuario.rol_nombre
        });

        // Obtener módulos del rol del usuario
        const moduloModel = new ModuloModel();
        const modulos = await moduloModel.getByRolId(usuario.id_rol);

        usuario.password = "";

        return res.status(200).json({ user: usuario, token, modulos });
      }
      else {
        return res.status(404).json({ msg: "El usuario o contraseña no coincide. Por favor vuelva a intentar" });
      }
    }
    catch (error) {
      logger.error(`[usuario.controller.js] Error al procesar usuario: ${error.message}`);
      return res.status(500).json({ msg: "Error al verificar usuario" });
    }
  }
}

module.exports = new UsuarioController();