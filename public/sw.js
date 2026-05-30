const CACHE = 'sb-v2'
const OFFLINE_PAGE = '/offline'
const STATIC = [
  '/',
  '/overview',
  '/dashboard',
  '/reports',
  '/deadlines',
  '/chat',
  '/clients',
  '/documents',
  '/calculator',
  '/pricing',
  '/profile',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Skip non-GET and API/auth routes — always network
  if (e.request.method !== 'GET') return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return

  // Cache-first for static assets (_next/static, images, fonts)
  if (e.request.destination === 'image' || url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit ?? fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      }).catch(() => new Response('', { status: 408 })))
    )
    return
  }

  // Stale-while-revalidate for navigation
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const networkFetch = fetch(e.request).then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
          return res
        }).catch(() => cached ?? caches.match(OFFLINE_PAGE) ?? Response.error())
        return cached ?? networkFetch
      })
    )
    return
  }

  // Network with cache fallback for everything else
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request) ?? Response.error())
  )
})

self.addEventListener('push', (e) => {
  if (!e.data) return
  const { title, body, url } = e.data.json()
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url },
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url ?? '/'
  e.waitUntil(clients.openWindow(url))
})

// Background sync for offline mutations
self.addEventListener('sync', (e) => {
  if (e.tag === 'sb-sync') {
    e.waitUntil(self.clients.matchAll().then((cs) => {
      cs.forEach((c) => c.postMessage({ type: 'SYNC_NOW' }))
    }))
  }
})
