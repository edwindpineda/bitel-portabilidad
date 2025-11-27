const tblHistorialChatAiModel = require("../../models/tblHistorialChatAi.model");

class MemoryService {

    async getLastContextMessagesTable(contactId, numberOfContextMessages) {

        try {
            const chatHistoryModel = new tblHistorialChatAiModel();
            const results = await chatHistoryModel.getLastMessagesByConversationId(contactId, numberOfContextMessages);

            const contactContextHistoryMessages = results.map(row => row.input);

            return contactContextHistoryMessages;
        } catch (error) {
            throw new Error(`[AssistantService.getLastContextMessagesTable] ${error.message}`);
        }
    }

    // Insertar un mensaje en el historial de inputs de la conversación de un contacto con la IA
    async addMessageToContactContextHistoryForAi({
        contactId,
        newInputMessage,
        status_api,
        costo_modelo,
        tkn_input,
        tkn_output,
        nombre_modelo
    }) {
        try {
            // Añadir el mensaje en el historial de inputs de la conversación de un contacto con la IA en la tabla tbl_historial_chat_ai
            const chatHistoryModel = new tblHistorialChatAiModel();
            await chatHistoryModel.saveChatHistory({
                id_contacto: contactId,
                input: newInputMessage,
                status_api: status_api,
                costo_modelo: costo_modelo,
                tkn_input: tkn_input,
                tkn_output: tkn_output,
                nombre_modelo: nombre_modelo
            });

        } catch (error) {
            throw new Error(`[AssistantService.addMessageToContactContextHistoryForAi] ${error.message}`);
        }
    }

}

module.exports = new MemoryService();