const express = require('express');
const helmet = require('helmet');

const messageProcessingRoutes = require('./routes/messageProcessing.route.js');
const { responseHandler } = require('./middlewares/response.middleware.js');
const checkApiKey = require('./middlewares/apiKey.middleware.js');
const reporteRoutes = require('./routes/reporte.route.js');
const authRoutes = require('./routes/crm/auth.route.js');

const app = express();

// Middleware de seguridad
app.use(helmet());

// CORS - permitir todas las peticiones
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware para parsing
app.use(express.json());

// Middleware para respuestas JSON consistentes
app.use(responseHandler);

// Rutas
app.use('/api', reporteRoutes);
app.use('/api/assistant', checkApiKey, messageProcessingRoutes);
app.use('/api/crm/auth', authRoutes);


// Ruta de health check
app.get('/health', (req, res) => {
  res.success(200, 'Health check');
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.clientError(404, 'Ruta no encontrada');
});


module.exports = app;
