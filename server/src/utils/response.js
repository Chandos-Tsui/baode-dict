// Unified API response helpers
export function success(data = null, message = 'ok') {
  return { code: 0, data, message };
}

export function fail(message = 'error', code = 1) {
  return { code, data: null, message };
}

// Parse JSON field safely (for SQLite stored JSON strings)
export function parseJSON(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Stringify for SQLite storage
export function toJSON(value) {
  if (value == null) return null;
  return JSON.stringify(value);
}
