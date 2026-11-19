import { proxyAMap } from "../../lib/map/amap-proxy.mjs";

export function onRequest({ request, env }) {
  return proxyAMap(request, {
    key: env.NEXT_PUBLIC_AMAP_KEY,
    securityCode: env.AMAP_SECURITY_CODE,
  });
}
