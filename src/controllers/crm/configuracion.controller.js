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
const FormatoModel = require("../../models/formato.model.js");
const FormatoCampoModel = require("../../models/formatoCampo.model.js");
const BaseNumeroModel = require("../../models/baseNumero.model.js");
const BaseNumeroDetalleModel = require("../../models/baseNumeroDetalle.model.js");
const PlantillaModel = require("../../models/plantilla.model.js");
const CampaniaModel = require("../../models/campania.model.js");
const CampaniaBaseNumeroModel = require("../../models/campaniaBaseNumero.model.js");
const CampaniaEjecucionModel = require("../../models/campaniaEjecucion.model.js");
const logger = require('../../config/logger/loggerClient.js');
const xlsx = require('xlsx');

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
      const { nombre, definicion, orden, color, flag_asesor, flag_bot } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const tipificacionModel = new TipificacionModel();
      const id = await tipificacionModel.create({ nombre, definicion, orden, color, flag_asesor, flag_bot });

      return res.status(201).json({ msg: "Tipificación creada exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear tipificación: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear tipificación" });
    }
  }

  async updateTipificacion(req, res) {
    try {
      const { id } = req.params;
      const { nombre, definicion, orden, color, flag_asesor, flag_bot } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const tipificacionModel = new TipificacionModel();
      await tipificacionModel.update(id, { nombre, definicion, orden, color, flag_asesor, flag_bot });

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

  // ==================== FORMATOS ====================
  async getFormatos(req, res) {
    try {
      const formatoModel = new FormatoModel();
      const formatos = await formatoModel.getAll();
      return res.status(200).json({ data: formatos });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener formatos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener formatos" });
    }
  }

  async getFormatoById(req, res) {
    try {
      const { id } = req.params;
      const formatoModel = new FormatoModel();
      const formato = await formatoModel.getByIdWithCampos(id);

      if (!formato) {
        return res.status(404).json({ msg: "Formato no encontrado" });
      }

      return res.status(200).json({ data: formato });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener formato: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener formato" });
    }
  }

  async createFormato(req, res) {
    try {
      const { nombre, descripcion } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const formatoModel = new FormatoModel();
      const id = await formatoModel.create({ id_empresa: 1, nombre, descripcion, usuario_registro });

      return res.status(201).json({ msg: "Formato creado exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear formato: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear formato" });
    }
  }

  async updateFormato(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, es_activo } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const formatoModel = new FormatoModel();
      await formatoModel.update(id, { nombre, descripcion, es_activo, usuario_actualizacion });

      return res.status(200).json({ msg: "Formato actualizado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar formato: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar formato" });
    }
  }

  async deleteFormato(req, res) {
    try {
      const { id } = req.params;
      const formatoModel = new FormatoModel();
      await formatoModel.delete(id);
      return res.status(200).json({ msg: "Formato eliminado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar formato: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar formato" });
    }
  }

  // ==================== FORMATO CAMPOS ====================
  async getCamposByFormato(req, res) {
    try {
      const { idFormato } = req.params;
      const formatoCampoModel = new FormatoCampoModel();
      const campos = await formatoCampoModel.getAllByFormato(idFormato);
      return res.status(200).json({ data: campos });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener campos del formato: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener campos del formato" });
    }
  }

  async getCampoById(req, res) {
    try {
      const { id } = req.params;
      const formatoCampoModel = new FormatoCampoModel();
      const campo = await formatoCampoModel.getById(id);

      if (!campo) {
        return res.status(404).json({ msg: "Campo no encontrado" });
      }

      return res.status(200).json({ data: campo });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener campo: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener campo" });
    }
  }

  async createCampo(req, res) {
    try {
      const { id_formato, nombre_campo, etiqueta, tipo_dato, longitud, requerido, unico, orden, placeholder, reglas_json } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_formato || !nombre_campo || !tipo_dato) {
        return res.status(400).json({ msg: "El formato, nombre del campo y tipo de dato son requeridos" });
      }

      const formatoCampoModel = new FormatoCampoModel();
      const id = await formatoCampoModel.create({
        id_formato,
        nombre_campo,
        etiqueta,
        tipo_dato,
        longitud,
        requerido,
        unico,
        orden,
        placeholder,
        reglas_json,
        usuario_registro
      });

      return res.status(201).json({ msg: "Campo creado exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear campo: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear campo" });
    }
  }

  async updateCampo(req, res) {
    try {
      const { id } = req.params;
      const { nombre_campo, etiqueta, tipo_dato, longitud, requerido, unico, orden, placeholder, reglas_json } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre_campo || !tipo_dato) {
        return res.status(400).json({ msg: "El nombre del campo y tipo de dato son requeridos" });
      }

      const formatoCampoModel = new FormatoCampoModel();
      await formatoCampoModel.update(id, {
        nombre_campo,
        etiqueta,
        tipo_dato,
        longitud,
        requerido,
        unico,
        orden,
        placeholder,
        reglas_json,
        usuario_actualizacion
      });

      return res.status(200).json({ msg: "Campo actualizado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar campo: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar campo" });
    }
  }

  async deleteCampo(req, res) {
    try {
      const { id } = req.params;
      const formatoCampoModel = new FormatoCampoModel();
      await formatoCampoModel.delete(id);
      return res.status(200).json({ msg: "Campo eliminado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar campo: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar campo" });
    }
  }

  async updateOrdenCampos(req, res) {
    try {
      const { campos } = req.body;

      if (!campos || !Array.isArray(campos)) {
        return res.status(400).json({ msg: "Se requiere un array de campos con orden" });
      }

      const formatoCampoModel = new FormatoCampoModel();
      await formatoCampoModel.updateOrden(campos);

      return res.status(200).json({ msg: "Orden de campos actualizado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar orden de campos: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar orden de campos" });
    }
  }

  // ==================== BASE DE NUMEROS ====================
  async getBasesNumeros(req, res) {
    try {
      const baseNumeroModel = new BaseNumeroModel();
      const bases = await baseNumeroModel.getAll();
      return res.status(200).json({ data: bases });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener bases de numeros: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener bases de numeros" });
    }
  }

  async getBaseNumeroById(req, res) {
    try {
      const { id } = req.params;
      const baseNumeroModel = new BaseNumeroModel();
      const base = await baseNumeroModel.getById(id);

      if (!base) {
        return res.status(404).json({ msg: "Base de numeros no encontrada" });
      }

      return res.status(200).json({ data: base });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener base de numeros: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener base de numeros" });
    }
  }

  async createBaseNumero(req, res) {
    try {
      const { id_empresa, id_formato, nombre, descripcion } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_empresa || !id_formato || !nombre) {
        return res.status(400).json({ msg: "La empresa, formato y nombre son requeridos" });
      }

      const baseNumeroModel = new BaseNumeroModel();
      const id = await baseNumeroModel.create({ id_empresa, id_formato, nombre, descripcion, usuario_registro });

      return res.status(201).json({ msg: "Base de numeros creada exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear base de numeros: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al crear base de numeros" });
    }
  }

  async updateBaseNumero(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, id_formato } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre || !id_formato) {
        return res.status(400).json({ msg: "El nombre y formato son requeridos" });
      }

      const baseNumeroModel = new BaseNumeroModel();
      await baseNumeroModel.update(id, { nombre, descripcion, id_formato, usuario_actualizacion });

      return res.status(200).json({ msg: "Base de numeros actualizada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar base de numeros: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al actualizar base de numeros" });
    }
  }

  async deleteBaseNumero(req, res) {
    try {
      const { id } = req.params;
      const baseNumeroModel = new BaseNumeroModel();
      await baseNumeroModel.delete(id);
      return res.status(200).json({ msg: "Base de numeros eliminada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar base de numeros: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar base de numeros" });
    }
  }

  // ==================== DETALLE BASE DE NUMEROS ====================
  async getDetallesByBaseNumero(req, res) {
    try {
      const { idBase } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const detalleModel = new BaseNumeroDetalleModel();
      const result = await detalleModel.getByBaseNumero(idBase, parseInt(page), parseInt(limit));

      return res.status(200).json(result);
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener detalles: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener detalles de la base" });
    }
  }

  async createDetalle(req, res) {
    try {
      const { id_base_numero, telefono, nombre, correo, tipo_documento, numero_documento, json_adicional } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_base_numero || !telefono) {
        return res.status(400).json({ msg: "La base y telefono son requeridos" });
      }

      const detalleModel = new BaseNumeroDetalleModel();
      const id = await detalleModel.create({
        id_base_numero,
        telefono,
        nombre,
        correo,
        tipo_documento,
        numero_documento,
        json_adicional,
        usuario_registro
      });

      return res.status(201).json({ msg: "Registro agregado exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear detalle: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al agregar registro" });
    }
  }

  async deleteDetalle(req, res) {
    try {
      const { id } = req.params;
      const detalleModel = new BaseNumeroDetalleModel();
      await detalleModel.delete(id);
      return res.status(200).json({ msg: "Registro eliminado exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar detalle: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar registro" });
    }
  }

  // ==================== CARGA MASIVA ====================
  async uploadBaseNumero(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ msg: "No se ha proporcionado un archivo" });
      }

      const { id_base_numero } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_base_numero) {
        return res.status(400).json({ msg: "El ID de la base es requerido" });
      }

      // Obtener la base y su formato
      const baseNumeroModel = new BaseNumeroModel();
      const base = await baseNumeroModel.getById(id_base_numero);

      if (!base) {
        return res.status(404).json({ msg: "Base de numeros no encontrada" });
      }

      // Obtener campos del formato
      const formatoModel = new FormatoModel();
      const formato = await formatoModel.getByIdWithCampos(base.id_formato);

      if (!formato) {
        return res.status(404).json({ msg: "Formato no encontrado" });
      }

      // Leer el archivo Excel/CSV
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        return res.status(400).json({ msg: "El archivo esta vacio" });
      }

      // Campos fijos de base_numero_detalle
      const camposFijos = ['telefono', 'nombre', 'correo', 'tipo_documento', 'numero_documento'];
      const camposFormato = formato.campos || [];

      // ========== VALIDAR ESTRUCTURA DEL ARCHIVO ==========
      // Obtener las columnas del archivo
      const columnasArchivo = Object.keys(jsonData[0]).map(col => col.toLowerCase().trim());

      // Construir lista de columnas esperadas segun el formato
      const columnasEsperadas = [];

      // telefono siempre es requerido
      columnasEsperadas.push({ nombre: 'telefono', requerido: true, tipo: 'fijo' });

      // Agregar campos opcionales fijos
      camposFijos.filter(c => c !== 'telefono').forEach(campo => {
        columnasEsperadas.push({ nombre: campo, requerido: false, tipo: 'fijo' });
      });

      // Agregar campos del formato
      camposFormato.forEach(campo => {
        columnasEsperadas.push({
          nombre: campo.nombre_campo.toLowerCase(),
          etiqueta: campo.etiqueta ? campo.etiqueta.toLowerCase() : null,
          requerido: campo.requerido === 1,
          tipo: 'formato'
        });
      });

      // Validar que existan las columnas requeridas
      const columnasRequeridas = columnasEsperadas.filter(c => c.requerido);
      const columnasFaltantes = [];

      for (const colReq of columnasRequeridas) {
        const existe = columnasArchivo.some(colArch =>
          colArch === colReq.nombre || colArch === colReq.etiqueta
        );
        if (!existe) {
          columnasFaltantes.push(colReq.etiqueta || colReq.nombre);
        }
      }

      // Identificar columnas del archivo que no estan en el formato
      const columnasValidas = columnasEsperadas.map(c => [c.nombre, c.etiqueta]).flat().filter(Boolean);
      const columnasSobrantes = columnasArchivo.filter(col => !columnasValidas.includes(col));

      // Validar estructura: columnas faltantes o sobrantes
      if (columnasFaltantes.length > 0 || columnasSobrantes.length > 0) {
        let mensaje = "El archivo no tiene la estructura correcta";
        if (columnasFaltantes.length > 0 && columnasSobrantes.length > 0) {
          mensaje = "El archivo tiene columnas faltantes y columnas no reconocidas";
        } else if (columnasFaltantes.length > 0) {
          mensaje = "El archivo tiene columnas requeridas faltantes";
        } else {
          mensaje = "El archivo tiene columnas que no estan definidas en el formato";
        }

        return res.status(400).json({
          msg: mensaje,
          error: "estructura_invalida",
          columnasFaltantes: columnasFaltantes.length > 0 ? columnasFaltantes : undefined,
          columnasSobrantes: columnasSobrantes.length > 0 ? columnasSobrantes : undefined,
          columnasEsperadas: columnasEsperadas.map(c => ({
            nombre: c.etiqueta || c.nombre,
            requerido: c.requerido
          })),
          columnasArchivo: Object.keys(jsonData[0])
        });
      }

      // ========== PROCESAR LOS DATOS ==========
      const registros = [];
      const erroresValidacion = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const registro = {
          telefono: null,
          nombre: null,
          correo: null,
          tipo_documento: null,
          numero_documento: null,
          json_adicional: {}
        };
        let tieneError = false;
        const erroresFila = [];

        // Procesar cada columna del archivo
        const headerKeys = Object.keys(row);

        for (const headerKey of headerKeys) {
          const headerLower = headerKey.toLowerCase().trim();
          const valor = row[headerKey];

          // Verificar si es un campo fijo
          if (camposFijos.includes(headerLower)) {
            registro[headerLower] = valor !== '' ? String(valor) : null;
          } else {
            // Buscar en los campos del formato
            const campoFormato = camposFormato.find(c =>
              c.nombre_campo.toLowerCase() === headerLower ||
              (c.etiqueta && c.etiqueta.toLowerCase() === headerLower)
            );

            if (campoFormato) {
              // Validar segun tipo de dato
              let valorValidado = valor;
              let errorCampo = null;

              if (campoFormato.requerido && (valor === '' || valor === null || valor === undefined)) {
                errorCampo = `Campo "${campoFormato.etiqueta || campoFormato.nombre_campo}" es requerido`;
              } else if (valor !== '' && valor !== null) {
                switch (campoFormato.tipo_dato) {
                  case 'integer':
                    if (isNaN(parseInt(valor))) {
                      errorCampo = `Campo "${campoFormato.etiqueta || campoFormato.nombre_campo}" debe ser un numero entero`;
                    } else {
                      valorValidado = parseInt(valor);
                    }
                    break;
                  case 'decimal':
                    if (isNaN(parseFloat(valor))) {
                      errorCampo = `Campo "${campoFormato.etiqueta || campoFormato.nombre_campo}" debe ser un numero decimal`;
                    } else {
                      valorValidado = parseFloat(valor);
                    }
                    break;
                  case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(valor)) {
                      errorCampo = `Campo "${campoFormato.etiqueta || campoFormato.nombre_campo}" debe ser un email valido`;
                    }
                    break;
                  case 'phone':
                    const phoneClean = String(valor).replace(/\D/g, '');
                    if (phoneClean.length < 9) {
                      errorCampo = `Campo "${campoFormato.etiqueta || campoFormato.nombre_campo}" debe ser un telefono valido`;
                    }
                    valorValidado = phoneClean;
                    break;
                  case 'boolean':
                    valorValidado = ['1', 'true', 'si', 'yes'].includes(String(valor).toLowerCase()) ? 1 : 0;
                    break;
                  case 'date':
                  case 'datetime':
                    // Intentar parsear la fecha
                    if (typeof valor === 'number') {
                      // Es un serial de Excel
                      const date = xlsx.SSF.parse_date_code(valor);
                      valorValidado = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                    } else {
                      valorValidado = valor;
                    }
                    break;
                }

                // Validar longitud
                if (!errorCampo && campoFormato.longitud && String(valorValidado).length > campoFormato.longitud) {
                  errorCampo = `Campo "${campoFormato.etiqueta || campoFormato.nombre_campo}" excede la longitud maxima de ${campoFormato.longitud}`;
                }
              }

              if (errorCampo) {
                erroresFila.push(errorCampo);
                tieneError = true;
              } else {
                registro.json_adicional[campoFormato.nombre_campo] = valorValidado !== '' ? valorValidado : null;
              }
            }
          }
        }

        // Validar telefono requerido
        if (!registro.telefono) {
          erroresFila.push('El telefono es requerido');
          tieneError = true;
        }

        if (tieneError) {
          erroresValidacion.push({
            fila: i + 2, // +2 porque la fila 1 es el header y el array empieza en 0
            errores: erroresFila
          });
        } else {
          registros.push(registro);
        }
      }

      // Insertar registros validos
      const detalleModel = new BaseNumeroDetalleModel();
      const resultado = await detalleModel.bulkCreate(id_base_numero, registros, usuario_registro);

      return res.status(200).json({
        msg: "Carga completada",
        data: {
          totalProcesados: jsonData.length,
          insertados: resultado.total,
          erroresValidacion: erroresValidacion.length,
          erroresDuplicados: resultado.errores.length,
          detalleErroresValidacion: erroresValidacion.slice(0, 10), // Primeros 10 errores
          detalleErroresDuplicados: resultado.errores.slice(0, 10)
        }
      });

    } catch (error) {
      logger.error(`[configuracion.controller.js] Error en carga masiva: ${error.message}`);
      return res.status(500).json({ msg: "Error al procesar el archivo" });
    }
  }

  // ==================== PLANTILLAS ====================
  async getPlantillas(req, res) {
    try {
      const plantillaModel = new PlantillaModel();
      const plantillas = await plantillaModel.getAll();
      return res.status(200).json({ data: plantillas });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener plantillas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener plantillas" });
    }
  }

  async getPlantillaById(req, res) {
    try {
      const { id } = req.params;
      const plantillaModel = new PlantillaModel();
      const plantilla = await plantillaModel.getById(id);

      if (!plantilla) {
        return res.status(404).json({ msg: "Plantilla no encontrada" });
      }

      return res.status(200).json({ data: plantilla });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener plantilla: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener plantilla" });
    }
  }

  async getPlantillasByFormato(req, res) {
    try {
      const { idFormato } = req.params;
      const plantillaModel = new PlantillaModel();
      const plantillas = await plantillaModel.getByFormato(idFormato);
      return res.status(200).json({ data: plantillas });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener plantillas por formato: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener plantillas por formato" });
    }
  }

  async createPlantilla(req, res) {
    try {
      const { id_formato, nombre, descripcion, prompt_sistema, prompt_inicio, prompt_flujo, prompt_cierre, prompt_resultado } = req.body;
      const id_empresa = req.user?.id_empresa || 1;
      const usuario_registro = req.user?.userId || null;

      if (!id_formato || !nombre || !prompt_sistema || !prompt_inicio || !prompt_flujo) {
        return res.status(400).json({ msg: "El formato, nombre, prompt sistema, prompt inicio y prompt flujo son requeridos" });
      }

      const plantillaModel = new PlantillaModel();
      const id = await plantillaModel.create({
        id_empresa,
        id_formato,
        nombre,
        descripcion,
        prompt_sistema,
        prompt_inicio,
        prompt_flujo,
        prompt_cierre,
        prompt_resultado,
        usuario_registro
      });

      return res.status(201).json({ msg: "Plantilla creada exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear plantilla: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al crear plantilla" });
    }
  }

  async updatePlantilla(req, res) {
    try {
      const { id } = req.params;
      const { id_formato, nombre, descripcion, prompt_sistema, prompt_inicio, prompt_flujo, prompt_cierre, prompt_resultado } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!id_formato || !nombre || !prompt_sistema || !prompt_inicio || !prompt_flujo) {
        return res.status(400).json({ msg: "El formato, nombre, prompt sistema, prompt inicio y prompt flujo son requeridos" });
      }

      const plantillaModel = new PlantillaModel();
      const updated = await plantillaModel.update(id, {
        id_formato,
        nombre,
        descripcion,
        prompt_sistema,
        prompt_inicio,
        prompt_flujo,
        prompt_cierre,
        prompt_resultado,
        usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Plantilla no encontrada" });
      }

      return res.status(200).json({ msg: "Plantilla actualizada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar plantilla: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al actualizar plantilla" });
    }
  }

  async deletePlantilla(req, res) {
    try {
      const { id } = req.params;
      const plantillaModel = new PlantillaModel();
      const deleted = await plantillaModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Plantilla no encontrada" });
      }

      return res.status(200).json({ msg: "Plantilla eliminada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar plantilla: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar plantilla" });
    }
  }

  // ==================== CAMPANIAS ====================
  async getCampanias(req, res) {
    try {
      const campaniaModel = new CampaniaModel();
      const campanias = await campaniaModel.getAll();
      return res.status(200).json({ data: campanias });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener campanias: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener campanias" });
    }
  }

  async getCampaniaById(req, res) {
    try {
      const { id } = req.params;
      const campaniaModel = new CampaniaModel();
      const campania = await campaniaModel.getByIdWithBases(id);

      if (!campania) {
        return res.status(404).json({ msg: "Campania no encontrada" });
      }

      return res.status(200).json({ data: campania });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener campania" });
    }
  }

  async createCampania(req, res) {
    try {
      const { nombre, descripcion } = req.body;
      const id_empresa = req.user?.id_empresa || 1;
      const usuario_registro = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const campaniaModel = new CampaniaModel();
      const id = await campaniaModel.create({
        id_empresa,
        nombre,
        descripcion,
        usuario_registro
      });

      return res.status(201).json({ msg: "Campania creada exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al crear campania: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al crear campania" });
    }
  }

  async updateCampania(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const campaniaModel = new CampaniaModel();
      const updated = await campaniaModel.update(id, {
        nombre,
        descripcion,
        usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Campania no encontrada" });
      }

      return res.status(200).json({ msg: "Campania actualizada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar campania: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al actualizar campania" });
    }
  }

  async deleteCampania(req, res) {
    try {
      const { id } = req.params;
      const campaniaModel = new CampaniaModel();
      const deleted = await campaniaModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Campania no encontrada" });
      }

      return res.status(200).json({ msg: "Campania eliminada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar campania" });
    }
  }

  // ==================== CAMPANIA BASE NUMERO ====================
  async getBasesByCampania(req, res) {
    try {
      const { idCampania } = req.params;
      const campaniaBaseModel = new CampaniaBaseNumeroModel();
      const bases = await campaniaBaseModel.getByCampania(idCampania);
      return res.status(200).json({ data: bases });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener bases de campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener bases de campania" });
    }
  }

  async addBaseToCampania(req, res) {
    try {
      const { id_campania, id_base_numero } = req.body;
      const id_empresa = req.user?.id_empresa || 1;
      const usuario_registro = req.user?.userId || null;

      if (!id_campania || !id_base_numero) {
        return res.status(400).json({ msg: "La campania y base son requeridas" });
      }

      const campaniaBaseModel = new CampaniaBaseNumeroModel();
      const id = await campaniaBaseModel.add({
        id_empresa,
        id_campania,
        id_base_numero,
        usuario_registro
      });

      return res.status(201).json({ msg: "Base agregada a campania exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al agregar base a campania: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al agregar base a campania" });
    }
  }

  async removeBaseFromCampania(req, res) {
    try {
      const { id } = req.params;
      const campaniaBaseModel = new CampaniaBaseNumeroModel();
      const removed = await campaniaBaseModel.remove(id);

      if (!removed) {
        return res.status(404).json({ msg: "Relacion no encontrada" });
      }

      return res.status(200).json({ msg: "Base eliminada de campania exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al eliminar base de campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar base de campania" });
    }
  }

  // ==================== CAMPANIA EJECUCION ====================
  async getEjecucionesByCampania(req, res) {
    try {
      const { idCampania } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const ejecucionModel = new CampaniaEjecucionModel();
      const result = await ejecucionModel.getByCampania(idCampania, parseInt(page), parseInt(limit));

      return res.status(200).json(result);
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener ejecuciones: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener ejecuciones" });
    }
  }

  async ejecutarCampania(req, res) {
    try {
      const { id_campania } = req.body;
      const id_empresa = req.user?.id_empresa || 1;
      const usuario_registro = req.user?.userId || null;

      if (!id_campania) {
        return res.status(400).json({ msg: "La campania es requerida" });
      }

      // Obtener bases de la campania
      const campaniaBaseModel = new CampaniaBaseNumeroModel();
      const bases = await campaniaBaseModel.getByCampania(id_campania);

      if (bases.length === 0) {
        return res.status(400).json({ msg: "La campania no tiene bases de numeros asignadas" });
      }

      // Crear ejecuciones para cada base
      const ejecucionModel = new CampaniaEjecucionModel();
      const ejecuciones = [];

      for (const base of bases) {
        const id = await ejecucionModel.create({
          id_empresa,
          id_campania,
          id_base_numero: base.id_base_numero,
          fecha_programada: new Date(),
          usuario_registro
        });
        ejecuciones.push({ id, id_base_numero: base.id_base_numero, base_nombre: base.base_nombre });
      }

      return res.status(201).json({
        msg: "Ejecucion de campania iniciada",
        data: {
          total_bases: bases.length,
          ejecuciones
        }
      });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al ejecutar campania: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al ejecutar campania" });
    }
  }

  async getEjecucionById(req, res) {
    try {
      const { id } = req.params;
      const ejecucionModel = new CampaniaEjecucionModel();
      const ejecucion = await ejecucionModel.getById(id);

      if (!ejecucion) {
        return res.status(404).json({ msg: "Ejecucion no encontrada" });
      }

      return res.status(200).json({ data: ejecucion });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener ejecucion: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener ejecucion" });
    }
  }

  async updateEstadoEjecucion(req, res) {
    try {
      const { id } = req.params;
      const { estado_ejecucion, resultado, mensaje_error } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!estado_ejecucion) {
        return res.status(400).json({ msg: "El estado es requerido" });
      }

      const ejecucionModel = new CampaniaEjecucionModel();
      const updateData = {
        estado_ejecucion,
        usuario_actualizacion
      };

      if (estado_ejecucion === 'en_proceso') {
        updateData.fecha_inicio = new Date();
      }

      if (['ejecutado', 'fallido', 'cancelado'].includes(estado_ejecucion)) {
        updateData.fecha_fin = new Date();
        updateData.resultado = resultado;
        updateData.mensaje_error = mensaje_error;
      }

      const updated = await ejecucionModel.updateEstado(id, updateData);

      if (!updated) {
        return res.status(404).json({ msg: "Ejecucion no encontrada" });
      }

      return res.status(200).json({ msg: "Estado de ejecucion actualizado" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al actualizar ejecucion: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar estado de ejecucion" });
    }
  }

  async getEstadisticasCampania(req, res) {
    try {
      const { idCampania } = req.params;
      const ejecucionModel = new CampaniaEjecucionModel();
      const estadisticas = await ejecucionModel.getEstadisticas(idCampania);
      return res.status(200).json({ data: estadisticas });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al obtener estadisticas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estadisticas" });
    }
  }

  async cancelarEjecucion(req, res) {
    try {
      const { id } = req.params;
      const { mensaje_error } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      const ejecucionModel = new CampaniaEjecucionModel();
      const cancelled = await ejecucionModel.cancelarEjecucion(id, {
        mensaje_error: mensaje_error || 'Cancelado por el usuario',
        usuario_actualizacion
      });

      if (!cancelled) {
        return res.status(404).json({ msg: "Ejecucion no encontrada" });
      }

      return res.status(200).json({ msg: "Ejecucion cancelada exitosamente" });
    } catch (error) {
      logger.error(`[configuracion.controller.js] Error al cancelar ejecucion: ${error.message}`);
      return res.status(500).json({ msg: "Error al cancelar ejecucion" });
    }
  }
}

module.exports = new ConfiguracionController();
