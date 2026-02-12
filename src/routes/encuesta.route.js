const EncuestaController = require("../controllers/encuesta.controller.js");
const { Router } = require("express");

const router = Router();

router.get("/encuesta", EncuestaController.getEncuestas);
router.post("/encuesta", EncuestaController.crearEncuesta);

module.exports = router;