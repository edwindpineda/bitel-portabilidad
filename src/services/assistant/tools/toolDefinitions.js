const toolDefinitions = [
    {
        type: "function",
        function: {
            name: "obtenerLinkPago",
            description: "Genera y obtiene un enlace de pago en línea para que el cliente pueda realizar el pago de su cuota",
            parameters: {
                type: "object",
                properties: {
                    grupo_familiar: {
                        type: "string",
                        description: "Codigo necesario para generar el enlace"
                    }
                },
                required: ["grupo_familiar"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "obtenerLinkCambio",
            description: "Genera y obtiene un enlace para que el cliente pueda realizar el cambio de tarjeta",
            parameters: {
                type: "object",
                properties: {
                    grupo_familiar: {
                        type: "string",
                        description: "Codigo necesario para generar el enlace"
                    }
                },
                required: ["grupo_familiar"]
            }
        }
    }
];

module.exports = { toolDefinitions };
