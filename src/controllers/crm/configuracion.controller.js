const RolModel = require("../../models/rol.model.js");
const UsuarioModel = require("../../models/tblUsuario.model.js");
const ModuloModel = require("../../models/modulo.model.js");
const SucursalModel = require("../../models/sucursal.model.js");
const ProveedorModel = require("../../models/proveedor.model.js");
const PlanesTarifariosModel = require("../../models/planesTarifarios.model.js");
const FaqPortabilidadModel = require("../../models/tblFaqPortabilidad.model.js");
const TipificacionModel = require("../../models/tipificacion.model.js");
const EstadoModel = require("../../models/estado.model.js");
const PreguntaPerfilamientoModel = require("../../models/preguntaPerfilamiento.model.js");
const ArgumentoVentaModel = require("../../models/argumentoVenta.model.js");
const PeriodicidadRecordatorioModel = require("../../models/periodicidadRecordatorio.model.js");
const logger = require('../../config/logger/loggerClient.js');

class ConfiguracionController {
  // ==================== ROLES ====================
  async getRoles(req, res) {
    try {
      const rolModel = new RolModel();
      const roles = await rolModel.getAll();
      return res.status(200).json({ data: roles });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener roles: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener roles" });
    }
  }

  async getRolById(req, res) {
    try {
      const { id } = req.params;
      const rolModel = new RolModel();
      const rol = await rolModel.getById(id);

      if (!rol) {
        return res.status(404).json({ msg: "Rol no encontrado" });
      }

      // Get modules associated with this role
      const modulos = await rolModel.getModulosByRolId(id);
      rol.modulos = modulos;

      return res.status(200).json({ data: rol });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener rol: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener rol" });
    }
  }

  async createRol(req, res) {
    try {
      const { nombre, descripcion, modulos } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const rolModel = new RolModel();
      const id = await rolModel.create({ nombre, descripcion });

      // Save modules for this role
      if (modulos && modulos.length > 0) {
        await rolModel.syncModulos(id, modulos);
      }

      return res.status(201).json({ msg: "Rol creado exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear rol: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear rol" });
    }
  }

  async updateRol(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, modulos } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const rolModel = new RolModel();
      await rolModel.update(id, { nombre, descripcion });

      // Sync modules for this role
      await rolModel.syncModulos(id, modulos || []);

      return res.status(200).json({ msg: "Rol actualizado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar rol: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar rol" });
    }
  }

  async deleteRol(req, res) {
    try {
      const { id } = req.params;
      const rolModel = new RolModel();
      await rolModel.delete(id);
      return res.status(200).json({ msg: "Rol eliminado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar rol: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar rol" });
    }
  }

  // ==================== USUARIOS ====================
  async getUsuarios(req, res) {
    try {
      const usuarioModel = new UsuarioModel();
      const usuarios = await usuarioModel.getAll();
      return res.status(200).json({ data: usuarios });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener usuarios: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener usuarios" });
    }
  }

  async getUsuarioById(req, res) {
    try {
      const { id } = req.params;
      const usuarioModel = new UsuarioModel();
      const usuario = await usuarioModel.getById(id);

      if (!usuario) {
        return res.status(404).json({ msg: "Usuario no encontrado" });
      }

      delete usuario.password;
      return res.status(200).json({ data: usuario });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener usuario: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener usuario" });
    }
  }

  async createUsuario(req, res) {
    try {
      const { id_rol, username, password, id_sucursal, id_padre } = req.body;

      if (!username || !password || !id_rol) {
        return res.status(400).json({ msg: "Username, password y rol son requeridos" });
      }

      const usuarioModel = new UsuarioModel();

      const exists = await usuarioModel.existsUsername(username);
      if (exists) {
        return res.status(400).json({ msg: "El username ya existe" });
      }

      const id = await usuarioModel.create({
        id_rol,
        username,
        password,
        id_sucursal,
        id_padre
      });

      return res.status(201).json({ msg: "Usuario creado exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear usuario: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear usuario" });
    }
  }

  async updateUsuario(req, res) {
    try {
      const { id } = req.params;
      const { id_rol, username, password, id_sucursal, id_padre } = req.body;

      if (!username || !id_rol) {
        return res.status(400).json({ msg: "Username y rol son requeridos" });
      }

      const usuarioModel = new UsuarioModel();

      const exists = await usuarioModel.existsUsername(username, id);
      if (exists) {
        return res.status(400).json({ msg: "El username ya existe" });
      }

      await usuarioModel.update(id, {
        id_rol,
        username,
        password,
        id_sucursal,
        id_padre
      });

      return res.status(200).json({ msg: "Usuario actualizado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar usuario: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar usuario" });
    }
  }

  async deleteUsuario(req, res) {
    try {
      const { id } = req.params;
      const usuarioModel = new UsuarioModel();
      await usuarioModel.delete(id);
      return res.status(200).json({ msg: "Usuario eliminado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar usuario: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar usuario" });
    }
  }

  async getUsuariosByRol(req, res) {
    try {
      const { idRol } = req.params;
      const usuarioModel = new UsuarioModel();
      const usuarios = await usuarioModel.getByRol(idRol);
      return res.status(200).json({ data: usuarios });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener usuarios por rol: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener usuarios por rol" });
    }
  }

  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: "La contraseña actual y nueva son requeridas" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ msg: "La nueva contraseña debe tener al menos 6 caracteres" });
      }

      const usuarioModel = new UsuarioModel();

      // Verificar contraseña actual
      const isValid = await usuarioModel.verifyPassword(id, currentPassword);
      if (!isValid) {
        return res.status(400).json({ msg: "La contraseña actual es incorrecta" });
      }

      // Actualizar contraseña
      await usuarioModel.updatePassword(id, newPassword);

      return res.status(200).json({ msg: "Contraseña actualizada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al cambiar contraseña: ${error.message}`);
      return res.status(500).json({ msg: "Error al cambiar la contraseña" });
    }
  }

  // ==================== MÓDULOS ====================
  async getModulos(req, res) {
    try {
      const moduloModel = new ModuloModel();
      const modulos = await moduloModel.getAll();
      return res.status(200).json({ data: modulos });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener módulos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener módulos" });
    }
  }

  async getModuloById(req, res) {
    try {
      const { id } = req.params;
      const moduloModel = new ModuloModel();
      const modulo = await moduloModel.getById(id);

      if (!modulo) {
        return res.status(404).json({ msg: "Módulo no encontrado" });
      }

      return res.status(200).json({ data: modulo });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener módulo: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener módulo" });
    }
  }

  async createModulo(req, res) {
    try {
      const { nombre, ruta } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const moduloModel = new ModuloModel();
      const id = await moduloModel.create({ nombre, ruta });

      return res.status(201).json({ msg: "Módulo creado exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear módulo: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear módulo" });
    }
  }

  async updateModulo(req, res) {
    try {
      const { id } = req.params;
      const { nombre, ruta } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const moduloModel = new ModuloModel();
      await moduloModel.update(id, { nombre, ruta });

      return res.status(200).json({ msg: "Módulo actualizado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar módulo: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar módulo" });
    }
  }

  async deleteModulo(req, res) {
    try {
      const { id } = req.params;
      const moduloModel = new ModuloModel();
      await moduloModel.delete(id);
      return res.status(200).json({ msg: "Módulo eliminado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar módulo: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar módulo" });
    }
  }

  // ==================== SUCURSALES ====================
  async getSucursales(req, res) {
    try {
      const sucursalModel = new SucursalModel();
      const sucursales = await sucursalModel.getAll();
      return res.status(200).json({ data: sucursales });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener sucursales: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener sucursales" });
    }
  }

  async getSucursalById(req, res) {
    try {
      const { id } = req.params;
      const sucursalModel = new SucursalModel();
      const sucursal = await sucursalModel.getById(id);

      if (!sucursal) {
        return res.status(404).json({ msg: "Sucursal no encontrada" });
      }

      return res.status(200).json({ data: sucursal });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener sucursal: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener sucursal" });
    }
  }

  async createSucursal(req, res) {
    try {
      const { nombre, direccion, telefono, email } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const sucursalModel = new SucursalModel();
      const id = await sucursalModel.create({ nombre, direccion, telefono, email });

      return res.status(201).json({ msg: "Sucursal creada exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear sucursal: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear sucursal" });
    }
  }

  async updateSucursal(req, res) {
    try {
      const { id } = req.params;
      const { nombre, direccion, telefono, email } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const sucursalModel = new SucursalModel();
      await sucursalModel.update(id, { nombre, direccion, telefono, email });

      return res.status(200).json({ msg: "Sucursal actualizada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar sucursal: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar sucursal" });
    }
  }

  async deleteSucursal(req, res) {
    try {
      const { id } = req.params;
      const sucursalModel = new SucursalModel();
      await sucursalModel.delete(id);
      return res.status(200).json({ msg: "Sucursal eliminada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar sucursal: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar sucursal" });
    }
  }

  // ==================== PROVEEDORES ====================
  async getProveedores(req, res) {
    try {
      const proveedorModel = new ProveedorModel();
      const proveedores = await proveedorModel.getAll();
      return res.status(200).json({ data: proveedores });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener proveedores: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener proveedores" });
    }
  }

  async getProveedorById(req, res) {
    try {
      const { id } = req.params;
      const proveedorModel = new ProveedorModel();
      const proveedor = await proveedorModel.getById(id);

      if (!proveedor) {
        return res.status(404).json({ msg: "Proveedor no encontrado" });
      }

      return res.status(200).json({ data: proveedor });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener proveedor: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener proveedor" });
    }
  }

  async createProveedor(req, res) {
    try {
      const { nombre } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const proveedorModel = new ProveedorModel();
      const id = await proveedorModel.create({ nombre });

      return res.status(201).json({ msg: "Proveedor creado exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear proveedor: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear proveedor" });
    }
  }

  async updateProveedor(req, res) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const proveedorModel = new ProveedorModel();
      await proveedorModel.update(id, { nombre });

      return res.status(200).json({ msg: "Proveedor actualizado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar proveedor: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar proveedor" });
    }
  }

  async deleteProveedor(req, res) {
    try {
      const { id } = req.params;
      const proveedorModel = new ProveedorModel();
      await proveedorModel.delete(id);
      return res.status(200).json({ msg: "Proveedor eliminado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar proveedor: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar proveedor" });
    }
  }

  // ==================== PLANES TARIFARIOS ====================
  async getPlanesTarifarios(req, res) {
    try {
      const planModel = new PlanesTarifariosModel();
      const planes = await planModel.getAll();
      return res.status(200).json({ data: planes });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener planes tarifarios: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener planes tarifarios" });
    }
  }

  async getPlanTarifarioById(req, res) {
    try {
      const { id } = req.params;
      const planModel = new PlanesTarifariosModel();
      const plan = await planModel.getById(id);

      if (!plan) {
        return res.status(404).json({ msg: "Plan tarifario no encontrado" });
      }

      return res.status(200).json({ data: plan });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener plan tarifario: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener plan tarifario" });
    }
  }

  async createPlanTarifario(req, res) {
    try {
      const { nombre, descripcion } = req.body;
      let { imagen_url } = req.body;

      // Convertir tipos de FormData (llegan como strings)
      const precio_regular = req.body.precio_regular ? parseFloat(req.body.precio_regular) : null;
      const precio_promocional = req.body.precio_promocional ? parseFloat(req.body.precio_promocional) : null;
      const principal = req.body.principal === '1' || req.body.principal === 1 ? 1 : 0;

      if (!nombre || !precio_regular) {
        return res.status(400).json({ msg: "El nombre y precio regular son requeridos" });
      }

      // Si se subió una imagen, usar la ruta del archivo
      if (req.file) {
        imagen_url = `/uploads/plan_tarifario/${req.file.filename}`;
      }

      const planModel = new PlanesTarifariosModel();
      const id = await planModel.create({ nombre, precio_regular, precio_promocional, descripcion, principal, imagen_url });

      return res.status(201).json({ msg: "Plan tarifario creado exitosamente", data: { id, imagen_url } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear plan tarifario: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear plan tarifario" });
    }
  }

  async updatePlanTarifario(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;
      let { imagen_url } = req.body;

      // Convertir tipos de FormData (llegan como strings)
      const precio_regular = req.body.precio_regular ? parseFloat(req.body.precio_regular) : null;
      const precio_promocional = req.body.precio_promocional ? parseFloat(req.body.precio_promocional) : null;
      const principal = req.body.principal === '1' || req.body.principal === 1 ? 1 : 0;

      if (!nombre || !precio_regular) {
        return res.status(400).json({ msg: "El nombre y precio regular son requeridos" });
      }

      // Si se subió una nueva imagen, usar la ruta del archivo
      if (req.file) {
        imagen_url = `/uploads/plan_tarifario/${req.file.filename}`;
      }

      const planModel = new PlanesTarifariosModel();
      await planModel.update(id, { nombre, precio_regular, precio_promocional, descripcion, principal, imagen_url });

      return res.status(200).json({ msg: "Plan tarifario actualizado exitosamente", data: { imagen_url } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar plan tarifario: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar plan tarifario" });
    }
  }

  async deletePlanTarifario(req, res) {
    try {
      const { id } = req.params;
      const planModel = new PlanesTarifariosModel();
      await planModel.delete(id);
      return res.status(200).json({ msg: "Plan tarifario eliminado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar plan tarifario: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar plan tarifario" });
    }
  }

  // ==================== PREGUNTAS FRECUENTES ====================
  async getFaqs(req, res) {
    try {
      const faqModel = new FaqPortabilidadModel();
      const faqs = await faqModel.getAll();
      return res.status(200).json({ data: faqs });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener FAQs: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener preguntas frecuentes" });
    }
  }

  async getFaqById(req, res) {
    try {
      const { id } = req.params;
      const faqModel = new FaqPortabilidadModel();
      const faq = await faqModel.getById(id);

      if (!faq) {
        return res.status(404).json({ msg: "Pregunta frecuente no encontrada" });
      }

      return res.status(200).json({ data: faq });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener FAQ: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener pregunta frecuente" });
    }
  }

  async createFaq(req, res) {
    try {
      const { numero, pregunta, proceso, respuesta, activo } = req.body;

      if (!pregunta || !respuesta || !proceso) {
        return res.status(400).json({ msg: "La pregunta, respuesta y proceso son requeridos" });
      }

      const faqModel = new FaqPortabilidadModel();
      const id = await faqModel.create({ numero, pregunta, proceso, respuesta, activo });

      return res.status(201).json({ msg: "Pregunta frecuente creada exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear FAQ: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear pregunta frecuente" });
    }
  }

  async updateFaq(req, res) {
    try {
      const { id } = req.params;
      const { numero, pregunta, proceso, respuesta, activo } = req.body;

      if (!pregunta || !respuesta || !proceso) {
        return res.status(400).json({ msg: "La pregunta, respuesta y proceso son requeridos" });
      }

      const faqModel = new FaqPortabilidadModel();
      await faqModel.update(id, { numero, pregunta, proceso, respuesta, activo });

      return res.status(200).json({ msg: "Pregunta frecuente actualizada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar FAQ: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar pregunta frecuente" });
    }
  }

  async deleteFaq(req, res) {
    try {
      const { id } = req.params;
      const faqModel = new FaqPortabilidadModel();
      await faqModel.delete(id);
      return res.status(200).json({ msg: "Pregunta frecuente eliminada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar FAQ: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar pregunta frecuente" });
    }
  }

  // ==================== TIPIFICACIONES ====================
  async getTipificaciones(req, res) {
    try {
      const tipificacionModel = new TipificacionModel();
      const tipificaciones = await tipificacionModel.getAll();
      return res.status(200).json({ data: tipificaciones });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener tipificaciones: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tipificaciones" });
    }
  }

  async getTipificacionById(req, res) {
    try {
      const { id } = req.params;
      const tipificacionModel = new TipificacionModel();
      const tipificacion = await tipificacionModel.getById(id);

      if (!tipificacion) {
        return res.status(404).json({ msg: "Tipificación no encontrada" });
      }

      return res.status(200).json({ data: tipificacion });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener tipificación: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tipificación" });
    }
  }

  async createTipificacion(req, res) {
    try {
      const { nombre, definicion, orden, color } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const tipificacionModel = new TipificacionModel();
      const id = await tipificacionModel.create({ nombre, definicion, orden, color });

      return res.status(201).json({ msg: "Tipificación creada exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear tipificación: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear tipificación" });
    }
  }

  async updateTipificacion(req, res) {
    try {
      const { id } = req.params;
      const { nombre, definicion, orden, color } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const tipificacionModel = new TipificacionModel();
      await tipificacionModel.update(id, { nombre, definicion, orden, color });

      return res.status(200).json({ msg: "Tipificación actualizada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar tipificación: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar tipificación" });
    }
  }

  async deleteTipificacion(req, res) {
    try {
      const { id } = req.params;
      const tipificacionModel = new TipificacionModel();
      await tipificacionModel.delete(id);
      return res.status(200).json({ msg: "Tipificación eliminada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar tipificación: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar tipificación" });
    }
  }

  // ==================== ESTADOS ====================
  async getEstados(req, res) {
    try {
      const estadoModel = new EstadoModel();
      const estados = await estadoModel.getAll();
      return res.status(200).json({ data: estados });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener estados: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estados" });
    }
  }

  async getEstadoById(req, res) {
    try {
      const { id } = req.params;
      const estadoModel = new EstadoModel();
      const estado = await estadoModel.getById(id);

      if (!estado) {
        return res.status(404).json({ msg: "Estado no encontrado" });
      }

      return res.status(200).json({ data: estado });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener estado: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estado" });
    }
  }

  async updateEstadoColor(req, res) {
    try {
      const { id } = req.params;
      const { color } = req.body;

      const estadoModel = new EstadoModel();

      const estado = await estadoModel.getById(id);
      if (!estado) {
        return res.status(404).json({ msg: "Estado no encontrado" });
      }

      await estadoModel.updateColor(id, color);

      return res.status(200).json({ msg: "Color del estado actualizado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar color del estado: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar color del estado" });
    }
  }

  // ==================== PREGUNTAS DE PERFILAMIENTO ====================
  async getPreguntasPerfilamiento(req, res) {
    try {
      const preguntaModel = new PreguntaPerfilamientoModel();
      const preguntas = await preguntaModel.getAll();
      return res.status(200).json({ data: preguntas });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener preguntas de perfilamiento: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener preguntas de perfilamiento" });
    }
  }

  async getPreguntaPerfilamientoById(req, res) {
    try {
      const { id } = req.params;
      const preguntaModel = new PreguntaPerfilamientoModel();
      const pregunta = await preguntaModel.getById(id);

      if (!pregunta) {
        return res.status(404).json({ msg: "Pregunta de perfilamiento no encontrada" });
      }

      return res.status(200).json({ data: pregunta });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener pregunta de perfilamiento: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener pregunta de perfilamiento" });
    }
  }

  async createPreguntaPerfilamiento(req, res) {
    try {
      const { pregunta, orden } = req.body;

      if (!pregunta) {
        return res.status(400).json({ msg: "La pregunta es requerida" });
      }

      const preguntaModel = new PreguntaPerfilamientoModel();
      const id = await preguntaModel.create({ pregunta, orden });

      return res.status(201).json({ msg: "Pregunta de perfilamiento creada exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear pregunta de perfilamiento: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear pregunta de perfilamiento" });
    }
  }

  async updatePreguntaPerfilamiento(req, res) {
    try {
      const { id } = req.params;
      const { pregunta, orden } = req.body;

      if (!pregunta) {
        return res.status(400).json({ msg: "La pregunta es requerida" });
      }

      const preguntaModel = new PreguntaPerfilamientoModel();
      await preguntaModel.update(id, { pregunta, orden });

      return res.status(200).json({ msg: "Pregunta de perfilamiento actualizada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar pregunta de perfilamiento: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar pregunta de perfilamiento" });
    }
  }

  async deletePreguntaPerfilamiento(req, res) {
    try {
      const { id } = req.params;
      const preguntaModel = new PreguntaPerfilamientoModel();
      await preguntaModel.delete(id);
      return res.status(200).json({ msg: "Pregunta de perfilamiento eliminada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar pregunta de perfilamiento: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar pregunta de perfilamiento" });
    }
  }

  // ==================== ARGUMENTOS DE VENTA ====================
  async getArgumentosVenta(req, res) {
    try {
      const argumentoModel = new ArgumentoVentaModel();
      const argumentos = await argumentoModel.getAll();
      return res.status(200).json({ data: argumentos });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener argumentos de venta: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener argumentos de venta" });
    }
  }

  async getArgumentoVentaById(req, res) {
    try {
      const { id } = req.params;
      const argumentoModel = new ArgumentoVentaModel();
      const argumento = await argumentoModel.getById(id);

      if (!argumento) {
        return res.status(404).json({ msg: "Argumento de venta no encontrado" });
      }

      return res.status(200).json({ data: argumento });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener argumento de venta: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener argumento de venta" });
    }
  }

  async createArgumentoVenta(req, res) {
    try {
      const { titulo, argumento } = req.body;

      if (!titulo || !argumento) {
        return res.status(400).json({ msg: "El título y argumento son requeridos" });
      }

      const argumentoModel = new ArgumentoVentaModel();
      const id = await argumentoModel.create({ titulo, argumento });

      return res.status(201).json({ msg: "Argumento de venta creado exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear argumento de venta: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear argumento de venta" });
    }
  }

  async updateArgumentoVenta(req, res) {
    try {
      const { id } = req.params;
      const { titulo, argumento } = req.body;

      if (!titulo || !argumento) {
        return res.status(400).json({ msg: "El título y argumento son requeridos" });
      }

      const argumentoModel = new ArgumentoVentaModel();
      await argumentoModel.update(id, { titulo, argumento });

      return res.status(200).json({ msg: "Argumento de venta actualizado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar argumento de venta: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar argumento de venta" });
    }
  }

  async deleteArgumentoVenta(req, res) {
    try {
      const { id } = req.params;
      const argumentoModel = new ArgumentoVentaModel();
      await argumentoModel.delete(id);
      return res.status(200).json({ msg: "Argumento de venta eliminado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar argumento de venta: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar argumento de venta" });
    }
  }

  // ==================== PERIODICIDAD DE RECORDATORIOS ====================
  async getPeriodicidadesRecordatorio(req, res) {
    try {
      const periodicidadModel = new PeriodicidadRecordatorioModel();
      const periodicidades = await periodicidadModel.getAll();
      return res.status(200).json({ data: periodicidades });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener periodicidades de recordatorio: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener periodicidades de recordatorio" });
    }
  }

  async getPeriodicidadRecordatorioById(req, res) {
    try {
      const { id } = req.params;
      const periodicidadModel = new PeriodicidadRecordatorioModel();
      const periodicidad = await periodicidadModel.getById(id);

      if (!periodicidad) {
        return res.status(404).json({ msg: "Periodicidad de recordatorio no encontrada" });
      }

      return res.status(200).json({ data: periodicidad });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener periodicidad de recordatorio: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener periodicidad de recordatorio" });
    }
  }

  async createPeriodicidadRecordatorio(req, res) {
    try {
      const { nombre, cada_horas } = req.body;

      if (!nombre || !cada_horas) {
        return res.status(400).json({ msg: "El nombre y cada_horas son requeridos" });
      }

      const periodicidadModel = new PeriodicidadRecordatorioModel();
      const id = await periodicidadModel.create({ nombre, cada_horas });

      return res.status(201).json({ msg: "Periodicidad de recordatorio creada exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear periodicidad de recordatorio: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear periodicidad de recordatorio" });
    }
  }

  async updatePeriodicidadRecordatorio(req, res) {
    try {
      const { id } = req.params;
      const { nombre, cada_horas } = req.body;

      if (!nombre || !cada_horas) {
        return res.status(400).json({ msg: "El nombre y cada_horas son requeridos" });
      }

      const periodicidadModel = new PeriodicidadRecordatorioModel();
      await periodicidadModel.update(id, { nombre, cada_horas });

      return res.status(200).json({ msg: "Periodicidad de recordatorio actualizada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar periodicidad de recordatorio: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar periodicidad de recordatorio" });
    }
  }

  async deletePeriodicidadRecordatorio(req, res) {
    try {
      const { id } = req.params;
      const periodicidadModel = new PeriodicidadRecordatorioModel();
      await periodicidadModel.delete(id);
      return res.status(200).json({ msg: "Periodicidad de recordatorio eliminada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar periodicidad de recordatorio: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar periodicidad de recordatorio" });
    }
  }
}

module.exports = new ConfiguracionController();
