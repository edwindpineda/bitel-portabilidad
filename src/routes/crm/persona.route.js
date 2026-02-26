const { Router } = require("express");
const PersonaController = require("../../controllers/crm/persona.controller.js");

const router = Router();

router.get("/persona/:id", PersonaController.getById);
router.post("/persona", PersonaController.create);
router.put("/persona/:id", PersonaController.update);
router.post("/persona/bulk-assign", PersonaController.bulkAssign);

module.exports = router;
