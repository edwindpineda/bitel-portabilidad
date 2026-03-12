const ConfiguracionWhatsappModel = require("../models/configuracionWhatsapp.model.js");
const logger = require("../config/logger/loggerClient.js");

class ConfiguracionWhatsappController {

    async getAll(req, res) {
        try {
            const configs = await ConfiguracionWhatsappModel.getAll();
            return res.success(200, "Configuraciones WhatsApp obtenidas correctamente", configs);
        } catch (error) {
            logger.error(`[configuracionWhatsapp.controller.js] getAll Error: ${error.message}`);
            return res.serverError(500, "Error al obtener configuraciones WhatsApp");
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const config = await ConfiguracionWhatsappModel.getById(id);

            if (!config) {
                return res.clientError(404, "Configuración WhatsApp no encontrada");
            }

            return res.success(200, "Configuración WhatsApp obtenida correctamente", config);
        } catch (error) {
            logger.error(`[configuracionWhatsapp.controller.js] getById Error: ${error.message}`);
            return res.serverError(500, "Error al obtener configuración WhatsApp");
        }
    }

    async getByEmpresaId(req, res) {
        try {
            const { empresaId } = req.params;
            const config = await ConfiguracionWhatsappModel.getByEmpresaId(empresaId);

            if (!config) {
                return res.clientError(404, "Configuración WhatsApp no encontrada para esta empresa");
            }

            return res.success(200, "Configuración WhatsApp obtenida correctamente", config);
        } catch (error) {
            logger.error(`[configuracionWhatsapp.controller.js] getByEmpresaId Error: ${error.message}`);
            return res.serverError(500, "Error al obtener configuración WhatsApp por empresa");
        }
    }

    async create(req, res) {
        try {
            const { userId } = req.user || {};
            const { id_empresa, app_id, numero_telefono_id, clave_secreta, token_whatsapp, waba_id, phone_number, token_expiration } = req.body;

            if (!id_empresa || !numero_telefono_id) {
                return res.clientError(400, "Campos requeridos: id_empresa, numero_telefono_id");
            }

            const id = await ConfiguracionWhatsappModel.create({
                id_empresa,
                app_id: app_id || null,
                numero_telefono_id,
                clave_secreta: clave_secreta || null,
                token_whatsapp: token_whatsapp || null,
                waba_id: waba_id || null,
                phone_number: phone_number || null,
                token_expiration: token_expiration || null,
                usuario_registro: userId || null
            });

            return res.success(201, "Configuración WhatsApp creada exitosamente", { id });
        } catch (error) {
            logger.error(`[configuracionWhatsapp.controller.js] create Error: ${error.message}`);
            return res.serverError(500, "Error al crear configuración WhatsApp");
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.user || {};
            const { app_id, numero_telefono_id, clave_secreta, token_whatsapp, waba_id, phone_number, token_expiration } = req.body;

            const existing = await ConfiguracionWhatsappModel.getById(id);
            if (!existing) {
                return res.clientError(404, "Configuración WhatsApp no encontrada");
            }

            const updated = await ConfiguracionWhatsappModel.update(id, {
                app_id: app_id !== undefined ? app_id : existing.app_id,
                numero_telefono_id: numero_telefono_id !== undefined ? numero_telefono_id : existing.numero_telefono_id,
                clave_secreta: clave_secreta !== undefined ? clave_secreta : existing.clave_secreta,
                token_whatsapp: token_whatsapp !== undefined ? token_whatsapp : existing.token_whatsapp,
                waba_id: waba_id !== undefined ? waba_id : existing.waba_id,
                phone_number: phone_number !== undefined ? phone_number : existing.phone_number,
                token_expiration: token_expiration !== undefined ? token_expiration : existing.token_expiration,
                usuario_actualizacion: userId || null
            });

            if (!updated) {
                return res.serverError(500, "No se pudo actualizar la configuración");
            }

            return res.success(200, "Configuración WhatsApp actualizada correctamente");
        } catch (error) {
            logger.error(`[configuracionWhatsapp.controller.js] update Error: ${error.message}`);
            return res.serverError(500, "Error al actualizar configuración WhatsApp");
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.user || {};

            const existing = await ConfiguracionWhatsappModel.getById(id);
            if (!existing) {
                return res.clientError(404, "Configuración WhatsApp no encontrada");
            }

            const deleted = await ConfiguracionWhatsappModel.delete(id, userId || null);

            if (!deleted) {
                return res.serverError(500, "No se pudo eliminar la configuración");
            }

            return res.success(200, "Configuración WhatsApp eliminada correctamente");
        } catch (error) {
            logger.error(`[configuracionWhatsapp.controller.js] delete Error: ${error.message}`);
            return res.serverError(500, "Error al eliminar configuración WhatsApp");
        }
    }
}

module.exports = new ConfiguracionWhatsappController();
