/**
 * Centralized Currency Formatting Utility
 * Standardizes all currency formatting to use "Rs." format
 */

/**
 * Format a number as currency with Rs. prefix
 * @param {number|string} value - The amount to format
 * @param {object} options - Formatting options
 * @param {boolean} options.showDecimals - Whether to show decimal places (default: true)
 * @param {number} options.minDecimals - Minimum decimal places (default: 2)
 * @param {number} options.maxDecimals - Maximum decimal places (default: 2)
 * @returns {string} Formatted currency string (e.g., "Rs. 1,234.56")
 */
export const formatCurrency = (value, options = {}) => {
  const {
    showDecimals = true,
    minDecimals = 2,
    maxDecimals = 2
  } = options;

  const amount = Number(value) || 0;
  
  if (showDecimals) {
    return `Rs. ${amount.toLocaleString(undefined, {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals
    })}`;
  } else {
    return `Rs. ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }
};

/**
 * Format currency without decimal places (for whole numbers)
 * @param {number|string} value - The amount to format
 * @returns {string} Formatted currency string without decimals
 */
export const formatCurrencyWhole = (value) => {
  return formatCurrency(value, { showDecimals: false });
};

/**
 * Format currency for display in tables/lists (compact format)
 * @param {number|string} value - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrencyCompact = (value) => {
  const amount = Number(value) || 0;
  if (amount >= 10000000) {
    return `Rs. ${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `Rs. ${(amount / 100000).toFixed(2)} L`;
  } else if (amount >= 1000) {
    return `Rs. ${(amount / 1000).toFixed(2)} K`;
  }
  return formatCurrency(value);
};

export default formatCurrency;

