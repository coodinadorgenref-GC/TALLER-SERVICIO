/* Orden de trabajo para el cliente: ve sus trabajos recomendados, acepta o rechaza cada uno y firma.
   Datos: Apps Script (verOrden / autorizarCliente / fotoCliente), protegidas con el token del enlace. */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const fdate = t => t ? new Date(t).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const fdt = t => new Date(t).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
  const P = new URLSearchParams(location.search), FOLIO = P.get('o') || '', TOK = P.get('k') || '';
  // Si x trae su propio stroke, no se repite el atributo (el navegador ignora el segundo y el color nunca se aplicaba).
  const sv = (d, x) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" ${x && /stroke=/.test(x) ? '' : 'stroke="currentColor" stroke-width="2" '}stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${x || ''}>${d}</svg>`;
  const IC = {
    ok: sv('<path d="M5 12l5 5 9-10"/>'), x: sv('<path d="M6 6l12 12M18 6L6 18"/>'), pen: sv('<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>'),
    nr: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')
  };
  // Estados como en la referencia: urgente (círculo tachado), recomendado (triángulo), OK (casilla verde), sin revisar (casilla azul)
  const EST = {
    ur: [sv('<circle cx="12" cy="12" r="9"/><path d="M5.6 18.4L18.4 5.6"/>', 'stroke="#DC2626" stroke-width="2.4"'), 'Urgente'],
    px: [sv('<path d="M12 3.5L21.5 20h-19z" fill="#FACC15"/><path d="M12 10v4.5M12 17.2v.3"/>', 'stroke="#854D0E" stroke-width="1.9"'), 'Recomendado'],
    ok: [sv('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M7.5 12.5l3 3 6-7"/>', 'stroke="#15803D" stroke-width="2.2"'), 'OK'],
    nr: [sv('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/>', 'stroke="#2563EB" stroke-width="2.2"'), 'Sin revisar']
  };
  const ico = (k, sinTxt) => { const e = EST[k] || EST.nr; return `<span class="ico" ${sinTxt ? '' : `title="${e[1]}"`}>${e[0]}${sinTxt ? '' : `<span class="sr">${e[1]}</span>`}</span>`; };
  const generico = sv('<circle cx="12" cy="12" r="3"/>', 'stroke="#64748B" stroke-width="2.2"');
  const LN_ST = { aut: ['c-ok', IC.ok, 'Autorizado'], rech: ['c-gr', IC.x, 'No autorizado'], gar: ['c-ok', IC.ok, 'Garantía (sin cargo)'], pend: ['c-wa', IC.nr, 'Por autorizar'] };
  const chip = ([c, i, t]) => `<span class="chip ${c}">${i}${t}</span>`;
  let O = null, dec = {}, ink = false, msgOk = false;

  /* ---------- Fotos (Drive): miniatura → lh3 → proxy del Apps Script ---------- */
  const FC = new Map();
  const driveId = u => { const m = /drive\.google\.com\/(?:uc\?(?:export=\w+&)?id=|file\/d\/|thumbnail\?id=)([\w-]+)/.exec(u || ''); return m && m[1]; };
  const imgSrc = u => { const id = driveId(u); return id ? (FC.get(id) || 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1600') : (u || ''); };
  const Q = []; let run = 0;
  function pump() {
    while (run < 3 && Q.length) {
      const j = Q.shift(); run++;
      api.taller({ action: 'fotoCliente', folio: FOLIO, tok: TOK, id: j.id }).then(r => r && r.success && r.d ? r.d : '').catch(() => '').then(d => { if (d) FC.set(j.id, d); run--; j.res(d); pump(); });
    }
  }
  const proxy = id => FC.has(id) ? Promise.resolve(FC.get(id)) : new Promise(res => { Q.push({ id, res }); pump(); });
  document.addEventListener('error', e => {
    const t = e.target; if (!t || t.tagName !== 'IMG') return;
    const m = /(?:drive\.google\.com\/thumbnail\?id=|googleusercontent\.com\/d\/)([\w-]+)/.exec(t.src); if (!m) return;
    if (!t.dataset.alt && /thumbnail/.test(t.src)) { t.dataset.alt = '1'; t.src = 'https://lh3.googleusercontent.com/d/' + m[1] + '=w1600'; return; }
    if (!t.dataset.px) { t.dataset.px = '1'; proxy(m[1]).then(d => { if (d && t.isConnected) t.src = d; }); }
  }, true);
  const foto = (u, alt, cap, cls) => u ? `<button type="button" class="ph ${cls || ''}" data-zoom aria-label="Ampliar foto: ${esc(alt)}"><img loading="lazy" decoding="async" alt="" src="${esc(imgSrc(u))}">${cap ? `<span class="cap">${esc(cap)}</span>` : ''}</button>` : '';
  const thumbs = (list, alt) => { list = list.filter(Boolean); return list.length ? `<div class="th">${list.map((u, j) => foto(u, alt + ' ' + (j + 1), '', 'sm')).join('')}</div>` : ''; };
  const sec = (id, titulo, nota, cuerpo, plegable) => plegable
    ? `<details class="sec" id="s-${id}"><summary class="sec-h"><span>${titulo}</span>${nota ? `<span class="n">${nota}</span>` : ''}</summary><div class="sec-b">${cuerpo}</div></details>`
    : `<section class="sec" id="s-${id}" aria-labelledby="h-${id}"><h2 class="sec-h" id="h-${id}"><span>${titulo}</span>${nota ? `<span class="n">${nota}</span>` : ''}</h2><div class="sec-b">${cuerpo}</div></section>`;
  const imp = l => (Number(l.cant) || 0) * (Number(l.precio) || 0);
  const REC = 'Recepción', fx = k => [k.f, ...(k.fx || [])].filter(Boolean);
  // Fotos de ingreso: puntos de tipo Recepción + fotos generales de órdenes anteriores
  const ingreso = o => [...(o.danos || []).filter(m => m.t === REC).flatMap(fx), ...FOTOS_GRAL.map(([k]) => o.fotos[k] && o.fotos[k].u).filter(Boolean)];
  const ckDe = l => { const i = (O.chk || []).findIndex((c, k) => CATS[k] && String(l.desc).startsWith(CATS[k][0] + ': ')); return i >= 0 ? { c: O.chk[i], z: CATS[i][0] } : null; };

  /* ---------- Bloques ---------- */
  function cabecera(o) {
    const logo = LOGO_BASE + logoDe(o.suc) + '.png';
    return `<header class="top"><div class="top-i"><img class="logo" src="${esc(logo)}" alt="Logo ${esc(datosAg(o.suc).n || o.suc)}"><div class="top-r"><div class="tt">ORDEN DE TRABAJO</div><div class="fo">${esc(o.folio)}</div><div class="fe">${esc(fdate(o.fing))}</div></div></div></header>`;
  }
  function datos(o) {
    const h = ingreso(o)[0], fila = ([k, v]) => v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : '';
    const rows = [['Cliente', o.cliente], ['Unidad', [o.marca, o.modelo, o.anio].filter(Boolean).join(' ')], ['Placas', o.placas], ['Asesor', o.asesor], ['Técnico', o.mec || 'Por asignar']];
    const mas = [['Serie / VIN', o.vin], ['Kilometraje', o.km ? o.km + ' km' : ''], ['Servicio', TIPOS[o.tipo]], ['Motivo de ingreso', o.motivo]];
    return `<section class="dat ${h ? '' : 'nh'}" aria-label="Datos de la orden">${h ? foto(h, 'Foto de ingreso', '', 'hero') : ''}<dl class="kv">${rows.map(fila).join('')}</dl>
      <details class="mas"><summary>Más datos de la unidad</summary><dl class="kv">${mas.map(fila).join('')}</dl></details></section>`;
  }

  function totales() {
    const t = { aut: 0, rech: 0, gar: 0, pend: 0 };
    (O.lineas || []).forEach((l, i) => { let st = l.st; if (st === 'pend' && dec[i]) st = dec[i].st; t[st === 'aut' ? 'aut' : st === 'rech' ? 'rech' : st === 'gar' ? 'gar' : 'pend'] += imp(l); });
    return t;
  }
  function linea(l, i) {
    const mo = l.t === 'mo', pend = l.st === 'pend', d = dec[i], k = ckDe(l);
    const op = k ? String(l.desc).replace(k.z + ': ', '') : l.desc;
    const fts = [...new Set([l.f, ...(k ? fx(k.c) : [])].filter(Boolean))];
    const icono = k ? ico(k.c.e) : `<span class="ico">${generico}</span>`;
    const cant = !mo && Number(l.cant) > 1 ? `<small>${l.cant} × ${money(l.precio)}</small>` : '';
    return `<article class="ln ${pend ? 'pend' : ''}${k && k.c.e && EST[k.c.e] ? ' sv-' + k.c.e : ''}" data-i="${i}"><div class="lm">${icono}<div class="tx"><small>${esc(k ? k.z : mo ? 'Mano de obra' : 'Refacción')}</small><b>${esc(op)}</b>${k && k.c.n ? `<small class="nt">${esc(k.c.n)}</small>` : ''}${thumbs(fts, 'Evidencia de ' + l.desc)}</div>
      <div class="pr"><b>${l.st === 'gar' ? 'Garantía' : money(imp(l))}</b>${cant}</div></div>
      ${pend ? `<div class="act" role="group" aria-label="Tu decisión para ${esc(l.desc)}"><button type="button" class="dc ok" data-d="aut" aria-pressed="${!!d && d.st === 'aut'}">${IC.ok}Aceptar</button><button type="button" class="dc no" data-d="rech" aria-pressed="${!!d && d.st === 'rech'}">${IC.x}Rechazar</button></div>
        <label class="mot" ${d && d.st === 'rech' ? '' : 'hidden'}>Motivo (opcional)<select data-mot>${['', ...MOTIVOS].map(m => `<option value="${esc(m)}" ${d && d.mot === m ? 'selected' : ''}>${m || 'Elige un motivo'}</option>`).join('')}</select></label>`
        : `<div class="stat">${chip(LN_ST[l.st] || LN_ST.pend)}${l.st === 'rech' ? `<span class="hint">${l.mot ? esc(l.mot) + '. ' : ''}Queda pendiente; tu taller te lo recordará.</span>` : ''}</div>`}</article>`;
  }
  function cotizacion(o) {
    const L = o.lineas || [];
    if (!L.length) return sec('cot', 'Trabajos recomendados', '', '<p class="hint">Todavía no hay trabajos recomendados. Cuando estén listos los verás aquí para autorizarlos.</p>');
    const pend = L.filter(l => l.st === 'pend').length;
    const leg = `<ul class="leg" aria-label="Leyenda de estados">${['ur', 'px', 'ok', 'nr'].map(k => `<li class="lg-${k}">${ico(k, true)}${EST[k][1]}</li>`).join('')}</ul>`;
    return sec('cot', 'Trabajos recomendados', pend ? pend + ' por autorizar' : 'Revisados', `${leg}${pend > 1 ? `<button type="button" class="btn ghost" data-all>${IC.ok}Aceptar todo</button>` : ''}<div class="lns">${L.map(linea).join('')}</div><div class="tot" id="tot" aria-live="polite"></div>`);
  }

  function resDec(o) {
    const a = (o.lineas || []).filter(l => l.st === 'aut'), r = (o.lineas || []).filter(l => l.st === 'rech');
    return `${a.length ? `Autorizado: <b>${a.length}</b> (${money(a.reduce((t, l) => t + imp(l), 0))}). ` : ''}${r.length ? `Para después: <b>${r.length}</b>. ` : ''}`;
  }
  function autorizacion(o) {
    const pend = (o.lineas || []).some(l => l.st === 'pend');
    if (o.auth && !pend) return sec('aut', 'Tu autorización', '', `<div class="ok-box" role="status">${IC.ok}<div><b>${msgOk ? '¡Listo! Recibimos tu autorización.' : 'Ya autorizaste esta orden.'}</b>${esc(o.auth.n)} · ${esc(fdt(o.auth.t))}<br>${resDec(o)}El taller ya fue avisado.</div></div>${o.firma ? `<img class="sg-img" alt="Firma de ${esc(o.auth.n)}" src="${esc(imgSrc(o.firma))}">` : ''}`);
    if (!pend) return '';
    return sec('aut', 'Autoriza y firma', '', `<div id="autorizar" tabindex="-1"></div>
      <label class="f" for="nom">Nombre completo<input type="text" id="nom" autocomplete="name" aria-describedby="e-nom" value="${esc(o.cliente || '')}"></label><div class="err" id="e-nom" role="alert" hidden></div>
      <div class="f"><span id="sig-l">Firma con tu dedo</span><div class="sig" id="sigw"><canvas id="sig" role="img" aria-labelledby="sig-l"></canvas><span class="ph-t">Firma aquí</span></div></div>
      <div class="err" id="e-sig" role="alert" hidden></div><div class="err" id="e-gen" role="alert" hidden></div>
      <div class="row2"><button type="button" class="btn ghost" id="sig-c">Borrar</button><button type="button" class="btn pri" id="enviar">${IC.pen}Enviar autorización</button></div>
      <details class="leyenda"><summary>Condiciones</summary><p class="small">Autorizo los trabajos que acepté y los importes indicados. ${esc(LEYENDA)}</p></details>`);
  }

  function inspeccion(o) {
    const c = o.chk || [], ll = o.llantas || [], bk = Object.keys(o.fotos).filter(k => /^bayoneta(_\d+)?$/.test(k)).sort((a, b) => (+a.slice(9) || 1) - (+b.slice(9) || 1));
    if (!(c.some(x => x.e !== 'nr') || ll.some(l => l.e !== 'nr' || l.med) || bk.length)) return '';
    const n = k => c.filter(x => x.e === k).length;
    const con = c.map((x, i) => ({ x, i })).filter(y => y.x.e === 'ur' || y.x.e === 'px'), sin = c.map((x, i) => ({ x, i })).filter(y => y.x.e === 'ok' || y.x.e === 'nr');
    const resumen = [n('ur') ? n('ur') + ' urgente' + (n('ur') > 1 ? 's' : '') : '', n('px') ? n('px') + ' recomendado' + (n('px') > 1 ? 's' : '') : '', n('ok') ? n('ok') + ' OK' : ''].filter(Boolean).join(' · ');
    const filas = con.map(({ x, i }) => `<div class="zr">${ico(x.e)}<div><b>${esc(CATS[i][0])}</b>${x.op ? `<small>Recomendado: ${esc(x.op)}</small>` : ''}${x.n ? `<small>${esc(x.n)}</small>` : ''}${thumbs(fx(x), CATS[i][0])}</div></div>`).join('');
    const okz = sin.length ? `<details class="okz"><summary>Puntos sin observaciones (${sin.length})</summary><ul class="zl">${sin.map(({ x, i }) => `<li>${ico(x.e)}${esc(CATS[i][0])}</li>`).join('')}</ul></details>` : '';
    const llan = ll.filter(l => l.e !== 'nr' || l.med).map(l => `<div class="zr">${ico(l.e)}<div><b>Llanta ${esc(String(l.p).toLowerCase())}</b><div class="ll">${l.med ? `<span>Medida <b>${esc(l.med)}</b></span>` : ''}${l.des ? `<span>Desgaste <b>${esc(l.des)} mm</b></span>` : ''}${l.psi ? `<span>Presión <b>${esc(l.psi)} PSI</b></span>` : ''}</div>${l.op ? `<small>Recomendado: ${esc(l.op)}</small>` : ''}${l.n ? `<small>${esc(l.n)}</small>` : ''}${thumbs(fx(l), 'Llanta ' + l.p)}</div></div>`).join('');
    const ace = bk.length ? `<div class="zr">${generico.replace('<svg', '<svg class="ico"')}<div><b>Aceite del motor</b><small>Bayoneta / drenado</small>${thumbs(bk.map(k => o.fotos[k].u), 'Aceite')}</div></div>` : '';
    return sec('ins', 'Inspección de tu moto', resumen, filas + okz + llan + ace + (o.diag ? `<div class="zr"><div><b>Diagnóstico del técnico</b><small>${esc(o.diag)}</small></div></div>` : ''), true);
  }
  function carroceria(o) {
    const d = o.danos || [], ing = ingreso(o), danos = d.map((m, i) => ({ m, i })).filter(x => x.m.t !== REC);
    if (!ing.length && !danos.length) return '';
    return sec('car', 'Carrocería y fotos de ingreso', danos.length ? danos.length + ' detalle' + (danos.length > 1 ? 's' : '') : '', `
      ${ing.length ? `<div class="sub">Así llegó tu moto</div><div class="gal">${ing.map((u, j) => foto(u, 'Foto de ingreso ' + (j + 1), '')).join('')}</div>` : ''}
      ${danos.length ? `<div class="sub">Daños y detalles al recibir</div><div class="mw"><img src="img/moto.png" alt="Moto con ${danos.length} marca(s) numerada(s)">${danos.map(x => `<span class="mk" style="left:${x.m.x}%;top:${x.m.y}%" aria-hidden="true">${x.i + 1}</span>`).join('')}</div>
        ${danos.map(x => `<div class="dn"><span class="no" aria-hidden="true">${x.i + 1}</span><div><b>${esc(x.m.t)}</b>${x.m.n ? `<p>${esc(x.m.n)}</p>` : ''}${thumbs(fx(x.m), 'Foto del detalle ' + (x.i + 1))}</div></div>`).join('')}` : ''}`, true);
  }
  function pie(o) {
    const a = datosAg(o.suc);
    return `<footer class="foot">${esc(a.n || o.suc)}${a.t ? ' · Tel. ' + esc(a.t) : ''}<br>Enlace personal: no lo compartas.</footer>`;
  }

  /* ---------- Render ---------- */
  function vista() {
    const o = O, pend = (o.lineas || []).some(l => l.st === 'pend');
    $('#app').innerHTML = cabecera(o) + `<main class="wrap" id="principal">${datos(o)}${cotizacion(o)}${autorizacion(o)}${inspeccion(o)}${carroceria(o)}${pie(o)}</main>
      <div class="cta" id="cta" hidden><div class="cta-i"><div><small id="cta-n">Por autorizar</small><b id="cta-t">$0</b></div><a class="btn pri" href="#autorizar">Firmar y enviar</a></div></div>`;
    $('#app').removeAttribute('aria-busy');
    document.title = 'Orden de trabajo · ' + o.folio;
    pintaTot();
    if (pend) { iniciaFirma(); const f = $('#autorizar'); if ('IntersectionObserver' in window && f) new IntersectionObserver(es => { const c = $('#cta'); if (c) c.hidden = es[0].isIntersecting; }).observe(f); }
  }
  function pintaTot() {
    const t = totales(), el = $('#tot'); if (!el) return;
    el.innerHTML = `<span>Autorizado <b>${money(t.aut)}</b></span>${t.gar ? `<span>Garantía ${money(t.gar)}</span>` : ''}${t.rech ? `<span>No autorizado ${money(t.rech)}</span>` : ''}${t.pend ? `<span>Por decidir ${money(t.pend)}</span>` : ''}<span class="big">Total ${money(t.aut)}</span>`;
    const c = $('#cta'), ct = $('#cta-t'), cn = $('#cta-n'); if (ct) ct.textContent = money(t.aut);
    if (cn) { const f = (O.lineas || []).filter((l, i) => l.st === 'pend' && !dec[i]).length; cn.textContent = f ? f + ' por decidir · total a pagar' : 'Total a pagar'; }
    if (c && !$('#autorizar')) c.hidden = true;
  }

  /* ---------- Decisiones ---------- */
  function pintaLinea(i) {
    const art = document.querySelector(`.ln[data-i="${i}"]`); if (!art) return;
    const d = dec[i];
    art.querySelectorAll('.dc').forEach(b => b.setAttribute('aria-pressed', String(!!d && d.st === b.dataset.d)));
    const m = art.querySelector('.mot'); if (m) m.hidden = !(d && d.st === 'rech');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.dc');
    if (b) { const i = +b.closest('.ln').dataset.i, st = b.dataset.d; dec[i] = dec[i] && dec[i].st === st ? undefined : { st, mot: (dec[i] && dec[i].mot) || '' }; if (!dec[i]) delete dec[i]; pintaLinea(i); pintaTot(); return; }
    if (e.target.closest('[data-all]')) { O.lineas.forEach((l, i) => { if (l.st === 'pend') { dec[i] = { st: 'aut', mot: '' }; pintaLinea(i); } }); pintaTot(); return; }
    const z = e.target.closest('[data-zoom]');
    if (z) { const lb = $('#lb'), im = z.querySelector('img'); lb.querySelector('img').src = im.currentSrc || im.src; lb.querySelector('img').alt = z.getAttribute('aria-label').replace('Ampliar foto: ', ''); if (lb.showModal) lb.showModal(); return; }
    if (e.target.closest('.lb-x') || e.target === $('#lb')) $('#lb').close();
  });
  document.addEventListener('change', e => { const s = e.target.closest('[data-mot]'); if (s) { const i = +s.closest('.ln').dataset.i; if (dec[i]) dec[i].mot = s.value; } });

  /* ---------- Firma ---------- */
  function iniciaFirma() {
    const c = $('#sig'); if (!c) return; ink = false;
    const k = window.devicePixelRatio || 1, r = c.getBoundingClientRect();
    c.width = Math.round(r.width * k); c.height = Math.round(r.height * k);
    const x = c.getContext('2d'); x.scale(k, k); x.lineWidth = 2.6; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#0F172A';
    let down = false;
    const pt = e => { const b = c.getBoundingClientRect(); return [(e.clientX - b.left) * (r.width / b.width), (e.clientY - b.top) * (r.height / b.height)]; };
    c.onpointerdown = e => { down = true; ink = true; $('#sigw').classList.add('on'); c.setPointerCapture(e.pointerId); x.beginPath(); const [a, b] = pt(e); x.moveTo(a, b); x.lineTo(a + .1, b + .1); x.stroke(); };
    c.onpointermove = e => { if (down) { const [a, b] = pt(e); x.lineTo(a, b); x.stroke(); } };
    c.onpointerup = c.onpointercancel = () => { down = false; };
    $('#sig-c').onclick = () => { x.clearRect(0, 0, r.width, r.height); ink = false; $('#sigw').classList.remove('on'); };
    $('#enviar').onclick = enviar;
  }
  const err = (id, t) => { const e = $('#' + id); if (!e) return; e.hidden = !t; e.textContent = t || ''; };
  async function enviar() {
    ['e-nom', 'e-sig', 'e-gen'].forEach(i => err(i, ''));
    const L = O.lineas || [], faltan = L.map((l, i) => ({ l, i })).filter(x => x.l.st === 'pend' && !dec[x.i]);
    const nom = $('#nom').value.replace(/\s+/g, ' ').trim();
    let primero = null;
    if (faltan.length) { err('e-gen', `Falta decidir ${faltan.length} trabajo${faltan.length > 1 ? 's' : ''}: acepta o rechaza cada uno.`); primero = document.querySelector(`.ln[data-i="${faltan[0].i}"]`); }
    if (nom.length < 3) { err('e-nom', 'Escribe tu nombre completo.'); primero = primero || $('#nom'); }
    if (!ink) { err('e-sig', 'Falta tu firma.'); primero = primero || $('#sigw'); }
    if (primero) { primero.scrollIntoView({ block: 'center' }); if (primero.focus) primero.focus({ preventScroll: true }); return; }
    const c = $('#sig'), o2 = document.createElement('canvas'); o2.width = c.width; o2.height = c.height;
    const g = o2.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, o2.width, o2.height); g.drawImage(c, 0, 0);
    const b = $('#enviar'); b.disabled = true; b.textContent = 'Enviando…';
    try {
      const r = await api.taller({ action: 'autorizarCliente', folio: FOLIO, tok: TOK, nombre: nom, firma: o2.toDataURL('image/png'),
        decisiones: L.map((l, i) => ({ i, desc: l.desc, st: dec[i] && dec[i].st, mot: dec[i] && dec[i].mot })).filter(d => d.st) });
      if (!r.success) throw new Error(r.message || 'No se pudo enviar');
      msgOk = true; dec = {}; await cargar(); scrollTo({ top: 0 });
    } catch (ex) {
      err('e-gen', String(ex.message || ex) + ' Revisa tu conexión e inténtalo de nuevo.');
      b.disabled = false; b.innerHTML = IC.pen + 'Enviar autorización';
    }
  }

  /* ---------- Carga ---------- */
  function fallo(t, d) { $('#app').innerHTML = `<div class="msg" role="alert"><h1>${esc(t)}</h1><p>${esc(d)}</p></div>`; $('#app').removeAttribute('aria-busy'); }
  async function cargar() {
    if (!FOLIO || !TOK) return fallo('Enlace incompleto', 'Pide a tu taller que te vuelva a enviar el enlace.');
    try {
      const r = await api.taller({ action: 'verOrden', folio: FOLIO, tok: TOK });
      if (!r.success) return fallo('No pudimos abrir tu orden', r.message || 'Pide a tu taller que te envíe un enlace nuevo.');
      O = r.orden; O.fotos = O.fotos || {}; vista();
    } catch { fallo('Sin conexión', 'Revisa tu internet e intenta de nuevo en unos segundos.'); }
  }
  cargar();
})();
