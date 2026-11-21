/**
 * API del taller (Google Apps Script) — v4 (foto por número de daño en Carrocería, proxy de fotos de Drive para PC).
 * Pega este archivo en tu proyecto, ejecuta setup() una vez y publica:
 * Implementar > Nueva implementación (o Administrar > Editar > Nueva versión)
 * Tipo: Aplicación web · Ejecutar como: Yo · Quién tiene acceso: Cualquier persona.
 * Hojas: ORDENES_TALLER, COTIZACIONES_TALLER, AGENDA_TALLER. Fotos y firmas: Drive/TALLER_FOTOS/<folio>.
 */
const TALLER_CLAVE = ''; // opcional: si la llenas, escribe la misma en Configuración de la app
const H = {
  ORDENES_TALLER: ['folio','sucursal','tipo','etapa','cliente','tel','modelo','vin','km','garantia','mecanico','bahia','tiempo_real_ms','inventario_presentes','total_cotizado','total_autorizado','ref','proximo_servicio','actualizado','json'],
  COTIZACIONES_TALLER: ['folio','tipo','sku','descripcion','cantidad','precio','importe','minutos','estado','motivo_rechazo','seguimiento'],
  AGENDA_TALLER: ['folio','fecha','hora','bahia','mecanico']
};
function setup() { Object.keys(H).forEach(function (n) { sheet_(n); }); }
function sheet_(n) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), s = ss.getSheetByName(n);
  if (!s) { s = ss.insertSheet(n); s.appendRow(H[n]); s.setFrozenRows(1); }
  return s;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return out_({ success: true, servicio: 'taller', version: 4 }); }
function doPost(e) {
  var b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ success: false, message: String(err) }); }
  if (TALLER_CLAVE && b.clave !== TALLER_CLAVE) return out_({ success: false, message: 'Clave inválida' });
  // Las fotos se piden sin bloqueo para poder bajar varias a la vez.
  if (b.action === 'foto') { try { return out_(foto_(b.id)); } catch (err) { return out_({ success: false, message: String(err) }); } }
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (b.action === 'siguienteFolio') return out_({ success: true, folio: siguienteFolio_(b.tipo) });
    if (b.action === 'guardarOrden') return out_(guardarOrden_(b.orden));
    if (b.action === 'listarOrdenes') return out_({ success: true, ordenes: listar_() });
    if (b.action === 'eliminarOrden') return out_(eliminarOrden_(b.folio));
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
