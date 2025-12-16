const { Router } = require("express");
const ContactoController = require("../../controllers/crm/contacto.controller.js");

const router = Router();

router.get("/contactos/buscar/:query", ContactoController.search);
router.get("/contactos/unread/count", ContactoController.getUnreadCount);
router.get("/contactos/:offset", ContactoController.getAll);
router.get("/contacto/:idContacto/mensajes", ContactoController.getMensajes);
router.post("/contacto/:idContacto/mensajes", ContactoController.createMensaje);
router.patch("/contacto/:idContacto/toggle-bot", ContactoController.toggleBotActivo);
router.post("/contacto/:idContacto/mark-read", ContactoController.markAsRead);

module.exports = router;
