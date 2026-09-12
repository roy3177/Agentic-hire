/**
 * @author: Roy Meoded
 * @ date: 2026-09-12
 * @description: This is the API route for fetching the status of a specific job application. 
 * It acts as a proxy between the frontend and the backend.
 * 
 */


import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

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
        const response = await axios.get(`${BACKEND_API_URL}/status/${id}`, {
            headers: { 'X-Internal-Api-Key': process.env.INTERNAL_API_SECRET || '' },
        });
        return NextResponse.json(response.data);

    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            const axiosError = error as AxiosError;
            return NextResponse.json(axiosError.response!.data, { status: axiosError.response!.status });
        }
        return NextResponse.json(
            { error: 'Backend unreachable' },
            { status: 500 }
        );
    }
}