const promptAutocorrector = `
Corrige el siguiente texto para que sea un JSON válido con EXACTAMENTE estas claves:

- "mensaje_asistente": mensaje para el usuario.
- "estado_respuesta": uno de ["exitosa","queue","ambigua","finalizada","line1","line2"]
- "datos_cliente": (opcional, solo cuando estado es "line1" o "line2") objeto con la información del cliente

Ejemplo de JSON válido para estados normales:
\`\`\`json
{
  "mensaje_asistente": "...",
  "estado_respuesta": "..."
}
\`\`\`

Ejemplo de JSON válido para estados line1 o line2:
\`\`\`json
{
  "mensaje_asistente": "...",
  "estado_respuesta": "line1",
  "datos_cliente": {
    "plan_a_vender": "...",
    "nombres_completos": "...",
    "dni": "...",
    "numero_celular": "...",
    "direccion": "..."
  }
}
\`\`\`

No modifiques el contenido de los valores ya existentes dentro del texto original.
Solo repara comillas, comas, brackets o claves repetidas/extra innecesarias.

Si NO es posible detectar claramente los campos requeridos, responde con:

\`\`\`json
{
  "mensaje_asistente": "",
  "estado_respuesta": "pendiente"
}
\`\`\`

Tu salida debe ser exclusivamente el JSON final, sin explicaciones.
`;

module.exports = {
  promptAutocorrector
};
