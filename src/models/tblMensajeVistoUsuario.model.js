const { pool } = require("../config/dbConnection.js");

class TblMensajeVistoUsuarioModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    /**
     * Marca un mensaje como visto para un usuario
     * @param {number} idUsuario - ID del usuario
     * @param {number} idMensaje - ID del mensaje visto
     * @param {number} idContacto - ID del contacto
     */
    async markAsRead(idUsuario, idMensaje, idContacto) {
        try {
            // Verificar si ya existe un registro para este mensaje y usuario
            const [existing] = await this.connection.execute(
                'SELECT id FROM mensaje_visto_usuario WHERE id_usuario = ? AND id_mensaje = ?',
                [idUsuario, idMensaje]
            );

            if (existing.length === 0) {
                // Insertar nuevo registro con id_contacto
                await this.connection.execute(
                    'INSERT INTO mensaje_visto_usuario (id_usuario, id_contacto, id_mensaje, fecha_visto) VALUES (?, ?, ?, NOW())',
                    [idUsuario, idContacto, idMensaje]
                );
            }

            return true;
        } catch (error) {
            throw new Error(`Error al marcar mensaje como visto: ${error.message}`);
        }
    }

    /**
     * Guarda solo el ultimo mensaje visto para un contacto (upsert)
     * @param {number} idUsuario - ID del usuario
     * @param {number} idContacto - ID del contacto
     * @param {number} idMensaje - ID del ultimo mensaje visto
     */
    async saveLastSeenMessage(idUsuario, idContacto, idMensaje) {
        try {
            // Verificar si ya existe un registro para este usuario y contacto
            const [existing] = await this.connection.execute(
                'SELECT id, id_mensaje FROM mensaje_visto_usuario WHERE id_usuario = ? AND id_contacto = ?',
                [idUsuario, idContacto]
            );

            if (existing.length > 0) {
                // Si el mensaje nuevo es mayor, actualizar
                if (idMensaje > existing[0].id_mensaje) {
                    await this.connection.execute(
                        'UPDATE mensaje_visto_usuario SET id_mensaje = ?, fecha_visto = NOW() WHERE id = ?',
                        [idMensaje, existing[0].id]
                    );
                }
            } else {
                // Insertar nuevo registro
                await this.connection.execute(
                    'INSERT INTO mensaje_visto_usuario (id_usuario, id_contacto, id_mensaje, fecha_visto) VALUES (?, ?, ?, NOW())',
                    [idUsuario, idContacto, idMensaje]
                );
            }

            return true;
        } catch (error) {
            throw new Error(`Error al guardar ultimo mensaje visto: ${error.message}`);
        }
    }

    /**
     * Marca todos los mensajes de un contacto como vistos para un usuario (hasta un mensaje específico)
     * DEPRECATED: Usar saveLastSeenMessage en su lugar
     * @param {number} idUsuario - ID del usuario
     * @param {number} idContacto - ID del contacto
     * @param {number} idMensajeHasta - ID del último mensaje a marcar como visto
     */
    async markAllAsReadForContact(idUsuario, idContacto, idMensajeHasta) {
        // Ahora simplemente guardamos el ultimo mensaje visto
        return this.saveLastSeenMessage(idUsuario, idContacto, idMensajeHasta);
    }

    /**
     * Obtiene el conteo de contactos con mensajes no leidos para un usuario
     * Usa id_contacto para comparar el ultimo mensaje visto con el ultimo mensaje del contacto
     * @param {number} idUsuario - ID del usuario
     * @param {number|null} idAsesor - ID del asesor (para filtrar por prospecto asignado)
     * @param {number|null} idEmpresa - ID de la empresa del usuario
     * @returns {Promise<number>} - Cantidad de contactos con mensajes no leidos
     */
    async getUnreadContactsCount(idUsuario, idAsesor = null, idEmpresa = null) {
        try {
            // Subconsulta para obtener el ultimo mensaje de cada contacto
            let query = `
                SELECT COUNT(DISTINCT c.id) as unread_count
                FROM contacto c
                LEFT JOIN persona p ON p.id = c.id_persona
                LEFT JOIN (
                    SELECT id_contacto, MAX(id) as ultimo_mensaje_id
                    FROM mensaje
                    WHERE estado_registro = 1
                    GROUP BY id_contacto
                ) ultimo_msg ON ultimo_msg.id_contacto = c.id
                LEFT JOIN mensaje_visto_usuario mvu ON mvu.id_contacto = c.id AND mvu.id_usuario = ?
                WHERE ultimo_msg.ultimo_mensaje_id IS NOT NULL
                AND (mvu.id_mensaje IS NULL OR mvu.id_mensaje < ultimo_msg.ultimo_mensaje_id)
            `;

            const params = [idUsuario];

            // Filtrar por empresa del usuario
            if (idEmpresa !== null && idEmpresa !== undefined) {
                query += ` AND p.id_empresa = ?`;
                params.push(idEmpresa);
            }

            if (idAsesor !== null) {
                query += ` AND p.id_asesor = ?`;
                params.push(idAsesor);
            }

            const [rows] = await this.connection.execute(query, params);
            return rows[0]?.unread_count || 0;
        } catch (error) {
            throw new Error(`Error al obtener contactos no leidos: ${error.message}`);
        }
    }

    /**
     * Verifica si un contacto tiene mensajes no leidos para un usuario
     * Compara el ultimo mensaje del contacto con el ultimo mensaje visto
     * @param {number} idUsuario - ID del usuario
     * @param {number} idContacto - ID del contacto
     * @returns {Promise<boolean>} - true si tiene mensajes no leidos
     */
    async hasUnreadMessages(idUsuario, idContacto) {
        try {
            const [rows] = await this.connection.execute(`
                SELECT
                    COALESCE((SELECT MAX(id) FROM mensaje WHERE id_contacto = ? AND estado_registro = 1), 0) as ultimo_mensaje,
                    COALESCE((SELECT id_mensaje FROM mensaje_visto_usuario WHERE id_usuario = ? AND id_contacto = ?), 0) as ultimo_visto
            `, [idContacto, idUsuario, idContacto]);

            const ultimoMensaje = rows[0]?.ultimo_mensaje || 0;
            const ultimoVisto = rows[0]?.ultimo_visto || 0;

            return ultimoMensaje > ultimoVisto;
        } catch (error) {
            throw new Error(`Error al verificar mensajes no leidos: ${error.message}`);
        }
    }

    /**
     * Obtiene el ultimo mensaje visto por un usuario para un contacto
     * @param {number} idUsuario - ID del usuario
     * @param {number} idContacto - ID del contacto
     * @returns {Promise<number|null>} - ID del ultimo mensaje visto o null
     */
    async getLastSeenMessage(idUsuario, idContacto) {
        try {
            const [rows] = await this.connection.execute(
                'SELECT id_mensaje FROM mensaje_visto_usuario WHERE id_usuario = ? AND id_contacto = ?',
                [idUsuario, idContacto]
            );

            return rows[0]?.id_mensaje || null;
        } catch (error) {
            throw new Error(`Error al obtener ultimo mensaje visto: ${error.message}`);
        }
    }
}

module.exports = TblMensajeVistoUsuarioModel;
