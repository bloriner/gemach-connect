const CACHE = "gemach-v1";

self.addEventListener("install", (e) => {
  (e as any).waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(["/", "/login", "/register", "/dashboard"])
    )
  );
});

self.addEventListener("fetch", (e: any) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
