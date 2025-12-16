const { pool } = require("../../config/dbConnection.js");

/**
 * Verifica si un contacto tiene el bot activo
 * @param {string} celular - N�mero de celular del contacto
 * @returns {Promise<{exists: boolean, bot_activo: boolean|null}>} - Objeto con el estado del bot
 */
async function isBotActivo(celular) {
    try {
        const [rows] = await pool.execute(
            'SELECT bot_activo FROM contacto WHERE celular = ?',
            [celular]
        );

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
