/**
 * Rutas para integración con n8n - Recuperación de cobranzas
 * Protegidas con API Key en lugar de JWT
 */

const { Router } = require("express");
const N8nRecuperacionController = require("../../controllers/crm/n8nRecuperacion.controller.js");
const { validateN8nApiKey } = require("../../middlewares/n8nAuth.middleware.js");

const router = Router();

router.use(validateN8nApiKey);

// POST /n8n/recuperacion/marcar-visto-masivo
router.post("/recuperacion/marcar-visto-masivo", N8nRecuperacionController.marcarVistoMasivo);

// GET /n8n/recuperacion/candidatos - Lista candidatos pendientes de envío agrupados por empresa
router.get("/recuperacion/candidatos", N8nRecuperacionController.getCandidatosRecuperacion);

// POST /n8n/recuperacion/enviar-recuperacion - Envía mensaje de recuperación individual por id_mensaje_visto
router.post("/recuperacion/enviar-recuperacion", N8nRecuperacionController.enviarRecuperacion);

module.exports = router;
