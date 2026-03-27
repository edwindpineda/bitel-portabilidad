const logger = require("../../config/logger/loggerClient");

const url_token = "https://cobranzas-auna.oncosalud.pe/api/Autorizacion/CrearToken"
const url_cambio = "https://cobranzas-auna.oncosalud.pe/api/CambioTarjeta/CrearEnlace"
const url_pago = "https://cobranzas-auna.oncosalud.pe/api/PagoLinea/CrearEnlace"

class PagoService {
  async obtenerToken(alcance) {
    const response = await fetch(url_token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: process.env.CLIENTE_ID,
        cliente_secreto: process.env.CLIENTE_SECRETO,
        tipo_acceso: "client_call_credentials",
        alcance: alcance
      })
    });

    const text = await response.text();
    if (!text) {
      logger.error(`[pago.service.js] obtenerToken: respuesta vacía - status=${response.status}, alcance=${alcance}`);
      throw new Error(`API token respondió vacío (status ${response.status})`);
    }
    try {
      const result = JSON.parse(text);
      return result?.tipo_token + " " + result?.token_acceso;
    } catch (e) {
      logger.error(`[pago.service.js] obtenerToken: JSON inválido - status=${response.status}, body=${text.substring(0, 300)}`);
      throw new Error(`API token JSON inválido (status ${response.status})`);
    }
  }


  async generarLinkPago(grupo_familiar, telefono) {
    const token = await this.obtenerToken("PagoCuota/CrearEnlace");

    const response = await fetch(url_pago, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Authorization": token,
      },
      body: JSON.stringify({
        grupo_familiar: grupo_familiar,
        telefono: telefono,
        ope_origen: 36,
        ope_call: "93"
      })
    });

    const textPago = await response.text();
    if (!response.ok || !textPago) {
      logger.error(`[pago.service.js] generarLinkPago: fallo - status=${response.status}, grupo_familiar=${grupo_familiar}, telefono=${telefono}, body=${(textPago || 'vacío').substring(0, 300)}`);
      return null;
    }
    try {
      const result = JSON.parse(textPago);
      return result.enlace;
    } catch (e) {
      logger.error(`[pago.service.js] generarLinkPago: JSON inválido - status=${response.status}, grupo_familiar=${grupo_familiar}, body=${textPago.substring(0, 300)}`);
      return null;
    }
  }

  async generarLinkCambio(grupo_familiar, telefono) {
    const token = await this.obtenerToken("CambioTarjeta/CrearEnlace");

    const response = await fetch(url_cambio, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Authorization": token,
      },
      body: JSON.stringify({
        grupo_familiar: grupo_familiar,
        telefono: telefono,
        ope_origen: 36,
        ope_call: "93"
      })
    });

    const textCambio = await response.text();
    if (!response.ok || !textCambio) {
      logger.error(`[pago.service.js] generarLinkCambio: fallo - status=${response.status}, grupo_familiar=${grupo_familiar}, telefono=${telefono}, body=${(textCambio || 'vacío').substring(0, 300)}`);
      return null;
    }
    try {
      const result = JSON.parse(textCambio);
      return result.enlace;
    } catch (e) {
      logger.error(`[pago.service.js] generarLinkCambio: JSON inválido - status=${response.status}, grupo_familiar=${grupo_familiar}, body=${textCambio.substring(0, 300)}`);
      return null;
    }
  }
}

module.exports = new PagoService();