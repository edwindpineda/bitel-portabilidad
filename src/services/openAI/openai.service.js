const LlmResponsesApiService = require('./llmResponsesApi.service');

/**
 * Genera una respuesta usando OpenAI
 * @param {Object} params - Parámetros de la solicitud
 * @param {string} params.apiKey - API Key de OpenAI
 * @param {string} params.prompt - Prompt del usuario
 * @param {string} params.systemPrompt - Instrucciones del sistema (opcional)
 * @param {string} params.model - Modelo a usar (opcional, default "gpt-4.1")
 * @param {number} params.temperature - Temperatura (opcional, default 0.5)
 * @returns {Promise<Object>}
 */
async function openAIResponse(params) {
    try {
        const {
            apiKey,
            prompt,
            systemPrompt = "Eres un asistente útil.",
            model = "gpt-4.1",
            temperature = 0.5
        } = params;

        // Usar API Key proporcionada o la del sistema
        const finalApiKey = apiKey || process.env.OPENAI_API_KEY;

        // Validaciones
        if (!finalApiKey) {
            return { success: false, error: 'API Key de OpenAI no configurada' };
        }

        if (!prompt) {
            return { success: false, error: 'Prompt es requerido' };
        }

        // Crear instancia del servicio con la API Key
        const llmService = new LlmResponsesApiService(finalApiKey);

        // Formatear el mensaje de entrada
        const inputMessages = [
            llmService.inputTextFormat({ role: "user", content: prompt })
        ];

        // Obtener respuesta
        const response = await llmService.getResponse(inputMessages, systemPrompt, {
            model,
            temperature
        });

        return {
            success: true,
            data: {
                response: response.output_text || response.output || response,
                model: model,
                usage: response.usage || null
            }
        };

    } catch (error) {
        console.error(`[openAIResponse] Error: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    openAIResponse
};