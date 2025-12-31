const EmpresaModel = require("../models/empresa.model.js");
const TblUsuarioModel = require("../models/tblUsuario.model.js");
const logger = require('../config/logger/loggerClient.js');

class AdminController {

  // ============ EMPRESAS ============

  async getEmpresas(req, res) {
    try {
      const empresaModel = new EmpresaModel();
      const empresas = await empresaModel.getAll();
      return res.success(200, 'Empresas obtenidas', empresas);
    } catch (error) {
      logger.error(`[admin.controller] Error al obtener empresas: ${error.message}`);
      return res.serverError(500, 'Error al obtener empresas');
    }
  }

  async getEmpresaById(req, res) {
    try {
      const { id } = req.params;
      const empresaModel = new EmpresaModel();
      const empresa = await empresaModel.getById(id);

      if (!empresa) {
        return res.clientError(404, 'Empresa no encontrada');
      }

      return res.success(200, 'Empresa obtenida', empresa);
    } catch (error) {
      logger.error(`[admin.controller] Error al obtener empresa: ${error.message}`);
      return res.serverError(500, 'Error al obtener empresa');
    }
  }

  async createEmpresa(req, res) {
    try {
      const { nombre, ruc, direccion, telefono, email } = req.body;

      if (!nombre) {
        return res.clientError(400, 'El nombre es requerido');
      }

      const empresaModel = new EmpresaModel();
      const id = await empresaModel.create({ nombre, ruc, direccion, telefono, email });

      return res.success(201, 'Empresa creada correctamente', { id });
    } catch (error) {
      logger.error(`[admin.controller] Error al crear empresa: ${error.message}`);
      return res.serverError(500, 'Error al crear empresa');
    }
  }

  async updateEmpresa(req, res) {
    try {
      const { id } = req.params;
      const { nombre, ruc, direccion, telefono, email } = req.body;

      if (!nombre) {
        return res.clientError(400, 'El nombre es requerido');
      }

      const empresaModel = new EmpresaModel();
      const updated = await empresaModel.update(id, { nombre, ruc, direccion, telefono, email });

      if (!updated) {
        return res.clientError(404, 'Empresa no encontrada');
      }

      return res.success(200, 'Empresa actualizada correctamente');
    } catch (error) {
      logger.error(`[admin.controller] Error al actualizar empresa: ${error.message}`);
      return res.serverError(500, 'Error al actualizar empresa');
    }
  }

  async deleteEmpresa(req, res) {
    try {
      const { id } = req.params;

      const empresaModel = new EmpresaModel();
      const deleted = await empresaModel.delete(id);

      if (!deleted) {
        return res.clientError(404, 'Empresa no encontrada');
      }

      return res.success(200, 'Empresa eliminada correctamente');
    } catch (error) {
      logger.error(`[admin.controller] Error al eliminar empresa: ${error.message}`);
      return res.serverError(500, 'Error al eliminar empresa');
    }
  }

  async updateEstadoEmpresa(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (estado === undefined || (estado !== 0 && estado !== 1)) {
        return res.clientError(400, 'Estado invalido');
      }

      const empresaModel = new EmpresaModel();
      const updated = await empresaModel.updateEstado(id, estado);

      if (!updated) {
        return res.clientError(404, 'Empresa no encontrada');
      }

      return res.success(200, estado === 1 ? 'Empresa activada correctamente' : 'Empresa desactivada correctamente');
    } catch (error) {
      logger.error(`[admin.controller] Error al actualizar estado de empresa: ${error.message}`);
      return res.serverError(500, 'Error al actualizar estado de empresa');
    }
  }

  // ============ USUARIOS ============

  async getUsuarios(req, res) {
    try {
      const usuarioModel = new TblUsuarioModel();
      const usuarios = await usuarioModel.getAdministradores();
      return res.success(200, 'Usuarios obtenidos', usuarios);
    } catch (error) {
      logger.error(`[admin.controller] Error al obtener usuarios: ${error.message}`);
      return res.serverError(500, 'Error al obtener usuarios');
    }
  }

  async createUsuario(req, res) {
    try {
      const { username, password, id_empresa } = req.body;

      if (!username || !password) {
        return res.clientError(400, 'Username y password son requeridos');
      }

      const usuarioModel = new TblUsuarioModel();

      // Verificar si el username ya existe
      const exists = await usuarioModel.existsUsername(username);
      if (exists) {
        return res.clientError(400, 'El username ya existe');
      }

      // Crear usuario con id_rol = 1 (Administrador)
      const id = await usuarioModel.create({
        id_rol: 1,
        username,
        password,
        id_sucursal: null,
        id_padre: null,
        id_empresa: id_empresa || null
      });

      return res.success(201, 'Usuario creado correctamente', { id });
    } catch (error) {
      logger.error(`[admin.controller] Error al crear usuario: ${error.message}`);
      return res.serverError(500, 'Error al crear usuario');
    }
  }

  async updateUsuario(req, res) {
    try {
      const { id } = req.params;
      const { username, password, id_empresa } = req.body;

      if (!username) {
        return res.clientError(400, 'Username es requerido');
      }

      const usuarioModel = new TblUsuarioModel();

      // Verificar que el usuario existe
      const usuario = await usuarioModel.getById(id);
      if (!usuario) {
        return res.clientError(404, 'Usuario no encontrado');
      }

      // Verificar si el username ya existe (excluyendo el usuario actual)
      const exists = await usuarioModel.existsUsername(username, id);
      if (exists) {
        return res.clientError(400, 'El username ya existe');
      }

      // Actualizar usuario
      await usuarioModel.update(id, {
        id_rol: 1,
        username,
        password: password || null,
        id_sucursal: null,
        id_padre: null,
        id_empresa: id_empresa || null
      });

      return res.success(200, 'Usuario actualizado correctamente');
    } catch (error) {
      logger.error(`[admin.controller] Error al actualizar usuario: ${error.message}`);
      return res.serverError(500, 'Error al actualizar usuario');
    }
  }

  async deleteUsuario(req, res) {
    try {
      const { id } = req.params;

      const usuarioModel = new TblUsuarioModel();
      const deleted = await usuarioModel.delete(id);

      if (!deleted) {
        return res.clientError(404, 'Usuario no encontrado');
      }

      return res.success(200, 'Usuario eliminado correctamente');
    } catch (error) {
      logger.error(`[admin.controller] Error al eliminar usuario: ${error.message}`);
      return res.serverError(500, 'Error al eliminar usuario');
    }
  }

  async asignarEmpresaUsuario(req, res) {
    try {
      const { id } = req.params;
      const { id_empresa } = req.body;

      const usuarioModel = new TblUsuarioModel();

      // Verificar que el usuario existe
      const usuario = await usuarioModel.getById(id);
      if (!usuario) {
        return res.clientError(404, 'Usuario no encontrado');
      }

      // Actualizar la empresa del usuario
      const [result] = await usuarioModel.connection.execute(
        `UPDATE usuario SET id_empresa = ?, fecha_actualizacion = NOW() WHERE id = ?`,
        [id_empresa, id]
      );

      if (result.affectedRows === 0) {
        return res.clientError(404, 'No se pudo actualizar el usuario');
      }

      return res.success(200, 'Empresa asignada al usuario correctamente');
    } catch (error) {
      logger.error(`[admin.controller] Error al asignar empresa: ${error.message}`);
      return res.serverError(500, 'Error al asignar empresa al usuario');
    }
  }

  // ============ ESTADISTICAS ============

  async getStats(req, res) {
    try {
      const empresaModel = new EmpresaModel();
      const usuarioModel = new TblUsuarioModel();

      const totalEmpresas = await empresaModel.getCount();
      const usuarios = await usuarioModel.getAll();
      const totalUsuarios = usuarios.length;

      return res.success(200, 'Estadisticas obtenidas', {
        totalEmpresas,
        totalUsuarios,
        empresasActivas: totalEmpresas
      });
    } catch (error) {
      logger.error(`[admin.controller] Error al obtener stats: ${error.message}`);
      return res.serverError(500, 'Error al obtener estadisticas');
    }
  }
}

module.exports = new AdminController();
