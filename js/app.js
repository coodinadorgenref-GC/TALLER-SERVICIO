const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const ETAPAS=[['recepcion','Recepción'],['diagnostico','Diagnóstico'],['cotizacion','Cotización'],['reparacion','Reparación'],['entregado','Entregado']];
const TIPOS={SC:'Cupón',SP:'Preventivo',SB:'Básico',SM:'Mayor',SR:'Reparación',G:'Garantía',DS:'Diagnóstico'};
const CATS=[['Motor y transmisión','Estado general y encendido'],['Sistema eléctrico y luces','Faro, direccionales, tablero, claxon'],['Frenos y suspensión','Manetas, amortiguadores, líquido'],['Neumáticos y rodamiento','Presión, desgaste, rines'],['Carrocería y estructura','Espejos, asiento, plásticos, escape'],['Niveles y seguridad','Combustible y niveles']];
const BASE=[['16510-39J00-000','Filtro de aceite',66],['99CMX-21050-P95','Aceite 20W50 0.946 L',126],['INSUMO BASICO','Insumo básico',50]];
const BAHIAS=[1,2,3],HORAS=[8,9,10,11,12,13,14,15,16,17];
const IC={ok:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',at:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M12 4l9 16H3zM12 10v4M12 17v1"/></svg>',fa:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',cam:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',back:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>'};
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}};
let S=load('taller_state',{orders:[],seq:{},dirty:[],mecs:[],inv:[]}),tab='recepcion',V={n:'board'},ag={f:'',v:'todos'},sug=[];
const save=()=>{try{localStorage.setItem('taller_state',JSON.stringify(S))}catch{toast('Memoria llena: sincroniza para liberar fotos')}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Number(n||0).toLocaleString('es-MX',{maximumFractionDigits:2});
const toast=t=>{const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',2800)};
const idx=e=>ETAPAS.findIndex(x=>x[0]===e),O=f=>S.orders.find(o=>o.folio===f);
const total=o=>(o.lineas||[]).reduce((a,l)=>a+l.cant*l.precio,0)+Number(o.mo.monto||0);
const ms=o=>o.t.acum+(o.t.ini?Date.now()-o.t.ini:0);
const hms=m=>{const s=Math.floor(m/1000);return[s/3600|0,s/60%60|0,s%60].map(x=>String(x).padStart(2,'0')).join(':')};
const touch=o=>{if(!S.dirty.includes(o.folio))S.dirty.push(o.folio);o.upd=Date.now();save()};

async function folio(t){
  try{const r=await api.taller({action:'siguienteFolio',tipo:t});if(r.folio)return r.folio}catch{}
  S.seq[t]=(S.seq[t]||0)+1;return t+'-'+String(S.seq[t]).padStart(4,'0')+'L'; // 'L' = folio local pendiente de reasignar
}
async function crear(t,x={}){
  const base=(t==='SP'||t==='SB'||t==='SC'),o=Object.assign({folio:await folio(t),tipo:t,etapa:'recepcion',cliente:'',tel:'',modelo:'',anio:'',vin:'',km:'',comb:'',motivo:'',
    mec:'',bahia:'',chk:CATS.map(()=>({e:'',n:'',f:null})),fotos:{},firma:null,hall:[],
    lineas:base?BASE.map(b=>({sku:b[0],desc:b[1],cant:1,precio:b[2]})):[],mo:{min:base?60:0,monto:t==='G'?0:base?200:0},aprobado:false,t:{acum:0,ini:null},cita:null,ref:'',cre:Date.now()},x);
  S.orders.unshift(o);touch(o);V={n:'det',f:o.folio};render();
}
function puede(o,dest){const i=idx(o.etapa),j=idx(dest);if(j<=i)return'';
  if(i===0&&!(o.fotos.bayoneta&&o.fotos.tanque))return'Faltan las 2 fotos obligatorias';
  if(i===0&&(!o.cliente||!o.modelo))return'Captura cliente y modelo';
  if(j>=3&&!o.aprobado)return'Falta aprobación del cliente';return''}
function mover(o,dest){const e=puede(o,dest);if(e)return toast(e);
  if(idx(o.etapa)===0&&idx(dest)>0&&!o.firma)return abrirFirma(u=>{o.firma={d:u};touch(o);mover(o,dest)});
  if(dest==='entregado'&&o.t.ini){o.t.acum=ms(o);o.t.ini=null}
  o.etapa=dest;touch(o);render();sync()}
const sig=o=>ETAPAS[idx(o.etapa)+1]?.[0];

function render(){
  $('#modal').innerHTML='';const a=$('#app');
  if(V.n==='det'&&O(V.f))a.innerHTML=det(O(V.f));else if(V.n==='ag')a.innerHTML=agenda();else a.innerHTML=board();
}
function board(){
  const L=S.orders.filter(o=>o.etapa===tab);
  return`<div class="tabs" role="tablist">${ETAPAS.map(([k,n])=>`<button class="tab ${k===tab?'on':''}" role="tab" data-a="tab" data-k="${k}">${n} <span class="cnt">${S.orders.filter(o=>o.etapa===k).length}</span></button>`).join('')}</div>
  <div class="body">${L.map(card).join('')||'<p class="mut">Sin órdenes en esta etapa.</p>'}</div>
  <div class="bar"><button class="btn" data-a="ag">Agenda</button><button class="btn amb" data-a="nueva">+ Nueva orden</button></div>`}
function card(o){const n=sig(o),b=n?puede(o,n):'';return`<div class="card"><div class="row sp"><span class="row"><span class="fol">${esc(o.folio)}</span><span class="chip">${TIPOS[o.tipo]}</span></span>${o.t.ini?'<span class="chip w">Cronómetro activo</span>':''}</div>
  <button class="h" style="all:unset;font-weight:600;font-size:16px;cursor:pointer" data-a="abrir" data-f="${o.folio}">${esc(o.modelo||'Sin modelo')} <span class="mut">${esc(o.vin)}</span></button>
  <div class="mut">${esc(o.cliente||'Sin cliente')} · ${esc(o.mec||'Sin mecánico')} · ${hms(ms(o))}${o.mo.min?' de '+o.mo.min+' min':''}</div>${b?`<span class="chip w">${b}</span>`:''}
  <div class="row"><button class="btn" data-a="mv" data-f="${o.folio}">Mover a…</button>${n?`<button class="btn pri" data-a="sig" data-f="${o.folio}" ${b&&!n?'disabled':''}>Siguiente: ${ETAPAS[idx(n)][1]}</button>`:`<button class="btn" data-a="clon" data-f="${o.folio}">Clonar por garantía</button>`}</div></div>`}

function inp(l,p,v,x=''){return`<label class="f">${l}<input data-p="${p}" value="${esc(v)}" ${x}></label>`}
function det(o){const n=sig(o),b=n?puede(o,n):'',dis=o.etapa==='entregado';
  const fo=(k,t)=>`<div class="card"><div class="h">${t} <span class="chip ${o.fotos[k]?'g':'w'}">${o.fotos[k]?'Cargada':'Obligatoria'}</span></div>${o.fotos[k]?`<img class="pic" alt="${t}" src="${o.fotos[k].d||o.fotos[k].u}">`:''}<label class="btn file">${IC.cam} ${o.fotos[k]?'Reemplazar':'Tomar foto'}<input type="file" accept="image/*" capture="environment" data-foto="${k}"></label></div>`;
  return`<div class="hd" style="top:56px;position:sticky"><button class="ib" data-a="home" aria-label="Volver">${IC.back}</button><span class="fol" style="flex:1">${esc(o.folio)}</span><span class="chip">${ETAPAS[idx(o.etapa)][1]}</span></div>
  <div class="body">
  <div class="card"><div class="h">Unidad y cliente</div><div class="row">${inp('Cliente','cliente',o.cliente)}${inp('WhatsApp','tel',o.tel,'inputmode="tel"')}</div><div class="row">${inp('Modelo','modelo',o.modelo)}${inp('Año','anio',o.anio,'inputmode="numeric"')}</div><div class="row">${inp('VIN / placa','vin',o.vin)}${inp('Km','km',o.km,'inputmode="numeric"')}</div>
   <div class="row"><label class="f">Combustible<select data-p="comb">${['','Reserva','1/4','1/2','3/4','Lleno'].map(x=>`<option ${o.comb===x?'selected':''}>${x}</option>`).join('')}</select></label>${inp('Mecánico','mec',o.mec)}</div>
   <label class="f">Motivo de ingreso<textarea data-p="motivo">${esc(o.motivo)}</textarea></label>${o.ref?`<div class="mut">Orden original: ${esc(o.ref)}</div>`:''}</div>
  <div class="h">Inspección de recepción</div>
  ${CATS.map((c,i)=>{const k=o.chk[i];return`<div class="card"><div class="h">${i+1}. ${c[0]}</div><div class="mut">${c[1]}</div><div class="seg">${[['ok','OK'],['at','Atención'],['fa','Falla']].map(([e,t])=>`<button class="${k.e===e?'s-'+e:''}" data-a="chk" data-i="${i}" data-e="${e}" aria-pressed="${k.e===e}">${IC[e]} ${t}</button>`).join('')}</div>
   ${k.e==='fa'?`<label class="f">Nota técnica<textarea data-c="${i}">${esc(k.n)}</textarea></label>${k.f?`<img class="pic" alt="Falla" src="${k.f}">`:''}<label class="btn file">${IC.cam} Foto de la falla<input type="file" accept="image/*" capture="environment" data-ffoto="${i}"></label>`:''}</div>`}).join('')}
  ${fo('bayoneta','Foto bayoneta / nivel de aceite')}${fo('tanque','Foto tanque / estado exterior')}
  <div class="card"><div class="h">Firma del cliente <span class="chip ${o.firma?'g':'w'}">${o.firma?'Firmada':'Pendiente'}</span></div>${o.firma?`<img class="pic" alt="Firma" src="${o.firma.d||o.firma.u}" style="background:#fff">`:''}<button class="btn" data-a="firma">${o.firma?'Firmar de nuevo':'Capturar firma'}</button></div>
  <div class="h">Cotización y hallazgos</div>
  <div class="card"><div class="h">Mano de obra</div><div class="row">${inp('Minutos estándar','mo.min',o.mo.min,'inputmode="numeric"')}${inp('Monto $','mo.monto',o.mo.monto,'inputmode="decimal"')}</div></div>
  <div class="card"><div class="h">Refacciones e insumos</div>${o.lineas.map((l,i)=>`<div class="row sp" style="border-top:1px solid #E9EEF6;padding-top:8px"><div style="flex:1"><div class="fol" style="font-size:13px">${esc(l.sku)}</div><div class="mut">${esc(l.desc)}</div></div><input aria-label="Cantidad" style="width:56px;min-height:44px;border:1px solid #94A3B8;border-radius:8px;text-align:center" inputmode="numeric" data-p="l.${i}.cant" value="${l.cant}"><input aria-label="Precio" style="width:84px;min-height:44px;border:1px solid #94A3B8;border-radius:8px;text-align:right;padding:0 6px" inputmode="decimal" data-p="l.${i}.precio" value="${l.precio}"><button class="ib" style="background:#FEE2E2;color:#7F1D1D;width:44px;height:44px" data-a="dl" data-i="${i}" aria-label="Quitar ${esc(l.sku)}">${IC.fa}</button></div>`).join('')}
   <label class="f">Buscar SKU o refacción (catálogo)<input id="q" autocomplete="off" placeholder="SKU, nombre o número de parte"></label><div id="sug"></div><button class="btn" data-a="manual">+ Concepto manual</button></div>
  <div class="card"><div class="h">Hallazgos adicionales</div>${o.hall.map((h,i)=>`<div class="mut">• ${esc(h.t)}</div>`).join('')}<label class="f">Descripción del hallazgo<input id="hl"></label><div class="row"><label class="btn file">${IC.cam} Foto<input type="file" accept="image/*" capture="environment" id="hf"></label><button class="btn" data-a="hall">Agregar</button></div></div>
  <div class="card"><div class="row sp"><span>Refacciones</span><span class="fol">${money(total(o)-o.mo.monto)}</span></div><div class="row sp"><span>Mano de obra</span><span class="fol">${money(o.mo.monto)}</span></div><div class="row sp h"><span>Total</span><span class="fol">${money(total(o))}</span></div></div>
  <button class="btn amb" data-a="wa">Enviar visto bueno por WhatsApp</button>
  <button class="btn ${o.aprobado?'':'pri'}" data-a="apr">${o.aprobado?'Cliente aprobó (tocar para revertir)':'Marcar aprobado por el cliente'}</button>
  <div class="row"><button class="btn" data-a="mv" data-f="${o.folio}">Mover a…</button>${n?`<button class="btn pri" data-a="sig" data-f="${o.folio}">Siguiente: ${ETAPAS[idx(n)][1]}</button>`:`<button class="btn" data-a="clon" data-f="${o.folio}">Clonar por garantía</button>`}</div>${b?`<span class="chip w">${b}</span>`:''}</div>
  ${dis?'':`<div class="bar" aria-label="Cronómetro"><span class="big" id="crono" style="flex:1;font-size:26px">${hms(ms(o))}</span><button class="btn ${o.t.ini?'amb':'pri'}" data-a="cr">${o.t.ini?'Pausar':'Iniciar'}</button><button class="btn" data-a="fin">Terminar</button></div>`}`}

function agenda(){const hoy=new Date().toISOString().slice(0,10),mecs=[...new Set(S.orders.map(o=>o.mec).filter(Boolean))];
  const L=(BAHIAS.map(b=>'B'+b)).concat(mecs);
  return`<div class="hd" style="top:56px;position:sticky"><button class="ib" data-a="home" aria-label="Volver">${IC.back}</button><span style="flex:1;font-weight:600">Agenda de hoy</span></div><div class="body"><label class="f">Filtrar por bahía o mecánico<select data-ag="1"><option value="">Todas</option>${L.map(x=>`<option ${ag.f===x?'selected':''}>${x}</option>`).join('')}</select></label>
  ${HORAS.map(h=>{const bs=BAHIAS.filter(b=>!ag.f||ag.f==='B'+b||S.orders.some(o=>o.cita&&o.cita.f===hoy&&o.cita.h===h&&o.cita.b===b&&o.mec===ag.f));
   return`<div class="row"><span class="fol" style="width:52px">${String(h).padStart(2,'0')}:00</span><div style="flex:1;display:flex;flex-direction:column;gap:4px">${bs.map(b=>{const o=S.orders.find(o=>o.cita&&o.cita.f===hoy&&o.cita.h===h&&o.cita.b===b);return o?`<button class="slot occ" data-a="abrir" data-f="${o.folio}">B${b} · ${esc(o.folio)} · ${esc(o.modelo)}</button>`:`<button class="slot" data-a="cita" data-h="${h}" data-b="${b}">B${b} · Libre</button>`}).join('')}</div></div>`}).join('')}</div>`}

function sheet(h){$('#modal').innerHTML=`<div class="ov" data-a="cerrar"><div class="sh" role="dialog">${h}</div></div>`}
const acts={
  tab:d=>{tab=d.k;render()},abrir:d=>{V={n:'det',f:d.f};render();scrollTo(0,0)},home:()=>{V={n:'board'};render()},ag:()=>{V={n:'ag'};render()},cerrar:(d,e)=>{if(e.target.classList.contains('ov'))$('#modal').innerHTML=''},
  nueva:()=>sheet('<div class="h">Tipo de orden</div>'+Object.entries(TIPOS).map(([k,v])=>`<button class="btn" data-a="crear" data-t="${k}"><span class="fol">${k}</span> ${v}</button>`).join('')),
  crear:d=>crear(d.t),cita:d=>sheet('<div class="h">Nueva cita '+d.h+':00 · B'+d.b+'</div>'+Object.entries(TIPOS).map(([k,v])=>`<button class="btn" data-a="crearc" data-t="${k}" data-h="${d.h}" data-b="${d.b}"><span class="fol">${k}</span> ${v}</button>`).join('')),
  crearc:d=>crear(d.t,{bahia:d.b,cita:{f:new Date().toISOString().slice(0,10),h:+d.h,b:+d.b}}),
  mv:d=>sheet('<div class="h">Mover a…</div>'+ETAPAS.map(([k,n])=>`<button class="btn ${O(d.f).etapa===k?'pri':''}" data-a="mvto" data-f="${d.f}" data-k="${k}">${n}</button>`).join('')),
  mvto:d=>{$('#modal').innerHTML='';mover(O(d.f),d.k)},sig:d=>{const o=O(d.f);mover(o,sig(o))},
  chk:d=>{const o=O(V.f);o.chk[d.i].e=d.e;touch(o);render()},firma:()=>abrirFirma(u=>{const o=O(V.f);o.firma={d:u};touch(o);render()}),
  dl:d=>{const o=O(V.f);o.lineas.splice(+d.i,1);touch(o);render()},
  manual:()=>{const o=O(V.f),s=prompt('Concepto');if(!s)return;o.lineas.push({sku:'MANUAL',desc:s,cant:1,precio:0});touch(o);render()},
  add:d=>{const o=O(V.f),i=sug[+d.i];o.lineas.push({sku:i.sku,desc:i.nombre,cant:1,precio:i.precio});touch(o);render()},
  apr:()=>{const o=O(V.f);o.aprobado=!o.aprobado;touch(o);render()},
  cr:()=>{const o=O(V.f);if(o.t.ini){o.t.acum=ms(o);o.t.ini=null}else o.t.ini=Date.now();touch(o);render()},
  fin:()=>{const o=O(V.f);o.t.acum=ms(o);o.t.ini=null;touch(o);render();toast('Tiempo real: '+hms(o.t.acum)+(o.mo.min?' · estándar '+o.mo.min+' min':''))},
  clon:d=>{const o=O(d.f);crear('G',{cliente:o.cliente,tel:o.tel,modelo:o.modelo,anio:o.anio,vin:o.vin,km:o.km,ref:o.folio,mo:{min:0,monto:0}})},
  wa:()=>{const o=O(V.f);if(!o.tel)return toast('Captura el WhatsApp del cliente');let t=o.tel.replace(/\D/g,'');if(t.length===10)t='52'+t;
    const m=`Hola ${o.cliente}, cotización ${o.folio} (${o.modelo}):\n`+o.lineas.map(l=>`• ${l.desc} x${l.cant}: ${money(l.cant*l.precio)}`).join('\n')+`\n• Mano de obra: ${money(o.mo.monto)}\n*Total: ${money(total(o))}*\nResponde "SÍ" para autorizar.`;
    open('https://wa.me/'+t+'?text='+encodeURIComponent(m),'_blank')},
  hall:async()=>{const o=O(V.f),t=$('#hl').value.trim();if(!t)return;o.hall.push({t,f:window._hf||null});window._hf=null;touch(o);render()},
  cfg:()=>sheet(`<div class="h">Configuración</div><label class="f">URL de API del taller (Apps Script)<input id="c-u" value="${esc(tallerUrl())}"></label><label class="f">Clave compartida<input id="c-k" value="${esc(localStorage.getItem('taller_clave')||'')}"></label><div class="h">Catálogo</div><label class="f">Correo<input id="c-m"></label><label class="f">PIN<input id="c-p" type="password" inputmode="numeric"></label><button class="btn" data-a="cat">Conectar catálogo</button><button class="btn pri" data-a="cfgok">Guardar</button>`),
  cfgok:()=>{localStorage.setItem('taller_api',$('#c-u').value.trim());localStorage.setItem('taller_clave',$('#c-k').value.trim());$('#modal').innerHTML='';sync()},
  cat:async()=>{try{const l=await api.login($('#c-m').value.trim(),$('#c-p').value.trim());if(!l.success)return toast(l.message||'Login rechazado');const r=await api.inventario($('#c-m').value.trim(),l.token);if(!r.success)return toast('Inventario no disponible');
    S.inv=(r.data||[]).map(i=>({sku:String(i.sku||i.SKU||i.Sku||i.Codigo||''),nombre:String(i.nombre||i.Nombre||i.Descripcion||i.Producto||''),precio:Number(i.precio||i.Precio||i.precioPublico||i.PrecioPublico||0)})).filter(i=>i.sku);save();toast(S.inv.length+' productos cargados')}catch{toast('Sin conexión al catálogo')}}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&acts[b.dataset.a])acts[b.dataset.a](b.dataset,e)});
document.addEventListener('input',e=>{const t=e.target,o=V.n==='det'&&O(V.f);
  if(t.dataset.p&&o){const p=t.dataset.p.split('.');let r=o;if(p[0]==='mo'){r=o.mo;r[p[1]]=t.value}else if(p[0]==='l'){const l=o.lineas[+p[1]];l[p[2]]=Number(t.value)||0}else o[p[0]]=t.value;touch(o)}
  if(t.dataset.c&&o){o.chk[+t.dataset.c].n=t.value;touch(o)}
  if(t.id==='q'){const q=t.value.toLowerCase();sug=q.length<2?[]:S.inv.filter(i=>(i.sku+' '+i.nombre).toLowerCase().includes(q)).slice(0,6);
    $('#sug').innerHTML=sug.map((i,k)=>`<button class="btn" style="justify-content:space-between" data-a="add" data-i="${k}"><span>${esc(i.nombre)}<br><small class="fol">${esc(i.sku)}</small></span><span class="fol">${money(i.precio)}</span></button>`).join('')||(q.length>1?'<div class="mut">Sin resultados. Conecta el catálogo en Configuración o agrega un concepto manual.</div>':'')}});
document.addEventListener('change',async e=>{const t=e.target,o=V.n==='det'&&O(V.f);
  if(t.dataset.ag){ag.f=t.value;render()}
  if(t.dataset.p==='comb'&&o){o.comb=t.value;touch(o)}
  if(t.type==='file'&&t.files[0]&&o){const d=await comprimir(t.files[0]);
    if(t.dataset.foto){o.fotos[t.dataset.foto]={d};touch(o);render()}else if(t.dataset.ffoto){o.chk[+t.dataset.ffoto].f=d;touch(o);render()}else if(t.id==='hf'){window._hf=d;toast('Foto lista: toca Agregar')}}});
function comprimir(f,m=900,q=.65){return new Promise(r=>{const im=new Image,u=URL.createObjectURL(f);im.onload=()=>{const k=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);r(c.toDataURL('image/jpeg',q))};im.src=u})}

let syncing=false;
async function sync(){if(syncing||!tallerUrl()||!navigator.onLine)return;syncing=true;
  try{for(const f of [...S.dirty]){const o=O(f);if(!o)continue;const r=await api.taller({action:'guardarOrden',orden:o});
    if(r.success){if(r.urls){for(const k in r.urls.fotos||{})if(o.fotos[k])o.fotos[k]={u:r.urls.fotos[k]};if(r.urls.firma&&o.firma)o.firma={u:r.urls.firma}}S.dirty=S.dirty.filter(x=>x!==f)}}save();}catch{}syncing=false}
setInterval(()=>{const c=$('#crono'),o=V.n==='det'&&O(V.f);if(c&&o)c.textContent=hms(ms(o))},1000);
setInterval(sync,30000);addEventListener('online',sync);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
render();
