const CACHE = 'sb-v1'
const STATIC = [
  '/',
  '/overview',
  '/manifest.json',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
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
  // Network-first for API and auth routes
  if (url.pathname.startsWith('/api/')) return

  // Cache-first for static assets
  if (e.request.destination === 'image' || url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit ?? fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      }))
    )
    return
  }

  // Network-first with offline fallback for navigation
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/') ?? Response.error())
    )
  }
})

self.addEventListener('push', (e) => {
  if (!e.data) return
  const { title, body } = e.data.json()
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  )
})
