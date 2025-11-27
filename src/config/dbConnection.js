const mysql = require('mysql2/promise');
const logger = require('./logger/loggerClient');

// Configuración optimizada para alta carga de escrituras y lecturas
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chatbot_ai_core',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 20, //  Más conexiones simultáneas
    maxIdle: 20, // max idle connections, igual que connectionLimit
    idleTimeout: 60000, // idle connections timeout, en milisegundos
    queueLimit: 0, // Sin límite en la cola
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4', // Soporte completo para Unicode,
    // Como string las fechas DATE/DATETIME
    dateStrings: true
});

// Función para verificar conexión
const testConnection = async () => {
    try {
        // Usar una consulta simple para verificar la conexión
        await pool.execute('SELECT 1');
        logger.info('[dbConnection.js] ✅ Conexión a MySQL verificada correctamente');
    } catch (error) {
        throw new Error('[dbConnection.js] ❌ Error verificando conexión a MySQL:', error.message);
    }
};

module.exports = {
    pool,
    testConnection
};
