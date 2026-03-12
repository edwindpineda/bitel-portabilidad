const { Router } = require("express");
const ConfiguracionWhatsappController = require("../controllers/configuracionWhatsapp.controller.js");

const router = Router();

router.get("/configuracion-whatsapp", ConfiguracionWhatsappController.getAll);
router.get("/configuracion-whatsapp/:id", ConfiguracionWhatsappController.getById);
router.get("/configuracion-whatsapp/empresa/:empresaId", ConfiguracionWhatsappController.getByEmpresaId);
router.post("/configuracion-whatsapp", ConfiguracionWhatsappController.create);
router.put("/configuracion-whatsapp/:id", ConfiguracionWhatsappController.update);
router.delete("/configuracion-whatsapp/:id", ConfiguracionWhatsappController.delete);

module.exports = router;
