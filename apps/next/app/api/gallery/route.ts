import { NextResponse } from 'next/server';
import { GALLERY } from '@/lib/content';

export async function GET() {
  return NextResponse.json({ pieces: GALLERY });
}
