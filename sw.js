/* 探究振り返りカードゲーム — オフライン対応 Service Worker
 *
 * キャッシュファースト戦略：初回アクセスでキャッシュに保存し、
 * 以降はネットワークが不安定・オフラインでもリロード・動作できる。
 *
 * ★ デプロイ時の更新手順：
 *   アプリ（index.html）を更新したら、下の CACHE_VERSION を上げること。
 *   新しいSWがactivateされた時点で旧キャッシュは削除され、
 *   次回ロードから新しいファイルが配信される。
 */
const CACHE_VERSION = "v2";
const CACHE_NAME = "tankyu-card-game-" + CACHE_VERSION;
const ASSETS = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith("tankyu-card-game-") && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        // 正常な同一オリジンのレスポンスだけキャッシュに追加
        if (res.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return res;
      });
    })
  );
});
