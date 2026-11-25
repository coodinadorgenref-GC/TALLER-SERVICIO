const $=s=>document.querySelector(s);
const IC={ok:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',at:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M12 4l9 16H3zM12 10v4M12 17v1"/></svg>',fa:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',cam:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',back:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',clock:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',pr:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/></svg>'};
const CI={nr:'',ok:IC.ok,px:IC.at,ur:IC.fa};
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}};
let S=load('taller_v2',{orders:[],seq:{},dirty:[],inv:[],suc:''});
const migEt=o=>{if(o&&ETMIG[o.etapa])o.etapa=ETMIG[o.etapa];return normChk(o)};S.orders.forEach(migEt);
const ETAPAS_BASE=ETAPAS.map(e=>e.slice()),COLS_ET=[['#0369A1','Azul'],['#B45309','Ámbar'],['#7C3AED','Violeta'],['#0F766E','Verde azulado'],['#BE185D','Rosa'],['#475569','Gris']];
// v46: cada agencia tiene su propia configuración de columnas (S.etapasAg[AGENCIA]); S.etapasPend[AGENCIA] marca lo pendiente de subir
const agE=()=>{try{return String(S.suc||(sesion&&sesion.agencia)||'').replace(/\s+/g,' ').trim().toUpperCase()}catch{return''}};
const pendE=()=>{if(!S.etapasPend||typeof S.etapasPend!=='object')S.etapasPend={};return S.etapasPend};
const cfgE=()=>{const k=agE();S.etapasAg=S.etapasAg||{};
  if(S.etapasCfg){if(k&&!S.etapasAg[k]){S.etapasAg[k]=S.etapasCfg;if(S.etapasPend===true)S.etapasPend={};pendE()[k]=true}delete S.etapasCfg;if(S.etapasPend===true)S.etapasPend={}}
  if(!k)return{ren:{},extra:[]};
  const c=S.etapasAg[k]=S.etapasAg[k]||{};c.ren=c.ren||{};c.extra=c.extra||[];return c};
// Las 6 columnas base no se mueven ni se eliminan (solo se les puede cambiar el nombre); las personalizadas de cada agencia se colocan al inicio (después de Citas, que siempre es la primera) o después de la columna elegida, siempre antes de Entregado (que siempre es la última).
function aplicaEtapas(){const c=cfgE(),L=ETAPAS_BASE.map(e=>[e[0],c.ren[e[0]]||e[1],e[2],e[3]]);
  c.extra.forEach(x=>{const at=L.findIndex(e=>e[0]===x.a);let p=x.a==='^'?0:at<0?L.length-1:at+1;if(p>L.length-1)p=L.length-1;L.splice(p,0,[x.k,x.n,x.c||'#0369A1','Columna personalizada'])});
  ETAPAS.length=0;ETAPAS.push(...L)}
aplicaEtapas();
let sesion=null,tab='recepcion',view='board',D=null,dt='u',q='',ft='',agf={b:'',m:''},sug=[],keepSc=true,lastD=null,syncing=false,dragF=null;
const IDB={db:null,open(){return new Promise(r=>{try{const q=indexedDB.open('taller',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>{IDB.db=q.result;r(true)};q.onerror=()=>r(false)}catch{r(false)}})},
  get(k){return new Promise(r=>{try{const t=IDB.db.transaction('kv').objectStore('kv').get(k);t.onsuccess=()=>r(t.result);t.onerror=()=>r(undefined)}catch{r(undefined)}})},
  set(k,v){return new Promise((ok,no)=>{try{const tx=IDB.db.transaction('kv','readwrite');tx.objectStore('kv').put(v,k);tx.oncomplete=()=>ok(true);tx.onerror=()=>no(tx.error)}catch(e){no(e)}})}};
let svT=0,svErr=false;
const flush=()=>{clearTimeout(svT);if(IDB.db)IDB.set('S',S).then(()=>{svErr=false}).catch(()=>{if(!svErr)toast('No se pudo guardar en este dispositivo: sincroniza y libera espacio');svErr=true})};
const save=()=>{if(IDB.db){clearTimeout(svT);svT=setTimeout(flush,120)}else{try{localStorage.setItem('taller_v2',JSON.stringify(S))}catch{toast('Memoria llena: sincroniza para liberar fotos')}}};
addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Kilometraje con coma cada 3 cifras: 1500 → 1,500 · 112569 → 112,569. Solo deja dígitos (lo guardado ya viene formateado; los datos viejos se formatean al mostrarlos).
const fmtKm=v=>String(v??'').replace(/\D/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,',');
const money=n=>'$'+Number(n||0).toLocaleString('es-MX',{maximumFractionDigits:2});
const TI={ok:IC.ok,err:IC.at,inf:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 11v6M12 7h.01"/></svg>'};let askRes=null;
const toast=(t,tipo)=>{tipo=tipo||(/no se pudo|error|falta|inv[aá]lid|sin internet|memoria llena|captura|describe/i.test(t)?'err':/sincronizad|agregad|guardad|lista|copiad|enviad/i.test(t)?'ok':'inf');const e=$('#toast');e.innerHTML=`<div class="tt ${tipo}" role="${tipo==='err'?'alert':'status'}"><span class="ti">${TI[tipo]}</span><span class="tm">${esc(t)}</span><button class="tc" data-a="tcerrar" aria-label="Cerrar aviso">✕</button></div>`;e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',tipo==='err'?7000:3800)};
function ask(o){return new Promise(res=>{let d=$('#dlg');if(!d){d=document.createElement('div');d.id='dlg';document.body.appendChild(d)}askRes=res;const tp=o.tipo||'inf';
  d.innerHTML=`<div class="dov2" data-a="dno"><div class="dlg ${tp}" role="alertdialog" aria-modal="true" aria-labelledby="dlgt" data-a="dnop"><div class="dlgh"><span class="ti">${TI[tp]}</span><b id="dlgt">${esc(o.t)}</b></div>${o.m?`<p class="dlgm">${esc(o.m)}</p>`:''}${o.input?`<label class="f">${esc(o.input)}<input id="dlgi" type="${o.type||'text'}" value="${esc(o.def||'')}" autocomplete="off"></label>`:''}<div class="dlgb"><button type="button" class="btn" data-a="dno">${esc(o.no||'Cancelar')}</button><button type="button" class="btn pri" data-a="dsi">${esc(o.ok||'Aceptar')}</button></div></div></div>`;
  navSync();setTimeout(()=>($('#dlgi')||$('.dlg .btn.pri')).focus(),30)})}
function cerrarAsk(v){const d=$('#dlg');if(d)d.innerHTML='';const r=askRes;askRes=null;if(r)r(v);navSync()}
/* Botón Atrás del celular: cada capa abierta (orden, ventana, aviso, visor de fotos) es un paso del historial */
let NAVn=0,NAVskip=0,NAVlock=false;
function navLayers(){return(D?1:0)+(document.querySelector('#modal .ov')?1:0)+(document.querySelector('#dlg .dlg')?1:0)+(document.querySelector('#visor:not([hidden])')?1:0)}
function navSync(){if(NAVlock)return;const w=navLayers();if(w>NAVn){while(NAVn<w)history.pushState({taller:++NAVn},'')}else if(w<NAVn){const d=NAVn-w;NAVn=w;NAVskip++;history.go(-d)}}
function navCierraTope(){if($('#dlg .dlg')){cerrarAsk(null);return true}const v=$('#visor');if(v&&!v.hidden){cerrarVisor();return true}if($('#modal .ov')){$('#modal').innerHTML='';return true}if(D){D=null;render();return true}return false}
addEventListener('popstate',e=>{if(NAVskip>0){NAVskip--;return}const n=(e.state&&e.state.taller)||0;NAVlock=true;NAVn=n;let g=8;while(navLayers()>n&&g-->0&&navCierraTope());NAVlock=false;navSync()});
(function(){const ini=()=>{try{history.replaceState({taller:0},'')}catch{}const m=document.getElementById('modal');if(m)new MutationObserver(()=>navSync()).observe(m,{childList:true})};document.readyState==='loading'?addEventListener('DOMContentLoaded',ini):ini()})();
document.addEventListener('keydown',e=>{if(!$('#dlg .dlg'))return;if(e.key==='Escape')cerrarAsk(null);else if(e.key==='Enter'&&e.target.id==='dlgi'){e.preventDefault();cerrarAsk(e.target.value.trim())}});
const iso=(d=new Date())=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const addD=n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)};

/* ---------- Citas: viven en la Agenda (cualquier día); la columna Citas del Panel muestra las de hoy de la agencia ---------- */
const CT=()=>{S.citas=S.citas||[];S.cdirty=S.cdirty||[];return S.citas};
const conCita=o=>!!(o&&(o.conCita||o.citaId||o.cita));
const ctTouch=c=>{CT();c.upd=Date.now();if(!S.cdirty.includes(c.id))S.cdirty.push(c.id);save();syncSoon(4000)};
const ctNuevoId=()=>'CT'+Date.now().toString(36).toUpperCase()+Math.floor(Math.random()*1296).toString(36).toUpperCase().padStart(2,'0');
const sumD=(f,n)=>{const x=new Date(f+'T12:00:00');x.setDate(x.getDate()+n);return iso(x)};
const ctDia=f=>CT().filter(c=>c.suc===S.suc&&c.f===f&&c.est!=='cancel').sort((a,b)=>String(a.t).localeCompare(String(b.t)));
const ctHoy=()=>ctDia(iso());
const ctFecha=f=>{const d=new Date(f+'T12:00:00');return isNaN(d)?f:d.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})};
const ctMatch=c=>!q||[c.cliente,c.tel,c.marca,c.modelo,c.vin,c.nota].join(' ').toLowerCase().includes(String(q).toLowerCase());
const ctChip=c=>c.est==='llego'?`<span class="chip g">${IC.ok} Llegó</span>`:c.est==='no'?'<span class="chip r">No llegó</span>':'<span class="chip n">Programada</span>';
let agd=iso(),CTD=null;
function ctCard(c,ag){const hoy=c.f===iso(),btn=(a,t,x='')=>`<button class="btn sm ${x}" data-a="${a}" data-id="${esc(c.id)}">${t}</button>`;
  return`<article class="cita ${c.est}" aria-label="Cita de las ${esc(c.t)}: ${esc(c.cliente)}"><div class="row sp wrap"><b class="cth fol">${esc(c.t)}</b>${ctChip(c)}</div><div class="kn">${esc(c.cliente||'Sin nombre')}</div><div class="kv">${esc(ctMoto(c)||'Sin moto')} · ${esc(TIPOS[c.tipo]||c.tipo)}${c.mec?' · '+esc(c.mec):''}</div>${c.nota?`<div class="kv mut">${esc(c.nota)}</div>`:''}${c.tel?`<div class="kv">${esc(c.tel)}</div>`:''}
  <div class="row wrap">${c.est==='prog'?`<button class="btn sm pri" data-a="ctrecibir" data-id="${esc(c.id)}" ${hoy?'':'disabled title="Solo se recibe el día de la cita"'}>Recibir</button>`:''}${c.est==='llego'&&c.folio?`<button class="btn sm" data-a="abrir" data-f="${esc(c.folio)}">Abrir ${esc(c.folio)}</button>`:''}${c.est==='prog'||c.est==='no'?btn('ctedit',c.est==='no'?'Reprogramar':'Editar'):''}${ag&&c.est==='prog'?btn('ctwa','WhatsApp')+btn('ctno','No llegó')+btn('ctcancel','Cancelar cita'):''}</div></article>`}
function citaTab(np){return`<button class="tab ${tab==='citas'?'on':''}" role="tab" aria-selected="${tab==='citas'}" data-a="tab" data-k="citas">Citas <span class="cnt">${np}</span></button>`}
function citaCol(C,np){return`<section class="col ${tab==='citas'?'on':''}" style="--c:#CA8A04" aria-label="Citas de hoy"><h2 class="ch"><span>Citas de hoy</span><span class="cnt">${np}</span></h2><div class="cl">${C.map(c=>ctCard(c,false)).join('')}</div></section>`}
const CT_I=480,CT_F=1140,CT_N=(CT_F-CT_I)/15;
const ctMin=t=>{const m=/^(\d{2}):(\d{2})$/.exec(t||'');return m?+m[1]*60+ +m[2]:0};
const hm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const h12=m=>{const h=Math.floor(m/60);return String(h%12||12).padStart(2,'0')+':'+String(m%60).padStart(2,'0')+(h<12?' am':' pm')};
const ctMecs=()=>{const st=new Set(colDe('MECANICO',S.suc));mine().forEach(o=>o.mec&&st.add(o.mec));CT().forEach(c=>c.suc===S.suc&&c.mec&&st.add(c.mec));return[...st].filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'))};
const ctMoto=c=>[c.marca,c.modelo,c.anio].filter(Boolean).join(' ');
function agenda(){const hoy=iso(),d=agd,C=ctDia(d),L=mine(),mecs=ctMecs(),n=new Date(),nm=n.getHours()*60+n.getMinutes(),now=d===hoy&&nm>=CT_I&&nm<=CT_F?(nm-CT_I)/15:-1;
  const its=[...C.map(c=>({mec:c.mec||'',s:ctMin(c.t),dur:+c.dur||60,t:c.t,l1:c.cliente||'Cita',l2:ctMoto(c),est:c.est,a:c.est==='llego'&&c.folio?`data-a="abrir" data-f="${esc(c.folio)}"`:`data-a="ctedit" data-id="${esc(c.id)}"`})),
   ...L.filter(o=>o.cita&&o.cita.f===d&&!o.citaId).map(o=>({mec:o.mec||'',s:(+o.cita.h||8)*60,dur:60,t:hm((+o.cita.h||8)*60),l1:o.folio,l2:o.modelo||'',est:'ord',a:`data-a="abrir" data-f="${esc(o.folio)}"`}))];
  its.forEach(x=>{x.si=Math.max(0,Math.min(CT_N-1,Math.floor((x.s-CT_I)/15)));x.n=Math.max(1,Math.min(CT_N-x.si,Math.ceil(x.dur/15)))});
  const foco=now>=0?Math.max(0,Math.floor(now)):its.length?Math.min(...its.map(x=>x.si)):0;
  const fila=m=>{const I=its.filter(x=>(x.mec||'')===m).sort((a,b)=>a.s-b.s),lanes=[];I.forEach(x=>{let k=lanes.findIndex(e=>e<=x.si);if(k<0){k=lanes.length;lanes.push(0)}lanes[k]=x.si+x.n;x.k=k});
   return`<div class="tl-r" role="row" style="--ln:${Math.max(1,lanes.length)}"><div class="tl-n" role="rowheader" title="${m?esc(m):'Sin asignar'}"><span class="tl-nm">${m?esc(m):'Sin asignar'}</span><small>${m?I.length+' cita'+(I.length===1?'':'s'):'Sin técnico'}</small></div>${Array.from({length:CT_N},(_,i)=>`<button type="button" class="tl-s${i%4===0?' h':''}" style="grid-column:${i+2}" data-a="ctslot" data-t="${hm(CT_I+i*15)}" data-m="${esc(m)}" aria-label="Nueva cita ${m?esc(m)+' ':''}${h12(CT_I+i*15)}"></button>`).join('')}${I.map(x=>`<button type="button" class="tl-b ${x.est}" style="grid-column:${x.si+2}/span ${x.n};grid-row:${x.k+1}" ${x.a} title="${esc(x.t+' · '+x.l1+(x.l2?' · '+x.l2:''))}"><b>${esc(x.t)}</b><span>${esc(x.l1)}</span>${x.l2?`<small>${esc(x.l2)}</small>`:''}</button>`).join('')}</div>`};
  return`<div class="ph"><h2>Agenda</h2><div class="agd"><button class="btn sm" data-a="agdia" data-n="-1" aria-label="Día anterior">‹</button><button class="btn sm ${d===hoy?'pri':''}" data-a="agdia" data-n="0">Hoy</button><button class="btn sm" data-a="agdia" data-n="1" aria-label="Día siguiente">›</button><input type="date" data-agd value="${d}" aria-label="Fecha de la agenda"></div><button class="btn pri" data-a="ctnueva">+ Nueva cita</button></div>
  <p class="agt"><b>${esc(ctFecha(d))}</b> · ${C.length} cita${C.length===1?'':'s'}${d===hoy?'':' · programa citas de hoy o de días posteriores'}</p>
  <div class="tl-leg" aria-hidden="true"><span><i style="background:#0284C7"></i>Programada</span><span><i style="background:#059669"></i>Llegó</span><span><i style="background:#94A3B8"></i>No llegó</span><span class="mut">Toca un horario libre para agendar</span></div>
  <div class="tl" data-d="${d}" data-f="${foco}" role="table" aria-label="Agenda por técnico"><div class="tl-in" ${now>=0?`style="--now:${now}"`:''}>
   <div class="tl-hd" role="row"><div class="tl-c0" role="columnheader">Técnico</div>${Array.from({length:CT_N/4},(_,i)=>`<div class="tl-hh" style="grid-column:${2+i*4}/span 4" role="columnheader">${h12(CT_I+i*60)}</div>`).join('')}<div class="tl-hh tl-he" style="grid-column:${CT_N+2}" role="columnheader">${h12(CT_F)}</div>${Array.from({length:CT_N},(_,i)=>`<div class="tl-hm${i%4===0?' q':''}" style="grid-column:${i+2}" aria-hidden="true">${String((i%4)*15).padStart(2,'0')}</div>`).join('')}</div>
   ${[...mecs,''].map(fila).join('')}${now>=0?'<div class="tl-now" aria-hidden="true"></div>':''}</div></div>
  <h3 class="h" style="margin:14px 0 8px">Citas del día <span class="cnt">${C.length}</span></h3>${C.length?`<div class="sgg">${C.map(c=>ctCard(c,true)).join('')}</div>`:'<p class="mut">No hay citas para este día. Toca un horario libre o «Nueva cita».</p>'}`}
function agScroll(prev){const tl=document.querySelector('.tl');if(!tl)return;tl.scrollTop=0;tl.scrollLeft=prev!=null?prev:0}
const DURS=[[15,'15 min'],[30,'30 min'],[45,'45 min'],[60,'1 h'],[90,'1 h 30 min'],[120,'2 h'],[180,'3 h'],[240,'4 h']];
function ctForm(c){CTD=c;const hoy=iso(),nuevo=!CT().some(x=>x.id===c.id),mecs=ctMecs();if(c.mec&&!mecs.includes(c.mec))mecs.push(c.mec);
  sheet(`<div class="h">${nuevo?'Nueva cita':'Editar cita'}</div>
  <div class="g2"><label class="f">Fecha<input id="ct-f" type="date" min="${hoy}" value="${esc(c.f)}"></label><label class="f">Hora<input id="ct-t" type="time" step="900" min="08:00" max="18:45" value="${esc(c.t||'')}"></label></div>
  <label class="f">Tipo de servicio<select id="ct-tipo">${Object.entries(TIPOS).map(([k,v])=>`<option value="${k}" ${(c.tipo||'SP')===k?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
  <label class="f">Cliente (propietario)<input id="ct-cli" value="${esc(c.cliente||'')}" autocomplete="off"></label>
  <div class="g2"><label class="f">Teléfono (WhatsApp)<input id="ct-tel" type="tel" inputmode="tel" value="${esc(c.tel||'')}" autocomplete="off"></label><label class="f">Correo electrónico<input id="ct-mail" type="email" inputmode="email" value="${esc(c.email||'')}" autocomplete="off"></label></div>
  <label class="f">Serie / VIN <span class="mut">(si cuenta con ello)</span><input id="ct-vin" value="${esc(c.vin||'')}" maxlength="17" autocapitalize="characters" autocomplete="off"></label>
  <div class="g3"><label class="f">Marca<input id="ct-marca" value="${esc(c.marca||'')}" autocomplete="off"></label><label class="f">Modelo<input id="ct-mod" value="${esc(c.modelo||'')}" autocomplete="off"></label><label class="f">Año<input id="ct-anio" inputmode="numeric" maxlength="4" value="${esc(c.anio||'')}" autocomplete="off"></label></div>
  <label class="f">Nota<textarea id="ct-nota">${esc(c.nota||'')}</textarea></label>
  <div class="g2"><label class="f">Técnico <span class="mut">(opcional)</span><select id="ct-mec"><option value="">Sin asignar</option>${mecs.map(m=>`<option ${c.mec===m?'selected':''}>${esc(m)}</option>`).join('')}</select></label><label class="f">Duración estimada<select id="ct-dur">${DURS.map(([m,t])=>`<option value="${m}" ${(+c.dur||60)===m?'selected':''}>${t}</option>`).join('')}</select></label></div>
  <div class="row wrap"><button class="btn pri" style="flex:1" data-a="ctsave" data-id="${esc(c.id)}">Guardar cita</button></div>`)}
const repD0=()=>{const h=new Date();h.setHours(0,0,0,0);return rp.p==='hoy'?+h:rp.p==='7'?h-6*864e5:rp.p==='30'?h-29*864e5:rp.p==='mes'?+new Date(h.getFullYear(),h.getMonth(),1):0};
function repCita(L){const A=sesion?permitidas(sesion.agencia):[],d0=repD0(),hoy=iso(),
  C=CT().filter(c=>A.includes(c.suc)&&(!rp.ag||c.suc===rp.ag)&&(c.f<hoy||c.est!=='prog')&&+new Date(c.f+'T00:00:00')>=d0),
  cc=L.filter(conCita),sc=L.filter(o=>!conCita(o)),au=a=>money(a.reduce((t,o)=>t+tot(o).aut,0)),p=n=>(L.length?Math.round(n/L.length*100):0)+'%',
  pr=C.filter(c=>c.est!=='cancel'),ll=pr.filter(c=>c.est==='llego').length;
  return repTbl('Órdenes con cita y sin cita',['Origen','Órdenes','% del total','Autorizado'],[['Con cita',cc.length,p(cc.length),au(cc)],['Sin cita',sc.length,p(sc.length),au(sc)]])+(C.length?repTbl('Citas del periodo',['Estado','Citas'],[['Programadas',pr.length],['Llegaron',ll],['No llegaron',pr.length-ll],['Canceladas',C.length-pr.length]]):'')}
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

/* ---------- Panel v45: columnas y órdenes contraíbles, pin y alerta de orden parada (preferencias solo de este dispositivo) ---------- */
const UI=()=>{S.ui=S.ui||{};S.ui.col=S.ui.col||{};S.ui.cc=S.ui.cc||{};S.ui.pin=S.ui.pin||{};return S.ui};
const enEtapa=o=>{const h=o.hist||[];for(let i=h.length-1;i>=0;i--){const x=String(h[i].x||'');if(/^Etapa:|^Orden creada/.test(x))return h[i].t}return o.cre||o.fing||0};
const PARA=10,parMin=o=>o.etapa==='entregado'?0:Math.max(0,Math.floor((Date.now()-enEtapa(o))/6e4));
const parTxt=m=>m<60?m+' min':Math.floor(m/60)+' h '+String(m%60).padStart(2,'0')+' min';
const ICI='<svg class="ali" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#D92D20"/><path d="M12 6.5v7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.6" fill="#fff"/></svg>';
const ICP='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v5"/><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z"/></svg>';
const alertaH=(o,full)=>{const m=parMin(o);if(m<=PARA)return'';const t='Parada '+parTxt(m)+' en esta etapa';return`<span class="alr" title="${t}" role="img" aria-label="${t}">${ICI}${full?`<b>${parTxt(m)}</b>`:''}</span>`};
const wa=(tel,m)=>{let t=String(tel||'').replace(/\D/g,'');if(!t){toast('Captura el WhatsApp del cliente');return}if(t.length===10)t='52'+t;open('https://wa.me/'+t+'?text='+encodeURIComponent(m),'_blank')};

async function folio(t){try{const r=await api.taller({action:'siguienteFolio',tipo:t});if(r.folio)return r.folio}catch{}
  S.seq[t]=(S.seq[t]||0)+1;return t+'-'+String(S.seq[t]).padStart(4,'0')+'L'}
async function crear(t,x={}){
    const o=Object.assign({folio:await folio(t),tipo:t,etapa:'recepcion',suc:S.suc,lav:false,conCita:false,cliente:'',tel:'',dir:'',fcompra:'',modelo:'',marca:'',anio:'',motor:'',vin:'',placas:'',asesor:sesion?(sesion.nombre||sesion.correo||''):'',asesorRef:'',km:'',comb:'',gar:t==='G',motivo:'',cond:'',mec:'',bahia:'',
   inv:INV32.map(()=>({p:false,c:1})),chk:CATS.map(()=>({e:'nr',n:'',f:null})),fotos:{},firmas:{},recibe:'',diag:'',leg:false,
   lineas:[],
   t:{acum:0,ini:null},cita:null,ref:'',prox:{f:'',km:''},fing:Date.now(),cre:Date.now(),listo:false},x);
  logH(o,'Orden creada · '+TIPOS[t]);S.orders.unshift(o);touch(o);D=o.folio;dt='u';tab='recepcion';view='board';keepSc=false;render();sync();return o}

const vehFalta=o=>[['marca','Marca / fabricante'],['modelo','Modelo'],['anio','Año'],['vin','Serie / VIN'],['km','Kilometraje'],['comb','Combustible']].filter(([k])=>!String(o[k]||'').trim());
// Con el aviso "Faltan datos del vehículo" a la vista, marca en rojo el borde de cada campo que falta; se quita en cuanto se captura. También mantiene al día el aviso de abajo y el botón Siguiente.
function pintaFaltas(o){if(!o)return;const n=sig(o),b=n?puede(o,n):'',ks=o.etapa==='recepcion'&&/^Faltan datos del vehículo/.test(b)?vehFalta(o).map(x=>x[0]):[];
  ['marca','modelo','anio','vin','km','comb'].forEach(k=>document.querySelectorAll('#drawer [data-p="'+k+'"]').forEach(e=>{const m=ks.includes(k);e.classList.toggle('miss',m);if(m)e.setAttribute('aria-invalid','true');else e.removeAttribute('aria-invalid');const l=e.closest('label');if(l)l.classList.toggle('miss',m)}));
  const ft=document.querySelector('#drawer .dft');if(ft)ft.innerHTML=foot(o);
  const nb=document.querySelector('#drawer .drh .nxt');if(nb){nb.disabled=!!b;nb.title=b||'Siguiente etapa: '+(ETAPAS[idx(n)]||[])[1]}}
function puede(o,dest){normChk(o);const i=idx(o.etapa),j=idx(dest);if(j<i&&o.auth&&dest!=='taller')return'El cliente ya firmó la autorización: solo se puede regresar a Taller para trabajarlo';if(j<=i)return'';
  if(o.etapa==='recepcion'){autoMarca(o);
    const fv=vehFalta(o).map(x=>x[1]);
    if(!String(o.cliente||'').trim())return'Captura el cliente (Unidad)';
    if(fv.length)return'Faltan datos del vehículo: '+fv.join(', ');
    if(!nRecep(o))return'Faltan las fotos de ingreso: en Daños y detalles marca un punto, elige Recepción y toma las fotos'}
  if(j>=idx('taller')&&!o.mec)return'Asigna el técnico en Unidad › Asignación en taller';
  if(j>=idx('taller')&&!(o.chk[12]&&fotosK(o.chk[12]).some(u=>src(u))))return'Falta la foto de la bayoneta / drenado de aceite (Inspección › Motor y combustible)';
  if(j>=idx('taller')){const f=[];o.chk.forEach((c,k)=>{if(c.e==='nr')f.push(CATS[k][0])});o.llantas.forEach(l=>{if(l.e==='nr'||!l.med||!l.des||!l.psi)f.push('llanta '+l.p.toLowerCase())});if(f.length)return'Falta clasificar (azul) o capturar en Inspección: '+f.join(', ')}
  const L=o.lineas;
  if(j>=idx('cotizacion')){if(!L.length)return'Agrega la cotización';if(L.some(l=>l.st==='pend'))return'Hay conceptos pendientes de autorización'}
  if(dest==='entregado'&&i<idx('lavado')&&!o.lav)return'La moto debe pasar por Lavado antes de entregarse';
  return''}
/* ---------- Avisos con sonido cuando cambia la etapa de una orden (también en las demás pantallas con la app abierta) ---------- */
let AC=null,sndArmed=false;
const unlockAudio=()=>{try{if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(C)AC=new C()}if(AC&&AC.state==='suspended')AC.resume()}catch{}};
['pointerdown','click','keydown','touchstart'].forEach(ev=>addEventListener(ev,unlockAudio,{passive:true}));
const sndOn=()=>UI().snd!==false;
function beep(fin){if(!sndOn())return;unlockAudio();if(!AC)return;if(AC.state!=='running'){try{AC.resume().then(()=>{if(AC.state==='running')beep(fin)}).catch(()=>{})}catch{}return}const t=AC.currentTime,N=fin?[659,880,1175]:[784,988];
  N.forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain(),t0=t+i*.16;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(.28,t0+.02);g.gain.exponentialRampToValueAtTime(.0001,t0+.3);o.connect(g);g.connect(AC.destination);o.start(t0);o.stop(t0+.32)});
  try{navigator.vibrate&&navigator.vibrate(90)}catch{}}
function avisaCambios(L){if(!sndArmed||!L.length)return;const e=k=>(ETAPAS[idx(k)]||[0,k])[1];
  beep(L.some(c=>c.e==='entregado'));
  toast(L.length===1?(L[0].nuevo?'Nueva orden '+L[0].f+' en '+e(L[0].e):L[0].f+' pasó a '+e(L[0].e)):L.length+' órdenes cambiaron de etapa','i')}
const logH=(o,x)=>{(o.hist=o.hist||[]).push({t:Date.now(),u:(sesion&&(sesion.nombre||sesion.correo))||'',x})};
function mover(o,dest){const e=puede(o,dest);if(e)return toast(e);
  if(o.etapa==='recepcion'&&dest!=='recepcion'&&!o.firmas.entrega)return abrirFirma(u=>{o.firmas.entrega={d:u};touch(o);mover(o,dest)});
  if(dest==='entregado'){o.lav=true;if(o.t.ini){o.t.acum=ms(o);o.t.ini=null}}
  logH(o,'Etapa: '+ETAPAS[idx(dest)][1]);o.etapa=dest;touch(o);tab=dest;render();beep(dest==='entregado');sync()}

/* ---------- render ---------- */
function render(){
  if(view==='rep'&&!puedeRep())view='board';
  document.querySelectorAll('.vn button').forEach(b=>b.classList.toggle('on',b.dataset.v===view));pintaHd();
  renderMain();renderDrawer();navSync()}
function renderMain(){const old=document.querySelector('.tl'),sl=old&&old.dataset.d===agd?old.scrollLeft:null,kn=document.querySelector('.kan'),ks=kn?kn.scrollLeft:0;$('#app').innerHTML=view==='ag'?agenda():view==='seg'?seguimientos():view==='rep'&&puedeRep()?reporte():board();if(view==='ag')agScroll(sl);const k2=document.querySelector('.kan');if(k2&&ks)k2.scrollLeft=ks;ajustaKan()}
function ajustaKan(){const k=document.querySelector('.kan');if(!k)return;if(!desk()){k.style.height='';return}k.style.height=Math.max(260,innerHeight-(k.getBoundingClientRect().top+scrollY)-12)+'px';const ex=document.documentElement.scrollHeight-innerHeight;if(ex>0)k.style.height=Math.max(260,k.clientHeight-ex)+'px'}
function renderDrawer(){const el=$('#drawer'),o=D&&O(D),sc=el.querySelector('.dscroll')?.scrollTop||0;
  el.innerHTML=o?drawer(o):'';document.body.classList.toggle('lock',!!o);
  if(o){const b=el.querySelector('.dscroll');if(b&&keepSc)b.scrollTop=sc;if(lastD!==D)el.querySelector('.drh .ib')?.focus()}
  if(o)el.querySelector('.dtabs .tab.on')?.scrollIntoView({inline:'center',block:'nearest'});
  if(o)pintaFaltas(o);
  lastD=D;keepSc=true}
const match=o=>{if(ft&&o.tipo!==ft)return false;if(!q)return true;const s=[o.folio,o.cliente,o.modelo,o.vin,o.placas,o.tel,o.motor].join(' ').toLowerCase();return q.toLowerCase().split(/\s+/).every(w=>s.includes(w))};
function board(){const L=mine().filter(match),C=ctHoy().filter(ctMatch),np=C.filter(c=>c.est==='prog').length;
  return`<div class="tabs" role="tablist" aria-label="Etapas">${citaTab(np)}${ETAPAS.map(([k,n])=>`<button class="tab ${k===tab?'on':''}" role="tab" aria-selected="${k===tab}" data-a="tab" data-k="${k}">${n} <span class="cnt">${L.filter(o=>o.etapa===k).length}</span></button>`).join('')}</div>
  ${q?`<p class="mut">${L.length} resultado(s) para «${esc(q)}»</p>`:''}
  <div class="kan" ${desk()?`style="grid-template-columns:minmax(250px,1fr) ${ETAPAS.map(([k])=>UI().col[k]?'84px':'minmax(250px,1fr)').join(' ')}"`:''}>${citaCol(C,np)}${ETAPAS.map(([k,n,c])=>{const U=UI(),cx=desk()&&!!U.col[k],C=L.filter(o=>o.etapa===k).sort((a,b)=>(U.pin[b.folio]?1:0)-(U.pin[a.folio]?1:0));return`<section class="col ${k===tab?'on':''}${cx?' cx':''}" data-drop="${k}" style="--c:${c}" aria-label="${n}"><h2 class="ch" title="${n}"><span>${n}</span><span class="cnt">${C.length}</span><button type="button" class="kb cb" data-a="ccol" data-k="${k}" aria-expanded="${!cx}" aria-label="${cx?'Expandir':'Contraer'} columna ${n}" title="${cx?'Expandir':'Contraer'} columna"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${cx?'M9 6l6 6-6 6':'M15 6l-6 6 6 6'}"/></svg></button></h2><div class="cl">${cx?C.map(o=>`<button type="button" class="mini${U.pin[o.folio]?' pn':''}" data-a="abrir" data-f="${esc(o.folio)}" draggable="true" title="${esc(o.folio+' · '+(o.cliente||'Sin cliente'))}">${esc(o.folio)}</button>`).join(''):C.map(card).join('')}</div></section>`}).join('')}</div>`}
const ICU='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',ICC='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 4h6v3H9zM6 6h12v15H6zM9 12h6M9 16h6"/></svg>';
const bd=(c,i,t,n)=>`<span class="bd ${c}" title="${t}" role="img" aria-label="${t}">${i}${n?`<b>${n}</b>`:''}</span>`;
function card(o){const n=sig(o),b=n?puede(o,n):'',pend=o.lineas.filter(l=>l.st==='pend').length,ur=o.chk.filter(c=>c.e==='ur').length,np=o.inv.filter(i=>i.p).length,
  gf=nRecep(o)>0,U=UI(),cc=!!U.cc[o.folio],pn=!!U.pin[o.folio];
  return`<article class="card k${cc?' cc':''}${pn?' pn':''}" data-a="abrir" data-f="${o.folio}" tabindex="0" ${desk()?'draggable="true"':''} aria-label="Orden ${o.folio}">
  <div class="row kh"><span class="fol">${esc(o.folio)}</span><span class="kc"><button type="button" class="kb pb${pn?' on':''}" data-a="pin" data-f="${esc(o.folio)}" aria-pressed="${pn}" aria-label="${pn?'Quitar la orden fijada':'Fijar la orden'}" title="${pn?'Quitar fijado':'Fijar orden'}">${ICP}</button><button type="button" class="kb xb" data-a="ccard" data-f="${esc(o.folio)}" aria-expanded="${!cc}" aria-label="${cc?'Expandir':'Contraer'} la orden" title="${cc?'Expandir':'Contraer'} orden"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button></span></div>
  <div class="row wrap kch"><span class="chip">${TIPOS[o.tipo]}</span>${conCita(o)?'<span class="chip g">Con cita</span>':''}</div>
  <div class="ki">${bd(o.cliente?'ok':'',ICU,o.cliente?'Cliente capturado':'Falta el cliente')}${bd(gf?'ok':'',IC.cam,gf?'Fotos de ingreso tomadas':'Faltan fotos de ingreso')}${bd(np===32?'ok':'',ICC,'Inventario '+np+'/32')}${ur?bd('al',IC.fa,ur+' urgente'+(ur>1?'s':''),ur):''}${pend?bd('wa',IC.at,pend+' por autorizar',pend):''}${o.auth?bd('ok',IC.ok,'El cliente autorizó desde el enlace'):''}${o.espRef?bd('wa',IC.at,'Esperando refacciones'):''}${o.ret?bd('al',IC.fa,'Orden retrasada'):''}${alertaH(o,!cc)}</div>
  <div class="kn">${esc(o.cliente||'Sin cliente')}</div><div class="kv">${esc([o.marca,o.modelo].filter(Boolean).join(' ')||'Sin modelo')}${o.anio?' '+esc(o.anio):''}</div>${o.placas?`<div class="kv pl">${esc(o.placas)}</div>`:''}<div class="kv">${esc(o.mec||'Sin técnico')}${o.bahia?' · Bahía '+o.bahia:''}</div>
  ${b?`<span class="chip w">${IC.at} ${b}</span>`:''}</article>`}

const inp=(l,p,v,x='')=>`<label class="f">${l}<input data-p="${p}" value="${esc(v)}" ${x}></label>`;
const heroH=o=>{const f=heroSrc(o);
  return(f?`<div class="hero"><img alt="Foto de ingreso" src="${f}" data-a="zoom"></div>`:'')+`<div class="itbl"><div><span>Cliente</span><b>${esc(o.cliente||'—')}</b></div><div><span>Unidad</span><b>${esc(o.modelo||'—')}${o.vin?' · '+esc(o.vin):''}${o.placas?' · '+esc(o.placas):''}</b></div><div><span>Técnico</span><b>${esc(o.mec||'—')}${o.bahia?' · Bahía '+o.bahia:''}</b></div></div>`};
const vinOk=o=>{const v=String(o.vin||'').toUpperCase().replace(/\s+/g,'');return /^[A-HJ-NPR-Z0-9]{17}$/.test(v)};
const vokH=o=>`<span class="vok${vinOk(o)?' on':''}" role="img" aria-label="Serie de 17 caracteres capturada" title="Serie de 17 caracteres capturada"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>`;
const ICN='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 6l6 6-6 6M12 6l6 6-6 6"/></svg>',ICD='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const sm=(c,n,t)=>n?`<span class="sm ${c}" title="${t}">${n}</span>`:'';
function drawer(o){if(o.tipo==='G'&&!o.gar)o.gar=true;const e=ETAPAS[idx(o.etapa)],nx=sig(o),nb=nx?puede(o,nx):'',cn=x=>o.chk.filter(c=>c.e===x).length,ln=x=>(o.llantas||[]).filter(l=>l.e===x).length,
  nd=(o.danos||[]).filter(d=>d.t!==REC).length,pa=o.lineas.filter(l=>l.st==='pend').length,au=o.lineas.filter(l=>l.st==='aut'||l.st==='gar').length;
  const T=[['u','Cliente y unidad',''],['ga','Garantía',o.tipo==='G'?sm('r',garFalta(o),'Pendientes del formato'):sm('a',garsDe(o).length,'Garantías ligadas')],['i','Inspección',sm('r',cn('ur'),'Urgentes')+sm('a',cn('px'),'Próximos')],['l','Llantas',sm('r',ln('ur'),'Urgentes')+sm('a',ln('px'),'Próximas')],['r','Carrocería',sm('n',nd,'Daños marcados')],['c','Cotización',sm('g',au,'Autorizados')+sm('a',pa,'Por autorizar')],['h','Historial','']];
  return`<div class="dov" data-a="cerrard"></div><aside class="dr" role="dialog" aria-modal="true" aria-label="Orden ${esc(o.folio)}">
  <header class="drh"><button class="btn sm" data-a="cerrard" aria-label="Volver al panel general">${IC.back}<span> Panel</span></button><span class="fol" style="font-size:18px">${esc(o.folio)}</span><span class="chip">${TIPOS[o.tipo]}</span><span class="chip" style="background:${e[2]};color:#fff">${e[1]}</span>${nx?`<span class="split"><button class="btn sm nxt" data-a="sig" data-f="${o.folio}" ${nb?'disabled':''} title="${esc(nb||'Siguiente etapa: '+ETAPAS[idx(nx)][1])}">Siguiente ${ICN}</button><button class="btn sm nxd" data-a="mvmenu" aria-haspopup="menu" aria-expanded="false" data-f="${o.folio}" aria-label="Mover a otra etapa" title="Mover a otra etapa">${ICD}</button></span>`:''}<span style="flex:1"></span>${adminReal()?`<button class="btn sm red" data-a="elim">Eliminar</button>`:''}<button class="btn sm" data-a="print" aria-label="Imprimir">${IC.pr}<span class="bt"> Imprimir</span></button>${nx?'':`<span class="mvw"><button class="btn sm" data-a="mvmenu" aria-haspopup="menu" aria-expanded="false" data-f="${o.folio}">Mover a… ${ICD}</button></span>`}</header>
  <div class="dscroll">${dhead(o)}
  <nav class="dtabs" role="tablist">${T.map(([k,n,c])=>`<button class="tab ${k===dt?'on':''}" role="tab" aria-selected="${k===dt}" data-a="dtab" data-k="${k}">${n} ${c}</button>`).join('')}</nav>
  <div class="dbody">${dt==='u'?'':heroH(o)}${({u:tU,ga:tGa,i:x=>garBan(x)+tI(x),l:tL,r:tR,c:tC,h:tH}[dt]||tU)(o)}</div></div><footer class="dft">${foot(o)}</footer></aside>`}
// Encabezado compacto de la orden (solo computadora): cliente y unidad a la izquierda, datos de la orden al centro, equipo a la derecha.
const fld=(n,l,p,v,x='')=>`<label class="f s${n}">${l}<input data-p="${p}" value="${esc(v)}" ${x}></label>`;
function dhead(o){autoMarca(o);autoModelo(o);const rec=o.etapa==='recepcion',ro=(n,l,v)=>`<div class="f s${n}"><span>${l}</span><div class="ro">${v}</div></div>`;
  return`<section class="dhead" aria-label="Datos de la orden">
  <div class="dz za">${fld(2,'Cliente (propietario)','cliente',o.cliente)}${fld(2,'Teléfono (WhatsApp)','tel',o.tel,'type="tel" inputmode="tel"')}${fld(2,'Correo electrónico','email',o.email,'type="email" inputmode="email" autocomplete="off" autocapitalize="off"')}
   ${fld(2,'Marca','marca',o.marca,'list="marcas" autocomplete="off"')}${fld(2,'Modelo','modelo',o.modelo)}${fld(1,'Año','anio',o.anio,'inputmode="numeric"')}${fld(1,'Km','km',fmtKm(o.km),'inputmode="numeric" autocomplete="off"')}
   ${fld(2,'<span class="vl">Serie / VIN'+vokH(o)+'</span>','vin',o.vin,'autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="17" style="text-transform:uppercase"')}${fld(2,'Placas','placas',o.placas,'autocapitalize="characters" autocomplete="off" spellcheck="false" style="text-transform:uppercase"')}${fld(2,'Quién trae la moto','trae',o.trae,'placeholder="Vacío = el propietario"')}
   <div class="mut s6 vinh">${vinH(o)}</div><div class="mut s6 vinb">${vinB(o)}</div><div class="s6 motoSug">${sugH(o)}</div></div>
  <div class="dz zb">${ro(2,'Tipo de servicio',esc(TIPOS[o.tipo]))}${ro(1,'Ingreso',esc(new Date(o.fing).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})))}
   <label class="f s1">Promesa de entrega<input type="datetime-local" data-p="prom" value="${esc(o.prom||'')}"></label>
   <label class="f s1">Combustible<select data-p="comb">${['','Reserva','1/4','1/2','3/4','Lleno'].map(x=>`<option ${o.comb===x?'selected':''}>${x}</option>`).join('')}</select></label>
   <div class="f s1"><span>¿Es garantía?</span><div class="seg"><button class="${o.gar?'s-ok':''}" data-a="gar" data-k="1" aria-pressed="${!!o.gar}">Sí</button><button class="${!o.gar?'s-nr':''}" data-a="gar" data-k="0" aria-pressed="${!o.gar}">No</button></div></div></div>
  <div class="dz zc">${fld(1,'Asesor de servicio','asesor',o.asesor,'list="ass"')}${rec?ro(1,'Técnico principal',o.mec?'<b>'+esc(o.mec)+'</b>':'<span class="sa">Sin asignar</span> <small>(lo asigna el jefe de taller)</small>'):fld(1,'Técnico principal','mec',o.mec,'list="mecs"')}
   ${fld(1,'Asesor de refacciones','asesorRef',o.asesorRef,'list="asr"')}${fld(1,'Recibe la unidad','recibe',o.recibe,'placeholder="Quién la recibe"')}
   <div class="tgs s2"><button class="tgl ${o.espRef?'on':''}" role="switch" aria-checked="${!!o.espRef}" data-a="tgl" data-k="espRef"><i></i>Esperando refacciones</button><button class="tgl ${o.ret?'on':''}" role="switch" aria-checked="${!!o.ret}" data-a="tgl" data-k="ret"><i></i>Orden retrasada</button></div></div>
  <datalist id="marcas">${MARCAS.map(m=>`<option value="${m}">`).join('')}</datalist>${dlColab('ass','ASESOR DE SERVICIO',o)}${dlColab('asr','ASESOR DE REFACCIONES',o)}${dlColab('mecs','MECANICO',o)}</section>`}
function foot(o){const n=sig(o),b=n?puede(o,n):'';
  if(n&&!b)return'';
  return`${b?`<div class="chip w" style="align-self:flex-start">${IC.at} ${b}</div>`:''}${n?'':`<div class="row"><button class="btn" data-a="clonq" data-f="${o.folio}">Crear orden de garantía</button></div>`}`}

const gfotos=o=>{const n=nRecep(o);return`<div class="card"><div class="row sp"><div class="h">Carrocería</div><span class="chip ${n?'g':'w'}">${n?n+(n>1?' fotos':' foto')+' de ingreso':'Faltan fotos de ingreso'}</span></div>${danosH(o)}</div>`};
function tU(o){autoMarca(o);autoModelo(o);return`<div class="u-dup"><div class="card"><div class="h">Cliente</div><div class="g2">${inp('Cliente (propietario)','cliente',o.cliente)}${inp('Teléfono (WhatsApp)','tel',o.tel,'type="tel" inputmode="tel"')}</div>${inp('Dirección','dir',o.dir)}<div class="g2">${inp('Correo electrónico','email',o.email,'type="email" inputmode="email" autocomplete="off" autocapitalize="off"')}${inp('Quién trae la moto (si no es el propietario)','trae',o.trae,'placeholder="Vacío = la trae el propietario"')}</div><div id="motoSug">${sugH(o)}</div></div>
  <div class="card"><div class="h">Datos del vehículo</div><div class="g2">${inp('Marca / fabricante','marca',o.marca,'list="marcas" autocomplete="off"')}<datalist id="marcas">${MARCAS.map(m=>`<option value="${m}">`).join('')}</datalist>${inp('Modelo','modelo',o.modelo)}${inp('Año','anio',o.anio,'inputmode="numeric"')}${inp('<span class="vl">Serie / VIN'+vokH(o)+'</span>','vin',o.vin,'autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="17" style="text-transform:uppercase"')}${inp('Placas','placas',o.placas,'autocapitalize="characters" autocomplete="off" spellcheck="false" style="text-transform:uppercase"')}${inp('Fecha de compra','fcompra',o.fcompra,'type="date"')}${inp('Kilometraje','km',fmtKm(o.km),'inputmode="numeric" autocomplete="off"')}<label class="f">Combustible<select data-p="comb">${['','Reserva','1/4','1/2','3/4','Lleno'].map(x=>`<option ${o.comb===x?'selected':''}>${x}</option>`).join('')}</select></label></div>
  <div class="mut" id="vinh">${vinH(o)}</div><div class="mut" id="vinb">${vinB(o)}</div>
  <div class="mut">¿Es garantía?</div><div class="seg" style="max-width:240px"><button class="${o.gar?'s-ok':''}" data-a="gar" data-k="1" aria-pressed="${!!o.gar}">Sí</button><button class="${!o.gar?'s-nr':''}" data-a="gar" data-k="0" aria-pressed="${!o.gar}">No</button></div>
  <label class="f">Motivo de ingreso<textarea data-p="motivo">${esc(o.motivo)}</textarea></label><label class="f">Condiciones en las que se recibe la unidad<textarea data-p="cond">${esc(o.cond)}</textarea></label>
  <div class="mut">Ingreso: ${new Date(o.fing).toLocaleString('es-MX')}${o.ref?' · Orden original: '+esc(o.ref):''}</div></div>
  ${asesH(o)}${asigH(o)}</div>
  <div class="u-dk"><div class="card"><div class="h">Más datos de la orden</div><div class="dkg d2">${inp('Dirección','dir',o.dir)}${inp('Fecha de compra','fcompra',o.fcompra,'type="date"')}</div><div class="dkg d2 dkt"><label class="f">Motivo de ingreso<textarea data-p="motivo">${esc(o.motivo)}</textarea></label><label class="f">Condiciones en las que se recibe la unidad<textarea data-p="cond">${esc(o.cond)}</textarea></label></div>${o.ref?`<div class="mut">Orden original: ${esc(o.ref)}</div>`:''}</div>${accH(o)}</div>`}
const tL=o=>{normChk(o);return llH(o)};
const tR=o=>gfotos(o);
// Historial: lo que registra la app (creación y cambios de etapa) más el visto bueno y la autorización del cliente
const vinN=v=>String(v||'').replace(/\s/g,'').toUpperCase(),plN=p=>{p=String(p||'').replace(/[\s-]/g,'').toUpperCase();return /^(SN|S\/N|NA|N\/A|SINPLACAS|0*)$/.test(p)?'':p};
const visitas=o=>{const v=vinN(o.vin),p=plN(o.placas),V=S.orders.filter(x=>(v.length>=8&&vinN(x.vin)===v)||(p&&plN(x.placas)===p&&(!v||!vinN(x.vin)||vinN(x.vin).length<8)));if(!V.some(x=>x.folio===o.folio))V.push(o);return V.sort((a,b)=>(b.fing||b.cre||0)-(a.fing||a.cre||0))};
function tH(o){const V=visitas(o),sin=!vinN(o.vin)&&!plN(o.placas);
  const fila=x=>{const t=tot(x),au=x.lineas.filter(l=>l.st==='aut'||l.st==='gar'),e=ETAPAS[idx(x.etapa)]||[0,x.etapa,'#475569'],ya=x.folio===o.folio;
    return`<li class="vis${ya?' now':''}"><div class="row sp wrap"><b class="fol">${esc(x.folio)}</b><span class="chip" style="background:${e[2]};color:#fff">${esc(e[1])}</span></div><time>${esc(new Date(x.fing||x.cre||Date.now()).toLocaleDateString('es-MX',{dateStyle:'long'}))}</time><div class="mut">${esc(TIPOS[x.tipo]||x.tipo)}${x.km?' · '+esc(fmtKm(x.km))+' km':''}${x.mec?' · '+esc(x.mec):''}${x.suc&&x.suc!==o.suc?' · '+esc(x.suc):''}</div>${au.length?`<div class="vtr">${au.slice(0,4).map(l=>esc(String(l.desc).slice(0,60))).join(' · ')}${au.length>4?' · +'+(au.length-4)+' más':''}</div>`:'<div class="mut">Sin trabajos autorizados</div>'}<div class="row sp"><span class="mut">Cobrado</span><b class="fol">${money(t.aut)}</b></div>${ya?'<span class="chip g">Esta visita</span>':`<button class="btn sm" data-a="abrir" data-f="${esc(x.folio)}">Abrir orden</button>`}</li>`};
  return`<div class="card"><div class="h">Historial de visitas de esta moto</div>${sin?'<p class="mut" style="margin:0">Captura el VIN o las placas para ver las visitas anteriores.</p>':`<p class="mut" style="margin:0">${V.length>1?V.length+' visitas registradas':'Es la primera visita registrada de esta moto.'}</p>`}<ol class="vlist">${V.map(fila).join('')}</ol></div>`}
function firmaCard(o,k,t){const f=o.firmas[k],s=f&&src(f);
  return`<div class="card"><div class="row sp"><div class="h">${t}</div><span class="chip ${s?'g':'w'}">${s?IC.ok+' Firmada':'Pendiente'}</span></div>${k!=='entrega'?`<label class="f">Nombre<input data-p="firmas.${k}.n" value="${esc(f?.n||'')}"></label>`:''}${s?`<img class="pic" data-a="zoom" alt="Firma ${t}" src="${s}">`:''}<button class="btn" data-a="firma" data-k="${k}">${s?'Firmar de nuevo':'Capturar firma'}</button></div>`}
const fechaIso=v=>{v=String(v||'').trim();let m=/^(\d{4})-(\d{2})-(\d{2})/.exec(v);if(m)return m[1]+'-'+m[2]+'-'+m[3];m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):''};
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
  ${repCita(L)}${repTbl('Por etapa',['Etapa','Órdenes'],ETAPAS.map(e=>[e[1],L.filter(o=>o.etapa===e[0]).length]))}</div>`}
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
  if(r.n<17)return`Serie de ${r.n}/17 caracteres: al completarla se detectan año, marca y modelo.`;
  if(r.mal)return`${IC.at} La serie tiene caracteres no válidos (el VIN no usa I, O ni Q): revísala.`;
  if(!r.anio)return`${IC.at} No se pudo leer el año en la posición 10 de la serie: revísala o captura el año a mano.`;
  const dif=Number(o.anio)!==r.anio,mc=String(o.marca||'').trim(),fab=(MOTOS.cache[o.vin]||{}).marca||r.fab;
  const btn=(m,t)=>`<button type="button" class="vchip" data-a="vinmarca" data-m="${esc(m)}" title="Usar ${esc(m)}">${esc(t||'Usar')}</button>`;
  const pa=dif?`año <b>${r.anio}</b>${o.anio?` (tienes ${esc(o.anio)})`:''} <button type="button" class="vchip" data-a="vinanio" data-y="${r.anio}" title="Usar ${r.anio}">Usar</button>`:`año <b>${r.anio}</b> ✓`;
  const pm=fab?(mc&&mc!==fab?`marca <b>${esc(fab)}</b> (tienes ${esc(mc)}) ${btn(fab)}`:`marca <b>${esc(fab)}</b> ✓`):r.amb?(mc&&r.amb.includes(mc)?`marca <b>${esc(mc)}</b> ✓`:`marca ${r.amb.map(m=>btn(m,m)).join('')}`):'marca no reconocida';
  const md=modVin(o),mm=String(o.modelo||'').trim(),bm=(m,t)=>`<button type="button" class="vchip" data-a="vinmodelo" data-m="${esc(m)}" title="Usar ${esc(m)}">${esc(t||m)}</button>`;
  const pmo=!md?'':md.uno?(mm.toUpperCase()===md.top[0].toUpperCase()?`modelo <b>${esc(md.top[0])}</b> ✓`:`modelo <b>${esc(md.top[0])}</b>${mm?` (tienes ${esc(mm)})`:''} ${bm(md.top[0],'Usar')}`):(md.top.some(m=>m.toUpperCase()===mm.toUpperCase())?`modelo <b>${esc(mm)}</b> ✓`:`modelo ${md.top.map(m=>bm(m)).join('')}`);
  return`<div class="vsg"><span class="vi">${pa}</span><span class="vi">${pm}</span>${pmo?`<span class="vi">${pmo}</span>`:''}</div>`}
// ---- Base de motos (hoja MOTOS_TALLER de la API del taller) ----
// Al completar el VIN o el teléfono se busca la moto y se llenan los datos que estén vacíos. km y combustible nunca se llenan: se capturan en cada visita.
const MOTOS={cache:{},sug:null,tt:0,aviso:false,mod:{},modErr:{},modOff:false,avisoMod:false};
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
  pon('cliente',m.cliente,'cliente');pon('tel',m.tel,'teléfono');pon('email',m.email,'correo');pon('dir',[m.direccion,m.ciudad].filter(Boolean).join(', '),'dirección');{const fv=fechaIso(m.fecha_venta);if(fv&&o.fcompra!==fv&&(!String(o.fcompra||'').trim()||o.fcompraAuto)){o.fcompra=fv;o.fcompraAuto=true;f.push('fecha de compra');q('fcompra').value=fv}}if(m.modelo&&o.modeloAuto&&o.modelo!==m.modelo){o.modelo='';delete o.modeloAuto}pon('modelo',m.modelo,'modelo');pon('placas',m.placas,'placas');
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
// Modelo por serie. El VIN no trae el modelo escrito, pero la base de motos (ventas + órdenes del taller) sabe qué modelo lleva cada prefijo de 8 caracteres (fábrica + descriptor).
// La acción modeloVin del script (v9) devuelve los modelos de ese prefijo con su conteo: si uno domina (85 % o más) se llena solo; si hay varios se ofrecen botones. Si la moto ya está en la base, manda su modelo.
const vinPre=v=>{const s=String(v||'').toUpperCase().replace(/\s+/g,'');return vinInfo(s).ok?s.slice(0,8):''};
function modVin(o){const e=String((MOTOS.cache[o.vin]||{}).modelo||'').trim();if(e)return{top:[e],uno:true};
  const x=MOTOS.mod[vinPre(o.vin)];if(!x||!x.modelos||!x.modelos.length)return null;
  const t=x.total||x.modelos.reduce((a,b)=>a+b.n,0);return{top:x.modelos.slice(0,3).map(m=>m.m),uno:x.modelos.length===1||x.modelos[0].n/t>=.85}}
// Llena el modelo solo si está vacío o si lo había puesto la propia serie. Devuelve true si cambió. Si aún no se consulta ese prefijo, lo pide.
function autoModelo(o){const md=modVin(o);
  if(md&&md.uno){const v=md.top[0];if((!String(o.modelo||'').trim()||o.modeloAuto)&&o.modelo!==v){o.modelo=v;o.modeloAuto=true;return true}return false}
  if(!md)buscaModeloVin(o);return false}
async function buscaModeloVin(o){const vin=o.vin,pre=vinPre(vin);if(!pre||MOTOS.mod[pre]||MOTOS.modOff||Date.now()-(MOTOS.modErr[pre]||0)<60000)return;
  MOTOS.mod[pre]='pend';let r=null;try{r=await api.taller({action:'modeloVin',vin})}catch{}
  if(!r||!r.success){delete MOTOS.mod[pre];MOTOS.modErr[pre]=Date.now();
    if(r){const k=motoErr(r);if(k==='viejo'){MOTOS.modOff=true;if(!MOTOS.avisoMod){MOTOS.avisoMod=true;toast('El modelo por serie necesita actualizar el script del taller (v9)')}}else avisaMotos(k)}return}
  MOTOS.mod[pre]=r;
  if(!D||O(D)!==o||o.vin!==vin)return;                 // la orden o el VIN cambiaron mientras llegaba la respuesta
  if(autoModelo(o)){touch(o);document.querySelectorAll('[data-p="modelo"]').forEach(mi=>mi.value=o.modelo)}
  document.querySelectorAll('#vinh,.vinh').forEach(vh=>vh.innerHTML=vinH(o))}
async function buscaMotosTel(o,tel){let r=null;try{r=await api.taller({action:'buscarMotos',campo:'tel',q:tel})}catch{}
  if(!r)return;if(!r.success){avisaMotos(motoErr(r));return}
  if(!D||O(D)!==o||nTel(o.tel)!==tel)return;
  MOTOS.sug={tel,motos:r.motos||[]};pintaSug()}
async function leeColab(){try{const c=await api.taller({action:'listarColaboradores'});if(c&&c.success&&Array.isArray(c.colaboradores)){S.colab=c.colaboradores;S.colabT=Date.now();save();return true}}catch{}return false}
// ---- fin base de motos ----
// Colaboradores por agencia: lista de la hoja COLABORADORES_TALLER + nombres ya usados en órdenes de esa agencia (sin repetir)
const agN=s=>String(s||'').replace(/\s+/g,' ').trim().toUpperCase();
const colDe=(p,ag)=>(S.colab||[]).filter(c=>c.p===p&&agN(c.a)===agN(ag)).map(c=>c.n);
const nombresDe=(p,o)=>{const ag=(o&&o.suc)||S.suc,k=(PUESTOS.find(x=>x[0]===p)||[])[3],hist=S.orders.filter(x=>!ag||agN(x.suc)===agN(ag)).map(x=>x[k]).filter(Boolean),m=new Map();[...colDe(p,ag),...hist].forEach(n=>{const u=agN(n);if(u&&!m.has(u))m.set(u,n)});return[...m.values()]};
const dlColab=(id,p,o)=>`<datalist id="${id}">${nombresDe(p,o).map(m=>`<option value="${esc(m)}">`).join('')}</datalist>`;
const asigH=o=>o.etapa==='recepcion'?`<div class="card"><div class="h">Asignación en taller</div><p class="mut" style="margin:0">${o.mec?'Técnico asignado: <b>'+esc(o.mec)+'</b>':'El técnico se asigna al pasar la orden a Taller.'}</p></div>`:`<div class="card"><div class="h">Asignación en taller</div>${inp('Técnico asignado','mec',o.mec,'list="mecs"')}${dlColab('mecs','MECANICO',o)}</div>`;
const asesH=o=>`<div class="card"><div class="h">Datos del asesor de servicio</div><div class="g2">${inp('Asesor de servicio','asesor',o.asesor,'list="ass"')}${inp('Asesor de refacciones','asesorRef',o.asesorRef,'list="asr"')}</div>${dlColab('ass','ASESOR DE SERVICIO',o)}${dlColab('asr','ASESOR DE REFACCIONES',o)}
  <div class="sbh" style="margin-top:14px">Accesorios y documentos</div><div class="mut">Marca lo que se recibe junto con la moto.</div><div class="pts">${ACCES.map(n=>{const x=o.inv[n];return`<button class="tg ${x.p?'on':''}" data-a="inv" data-n="${n}" aria-pressed="${x.p}">${x.p?IC.ok:''}<span>${INV32[n]}</span></button>`}).join('')}</div></div>`;
const accH=o=>`<div class="card"><div class="sbh" style="margin-top:14px">Accesorios y documentos</div><div class="mut">Marca lo que se recibe junto con la moto.</div><div class="pts">${ACCES.map(n=>{const x=o.inv[n];return`<button class="tg ${x.p?'on':''}" data-a="inv" data-n="${n}" aria-pressed="${x.p}">${x.p?IC.ok:''}<span>${INV32[n]}</span></button>`}).join('')}</div></div>`;
const SECC=[['Frente y dirección',[0,1,2]],['Motor y combustible',[3,4,12,5]],['Eléctrico y carrocería',[6,7,8]],['Tren trasero',[9,10,11]]],DANOS=['Rayado','Golpeado','Roto','Faltante','Desgaste','Otro','Recepción'],REC='Recepción',FI='Fotos de ingreso',pfo=new Set();let ds=-1;
// Fotos de ingreso: puntos de tipo Recepción (varias fotos cada uno) + las fotos generales de órdenes anteriores
const nRecep=o=>(o.danos||[]).filter(m=>m.t===REC).reduce((a,m)=>a+fotosK(m).filter(u=>src(u)).length,0)+FOTOS_GRAL.filter(x=>o.fotos[x[0]]&&src(o.fotos[x[0]])).length;
const heroSrc=o=>{if(o.fotos.g_frente&&src(o.fotos.g_frente))return src(o.fotos.g_frente);for(const m of o.danos||[])if(m.t===REC){const u=fotosK(m)[0];if(u)return src(u)}return''};
const ptsH=(o,i)=>CATS[i][2].map(n=>{const x=o.inv[n];return`<button class="tg ${x.p?'on':''}" data-a="inv" data-n="${n}" aria-pressed="${x.p}">${x.p?IC.ok:''}<span>${INV32[n]}</span></button>`}).join('');
const fotosK=k=>[k.f,...(k.fx||[])].filter(Boolean),OPL=['Cambiar llanta','Reparar ponchadura','Ajustar presión de aire','Balancear llanta','Cambiar válvula o cámara'];
const camB=(k,att,i)=>{const n=fotosK(k).length;return`<button type="button" class="cq fcam" data-a="fpick" ${att}="${i}" aria-label="Agregar foto${n?' ('+n+')':''}" title="Agregar foto">${IC.cam}${n?`<span class="fcn">${n}</span>`:''}</button>`};
const galH=(k,t,i)=>{const L=fotosK(k);return L.length?`<div class="ckx fgal">${L.map((u,j)=>`<span class="fgi"><img alt="Foto ${j+1}" src="${src(u)}" data-a="zoom"><button class="fgx" data-a="fdel" data-k="${t}" data-i="${i}" data-j="${j}" aria-label="Quitar foto ${j+1}">✕</button></span>`).join('')}</div>`:''};
const sqH=(k,a,i,n)=>`<div class="cqs" role="group" aria-label="${n}">${COND.map(([e,t,lb])=>`<button class="cq cq-${e}${k.e===e?' on':''}" data-a="${a}" data-i="${i}" data-e="${e}" aria-pressed="${k.e===e}" aria-label="${lb}" title="${t}">${k.e===e?IC.ok:''}</button>`).join('')}${camB(k,a==='cond'?'data-ffoto':'data-fll',i)}</div>`;
function llH(o){return`<div class="sbar">Llantas</div><div class="card llc">`+o.llantas.map((l,i)=>{const bad=l.e==='px'||l.e==='ur';
  return`<div class="llr"><b class="llp">${l.p}</b><label class="f"><span>Medida</span><input data-p="llantas.${i}.med" list="medl${i}" value="${esc(l.med)}" placeholder="90/90-17" autocomplete="off">${medSug(o,i).length?`<span class="medch" role="group" aria-label="Medidas usadas en esta moto">${medSug(o,i).map(m=>`<button type="button" class="medb${String(l.med).trim().toUpperCase()===m?' on':''}" data-a="llmed" data-i="${i}" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</span>`:''}</label><label class="f"><span>Desgaste (mm)</span><input inputmode="decimal" data-p="llantas.${i}.des" value="${esc(l.des)}"></label><label class="f"><span>PSI</span><input inputmode="numeric" data-p="llantas.${i}.psi" value="${esc(l.psi)}"></label>${sqH(l,'lcond',i,'Llanta '+l.p)}
  ${bad?`<label class="f llop"><span>Operación recomendada</span><input data-p="llantas.${i}.op" list="opl" value="${esc(l.op||'')}" placeholder="Elige o escribe la operación"></label>`:''}${galH(l,'l',i)}</div>`}).join('')+`<datalist id="opl">${OPL.map(x=>`<option value="${x}">`).join('')}</datalist>${MEDIDAS_LL.map((L,i)=>`<datalist id="medl${i}">${L.map(x=>`<option value="${x}">`).join('')}</datalist>`).join('')}</div>`}
// Medidas ya usadas en la misma moto (VIN) o en el mismo modelo, las más repetidas primero
const medSug=(o,i)=>{const m=new Map(),v=vinN(o.vin),md=String(o.modelo||'').trim().toLowerCase();S.orders.forEach(x=>{if(x.folio===o.folio||!x.llantas)return;const l=x.llantas[i];if(!l||!String(l.med||'').trim())return;const mv=v.length>=8&&vinN(x.vin)===v,mm=!!md&&String(x.modelo||'').trim().toLowerCase()===md;if(!mv&&!mm)return;const k=String(l.med).trim().toUpperCase();m.set(k,(m.get(k)||0)+(mv?5:1))});return[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0])};
const enCot=(o,i)=>o.lineas.some(l=>l.ck===i||(l.sku==='HALLAZGO'&&String(l.desc).startsWith(CATS[i][0]+': ')));
function ckRow(o,i){const c=CATS[i],k=o.chk[i],bad=k.e==='px'||k.e==='ur';
  return`<div class="ckr"><div class="ckt"><b>${(SECC.flatMap(x=>x[1]).indexOf(i)+1)||i+1}. ${c[0]}</b><span class="mut">${c[1]}</span></div>${sqH(k,'cond',i,c[0])}${galH(k,'c',i)}
  ${bad?`<div class="ckx"><label class="f">Operación recomendada<input data-p="chk.${i}.op" list="op${i}" value="${esc(k.op||'')}" placeholder="Elige o escribe la operación"></label><datalist id="op${i}">${OPS[i].map(x=>`<option value="${x}">`).join('')}</datalist><label class="f">Nota técnica<textarea data-c="${i}">${esc(k.n)}</textarea></label>${enCot(o,i)?`<button class="btn" disabled>${IC.ok} Ya está en la cotización</button>`:`<button class="btn" data-a="pc" data-i="${i}">Pasar a cotización</button>`}</div>`:''}</div>`}
function danosH(o){const d=o.danos||[],leg=FOTOS_GRAL.filter(x=>o.fotos[x[0]]&&src(o.fotos[x[0]]));
  return`<div class="sbh" style="margin-top:14px">Daños y detalles</div><div class="mut">Toca la moto donde haya un daño o detalle (lateral, frente o arriba): se numera y eliges el tipo en la lista. Para las fotos de ingreso elige <b>Recepción</b>: el detalle se llena solo y puedes tomar o elegir varias fotos.</div>
  <div class="dgrid"><div class="dgl"><div class="mw" data-a="dmark"><img src="img/moto.png" alt="Moto: vistas lateral, frontal y superior" draggable="false">${d.map((m,i)=>`<button class="mk${m.t===REC?' rc':''}${i===ds?' sel':''}" style="left:${m.x}%;top:${m.y}%" data-a="dsel" data-i="${i}" aria-label="Punto ${i+1}: ${esc(m.t)}">${i+1}</button>`).join('')}</div></div>
  <div class="dgr"><div class="sbh dgh">Puntos identificados</div>${d.length?d.map((m,i)=>`<div class="dmw"><div class="dmr"><span class="dmn">${i+1}</span><select data-p="danos.${i}.t" aria-label="Tipo del punto ${i+1}">${DANOS.map(x=>`<option ${m.t===x?'selected':''}>${x}</option>`).join('')}</select><input data-p="danos.${i}.n" placeholder="Detalle (opcional)" value="${esc(m.n)}" aria-label="Detalle del punto ${i+1}">${camB(m,'data-fdano',i)}<button class="btn" data-a="ddel" data-i="${i}" aria-label="Quitar punto ${i+1}">✕</button></div>${galH(m,'d',i)}</div>`).join(''):'<p class="mut" style="margin:6px 0 0">Sin puntos marcados.</p>'}</div></div>
  ${leg.length?`<div class="sbh" style="margin-top:14px">Fotos de ingreso anteriores</div><div class="gfo">${leg.map(([k,t])=>`<button type="button" class="gf on" data-a="fver" data-foto="${k}" aria-label="Ver foto: ${t}"><img alt="${t}" src="${src(o.fotos[k])}"><span class="gt">${t}</span></button>`).join('')}</div>`:''}`}

function tI(o){const np=o.inv.filter(i=>i.p).length,fo=(k,t)=>`<div class="card"><div class="row sp"><div class="h">${t}</div><span class="chip ${o.fotos[k]?'g':'w'}">${o.fotos[k]?IC.ok+' Cargada':'Obligatoria'}</span></div>${o.fotos[k]?`<img class="pic" data-a="zoom" alt="${t}" src="${src(o.fotos[k])}">`:''}<button type="button" class="btn" data-a="fpick" data-foto="${k}">${IC.cam} ${o.fotos[k]?'Reemplazar foto':'Tomar o elegir foto'}</button></div>`;
  normChk(o);
  return`${SECC.map(([t,ix],si)=>`<div class="sbar">${t}</div>${ix.map(i=>ckRow(o,i)).join('')}`).join('')}`}

const qopen=new Set(),SEMC={ur:'r',px:'a',ok:'g',nr:'n'},EST=[['pend','Pendiente de autorización'],['aut','Autorizado'],['rech','Rechazado'],['gar','Garantía']];
const zonaDe=(o,l)=>{if(l.ck!=null&&CATS[l.ck])return l.ck;return CATS.findIndex(c=>String(l.desc).startsWith(c[0]+': '))};
function lineaH(l,i,o){const mo=l.t==='mo',z=zonaDe(o,l),area=z>=0?CATS[z][0]:(mo?'Mano de obra':'Refacción'),open=qopen.has(i),op=z>=0?String(l.desc).replace(CATS[z][0]+': ',''):l.desc;
  const inv=!mo&&l.sku&&!/^(HALLAZGO|MANUAL)$/.test(l.sku)?S.inv.find(x=>nSku(x.sku)===nSku(l.sku)):null,st=inv?stockDe(inv,o.suc):null;
  const pn=l.pc?(Number(l.precio)===l.pc?`<span class="chip g">${IC.ok} Precio de catálogo (IVA incluido): ${money(l.pc)}</span>${l.pf?`<span class="chip w">${IC.at} Viene del inventario: confirma que incluya IVA</span>`:''}`:`<span class="chip w">${IC.at} Precio editado (catálogo: ${money(l.pc)})</span><button class="btn sm" data-a="qpc" data-i="${i}">Volver al precio de catálogo</button>`):'';
  const det=open?`<div class="q2d"><div class="q2g${mo?' mo':''}">${mo?'':`<label class="f g-sku">SKU<input data-p="lineas.${i}.sku" data-sku="${i}" value="${esc(l.sku)}" autocomplete="off" autocapitalize="characters"></label>`}<label class="f g-desc">Descripción<input data-p="lineas.${i}.desc" value="${esc(l.desc)}"></label>${mo?'':`<label class="f g-cant">Cant.<input data-n data-p="lineas.${i}.cant" inputmode="numeric" value="${l.cant}"></label><div class="f g-ex"><span>Existencia${st&&st.suc!=='todas'?' · '+esc(st.suc):''}</span><div class="ro ${st?(st.n>0?'ok':'no'):''}">${st?(st.n>0?st.n+' pzas':'Sin existencia'):'—'}</div></div>`}<label class="f g-pr">${mo?'Monto $ (IVA incl.)':'P. unit. $ (IVA incl.)'}<input data-n data-p="lineas.${i}.precio" inputmode="decimal" value="${l.precio||''}"></label></div>
   <div class="row wrap">${pn}${!Number(l.precio)&&l.st!=='gar'?`<span class="chip w">${IC.at} Sin precio</span>`:''}${l.f?`<img class="th" data-a="zoom" alt="Evidencia" src="${src(l.f)}">`:''}<span style="flex:1"></span><button class="btn sm" data-a="dl" data-i="${i}" aria-label="Quitar ${esc(l.desc)}">${IC.fa} Quitar concepto</button></div>
   ${l.st==='rech'?(l.rg?`<div class="qx rgs"><span class="chip g">${IC.ok} Rechazo guardado</span><span>Motivo: <b>${esc(l.mot)}</b> · Seguimiento: <b>${esc(fechaMx(l.seg))}</b>${l.rea?' · Reagendar: <b>'+esc(l.rea)+'</b>':''}</span><button class="btn sm" data-a="redit" data-i="${i}">Editar</button></div>`:`<div class="qx g2"><label class="f">Motivo del rechazo<select data-p="lineas.${i}.mot"><option value="">Selecciona…</option>${MOTIVOS.map(m=>`<option ${l.mot===m?'selected':''}>${m}</option>`).join('')}</select></label><label class="f">Dar seguimiento el<input type="date" data-p="lineas.${i}.seg" value="${esc(l.seg||'')}"></label><label class="f">¿El cliente desea reagendar?<select data-p="lineas.${i}.rea">${['','Sí','No','Lo pensará'].map(x=>`<option ${l.rea===x?'selected':''}>${x}</option>`).join('')}</select></label><div class="row" style="grid-column:1/-1"><button class="btn pri" data-a="rguardar" data-i="${i}">Guardar rechazo</button></div></div>`):''}</div>`:'';
  return`<div class="q2 st-${l.st}" data-i="${i}"><div class="q2r"><button class="q2x" data-a="qexp" data-i="${i}" aria-expanded="${open}" aria-label="${open?'Contraer':'Expandir'} ${esc(l.desc)}">${open?'▾':'▸'}</button>
   <span class="q2c"><i class="sem ${z>=0?SEMC[o.chk[z].e]||'n':''}"></i><span class="q2ct"><small>${esc(area)}</small><b>${op?esc(op):'<i class="mut">Escribe la descripción…</i>'}</b></span></span>
   <select class="q2e est-${l.st}" data-qest="${i}" aria-label="Estado de autorización: ${esc(l.desc)}">${EST.map(([k,n])=>`<option value="${k}" ${l.st===k?'selected':''}>${n}</option>`).join('')}</select>
   <b class="q2i fol" id="imp-${i}">${money(imp(l))}</b></div>${det}</div>`}
// Totales como pie de la propia tabla: Identificado es el subtotal, Autorizado (a cobrar) el total, y debajo lo que sigue abierto o quedó fuera.
const totH=o=>{const t=tot(o),r=(c,l,v,x='')=>`<div class="q2s ${c}"><span class="q2l">${l}${x}</span><b class="q2v fol">${money(v)}</b></div>`;
  return r('sub','Identificado <small>(subtotal)</small>',t.cot)+r('tot','TOTAL A COBRAR <small>(autorizado, IVA incl.)</small>',t.aut)+(t.gar?r('gar','Garantía <small>(sin cargo)</small>',t.gar):'')+r('pen','Pendiente <small>por autorizar</small>',t.pend)+r('rec','Rechazado / diferido',t.rech)};
const autCard=o=>{const a=o.auth,f=o.firmas.aut,s=f&&src(f);
  return`<div class="cfg-g">Autorización del cliente</div><div class="card"><div class="row sp"><div class="h">Firma de autorización</div><span class="chip ${s?'g':'w'}">${s?IC.ok+' Firmada':'Pendiente'}</span></div>
  ${s?`<img class="pic" alt="Firma de autorización" src="${s}"><div class="mut">${esc((a&&a.n)||f.n||'Cliente')}${a?' · '+new Date(a.t).toLocaleString('es-MX')+' · desde el enlace':''}</div>`:`<p class="mut" style="margin:0">El cliente firma desde su enlace o aquí en el taller. Al guardar desde el enlace, lo aceptado pasa solo a Autorizado y la orden se mueve a la columna Autorizado.${o.vb?' Enlace enviado el '+new Date(o.vb).toLocaleString('es-MX')+'.':''}</p>`}
  <div class="row wrap"><button class="btn sm" data-a="firma" data-k="aut">${s?'Firmar de nuevo en el taller':'Recabar firma en el taller'}</button></div></div>`};
let qmode='';
const qaddH=()=>`<div class="qadd"><button class="qplus" data-a="qmenu" aria-expanded="${!!qmode}" aria-label="Agregar concepto a la cotización"><span class="qpi" aria-hidden="true">+</span><span>Agregar concepto</span><small class="qhint">Refacción, mano de obra o concepto manual</small></button>${qmode==='menu'?`<div class="qmenu" role="group" aria-label="Tipo de concepto"><button class="btn qo2" data-a="qopt" data-k="ref"><b>Refacción</b><small>SKU o catálogo</small></button><button class="btn qo2" data-a="qopt" data-k="mo"><b>Mano de obra</b><small>Tiempo o monto</small></button><button class="btn qo2" data-a="qopt" data-k="manual"><b>Concepto manual</b><small>Texto libre</small></button></div>`:''}${qmode==='ref'?`<div class="qref"><label class="f">Busca SKU o refacción (catálogo, precio con IVA)<input id="q2" autocomplete="off" placeholder="SKU, nombre o número de parte"></label><div id="sug" class="sugl"></div></div>`:''}</div>`;
function tC(o){return`<div class="q2t"><div class="q2h"><span></span><span>Concepto</span><span>Estado de autorización</span><span class="r">Importe (IVA incl.)</span></div>${o.lineas.map((l,i)=>lineaH(l,i,o)).join('')||'<div class="qe mut">Sin conceptos. Agrégalos aquí abajo o pasa hallazgos desde Inspección.</div>'}
  ${qaddH()}<div class="q2f" id="tot" role="group" aria-label="Totales de la cotización">${totH(o)}</div></div>
  <div class="row wrap"><button class="btn amb" data-a="wa">Enviar visto bueno por WhatsApp</button></div>
  ${autCard(o)}${tFin(o)}`}
function tFin(o){return`<div class="card"><div class="h">Aviso legal</div><p style="margin:0;font-size:14px">${LEYENDA}</p><button class="btn ${o.leg?'':'pri'}" data-a="leg" aria-pressed="${!!o.leg}">${o.leg?IC.ok+' Cliente informado (tocar para revertir)':'El cliente fue informado'}</button></div>
  <div class="card"><div class="h">Próximo servicio</div><div class="g2">${inp('Fecha','prox.f',o.prox.f,'type="date"')}${inp('Kilometraje','prox.km',fmtKm(o.prox.km),'inputmode="numeric" autocomplete="off"')}</div></div>
  ${idx(o.etapa)>=idx('lavado')?'<div class="row wrap"><button class="btn amb" data-a="walisto">Avisar por WhatsApp: unidad lista</button></div>':''}`}

function segItems(){const r=[];mine().forEach(o=>{o.lineas.forEach((l,i)=>{if(l.st==='rech'&&!l.cerr)r.push({k:'l',o,i,l,f:l.seg||''})});if(o.prox&&o.prox.f&&!o.prox.cerr)r.push({k:'p',o,f:o.prox.f})});return r.sort((a,b)=>(a.f||'9').localeCompare(b.f||'9'))}
function seguimientos(){const hoy=iso(),w=addD(7),it=segItems().filter(x=>match(x.o)),G=[['Vencidos',it.filter(x=>x.f&&x.f<hoy)],['Esta semana',it.filter(x=>x.f&&x.f>=hoy&&x.f<=w)],['Más adelante',it.filter(x=>x.f&&x.f>w)],['Sin fecha',it.filter(x=>!x.f)]];
  return`<div class="ph"><h2>Seguimientos: trabajos diferidos y próximos servicios</h2></div>${G.map(([n,L])=>L.length?`<h3 class="h" style="margin:14px 0 8px">${n} <span class="cnt">${L.length}</span></h3><div class="sgg">${L.map(x=>`<div class="card"><div class="row sp"><span class="fol">${esc(x.o.folio)}</span><span class="chip ${x.f&&x.f<hoy?'r':'n'}">${x.f||'Sin fecha'}</span></div><div class="ttl">${esc(x.o.cliente||'Sin cliente')} · ${esc(x.o.modelo)}</div><div>${x.k==='l'?esc(x.l.desc)+' · '+money(imp(x.l)):'Próximo servicio'+(x.o.prox.km?' · '+esc(fmtKm(x.o.prox.km))+' km':'')}</div>${x.k==='l'?`<div class="mut">Motivo: ${esc(x.l.mot||'No registrado')}</div>`:''}
   <div class="row wrap"><button class="btn sm" style="flex:1" data-a="sgwa" data-f="${x.o.folio}" data-i="${x.i??''}" data-k="${x.k}">WhatsApp</button>${x.k==='l'?`<button class="btn sm" style="flex:1" data-a="sgre" data-f="${x.o.folio}" data-i="${x.i}">Reprogramar</button><button class="btn sm pri" style="flex:1" data-a="sgok" data-f="${x.o.folio}" data-i="${x.i}">Aceptar y crear orden</button>`:`<button class="btn sm pri" style="flex:1" data-a="sgcita" data-f="${x.o.folio}">Crear orden</button>`}<button class="btn sm" style="flex:1" data-a="sgx" data-f="${x.o.folio}" data-i="${x.i??''}" data-k="${x.k}">Descartar</button></div></div>`).join('')}</div>`:'').join('')||'<p class="mut">No hay seguimientos pendientes. Los conceptos rechazados y los próximos servicios aparecerán aquí.</p>'}`}

function sheet(h,cls){$('#modal').innerHTML=`<div class="ov" data-a="cerrar"><div class="sh${cls?' '+cls:''}" role="dialog" aria-modal="true"><div class="sh-h"><button type="button" class="btn sm" data-a="cerrarx" aria-label="Cerrar">✕ Cerrar</button></div>${h}</div></div>`}
const tipoBtns=(a,x='')=>Object.entries(TIPOS).map(([k,v])=>`<button class="btn" data-a="${a}" data-t="${k}" ${x}><span class="fol">${k}</span> ${v}</button>`).join('');
function setPath(o,p,v){const a=p.split('.');let r=o;for(let i=0;i<a.length-1;i++){if(r[a[i]]==null)r[a[i]]={};r=r[a[i]]}r[a[a.length-1]]=v}
let cfgT='g',etC=COLS_ET[0][0];
const ini=n=>String(n||'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
function etSave(){pendE()[agE()]=true;aplicaEtapas();save();render();acts.cfg();
  subeEtapas().then(r=>{if(r==='viejo')toast('Se guardó en este dispositivo. Actualiza el script del taller a la v14 para compartir las columnas con las demás pantallas.','inf');else if(r==='error')toast('Sin conexión: las columnas se compartirán al sincronizar','inf')})}
function cfgGen(){const rol=sesion?(sesion.esAdmin?'Administrador':sesion.esGerente?'Gerente':sesion.esVendedor?'Vendedor':''):'';
  return`<div class="cfg-g">Perfil</div>
<div class="cfg-c"><b>${esc(sesion?.nombre||sesion?.correo||'—')}</b><span class="mut">${esc(sesion?.correo||'')}${rol?' · '+rol:''}</span><span class="mut">Agencia: ${esc(S.suc||sesion?.agencia||'—')}</span></div>
<div class="cfg-g">Cuenta y versión</div>
<div class="mut">Pendientes de sincronizar: ${S.dirty.length}</div><div class="mut">${S.inv.length?S.inv.length+' productos en el catálogo':'Sin catálogo cargado'}</div>
<div class="mut">Identificador de versión</div><div class="ver">${esc(APP_BUILD)}</div>
<button class="btn" data-a="catup">Actualizar catálogo</button>
<button class="btn" data-a="recarga">Forzar recarga (limpiar caché de esta pestaña)</button>
<button class="btn red" data-a="salir">Cerrar sesión</button>`}
// ===== v46 · Formato de garantía editable por marca =====
// S.garFmt={def:{campos,fotos}|null,marcas:{MARCA:{campos,fotos}}}; se comparte con la clave garantia_fmt de CONFIG_TALLER. Los datos de cada orden van en o.garD.v[campo] y las fotos en o.fotos['gar_'+clave].
const GAR_T=[['x','Texto corto'],['l','Texto largo'],['f','Fecha'],['n','Número']];
const GAR_DEF={campos:[{k:'falla',n:'Falla reportada por el cliente',t:'l',r:1},{k:'frep',n:'Fecha del reporte',t:'f',r:1},{k:'kmr',n:'Km al reportar',t:'n',r:1},{k:'fvta',n:'Fecha de compra o entrega de la unidad',t:'f'},{k:'cond',n:'Condiciones en que ocurrió la falla',t:'l'},{k:'diag',n:'Diagnóstico técnico',t:'l',r:1},{k:'pza',n:'Pieza(s) defectuosa(s)',t:'x'},{k:'sol',n:'Solución propuesta',t:'l'},{k:'rm',n:'Folio de reporte con la marca',t:'x'},{k:'res',n:'Resolución de la marca',t:'x'}],
 fotos:[{k:'tab',n:'Tablero con kilometraje',r:1},{k:'vin',n:'Número de serie (VIN)',r:1},{k:'falla',n:'Falla o pieza dañada',r:1},{k:'pza',n:'Pieza desmontada'},{k:'fact',n:'Factura o nota de venta'}]};
const mkG=m=>String(m||'').replace(/\s+/g,' ').trim().toUpperCase();
const cpG=x=>JSON.parse(JSON.stringify(x));
const garFmtDe=m=>{const g=S.garFmt||{},mk=mkG(m),pr=(g.marcas||{})[mk],f=pr||g.def||GAR_DEF;return{campos:f.campos||[],fotos:f.fotos||[],esp:!!pr}};
const gFoto=(o,x)=>{const f=o.fotos&&o.fotos['gar_'+x.k];return f&&src(f)?f:null};
function garFalta(o){const f=garFmtDe(o.marca),v=(o.garD&&o.garD.v)||{};return f.campos.filter(c=>c.r&&!String(v[c.k]==null?'':v[c.k]).trim()).length+f.fotos.filter(x=>x.r&&!gFoto(o,x)).length}
const cpFt=x=>!x?null:typeof x==='object'?(x.u?{u:x.u}:null):(/^data:/.test(x)?null:x);
const cpK=k=>{const n=cpG(k||{});n.f=cpFt(k&&k.f);const fx=((k&&k.fx)||[]).map(cpFt).filter(Boolean);if(fx.length)n.fx=fx;else delete n.fx;return n};
// La orden de garantía copia de la original el Cliente y unidad y la Inspección (checklist, llantas, carrocería, accesorios y fotos ya subidas); la original queda sin garantía y la cotización de la garantía empieza vacía.
function garCopia(o){const x={};['cliente','tel','email','dir','modelo','marca','anio','motor','vin','placas','km','fcompra','comb','trae','asesorRef'].forEach(k=>{if(o[k]!=null&&o[k]!=='')x[k]=o[k]});
  x.ref=o.folio;x.gar=true;x.motivo='Garantía de la orden '+o.folio;
  if(Array.isArray(o.inv))x.inv=cpG(o.inv);if(Array.isArray(o.adic))x.adic=cpG(o.adic);
  if(Array.isArray(o.chk))x.chk=o.chk.map(cpK);if(Array.isArray(o.llantas))x.llantas=o.llantas.map(cpK);if(Array.isArray(o.danos))x.danos=o.danos.map(cpK);
  x.fotos={};for(const k in (o.fotos||{})){const f=cpFt(o.fotos[k]);if(f)x.fotos[k]=typeof f==='object'?f:{u:f}}
  x.garD={v:{frep:iso(),fvta:o.fcompra||'',kmr:o.km||''}};return x}
const garBan=o=>o.tipo==='G'?`<div class="card gar-ban"><b>Orden de garantía${o.ref?' de '+esc(o.ref):''}</b><div class="mut">El Cliente y unidad y la Inspección se copiaron de la orden original. Ajusta lo que el cliente reportó y llena la pestaña Garantía.</div></div>`:'';
const garsDe=o=>S.orders.filter(x=>x.tipo==='G'&&x.ref&&x.ref===o.folio);
function tGaLista(o){const L=garsDe(o),f=garFmtDe(o.marca);
  return`<div class="card"><div class="row sp"><div><div class="h">Garantía</div><div class="mut">Si el cliente reporta una falla de este servicio, crea una orden de garantía ligada a <b>${esc(o.folio)}</b>: hereda al cliente y la unidad. Ahí se llena el formato de ${esc(mkG(o.marca)||'la marca')} y se levantan las evidencias.</div></div><button type="button" class="btn pri" data-a="clonq" data-f="${esc(o.folio)}">Crear orden de garantía</button></div>
  <div class="row wrap"><span class="chip ${f.esp?'g':'n'}">${f.esp?'Formato propio de la marca':'Formato general'}</span><span class="chip n">${f.campos.length} campos</span><span class="chip n">${f.fotos.length} fotos de evidencia</span></div></div>
  <div class="card"><div class="h">Garantías de esta orden${L.length?' ('+L.length+')':''}</div>${L.length?L.map(g=>{const n=garFalta(g),e=ETAPAS[idx(g.etapa)];return`<button type="button" class="btn gar-li" data-a="abrirga" data-f="${esc(g.folio)}"><span class="fol">${esc(g.folio)}</span><span>${esc(e?e[1]:'')}</span><span class="chip ${n?'w':'g'}">${n?n+' pendiente'+(n>1?'s':''):'Formato completo'}</span></button>`}).join(''):'<div class="mut">Esta orden aún no tiene garantías.</div>'}</div>`}
function tGa(o){if(o.tipo!=='G')return tGaLista(o);const f=garFmtDe(o.marca),v=(o.garD&&o.garD.v)||{},fl=garFalta(o),ro=o.ref&&O(o.ref);
  const cp=f.campos.map(c=>{const d=`data-p="garD.v.${esc(c.k)}"`,l=esc(c.n)+(c.r?' <b class="req" aria-label="obligatorio">*</b>':''),x=esc(v[c.k]==null?'':v[c.k]);
    return c.t==='l'?`<label class="f gar-w">${l}<textarea ${d} rows="3">${x}</textarea></label>`:`<label class="f">${l}<input ${d} value="${x}" ${c.t==='f'?'type="date"':c.t==='n'?'inputmode="numeric"':''} autocomplete="off"></label>`}).join('');
  const ft=f.fotos.map(x=>{const k='gar_'+x.k,h=gFoto(o,x);return`<div class="card"><div class="row sp"><div class="h">${esc(x.n)}</div><span class="chip ${h?'g':x.r?'w':'n'}">${h?IC.ok+' Cargada':x.r?'Obligatoria':'Opcional'}</span></div>${h?`<img class="pic" data-a="zoom" alt="${esc(x.n)}" src="${src(h)}">`:''}<button type="button" class="btn" data-a="fpick" data-foto="${esc(k)}">${IC.cam} ${h?'Reemplazar foto':'Tomar o elegir foto'}</button></div>`}).join('');
  return`<div class="card"><div class="row sp"><div><div class="h">Formato de garantía · ${esc(o.marca||'sin marca')}</div><div class="mut">${f.esp?'Formato propio de la marca.':'Formato general: la marca aún no tiene uno propio (se edita en Configuración › Garantías).'}</div></div><span class="chip ${fl?'w':'g'}">${fl?fl+' pendiente'+(fl>1?'s':''):IC.ok+' Completo'}</span></div>
  <label class="f">Folio de la orden original<input data-p="ref" value="${esc(o.ref||'')}" placeholder="Ej. SP-0002L" autocomplete="off"></label>${ro?`<div class="row"><button type="button" class="btn sm" data-a="abrir" data-f="${esc(o.ref)}">Ver orden original ${esc(o.ref)}</button></div>`:''}</div>
  <div class="card"><div class="h">Datos del reporte</div><div class="gar-g">${cp||'<div class="mut">Este formato no tiene campos.</div>'}</div></div>
  <div class="h" style="margin:4px 0 0">Evidencias</div><div class="gar-f">${ft||'<div class="mut">Este formato no pide fotos.</div>'}</div>
  <div class="row"><button type="button" class="btn" data-a="garimp">Imprimir formato de garantía</button></div>`}
function gpPinta(q){const el=$('#gpl');if(!el)return;const n=String(q||'').toLowerCase().trim(),L=mine().filter(o=>o.tipo!=='G'&&(!n||[o.folio,o.cliente,o.placas,o.vin,o.modelo].join(' ').toLowerCase().includes(n))).sort((a,b)=>(b.fing||0)-(a.fing||0)).slice(0,8);
  el.innerHTML=L.length?L.map(o=>`<button type="button" class="btn gar-li" data-a="clon" data-f="${esc(o.folio)}"><span class="fol">${esc(o.folio)}</span><span>${esc(o.cliente||'Sin cliente')} · ${esc([o.marca,o.modelo].filter(Boolean).join(' '))}</span></button>`).join(''):'<div class="mut">No hay órdenes con ese dato.</div>'}
function garImp(o){const f=garFmtDe(o.marca),v=(o.garD&&o.garD.v)||{},s=datosAg(o.suc),
  fv=(c)=>{const x=v[c.k]==null?'':String(v[c.k]);return c.t==='f'&&x?esc(fechaMx(x)):c.t==='n'&&x?esc(fmtKm(x)):esc(x).replace(/\n/g,'<br>')},
  fo=f.fotos.map(x=>{const h=gFoto(o,x);return`<td style="width:33%;text-align:center;vertical-align:top"><b>${esc(x.n)}</b><br>${h?`<img src="${src(h)}" style="max-width:100%;max-height:150px">`:'<i>Sin foto</i>'}</td>`});
  while(fo.length%3)fo.push('<td></td>');const fr=[];for(let i=0;i<fo.length;i+=3)fr.push('<tr>'+fo.slice(i,i+3).join('')+'</tr>');
  $('#print').innerHTML=`<h1>FORMATO DE GARANTÍA${o.marca?' · '+esc(mkG(o.marca)):''}</h1><div style="text-align:center">${esc(s.n)} ${esc(s.d)} ${esc(s.t)}</div>
  <table style="margin-top:6px"><tr><td><b>FOLIO:</b> ${esc(o.folio)}</td><td><b>ORDEN ORIGINAL:</b> ${esc(o.ref||'')}</td><td><b>FECHA:</b> ${new Date(o.fing||Date.now()).toLocaleDateString('es-MX')}</td></tr>
  <tr><td colspan="2"><b>CLIENTE:</b> ${esc(o.cliente)}</td><td><b>TELÉFONO:</b> ${esc(o.tel)}</td></tr>
  <tr><td><b>MODELO:</b> ${esc(o.marca)} ${esc(o.modelo)} ${esc(o.anio)}</td><td><b>SERIE:</b> ${esc(o.vin)}</td><td><b>PLACAS:</b> ${esc(o.placas)}</td></tr></table>
  <table style="margin-top:6px"><tr><th style="width:34%">CONCEPTO</th><th>DETALLE</th></tr>${f.campos.map(c=>`<tr><td><b>${esc(c.n)}</b></td><td>${fv(c)}</td></tr>`).join('')}</table>
  ${fr.length?`<table style="margin-top:6px"><tr><th colspan="3">EVIDENCIAS</th></tr>${fr.join('')}</table>`:''}
  <table style="margin-top:10px"><tr>${['Cliente','Asesor de servicio','Técnico'].map(n=>`<td style="text-align:center;height:70px;vertical-align:bottom"><b>${n}</b></td>`).join('')}</tr></table>`;
  setTimeout(()=>print(),150)}
// editor de formatos (Configuración › Garantías)
let gfM='';
function gfTarget(){S.garFmt=S.garFmt||{def:null,marcas:{}};const g=S.garFmt;g.marcas=g.marcas||{};if(!gfM){if(!g.def)g.def=cpG(GAR_DEF);return g.def}return g.marcas[gfM]||null}
function rxGar(cfg){const v=cfg&&cfg.garantia_fmt;if(!v||S.garFmtPend)return;try{const j=typeof v==='string'?JSON.parse(v):v;if(j&&typeof j==='object'){const n={def:j.def||null,marcas:j.marcas||{}};if(JSON.stringify(n)!==JSON.stringify(S.garFmt||{def:null,marcas:{}})){S.garFmt=n;save();if(!D&&view==='board')renderMain()}}}catch{}}
async function subeGar(){if(!S.garFmtPend)return'ok';try{const x=await api.taller({action:'guardarConfig',cfgK:'garantia_fmt',cfgV:JSON.stringify(S.garFmt||{def:null,marcas:{}})});if(x&&x.success){S.garFmtPend=false;save();return'ok'}return/inv[aá]lida/i.test((x&&x.message)||'')?'viejo':'error'}catch{return'error'}}
function gfSave(){S.garFmtPend=true;save();acts.cfg();subeGar().then(r=>{if(r==='viejo')toast('Se guardó en este dispositivo. Actualiza el script del taller (v14) para compartir los formatos con las demás pantallas.','inf');else if(r==='error')toast('Sin conexión: el formato se compartirá al sincronizar','inf')})}
function cfgGar(){const g=S.garFmt||{},ms=g.marcas||{},marcas=[...new Set([...Object.keys(ms),...S.orders.map(o=>mkG(o.marca)).filter(Boolean)])].sort();if(gfM&&!marcas.includes(gfM))marcas.push(gfM);
  const own=gfM?ms[gfM]:(g.def||GAR_DEF),pend=S.garFmtPend?'<span class="chip w">Pendiente de sincronizar</span>':'<span class="chip g">Sincronizado</span>';
  const sel=`<label class="f">Marca<select data-gfm="1"><option value="">Formato general (todas las marcas)</option>${marcas.map(m=>`<option value="${esc(m)}" ${m===gfM?'selected':''}>${esc(m)}${ms[m]?' · formato propio':''}</option>`).join('')}</select></label>`;
  const add=`<div class="gf-add"><label class="f">Agregar otra marca<input id="gfn" maxlength="30" placeholder="Ej. ITALIKA" autocomplete="off"></label><button type="button" class="btn" data-a="gfnew">Crear formato</button></div>`;
  const bt=(l,i,n)=>`<span class="gf-b"><button type="button" class="btn sm" data-a="gfmv" data-l="${l}" data-i="${i}" data-d="-1" ${i?'':'disabled'} aria-label="Subir">↑</button><button type="button" class="btn sm" data-a="gfmv" data-l="${l}" data-i="${i}" data-d="1" ${i<n-1?'':'disabled'} aria-label="Bajar">↓</button><button type="button" class="btn sm dng" data-a="gfdel" data-l="${l}" data-i="${i}" aria-label="Quitar">✕</button></span>`;
  let ed;
  if(!own)ed=`<section class="cl-card"><div class="cl-nada"><b>${esc(gfM)} usa el formato general</b><br>Crea un formato propio si esta marca pide campos o fotos distintos.</div><div class="row"><button type="button" class="btn pri" data-a="gfown">Crear formato propio (copia del general)</button></div></section>`;
  else{const C=own.campos||[],F=own.fotos||[];
   ed=`<section class="cl-card" aria-label="Campos del formato"><div class="cl-h"><span>Campos del formato</span><span class="chip n">${C.length}</span></div><div class="gf-list">${C.map((c,i)=>`<div class="gf-row"><label class="f gf-n"><span class="sr">Nombre del campo ${i+1}</span><input data-gfe="campos.${i}.n" value="${esc(c.n)}" maxlength="60" autocomplete="off"></label><label class="f gf-t"><span class="sr">Tipo</span><select data-gfe="campos.${i}.t">${GAR_T.map(([k,t])=>`<option value="${k}" ${k===c.t?'selected':''}>${t}</option>`).join('')}</select></label><label class="gf-r"><input type="checkbox" data-gfe="campos.${i}.r" ${c.r?'checked':''}> Obligatorio</label>${bt('campos',i,C.length)}</div>`).join('')}</div><div class="row"><button type="button" class="btn" data-a="gfadd" data-l="campos">+ Agregar campo</button></div></section>
<section class="cl-card" aria-label="Fotos de evidencia"><div class="cl-h"><span>Fotos de evidencia</span><span class="chip n">${F.length}</span></div><div class="gf-list">${F.map((c,i)=>`<div class="gf-row"><label class="f gf-n"><span class="sr">Nombre de la foto ${i+1}</span><input data-gfe="fotos.${i}.n" value="${esc(c.n)}" maxlength="60" autocomplete="off"></label><label class="gf-r"><input type="checkbox" data-gfe="fotos.${i}.r" ${c.r?'checked':''}> Obligatoria</label>${bt('fotos',i,F.length)}</div>`).join('')}</div><div class="row"><button type="button" class="btn" data-a="gfadd" data-l="fotos">+ Agregar foto</button></div></section>
<div class="row"><button type="button" class="btn dng" data-a="gfrst">${gfM?'Quitar el formato propio de '+esc(gfM):'Restablecer el formato general'}</button></div>`}
  return`<div class="cl-top"><div><div class="h" style="margin:0">Formatos de garantía</div><p class="mut" style="margin:2px 0 0">Cada marca pide un formato distinto: define los campos y las fotos que debe llevar la orden de garantía. Si una marca no tiene formato propio se usa el general. Aplica a todas las agencias.</p></div>${pend}</div>
<section class="cl-card"><div class="cl-f">${sel}</div>${add}</section>${ed}`}
function cfgAsp(){const t=temaG();
  return`<div class="cfg-g">Aspecto</div><div class="mut">Elige cómo se ve el Taller en este dispositivo.</div>
<div class="seg cfg-seg">${[['claro','Claro'],['oscuro','Oscuro'],['sistema','Igual que el sistema']].map(([k,n])=>`<button class="tema-op ${k===t?'on':''}" data-a="tema" data-tm="${k}" aria-pressed="${k===t}">${n}</button>`).join('')}</div>`}
function cfgNot(){const so=sndOn();
  return`<div class="cfg-g">Avisos con sonido</div><div class="row"><span class="chip ${so?'g':'w'}">${so?'Sonido activado en este dispositivo':'Sonido en silencio en este dispositivo'}</span></div><div class="mut">Suena un aviso cuando una orden cambia de etapa o entra una nueva desde otra pantalla con la app abierta; al mover una orden tú mismo suena un tono de confirmación. Puede tardar hasta 30 segundos en llegar. Esta opción es solo de este dispositivo.</div>
<div class="seg cfg-seg"><button class="${so?'on':''}" data-a="snd" data-v="1" aria-pressed="${so}">Sonido activado</button><button class="${so?'':'on'}" data-a="snd" data-v="0" aria-pressed="${!so}">Silencio</button></div>
<div class="row"><button class="btn" data-a="sndtest">Probar sonido</button></div>`}
function cfgColab(){const ag=S.suc;
  if(!ag)return`<div class="cl-nada"><b>Elige una agencia</b><br>Usa el botón de la agencia (arriba a la derecha) para administrar a sus colaboradores.</div>`;
  const tot=(S.colab||[]).filter(c=>agN(c.a)===agN(ag)).length;
  const cards=PUESTOS.map(([p,pl,sing])=>{const L=(S.colab||[]).filter(c=>c.p===p&&agN(c.a)===agN(ag)).sort((x,y)=>x.n.localeCompare(y.n,'es'));
    return`<section class="cl-card" aria-label="${pl}"><div class="cl-h"><span>${pl}</span><span class="chip n">${L.length}</span></div>${L.length?L.map(c=>`<div class="cl-row"><span class="cl-av" aria-hidden="true">${esc(ini(c.n))}</span><span class="cl-n"><span class="cl-nm">${esc(c.n)}</span><span class="chip g">Activo</span></span><button type="button" class="btn sm dng" data-a="colbaja" data-pu="${p}" data-nm="${esc(c.n)}" aria-label="Dar de baja a ${esc(c.n)}">Dar de baja</button></div>`).join(''):`<div class="cl-nada">Sin registrar. Da de alta a tu primer ${sing.toLowerCase()} en el formulario de abajo.</div>`}</section>`}).join('');
  return`<div class="cl-top"><div><div class="h" style="margin:0">Colaboradores · ${esc(ag)}</div><p class="mut" style="margin:2px 0 0">Salen como sugerencia en Asesor de servicio, Asesor de refacciones y Técnico principal. Los campos siguen permitiendo escribir otro nombre.</p></div><span class="chip n">${tot} activo${tot===1?'':'s'}</span></div>
<div class="cl-grid">${cards}</div>
<section class="cl-card" aria-label="Dar de alta a un colaborador"><div class="cl-h"><span>Dar de alta a un colaborador</span></div><div class="cl-f"><label class="f">Puesto<select id="colp">${PUESTOS.map(([p,,x])=>`<option value="${p}">${x}</option>`).join('')}</select></label><label class="f cl-fn">Nombre completo<input id="coln" autocomplete="off" placeholder="Nombre y apellidos"></label><button type="button" class="btn pri" data-a="coladd">Dar de alta en ${esc(ag)}</button></div><div class="mut" id="colst" role="status" aria-live="polite"></div></section>`}
function cfgPanel(){if(!agE())return'<div class="h" style="margin:0">Panel de control</div><p class="mut">Elige una agencia (botón de arriba) para personalizar sus columnas.</p>';const c=cfgE(),ex=new Set(c.extra.map(x=>x.k));
  const filas=ETAPAS.map(([k,n,col],i)=>{const cu=ex.has(k),no=S.orders.filter(o=>o.etapa===k).length,cn=no+' orden'+(no===1?'':'es');
    return`<div class="pc-row"><span class="pc-dot" style="background:${col}" aria-hidden="true"></span><label class="pc-n"><span class="sr">Nombre de la columna ${i+1}</span><input data-etren="${esc(k)}" value="${esc(n)}" maxlength="24" autocomplete="off"></label><span class="chip ${cu?'w':'n'}">${cu?'Personalizada':'Fija'}</span>${cu?`<span class="pc-sw" role="group" aria-label="Color de ${esc(n)}">${COLS_ET.map(([h,nm])=>`<button type="button" class="sw${h===col?' on':''}" style="background:${h}" data-a="etcol" data-k="${esc(k)}" data-c="${h}" aria-label="${nm}" aria-pressed="${h===col}"></button>`).join('')}</span><span class="pc-fx mut">${cn}</span><button type="button" class="btn sm dng" data-a="etdel" data-k="${esc(k)}" aria-label="Eliminar la columna ${esc(n)}">Eliminar</button>`:`<span class="pc-fx mut">Posición y color fijos · ${cn}</span>`}</div>`}).join('');
  const opts='<option value="^">Al inicio (después de Citas)</option>'+ETAPAS.filter(e=>e[0]!=='entregado').map(([k,n])=>`<option value="${esc(k)}">Después de ${esc(n)}</option>`).join('');
  return`<div class="cl-top"><div><div class="h" style="margin:0">Panel de control</div><p class="mut" style="margin:2px 0 0">Columnas del panel de trabajos de <b>${esc(S.suc||'—')}</b>: cada agencia arma su propio flujo. Las 6 originales no se pueden mover ni eliminar, pero sí cambiarles el nombre; Citas siempre es la primera y Entregado la última; las nuevas van entre ambas, donde elijas. Los cambios se aplican en todas las pantallas de esta agencia al sincronizar.</p></div>${pendE()[agE()]?'<span class="chip w">Pendiente de sincronizar</span>':'<span class="chip g">Sincronizado</span>'}</div>
<section class="cl-card" aria-label="Columnas del panel"><div class="cl-h"><span>Columnas del panel</span><span class="chip n">${ETAPAS.length}</span></div><div class="pc-list">${filas}</div></section>
<section class="cl-card" aria-label="Agregar una columna"><div class="cl-h"><span>Agregar una columna</span></div><div class="cl-f"><label class="f cl-fn">Nombre de la columna<input id="etn" maxlength="24" autocomplete="off" placeholder="Ej. Esperando refacciones"></label><label class="f">Colocar<select id="eta">${opts}</select></label></div><div class="pc-add"><span class="mut" id="etcl">Color</span><span class="pc-sw sw-add" role="group" aria-labelledby="etcl">${COLS_ET.map(([h,nm])=>`<button type="button" class="sw${h===etC?' on':''}" style="background:${h}" data-a="etsw" data-c="${h}" aria-label="${nm}" aria-pressed="${h===etC}"></button>`).join('')}</span><button type="button" class="btn pri" data-a="etadd">Agregar columna</button></div></section>`}
const acts={
 pin:d=>{const u=UI();if(u.pin[d.f])delete u.pin[d.f];else u.pin[d.f]=1;save();renderMain()},
 ccard:d=>{const u=UI();if(u.cc[d.f])delete u.cc[d.f];else u.cc[d.f]=1;save();renderMain()},
 ccol:d=>{const u=UI();if(u.col[d.k])delete u.col[d.k];else u.col[d.k]=1;save();renderMain()},
 usamoto:d=>{const o=D&&O(D),m=MOTOS.sug&&MOTOS.sug.motos[+d.i];if(!o||!m)return;o.vin=m.vin;MOTOS.cache[m.vin]=m;llenaMoto(o,m);const r=vinInfo(o.vin);if(r.anio&&!String(o.anio||'').trim()){o.anio=String(r.anio);o.anioAuto=true}touch(o);renderDrawer()},
 vinanio:d=>{const o=O(D);o.anio=String(d.y);o.anioAuto=true;touch(o);renderDrawer()},
 vinmarca:d=>{const o=O(D);o.marca=d.m;delete o.marcaAuto;touch(o);renderDrawer()},
 vinmodelo:d=>{const o=O(D);o.modelo=d.m;delete o.modeloAuto;touch(o);renderDrawer()},
 bdel:d=>{const o=O(D),f=o.fotos[d.foto],u=f&&(f.u||'');if(u&&!u.startsWith('data:'))(o.rmf=o.rmf||[]).push(u);delete o.fotos[d.foto];touch(o);renderDrawer()},
 tarsave:async()=>{if(!puedeRep()||!S.suc)return;const v=parseFloat(String($('#tar').value).replace(',','.'));if(!(v>=0))return toast('Escribe un monto válido por hora','err');
  S.tarifas=S.tarifas||{};S.tarifas[S.suc]=Math.round(v*100)/100;(S.tarPend=S.tarPend||{})[S.suc]=true;save();renderMain();
  const r=await subeTarifas();if(r==='ok')toast('Tarifa guardada para '+S.suc);else if(r==='viejo')toast('Tarifa guardada en este dispositivo. Falta actualizar el Apps Script (v5) para compartirla con los demás.','err');else toast('Tarifa guardada en este dispositivo; se subirá al sincronizar','inf')},
 tab:d=>{tab=d.k;renderMain()},view:d=>{view=d.v;render()},abrir:d=>{D=d.f;dt='u';qopen.clear();keepSc=false;render()},cerrard:()=>{D=null;render()},dtab:d=>{dt=d.k;keepSc=false;renderDrawer()},
 cerrar:(d,e)=>{if(e.target.classList.contains('ov'))$('#modal').innerHTML=''},cerrarx:()=>{$('#modal').innerHTML=''},
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
 agset:d=>{S.suc=d.k;migrarLeg();aplicaEtapas();syncSoon(300);$('#modal').innerHTML='';D=null;render()},crear:d=>{if(d.t==='G')return acts.garpick();$('#modal').innerHTML='';crear(d.t)},
 mv:d=>sheet('<div class="h">Mover a…</div>'+ETAPAS.map(([k,n])=>`<button class="btn ${O(d.f).etapa===k?'pri':''}" data-a="mvto" data-f="${d.f}" data-k="${k}">${n}</button>`).join('')),
 mvto:d=>{$('#modal').innerHTML='';document.querySelectorAll('.mmenu').forEach(m=>m.remove());mover(O(d.f),d.k)},
 mvmenu:(d,e)=>{const w=e.target.closest('.split,.mvw');if(!w)return;const abierto=!!w.querySelector('.mmenu');document.querySelectorAll('.mmenu').forEach(m=>m.remove());document.querySelectorAll('[data-a="mvmenu"]').forEach(x=>x.setAttribute('aria-expanded','false'));if(abierto)return;const o=O(d.f);if(!o)return;
  w.querySelector('[data-a="mvmenu"]').setAttribute('aria-expanded','true');
  w.insertAdjacentHTML('beforeend',`<div class="mmenu" role="menu" aria-label="Mover a"><div class="mh">Mover a…</div>${ETAPAS.map(([k,n,c])=>{const act=o.etapa===k,r=act?'':puede(o,k);return`<button type="button" role="menuitem" class="mi${act?' on':''}${r?' blk':''}" ${act?'disabled aria-current="true"':''} data-a="mvto" data-f="${o.folio}" data-k="${k}" ${r?`title="${esc(r)}"`:''}><i style="background:${c}"></i><span>${n}</span>${act?'<small>Etapa actual</small>':''}</button>`}).join('')}</div>`)},sig:d=>{const o=O(d.f);mover(o,sig(o))},
 gar:d=>{const o=O(D);if(!o)return;if(d.k==='1'){if(o.tipo==='G')return;return acts.clonq({f:o.folio})}if(o.tipo==='G')return toast('Una orden de garantía siempre es garantía','inf');o.gar=false;touch(o);renderDrawer()},
 inv:d=>{const o=O(D),x=o.inv[+d.n];x.p=!x.p;if(x.p&&!(x.c>0))x.c=1;touch(o);renderDrawer()},invall:()=>{const o=O(D);o.inv.forEach(x=>{x.p=true;if(!(x.c>0))x.c=1});touch(o);renderDrawer()},
 pfo:d=>{const i=+d.i;pfo.has(i)?pfo.delete(i):pfo.add(i)},dsel:d=>{ds=+d.i;renderDrawer()},ddel:d=>{const o=O(D);o.danos.splice(+d.i,1);ds=-1;touch(o);renderDrawer()},
 dmark:(d,e)=>{const o=O(D),r=e.target.closest('.mw').getBoundingClientRect();(o.danos=o.danos||[]).push({x:+((e.clientX-r.left)/r.width*100).toFixed(1),y:+((e.clientY-r.top)/r.height*100).toFixed(1),t:'Rayado',n:''});ds=o.danos.length-1;touch(o);renderDrawer()},
 tcerrar:()=>{$('#toast').style.display='none'},dno:()=>cerrarAsk(null),dnop:()=>{},dsi:()=>{const i=$('#dlgi');cerrarAsk(i?i.value.trim():true)},
 syncnow:async()=>{if(!sesion)return;toast('Sincronizando…');await sync();pintaSyn();if(/clave/i.test(syncMsg)){const k=await ask({t:'Clave del taller',m:'El servidor pide una clave: es la de TALLER_CLAVE en el Apps Script del taller.',input:'Clave',ok:'Guardar',tipo:'err'});if(k){localStorage.setItem('taller_clave',k.trim());await sync();pintaSyn()}}toast(syncMsg?'No se pudo sincronizar: '+syncMsg:'Sincronizado · '+mine().length+' órdenes en '+(S.suc||'—')+' ('+S.orders.length+' en total)')},
 lcond:d=>{const o=O(D);o.llantas[+d.i].e=d.e;touch(o);renderDrawer()},
 fdel:d=>{const o=O(D),k=d.k==='l'?o.llantas[+d.i]:d.k==='d'?o.danos[+d.i]:o.chk[+d.i],j=+d.j,u=j===0?k.f:(k.fx||[])[j-1];if(typeof u==='string'&&u&&!u.startsWith('data:'))(o.rmf=o.rmf||[]).push(u);if(j===0)k.f=(k.fx||[]).shift()||null;else k.fx.splice(j-1,1);touch(o);renderDrawer()},
 cond:d=>{const o=O(D),i=+d.i;o.chk[i].e=d.e;if(d.e!=='nr')CATS[i][2].forEach(n=>{o.inv[n].p=true;if(!(o.inv[n].c>0))o.inv[n].c=1});touch(o);renderDrawer()},
 pc:d=>{const o=O(D),c=o.chk[+d.i];if(enCot(o,+d.i))return toast('Este hallazgo ya está en la cotización');o.lineas.push({t:'ref',sku:'HALLAZGO',ck:+d.i,desc:CATS[+d.i][0]+': '+(c.op?c.op+(c.n?' ('+c.n+')':''):(c.n||COND.find(x=>x[0]===c.e)[2])),cant:1,precio:0,min:0,st:o.tipo==='G'?'gar':'pend',f:c.f||null});qopen.add(o.lineas.length-1);touch(o);renderDrawer();toast('Agregado a la cotización (pon su precio en la pestaña Cotización)')},
 firma:d=>abrirFirma(u=>{const o=O(D),f=o.firmas[d.k]||{};delete f.u;f.d=u;o.firmas[d.k]=f;touch(o);renderDrawer()}),
 dl:d=>{const o=O(D);o.lineas.splice(+d.i,1);qopen.clear();touch(o);renderDrawer()},
 qexp:d=>{const i=+d.i;qopen.has(i)?qopen.delete(i):qopen.add(i);renderDrawer()},
 qpc:d=>{const o=O(D),l=o.lineas[+d.i];if(l&&l.pc){l.precio=l.pc;touch(o);renderDrawer()}},
 aut:d=>{const o=O(D),l=o.lineas[+d.i],k=(l.st===d.k&&d.k!=='pend')?'pend':d.k;l.st=k;if(k==='rech'){if(!l.seg)l.seg=addD(30)}else{delete l.cerr;delete l.rg}touch(o);renderDrawer()},
 rguardar:d=>{const o=O(D),l=o.lineas[+d.i];if(!l.mot)return toast('Selecciona el motivo del rechazo','err');if(!/^\d{4}-\d{2}-\d{2}$/.test(l.seg||''))return toast('Falta la fecha de seguimiento','err');l.rg=Date.now();touch(o);renderDrawer();sync();toast('Rechazo guardado: aparece en Seguimientos')},
 redit:d=>{const o=O(D);delete o.lineas[+d.i].rg;touch(o);renderDrawer()},
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
 clon:d=>{const o=O(d.f);if(!o)return;$('#modal').innerHTML='';const x=garCopia(o);if(o.tipo!=='G'&&o.gar){o.gar=false;touch(o)}crear('G',x).then(()=>{dt='ga';render()})},
 print:()=>imprimir(O(D)),
 sgwa:d=>{const o=O(d.f);wa(o.tel,d.k==='l'?`Hola ${o.cliente}, te escribimos de ${o.suc}. Quedó pendiente en tu ${o.modelo}: ${o.lineas[+d.i].desc}. ¿Lo programamos?`:`Hola ${o.cliente}, ya toca el siguiente servicio de tu ${o.modelo}${o.prox.km?' (a los '+fmtKm(o.prox.km)+' km)':''}. ¿Te agendamos una cita en ${o.suc}?`)},
 sgre:async d=>{const o=O(d.f),l=o.lineas[+d.i],v=await ask({t:'Nueva fecha de seguimiento',input:'Fecha',type:'date',def:l.seg||addD(15),ok:'Guardar'});if(v&&/^\d{4}-\d{2}-\d{2}$/.test(v)){l.seg=v;touch(o);renderMain()}},
 sgok:d=>{const o=O(d.f),l=o.lineas[+d.i];l.cerr=true;touch(o);crear('SR',{cliente:o.cliente,tel:o.tel,email:o.email||'',dir:o.dir,modelo:o.modelo,marca:o.marca,anio:o.anio,motor:o.motor,vin:o.vin,placas:o.placas||'',km:o.km,ref:o.folio,lineas:[Object.assign({},l,{st:'aut',cerr:false,mot:'',seg:''})]})},
 sgcita:d=>{const o=O(d.f);o.prox.cerr=true;touch(o);crear('SP',{cliente:o.cliente,tel:o.tel,email:o.email||'',dir:o.dir,modelo:o.modelo,marca:o.marca,anio:o.anio,motor:o.motor,vin:o.vin,placas:o.placas||'',km:o.km,ref:o.folio})},
 sgx:d=>{const o=O(d.f);if(d.k==='l')o.lineas[+d.i].cerr=true;else o.prox.cerr=true;touch(o);renderMain()},
 coladd:async()=>{if(!puedeRep()||!S.suc)return;const p=$('#colp').value,n=agN($('#coln').value),st=$('#colst'),msg=t=>{if(st)st.textContent=t};
  if(n.length<3)return toast('Escribe el nombre completo del colaborador','err');
  if(colDe(p,S.suc).some(x=>agN(x)===n))return toast('Ya está en la lista de esta agencia','inf');
  msg('Guardando…');
  try{const r=await api.taller({action:'guardarColaborador',agencia:S.suc,puesto:p,nombre:n,activo:true});
   if(!r||!r.success){msg(/desconocida/i.test((r&&r.message)||'')?'Actualiza el script del taller a la v8 y vuelve a intentar.':'No se pudo guardar: '+((r&&r.message)||'sin respuesta'));return}
   (S.colab=S.colab||[]).push({a:agN(S.suc),p,n});save();acts.cfg();toast('Colaborador agregado')}catch{msg('Sin conexión: no se pudo guardar. Inténtalo de nuevo.')}},
 colbaja:async d=>{if(!puedeRep()||!S.suc)return;
  if(!(await ask({t:'Dar de baja',m:'¿Dar de baja a '+d.nm+' de '+S.suc+'? Ya no saldrá como sugerencia; sus órdenes anteriores conservan el nombre.',ok:'Dar de baja',tipo:'err'})))return;
  try{const r=await api.taller({action:'guardarColaborador',agencia:S.suc,puesto:d.pu,nombre:d.nm,activo:false});
   if(!r||!r.success){toast('No se pudo dar de baja: '+((r&&r.message)||'sin respuesta'),'err');return}
   S.colab=(S.colab||[]).filter(c=>!(c.p===d.pu&&agN(c.a)===agN(S.suc)&&agN(c.n)===agN(d.nm)));save();acts.cfg();toast('Colaborador dado de baja','ok')}catch{toast('Sin conexión: no se pudo dar de baja','err')}},
 cfg:d=>{const sc0=!(d&&d.reset)&&document.querySelector('.cfg-body')?document.querySelector('.cfg-body').scrollTop:0,rp=puedeRep();if(!rp&&(cfgT==='c'||cfgT==='p'||cfgT==='w'))cfgT='g';const T=[['g','General'],['a','Aspecto'],['n','Notificaciones']].concat(rp?[['c','Colaboradores'],['p','Panel de control'],['w','Garantías']]:[]),B={c:cfgColab,p:cfgPanel,w:cfgGar,a:cfgAsp,n:cfgNot}[cfgT]||cfgGen;
  sheet(`<div class="cfg-top"><div class="h">Configuración</div><div class="cfg-tabs" role="tablist" aria-label="Secciones de configuración">${T.map(([k,n])=>`<button type="button" class="cfg-tab" role="tab" aria-selected="${k===cfgT}" data-a="cfgt" data-t="${k}">${n}</button>`).join('')}</div></div><div class="cfg-body" role="tabpanel">${B()}</div>`,'cfg');const nb=document.querySelector('.cfg-body');if(nb&&sc0)nb.scrollTop=sc0},
 gfset:d=>{if(!puedeRep())return;const f=gfTarget();if(!f)return;const[l,i,q]=String(d.p||'').split('.'),x=(f[l]||[])[+i];if(!x)return;let v=d.v;
  if(q==='n'){v=String(v||'').trim().replace(/\s+/g,' ');if(v.length<2){toast('El nombre debe tener al menos 2 letras','err');return acts.cfg()}}else if(q==='r')v=v?1:0;else if(q==='t'&&!GAR_T.some(t=>t[0]===v))return;else if(q!=='t')return;
  x[q]=v;gfSave()},
 gfmv:d=>{if(!puedeRep())return;const f=gfTarget(),L=f&&f[d.l];if(!L)return;const i=+d.i,j=i+(+d.d);if(j<0||j>=L.length)return;[L[i],L[j]]=[L[j],L[i]];gfSave()},
 gfdel:d=>{if(!puedeRep())return;const f=gfTarget(),L=f&&f[d.l];if(!L||!L[+d.i])return;L.splice(+d.i,1);gfSave();toast('Quitado del formato. Las órdenes ya capturadas conservan sus datos.','ok')},
 gfadd:d=>{if(!puedeRep())return;const f=gfTarget(),L=f&&f[d.l];if(!L)return;const x={k:'c'+Date.now().toString(36),n:d.l==='campos'?'Nuevo campo':'Nueva foto'};if(d.l==='campos')x.t='x';L.push(x);gfSave()},
 gfnew:()=>{if(!puedeRep())return;const m=mkG(($('#gfn')||{}).value);if(m.length<2)return toast('Escribe el nombre de la marca (mínimo 2 letras)','err');gfM=m;const g=(S.garFmt=S.garFmt||{def:null,marcas:{}});g.marcas=g.marcas||{};if(!g.marcas[m])g.marcas[m]=cpG(g.def||GAR_DEF);gfSave()},
 gfown:()=>{if(!puedeRep()||!gfM)return;const g=(S.garFmt=S.garFmt||{def:null,marcas:{}});g.marcas=g.marcas||{};g.marcas[gfM]=cpG(g.def||GAR_DEF);gfSave()},
 gfrst:()=>{if(!puedeRep())return;const g=(S.garFmt=S.garFmt||{def:null,marcas:{}});if(gfM){delete(g.marcas||{})[gfM];gfM=''}else g.def=cpG(GAR_DEF);gfSave();toast('Listo','ok')},
 abrirga:d=>{acts.abrir(d);dt='ga';render()},
 garpick:()=>{sheet(`<div class="h">Orden de garantía</div><div class="mut">¿De qué orden de trabajo viene la garantía? Se copian el cliente, la unidad y la inspección, y la orden queda con el folio G.</div><label class="f">Buscar orden<input id="gpq" placeholder="Folio, cliente, placas o serie" autocomplete="off"></label><div id="gpl" class="gp-l"></div><button class="btn" data-a="gpsin">Sin orden original</button>`);gpPinta('')},
 gpsin:()=>{$('#modal').innerHTML='';crear('G',{garD:{v:{frep:iso()}}}).then(()=>{dt='ga';render()})},
 garimp:()=>{const o=D&&O(D);if(o)garImp(o)},
 clonq:d=>{const o=O(d.f);if(!o)return;sheet(`<div class="h">Crear orden de garantía</div><div class="mut">Se creará una orden de garantía con los datos del cliente y de la unidad, ligada a <b>${esc(o.folio)}</b>. Después llenas el formato de la marca (${esc(mkG(o.marca)||'sin marca')}) y levantas las evidencias.</div><button class="btn pri" data-a="clon" data-f="${esc(o.folio)}">Crear orden de garantía</button><button class="btn" data-a="cerrarx">Cancelar</button>`)},
 cfgt:d=>{cfgT=d.t;acts.cfg({reset:1})},
 sndtog:()=>{UI().snd=!sndOn();save();unlockAudio();pintaHd();toast(sndOn()?'Sonido activado':'Sonido en silencio','i');if(sndOn())setTimeout(()=>beep(),80)},
 snd:d=>{UI().snd=d.v==='1';save();unlockAudio();pintaHd();acts.cfg();if(sndOn())setTimeout(()=>beep(),80)},
 sndtest:()=>{unlockAudio();setTimeout(()=>beep(),80)},
 etsw:d=>{etC=d.c;document.querySelectorAll('.sw-add .sw').forEach(b=>{const on=b.dataset.c===etC;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})},
 etadd:()=>{if(!puedeRep()||!agE())return toast("Elige una agencia (botón de arriba) para personalizar sus columnas","inf");const n=($('#etn').value||'').trim().replace(/\s+/g,' '),a=$('#eta').value;
  if(n.length<2)return toast('Escribe el nombre de la columna (mínimo 2 letras)','err');
  if(ETAPAS.some(e=>agN(e[1])===agN(n)))return toast('Ya existe una columna con ese nombre','inf');
  if(cfgE().extra.length>=8)return toast('Máximo 8 columnas personalizadas','inf');
  cfgE().extra.push({k:'x_'+Date.now().toString(36),n,c:etC,a});etSave();toast('Columna agregada','ok')},
 etren:d=>{if(!puedeRep()||!agE())return toast("Elige una agencia (botón de arriba) para personalizar sus columnas","inf");const v=String(d.v||'').trim().replace(/\s+/g,' '),c=cfgE(),base=ETAPAS_BASE.find(e=>e[0]===d.k),x=c.extra.find(y=>y.k===d.k);
  if(v.length<2){toast('El nombre debe tener al menos 2 letras','err');return acts.cfg()}
  if(ETAPAS.some(e=>e[0]!==d.k&&agN(e[1])===agN(v))){toast('Ya existe una columna con ese nombre','inf');return acts.cfg()}
  if(base){if(v===base[1])delete c.ren[d.k];else c.ren[d.k]=v}else if(x)x.n=v;else return;
  etSave();toast('Nombre actualizado','ok')},
 etcol:d=>{if(!puedeRep()||!agE())return toast("Elige una agencia (botón de arriba) para personalizar sus columnas","inf");const x=cfgE().extra.find(y=>y.k===d.k);if(!x)return;x.c=d.c;etSave()},
 etdel:async d=>{if(!puedeRep()||!agE())return toast("Elige una agencia (botón de arriba) para personalizar sus columnas","inf");const c=cfgE(),x=c.extra.find(y=>y.k===d.k);if(!x)return;const n=S.orders.filter(o=>o.etapa===d.k).length;
  if(n)return toast('Mueve las '+n+' orden'+(n===1?'':'es')+' de «'+x.n+'» a otra columna antes de eliminarla','err');
  if(!(await ask({t:'Eliminar columna',m:'¿Eliminar la columna «'+x.n+'»? Se quitará del panel de esta agencia.',ok:'Eliminar',tipo:'err'})))return;
  c.extra.forEach(y=>{if(y.a===d.k)y.a=x.a});c.extra=c.extra.filter(y=>y.k!==d.k);etSave();toast('Columna eliminada','ok')},
 tema:d=>{try{localStorage.setItem('taller_tema',d.tm)}catch{}aplicarTema()},
 catup:()=>cargaCat(false),recarga:()=>recarga(),
 ojo:()=>{const i=$('#lg-p');i.type=i.type==='password'?'text':'password'},
 salir:()=>sheet('<div class="h">¿Cerrar sesión?</div><div class="mut">Tendrás que volver a iniciar sesión para entrar al Taller. Las órdenes pendientes de sincronizar se conservan en este dispositivo.</div><div class="row"><button class="btn" data-a="salirno">Cancelar</button><button class="btn red" data-a="salirsi">Cerrar sesión</button></div>'),
 salirno:()=>{$('#modal').innerHTML=''},
 salirsi:()=>{const s=sesion;if(s){try{fetch(CATALOGO_API,{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'cerrarSesionServidor',correo:s.correo,token:s.token})}).catch(()=>{})}catch{}}
  sesion=null;borrarSes();S.inv=[];S.suc='';save();$('#modal').innerHTML='';D=null;pintaHd();render();pintaLogin()}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&acts[b.dataset.a])acts[b.dataset.a](b.dataset,e)});
document.addEventListener('click',e=>{if(!e.target.closest('.split,.mvw'))document.querySelectorAll('.mmenu').forEach(m=>m.remove())});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.mmenu').forEach(m=>m.remove())});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches&&e.target.matches('article[data-a]'))acts.abrir(e.target.dataset);
  if(visorOn()){if(e.key==='Escape')cerrarVisor();else if(e.key==='ArrowLeft'&&VW.L.length>1)acts.vzprev();else if(e.key==='ArrowRight'&&VW.L.length>1)acts.vznext();else if(e.key==='+'||e.key==='=')acts.vzmas();else if(e.key==='-')acts.vzmenos();return}
  if(e.key==='Escape'){if($('#modal').innerHTML)$('#modal').innerHTML='';else if(D){D=null;render()}}});
// Completa lo que se pueda con el Serie / VIN: año, marca, modelo (por serie) y los datos de la base de motos (cliente, teléfono, dirección, fecha de compra...). Se usa al escribir, al dar clic o entrar al campo y con Enter.
function aplicaVin(o,tocar){const r=vinInfo(o.vin);
   if(r.ok&&r.anio&&(!o.anio||o.anioAuto)){o.anio=String(r.anio);o.anioAuto=true;document.querySelectorAll('[data-p="anio"]').forEach(ai=>ai.value=o.anio)}
   else if(!(r.ok&&r.anio)&&o.anioAuto){o.anio='';delete o.anioAuto;document.querySelectorAll('[data-p="anio"]').forEach(ai=>ai.value='')}
   const fb=(MOTOS.cache[o.vin]||{}).marca||r.fab;
   if(fb){if(o.marca!==fb){o.marca=fb;document.querySelectorAll('[data-p="marca"]').forEach(mi=>mi.value=o.marca)}o.marcaAuto=true}
   else if(!fb&&o.marcaAuto){o.marca='';delete o.marcaAuto;document.querySelectorAll('[data-p="marca"]').forEach(mi=>mi.value='')}
   if(o.fcompraAuto&&!MOTOS.cache[o.vin]){o.fcompra='';delete o.fcompraAuto;document.querySelectorAll('[data-p="fcompra"]').forEach(fi=>fi.value='')}
   if(o.modeloAuto&&!modVin(o)){o.modelo='';delete o.modeloAuto}
   autoModelo(o);document.querySelectorAll('[data-p="modelo"]').forEach(mi=>mi.value=o.modelo||'');
   if(tocar)touch(o);document.querySelectorAll('#vinh,.vinh').forEach(vh=>vh.innerHTML=vinH(o));document.querySelectorAll('#vinb,.vinb').forEach(vb=>vb.innerHTML=vinB(o));buscaMotoVin(o);buscaModeloVin(o);document.querySelectorAll('.vok').forEach(v=>v.classList.toggle('on',vinOk(o)))}
document.addEventListener('focusin',e=>{const t=e.target;if(t.dataset&&(t.dataset.p==='km'||t.dataset.p==='prox.km'))t.dataset.pv=t.value});   // valor con comas al entrar al campo: sirve para detectar cuando solo se borra una coma
const traeVin=e=>{const t=e.target;if(!t||!t.dataset||t.dataset.p!=='vin'||!D)return;const o=O(D);if(!o||!o.vin)return;const r=vinInfo(o.vin);if(!(r.ok||r.ebike))return;
  if(MOTOS.vt&&MOTOS.vt.v===o.vin&&Date.now()-MOTOS.vt.t<2500)return;MOTOS.vt={v:o.vin,t:Date.now()};aplicaVin(o)};
document.addEventListener('focusin',traeVin);document.addEventListener('click',traeVin);
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.dataset&&e.target.dataset.p==='vin'){e.preventDefault();if(MOTOS.vt)MOTOS.vt.t=0;traeVin(e)}});
document.addEventListener('input',e=>{const t=e.target;
  if(t.id==='gpq'){gpPinta(t.value);return}
  if(t.id==='gq'){q=t.value.trim();renderMain();return}
  const o=D&&O(D);if(!o)return;
  const mt=/^danos\.(\d+)\.t$/.exec(t.dataset.p||'');
  if(mt){const m=o.danos[+mt[1]];m.t=t.value;if(m.t===REC){if(!m.n)m.n=FI}else if(m.n===FI)m.n='';touch(o);renderDrawer();return}
  if(t.dataset.p==='placas'||t.dataset.p==='vin'){const p=t.selectionStart;t.value=t.dataset.p==='vin'?t.value.toUpperCase().replace(/\s+/g,''):t.value.toUpperCase();try{t.setSelectionRange(p,p)}catch{}}
  if(t.dataset.p==='km'||t.dataset.p==='prox.km'){let dg=t.value.slice(0,t.selectionStart).replace(/\D/g,'').length,d=t.value.replace(/\D/g,'');
   const del=e.inputType==='deleteContentBackward'?-1:e.inputType==='deleteContentForward'?0:null;
   if(del!==null&&fmtKm(d)===t.dataset.pv&&(del<0?dg>0:dg<d.length)){d=d.slice(0,dg+del)+d.slice(dg+del+1);if(del<0)dg--}   // solo borró una coma: quita el dígito vecino en vez de quedarse trabado
   t.value=fmtKm(d);t.dataset.pv=t.value;let c=0,i=0;while(i<t.value.length&&c<dg){if(/\d/.test(t.value[i]))c++;i++}try{t.setSelectionRange(i,i)}catch{}}
  if(t.dataset.p==='modelo')delete o.modeloAuto;
  if(t.dataset.p==='anio')delete o.anioAuto;
  if(t.dataset.p==='marca')delete o.marcaAuto;
  if(t.dataset.p==='fcompra')delete o.fcompraAuto;
  if(t.dataset.p){setPath(o,t.dataset.p,t.hasAttribute('data-n')?(parseFloat(String(t.value).replace(',','.'))||0):t.value);touch(o);
   if(t.dataset.p.startsWith('lineas.')){const i=t.dataset.p.split('.')[1],el=$('#imp-'+i);if(el&&o.lineas[i])el.textContent=money(imp(o.lineas[i]));const tt=$('#tot');if(tt)tt.innerHTML=totH(o)}}
  if(t.dataset.p==='vin')aplicaVin(o,true);
  if(['marca','modelo','anio','vin','km','comb','cliente'].includes(t.dataset.p))pintaFaltas(o);
  if(t.dataset.p==='tel'&&!o.vin){clearTimeout(MOTOS.tt);const tl=nTel(o.tel);if(tl.length===10)MOTOS.tt=setTimeout(()=>buscaMotosTel(o,tl),350);else{MOTOS.sug=null;pintaSug()}}
  if(t.dataset.c){o.chk[+t.dataset.c].n=t.value;touch(o)}
  if(t.id==='q2'){const s=t.value.toLowerCase();sug=s.length<2?[]:S.inv.filter(i=>(i.sku+' '+i.nombre).toLowerCase().includes(s)).slice(0,6);
   const os=O(D)&&O(D).suc;$('#sug').innerHTML=sug.map((i,k)=>{const st=stockDe(i,os);return`<button class="btn sg" data-a="add" data-i="${k}"><span class="sd"><b>${esc(i.nombre)}</b><small class="fol">${esc(i.sku)}</small></span><span class="sp"><b class="fol">${money(precioDe(i))}</b><small>${pIva(i)==null?'verifica IVA':'IVA incl.'}</small></span>${st?`<span class="ex ${st.n>0?'ok':'no'}">${st.n>0?st.n+' pzas':'Sin existencia'}</span>`:''}</button>`}).join('')||(s.length>1?'<div class="mut">Sin resultados. Conecta el catálogo en Configuración o agrega un concepto manual.</div>':'')}});
document.addEventListener('change',async e=>{const t=e.target;
   if(t.dataset&&t.dataset.etren!=null){acts.etren({k:t.dataset.etren,v:t.value});return}
  if(t.dataset&&t.dataset.gfe!=null){acts.gfset({p:t.dataset.gfe,v:t.type==='checkbox'?t.checked:t.value});return}
  if(t.dataset&&t.dataset.gfm!=null){gfM=t.value;acts.cfg({reset:1});return}
  if(t.dataset&&t.dataset.qest!=null){acts.aut({i:t.dataset.qest,k:t.value});return}
  if(t.dataset&&t.dataset.sku!=null){const o=O(D),l=o&&o.lineas[+t.dataset.sku];if(l){const v=t.value.trim(),it=v&&S.inv.find(x=>nSku(x.sku)===nSku(v));l.sku=v;
    if(it){l.desc=it.nombre;l.pc=precioDe(it);l.pf=pIva(it)==null;l.precio=l.pc;toast('Precio de catálogo aplicado (IVA incluido)','ok')}else if(v)toast('SKU no encontrado en el catálogo: pon el precio a mano','inf');
    touch(o);renderDrawer()}return}
  
  
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
  v.querySelector('.prev').hidden=v.querySelector('.next').hidden=VW.L.length<2;$('#vz-chg').hidden=!VW.T;v.hidden=false;navSync()}
function abrirVisor(L,i,T){VW.L=L;VW.i=i;VW.T=T;const tt=$('#toast');if(tt)tt.style.display='none';vzMuestra()}
function cerrarVisor(){const v=$('#visor');if(v)v.hidden=true;navSync()}
/* arrastrar y soltar: complemento en escritorio */
/* ---------- v47: el Panel se desplaza arrastrando con clic sostenido (mouse) en cualquier espacio que no sea una tarjeta o un botón ---------- */
(()=>{let kn=null,x0=0,s0=0,mv=false,sup=false;
 document.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;const k=e.target.closest&&e.target.closest('.kan');if(!k)return;if(e.target.closest('.card,button,a,input,select,textarea,label,summary'))return;kn=k;x0=e.clientX;s0=k.scrollLeft;mv=false});
 document.addEventListener('pointermove',e=>{if(!kn)return;const dx=e.clientX-x0;if(!mv&&Math.abs(dx)<4)return;mv=true;kn.classList.add('pan');kn.scrollLeft=s0-dx;e.preventDefault()});
 const fin=()=>{if(!kn)return;kn.classList.remove('pan');sup=mv;kn=null;mv=false;if(sup)setTimeout(()=>{sup=false},0)};
 document.addEventListener('pointerup',fin);document.addEventListener('pointercancel',fin);
 document.addEventListener('click',e=>{if(sup){e.stopPropagation();e.preventDefault();sup=false}},true)})();
document.addEventListener('dragstart',e=>{const k=e.target.closest&&e.target.closest('.k');if(!k)return;dragF=k.dataset.f;e.dataTransfer.setData('text/plain',dragF);k.classList.add('dg')});
document.addEventListener('dragend',()=>{dragF=null;document.querySelectorAll('.dg,.over').forEach(x=>x.classList.remove('dg','over'))});
document.addEventListener('dragover',e=>{const c=e.target.closest&&e.target.closest('.col');if(c&&c.dataset.drop&&dragF){e.preventDefault();c.classList.add('over')}});
document.addEventListener('dragleave',e=>{const c=e.target.closest&&e.target.closest('.col');if(c)c.classList.remove('over')});
document.addEventListener('drop',e=>{const c=e.target.closest&&e.target.closest('.col');if(!c||!c.dataset.drop||!dragF)return;e.preventDefault();const o=O(dragF);dragF=null;document.querySelectorAll('.over').forEach(x=>x.classList.remove('over'));if(o&&c.dataset.drop!==o.etapa)mover(o,c.dataset.drop)});

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
// El cliente ya decidió desde el enlace: la orden pasa sola a la columna Autorizado (también las que ya tenían la autorización guardada).
const autoEtapa=l=>{if(!l||!l.auth||l.auth.mv)return false;l.auth.mv=1;if(idx(l.etapa)<0||idx(l.etapa)>=idx('autorizado'))return false;logH(l,'Etapa: Autorizado (el cliente autorizó desde el enlace)');l.etapa='autorizado';touch(l);return true};
async function sync(){if(!sesion||syncing||!tallerUrl()||!navigator.onLine){if(sesion&&!navigator.onLine){syncMsg='sin internet';pintaSyn()}return}syncing=true;let err='';
  try{for(const f of [...(S.del||[])]){const r=await api.taller({action:'eliminarOrden',folio:f});if(r.success)S.del=S.del.filter(x=>x!==f);else err=r.message||'error del servidor'}
   // 1) bajar lo que hay en la hoja (y juntar las fotos que subieron otros dispositivos)
   const r=await api.taller({action:'listarOrdenes'});
   if(r.success){let ch=false,chd=false;const cam=[];(r.ordenes||[]).forEach(ro=>{if(!ro||!ro.folio||(S.del||[]).includes(ro.folio))return;migEt(ro);const l=O(ro.folio);
      if(!l){S.orders.push(ro);ch=true;cam.push({f:ro.folio,e:ro.etapa,nuevo:1})}
      else if(aplicaAuth(l,ro)){toast('El cliente autorizó '+l.folio+' desde el enlace','ok');cam.push({f:l.folio,e:l.etapa});if(D===l.folio)chd=true;else ch=true}
      else if((ro.upd||0)>(l.upd||0)&&!S.dirty.includes(l.folio)&&D!==l.folio){const pe=l.etapa;Object.assign(l,ro);ch=true;if(pe!==l.etapa)cam.push({f:l.folio,e:l.etapa})}
      else if(mergeFotos(l,ro)){if(D===l.folio)chd=true;else ch=true}
      const lx=O(ro.folio);if(autoEtapa(lx)){if(D===lx.folio)chd=true;else ch=true}});
     avisaCambios(cam);sndArmed=true;if(ch)renderMain();if(chd){if(escribiendo())pendDr=true;else{renderDrawer();renderMain()}}}
   else err=r.message||'error al leer las órdenes';
   try{const c=await api.taller({action:'leerConfig'});if(c&&c.success&&c.config){rxEtapas(c.config);rxGar(c.config);S.tarifas=S.tarifas||{};let ct=false;for(const k in c.config){const m=/^tarifa_mo\|(.+)$/.exec(k);if(m&&!(S.tarPend||{})[m[1]]&&S.tarifas[m[1]]!==Number(c.config[k])){S.tarifas[m[1]]=Number(c.config[k])||0;ct=true}}if(ct&&view==='rep'&&!escribiendo())renderMain()}
    if(Object.keys(S.tarPend||{}).length)await subeTarifas();if(Object.keys(pendE()).some(k=>pendE()[k]))await subeEtapas();if(S.garFmtPend)await subeGar()}catch{}
   if(!S.colabT||Date.now()-S.colabT>3e5)await leeColab();
   await syncCitas();
   // 2) subir lo pendiente
   for(const f of [...S.dirty]){const o=O(f);if(!o){S.dirty=S.dirty.filter(x=>x!==f);continue}const u0=o.upd,r=await api.taller({action:'guardarOrden',orden:o});if(!r.success){err=(r.message||'error del servidor')+' ('+f+')';continue}aplicarUrls(o,r.urls||{});if(o.upd===u0)S.dirty=S.dirty.filter(x=>x!==f)}
   save()}catch(e){err=String(e&&e.message||e)}syncMsg=err;syncing=false;pintaSyn();
  if(fotoPend){if(!err&&!S.dirty.length){fotoPend=false;fotoErr=false;toast('Foto sincronizada: ya se puede ver en la PC')}else if(err&&!fotoErr){fotoErr=true;toast('La foto quedó guardada en este dispositivo, pero no se pudo subir: '+err)}}
  if(!err&&S.dirty.length)syncSoon(2500)}
function rxEtapas(cfg){const k=agE(),v=k&&cfg&&cfg['etapas_cfg|'+k];if(!v||pendE()[k])return;try{const j=typeof v==='string'?JSON.parse(v):v;if(j&&typeof j==='object'&&JSON.stringify({ren:j.ren||{},extra:Array.isArray(j.extra)?j.extra:[]})!==JSON.stringify(cfgE())){S.etapasAg[k]={ren:j.ren||{},extra:Array.isArray(j.extra)?j.extra:[]};aplicaEtapas();save();if(!D&&view==='board')renderMain()}}catch{}}
async function subeEtapas(){const P=pendE(),L=Object.keys(P).filter(k=>P[k]);if(!L.length)return'ok';let res='ok';for(const k of L){try{const c=(S.etapasAg||{})[k]||{ren:{},extra:[]},x=await api.taller({action:'guardarConfig',cfgK:'etapas_cfg|'+k,cfgV:JSON.stringify(c)});if(x&&x.success){delete P[k];save()}else if(/inv[aá]lida/i.test((x&&x.message)||''))res='viejo';else if(res==='ok')res='error'}catch{if(res==='ok')res='error'}}return res}
async function syncCitas(){try{const rc=await api.taller({action:'listarCitas'});if(!rc||!rc.success)return;let ch=false;CT();(rc.citas||[]).forEach(r=>{if(!r||!r.id)return;const l=S.citas.find(x=>x.id===r.id);if(!l){S.citas.push(r);ch=true}else if((r.upd||0)>(l.upd||0)&&!S.cdirty.includes(l.id)){Object.assign(l,r);ch=true}});
  for(const id of [...S.cdirty]){const c=S.citas.find(x=>x.id===id);if(!c){S.cdirty=S.cdirty.filter(x=>x!==id);continue}const u0=c.upd,r=await api.taller({action:'guardarCita',cita:c});if(r&&r.success&&c.upd===u0)S.cdirty=S.cdirty.filter(x=>x!==id)}
  save();if(ch&&(view==='ag'||view==='board')&&!escribiendo())renderMain()}catch{}}
setInterval(sync,30000);setInterval(()=>{if(view!=='board')return;document.querySelectorAll('.card.k[data-f]').forEach(el=>{const o=O(el.dataset.f),ki=el.querySelector('.ki');if(!o||!ki)return;const a=ki.querySelector('.alr');if(a)a.remove();ki.insertAdjacentHTML('beforeend',alertaH(o,!el.classList.contains('cc')))})},30000);matchMedia('(min-width:700px)').addEventListener('change',()=>{if(view==='board')renderMain()});addEventListener('resize',ajustaKan);setInterval(()=>{pintaSyn();if(pendDr&&!escribiendo()){pendDr=false;renderDrawer()}},2000);addEventListener('online',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
/* ---------- sesión, tema y mantenimiento (estilo REPORTEADOR) ---------- */
const SK='taller_sesion',APP_BUILD='Taller Carabela · v48 · 25-11-26';
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
// Existencia solo de la agencia de la orden (misma regla del catálogo: nombre normalizado, PISTE MUEBLES = BAJAJ PISTE). Si la agencia no tiene registro del producto, es 0; nunca se suma lo de otras agencias.
const nAg=t=>String(t||'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\bPISTE MUEBLES\b/g,'BAJAJ PISTE');
const stockDe=(i,suc)=>{if(!i||!i.ex)return null;const k=nAg(suc);if(!k)return null;const hit=Object.keys(i.ex).filter(x=>{const n=nAg(x);return n===k||n.includes(k)||k.includes(n)});return{n:hit.reduce((a,x)=>a+(Number(i.ex[x])||0),0),suc:hit[0]||suc}};
async function cargaCat(quiet){if(!sesion)return;
  try{const r=await api.inventario(sesion.correo,sesion.token);if(!r.success){if(!quiet)toast(r.message||'Catálogo no disponible: vuelve a iniciar sesión');return}
    S.inv=(r.data||[]).map(i=>({sku:String(i.sku||i.SKU||i.Sku||i.Codigo||''),nombre:String(i.nombre||i.Nombre||i.Descripcion||i.Producto||''),precio:Number(i.precio||i.Precio||i.precioPublico||i.PrecioPublico||0),ex:(i.Existencias||[]).reduce((m,e)=>{if(!e.enTransito&&e.sucursal)m[e.sucursal]=(m[e.sucursal]||0)+(Number(e.cantidad)||0);return m},{})})).filter(i=>i.sku);
    try{const p=await api.precios(sesion.correo,sesion.token);if(p&&p.success){S.pr={};(p.data||[]).forEach(x=>{const v=Number(x.precio);if(v>0)S.pr[nSku(x.sku)]=v})}}catch{}
    save();if(!quiet)toast(S.inv.length+' productos cargados')}
  catch{if(!quiet)toast('Sin conexión al catálogo')}}
function migrarLeg(){if(S.suc)S.orders.forEach(o=>{if(LEG.includes(o.suc)){o.suc=S.suc;touch(o)}});save()}
const ICSON='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',ICMUT='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>';
function pintaHd(){const a=sesion?.agencia||'',el=$('#agn'),lg=$('#hlogo'),m=multi(a),vr=$('#vrep'),sb=$('#sndb');if(vr)vr.hidden=!puedeRep();
  if(sb){const on=sndOn();sb.hidden=!sesion;sb.innerHTML=on?ICSON:ICMUT;sb.classList.toggle('mut',!on);sb.setAttribute('aria-pressed',String(on));const t=on?'Sonido activado: toca para silenciar':'Sonido en silencio: toca para activar';sb.title=t;sb.setAttribute('aria-label',t)}
  if(el){el.hidden=!sesion;el.textContent=sesion?(S.suc||(m?'Elegir agencia':a)):'';el.className='agn'+(m?' pk':'');el.disabled=!m;if(m)el.dataset.a='agpick';else delete el.dataset.a}
  if(lg){const u=LOGO_BASE+logoDe(S.suc||a)+'.png';if(lg.getAttribute('src')!==u)lg.setAttribute('src',u)}}
function aplicaAg(){if(!sesion)return;const a=sesion.agencia,p=permitidas(a);
  S.suc=multi(a)?(p.includes(S.suc)?S.suc:''):a;migrarLeg();aplicaEtapas();pintaHd();if(!S.suc)acts.agpick()}
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
  S.orders=S.orders||[];S.dirty=S.dirty||[];S.inv=S.inv||[];S.seq=S.seq||{};S.del=S.del||[];S.tarifas=S.tarifas||{};S.tarPend=S.tarPend||{};S.colab=S.colab||[];S.orders.forEach(migEt);
  sesion=leerSes();aplicarTema();pintaLogin();aplicaAg();render();sync();if(sesion)cargaCat(true)});

Object.assign(acts,{
 ctnueva:()=>{if(!S.suc)return acts.agpick();ctForm({id:ctNuevoId(),f:agd<iso()?iso():agd,t:'',mec:'',tipo:'SP',dur:60})},
 ctslot:d=>{if(!S.suc)return acts.agpick();ctForm({id:ctNuevoId(),f:agd<iso()?iso():agd,t:d.t,mec:d.m||'',tipo:'SP',dur:60})},
 ctedit:d=>{const c=CT().find(x=>x.id===d.id);if(c)ctForm(Object.assign({},c))},
 ctvin:()=>{const v=vinN(($('#ct-vin')||{}).value);if(v.length<11)return;const set=(id,val)=>{const el=$('#'+id);if(el&&val&&!el.value.trim()){el.value=val;return 1}return 0};
  const prev=S.orders.find(x=>vinN(x.vin)===v),mc=(MOTOS.cache||{})[v]||{},info=vinInfo(v);let n=0;
  if(prev){n+=set('ct-cli',prev.cliente)+set('ct-tel',prev.tel)+set('ct-mail',prev.email)+set('ct-marca',prev.marca)+set('ct-mod',prev.modelo)+set('ct-anio',prev.anio)}
  n+=set('ct-marca',mc.marca)+set('ct-mod',mc.modelo)+set('ct-anio',mc.anio)+set('ct-marca',info.fab)+set('ct-anio',info.anio?String(info.anio):'');if(n)toast('Datos de la moto completados','ok')},
 ctsave:d=>{const g=i=>(($('#'+i)||{}).value||'').trim(),f=g('ct-f'),t=g('ct-t'),cl=g('ct-cli'),tel=g('ct-tel'),mail=g('ct-mail');
  if(!f)return toast('Elige la fecha');if(f<iso())return toast('La fecha no puede ser anterior a hoy');if(!t||t<'08:00'||t>'18:45')return toast('Elige una hora entre 08:00 am y 06:45 pm');
  if(!cl)return toast('Captura el cliente (propietario)');if(tel.replace(/\D/g,'').length<10)return toast('Captura el teléfono (WhatsApp) a 10 dígitos');if(mail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))return toast('El correo electrónico no es válido');
  let c=CT().find(x=>x.id===d.id);if(!c){c={id:d.id,suc:S.suc,est:'prog',folio:'',cre:Date.now(),por:sesion&&(sesion.nombre||sesion.correo)||''};S.citas.push(c)}
  Object.assign(c,{f,t,tipo:g('ct-tipo')||'SP',cliente:cl,tel,email:mail,vin:vinN(g('ct-vin')),marca:g('ct-marca'),modelo:g('ct-mod'),anio:g('ct-anio').replace(/\D/g,'').slice(0,4),nota:g('ct-nota'),mec:g('ct-mec'),dur:+g('ct-dur')||60});if(c.est==='no')c.est='prog';
  ctTouch(c);agd=f;$('#modal').innerHTML='';renderMain();toast('Cita guardada','ok')},
 agdia:d=>{agd=+d.n===0?iso():sumD(agd,+d.n);renderMain()},
 ctrecibir:async d=>{const c=CT().find(x=>x.id===d.id);if(!c)return;if(c.f!==iso())return toast('Solo se recibe el día de la cita');if(!S.suc)return acts.agpick();
  const o=await crear(c.tipo||'SP',{cliente:c.cliente,tel:c.tel,email:c.email||'',vin:c.vin||'',marca:c.marca||'',modelo:c.modelo||'',anio:c.anio||'',motivo:c.nota||'',mec:c.mec||'',conCita:true,citaId:c.id,cita:{f:c.f,h:+String(c.t).slice(0,2),b:0}});
  if(o){c.est='llego';c.folio=o.folio;ctTouch(c)}},
 ctno:d=>{const c=CT().find(x=>x.id===d.id);if(!c)return;c.est='no';ctTouch(c);renderMain()},
 ctcancel:async d=>{const c=CT().find(x=>x.id===d.id);if(!c)return;if(!(await ask({t:'Cancelar cita',m:'¿Cancelar la cita de '+(c.cliente||'este cliente')+' a las '+c.t+'?',ok:'Cancelar cita',tipo:'err'})))return;c.est='cancel';ctTouch(c);renderMain()},
 ctwa:d=>{const c=CT().find(x=>x.id===d.id);if(c)wa(c.tel,`Hola ${c.cliente}, te esperamos el ${ctFecha(c.f)} a las ${c.t} en ${S.suc} para tu servicio (${TIPOS[c.tipo]||c.tipo}). Si no puedes asistir, avísanos para reprogramar.`)},
 llmed:d=>{const o=D&&O(D);if(!o||!o.llantas[+d.i])return;o.llantas[+d.i].med=d.v;touch(o);renderDrawer()}
});
document.addEventListener('change',e=>{if(e.target&&e.target.id==='ct-vin')acts.ctvin()});
document.addEventListener('change',e=>{const t=e.target;if(t&&t.matches&&t.matches('[data-agd]')){agd=t.value||iso();renderMain()}});

/* Deslizar a izquierda / derecha para cambiar de pestaña (orden abierta y etapas del Panel en el celular) */
(function(){let sx=0,sy=0,t0=0,ok=false,tg=null;
 const NO='input,textarea,select,canvas,[contenteditable],[data-noswipe],#visor,.sig';
 const libre=el=>{for(let n=el;n&&n!==document.body;n=n.parentElement){if(n.matches&&n.matches(NO))return false;if(n.scrollWidth>n.clientWidth+4&&/(auto|scroll)/.test(getComputedStyle(n).overflowX)&&!n.matches('.dtabs,.tabs'))return false}return true};
 document.addEventListener('touchstart',e=>{ok=false;if(e.touches.length!==1)return;const t=e.touches[0];sx=t.clientX;sy=t.clientY;t0=Date.now();tg=e.target;ok=sx>24&&sx<innerWidth-24&&!document.querySelector('#modal .ov,#dlg .dlg,#visor:not([hidden])')&&libre(tg)},{passive:true});
 document.addEventListener('touchend',e=>{if(!ok)return;ok=false;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.6||Date.now()-t0>700)return;
  const dr=!!(D&&tg.closest&&tg.closest('#drawer .dscroll')),pn=!D&&!!(tg.closest&&tg.closest('#app'));if(!dr&&!pn)return;
  const nav=document.querySelector(dr?'#drawer .dtabs':'#app .tabs');if(!nav||nav.offsetParent===null)return;
  const L=[...nav.querySelectorAll('[data-a="dtab"],[data-a="tab"]')],i=L.findIndex(b=>b.classList.contains('on')),j=i+(dx<0?1:-1);if(i<0||j<0||j>=L.length)return;
  L[j].click();const c=document.querySelector(dr?'#drawer .dbody':'#app .col.on');if(c){c.classList.add(dx<0?'sw-l':'sw-r');c.addEventListener('animationend',()=>c.classList.remove('sw-l','sw-r'),{once:true})}
 },{passive:true})})();
