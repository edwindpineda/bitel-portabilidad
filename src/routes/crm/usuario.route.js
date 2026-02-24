const { Router } = require("express");
const UsuarioController = require("../../controllers/crm/usuario.controller.js");

const router = Router();

router.post("/login", UsuarioController.loginUsuario);
router.post("/auth/forgot-password", UsuarioController.forgotPassword);

module.exports = router;