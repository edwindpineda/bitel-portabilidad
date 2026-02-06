const { Router } = require("express");
const LlamadaController = require("../../controllers/crm/llamada.controller.js");

const router = Router();

// Rutas de Llamadas
router.get("/llamadas", LlamadaController.getAll);
router.get("/llamadas/campania/:idCampania", LlamadaController.getByCampania);
router.get("/llamadas/provider/:providerCallId", LlamadaController.getByProviderCallId);
router.post("/llamadas", LlamadaController.create);
router.put("/llamadas/nuevaTipificacion", LlamadaController.actualizarTipificacion);

module.exports = router;
