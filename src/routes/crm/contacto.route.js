const { Router } = require("express");
const ContactoController = require("../../controllers/crm/contacto.controller.js");

const router = Router();

router.get("/contactos/buscar/:query", ContactoController.search);
router.get("/contactos/:offset", ContactoController.getAll);
router.get("/contacto/:idContacto/mensajes", ContactoController.getMensajes);

module.exports = router;
