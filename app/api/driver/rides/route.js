import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// GET /api/driver/rides -> { open: rides waiting for a driver, mine: rides I accepted }
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [openRes, mineRes, ratingRes] = await Promise.all([
    supabaseAdmin
      .from('rides')
      .select('id, ride_type, pickup, dropoff, amount, created_at, status')
      .eq('status', 'paid')
      .is('driver_id', null)
      .order('created_at', { ascending: true })
      .limit(20),
    supabaseAdmin
      .from('rides')
      .select('*')
      .eq('driver_id', userId)
      .order('accepted_at', { ascending: false })
      .limit(50),
    supabaseAdmin.from('rides').select('rating').eq('driver_id', userId).not('rating', 'is', null),
  ]);

  const error = openRes.error || mineRes.error || ratingRes.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ratings = (ratingRes.data || []).map((r) => r.rating);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  return NextResponse.json({
    open: openRes.data || [],
    mine: mineRes.data || [],
    avgRating,
    ratingCount: ratings.length,
  });
}
