const CACHE = "rakexura-shell-v1";
const SHELL = ["/", "/games", "/offline"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached || caches.match("/offline"))));
});

// Background native push listener
self.addEventListener("push", (event) => {
  let data = { title: "Rakexura Store", body: "New updates are here!" };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Rakexura Store", body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/Assets/RakeLogo.png",
    badge: data.badge || "/Assets/RakeBadge.png",
    image: data.image || undefined,
    vibrate: data.vibrate || [200, 100, 200],
    silent: false,
    tag: data.tag || "rakexura-alert",
    renotify: true,
    data: {
      url: data.url || "/"
    },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle clicking on notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.action || event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.endsWith(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
