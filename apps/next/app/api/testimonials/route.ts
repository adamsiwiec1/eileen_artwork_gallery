import { NextResponse } from 'next/server';
import { TESTIMONIALS } from '@/lib/content';

export async function GET() {
  return NextResponse.json({ testimonials: TESTIMONIALS });
}
