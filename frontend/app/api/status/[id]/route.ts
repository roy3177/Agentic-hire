import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

// Type fix: params is now a Promise in Next.js 15
interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    // Critical fix: you must await params before accessing its content
    const { id } = await context.params;

    try {
        const response = await axios.get(`${BACKEND_API_URL}/status/${id}`);
        return NextResponse.json(response.data);

    } catch (error: any) {
        if (error.response) {
            return NextResponse.json(error.response.data, { status: error.response.status });
        }
        return NextResponse.json(
            { error: 'Backend unreachable' },
            { status: 500 }
        );
    }
}