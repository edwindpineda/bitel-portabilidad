const { Router } = require("express");
const LeadsController = require("../../controllers/crm/leads.controller.js");

const router = Router();

router.get("/", LeadsController.getLeads);
router.get("/asesores", LeadsController.getAsesores);
router.get("/:id", LeadsController.getLeadById);
router.put("/:id/asesor", LeadsController.assignAsesor);
router.post("/bulk-assign", LeadsController.bulkAssignAsesor);

module.exports = router;
