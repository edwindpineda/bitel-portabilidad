const EncuestaController = require("../controllers/encuesta.controller.js");
const { Router } = require("express");
const multer = require("multer");
const authMiddleware = require("../middlewares/auth.middleware.js");

const router = Router();

// Configuracion de Multer para carga de archivos Excel/CSV
const uploadPersonas = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB maximo
    fileFilter: (req, file, cb) => {
        const path = require("path");
        const allowedTypes = /xlsx|xls|csv/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) {
            return cb(null, true);
        }
        cb(new Error("Solo se permiten archivos Excel (xlsx, xls) o CSV"));
    }
});

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ msg: "El archivo es demasiado grande. Maximo 50MB" });
        }
        return res.status(400).json({ msg: `Error al subir archivo: ${err.message}` });
    } else if (err) {
        return res.status(400).json({ msg: err.message });
    }
    next();
};

// Rutas de Encuestas
router.get("/encuesta", EncuestaController.getEncuestas);
router.post("/encuesta", EncuestaController.crearEncuesta);
router.get("/encuesta/departamentos", EncuestaController.getDepartamentos);
router.get("/encuesta/municipios", EncuestaController.getMunicipios);

// Rutas de Personas (encuesta_base_numero) - requieren autenticacion
router.get("/encuesta/personas", authMiddleware, EncuestaController.getPersonas);
router.get("/encuesta/personas/stats", authMiddleware, EncuestaController.getPersonasStats);
router.get("/encuesta/personas/:id", authMiddleware, EncuestaController.getPersonaById);
router.post("/encuesta/personas", authMiddleware, EncuestaController.createPersona);
router.put("/encuesta/personas/:id", authMiddleware, EncuestaController.updatePersona);
router.delete("/encuesta/personas/:id", authMiddleware, EncuestaController.deletePersona);
router.post("/encuesta/personas/upload", authMiddleware, uploadPersonas.single('archivo'), handleMulterError, EncuestaController.uploadPersonas);

module.exports = router;