import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

/**
 * Debug API endpoint for retrieving lastVisit data from Supabase
 */
export async function GET(_request: Request) {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        message: 'No authenticated user',
        lastVisit: null,
        auth: false,
      });
    }

    // Fetch last visit data
    const { data, error } = await supabase
      .from('last_visit')
      .select('*')
      .eq('user_id', user.id)
      .order('last_visited_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          lastVisit: null,
          auth: true,
          userId: user.id,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Success',
      lastVisit: data,
      auth: true,
      userId: user.id,
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        lastVisit: null,
      },
      { status: 500 }
    );
  }
}
