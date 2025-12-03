const { Router } = require("express");
const AuditoriaController = require("../../controllers/crm/auditoria.controller.js");

const router = Router();

router.get("/chats/:contacto", AuditoriaController.getChatsByContacto);

module.exports = router;
