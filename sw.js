const C='taller-v55',F=['./','index.html','cliente.html','css/styles.css','css/cliente.css','js/app.js','js/api.js','js/canvas-sign.js','js/cliente.js','js/data.js','js/print.js','manifest.json','icon.svg','img/moto.png','apple-touch-icon.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=='taller-fotos').map(x=>caches.delete(x))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
