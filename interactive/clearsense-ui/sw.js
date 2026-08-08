const CACHE='clearsense-v4';
const ASSETS=['./','./index.html','./styles.css?v=20260807-2','./app.js?v=20260807-2','./app-icon.svg','./assets/device-front.png','./assets/product-combo.png','./assets/docking.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  const networkFirst=request.mode==='navigate'||url.pathname.endsWith('.css')||url.pathname.endsWith('.js');
  if(networkFirst){
    event.respondWith(fetch(request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(request,copy));
      return response;
    }).catch(()=>caches.match(request)));
    return;
  }
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));
});
