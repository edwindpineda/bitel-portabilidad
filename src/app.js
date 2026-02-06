const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const messageProcessingRoutes = require('./routes/messageProcessing.route.js');
const { responseHandler } = require('./middlewares/response.middleware.js');
const checkApiKey = require('./middlewares/apiKey.middleware.js');
const authMiddleware = require('./middlewares/auth.middleware.js');
const reporteRoutes = require('./routes/reporte.route.js');
const usuarioRoutes = require("./routes/crm/usuario.route.js");
const auditoriaRoutes = require("./routes/crm/auditoria.route.js");
const contactoRoutes = require("./routes/crm/contacto.route.js");
const configuracionRoutes = require("./routes/crm/configuracion.route.js");
const llamadaRoutes = require("./routes/crm/llamada.route.js");
const leadsRoutes = require("./routes/crm/leads.route.js");
const reportesCrmRoutes = require("./routes/crm/reportes.route.js");
const webhookRoutes = require("./routes/webhook.route.js");
const adminRoutes = require("./routes/admin.route.js");
const transcripcionRoutes = require("./controllers/crm/transcripcion.controller.js")

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

// Rutas
app.use('/api', reporteRoutes);
// Rutas publicas (sin auth)
app.use("/api/crm", usuarioRoutes, transcripcionRoutes);
app.use("/api/crm/tools", configuracionRoutes, llamadaRoutes);
// Rutas protegidas del CRM (requieren auth)
app.use("/api/crm", authMiddleware, auditoriaRoutes, contactoRoutes, configuracionRoutes, llamadaRoutes);
app.use("/api/crm/leads", authMiddleware, leadsRoutes);
app.use("/api/crm/reportes", authMiddleware, reportesCrmRoutes);
app.use("/api/admin", authMiddleware, adminRoutes);
app.use('/api/assistant', checkApiKey, messageProcessingRoutes);

// Rutas de webhook (sin auth - para recibir mensajes de Baileys)
app.use('/webhook', webhookRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.success(200, 'Health check');
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.clientError(404, 'Ruta no encontrada');
});


module.exports = app;
