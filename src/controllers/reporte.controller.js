const ReportesService = require("../services/reportes/reportes.service.js");

class ReporteController {

    async getReporte(req, res) {
        try {
            // Obtener fecha actual
            const fechaHoy = ReportesService.obtenerFechaActual();
            
            // Obtener datos del reporte
            const registro = await ReportesService.getReporteDiario(fechaHoy);
            
            // Formatear fecha
            const fechaFormateada = ReportesService.formatearFecha(registro.fecha_consumo, fechaHoy);
            
            // Generar HTML
            const html = ReportesService.generarHTMLReporte(registro, fechaFormateada);
            
            res.send(html);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generando el reporte');
        }
    }

    async getReporteExcel(req, res) {
        try {
            // Obtener datos para el Excel
            const rows = await ReportesService.getDatosReporteExcel();
            
            // Generar Excel
            const workbook = await ReportesService.generarExcel(rows);
            
            // Configurar headers para descarga
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=reporte_completo.xlsx`);
            
            // Enviar archivo
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generando Excel');
        }
    }
}

module.exports = new ReporteController();