export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

export function isValidShortcode(code) {
  return /^[a-zA-Z0-9]{4,10}$/.test(code);  // Alphanumeric, 4-10 characters
}

export function isValidValidity(value) {
  const num = parseInt(value);
  return !isNaN(num) && num > 0 && num <= 1440; // Validity is between 1 and 1440 minutes (24 hours)
}
