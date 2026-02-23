const { pool } = require("../../config/dbConnection.js");
const logger = require('../../config/logger/loggerClient.js');

class ReportesCrmController {
  async getFunnelData(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;

      // Obtener info del usuario autenticado
      const { userId, rolId, idEmpresa } = req.user || {};

      // Filtrar por id_empresa del usuario
      let empresaCondition = '';
      const empresaParams = [];
      if (idEmpresa) {
        empresaCondition = ' AND p.id_empresa = ?';
        empresaParams.push(idEmpresa);
      }

      // Si el rol es >= 3, filtrar solo los prospectos asignados a este asesor
      let asesorCondition = '';
      const asesorParams = [];
      if (rolId && rolId >= 3 && userId) {
        asesorCondition = ' AND p.id_asesor = ?';
        asesorParams.push(userId);
      }

      // Construir clausula de fecha
      let dateCondition = '';
      const dateParams = [];

      if (dateFrom && dateTo) {
        dateCondition = ' AND p.created_at >= ? AND p.created_at <= ?';
        dateParams.push(dateFrom + ' 00:00:00', dateTo + ' 23:59:59');
      } else if (dateFrom) {
        dateCondition = ' AND p.created_at >= ?';
        dateParams.push(dateFrom + ' 00:00:00');
      } else if (dateTo) {
        dateCondition = ' AND p.created_at <= ?';
        dateParams.push(dateTo + ' 23:59:59');
      }

      const params = [...empresaParams, ...asesorParams, ...dateParams];

      // 1. Total de leads (prospectos con tipo_usuario = 'user')
      const [totalLeadsResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM prospecto p
        WHERE p.estado_registro = 1
        ${empresaCondition}
        ${asesorCondition}
        ${dateCondition}
      `, params);
      const totalLeads = totalLeadsResult[0]?.total || 0;

      // 2. Contactados (prospectos que tienen al menos un mensaje)
      const [contactadosResult] = await pool.execute(`
        SELECT COUNT(DISTINCT p.id) as total
        FROM prospecto p
        INNER JOIN contacto c ON c.id_prospecto = p.id
        INNER JOIN mensaje m ON m.id_contacto = c.id
        WHERE p.estado_registro = 1
        ${empresaCondition}
        ${asesorCondition}
        ${dateCondition}
      `, params);
      const contactados = contactadosResult[0]?.total || 0;

      // 3. Interesados (prospectos con estado line1 o line2)
      const [interesadosResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM prospecto p
        INNER JOIN estado e ON e.id = p.id_estado
        WHERE (LOWER(e.nombre) LIKE '%line1%' OR LOWER(e.nombre) LIKE '%line2%')
        AND p.estado_registro = 1
        ${empresaCondition}
        ${asesorCondition}
        ${dateCondition}
      `, params);
      const interesados = interesadosResult[0]?.total || 0;

      // Calcular porcentajes
      const funnelData = {
        totalLeads: {
          nombre: 'Total Leads',
          valor: totalLeads,
          porcentaje: 100
        },
        contactados: {
          nombre: 'Contactados',
          valor: contactados,
          porcentaje: totalLeads > 0 ? Math.round((contactados / totalLeads) * 100) : 0
        },
        interesados: {
          nombre: 'Interesados',
          valor: interesados,
          porcentaje: totalLeads > 0 ? Math.round((interesados / totalLeads) * 100) : 0
        }
      };

      return res.status(200).json({ data: funnelData });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener datos del embudo: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener datos del embudo" });
    }
  }

  async getDashboardStats(req, res) {
    try {
      // Obtener info del usuario autenticado
      const { userId, rolId, idEmpresa } = req.user || {};

      // Filtrar por id_empresa del usuario
      let empresaCondition = '';
      const empresaParams = [];
      if (idEmpresa) {
        empresaCondition = ' AND p.id_empresa = ?';
        empresaParams.push(idEmpresa);
      }

      // Si el rol es >= 3, filtrar solo los prospectos asignados a este asesor
      let asesorCondition = '';
      const asesorParams = [];
      if (rolId && rolId >= 3 && userId) {
        asesorCondition = ' AND p.id_asesor = ?';
        asesorParams.push(userId);
      }

      const params = [...empresaParams, ...asesorParams];

      // 1. Total de leads (prospectos con tipo_usuario = 'user')
      const [totalLeadsResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM prospecto p
        WHERE p.estado_registro = 1
        ${empresaCondition}
        ${asesorCondition}
      `, params);
      const totalLeads = totalLeadsResult[0]?.total || 0;

      // 2. Interesados (prospectos con estado line1 o line2) = Tasa de conversion
      const [interesadosResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM prospecto p
        INNER JOIN estado e ON e.id = p.id_estado
        WHERE (LOWER(e.nombre) LIKE '%line1%' OR LOWER(e.nombre) LIKE '%line2%')
        AND p.estado_registro = 1
        ${empresaCondition}
        ${asesorCondition}
      `, params);
      const interesados = interesadosResult[0]?.total || 0;

      // 3. Leads nuevos esta semana
      const [leadsSemanasResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM prospecto p
        WHERE p.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND p.estado_registro = 1
        ${empresaCondition}
        ${asesorCondition}
      `, params);
      const leadsSemana = leadsSemanasResult[0]?.total || 0;

      // 4. Contactados (prospectos que tienen al menos un mensaje)
      const [contactadosResult] = await pool.execute(`
        SELECT COUNT(DISTINCT p.id) as total
        FROM prospecto p
        INNER JOIN contacto c ON c.id_prospecto = p.id
        INNER JOIN mensaje m ON m.id_contacto = c.id
        WHERE p.estado_registro = 1
        ${empresaCondition}
        ${asesorCondition}
      `, params);
      const contactados = contactadosResult[0]?.total || 0;

      // 5. Estadisticas por estado (pipeline)
      let pipelineQuery = `
        SELECT e.nombre, e.color, COUNT(p.id) as total
        FROM estado e
        LEFT JOIN prospecto p ON p.id_estado = e.id AND p.tipo_usuario = 'user'`;

      if (idEmpresa) {
        pipelineQuery += ` AND p.id_empresa = ?`;
      }

      if (rolId && rolId >= 3 && userId) {
        pipelineQuery += ` AND p.id_asesor = ?`;
      }

      pipelineQuery += `
        GROUP BY e.id, e.nombre, e.color
        ORDER BY e.id`;

      const [pipelineResult] = await pool.execute(pipelineQuery, params);

      // Calcular tasa de conversion
      const tasaConversion = totalLeads > 0 ? Math.round((interesados / totalLeads) * 100) : 0;

      const dashboardStats = {
        totalLeads,
        interesados,
        leadsSemana,
        contactados,
        tasaConversion,
        pipeline: pipelineResult
      };

      return res.status(200).json({ data: dashboardStats });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener estadisticas del dashboard: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estadisticas del dashboard" });
    }
  }
}

module.exports = new ReportesCrmController();
