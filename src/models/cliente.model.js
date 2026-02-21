const { pool } = require("../config/dbConnection.js");

class ClienteModel {

    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async create({ nombre_completo, celular, plan_adquirido, mes_vencido, razon_no_pago, num_tarjeta }) {
        try {
            const [result] = await this.connection.execute(
                `INSERT INTO cliente (nombre_completo, celular, plan_adquirido, mes_vencido, razon_no_pago, num_tarjeta)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [nombre_completo, celular, plan_adquirido, mes_vencido, razon_no_pago, num_tarjeta]
            );

            return result.insertId;
        } catch (error) {
            throw new Error(`Error al crear cliente: ${error.message}`);
        }
    }

    async findById(id) {
        try {
            const [rows] = await this.connection.execute(
                "SELECT * FROM cliente WHERE id = ?",
                [id]
            );

            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al buscar cliente por id: ${error.message}`);
        }
    }

    async findByCelular(celular) {
        try {
            const [rows] = await this.connection.execute(
                "SELECT * FROM cliente WHERE celular = ?",
                [celular]
            );

            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al buscar cliente por celular: ${error.message}`);
        }
    }

    async findAll() {
        try {
            const [rows] = await this.connection.execute(
                "SELECT * FROM cliente"
            );

            return rows;
        } catch (error) {
            throw new Error(`Error al listar clientes: ${error.message}`);
        }
    }

    async update(id, { nombre_completo, celular, plan_adquirido, mes_vencido, razon_no_pago, num_tarjeta }) {
        try {
            const [result] = await this.connection.execute(
                `UPDATE cliente SET nombre_completo = ?, celular = ?, plan_adquirido = ?, mes_vencido = ?, razon_no_pago = ?, num_tarjeta = ?
                 WHERE id = ?`,
                [nombre_completo, celular, plan_adquirido, mes_vencido, razon_no_pago, num_tarjeta, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar cliente: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            const [result] = await this.connection.execute(
                "DELETE FROM cliente WHERE id = ?",
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar cliente: ${error.message}`);
        }
    }
}

module.exports = new ClienteModel();
