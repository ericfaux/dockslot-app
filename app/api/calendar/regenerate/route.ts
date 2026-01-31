import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Generate new calendar token
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ calendar_token: newToken })
      .eq('id', user.id)
      .select('calendar_token')
      .single();

    if (error) {
      console.error('Failed to regenerate token:', error);
      return NextResponse.json(
        { error: 'Failed to regenerate token' },
        { status: 500 }
      );
    }

    return NextResponse.json({ calendarToken: profile.calendar_token });
  } catch (error) {
    console.error('Token regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate token' },
      { status: 500 }
    );
  }
}
