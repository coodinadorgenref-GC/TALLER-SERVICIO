/**
 * API del taller (Google Apps Script) — v6 (enlace de visto bueno para el cliente: verOrden / autorizarCliente / fotoCliente con token por orden; v5: tarifa de mano de obra por agencia en CONFIG_TALLER; v4: foto por número de daño en Carrocería, proxy de fotos de Drive para PC).
 * Pega este archivo en tu proyecto, ejecuta setup() una vez y publica:
 * Implementar > Nueva implementación (o Administrar > Editar > Nueva versión)
 * Tipo: Aplicación web · Ejecutar como: Yo · Quién tiene acceso: Cualquier persona.
 * Hojas: ORDENES_TALLER, COTIZACIONES_TALLER, AGENDA_TALLER, CONFIG_TALLER. Fotos y firmas: Drive/TALLER_FOTOS/<folio>.
 */
const TALLER_CLAVE = ''; // opcional: si la llenas, escribe la misma en Configuración de la app
const H = {
  ORDENES_TALLER: ['folio','sucursal','tipo','etapa','cliente','tel','modelo','vin','km','garantia','mecanico','bahia','tiempo_real_ms','inventario_presentes','total_cotizado','total_autorizado','ref','proximo_servicio','actualizado','json'],
  COTIZACIONES_TALLER: ['folio','tipo','sku','descripcion','cantidad','precio','importe','minutos','estado','motivo_rechazo','seguimiento'],
  AGENDA_TALLER: ['folio','fecha','hora','bahia','mecanico'],
  CONFIG_TALLER: ['clave','valor','actualizado']
};
function setup() { Object.keys(H).forEach(function (n) { sheet_(n); }); }
function sheet_(n) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), s = ss.getSheetByName(n);
  if (!s) { s = ss.insertSheet(n); s.appendRow(H[n]); s.setFrozenRows(1); }
  return s;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return out_({ success: true, servicio: 'taller', version: 6 }); }
function doPost(e) {
  var b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ success: false, message: String(err) }); }
  // Las acciones del cliente (enlace de visto bueno) no usan la clave del taller: se protegen con el token de cada orden.
  var pub = b.action === 'verOrden' || b.action === 'autorizarCliente' || b.action === 'fotoCliente';
  if (!pub && TALLER_CLAVE && b.clave !== TALLER_CLAVE) return out_({ success: false, message: 'Clave inválida' });
  // Lecturas sin bloqueo para poder bajar varias fotos a la vez.
  if (b.action === 'foto' || b.action === 'fotoCliente' || b.action === 'verOrden') {
    try {
      if (b.action === 'foto') return out_(foto_(b.id));
      if (b.action === 'fotoCliente') return out_(fotoCliente_(b.folio, b.tok, b.id));
      return out_(verOrden_(b.folio, b.tok));
    } catch (err) { return out_({ success: false, message: String(err) }); }
  }
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (b.action === 'siguienteFolio') return out_({ success: true, folio: siguienteFolio_(b.tipo) });
    if (b.action === 'guardarOrden') return out_(guardarOrden_(b.orden));
    if (b.action === 'listarOrdenes') return out_({ success: true, ordenes: listar_() });
    if (b.action === 'eliminarOrden') return out_(eliminarOrden_(b.folio));
    if (b.action === 'leerConfig') return out_({ success: true, config: leerConfig_() });
    if (b.action === 'guardarConfig') return out_(guardarConfig_(b.cfgK, b.cfgV));
    if (b.action === 'autorizarCliente') return out_(autorizarCliente_(b));
    return out_({ success: false, message: 'Acción desconocida' });
  } catch (err) { return out_({ success: false, message: String(err) }); }
  finally { lock.releaseLock(); }
}
// Devuelve una foto de TALLER_FOTOS como data URL (solo archivos dentro de esa carpeta). La app la usa cuando el navegador no puede mostrar el enlace de Drive.
function foto_(id) {
  if (!/^[\w-]{10,}$/.test(String(id || ''))) return { success: false, message: 'Id inválido' };
  var it = DriveApp.getFoldersByName('TALLER_FOTOS');
  if (!it.hasNext()) return { success: false, message: 'Sin carpeta TALLER_FOTOS' };
  var raiz = it.next().getId(), f = DriveApp.getFileById(id), ok = false, ps = f.getParents();
  while (ps.hasNext() && !ok) { var up = ps.next().getParents(); while (up.hasNext()) if (up.next().getId() === raiz) { ok = true; break; } }
  if (!ok) return { success: false, message: 'Archivo fuera de TALLER_FOTOS' };
  var bl = f.getBlob();
  return { success: true, d: 'data:' + bl.getContentType() + ';base64,' + Utilities.base64Encode(bl.getBytes()) };
}
function siguienteFolio_(tipo) {
  if (!/^(SC|SP|SB|SM|SR|G|SD)$/.test(tipo)) throw new Error('Tipo inválido');
  var p = PropertiesService.getScriptProperties(), k = 'seq_' + tipo;
  var n = Number(p.getProperty(k) || 0) + 1; p.setProperty(k, String(n));
  return tipo + '-' + ('0000' + n).slice(-4);
}
function carpeta_(folio) {
  var it = DriveApp.getFoldersByName('TALLER_FOTOS');
  var raiz = it.hasNext() ? it.next() : DriveApp.createFolder('TALLER_FOTOS');
  var sub = raiz.getFoldersByName(folio);
  return sub.hasNext() ? sub.next() : raiz.createFolder(folio);
}
function subir_(folio, nombre, dataUrl) {
  var m = /^data:(.+?);base64,(.+)$/.exec(dataUrl); if (!m) return null;
  var ext = m[1].indexOf('png') > -1 ? 'png' : 'jpg';
  var f = carpeta_(folio).createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], nombre + '.' + ext));
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/uc?id=' + f.getId();
}
function upsert_(s, folio, fila) {
  var v = s.getRange(1, 1, Math.max(s.getLastRow(), 1), 1).getValues().map(function (r) { return r[0]; });
  var i = v.indexOf(folio);
  if (i > 0) s.getRange(i + 1, 1, 1, fila.length).setValues([fila]); else s.appendRow(fila);
}
// Misma convención que la app: 'fotos.k', 'firmas.k', 'chk.i', 'lineas.i'
function aplicar_(o, u) {
  Object.keys(u).forEach(function (k) {
    var p = k.split('.'), a = p[0], b = p[1];
    if (a === 'fotos' && o.fotos[b]) o.fotos[b] = { u: u[k] };
    else if (a === 'firmas' && o.firmas[b]) o.firmas[b] = { n: o.firmas[b].n, u: u[k] };
    else if (a === 'chk' && o.chk[b]) o.chk[b].f = u[k];
    else if (a === 'chkx' && o.chk[b] && o.chk[b].fx) o.chk[b].fx[p[2]] = u[k];
    else if (a === 'll' && o.llantas && o.llantas[b]) o.llantas[b].f = u[k];
    else if (a === 'llx' && o.llantas && o.llantas[b] && o.llantas[b].fx) o.llantas[b].fx[p[2]] = u[k];
    else if (a === 'dan' && o.danos && o.danos[b]) o.danos[b].f = u[k];
    else if (a === 'danx' && o.danos && o.danos[b] && o.danos[b].fx) o.danos[b].fx[p[2]] = u[k];
    else if (a === 'lineas' && o.lineas[b]) o.lineas[b].f = u[k];
  });
}
function guardarOrden_(o) {
  // Si el cliente autorizó desde el enlace mientras el taller tenía la orden abierta, no se pierde su autorización.
  var prev = buscar_(o.folio);
  if (prev && prev.tok && !o.tok) o.tok = prev.tok;
  if (prev && prev.auth && (!o.auth || o.auth.t < prev.auth.t)) mezclaAuth_(o, prev);
  var urls = {};
  Object.keys(o.fotos || {}).forEach(function (k) { if (o.fotos[k].d) urls['fotos.' + k] = subir_(o.folio, 'foto-' + k, o.fotos[k].d); });
  Object.keys(o.firmas || {}).forEach(function (k) { if (o.firmas[k].d) urls['firmas.' + k] = subir_(o.folio, 'firma-' + k, o.firmas[k].d); });
  (o.chk || []).forEach(function (c, i) {
    if (c.f && c.f.indexOf('data:') === 0) urls['chk.' + i] = subir_(o.folio, 'condicion-' + (i + 1), c.f);
    (c.fx || []).forEach(function (x, j) { if (x && x.indexOf('data:') === 0) urls['chkx.' + i + '.' + j] = subir_(o.folio, 'condicion-' + (i + 1) + '-' + (j + 2), x); });
  });
  (o.llantas || []).forEach(function (l, i) {
    if (l.f && l.f.indexOf('data:') === 0) urls['ll.' + i] = subir_(o.folio, 'llanta-' + (i + 1), l.f);
    (l.fx || []).forEach(function (x, j) { if (x && x.indexOf('data:') === 0) urls['llx.' + i + '.' + j] = subir_(o.folio, 'llanta-' + (i + 1) + '-' + (j + 2), x); });
  });
  (o.danos || []).forEach(function (d, i) {
    if (d.f && d.f.indexOf('data:') === 0) urls['dan.' + i] = subir_(o.folio, 'dano-' + (i + 1), d.f);
    (d.fx || []).forEach(function (x, j) { if (x && x.indexOf('data:') === 0) urls['danx.' + i + '.' + j] = subir_(o.folio, 'dano-' + (i + 1) + '-' + (j + 2), x); });
  });
  (o.lineas || []).forEach(function (l, i) { if (l.f && l.f.indexOf('data:') === 0) urls['lineas.' + i] = subir_(o.folio, 'hallazgo-' + (i + 1), l.f); });
  var copia = JSON.parse(JSON.stringify(o)); aplicar_(copia, urls);
  var L = o.lineas || [], t = { cot: 0, aut: 0 };
  L.forEach(function (l) { var v = (Number(l.cant) || 0) * (Number(l.precio) || 0); t.cot += v; if (l.st === 'aut') t.aut += v; });
  var np = (o.inv || []).filter(function (x) { return x.p; }).length;
  upsert_(sheet_('ORDENES_TALLER'), o.folio, [o.folio, o.suc, o.tipo, o.etapa, o.cliente, o.tel, o.modelo, o.vin, o.km, o.gar ? 'SI' : 'NO', o.mec, o.bahia, o.t ? o.t.acum : 0, np, t.cot, t.aut, o.ref, o.prox ? o.prox.f : '', new Date(), JSON.stringify(copia)]);
  var sc = sheet_('COTIZACIONES_TALLER'), vals = sc.getDataRange().getValues();
  for (var r = vals.length; r > 1; r--) if (vals[r - 1][0] === o.folio) sc.deleteRow(r);
  L.forEach(function (l) { sc.appendRow([o.folio, l.t, l.sku, l.desc, l.cant, l.precio, (Number(l.cant) || 0) * (Number(l.precio) || 0), l.min || 0, l.st, l.mot || '', l.seg || '']); });
  if (o.cita) upsert_(sheet_('AGENDA_TALLER'), o.folio, [o.folio, o.cita.f, o.cita.h, o.cita.b, o.mec]);
  return { success: true, urls: urls, total: t.aut };
}
function listar_() {
  var s = sheet_('ORDENES_TALLER');
  return s.getDataRange().getValues().slice(1).map(function (r) { try { return JSON.parse(r[19] || '{}'); } catch (e) { return {}; } });
}

// Borra la orden, su cotización y su cita (las fotos y firmas de Drive no se tocan).
function eliminarOrden_(folio) {
  if (!folio) return { success: false, message: 'Falta el folio' };
  ['ORDENES_TALLER', 'COTIZACIONES_TALLER', 'AGENDA_TALLER'].forEach(function (n) {
    var s = sheet_(n), v = s.getDataRange().getValues();
    for (var r = v.length; r > 1; r--) if (v[r - 1][0] === folio) s.deleteRow(r);
  });
  return { success: true };
}

// Configuración compartida (por ahora: tarifa de mano de obra por hora de cada agencia, clave 'tarifa_mo|AGENCIA').
function leerConfig_() {
  var o = {};
  sheet_('CONFIG_TALLER').getDataRange().getValues().slice(1).forEach(function (r) { if (r[0]) o[r[0]] = r[1]; });
  return o;
}
function guardarConfig_(k, v) {
  if (!/^tarifa_mo\|.{1,60}$/.test(String(k || ''))) return { success: false, message: 'Clave de configuración inválida' };
  v = Number(v); if (!(v >= 0)) return { success: false, message: 'Valor inválido' };
  upsert_(sheet_('CONFIG_TALLER'), String(k), [String(k), v, new Date()]);
  return { success: true };
}

// ---------- Enlace de visto bueno para el cliente ----------
function buscar_(folio) {
  var s = sheet_('ORDENES_TALLER'), v = s.getRange(1, 1, Math.max(s.getLastRow(), 1), 1).getValues();
  for (var i = 1; i < v.length; i++) if (v[i][0] === folio) {
    try { return JSON.parse(s.getRange(i + 1, 20).getValue() || '{}'); } catch (e) { return null; }
  }
  return null;
}
function valida_(o, tok) { return !!(o && o.tok && tok && String(o.tok) === String(tok)); }
function url_(x) { return (typeof x === 'string' && x.indexOf('http') === 0) ? x : null; }
function urls_(a) { return (a || []).map(url_).filter(function (x) { return x; }); }
// Solo viaja lo que el cliente necesita ver: sin teléfono, dirección, inventario ni datos internos.
function verOrden_(folio, tok) {
  var o = buscar_(String(folio || ''));
  if (!valida_(o, tok)) return { success: false, message: 'Enlace inválido o vencido' };
  var fotos = {};
  Object.keys(o.fotos || {}).forEach(function (k) { var u = o.fotos[k] && url_(o.fotos[k].u); if (u) fotos[k] = { u: u }; });
  var aut = o.firmas && o.firmas.aut && url_(o.firmas.aut.u);
  return { success: true, orden: {
    folio: o.folio, tipo: o.tipo, suc: o.suc, etapa: o.etapa, cliente: o.cliente, modelo: o.modelo, anio: o.anio, vin: o.vin, km: o.km,
    mec: o.mec, fing: o.fing, marca: o.marca, placas: o.placas, asesor: o.asesor, motivo: o.motivo, cond: o.cond, diag: o.diag, fotos: fotos,
    danos: (o.danos || []).map(function (d) { return { x: d.x, y: d.y, t: d.t, n: d.n, f: url_(d.f), fx: urls_(d.fx) }; }),
    chk: (o.chk || []).map(function (c) { return { e: c.e, n: c.n, op: c.op || '', f: url_(c.f), fx: urls_(c.fx) }; }),
    llantas: (o.llantas || []).map(function (l) { return { p: l.p, med: l.med, des: l.des, psi: l.psi, e: l.e, n: l.n, op: l.op || '', f: url_(l.f), fx: urls_(l.fx) }; }),
    lineas: (o.lineas || []).map(function (l) { return { t: l.t, sku: l.sku, desc: l.desc, cant: l.cant, precio: l.precio, min: l.min, st: l.st, mot: l.mot || '', f: url_(l.f) }; }),
    auth: o.auth ? { t: o.auth.t, n: o.auth.n } : null, firma: aut || null
  } };
}
// Foto del enlace: solo si el archivo pertenece a esa orden.
function fotoCliente_(folio, tok, id) {
  var o = buscar_(String(folio || ''));
  if (!valida_(o, tok)) return { success: false, message: 'Enlace inválido o vencido' };
  if (JSON.stringify(o).indexOf(String(id)) < 0) return { success: false, message: 'Foto no encontrada' };
  return foto_(id);
}
function autorizarCliente_(b) {
  var o = buscar_(String(b.folio || ''));
  if (!valida_(o, b.tok)) return { success: false, message: 'Enlace inválido o vencido' };
  if (o.etapa === 'entregado') return { success: false, message: 'Esta orden ya fue entregada' };
  var nombre = String(b.nombre || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (nombre.length < 3) return { success: false, message: 'Escribe tu nombre completo' };
  var m = /^data:image\/png;base64,(.+)$/.exec(String(b.firma || ''));
  if (!m || m[1].length > 900000) return { success: false, message: 'Falta la firma' };
  var D = b.decisiones || [], L = o.lineas || [], hecho = [];
  var seg = Utilities.formatDate(new Date(Date.now() + 30 * 864e5), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  for (var k = 0; k < D.length; k++) {
    var d = D[k], l = L[d.i];
    if (!l || l.desc !== d.desc) return { success: false, message: 'La cotización cambió. Recarga la página para ver la versión actualizada.' };
    if (l.st !== 'pend' || (d.st !== 'aut' && d.st !== 'rech')) continue;   // solo se decide lo pendiente
    l.st = d.st;
    if (d.st === 'rech') { l.mot = String(d.mot || 'Otro').slice(0, 40); if (!l.seg) l.seg = seg; }
    hecho.push({ i: d.i, desc: l.desc, st: l.st, mot: l.mot || '', seg: l.seg || '' });
  }
  if (!hecho.length) return { success: false, message: 'No hay conceptos pendientes de autorizar' };
  o.firmas = o.firmas || {};
  o.firmas.aut = { n: nombre, u: subir_(o.folio, 'firma-autoriza', 'data:image/png;base64,' + m[1]) };
  o.auth = { t: Date.now(), n: nombre, d: hecho };
  o.upd = Date.now();
  var r = guardarOrden_(o);
  return { success: true, total: r.total };
}
// Aplica a la orden que llega del taller la autorización que ya está guardada en el servidor.
function mezclaAuth_(o, prev) {
  o.auth = prev.auth;
  o.firmas = o.firmas || {};
  if (prev.firmas && prev.firmas.aut && !(o.firmas.aut && o.firmas.aut.d)) o.firmas.aut = prev.firmas.aut;
  (prev.auth.d || []).forEach(function (d) {
    var l = (o.lineas || [])[d.i];
    if (l && l.desc === d.desc && l.st === 'pend') { l.st = d.st; if (d.mot) l.mot = d.mot; if (d.st === 'rech' && !l.seg) l.seg = d.seg || ''; }
  });
}
