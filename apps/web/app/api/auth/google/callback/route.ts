import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=google_cancelled", req.url));
  }

  try {
    const res = await fetch(`${API}/api/v1/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL("/login?error=google_failed", req.url));
    }

    const user = await res.json() as { username: string; display_name: string | null; email: string | null };

    // Pass user data via query params to a client page that stores them in localStorage
    const params = new URLSearchParams({
      username: user.username,
      display_name: user.display_name ?? user.username,
    });
    return NextResponse.redirect(new URL(`/auth/google/success?${params}`, req.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_failed", req.url));
  }
}
