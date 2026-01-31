#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function showSchema() {
  // Query PostgreSQL information_schema
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `
  });

  if (error) {
    // Try alternative approach - just list tables
    console.log('Fetching table structures...\n');
    
    const tables = [
      'profiles', 'vessels', 'trip_types', 'bookings',
      'availability_windows', 'blackout_dates', 'passengers'
    ];
    
    for (const table of tables) {
      const { data: sample } = await supabase.from(table).select('*').limit(1);
      if (sample && sample[0]) {
        console.log(`\n📋 ${table}:`);
        console.log(Object.keys(sample[0]).join(', '));
      }
    }
  } else {
    console.log(data);
  }
}

showSchema();
