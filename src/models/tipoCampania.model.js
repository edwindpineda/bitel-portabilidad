const { pool } = require("../config/dbConnection.js");

/**
 * TipoCampaniaModel
 * Nota: tipo_campania ya no tiene id_empresa
 * Solo existen 2 tipos fijos: id=1 (Llamadas), id=2 (WhatsApp)
 */
class TipoCampaniaModel {
    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async getAll() {
        try {
            const query = `SELECT * FROM tipo_campania WHERE estado_registro = 1 ORDER BY id ASC`;
            const [rows] = await this.connection.execute(query);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener tipos de campania: ${error.message}`);
        }
    }

    async getById(id) {
        try {
            const [rows] = await this.connection.execute(
                `SELECT * FROM tipo_campania WHERE id = ? AND estado_registro = 1`,
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener tipo de campania: ${error.message}`);
        }
    }

    // Los métodos create, update, delete están deshabilitados
    // ya que los tipos de campaña son fijos (1=Llamadas, 2=WhatsApp)
}

module.exports = TipoCampaniaModel;
