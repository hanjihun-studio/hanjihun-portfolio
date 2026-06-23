// GET /api/data
// R2에 저장된 포트폴리오 데이터(설정 + 사진 목록)를 불러온다.
// 누구나 호출 가능 (방문자가 사이트를 볼 때 사용).

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // R2 버킷에서 data.json 객체를 가져온다
    const obj = await env.PORTFOLIO_BUCKET.get('data.json');

    if (!obj) {
      // 아직 아무것도 저장되지 않았으면 빈 기본값 반환
      return json({ siteData: null, navData: null, imageStore: {}, heroImages: [] });
    }

    const data = await obj.text();
    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        // 가벼운 목록 데이터 — 짧게 캐싱(60초)해 반복 방문 시 빠르게.
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return json({ error: 'load_failed', message: String(err) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
