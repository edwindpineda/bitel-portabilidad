const { Router } = require("express");
const ContactosController = require("../../controllers/crm/contactos.controller.js");

const router = Router();

router.get("/unread/count", ContactosController.getUnreadCount);
router.get("/buscar/:query", ContactosController.searchContactos);
router.get("/:offset", ContactosController.getContactos);

module.exports = router;
