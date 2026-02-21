const { pool } = require("../config/dbConnection.js");
const logger = require('../config/logger/loggerClient.js');

class ChatModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async create(data) {
        try {
            const { id_empresa, id_prospecto = null, id_cliente = null, usuario_registro } = data;

            const [result] = await this.connection.execute(
                'INSERT INTO chat (id_empresa, id_prospecto, id_cliente, usuario_registro) VALUES (?, ?, ?, ?)',
                [id_empresa, id_prospecto, id_cliente, usuario_registro]
            );

            return result.insertId;
        } catch (error) {
            logger.error(`[chat.model.js] Error al crear chat: ${error.message}`);
            throw new Error(`Error al crear chat: ${error.message}`);
        }
    }

    async findById(id) {
        const [rows] = await this.connection.execute(
            'SELECT * FROM chat WHERE id = ? AND estado_registro = 1',
            [id]
        );
        return rows[0] || null;
    }

    async findByProspecto(id_prospecto) {
        const [rows] = await this.connection.execute(
            'SELECT * FROM chat WHERE id_prospecto = ? AND estado_registro = 1',
            [id_prospecto]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    async findByCliente(id_cliente) {
        const [rows] = await this.connection.execute(
            'SELECT * FROM chat WHERE id_cliente = ? AND estado_registro = 1',
            [id_cliente]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    async findAll(id_empresa = null) {
        let query = 'SELECT * FROM chat WHERE estado_registro = 1';
        const params = [];

        if (id_empresa) {
            query += ' AND id_empresa = ?';
            params.push(id_empresa);
        }

        query += ' ORDER BY fecha_registro DESC';

        const [rows] = await this.connection.execute(query, params);
        return rows;
    }

    static UPDATABLE_FIELDS = [
        'id_empresa', 'id_prospecto', 'estado_registro', 'usuario_actualizacion', 'bot_activo'
    ];

    async update(id, data) {
        try {
            const fields = [];
            const values = [];

            for (const [key, value] of Object.entries(data)) {
                if (ChatModel.UPDATABLE_FIELDS.includes(key)) {
                    fields.push(`${key} = ?`);
                    values.push(value ?? null);
                }
            }

            if (fields.length === 0) {
                throw new Error('No se proporcionaron campos válidos para actualizar');
            }

            values.push(id);

            const query = `UPDATE chat SET ${fields.join(', ')} WHERE id = ?`;
            const [result] = await this.connection.execute(query, values);

            if (result.affectedRows === 0) {
                throw new Error('Chat no encontrado');
            }

            return true;
        } catch (error) {
            logger.error(`[chat.model.js] Error al actualizar chat: ${error.message}`);
            throw new Error(`Error al actualizar chat: ${error.message}`);
        }
    }

    async delete(id, usuario_actualizacion = null) {
        try {
            const [result] = await this.connection.execute(
                'UPDATE chat SET estado_registro = 0, usuario_actualizacion = ? WHERE id = ?',
                [usuario_actualizacion, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('Chat no encontrado');
            }

            return true;
        } catch (error) {
            logger.error(`[chat.model.js] Error al eliminar chat: ${error.message}`);
            throw new Error(`Error al eliminar chat: ${error.message}`);
        }
    }
}

module.exports = new ChatModel();
