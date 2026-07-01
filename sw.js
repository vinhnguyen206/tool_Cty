// Service worker cho tool báo giá Trung Kiên
// Chiến lược: stale-while-revalidate — trả cache NGAY (mở tức thì, chạy được offline),
// đồng thời tải bản mới ở nền để lần mở sau là bản mới nhất.
var CACHE = 'baogia-v1';
var CORE = ['./', 'index.html', 'xlsx.bundle.js'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // cache từng file, lỗi 1 file không làm hỏng cả quá trình
      return Promise.all(CORE.map(function (u) {
        return c.add(u).catch(function () { });
      }));
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // chỉ xử lý file cùng nguồn

  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req).then(function (cached) {
        var network = fetch(req).then(function (res) {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        }).catch(function () { return cached; });
        // Có cache -> trả ngay (nhanh + offline); chưa có -> chờ mạng
        return cached || network;
      });
    })
  );
});
