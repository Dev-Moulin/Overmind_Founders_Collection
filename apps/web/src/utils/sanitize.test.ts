import { describe, it, expect } from 'vitest';
import { sanitizeHTML, sanitizeText, sanitizeURL } from './sanitize';

describe('sanitizeHTML', () => {
  it('should allow safe tags', () => {
    const input = '<b>Bold</b> <i>Italic</i> <em>Emphasis</em>';
    const result = sanitizeHTML(input);
    expect(result).toBe('<b>Bold</b> <i>Italic</i> <em>Emphasis</em>');
  });

  it('should allow links with href', () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeHTML(input);
    expect(result).toContain('href="https://example.com"');
  });

  it('should remove script tags', () => {
    const input = '<script>alert("xss")</script><b>Bold</b>';
    const result = sanitizeHTML(input);
    expect(result).toBe('<b>Bold</b>');
    expect(result).not.toContain('script');
  });

  it('should remove onclick handlers', () => {
    const input = '<b onclick="alert(1)">Click me</b>';
    const result = sanitizeHTML(input);
    expect(result).toBe('<b>Click me</b>');
    expect(result).not.toContain('onclick');
  });

  it('should remove img tags with onerror', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('onerror');
  });

  it('should allow paragraph and list tags', () => {
    const input = '<p>Para</p><ul><li>Item</li></ul>';
    const result = sanitizeHTML(input);
    expect(result).toBe('<p>Para</p><ul><li>Item</li></ul>');
  });

  it('should handle empty string', () => {
    expect(sanitizeHTML('')).toBe('');
  });
});

describe('sanitizeText', () => {
  it('should strip all HTML tags', () => {
    const input = '<b>Bold</b> and <script>evil</script>';
    const result = sanitizeText(input);
    expect(result).toBe('Bold and ');
  });

  it('should return plain text', () => {
    const input = '<p>Hello <strong>World</strong></p>';
    const result = sanitizeText(input);
    expect(result).toBe('Hello World');
  });

  it('should handle empty string', () => {
    expect(sanitizeText('')).toBe('');
  });
});

describe('sanitizeURL', () => {
  it('should allow https URLs', () => {
    const url = 'https://example.com/path';
    expect(sanitizeURL(url)).toBe(url);
  });

  it('should allow http URLs', () => {
    const url = 'http://example.com';
    expect(sanitizeURL(url)).toBe(url);
  });

  it('should block javascript: protocol', () => {
    expect(sanitizeURL('javascript:alert(1)')).toBe('');
    expect(sanitizeURL('JAVASCRIPT:alert(1)')).toBe('');
    expect(sanitizeURL('  javascript:alert(1)')).toBe('');
  });

  it('should block data: protocol', () => {
    expect(sanitizeURL('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('should block vbscript: protocol', () => {
    expect(sanitizeURL('vbscript:msgbox(1)')).toBe('');
  });

  it('should allow relative URLs', () => {
    expect(sanitizeURL('/path/to/page')).toBe('/path/to/page');
  });
});
