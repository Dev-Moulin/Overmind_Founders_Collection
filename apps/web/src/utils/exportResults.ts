import { formatEther } from 'viem';
import type { FounderWithTotem } from '../hooks/useAllProposals';

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Exported result data structure
 */
export interface ExportedResult {
  founderName: string;
  founderImage: string | null;
  winningTotemLabel: string | null;
  winningTotemImage: string | null;
  netScoreWei: string;
  netScoreFormatted: string;
  totalForWei: string;
  totalForFormatted: string;
  totalAgainstWei: string;
  totalAgainstFormatted: string;
  claimCount: number;
  totalProposals: number;
}

/**
 * Convert founders data to exportable format
 */
function prepareExportData(founders: FounderWithTotem[]): ExportedResult[] {
  return founders.map((founder) => ({
    founderName: founder.name,
    founderImage: founder.image || null,
    winningTotemLabel: founder.winningTotem?.object.label || null,
    winningTotemImage: founder.winningTotem?.object.image || null,
    netScoreWei: founder.winningTotem?.netScore.toString() || '0',
    netScoreFormatted: founder.winningTotem
      ? formatEther(founder.winningTotem.netScore)
      : '0',
    totalForWei: founder.winningTotem?.totalFor.toString() || '0',
    totalForFormatted: founder.winningTotem
      ? formatEther(founder.winningTotem.totalFor)
      : '0',
    totalAgainstWei: founder.winningTotem?.totalAgainst.toString() || '0',
    totalAgainstFormatted: founder.winningTotem
      ? formatEther(founder.winningTotem.totalAgainst)
      : '0',
    claimCount: founder.winningTotem?.claimCount || 0,
    totalProposals: founder.totalProposals,
  }));
}

/**
 * Export results to JSON format
 *
 * @param founders - Array of founders with their winning totems
 * @returns JSON string
 */
export function exportToJSON(founders: FounderWithTotem[]): string {
  const data = prepareExportData(founders);
  return JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      totalFounders: founders.length,
      foundersWithWinners: founders.filter((f) => f.winningTotem).length,
      results: data,
    },
    null,
    2
  );
}

/**
 * Export results to CSV format
 *
 * @param founders - Array of founders with their winning totems
 * @returns CSV string
 */
export function exportToCSV(founders: FounderWithTotem[]): string {
  const data = prepareExportData(founders);

  // CSV headers
  const headers = [
    'Founder Name',
    'Winning Totem',
    'NET Score (TRUST)',
    'Total FOR (TRUST)',
    'Total AGAINST (TRUST)',
    'Claim Count',
    'Total Proposals',
  ];

  // CSV rows
  const rows = data.map((row) => [
    `"${row.founderName}"`,
    `"${row.winningTotemLabel || 'No winner'}"`,
    row.netScoreFormatted,
    row.totalForFormatted,
    row.totalAgainstFormatted,
    row.claimCount.toString(),
    row.totalProposals.toString(),
  ]);

  // Combine headers and rows
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Download data as a file
 *
 * @param content - File content
 * @param filename - Name of the file
 * @param mimeType - MIME type of the file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export and download results
 *
 * @param founders - Array of founders with their winning totems
 * @param format - Export format ('json' or 'csv')
 *
 * @example
 * ```tsx
 * const { founders } = useAllProposals();
 *
 * // Export as JSON
 * exportResults(founders, 'json');
 *
 * // Export as CSV
 * exportResults(founders, 'csv');
 * ```
 */
export function exportResults(
  founders: FounderWithTotem[],
  format: ExportFormat
): void {
  const timestamp = new Date().toISOString().split('T')[0];

  if (format === 'json') {
    const content = exportToJSON(founders);
    downloadFile(
      content,
      `intuition-founders-results-${timestamp}.json`,
      'application/json'
    );
  } else {
    const content = exportToCSV(founders);
    downloadFile(
      content,
      `intuition-founders-results-${timestamp}.csv`,
      'text/csv'
    );
  }
}

/**
 * Hook-friendly export function that returns the data without downloading
 *
 * @param founders - Array of founders with their winning totems
 * @param format - Export format ('json' or 'csv')
 * @returns Formatted string content
 */
export function getExportContent(
  founders: FounderWithTotem[],
  format: ExportFormat
): string {
  return format === 'json' ? exportToJSON(founders) : exportToCSV(founders);
}
