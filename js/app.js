const $=s=>document.querySelector(s);
const IC={ok:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',at:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M12 4l9 16H3zM12 10v4M12 17v1"/></svg>',fa:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',cam:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',back:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',clock:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',pr:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/></svg>'};
const CI={nr:'',ok:IC.ok,px:IC.at,ur:IC.fa};
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}};
let S=load('taller_v2',{orders:[],seq:{},dirty:[],inv:[],suc:''});
const migEt=o=>{if(o&&ETMIG[o.etapa])o.etapa=ETMIG[o.etapa];return o};S.orders.forEach(migEt);
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
const toast=t=>{const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',3200)};
const iso=(d=new Date())=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const addD=n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)};
const src=x=>typeof x==='string'?x:(x&&(x.d||x.u))||'';
const idx=e=>ETAPAS.findIndex(x=>x[0]===e),O=f=>S.orders.find(o=>o.folio===f),mine=()=>S.orders.filter(o=>o.suc===S.suc);
const adminReal=()=>!!(sesion&&sesion.esAdmin&&!sesion.esVendedor&&!sesion.esGerente);
const imp=l=>(Number(l.cant)||0)*(Number(l.precio)||0);
const ms=o=>o.t.acum+(o.t.ini?Date.now()-o.t.ini:0);
const hms=m=>{const s=Math.floor(m/1000);return[s/3600|0,s/60%60|0,s%60].map(x=>String(x).padStart(2,'0')).join(':')};
const touch=o=>{if(!S.dirty.includes(o.folio))S.dirty.push(o.folio);o.upd=Date.now();save()};
const est=o=>o.lineas.filter(l=>l.t==='mo'&&l.st!=='rech').reduce((a,l)=>a+(Number(l.min)||0),0);
const tot=o=>{const t={cot:0,aut:0,gar:0,rech:0,pend:0};o.lineas.forEach(l=>{const v=imp(l);t.cot+=v;t[l.st]+=v});return t};
const desk=()=>matchMedia('(min-width:700px)').matches;
const sig=o=>ETAPAS[idx(o.etapa)+1]?.[0];
const wa=(tel,m)=>{let t=String(tel||'').replace(/\D/g,'');if(!t){toast('Captura el WhatsApp del cliente');return}if(t.length===10)t='52'+t;open('https://wa.me/'+t+'?text='+encodeURIComponent(m),'_blank')};

async function folio(t){try{const r=await api.taller({action:'siguienteFolio',tipo:t});if(r.folio)return r.folio}catch{}
  S.seq[t]=(S.seq[t]||0)+1;return t+'-'+String(S.seq[t]).padStart(4,'0')+'L'}
async function crear(t,x={}){
    const o=Object.assign({folio:await folio(t),tipo:t,etapa:'recepcion',suc:S.suc,lav:false,cliente:'',tel:'',dir:'',fcompra:'',modelo:'',anio:'',motor:'',vin:'',km:'',comb:'',gar:t==='G',motivo:'',cond:'',mec:'',bahia:'',
   inv:INV32.map(()=>({p:false,c:1})),chk:CATS.map(()=>({e:'nr',n:'',f:null})),fotos:{},firmas:{},recibe:'',diag:'',leg:false,
   lineas:[],
   t:{acum:0,ini:null},cita:null,ref:'',prox:{f:'',km:''},fing:Date.now(),cre:Date.now(),listo:false},x);
  S.orders.unshift(o);touch(o);D=o.folio;dt='u';tab='recepcion';view='board';keepSc=false;render();sync()}

function puede(o,dest){const i=idx(o.etapa),j=idx(dest);if(j<=i)return'';
  if(i===0){const f=FOTOS_GRAL.filter(x=>x[2]&&!(o.fotos[x[0]]&&src(o.fotos[x[0]])));if(f.length)return'Faltan fotos generales de la moto: '+f.map(x=>x[1]).join(', ');
    if(!o.cliente||!o.modelo)return'Captura cliente y modelo (unidad)'}
  if(j>=1&&!o.mec)return'Asigna el técnico (mecánico) en Inspección';
  if(j>=2&&(!o.fotos.bayoneta||!o.fotos.tanque))return'Faltan las 2 fotos de inspección (bayoneta y tanque)';
  const L=o.lineas;
  if(j>=3){if(!L.length)return'Agrega la cotización';if(L.some(l=>l.st==='pend'))return'Hay conceptos pendientes de autorización'}
  if(j===4){if(!o.lav)return'Marca que la moto fue lavada (Cierre)';if(!(o.firmas.cli&&src(o.firmas.cli)))return'Falta la firma del cliente en Cierre'}
  return''}
function mover(o,dest){const e=puede(o,dest);if(e)return toast(e);
  if(idx(o.etapa)===0&&idx(dest)>0&&!o.firmas.entrega)return abrirFirma(u=>{o.firmas.entrega={d:u};touch(o);mover(o,dest)});
  if(dest==='entregado'&&o.t.ini){o.t.acum=ms(o);o.t.ini=null}
  o.etapa=dest;touch(o);tab=dest;render();sync()}

/* ---------- render ---------- */
function render(){
  document.querySelectorAll('.vn button').forEach(b=>b.classList.toggle('on',b.dataset.v===view));pintaHd();
  renderMain();renderDrawer()}
function renderMain(){$('#app').innerHTML=view==='ag'?agenda():view==='seg'?seguimientos():board()}
function renderDrawer(){const el=$('#drawer'),o=D&&O(D),sc=el.querySelector('.dbody')?.scrollTop||0;
  el.innerHTML=o?drawer(o):'';document.body.classList.toggle('lock',!!o);
  if(o){const b=el.querySelector('.dbody');if(b&&keepSc)b.scrollTop=sc;if(lastD!==D)el.querySelector('.drh .ib')?.focus()}
  lastD=D;keepSc=true}
const match=o=>{if(ft&&o.tipo!==ft)return false;if(!q)return true;const s=[o.folio,o.cliente,o.modelo,o.vin,o.tel,o.motor].join(' ').toLowerCase();return q.toLowerCase().split(/\s+/).every(w=>s.includes(w))};
function board(){const L=mine().filter(match);
  return`<div class="tabs" role="tablist" aria-label="Etapas">${ETAPAS.map(([k,n])=>`<button class="tab ${k===tab?'on':''}" role="tab" aria-selected="${k===tab}" data-a="tab" data-k="${k}">${n} <span class="cnt">${L.filter(o=>o.etapa===k).length}</span></button>`).join('')}</div>
  ${q?`<p class="mut">${L.length} resultado(s) para «${esc(q)}»</p>`:''}
  <div class="kan">${ETAPAS.map(([k,n,c])=>{const C=L.filter(o=>o.etapa===k);return`<section class="col ${k===tab?'on':''}" data-drop="${k}" style="--c:${c}" aria-label="${n}"><h2 class="ch"><span>${n}</span><span class="cnt">${C.length}</span></h2><div class="cl">${C.map(card).join('')||'<p class="mut">Sin órdenes en esta etapa.</p>'}</div></section>`}).join('')}</div>`}
const ICU='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',ICC='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 4h6v3H9zM6 6h12v15H6zM9 12h6M9 16h6"/></svg>';
const bd=(c,i,t,n)=>`<span class="bd ${c}" title="${t}" role="img" aria-label="${t}">${i}${n?`<b>${n}</b>`:''}</span>`;
function card(o){const n=sig(o),b=n?puede(o,n):'',pend=o.lineas.filter(l=>l.st==='pend').length,ur=o.chk.filter(c=>c.e==='ur').length,np=o.inv.filter(i=>i.p).length,
  gf=FOTOS_GRAL.filter(x=>x[2]).every(x=>o.fotos[x[0]]&&src(o.fotos[x[0]]));
  return`<article class="card k" data-a="abrir" data-f="${o.folio}" tabindex="0" ${desk()?'draggable="true"':''} aria-label="Orden ${o.folio}">
  <div class="row sp wrap"><span class="fol">${esc(o.folio)}</span><span class="chip">${TIPOS[o.tipo]}</span></div>
  <div class="ki">${bd(o.cliente?'ok':'',ICU,o.cliente?'Cliente capturado':'Falta el cliente')}${bd(gf?'ok':'',IC.cam,gf?'Fotos generales completas':'Faltan fotos generales')}${bd(np===32?'ok':'',ICC,'Inventario '+np+'/32')}${ur?bd('al',IC.fa,ur+' urgente'+(ur>1?'s':''),ur):''}${pend?bd('wa',IC.at,pend+' por autorizar',pend):''}</div>
  <div class="kn">${esc(o.cliente||'Sin cliente')}</div><div class="kv">${esc(o.modelo||'Sin modelo')}${o.vin?' · '+esc(o.vin):''}</div><div class="kv">${esc(o.mec||'Sin técnico')}${o.bahia?' · Bahía '+o.bahia:''}</div>
  ${b?`<span class="chip w">${IC.at} ${b}</span>`:''}
  <div class="pg5" aria-hidden="true">${ETAPAS.map((e,i)=>`<i class="${i<=idx(o.etapa)?'d':''}"></i>`).join('')}</div>
  <div class="row"><button class="btn sm" style="flex:1" data-a="mv" data-f="${o.folio}">Mover a…</button>${n?`<button class="btn sm pri" style="flex:1" data-a="sig" data-f="${o.folio}">Siguiente: ${ETAPAS[idx(n)][1]}</button>`:`<button class="btn sm" style="flex:1" data-a="clon" data-f="${o.folio}">Clonar por garantía</button>`}</div></article>`}

const inp=(l,p,v,x='')=>`<label class="f">${l}<input data-p="${p}" value="${esc(v)}" ${x}></label>`;
const heroH=o=>{const f=o.fotos.g_frente&&src(o.fotos.g_frente);
  return(f?`<div class="hero"><img alt="Frente de la moto" src="${f}"></div>`:'')+`<div class="itbl"><div><span>Cliente</span><b>${esc(o.cliente||'—')}</b></div><div><span>Unidad</span><b>${esc(o.modelo||'—')}${o.vin?' · '+esc(o.vin):''}</b></div><div><span>Técnico</span><b>${esc(o.mec||'—')}${o.bahia?' · Bahía '+o.bahia:''}</b></div></div>`};
function drawer(o){const bad=o.chk.filter(c=>c.e==='px'||c.e==='ur').length,pend=o.lineas.filter(l=>l.st==='pend').length,e=ETAPAS[idx(o.etapa)];
  const T=[['u','Unidad',''],['i','Inspección',bad?`<span class="cnt">${bad}</span>`:''],['c','Cotización',pend?`<span class="cnt">${pend}</span>`:''],['z','Cierre','']];
  return`<div class="dov" data-a="cerrard"></div><aside class="dr" role="dialog" aria-modal="true" aria-label="Orden ${esc(o.folio)}">
  <header class="drh"><button class="ib" data-a="cerrard" aria-label="Cerrar orden">${IC.back}</button><span class="fol" style="font-size:18px">${esc(o.folio)}</span><span class="chip">${TIPOS[o.tipo]}</span><span class="chip" style="background:${e[2]};color:#fff">${e[1]}</span><span style="flex:1"></span>${adminReal()?`<button class="btn sm red" data-a="elim">Eliminar</button>`:''}<button class="btn sm" data-a="print">${IC.pr} Imprimir</button><button class="btn sm" data-a="mv" data-f="${o.folio}">Mover a…</button></header>
  <div class="dstep" aria-label="Proceso">${ETAPAS.map((x,i)=>`<span class="${i<idx(o.etapa)?'d':i===idx(o.etapa)?'c':''}" ${i===idx(o.etapa)?`style="--c:${x[2]}" aria-current="step"`:''}>${x[1]}</span>`).join('')}</div>
  <nav class="dtabs" role="tablist">${T.map(([k,n,c])=>`<button class="tab ${k===dt?'on':''}" role="tab" aria-selected="${k===dt}" data-a="dtab" data-k="${k}">${n} ${c}</button>`).join('')}</nav>
  <div class="dbody">${dt==='u'?'':heroH(o)}${{u:tU,i:tI,c:tC,z:tZ}[dt](o)}</div><footer class="dft">${foot(o)}</footer></aside>`}
function foot(o){const n=sig(o),b=n?puede(o,n):'';
  return`${b?`<div class="chip w" style="align-self:flex-start">${IC.at} ${b}</div>`:''}
  <div class="row">${n?`<button class="btn pri" data-a="sig" data-f="${o.folio}" ${b?'disabled':''}>Siguiente etapa: ${ETAPAS[idx(n)][1]}</button>`:`<button class="btn" data-a="clon" data-f="${o.folio}">Clonar por garantía</button>`}</div>`}

const gfotos=o=>{const n=FOTOS_GRAL.filter(x=>x[2]&&o.fotos[x[0]]&&src(o.fotos[x[0]])).length,r=FOTOS_GRAL.filter(x=>x[2]).length;
  return`<div class="card"><div class="row sp"><div class="h">Fotos generales de la moto</div><span class="chip ${n===r?'g':'w'}">${n}/${r} lados</span></div><div class="mut">Toma las fotos al recibir la unidad: sirven de evidencia de cómo llegó.</div>
  <div class="gfo">${FOTOS_GRAL.map(([k,t,rq])=>{const u=o.fotos[k]&&src(o.fotos[k]);return`<label class="gf ${u?'on':''}">${u?`<img alt="${t}" src="${u}">`:IC.cam}<span class="gt">${t}${rq?'':' (opcional)'}</span><input type="file" accept="image/*" capture="environment" data-foto="${k}" aria-label="Foto ${t}"></label>`}).join('')}</div></div>`};
function tU(o){return`<div class="card"><div class="h">Cliente</div><div class="g2">${inp('Cliente','cliente',o.cliente)}${inp('Teléfono (WhatsApp)','tel',o.tel,'type="tel" inputmode="tel"')}</div>${inp('Dirección','dir',o.dir)}</div>
  <div class="card"><div class="h">Datos del vehículo</div><div class="g2">${inp('Modelo','modelo',o.modelo)}${inp('Año','anio',o.anio,'inputmode="numeric"')}${inp('Serie / VIN','vin',o.vin)}${inp('Motor','motor',o.motor)}${inp('Kilometraje','km',o.km,'inputmode="numeric"')}${inp('Fecha de compra','fcompra',o.fcompra,'type="date"')}<label class="f">Combustible<select data-p="comb">${['','Reserva','1/4','1/2','3/4','Lleno'].map(x=>`<option ${o.comb===x?'selected':''}>${x}</option>`).join('')}</select></label></div>
  <div class="mut">¿Es garantía?</div><div class="seg" style="max-width:240px"><button class="${o.gar?'s-ok':''}" data-a="gar" data-k="1" aria-pressed="${!!o.gar}">Sí</button><button class="${!o.gar?'s-nr':''}" data-a="gar" data-k="0" aria-pressed="${!o.gar}">No</button></div>
  <label class="f">Motivo de ingreso<textarea data-p="motivo">${esc(o.motivo)}</textarea></label><label class="f">Condiciones en las que se recibe la unidad<textarea data-p="cond">${esc(o.cond)}</textarea></label>
  <div class="mut">Ingreso: ${new Date(o.fing).toLocaleString('es-MX')}${o.ref?' · Orden original: '+esc(o.ref):''}</div></div>
  ${gfotos(o)}`}

function firmaCard(o,k,t){const f=o.firmas[k],s=f&&src(f);
  return`<div class="card"><div class="row sp"><div class="h">${t}</div><span class="chip ${s?'g':'w'}">${s?IC.ok+' Firmada':'Pendiente'}</span></div>${k!=='entrega'?`<label class="f">Nombre<input data-p="firmas.${k}.n" value="${esc(f?.n||'')}"></label>`:''}${s?`<img class="pic" alt="Firma ${t}" src="${s}">`:''}<button class="btn" data-a="firma" data-k="${k}">${s?'Firmar de nuevo':'Capturar firma'}</button></div>`}
const asigH=o=>`<div class="card"><div class="h">Asignación en taller</div><div class="g2">${inp('Técnico asignado','mec',o.mec,'list="mecs"')}<label class="f">Bahía<select data-p="bahia"><option value="">—</option>${BAHIAS.map(b=>`<option ${String(o.bahia)===String(b)?'selected':''}>${b}</option>`).join('')}</select></label></div><datalist id="mecs">${[...new Set(S.orders.map(x=>x.mec).filter(Boolean))].map(m=>`<option value="${esc(m)}">`).join('')}</datalist></div>`;
function tI(o){const np=o.inv.filter(i=>i.p).length,fo=(k,t)=>`<div class="card"><div class="row sp"><div class="h">${t}</div><span class="chip ${o.fotos[k]?'g':'w'}">${o.fotos[k]?IC.ok+' Cargada':'Obligatoria'}</span></div>${o.fotos[k]?`<img class="pic" alt="${t}" src="${src(o.fotos[k])}">`:''}<label class="btn file">${IC.cam} ${o.fotos[k]?'Reemplazar foto':'Tomar foto'}<input type="file" accept="image/*" capture="environment" data-foto="${k}"></label></div>`;
  return asigH(o)+`<details class="card" ${np<32?'open':''}><summary class="row sp" style="cursor:pointer;min-height:44px"><span class="h">A. Inventario de recepción</span><span class="chip ${np===32?'g':'n'}">${np}/32</span></summary>
  <button class="btn" data-a="invall">${IC.ok} Todo completo (marcar los 32)</button><div class="g2">${INV32.map((n,i)=>{const x=o.inv[i];return`<div class="ir"><button class="tg ${x.p?'on':''}" data-a="inv" data-n="${i}" aria-pressed="${x.p}">${x.p?IC.ok:''}<span>${i+1}. ${n}</span></button><input aria-label="Cantidad de ${n}" inputmode="numeric" data-n data-p="inv.${i}.c" value="${x.c}"></div>`}).join('')}</div></details>
  <div class="h">B. Condición técnica</div><div class="lgd">${[['ur','Urgente'],['px','Próximo'],['ok','OK'],['nr','No revisado']].map(([e,t])=>`<span class="lgi lg-${e}"><i>${e==='nr'?'':CI[e]}</i>${t}</span>`).join('')}</div>
  ${CATS.map((c,i)=>{const k=o.chk[i];return`<div class="card"><div class="h">${i+1}. ${c[0]}</div><div class="mut">${c[1]}</div><div class="seg">${COND.map(([e,t,l])=>`<button class="${k.e===e?'s-'+e:''}" data-a="cond" data-i="${i}" data-e="${e}" aria-pressed="${k.e===e}" aria-label="${l}">${CI[e]} ${t}</button>`).join('')}</div>
   ${k.e==='px'||k.e==='ur'?`<label class="f">Nota técnica<textarea data-c="${i}">${esc(k.n)}</textarea></label>${k.f?`<img class="pic" alt="Evidencia ${c[0]}" src="${src(k.f)}">`:''}<div class="row wrap"><label class="btn file">${IC.cam} Foto<input type="file" accept="image/*" capture="environment" data-ffoto="${i}"></label><button class="btn" data-a="pc" data-i="${i}">Pasar a cotización</button></div>`:''}</div>`}).join('')}
  ${fo('bayoneta','Foto bayoneta / nivel de aceite')}${fo('tanque','Foto tanque / estado exterior')}`}

function lineaH(l,i){const mo=l.t==='mo',ic={pend:IC.at,aut:IC.ok,gar:IC.ok,rech:IC.fa}[l.st];
  return`<div class="qr st-${l.st}"><span class="qi" aria-hidden="true">${ic}</span>
  <div class="qo"><b>${mo?'Mano de obra':'Refacción'}</b><span class="fol sm">${esc(l.sku)}</span></div>
  <div class="qd"><div class="qdesc">${esc(l.desc)}</div>${l.f?`<img class="th" alt="Evidencia" src="${src(l.f)}">`:''}
   <div class="row wrap">${mo?`<label class="f" style="max-width:96px">Min<input data-n data-p="lineas.${i}.min" inputmode="numeric" value="${l.min||0}"></label>`:`<label class="f" style="max-width:90px">Cant.<input data-n data-p="lineas.${i}.cant" inputmode="numeric" value="${l.cant}"></label>`}<label class="f" style="max-width:130px">${mo?'Monto $':'Precio $'}<input data-n data-p="lineas.${i}.precio" inputmode="decimal" value="${l.precio}"></label></div>
   ${!Number(l.precio)&&l.st!=='gar'?`<span class="chip w">${IC.at} Sin precio</span>`:''}</div>
  <div class="qp"><b class="fol" id="imp-${i}">${money(imp(l))}</b></div>
  <div class="qa"><button class="qb ok ${l.st==='aut'?'on':''}" data-a="aut" data-i="${i}" data-k="aut" aria-pressed="${l.st==='aut'}">${IC.ok} Aceptar</button><button class="qb no ${l.st==='rech'?'on':''}" data-a="aut" data-i="${i}" data-k="rech" aria-pressed="${l.st==='rech'}">${IC.fa} Rechazar</button><button class="qb gr ${l.st==='gar'?'on':''}" data-a="aut" data-i="${i}" data-k="gar" aria-pressed="${l.st==='gar'}">Garantía</button><button class="qb del" data-a="dl" data-i="${i}" aria-label="Quitar ${esc(l.desc)}">${IC.fa}</button></div>
  ${l.st==='rech'?`<div class="qx g2"><label class="f">Motivo del rechazo<select data-p="lineas.${i}.mot"><option value="">Selecciona…</option>${MOTIVOS.map(m=>`<option ${l.mot===m?'selected':''}>${m}</option>`).join('')}</select></label><label class="f">Dar seguimiento el<input type="date" data-p="lineas.${i}.seg" value="${esc(l.seg||'')}"></label></div>`:''}</div>`}
const totH=o=>{const t=tot(o);return`<div class="row sp"><span>Cotizado</span><span class="fol">${money(t.cot)}</span></div><div class="row sp h"><span>Autorizado (a cobrar)</span><span class="fol">${money(t.aut)}</span></div><div class="row sp"><span>Garantía (sin cargo)</span><span class="fol">${money(t.gar)}</span></div><div class="row sp"><span>Pendiente de autorizar</span><span class="fol">${money(t.pend)}</span></div><div class="row sp"><span>Rechazado / diferido</span><span class="fol">${money(t.rech)}</span></div>`};
function tC(o){return`${o.lineas.length?`<div class="qt"><div class="qh"><span></span><span>Operación</span><span>Descripción</span><span>Precio</span><span>Autorización</span></div>${o.lineas.map(lineaH).join('')}</div>`:'<p class="mut">Sin conceptos. Agrega refacciones, mano de obra o pasa hallazgos desde Inspección.</p>'}
  <div class="card"><div class="h">Agregar</div><label class="f">Buscar SKU o refacción (catálogo)<input id="q2" autocomplete="off" placeholder="SKU, nombre o número de parte"></label><div id="sug" style="display:flex;flex-direction:column;gap:6px"></div><div class="row wrap"><button class="btn" data-a="mo">+ Mano de obra</button><button class="btn" data-a="manual">+ Concepto manual</button></div></div>
  <div class="card"><div class="h">Hallazgo adicional con foto</div><label class="f">Descripción<input id="hl"></label><div class="row"><label class="btn file">${IC.cam} Foto<input type="file" accept="image/*" capture="environment" id="hf"></label><button class="btn" data-a="hall">Agregar a cotización</button></div></div>
  <div class="card" id="tot">${totH(o)}</div>
  <div class="row wrap"><button class="btn amb" data-a="wa">Enviar visto bueno por WhatsApp</button><button class="btn" data-a="autall">Autorizar todo lo pendiente</button></div>
  <div class="cfg-g">Autorización del cliente</div>${firmaCard(o,'entrega','Firma del cliente (entrega la unidad)')}`}
function tZ(o){return`<div class="card"><div class="h">Entrega de la moto</div><button class="btn ${o.lav?'':'pri'}" data-a="lav" aria-pressed="${!!o.lav}">${o.lav?IC.ok+' Moto lavada (tocar para revertir)':'Marcar moto lavada'}</button><div class="mut">Requisito para pasar a Entregado.</div></div>
  <div class="card"><div class="h">Diagnóstico del técnico</div><label class="f"><span class="sr">Diagnóstico</span><textarea data-p="diag" style="min-height:110px">${esc(o.diag)}</textarea></label></div>
  <div class="card"><div class="h">Aviso legal</div><p style="margin:0;font-size:14px">${LEYENDA}</p><button class="btn ${o.leg?'':'pri'}" data-a="leg" aria-pressed="${!!o.leg}">${o.leg?IC.ok+' Cliente informado (tocar para revertir)':'El cliente fue informado'}</button></div>
  <div class="card"><div class="h">Quien recibe la unidad</div>${inp('Nombre del asesor','recibe',o.recibe)}</div>
  <div class="card"><div class="h">Próximo servicio</div><div class="g2">${inp('Fecha','prox.f',o.prox.f,'type="date"')}${inp('Kilometraje','prox.km',o.prox.km,'inputmode="numeric"')}</div></div>
  <div class="mut">${CERT}</div>${FIRMAS.map(([k,n])=>firmaCard(o,k,n)).join('')}
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
 tab:d=>{tab=d.k;renderMain()},view:d=>{view=d.v;render()},abrir:d=>{D=d.f;dt='u';keepSc=false;render()},cerrard:()=>{D=null;render()},dtab:d=>{dt=d.k;keepSc=false;renderDrawer()},
 cerrar:(d,e)=>{if(e.target.classList.contains('ov'))$('#modal').innerHTML=''},
 nueva:()=>{if(!S.suc)return acts.agpick();sheet('<div class="h">Tipo de orden</div>'+tipoBtns('crear'))},
 elim:()=>{if(!adminReal()||!D)return;sheet(`<div class="h">¿Eliminar la orden ${esc(D)}?</div><div class="mut">Se borra la orden y su cotización de la hoja del taller. Esta acción no se puede deshacer.</div><div class="row"><button class="btn" data-a="cmod">Cancelar</button><button class="btn red" data-a="elimok">Eliminar</button></div>`)},
 cmod:()=>{$('#modal').innerHTML=''},
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
 cond:d=>{const o=O(D);o.chk[+d.i].e=d.e;touch(o);renderDrawer()},
 pc:d=>{const o=O(D),c=o.chk[+d.i];o.lineas.push({t:'ref',sku:'HALLAZGO',desc:CATS[+d.i][0]+': '+(c.n||COND.find(x=>x[0]===c.e)[2]),cant:1,precio:0,min:0,st:o.tipo==='G'?'gar':'pend',f:c.f||null});touch(o);dt='c';keepSc=false;renderDrawer();toast('Agregado a la cotización: captura su precio')},
 firma:d=>abrirFirma(u=>{const o=O(D),f=o.firmas[d.k]||{};delete f.u;f.d=u;o.firmas[d.k]=f;touch(o);renderDrawer()}),
 dl:d=>{const o=O(D);o.lineas.splice(+d.i,1);touch(o);renderDrawer()},
 aut:d=>{const o=O(D),l=o.lineas[+d.i],k=(l.st===d.k&&d.k!=='pend')?'pend':d.k;l.st=k;if(k==='rech'){if(!l.seg)l.seg=addD(30)}else delete l.cerr;touch(o);renderDrawer()},
 autall:()=>{const o=O(D);o.lineas.forEach(l=>{if(l.st==='pend')l.st=o.tipo==='G'?'gar':'aut'});touch(o);renderDrawer()},
 manual:()=>{const s=prompt('Concepto');if(!s)return;const o=O(D);o.lineas.push({t:'ref',sku:'MANUAL',desc:s,cant:1,precio:0,min:0,st:o.tipo==='G'?'gar':'pend'});touch(o);renderDrawer()},
 mo:()=>{const s=prompt('Operación de mano de obra');if(!s)return;const o=O(D);o.lineas.push({t:'mo',sku:'MO',desc:s,cant:1,precio:0,min:0,st:o.tipo==='G'?'gar':'pend'});touch(o);renderDrawer()},
 add:d=>{const o=O(D),i=sug[+d.i];o.lineas.push({t:'ref',sku:i.sku,desc:i.nombre,cant:1,precio:i.precio,min:0,st:o.tipo==='G'?'gar':'pend'});touch(o);renderDrawer()},
 hall:()=>{const o=O(D),t=$('#hl').value.trim();if(!t)return toast('Describe el hallazgo');o.lineas.push({t:'ref',sku:'HALLAZGO',desc:t,cant:1,precio:0,min:0,st:o.tipo==='G'?'gar':'pend',f:window._hf||null});window._hf=null;touch(o);renderDrawer()},
 leg:()=>{const o=O(D);o.leg=!o.leg;touch(o);renderDrawer()},
 wa:()=>{const o=O(D),L=o.lineas.filter(l=>l.st!=='rech');if(!L.length)return toast('No hay conceptos que enviar');
  if(L.some(l=>!Number(l.precio)&&l.st!=='gar')&&!confirm('Hay conceptos sin precio. ¿Enviar de todos modos?'))return;
  wa(o.tel,`Hola ${o.cliente}, cotización ${o.folio} (${o.modelo}):\n`+L.map(l=>`• ${l.desc}${l.t==='mo'?'':' x'+l.cant}: ${l.st==='gar'?'garantía':money(imp(l))}`).join('\n')+`\n*Total: ${money(L.filter(l=>l.st!=='gar').reduce((a,l)=>a+imp(l),0))}*\nResponde "SÍ" para autorizar todo o indícanos qué conceptos autorizas.`)},
 walisto:()=>{const o=O(D);o.listo=true;touch(o);wa(o.tel,`Hola ${o.cliente}, tu ${o.modelo} (${o.folio}) está lista para entrega en ${o.suc}. Total a pagar: ${money(tot(o).aut)}.`)},
 cr:()=>{const o=O(D);if(o.t.ini){o.t.acum=ms(o);o.t.ini=null}else o.t.ini=Date.now();touch(o);renderDrawer();renderMain()},
 fin:()=>{const o=O(D);o.t.acum=ms(o);o.t.ini=null;touch(o);renderDrawer();renderMain();toast('Tiempo real: '+hms(o.t.acum)+(est(o)?' · estándar '+est(o)+' min':''))},
 clon:d=>{const o=O(d.f);$('#modal').innerHTML='';crear('G',{cliente:o.cliente,tel:o.tel,dir:o.dir,modelo:o.modelo,anio:o.anio,motor:o.motor,vin:o.vin,km:o.km,fcompra:o.fcompra,ref:o.folio,gar:true})},
 print:()=>imprimir(O(D)),
 sgwa:d=>{const o=O(d.f);wa(o.tel,d.k==='l'?`Hola ${o.cliente}, te escribimos de ${o.suc}. Quedó pendiente en tu ${o.modelo}: ${o.lineas[+d.i].desc}. ¿Lo programamos?`:`Hola ${o.cliente}, ya toca el siguiente servicio de tu ${o.modelo}${o.prox.km?' (a los '+o.prox.km+' km)':''}. ¿Te agendamos una cita en ${o.suc}?`)},
 sgre:d=>{const o=O(d.f),l=o.lineas[+d.i],v=prompt('Nueva fecha de seguimiento (AAAA-MM-DD)',l.seg||addD(15));if(v&&/^\d{4}-\d{2}-\d{2}$/.test(v)){l.seg=v;touch(o);renderMain()}},
 sgok:d=>{const o=O(d.f),l=o.lineas[+d.i];l.cerr=true;touch(o);crear('SR',{cliente:o.cliente,tel:o.tel,dir:o.dir,modelo:o.modelo,anio:o.anio,motor:o.motor,vin:o.vin,km:o.km,ref:o.folio,lineas:[Object.assign({},l,{st:'aut',cerr:false,mot:'',seg:''})]})},
 sgcita:d=>{const o=O(d.f);o.prox.cerr=true;touch(o);crear('SP',{cliente:o.cliente,tel:o.tel,dir:o.dir,modelo:o.modelo,anio:o.anio,motor:o.motor,vin:o.vin,km:o.km,ref:o.folio})},
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
  if(e.key==='Escape'){if($('#modal').innerHTML)$('#modal').innerHTML='';else if(D){D=null;render()}}});
document.addEventListener('input',e=>{const t=e.target;
  if(t.id==='gq'){q=t.value.trim();renderMain();return}
  const o=D&&O(D);if(!o)return;
  if(t.dataset.p){setPath(o,t.dataset.p,t.hasAttribute('data-n')?(parseFloat(String(t.value).replace(',','.'))||0):t.value);touch(o);
   if(t.dataset.p.startsWith('lineas.')){const i=t.dataset.p.split('.')[1],el=$('#imp-'+i);if(el&&o.lineas[i])el.textContent=money(imp(o.lineas[i]));const tt=$('#tot');if(tt)tt.innerHTML=totH(o)}}
  if(t.dataset.c){o.chk[+t.dataset.c].n=t.value;touch(o)}
  if(t.id==='q2'){const s=t.value.toLowerCase();sug=s.length<2?[]:S.inv.filter(i=>(i.sku+' '+i.nombre).toLowerCase().includes(s)).slice(0,6);
   $('#sug').innerHTML=sug.map((i,k)=>`<button class="btn" style="justify-content:space-between" data-a="add" data-i="${k}"><span>${esc(i.nombre)}<br><small class="fol">${esc(i.sku)}</small></span><span class="fol">${money(i.precio)}</span></button>`).join('')||(s.length>1?'<div class="mut">Sin resultados. Conecta el catálogo en Configuración o agrega un concepto manual.</div>':'')}});
document.addEventListener('change',async e=>{const t=e.target;
  if(t.id==='ftipo'){ft=t.value;renderMain();return}
  if(t.dataset.ag){agf[t.dataset.ag]=t.value;renderMain();return}
  const o=D&&O(D);if(!o||t.type!=='file'||!t.files[0])return;const d=await comprimir(t.files[0]);
  if(t.dataset.foto){o.fotos[t.dataset.foto]={d};touch(o);renderDrawer()}else if(t.dataset.ffoto){o.chk[+t.dataset.ffoto].f=d;touch(o);renderDrawer()}else if(t.id==='hf'){window._hf=d;toast('Foto lista: toca "Agregar a cotización"')}});
function comprimir(f,m=900,q=.65){return new Promise(r=>{const im=new Image,u=URL.createObjectURL(f);im.onload=()=>{const k=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);r(c.toDataURL('image/jpeg',q))};im.src=u})}
/* arrastrar y soltar: complemento en escritorio */
document.addEventListener('dragstart',e=>{const k=e.target.closest&&e.target.closest('.k');if(!k)return;dragF=k.dataset.f;e.dataTransfer.setData('text/plain',dragF);k.classList.add('dg')});
document.addEventListener('dragend',()=>{dragF=null;document.querySelectorAll('.dg,.over').forEach(x=>x.classList.remove('dg','over'))});
document.addEventListener('dragover',e=>{const c=e.target.closest&&e.target.closest('.col');if(c&&dragF){e.preventDefault();c.classList.add('over')}});
document.addEventListener('dragleave',e=>{const c=e.target.closest&&e.target.closest('.col');if(c)c.classList.remove('over')});
document.addEventListener('drop',e=>{const c=e.target.closest&&e.target.closest('.col');if(!c||!dragF)return;e.preventDefault();const o=O(dragF);dragF=null;document.querySelectorAll('.over').forEach(x=>x.classList.remove('over'));if(o&&c.dataset.drop!==o.etapa)mover(o,c.dataset.drop)});

function aplicarUrls(o,u){for(const k in u){const[a,b]=k.split('.');if(a==='fotos'&&o.fotos[b])o.fotos[b]={u:u[k]};else if(a==='firmas'&&o.firmas[b])o.firmas[b]={n:o.firmas[b].n,u:u[k]};else if(a==='chk'&&o.chk[b])o.chk[b].f=u[k];else if(a==='lineas'&&o.lineas[b])o.lineas[b].f=u[k]}}
async function sync(){if(!sesion||syncing||!tallerUrl()||!navigator.onLine)return;syncing=true;
  try{for(const f of [...(S.del||[])]){const r=await api.taller({action:'eliminarOrden',folio:f});if(r.success)S.del=S.del.filter(x=>x!==f)}
   for(const f of [...S.dirty]){const o=O(f);if(!o)continue;const u0=o.upd,r=await api.taller({action:'guardarOrden',orden:o});if(!r.success)break;aplicarUrls(o,r.urls||{});if(o.upd===u0)S.dirty=S.dirty.filter(x=>x!==f)}
   const r=await api.taller({action:'listarOrdenes'});if(r.success){let ch=false;(r.ordenes||[]).forEach(ro=>{if(!ro||!ro.folio||(S.del||[]).includes(ro.folio))return;migEt(ro);const l=O(ro.folio);if(!l){S.orders.push(ro);ch=true}else if((ro.upd||0)>(l.upd||0)&&!S.dirty.includes(l.folio)&&D!==l.folio){Object.assign(l,ro);ch=true}});if(ch)renderMain()}
   save()}catch{}syncing=false}
setInterval(sync,30000);addEventListener('online',sync);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
/* ---------- sesión, tema y mantenimiento (estilo REPORTEADOR) ---------- */
const SK='taller_sesion',APP_BUILD='Taller Carabela · v8 · 20-11-26';
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
async function cargaCat(quiet){if(!sesion)return;
  try{const r=await api.inventario(sesion.correo,sesion.token);if(!r.success){if(!quiet)toast(r.message||'Catálogo no disponible: vuelve a iniciar sesión');return}
    S.inv=(r.data||[]).map(i=>({sku:String(i.sku||i.SKU||i.Sku||i.Codigo||''),nombre:String(i.nombre||i.Nombre||i.Descripcion||i.Producto||''),precio:Number(i.precio||i.Precio||i.precioPublico||i.PrecioPublico||0)})).filter(i=>i.sku);save();if(!quiet)toast(S.inv.length+' productos cargados')}
  catch{if(!quiet)toast('Sin conexión al catálogo')}}
function migrarLeg(){if(S.suc)S.orders.forEach(o=>{if(LEG.includes(o.suc)){o.suc=S.suc;touch(o)}});save()}
function pintaHd(){const a=sesion?.agencia||'',el=$('#agn'),lg=$('#hlogo'),m=multi(a);
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
  S.orders=S.orders||[];S.dirty=S.dirty||[];S.inv=S.inv||[];S.seq=S.seq||{};S.del=S.del||[];S.orders.forEach(migEt);
  sesion=leerSes();aplicarTema();pintaLogin();aplicaAg();render();sync();if(sesion)cargaCat(true)});
