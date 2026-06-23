// GET /api/img/:id
// R2에 개별 저장된 이미지 파일 하나를 반환한다.
// 브라우저가 오래 캐싱하도록 설정 → 두 번째 방문부터 즉시 로드.

export async function onRequestGet(context) {
  const { env, params } = context;
  const id = params.id; // 예: "img_abc123.jpg"

  try {
    const obj = await env.PORTFOLIO_BUCKET.get('images/' + id);
    if (!obj) {
      return new Response('Not found', { status: 404 });
    }
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('etag', obj.httpEtag);
    // 이미지는 거의 안 바뀌므로 1년 캐싱 (URL이 고유 id라 안전)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Access-Control-Allow-Origin', '*');
    return new Response(obj.body, { headers });
  } catch (err) {
    return new Response('Error: ' + String(err), { status: 500 });
  }
}
