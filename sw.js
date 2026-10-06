/* Viaje 2027 - Service Worker: funciona sin internet tras la primera visita */
var CACHE = 'viaje2027-v1';
var SHELL = ['./', './index.html'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  var fonts = /(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname);
  if(!sameOrigin && !fonts) return;
  /* Cache primero (rápido y sin conexión); se actualiza en segundo plano cuando hay internet */
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(req, {ignoreSearch:true}).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
        return res;
      }).catch(function(){ return null; });
      if(hit){ e.waitUntil(net); return hit; }
      return net.then(function(res){
        if(res) return res;
        if(req.mode === 'navigate') return c.match('./index.html');
        return Response.error();
      });
    });
  }));
});
