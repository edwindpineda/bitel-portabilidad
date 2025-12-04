// assistant
const AssistantService = require("../services/assistant/asistant.service");
// modelo de contacto
const TblContactoModel = require("../models/tblContacto.model.js");
const TblProspectoModel = require("../models/tblProspectos.model.js");
const TblPlanesTarifariosModel = require("../models/tblPlanesTarifarios.model.js");
const TblAuditoriaApiModel = require("../models/tblAuditoriaApi.model.js");
const TblEstadoModel = require("../models/tblEstado.model.js");
const logger = require('../config/logger/loggerClient');

class MessageProcessingController {

    async processMessage(req, res) {
        try {
            let { phone, question } = req.body;
            phone = phone.trim();
            question = question.trim();

            let userType = req.userType;
            userType = userType.trim();

            const prospectoModel = new TblProspectoModel();
            const estadoModel = new TblEstadoModel();
            const planesModel = new TblPlanesTarifariosModel();
            const contactModel = new TblContactoModel();

            //let prospecto = await prospectoModel.selectByFechaAndTipo(fechaConsumo, userType);
            let prospecto = await prospectoModel.selectByCelular(userType, phone);

            if (!prospecto) {
                prospecto = await prospectoModel.createProspecto(userType, 1, phone);
            }
            
            // let id_cliente_rest;
            // if (!prospecto) {
            //     // Registrar cliente rest e inicializar el contador de consumo
            //     id_cliente_rest = await prospectoModel.createUserConsumo(fechaConsumo, userType, 1);
            //     prospecto = await prospectoModel.getById(id_cliente_rest);
            // } else {
            //     id_cliente_rest = prospecto.id;            // }

            // Obtener el consumo total de un usuario            // const consumoTotal = await prospectoModel.getConsumoTotal(userType);

            // // Si el consumo total es mayor o igual a 20k, se cierra el chat
            // if (consumoTotal >= 20000) {
            //     return res.clientError(403, "El usuario ha alcanzado el límite de consumo");
            // }

            // Verificar si existe el contacto
            let contact = await contactModel.getByCelular(phone);

            if (!contact) {
                // Registrar contacto
                contact = await contactModel.create(phone, prospecto.id);
            }

            // // Incrementar consumo cuando el contador de contacto es 0
            // if (contactCount === 0) {
            //     await prospectoModel.updateConsumo(fechaConsumo, userType);
            // }

            // // Incrementar el contador incremental incr_count de un contacto por su id
            // await contactModel.incrementIncrCountById(contactId);

            // Asistente
            const response = await AssistantService.runProcess({
                contactId: contact,
                message: question,
                nombre_modelo: "gpt-4.1-mini"
            });

            // Respuesta
            let status;
            let answer;
            let datosCliente = null;
            const imagen_url = response?.imagen?.replace(/\s+/g, '') || null;

            console.log(response);

            // // Verificar el valor del contador de contacto
            // const maxCountContact = parseInt(process.env.MAX_COUNT_VALUE);

            // if (contactCount >= maxCountContact && response.estado_respuesta !== "finalizada" && response.estado_respuesta !== "line1" && response.estado_respuesta !== "line2") {
            //     status = "queue";
            //     answer = "Gracias por tu mensaje 😊\nEn este momento te estamos derivando con un asesor experto en este tema, quien podrá ayudarte de manera más detallada.\n\n⏳ Solo tomará unos instantes. ¡Gracias por tu paciencia!";
            //     // Resetear el contador de contacto
            //     //await contactModel.resetCountByCelular(phone, id_cliente_rest);

            // } else {

            //     // Incrementar el contador de contacto en 1
            //     // await contactModel.incrementCountByCelular(phone, id_cliente_rest);

            // }

            if (response.estado_respuesta === "exitosa") {
                    status = "pending";

            } else if (response.estado_respuesta === "queue") {
                // Derivar a un agente humano (no sabe responder o cliente pide hablar con humano)
                status = "queue";

            } else if (response.estado_respuesta === "ambigua") {
                status = "pending";

            } else if (response.estado_respuesta === "finalizada") {
                status = "closed";

            } else if (response.estado_respuesta === "line1") {
                // Cliente interesado pero con dudas - derivar a asesor para llamada
                status = "line1";
                // Incluir datos del cliente para el asesor
                datosCliente = response.datos_cliente || null;

            } else if (response.estado_respuesta === "line2") {
                // Cliente convencido - derivar a backoffice para procesar portabilidad
                status = "line2";
                // Incluir datos del cliente para backoffice
                datosCliente = response.datos_cliente || null;
            }

            answer = response.mensaje_asistente;
            // Resetear el contador de contacto
            // await contactModel.resetCountByCelular(phone, prospecto.id);

            const id_estado = await estadoModel.getIdByName(status);
            
            if (prospecto.id_estado !== id_estado) {
                await prospectoModel.updateEstado(prospecto.id, id_estado);
            }

            // Registrar en auditoria_api
            const auditoriaApiModel = new TblAuditoriaApiModel();
            await auditoriaApiModel.insert({
                phone,
                question,
                tipo_usuario: userType,
                id_contacto: contact,
                id_cliente_rest: prospecto.id,
                respuesta_api: { status, answer, datos_cliente: datosCliente }
            });

            // Construir respuesta según el status
            const responseData = { status, answer, imagen_url };
            
            // Incluir datos_cliente solo cuando es line1 o line2
            if (datosCliente && (status === "line1" || status === "line2")) {
                responseData.datos_cliente = datosCliente;
                console.log(datosCliente);

                let id_plan;
                if (datosCliente.plan_a_vender) {
                    id_plan = await planesModel.getIdByNombre(datosCliente.plan_a_vender);
                }
                
                await prospectoModel.updateDatosProspecto(
                    datosCliente.nombres_completos || null,
                    datosCliente.dni || null,
                    datosCliente.direccion || null,
                    id_plan || null,
                    datosCliente.numero_celular || null,
                    prospecto.id
                )
            }

            return res.success(200, "Mensaje procesado correctamente", responseData);

        } catch (error) {
            logger.error(`[messageProcessing.controller.js] Error al procesar el mensaje: ${error.message}`);
            return res.serverError(500, "Error Interno en el servidor");
        }
    }
}

module.exports = new MessageProcessingController();