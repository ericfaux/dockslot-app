/**
 * Shared timezone display label mapping.
 * Maps IANA timezone identifiers to human-readable labels.
 */

export const TIMEZONE_LABELS: Record<string, string> = {
  'America/New_York': 'Eastern Time (ET)',
  'America/Chicago': 'Central Time (CT)',
  'America/Denver': 'Mountain Time (MT)',
  'America/Phoenix': 'Arizona Time (AZ)',
  'America/Los_Angeles': 'Pacific Time (PT)',
  'America/Anchorage': 'Alaska Time (AKT)',
  'Pacific/Honolulu': 'Hawaii Time (HT)',
  'America/Puerto_Rico': 'Atlantic Time (AST)',
  'UTC': 'UTC',
};

/**
 * Returns a human-readable label for a given IANA timezone string.
 * Falls back to replacing underscores with spaces if no label is found.
 */
export function getTimezoneLabel(tz: string): string {
  return TIMEZONE_LABELS[tz] || tz.replace(/_/g, ' ');
}
