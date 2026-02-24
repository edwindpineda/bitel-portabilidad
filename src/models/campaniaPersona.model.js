const { pool } = require("../config/dbConnection.js");

class CampaniaPersonaModel {
    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async getByEjecucion(id_campania_ejecucion) {
        try {
            const [rows] = await this.connection.execute(
                `SELECT cp.id, cp.id_campania_ejecucion, cp.id_persona, cp.fecha_registro,
                        p.nombre_completo, p.celular, p.dni, p.id_tipo_persona,
                        tp.nombre AS tipo_persona_nombre
                 FROM campania_persona cp
                 INNER JOIN persona p ON cp.id_persona = p.id
                 LEFT JOIN tipo_persona tp ON p.id_tipo_persona = tp.id
                 WHERE cp.id_campania_ejecucion = ? AND cp.estado_registro = 1
                 ORDER BY cp.fecha_registro DESC`,
                [id_campania_ejecucion]
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener personas de ejecucion: ${error.message}`);
        }
    }

    async addPersonas(id_campania_ejecucion, persona_ids, usuario_registro) {
        try {
            // Evitar duplicados: solo insertar los que no existen ya
            const placeholders = persona_ids.map(() => '?').join(',');
            const [existing] = await this.connection.execute(
                `SELECT id_persona FROM campania_persona
                 WHERE id_campania_ejecucion = ? AND id_persona IN (${placeholders}) AND estado_registro = 1`,
                [id_campania_ejecucion, ...persona_ids]
            );
            const existingIds = existing.map(r => r.id_persona);
            const nuevos = persona_ids.filter(id => !existingIds.includes(id));

            if (nuevos.length === 0) return 0;

            const values = nuevos.map(() => '(?, ?, 1, ?)').join(',');
            const params = nuevos.flatMap(id => [id_campania_ejecucion, id, usuario_registro || null]);
            const [result] = await this.connection.execute(
                `INSERT INTO campania_persona (id_campania_ejecucion, id_persona, estado_registro, usuario_registro)
                 VALUES ${values}`,
                params
            );
            return result.affectedRows;
        } catch (error) {
            throw new Error(`Error al agregar personas a ejecucion: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            const [result] = await this.connection.execute(
                `UPDATE campania_persona SET estado_registro = 0, fecha_actualizacion = NOW() WHERE id = ?`,
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar persona de ejecucion: ${error.message}`);
        }
    }
}

module.exports = CampaniaPersonaModel;
