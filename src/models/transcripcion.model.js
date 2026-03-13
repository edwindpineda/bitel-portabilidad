const { pool } = require("../config/dbConnection.js");

class TranscripcionModel {
    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async getByLlamada(id_llamada) {
        try {
            const [rows] = await this.connection.execute(
                `SELECT * FROM transcripcion
                WHERE id_llamada = ? AND estado_registro = 1
                ORDER BY id ASC`,
                [id_llamada]
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener transcripcion: ${error.message}`);
        }
    }

    async create({ id_llamada, speaker, texto, ordinal = null, usuario_registro = null }) {
        try {
            const [result] = await this.connection.execute(
                `INSERT INTO transcripcion
                (id_llamada, speaker, texto, ordinal, estado_registro, usuario_registro)
                VALUES (?, ?, ?, ?, 1, ?)`,
                [
                    id_llamada,
                    speaker,
                    texto,
                    ordinal,
                    usuario_registro
                ]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Error al crear transcripcion: ${error.message}`);
        }
    }

    async deleteByLlamada(id_llamada) {
        try {
            const [result] = await this.connection.execute(
                `DELETE FROM transcripcion WHERE id_llamada = ?`,
                [id_llamada]
            );
            return result.affectedRows;
        } catch (error) {
            throw new Error(`Error al eliminar transcripcion: ${error.message}`);
        }
    }
}

module.exports = TranscripcionModel;
