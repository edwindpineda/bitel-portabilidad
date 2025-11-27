const { Router } = require("express");

const ReporteController = require("../controllers/reporte.controller.js");

const router = Router();

router.get("/reporte", 
    ReporteController.getReporte
);

router.get("/reporte-download/excel", 
    ReporteController.getReporteExcel
);

module.exports = router;