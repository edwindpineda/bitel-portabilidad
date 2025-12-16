const { pool } = require("../config/dbConnection.js");
const logger = require('../config/logger/loggerClient.js');

class TblClienteRestModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async getById(id) {
        const [rows] = await this.connection.execute(
            "SELECT * FROM prospecto WHERE id = ?",
            [id]
        );

        return rows[0];
    }

    async getAllByTipoUsuario(tipo_usuario = 'user', userId = null, rolId = null) {
        logger.info(`[tblProspectos.model.js] getAllByTipoUsuario - tipo_usuario: ${tipo_usuario}, userId: ${userId}, rolId: ${rolId}`);

        let query = `SELECT p.*,
                    e.nombre as estado_nombre,
                    e.color as estado_color,
                    pv.nombre as proveedor_nombre,
                    pt.nombre as plan_nombre,
                    t.nombre as tipificacion_nombre,
                    t.color as tipificacion_color,
                    c.celular as contacto_celular,
                    u.username as asesor_nombre
             FROM prospecto p
             LEFT JOIN estado e ON p.id_estado = e.id
             LEFT JOIN proveedor pv ON p.id_provedor = pv.id
             LEFT JOIN planes_tarifarios pt ON p.id_plan = pt.id
             LEFT JOIN tipificacion t ON p.id_tipificacion = t.id
             LEFT JOIN contacto c ON c.id_prospecto = p.id
             LEFT JOIN usuario u ON p.id_asesor = u.id
             WHERE p.tipo_usuario = ?`;

        const params = [tipo_usuario];

        // Si el rol es >= 3, filtrar solo los prospectos asignados a este asesor
        if (rolId && rolId >= 3 && userId) {
            query += ` AND p.id_asesor = ?`;
            params.push(userId);
            logger.info(`[tblProspectos.model.js] Aplicando filtro id_asesor = ${userId} (rolId: ${rolId})`);
        } else {
            logger.info(`[tblProspectos.model.js] SIN filtro de id_asesor (rolId: ${rolId} - mostrando todos)`);
        }

        query += ` ORDER BY p.created_at DESC`;

        logger.info(`[tblProspectos.model.js] Query final: ${query}`);
        logger.info(`[tblProspectos.model.js] Params: ${JSON.stringify(params)}`);

        const [rows] = await this.connection.execute(query, params);
        logger.info(`[tblProspectos.model.js] Resultados encontrados: ${rows.length}`);
        return rows;
    }

    // Obtener el consumo total de un usuario
    async getConsumoTotal(tipo_usuario) {
        const [rows] = await this.connection.execute(
            'SELECT SUM(count_consumo) AS total_consumo FROM prospecto WHERE tipo_usuario = ?',
            [tipo_usuario]
        );

        return rows.length > 0 ? rows[0].total_consumo : 0;
    }

    /**
     * Busca un registro por fecha y tipo de usuario
     * @param {string} fechaConsumo - Fecha del consumo (formato: YYYY-MM-DD)
     * @param {string} tipo_usuario - Tipo de usuario
     * @returns {Promise<Object|null>} - Objeto del registro o null si no existe
     */
    async selectByFechaAndTipo(fechaConsumo, tipo_usuario) {
        try {
    
            const [rows] = await this.connection.execute(
                'SELECT * FROM prospecto WHERE fecha_consumo = ? AND tipo_usuario = ?',
                [fechaConsumo, tipo_usuario]
            );

            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al buscar registro: ${error.message}`);
        }
    }

    async selectByCelular(phone) {
        try {
    
            const [rows] = await this.connection.execute(
                `SELECT p.*, c.celular as num_contacto
                FROM prospecto p
                INNER JOIN contacto c ON p.id = c.id_prospecto
                WHERE c.celular = ?`,
                [phone]
            );

            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al buscar registro: ${error.message}`);
        }
    }


    /**
     * Crea un nuevo registro de consumo
     * @param {string} fechaConsumo - Fecha del consumo (formato: YYYY-MM-DD)
     * @param {string} tipo_usuario - Tipo de usuario
     * @returns {Promise<number>} - ID del registro creado
     */
    async createProspecto(tipo_usuario, id_estado) {
        try {
            const [result] = await this.connection.execute(
                'INSERT INTO prospecto (tipo_usuario, id_estado) VALUES (?, ?)',
                [tipo_usuario, id_estado]
            );

                const [rows] = await this.connection.execute(
                `SELECT * FROM prospecto WHERE id = ?`,
                [result.insertId]
            );

            return rows[0];
        } catch (error) {
            throw new Error(`Error al crear consumo: ${error.message}`);
        }
    }

    /**
     * Actualiza el contador de consumo para una fecha y tipo de usuario específicos
     * @param {string} fechaConsumo - Fecha del consumo (formato: YYYY-MM-DD)
     * @param {string} tipo_usuario - Tipo de usuario
     * @returns {Promise<boolean>} - true si se actualizó correctamente
     */
    async updateConsumo(fechaConsumo, tipo_usuario) {
        try {
            const [result] = await this.connection.execute(
                'UPDATE prospecto SET count_consumo = count_consumo + 1 WHERE fecha_consumo = ? AND tipo_usuario = ?',
                [fechaConsumo, tipo_usuario]
            );

            if (result.affectedRows === 0) {
                throw new Error('No se pudo actualizar el consumo');
            }

            return true;
        } catch (error) {
            console.log("error", error);
            throw new Error(`Error al actualizar consumo: ${error.message}`);
        }
    }

    async updateEstado(id, id_estado) {
        try {
            const [result] = await this.connection.execute(
                'UPDATE prospecto SET id_estado = ? WHERE id = ?',
                [id_estado, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('No se pudo actualizar el consumo');
            }

            return true;
        } catch (error) {
            console.log("error", error);
            throw new Error(`Error al actualizar consumo: ${error.message}`);
        }
    }

    async updateAsesor(id, id_asesor) {
        try {
            const [result] = await this.connection.execute(
                'UPDATE prospecto SET id_asesor = ? WHERE id = ?',
                [id_asesor, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('No se pudo actualizar el asesor');
            }

            return true;
        } catch (error) {
            console.log("error", error);
            throw new Error(`Error al actualizar asesor: ${error.message}`);
        }
    }

    async updateDatosProspecto(nombre_completo, dni, direccion, id_plan, celular, id_tipificacion, id) {
        try {
            const [result] = await this.connection.execute(
                'UPDATE prospecto SET nombre_completo = ?, dni = ?, direccion = ?, id_plan = ?, celular = ?, id_tipificacion = ? WHERE id = ?',
                [nombre_completo, dni, direccion, id_plan, celular, id_tipificacion, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('No se pudo actualizar el consumo');
            }

            return true;
        } catch (error) {
            console.log("error", error);
            throw new Error(`Error al actualizar datos del prospecto: ${error.message}`);
        }
    }

    async updateProspecto(id, data) {
        try {
            const {
                nombre_completo,
                dni,
                celular,
                direccion,
                id_estado,
                id_provedor,
                id_plan,
                id_tipificacion,
                id_asesor
            } = data;

            const [result] = await this.connection.execute(
                `UPDATE prospecto SET
                    nombre_completo = ?,
                    dni = ?,
                    celular = ?,
                    direccion = ?,
                    id_estado = ?,
                    id_provedor = ?,
                    id_plan = ?,
                    id_tipificacion = ?,
                    id_asesor = ?
                WHERE id = ?`,
                [
                    nombre_completo || null,
                    dni || null,
                    celular || null,
                    direccion || null,
                    id_estado || null,
                    id_provedor || null,
                    id_plan || null,
                    id_tipificacion || null,
                    id_asesor || null,
                    id
                ]
            );

            if (result.affectedRows === 0) {
                throw new Error('Prospecto no encontrado');
            }

            return true;
        } catch (error) {
            logger.error(`[tblProspectos.model.js] Error al actualizar prospecto: ${error.message}`);
            throw new Error(`Error al actualizar prospecto: ${error.message}`);
        }
    }

    /**
     * Obtiene todos los registros de consumo por tipo de usuario
     * @param {string} tipo_usuario - Tipo de usuario
     * @returns {Promise<Array>} - Array de registros de consumo
     */
    async getAllConsumoByTipo(tipo_usuario) {
        try {
            const [rows] = await this.connection.execute(
                'SELECT fecha_consumo, count_consumo FROM prospecto WHERE tipo_usuario = ?',
                [tipo_usuario]
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener consumo por tipo: ${error.message}`);
        }
    }

    /**
     * Obtiene el consumo de un día específico por tipo de usuario
     * @param {string} fechaConsumo - Fecha del consumo (formato: YYYY-MM-DD)
     * @param {string} tipo_usuario - Tipo de usuario
     * @returns {Promise<Object|null>} - Objeto del registro o null si no existe
     */
    async getConsumoByFechaAndTipo(fechaConsumo, tipo_usuario) {
        try {
            const [rows] = await this.connection.execute(
                'SELECT fecha_consumo, count_consumo FROM prospecto WHERE fecha_consumo = ? AND tipo_usuario = ?',
                [fechaConsumo, tipo_usuario]
            );
            
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener consumo por fecha y tipo: ${error.message}`);
        }
    }
}

module.exports = TblClienteRestModel;