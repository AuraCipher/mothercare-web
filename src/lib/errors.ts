/**
 * Map raw backend/network errors to user-friendly messages.
 * Never expose internal URLs, Prisma codes, or stack traces to end users.
 */

const isDev = process.env.NODE_ENV === 'development';

export function friendlyErrorMessage(err: unknown): string {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 'Unable to reach the server. Please check your internet connection and try again.';
  }
  if (err instanceof TypeError && err.message.includes('NetworkError')) {
    return 'Network error. Please check your connection.';
  }
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
      return 'Unable to reach the server. Please try again later.';
    }
    if (msg.includes('jwt expired') || msg.includes('token expired')) {
      return 'Your session has expired. Please log in again.';
    }
    if (msg.includes('jwt malformed') || msg.includes('invalid token')) {
      return 'Invalid session. Please log in again.';
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (msg.includes('Request failed (403)')) {
      return 'You do not have permission to perform this action.';
    }
    if (msg.includes('Request failed (404)')) {
      return 'The requested resource was not found.';
    }
    if (msg.includes('Request failed (409)')) {
      return 'This item already exists. Please check your input.';
    }
    if (msg.includes('Request failed (422)')) {
      return 'Please check your input and try again.';
    }
    if (msg.includes('Request failed (429)')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (msg.includes('Request failed (5')) {
      return 'Something went wrong on our end. Please try again later.';
    }
    if (isDev) return msg;
    // In production, only show if it's already user-friendly (short, no technical terms)
    if (msg.length < 100 && !msg.includes('prisma') && !msg.includes('P20')) {
      return msg;
    }
    return 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Sanitize a raw error string to user-friendly text.
 * Use this when you already have e.message as a string.
 */
export function safeErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('failed to fetch') || lower.includes('econnrefused') || lower.includes('fetch failed') || lower.includes('networkerror')) {
    return 'Unable to reach the server. Please check your internet connection and try again.';
  }
  if (lower.includes('jwt expired') || lower.includes('token expired')) {
    return 'Your session has expired. Please log in again.';
  }
  if (lower.includes('jwt malformed') || lower.includes('invalid token')) {
    return 'Invalid session. Please log in again.';
  }
  if (lower.includes('request failed (403)')) {
    return 'You do not have permission to perform this action.';
  }
  if (lower.includes('request failed (404)')) {
    return 'The requested resource was not found.';
  }
  if (lower.includes('request failed (409)')) {
    return 'This item already exists. Please check your input.';
  }
  if (lower.includes('request failed (422)')) {
    return 'Please check your input and try again.';
  }
  if (lower.includes('request failed (429)')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (lower.includes('request failed (5')) {
    return 'Something went wrong on our end. Please try again later.';
  }
  // If short and no technical terms, pass through
  if (raw.length < 100 && !raw.includes('prisma') && !raw.includes('P20') && !raw.includes('http://') && !raw.includes('localhost')) {
    return raw;
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Map raw backend error messages from showToast catch blocks to safe text.
 * Prevents leaking Prisma codes, internal field names, or URLs.
 */
export function safeToastMessage(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    // Already user-friendly from friendlyErrorMessage
    if (msg.length < 120 && !msg.includes('prisma') && !msg.includes('P20') && !msg.includes('http://') && !msg.includes('localhost')) {
      return msg;
    }
  }
  return 'Something went wrong. Please try again.';
}
