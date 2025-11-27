const promptUser =  `
<mensaje_usuario>
    <contenido>
        {{mensaje}}
    </contenido>
    <fecha_hora_recibido>
        {{timestamp}}
    </fecha_hora_recibido>
</mensaje_usuario>
`;

module.exports = {
    promptUser
};