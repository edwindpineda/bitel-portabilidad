const { OpenAI } = require("openai");

class LlmResponsesApiService {

    constructor(apiKey) {
        this.client = new OpenAI({ apiKey: apiKey });
    }

    // Formato de entrada para texto
    inputTextFormat({ role, content }) {

        // Verificar que role sea "user", "assistant" o "developer"
        if (role !== "user" && role !== "assistant" && role !== "developer") {
            throw new Error("El rol debe ser 'user', 'assistant' o 'developer'");
        }

        // Verificar que content sea un string
        if (typeof content !== "string") {
            throw new Error("El contenido debe ser un string");
        }

        return {
            role: role,
            content: content
        }
    }

    // Formato de entrada para herramientas
    inputToolFormat({ call_id, result }) {
        return {
            type: "function_call_output",
            call_id: call_id,
            output: result
        }
    }

    async getResponse(inputMessages, instructions, {
        model = "gpt-4.1",
        temperature = 0.5,
        tools = undefined
    } = {}) {
        //console.log("**inputMessages", inputMessages);
        //console.log("**instructions", instructions);
        //console.log("**model", model);
        //console.log("**temperature", temperature);
        //console.log("**tools", tools);
        try {
            const response = await this.client.responses.create({
                model: model,
                instructions: instructions,
                input: inputMessages,
                temperature: temperature,
                ...(tools && { tools })
            });

            return response;

        } catch (error) {
            throw new Error(`[LlmResponsesApiService.getResponse]: ${error.message}`);
        }
    }

}

module.exports = LlmResponsesApiService;