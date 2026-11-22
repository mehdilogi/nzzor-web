// =============================================================================
// Nzzor Admin — service worker (scope /admin)
// Shows the booking notifications sent by the API (pushService) and opens the
// right booking when one is tapped. It caches nothing: the admin always loads
// live data.
// =============================================================================

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let msg = {};
  try {
    msg = event.data ? event.data.json() : {};
  } catch (e) {
    msg = { title: "Nzzor", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(msg.title || "Nzzor", {
      body: msg.body || "",
      tag: msg.tag || undefined,
      renotify: !!msg.tag,
      icon: "/admin-icon-192.png",
      badge: "/admin-icon-192.png",
      data: { url: msg.url || "/admin" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/admin", self.location.origin).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const open = all.find((c) => new URL(c.url).pathname.startsWith("/admin"));
    if (open) {
      try {
        await open.focus();
        if ("navigate" in open) return open.navigate(url);
        return;
      } catch (e) { /* fall through to a new window */ }
    }
    return self.clients.openWindow(url);
  })());
});
