import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid query' }, { status: 400 });
    }

    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Pexels API key not set' }, { status: 500 });
    }

    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Pexels' }, { status: 500 });
    }

    const data = await res.json();
    const photo = data.photos?.[0];
    const imageUrl = photo?.src?.medium || null;

    console.log('Pexels API response:', data);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Failed to fetch image from Pexels:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
