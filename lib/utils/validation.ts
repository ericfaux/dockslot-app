/**
 * DockSlot Validation Utilities
 */

import { parseISO, isValid, isFuture, differenceInHours, format, getDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// ============================================================================
// Email Validation
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

// ============================================================================
// Phone Validation
// ============================================================================

const PHONE_REGEX = /^[\d\s()+-]{10,20}$/;

export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/\s/g, '');
  return PHONE_REGEX.test(cleaned);
}

// ============================================================================
// Date Validation (YYYY-MM-DD format)
// ============================================================================

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function parseDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  if (!DATE_REGEX.test(dateStr)) return null;

  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : null;
}

export function isValidDate(dateStr: string): boolean {
  return parseDate(dateStr) !== null;
}

// ============================================================================
// Time Validation (HH:MM or HH:MM:SS format)
// ============================================================================

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export function isValidTime(timeStr: string): boolean {
  if (!timeStr || typeof timeStr !== 'string') return false;
  return TIME_REGEX.test(timeStr);
}

export function parseTime(timeStr: string): { hours: number; minutes: number; seconds: number } | null {
  if (!isValidTime(timeStr)) return null;

  const parts = timeStr.split(':');
  return {
    hours: parseInt(parts[0], 10),
    minutes: parseInt(parts[1], 10),
    seconds: parts[2] ? parseInt(parts[2], 10) : 0,
  };
}

// ============================================================================
// Timestamp Validation (ISO 8601 format)
// ============================================================================

export function isValidTimestamp(ts: string): boolean {
  if (!ts || typeof ts !== 'string') return false;
  const parsed = parseISO(ts);
  return isValid(parsed);
}

export function parseTimestamp(ts: string): Date | null {
  if (!isValidTimestamp(ts)) return null;
  return parseISO(ts);
}

export function isFutureTimestamp(ts: string): boolean {
  const parsed = parseTimestamp(ts);
  if (!parsed) return false;
  return isFuture(parsed);
}

// ============================================================================
// Duration Calculations
// ============================================================================

export function getDurationHours(start: string, end: string): number {
  const startDate = parseTimestamp(start);
  const endDate = parseTimestamp(end);

  if (!startDate || !endDate) return 0;

  return differenceInHours(endDate, startDate);
}

// ============================================================================
// Timezone-aware Operations
// ============================================================================

export function getDateInTimezone(ts: string, timezone: string): string {
  const parsed = parseTimestamp(ts);
  if (!parsed) return '';

  const zonedDate = toZonedTime(parsed, timezone);
  return format(zonedDate, 'yyyy-MM-dd');
}

export function getDayOfWeek(ts: string, timezone: string): number {
  const parsed = parseTimestamp(ts);
  if (!parsed) return -1;

  const zonedDate = toZonedTime(parsed, timezone);
  return getDay(zonedDate); // 0 = Sunday, 6 = Saturday
}

export function getTimeInTimezone(ts: string, timezone: string): string {
  const parsed = parseTimestamp(ts);
  if (!parsed) return '';

  const zonedDate = toZonedTime(parsed, timezone);
  return format(zonedDate, 'HH:mm:ss');
}

/**
 * Check if a timestamp falls within a time range (for availability windows)
 * The time range is specified in the captain's timezone
 */
export function isWithinTimeRange(
  ts: string,
  startTime: string, // HH:MM or HH:MM:SS format
  endTime: string,   // HH:MM or HH:MM:SS format
  timezone: string
): boolean {
  const parsed = parseTimestamp(ts);
  if (!parsed) return false;

  const zonedDate = toZonedTime(parsed, timezone);
  const timeStr = format(zonedDate, 'HH:mm:ss');

  // Normalize times to HH:mm:ss for comparison
  const normalizedStart = startTime.length === 5 ? `${startTime}:00` : startTime;
  const normalizedEnd = endTime.length === 5 ? `${endTime}:00` : endTime;

  return timeStr >= normalizedStart && timeStr <= normalizedEnd;
}

/**
 * Check if both start and end timestamps fall within a time window
 */
export function isBookingWithinTimeWindow(
  scheduledStart: string,
  scheduledEnd: string,
  windowStart: string, // HH:MM or HH:MM:SS format
  windowEnd: string,   // HH:MM or HH:MM:SS format
  timezone: string
): boolean {
  return (
    isWithinTimeRange(scheduledStart, windowStart, windowEnd, timezone) &&
    isWithinTimeRange(scheduledEnd, windowStart, windowEnd, timezone)
  );
}

/**
 * Create an ISO timestamp from a date and time in a specific timezone
 */
export function createTimestamp(
  date: string,      // YYYY-MM-DD
  time: string,      // HH:MM or HH:MM:SS
  timezone: string
): string | null {
  if (!isValidDate(date) || !isValidTime(time)) return null;

  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const localDateTimeStr = `${date}T${normalizedTime}`;
  const localDate = parseISO(localDateTimeStr);

  if (!isValid(localDate)) return null;

  const utcDate = fromZonedTime(localDate, timezone);
  return utcDate.toISOString();
}

// ============================================================================
// UUID Validation
// ============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id);
}

// ============================================================================
// Party Size Validation
// ============================================================================

export function isValidPartySize(size: number, maxCapacity: number = 6): boolean {
  return Number.isInteger(size) && size >= 1 && size <= maxCapacity;
}

// ============================================================================
// String Sanitization
// ============================================================================

export function sanitizeString(str: string | null | undefined, maxLength: number = 500): string {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

export function sanitizeName(name: string | null | undefined): string {
  return sanitizeString(name, 100);
}

export function sanitizeNotes(notes: string | null | undefined): string {
  return sanitizeString(notes, 2000);
}

// ============================================================================
// Booking Slug Validation & Generation
// ============================================================================

const BOOKING_SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidBookingSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  if (slug.length < 3 || slug.length > 50) return false;
  return BOOKING_SLUG_REGEX.test(slug);
}

export function generateSlugFromName(name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
    .replace(/-$/, '');

  if (slug.length < 3) {
    slug = (slug + '-charter').slice(0, 50);
  }

  return slug;
}
