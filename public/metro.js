const report = (message) => parent.postMessage({ type: "atlas:metro", ...message }, location.origin);

const timeout = setTimeout(() => report({ status: "error" }), 12_000);
const failed = () => {
  clearTimeout(timeout);
  report({ status: "error" });
};

window.__shenzhenMetroReady = () => {
  if (typeof window.subway !== "function") {
    failed();
    return;
  }
  try {
    const view = window.subway("subway-map", { adcode: 4403, theme: "colorful", doubleclick: { switch: true } });
    view.event.on("subway.complete", (_event, result) => {
      clearTimeout(timeout);
      report({ status: result?.info === "error" || result?.status === 0 ? "error" : "ready" });
    });
    const stationClick = (_event, station) => {
      const name = station?.name ?? station?.n;
      if (typeof name === "string" && name.length > 0) report({ station: name });
    };
    view.event.on("station.touch", stationClick);
    view.event.on("stationName.touch", stationClick);
  } catch {
    failed();
  }
};

fetch("/atlas-config.json", { cache: "no-store" })
  .then((response) => response.json())
  .then(({ amapKey }) => {
    if (!amapKey) throw new Error("Missing web key");
    const script = document.createElement("script");
    script.src = "https://webapi.amap.com/subway?" + new URLSearchParams({
      v: "1.0", key: amapKey, callback: "__shenzhenMetroReady",
    });
    script.onerror = failed;
    document.head.appendChild(script);
  })
  .catch(failed);
