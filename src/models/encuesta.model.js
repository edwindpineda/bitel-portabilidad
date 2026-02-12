const { pool } = require("../config/dbConnection.js");

class EncuestaModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll() {
    const [rows] = await this.connection.execute(
      `SELECT *
       FROM encuesta ORDER BY id`
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await this.connection.execute(
      `SELECT *
       FROM encuesta WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create({nombre_contacto, participacion_encuesta, p1_piensa_votar, p2_intencion_voto, p2_observaciones, p3a_sabe_como_votar, p3a_refuerzo_pedagogico, p3b_conoce_candidato, p4_autoriza_whatsapp, whatsapp_contacto, notas_adicionales}) {
    const [result] = await this.connection.execute(
      `INSERT INTO encuesta (nombre_contacto, participacion, p1_piensa_votar, p2_intencion_voto, p2_observaciones, p3a_sabe_como_votar, p3a_refuerzo_pedagogico, p3b_conoce_candidato, p4_autoriza_whatsapp, whatsapp_contacto, notas_adicionales)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre_contacto, participacion_encuesta, p1_piensa_votar, p2_intencion_voto, p2_observaciones, p3a_sabe_como_votar, p3a_refuerzo_pedagogico, p3b_conoce_candidato, p4_autoriza_whatsapp, whatsapp_contacto, notas_adicionales]
    );
    return result.insertId;
  }
}

module.exports = EncuestaModel;
