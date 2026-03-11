import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';

/**
 * GET /api/cron/generate-referral-codes
 * 
 * Cron job: Auto-generate referral codes for guests who completed their first trip
 * Run daily to create codes for new completed bookings
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (optional security)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();

  try {
    // Find completed bookings without referral codes (from last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: completedBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, captain_id, guest_name, guest_email')
      .eq('status', 'completed')
      .gte('updated_at', sevenDaysAgo.toISOString())
      .order('updated_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching completed bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    if (!completedBookings || completedBookings.length === 0) {
      return NextResponse.json({ 
        message: 'No completed bookings found',
        codesGenerated: 0 
      });
    }

    let codesGenerated = 0;
    const errors: string[] = [];

    // Process each booking
    for (const booking of completedBookings) {
      // Check if guest already has a referral code for this captain
      const { data: existingCode } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('captain_id', booking.captain_id)
        .eq('guest_email', booking.guest_email.toLowerCase())
        .single();

      if (existingCode) {
        continue; // Skip if code already exists
      }

      // Check if referral program is enabled for this captain
      const { data: settings } = await supabase
        .from('referral_settings')
        .select('is_enabled')
        .eq('captain_id', booking.captain_id)
        .eq('is_enabled', true)
        .single();

      if (!settings) {
        continue; // Skip if referral program not enabled
      }

      // Generate unique code
      const { data: generatedCode, error: genError } = await supabase.rpc(
        'generate_referral_code',
        {
          p_captain_id: booking.captain_id,
          p_guest_name: booking.guest_name,
          p_guest_email: booking.guest_email,
        }
      );

      if (genError) {
        console.error('Error generating referral code:', genError);
        errors.push(`Failed to generate code for ${booking.guest_email}`);
        continue;
      }

      // Create the referral code
      const { error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          captain_id: booking.captain_id,
          code: generatedCode,
          guest_email: booking.guest_email.toLowerCase(),
          guest_name: booking.guest_name,
        });

      if (insertError) {
        console.error('Error creating referral code:', insertError);
        errors.push(`Failed to save code for ${booking.guest_email}`);
        continue;
      }

      codesGenerated++;

    }

    return NextResponse.json({
      success: true,
      message: 'Referral codes generated',
      codesGenerated,
      totalProcessed: completedBookings.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error in generate-referral-codes cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
