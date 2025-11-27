const { pool } = require('../config/dbConnection.js');

class TblHistorialChatAiModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    // Guardar un registro en el historial de chat AI
    async saveChatHistory({
        id_contacto,
        input,
        status_api,
        costo_modelo,
        tkn_input,
        tkn_output,
        nombre_modelo
    }) {


        try {
            const query = `INSERT INTO tbl_historial_chat_ai 
            (id_contacto, input, status_api, costo_modelo, tkn_input, tkn_output, nombre_modelo) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

            const values = [id_contacto, JSON.stringify(input), status_api, costo_modelo, tkn_input, tkn_output, nombre_modelo];

            const [result] = await this.connection.execute(query, values);
            return result.insertId;

        } catch (error) {
            throw new Error(`[TblHistorialChatAiModel.saveChatHistory] ${error.message}`);
        }
    }

    // Obtener los últimos N mensajes de una conversación
    async getLastMessagesByConversationId(id_contacto, limit = 10) {
        try {

            let query = `SELECT * FROM tbl_historial_chat_ai 
            WHERE id_contacto = ? 
            ORDER BY id DESC`;

            let params = [id_contacto];

            if (limit > 0) query += ` LIMIT ${limit}`;
        

            const [result] = await this.connection.execute(query, params);

            // Ordenar el resultado en orden ascendente para mantener la cronología del chat
            return result.reverse();

        } catch (error) {
            throw new Error(`[TblHistorialChatAiModel.getLastMessagesByConversationId] ${error.message}`);
        }
    }

    // Eliminar un registro del historial
    async deleteChatHistory(id) {
        try {
            const query = `DELETE FROM tbl_historial_chat_ai WHERE id = ?`;
            const [result] = await this.connection.execute(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`[TblHistorialChatAiModel.deleteChatHistory] ${error.message}`);
        }
    }

}

module.exports = TblHistorialChatAiModel; 