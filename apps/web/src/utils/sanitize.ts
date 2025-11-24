import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * Only allows safe formatting tags and href attributes on links.
 *
 * @param dirty - Potentially unsafe HTML string
 * @returns Sanitized HTML string
 *
 * @example
 * ```ts
 * const safe = sanitizeHTML('<script>alert("xss")</script><b>Bold</b>');
 * // Returns: '<b>Bold</b>'
 * ```
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Sanitize plain text (strip all HTML)
 *
 * @param dirty - Potentially unsafe string
 * @returns Plain text with all HTML removed
 */
export function sanitizeText(dirty: string): string {
  // First sanitize to remove dangerous content, then strip remaining tags
  const sanitized = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  // Strip any remaining HTML tags using regex as fallback
  return sanitized.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize URL to prevent javascript: protocol attacks
 *
 * @param url - Potentially unsafe URL
 * @returns Safe URL or empty string if unsafe
 */
export function sanitizeURL(url: string): string {
  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '';
  }

  return url;
}
