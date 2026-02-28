const { pool } = require("../config/dbConnection.js");

class EncuestaModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll(prioridad = null) {
    let whereClause = 'WHERE ebn.estado_llamada = 3 AND ebn.prioridad IN (1, 2, 3)';
    const params = [];

    if (prioridad !== null && prioridad !== 'todos') {
      whereClause += ' AND ebn.prioridad = ?';
      params.push(String(prioridad));
    }

    const [rows] = await this.connection.execute(
      `SELECT e.*,
       ebn.telefono AS telefono_base,
       ebn.nombre AS nombre_base,
       ebn.apellido AS apellido_base,
       ebn.departamento AS departamento_base,
       ebn.municipio AS municipio_base,
       ebn.referente AS referente_base,
       ebn.estado_llamada,
       ebn.prioridad
       FROM encuesta e
       INNER JOIN encuesta_base_numero ebn ON e.id_encuesta_base_numero = ebn.id
       ${whereClause}
       ORDER BY e.id`,
      params
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
