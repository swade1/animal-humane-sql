import { NextResponse } from 'next/server';

// Use a server-side environment variable for the password
const SITE_PASSWORD = process.env.SITE_PASSWORD;

// Simple session token generator (replace with a more secure method if needed)
function generateSessionToken() {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  );
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }
    if (password === SITE_PASSWORD) {
      // Generate a session token
      const token = generateSessionToken();
      // Optionally: Set a cookie here for session management
      return NextResponse.json({ success: true, token });
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
