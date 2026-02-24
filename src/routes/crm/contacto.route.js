const { Router } = require("express");
const ContactoController = require("../../controllers/crm/contacto.controller.js");

const router = Router();

router.get("/:id/mensajes", ContactoController.getMensajes);
router.post("/:id/mark-read", ContactoController.markRead);
router.post("/:id/mensajes", ContactoController.sendMensaje);
router.patch("/:id/toggle-bot", ContactoController.toggleBot);

module.exports = router;
