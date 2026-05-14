import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4318';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/runs/${encodeURIComponent(id)}/events`);

        if (!res.body) {
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 直接转发原始字节，保持 SSE 格式
          controller.enqueue(value);
        }
      } catch (error) {
        console.error('SSE error:', error);
        // 发送错误事件
        const errorData = `data: ${JSON.stringify({ error: '连接失败' })}\n\n`;
        controller.enqueue(new TextEncoder().encode(errorData));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
