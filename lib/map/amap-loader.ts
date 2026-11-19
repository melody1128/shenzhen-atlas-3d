interface AtlasRuntimeConfig {
  amapKey: string;
  serviceHost: string;
}

let loaderPromise: Promise<typeof AMap> | null = null;

async function fetchRuntimeConfig(): Promise<AtlasRuntimeConfig> {
  const response = await fetch("/atlas-config.json", { cache: "no-store" });
  if (!response.ok) throw new Error("地图配置文件缺失，请先执行 npm run build");
  const config = (await response.json()) as AtlasRuntimeConfig;
  if (!config.amapKey) throw new Error("MISSING_AMAP_KEY");
  return config;
}

export function loadAMap(): Promise<typeof AMap> {
  if (typeof window === "undefined") return Promise.reject(new Error("地图只能在浏览器中初始化"));
  if (window.AMap) return Promise.resolve(window.AMap);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      loaderPromise = null;
      reject(new Error("高德地图加载超时，请检查网络或稍后重试"));
    }, 20_000);

    fetchRuntimeConfig().then((config) => {
      window._AMapSecurityConfig = {
        serviceHost: config.serviceHost || new URL("/_AMapService", window.location.origin).href,
      };

      window.__shenzhenAtlasAMapLoaded = () => {
        if (window.AMap) {
          clearTimeout(timer);
          resolve(window.AMap);
        } else {
          reject(new Error("高德脚本已加载，但地图对象不可用"));
        }
      };

      const script = document.createElement("script");
      script.dataset.shenzhenAmap = "true";
      script.async = true;
      script.charset = "utf-8";
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(config.amapKey)}&callback=__shenzhenAtlasAMapLoaded&plugin=AMap.DistrictSearch,AMap.PlaceSearch,AMap.Scale`;
      script.onerror = () => {
        clearTimeout(timer);
        loaderPromise = null;
        reject(new Error("高德地图脚本加载失败，请检查网络、Key 与浏览器拦截设置"));
      };
      document.head.appendChild(script);
    }).catch((error: unknown) => {
      clearTimeout(timer);
      loaderPromise = null;
      reject(error instanceof Error ? error : new Error("地图配置读取失败"));
    });
  });

  return loaderPromise;
}
