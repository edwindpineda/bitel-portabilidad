const { promptSystem } = require("./prompts/promptSystem");
const { promptUser } = require("./prompts/promptUser");
const { promptAutocorrector } = require("./prompts/autocorrector");
const TblPlanesTarifariosModel = require("../../models/tblPlanesTarifarios.model.js");
const TblFaqPortabilidadModel = require("../../models/tblFaqPortabilidad.model.js");

class BuildPromptService {

  // Obtener FAQs de portabilidad formateadas para el prompt
  async getFaqsPortabilidadFormatted() {
    try {
      const faqModel = new TblFaqPortabilidadModel();
      const faqs = await faqModel.getAllActivas();

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
  async getPlanPrincipalFormatted() {
    try {
      const planesModel = new TblPlanesTarifariosModel();
      const plan = await planesModel.getPlanPrincipal();

      if (!plan) {
        return "No hay plan principal disponible.";
      }

      // Construir el mensaje del plan con saltos de línea entre cada beneficio
      // Orden exacto: Precio, Internet, Llamadas/SMS, GB alta velocidad, Bono TikTok, Streaming, GB Acumulables
      let planInfo = `Muchas gracias por su respuesta, tenemos este plan para usted:\n\n`;

      // 1. Precio promocional
      if (plan.precio_promocional) {
        planInfo += `✅ Pagas solo S/${plan.precio_promocional} x ${plan.meses_promocion} meses 🔥\n\n`;
      }

      // 2. Internet Ilimitado
      if (plan.internet_ilimitado) {
        planInfo += `✅ Internet Ilimitado\n\n`;
      }

      // 3. Llamadas y SMS ilimitados
      if (plan.minutos_ilimitados && plan.sms_ilimitados) {
        planInfo += `✅ Llamadas y SMS ilimitados.\n\n`;
      }

      // 4. GB en alta velocidad
      if (plan.gigas_alta_velocidad) {
        planInfo += `✅ ${plan.gigas_alta_velocidad} GB en alta velocidad.\n\n`;
      }

      // 5. Bono adicional (TikTok, etc)
      if (plan.bono_adicional) {
        planInfo += `✅ Bono ${plan.bono_adicional}.\n\n`;
      }

      // 6. Streaming incluido (separar por comas y poner cada uno en línea separada)
      if (plan.streaming_incluido) {
        const streamings = plan.streaming_incluido.split(',').map(s => s.trim());
        streamings.forEach(streaming => {
          planInfo += `✅ Suscripción a ${streaming}.\n\n`;
        });
      }

      // 7. GB Acumulables (al final)
      if (plan.gigas_acumulables) {
        planInfo += `✅ GB ACUMULABLES\n\n`;
      }

      planInfo += `¿Te interesa este plan? 😊`;

      return planInfo;
    } catch (error) {
      console.error(`[BuildPromptService.getPlanPrincipalFormatted] ${error.message}`);
      return "Error al obtener plan principal.";
    }
  }

  // Obtener planes tarifarios formateados para el prompt
  async getPlanesTarifariosFormatted() {
    try {
      const planesModel = new TblPlanesTarifariosModel();
      const planes = await planesModel.getAll();

      if (!planes || planes.length === 0) {
        return "No hay planes disponibles actualmente.";
      }

      const planesFormatted = planes.map(plan => {
        let planInfo = `**${plan.nombre}** \n\n`;

        // Mostrar precio promocional si existe
        if (plan.precio_promocional) {
          planInfo += `✅ Precio: S/${plan.precio_promocional} x ${plan.meses_promocion} meses 🔥\n\n`;
          planInfo += `   (Precio regular: S/${plan.precio_regular})\n\n`;
        } else {
          planInfo += `- Precio: S/${plan.precio_regular}\n\n`;
        }

        if (plan.descripcion) {
          planInfo += `✅ Descripcion adicional: ${plan.descripcion}`;
        }

        if (plan.imagen_url) {
          planInfo += `✅ Url de la imagen: ${plan.imagen_url}`
        }

        return planInfo;
      }).join("\n---\n\n");

      return planesFormatted;
    } catch (error) {
      console.error(`[BuildPromptService.getPlanesTarifariosFormatted] ${error.message}`);
      return "Error al obtener planes tarifarios.";
    }
  }

  // Construir el prompt para el modelo de IA
  async buildSystemPrompt({
    fqas
  }) {
    try {
      // Obtener plan principal
      const planPrincipal = await this.getPlanPrincipalFormatted();

      // Obtener planes tarifarios
      const planesTarifarios = await this.getPlanesTarifariosFormatted();

      // Obtener FAQs de portabilidad de la base de datos
      const faqsPortabilidad = await this.getFaqsPortabilidadFormatted();

      // Crear un objeto con las variables a reemplazar en el prompt
      const replacements = {
        "{{fqas}}": fqas,
        "{{plan_principal}}": planPrincipal,
        "{{planes_tarifarios}}": planesTarifarios,
        "{{faqs_portabilidad}}": faqsPortabilidad
      };

      // Reemplazar las variables en el prompt
      let prompt = promptSystem;

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
