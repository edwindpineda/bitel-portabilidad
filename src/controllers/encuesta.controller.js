const EncuestaModel = require("../models/encuesta.model.js");
const EncuestaBaseNumeroModel = require("../models/encuestaBaseNumero.model.js");
const logger = require('../config/logger/loggerClient.js');
const xlsx = require('xlsx');

class EncuestaController {

  async crearEncuesta(req, res) {
    try {
      const {
        nombre_contacto,
        participacion_encuesta,
        p1_piensa_votar,
        p2_intencion_voto,
        p2_observaciones,
        p3a_sabe_como_votar,
        p3a_refuerzo_pedagogico,
        p3b_conoce_candidato,
        p4_autoriza_whatsapp,
        whatsapp_contacto,
        notas_adicionales,
        id_encuesta_base_numero
      } = req.body;

      const encuesta = new EncuestaModel();

      const id = await encuesta.create({
        nombre_contacto,
        participacion_encuesta,
        p1_piensa_votar,
        p2_intencion_voto,
        p2_observaciones,
        p3a_sabe_como_votar,
        p3a_refuerzo_pedagogico,
        p3b_conoce_candidato,
        p4_autoriza_whatsapp,
        whatsapp_contacto,
        notas_adicionales,
        id_encuesta_base_numero
      });

      return res.status(201).json({ msg: "Encuesta guardada exitosamente", data: { id } });
    }
    catch (error) {
      logger.error(`[encuesta.controller.js] Error al crear encuesta: ${error.message}`);
      return res.status(500).json({ msg: "Error al guardar encuesta" });
    }
  }

  async getEncuestas(req, res) {
    try {
      const encuesta = new EncuestaModel();
      const encuestas = await encuesta.getAll();
      return res.status(200).json({ msg: "Encuesta obtenidas", data: { encuestas } });
    }
    catch (error) {
      logger.error(`[encuesta.controller.js] Error al obtener encuestas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener encuestas" });
    }
  }

  async getEncuestasById(req, res) {
    try {
      const { id } = req.params;
      const encuesta = new EncuestaModel();
      const encuestas = await encuesta.getById(id);
      return res.status(200).json({ msg: "Encuesta obtenida", data: { encuestas } });
    }
    catch (error) {
      logger.error(`[encuesta.controller.js] Error al obtener encuestas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener encuestas" });
    }
  }

  async getDepartamentos(req, res) {
    try {
      const encuesta = new EncuestaModel();
      const departamentos = await encuesta.getDepartamentos();
      return res.status(200).json({ msg: "Departamentos obtenidos", data: departamentos });
    }
    catch (error) {
      logger.error(`[encuesta.controller.js] Error al obtener departamentos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener departamentos" });
    }
  }

  async getMunicipios(req, res) {
    try {
      const { departamento } = req.query;
      const encuesta = new EncuestaModel();
      const municipios = await encuesta.getMunicipios(departamento || null);
      return res.status(200).json({ msg: "Municipios obtenidos", data: municipios });
    }
    catch (error) {
      logger.error(`[encuesta.controller.js] Error al obtener municipios: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener municipios" });
    }
  }

  // ==================== PERSONAS (encuesta_base_numero) ====================
  async getPersonas(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(20, parseInt(req.query.limit) || 20);
      const model = new EncuestaBaseNumeroModel();
      const result = await model.getAll(page, limit);
      return res.status(200).json({ msg: "Personas obtenidas", data: result.data, pagination: result.pagination });
    } catch (error) {
      logger.error(`[encuesta.controller.js] Error al obtener personas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener personas" });
    }
  }

  async getPersonaById(req, res) {
    try {
      const { id } = req.params;
      const model = new EncuestaBaseNumeroModel();
      const persona = await model.getById(id);
      if (!persona) {
        return res.status(404).json({ msg: "Persona no encontrada" });
      }
      return res.status(200).json({ msg: "Persona obtenida", data: persona });
    } catch (error) {
      logger.error(`[encuesta.controller.js] Error al obtener persona: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener persona" });
    }
  }

  async createPersona(req, res) {
    try {
      const { telefono, nombre, apellido, departamento, municipio, referente } = req.body;
      if (!telefono) {
        return res.status(400).json({ msg: "El telefono es requerido" });
      }
      const model = new EncuestaBaseNumeroModel();
      const id = await model.create({ telefono, nombre, apellido, departamento, municipio, referente });
      return res.status(201).json({ msg: "Persona creada exitosamente", data: { id } });
    } catch (error) {
      logger.error(`[encuesta.controller.js] Error al crear persona: ${error.message}`);
      if (error.message.includes('Ya existe')) {
        return res.status(400).json({ msg: error.message });
      }
      return res.status(500).json({ msg: "Error al crear persona" });
    }
  }

  async updatePersona(req, res) {
    try {
      const { id } = req.params;
      const allowedFields = ['telefono', 'nombre', 'apellido', 'departamento', 'municipio', 'referente', 'intentos', 'estado_llamada'];
      const data = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          data[field] = req.body[field];
        }
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ msg: "Debe enviar al menos un campo para actualizar" });
      }

      const model = new EncuestaBaseNumeroModel();
      const updated = await model.update(id, data);
      if (!updated) {
        return res.status(404).json({ msg: "Persona no encontrada" });
      }
      return res.status(200).json({ msg: "Persona actualizada exitosamente" });
    } catch (error) {
      logger.error(`[encuesta.controller.js] Error al actualizar persona: ${error.message}`);
      if (error.message.includes('Ya existe')) {
        return res.status(400).json({ msg: error.message });
      }
      return res.status(500).json({ msg: "Error al actualizar persona" });
    }
  }

  async deletePersona(req, res) {
    try {
      const { id } = req.params;
      const model = new EncuestaBaseNumeroModel();
      const deleted = await model.delete(id);
      if (!deleted) {
        return res.status(404).json({ msg: "Persona no encontrada" });
      }
      return res.status(200).json({ msg: "Persona eliminada exitosamente" });
    } catch (error) {
      logger.error(`[encuesta.controller.js] Error al eliminar persona: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar persona" });
    }
  }

  async uploadPersonas(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ msg: "No se ha proporcionado un archivo" });
      }

      // Configurar SSE (Server-Sent Events) para progreso en tiempo real
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const sendProgress = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      sendProgress({ tipo: 'inicio', mensaje: 'Leyendo archivo...' });

      // Leer el archivo Excel/CSV
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        sendProgress({ tipo: 'error', mensaje: 'El archivo esta vacio' });
        return res.end();
      }

      sendProgress({ tipo: 'progreso', mensaje: 'Validando columnas...', total: jsonData.length });

      // Validar que tenga las columnas requeridas
      const columnasArchivo = Object.keys(jsonData[0]).map(col => col.toLowerCase().trim());

      // Validar columna telefono
      const columnasTelefono = ['tel', 'telefono', 'phone', 'celular'];
      const tieneColumnaTelefono = columnasTelefono.some(col => columnasArchivo.includes(col));

      // Validar columna nombre
      const columnasNombre = ['nombre', 'name', 'nombres'];
      const tieneColumnaNombre = columnasNombre.some(col => columnasArchivo.includes(col));

      if (!tieneColumnaTelefono || !tieneColumnaNombre) {
        const faltantes = [];
        if (!tieneColumnaTelefono) faltantes.push('telefono (tel, telefono, phone o celular)');
        if (!tieneColumnaNombre) faltantes.push('nombre (nombre, name o nombres)');

        sendProgress({
          tipo: 'error',
          mensaje: `El archivo debe contener las columnas: ${faltantes.join(' y ')}`,
          columnas_encontradas: columnasArchivo
        });
        return res.end();
      }

      // Procesar registros
      const registros = [];
      const errores = [];

      // Funcion helper para obtener valor de columna (case insensitive)
      const getColumnValue = (row, ...nombres) => {
        for (const nombre of nombres) {
          const keys = Object.keys(row);
          const key = keys.find(k => k.toLowerCase().trim() === nombre.toLowerCase());
          if (key !== undefined && row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return String(row[key]).trim();
          }
        }
        return '';
      };

      sendProgress({ tipo: 'progreso', mensaje: 'Procesando registros...', total: jsonData.length, procesados: 0 });

      jsonData.forEach((row, index) => {
        const telefono = getColumnValue(row, 'tel', 'telefono', 'phone', 'celular');
        const nombre = getColumnValue(row, 'nombre', 'name', 'nombres');
        const apellido = getColumnValue(row, 'apellido', 'apellidos', 'lastname');
        const departamento = getColumnValue(row, 'departamento', 'depto', 'department');
        const municipio = getColumnValue(row, 'municipio', 'distrito', 'city');
        const referente = getColumnValue(row, 'referente', 'referencia', 'reference');

        if (!telefono) {
          errores.push({ fila: index + 2, error: "Telefono vacio" });
          return;
        }

        if (!nombre) {
          errores.push({ fila: index + 2, error: "Nombre vacio" });
          return;
        }

        // Limpiar telefono (quitar espacios, guiones, etc)
        const telefonoLimpio = telefono.replace(/[\s\-\(\)\.]/g, '');

        // Truncar campos para evitar errores de longitud
        registros.push({
          telefono: telefonoLimpio.substring(0, 20),
          nombre: nombre ? nombre.substring(0, 150) : null,
          apellido: apellido ? apellido.substring(0, 150) : null,
          departamento: departamento ? departamento.substring(0, 100) : null,
          municipio: municipio ? municipio.substring(0, 100) : null,
          referente: referente ? referente.substring(0, 150) : null
        });
      });

      if (registros.length === 0) {
        sendProgress({
          tipo: 'error',
          mensaje: 'No se encontraron registros validos',
          errores
        });
        return res.end();
      }

      // Eliminar duplicados dentro del mismo archivo (mantener el primero)
      const telefonosVistos = new Set();
      const registrosUnicos = [];
      let duplicadosArchivo = 0;

      for (const registro of registros) {
        if (!telefonosVistos.has(registro.telefono)) {
          telefonosVistos.add(registro.telefono);
          registrosUnicos.push(registro);
        } else {
          duplicadosArchivo++;
        }
      }

      sendProgress({
        tipo: 'progreso',
        mensaje: `Insertando en base de datos... (${duplicadosArchivo} duplicados en archivo eliminados)`,
        total: registrosUnicos.length,
        procesados: 0,
        fase: 'insercion'
      });

      // Log para debug
      logger.info(`[encuesta.controller.js] Procesando ${registrosUnicos.length} registros unicos (${duplicadosArchivo} duplicados en archivo)`);
      if (registrosUnicos.length > 0) {
        logger.info(`[encuesta.controller.js] Primer registro: ${JSON.stringify(registrosUnicos[0])}`);
      }

      // Insertar en la base de datos con callback de progreso
      const model = new EncuestaBaseNumeroModel();
      const resultado = await model.createBulkWithProgress(registrosUnicos, (progreso) => {
        sendProgress({
          tipo: 'progreso',
          mensaje: `Procesando lote ${progreso.loteActual} de ${progreso.totalLotes}...`,
          total: registrosUnicos.length,
          procesados: progreso.procesados,
          nuevos: progreso.nuevos,
          omitidos: progreso.omitidos,
          porcentaje: Math.round((progreso.procesados / registrosUnicos.length) * 100),
          fase: 'insercion'
        });
      });

      // Enviar resultado final
      sendProgress({
        tipo: 'completado',
        exito: resultado.exito,
        mensaje: resultado.exito ? 'Archivo procesado exitosamente' : `Error durante la carga`,
        data: {
          total_filas: jsonData.length,
          registros_validos: registros.length,
          registros_unicos: registrosUnicos.length,
          duplicados_archivo: duplicadosArchivo,
          nuevos: resultado.nuevos,
          omitidos: resultado.omitidos,
          errores_validacion: errores.length,
          errores_bd: resultado.errores.length,
          lotes_procesados: resultado.lotesProcesados,
          total_lotes: resultado.totalLotes
        },
        error_fatal: resultado.errorFatal || null
      });

      return res.end();

    } catch (error) {
      logger.error(`[encuesta.controller.js] Error al cargar archivo: ${error.message}`);
      try {
        res.write(`data: ${JSON.stringify({ tipo: 'error', mensaje: 'Error al procesar el archivo: ' + error.message })}\n\n`);
      } catch (e) {
        // Si ya se envio una respuesta, ignorar
      }
      return res.end();
    }
  }

  async getPersonasStats(req, res) {
    try {
      const model = new EncuestaBaseNumeroModel();
      const stats = await model.getStats();
      return res.status(200).json({ msg: "Estadisticas obtenidas", data: stats });
    } catch (error) {
      logger.error(`[encuesta.controller.js] Error al obtener estadisticas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estadisticas" });
    }
  }
}

module.exports = new EncuestaController();
