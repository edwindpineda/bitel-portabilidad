const EmpresaModel = require("../models/empresa.model.js");
const UsuarioModel = require("../models/usuario.model.js");
const logger = require('../config/logger/loggerClient.js');

class AdminController {
  // ==================== EMPRESAS ====================
  async getEmpresas(req, res) {
    try {
      const empresaModel = new EmpresaModel();
      const empresas = await empresaModel.getAll();
      return res.status(200).json({ data: empresas });
    } catch (error) {
      logger.error(`[admin.controller.js] Error al obtener empresas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener empresas" });
    }
  }

  async getEmpresaById(req, res) {
    try {
      const { id } = req.params;
      const empresaModel = new EmpresaModel();
      const empresa = await empresaModel.getById(id);
      if (!empresa) {
        return res.status(404).json({ msg: "Empresa no encontrada" });
      }
      return res.status(200).json({ data: empresa });
    } catch (error) {
      logger.error(`[admin.controller.js] Error al obtener empresa: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener empresa" });
    }
  }

  async createEmpresa(req, res) {
    try {
      const empresaModel = new EmpresaModel();
      const id = await empresaModel.create(req.body);
      return res.status(201).json({ msg: "Empresa creada exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[admin.controller.js] Error al crear empresa: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear empresa" });
    }
  }

  async updateEmpresa(req, res) {
    try {
      const { id } = req.params;
      const empresaModel = new EmpresaModel();
      await empresaModel.update(id, req.body);
      return res.status(200).json({ msg: "Empresa actualizada exitosamente" });
    } catch (error) {
      logger.error(`[admin.controller.js] Error al actualizar empresa: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar empresa" });
    }
  }

  async updateEmpresaEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const empresaModel = new EmpresaModel();
      await empresaModel.updateEstado(id, estado);
      return res.status(200).json({ msg: "Estado de empresa actualizado exitosamente" });
    } catch (error) {
      logger.error(`[admin.controller.js] Error al actualizar estado de empresa: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar estado de empresa" });
    }
  }

  // ==================== USUARIOS ====================
  async getUsuarios(req, res) {
    try {
      const usuarios = await UsuarioModel.getAll();
      return res.status(200).json({ data: usuarios });
    } catch (error) {
      logger.error(`[admin.controller.js] Error al obtener usuarios: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener usuarios" });
    }
  }

  async getUsuarioById(req, res) {
    try {
      const { id } = req.params;
      const usuario = await UsuarioModel.getById(id);
      if (!usuario) {
        return res.status(404).json({ msg: "Usuario no encontrado" });
      }
      return res.status(200).json({ data: usuario });
    } catch (error) {
      logger.error(`[admin.controller.js] Error al obtener usuario: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener usuario" });
    }
  }

  async createUsuario(req, res) {
    try {
      const id = await UsuarioModel.create(req.body);
      return res.status(201).json({ msg: "Usuario creado exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[admin.controller.js] Error al crear usuario: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear usuario" });
    }
  }

  async updateUsuario(req, res) {
    try {
      const { id } = req.params;
      await UsuarioModel.update(id, req.body);
      return res.status(200).json({ msg: "Usuario actualizado exitosamente" });
    } catch (error) {
      logger.error(`[admin.controller.js] Error al actualizar usuario: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar usuario" });
    }
  }

  async deleteUsuario(req, res) {
    try {
      const { id } = req.params;
      await UsuarioModel.delete(id);
      return res.status(200).json({ msg: "Usuario eliminado exitosamente" });
    } catch (error) {
      logger.error(`[admin.controller.js] Error al eliminar usuario: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar usuario" });
    }
  }
}

module.exports = new AdminController();
