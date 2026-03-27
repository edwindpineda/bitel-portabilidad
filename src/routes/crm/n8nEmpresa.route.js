/**
 * Rutas para integración con n8n - Gestión de Empresas
 * Protegidas con API Key en lugar de JWT
 */

const { Router } = require("express");
const N8nEmpresaController = require("../../controllers/crm/n8nEmpresa.controller.js");
const { validateN8nApiKey } = require("../../middlewares/n8nAuth.middleware.js");

const router = Router();

// Aplicar middleware de autenticación n8n a todas las rutas
router.use(validateN8nApiKey);

// GET /n8n/empresa/listar - Listar empresas activas (con estadísticas opcionales)
router.get("/empresa/listar", N8nEmpresaController.listar);

// GET /n8n/empresa/estadisticas-chats - Estadísticas de chats sin respuesta por empresa
router.get("/empresa/estadisticas-chats", N8nEmpresaController.estadisticasChats);

// GET /n8n/empresa/resumen-pendientes - Resumen de empresas con envíos pendientes
router.get("/empresa/resumen-pendientes", N8nEmpresaController.resumenPendientes);

module.exports = router;
