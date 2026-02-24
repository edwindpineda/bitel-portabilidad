const { Router } = require("express");
const { pool } = require("../config/dbConnection.js");
const logger = require('../config/logger/loggerClient.js');

const router = Router();

// Dashboard general
router.get("/dashboard", async (req, res) => {
  try {
    const { idEmpresa } = req.query;
    const params = [];
    let empresaCond = '';
    if (idEmpresa) { empresaCond = ' AND p.id_empresa = ?'; params.push(idEmpresa); }

    const [totalLeads] = await pool.execute(`SELECT COUNT(*) as total FROM persona p WHERE p.estado_registro = 1${empresaCond}`, params);
    const [leadsSemana] = await pool.execute(`SELECT COUNT(*) as total FROM persona p WHERE p.estado_registro = 1 AND p.fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)${empresaCond}`, params);
    const [contactados] = await pool.execute(`SELECT COUNT(DISTINCT p.id) as total FROM persona p INNER JOIN chat c ON c.id_persona = p.id INNER JOIN mensaje m ON m.id_chat = c.id WHERE p.estado_registro = 1${empresaCond}`, params);

    return res.status(200).json({
      data: {
        totalLeads: totalLeads[0]?.total || 0,
        leadsSemana: leadsSemana[0]?.total || 0,
        contactados: contactados[0]?.total || 0
      }
    });
  } catch (error) {
    logger.error(`[dashboard.route.js] Error: ${error.message}`);
    return res.status(500).json({ msg: "Error al obtener dashboard" });
  }
});

// Resumen
router.get("/resumen", async (req, res) => {
  try {
    const { idEmpresa } = req.query;
    const params = [];
    let empresaCond = '';
    if (idEmpresa) { empresaCond = ' AND p.id_empresa = ?'; params.push(idEmpresa); }

    const [totalLeads] = await pool.execute(`SELECT COUNT(*) as total FROM persona p WHERE p.estado_registro = 1${empresaCond}`, params);
    const [porEstado] = await pool.execute(`SELECT e.nombre, e.color, COUNT(p.id) as total FROM estado e LEFT JOIN persona p ON p.id_estado = e.id AND p.estado_registro = 1${empresaCond} GROUP BY e.id, e.nombre, e.color ORDER BY e.id`, params);

    return res.status(200).json({
      data: {
        totalLeads: totalLeads[0]?.total || 0,
        porEstado
      }
    });
  } catch (error) {
    logger.error(`[dashboard.route.js] Error resumen: ${error.message}`);
    return res.status(500).json({ msg: "Error al obtener resumen" });
  }
});

// Funnel
router.get("/funnel", async (req, res) => {
  try {
    const { idEmpresa, dateFrom, dateTo } = req.query;
    const params = [];
    let empresaCond = '';
    let dateCond = '';
    if (idEmpresa) { empresaCond = ' AND p.id_empresa = ?'; params.push(idEmpresa); }
    if (dateFrom && dateTo) { dateCond = ' AND p.fecha_registro >= ? AND p.fecha_registro <= ?'; params.push(dateFrom + ' 00:00:00', dateTo + ' 23:59:59'); }

    const [totalLeads] = await pool.execute(`SELECT COUNT(*) as total FROM persona p WHERE p.estado_registro = 1${empresaCond}${dateCond}`, params);
    const [contactados] = await pool.execute(`SELECT COUNT(DISTINCT p.id) as total FROM persona p INNER JOIN chat c ON c.id_persona = p.id INNER JOIN mensaje m ON m.id_chat = c.id WHERE p.estado_registro = 1${empresaCond}${dateCond}`, params);

    const total = totalLeads[0]?.total || 0;
    const cont = contactados[0]?.total || 0;

    return res.status(200).json({
      data: {
        totalLeads: { nombre: 'Total Leads', valor: total, porcentaje: 100 },
        contactados: { nombre: 'Contactados', valor: cont, porcentaje: total > 0 ? Math.round((cont / total) * 100) : 0 }
      }
    });
  } catch (error) {
    logger.error(`[dashboard.route.js] Error funnel: ${error.message}`);
    return res.status(500).json({ msg: "Error al obtener funnel" });
  }
});

// Consumo
router.get("/consumo", async (req, res) => {
  try {
    const { idEmpresa, mes } = req.query;
    return res.status(200).json({ data: { mensajes: 0, creditos: 0, mes: mes || null } });
  } catch (error) {
    logger.error(`[dashboard.route.js] Error consumo: ${error.message}`);
    return res.status(500).json({ msg: "Error al obtener consumo" });
  }
});

// Consumo llamadas
router.get("/consumo-llamadas", async (req, res) => {
  try {
    const { idEmpresa, mes } = req.query;
    const params = [];
    let empresaCond = '';
    if (idEmpresa) { empresaCond = ' WHERE id_empresa = ?'; params.push(idEmpresa); }

    const [total] = await pool.execute(`SELECT COUNT(*) as total FROM llamada${empresaCond}`, params);
    return res.status(200).json({ data: { totalLlamadas: total[0]?.total || 0, mes: mes || null } });
  } catch (error) {
    logger.error(`[dashboard.route.js] Error consumo-llamadas: ${error.message}`);
    return res.status(500).json({ msg: "Error al obtener consumo de llamadas" });
  }
});

// Consumo histórico
router.get("/consumo-historico", async (req, res) => {
  try {
    const { idEmpresa, tipo, periodo } = req.query;
    return res.status(200).json({ data: { historico: [], tipo, periodo } });
  } catch (error) {
    logger.error(`[dashboard.route.js] Error consumo-historico: ${error.message}`);
    return res.status(500).json({ msg: "Error al obtener consumo histórico" });
  }
});

// WhatsApp Dashboard
router.get("/whatsapp-dashboard", async (req, res) => {
  try {
    const { idEmpresa } = req.query;
    const params = [];
    let empresaCond = '';
    if (idEmpresa) { empresaCond = ' AND id_empresa = ?'; params.push(idEmpresa); }

    const [totalContactos] = await pool.execute(`SELECT COUNT(*) as total FROM chat WHERE estado_registro = 1${empresaCond}`, params);
    const [totalMensajes] = await pool.execute(`SELECT COUNT(*) as total FROM mensaje WHERE 1=1${empresaCond}`, params);

    return res.status(200).json({
      data: {
        totalContactos: totalContactos[0]?.total || 0,
        totalMensajes: totalMensajes[0]?.total || 0
      }
    });
  } catch (error) {
    logger.error(`[dashboard.route.js] Error whatsapp-dashboard: ${error.message}`);
    return res.status(500).json({ msg: "Error al obtener WhatsApp dashboard" });
  }
});

// WhatsApp Campañas
router.get("/whatsapp-campanas", async (req, res) => {
  try {
    const { idEmpresa } = req.query;
    const params = [];
    let empresaCond = '';
    if (idEmpresa) { empresaCond = ' AND c.id_empresa = ?'; params.push(idEmpresa); }

    const [campanias] = await pool.execute(`SELECT c.* FROM campania c WHERE c.estado_registro = 1${empresaCond} ORDER BY c.fecha_registro DESC`, params);
    return res.status(200).json({ data: campanias });
  } catch (error) {
    logger.error(`[dashboard.route.js] Error whatsapp-campanas: ${error.message}`);
    return res.status(500).json({ msg: "Error al obtener campañas WhatsApp" });
  }
});

// Automatización - Campañas
router.get("/automatizacion/campanas", async (req, res) => {
  try {
    const { idEmpresa } = req.query;
    return res.status(200).json({ data: [] });
  } catch (error) {
    logger.error(`[dashboard.route.js] Error automatizacion campanas: ${error.message}`);
    return res.status(500).json({ msg: "Error al obtener campañas de automatización" });
  }
});

// Automatización - Recordatorios
router.get("/automatizacion/recordatorios", async (req, res) => {
  try {
    const { idEmpresa } = req.query;
    return res.status(200).json({ data: [] });
  } catch (error) {
    logger.error(`[dashboard.route.js] Error automatizacion recordatorios: ${error.message}`);
    return res.status(500).json({ msg: "Error al obtener recordatorios" });
  }
});

// Automatización - Recuperación
router.get("/automatizacion/recuperacion", async (req, res) => {
  try {
    const { idEmpresa } = req.query;
    return res.status(200).json({ data: [] });
  } catch (error) {
    logger.error(`[dashboard.route.js] Error automatizacion recuperacion: ${error.message}`);
    return res.status(500).json({ msg: "Error al obtener recuperación" });
  }
});

module.exports = router;
