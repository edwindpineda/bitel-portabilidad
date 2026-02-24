const { pool } = require("../config/dbConnection.js");

class TipoPersonaModel {
  constructor(dbConnection = null) {
    this.connection = dbConnection || pool;
  }

  async getAll() {
    const [rows] = await this.connection.execute(
      `SELECT id, nombre, descripcion FROM tipo_persona WHERE estado_registro = 1 ORDER BY id`
    );
    return rows;
  }
}

module.exports = TipoPersonaModel;
