import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), '模块逻辑流程文档.md');
    const content = await readFile(filePath, 'utf-8');
    return NextResponse.json({ success: true, content });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '读取文档失败' },
      { status: 500 }
    );
  }
}
