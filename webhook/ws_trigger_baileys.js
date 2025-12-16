const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuración
const CONFIG = {
    PORT: process.env.WEBHOOK_PORT || 3030,
    // URL del servicio ws_send_whatsapp que procesa y envía mensajes
    SEND_WS_URL: process.env.SEND_WS_URL || 'https://portabilidad-bitel.ai-you.io/webhook/send'
};

// Middleware CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

/**
 * Webhook para recibir mensajes de WhatsApp (Baileys)
 * POST /webhook/whatsapp
 */
app.post('/webhook/whatsapp', async (req, res) => {
    try {
        const data = req.body;

        console.log('========== MENSAJE WHATSAPP RECIBIDO ==========');
        console.log('Data:', JSON.stringify(data, null, 2));

        // Extraer datos del mensaje (compatible con formato Baileys)
        const sessionId = data.sessionId || data.EmpresaId || null;
        const fromNumber = data.fromNumber || data.from?.replace('@s.whatsapp.net', '') || null;
        const messageText = data.messageText || data.message?.conversation || data.message?.extendedTextMessage?.text || '';
        const pushName = data.pushName || 'Usuario';
        const messageType = data.messageType || 'text';
        const messageId = data.messageId || null;
        const timestamp = data.timestamp || Date.now();

        // Validar datos requeridos
        if (!fromNumber) {
            return res.status(400).json({
                success: false,
                error: 'Número de teléfono requerido (fromNumber)'
            });
        }

        if (!messageText || messageText.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Mensaje de texto requerido (messageText)'
            });
        }

        console.log(`📱 From: ${fromNumber}`);
        console.log(`💬 Message: ${messageText}`);
        console.log(`👤 Push Name: ${pushName}`);

        // Preparar payload para ws_send_whatsapp
        const sendWsPayload = {
            phone: fromNumber,
            question: messageText
        };

        // Enviar a ws_send_whatsapp que procesará con Bitel API y enviará por WhatsApp
        console.log(`📡 Enviando a ws_send_whatsapp: ${CONFIG.SEND_WS_URL}`);
        const response = await axios.post(CONFIG.SEND_WS_URL, sendWsPayload, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 120000 // 120 segundos timeout (incluye procesamiento AI + envío WhatsApp)
        });

        console.log('✅ Respuesta de ws_send_whatsapp:', JSON.stringify(response.data, null, 2));

        // Extraer respuesta
        const wsResponse = response.data;
        const assistantAnswer = wsResponse.data?.answer || 'Sin respuesta';
        const status = wsResponse.data?.status || 'pending';
        const imagenUrl = wsResponse.data?.imagen_url || null;

        console.log('=============================================');

        // Respuesta para Baileys (confirmación de que se procesó y envió)
        res.json({
            success: true,
            data: {
                sessionId,
                fromNumber,
                messageId,
                timestamp,
                pushName,
                originalMessage: messageText,
                // Respuesta del asistente
                reply: assistantAnswer,
                status,
                imagen_url: imagenUrl,
                // El mensaje ya fue enviado por ws_send_whatsapp
                messageSent: true,
                whatsapp_results: wsResponse.whatsapp_results || []
            }
        });

    } catch (error) {
        console.error('❌ Error procesando mensaje:', error.message);

        // Si es error de la API de Bitel
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }

        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data || null
        });
    }
});

/**
 * Webhook alternativo con codOpe (compatible con estructura PHP original)
 * POST /webhook/trigger
 */
app.post('/webhook/trigger', async (req, res) => {
    try {
        const { codOpe, data } = req.body;

        if (codOpe !== 'ENVIAR_MENSAJE_WHATSAPP') {
            return res.status(400).json({
                success: false,
                error: 'Operación no válida'
            });
        }

        // Parsear data si viene como string
        const messageData = typeof data === 'string' ? JSON.parse(data) : data;

        // Redirigir al handler principal
        req.body = messageData;
        return app._router.handle(
            { ...req, url: '/webhook/whatsapp', method: 'POST' },
            res,
            () => {}
        );

    } catch (error) {
        console.error('❌ Error en trigger:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Bitel WhatsApp Webhook',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(CONFIG.PORT, () => {
    console.log(`🚀 Webhook WhatsApp corriendo en http://localhost:${CONFIG.PORT}`);
    console.log(`📡 Endpoint: POST /webhook/whatsapp`);
    console.log(`🔗 Send WS: ${CONFIG.SEND_WS_URL}`);
});

module.exports = app;
