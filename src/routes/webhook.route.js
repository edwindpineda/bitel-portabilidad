const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');

const router = express.Router();

// Configuración
const CONFIG = {
    BAILEYS_URL: process.env.BAILEYS_URL || 'https://bitel-baileys.xylure.easypanel.host',
    AUTH_TOKEN: process.env.BAILEYS_AUTH_TOKEN || 'f39a8c1d7b264fb19ce2a1d0b7441e98c4f7ba3ef1cd9a0e5d2c8f03b7a5e961',
    BITEL_API_KEY: process.env.USER_API_KEY || '4798d8360969047c6072cb160fad77829288f528f6aa41d35c48134d0a30772a',
    SESSION_ID: process.env.SESSION_ID || 'bitel'
};

/**
 * Descargar archivo desde URL
 */
async function downloadFile(url, maxRetries = 2) {
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 120000,
                maxRedirects: 10,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
                }
            });

            const firstBytes = Buffer.from(response.data).slice(0, 100).toString();
            if (firstBytes.toLowerCase().includes('<html') || firstBytes.toLowerCase().includes('<!doctype')) {
                lastError = { error: 'Se recibió HTML en lugar del archivo', url };
                continue;
            }

            return {
                data: Buffer.from(response.data),
                contentType: response.headers['content-type'],
                size: response.data.byteLength
            };

        } catch (error) {
            lastError = { error: error.message, url };
        }
    }
    return lastError;
}

/**
 * Comprimir imagen
 */
async function compressImage(imageBuffer, maxWidth = 800, quality = 70, maxSizeKB = 50) {
    try {
        let compressed = await sharp(imageBuffer)
            .resize(maxWidth, null, { withoutEnlargement: true })
            .jpeg({ quality })
            .toBuffer();

        let currentQuality = quality;
        let currentWidth = maxWidth;

        while (compressed.length / 1024 > maxSizeKB && currentQuality >= 20) {
            currentQuality -= 10;
            if (currentQuality < 50 && currentWidth > 400) {
                currentWidth = Math.floor(currentWidth * 0.75);
            }
            compressed = await sharp(imageBuffer)
                .resize(currentWidth, null, { withoutEnlargement: true })
                .jpeg({ quality: currentQuality })
                .toBuffer();
        }

        return {
            data: compressed,
            contentType: 'image/jpeg',
            finalSize: compressed.length
        };

    } catch (error) {
        return { data: imageBuffer, contentType: 'image/jpeg', error: error.message };
    }
}

/**
 * Enviar mensaje a Baileys
 */
async function sendToBaileys(id_empresa, phone, message, imageUrl = null) {
    const baileysUrl = `${CONFIG.BAILEYS_URL}/session/${id_empresa}/send`;
    const results = [];

    if (imageUrl) {
        console.log(`🖼️ Descargando imagen: ${imageUrl}`);
        const downloaded = await downloadFile(imageUrl);

        if (!downloaded.error) {
            const compressed = await compressImage(downloaded.data);

            const imagePayload = {
                phone,
                media: compressed.data.toString('base64'),
                mimetype: compressed.contentType,
                message: message || ''
            };

            const imageResponse = await axios.post(baileysUrl, imagePayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
                },
                timeout: 30000
            });

            results.push({
                type: 'image',
                success: true,
                response: imageResponse.data,
                image_size_kb: (compressed.finalSize / 1024).toFixed(2)
            });

            return results;
        }
    }

    if (message) {
        const textPayload = { phone, message };

        const textResponse = await axios.post(baileysUrl, textPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
            },
            timeout: 30000
        });

        results.push({
            type: 'text',
            success: true,
            response: textResponse.data
        });
    }

    return results;
}

/**
 * POST /webhook/send
 * Recibe { phone, question }, procesa con Bitel API y envía por WhatsApp
 */
router.post('/send', async (req, res) => {
    try {
        const { phone, question } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, error: 'Número de teléfono requerido' });
        }

        if (!question) {
            return res.status(400).json({ success: false, error: 'Pregunta requerida' });
        }

        console.log(`📥 [webhook/send] Recibida pregunta de ${phone}: ${question.substring(0, 50)}...`);

        // Llamar al API de Bitel (mismo servidor)
        const bitelResponse = await axios.post('https://portabilidad-bitel.ai-you.io/api/assistant/message', {
            phone,
            question
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.BITEL_API_KEY}`
            },
            timeout: 60000
        });

        console.log(`✅ [webhook/send] Respuesta de Bitel API:`, JSON.stringify(bitelResponse.data, null, 2));

        const responseData = bitelResponse.data?.data || bitelResponse.data;
        const dataObj = Array.isArray(responseData) ? responseData[0] : responseData;

        const answer = dataObj?.answer || '';
        const imagenUrl = dataObj?.imagen_url || null;
        const status = dataObj?.status || 'pending';

        if (!answer && !imagenUrl) {
            return res.status(500).json({
                success: false,
                error: 'La API de Bitel no devolvió respuesta válida',
                bitel_response: bitelResponse.data
            });
        }

        console.log(`📤 [webhook/send] Enviando respuesta a ${phone}`);

        const results = await sendToBaileys(CONFIG.SESSION_ID, phone, answer, imagenUrl);

        console.log(`✅ [webhook/send] Mensaje enviado correctamente a WhatsApp`);

        res.json({
            success: true,
            message: 'Mensaje procesado y enviado correctamente',
            data: { status, answer, imagen_url: imagenUrl },
            whatsapp_results: results
        });

    } catch (error) {
        console.error('❌ [webhook/send] Error:', error.message);
        const statusCode = error.response?.status || 500;
        res.status(statusCode).json({
            success: false,
            error: 'Error al procesar mensaje',
            details: error.response?.data || error.message
        });
    }
});

/**
 * POST /webhook/whatsapp
 * Recibe mensajes de Baileys y los procesa
 */
router.post('/whatsapp', async (req, res) => {
    try {
        const data = req.body;

        console.log('========== [webhook/whatsapp] MENSAJE RECIBIDO ==========');
        console.log('Data:', JSON.stringify(data, null, 2));

        const sessionId = data.sessionId || data.EmpresaId || null;
        const fromNumber = data.fromNumber || data.from?.replace('@s.whatsapp.net', '') || null;
        const messageText = data.messageText || data.message?.conversation || data.message?.extendedTextMessage?.text || '';
        const pushName = data.pushName || 'Usuario';
        const messageId = data.messageId || null;
        const timestamp = data.timestamp || Date.now();

        if (!fromNumber) {
            return res.status(400).json({ success: false, error: 'Número de teléfono requerido (fromNumber)' });
        }

        if (!messageText || messageText.trim() === '') {
            return res.status(400).json({ success: false, error: 'Mensaje de texto requerido (messageText)' });
        }

        console.log(`📱 From: ${fromNumber}`);
        console.log(`💬 Message: ${messageText}`);

        // Llamar al endpoint /webhook/send del mismo servidor
        const response = await axios.post('https://portabilidad-bitel.ai-you.io/webhook/send', {
            phone: fromNumber,
            question: messageText
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 120000
        });

        console.log('✅ [webhook/whatsapp] Respuesta:', JSON.stringify(response.data, null, 2));

        const wsResponse = response.data;

        res.json({
            success: true,
            data: {
                sessionId,
                fromNumber,
                messageId,
                timestamp,
                pushName,
                originalMessage: messageText,
                reply: wsResponse.data?.answer || 'Sin respuesta',
                status: wsResponse.data?.status || 'pending',
                imagen_url: wsResponse.data?.imagen_url || null,
                messageSent: true,
                whatsapp_results: wsResponse.whatsapp_results || []
            }
        });

    } catch (error) {
        console.error('❌ [webhook/whatsapp] Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data || null
        });
    }
});

module.exports = router;
