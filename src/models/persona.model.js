const { pool } = require("../config/dbConnection.js");
const logger = require('../config/logger/loggerClient.js');

class PersonaModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async getById(id) {
        const [rows] = await this.connection.execute(
            "SELECT * FROM persona WHERE id = ? AND estado_registro = 1",
            [id]
        );

        return rows[0];
    }

    async selectByCelular(phone, id_empresa = null) {
        try {
            let query = `SELECT * FROM persona WHERE celular = ? AND estado_registro = 1`;

            const params = [phone];

            if (id_empresa) {
                query += ` AND id_empresa = ?`;
                params.push(id_empresa);
            }

            const [rows] = await this.connection.execute(query, params);

            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al buscar registro: ${error.message}`);
        }
    }


    /**
     * Crea un nuevo registro de persona
     */
    async createPersona({ id_estado, celular, id_usuario, id_empresa, usuario_registro, id_tipo_persona = 1 }) {
        try {
            const [result] = await this.connection.execute(
                'INSERT INTO persona (id_estado, celular, id_usuario, id_empresa, id_tipo_persona, usuario_registro, usuario_actualizacion) VALUES (?, ?, ?, ?, ?, ?, 1)',
                [id_estado, celular, id_usuario, id_empresa, id_tipo_persona, usuario_registro]
            );

            const [rows] = await this.connection.execute(
                `SELECT * FROM persona WHERE id = ? AND estado_registro = 1`,
                [result.insertId]
            );

            return rows[0];
        } catch (error) {
            throw new Error(`Error al crear persona: ${error.message}`);
        }
    }

    static UPDATABLE_FIELDS = [
        'id_estado', 'id_usuario', 'nombre_completo', 'dni', 'direccion',
        'celular', 'id_tipificacion', 'usuario_actualizacion', 'id_empresa', 'id_tipo_persona'
    ];

    async updatePersona(id, data) {
        try {
            const fields = [];
            const values = [];

            for (const [key, value] of Object.entries(data)) {
                if (PersonaModel.UPDATABLE_FIELDS.includes(key)) {
                    fields.push(`${key} = ?`);
                    values.push(value ?? null);
                }
            }

            if (fields.length === 0) {
                throw new Error('No se proporcionaron campos válidos para actualizar');
            }

            values.push(id);

            const query = `UPDATE persona SET ${fields.join(', ')} WHERE id = ?`;
            const [result] = await this.connection.execute(query, values);

            if (result.affectedRows === 0) {
                throw new Error('Persona no encontrada');
            }

            return true;
        } catch (error) {
            logger.error(`[persona.model.js] Error al actualizar persona: ${error.message}`);
            throw new Error(`Error al actualizar persona: ${error.message}`);
        }
    }

    /**
     * Obtiene todas las personas filtradas por tipo_usuario, con filtros de rol y empresa
     */
    async getAllByTipoUsuario(tipoUsuario, userId = null, rolId = null, idEmpresa = null) {
        try {
            let query = `
                SELECT p.*, e.nombre as estado_nombre, e.color as estado_color,
                       t.nombre as tipificacion_nombre
                FROM persona p
                LEFT JOIN estado e ON e.id = p.id_estado
                LEFT JOIN tipificacion t ON t.id = p.id_tipificacion
                WHERE p.estado_registro = 1 AND p.tipo_usuario = ?`;
            const params = [tipoUsuario];

            if (idEmpresa) {
                query += ' AND p.id_empresa = ?';
                params.push(idEmpresa);
            }

            if (rolId && rolId >= 3 && userId) {
                query += ' AND p.id_asesor = ?';
                params.push(userId);
            }

            query += ' ORDER BY p.fecha_registro DESC';

            const [rows] = await this.connection.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener personas: ${error.message}`);
        }
    }

    async getAsignacionesAsesor() {
        try {
            const [rows] = await this.connection.execute(
                'SELECT id_usuario FROM persona WHERE estado_registro = 1 ORDER BY fecha_registro DESC LIMIT 1',
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener asignaciones por tipo: ${error.message}`);
        }
    }
}

module.exports = new PersonaModel();
