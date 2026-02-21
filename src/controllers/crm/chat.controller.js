const ChatModel = require("../../models/chat.model.js");
const logger = require('../../config/logger/loggerClient.js');

class ChatController {
  async create(req, res) {
    try {
      const { id_prospecto, id_empresa } = req.body;
      const { userId } = req.user || {};

      if (!id_prospecto) {
        return res.status(400).json({ msg: "id_prospecto es requerido" });
      }

      const chat = await ChatModel.create({ id_prospecto, id_empresa, usuario_registro: userId });
      return res.status(201).json({ data: chat });
    } catch (error) {
      logger.error(`[chat.controller.js] Error al crear chat: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear chat" });
    }
  }

  async findById(req, res) {
    try {
      const { id } = req.params;
      const chat = await ChatModel.findById(id);

      if (!chat) {
        return res.status(404).json({ msg: "Chat no encontrado" });
      }

      return res.status(200).json({ data: chat });
    } catch (error) {
      logger.error(`[chat.controller.js] Error al obtener chat: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener chat" });
    }
  }

  async findByProspecto(req, res) {
    try {
      const { id_prospecto } = req.params;
      const chats = await ChatModel.findByProspecto(id_prospecto);
      return res.status(200).json({ data: chats });
    } catch (error) {
      logger.error(`[chat.controller.js] Error al obtener chats por prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener chats" });
    }
  }

  async findAll(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const chats = await ChatModel.findAll(idEmpresa);
      return res.status(200).json({ data: chats });
    } catch (error) {
      logger.error(`[chat.controller.js] Error al obtener chats: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener chats" });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.user || {};

      await ChatModel.update(id, { ...req.body, usuario_actualizacion: userId });
      logger.info(`[chat.controller.js] Chat ${id} actualizado correctamente`);

      return res.status(200).json({ msg: "Chat actualizado correctamente" });
    } catch (error) {
      logger.error(`[chat.controller.js] Error al actualizar chat: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar chat" });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.user || {};

      await ChatModel.delete(id, userId);
      logger.info(`[chat.controller.js] Chat ${id} eliminado correctamente`);

      return res.status(200).json({ msg: "Chat eliminado correctamente" });
    } catch (error) {
      logger.error(`[chat.controller.js] Error al eliminar chat: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar chat" });
    }
  }
}

module.exports = new ChatController();
