const { Router } = require("express");
const ClientesController = require("../../controllers/crm/clientes.controller.js");

const router = Router();

router.get("/", ClientesController.getClientes);
router.get("/:id", ClientesController.getClienteById);

module.exports = router;
