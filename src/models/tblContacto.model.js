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
     * @returns {Promise<Object|null>} - Objeto del contacto o null si no existe
     */
    async getByCelular(celular, id_cliente_rest) {
        try {
            const [rows] = await this.connection.execute(
                'SELECT * FROM contacto WHERE celular = ? AND id_prospecto = ?',
                [celular, id_cliente_rest]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener contacto por celular: ${error.message}`);
        }
    }

    async getAll() {
        try {
            const [rows] = await this.connection.execute(
                'SELECT contacto FROM contacto'
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener contacto por celular: ${error.message}`);
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

    
}

module.exports = TblContactoModel;