// POST /api/save
// 어드민이 저장 버튼을 누르면 호출된다.
// 비밀번호를 확인한 뒤 R2에 data.json으로 저장한다.

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    // 1) 비밀번호 인증 (Cloudflare 환경변수 ADMIN_PASSWORD와 대조)
    if (!body.password || body.password !== env.ADMIN_PASSWORD) {
      return json({ error: 'unauthorized' }, 401);
    }

    // 2) 저장할 데이터만 추려서 R2에 저장
    const payload = {
      siteData:   body.siteData   || null,
      navData:    body.navData    || null,
      imageStore: body.imageStore || {},
      heroImages: body.heroImages || [],
      updatedAt:  new Date().toISOString(),
    };

    await env.PORTFOLIO_BUCKET.put('data.json', JSON.stringify(payload), {
      httpMetadata: { contentType: 'application/json' },
    });

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'save_failed', message: String(err) }, 500);
  }
}

// CORS preflight
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
