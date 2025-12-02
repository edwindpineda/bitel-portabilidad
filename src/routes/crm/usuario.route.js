const { Router } = require("express");
const UsuarioController = require("../../controllers/crm/usuario.controller.js");

const router = Router();

router.post("/login", UsuarioController.loginUsuario);

module.exports = router;