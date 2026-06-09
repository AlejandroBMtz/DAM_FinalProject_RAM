/**
 * Formatting utility functions
 */

/**
 * Formats an ISO date string into a readable format
 * @param {string} dateString - ISO date string
 * @param {string} locale - Locale code (default 'es-MX')
 * @returns {string} - Formatted date
 */
export const formatDate = (dateString, locale = 'es-MX') => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Formats points with a suffix
 * @param {number} points - Number of points
 * @returns {string} - Formatted points string
 */
export const formatPoints = (points) => {
  const pts = points || 0;
  return `${pts} pts`;
};

/**
 * Capitalizes the first letter of each word in a string
 * @param {string} str - Input string
 * @returns {string} - Formatted string
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
