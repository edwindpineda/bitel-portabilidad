require('dotenv/config');

const app = require('./app.js');

const connectDB = require('./config/dbConnection');

const logger = require('./config/logger/loggerClient');

const PORT = process.env.PORT || 3000;

// Iniciar servidor
const startServer = async () => {
  // Probar conexión a la base de datos
  try {
    await connectDB.testConnection();
  } catch (error) {
    logger.error(`[server.js] ⚠️ MySQL no disponible: ${error.message}`);
  }

  // Iniciar servidor aunque falle la conexión
  app.listen(PORT, () => {
    logger.info(`[server.js] 🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();
