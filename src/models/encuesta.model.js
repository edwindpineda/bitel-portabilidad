const { pool } = require("../config/dbConnection.js");

class EncuestaModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll() {
    const [rows] = await this.connection.execute(
      `SELECT e.*, ebn.departamento, ebn.municipio, ebn.referente, ebn.estado_llamada
       FROM encuesta e
       LEFT JOIN encuesta_base_numero ebn ON e.id_encuesta_base_numero = ebn.id
       WHERE ebn.estado_llamada = 3
       ORDER BY e.id`
    );
    return rows;
  }

  async getDepartamentos() {
    const [rows] = await this.connection.execute(
      `SELECT DISTINCT departamento
       FROM encuesta_base_numero
       WHERE departamento IS NOT NULL AND departamento != ''
       ORDER BY departamento`
    );
    return rows.map(r => r.departamento);
  }

  async getMunicipios(departamento = null) {
    let query = `SELECT DISTINCT municipio
       FROM encuesta_base_numero
       WHERE municipio IS NOT NULL AND municipio != ''`;

    const params = [];
    if (departamento) {
      query += ` AND departamento = ?`;
      params.push(departamento);
    }

    query += ` ORDER BY municipio`;

    const [rows] = await this.connection.execute(query, params);
    return rows.map(r => r.municipio);
  }

  async getById(id) {
    const [rows] = await this.connection.execute(
      `SELECT *
       FROM encuesta WHERE id_encuesta_base_numero = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create({nombre_contacto, participacion_encuesta, p1_piensa_votar, p2_intencion_voto, p2_observaciones, p3a_sabe_como_votar, p3a_refuerzo_pedagogico, p3b_conoce_candidato, p4_autoriza_whatsapp, whatsapp_contacto, notas_adicionales, id_encuesta_base_numero}) {
    const [result] = await this.connection.execute(
      `INSERT INTO encuesta (nombre_contacto, participacion, p1_piensa_votar, p2_intencion_voto, p2_observaciones, p3a_sabe_como_votar, p3a_refuerzo_pedagogico, p3b_conoce_candidato, p4_autoriza_whatsapp, whatsapp_contacto, notas_adicionales, id_encuesta_base_numero)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre_contacto, participacion_encuesta, p1_piensa_votar, p2_intencion_voto, p2_observaciones, p3a_sabe_como_votar, p3a_refuerzo_pedagogico, p3b_conoce_candidato, p4_autoriza_whatsapp, whatsapp_contacto, notas_adicionales, id_encuesta_base_numero]
    );
    return result.insertId;
  }
}

module.exports = EncuestaModel;
