const { Router } = require("express");
const ChatController = require("../../controllers/crm/chat.controller.js");

const router = Router();

router.get("/", ChatController.findAll);
router.get("/:id", ChatController.findById);
router.get("/persona/:id_persona", ChatController.findByPersona);
router.post("/", ChatController.create);
router.put("/:id", ChatController.update);
router.delete("/:id", ChatController.delete);

module.exports = router;
