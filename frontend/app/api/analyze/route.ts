// frontend/app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log("");
    console.log("📨 POST /api/analyze (proxy)");

    // 1. Read the environment variable
    const BACKEND_API_URL = process.env.BACKEND_API_URL;

    // Critical check - is the variable defined?
    if (!BACKEND_API_URL) {
        console.error("   ❌ EDGE CASE: BACKEND_API_URL is undefined in Vercel!");
        console.log("   ↩ 500 — Server configuration error");
        return NextResponse.json(
            { error: 'Server configuration error: Missing Backend URL' },
            { status: 500 }
        );
    }

    try {
        // 2. Read the form from the Frontend
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            console.error("   🚫 EDGE CASE: no file in request");
            console.log("   ↩ 400 Bad Request");
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log(`   📄 file="${(file as File).name}" size=${(file as File).size}B`);
        console.log(`   → forwarding to backend at ${BACKEND_API_URL}/analyze`);

        // 3. Send to Python (Fetch handles the multipart Content-Type/boundary
        // headers automatically — don't set that one manually). The internal
        // API secret IS added explicitly: it's a server-side-only env var
        // (never shipped to the browser bundle), so only this Next.js server
        // can produce it -- proves the request came through our own proxy,
        // not a direct curl/script call to the backend.
        const response = await fetch(`${BACKEND_API_URL}/analyze`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Internal-Api-Key': process.env.INTERNAL_API_SECRET || '',
            },
        });

        // 4. Handle the response from Python
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`   🚫 EDGE CASE: backend rejected the request (${response.status})`);
            console.log(`   ↩ ${response.status} (forwarded from backend)`);

            // FastAPI's HTTPException body is {"detail": "..."} -- forward that
            // `detail` field as-is instead of re-wrapping it into a generic
            // `error` string, so the dashboard can show the backend's actual
            // rejection reason (e.g. "resume has 2 pages") instead of a
            // one-size-fits-all fallback message.
            let detail = errorText;
            try {
                const parsed = JSON.parse(errorText);
                if (typeof parsed?.detail === 'string') detail = parsed.detail;
            } catch {
                // errorText wasn't JSON -- fall back to the raw text above.
            }

            return NextResponse.json({ detail }, { status: response.status });
        }

        const data = await response.json();
        console.log(`   ✅ backend accepted — session_id=${data.session_id}`);
        console.log("   ↩ 200 OK");

        return NextResponse.json(data);

    } catch (error: unknown) {
        console.error("   ❌ EDGE CASE: proxy internal error:", error);
        console.log("   ↩ 500 Internal Server Error");
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: `Failed to connect to backend: ${message}` },
            { status: 500 }
        );
    }
}