const { Router } = require("express");
const ContactoController = require("../../controllers/crm/contacto.controller.js");

const router = Router();

router.get("/contactos", ContactoController.getAll);

module.exports = router;
