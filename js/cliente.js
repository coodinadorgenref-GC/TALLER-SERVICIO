/* Página del cliente: ve todo lo de su moto y autoriza con su firma.
   Datos: Apps Script (acciones verOrden / autorizarCliente / fotoCliente), protegidas con el token del enlace. */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const fdate = t => t ? new Date(t).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const fdt = t => new Date(t).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
  const P = new URLSearchParams(location.search), FOLIO = P.get('o') || '', TOK = P.get('k') || '';
  const svg = d => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    ok: svg('<path d="M5 12l5 5 9-10"/>'), wa: svg('<path d="M12 4l9 16H3zM12 10v4M12 17v1"/>'), x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    nr: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), pen: svg('<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>')
  };
  const ESTADO = { nr: ['c-nr', IC.nr, 'Sin revisar'], ok: ['c-ok', IC.ok, 'Buen estado'], px: ['c-wa', IC.wa, 'Atención próxima'], ur: ['c-er', IC.wa, 'Urgente'] };
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
  const fotos = (list, alt, cls) => { list = list.filter(Boolean); return list.length ? `<div class="gal ${cls || ''}">${list.map((u, j) => foto(u, alt + ' ' + (j + 1), '', cls === 'sm' ? 'sm' : '')).join('')}</div>` : ''; };
  const sec = (id, titulo, nota, cuerpo) => `<section class="sec" aria-labelledby="h-${id}"><h2 class="sec-h" id="h-${id}"><span>${titulo}</span>${nota ? `<span class="n">${nota}</span>` : ''}</h2><div class="sec-b">${cuerpo}</div></section>`;

  /* ---------- Bloques ---------- */
  function cabecera(o) {
    const logo = LOGO_BASE + logoDe(o.suc) + '.png';
    return `<header class="top"><div class="top-i"><img class="logo" src="${esc(logo)}" alt="Logo ${esc(datosAg(o.suc).n || o.suc)}"><div class="top-r"><div class="tt">VISTO BUENO</div><div class="fo">Folio: ${esc(o.folio)}</div><div class="fe">${esc(fdate(o.fing))}</div></div></div></header>`;
  }
  const info = o => `<dl class="info"><div><dt>Cliente</dt><dd>${esc(o.cliente || '—')}</dd></div><div><dt>Unidad</dt><dd>${esc([o.marca, o.modelo, o.anio].filter(Boolean).join(' ') || '—')}</dd></div>
    <div><dt>Serie / VIN</dt><dd>${esc(o.vin || '—')}</dd></div><div><dt>Placas</dt><dd>${esc(o.placas || '—')}</dd></div>
    <div><dt>Kilometraje</dt><dd>${o.km ? esc(o.km) + ' km' : '—'}</dd></div><div><dt>Servicio</dt><dd>${esc(TIPOS[o.tipo] || '')}</dd></div>
    <div><dt>Asesor de servicio</dt><dd>${esc(o.asesor || '—')}</dd></div><div><dt>Técnico</dt><dd>${esc(o.mec || 'Por asignar')}</dd></div>
    ${o.motivo ? `<div class="full"><dt>Motivo de ingreso</dt><dd>${esc(o.motivo)}</dd></div>` : ''}</dl>`;

  const REC = 'Recepción', fx = k => [k.f, ...(k.fx || [])].filter(Boolean);
  function carroceria(o) {
    const d = o.danos || [];
    // Fotos de ingreso: puntos de tipo Recepción + las fotos generales de órdenes anteriores
    const ing = [];
    d.forEach(m => { if (m.t === REC) fx(m).forEach(u => ing.push(foto(u, 'Foto de ingreso', 'Ingreso'))); });
    FOTOS_GRAL.forEach(([k, t]) => { if (o.fotos[k]) ing.push(foto(o.fotos[k].u, t, t)); });
    const danos = d.map((m, i) => ({ m, i })).filter(x => x.m.t !== REC);
    if (!ing.length && !d.length) return '';
    return sec('car', 'Carrocería', danos.length ? danos.length + ' detalle' + (danos.length > 1 ? 's' : '') : '', `
      ${ing.length ? `<div class="sub">Así llegó tu moto</div><div class="gal">${ing.join('')}</div>` : ''}
      ${danos.length ? `<div class="sub">Daños y detalles al recibir</div>
        <div class="mw"><img src="img/moto.png" alt="Moto con ${danos.length} marca(s) numerada(s)">${danos.map(x => `<span class="mk" style="left:${x.m.x}%;top:${x.m.y}%" aria-hidden="true">${x.i + 1}</span>`).join('')}</div>
        ${danos.map(x => `<div class="dn"><span class="no" aria-hidden="true">${x.i + 1}</span><div><b>${esc(x.m.t)} <span class="hint">(marca ${x.i + 1})</span></b>${x.m.n ? `<p>${esc(x.m.n)}</p>` : ''}${fotos(fx(x.m), 'Foto del detalle ' + (x.i + 1), 'sm')}</div></div>`).join('')}` : ''}`);
  }

  function inspeccion(o) {
    const c = o.chk || [], hay = c.some(x => x.e !== 'nr') || (o.llantas || []).some(l => l.e !== 'nr' || l.med);
    if (!hay) return '';
    const n = { ok: 0, px: 0, ur: 0 }; c.forEach(x => { if (n[x.e] != null) n[x.e]++; });
    const res = `<div class="row" role="list" aria-label="Resumen de la inspección"><span role="listitem" class="chip c-ok">${IC.ok}${n.ok} en buen estado</span><span role="listitem" class="chip c-wa">${IC.wa}${n.px} próximos</span><span role="listitem" class="chip c-er">${IC.wa}${n.ur} urgentes</span></div>`;
    const zonas = c.map((x, i) => `<div class="zr"><div class="zr-t"><b>${esc(CATS[i][0])}<small>${esc(CATS[i][1])}</small></b>${chip(ESTADO[x.e] || ESTADO.nr)}</div>
      ${x.op ? `<p><b>Recomendado:</b> ${esc(x.op)}</p>` : ''}${x.n ? `<p>${esc(x.n)}</p>` : ''}${fotos([x.f, ...(x.fx || [])], CATS[i][0], 'sm')}</div>`).join('');
    const ll = (o.llantas || []).map(l => `<div class="zr"><div class="zr-t"><b>Llanta ${esc(String(l.p).toLowerCase())}</b>${chip(ESTADO[l.e] || ESTADO.nr)}</div>
      <div class="ll">${l.med ? `<span>Medida <b>${esc(l.med)}</b></span>` : ''}${l.des ? `<span>Desgaste <b>${esc(l.des)} mm</b></span>` : ''}${l.psi ? `<span>Presión <b>${esc(l.psi)} PSI</b></span>` : ''}</div>
      ${l.op ? `<p><b>Recomendado:</b> ${esc(l.op)}</p>` : ''}${fotos([l.f, ...(l.fx || [])], 'Llanta ' + l.p, 'sm')}</div>`).join('');
    const bk = Object.keys(o.fotos).filter(k => /^bayoneta(_\d+)?$/.test(k)).sort((a, b) => (+a.slice(9) || 1) - (+b.slice(9) || 1)), ace = bk.length ? `<div class="zr"><div class="zr-t"><b>Aceite del motor<small>Bayoneta / drenado</small></b></div>${fotos(bk.map(k => o.fotos[k].u), 'Aceite', 'sm')}</div>` : '';
    return sec('ins', 'Inspección de tu moto', '', res + zonas + ll + ace + (o.diag ? `<div class="zr"><div class="sub">Diagnóstico del técnico</div><p>${esc(o.diag)}</p></div>` : ''));
  }

  const imp = l => (Number(l.cant) || 0) * (Number(l.precio) || 0);
  function totales() {
    const t = { aut: 0, rech: 0, gar: 0, pend: 0 };
    (O.lineas || []).forEach((l, i) => { let st = l.st; if (st === 'pend' && dec[i]) st = dec[i].st; t[st === 'aut' ? 'aut' : st === 'rech' ? 'rech' : st === 'gar' ? 'gar' : 'pend'] += imp(l); });
    return t;
  }
  function linea(l, i) {
    const mo = l.t === 'mo', pend = l.st === 'pend', d = dec[i];
    const cant = mo ? 'Mano de obra' : `${l.cant} × ${money(l.precio)}`;
    return `<article class="ln ${pend ? 'pend' : ''}" data-i="${i}"><div class="ln-top"><div><span class="tag">${mo ? 'MANO DE OBRA' : 'REFACCIÓN'}</span><h4>${esc(l.desc)}</h4>${mo ? '' : `<span class="sku">${esc(l.sku)}</span>`}</div>
      <div class="ln-amt"><b>${l.st === 'gar' ? 'Garantía' : money(imp(l))}</b><span>${esc(cant)}</span></div></div>
      ${l.f ? fotos([l.f], 'Evidencia de ' + l.desc, 'sm') : ''}
      ${pend ? `<div class="act" role="group" aria-label="Tu decisión para ${esc(l.desc)}"><button type="button" class="dc ok" data-d="aut" aria-pressed="${d && d.st === 'aut'}">${IC.ok}Aceptar</button><button type="button" class="dc no" data-d="rech" aria-pressed="${d && d.st === 'rech'}">${IC.x}Rechazar</button></div>
        <label class="mot" ${d && d.st === 'rech' ? '' : 'hidden'}>Motivo (opcional)<select data-mot>${['', ...MOTIVOS].map(m => `<option value="${esc(m)}" ${d && d.mot === m ? 'selected' : ''}>${m || 'Elige un motivo'}</option>`).join('')}</select></label>`
        : `<div class="stat">${chip(LN_ST[l.st] || LN_ST.pend)}${l.st === 'rech' && l.mot ? `<span class="hint"> Motivo: ${esc(l.mot)}</span>` : ''}</div>`}</article>`;
  }
  function cotizacion(o) {
    const L = o.lineas || [];
    if (!L.length) return sec('cot', 'Cotización', '', '<p class="hint">Todavía no hay cotización. Cuando esté lista la verás aquí y podrás autorizarla.</p>');
    const pend = L.filter(l => l.st === 'pend').length;
    return sec('cot', 'Cotización', pend ? pend + ' por autorizar' : 'Revisada', `
      ${pend > 1 ? `<div class="row"><button type="button" class="btn ghost" data-all>${IC.ok}Aceptar todo</button></div>` : ''}
      ${L.map(linea).join('')}<div class="tot" id="tot" aria-live="polite"></div>`);
  }

  function autorizacion(o) {
    const pend = (o.lineas || []).some(l => l.st === 'pend');
    if (o.auth && !pend) return sec('aut', 'Tu autorización', '', `<div class="ok-box" role="status">${IC.ok}<div><b>${msgOk ? '¡Listo! Recibimos tu autorización.' : 'Ya autorizaste esta orden.'}</b>${esc(o.auth.n)} · ${esc(fdt(o.auth.t))}<br>El taller ya fue avisado. Te contactaremos cuando tu moto esté lista.</div></div>
      ${o.firma ? `<div><div class="sub">Tu firma</div><img class="sg-img" alt="Firma de ${esc(o.auth.n)}" src="${esc(imgSrc(o.firma))}"></div>` : ''}`);
    if (!pend) return '';
    return sec('aut', 'Autoriza y firma', '', `<div id="autorizar" tabindex="-1"></div>
      <label class="f" for="nom">Nombre completo<input type="text" id="nom" autocomplete="name" aria-describedby="e-nom" value="${esc(o.cliente || '')}"></label><div class="err" id="e-nom" role="alert" hidden></div>
      <div class="f"><span id="sig-l">Firma con tu dedo o con el mouse</span><div class="sig" id="sigw"><canvas id="sig" role="img" aria-labelledby="sig-l"></canvas><span class="ph-t">Firma aquí</span></div></div>
      <div class="err" id="e-sig" role="alert" hidden></div><div class="row"><button type="button" class="btn ghost" id="sig-c">Borrar firma</button></div>
      <p class="small">Autorizo los trabajos que acepté y los importes indicados. ${esc(LEYENDA)}</p>
      <div class="err" id="e-gen" role="alert" hidden></div>
      <button type="button" class="btn pri" id="enviar">${IC.pen}Enviar autorización</button>`);
  }

  function pie(o) {
    const a = datosAg(o.suc);
    return `<footer class="foot">${esc(a.n || o.suc)}${a.d ? '<br>' + esc(a.d) : ''}${a.t ? '<br>Tel. ' + esc(a.t) : ''}<br><span class="small">Este enlace es personal; no lo compartas.</span></footer>`;
  }

  /* ---------- Render ---------- */
  function vista() {
    const o = O, pend = (o.lineas || []).some(l => l.st === 'pend');
    $('#app').innerHTML = cabecera(o) + `<main class="wrap" id="principal">${info(o)}${carroceria(o)}${inspeccion(o)}${cotizacion(o)}${autorizacion(o)}${pie(o)}</main>
      <div class="cta" id="cta" hidden><div class="cta-i"><div><small>Total que autorizas</small><b id="cta-t">$0</b></div><a class="btn pri" href="#autorizar">Revisar y firmar</a></div></div>`;
    $('#app').removeAttribute('aria-busy');
    document.title = 'Visto bueno · ' + o.folio;
    pintaTot();
    if (pend) { iniciaFirma(); const f = $('#autorizar'); if ('IntersectionObserver' in window && f) new IntersectionObserver(es => { const c = $('#cta'); if (c) c.hidden = es[0].isIntersecting; }).observe(f); }
  }
  function pintaTot() {
    const t = totales(), el = $('#tot'); if (!el) return;
    el.innerHTML = `<div><span>Autorizado</span><b>${money(t.aut)}</b></div>${t.gar ? `<div><span>Garantía (sin cargo)</span><span>${money(t.gar)}</span></div>` : ''}${t.rech ? `<div><span>No autorizado</span><span>${money(t.rech)}</span></div>` : ''}${t.pend ? `<div><span>Por decidir</span><span>${money(t.pend)}</span></div>` : ''}<div class="big"><span>Total a pagar</span><span>${money(t.aut)}</span></div>`;
    const c = $('#cta'), ct = $('#cta-t'); if (ct) ct.textContent = money(t.aut);
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
    if (faltan.length) { err('e-gen', `Falta decidir ${faltan.length} concepto${faltan.length > 1 ? 's' : ''}: acepta o rechaza cada uno.`); primero = document.querySelector(`.ln[data-i="${faltan[0].i}"]`); }
    if (nom.length < 3) { err('e-nom', 'Escribe tu nombre completo.'); primero = primero || $('#nom'); }
    if (!ink) { err('e-sig', 'Falta tu firma.'); primero = primero || $('#sigw'); }
    if (primero) { primero.scrollIntoView({ block: 'center' }); if (primero.focus) primero.focus({ preventScroll: true }); return; }
    const c = $('#sig'), o2 = document.createElement('canvas'); o2.width = c.width; o2.height = c.height;
    const g = o2.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, o2.width, o2.height); g.drawImage(c, 0, 0);
    const b = $('#enviar'); b.disabled = true; b.textContent = 'Enviando…';
    try {
      const r = await api.taller({ action: 'autorizarCliente', folio: FOLIO, tok: TOK, nombre: nom, firma: o2.toDataURL('image/png'),
        decisiones: faltan.length ? [] : L.map((l, i) => ({ i, desc: l.desc, st: dec[i] && dec[i].st, mot: dec[i] && dec[i].mot })).filter(d => d.st) });
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
