const { pool } = require("../config/dbConnection.js");

class TranscripcionModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || null;
  }

  async getAll(idLlamada) {
    try {
      const [rows] = await this.connection.execute(
        "SELECT * FROM transcripcion WHERE estado_registro = 1 AND id_llamada = ?",
        [idLlamada]
      );

      return rows.length > 0 ? rows : null;
    } catch (err) {
      throw new Error(`Error al obtener transcripciones: ${err.message}`);
    }
  }

  async createTranscripcion({ idLlamada, speaker, texto }) {
    const [result] = await this.connection.execute(
      "INSERT INTO transcripcion (id_llamada, speaker, texto, estado_registro) VALUES (?, ?, ?, 1)",
      [idLlamada, speaker, texto]
    );

    return result.insertId;
  } catch(err) {
    if (err.code === 'ER_DUP_ENTRY') {
        throw new Error('Ya existe una plantilla con ese nombre');
    }
    throw new Error(`Error al crear transcripcion: ${err.message}`);
  }
}


module.exports = TranscripcionModel;