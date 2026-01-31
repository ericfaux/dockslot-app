#!/usr/bin/env node
/**
 * Quick script to inspect DockSlot Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDatabase() {
  console.log('🚢 DockSlot Database Inspection\n');
  console.log(`📍 Connected to: ${supabaseUrl}\n`);

  // Check auth users
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  console.log(`👥 Auth Users: ${users?.users?.length || 0} total`);
  if (usersError) console.error('   Error:', usersError.message);

  // List all tables
  const tables = [
    'profiles',
    'vessels',
    'trip_types',
    'bookings',
    'availability_windows',
    'blackout_dates',
    'reschedule_offers',
    'booking_logs',
    'passengers',
    'payments',
    'guest_tokens',
    'waiver_templates',
    'waiver_signatures',
  ];

  console.log('\n📊 Table Row Counts:');
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ${table}: ❌ ${error.message}`);
    } else {
      console.log(`   ${table}: ${count || 0} rows`);
    }
  }

  // Check for any profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);
  
  console.log('\n🧑‍✈️ Profiles:');
  if (profilesError) {
    console.log('   Error:', profilesError.message);
  } else if (profiles && profiles.length > 0) {
    profiles.forEach(p => {
      console.log(`   - ${p.business_name || p.full_name || 'Unnamed'} (${p.id})`);
    });
  } else {
    console.log('   No profiles found');
  }

  // Check for any vessels
  const { data: vessels } = await supabase
    .from('vessels')
    .select('*')
    .limit(5);
  
  console.log('\n⛵ Vessels:');
  if (vessels && vessels.length > 0) {
    vessels.forEach(v => {
      console.log(`   - ${v.name} (${v.capacity} pax)`);
    });
  } else {
    console.log('   No vessels found');
  }

  // Check for any trip types
  const { data: tripTypes } = await supabase
    .from('trip_types')
    .select('*')
    .limit(5);
  
  console.log('\n🎣 Trip Types:');
  if (tripTypes && tripTypes.length > 0) {
    tripTypes.forEach(t => {
      console.log(`   - ${t.title} (${t.duration_hours}h, $${t.price_total / 100})`);
    });
  } else {
    console.log('   No trip types found');
  }

  // Check for any bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, trip_type:trip_types(*), vessel:vessels(*)')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('\n📅 Recent Bookings:');
  if (bookings && bookings.length > 0) {
    bookings.forEach(b => {
      console.log(`   - ${b.guest_name} | ${b.status} | ${b.scheduled_start}`);
    });
  } else {
    console.log('   No bookings found');
  }

  console.log('\n✅ Database inspection complete!\n');
}

inspectDatabase().catch(console.error);
