/**
 * Formatea una hora de formato "HH:MM:SS" o "HH:MM" a "HH:MM"
 * @param time - Hora en formato string
 * @returns Hora formateada sin segundos
 */
export const formatTime = (time: string): string => {
  if (!time) return '';
  // Toma solo los primeros 5 caracteres (HH:MM)
  return time.substring(0, 5);
};

/**
 * Formatea un rango de tiempo
 * @param startTime - Hora de inicio
 * @param endTime - Hora de fin
 * @returns Rango formateado "HH:MM - HH:MM"
 */
export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};