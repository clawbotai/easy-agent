import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4318';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspace = searchParams.get('workspace') || '';

  try {
    const res = await fetch(`${BACKEND_URL}/api/agents?workspace=${encodeURIComponent(workspace)}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ agents: [] }, { status: 500 });
  }
}
