/**
 * Formats a phone number with parentheses around area code
 * Example: 5551234567 -> (555) 123-4567
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, "");

  // Limit to 10 digits
  const limited = numbers.slice(0, 10);

  // Format based on length
  if (limited.length <= 3) {
    return limited ? `(${limited}` : "";
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
};

/**
 * Extracts raw phone number from formatted string
 * Example: (555) 123-4567 -> 5551234567
 */
export const unformatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, "");
};
