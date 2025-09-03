// app/logout/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Pulisce il cookie di sessione e reindirizza a spst.it
function clearAndRedirect() {
  const res = NextResponse.redirect("https://spst.it");
  res.cookies.set({
    name: "spst_session",
    value: "",
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res;
}

export async function GET() { return clearAndRedirect(); }
export async function HEAD() { return clearAndRedirect(); }
// opzionale ma harmless
export async function POST() { return clearAndRedirect(); }
