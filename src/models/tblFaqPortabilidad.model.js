const { pool } = require("../config/dbConnection.js");

class TblFaqPortabilidadModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    /**
     * Obtiene todas las FAQs activas
     * @returns {Promise<Array>} - Array de FAQs
     */
    async getAllActivas() {
        try {
            const [rows] = await this.connection.execute(
                'SELECT * FROM faq_portabilidad WHERE activo = 1 ORDER BY numero ASC'
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener FAQs activas: ${error.message}`);
        }
    }

    /**
     * Obtiene todas las FAQs (activas e inactivas)
     * @returns {Promise<Array>} - Array de FAQs
     */
    async getAll() {
        try {
            const [rows] = await this.connection.execute(
                'SELECT * FROM faq_portabilidad ORDER BY numero ASC'
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener FAQs: ${error.message}`);
        }
    }

    /**
     * Obtiene FAQs por proceso/etapa de venta
     * @param {string} proceso - 'Contacto', 'Toma de datos', 'Oferta', 'Cierre de ventas', 'Cierre de ventas (Contrato)', 'Aceptación'
     * @returns {Promise<Array>} - Array de FAQs del proceso especificado
     */
    async getByProceso(proceso) {
        try {
            const [rows] = await this.connection.execute(
                'SELECT * FROM faq_portabilidad WHERE proceso = ? AND activo = 1 ORDER BY numero ASC',
                [proceso]
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener FAQs por proceso: ${error.message}`);
        }
    }

    /**
     * Obtiene una FAQ por ID
     * @param {number} id - ID de la FAQ
     * @returns {Promise<Object|null>} - Objeto de la FAQ o null si no existe
     */
    async getById(id) {
        try {
            const [rows] = await this.connection.execute(
                'SELECT * FROM faq_portabilidad WHERE id = ?',
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener FAQ por ID: ${error.message}`);
        }
    }

    /**
     * Busca FAQs por texto en pregunta o respuesta
     * @param {string} texto - Texto a buscar
     * @returns {Promise<Array>} - Array de FAQs que coinciden
     */
    async search(texto) {
        try {
            const [rows] = await this.connection.execute(
                `SELECT * FROM faq_portabilidad
                 WHERE activo = 1 AND (pregunta LIKE ? OR respuesta LIKE ?)
                 ORDER BY numero ASC`,
                [`%${texto}%`, `%${texto}%`]
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al buscar FAQs: ${error.message}`);
        }
    }

    /**
     * Crea una nueva FAQ
     * @param {Object} faq - Datos de la FAQ
     * @returns {Promise<number>} - ID de la FAQ creada
     */
    async create({ numero, pregunta, proceso, respuesta, activo = 1 }) {
        try {
            const [result] = await this.connection.execute(
                `INSERT INTO faq_portabilidad (numero, pregunta, proceso, respuesta, activo)
                 VALUES (?, ?, ?, ?, ?)`,
                [numero, pregunta, proceso, respuesta, activo]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Error al crear FAQ: ${error.message}`);
        }
    }

    /**
     * Actualiza una FAQ
     * @param {number} id - ID de la FAQ
     * @param {Object} faq - Datos a actualizar
     * @returns {Promise<boolean>} - true si se actualizó correctamente
     */
    async update(id, { numero, pregunta, proceso, respuesta, activo }) {
        try {
            const [result] = await this.connection.execute(
                `UPDATE faq_portabilidad
                 SET numero = ?, pregunta = ?, proceso = ?, respuesta = ?, activo = ?
                 WHERE id = ?`,
                [numero, pregunta, proceso, respuesta, activo, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar FAQ: ${error.message}`);
        }
    }

    /**
     * Desactiva una FAQ (soft delete)
     * @param {number} id - ID de la FAQ
     * @returns {Promise<boolean>} - true si se desactivó correctamente
     */
    async softDelete(id) {
        try {
            const [result] = await this.connection.execute(
                'UPDATE faq_portabilidad SET activo = 0 WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al desactivar FAQ: ${error.message}`);
        }
    }

    /**
     * Elimina una FAQ permanentemente
     * @param {number} id - ID de la FAQ
     * @returns {Promise<boolean>} - true si se eliminó correctamente
     */
    async delete(id) {
        try {
            const [result] = await this.connection.execute(
                'DELETE FROM faq_portabilidad WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar FAQ: ${error.message}`);
        }
    }

    /**
     * Obtiene las FAQs formateadas para el prompt del sistema
     * @returns {Promise<string>} - String con las FAQs formateadas
     */
    async getFaqsFormatted() {
        try {
            const faqs = await this.getAllActivas();

            if (!faqs || faqs.length === 0) {
                return "No hay FAQs disponibles.";
            }

            const faqsFormatted = faqs.map(faq => {
                return `**Pregunta ${faq.numero}** (${faq.proceso}):
P: ${faq.pregunta}
R: ${faq.respuesta}`;
            }).join("\n\n");

            return faqsFormatted;
        } catch (error) {
            throw new Error(`Error al formatear FAQs: ${error.message}`);
        }
    }
}

module.exports = TblFaqPortabilidadModel;
