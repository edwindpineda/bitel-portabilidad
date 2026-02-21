const AssistantService = require("../services/assistant/asistant.service");
const Prospecto = require("../models/prospecto.model.js");
const Cliente = require("../models/cliente.model.js");
const Usuario = require("../models/usuario.model.js");
const Chat = require("../models/chat.model.js");
const Mensaje = require("../models/mensaje.model.js");
const logger = require("../config/logger/loggerClient");

class MessageProcessingController {

    async processMessage(req, res) {
        try {
            let { phone, question, wid, id_empresa, es_cliente } = req.body;
            phone = phone.trim();
            question = question.trim();
            wid = wid ? wid.trim() : null;
            id_empresa = id_empresa ? parseInt(id_empresa, 10) : null;

            let persona;
            let chat;

            if (es_cliente) {
                // Flujo cliente
                persona = await Cliente.findByCelular(phone);

                if (!persona) {
                    return res.serverError(404, "Cliente no encontrado");
                }

                chat = await Chat.findByCliente(persona.id);
                if (!chat) {
                    chat = await Chat.create({
                        id_empresa,
                        id_cliente: persona.id,
                        usuario_registro: 1
                    });
                }
            } else {
                // Flujo prospecto
                persona = await Prospecto.selectByCelular(phone);

                if (!persona) {
                    const asesores = await Usuario.getByRol(3);
                    const ids = asesores.map(a => a.id);

                    const ultimoAsignacion = await Prospecto.getAsignacionesAsesor();

                    let id_asesor = null;
                    if (ids.length > 0) {
                        if (ultimoAsignacion?.id_usuario) {
                            const indice = (ids.indexOf(ultimoAsignacion.id_usuario) + 1) % ids.length;
                            id_asesor = ids[indice];
                        } else {
                            id_asesor = ids[0];
                        }
                    }

                    persona = await Prospecto.createProspecto({
                        id_estado: 1,
                        celular: phone,
                        id_usuario: id_asesor,
                        id_empresa,
                        usuario_registro: 1
                    });
                }

                chat = await Chat.findByProspecto(persona.id);
                if (!chat) {
                    chat = await Chat.create({
                        id_empresa,
                        id_prospecto: persona.id,
                        usuario_registro: 1
                    });
                }
            }

            console.log(chat);
            // Guardar mensaje entrante
            await Mensaje.create({
                id_chat: chat.id || chat,
                contenido: question,
                direccion: "in",
                wid_mensaje: wid,
                tipo_mensaje: "texto",
                fecha_hora: new Date(),
                usuario_registro: 1
            });

            // Procesar con el asistente
            const respuestaTexto = await AssistantService.runProcess({
                chatId: chat.id || chat,
                message: question,
                prospecto: persona,
                id_empresa
            });

            // Guardar mensaje saliente
            await Mensaje.create({
                id_chat: chat.id || chat,
                contenido: respuestaTexto,
                direccion: "out",
                wid_mensaje: wid,
                tipo_mensaje: "texto",
                fecha_hora: new Date(),
                usuario_registro: 1
            });

            // Retornar respuesta
            return res.success(200, "Mensaje procesado correctamente", {
                respuesta: respuestaTexto
            });

        } catch (error) {
            logger.error(`[messageProcessing.controller.js] Error: ${error.message}`);
            return res.serverError(500, "Error Interno en el servidor");
        }
    }
}

module.exports = new MessageProcessingController();
