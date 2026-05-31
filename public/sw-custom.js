// Custom Service Worker additions — merged by next-pwa at build time
// Handles background sync for quiz results uploaded while offline

const SYNC_TAG = 'sync-results';
const RESULTS_QUEUE_KEY = 'offline-results-queue';

// ── Background Sync ──────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncQueuedResults());
  }
});

async function syncQueuedResults() {
  try {
    const cache = await caches.open('offline-results-v1');
    const queued = await cache.match(RESULTS_QUEUE_KEY);
    if (!queued) return;

    const results = await queued.json();
    if (!results || results.length === 0) return;

    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results }),
    });

    if (response.ok) {
      // Clear queue after successful sync
      await cache.delete(RESULTS_QUEUE_KEY);
      // Notify all clients that sync succeeded
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) =>
        client.postMessage({ type: 'SYNC_SUCCESS', count: results.length })
      );
    }
  } catch (err) {
    console.warn('[SW] Background sync failed, will retry:', err);
    // Re-throw so the browser schedules a retry
    throw err;
  }
}

// ── Skip Waiting (immediate activation on update) ───────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Periodic cache cleanup ───────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Remove old cache versions (anything not in our known set)
      const known = [
        'api-cache',
        'image-cache',
        'google-fonts-stylesheets',
        'google-fonts-webfonts',
        'static-resources',
        'pages-cache',
        'offline-results-v1',
      ];
      return Promise.all(
        cacheNames
          .filter((name) => !known.includes(name) && !name.startsWith('workbox-'))
          .map((name) => caches.delete(name))
      );
    })
  );
});
