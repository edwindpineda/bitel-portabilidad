const customTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    return `${day}-${month}-${year} / ${hour}:${minute}:${second}`;
  };

/**
 * Devuelve la fecha y hora actual en la zona horaria especificada
 * Formato: YYYY-MM-DD HH:MM:SS (compatible con MySQL DATETIME)
 * @param {string} timeZone - Ejemplo: 'America/Lima'
 * @returns {string} Fecha y hora formateada
 */
function getLocalDateTime(timeZone = 'America/Lima') {
  const now = new Date();

  const options = {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const parts = formatter.formatToParts(now);

  const dateTimeParts = {};
  parts.forEach(({ type, value }) => {
    dateTimeParts[type] = value;
  });

  return `${dateTimeParts.year}-${dateTimeParts.month}-${dateTimeParts.day} ${dateTimeParts.hour}:${dateTimeParts.minute}:${dateTimeParts.second}`;
}

// Ejemplo de uso
//console.log(getLocalDateTime()); // "2025-08-13 08:30:15"
//console.log(getLocalDateTime('America/New_York')); // otra zona horaria
  

module.exports = {
    customTimestamp,
    getLocalDateTime
}
