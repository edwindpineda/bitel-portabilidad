const PagoController = require("../controllers/page.controller.js");
const { Router } = require("express");

const router = Router();

router.get("/link-pago", PagoController.linkPago);
router.get("/link-cambio", PagoController.linkCambio);

module.exports = router;