const { promptSystem } = require("./prompts/promptSystem");
const { promptUser } = require("./prompts/promptUser");
const { promptAutocorrector } = require("./prompts/autocorrector");
const TblPlanesTarifariosModel = require("../../models/tblPlanesTarifarios.model.js");
const FaqModel = require("../../models/faq.model.js");
const TblTipicacionModel = require("../../models/tipificacion.model.js");
const TblPregPerfilamientoModel = require("../../models/preguntaPerfilamiento.model.js");
const PromptAsistenteModel = require("../../models/promptAsistente.model.js");

class BuildPromptService {

  // Obtener FAQs de portabilidad formateadas para el prompt
  async getFaqsPortabilidadFormatted(id_empresa = null) {
    try {
      const faqModel = new FaqModel();
      const faqs = await faqModel.getAllActivas(id_empresa);

      if (!faqs || faqs.length === 0) {
        return "No hay FAQs disponibles.";
      }

      const faqsFormatted = faqs.map(faq => {
        return `**Pregunta ${faq.numero}** [${faq.proceso}]
❓ Cliente pregunta: "${faq.pregunta}"
✅ Respuesta sugerida: "${faq.respuesta}"`;
      }).join("\n\n");

      return faqsFormatted;
    } catch (error) {
      console.error(`[BuildPromptService.getFaqsPortabilidadFormatted] ${error.message}`);
      return "Error al obtener FAQs de portabilidad.";
    }
  }

  // Obtener el plan principal (el primero de portabilidad) formateado con saltos de línea
  async getPlanPrincipalFormatted(id_empresa = null) {
    try {
      const planesModel = new TblPlanesTarifariosModel();
      const plan = await planesModel.getPlanPrincipal(id_empresa);

      if (!plan) {
        return "No hay plan principal disponible.";
      }
      const principal = plan[0]
      // Construir el mensaje del plan con saltos de línea entre cada beneficio
      // Orden exacto: Precio, Internet, Llamadas/SMS, GB alta velocidad, Bono TikTok, Streaming, GB Acumulables
      let planInfo = ""
      if (principal.precio_promocional) {
        planInfo = `Nombre: ${principal.nombre}\n`
        planInfo += `Precio: S/${principal.precio_promocional}🔥\n\n`;
        planInfo += `   (Precio regular: S/${principal.precio_regular})\n\n`;
      } else {
        planInfo += `- Precio: S/${principal.precio_regular}\n\n`;
      }

      if (principal.descripcion) {
        planInfo += `Descripcion adicional: ${principal.descripcion}\n`;
      }

      if (principal.imagen_url) {
        planInfo += `Url de la imagen: ${principal.imagen_url}\n`
      }

      //console.log(planInfo)

      return planInfo;
    } catch (error) {
      console.error(`[BuildPromptService.getPlanPrincipalFormatted] ${error.message}`);
      return "Error al obtener plan principal.";
    }
  }

  // Obtener planes tarifarios formateados para el prompt
  async getPlanesTarifariosFormatted(id_empresa = null) {
    try {
      const planesModel = new TblPlanesTarifariosModel();
      const planes = await planesModel.getAll(id_empresa);

      if (!planes || planes.length === 0) {
        return "No hay planes disponibles actualmente.";
      }

      const planesFormatted = planes.map(plan => {
        let planInfo = `**Nombre: ${plan.nombre}**\n\n`;

        // Mostrar precio promocional si existe
        if (plan.precio_promocional) {
          planInfo += `Precio: S/${plan.precio_promocional} x 12 meses 🔥\n\n`;
          planInfo += `   (Precio regular: S/${plan.precio_regular})\n\n`;
        } else {
          planInfo += `- Precio: S/${plan.precio_regular}\n\n`;
        }

        if (plan.descripcion) {
          planInfo += `Descripcion adicional: ${plan.descripcion}\n`;
        }

        if (plan.imagen_url) {
          planInfo += `Url de la imagen: ${plan.imagen_url}`
        }

        //console.log(planInfo)
        return planInfo;
      }).join("\n---\n\n");

      return planesFormatted;
    } catch (error) {
      console.error(`[BuildPromptService.getPlanesTarifariosFormatted] ${error.message}`);
      return "Error al obtener planes tarifarios.";
    }
  }

  async getTipicaciones(id_empresa = null) {
    try {
      const tipificacionModel = new TblTipicacionModel();
      const tipificacion = await tipificacionModel.getAllForBot(id_empresa);
      let info = "";

      if (!tipificacion || tipificacion.length === 0) {
        return "No hay tipicaciones actualmente";
      }

      info += "**Tipo de tificaciones**\n\n";
      const infoFormatted = tipificacion.map(tipi => {

        info += `- ID: ${tipi.id}\n`;
        info += `- Nombre: ${tipi.nombre}\n`;
        info += `- Definicion: ${tipi.definicion}\n`;

        return info;
      })

      return infoFormatted;
    } catch (err) {
      console.error(`[BuildPromptService.getTipicaciones] ${err.message}`);
      return "Error al obtener tipicaciones.";
    }
  }

  async getPreguntasPerfilamiento(id_empresa = null) {
    try {
      const preguntasModel = new TblPregPerfilamientoModel();
      const preguntas = await preguntasModel.getAll(id_empresa);
      let info = "";

      if (!preguntas || preguntas.length === 0) {
        return "No hay preguntas actualmente";
      }

      info += "**Preguntas de prefilamiento**\n\n";
      const infoFormatted = preguntas.map(preguntas => {

        info += `- ID: ${preguntas.id}\n`;
        info += `- Nombre: ${preguntas.pregunta}\n`;
        info += `- Orden: ${preguntas.orden}`;

        return info;
      })
      
      return infoFormatted;
    } catch (err) {
      console.error(`[BuildPromptService.getPreguntasPerfilamiento] ${err.message}`);
      return "Error al obtener tipicaciones.";
    }
  }

  // Obtener el prompt base del sistema (de BD o default)
  async getPromptBase(id_empresa = null) {
    try {
      if (id_empresa) {
        const promptModel = new PromptAsistenteModel();
        const promptDb = await promptModel.getByEmpresa(id_empresa);
        if (promptDb && promptDb.prompt_sistema) {
          return promptDb.prompt_sistema;
        }
      }
      // Si no hay prompt en BD, usar el default
      return promptSystem;
    } catch (error) {
      console.error(`[BuildPromptService.getPromptBase] ${error.message}`);
      // En caso de error, usar el default
      return promptSystem;
    }
  }

  // Construir el prompt para el modelo de IA
  async buildSystemPrompt({
    id_empresa = null
  }) {
    try {
      // Obtener el prompt base (de BD o default)
      const promptBase = await this.getPromptBase(id_empresa);

      // Obtener plan principal
      const planPrincipal = await this.getPlanPrincipalFormatted(id_empresa);

      // Obtener planes tarifarios
      const planesTarifarios = await this.getPlanesTarifariosFormatted(id_empresa);

      // Obtener FAQs de portabilidad de la base de datos
      const faqsPortabilidad = await this.getFaqsPortabilidadFormatted(id_empresa);

      const tipificaciones = await this.getTipicaciones(id_empresa);

      const preguntas = await this.getPreguntasPerfilamiento(id_empresa);

      // Crear un objeto con las variables a reemplazar en el prompt
      const replacements = {
        "{{catalogo_principal}}": planPrincipal,
        "{{catalogo}}": planesTarifarios,
        "{{faqs}}": faqsPortabilidad,
        "{{Tipo_tipificaciones}}": tipificaciones,
        "{{preguntas_perfilamiento}}": preguntas
      };

      // Reemplazar las variables en el prompt
      let prompt = promptBase;

      for (const [placeholder, value] of Object.entries(replacements)) {
        prompt = prompt.replace(new RegExp(placeholder, "g"), value);
      }

      return prompt;

    } catch (error) {
      throw new Error(`[BuildPromptService.buildSystemPrompt] ${error.message}`);
    }
  }

  buildUserPrompt({
    mensaje,
    timestamp

  }) {
    try {
      let prompt = promptUser;

      const replacements = {
        "{{mensaje}}": mensaje,
        "{{timestamp}}": timestamp
      };

      for (const [placeholder, value] of Object.entries(replacements)) {
        prompt = prompt.replace(new RegExp(placeholder, "g"), value);
      }

      return prompt;

    } catch (error) {
      throw new Error(`[BuildPromptService.buildUserPrompt] ${error.message}`);
    }
  }

  buildAutocorrectorPrompt() {
    try {
      let prompt = promptAutocorrector;
      return prompt;
    } catch (error) {
      throw new Error(`[BuildPromptService.buildAutocorrectorPrompt] ${error.message}`);
    }
  }
}


module.exports = new BuildPromptService();
