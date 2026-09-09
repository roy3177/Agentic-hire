// frontend/app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log("🔵 API Route hit: Starting request proxy...");

    // 1. Read the environment variable
    const BACKEND_API_URL = process.env.BACKEND_API_URL;

    // Critical check - is the variable defined?
    if (!BACKEND_API_URL) {
        console.error("❌ Critical Error: BACKEND_API_URL is undefined in Vercel!");
        return NextResponse.json(
            { error: 'Server configuration error: Missing Backend URL' },
            { status: 500 }
        );
    }

    console.log(`🔗 Connecting to Backend at: ${BACKEND_API_URL}`);

    try {
        // 2. Read the form from the Frontend
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            console.error("❌ Error: No file found in request");
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log(`📄 File received: ${(file as File).name}, Size: ${(file as File).size} bytes`);

        // 3. Send to Python (Fetch handles the headers automatically — that's the magic)
        const response = await fetch(`${BACKEND_API_URL}/analyze`, {
            method: 'POST',
            body: formData,
            // Very important: do not set headers manually here! fetch will handle it correctly.
        });

        // 4. Handle the response from Python
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Python Backend Error (${response.status}):`, errorText);

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
        console.log("✅ Success! Data received from Python:", data);

        return NextResponse.json(data);

    } catch (error: unknown) {
        console.error("❌ Proxy Internal Error:", error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: `Failed to connect to backend: ${message}` },
            { status: 500 }
        );
    }
}