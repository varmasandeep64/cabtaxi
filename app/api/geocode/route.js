import { NextResponse } from 'next/server';
import { SERVICE_AREA } from '../../lib/fare';

const HEADERS = { 'User-Agent': 'cabTaxi-MVP/1.0' };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  try {
    // Reverse geocode: coordinates -> address (used by GPS button, map clicks, pin drags)
    if (lat && lon) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`,
        { headers: HEADERS }
      );
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Forward search: text -> list of places
    if (!q) return NextResponse.json([]);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&addressdetails=1&limit=5&bounded=1&viewbox=${SERVICE_AREA.minLon},${SERVICE_AREA.maxLat},${SERVICE_AREA.maxLon},${SERVICE_AREA.minLat}`,
      { headers: HEADERS }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch location' }, { status: 500 });
  }
}
