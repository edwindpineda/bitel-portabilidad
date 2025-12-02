import { clsx } from 'clsx';

/**
 * Combina clases de Tailwind CSS
 * @param {...any} inputs - Clases a combinar
 * @returns {string} - Clases combinadas
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Formatea un número como moneda en soles peruanos
 * @param {number} amount - Cantidad a formatear
 * @returns {string} - Cantidad formateada
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
}

/**
 * Trunca un texto a una longitud específica
 * @param {string} text - Texto a truncar
 * @param {number} length - Longitud máxima
 * @returns {string} - Texto truncado
 */
export function truncate(text, length = 50) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Genera un color aleatorio basado en un string (para avatares)
 * @param {string} str - String base
 * @returns {string} - Color hexadecimal
 */
export function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

/**
 * Capitaliza la primera letra de un string
 * @param {string} str - String a capitalizar
 * @returns {string} - String capitalizado
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Obtiene las iniciales de un nombre
 * @param {string} name - Nombre completo
 * @returns {string} - Iniciales
 */
export function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Valida un número de teléfono peruano
 * @param {string} phone - Número de teléfono
 * @returns {boolean} - Es válido o no
 */
export function isValidPhone(phone) {
  const phoneRegex = /^9\d{8}$/;
  return phoneRegex.test(phone);
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} - Es válido o no
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Obtiene el color del estado del pipeline
 * @param {string} status - Estado del lead
 * @returns {string} - Clase de Tailwind para el color
 */
export function getStatusColor(status) {
  const colors = {
    nuevo: 'bg-purple-500',
    contactado: 'bg-cyan-500',
    interesado: 'bg-yellow-500',
    negociacion: 'bg-orange-500',
    ganado: 'bg-green-500',
    perdido: 'bg-gray-500',
    pending: 'bg-blue-500',
    queue: 'bg-orange-500',
    closed: 'bg-gray-500',
    exitosa: 'bg-green-500',
    derivada: 'bg-yellow-500',
    ambigua: 'bg-orange-500',
    finalizada: 'bg-gray-500',
  };
  return colors[status?.toLowerCase()] || 'bg-gray-500';
}

/**
 * Obtiene el label en español del estado
 * @param {string} status - Estado
 * @returns {string} - Label traducido
 */
export function getStatusLabel(status) {
  const labels = {
    nuevo: 'Nuevo',
    contactado: 'Contactado',
    interesado: 'Interesado',
    negociacion: 'Negociación',
    ganado: 'Ganado',
    perdido: 'Perdido',
    pending: 'Pendiente',
    queue: 'En cola',
    closed: 'Cerrado',
    exitosa: 'Exitosa',
    derivada: 'Derivada',
    ambigua: 'Ambigua',
    finalizada: 'Finalizada',
    line1: 'Derivado a Asesor',
    line2: 'Derivado a Backoffice',
  };
  return labels[status?.toLowerCase()] || status;
}
