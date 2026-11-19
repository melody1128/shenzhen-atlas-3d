const upstreams = new Map([
  ["/v3/config/district", "https://restapi.amap.com"],
  ["/v3/place/text", "https://restapi.amap.com"],
  ["/v3/place/around", "https://restapi.amap.com"],
  ["/v4/map/styles", "https://webapi.amap.com"],
]);

export async function proxyAMap(request, { key, securityCode }) {
  if (request.method !== "GET") return new Response(null, { status: 405, headers: { Allow: "GET" } });

  const url = new URL(request.url);
  const path = url.pathname.slice("/_AMapService".length);
  const host = upstreams.get(path);
  if (!host) return new Response(null, { status: 404 });
  if (!key || !securityCode) return new Response("高德服务端凭据未配置", { status: 503 });
  if (url.searchParams.has("key") && url.searchParams.get("key") !== key) {
    return new Response(null, { status: 403 });
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return new Response(null, { status: 403 });
  }

  const upstream = new URL(path, host);
  upstream.search = url.search;
  upstream.searchParams.set("key", key);
  upstream.searchParams.set("jscode", securityCode);
  const headers = new Headers();
  const referer = request.headers.get("referer");
  if (referer) headers.set("referer", referer);

  try {
    const result = await fetch(upstream, { headers, redirect: "error", signal: AbortSignal.timeout(10_000) });
    const responseHeaders = new Headers({ "cache-control": "no-store" });
    const type = result.headers.get("content-type");
    if (type) responseHeaders.set("content-type", type);
    return new Response(result.body, { status: result.status, headers: responseHeaders });
  } catch {
    return new Response("高德上游暂时不可用", { status: 502 });
  }
}
