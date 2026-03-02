const { pool } = require("../config/dbConnection.js");

class EncuestaBaseNumeroModel {
    constructor(dbConnection = null) {
        this.connection = dbConnection || pool;
    }

    async getAll(page = 1, limit = 20, estadoLlamada = null, search = null, prioridad = null) {
        try {
            const offset = (page - 1) * limit;
            const params = [];

            // Construir WHERE dinámico
            let whereClause = 'WHERE estado_registro = 1 AND prioridad IN (1, 2, 3)';

            if (estadoLlamada !== null && estadoLlamada !== 'todos') {
                whereClause += ' AND estado_llamada = ?';
                params.push(String(estadoLlamada));
            }

            if (prioridad !== null && prioridad !== 'todos') {
                whereClause += ' AND prioridad = ?';
                params.push(String(prioridad));
            }

            if (search) {
                whereClause += ' AND (nombre LIKE ? OR telefono LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            // Contar total con filtros
            const [[{ total }]] = await this.connection.execute(
                `SELECT COUNT(*) AS total FROM encuesta_base_numero ${whereClause}`,
                params
            );

            // Obtener datos paginados
            const [rows] = await this.connection.execute(
                `SELECT * FROM encuesta_base_numero
                ${whereClause}
                ORDER BY fecha_registro DESC
                LIMIT ? OFFSET ?`,
                [...params, String(limit), String(offset)]
            );

            return {
                data: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new Error(`Error al obtener personas: ${error.message}`);
        }
    }

    async getById(id) {
        try {
            const [rows] = await this.connection.execute(
                `SELECT * FROM encuesta_base_numero WHERE id = ? AND estado_registro = 1`,
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener persona por ID: ${error.message}`);
        }
    }

    async create({ telefono, nombre, apellido, departamento, municipio, referente }) {
        try {
            const [result] = await this.connection.execute(
                `INSERT INTO encuesta_base_numero (telefono, nombre, apellido, departamento, municipio, referente, estado_registro)
                VALUES (?, ?, ?, ?, ?, ?, 1)`,
                [telefono, nombre || null, apellido || null, departamento || null, municipio || null, referente || null]
            );
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe una persona con ese telefono');
            }
            throw new Error(`Error al crear persona: ${error.message}`);
        }
    }

    async createBulk(registros) {
        const connection = await this.connection.getConnection();
        const BATCH_SIZE = 2000; // Insertar 2000 registros por lote

        let nuevos = 0;
        let actualizados = 0;
        let omitidos = 0;
        let errores = [];
        let errorFatal = null;
        let lotesProcesados = 0;
        const totalLotes = Math.ceil(registros.length / BATCH_SIZE);

        try {
            // Procesar en lotes
            for (let i = 0; i < registros.length; i += BATCH_SIZE) {
                const batch = registros.slice(i, i + BATCH_SIZE);
                lotesProcesados++;

                try {
                    // Primero, obtener los telefonos que ya existen
                    const telefonos = batch.map(r => r.telefono);
                    const placeholdersCheck = telefonos.map(() => '?').join(', ');
                    const [existentes] = await connection.execute(
                        `SELECT telefono FROM encuesta_base_numero WHERE telefono IN (${placeholdersCheck})`,
                        telefonos
                    );
                    const telefonosExistentes = new Set(existentes.map(r => r.telefono));

                    // Separar nuevos de actualizaciones
                    const registrosNuevos = batch.filter(r => !telefonosExistentes.has(r.telefono));
                    const registrosActualizar = batch.filter(r => telefonosExistentes.has(r.telefono));

                    await connection.beginTransaction();

                    // Insertar nuevos registros
                    if (registrosNuevos.length > 0) {
                        const placeholders = registrosNuevos.map(() => '(?, ?, ?, ?, ?, ?, 1)').join(', ');
                        const values = [];
                        registrosNuevos.forEach(registro => {
                            values.push(
                                registro.telefono,
                                registro.nombre || null,
                                registro.apellido || null,
                                registro.departamento || null,
                                registro.municipio || null,
                                registro.referente || null
                            );
                        });

                        const sql = `INSERT INTO encuesta_base_numero
                            (telefono, nombre, apellido, departamento, municipio, referente, estado_registro)
                            VALUES ${placeholders}`;

                        const [result] = await connection.execute(sql, values);
                        nuevos += result.affectedRows;
                    }

                    // Los duplicados se omiten (no se actualizan)
                    omitidos += registrosActualizar.length;

                    await connection.commit();
                } catch (batchError) {
                    await connection.rollback();

                    // Si falla el batch, intentar uno por uno para identificar errores
                    for (const registro of batch) {
                        try {
                            // Verificar si existe
                            const [existe] = await connection.execute(
                                `SELECT id FROM encuesta_base_numero WHERE telefono = ?`,
                                [registro.telefono]
                            );

                            if (existe.length > 0) {
                                omitidos++;
                            } else {
                                await connection.execute(
                                    `INSERT INTO encuesta_base_numero
                                    (telefono, nombre, apellido, departamento, municipio, referente, estado_registro)
                                    VALUES (?, ?, ?, ?, ?, ?, 1)`,
                                    [
                                        registro.telefono,
                                        registro.nombre || null,
                                        registro.apellido || null,
                                        registro.departamento || null,
                                        registro.municipio || null,
                                        registro.referente || null
                                    ]
                                );
                                nuevos++;
                            }
                        } catch (error) {
                            if (error.code === 'ER_DUP_ENTRY') {
                                omitidos++;
                            } else {
                                errores.push({
                                    telefono: registro.telefono,
                                    error: error.message
                                });
                            }
                        }
                    }
                }
            }

            return {
                nuevos,
                actualizados,
                omitidos,
                errores,
                exito: true,
                lotesProcesados,
                totalLotes
            };
        } catch (error) {
            // Error fatal - devolver lo que se pudo procesar
            return {
                nuevos,
                actualizados,
                omitidos,
                errores,
                exito: false,
                errorFatal: error.message,
                lotesProcesados,
                totalLotes
            };
        } finally {
            connection.release();
        }
    }

    async update(id, data) {
        try {
            const allowedFields = ['telefono', 'nombre', 'apellido', 'departamento', 'municipio', 'referente', 'intentos', 'estado_llamada'];
            const fields = [];
            const values = [];

            for (const field of allowedFields) {
                if (data[field] !== undefined) {
                    fields.push(`${field} = ?`);
                    values.push(data[field] ?? null);
                }
            }

            if (fields.length === 0) {
                throw new Error('No se proporcionaron campos para actualizar');
            }

            fields.push('fecha_actualizacion = NOW()');
            values.push(id);

            const [result] = await this.connection.execute(
                `UPDATE encuesta_base_numero SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            return result.affectedRows > 0;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe una persona con ese telefono');
            }
            throw new Error(`Error al actualizar persona: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            const [result] = await this.connection.execute(
                `UPDATE encuesta_base_numero SET estado_registro = 0, fecha_actualizacion = NOW() WHERE id = ?`,
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar persona: ${error.message}`);
        }
    }

    async getStats(prioridad = null) {
        try {
            let whereClause = 'WHERE estado_registro = 1 AND prioridad IN (1, 2, 3)';
            const params = [];

            if (prioridad !== null && prioridad !== 'todos') {
                whereClause += ' AND prioridad = ?';
                params.push(String(prioridad));
            }

            const [rows] = await this.connection.execute(
                `SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN estado_llamada = 0 THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estado_llamada IN (1, 2, 3) THEN 1 ELSE 0 END) as ejecutados,
                    SUM(CASE WHEN estado_llamada = 2 THEN 1 ELSE 0 END) as buzon,
                    SUM(CASE WHEN estado_llamada = 3 THEN 1 ELSE 0 END) as completados
                FROM encuesta_base_numero ${whereClause}`,
                params
            );
            return rows[0];
        } catch (error) {
            throw new Error(`Error al obtener estadisticas: ${error.message}`);
        }
    }

    async createBulkWithProgress(registros, onProgress) {
        const connection = await this.connection.getConnection();
        const BATCH_SIZE = 500; // Reducido para evitar problemas con placeholders

        let nuevos = 0;
        let omitidos = 0;
        let errores = [];
        let errorFatal = null;
        let lotesProcesados = 0;
        let procesados = 0;
        const totalLotes = Math.ceil(registros.length / BATCH_SIZE);

        try {
            for (let i = 0; i < registros.length; i += BATCH_SIZE) {
                const batch = registros.slice(i, i + BATCH_SIZE);
                lotesProcesados++;

                try {
                    // Asegurar que telefonos sean strings
                    const telefonos = batch.map(r => String(r.telefono).trim());

                    // Usar query en lugar de execute para listas grandes
                    const [existentes] = await connection.query(
                        `SELECT telefono FROM encuesta_base_numero WHERE telefono IN (?)`,
                        [telefonos]
                    );
                    const telefonosExistentes = new Set(existentes.map(r => String(r.telefono).trim()));

                    // Separar nuevos de existentes
                    const registrosNuevos = batch.filter(r => !telefonosExistentes.has(String(r.telefono).trim()));
                    const registrosExistentes = batch.filter(r => telefonosExistentes.has(String(r.telefono).trim()));

                    // Insertar nuevos registros
                    if (registrosNuevos.length > 0) {
                        await connection.beginTransaction();

                        // Construir valores para insert multiple
                        const insertValues = registrosNuevos.map(registro => [
                            String(registro.telefono).trim(),
                            registro.nombre || null,
                            registro.apellido || null,
                            registro.departamento || null,
                            registro.municipio || null,
                            registro.referente || null,
                            1
                        ]);

                        const sql = `INSERT INTO encuesta_base_numero
                            (telefono, nombre, apellido, departamento, municipio, referente, estado_registro)
                            VALUES ?`;

                        const [result] = await connection.query(sql, [insertValues]);
                        nuevos += result.affectedRows;

                        await connection.commit();
                    }

                    omitidos += registrosExistentes.length;
                    procesados += batch.length;

                    // Llamar callback de progreso
                    if (onProgress) {
                        onProgress({
                            loteActual: lotesProcesados,
                            totalLotes,
                            procesados,
                            nuevos,
                            omitidos
                        });
                    }

                } catch (batchError) {
                    console.error('Batch error:', batchError.message);
                    try {
                        await connection.rollback();
                    } catch (e) {}

                    // Procesar uno por uno
                    for (const registro of batch) {
                        try {
                            const telefonoStr = String(registro.telefono).trim();
                            const [existe] = await connection.query(
                                `SELECT id FROM encuesta_base_numero WHERE telefono = ?`,
                                [telefonoStr]
                            );

                            if (existe.length > 0) {
                                omitidos++;
                            } else {
                                await connection.query(
                                    `INSERT INTO encuesta_base_numero
                                    (telefono, nombre, apellido, departamento, municipio, referente, estado_registro)
                                    VALUES (?, ?, ?, ?, ?, ?, 1)`,
                                    [
                                        telefonoStr,
                                        registro.nombre || null,
                                        registro.apellido || null,
                                        registro.departamento || null,
                                        registro.municipio || null,
                                        registro.referente || null
                                    ]
                                );
                                nuevos++;
                            }
                        } catch (error) {
                            if (error.code === 'ER_DUP_ENTRY') {
                                omitidos++;
                            } else {
                                errores.push({
                                    telefono: registro.telefono,
                                    error: error.message
                                });
                            }
                        }
                        procesados++;
                    }

                    // Actualizar progreso despues del batch fallido
                    if (onProgress) {
                        onProgress({
                            loteActual: lotesProcesados,
                            totalLotes,
                            procesados,
                            nuevos,
                            omitidos
                        });
                    }
                }
            }

            return {
                nuevos,
                omitidos,
                errores,
                exito: true,
                lotesProcesados,
                totalLotes
            };
        } catch (error) {
            console.error('Fatal error:', error.message);
            return {
                nuevos,
                omitidos,
                errores,
                exito: false,
                errorFatal: error.message,
                lotesProcesados,
                totalLotes
            };
        } finally {
            connection.release();
        }
    }
}

module.exports = EncuestaBaseNumeroModel;
