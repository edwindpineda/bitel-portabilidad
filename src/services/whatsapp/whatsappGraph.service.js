/**
 * Servicio para interactuar con la Graph API de Facebook/WhatsApp
 * Usa las credenciales guardadas en configuracion_whatsapp
 */

const axios = require('axios');
// const configuracionWhatsappRepository = require('../../repositories/configuracionWhatsapp.repository.js');
const logger = require('../../config/logger/loggerClient.js');

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const WHATSAPP_NUM_ID = process.env.WHATSAPP_NUM_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

class WhatsappGraphService {
  /**
   * Obtiene las credenciales de WhatsApp para una empresa
   */
  async obtenerCredenciales(idEmpresa) {
    const config = await configuracionWhatsappRepository.findByEmpresaId(idEmpresa);
    if (!config) {
      throw new Error(`No se encontraron credenciales de WhatsApp para la empresa ${idEmpresa}`);
    }
    return {
      accessToken: config.token_whatsapp,
      phoneNumberId: config.numero_telefono_id,
      wabaId: config.waba_id,
      appId: config.app_id
    };
  }

  /**
   * Obtiene el WABA ID desde el Phone Number ID si no está guardado
   */
  async obtenerWabaIdDesdePhoneNumber(phoneNumberId, accessToken) {
    try {
      const url = `${GRAPH_API_URL}/${phoneNumberId}?fields=whatsapp_business_account`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 30000
      });
      return response.data?.whatsapp_business_account?.id || null;
    } catch (error) {
      logger.error(`[WhatsappGraph] Error obteniendo WABA ID: ${error.message}`);
      return null;
    }
  }

  /**
   * Lista las plantillas de mensajes de WhatsApp Business desde Meta
   */
  async listarPlantillas(idEmpresa, options = {}) {
    const credenciales = await this.obtenerCredenciales(idEmpresa);
    let wabaId = credenciales.wabaId;

    if (!wabaId) {
      wabaId = await this.obtenerWabaIdDesdePhoneNumber(credenciales.phoneNumberId, credenciales.accessToken);
      if (!wabaId) {
        throw new Error('No se pudo obtener el WhatsApp Business Account ID');
      }
    }

    const fields = 'name,status,category,language,components,quality_score,rejected_reason';
    const limit = options.limit || 100;
    let url = `${GRAPH_API_URL}/${wabaId}/message_templates?fields=${fields}&limit=${limit}`;

    if (options.status) {
      url += `&status=${encodeURIComponent(options.status)}`;
    }

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${credenciales.accessToken}` },
      timeout: 30000
    });

    const templates = (response.data?.data || []).map(template => ({
      id: template.id || null,
      name: template.name || '',
      status: template.status || '',
      category: template.category || '',
      language: template.language || '',
      components: template.components || [],
      quality_score: template.quality_score || null,
      rejected_reason: template.rejected_reason || null
    }));

    return {
      success: true,
      templates,
      total: templates.length,
      waba_id: wabaId,
      paging: response.data?.paging || null
    };
  }

  /**
   * Crea una nueva plantilla de mensaje en Meta
   */
  async crearPlantilla(idEmpresa, name, category, language, components) {
    const credenciales = await this.obtenerCredenciales(idEmpresa);
    let wabaId = credenciales.wabaId;

    if (!wabaId) {
      wabaId = await this.obtenerWabaIdDesdePhoneNumber(credenciales.phoneNumberId, credenciales.accessToken);
      if (!wabaId) {
        throw new Error('No se pudo obtener el WhatsApp Business Account ID');
      }
    }

    const url = `${GRAPH_API_URL}/${wabaId}/message_templates`;
    const payload = {
      name,
      category: category.toUpperCase(),
      language,
      components: this.formatearComponentesParaCreacion(components)
    };

    logger.info(`[WhatsappGraph] Creando plantilla en Meta: ${name}`);

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credenciales.accessToken}`
      },
      timeout: 30000
    });

    return {
      success: true,
      id: response.data?.id || null,
      status: response.data?.status || 'PENDING',
      category: response.data?.category || category
    };
  }

  /**
   * Edita una plantilla existente en Meta
   */
  async editarPlantilla(idEmpresa, templateId, components) {
    const credenciales = await this.obtenerCredenciales(idEmpresa);
    const url = `${GRAPH_API_URL}/${templateId}`;

    const payload = {
      components: this.formatearComponentesParaCreacion(components)
    };

    logger.info(`[WhatsappGraph] Editando plantilla en Meta: ${templateId}`);

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credenciales.accessToken}`
      },
      timeout: 30000
    });

    return {
      success: true,
      data: response.data
    };
  }

  /**
   * Elimina una plantilla en Meta
   */
  async eliminarPlantilla(idEmpresa, name) {
    const credenciales = await this.obtenerCredenciales(idEmpresa);
    let wabaId = credenciales.wabaId;

    if (!wabaId) {
      wabaId = await this.obtenerWabaIdDesdePhoneNumber(credenciales.phoneNumberId, credenciales.accessToken);
      if (!wabaId) {
        throw new Error('No se pudo obtener el WhatsApp Business Account ID');
      }
    }

    const url = `${GRAPH_API_URL}/${wabaId}/message_templates?name=${encodeURIComponent(name)}`;

    logger.info(`[WhatsappGraph] Eliminando plantilla en Meta: ${name}`);

    const response = await axios.delete(url, {
      headers: { Authorization: `Bearer ${credenciales.accessToken}` },
      timeout: 30000
    });

    return {
      success: true,
      data: response.data
    };
  }

  /**
   * Envía un mensaje de plantilla
   */
  async enviarPlantilla(idEmpresa, phone, templateName, language = 'es', components = []) {
    // const credenciales = await this.obtenerCredenciales(idEmpresa);
    const url = `${GRAPH_API_URL}/${WHATSAPP_NUM_ID}/messages`;

    const formattedPhone = this.formatearNumeroTelefono(phone);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: true,
        body: templateName
      }
    };

    if (components && components.length > 0) {
      payload.template.components = components;
    }

    logger.info(`[WhatsappGraph] Enviando plantilla ${templateName} a ${formattedPhone}`);
    console.log("[Token]: ", WHATSAPP_TOKEN);

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WHATSAPP_TOKEN}`
      },
      timeout: 30000
    });

    return {
      success: true,
      response: response.data
    };
  }

  /**
   * Formatea número de teléfono para WhatsApp Cloud API
   */
  formatearNumeroTelefono(phone) {
    let formatted = phone.replace(/[\s\-\(\)\+]/g, '');
    if (formatted.startsWith('0')) {
      formatted = formatted.substring(1);
    }
    if (formatted.length <= 9) {
      formatted = '51' + formatted;
    }
    return formatted;
  }

  /**
   * Convierte los datos de BD al formato de componentes de Meta API
   */
  convertirDatosAComponentes(plantilla) {
    const components = [];

    // Header
    if (plantilla.header_type && plantilla.header_text) {
      components.push({
        type: 'HEADER',
        format: plantilla.header_type.toUpperCase(),
        text: plantilla.header_text
      });
    }

    // Body (obligatorio)
    if (plantilla.body) {
      components.push({
        type: 'BODY',
        text: plantilla.body
      });
    }

    // Footer
    if (plantilla.footer) {
      components.push({
        type: 'FOOTER',
        text: plantilla.footer
      });
    }

    // Buttons
    if (plantilla.buttons && Array.isArray(plantilla.buttons) && plantilla.buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: plantilla.buttons
      });
    }

    return components;
  }

  /**
   * Formatea los componentes para la creación de plantilla según el formato de Meta API
   */
  formatearComponentesParaCreacion(components) {
    const formatted = [];

    for (const comp of components) {
      const type = (comp.type || '').toUpperCase();

      switch (type) {
        case 'HEADER':
          const format = (comp.format || 'TEXT').toUpperCase();
          if (format === 'TEXT' && comp.text) {
            const header = { type: 'HEADER', format: 'TEXT', text: comp.text };
            if (comp.example?.header_text) {
              header.example = { header_text: comp.example.header_text };
            } else if (/\{\{\w+\}\}/.test(comp.text)) {
              const matches = comp.text.match(/\{\{(\w+)\}\}/g) || [];
              header.example = { header_text: matches.map((_, i) => `ejemplo_${i + 1}`) };
            }
            formatted.push(header);
          } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(format)) {
            const headerMedia = { type: 'HEADER', format };
            if (comp.example?.header_handle) {
              headerMedia.example = { header_handle: comp.example.header_handle };
            }
            formatted.push(headerMedia);
          }
          break;

        case 'BODY':
          const body = { type: 'BODY', text: comp.text || '' };
          if (comp.example?.body_text) {
            body.example = { body_text: comp.example.body_text };
          } else {
            const matches = body.text.match(/\{\{(\d+)\}\}/g) || [];
            if (matches.length > 0) {
              body.example = { body_text: [matches.map((_, i) => `ejemplo_${i + 1}`)] };
            }
          }
          formatted.push(body);
          break;

        case 'FOOTER':
          if (comp.text) {
            formatted.push({ type: 'FOOTER', text: comp.text });
          }
          break;

        case 'BUTTONS':
          if (comp.buttons && Array.isArray(comp.buttons)) {
            const buttons = [];
            for (const btn of comp.buttons) {
              const buttonType = (btn.type || 'QUICK_REPLY').toUpperCase();
              switch (buttonType) {
                case 'QUICK_REPLY':
                  buttons.push({ type: 'QUICK_REPLY', text: btn.text || 'Botón' });
                  break;
                case 'URL':
                  const urlBtn = { type: 'URL', text: btn.text || 'Ver más', url: btn.url || '' };
                  if (urlBtn.url.includes('{{')) {
                    urlBtn.example = ['https://ejemplo.com/valor'];
                  }
                  buttons.push(urlBtn);
                  break;
                case 'PHONE_NUMBER':
                  buttons.push({ type: 'PHONE_NUMBER', text: btn.text || 'Llamar', phone_number: btn.phone_number || '' });
                  break;
                case 'COPY_CODE':
                  buttons.push({ type: 'COPY_CODE', example: btn.example || 'CODIGO123' });
                  break;
              }
            }
            if (buttons.length > 0) {
              formatted.push({ type: 'BUTTONS', buttons });
            }
          }
          break;
      }
    }

    return formatted;
  }
}

module.exports = new WhatsappGraphService();
