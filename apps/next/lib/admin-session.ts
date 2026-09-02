import { cookies } from 'next/headers';
import { createSupabaseAdmin } from './supabase/admin';
import { isAllowlisted } from './admin-allowlist';

const COOKIE = 'admin_session';

function expectedDevPass() {
  return process.env.ADMIN_DEV_PASS?.trim() ?? 'eileen-studio';
}

function samePhone(a: string, b: string) {
  const digits = (value: string) => value.replace(/\D/g, '');
  const left = digits(a);
  const right = digits(b);
  if (left.length >= 7 && right.length >= 7) return left === right;
  return a.trim() === b.trim();
}

export async function signInAdmin(email: string, pass: string) {
  if (!isAllowlisted(email)) {
    throw Object.assign(new Error('This inbox is not on the studio allowlist.'), { status: 403 });
  }

  const admin = createSupabaseAdmin();
  if (admin && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { createClient } = await import('@supabase/supabase-js');
    const auth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await auth.auth.signInWithPassword({ email, password: pass });
    if (error) throw Object.assign(new Error('Could not sign in.'), { status: 401 });
  } else if (!samePhone(pass, expectedDevPass())) {
    throw Object.assign(new Error('Could not sign in.'), { status: 401 });
  }

  const jar = await cookies();
  jar.set(COOKIE, Buffer.from(JSON.stringify({ email, at: Date.now() })).toString('base64url'), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function signOutAdmin() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function requireAdmin() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) throw Object.assign(new Error('Sign in required'), { status: 401 });
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString()) as { email?: string };
    if (!parsed.email || !isAllowlisted(parsed.email)) {
      throw new Error('not allowlisted');
    }
    return parsed.email;
  } catch {
    throw Object.assign(new Error('Sign in required'), { status: 401 });
  }
}

export async function peekAdmin() {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}
