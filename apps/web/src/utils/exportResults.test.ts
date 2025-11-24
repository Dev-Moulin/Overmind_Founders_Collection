import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportToJSON,
  exportToCSV,
  downloadFile,
} from './exportResults';
import type { FounderWithTotem } from '../hooks/useAllProposals';

// Mock founder data
const mockFounders: FounderWithTotem[] = [
  {
    id: '1',
    name: 'Vitalik Buterin',
    image: 'https://example.com/vitalik.jpg',
    totalProposals: 5,
    totalClaims: 10,
    totalVoters: 8,
    winningTotem: {
      objectId: 'obj-1',
      object: { id: 'obj-1', label: 'Phoenix', image: 'https://example.com/phoenix.jpg' },
      netScore: 1000000000000000000n, // 1 TRUST
      totalFor: 2000000000000000000n, // 2 TRUST
      totalAgainst: 1000000000000000000n, // 1 TRUST
      claimCount: 3,
    },
  },
  {
    id: '2',
    name: 'Gavin Wood',
    image: undefined,
    totalProposals: 2,
    totalClaims: 3,
    totalVoters: 2,
    winningTotem: undefined,
  },
];

describe('exportToJSON', () => {
  it('should return valid JSON string', () => {
    const result = exportToJSON(mockFounders);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should include export metadata', () => {
    const result = exportToJSON(mockFounders);
    const parsed = JSON.parse(result);
    expect(parsed.exportDate).toBeDefined();
    expect(parsed.totalFounders).toBe(2);
    expect(parsed.foundersWithWinners).toBe(1);
  });

  it('should include founder results', () => {
    const result = exportToJSON(mockFounders);
    const parsed = JSON.parse(result);
    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0].founderName).toBe('Vitalik Buterin');
  });

  it('should handle empty array', () => {
    const result = exportToJSON([]);
    const parsed = JSON.parse(result);
    expect(parsed.totalFounders).toBe(0);
    expect(parsed.results).toHaveLength(0);
  });
});

describe('exportToCSV', () => {
  it('should include headers', () => {
    const result = exportToCSV(mockFounders);
    expect(result).toContain('Founder Name');
    expect(result).toContain('Winning Totem');
    expect(result).toContain('NET Score');
  });

  it('should include founder data', () => {
    const result = exportToCSV(mockFounders);
    expect(result).toContain('Vitalik Buterin');
    expect(result).toContain('Phoenix');
  });

  it('should show "No winner" for founders without winning totem', () => {
    const result = exportToCSV(mockFounders);
    expect(result).toContain('No winner');
  });

  it('should handle empty array', () => {
    const result = exportToCSV([]);
    // Only headers, no data rows
    const lines = result.split('\n');
    expect(lines).toHaveLength(1); // Just headers
  });
});

describe('downloadFile', () => {
  let mockLink: {
    href: string;
    download: string;
    click: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  it('should create download link with correct filename', () => {
    downloadFile('test content', 'test.txt', 'text/plain');
    expect(mockLink.download).toBe('test.txt');
  });

  it('should trigger click to download', () => {
    downloadFile('test content', 'test.txt', 'text/plain');
    expect(mockLink.click).toHaveBeenCalled();
  });
});
