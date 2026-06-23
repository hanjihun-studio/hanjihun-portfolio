// POST /api/upload
// 어드민이 이미지 하나를 업로드하면 R2에 개별 파일로 저장하고
// 접근 가능한 URL(/api/img/파일명)을 돌려준다. 비밀번호 인증 필요.

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    // 1) 비밀번호 인증
    if (!body.password || body.password !== env.ADMIN_PASSWORD) {
      return json({ error: 'unauthorized' }, 401);
    }

    // 2) base64 data URL → 바이너리
    const dataUrl = body.dataUrl || '';
    const m = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!m) {
      return json({ error: 'invalid_image' }, 400);
    }
    const mime = m[1];
    const b64  = m[2];
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));

    // 3) 고유 파일명 생성
    const ext = mime === 'image/png' ? 'png' : (mime === 'image/webp' ? 'webp' : 'jpg');
    const id = 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;

    // 4) R2에 저장
    await env.PORTFOLIO_BUCKET.put('images/' + id, bytes, {
      httpMetadata: { contentType: mime },
    });

    return json({ ok: true, url: '/api/img/' + id, id });
  } catch (err) {
    return json({ error: 'upload_failed', message: String(err) }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
