import { NextResponse } from 'next/server';
import { getDbStatus } from '@/lib/db';

export async function GET() {
  try {
    const status = await getDbStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
