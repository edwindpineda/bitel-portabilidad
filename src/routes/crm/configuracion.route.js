const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ConfiguracionController = require("../../controllers/crm/configuracion.controller.js");

const router = Router();

// Configuración de Multer para subida de imágenes de planes tarifarios
const uploadDir = path.join(__dirname, "../../../uploads/plan_tarifario");

// Crear directorio si no existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storagePlanTarifario = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `plan_${timestamp}${ext}`);
    }
});

const uploadPlanTarifario = multer({
    storage: storagePlanTarifario,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif, webp)"));
    }
});

// Rutas de Roles
router.get("/roles", ConfiguracionController.getRoles);
router.get("/roles/:id", ConfiguracionController.getRolById);
router.post("/roles", ConfiguracionController.createRol);
router.put("/roles/:id", ConfiguracionController.updateRol);
router.delete("/roles/:id", ConfiguracionController.deleteRol);

// Rutas de Usuarios
router.get("/usuarios", ConfiguracionController.getUsuarios);
router.get("/usuarios/rol/:idRol", ConfiguracionController.getUsuariosByRol);
router.get("/usuarios/:id", ConfiguracionController.getUsuarioById);
router.post("/usuarios", ConfiguracionController.createUsuario);
router.put("/usuarios/:id", ConfiguracionController.updateUsuario);
router.put("/usuarios/:id/password", ConfiguracionController.changePassword);
router.delete("/usuarios/:id", ConfiguracionController.deleteUsuario);

// Rutas de Módulos
router.get("/modulos", ConfiguracionController.getModulos);
router.get("/modulos/:id", ConfiguracionController.getModuloById);
router.post("/modulos", ConfiguracionController.createModulo);
router.put("/modulos/:id", ConfiguracionController.updateModulo);
router.delete("/modulos/:id", ConfiguracionController.deleteModulo);

// Rutas de Sucursales
router.get("/sucursales", ConfiguracionController.getSucursales);
router.get("/sucursales/:id", ConfiguracionController.getSucursalById);
router.post("/sucursales", ConfiguracionController.createSucursal);
router.put("/sucursales/:id", ConfiguracionController.updateSucursal);
router.delete("/sucursales/:id", ConfiguracionController.deleteSucursal);

// Rutas de Proveedores
router.get("/proveedores", ConfiguracionController.getProveedores);
router.get("/proveedores/:id", ConfiguracionController.getProveedorById);
router.post("/proveedores", ConfiguracionController.createProveedor);
router.put("/proveedores/:id", ConfiguracionController.updateProveedor);
router.delete("/proveedores/:id", ConfiguracionController.deleteProveedor);

// Rutas de Planes Tarifarios
router.get("/planes-tarifarios", ConfiguracionController.getPlanesTarifarios);
router.get("/planes-tarifarios/:id", ConfiguracionController.getPlanTarifarioById);
router.post("/planes-tarifarios", uploadPlanTarifario.single('imagen'), ConfiguracionController.createPlanTarifario);
router.put("/planes-tarifarios/:id", uploadPlanTarifario.single('imagen'), ConfiguracionController.updatePlanTarifario);
router.delete("/planes-tarifarios/:id", ConfiguracionController.deletePlanTarifario);

// Rutas de Preguntas Frecuentes
router.get("/faqs", ConfiguracionController.getFaqs);
router.get("/faqs/:id", ConfiguracionController.getFaqById);
router.post("/faqs", ConfiguracionController.createFaq);
router.put("/faqs/:id", ConfiguracionController.updateFaq);
router.delete("/faqs/:id", ConfiguracionController.deleteFaq);

// Rutas de Tipificaciones
router.get("/tipificaciones", ConfiguracionController.getTipificaciones);
router.get("/tipificaciones/:id", ConfiguracionController.getTipificacionById);
router.post("/tipificaciones", ConfiguracionController.createTipificacion);
router.put("/tipificaciones/:id", ConfiguracionController.updateTipificacion);
router.delete("/tipificaciones/:id", ConfiguracionController.deleteTipificacion);

// Rutas de Estados (solo lectura y edición de color)
router.get("/estados", ConfiguracionController.getEstados);
router.get("/estados/:id", ConfiguracionController.getEstadoById);
router.patch("/estados/:id/color", ConfiguracionController.updateEstadoColor);

// Rutas de Preguntas de Perfilamiento
router.get("/preguntas-perfilamiento", ConfiguracionController.getPreguntasPerfilamiento);
router.get("/preguntas-perfilamiento/:id", ConfiguracionController.getPreguntaPerfilamientoById);
router.post("/preguntas-perfilamiento", ConfiguracionController.createPreguntaPerfilamiento);
router.put("/preguntas-perfilamiento/:id", ConfiguracionController.updatePreguntaPerfilamiento);
router.delete("/preguntas-perfilamiento/:id", ConfiguracionController.deletePreguntaPerfilamiento);

// Rutas de Argumentos de Venta
router.get("/argumentos-venta", ConfiguracionController.getArgumentosVenta);
router.get("/argumentos-venta/:id", ConfiguracionController.getArgumentoVentaById);
router.post("/argumentos-venta", ConfiguracionController.createArgumentoVenta);
router.put("/argumentos-venta/:id", ConfiguracionController.updateArgumentoVenta);
router.delete("/argumentos-venta/:id", ConfiguracionController.deleteArgumentoVenta);

// Rutas de Periodicidad de Recordatorios
router.get("/periodicidades-recordatorio", ConfiguracionController.getPeriodicidadesRecordatorio);
router.get("/periodicidades-recordatorio/:id", ConfiguracionController.getPeriodicidadRecordatorioById);
router.post("/periodicidades-recordatorio", ConfiguracionController.createPeriodicidadRecordatorio);
router.put("/periodicidades-recordatorio/:id", ConfiguracionController.updatePeriodicidadRecordatorio);
router.delete("/periodicidades-recordatorio/:id", ConfiguracionController.deletePeriodicidadRecordatorio);

// Rutas de Formatos
router.get("/formatos", ConfiguracionController.getFormatos);
router.get("/formatos/:id", ConfiguracionController.getFormatoById);
router.post("/formatos", ConfiguracionController.createFormato);
router.put("/formatos/:id", ConfiguracionController.updateFormato);
router.delete("/formatos/:id", ConfiguracionController.deleteFormato);

// Rutas de Campos de Formato
router.get("/formatos/:idFormato/campos", ConfiguracionController.getCamposByFormato);
router.get("/formato-campos/:id", ConfiguracionController.getCampoById);
router.post("/formato-campos", ConfiguracionController.createCampo);
router.put("/formato-campos/:id", ConfiguracionController.updateCampo);
router.delete("/formato-campos/:id", ConfiguracionController.deleteCampo);
router.patch("/formato-campos/orden", ConfiguracionController.updateOrdenCampos);

// Configuracion de Multer para carga de archivos Excel/CSV
const uploadBaseNumero = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB maximo
    fileFilter: (req, file, cb) => {
        const allowedTypes = /xlsx|xls|csv/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) {
            return cb(null, true);
        }
        cb(new Error("Solo se permiten archivos Excel (xlsx, xls) o CSV"));
    }
});

// Rutas de Base de Numeros
router.get("/bases-numeros", ConfiguracionController.getBasesNumeros);
router.get("/bases-numeros/:id", ConfiguracionController.getBaseNumeroById);
router.post("/bases-numeros", ConfiguracionController.createBaseNumero);
router.put("/bases-numeros/:id", ConfiguracionController.updateBaseNumero);
router.delete("/bases-numeros/:id", ConfiguracionController.deleteBaseNumero);

// Rutas de Detalle Base de Numeros
router.get("/bases-numeros/:idBase/detalles", ConfiguracionController.getDetallesByBaseNumero);
router.post("/base-numero-detalles", ConfiguracionController.createDetalle);
router.delete("/base-numero-detalles/:id", ConfiguracionController.deleteDetalle);

// Ruta de carga masiva
router.post("/bases-numeros/upload", uploadBaseNumero.single('archivo'), ConfiguracionController.uploadBaseNumero);

// Rutas de Plantillas
router.get("/plantillas", ConfiguracionController.getPlantillas);
router.get("/plantillas/:id", ConfiguracionController.getPlantillaById);
router.get("/formatos/:idFormato/plantillas", ConfiguracionController.getPlantillasByFormato);
router.post("/plantillas", ConfiguracionController.createPlantilla);
router.put("/plantillas/:id", ConfiguracionController.updatePlantilla);
router.delete("/plantillas/:id", ConfiguracionController.deletePlantilla);

// Rutas de Campanias
router.get("/campanias", ConfiguracionController.getCampanias);
router.get("/campanias/:id", ConfiguracionController.getCampaniaById);
router.post("/campanias", ConfiguracionController.createCampania);
router.put("/campanias/:id", ConfiguracionController.updateCampania);
router.delete("/campanias/:id", ConfiguracionController.deleteCampania);

// Rutas de Bases de Campania
router.get("/campanias/:idCampania/bases", ConfiguracionController.getBasesByCampania);
router.post("/campania-bases", ConfiguracionController.addBaseToCampania);
router.delete("/campania-bases/:id", ConfiguracionController.removeBaseFromCampania);

// Rutas de Ejecucion de Campania
router.get("/campanias/:idCampania/ejecuciones", ConfiguracionController.getEjecucionesByCampania);
router.get("/campanias/:idCampania/estadisticas", ConfiguracionController.getEstadisticasCampania);
router.post("/campania-ejecuciones/ejecutar", ConfiguracionController.ejecutarCampania);
router.get("/campania-ejecuciones/:id", ConfiguracionController.getEjecucionById);
router.patch("/campania-ejecuciones/:id/estado", ConfiguracionController.updateEstadoEjecucion);
router.patch("/campania-ejecuciones/:id/cancelar", ConfiguracionController.cancelarEjecucion);

module.exports = router;
