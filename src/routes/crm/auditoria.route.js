const { Router } = require("express");
const AuditoriaController = require("../../controllers/crm/auditoria.controller.js");

const router = Router();

router.get("/chats", AuditoriaController.getAll);

module.exports = router;
