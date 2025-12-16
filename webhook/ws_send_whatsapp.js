const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuración
const CONFIG = {
    PORT: process.env.SEND_WS_PORT || 3031,
    BAILEYS_URL: process.env.BAILEYS_URL || 'https://bitel-baileys.xylure.easypanel.host',
    AUTH_TOKEN: process.env.BAILEYS_AUTH_TOKEN || 'f39a8c1d7b264fb19ce2a1d0b7441e98c4f7ba3ef1cd9a0e5d2c8f03b7a5e961',
    BITEL_API_URL: process.env.BITEL_API_URL || 'https://portabilidad-bitel.ai-you.io/api/assistant/message',
    BITEL_API_KEY: process.env.BITEL_API_KEY || '4798d8360969047c6072cb160fad77829288f528f6aa41d35c48134d0a30772a',
    SESSION_ID: process.env.SESSION_ID || 'bitel'
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

// Mimetypes por extensión
const MIME_TYPES = {
    // Imágenes
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    // Documentos
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Audio
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    opus: 'audio/opus',
    // Video
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    webm: 'video/webm'
};

// Defaults por tipo
const DEFAULT_MIMES = {
    image: 'image/jpeg',
    document: 'application/pdf',
    audio: 'audio/mpeg',
    video: 'video/mp4'
};

/**
 * Obtener mimetype desde URL
 */
function getMimeTypeFromUrl(url, type) {
    try {
        const urlPath = new URL(url).pathname;
        const ext = path.extname(urlPath).toLowerCase().replace('.', '');
        return MIME_TYPES[ext] || DEFAULT_MIMES[type] || 'application/octet-stream';
    } catch {
        return DEFAULT_MIMES[type] || 'application/octet-stream';
    }
}

/**
 * Obtener nombre de archivo desde URL
 */
function getFilenameFromUrl(url, defaultName = 'file') {
    try {
        const urlPath = new URL(url).pathname;
        const filename = path.basename(urlPath);
        return filename && filename !== '/' ? filename : defaultName;
    } catch {
        return defaultName;
    }
}

/**
 * Descargar archivo desde URL con reintentos
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
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
                    'Cache-Control': 'no-cache'
                }
            });

            // Verificar que no sea HTML
            const firstBytes = Buffer.from(response.data).slice(0, 100).toString();
            if (firstBytes.toLowerCase().includes('<html') || firstBytes.toLowerCase().includes('<!doctype')) {
                lastError = { error: 'Se recibió HTML en lugar del archivo', url, attempt: attempt + 1 };
                continue;
            }

            return {
                data: Buffer.from(response.data),
                contentType: response.headers['content-type'],
                size: response.data.byteLength
            };

        } catch (error) {
            lastError = {
                error: error.message,
                url,
                httpCode: error.response?.status,
                attempt: attempt + 1
            };
        }
    }

    return lastError;
}

/**
 * Comprimir imagen usando Sharp
 */
async function compressImage(imageBuffer, maxWidth = 800, quality = 70, maxSizeKB = 50) {
    try {
        let compressed = await sharp(imageBuffer)
            .resize(maxWidth, null, { withoutEnlargement: true })
            .jpeg({ quality })
            .toBuffer();

        let currentQuality = quality;
        let currentWidth = maxWidth;

        // Comprimir progresivamente si es necesario
        while (compressed.length / 1024 > maxSizeKB && currentQuality >= 20) {
            currentQuality -= 10;

            if (currentQuality < 50 && currentWidth > 400) {
                currentWidth = Math.floor(currentWidth * 0.75);
            }

            compressed = await sharp(imageBuffer)
                .resize(currentWidth, null, { withoutEnlargement: true })
                .jpeg({ quality: currentQuality })
                .toBuffer();

            console.log(`Compresión: ${currentWidth}px q=${currentQuality} -> ${(compressed.length / 1024).toFixed(2)}KB`);
        }

        return {
            data: compressed,
            contentType: 'image/jpeg',
            wasCompressed: true,
            originalSize: imageBuffer.length,
            finalSize: compressed.length
        };

    } catch (error) {
        console.error('Error comprimiendo imagen:', error.message);
        return {
            data: imageBuffer,
            contentType: 'image/jpeg',
            wasCompressed: false,
            error: error.message
        };
    }
}

/**
 * Enviar mensaje a Baileys
 */
async function sendToBaileys(id_empresa, phone, message, imageUrl = null) {
    const baileysUrl = `${CONFIG.BAILEYS_URL}/session/${id_empresa}/send`;
    const results = [];

    // Si hay imagen, enviarla primero
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

            console.log(`📡 Enviando imagen a Baileys: ${baileysUrl}`);
            const imageResponse = await axios.post(baileysUrl, imagePayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
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

            // Si la imagen ya tiene el mensaje como caption, no enviar texto separado
            return results;
        } else {
            console.error('❌ Error descargando imagen:', downloaded.error);
            // Continuar con el texto si falla la imagen
        }
    }

    // Enviar mensaje de texto (si no hay imagen o si la imagen falló)
    if (message) {
        const textPayload = { phone, message };

        console.log(`📡 Enviando texto a Baileys: ${baileysUrl}`);
        const textResponse = await axios.post(baileysUrl, textPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
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
 * Endpoint principal para enviar mensajes de WhatsApp
 * POST /send
 *
 * Payload esperado:
 * {
 *   "phone": "51999999999",
 *   "question": "Hola, quiero información sobre portabilidad"
 * }
 *
 * El servicio:
 * 1. Llama al API de Bitel para procesar la pregunta
 * 2. Obtiene la respuesta (answer, imagen_url, status)
 * 3. Envía la respuesta por WhatsApp
 */
app.post('/send', async (req, res) => {
    try {
        const { phone, question } = req.body;

        // Validaciones
        if (!phone) {
            return res.status(400).json({ success: false, error: 'Número de teléfono requerido' });
        }

        if (!question) {
            return res.status(400).json({ success: false, error: 'Pregunta requerida' });
        }

        console.log(`📥 Recibida pregunta de ${phone}: ${question.substring(0, 50)}...`);

        // 1. Llamar al API de Bitel para procesar la pregunta
        console.log(`🤖 Procesando con Bitel API: ${CONFIG.BITEL_API_URL}`);

        const bitelResponse = await axios.post(CONFIG.BITEL_API_URL, {
            phone,
            question
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.BITEL_API_KEY}`
            },
            timeout: 60000
        });

        console.log(`✅ Respuesta de Bitel API:`, JSON.stringify(bitelResponse.data, null, 2));

        // 2. Extraer datos de la respuesta
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

        console.log(`📤 Enviando respuesta a ${phone}`);
        console.log(`   Status: ${status}`);
        console.log(`   Mensaje: ${answer.substring(0, 50)}...`);
        console.log(`   Imagen: ${imagenUrl || 'ninguna'}`);

        // 3. Enviar respuesta por WhatsApp
        const results = await sendToBaileys(CONFIG.SESSION_ID, phone, answer, imagenUrl);

        console.log(`✅ Mensaje enviado correctamente a WhatsApp`);

        res.json({
            success: true,
            message: 'Mensaje procesado y enviado correctamente',
            data: {
                status,
                answer,
                imagen_url: imagenUrl
            },
            whatsapp_results: results
        });

    } catch (error) {
        console.error('❌ Error:', error.message);

        const statusCode = error.response?.status || 500;
        res.status(statusCode).json({
            success: false,
            error: 'Error al procesar mensaje',
            details: error.response?.data || error.message,
            http_code: statusCode
        });
    }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Bitel WhatsApp Send Service',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(CONFIG.PORT, () => {
    console.log(`🚀 WhatsApp Send Service corriendo en http://localhost:${CONFIG.PORT}`);
    console.log(`📡 Endpoint: POST /send`);
    console.log(`🔗 Baileys URL: ${CONFIG.BAILEYS_URL}`);
});

module.exports = app;
