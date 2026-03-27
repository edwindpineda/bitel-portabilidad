const { Router } = require("express");
const AnalisisSentimientoController = require("../../controllers/crm/analisisSentimiento.controller.js");

const router = Router();

// GET /crm/analisis/llamada/:idLlamada
router.get("/analisis/llamada/:idLlamada", AnalisisSentimientoController.getByLlamada);

// GET /crm/analisis/chat/:idChat
router.get("/analisis/chat/:idChat", AnalisisSentimientoController.getByChat);

// GET /crm/analisis/dashboard
router.get("/analisis/dashboard", AnalisisSentimientoController.getDashboard);

// POST /crm/analisis/backfill-llamadas?limit=50
router.post("/analisis/backfill-llamadas", AnalisisSentimientoController.backfillLlamadas);

module.exports = router;
