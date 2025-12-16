const { Router } = require("express");
const ReportesCrmController = require("../../controllers/crm/reportes.controller.js");

const router = Router();

// Reporte de embudo de ventas
router.get("/funnel", ReportesCrmController.getFunnelData);

// Estadisticas del dashboard
router.get("/dashboard", ReportesCrmController.getDashboardStats);

module.exports = router;
