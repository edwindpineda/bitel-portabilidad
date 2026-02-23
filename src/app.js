const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const messageProcessingRoutes = require('./routes/messageProcessing.route.js');
const { responseHandler } = require('./middlewares/response.middleware.js');
const authMiddleware = require('./middlewares/auth.middleware.js');
const usuarioRoutes = require("./routes/crm/usuario.route.js");
const auditoriaRoutes = require("./routes/crm/auditoria.route.js");
const configuracionRoutes = require("./routes/crm/configuracion.route.js");
const llamadaRoutes = require("./routes/crm/llamada.route.js");
const leadsRoutes = require("./routes/crm/leads.route.js");
const reportesCrmRoutes = require("./routes/crm/reportes.route.js");
const transcripcionRoutes = require("./controllers/crm/transcripcion.controller.js");
const chatRoutes = require("./routes/crm/chat.route.js");
const encuestaRoutes = require("./routes/encuesta.route.js");
const pagoRoutes = require("./routes/pago.routes.js");
const whatsappRoutes = require("./routes/plantillaWhatsapp.route.js");
const whatsappEmbeddedRoutes = require("./routes/whatsappEmbedded.route.js");
const adminRoutes = require("./routes/admin.route.js");
const contactosRoutes = require("./routes/crm/contactos.route.js");
const contactoRoutes = require("./routes/crm/contacto.route.js");
const dashboardRoutes = require("./routes/dashboard.route.js");

const app = express();

// CORS - permitir todas las peticiones (debe ir primero)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

// Middleware de seguridad (configurado para permitir CORS)
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Middleware para parsing
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, '..', 'public')));

// Servir archivos subidos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Middleware para respuestas JSON consistentes
app.use(responseHandler);

// Ruta para ejecutar migración prospecto -> persona
app.post('/migrate-persona', async (req, res) => {
  try {
    const { pool } = require('./config/dbConnection.js');
    const queries = [
      `CREATE TABLE IF NOT EXISTS tipo_persona (id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(50) NOT NULL, estado_registro INT DEFAULT 1, fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP)`,
      `INSERT IGNORE INTO tipo_persona (id, nombre) VALUES (1, 'Prospecto'), (2, 'Cliente')`,
      `ALTER TABLE prospecto RENAME TO persona`,
      `ALTER TABLE persona ADD COLUMN id_tipo_persona INT DEFAULT 1 AFTER id_empresa`,
      `ALTER TABLE prospecto_pregunta_perfilamiento RENAME TO persona_pregunta_perfilamiento`,
      `ALTER TABLE persona_pregunta_perfilamiento CHANGE COLUMN id_prospecto id_persona INT`,
      `ALTER TABLE chat CHANGE COLUMN id_prospecto id_persona INT`,
      `RENAME TABLE campania_prospecto TO campania_persona`,
      `ALTER TABLE campania_persona CHANGE COLUMN id_prospecto id_persona INT`,
    ];
    const results = [];
    for (const q of queries) {
      try {
        await pool.execute(q);
        results.push({ query: q.substring(0, 60), status: 'OK' });
      } catch (err) {
        results.push({ query: q.substring(0, 60), status: 'ERROR', error: err.message });
      }
    }
    return res.status(200).json({ msg: 'Migration completed', results });
  } catch (error) {
    return res.status(500).json({ msg: 'Migration failed', error: error.message });
  }
});

// Ruta para ver estructura de la BD
app.get('/db-structure', async (req, res) => {
  try {
    const { pool } = require('./config/dbConnection.js');
    const dbName = process.env.DB_NAME || 'chatbot_ai_core';

    const [tables] = await pool.execute(
      `SELECT TABLE_NAME, TABLE_ROWS, TABLE_COMMENT
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME`,
      [dbName]
    );

    const [columns] = await pool.execute(
      `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [dbName]
    );

    const structure = {};
    for (const table of tables) {
      structure[table.TABLE_NAME] = {
        rows: table.TABLE_ROWS,
        comment: table.TABLE_COMMENT || '',
        columns: []
      };
    }
    for (const col of columns) {
      if (structure[col.TABLE_NAME]) {
        structure[col.TABLE_NAME].columns.push({
          name: col.COLUMN_NAME,
          type: col.COLUMN_TYPE,
          nullable: col.IS_NULLABLE,
          key: col.COLUMN_KEY,
          default: col.COLUMN_DEFAULT,
          extra: col.EXTRA
        });
      }
    }

    return res.status(200).json({ database: dbName, tables: structure });
  } catch (error) {
    return res.status(500).json({ msg: 'Error al obtener estructura', error: error.message });
  }
});

// Rutas publicas (sin auth)
app.use("/api/crm", usuarioRoutes, transcripcionRoutes);
app.use("/api/crm/tools", configuracionRoutes, llamadaRoutes, encuestaRoutes, pagoRoutes, whatsappRoutes, whatsappEmbeddedRoutes);
// Rutas protegidas del CRM (requieren auth)
app.use("/api/crm", authMiddleware, auditoriaRoutes, configuracionRoutes, llamadaRoutes);
app.use("/api/crm/leads", authMiddleware, leadsRoutes);
app.use("/api/crm/reportes", authMiddleware, reportesCrmRoutes);
app.use("/api/crm/chats", authMiddleware, chatRoutes);
app.use("/api/crm/contactos", authMiddleware, contactosRoutes);
app.use("/api/crm/contacto", authMiddleware, contactoRoutes);
app.use("/api/crm", authMiddleware, whatsappEmbeddedRoutes);
app.use("/api/admin", authMiddleware, adminRoutes);
app.use('/api/assistant', messageProcessingRoutes);
app.use('/api', authMiddleware, dashboardRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.success(200, 'Health check');
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.clientError(404, 'Ruta no encontrada');
});


module.exports = app;
