import { NextRequest, NextResponse } from 'next/server'
import { timingSafeCompare, createAdminSessionToken, checkRateLimit, resetRateLimit } from '@/lib/auth-security'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';

    // Rate Limiting
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many failed login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Timing-safe password check
    if (!timingSafeCompare(password, adminPassword)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Reset rate limit on successful authentication
    resetRateLimit(ip);

    // Create cryptographically signed HMAC session token
    const token = await createAdminSessionToken();

    // Set secure admin auth cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin-auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

