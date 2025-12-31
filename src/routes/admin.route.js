const { Router } = require("express");
const AdminController = require("../controllers/admin.controller.js");

const router = Router();

// Rutas de Empresas
router.get("/empresas", AdminController.getEmpresas);
router.get("/empresas/:id", AdminController.getEmpresaById);
router.post("/empresas", AdminController.createEmpresa);
router.put("/empresas/:id", AdminController.updateEmpresa);
router.put("/empresas/:id/estado", AdminController.updateEstadoEmpresa);
router.delete("/empresas/:id", AdminController.deleteEmpresa);

// Rutas de Usuarios
router.get("/usuarios", AdminController.getUsuarios);
router.post("/usuarios", AdminController.createUsuario);
router.put("/usuarios/:id", AdminController.updateUsuario);
router.delete("/usuarios/:id", AdminController.deleteUsuario);
router.put("/usuarios/:id/empresa", AdminController.asignarEmpresaUsuario);

// Estadisticas
router.get("/stats", AdminController.getStats);

module.exports = router;
