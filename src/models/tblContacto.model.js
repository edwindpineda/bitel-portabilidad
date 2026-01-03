const { pool } = require("../config/dbConnection.js");

class TblContactoModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    /**
     * Verifica si existe un contacto por su número de celular
     * @param {string} celular - Número de celular a verificar
     * @returns {Promise<boolean>} - true si existe, false si no
     */
    async existsByCelular(celular, id_cliente_rest) {
        try {
            const [rows] = await this.connection.execute(
                'SELECT COUNT(*) as count FROM contacto WHERE celular = ? AND id_prospecto = ?',
                [celular, id_cliente_rest]
            );
            return rows[0].count > 0;
        } catch (error) {
            throw new Error(`Error al verificar existencia del contacto: ${error.message}`);
        }
    }

    /**
     * Obtiene un contacto por su número de celular
     * @param {string} celular - Número de celular del contacto
     * @param {number|null} id_empresa - ID de la empresa para filtrar
     * @returns {Promise<Object|null>} - Objeto del contacto o null si no existe
     */
    async getByCelular(celular, id_empresa = null) {
        try {
            let query = `SELECT c.* FROM contacto c
                INNER JOIN prospecto p ON c.id_prospecto = p.id
                WHERE c.celular = ?`;

            const params = [celular];

            if (id_empresa) {
                query += ` AND p.id_empresa = ?`;
                params.push(id_empresa);
            }

            const [rows] = await this.connection.execute(query, params);
            return rows.length > 0 ? rows[0].id : null;
        } catch (error) {
            throw new Error(`Error al obtener contacto por celular: ${error.message}`);
        }
    }

    async getAll(offset, id_asesor = null, id_estado = null, id_tipificacion = null, id_tipificacion_asesor = null, userId = null, id_empresa = null) {
        try {
            let query = `SELECT
                    c.id,
                    c.celular,
                    c.bot_activo,
                    c.id_prospecto,
                    p.nombre_completo,
                    p.dni,
                    p.direccion,
                    p.id_estado,
                    p.id_provedor,
                    p.id_plan,
                    p.id_tipificacion,
                    p.id_tipificacion_asesor,
                    e.nombre as estado_nombre,
                    e.color as estado_color,
                    t.nombre as tipificacion_nombre,
                    t.color as tipificacion_color,
                    (SELECT MAX(m.fecha_registro) FROM mensaje m WHERE m.id_contacto = c.id) as ultimo_mensaje,
                    (SELECT MAX(m2.id) FROM mensaje m2 WHERE m2.id_contacto = c.id AND m2.estado_registro = 1) as ultimo_mensaje_id,
                    (SELECT mvu.id_mensaje FROM mensaje_visto_usuario mvu WHERE mvu.id_contacto = c.id AND mvu.id_usuario = ?) as ultimo_visto_id,
                    (SELECT COUNT(*) FROM mensaje m3 WHERE m3.id_contacto = c.id AND m3.estado_registro = 1
                        AND m3.id > COALESCE((SELECT mvu2.id_mensaje FROM mensaje_visto_usuario mvu2 WHERE mvu2.id_contacto = c.id AND mvu2.id_usuario = ?), 0)) as mensajes_no_leidos
                FROM contacto c
                LEFT JOIN prospecto p ON p.id = c.id_prospecto
                LEFT JOIN estado e ON e.id = p.id_estado
                LEFT JOIN tipificacion t ON t.id = p.id_tipificacion`;

            const params = [userId || 0, userId || 0];
            const conditions = [];

            // Filtrar por empresa del usuario
            if (id_empresa !== null && id_empresa !== undefined) {
                conditions.push(`p.id_empresa = ?`);
                params.push(id_empresa);
            }

            if (id_asesor !== null) {
                conditions.push(`p.id_asesor = ?`);
                params.push(id_asesor);
            }

            if (id_estado !== null) {
                conditions.push(`p.id_estado = ?`);
                params.push(id_estado);
            }

            if (id_tipificacion !== null) {
                conditions.push(`p.id_tipificacion = ?`);
                params.push(id_tipificacion);
            }

            if (id_tipificacion_asesor !== null) {
                conditions.push(`p.id_tipificacion_asesor = ?`);
                params.push(id_tipificacion_asesor);
            }

            if (conditions.length > 0) {
                query += ` WHERE ` + conditions.join(' AND ');
            }

            query += ` ORDER BY ultimo_mensaje DESC, c.id DESC LIMIT 20 OFFSET ?`;
            params.push(offset);

            const [rows] = await this.connection.execute(query, params);

            // Agregar indicador de no leidos
            return rows.map(row => ({
                ...row,
                tiene_no_leidos: row.ultimo_mensaje_id && (!row.ultimo_visto_id || row.ultimo_mensaje_id > row.ultimo_visto_id)
            }));
        } catch (error) {
            throw new Error(`Error al obtener contactos: ${error.message}`);
        }
    }

    async getTotal(id_asesor = null, id_estado = null, id_tipificacion = null, id_tipificacion_asesor = null, id_empresa = null) {
        try {
            let query = 'SELECT COUNT(*) as total FROM contacto c LEFT JOIN prospecto p ON p.id = c.id_prospecto';
            const params = [];
            const conditions = [];

            // Filtrar por empresa del usuario
            if (id_empresa !== null && id_empresa !== undefined) {
                conditions.push('p.id_empresa = ?');
                params.push(id_empresa);
            }

            if (id_asesor !== null) {
                conditions.push('p.id_asesor = ?');
                params.push(id_asesor);
            }

            if (id_estado !== null) {
                conditions.push('p.id_estado = ?');
                params.push(id_estado);
            }

            if (id_tipificacion !== null) {
                conditions.push('p.id_tipificacion = ?');
                params.push(id_tipificacion);
            }

            if (id_tipificacion_asesor !== null) {
                conditions.push('p.id_tipificacion_asesor = ?');
                params.push(id_tipificacion_asesor);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            const [rows] = await this.connection.execute(query, params);
            return rows[0].total;
        } catch (error) {
            throw new Error(`Error al obtener total de contactos: ${error.message}`);
        }
    }

    async search(query, offset = 0, id_asesor = null, id_estado = null, id_tipificacion = null, id_tipificacion_asesor = null, userId = null, id_empresa = null) {
        try {
            const searchTerm = `%${query}%`;
            const offsetNum = parseInt(offset, 10) || 0;

            let sqlQuery = `SELECT
                    c.id,
                    c.celular,
                    c.bot_activo,
                    c.id_prospecto,
                    p.nombre_completo,
                    p.dni,
                    p.direccion,
                    p.id_estado,
                    p.id_provedor,
                    p.id_plan,
                    p.id_tipificacion,
                    p.id_tipificacion_asesor,
                    e.nombre as estado_nombre,
                    e.color as estado_color,
                    t.nombre as tipificacion_nombre,
                    t.color as tipificacion_color,
                    (SELECT MAX(m.fecha_registro) FROM mensaje m WHERE m.id_contacto = c.id) as ultimo_mensaje,
                    (SELECT MAX(m2.id) FROM mensaje m2 WHERE m2.id_contacto = c.id AND m2.estado_registro = 1) as ultimo_mensaje_id,
                    (SELECT mvu.id_mensaje FROM mensaje_visto_usuario mvu WHERE mvu.id_contacto = c.id AND mvu.id_usuario = ?) as ultimo_visto_id,
                    (SELECT COUNT(*) FROM mensaje m3 WHERE m3.id_contacto = c.id AND m3.estado_registro = 1
                        AND m3.id > COALESCE((SELECT mvu2.id_mensaje FROM mensaje_visto_usuario mvu2 WHERE mvu2.id_contacto = c.id AND mvu2.id_usuario = ?), 0)) as mensajes_no_leidos
                FROM contacto c
                LEFT JOIN prospecto p ON p.id = c.id_prospecto
                LEFT JOIN estado e ON e.id = p.id_estado
                LEFT JOIN tipificacion t ON t.id = p.id_tipificacion
                WHERE (c.celular LIKE ? OR p.nombre_completo LIKE ?)`;

            const params = [userId || 0, userId || 0, searchTerm, searchTerm];

            // Filtrar por empresa del usuario
            if (id_empresa !== null && id_empresa !== undefined) {
                sqlQuery += ` AND p.id_empresa = ?`;
                params.push(id_empresa);
            }

            if (id_asesor !== null) {
                sqlQuery += ` AND p.id_asesor = ?`;
                params.push(id_asesor);
            }

            if (id_estado !== null) {
                sqlQuery += ` AND p.id_estado = ?`;
                params.push(id_estado);
            }

            if (id_tipificacion !== null) {
                sqlQuery += ` AND p.id_tipificacion = ?`;
                params.push(id_tipificacion);
            }

            if (id_tipificacion_asesor !== null) {
                sqlQuery += ` AND p.id_tipificacion_asesor = ?`;
                params.push(id_tipificacion_asesor);
            }

            sqlQuery += ` ORDER BY ultimo_mensaje DESC, c.id DESC LIMIT 20 OFFSET ?`;
            params.push(offsetNum);

            const [rows] = await this.connection.query(sqlQuery, params);

            // Agregar indicador de no leidos
            return rows.map(row => ({
                ...row,
                tiene_no_leidos: row.ultimo_mensaje_id && (!row.ultimo_visto_id || row.ultimo_mensaje_id > row.ultimo_visto_id)
            }));
        } catch (error) {
            throw new Error(`Error al buscar contactos: ${error.message}`);
        }
    }

    async getSearchTotal(query, id_asesor = null, id_estado = null, id_tipificacion = null, id_tipificacion_asesor = null, id_empresa = null) {
        try {
            const searchTerm = `%${query}%`;

            let sqlQuery = `SELECT COUNT(*) as total
                 FROM contacto c
                 LEFT JOIN prospecto p ON p.id = c.id_prospecto
                 WHERE (c.celular LIKE ? OR p.nombre_completo LIKE ?)`;

            const params = [searchTerm, searchTerm];

            // Filtrar por empresa del usuario
            if (id_empresa !== null && id_empresa !== undefined) {
                sqlQuery += ` AND p.id_empresa = ?`;
                params.push(id_empresa);
            }

            if (id_asesor !== null) {
                sqlQuery += ` AND p.id_asesor = ?`;
                params.push(id_asesor);
            }

            if (id_estado !== null) {
                sqlQuery += ` AND p.id_estado = ?`;
                params.push(id_estado);
            }

            if (id_tipificacion !== null) {
                sqlQuery += ` AND p.id_tipificacion = ?`;
                params.push(id_tipificacion);
            }

            if (id_tipificacion_asesor !== null) {
                sqlQuery += ` AND p.id_tipificacion_asesor = ?`;
                params.push(id_tipificacion_asesor);
            }

            const [rows] = await this.connection.execute(sqlQuery, params);
            return rows[0].total;
        } catch (error) {
            throw new Error(`Error al obtener total de búsqueda: ${error.message}`);
        }
    }

    /**
     * Crea un nuevo contacto
     * @param {string} celular - Número de celular del contacto
     * @returns {Promise<Object>} - Objeto del contacto creado
     */
    async create(celular, id_cliente_rest) {
        try {
            const [result] = await this.connection.execute(
                'INSERT INTO contacto (celular, id_prospecto) VALUES (?, ?)',
                [celular, id_cliente_rest]
            );
            return result.insertId;
            
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('El número de celular ya existe en la base de datos');
            }
            throw new Error(`Error al crear contacto: ${error.message}`);
        }
    }

    /**
     * Incrementa el contador de un contacto por su número de celular
     * @param {string} celular - Número de celular del contacto
     * @returns {Promise<Object>} - Objeto con el nuevo valor del contador
     */
    async incrementCountByCelular(celular, id_cliente_rest) {
        try {
            // Primero verificamos que el contacto existe
            const contact = await this.getByCelular(celular, id_cliente_rest);
            if (!contact) {
                throw new Error('El contacto no existe');
            }

            // Incrementamos el contador
            const [result] = await this.connection.execute(
                'UPDATE contacto SET count = count + 1 WHERE celular = ? AND id_prospecto = ?',
                [celular, id_cliente_rest]
            );

            if (result.affectedRows === 0) {
                throw new Error('No se pudo actualizar el contador');
            }

            
        } catch (error) {
            throw new Error(`Error al incrementar contador del contacto: ${error.message}`);
        }
    }

    /**
     * Incrementa el contador incr_count de un contacto por su ID
     * @param {number} id - ID del contacto
     * @returns {Promise<Object>} - Objeto con el nuevo valor del contador incr_count
     */
    async incrementIncrCountById(id) {
        try {
            // Incrementamos el contador incr_count directamente por ID
            const [result] = await this.connection.execute(
                'UPDATE contacto SET incr_count = incr_count + 1 WHERE id = ?',
                [id]
            );
            

            if (result.affectedRows === 0) {
                throw new Error('No se pudo actualizar el contador incr_count - contacto no encontrado');
            }

            
        } catch (error) {
            throw new Error(`Error al incrementar contador incr_count del contacto: ${error.message}`);
        }
    }

    /**
     * Resetea el contador de un contacto a cero por su número de celular
     * @param {string} celular - Número de celular del contacto
     * @returns {Promise<Object>} - Objeto con el contador reseteado
     */
    async resetCountByCelular(celular, id_cliente_rest) {
        try {
            // Primero verificamos que el contacto existe
            const contact = await this.getByCelular(celular, id_cliente_rest);
            if (!contact) {
                throw new Error('El contacto no existe');
            }

            // Reseteamos el contador a cero
            const [result] = await this.connection.execute(
                'UPDATE contacto SET count = 0 WHERE celular = ? AND id_prospecto = ?',
                [celular, id_cliente_rest]
            );

            if (result.affectedRows === 0) {
                throw new Error('No se pudo resetear el contador');
            }

            
        } catch (error) {
            throw new Error(`Error al resetear contador del contacto: ${error.message}`);
        }
    }

    async toggleBotActivo(id) {
        try {
            const [result] = await this.connection.execute(
                'UPDATE contacto SET bot_activo = IF(bot_activo = 1, 0, 1) WHERE id = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                throw new Error('Contacto no encontrado');
            }

            const [rows] = await this.connection.execute(
                'SELECT bot_activo FROM contacto WHERE id = ?',
                [id]
            );

            return rows[0]?.bot_activo;
        } catch (error) {
            throw new Error(`Error al cambiar estado del bot: ${error.message}`);
        }
    }
}

module.exports = TblContactoModel;
