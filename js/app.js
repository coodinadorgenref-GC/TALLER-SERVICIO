const $=s=>document.querySelector(s);
const IC={ok:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',at:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M12 4l9 16H3zM12 10v4M12 17v1"/></svg>',fa:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',cam:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',back:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',clock:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',pr:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/></svg>'};
const CI={nr:'',ok:IC.ok,px:IC.at,ur:IC.fa};
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}};
let S=load('taller_v2',{orders:[],seq:{},dirty:[],inv:[],suc:''});
const migEt=o=>{if(o&&ETMIG[o.etapa])o.etapa=ETMIG[o.etapa];return normChk(o)};S.orders.forEach(migEt);
let sesion=null,tab='recepcion',view='board',D=null,dt='u',q='',ft='',agf={b:'',m:''},sug=[],keepSc=true,lastD=null,syncing=false,dragF=null;
const IDB={db:null,open(){return new Promise(r=>{try{const q=indexedDB.open('taller',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>{IDB.db=q.result;r(true)};q.onerror=()=>r(false)}catch{r(false)}})},
  get(k){return new Promise(r=>{try{const t=IDB.db.transaction('kv').objectStore('kv').get(k);t.onsuccess=()=>r(t.result);t.onerror=()=>r(undefined)}catch{r(undefined)}})},
  set(k,v){return new Promise((ok,no)=>{try{const tx=IDB.db.transaction('kv','readwrite');tx.objectStore('kv').put(v,k);tx.oncomplete=()=>ok(true);tx.onerror=()=>no(tx.error)}catch(e){no(e)}})}};
let svT=0,svErr=false;
const flush=()=>{clearTimeout(svT);if(IDB.db)IDB.set('S',S).then(()=>{svErr=false}).catch(()=>{if(!svErr)toast('No se pudo guardar en este dispositivo: sincroniza y libera espacio');svErr=true})};
const save=()=>{if(IDB.db){clearTimeout(svT);svT=setTimeout(flush,120)}else{try{localStorage.setItem('taller_v2',JSON.stringify(S))}catch{toast('Memoria llena: sincroniza para liberar fotos')}}};
addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Number(n||0).toLocaleString('es-MX',{maximumFractionDigits:2});
const TI={ok:IC.ok,err:IC.at,inf:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 11v6M12 7h.01"/></svg>'};let askRes=null;
const toast=(t,tipo)=>{tipo=tipo||(/no se pudo|error|falta|inv[aá]lid|sin internet|memoria llena|captura|describe/i.test(t)?'err':/sincronizad|agregad|guardad|lista|copiad|enviad/i.test(t)?'ok':'inf');const e=$('#toast');e.innerHTML=`<div class="tt ${tipo}" role="${tipo==='err'?'alert':'status'}"><span class="ti">${TI[tipo]}</span><span class="tm">${esc(t)}</span><button class="tc" data-a="tcerrar" aria-label="Cerrar aviso">✕</button></div>`;e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',tipo==='err'?7000:3800)};
function ask(o){return new Promise(res=>{let d=$('#dlg');if(!d){d=document.createElement('div');d.id='dlg';document.body.appendChild(d)}askRes=res;const tp=o.tipo||'inf';
  d.innerHTML=`<div class="dov2" data-a="dno"><div class="dlg ${tp}" role="alertdialog" aria-modal="true" aria-labelledby="dlgt" data-a="dnop"><div class="dlgh"><span class="ti">${TI[tp]}</span><b id="dlgt">${esc(o.t)}</b></div>${o.m?`<p class="dlgm">${esc(o.m)}</p>`:''}${o.input?`<label class="f">${esc(o.input)}<input id="dlgi" type="${o.type||'text'}" value="${esc(o.def||'')}" autocomplete="off"></label>`:''}<div class="dlgb"><button type="button" class="btn" data-a="dno">${esc(o.no||'Cancelar')}</button><button type="button" class="btn pri" data-a="dsi">${esc(o.ok||'Aceptar')}</button></div></div></div>`;
  setTimeout(()=>($('#dlgi')||$('.dlg .btn.pri')).focus(),30)})}
function cerrarAsk(v){const d=$('#dlg');if(d)d.innerHTML='';const r=askRes;askRes=null;if(r)r(v)}
document.addEventListener('keydown',e=>{if(!$('#dlg .dlg'))return;if(e.key==='Escape')cerrarAsk(null);else if(e.key==='Enter'&&e.target.id==='dlgi'){e.preventDefault();cerrarAsk(e.target.value.trim())}});
const iso=(d=new Date())=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const addD=n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)};
// Fotos de Drive (drive.google.com/uc?id=…): el navegador de PC ya no las muestra directo en <img>. Cadena de respaldo:
// miniatura grande de Drive → lh3.googleusercontent.com → proxy del Apps Script (base64, guardado en memoria y en Cache API).
const FC=new Map(),driveId=u=>{const m=/drive\.google\.com\/(?:uc\?(?:export=\w+&)?id=|file\/d\/|thumbnail\?id=)([\w-]+)/.exec(u||'');return m&&m[1]};
const src=x=>{const u=typeof x==='string'?x:(x&&(x.d||x.u))||'',id=driveId(u);return id?(FC.get(id)||'https://drive.google.com/thumbnail?id='+id+'&sz=w1600'):u};
async function bajaFoto(id){const k='https://fotos.local/'+id;let c=null;
  try{c=await caches.open('taller-fotos');const h=await c.match(k);if(h)return await h.text()}catch{}
  try{const r=await api.taller({action:'foto',id});if(r&&r.success&&r.d){if(c)c.put(k,new Response(r.d)).catch(()=>{});return r.d}}catch{}
  return''}
const FQ=[];let FA=0,avisoF=false;const avisoFoto=()=>{if(avisoF)return;avisoF=true;toast('No se pudo cargar una foto de Drive. Revisa que el Apps Script esté publicado con la versión más reciente (gas/taller_api.gs v5).')};
function fotoProxy(id){if(FC.has(id))return Promise.resolve(FC.get(id));return new Promise(res=>{FQ.push({id,res});bombea()})}
function bombea(){while(FA<3&&FQ.length){const j=FQ.shift();FA++;bajaFoto(j.id).then(d=>{if(d)FC.set(j.id,d);FA--;j.res(d);bombea()})}}
document.addEventListener('error',e=>{const t=e.target;if(!t||t.tagName!=='IMG'||!navigator.onLine)return;
  const m=/(?:drive\.google\.com\/thumbnail\?id=|googleusercontent\.com\/d\/)([\w-]+)/.exec(t.src);if(!m)return;
  if(!t.dataset.alt&&/thumbnail/.test(t.src)){t.dataset.alt='1';t.src='https://lh3.googleusercontent.com/d/'+m[1]+'=w1600';return}
  if(!t.dataset.px){t.dataset.px='1';fotoProxy(m[1]).then(d=>{if(d&&t.isConnected)t.src=d;else if(!d)avisoFoto()})}},true);
const idx=e=>ETAPAS.findIndex(x=>x[0]===e),O=f=>S.orders.find(o=>o.folio===f),mine=()=>S.orders.filter(o=>o.suc===S.suc);
const adminReal=()=>!!(sesion&&sesion.esAdmin&&!sesion.esVendedor&&!sesion.esGerente);
const imp=l=>(Number(l.cant)||0)*(Number(l.precio)||0);
// Mano de obra por tiempo: la tarifa por hora se captura en Reporte (admin y gerente), una por agencia. Las horas se guardan en l.h (y l.min = minutos, como antes).
const tarifa=()=>Number((S.tarifas||{})[S.suc])||0,hrs=l=>l.t==='mo'&&tarifa()>0?imp(l)/tarifa():l.h!=null?(Number(l.h)||0):(Number(l.min)||0)/60,hrsTxt=l=>{const h=hrs(l);return h?String(+h.toFixed(2)):''};
const puedeRep=()=>!!(sesion&&(sesion.esAdmin||sesion.esGerente));
const ms=o=>o.t.acum+(o.t.ini?Date.now()-o.t.ini:0);
const hms=m=>{const s=Math.floor(m/1000);return[s/3600|0,s/60%60|0,s%60].map(x=>String(x).padStart(2,'0')).join(':')};
const touch=o=>{if(!S.dirty.includes(o.folio))S.dirty.push(o.folio);o.upd=Date.now();save();syncSoon(4000)};
const est=o=>Math.round(o.lineas.filter(l=>l.t==='mo'&&l.st!=='rech').reduce((a,l)=>a+hrs(l)*60,0));
const tot=o=>{const t={cot:0,aut:0,gar:0,rech:0,pend:0};o.lineas.forEach(l=>{const v=imp(l);t.cot+=v;t[l.st]+=v});return t};
const desk=()=>matchMedia('(min-width:700px)').matches;
const sig=o=>ETAPAS[idx(o.etapa)+1]?.[0];
const wa=(tel,m)=>{let t=String(tel||'').replace(/\D/g,'');if(!t){toast('Captura el WhatsApp del cliente');return}if(t.length===10)t='52'+t;open('https://wa.me/'+t+'?text='+encodeURIComponent(m),'_blank')};

async function folio(t){try{const r=await api.taller({action:'siguienteFolio',tipo:t});if(r.folio)return r.folio}catch{}
  S.seq[t]=(S.seq[t]||0)+1;return t+'-'+String(S.seq[t]).padStart(4,'0')+'L'}
async function crear(t,x={}){
    const o=Object.assign({folio:await folio(t),tipo:t,etapa:'recepcion',suc:S.suc,lav:false,cliente:'',tel:'',dir:'',fcompra:'',modelo:'',marca:'',anio:'',motor:'',vin:'',placas:'',asesor:sesion?(sesion.nombre||sesion.correo||''):'',asesorRef:'',km:'',comb:'',gar:t==='G',motivo:'',cond:'',mec:'',bahia:'',
   inv:INV32.map(()=>({p:false,c:1})),chk:CATS.map(()=>({e:'nr',n:'',f:null})),fotos:{},firmas:{},recibe:'',diag:'',leg:false,
   lineas:[],
   t:{acum:0,ini:null},cita:null,ref:'',prox:{f:'',km:''},fing:Date.now(),cre:Date.now(),listo:false},x);
  logH(o,'Orden creada · '+TIPOS[t]);S.orders.unshift(o);touch(o);D=o.folio;dt='u';tab='recepcion';view='board';keepSc=false;render();sync()}

function puede(o,dest){normChk(o);const i=idx(o.etapa),j=idx(dest);if(j<=i)return'';
  if(i===0){autoMarca(o);
    const fv=[['marca','Marca / fabricante'],['modelo','Modelo'],['anio','Año'],['vin','Serie / VIN'],['motor','Motor'],['km','Kilometraje'],['comb','Combustible']].filter(([k])=>!String(o[k]||'').trim()).map(x=>x[1]);
    if(!String(o.cliente||'').trim())return'Captura el cliente (Unidad)';
    if(fv.length)return'Faltan datos del vehículo: '+fv.join(', ');
    if(!nRecep(o))return'Faltan las fotos de ingreso: en Daños y detalles marca un punto, elige Recepción y toma las fotos'}
  if(j>=2&&!o.mec)return'Asigna el técnico en Unidad › Asignación en taller';
  if(j>=2&&!bayK(o).length)return'Falta la foto de la bayoneta / drenado de aceite';
  if(j>=2){const f=[];o.chk.forEach((c,k)=>{if(c.e==='nr')f.push(k+1)});o.llantas.forEach(l=>{if(l.e==='nr'||!l.med||!l.des||!l.psi)f.push('llanta '+l.p.toLowerCase())});if(f.length)return'Falta clasificar (azul) o capturar en Inspección: '+f.join(', ')}
  const L=o.lineas;
  if(j>=3){if(!L.length)return'Agrega la cotización';if(L.some(l=>l.st==='pend'))return'Hay conceptos pendientes de autorización'}
  if(j===4){if(!o.lav)return'Marca que la moto fue lavada (Cierre)'}
  return''}
const logH=(o,x)=>{(o.hist=o.hist||[]).push({t:Date.now(),u:(sesion&&(sesion.nombre||sesion.correo))||'',x})};
function mover(o,dest){const e=puede(o,dest);if(e)return toast(e);
  if(idx(o.etapa)===0&&idx(dest)>0&&!o.firmas.entrega)return abrirFirma(u=>{o.firmas.entrega={d:u};touch(o);mover(o,dest)});
  if(dest==='entregado'&&o.t.ini){o.t.acum=ms(o);o.t.ini=null}
  logH(o,'Etapa: '+ETAPAS[idx(dest)][1]);o.etapa=dest;touch(o);tab=dest;render();sync()}

/* ---------- render ---------- */
function render(){
  if(view==='rep'&&!puedeRep())view='board';
  document.querySelectorAll('.vn button').forEach(b=>b.classList.toggle('on',b.dataset.v===view));pintaHd();
  renderMain();renderDrawer()}
function renderMain(){$('#app').innerHTML=view==='ag'?agenda():view==='seg'?seguimientos():view==='rep'&&puedeRep()?reporte():board()}
function renderDrawer(){const el=$('#drawer'),o=D&&O(D),sc=el.querySelector('.dbody')?.scrollTop||0;
  el.innerHTML=o?drawer(o):'';document.body.classList.toggle('lock',!!o);
  if(o){const b=el.querySelector('.dbody');if(b&&keepSc)b.scrollTop=sc;if(lastD!==D)el.querySelector('.drh .ib')?.focus()}
  if(o)el.querySelector('.dtabs .tab.on')?.scrollIntoView({inline:'center',block:'nearest'});
  lastD=D;keepSc=true}
const match=o=>{if(ft&&o.tipo!==ft)return false;if(!q)return true;const s=[o.folio,o.cliente,o.modelo,o.vin,o.placas,o.tel,o.motor].join(' ').toLowerCase();return q.toLowerCase().split(/\s+/).every(w=>s.includes(w))};
function board(){const L=mine().filter(match);
  return`<div class="tabs" role="tablist" aria-label="Etapas">${ETAPAS.map(([k,n])=>`<button class="tab ${k===tab?'on':''}" role="tab" aria-selected="${k===tab}" data-a="tab" data-k="${k}">${n} <span class="cnt">${L.filter(o=>o.etapa===k).length}</span></button>`).join('')}</div>
  ${q?`<p class="mut">${L.length} resultado(s) para «${esc(q)}»</p>`:''}
  <div class="kan">${ETAPAS.map(([k,n,c])=>{const C=L.filter(o=>o.etapa===k);return`<section class="col ${k===tab?'on':''}" data-drop="${k}" style="--c:${c}" aria-label="${n}"><h2 class="ch"><span>${n}</span><span class="cnt">${C.length}</span></h2><div class="cl">${C.map(card).join('')}</div></section>`}).join('')}</div>`}
const ICU='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',ICC='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 4h6v3H9zM6 6h12v15H6zM9 12h6M9 16h6"/></svg>';
const bd=(c,i,t,n)=>`<span class="bd ${c}" title="${t}" role="img" aria-label="${t}">${i}${n?`<b>${n}</b>`:''}</span>`;
function card(o){const n=sig(o),b=n?puede(o,n):'',pend=o.lineas.filter(l=>l.st==='pend').length,ur=o.chk.filter(c=>c.e==='ur').length,np=o.inv.filter(i=>i.p).length,
  gf=nRecep(o)>0;
  return`<article class="card k" data-a="abrir" data-f="${o.folio}" tabindex="0" ${desk()?'draggable="true"':''} aria-label="Orden ${o.folio}">
  <div class="row sp wrap"><span class="fol">${esc(o.folio)}</span><span class="chip">${TIPOS[o.tipo]}</span></div>
  <div class="ki">${bd(o.cliente?'ok':'',ICU,o.cliente?'Cliente capturado':'Falta el cliente')}${bd(gf?'ok':'',IC.cam,gf?'Fotos de ingreso tomadas':'Faltan fotos de ingreso')}${bd(np===32?'ok':'',ICC,'Inventario '+np+'/32')}${ur?bd('al',IC.fa,ur+' urgente'+(ur>1?'s':''),ur):''}${pend?bd('wa',IC.at,pend+' por autorizar',pend):''}${o.auth?bd('ok',IC.ok,'El cliente autorizó desde el enlace'):''}${o.espRef?bd('wa',IC.at,'Esperando refacciones'):''}${o.ret?bd('al',IC.fa,'Orden retrasada'):''}</div>
  <div class="kn">${esc(o.cliente||'Sin cliente')}</div><div class="kv">${esc([o.marca,o.modelo].filter(Boolean).join(' ')||'Sin modelo')}${o.anio?' '+esc(o.anio):''}</div>${o.placas?`<div class="kv pl">${esc(o.placas)}</div>`:''}<div class="kv">${esc(o.mec||'Sin técnico')}${o.bahia?' · Bahía '+o.bahia:''}</div>
  ${b?`<span class="chip w">${IC.at} ${b}</span>`:''}
  <div class="pg5" aria-hidden="true">${ETAPAS.map((e,i)=>`<i class="${i<=idx(o.etapa)?'d':''}"></i>`).join('')}</div>
  <div class="row"><button class="btn sm" style="flex:1" data-a="mv" data-f="${o.folio}">Mover a…</button>${n?`<button class="btn sm pri" style="flex:1" data-a="sig" data-f="${o.folio}">Siguiente: ${ETAPAS[idx(n)][1]}</button>`:`<button class="btn sm" style="flex:1" data-a="clon" data-f="${o.folio}">Clonar por garantía</button>`}</div></article>`}

const inp=(l,p,v,x='')=>`<label class="f">${l}<input data-p="${p}" value="${esc(v)}" ${x}></label>`;
const heroH=o=>{const f=heroSrc(o);
  return(f?`<div class="hero"><img alt="Foto de ingreso" src="${f}" data-a="zoom"></div>`:'')+`<div class="itbl"><div><span>Cliente</span><b>${esc(o.cliente||'—')}</b></div><div><span>Unidad</span><b>${esc(o.modelo||'—')}${o.vin?' · '+esc(o.vin):''}${o.placas?' · '+esc(o.placas):''}</b></div><div><span>Técnico</span><b>${esc(o.mec||'—')}${o.bahia?' · Bahía '+o.bahia:''}</b></div></div>`};
const sm=(c,n,t)=>n?`<span class="sm ${c}" title="${t}">${n}</span>`:'';
function drawer(o){const e=ETAPAS[idx(o.etapa)],cn=x=>o.chk.filter(c=>c.e===x).length,ln=x=>(o.llantas||[]).filter(l=>l.e===x).length,
  nd=(o.danos||[]).filter(d=>d.t!==REC).length,pa=o.lineas.filter(l=>l.st==='pend').length,au=o.lineas.filter(l=>l.st==='aut'||l.st==='gar').length;
  const T=[['u','Cliente y unidad',''],['i','Inspección',sm('r',cn('ur'),'Urgentes')+sm('a',cn('px'),'Próximos')],['l','Llantas',sm('r',ln('ur'),'Urgentes')+sm('a',ln('px'),'Próximas')],['r','Carrocería',sm('n',nd,'Daños marcados')],['c','Cotización',sm('g',au,'Autorizados')+sm('a',pa,'Por autorizar')],['z','Cierre',''],['h','Historial','']];
  return`<div class="dov" data-a="cerrard"></div><aside class="dr" role="dialog" aria-modal="true" aria-label="Orden ${esc(o.folio)}">
  <header class="drh"><button class="btn sm" data-a="cerrard" aria-label="Volver al panel general">${IC.back}<span> Panel</span></button><span class="fol" style="font-size:18px">${esc(o.folio)}</span><span class="chip">${TIPOS[o.tipo]}</span><span class="chip" style="background:${e[2]};color:#fff">${e[1]}</span><span style="flex:1"></span>${adminReal()?`<button class="btn sm red" data-a="elim">Eliminar</button>`:''}<button class="btn sm" data-a="print" aria-label="Imprimir">${IC.pr}<span class="bt"> Imprimir</span></button><button class="btn sm" data-a="mv" data-f="${o.folio}">Mover a…</button></header>
  ${dhead(o)}
  <nav class="dtabs" role="tablist">${T.map(([k,n,c])=>`<button class="tab ${k===dt?'on':''}" role="tab" aria-selected="${k===dt}" data-a="dtab" data-k="${k}">${n} ${c}</button>`).join('')}</nav>
  <div class="dbody">${dt==='u'?'':heroH(o)}${{u:tU,i:tI,l:tL,r:tR,c:tC,z:tZ,h:tH}[dt](o)}</div><footer class="dft">${foot(o)}</footer></aside>`}
// Encabezado compacto de la orden (solo computadora): cliente y unidad a la izquierda, datos de la orden al centro, equipo a la derecha.
const fld=(n,l,p,v,x='')=>`<label class="f s${n}">${l}<input data-p="${p}" value="${esc(v)}" ${x}></label>`;
function dhead(o){autoMarca(o);const rec=o.etapa==='recepcion',ro=(n,l,v)=>`<div class="f s${n}"><span>${l}</span><div class="ro">${v}</div></div>`;
  return`<section class="dhead" aria-label="Datos de la orden">
  <div class="dz za">${fld(2,'Cliente (propietario)','cliente',o.cliente)}${fld(2,'Teléfono (WhatsApp)','tel',o.tel,'type="tel" inputmode="tel"')}${fld(2,'Correo electrónico','email',o.email,'type="email" inputmode="email" autocomplete="off" autocapitalize="off"')}
   ${fld(2,'Marca','marca',o.marca,'list="marcas" autocomplete="off"')}${fld(2,'Modelo','modelo',o.modelo)}${fld(1,'Año','anio',o.anio,'inputmode="numeric"')}${fld(1,'Km','km',o.km,'inputmode="numeric"')}
   ${fld(2,'Serie / VIN','vin',o.vin,'autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="17" style="text-transform:uppercase"')}${fld(2,'Placas','placas',o.placas,'autocapitalize="characters" autocomplete="off" spellcheck="false" style="text-transform:uppercase"')}${fld(2,'Quién trae la moto','trae',o.trae,'placeholder="Vacío = el propietario"')}
   <div class="mut s6 vinh">${vinH(o)}</div><div class="mut s6 vinb">${vinB(o)}</div><div class="s6 motoSug">${sugH(o)}</div></div>
  <div class="dz zb">${ro(2,'Tipo de servicio',esc(TIPOS[o.tipo]))}${ro(1,'Ingreso',esc(new Date(o.fing).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})))}
   <label class="f s1">Promesa de entrega<input type="datetime-local" data-p="prom" value="${esc(o.prom||'')}"></label>
   <label class="f s1">Combustible<select data-p="comb">${['','Reserva','1/4','1/2','3/4','Lleno'].map(x=>`<option ${o.comb===x?'selected':''}>${x}</option>`).join('')}</select></label>
   <div class="f s1"><span>¿Es garantía?</span><div class="seg"><button class="${o.gar?'s-ok':''}" data-a="gar" data-k="1" aria-pressed="${!!o.gar}">Sí</button><button class="${!o.gar?'s-nr':''}" data-a="gar" data-k="0" aria-pressed="${!o.gar}">No</button></div></div></div>
  <div class="dz zc">${fld(1,'Asesor de servicio','asesor',o.asesor)}${rec?ro(1,'Técnico principal','<span class="sa">Sin asignar</span> <small>(lo asigna el jefe de taller)</small>'):fld(1,'Técnico principal','mec',o.mec,'list="mecs"')}
   ${fld(1,'Asesor de refacciones','asesorRef',o.asesorRef,'list="asr"')}${fld(1,'Recibe la unidad','recibe',o.recibe,'placeholder="Quién la recibe"')}
   <div class="tgs s2"><button class="tgl ${o.espRef?'on':''}" role="switch" aria-checked="${!!o.espRef}" data-a="tgl" data-k="espRef"><i></i>Esperando refacciones</button><button class="tgl ${o.ret?'on':''}" role="switch" aria-checked="${!!o.ret}" data-a="tgl" data-k="ret"><i></i>Orden retrasada</button></div></div>
  <datalist id="marcas">${MARCAS.map(m=>`<option value="${m}">`).join('')}</datalist><datalist id="asr">${[...new Set(S.orders.map(x=>x.asesorRef).filter(Boolean))].map(m=>`<option value="${esc(m)}">`).join('')}</datalist><datalist id="mecs">${[...new Set(S.orders.map(x=>x.mec).filter(Boolean))].map(m=>`<option value="${esc(m)}">`).join('')}</datalist></section>`}
function foot(o){const n=sig(o),b=n?puede(o,n):'';
  return`${b?`<div class="chip w" style="align-self:flex-start">${IC.at} ${b}</div>`:''}
  <div class="row">${n?`<button class="btn pri" data-a="sig" data-f="${o.folio}" ${b?'disabled':''}>Siguiente etapa: ${ETAPAS[idx(n)][1]}</button>`:`<button class="btn" data-a="clon" data-f="${o.folio}">Clonar por garantía</button>`}</div>`}

const gfotos=o=>{const n=nRecep(o);return`<div class="card"><div class="row sp"><div class="h">Carrocería</div><span class="chip ${n?'g':'w'}">${n?n+(n>1?' fotos':' foto')+' de ingreso':'Faltan fotos de ingreso'}</span></div>${danosH(o)}</div>`};
function tU(o){autoMarca(o);return`<div class="u-dup"><div class="card"><div class="h">Cliente</div><div class="g2">${inp('Cliente (propietario)','cliente',o.cliente)}${inp('Teléfono (WhatsApp)','tel',o.tel,'type="tel" inputmode="tel"')}</div>${inp('Dirección','dir',o.dir)}<div class="g2">${inp('Correo electrónico','email',o.email,'type="email" inputmode="email" autocomplete="off" autocapitalize="off"')}${inp('Quién trae la moto (si no es el propietario)','trae',o.trae,'placeholder="Vacío = la trae el propietario"')}</div><div id="motoSug">${sugH(o)}</div></div>
  <div class="card"><div class="h">Datos del vehículo</div><div class="g2">${inp('Marca / fabricante','marca',o.marca,'list="marcas" autocomplete="off"')}<datalist id="marcas">${MARCAS.map(m=>`<option value="${m}">`).join('')}</datalist>${inp('Modelo','modelo',o.modelo)}${inp('Año','anio',o.anio,'inputmode="numeric"')}${inp('Serie / VIN','vin',o.vin,'autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="17" style="text-transform:uppercase"')}${inp('Placas','placas',o.placas,'autocapitalize="characters" autocomplete="off" spellcheck="false" style="text-transform:uppercase"')}${inp('Motor','motor',o.motor)}${inp('Kilometraje','km',o.km,'inputmode="numeric"')}<label class="f">Combustible<select data-p="comb">${['','Reserva','1/4','1/2','3/4','Lleno'].map(x=>`<option ${o.comb===x?'selected':''}>${x}</option>`).join('')}</select></label></div>
  <div class="mut" id="vinh">${vinH(o)}</div><div class="mut" id="vinb">${vinB(o)}</div>
  <div class="mut">¿Es garantía?</div><div class="seg" style="max-width:240px"><button class="${o.gar?'s-ok':''}" data-a="gar" data-k="1" aria-pressed="${!!o.gar}">Sí</button><button class="${!o.gar?'s-nr':''}" data-a="gar" data-k="0" aria-pressed="${!o.gar}">No</button></div>
  <label class="f">Motivo de ingreso<textarea data-p="motivo">${esc(o.motivo)}</textarea></label><label class="f">Condiciones en las que se recibe la unidad<textarea data-p="cond">${esc(o.cond)}</textarea></label>
  <div class="mut">Ingreso: ${new Date(o.fing).toLocaleString('es-MX')}${o.ref?' · Orden original: '+esc(o.ref):''}</div></div>
  ${asesH(o)}${asigH(o)}</div>
  <div class="u-dk"><div class="card"><div class="h">Más datos de la orden</div><div class="dkg">${inp('Dirección','dir',o.dir)}${inp('Motor','motor',o.motor)}${inp('Fecha de compra','fcompra',o.fcompra,'type="date"')}</div><div class="dkg d2"><label class="f">Motivo de ingreso<textarea data-p="motivo">${esc(o.motivo)}</textarea></label><label class="f">Condiciones en las que se recibe la unidad<textarea data-p="cond">${esc(o.cond)}</textarea></label></div>${o.ref?`<div class="mut">Orden original: ${esc(o.ref)}</div>`:''}</div>${accH(o)}</div>`}
const tL=o=>{normChk(o);return llH(o)};
const tR=o=>gfotos(o);
// Historial: lo que registra la app (creación y cambios de etapa) más el visto bueno y la autorización del cliente
function tH(o){const ev=[...(o.hist||[]).map(h=>({t:h.t,u:h.u,x:h.x}))];
  if(!ev.some(h=>/creada/i.test(h.x)))ev.push({t:o.fing,u:'',x:'Orden creada · '+TIPOS[o.tipo]});
  if(o.vb)ev.push({t:o.vb,u:'',x:'Visto bueno enviado por WhatsApp'});
  if(o.auth)ev.push({t:o.auth.t,u:o.auth.n,x:'El cliente autorizó desde el enlace ('+((o.auth.d||[]).filter(d=>d.st==='aut').length)+' autorizados, '+((o.auth.d||[]).filter(d=>d.st==='rech').length)+' para después)'});
  ev.sort((a,b)=>b.t-a.t);
  return`<div class="card"><div class="h">Historial de la orden</div><ol class="hist">${ev.map(h=>`<li><time>${esc(new Date(h.t).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'}))}</time><span>${esc(h.x)}</span>${h.u?`<small>${esc(h.u)}</small>`:''}</li>`).join('')}</ol></div>`}
function firmaCard(o,k,t){const f=o.firmas[k],s=f&&src(f);
  return`<div class="card"><div class="row sp"><div class="h">${t}</div><span class="chip ${s?'g':'w'}">${s?IC.ok+' Firmada':'Pendiente'}</span></div>${k!=='entrega'?`<label class="f">Nombre<input data-p="firmas.${k}.n" value="${esc(f?.n||'')}"></label>`:''}${s?`<img class="pic" data-a="zoom" alt="Firma ${t}" src="${s}">`:''}<button class="btn" data-a="firma" data-k="${k}">${s?'Firmar de nuevo':'Capturar firma'}</button></div>`}
const fechaMx=f=>/^\d{4}-\d{2}-\d{2}$/.test(f||'')?f.split('-').reverse().join('/'):'—';
// Foto de bayoneta / drenado de aceite: varias fotos. Se guardan en o.fotos como bayoneta, bayoneta_2, bayoneta_3… (así el Apps Script las sube igual que las demás).
const bayK=o=>Object.keys(o.fotos||{}).filter(k=>(k==='bayoneta'||/^bayoneta_\d+$/.test(k))&&o.fotos[k]&&src(o.fotos[k])).sort((a,b)=>(+a.slice(9)||1)-(+b.slice(9)||1));
const bayNext=o=>{let n=1;Object.keys(o.fotos||{}).forEach(k=>{const m=/^bayoneta(?:_(\d+))?$/.exec(k);if(m)n=Math.max(n,+(m[1]||1))});return n===1&&!(o.fotos&&o.fotos.bayoneta)?'bayoneta':'bayoneta_'+(n+1)};
const bayH=o=>{const L=bayK(o);return`<div class="card"><div class="row sp"><div class="h">Foto bayoneta / drenado de aceite</div><span class="chip ${L.length?'g':'w'}">${L.length?IC.ok+' '+L.length+(L.length>1?' fotos':' foto'):'Obligatoria'}</span></div>${L.length?`<div class="ckx fgal">${L.map((k,j)=>`<span class="fgi"><img alt="Foto ${j+1} de la bayoneta" src="${src(o.fotos[k])}" data-a="zoom"><button class="fgx" data-a="bdel" data-foto="${k}" aria-label="Quitar foto ${j+1}">✕</button></span>`).join('')}</div>`:''}<button type="button" class="btn" data-a="fpick" data-bay="1">${IC.cam} ${L.length?'Agregar otra foto':'Tomar o elegir foto'}</button></div>`};
// Reporte (admin y gerente): tarifa de mano de obra por hora, una por agencia
function repMo(){const t=tarifa(),L=mine();let n=0,hc=0,mc=0,ha=0,ma=0;
  L.forEach(o=>{const m=o.lineas.filter(l=>l.t==='mo'&&l.st!=='rech');if(m.length)n++;m.forEach(l=>{hc+=hrs(l);mc+=imp(l);if(l.st==='aut'){ha+=hrs(l);ma+=imp(l)}})});
  const f=h=>String(+h.toFixed(2));
  return`${S.suc?`<div class="card"><div class="h">Mano de obra</div><div class="mut">Captura cuánto se cobra por hora de trabajo (por ejemplo $780). En la cotización, la mano de obra solo lleva el tiempo (.5, 1, 1.25…) y el monto se calcula; también puedes poner el monto y el tiempo se calcula.</div>
  <div class="g2"><label class="f">Tarifa por hora ($)<input id="tar" inputmode="decimal" value="${t||''}" placeholder="780"></label></div>
  ${t?`<div class="mut">Con ${money(t)} por hora: ½ h = ${money(t/2)} · 1 h = ${money(t)} · 1.25 h = ${money(t*1.25)}</div>`:'<div class="mut">Aún no hay tarifa en esta agencia.</div>'}
  <div class="row"><button class="btn pri" data-a="tarsave">Guardar tarifa</button></div></div>
  <div class="card"><div class="h">Mano de obra cotizada</div><div class="mut">${n} orden(es) con mano de obra en ${esc(S.suc)} (sin contar lo rechazado).</div>
  <div class="row sp"><span>Cotizada</span><span class="fol">${f(hc)} h · ${money(mc)}</span></div><div class="row sp h"><span>Autorizada (a cobrar)</span><span class="fol">${f(ha)} h · ${money(ma)}</span></div></div>`:'<p class="mut">Elige la agencia (botón junto al engranaje) para definir su tarifa de mano de obra.</p>'}`}
/* ---------- Reporte (solo administrador y gerente): tablero estilo Triage ---------- */
const rp={p:'mes',ag:'',sec:'res'},PER=[['hoy','Hoy'],['7','Últimos 7 días'],['30','Últimos 30 días'],['mes','Este mes'],['todo','Todo']],
  RSEC=[['res','Resumen'],['tec','Técnicos'],['ase','Asesores de servicio'],['seg','Seguimientos'],['top','Top 10 operaciones'],['aut','Autorización del cliente'],['mo','Mano de obra y tarifa']],
  RCOL=[['ur','Rojo','#DC2626'],['px','Ámbar','#EAB308'],['ok','Verde','#16A34A'],['nr','Azul','#2563EB']];
function repOrdenes(){const A=sesion?permitidas(sesion.agencia):[],h=new Date();h.setHours(0,0,0,0);
  const d0=rp.p==='hoy'?+h:rp.p==='7'?h-6*864e5:rp.p==='30'?h-29*864e5:rp.p==='mes'?+new Date(h.getFullYear(),h.getMonth(),1):0;
  return S.orders.filter(o=>A.includes(o.suc)&&(!rp.ag||o.suc===rp.ag)&&(o.fing||o.cre||0)>=d0)}
const pcn=(n,d)=>d?Math.round(n/d*100):0,zFoto=c=>!!(c.f||(c.fx&&c.fx.length));
const repTbl=(tit,cols,rows)=>rows.length?`<div class="card"><div class="h">${tit}</div><div class="rtw"><table class="rt"><thead><tr>${cols.map((c,i)=>`<th scope="col" ${i?'class="num"':''}>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>i?`<td class="num">${c}</td>`:`<th scope="row">${esc(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div></div>`:'';
const repKp=(t,v,n)=>`<div class="kp"><span>${t}</span><b>${v}</b>${n?`<small>${n}</small>`:''}</div>`;
const repBars=(tit,vals,cap)=>`<div class="card bch"><div class="h">${tit}</div><div class="bars" role="img" aria-label="${esc(tit)}: ${vals.map(v=>v.l+' '+(v.v==null?'sin datos':v.v+'%')).join(', ')}"><div class="bax" aria-hidden="true"><i>100%</i><i>50%</i><i>0%</i></div>${vals.map(v=>`<div class="bc"><div class="bv" style="height:${v.v||0}%;background:${v.c}"></div><b>${v.v==null?'—':v.v+'%'}</b><span>${v.l}</span></div>`).join('')}</div><div class="mut">${cap}</div></div>`;
const repDon=(tit,p,sub)=>{const C=2*Math.PI*54;return`<div class="don" role="img" aria-label="${esc(tit)}: ${p}%"><svg viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r="54" fill="none" stroke="#E2E8F0" stroke-width="16"/><circle cx="70" cy="70" r="54" fill="none" stroke="#1E56A8" stroke-width="16" stroke-dasharray="${(C*p/100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 70 70)"/><text x="70" y="76" text-anchor="middle" font-size="26" font-weight="800" fill="#0F172A">${p}%</text></svg><b>${tit}</b><small>${sub}</small></div>`};
function repSeg(L){let disp=0,cer=0,ven=0;L.forEach(o=>{o.lineas.forEach(l=>{if(l.st==='rech'||l.cerr){disp++;if(l.cerr){cer++;if(S.orders.some(x=>x.ref===o.folio&&x.tipo==='SR'))ven++}}});if(o.prox&&o.prox.f){disp++;if(o.prox.cerr){cer++;if(S.orders.some(x=>x.ref===o.folio&&x.tipo==='SP'))ven++}}});return{disp,cer,ven,pen:disp-cer}}
function repSec(L,A){const grp=(f)=>{const m={};L.forEach(o=>{const k=f(o)||'Sin dato',g=m[k]||(m[k]={n:0,aut:0,cot:0,rech:0,ms:0,c:0,ea:0});const t=tot(o);g.n++;g.aut+=t.aut;g.cot+=t.cot;g.rech+=t.rech;if(o.auth)g.ea++;if(o.t&&o.t.acum>0){g.ms+=o.t.acum;g.c++}});return Object.entries(m).sort((a,b)=>b[1].aut-a[1].aut||b[1].n-a[1].n)};
  const T={cot:0,aut:0,gar:0,rech:0,pend:0};L.forEach(o=>{const t=tot(o);for(const k in T)T[k]+=t[k]});
  const dec=T.aut+T.rech,tasa=dec?Math.round(T.aut/dec*100):0,con=L.filter(o=>o.t&&o.t.acum>0),tp=con.length?con.reduce((a,o)=>a+o.t.acum,0)/con.length:0,ent=L.filter(o=>o.etapa==='entregado').length;
  // zonas de la hoja multipuntos: identificación y autorización por color, con y sin foto
  const Z=[];L.forEach(o=>(o.chk||[]).forEach((c,i)=>{const ls=o.lineas.filter(l=>zonaDe(o,l)===i);Z.push({e:c.e,f:zFoto(c),n:ls.length,a:ls.some(l=>l.st==='aut'||l.st==='gar')})}));
  const idv=f=>{const z=Z.filter(x=>x.f===f);return RCOL.map(([k,l,c])=>({l,c,v:z.length?pcn(z.filter(x=>x.e===k).length,z.length):null}))};
  const auv=f=>RCOL.map(([k,l,c])=>{const z=Z.filter(x=>x.e===k&&x.f===f&&x.n>0);return{l,c,v:z.length?pcn(z.filter(x=>x.a).length,z.length):null}});
  const sg=repSeg(L);
  if(rp.sec==='tec')return repTbl('Técnicos',['Técnico','Órdenes','Cotizado','Autorizado','Tiempo real prom.'],grp(o=>o.mec).map(([k,g])=>[k,g.n,money(g.cot),money(g.aut),g.c?hms(g.ms/g.c):'—']));
  if(rp.sec==='ase')return repTbl('Asesores de servicio',['Asesor','Órdenes','Cotizado','Autorizado','Tasa de autorización','Autorizó por enlace'],grp(o=>o.asesor).map(([k,g])=>[k,g.n,money(g.cot),money(g.aut),(g.aut+g.rech?pcn(g.aut,g.aut+g.rech):0)+'%',g.ea]));
  if(rp.sec==='seg')return`<div class="card"><div class="h">Seguimientos</div><div class="dons">${repDon('Tasa de cierre',pcn(sg.cer,sg.disp),sg.cer+' de '+sg.disp+' cerrados')}${repDon('Tasa de éxito',pcn(sg.ven,sg.cer),sg.ven+' de '+sg.cer+' terminaron en orden')}</div><table class="rt"><tbody><tr><th scope="row">Disponibles</th><td class="num">${sg.disp}</td></tr><tr><th scope="row">Cerrados con orden nueva</th><td class="num">${sg.ven}</td></tr><tr><th scope="row">Cerrados sin orden</th><td class="num">${sg.cer-sg.ven}</td></tr><tr><th scope="row">Pendientes</th><td class="num">${sg.pen}</td></tr></tbody></table></div>`;
  if(rp.sec==='top'){const m={};L.forEach(o=>o.lineas.forEach(l=>{const k=String(l.desc||'').toUpperCase(),g=m[k]||(m[k]={id:0,vt:0,rc:0,iq:0,vq:0,rq:0});const q=Number(l.cant)||0,v=imp(l);g.id+=v;g.iq+=q;if(l.st==='aut'||l.st==='gar'){g.vt+=v;g.vq+=q}if(l.st==='rech'){g.rc+=v;g.rq+=q}}));
    const top=(f,q,v)=>Object.entries(m).filter(e=>e[1][f]>0).sort((a,b)=>b[1][f]-a[1][f]).slice(0,10).map(([k,g])=>[k,g[q],money(g[v||f])]);
    return`<div class="rgs">${repTbl('Top 10 identificadas',['Descripción','Cant.','Total'],top('id','iq'))}${repTbl('Top 10 vendidas',['Descripción','Cant.','Total'],top('vt','vq'))}${repTbl('Top 10 rechazadas',['Descripción','Cant.','Total'],top('rc','rq'))}</div>`}
  if(rp.sec==='aut'){const lc=L.reduce((a,o)=>a+(o.auth?1:0),0),lv=L.filter(o=>o.vb).length,mr=[...L.flatMap(o=>o.lineas)].filter(l=>l.st==='aut'),cf=mr.filter(l=>l.f).length;
    return`<div class="kps">${repKp('Enlaces enviados',lv,'visto bueno por WhatsApp')}${repKp('Autorizaron por enlace',lc,pcn(lc,lv)+'% de los enviados')}${repKp('Autorizados con foto',pcn(cf,mr.length)+'%',cf+' de '+mr.length+' conceptos autorizados')}</div>
    <div class="rgs">${repBars('Autorización por color · con foto',auv(true),'Porcentaje de hallazgos de cada color que terminaron autorizados.')}${repBars('Autorización por color · sin foto',auv(false),'Compara cuánto se autoriza cuando el hallazgo lleva foto.')}</div>
    ${repTbl('Motivos de rechazo',['Motivo','Conceptos','Importe'],Object.entries(L.flatMap(o=>o.lineas).filter(l=>l.st==='rech').reduce((m,l)=>{const k=l.mot||'Sin motivo',g=m[k]||(m[k]={n:0,v:0});g.n++;g.v+=imp(l);return m},{})).sort((a,b)=>b[1].v-a[1].v).map(([k,g])=>[k,g.n,money(g.v)]))}`}
  if(rp.sec==='mo')return repMo();
  return`<div class="kps">${repKp('Órdenes',L.length,ent+' entregadas')}${repKp('Cotizado',money(T.cot),'Garantías aparte: '+money(T.gar))}${repKp('Autorizado',money(T.aut),'Tasa de autorización: '+tasa+'%')}${repKp('Rechazado / diferido',money(T.rech),'')}${repKp('Pendiente de autorizar',money(T.pend),'')}${repKp('Tiempo real promedio',con.length?hms(tp):'—',con.length+' orden(es) con cronómetro')}</div>
  <div class="rgs"><div class="card"><div class="h">Seguimientos</div><div class="dons">${repDon('Tasa de cierre',pcn(sg.cer,sg.disp),sg.cer+' de '+sg.disp)}${repDon('Tasa de éxito',pcn(sg.ven,sg.cer),sg.ven+' de '+sg.cer)}</div></div>
  ${repBars('Identificación por color · con foto',idv(true),'Reparto de los puntos de la hoja multipuntos que llevan foto.')}${repBars('Identificación por color · sin foto',idv(false),'Reparto de los puntos que no llevan foto.')}
  ${repTbl('Por etapa',['Etapa','Órdenes'],ETAPAS.map(e=>[e[1],L.filter(o=>o.etapa===e[0]).length]))}</div>`}
function reporte(){if(!puedeRep())return'';const L=repOrdenes(),A=sesion?permitidas(sesion.agencia):[];
  return`<div class="ph"><h2>Reporte</h2><label class="f">Periodo<select data-rp="p">${PER.map(([k,n])=>`<option value="${k}" ${rp.p===k?'selected':''}>${n}</option>`).join('')}</select></label>${A.length>1?`<label class="f">Agencia<select data-rp="ag"><option value="">Todas mis agencias</option>${A.map(a=>`<option ${rp.ag===a?'selected':''}>${esc(a)}</option>`).join('')}</select></label>`:''}<button class="btn" data-a="repcsv">Descargar CSV</button></div>
  <div class="rd"><nav class="rsb" aria-label="Secciones del reporte">${RSEC.map(([k,n])=>`<button class="${k===rp.sec?'on':''}" data-a="rsec" data-k="${k}" aria-current="${k===rp.sec}">${n}</button>`).join('')}</nav><div class="rmain">${rp.sec==='mo'?'':`<p class="mut">${L.length} orden(es) · ${esc(PER.find(x=>x[0]===rp.p)[1])}${rp.ag?' · '+esc(rp.ag):''}</p>`}${repSec(L,A)}</div></div>`}
async function subeTarifas(){let r='ok';for(const ag of Object.keys(S.tarPend||{})){
  try{const x=await api.taller({action:'guardarConfig',cfgK:'tarifa_mo|'+ag,cfgV:(S.tarifas||{})[ag]||0});if(x&&x.success)delete S.tarPend[ag];else r=/desconocida/i.test((x&&x.message)||'')?'viejo':'error'}catch{r='error'}}
  save();return r}
// VIN de 17 caracteres: la posición 10 es el año modelo (A=2010 … Y=2030; 1-9 = 2001-2009). La marca sale de los primeros caracteres (WMI + descriptor), buscando de lo más específico a lo más general (8, 6, 3).
// Tabla armada con el reporte de ventas GCVEN02 2023-2026 (~10,300 motos con serie, columna MARCA). Hay fábricas que arman la misma moto para varias marcas (3EE, LFF, LHJ, LNG, LC6): ahí la serie no decide y VINA da las marcas posibles para que el usuario elija con un botón.
const VINY='ABCDEFGHJKLMNPRSTVWXY',
WMI={'3MU':'Vento',MD2:'Bajaj','3EF':'Carabela',LB4:'Carabela',LRY:'Carabela',LX8:'Carabela',L98:'Carabela',LY4:'Carabela',MB8:'Suzuki',MH8:'Suzuki','5SA':'Suzuki',JS1:'Suzuki',RFD:'Suzuki',MLC:'Suzuki','3VM':'Veloci',LD3:'Islo',LZS:'Islo',H93:'Hercules',MCG:'Atul',LBB:'Benelli',ZBN:'Benelli','3K3':'Kurazai',HS7:'E-Bike',HC4:'E-Bike',JH2:'Honda',LAL:'Honda',JYA:'Yamaha',
 LC6PCJ:'Suzuki',LC6PCH:'Suzuki',LC6PCKGM:'Haojue','3EETAKBC':'Islo','3EECAN':'Carabela',LFFW1V:'Carabela',LFFWJT:'Kurazai',LFFWKT41:'Carabela',LFFWKT42:'Islo',LFFWKT43:'Carabela',LHJXJH:'Carabela',LHJYJJ:'Carabela',LHJYJM:'Carabela',LNGPCJ:'Kurazai',LNGPCK13:'Motomel'},
VINA={LC6:['Suzuki','Haojue'],'3EE':['Carabela','Islo'],LFF:['Carabela','Motomel','Islo','Kurazai'],LHJ:['Carabela','Kurazai','Islo'],LNG:['Motomel','Kurazai','Carabela']};
const MARCAS=['Bajaj','Vento','Carabela','Suzuki','Veloci','Islo','Haojue','Hercules','Motomel','Kurazai','Atul','Benelli','Honda','Yamaha','E-Bike'];
// E-bikes: serie con guiones tipo BIC-A04NA-7220 / TRI-P05NA-7220 (BIC = bicicleta, TRI = triciclo). No es VIN: no trae año; el bloque final (7220, 4812, 6020) es voltaje+Ah de la batería.
const EBIKE=/^(BIC|TRI)-[A-Z0-9-]+$/;
function vinInfo(v){v=String(v||'').toUpperCase().replace(/\s+/g,'');const r={n:v.length,ok:false,anio:0,fab:'',amb:null,mal:false,ebike:false,tipo:''};
  if(EBIKE.test(v)){r.ebike=true;r.fab='E-Bike';r.tipo=v.startsWith('TRI')?'triciclo':'bicicleta';return r}
  if(v.length!==17)return r;
  if(/[IOQ]/.test(v)||!/^[A-Z0-9]+$/.test(v)){r.mal=true;return r}
  const c=v[9],y=/[1-9]/.test(c)?2000+ +c:VINY.indexOf(c)<0?0:2010+VINY.indexOf(c);r.ok=true;r.anio=y;r.fab=WMI[v.slice(0,8)]||WMI[v.slice(0,6)]||WMI[v.slice(0,3)]||'';if(!r.fab)r.amb=VINA[v.slice(0,3)]||null;
  if(!y||y>new Date().getFullYear()+1)r.anio=0;return r}
function autoMarca(o){if(String(o.marca||'').trim())return;const f=(MOTOS.cache[o.vin]||{}).marca||vinInfo(o.vin).fab;if(f){o.marca=f;o.marcaAuto=true}}
function vinH(o){const r=vinInfo(o.vin);if(!r.n)return'';
  if(r.ebike)return`Serie de e-bike (${r.tipo}): no incluye año · marca <b>E-Bike</b>.`;
  if(r.n<17)return`Serie de ${r.n}/17 caracteres: al completarla se detectan año y marca.`;
  if(r.mal)return`${IC.at} La serie tiene caracteres no válidos (el VIN no usa I, O ni Q): revísala.`;
  if(!r.anio)return`${IC.at} No se pudo leer el año en la posición 10 de la serie: revísala o captura el año a mano.`;
  const dif=Number(o.anio)!==r.anio,mc=String(o.marca||'').trim(),fab=(MOTOS.cache[o.vin]||{}).marca||r.fab;
  const btn=(m,t)=>`<button type="button" class="btn sm" data-a="vinmarca" data-m="${m}">${t||'Usar '+m}</button>`;
  const pa=dif?`año <b>${r.anio}</b>${o.anio?` (capturaste ${esc(o.anio)})`:''} <button type="button" class="btn sm" data-a="vinanio" data-y="${r.anio}">Usar ${r.anio}</button>`:`año <b>${r.anio}</b> ✓`;
  const pm=fab?(mc&&mc!==fab?`marca <b>${esc(fab)}</b> (capturaste ${esc(mc)}) ${btn(fab)}`:`marca <b>${esc(fab)}</b> ✓`):r.amb?(mc&&r.amb.includes(mc)?`marca <b>${esc(mc)}</b> ✓`:`marca: esta fábrica arma varias (${r.amb.join(', ')}), elige ${r.amb.map(m=>btn(m,m)).join(' ')}`):'marca no reconocida: captúrala a mano';
  return`Según la serie: ${pa} · ${pm}`}
// ---- Base de motos (hoja MOTOS_TALLER de la API del taller) ----
// Al completar el VIN o el teléfono se busca la moto y se llenan los datos que estén vacíos. km y combustible nunca se llenan: se capturan en cada visita.
const MOTOS={cache:{},sug:null,tt:0,aviso:false};
const nTel=t=>{let d=String(t||'').replace(/\D/g,'');if(d.length===12&&d.startsWith('52'))d=d.slice(2);return d};
const motoErr=r=>{const m=(r&&r.message)||'';return /desconocida/i.test(m)?'viejo':/clave/i.test(m)?'clave':'error'};
function avisaMotos(k){if(MOTOS.aviso||k==='error')return;MOTOS.aviso=true;toast(k==='viejo'?'La base de motos necesita actualizar el script del taller (v7)':'La base de motos pide la clave del taller: defínela en el script y en Configuración')}
const motoH=(m,f)=>`✓ Moto en la base${String(m.origen||'').includes('VENTA')?' (vendida'+(m.fecha_venta?' el '+fechaMx(m.fecha_venta):'')+(m.sucursal_venta?' · '+esc(m.sucursal_venta):'')+')':' (registrada en el taller)'}${f&&f.length?' · se completó: '+f.join(', '):''}`;
const vinB=o=>{const m=MOTOS.cache[o.vin];return m?motoH(m):''};
const sugH=o=>{const s=MOTOS.sug;if(!o||o.vin||!s||s.tel!==nTel(o.tel)||!s.motos.length)return'';
  return'<div class="mut">Motos de este cliente en la base (toca una para completar):</div>'+s.motos.map((m,k)=>`<button type="button" class="btn" style="justify-content:flex-start;text-align:left" data-a="usamoto" data-i="${k}"><span>${esc(m.marca)} ${esc(m.modelo)}${m.anio?' · '+esc(m.anio):''}<br><small class="fol">${esc(m.vin)}${m.placas?' · '+esc(m.placas):''}</small></span></button>`).join('')};
const pintaSug=()=>{const o=D&&O(D);document.querySelectorAll('#motoSug,.motoSug').forEach(el=>el.innerHTML=sugH(o))};
// Llena solo lo vacío (cliente, teléfono, dirección, modelo, placas). La marca y el año de la base mandan sobre los de la tabla del VIN.
function llenaMoto(o,m){const f=[],q=k=>({set value(v){document.querySelectorAll('[data-p="'+k+'"]').forEach(e=>e.value=v)}}),
  pon=(k,v,rot)=>{v=String(v||'').trim();if(!v||String(o[k]||'').trim())return;o[k]=v;f.push(rot);const el=q(k);if(el)el.value=v};
  pon('cliente',m.cliente,'cliente');pon('tel',m.tel,'teléfono');pon('email',m.email,'correo');pon('dir',[m.direccion,m.ciudad].filter(Boolean).join(', '),'dirección');pon('modelo',m.modelo,'modelo');pon('placas',m.placas,'placas');
  if(m.marca&&o.marca!==m.marca){o.marca=m.marca;o.marcaAuto=true;f.push('marca');const el=q('marca');if(el)el.value=m.marca}
  if(m.anio&&String(o.anio)!==String(m.anio)&&(!String(o.anio||'').trim()||o.anioAuto)){o.anio=String(m.anio);o.anioAuto=true;f.push('año');const el=q('anio');if(el)el.value=o.anio}
  return f}
async function buscaMotoVin(o){const vin=o.vin,r0=vinInfo(vin);if(!(r0.ok||r0.ebike))return;
  let m=MOTOS.cache[vin];
  if(!m){let r=null;try{r=await api.taller({action:'buscarVin',vin})}catch{}
    if(!r)return;if(!r.success){avisaMotos(motoErr(r));return}
    m=r.moto;if(m)MOTOS.cache[vin]=m}
  if(!D||O(D)!==o||o.vin!==vin)return;                 // la orden o el VIN cambiaron mientras llegaba la respuesta
  const vbs=document.querySelectorAll('#vinb,.vinb');
  if(!m){vbs.forEach(vb=>vb.textContent='');return}
  const f=llenaMoto(o,m);if(f.length)touch(o);
  document.querySelectorAll('#vinh,.vinh').forEach(vh=>vh.innerHTML=vinH(o));vbs.forEach(vb=>vb.innerHTML=motoH(m,f))}
async function buscaMotosTel(o,tel){let r=null;try{r=await api.taller({action:'buscarMotos',campo:'tel',q:tel})}catch{}
  if(!r)return;if(!r.success){avisaMotos(motoErr(r));return}
  if(!D||O(D)!==o||nTel(o.tel)!==tel)return;
  MOTOS.sug={tel,motos:r.motos||[]};pintaSug()}
// ---- Importar el reporte de ventas (GCVEN02 en CSV) o la base ya preparada (base_motos.csv) ----
const NMARCA={CARABELA:'Carabela',VENTO:'Vento',BAJAJ:'Bajaj',SUZUKI:'Suzuki',VELOCI:'Veloci',ISLO:'Islo',HAOJUE:'Haojue',HERCULES:'Hercules',MOTOMEL:'Motomel',KURAZAI:'Kurazai',ATUL:'Atul',BENELLI:'Benelli','E-BIKES':'E-Bike',TRECKMOTORS:'Treckmotors'};
const COLORES=new Set('ROJO ROJA NEGRO NEGRA AZUL BLANCO BLANCA GRIS PLATA NARANJA VERDE AMARILLO AMARILLA TITANIO GRAFITO PURPURA MORADO MORADA DORADO DORADA CAFE BEIGE VINO MATE METALIZADO METALIZADA METALICO METALICA BICOLOR CELESTE ROSA AQUA MARINO PERLA ARENA OLIVO'.split(' '));
// Modelo con cilindraje y año a partir del nombre del producto: "MOTOCICLETA CARABELA HUNTER 125CC ROJO 2026" → HUNTER 125CC · 2026.
function modeloDe(prod,marca){let q=String(prod||'').replace(/\s+/g,' ').trim().toUpperCase().replace(/^(MOTOCICLETA|MOTOCARRO(?: DE CARGA)?|BICICLETA ELECTRICA)\s+/,'');const M=String(marca||'').toUpperCase();
  if(M&&q.startsWith(M+' '))q=q.slice(M.length+1);if(M==='HERCULES')q=q.replace(/\bHERCULES\b/g,'').trim();else if(q.startsWith('HERCULES '))q=q.slice(9);
  const yrs=q.match(/\b20\d\d\b/g),cc=/(\d{2,3}(?:\.\d)?)\s?CC\b/.exec(q);let modelo;
  if(cc){const antes=q.slice(0,cc.index).replace(/\b(4T|2T|1CIL|2CIL)\b/g,'').trim().replace(/\bHC-\s*$/,'').trim().replace(/\s+/g,' '),desp=q.slice(cc.index+cc[0].length).trim().split(' ').filter(Boolean);
    if(M==='SUZUKI'||M==='HAOJUE')modelo=((desp[0]?desp[0]+' ':'')+cc[1]+'CC').trim();
    else{const v=[];for(const t of desp){if(COLORES.has(t)||COLORES.has(t.replace(/,$/,''))||/^20\d\d$/.test(t)||/^\d\dD$/.test(t)||t.includes('/'))break;v.push(t)}modelo=(antes+' '+cc[1]+'CC'+(v.length?' '+v.join(' '):'')).trim()}}
  else modelo=q.split(' ').filter(w=>w&&!COLORES.has(w)&&!/^20\d\d$/.test(w)&&!/^\d\dD$/.test(w)).join(' ');
  return{modelo,anio:yrs?+yrs[yrs.length-1]:0}}
function csvFilas(t,fn){let i=t.charCodeAt(0)===0xFEFF?1:0,row=[],f='',q=false;const n=t.length;
  for(;i<n;i++){const c=t[i];
    if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;
    else if(c===','){row.push(f);f=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(f);f='';fn(row);row=[]}
    else f+=c}
  if(f!==''||row.length){row.push(f);fn(row)}}
function motosDeCsv(txt){const out=new Map(),nr=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();let modo=null,ix={};
  const col=(h,n)=>h.indexOf(n),g=(r,k)=>String(r[ix[k]]===undefined?'':r[ix[k]]).trim();
  const tel=v=>{const d=nTel(v);return d.length===10?d:''};
  csvFilas(txt,r=>{
    if(!modo){const h=r.map(nr);
      if(h.includes('SERIE')&&h.includes('FAMILIA')){modo='raw';['FAMILIA','PRODUCTO','MARCA','SERIE','FECHA','FACTURA','SUCURSAL','CVE_CLIENTE','CLIENTE','TELEFONO','DIRECCION','CIUDAD','DEVOLUCION'].forEach(k=>ix[k]=col(h,k))}
      else if(h.includes('VIN')&&h.includes('CLIENTE')){modo='base';['VIN','CLIENTE','TEL','EMAIL','DIRECCION','CIUDAD','MARCA','MODELO','ANIO','PLACAS','FECHA_VENTA','FACTURA','SUCURSAL_VENTA','CVE_CLIENTE'].forEach(k=>ix[k]=col(h,k))}
      return}
    if(modo==='base'){const vin=nr(g(r,'VIN')).replace(/\s+/g,'');if(vin.length<8)return;
      out.set(vin,{vin,cliente:g(r,'CLIENTE'),tel:tel(g(r,'TEL')),email:g(r,'EMAIL'),direccion:g(r,'DIRECCION'),ciudad:g(r,'CIUDAD'),marca:g(r,'MARCA'),modelo:g(r,'MODELO'),anio:g(r,'ANIO'),placas:g(r,'PLACAS'),fecha_venta:g(r,'FECHA_VENTA'),factura:g(r,'FACTURA'),sucursal_venta:g(r,'SUCURSAL_VENTA'),cve_cliente:g(r,'CVE_CLIENTE')});return}
    if(!/MOTOCICLETAS|MOTOCARROS/.test(nr(g(r,'FAMILIA'))))return;
    const vin=nr(g(r,'SERIE')).replace(/\s+/g,'');if(vin.length!==17||nr(g(r,'DEVOLUCION'))==='CANCELACION')return;
    const fm=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(g(r,'FECHA')),fecha=fm?fm[3]+'-'+fm[2].padStart(2,'0')+'-'+fm[1].padStart(2,'0'):'',prev=out.get(vin);
    if(prev&&prev.fecha_venta>fecha)return;                 // se queda la venta vigente más reciente (refacturaciones)
    const mar=nr(g(r,'MARCA')),marca=NMARCA[mar]||(mar?mar[0]+mar.slice(1).toLowerCase():''),md=modeloDe(g(r,'PRODUCTO'),mar);
    out.set(vin,{vin,cliente:g(r,'CLIENTE'),tel:tel(g(r,'TELEFONO')),direccion:g(r,'DIRECCION'),ciudad:g(r,'CIUDAD'),marca,modelo:md.modelo,anio:String(md.anio||vinInfo(vin).anio||''),placas:'',fecha_venta:fecha,factura:g(r,'FACTURA'),sucursal_venta:g(r,'SUCURSAL'),cve_cliente:g(r,'CVE_CLIENTE')})});
  return[...out.values()]}
async function importaMotos(file){if(!file)return;const st=$('#impst'),msg=t=>{if(st)st.textContent=t};
  try{msg('Leyendo archivo…');const buf=await file.arrayBuffer();let txt;
    try{txt=new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch{txt=new TextDecoder('windows-1252').decode(buf)}
    const filas=motosDeCsv(txt);
    if(!filas.length){msg('No encontré motos con serie de 17 caracteres. Sube el reporte GCVEN02 en CSV o base_motos.csv.');return}
    let nue=0,act=0,omi=0;
    for(let i=0;i<filas.length;i+=1500){msg('Subiendo '+Math.min(i+1500,filas.length)+' de '+filas.length+'…');
      const r=await api.taller({action:'importarMotos',filas:filas.slice(i,i+1500)});
      if(!r||!r.success){const k=motoErr(r);msg(k==='viejo'?'Actualiza el script del taller a la v7 y vuelve a intentar.':k==='clave'?'Define TALLER_CLAVE en el script y escribe la misma en Configuración de la app.':'No se pudo subir: '+((r&&r.message)||'sin respuesta'));return}
      nue+=r.nuevas;act+=r.actualizadas;omi+=r.omitidas}
    MOTOS.cache={};msg('Listo: '+nue+' nuevas, '+act+' actualizadas, '+omi+' omitidas ('+filas.length+' motos en el archivo).');toast('Base de motos importada')}
  catch(e){msg('No se pudo leer el archivo: '+String(e&&e.message||e))}}
// ---- fin base de motos ----
const asigH=o=>o.etapa==='recepcion'?`<div class="card"><div class="h">Asignación en taller</div><p class="mut" style="margin:0">El técnico se asigna al pasar la orden a Taller.</p></div>`:`<div class="card"><div class="h">Asignación en taller</div>${inp('Técnico asignado','mec',o.mec,'list="mecs"')}<datalist id="mecs">${[...new Set(S.orders.map(x=>x.mec).filter(Boolean))].map(m=>`<option value="${esc(m)}">`).join('')}</datalist></div>`;
const asesH=o=>`<div class="card"><div class="h">Datos del asesor de servicio</div><div class="g2">${inp('Asesor de servicio','asesor',o.asesor)}${inp('Asesor de refacciones','asesorRef',o.asesorRef,'list="asr"')}</div><datalist id="asr">${[...new Set(S.orders.map(x=>x.asesorRef).filter(Boolean))].map(m=>`<option value="${esc(m)}">`).join('')}</datalist>
  <div class="sbh" style="margin-top:14px">Accesorios y documentos</div><div class="mut">Marca lo que se recibe junto con la moto.</div><div class="pts">${ACCES.map(n=>{const x=o.inv[n];return`<button class="tg ${x.p?'on':''}" data-a="inv" data-n="${n}" aria-pressed="${x.p}">${x.p?IC.ok:''}<span>${INV32[n]}</span></button>`}).join('')}</div></div>`;
const accH=o=>`<div class="card"><div class="sbh" style="margin-top:14px">Accesorios y documentos</div><div class="mut">Marca lo que se recibe junto con la moto.</div><div class="pts">${ACCES.map(n=>{const x=o.inv[n];return`<button class="tg ${x.p?'on':''}" data-a="inv" data-n="${n}" aria-pressed="${x.p}">${x.p?IC.ok:''}<span>${INV32[n]}</span></button>`}).join('')}</div></div>`;
const SECC=[['Frente y dirección',[0,1,2]],['Motor y combustible',[3,4,5]],['Eléctrico y carrocería',[6,7,8]],['Tren trasero',[9,10,11]]],DANOS=['Rayado','Golpeado','Roto','Faltante','Desgaste','Otro','Recepción'],REC='Recepción',FI='Fotos de ingreso',pfo=new Set();let ds=-1;
// Fotos de ingreso: puntos de tipo Recepción (varias fotos cada uno) + las fotos generales de órdenes anteriores
const nRecep=o=>(o.danos||[]).filter(m=>m.t===REC).reduce((a,m)=>a+fotosK(m).filter(u=>src(u)).length,0)+FOTOS_GRAL.filter(x=>o.fotos[x[0]]&&src(o.fotos[x[0]])).length;
const heroSrc=o=>{if(o.fotos.g_frente&&src(o.fotos.g_frente))return src(o.fotos.g_frente);for(const m of o.danos||[])if(m.t===REC){const u=fotosK(m)[0];if(u)return src(u)}return''};
const ptsH=(o,i)=>CATS[i][2].map(n=>{const x=o.inv[n];return`<button class="tg ${x.p?'on':''}" data-a="inv" data-n="${n}" aria-pressed="${x.p}">${x.p?IC.ok:''}<span>${INV32[n]}</span></button>`}).join('');
const fotosK=k=>[k.f,...(k.fx||[])].filter(Boolean),OPL=['Cambiar llanta','Reparar ponchadura','Ajustar presión de aire','Balancear llanta','Cambiar válvula o cámara'];
const camB=(k,att,i)=>{const n=fotosK(k).length;return`<button type="button" class="cq fcam" data-a="fpick" ${att}="${i}" aria-label="Agregar foto${n?' ('+n+')':''}" title="Agregar foto">${IC.cam}${n?`<span class="fcn">${n}</span>`:''}</button>`};
const galH=(k,t,i)=>{const L=fotosK(k);return L.length?`<div class="ckx fgal">${L.map((u,j)=>`<span class="fgi"><img alt="Foto ${j+1}" src="${src(u)}" data-a="zoom"><button class="fgx" data-a="fdel" data-k="${t}" data-i="${i}" data-j="${j}" aria-label="Quitar foto ${j+1}">✕</button></span>`).join('')}</div>`:''};
const sqH=(k,a,i,n)=>`<div class="cqs" role="group" aria-label="${n}">${COND.map(([e,t,lb])=>`<button class="cq cq-${e}${k.e===e?' on':''}" data-a="${a}" data-i="${i}" data-e="${e}" aria-pressed="${k.e===e}" aria-label="${lb}" title="${t}">${k.e===e?IC.ok:''}</button>`).join('')}${camB(k,a==='cond'?'data-ffoto':'data-fll',i)}</div>`;
function llH(o){return`<div class="sbar">Llantas</div><div class="card llc">`+o.llantas.map((l,i)=>{const bad=l.e==='px'||l.e==='ur';
  return`<div class="llr"><b class="llp">${l.p}</b><label class="f"><span>Medida</span><input data-p="llantas.${i}.med" value="${esc(l.med)}" placeholder="90/90-17"></label><label class="f"><span>Desgaste (mm)</span><input inputmode="decimal" data-p="llantas.${i}.des" value="${esc(l.des)}"></label><label class="f"><span>PSI</span><input inputmode="numeric" data-p="llantas.${i}.psi" value="${esc(l.psi)}"></label>${sqH(l,'lcond',i,'Llanta '+l.p)}
  ${bad?`<label class="f llop"><span>Operación recomendada</span><input data-p="llantas.${i}.op" list="opl" value="${esc(l.op||'')}" placeholder="Elige o escribe la operación"></label>`:''}${galH(l,'l',i)}</div>`}).join('')+`<datalist id="opl">${OPL.map(x=>`<option value="${x}">`).join('')}</datalist></div>`}
const enCot=(o,i)=>o.lineas.some(l=>l.ck===i||(l.sku==='HALLAZGO'&&String(l.desc).startsWith(CATS[i][0]+': ')));
function ckRow(o,i){const c=CATS[i],k=o.chk[i],bad=k.e==='px'||k.e==='ur';
  return`<div class="ckr"><div class="ckt"><b>${i+1}. ${c[0]}</b><span class="mut">${c[1]}</span></div>${sqH(k,'cond',i,c[0])}${galH(k,'c',i)}
  ${bad?`<div class="ckx"><label class="f">Operación recomendada<input data-p="chk.${i}.op" list="op${i}" value="${esc(k.op||'')}" placeholder="Elige o escribe la operación"></label><datalist id="op${i}">${OPS[i].map(x=>`<option value="${x}">`).join('')}</datalist><label class="f">Nota técnica<textarea data-c="${i}">${esc(k.n)}</textarea></label>${enCot(o,i)?`<button class="btn" disabled>${IC.ok} Ya está en la cotización</button>`:`<button class="btn" data-a="pc" data-i="${i}">Pasar a cotización</button>`}</div>`:''}</div>`}
function danosH(o){const d=o.danos||[],leg=FOTOS_GRAL.filter(x=>o.fotos[x[0]]&&src(o.fotos[x[0]]));
  return`<div class="sbh" style="margin-top:14px">Daños y detalles</div><div class="mut">Toca la moto donde haya un daño o detalle (lateral, frente o arriba): se numera y eliges el tipo en la lista. Para las fotos de ingreso elige <b>Recepción</b>: el detalle se llena solo y puedes tomar o elegir varias fotos.</div>
  <div class="mw" data-a="dmark"><img src="img/moto.png" alt="Moto: vistas lateral, frontal y superior" draggable="false">${d.map((m,i)=>`<button class="mk${m.t===REC?' rc':''}${i===ds?' sel':''}" style="left:${m.x}%;top:${m.y}%" data-a="dsel" data-i="${i}" aria-label="Punto ${i+1}: ${esc(m.t)}">${i+1}</button>`).join('')}</div>
  ${d.length?d.map((m,i)=>`<div class="dmw"><div class="dmr"><span class="dmn">${i+1}</span><select data-p="danos.${i}.t" aria-label="Tipo del punto ${i+1}">${DANOS.map(x=>`<option ${m.t===x?'selected':''}>${x}</option>`).join('')}</select><input data-p="danos.${i}.n" placeholder="Detalle (opcional)" value="${esc(m.n)}" aria-label="Detalle del punto ${i+1}">${camB(m,'data-fdano',i)}<button class="btn" data-a="ddel" data-i="${i}" aria-label="Quitar punto ${i+1}">✕</button></div>${galH(m,'d',i)}</div>`).join(''):'<p class="mut" style="margin:6px 0 0">Sin puntos marcados.</p>'}
  ${leg.length?`<div class="sbh" style="margin-top:14px">Fotos de ingreso anteriores</div><div class="gfo">${leg.map(([k,t])=>`<button type="button" class="gf on" data-a="fver" data-foto="${k}" aria-label="Ver foto: ${t}"><img alt="${t}" src="${src(o.fotos[k])}"><span class="gt">${t}</span></button>`).join('')}</div>`:''}`}

function tI(o){const np=o.inv.filter(i=>i.p).length,fo=(k,t)=>`<div class="card"><div class="row sp"><div class="h">${t}</div><span class="chip ${o.fotos[k]?'g':'w'}">${o.fotos[k]?IC.ok+' Cargada':'Obligatoria'}</span></div>${o.fotos[k]?`<img class="pic" data-a="zoom" alt="${t}" src="${src(o.fotos[k])}">`:''}<button type="button" class="btn" data-a="fpick" data-foto="${k}">${IC.cam} ${o.fotos[k]?'Reemplazar foto':'Tomar o elegir foto'}</button></div>`;
  normChk(o);const cnt=x=>o.chk.filter(c=>c.e===x).length,rev=o.chk.length-cnt('nr');
  return`<div class="card"><div class="row sp"><div class="h">Hoja multipuntos</div><span class="chip ${rev===CATS.length?'g':'n'}">${rev}/${CATS.length} revisados</span></div>
  <button class="btn" data-a="okall">${IC.ok} Todo OK (marca los que siguen en azul)</button>
  <div class="lgd">${[['nr','Azul · No revisado'],['ok','Verde · OK'],['px','Amarillo · Próximo'],['ur','Rojo · Urgente']].map(([e,t])=>`<span class="lgi lg-${e}"><i>${CI[e]}</i>${t} <b>${cnt(e)}</b></span>`).join('')}</div></div>
  ${SECC.map(([t,ix],si)=>`<div class="sbar">${t}</div>${ix.map(i=>ckRow(o,i)).join('')}`).join('')}
  ${bayH(o)}`}

const qopen=new Set(),SEMC={ur:'r',px:'a',ok:'g',nr:'n'},EST=[['pend','Pendiente de autorización'],['aut','Autorizado'],['rech','Rechazado'],['gar','Garantía']];
const zonaDe=(o,l)=>{if(l.ck!=null&&CATS[l.ck])return l.ck;return CATS.findIndex(c=>String(l.desc).startsWith(c[0]+': '))};
function lineaH(l,i,o){const mo=l.t==='mo',z=zonaDe(o,l),area=z>=0?CATS[z][0]:(mo?'Mano de obra':'Refacción'),open=qopen.has(i),op=z>=0?String(l.desc).replace(CATS[z][0]+': ',''):l.desc;
  const inv=!mo&&l.sku&&!/^(HALLAZGO|MANUAL)$/.test(l.sku)?S.inv.find(x=>nSku(x.sku)===nSku(l.sku)):null,st=inv?stockDe(inv,o.suc):null;
  const pn=l.pc?(Number(l.precio)===l.pc?`<span class="chip g">${IC.ok} Precio de catálogo (IVA incluido): ${money(l.pc)}</span>${l.pf?`<span class="chip w">${IC.at} Viene del inventario: confirma que incluya IVA</span>`:''}`:`<span class="chip w">${IC.at} Precio editado (catálogo: ${money(l.pc)})</span><button class="btn sm" data-a="qpc" data-i="${i}">Volver al precio de catálogo</button>`):'';
  const det=open?`<div class="q2d"><div class="q2g${mo?' mo':''}">${mo?'':`<label class="f g-sku">SKU<input data-p="lineas.${i}.sku" data-sku="${i}" value="${esc(l.sku)}" autocomplete="off" autocapitalize="characters"></label>`}<label class="f g-desc">Descripción<input data-p="lineas.${i}.desc" value="${esc(l.desc)}"></label>${mo?'':`<label class="f g-cant">Cant.<input data-n data-p="lineas.${i}.cant" inputmode="numeric" value="${l.cant}"></label><div class="f g-ex"><span>Existencia${st&&st.suc!=='todas'?' · '+esc(st.suc):''}</span><div class="ro ${st?(st.n>0?'ok':'no'):''}">${st?(st.n>0?st.n+' pzas':'Sin existencia'):'—'}</div></div>`}<label class="f g-pr">${mo?'Monto $ (IVA incl.)':'P. unit. $ (IVA incl.)'}<input data-n data-p="lineas.${i}.precio" inputmode="decimal" value="${l.precio||''}"></label></div>
   <div class="row wrap">${pn}${!Number(l.precio)&&l.st!=='gar'?`<span class="chip w">${IC.at} Sin precio</span>`:''}${l.f?`<img class="th" data-a="zoom" alt="Evidencia" src="${src(l.f)}">`:''}<span style="flex:1"></span><button class="btn sm" data-a="dl" data-i="${i}" aria-label="Quitar ${esc(l.desc)}">${IC.fa} Quitar concepto</button></div>
   ${l.st==='rech'?(l.rg?`<div class="qx rgs"><span class="chip g">${IC.ok} Rechazo guardado</span><span>Motivo: <b>${esc(l.mot)}</b> · Seguimiento: <b>${esc(fechaMx(l.seg))}</b>${l.rea?' · Reagendar: <b>'+esc(l.rea)+'</b>':''}</span><button class="btn sm" data-a="redit" data-i="${i}">Editar</button></div>`:`<div class="qx g2"><label class="f">Motivo del rechazo<select data-p="lineas.${i}.mot"><option value="">Selecciona…</option>${MOTIVOS.map(m=>`<option ${l.mot===m?'selected':''}>${m}</option>`).join('')}</select></label><label class="f">Dar seguimiento el<input type="date" data-p="lineas.${i}.seg" value="${esc(l.seg||'')}"></label><label class="f">¿El cliente desea reagendar?<select data-p="lineas.${i}.rea">${['','Sí','No','Lo pensará'].map(x=>`<option ${l.rea===x?'selected':''}>${x}</option>`).join('')}</select></label><div class="row" style="grid-column:1/-1"><button class="btn pri" data-a="rguardar" data-i="${i}">Guardar rechazo</button></div></div>`):''}</div>`:'';
  return`<div class="q2 st-${l.st}" data-i="${i}"><div class="q2r"><button class="q2x" data-a="qexp" data-i="${i}" aria-expanded="${open}" aria-label="${open?'Contraer':'Expandir'} ${esc(l.desc)}">${open?'▾':'▸'}</button>
   <span class="q2a"><i class="sem ${z>=0?SEMC[o.chk[z].e]||'n':''}"></i>${esc(area)}</span><span class="q2o">${op?esc(op):'<i class="mut">Escribe la descripción…</i>'}</span>
   <select class="q2e est-${l.st}" data-qest="${i}" aria-label="Estado de autorización: ${esc(l.desc)}">${EST.map(([k,n])=>`<option value="${k}" ${l.st===k?'selected':''}>${n}</option>`).join('')}</select>
   <b class="q2i fol" id="imp-${i}">${money(imp(l))}</b></div>${det}</div>`}
const totH=o=>{const t=tot(o);return`<div class="tb"><div><span>Identificado</span><b>${money(t.cot)}</b></div><div class="g"><span>Autorizado (a cobrar)</span><b>${money(t.aut)}</b></div>${t.gar?`<div><span>Garantía (sin cargo)</span><b>${money(t.gar)}</b></div>`:''}<div class="a"><span>Pendiente</span><b>${money(t.pend)}</b></div><div class="m"><span>Rechazado / diferido</span><b>${money(t.rech)}</b></div></div>`};
const autCard=o=>{const a=o.auth,f=o.firmas.aut,s=f&&src(f);
  return`<div class="cfg-g">Autorización del cliente</div><div class="card"><div class="row sp"><div class="h">Firma de autorización</div><span class="chip ${s?'g':'w'}">${s?IC.ok+' Firmada':'Pendiente'}</span></div>
  ${s?`<img class="pic" alt="Firma de autorización" src="${s}"><div class="mut">${esc((a&&a.n)||f.n||'Cliente')}${a?' · '+new Date(a.t).toLocaleString('es-MX')+' · desde el enlace':''}</div>`:`<p class="mut" style="margin:0">El cliente firma desde el enlace que se manda con “Enviar visto bueno por WhatsApp”.${o.vb?' Enlace enviado el '+new Date(o.vb).toLocaleString('es-MX')+'.':''}</p>`}
  <div class="row wrap"><button class="btn sm" data-a="vblink">Copiar enlace</button><button class="btn sm" data-a="firma" data-k="aut">${s?'Firmar de nuevo en el taller':'Firmar en el taller'}</button></div></div>`};
let qmode='';
const qaddH=()=>`<div class="qadd"><button class="qplus" data-a="qmenu" aria-expanded="${!!qmode}" aria-label="Agregar concepto a la cotización"><span class="qpi" aria-hidden="true">+</span><span>Agregar concepto</span></button>${qmode==='menu'?`<div class="qmenu" role="group" aria-label="Tipo de concepto"><button class="btn qo2" data-a="qopt" data-k="ref"><b>Refacción</b><small>SKU o catálogo</small></button><button class="btn qo2" data-a="qopt" data-k="mo"><b>Mano de obra</b><small>Tiempo o monto</small></button><button class="btn qo2" data-a="qopt" data-k="manual"><b>Concepto manual</b><small>Texto libre</small></button></div>`:''}${qmode==='ref'?`<div class="qref"><label class="f">Busca SKU o refacción (catálogo, precio con IVA)<input id="q2" autocomplete="off" placeholder="SKU, nombre o número de parte"></label><div id="sug" class="sugl"></div></div>`:''}</div>`;
function tC(o){return`<div class="q2t"><div class="q2h"><span></span><span>Área</span><span>Operación</span><span>Estado de autorización</span><span class="r">Importe (IVA incl.)</span></div>${o.lineas.map((l,i)=>lineaH(l,i,o)).join('')||'<div class="qe mut">Sin conceptos. Agrégalos aquí abajo o pasa hallazgos desde Inspección.</div>'}
  ${qaddH()}</div>
  <div class="tbw" id="tot">${totH(o)}</div>
  <div class="row wrap"><button class="btn amb" data-a="wa">Enviar visto bueno por WhatsApp</button><button class="btn" data-a="autall">Autorizar todo lo pendiente</button></div>
  ${autCard(o)}`}
function tZ(o){return`<div class="card"><div class="h">Entrega de la moto</div><button class="btn ${o.lav?'':'pri'}" data-a="lav" aria-pressed="${!!o.lav}">${o.lav?IC.ok+' Moto lavada (tocar para revertir)':'Marcar moto lavada'}</button><div class="mut">Requisito para pasar a Entregado.</div></div>
  <div class="card"><div class="h">Diagnóstico del técnico</div><label class="f"><span class="sr">Diagnóstico</span><textarea data-p="diag" style="min-height:110px">${esc(o.diag)}</textarea></label></div>
  <div class="card"><div class="h">Aviso legal</div><p style="margin:0;font-size:14px">${LEYENDA}</p><button class="btn ${o.leg?'':'pri'}" data-a="leg" aria-pressed="${!!o.leg}">${o.leg?IC.ok+' Cliente informado (tocar para revertir)':'El cliente fue informado'}</button></div>
  <div class="card"><div class="h">Próximo servicio</div><div class="g2">${inp('Fecha','prox.f',o.prox.f,'type="date"')}${inp('Kilometraje','prox.km',o.prox.km,'inputmode="numeric"')}</div></div>
  <div class="row wrap"><button class="btn amb" data-a="walisto">Avisar por WhatsApp: unidad lista</button><button class="btn" data-a="print">${IC.pr} Imprimir / PDF</button></div>`}

function agenda(){const hoy=iso(),L=mine(),mecs=[...new Set(L.map(o=>o.mec).filter(Boolean))],bs=BAHIAS.filter(b=>!agf.b||String(b)===agf.b);
  return`<div class="ph"><h2>Agenda de hoy</h2><label class="f">Bahía<select data-ag="b"><option value="">Todas</option>${BAHIAS.map(b=>`<option ${agf.b===String(b)?'selected':''}>${b}</option>`).join('')}</select></label><label class="f">Mecánico<select data-ag="m"><option value="">Todos</option>${mecs.map(m=>`<option ${agf.m===m?'selected':''}>${esc(m)}</option>`).join('')}</select></label></div>
  <div class="ag" style="grid-template-columns:52px repeat(${bs.length},minmax(0,1fr))"><div></div>${bs.map(b=>`<div class="agh">Bahía ${b}</div>`).join('')}
  ${HORAS.map(h=>`<div class="hr">${String(h).padStart(2,'0')}:00</div>`+bs.map(b=>{const o=L.find(o=>o.cita&&o.cita.f===hoy&&o.cita.h===h&&o.cita.b===b);
   return`<div>${o?(agf.m&&o.mec!==agf.m?`<div class="slot dim">Ocupada</div>`:`<button class="slot occ" data-a="abrir" data-f="${o.folio}">${esc(o.folio)} · ${esc(o.modelo)}<br><span class="mut">${esc(o.mec||'')}</span></button>`):`<button class="slot" data-a="cita" data-h="${h}" data-b="${b}">Libre</button>`}</div>`}).join('')).join('')}</div>`}

function segItems(){const r=[];mine().forEach(o=>{o.lineas.forEach((l,i)=>{if(l.st==='rech'&&!l.cerr)r.push({k:'l',o,i,l,f:l.seg||''})});if(o.prox&&o.prox.f&&!o.prox.cerr)r.push({k:'p',o,f:o.prox.f})});return r.sort((a,b)=>(a.f||'9').localeCompare(b.f||'9'))}
function seguimientos(){const hoy=iso(),w=addD(7),it=segItems().filter(x=>match(x.o)),G=[['Vencidos',it.filter(x=>x.f&&x.f<hoy)],['Esta semana',it.filter(x=>x.f&&x.f>=hoy&&x.f<=w)],['Más adelante',it.filter(x=>x.f&&x.f>w)],['Sin fecha',it.filter(x=>!x.f)]];
  return`<div class="ph"><h2>Seguimientos: trabajos diferidos y próximos servicios</h2></div>${G.map(([n,L])=>L.length?`<h3 class="h" style="margin:14px 0 8px">${n} <span class="cnt">${L.length}</span></h3><div class="sgg">${L.map(x=>`<div class="card"><div class="row sp"><span class="fol">${esc(x.o.folio)}</span><span class="chip ${x.f&&x.f<hoy?'r':'n'}">${x.f||'Sin fecha'}</span></div><div class="ttl">${esc(x.o.cliente||'Sin cliente')} · ${esc(x.o.modelo)}</div><div>${x.k==='l'?esc(x.l.desc)+' · '+money(imp(x.l)):'Próximo servicio'+(x.o.prox.km?' · '+esc(x.o.prox.km)+' km':'')}</div>${x.k==='l'?`<div class="mut">Motivo: ${esc(x.l.mot||'No registrado')}</div>`:''}
   <div class="row wrap"><button class="btn sm" style="flex:1" data-a="sgwa" data-f="${x.o.folio}" data-i="${x.i??''}" data-k="${x.k}">WhatsApp</button>${x.k==='l'?`<button class="btn sm" style="flex:1" data-a="sgre" data-f="${x.o.folio}" data-i="${x.i}">Reprogramar</button><button class="btn sm pri" style="flex:1" data-a="sgok" data-f="${x.o.folio}" data-i="${x.i}">Aceptar y crear orden</button>`:`<button class="btn sm pri" style="flex:1" data-a="sgcita" data-f="${x.o.folio}">Crear orden</button>`}<button class="btn sm" style="flex:1" data-a="sgx" data-f="${x.o.folio}" data-i="${x.i??''}" data-k="${x.k}">Descartar</button></div></div>`).join('')}</div>`:'').join('')||'<p class="mut">No hay seguimientos pendientes. Los conceptos rechazados y los próximos servicios aparecerán aquí.</p>'}`}

function sheet(h){$('#modal').innerHTML=`<div class="ov" data-a="cerrar"><div class="sh" role="dialog" aria-modal="true">${h}</div></div>`}
const tipoBtns=(a,x='')=>Object.entries(TIPOS).map(([k,v])=>`<button class="btn" data-a="${a}" data-t="${k}" ${x}><span class="fol">${k}</span> ${v}</button>`).join('');
function setPath(o,p,v){const a=p.split('.');let r=o;for(let i=0;i<a.length-1;i++){if(r[a[i]]==null)r[a[i]]={};r=r[a[i]]}r[a[a.length-1]]=v}
const acts={
 usamoto:d=>{const o=D&&O(D),m=MOTOS.sug&&MOTOS.sug.motos[+d.i];if(!o||!m)return;o.vin=m.vin;MOTOS.cache[m.vin]=m;llenaMoto(o,m);const r=vinInfo(o.vin);if(r.anio&&!String(o.anio||'').trim()){o.anio=String(r.anio);o.anioAuto=true}touch(o);renderDrawer()},
 impmotos:()=>{const f=$('#fmotos');if(f)f.click()},
 vinanio:d=>{const o=O(D);o.anio=String(d.y);o.anioAuto=true;touch(o);renderDrawer()},
 vinmarca:d=>{const o=O(D);o.marca=d.m;delete o.marcaAuto;touch(o);renderDrawer()},
 bdel:d=>{const o=O(D),f=o.fotos[d.foto],u=f&&(f.u||'');if(u&&!u.startsWith('data:'))(o.rmf=o.rmf||[]).push(u);delete o.fotos[d.foto];touch(o);renderDrawer()},
 tarsave:async()=>{if(!puedeRep()||!S.suc)return;const v=parseFloat(String($('#tar').value).replace(',','.'));if(!(v>=0))return toast('Escribe un monto válido por hora','err');
  S.tarifas=S.tarifas||{};S.tarifas[S.suc]=Math.round(v*100)/100;(S.tarPend=S.tarPend||{})[S.suc]=true;save();renderMain();
  const r=await subeTarifas();if(r==='ok')toast('Tarifa guardada para '+S.suc);else if(r==='viejo')toast('Tarifa guardada en este dispositivo. Falta actualizar el Apps Script (v5) para compartirla con los demás.','err');else toast('Tarifa guardada en este dispositivo; se subirá al sincronizar','inf')},
 tab:d=>{tab=d.k;renderMain()},view:d=>{view=d.v;render()},abrir:d=>{D=d.f;dt='u';qopen.clear();keepSc=false;render()},cerrard:()=>{D=null;render()},dtab:d=>{dt=d.k;keepSc=false;renderDrawer()},
 cerrar:(d,e)=>{if(e.target.classList.contains('ov'))$('#modal').innerHTML=''},
 rsec:d=>{rp.sec=d.k;renderMain()},
 repcsv:()=>{if(!puedeRep())return;const L=repOrdenes(),h=['Folio','Agencia','Tipo','Etapa','Cliente','Modelo','Técnico','Asesor','Ingreso','Cotizado','Autorizado','Garantía','Rechazado','Pendiente','Tiempo real (min)','Autorizó por enlace'],c=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"',
   rows=L.map(o=>{const t=tot(o);return[o.folio,o.suc,TIPOS[o.tipo]||o.tipo,(ETAPAS[idx(o.etapa)]||[])[1]||o.etapa,o.cliente,o.modelo,o.mec,o.asesor,new Date(o.fing||o.cre||0).toLocaleDateString('es-MX'),t.cot,t.aut,t.gar,t.rech,t.pend,Math.round((o.t&&o.t.acum||0)/6e4),o.auth?'Sí':'No'].map(c).join(',')});
   const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+[h.map(c).join(','),...rows].join('\n')],{type:'text/csv;charset=utf-8'}));a.download='reporte-taller-'+iso()+'.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)},
 tgl:d=>{const o=O(D);o[d.k]=!o[d.k];logH(o,(o[d.k]?'Marcada: ':'Quitada: ')+(d.k==='espRef'?'esperando refacciones':'orden retrasada'));touch(o);renderDrawer()},
 nueva:()=>{if(!S.suc)return acts.agpick();sheet('<div class="h">Tipo de orden</div>'+tipoBtns('crear'))},
 elim:()=>{if(!adminReal()||!D)return;sheet(`<div class="h">¿Eliminar la orden ${esc(D)}?</div><div class="mut">Se borra la orden y su cotización de la hoja del taller. Esta acción no se puede deshacer.</div><div class="row"><button class="btn" data-a="cmod">Cancelar</button><button class="btn red" data-a="elimok">Eliminar</button></div>`)},
 cmod:()=>{$('#modal').innerHTML=''},
 fpick:d=>{fpT={};for(const k in d)if(k!=='a')fpT[k]=d[k];sheet('<div class="h">Agregar foto</div><div class="mut">Toma la foto con la cámara o elige una que ya tengas en la galería.</div><button class="btn pri" data-a="fcam">'+IC.cam+' Tomar foto con la cámara</button><button class="btn" data-a="fgal">'+IC.gal+' Elegir de la galería</button><button class="btn" data-a="cmod">Cancelar</button>')},
 fcam:()=>{$('#modal').innerHTML='';const i=$('#fin-cam');i.value='';i.click()},
 fgal:()=>{$('#modal').innerHTML='';const i=$('#fin-gal');i.value='';i.multiple=!(fpT&&fpT.foto);i.click()},
 fver:d=>{const o=D&&O(D),u=o&&o.fotos[d.foto]&&src(o.fotos[d.foto]);if(!u)return acts.fpick(d);abrirVisor([u],0,{foto:d.foto})},
 zoom:(d,e)=>{const im=e.target.closest('img'),g=im.closest('.fgal'),L=g?[...g.querySelectorAll('img[data-a="zoom"]')]:[im];abrirVisor(L.map(x=>x.currentSrc||x.src),Math.max(0,L.indexOf(im)),null)},
 vzcerrar:()=>cerrarVisor(),vzprev:()=>{VW.i=(VW.i+VW.L.length-1)%VW.L.length;vzMuestra()},vznext:()=>{VW.i=(VW.i+1)%VW.L.length;vzMuestra()},
 vzmas:()=>vzZoom(VW.s*1.5),vzmenos:()=>vzZoom(VW.s/1.5),vzreset:()=>vzZoom(1),vzcambiar:()=>{const t=VW.T;cerrarVisor();if(t)acts.fpick(t)},
 elimok:()=>{if(!adminReal()||!D)return;const f=D;S.orders=S.orders.filter(o=>o.folio!==f);S.dirty=S.dirty.filter(x=>x!==f);(S.del=S.del||[]).push(f);D=null;save();$('#modal').innerHTML='';render();sync();toast('Orden eliminada')},
 lav:()=>{const o=O(D);o.lav=!o.lav;touch(o);renderDrawer()},
 agpick:()=>{if(!sesion||!multi(sesion.agencia))return;sheet('<div class="h">Agencia de trabajo</div><div class="mut">Elige la agencia en la que vas a trabajar.</div>'+permitidas(sesion.agencia).map(a=>`<button class="btn ${a===S.suc?'pri':''}" data-a="agset" data-k="${esc(a)}">${esc(a)}</button>`).join(''))},
 agset:d=>{S.suc=d.k;migrarLeg();$('#modal').innerHTML='';D=null;render()},crear:d=>{$('#modal').innerHTML='';crear(d.t)},
 cita:d=>sheet(`<div class="h">Nueva cita ${d.h}:00 · Bahía ${d.b}</div>`+tipoBtns('crearc',`data-h="${d.h}" data-b="${d.b}"`)),
 crearc:d=>{$('#modal').innerHTML='';crear(d.t,{bahia:d.b,cita:{f:iso(),h:+d.h,b:+d.b}})},
 mv:d=>sheet('<div class="h">Mover a…</div>'+ETAPAS.map(([k,n])=>`<button class="btn ${O(d.f).etapa===k?'pri':''}" data-a="mvto" data-f="${d.f}" data-k="${k}">${n}</button>`).join('')),
 mvto:d=>{$('#modal').innerHTML='';mover(O(d.f),d.k)},sig:d=>{const o=O(d.f);mover(o,sig(o))},
 gar:d=>{const o=O(D);o.gar=d.k==='1';touch(o);renderDrawer()},
 inv:d=>{const o=O(D),x=o.inv[+d.n];x.p=!x.p;if(x.p&&!(x.c>0))x.c=1;touch(o);renderDrawer()},invall:()=>{const o=O(D);o.inv.forEach(x=>{x.p=true;if(!(x.c>0))x.c=1});touch(o);renderDrawer()},
 pfo:d=>{const i=+d.i;pfo.has(i)?pfo.delete(i):pfo.add(i)},dsel:d=>{ds=+d.i;renderDrawer()},ddel:d=>{const o=O(D);o.danos.splice(+d.i,1);ds=-1;touch(o);renderDrawer()},
 dmark:(d,e)=>{const o=O(D),r=e.target.closest('.mw').getBoundingClientRect();(o.danos=o.danos||[]).push({x:+((e.clientX-r.left)/r.width*100).toFixed(1),y:+((e.clientY-r.top)/r.height*100).toFixed(1),t:'Rayado',n:''});ds=o.danos.length-1;touch(o);renderDrawer()},
 tcerrar:()=>{$('#toast').style.display='none'},dno:()=>cerrarAsk(null),dnop:()=>{},dsi:()=>{const i=$('#dlgi');cerrarAsk(i?i.value.trim():true)},
 syncnow:async()=>{if(!sesion)return;toast('Sincronizando…');await sync();pintaSyn();if(/clave/i.test(syncMsg)){const k=await ask({t:'Clave del taller',m:'El servidor pide una clave: es la de TALLER_CLAVE en el Apps Script del taller.',input:'Clave',ok:'Guardar',tipo:'err'});if(k){localStorage.setItem('taller_clave',k.trim());await sync();pintaSyn()}}toast(syncMsg?'No se pudo sincronizar: '+syncMsg:'Sincronizado · '+mine().length+' órdenes en '+(S.suc||'—')+' ('+S.orders.length+' en total)')},
 lcond:d=>{const o=O(D);o.llantas[+d.i].e=d.e;touch(o);renderDrawer()},
 fdel:d=>{const o=O(D),k=d.k==='l'?o.llantas[+d.i]:d.k==='d'?o.danos[+d.i]:o.chk[+d.i],j=+d.j,u=j===0?k.f:(k.fx||[])[j-1];if(typeof u==='string'&&u&&!u.startsWith('data:'))(o.rmf=o.rmf||[]).push(u);if(j===0)k.f=(k.fx||[]).shift()||null;else k.fx.splice(j-1,1);touch(o);renderDrawer()},
 okall:()=>{const o=O(D);normChk(o);o.chk.forEach(x=>{if(x.e==='nr')x.e='ok'});o.inv.forEach(x=>{x.p=true;if(!(x.c>0))x.c=1});touch(o);renderDrawer()},
 cond:d=>{const o=O(D),i=+d.i;o.chk[i].e=d.e;if(d.e!=='nr')CATS[i][2].forEach(n=>{o.inv[n].p=true;if(!(o.inv[n].c>0))o.inv[n].c=1});touch(o);renderDrawer()},
 pc:d=>{const o=O(D),c=o.chk[+d.i];if(enCot(o,+d.i))return toast('Este hallazgo ya está en la cotización');o.lineas.push({t:'ref',sku:'HALLAZGO',ck:+d.i,desc:CATS[+d.i][0]+': '+(c.op?c.op+(c.n?' ('+c.n+')':''):(c.n||COND.find(x=>x[0]===c.e)[2])),cant:1,precio:0,min:0,st:o.tipo==='G'?'gar':'pend',f:c.f||null});qopen.add(o.lineas.length-1);touch(o);renderDrawer();toast('Agregado a la cotización (pon su precio en la pestaña Cotización)')},
 firma:d=>abrirFirma(u=>{const o=O(D),f=o.firmas[d.k]||{};delete f.u;f.d=u;o.firmas[d.k]=f;touch(o);renderDrawer()}),
 dl:d=>{const o=O(D);o.lineas.splice(+d.i,1);qopen.clear();touch(o);renderDrawer()},
 qexp:d=>{const i=+d.i;qopen.has(i)?qopen.delete(i):qopen.add(i);renderDrawer()},
 qpc:d=>{const o=O(D),l=o.lineas[+d.i];if(l&&l.pc){l.precio=l.pc;touch(o);renderDrawer()}},
 aut:d=>{const o=O(D),l=o.lineas[+d.i],k=(l.st===d.k&&d.k!=='pend')?'pend':d.k;l.st=k;if(k==='rech'){if(!l.seg)l.seg=addD(30)}else{delete l.cerr;delete l.rg}touch(o);renderDrawer()},
 rguardar:d=>{const o=O(D),l=o.lineas[+d.i];if(!l.mot)return toast('Selecciona el motivo del rechazo','err');if(!/^\d{4}-\d{2}-\d{2}$/.test(l.seg||''))return toast('Falta la fecha de seguimiento','err');l.rg=Date.now();touch(o);renderDrawer();sync();toast('Rechazo guardado: aparece en Seguimientos')},
 redit:d=>{const o=O(D);delete o.lineas[+d.i].rg;touch(o);renderDrawer()},
 autall:()=>{const o=O(D);o.lineas.forEach(l=>{if(l.st==='pend')l.st=o.tipo==='G'?'gar':'aut'});touch(o);renderDrawer()},
 qmenu:()=>{qmode=qmode?'':'menu';renderDrawer()},
 qopt:d=>{if(d.k==='ref'){qmode='ref';renderDrawer();setTimeout(()=>{const x=$('#q2');x&&x.focus()},0);return}
  qmode='';const o=O(D),t=d.k==='mo'?'mo':'ref';o.lineas.push({t,sku:t==='mo'?'MO':'MANUAL',desc:'',cant:1,precio:0,min:0,st:o.tipo==='G'?'gar':'pend'});const n=o.lineas.length-1;qopen.add(n);touch(o);renderDrawer();setTimeout(()=>{const x=document.querySelector('[data-p="lineas.'+n+'.desc"]');x&&x.focus()},0)},
 add:d=>{qmode='';const o=O(D),i=sug[+d.i];o.lineas.push({t:'ref',sku:i.sku,desc:i.nombre,cant:1,precio:precioDe(i),pc:precioDe(i),pf:pIva(i)==null,min:0,st:o.tipo==='G'?'gar':'pend'});qopen.add(o.lineas.length-1);touch(o);renderDrawer()},
 leg:()=>{const o=O(D);o.leg=!o.leg;touch(o);renderDrawer()},
 wa:async()=>{const o=O(D),L=o.lineas.filter(l=>l.st!=='rech');if(!L.length)return toast('No hay conceptos que enviar');
  if(L.some(l=>!Number(l.precio)&&l.st!=='gar')&&!(await ask({t:'Conceptos sin precio',m:'Hay conceptos sin precio. ¿Enviar de todos modos?',ok:'Enviar',tipo:'err'})))return;
  const tel=String(o.tel||'').replace(/\D/g,'');if(!tel)return toast('Captura el WhatsApp del cliente');
  const w=window.open('about:blank','_blank');   // se abre en el toque (gesto del usuario) y se llena cuando la orden ya está en el servidor
  if(!o.tok)o.tok=nuevoTok();o.vb=Date.now();touch(o);toast('Preparando el enlace…','inf');
  if(!(await subirOrden(o))){if(w)w.close();return toast('No se pudo subir la orden: revisa tu conexión y vuelve a intentar')}
  const er=await enlaceListo(o);if(er){if(w)w.close();return toast(er)}
  const u='https://wa.me/'+(tel.length===10?'52'+tel:tel)+'?text='+encodeURIComponent(`Hola ${o.cliente}, te compartimos la orden de trabajo de tu ${o.modelo} (${o.folio}) de ${o.suc}. Revisa los trabajos recomendados y autoriza con tu firma aquí:\n${linkCliente(o)}`);
  if(w)w.location.href=u;else location.href=u;renderDrawer()},
 vblink:async()=>{const o=O(D);if(!o.tok)return toast('Primero envía el visto bueno para generar el enlace');if(!(await subirOrden(o)))return toast('No se pudo subir la orden: revisa tu conexión');
  {const er=await enlaceListo(o);if(er)return toast(er)}
  try{await navigator.clipboard.writeText(linkCliente(o));toast('Enlace copiado')}catch{toast('No se pudo copiar el enlace: '+linkCliente(o))}},
 walisto:()=>{const o=O(D);o.listo=true;touch(o);wa(o.tel,`Hola ${o.cliente}, tu ${o.modelo} (${o.folio}) está lista para entrega en ${o.suc}. Total a pagar: ${money(tot(o).aut)}.`)},
 cr:()=>{const o=O(D);if(o.t.ini){o.t.acum=ms(o);o.t.ini=null}else o.t.ini=Date.now();touch(o);renderDrawer();renderMain()},
 fin:()=>{const o=O(D);o.t.acum=ms(o);o.t.ini=null;touch(o);renderDrawer();renderMain();toast('Tiempo real: '+hms(o.t.acum)+(est(o)?' · estándar '+est(o)+' min':''))},
 clon:d=>{const o=O(d.f);$('#modal').innerHTML='';crear('G',{cliente:o.cliente,tel:o.tel,email:o.email||'',dir:o.dir,modelo:o.modelo,marca:o.marca,anio:o.anio,motor:o.motor,vin:o.vin,placas:o.placas||'',km:o.km,fcompra:o.fcompra,ref:o.folio,gar:true})},
 print:()=>imprimir(O(D)),
 sgwa:d=>{const o=O(d.f);wa(o.tel,d.k==='l'?`Hola ${o.cliente}, te escribimos de ${o.suc}. Quedó pendiente en tu ${o.modelo}: ${o.lineas[+d.i].desc}. ¿Lo programamos?`:`Hola ${o.cliente}, ya toca el siguiente servicio de tu ${o.modelo}${o.prox.km?' (a los '+o.prox.km+' km)':''}. ¿Te agendamos una cita en ${o.suc}?`)},
 sgre:async d=>{const o=O(d.f),l=o.lineas[+d.i],v=await ask({t:'Nueva fecha de seguimiento',input:'Fecha',type:'date',def:l.seg||addD(15),ok:'Guardar'});if(v&&/^\d{4}-\d{2}-\d{2}$/.test(v)){l.seg=v;touch(o);renderMain()}},
 sgok:d=>{const o=O(d.f),l=o.lineas[+d.i];l.cerr=true;touch(o);crear('SR',{cliente:o.cliente,tel:o.tel,email:o.email||'',dir:o.dir,modelo:o.modelo,marca:o.marca,anio:o.anio,motor:o.motor,vin:o.vin,placas:o.placas||'',km:o.km,ref:o.folio,lineas:[Object.assign({},l,{st:'aut',cerr:false,mot:'',seg:''})]})},
 sgcita:d=>{const o=O(d.f);o.prox.cerr=true;touch(o);crear('SP',{cliente:o.cliente,tel:o.tel,email:o.email||'',dir:o.dir,modelo:o.modelo,marca:o.marca,anio:o.anio,motor:o.motor,vin:o.vin,placas:o.placas||'',km:o.km,ref:o.folio})},
 sgx:d=>{const o=O(d.f);if(d.k==='l')o.lineas[+d.i].cerr=true;else o.prox.cerr=true;touch(o);renderMain()},
 cfg:()=>{const rol=sesion?(sesion.esAdmin?'Administrador':sesion.esGerente?'Gerente':sesion.esVendedor?'Vendedor':''):'',t=temaG();
  sheet(`<div class="h">Configuración</div>
<div class="cfg-g">Perfil</div>
<div class="cfg-c"><b>${esc(sesion?.nombre||sesion?.correo||'—')}</b><span class="mut">${esc(sesion?.correo||'')}${rol?' · '+rol:''}</span><span class="mut">Agencia: ${esc(S.suc||sesion?.agencia||'—')}</span></div>
<div class="cfg-g">Aspecto</div><div class="mut">Elige cómo se ve el Taller.</div>
<div class="seg">${[['claro','Claro'],['oscuro','Oscuro'],['sistema','Igual que el sistema']].map(([k,n])=>`<button class="tema-op ${k===t?'on':''}" data-a="tema" data-tm="${k}">${n}</button>`).join('')}</div>
<div class="cfg-g">Cuenta y versión</div>
<div class="mut">Pendientes de sincronizar: ${S.dirty.length}</div><div class="mut">${S.inv.length?S.inv.length+' productos en el catálogo':'Sin catálogo cargado'}</div>
<div class="mut">Identificador de versión</div><div class="ver">${esc(APP_BUILD)}</div>
${adminReal()?`<div class="cfg-g">Base de motos</div><div class="mut">Sube el reporte de ventas GCVEN02 en CSV (o base_motos.csv). Solo entran motos con serie de 17 caracteres y venta vigente; lo que el taller ya capturó en visitas no se pisa.</div><button class="btn" data-a="impmotos">Importar base de motos (CSV)</button><input type="file" id="fmotos" accept=".csv,text/csv" hidden><div class="mut" id="impst"></div>`:''}
<button class="btn" data-a="catup">Actualizar catálogo</button>
<button class="btn" data-a="recarga">Forzar recarga (limpiar caché de esta pestaña)</button>
<button class="btn red" data-a="salir">Cerrar sesión</button>`)},
 tema:d=>{try{localStorage.setItem('taller_tema',d.tm)}catch{}aplicarTema()},
 catup:()=>cargaCat(false),recarga:()=>recarga(),
 ojo:()=>{const i=$('#lg-p');i.type=i.type==='password'?'text':'password'},
 salir:()=>sheet('<div class="h">¿Cerrar sesión?</div><div class="mut">Tendrás que volver a iniciar sesión para entrar al Taller. Las órdenes pendientes de sincronizar se conservan en este dispositivo.</div><div class="row"><button class="btn" data-a="salirno">Cancelar</button><button class="btn red" data-a="salirsi">Cerrar sesión</button></div>'),
 salirno:()=>{$('#modal').innerHTML=''},
 salirsi:()=>{const s=sesion;if(s){try{fetch(CATALOGO_API,{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'cerrarSesionServidor',correo:s.correo,token:s.token})}).catch(()=>{})}catch{}}
  sesion=null;borrarSes();S.inv=[];S.suc='';save();$('#modal').innerHTML='';D=null;pintaHd();render();pintaLogin()}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&acts[b.dataset.a])acts[b.dataset.a](b.dataset,e)});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches&&e.target.matches('article[data-a]'))acts.abrir(e.target.dataset);
  if(visorOn()){if(e.key==='Escape')cerrarVisor();else if(e.key==='ArrowLeft'&&VW.L.length>1)acts.vzprev();else if(e.key==='ArrowRight'&&VW.L.length>1)acts.vznext();else if(e.key==='+'||e.key==='=')acts.vzmas();else if(e.key==='-')acts.vzmenos();return}
  if(e.key==='Escape'){if($('#modal').innerHTML)$('#modal').innerHTML='';else if(D){D=null;render()}}});
document.addEventListener('input',e=>{const t=e.target;
  if(t.id==='gq'){q=t.value.trim();renderMain();return}
  const o=D&&O(D);if(!o)return;
  const mt=/^danos\.(\d+)\.t$/.exec(t.dataset.p||'');
  if(mt){const m=o.danos[+mt[1]];m.t=t.value;if(m.t===REC){if(!m.n)m.n=FI}else if(m.n===FI)m.n='';touch(o);renderDrawer();return}
  if(t.dataset.p==='placas'||t.dataset.p==='vin'){const p=t.selectionStart;t.value=t.dataset.p==='vin'?t.value.toUpperCase().replace(/\s+/g,''):t.value.toUpperCase();try{t.setSelectionRange(p,p)}catch{}}
  if(t.dataset.p==='anio')delete o.anioAuto;
  if(t.dataset.p==='marca')delete o.marcaAuto;
  if(t.dataset.p){setPath(o,t.dataset.p,t.hasAttribute('data-n')?(parseFloat(String(t.value).replace(',','.'))||0):t.value);touch(o);
   if(t.dataset.p.startsWith('lineas.')){const i=t.dataset.p.split('.')[1],el=$('#imp-'+i);if(el&&o.lineas[i])el.textContent=money(imp(o.lineas[i]));const tt=$('#tot');if(tt)tt.innerHTML=totH(o)}}
  if(t.dataset.p==='vin'){const r=vinInfo(o.vin);
   if(r.ok&&r.anio&&(!o.anio||o.anioAuto)){o.anio=String(r.anio);o.anioAuto=true;document.querySelectorAll('[data-p="anio"]').forEach(ai=>ai.value=o.anio)}
   else if(!(r.ok&&r.anio)&&o.anioAuto){o.anio='';delete o.anioAuto;document.querySelectorAll('[data-p="anio"]').forEach(ai=>ai.value='')}
   const fb=(MOTOS.cache[o.vin]||{}).marca||r.fab;
   if(fb){if(o.marca!==fb){o.marca=fb;document.querySelectorAll('[data-p="marca"]').forEach(mi=>mi.value=o.marca)}o.marcaAuto=true}
   else if(!fb&&o.marcaAuto){o.marca='';delete o.marcaAuto;document.querySelectorAll('[data-p="marca"]').forEach(mi=>mi.value='')}
   touch(o);document.querySelectorAll('#vinh,.vinh').forEach(vh=>vh.innerHTML=vinH(o));document.querySelectorAll('#vinb,.vinb').forEach(vb=>vb.innerHTML=vinB(o));buscaMotoVin(o)}
  if(t.dataset.p==='tel'&&!o.vin){clearTimeout(MOTOS.tt);const tl=nTel(o.tel);if(tl.length===10)MOTOS.tt=setTimeout(()=>buscaMotosTel(o,tl),350);else{MOTOS.sug=null;pintaSug()}}
  if(t.dataset.c){o.chk[+t.dataset.c].n=t.value;touch(o)}
  if(t.id==='q2'){const s=t.value.toLowerCase();sug=s.length<2?[]:S.inv.filter(i=>(i.sku+' '+i.nombre).toLowerCase().includes(s)).slice(0,6);
   const os=O(D)&&O(D).suc;$('#sug').innerHTML=sug.map((i,k)=>{const st=stockDe(i,os);return`<button class="btn sg" data-a="add" data-i="${k}"><span class="sd"><b>${esc(i.nombre)}</b><small class="fol">${esc(i.sku)}</small></span><span class="sp"><b class="fol">${money(precioDe(i))}</b><small>${pIva(i)==null?'verifica IVA':'IVA incl.'}</small></span>${st?`<span class="ex ${st.n>0?'ok':'no'}">${st.n>0?st.n+' pzas':'Sin existencia'}</span>`:''}</button>`}).join('')||(s.length>1?'<div class="mut">Sin resultados. Conecta el catálogo en Configuración o agrega un concepto manual.</div>':'')}});
document.addEventListener('change',async e=>{const t=e.target;
  if(t.dataset&&t.dataset.qest!=null){acts.aut({i:t.dataset.qest,k:t.value});return}
  if(t.dataset&&t.dataset.sku!=null){const o=O(D),l=o&&o.lineas[+t.dataset.sku];if(l){const v=t.value.trim(),it=v&&S.inv.find(x=>nSku(x.sku)===nSku(v));l.sku=v;
    if(it){l.desc=it.nombre;l.pc=precioDe(it);l.pf=pIva(it)==null;l.precio=l.pc;toast('Precio de catálogo aplicado (IVA incluido)','ok')}else if(v)toast('SKU no encontrado en el catálogo: pon el precio a mano','inf');
    touch(o);renderDrawer()}return}
  if(t.id==='fmotos'){const f=t.files[0];t.value='';importaMotos(f);return}
  if(t.id==='ftipo'){ft=t.value;renderMain();return}
  if(t.dataset&&t.dataset.rp){rp[t.dataset.rp]=t.value;renderMain();return}
  if(t.dataset.ag){agf[t.dataset.ag]=t.value;renderMain();return}
  if(t.id==='fin-cam'||t.id==='fin-gal'){const fs=[...t.files];t.value='';if(fs.length&&fpT)await subirFotos(fs,fpT)}});
function comprimir(f,m=1280,q=.7){return new Promise((r,x)=>{const im=new Image,u=URL.createObjectURL(f);im.onload=()=>{const k=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);r(c.toDataURL('image/jpeg',q))};im.onerror=()=>{URL.revokeObjectURL(u);x(new Error('imagen no legible'))};im.src=u})}
/* ---------- fotos: cámara o galería ---------- */
IC.gal='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>';
let fpT=null,fotoPend=false,fotoErr=false;
async function subirFotos(fs,T){const o=D&&O(D);if(!o)return;let n=0,bad=0;
  for(const f of fs){let d;try{d=await comprimir(f)}catch{bad++;continue}
    if(T.foto){o.fotos[T.foto]={d};n++;break}
    if(T.bay){o.fotos[bayNext(o)]={d};n++;continue}
    const k=T.ffoto!=null?o.chk[+T.ffoto]:T.fll!=null?o.llantas[+T.fll]:o.danos[+T.fdano];if(!k){bad++;continue}
    if(!k.f)k.f=d;else(k.fx=k.fx||[]).push(d);n++}
  if(bad)toast('No se pudo leer '+(bad>1?'alguna de las fotos':'la foto')+': prueba con otra imagen (JPG o PNG)');
  if(!n)return;
  touch(o);fotoPend=true;fotoErr=false;renderDrawer();if(!bad)toast('Foto agregada · subiendo para que se vea en la PC…');syncSoon(1200)}
/* ---------- visor de fotos con zoom (pellizco, rueda, doble toque, arrastrar) ---------- */
const VW={L:[],i:0,s:1,x:0,y:0,T:null,P:new Map(),d0:1,s0:1,lt:0,lx:0,ly:0,mv:0};
const visorOn=()=>{const v=$('#visor');return !!v&&!v.hidden};
function vzPinta(){const im=$('#vz-im'),st=$('#vz-st');if(!im||!st)return;
  if(VW.s<=1.001){VW.s=1;VW.x=0;VW.y=0}else{const mx=Math.max(0,(im.offsetWidth*VW.s-st.clientWidth)/2),my=Math.max(0,(im.offsetHeight*VW.s-st.clientHeight)/2);VW.x=Math.max(-mx,Math.min(mx,VW.x));VW.y=Math.max(-my,Math.min(my,VW.y))}
  im.style.transform='translate('+VW.x+'px,'+VW.y+'px) scale('+VW.s+')';const p=$('#vz-pct');if(p)p.textContent=Math.round(VW.s*100)+'%'}
function vzZoom(ns,px=0,py=0){ns=Math.min(8,Math.max(1,ns));const k=ns/VW.s;VW.x=px-(px-VW.x)*k;VW.y=py-(py-VW.y)*k;VW.s=ns;vzPinta()}
function vzEventos(st){
  st.addEventListener('pointerdown',e=>{try{st.setPointerCapture(e.pointerId)}catch{}VW.P.set(e.pointerId,{x:e.clientX,y:e.clientY});VW.mv=VW.P.size>1?99:0;if(VW.P.size===2){const[a,b]=[...VW.P.values()];VW.d0=Math.hypot(a.x-b.x,a.y-b.y)||1;VW.s0=VW.s}});
  st.addEventListener('pointermove',e=>{const p=VW.P.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;VW.mv+=Math.abs(dx)+Math.abs(dy);
    if(VW.P.size===2){const[a,b]=[...VW.P.values()],d=Math.hypot(a.x-b.x,a.y-b.y)||1,r=st.getBoundingClientRect();vzZoom(VW.s0*d/VW.d0,(a.x+b.x)/2-r.left-r.width/2,(a.y+b.y)/2-r.top-r.height/2)}
    else if(VW.s>1){VW.x+=dx;VW.y+=dy;vzPinta()}});
  const fin=e=>{if(!VW.P.has(e.pointerId))return;VW.P.delete(e.pointerId);
    if(e.type==='pointerup'&&VW.mv<8&&VW.P.size===0){const t=Date.now();
      if(t-VW.lt<320&&Math.hypot(e.clientX-VW.lx,e.clientY-VW.ly)<30){VW.lt=0;const r=st.getBoundingClientRect();vzZoom(VW.s>1.05?1:2.5,e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2)}
      else{VW.lt=t;VW.lx=e.clientX;VW.ly=e.clientY}}};
  st.addEventListener('pointerup',fin);st.addEventListener('pointercancel',fin);
  st.addEventListener('wheel',e=>{e.preventDefault();const r=st.getBoundingClientRect();vzZoom(VW.s*(e.deltaY<0?1.2:1/1.2),e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2)},{passive:false})}
function visorEl(){let v=$('#visor');if(v)return v;v=document.createElement('div');v.id='visor';v.className='vz';v.hidden=true;v.setAttribute('role','dialog');v.setAttribute('aria-modal','true');v.setAttribute('aria-label','Visor de foto');
  v.innerHTML='<div class="vz-top"><span class="vz-n" id="vz-n"></span><button type="button" class="vz-chg" id="vz-chg" data-a="vzcambiar" hidden>'+IC.cam+' Cambiar foto</button><button type="button" data-a="vzcerrar" aria-label="Cerrar visor">✕</button></div><div class="vz-stage" id="vz-st"><img class="vz-img" id="vz-im" alt="Foto ampliada" draggable="false"></div><button type="button" class="vz-nav prev" data-a="vzprev" aria-label="Foto anterior">‹</button><button type="button" class="vz-nav next" data-a="vznext" aria-label="Foto siguiente">›</button><div class="vz-bar"><button type="button" data-a="vzmenos" aria-label="Alejar">−</button><button type="button" data-a="vzreset" id="vz-pct" aria-label="Tamaño original">100%</button><button type="button" data-a="vzmas" aria-label="Acercar">+</button></div>';
  document.body.appendChild(v);vzEventos(v.querySelector('#vz-st'));return v}
function vzMuestra(){const v=visorEl();$('#vz-im').src=VW.L[VW.i];VW.s=1;VW.x=0;VW.y=0;vzPinta();$('#vz-n').textContent=VW.L.length>1?(VW.i+1)+' / '+VW.L.length:'Foto';
  v.querySelector('.prev').hidden=v.querySelector('.next').hidden=VW.L.length<2;$('#vz-chg').hidden=!VW.T;v.hidden=false}
function abrirVisor(L,i,T){VW.L=L;VW.i=i;VW.T=T;const tt=$('#toast');if(tt)tt.style.display='none';vzMuestra()}
function cerrarVisor(){const v=$('#visor');if(v)v.hidden=true}
/* arrastrar y soltar: complemento en escritorio */
document.addEventListener('dragstart',e=>{const k=e.target.closest&&e.target.closest('.k');if(!k)return;dragF=k.dataset.f;e.dataTransfer.setData('text/plain',dragF);k.classList.add('dg')});
document.addEventListener('dragend',()=>{dragF=null;document.querySelectorAll('.dg,.over').forEach(x=>x.classList.remove('dg','over'))});
document.addEventListener('dragover',e=>{const c=e.target.closest&&e.target.closest('.col');if(c&&dragF){e.preventDefault();c.classList.add('over')}});
document.addEventListener('dragleave',e=>{const c=e.target.closest&&e.target.closest('.col');if(c)c.classList.remove('over')});
document.addEventListener('drop',e=>{const c=e.target.closest&&e.target.closest('.col');if(!c||!dragF)return;e.preventDefault();const o=O(dragF);dragF=null;document.querySelectorAll('.over').forEach(x=>x.classList.remove('over'));if(o&&c.dataset.drop!==o.etapa)mover(o,c.dataset.drop)});

function aplicarUrls(o,u){for(const k in u){const[a,b,c]=k.split('.');if(a==='fotos'&&o.fotos[b])o.fotos[b]={u:u[k]};else if(a==='firmas'&&o.firmas[b])o.firmas[b]={n:o.firmas[b].n,u:u[k]};else if(a==='chk'&&o.chk[b])o.chk[b].f=u[k];else if(a==='chkx'&&o.chk[b]&&o.chk[b].fx)o.chk[b].fx[c]=u[k];else if(a==='ll'&&o.llantas&&o.llantas[b])o.llantas[b].f=u[k];else if(a==='llx'&&o.llantas&&o.llantas[b]&&o.llantas[b].fx)o.llantas[b].fx[c]=u[k];else if(a==='dan'&&o.danos&&o.danos[b])o.danos[b].f=u[k];else if(a==='danx'&&o.danos&&o.danos[b]&&o.danos[b].fx)o.danos[b].fx[c]=u[k];else if(a==='lineas'&&o.lineas[b])o.lineas[b].f=u[k]}}
let syncMsg='',syT=0,pendDr=false;
const syncSoon=(ms=2500)=>{clearTimeout(syT);syT=setTimeout(sync,ms)};
const escribiendo=()=>{const a=document.activeElement;return!!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.closest&&a.closest('#drawer'))};
function pintaSyn(){const b=$('#synb'),s=$('#syn');if(!b||!s)return;const n=S.dirty.length;b.hidden=!n;b.textContent=n;s.classList.toggle('err',!!syncMsg);s.title=syncMsg?'Sin sincronizar: '+syncMsg:n?n+' pendientes de subir':'Sincronizado'}
// Junta las fotos que otro dispositivo (p. ej. el celular) ya subió con las de esta copia, sin pisar lo que esta copia ya tiene.
function mergeFotos(l,r){let ch=false;const rm=new Set(l.rmf||[]),ok=u=>typeof u==='string'&&u&&!u.startsWith('data:')&&!rm.has(u),vacio=x=>!(x&&(x.d||x.u));
  ['fotos','firmas'].forEach(a=>{const rr=r[a]||{};for(const k in rr){const rv=rr[k],lv=(l[a]||{})[k];if(rv&&ok(rv.u)&&vacio(lv)){(l[a]=l[a]||{})[k]=a==='firmas'?{n:(lv&&lv.n)||rv.n||'',u:rv.u}:{u:rv.u};ch=true}}});
  ['chk','llantas','danos'].forEach(a=>{const ra=r[a],la=l[a];if(!Array.isArray(ra)||!Array.isArray(la)||(a==='danos'&&ra.length!==la.length))return;
    ra.forEach((rk,i)=>{const lk=la[i];if(!rk||!lk)return;const ll=[lk.f,...(lk.fx||[])].filter(Boolean);
      [rk.f,...(rk.fx||[])].filter(ok).forEach(u=>{if(ll.includes(u))return;if(!lk.f)lk.f=u;else(lk.fx=lk.fx||[]).push(u);ll.push(u);ch=true})})});
  return ch}
const nuevoTok=()=>[...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join('');
const linkCliente=o=>new URL('cliente.html',location.href).href+'?o='+encodeURIComponent(o.folio)+'&k='+o.tok;
async function subirOrden(o){if(!tallerUrl()||!navigator.onLine)return false;for(let n=0;syncing&&n<50;n++)await new Promise(r=>setTimeout(r,300));
  try{const u0=o.upd,r=await api.taller({action:'guardarOrden',orden:o});if(!r.success)return false;aplicarUrls(o,r.urls||{});if(o.upd===u0)S.dirty=S.dirty.filter(x=>x!==o.folio);save();return true}catch{return false}}
// Comprueba que el Apps Script ya tiene el enlace del cliente (v6) y que abre esta orden; así no se manda un enlace que no sirve.
async function enlaceListo(o){let v=null;try{v=await api.taller({action:'verOrden',folio:o.folio,tok:o.tok})}catch{}
  if(v&&v.success)return'';if(!v)return'No se pudo comprobar el enlace: revisa tu conexión';
  return/desconocida/i.test(v.message||'')?'Falta actualizar el Apps Script a la versión 6: sin eso el enlace no abre. Pega el código nuevo y publica una nueva versión':'No se pudo comprobar el enlace: '+(v.message||'sin respuesta')}
// La autorización que el cliente hizo desde el enlace se aplica aunque la orden esté abierta o con cambios pendientes.
function aplicaAuth(l,ro){const a=ro.auth;if(!a||(l.auth&&l.auth.t>=a.t))return false;l.auth=a;if(ro.firmas&&ro.firmas.aut)(l.firmas=l.firmas||{}).aut=ro.firmas.aut;
  (a.d||[]).forEach(d=>{const x=l.lineas[d.i];if(x&&x.desc===d.desc){x.st=d.st;if(d.mot)x.mot=d.mot;if(d.st==='rech'&&!x.seg)x.seg=d.seg||addD(30)}});return true}
async function sync(){if(!sesion||syncing||!tallerUrl()||!navigator.onLine){if(sesion&&!navigator.onLine){syncMsg='sin internet';pintaSyn()}return}syncing=true;let err='';
  try{for(const f of [...(S.del||[])]){const r=await api.taller({action:'eliminarOrden',folio:f});if(r.success)S.del=S.del.filter(x=>x!==f);else err=r.message||'error del servidor'}
   // 1) bajar lo que hay en la hoja (y juntar las fotos que subieron otros dispositivos)
   const r=await api.taller({action:'listarOrdenes'});
   if(r.success){let ch=false,chd=false;(r.ordenes||[]).forEach(ro=>{if(!ro||!ro.folio||(S.del||[]).includes(ro.folio))return;migEt(ro);const l=O(ro.folio);
      if(!l){S.orders.push(ro);ch=true}
      else if(aplicaAuth(l,ro)){toast('El cliente autorizó '+l.folio+' desde el enlace','ok');if(D===l.folio)chd=true;else ch=true}
      else if((ro.upd||0)>(l.upd||0)&&!S.dirty.includes(l.folio)&&D!==l.folio){Object.assign(l,ro);ch=true}
      else if(mergeFotos(l,ro)){if(D===l.folio)chd=true;else ch=true}});
     if(ch)renderMain();if(chd){if(escribiendo())pendDr=true;else{renderDrawer();renderMain()}}}
   else err=r.message||'error al leer las órdenes';
   try{const c=await api.taller({action:'leerConfig'});if(c&&c.success&&c.config){S.tarifas=S.tarifas||{};let ct=false;for(const k in c.config){const m=/^tarifa_mo\|(.+)$/.exec(k);if(m&&!(S.tarPend||{})[m[1]]&&S.tarifas[m[1]]!==Number(c.config[k])){S.tarifas[m[1]]=Number(c.config[k])||0;ct=true}}if(ct&&view==='rep'&&!escribiendo())renderMain()}
    if(Object.keys(S.tarPend||{}).length)await subeTarifas()}catch{}
   // 2) subir lo pendiente
   for(const f of [...S.dirty]){const o=O(f);if(!o){S.dirty=S.dirty.filter(x=>x!==f);continue}const u0=o.upd,r=await api.taller({action:'guardarOrden',orden:o});if(!r.success){err=(r.message||'error del servidor')+' ('+f+')';continue}aplicarUrls(o,r.urls||{});if(o.upd===u0)S.dirty=S.dirty.filter(x=>x!==f)}
   save()}catch(e){err=String(e&&e.message||e)}syncMsg=err;syncing=false;pintaSyn();
  if(fotoPend){if(!err&&!S.dirty.length){fotoPend=false;fotoErr=false;toast('Foto sincronizada: ya se puede ver en la PC')}else if(err&&!fotoErr){fotoErr=true;toast('La foto quedó guardada en este dispositivo, pero no se pudo subir: '+err)}}
  if(!err&&S.dirty.length)syncSoon(2500)}
setInterval(sync,30000);setInterval(()=>{pintaSyn();if(pendDr&&!escribiendo()){pendDr=false;renderDrawer()}},2000);addEventListener('online',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
/* ---------- sesión, tema y mantenimiento (estilo REPORTEADOR) ---------- */
const SK='taller_sesion',APP_BUILD='Taller Carabela · v31 · 22-11-26';
const leerSes=()=>{for(const st of [sessionStorage,localStorage]){try{const s=JSON.parse(st.getItem(SK));if(s&&s.token&&s.agencia&&(s.esAdmin||s.esVendedor||s.esGerente)&&!(s.duracionSesionMs&&Date.now()-s.loginTime>s.duracionSesionMs))return s}catch{}}return null};
const borrarSes=()=>{try{sessionStorage.removeItem(SK);localStorage.removeItem(SK)}catch{}};
const pintaLogin=()=>{$('#login').style.display=sesion?'none':'flex'};
async function iniciarSesion(){
  const c=$('#lg-u').value.trim(),p=$('#lg-p').value.trim(),rec=$('#lg-r').checked,m=$('#lg-m'),b=$('#lg-b');
  if(!c||!p){m.className='lg-m err';m.textContent='Escribe tu correo/teléfono y tu contraseña.';return}
  b.disabled=true;m.className='lg-m';m.textContent='Validando...';
  try{const r=await api.login(c,p,rec);
    if(!r.success){m.className='lg-m err';m.textContent=r.message||'No se pudo iniciar sesión.';return}
    if(!r.esAdmin&&!r.esVendedor&&!r.esGerente){   // las cuentas de clientes no entran al taller
      m.className='lg-m err';m.textContent='Tu cuenta no tiene acceso al Taller. Contacta al administrador.';
      try{fetch(CATALOGO_API,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'cerrarSesionServidor',correo:r.correo||c,token:r.token})}).catch(()=>{})}catch{}
      return}
    const ag=String(r.almacenAdmin||'').replace(/\s+/g,' ').trim().toUpperCase(),agencia=ag||(r.esAdmin&&!r.esVendedor?'TODAS':'');
    if(!agencia){m.className='lg-m err';m.textContent='Tu cuenta no tiene agencia asignada. Contacta al administrador.';
      try{fetch(CATALOGO_API,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'cerrarSesionServidor',correo:r.correo||c,token:r.token})}).catch(()=>{})}catch{}
      return}
    sesion={correo:r.correo||c,token:r.token,nombre:r.nombre||'',esAdmin:!!r.esAdmin,esGerente:!!r.esGerente,esVendedor:!!r.esVendedor,agencia,duracionSesionMs:r.duracionSesionMs,loginTime:Date.now()};
    try{sessionStorage.setItem(SK,JSON.stringify(sesion));if(rec)localStorage.setItem(SK,JSON.stringify(sesion))}catch{}
    $('#lg-p').value='';m.textContent='';pintaLogin();aplicaAg();render();sync();cargaCat(true)
  }catch{m.className='lg-m err';m.textContent='Error de conexión. Intenta de nuevo.'}
  finally{b.disabled=false}}
const nSku=v=>{const t=String(v==null?'':v).trim();return /^\d+$/.test(t)?t.replace(/^0+(?=\d)/,''):t};
// Precio público CON IVA (lista del catálogo: obtenerPreciosCatalogo). Si el SKU no está en esa lista se usa el del inventario y se marca para verificar.
const pIva=i=>{const p=S.pr&&S.pr[nSku(i.sku)];return p>0?p:null};
const precioDe=i=>pIva(i)??i.precio;
// Existencia en la sucursal de la orden (si no coincide el nombre, el total de todas)
const stockDe=(i,suc)=>{if(!i||!i.ex)return null;const k=String(suc||'').toUpperCase(),e=i.ex,ks=Object.keys(e);const hit=ks.find(x=>k&&(k.includes(x.toUpperCase())||x.toUpperCase().includes(k)));return hit!=null?{n:e[hit],suc:hit}:{n:ks.reduce((a,x)=>a+e[x],0),suc:'todas'}};
async function cargaCat(quiet){if(!sesion)return;
  try{const r=await api.inventario(sesion.correo,sesion.token);if(!r.success){if(!quiet)toast(r.message||'Catálogo no disponible: vuelve a iniciar sesión');return}
    S.inv=(r.data||[]).map(i=>({sku:String(i.sku||i.SKU||i.Sku||i.Codigo||''),nombre:String(i.nombre||i.Nombre||i.Descripcion||i.Producto||''),precio:Number(i.precio||i.Precio||i.precioPublico||i.PrecioPublico||0),ex:(i.Existencias||[]).reduce((m,e)=>{if(!e.enTransito&&e.sucursal)m[e.sucursal]=(m[e.sucursal]||0)+(Number(e.cantidad)||0);return m},{})})).filter(i=>i.sku);
    try{const p=await api.precios(sesion.correo,sesion.token);if(p&&p.success){S.pr={};(p.data||[]).forEach(x=>{const v=Number(x.precio);if(v>0)S.pr[nSku(x.sku)]=v})}}catch{}
    save();if(!quiet)toast(S.inv.length+' productos cargados')}
  catch{if(!quiet)toast('Sin conexión al catálogo')}}
function migrarLeg(){if(S.suc)S.orders.forEach(o=>{if(LEG.includes(o.suc)){o.suc=S.suc;touch(o)}});save()}
function pintaHd(){const a=sesion?.agencia||'',el=$('#agn'),lg=$('#hlogo'),m=multi(a),vr=$('#vrep');if(vr)vr.hidden=!puedeRep();
  if(el){el.hidden=!sesion;el.textContent=sesion?(S.suc||(m?'Elegir agencia':a)):'';el.className='agn'+(m?' pk':'');el.disabled=!m;if(m)el.dataset.a='agpick';else delete el.dataset.a}
  if(lg){const u=LOGO_BASE+logoDe(S.suc||a)+'.png';if(lg.getAttribute('src')!==u)lg.setAttribute('src',u)}}
function aplicaAg(){if(!sesion)return;const a=sesion.agencia,p=permitidas(a);
  S.suc=multi(a)?(p.includes(S.suc)?S.suc:''):a;migrarLeg();pintaHd();if(!S.suc)acts.agpick()}
const temaG=()=>{try{return localStorage.getItem('taller_tema')||'sistema'}catch{return'sistema'}};
function aplicarTema(){const t=temaG(),o=t==='oscuro'||(t==='sistema'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',o);document.querySelectorAll('.tema-op').forEach(b=>b.classList.toggle('on',b.dataset.tm===t))}
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(temaG()==='sistema')aplicarTema()})}catch{}
async function recarga(){toast('Actualizando…');try{if(window.caches){const k=await caches.keys();await Promise.all(k.map(x=>caches.delete(x)))}if(navigator.serviceWorker){const r=await navigator.serviceWorker.getRegistrations();await Promise.all(r.map(x=>x.unregister()))}}catch{}location.reload()}
document.addEventListener('submit',e=>{if(e.target.id==='lg-f'){e.preventDefault();iniciarSesion()}});
IDB.open().then(async ok=>{
  if(ok){const v=await IDB.get('S');
    if(v&&v.orders){S=v}else{try{await IDB.set('S',S)}catch{}}
    try{localStorage.removeItem('taller_v2')}catch{}}
  $('#ftipo').innerHTML='<option value="">Todos los tipos</option>'+Object.entries(TIPOS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  S.orders=S.orders||[];S.dirty=S.dirty||[];S.inv=S.inv||[];S.seq=S.seq||{};S.del=S.del||[];S.tarifas=S.tarifas||{};S.tarPend=S.tarPend||{};S.orders.forEach(migEt);
  sesion=leerSes();aplicarTema();pintaLogin();aplicaAg();render();sync();if(sesion)cargaCat(true)});
