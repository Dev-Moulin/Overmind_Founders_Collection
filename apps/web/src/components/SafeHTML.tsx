import { sanitizeHTML } from '../utils/sanitize';

/**
 * Props for SafeHTML component
 */
interface SafeHTMLProps {
  html: string;
  className?: string;
  as?: 'div' | 'span' | 'p';
}

/**
 * Safely render HTML content with XSS protection
 *
 * Uses DOMPurify to sanitize HTML before rendering.
 * Only allows safe formatting tags (b, i, em, strong, a, p, br, ul, ol, li).
 *
 * @example
 * ```tsx
 * <SafeHTML html="<b>Bold</b> and <script>evil()</script>" />
 * // Renders: <b>Bold</b> and
 * ```
 */
export function SafeHTML({ html, className, as: Component = 'div' }: SafeHTMLProps) {
  const sanitized = sanitizeHTML(html);

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
