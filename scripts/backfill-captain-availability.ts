/**
 * Backfill script: Create default availability for existing captains
 *
 * This script finds all captains who don't have any availability_windows
 * and creates default windows for them.
 *
 * Run with: npx tsx scripts/backfill-captain-availability.ts
 *
 * Note: This is a one-time migration script. After running, the database
 * trigger will handle new captains automatically.
 */

import { createClient } from '@supabase/supabase-js';

// Configuration - uses environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Default availability configuration
const DEFAULT_AVAILABILITY = {
  start_time: '06:00:00',
  end_time: '21:00:00',
  // Monday (1) is off by default
  activeDays: [0, 2, 3, 4, 5, 6],
};

async function backfillCaptainAvailability() {
  console.log('Starting availability backfill...\n');

  // Find all profiles without any availability windows
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, business_name');

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    process.exit(1);
  }

  console.log(`Found ${profiles.length} total profiles\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const profile of profiles) {
    // Check if this profile already has availability windows
    const { count, error: countError } = await supabase
      .from('availability_windows')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', profile.id);

    if (countError) {
      console.error(`Error checking availability for ${profile.id}:`, countError);
      errors++;
      continue;
    }

    if (count && count > 0) {
      console.log(`  Skipping ${profile.full_name || profile.business_name || profile.id} - already has ${count} windows`);
      skipped++;
      continue;
    }

    // Create default availability windows
    const windows = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      owner_id: profile.id,
      day_of_week: dayOfWeek,
      start_time: DEFAULT_AVAILABILITY.start_time,
      end_time: DEFAULT_AVAILABILITY.end_time,
      is_active: DEFAULT_AVAILABILITY.activeDays.includes(dayOfWeek),
    }));

    const { error: insertError } = await supabase
      .from('availability_windows')
      .insert(windows);

    if (insertError) {
      console.error(`Error creating availability for ${profile.id}:`, insertError);
      errors++;
      continue;
    }

    console.log(`  Created default availability for ${profile.full_name || profile.business_name || profile.id}`);
    created++;
  }

  console.log('\n========================================');
  console.log('Backfill complete!');
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);
  console.log('========================================\n');
}

// Run the backfill
backfillCaptainAvailability().catch(console.error);
