const { pool } = require("../../config/dbConnection.js");

/**
 * Verifica si un contacto tiene el bot activo
 * @param {string} celular - Numero de celular del contacto
 * @param {number|null} id_empresa - ID de la empresa para filtrar
 * @returns {Promise<{exists: boolean, bot_activo: boolean|null}>} - Objeto con el estado del bot
 */
async function isBotActivo(celular, id_empresa = null) {
    try {
        let query = `
            SELECT c.bot_activo
            FROM contacto c
            INNER JOIN prospecto p ON c.id_prospecto = p.id
            WHERE c.celular = ?
        `;
        const params = [celular];

        if (id_empresa) {
            query += ' AND p.id_empresa = ?';
            params.push(id_empresa);
        }

        const [rows] = await pool.execute(query, params);

        if (rows.length === 0) {
            return { exists: true, bot_activo: 1 };
        }

        return {
            exists: true,
            bot_activo: rows[0].bot_activo
        };
    } catch (error) {
        console.error(`[ws_contacto] Error al verificar bot_activo: ${error.message}`);
        throw error;
    }
}

module.exports = {
    isBotActivo
};
