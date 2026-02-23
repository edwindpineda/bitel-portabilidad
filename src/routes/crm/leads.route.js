const { Router } = require("express");
const LeadsController = require("../../controllers/crm/leads.controller.js");

const router = Router();

router.get("/", LeadsController.getLeads);
router.get("/asesores", LeadsController.getAsesores);
router.get("/proveedores", LeadsController.getProveedores);
router.get("/catalogo", LeadsController.getCatalogo);
router.get("/:id", LeadsController.getLeadById);
router.get("/:id/perfilamiento", LeadsController.getPerfilamiento);
router.put("/:id", LeadsController.updateLead);
router.post("/bulk-assign", LeadsController.bulkAssignAsesor);
router.post("/sync-sperant", LeadsController.syncSperant);

module.exports = router;
