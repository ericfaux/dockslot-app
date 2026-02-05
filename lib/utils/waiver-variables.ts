/**
 * Waiver Template Variable Substitution
 *
 * Supports the following variables:
 * - {{guest_name}} - Primary contact name
 * - {{trip_date}} - Scheduled trip date
 * - {{trip_time}} - Scheduled trip start time
 * - {{captain_name}} - Captain's full name or business name
 * - {{vessel_name}} - Vessel name
 * - {{trip_type}} - Type of trip (e.g., "Half-Day Fishing Charter")
 * - {{party_size}} - Number of people in party
 * - {{passenger_name}} - Current passenger's name (for signing)
 * - {{current_date}} - Today's date
 */

import { format, parseISO } from 'date-fns';

export interface WaiverVariableContext {
  guestName?: string;
  passengerName?: string;
  tripDate?: string; // ISO date string
  captainName?: string;
  vesselName?: string;
  tripType?: string;
  partySize?: number;
}

export const WAIVER_VARIABLES = [
  { key: '{{guest_name}}', description: 'Primary contact name', example: 'John Smith' },
  { key: '{{passenger_name}}', description: 'Current passenger signing', example: 'Jane Doe' },
  { key: '{{trip_date}}', description: 'Scheduled trip date', example: 'February 15, 2026' },
  { key: '{{trip_time}}', description: 'Scheduled start time', example: '8:00 AM' },
  { key: '{{captain_name}}', description: 'Captain name', example: 'Captain Mike' },
  { key: '{{vessel_name}}', description: 'Vessel name', example: 'Sea Breeze' },
  { key: '{{trip_type}}', description: 'Type of trip', example: 'Half-Day Fishing Charter' },
  { key: '{{party_size}}', description: 'Number in party', example: '4' },
  { key: '{{current_date}}', description: 'Today\'s date', example: 'February 5, 2026' },
] as const;

/**
 * Substitute variables in waiver template content
 */
export function substituteWaiverVariables(
  content: string,
  context: WaiverVariableContext
): string {
  let result = content;

  // Guest name
  if (context.guestName) {
    result = result.replace(/\{\{guest_name\}\}/gi, context.guestName);
  }

  // Passenger name (for signing)
  if (context.passengerName) {
    result = result.replace(/\{\{passenger_name\}\}/gi, context.passengerName);
  }

  // Trip date and time
  if (context.tripDate) {
    try {
      const date = parseISO(context.tripDate);
      result = result.replace(/\{\{trip_date\}\}/gi, format(date, 'MMMM d, yyyy'));
      result = result.replace(/\{\{trip_time\}\}/gi, format(date, 'h:mm a'));
    } catch {
      // Leave placeholders if date is invalid
    }
  }

  // Captain name
  if (context.captainName) {
    result = result.replace(/\{\{captain_name\}\}/gi, context.captainName);
  }

  // Vessel name
  if (context.vesselName) {
    result = result.replace(/\{\{vessel_name\}\}/gi, context.vesselName);
  }

  // Trip type
  if (context.tripType) {
    result = result.replace(/\{\{trip_type\}\}/gi, context.tripType);
  }

  // Party size
  if (context.partySize !== undefined) {
    result = result.replace(/\{\{party_size\}\}/gi, String(context.partySize));
  }

  // Current date
  result = result.replace(/\{\{current_date\}\}/gi, format(new Date(), 'MMMM d, yyyy'));

  return result;
}

/**
 * Highlight unsubstituted variables in content (for preview)
 * Returns HTML with highlighted placeholders
 */
export function highlightUnsubstitutedVariables(content: string): string {
  return content.replace(
    /\{\{([a-z_]+)\}\}/gi,
    '<span class="bg-amber-500/20 text-amber-300 px-1 rounded font-mono text-sm">${{$1}}</span>'
  );
}

/**
 * Get list of variables used in content
 */
export function getUsedVariables(content: string): string[] {
  const matches = content.match(/\{\{([a-z_]+)\}\}/gi);
  if (!matches) return [];

  return [...new Set(matches.map((m) => m.toLowerCase()))];
}

/**
 * Validate that all variables in content are recognized
 */
export function validateVariables(content: string): { valid: boolean; unknown: string[] } {
  const usedVariables = getUsedVariables(content);
  const knownVariables = WAIVER_VARIABLES.map((v) => v.key.toLowerCase());
  const unknown = usedVariables.filter((v) => !knownVariables.includes(v));

  return {
    valid: unknown.length === 0,
    unknown,
  };
}
