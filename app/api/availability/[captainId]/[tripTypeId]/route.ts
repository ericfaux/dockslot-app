import { NextRequest, NextResponse } from 'next/server';
import {
  getAvailableSlots,
  getDateRangeAvailability,
  formatSlotTime,
  type AvailableSlot,
} from '@/lib/availability';
import { isValidUUID, isValidDate } from '@/lib/utils/validation';

// ============================================================================
// Types for API Response
// ============================================================================

interface SlotResponse {
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  display_start: string; // Formatted time like "9:00 AM"
  display_end: string; // Formatted time like "1:00 PM"
}

interface AvailabilitySlotsResponse {
  success: boolean;
  data?: {
    date: string;
    captain_timezone: string;
    slots: SlotResponse[];
    date_info: {
      date: string;
      day_of_week: number;
      has_availability: boolean;
      is_blackout: boolean;
      blackout_reason?: string | null;
      is_past: boolean;
      is_beyond_advance_window: boolean;
      has_active_window: boolean;
    };
  };
  error?: string;
  code?: string;
}

interface DateRangeResponse {
  success: boolean;
  data?: {
    dates: Array<{
      date: string;
      day_of_week: number;
      has_availability: boolean;
      is_blackout: boolean;
      blackout_reason?: string | null;
      is_past: boolean;
      is_beyond_advance_window: boolean;
      has_active_window: boolean;
    }>;
    captain_timezone: string;
  };
  error?: string;
  code?: string;
}

// ============================================================================
// GET /api/availability/[captainId]/[tripTypeId]
//
// Query parameters:
// - date: YYYY-MM-DD - Get available slots for a specific date
// - days: number (optional) - Get date range availability (used when date is not provided)
//
// Returns:
// - If date is provided: Available slots for that date with ISO datetime and display times
// - If date is not provided: Date range availability for the next N days
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ captainId: string; tripTypeId: string }> }
): Promise<NextResponse<AvailabilitySlotsResponse | DateRangeResponse>> {
  try {
    const resolvedParams = await params;
    const { captainId, tripTypeId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const daysParam = searchParams.get('days');

    // Validate captain ID
    if (!captainId || !isValidUUID(captainId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid captain ID',
          code: 'VALIDATION',
        },
        { status: 400 }
      );
    }

    // Validate trip type ID
    if (!tripTypeId || !isValidUUID(tripTypeId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid trip type ID',
          code: 'VALIDATION',
        },
        { status: 400 }
      );
    }

    // If date is provided, get slots for that specific date
    if (date) {
      if (!isValidDate(date)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid date format. Use YYYY-MM-DD',
            code: 'VALIDATION',
          },
          { status: 400 }
        );
      }

      const result = await getAvailableSlots(captainId, tripTypeId, date);

      if (!result.success) {
        const statusCode = result.code === 'NOT_FOUND' ? 404 :
                          result.code === 'HIBERNATING' ? 403 : 400;
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            code: result.code,
          },
          { status: statusCode }
        );
      }

      // Add display times to slots
      const timezone = result.data!.captain_timezone;
      const slotsWithDisplay: SlotResponse[] = result.data!.slots.map((slot: AvailableSlot) => ({
        start_time: slot.start_time,
        end_time: slot.end_time,
        display_start: formatSlotTime(slot.start_time, timezone),
        display_end: formatSlotTime(slot.end_time, timezone),
      }));

      return NextResponse.json({
        success: true,
        data: {
          date: result.data!.date,
          captain_timezone: timezone,
          slots: slotsWithDisplay,
          date_info: result.data!.date_info,
        },
      });
    }

    // If no date is provided, return date range availability
    const days = daysParam ? parseInt(daysParam, 10) : 60;
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        {
          success: false,
          error: 'Days must be a number between 1 and 365',
          code: 'VALIDATION',
        },
        { status: 400 }
      );
    }

    const rangeResult = await getDateRangeAvailability(captainId, days);

    if (!rangeResult.success) {
      const statusCode = rangeResult.code === 'NOT_FOUND' ? 404 :
                        rangeResult.code === 'HIBERNATING' ? 403 : 400;
      return NextResponse.json(
        {
          success: false,
          error: rangeResult.error,
          code: rangeResult.code,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: rangeResult.data,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'DATABASE',
      },
      { status: 500 }
    );
  }
}
