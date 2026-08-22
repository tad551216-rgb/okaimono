/* つくる手帖 ── キャッシュはオリジン単位で共有されます。
   github.io は全リポジトリが同じオリジンなので、
   自分の名前空間（TT_NS）のものだけを消します。 */
/* おかいもの帖 — Service Worker
   つくる手帖 / 放課後デイ応援帖

   版を上げるときは CACHE の番号だけを変えてください。
   古いキャッシュは自動で捨てられます。                       */

const TT_NS = 'tt:okaimono:';
const TT_OLD = 'okaimono-3.7';   /* 旧名。次の更新のときに消して構いません */
const CACHE = TT_NS + '3.8';

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];


/* 入れる */
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* 古い版を捨てる */
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => (k.startsWith(TT_NS) || k === TT_OLD) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 出す — まずキャッシュ、裏で取り直す
   （電波がなくてもすぐ開く。新しい版は次に開いたときに入れ替わる） */
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
