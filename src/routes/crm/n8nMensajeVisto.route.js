/**
 * Rutas para integración con n8n - Mensajes de Recuperación (mensaje_visto)
 * Protegidas con API Key en lugar de JWT
 */

const { Router } = require("express");
const N8nMensajeVistoController = require("../../controllers/crm/n8nMensajeVisto.controller.js");
const { validateN8nApiKey } = require("../../middlewares/n8nAuth.middleware.js");

const router = Router();

// Aplicar middleware de autenticación n8n a todas las rutas
router.use(validateN8nApiKey);

// POST /n8n/mensaje-visto/procesar - Procesar últimos mensajes y registrar los que tienen URL de cobranzas
router.post("/mensaje-visto/procesar", N8nMensajeVistoController.procesar);

// GET /n8n/mensaje-visto/preview - Vista previa de mensajes que serían procesados
router.get("/mensaje-visto/preview", N8nMensajeVistoController.preview);

module.exports = router;
