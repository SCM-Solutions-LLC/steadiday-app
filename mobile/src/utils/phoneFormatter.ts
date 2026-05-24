/**
 * Formats a phone number with parentheses around area code
 * Example: 5551234567 -> (555) 123-4567
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  let numbers = value.replace(/\D/g, "");

  // Strip leading US country code
  if (numbers.length === 11 && numbers.startsWith("1")) {
    numbers = numbers.slice(1);
  }

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
  let numbers = value.replace(/\D/g, "");
  if (numbers.length === 11 && numbers.startsWith("1")) {
    numbers = numbers.slice(1);
  }
  return numbers;
};

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

export function toE164PhoneNumber(value: string, defaultCountryCode = "1"): string | null {
  if (!value) return null;

  if (value.startsWith("+")) {
    const digits = "+" + value.slice(1).replace(/\D/g, "");
    return E164_REGEX.test(digits) ? digits : null;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return null;

  let withCountry: string;
  if (digits.length === 11 && digits.startsWith(defaultCountryCode)) {
    withCountry = "+" + digits;
  } else if (digits.length === 10) {
    withCountry = "+" + defaultCountryCode + digits;
  } else if (digits.length > 10) {
    withCountry = "+" + digits;
  } else {
    return null;
  }

  return E164_REGEX.test(withCountry) ? withCountry : null;
}
