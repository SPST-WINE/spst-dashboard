// app/api/health/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    ts: new Date().toISOString(),
    env: process.env.VERCEL_ENV || "local",
    project: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null,
  });
}
