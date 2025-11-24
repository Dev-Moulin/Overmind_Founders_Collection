import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateAuthMessage,
  parseAuthMessage,
  clearUsedNonces,
} from './auth';

describe('generateAuthMessage', () => {
  it('should generate a message with address', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const result = generateAuthMessage(address);

    expect(result.message).toContain(address);
    expect(result.message).toContain('INTUITION Founders Totem');
  });

  it('should include a nonce (UUID format)', () => {
    const result = generateAuthMessage('0x1234567890abcdef1234567890abcdef12345678');

    expect(result.nonce).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(result.message).toContain(result.nonce);
  });

  it('should include a timestamp', () => {
    const before = Date.now();
    const result = generateAuthMessage('0x1234567890abcdef1234567890abcdef12345678');
    const after = Date.now();

    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(after);
    expect(result.message).toContain(result.timestamp.toString());
  });

  it('should generate unique nonces', () => {
    const result1 = generateAuthMessage('0x1234567890abcdef1234567890abcdef12345678');
    const result2 = generateAuthMessage('0x1234567890abcdef1234567890abcdef12345678');

    expect(result1.nonce).not.toBe(result2.nonce);
  });
});

describe('parseAuthMessage', () => {
  it('should parse nonce and timestamp from valid message', () => {
    const { message, nonce, timestamp } = generateAuthMessage(
      '0x1234567890abcdef1234567890abcdef12345678'
    );

    const parsed = parseAuthMessage(message);

    expect(parsed).not.toBeNull();
    expect(parsed?.nonce).toBe(nonce);
    expect(parsed?.timestamp).toBe(timestamp);
  });

  it('should return null for invalid message format', () => {
    expect(parseAuthMessage('Invalid message')).toBeNull();
    expect(parseAuthMessage('')).toBeNull();
    expect(parseAuthMessage('Nonce: invalid')).toBeNull();
  });

  it('should handle message with only nonce', () => {
    const message = 'Nonce: 12345678-1234-1234-1234-123456789abc';
    expect(parseAuthMessage(message)).toBeNull();
  });

  it('should handle message with only timestamp', () => {
    const message = 'Timestamp: 1234567890123';
    expect(parseAuthMessage(message)).toBeNull();
  });
});

describe('nonce replay protection', () => {
  beforeEach(() => {
    clearUsedNonces();
  });

  it('should clear used nonces', () => {
    // Just verify clearUsedNonces doesn't throw
    expect(() => clearUsedNonces()).not.toThrow();
  });
});
