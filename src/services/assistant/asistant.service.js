const LlmResponsesApiService = require("../openAI/llmResponsesApi.service");
const BuildPromptService = require("./buildPrompt.service");
const MemoryService = require("./memory.service");
const { customTimestamp } = require("../../utils/customTimestamp");
const logger = require("../../config/logger/loggerClient");

class AssistantService {

    constructor() {

        this.numberOfContextMessages = Number(process.env.NUM_LAST_INPUTS_MESSAGES);
        this.llmResponsesApiService = new LlmResponsesApiService(process.env.OPENAI_API_KEY);
    }


    async runProcess({
        contactId,
        message,
        nombre_modelo,
        id_empresa = null
    }) {
        try {


            // Obtener historial de conversación del contacto con la IA ----------------

            // Cargar historial desde la db
            const arrayLastContextMessages = await MemoryService.getLastContextMessagesTable(
                contactId, this.numberOfContextMessages);

            // Añadir el mensaje del usuario al historial de conversación ----------------

            const mensajeClienteXML = BuildPromptService.buildUserPrompt({
                mensaje: message,
                timestamp: customTimestamp()
            });

            const newInputMessage = this.llmResponsesApiService.inputTextFormat({
                role: "user",
                content: mensajeClienteXML
            });

            await MemoryService.addMessageToContactContextHistoryForAi({
                contactId,
                newInputMessage,
                status_api: null,
                costo_modelo: null,
                tkn_input: null,
                tkn_output: null,
                nombre_modelo: null
            });


            // Obtener el prompt system --------------------------------------------------------

            const promptInstructions = await BuildPromptService.buildSystemPrompt({
                id_empresa: id_empresa
            });

            // Inputs ----------------------------------------------------------------------

            let inputs = [...arrayLastContextMessages, newInputMessage];

            // Obtener la respuesta de la IA 
            const response = await this.llmResponsesApiService.getResponse(
                inputs,
                promptInstructions,
                {
                    model: nombre_modelo
                }
            );

            const newResponseMessage = this.llmResponsesApiService.inputTextFormat({
                role: "assistant",
                content: response.output_text
            });


            await MemoryService.addMessageToContactContextHistoryForAi({
                contactId: contactId,
                newInputMessage: newResponseMessage,
                status_api: null,
                costo_modelo: null,
                tkn_input: response.usage.input_tokens || null,
                tkn_output: response.usage.output_tokens || null,
                nombre_modelo: response.model
            });


            // Procesar la respuesta de la IA 

            let cleanOutputText = response.output_text.replace(/^```json\n?/, '')
                .replace(/^```\n?/, '')
                .replace(/```$/, '')
                .trim();


            let responseObject;
            try {
                responseObject = JSON.parse(cleanOutputText);
            } catch (error) {

                // Si no es un JSON válido, se debe enviar a autocorrector
                const promptAutocorrector = BuildPromptService.buildAutocorrectorPrompt();
                const responseAutocorrector = await this.llmResponsesApiService.getResponse(
                    cleanOutputText,
                    promptAutocorrector,
                    {
                        model: "gpt-4.1-nano"
                    }
                );

                const cleanOutputTextAutocorrector = responseAutocorrector.output_text.replace(/^```json\n?/, '')
                    .replace(/^```\n?/, '')
                    .replace(/```$/, '')
                    .trim();

                responseObject = JSON.parse(cleanOutputTextAutocorrector);
                // console.log("responseObject desde corrector", responseObject);
            }

            // console.log("responseObject desde asistant", responseObject );
            return responseObject;
            
        } catch (error) {
            logger.error(`[AssistantService.runProcess] ${error.message}`);
            throw new Error(`[AssistantService.runProcess] ${error.message}`);
        }
    }



}

module.exports = new AssistantService();