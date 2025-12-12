export async function GET() {
  try {
    const apiKey = process.env.VIDEO_GENERATION_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Missing VIDEO_GENERATION_API_KEY env' }, { status: 500 });
    }

    const url = 'https://api.heygen.com/v2/avatars';
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-api-key': apiKey,
      },
      // Next.js edge/runtime note: no body, simple GET
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json(
        { error: 'HeyGen avatars request failed', status: res.status, detail: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
