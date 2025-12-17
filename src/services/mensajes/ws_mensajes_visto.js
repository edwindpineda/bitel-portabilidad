const { pool } = require("../../config/dbConnection.js");

/**
 * Obtener mensajes que han sido marcados como vistos
 * @param {Object} filtros - Filtros opcionales
 * @param {number} filtros.id_contacto - ID del contacto (opcional)
 * @param {number} filtros.limit - Límite de resultados (opcional, por defecto 100)
 * @returns {Promise<Object>} - Lista de mensajes vistos y cantidad
 */
async function getMensajesEnVisto(filtros = {}) {
    try {
        const { id_contacto, direccion = 'out', limit = 100 } = filtros;

        let query = `
            SELECT 
        ultimos_mensajes.id_contacto,
        ultimos_mensajes.respuesta_ia,
        COUNT(*) as total_conversaciones_fallidas
    FROM (
    SELECT 
        c.id as id_contacto,
        m2.contenido as respuesta_ia,
        ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY m2.fecha_hora DESC) as row_num
    FROM mensaje m1
    INNER JOIN mensaje m2 ON m1.wid_mensaje = m2.wid_mensaje
                     AND m1.direccion = 'in'
                     AND m2.direccion = 'out'
    INNER JOIN contacto c ON m1.id_contacto = c.id
                     AND m2.id_contacto = c.id
    WHERE m1.wid_mensaje IS NOT NULL
      AND m2.fecha_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)
) AS ultimos_mensajes
WHERE ultimos_mensajes.row_num = 1
  AND (
    ultimos_mensajes.respuesta_ia NOT LIKE '%adiós%' 
    AND ultimos_mensajes.respuesta_ia NOT LIKE '%hasta luego%'
    AND ultimos_mensajes.respuesta_ia NOT LIKE '%nos vemos%'
    AND ultimos_mensajes.respuesta_ia NOT LIKE '%gracias por contactar%'
    AND ultimos_mensajes.respuesta_ia NOT LIKE '%que tengas buen día%'
    AND ultimos_mensajes.respuesta_ia NOT LIKE '%Cita confirmada%'
    AND ultimos_mensajes.respuesta_ia NOT LIKE '%confirmamos tu cita%'
    AND ultimos_mensajes.respuesta_ia NOT LIKE '%reserva confirmada%'
    AND ultimos_mensajes.respuesta_ia NOT LIKE '%agendamos tu cita%'
    AND ultimos_mensajes.respuesta_ia NOT LIKE '%nos vemos el%'
    AND ultimos_mensajes.respuesta_ia NOT LIKE '%te esperamos%'
    AND ultimos_mensajes.respuesta_ia NOT LIKE '%confirmado%'
    AND ultimos_mensajes.respuesta_ia NOT LIKE '%éxito%'
  )
GROUP BY ultimos_mensajes.id_contacto, ultimos_mensajes.respuesta_ia
ORDER BY total_conversaciones_fallidas DESC;"
        `;

        if (id_contacto) {
            query += ` AND m.id_contacto = ?`;
            params.push(id_contacto);
        }

        // query += ` ORDER BY m.fecha_registro DESC LIMIT ?`;
        // params.push(limit);

        const [rows] = await pool.execute(query);

        return {
            success: true,
            mensajes_en_visto: rows,
            cantidad_mensajes: rows.length
        };

    } catch (error) {
        console.error(`Error al obtener los mensajes en visto: ${error.message}`);
        throw error;
    }
}

module.exports = {
    getMensajesEnVisto
};
