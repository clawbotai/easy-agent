import { NextResponse } from 'next/server';
import { join } from 'node:path';

export async function GET() {
  // 返回项目根目录（web 的父目录）
  const workspace = join(process.cwd(), '..');

  return NextResponse.json({
    workspace,
  });
}
