const toolDefinitions = [
    {
        type: "function",
        function: {
            name: "tipificarConversacion",
            description: "Actualiza el estado de tipificacion de la persona con un ID",
            parameters: {
                type: "object",
                properties: {
                    id_tipificacion: {
                        type: "integer",
                        description: "Id de la tipificacion correspondiente"
                    }
                },
                required: ["id_tipificacion"]
            }
        }
    }
];

module.exports = { toolDefinitions };
