const { Router } = require("express");
const multer = require("multer");
const TicketController = require("../../controllers/crm/ticket.controller.js");

const router = Router();

const uploadFiles = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Catalogos y estadisticas
router.get("/tickets/catalogos", TicketController.getCatalogos);
router.get("/tickets/stats", TicketController.getStats);
router.get("/tickets/usuarios", TicketController.getUsuarios);

// CRUD de tickets
router.get("/tickets", TicketController.getAll);
router.get("/tickets/:id", TicketController.getById);
router.post("/tickets", TicketController.create);
router.put("/tickets/:id", TicketController.update);

// Acciones sobre ticket
router.patch("/tickets/:id/estado", TicketController.updateEstado);
router.patch("/tickets/:id/asignar", TicketController.assignUser);

// Comentarios
router.get("/tickets/:id/comentarios", TicketController.getComentarios);
router.post("/tickets/:id/comentarios", uploadFiles.array('archivos', 5), TicketController.createComentario);

// Adjuntos
router.post("/tickets/:id/adjuntos", uploadFiles.single('archivo'), TicketController.uploadAdjunto);

// Historial y participantes
router.get("/tickets/:id/historial", TicketController.getHistorial);
router.get("/tickets/:id/participantes", TicketController.getParticipantes);
router.post("/tickets/:id/participantes", TicketController.addParticipante);

// Lectura
router.post("/tickets/:id/mark-read", TicketController.markAsRead);

module.exports = router;
