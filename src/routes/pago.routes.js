const PagoController = require("../controllers/page.controller.js");
const { Router } = require("express");

const router = Router();

router.post("/link-pago", PagoController.linkPago);
router.post("/link-cambio", PagoController.linkCambio);

module.exports = router;