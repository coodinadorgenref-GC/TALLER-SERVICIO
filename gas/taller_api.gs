/**
 * API del taller (Google Apps Script). Pega este archivo en tu proyecto "apps-script",
 * ejecuta setup() una vez y publica como Aplicación web (Ejecutar como: yo / Acceso: cualquiera).
 * Hojas: ORDENES_TALLER, COTIZACIONES_TALLER, AGENDA_TALLER. Fotos y firmas: Drive/TALLER_FOTOS/<folio>.
 */
const TALLER_CLAVE = 'CAMBIA-ESTA-CLAVE'; // misma que captures en Configuración de la app
const H = {
  ORDENES_TALLER: ['folio','tipo','etapa','cliente','tel','modelo','anio','vin','km','combustible','motivo','mecanico','bahia','mo_min','mo_monto','aprobado','tiempo_real_ms','ref','fotos','firma','actualizado','json'],
  COTIZACIONES_TALLER: ['folio','sku','descripcion','cantidad','precio','subtotal'],
  AGENDA_TALLER: ['folio','fecha','hora','bahia','mecanico']
};
function setup() { Object.keys(H).forEach(n => sheet_(n)); }
function sheet_(n) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(n);
  if (!s) { s = ss.insertSheet(n); s.appendRow(H[n]); s.setFrozenRows(1); }
  return s;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return out_({ success: true, servicio: 'taller' }); }
function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.clave !== TALLER_CLAVE) return out_({ success: false, message: 'Clave inválida' });
    if (b.action === 'siguienteFolio') return out_({ success: true, folio: siguienteFolio_(b.tipo) });
    if (b.action === 'guardarOrden') return out_(guardarOrden_(b.orden));
    if (b.action === 'listarOrdenes') return out_({ success: true, ordenes: listar_() });
    return out_({ success: false, message: 'Acción desconocida' });
  } catch (err) { return out_({ success: false, message: String(err) }); }
  finally { lock.releaseLock(); }
}
function siguienteFolio_(tipo) {
  if (!/^(SC|SP|SB|SM|SR|G|DS)$/.test(tipo)) throw new Error('Tipo inválido');
  const p = PropertiesService.getScriptProperties(), k = 'seq_' + tipo;
  const n = Number(p.getProperty(k) || 0) + 1; p.setProperty(k, String(n));
  return tipo + '-' + ('0000' + n).slice(-4);
}
function carpeta_(folio) {
  const it = DriveApp.getFoldersByName('TALLER_FOTOS');
  const raiz = it.hasNext() ? it.next() : DriveApp.createFolder('TALLER_FOTOS');
  const sub = raiz.getFoldersByName(folio);
  return sub.hasNext() ? sub.next() : raiz.createFolder(folio);
}
function subir_(folio, nombre, dataUrl) {
  const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl); if (!m) return null;
  const f = carpeta_(folio).createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], nombre + '.' + (m[1].indexOf('png') > -1 ? 'png' : 'jpg')));
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/uc?id=' + f.getId();
}
function upsert_(s, folio, fila) {
  const v = s.getRange(1, 1, Math.max(s.getLastRow(), 1), 1).getValues().map(r => r[0]);
  const i = v.indexOf(folio);
  if (i > 0) s.getRange(i + 1, 1, 1, fila.length).setValues([fila]); else s.appendRow(fila);
}
function guardarOrden_(o) {
  const urls = { fotos: {}, firma: null };
  Object.keys(o.fotos || {}).forEach(k => { const d = o.fotos[k].d; if (d) urls.fotos[k] = subir_(o.folio, k, d); });
  (o.chk || []).forEach((c, i) => { if (c.f && c.f.indexOf('data:') === 0) c.f = subir_(o.folio, 'falla' + (i + 1), c.f); });
  (o.hall || []).forEach((h, i) => { if (h.f && h.f.indexOf('data:') === 0) h.f = subir_(o.folio, 'hallazgo' + (i + 1), h.f); });
  if (o.firma && o.firma.d) urls.firma = subir_(o.folio, 'firma', o.firma.d);
  const fot = Object.assign({}, (o.fotos || {}));
  Object.keys(fot).forEach(k => fot[k] = urls.fotos[k] || fot[k].u || '');
  const copia = JSON.parse(JSON.stringify(o));
  Object.keys(copia.fotos || {}).forEach(k => copia.fotos[k] = { u: fot[k] });
  if (copia.firma) copia.firma = { u: urls.firma || (o.firma.u || '') };
  const tot = (o.lineas || []).reduce((a, l) => a + l.cant * l.precio, 0);
  upsert_(sheet_('ORDENES_TALLER'), o.folio, [o.folio, o.tipo, o.etapa, o.cliente, o.tel, o.modelo, o.anio, o.vin, o.km, o.comb, o.motivo, o.mec, o.bahia, o.mo.min, o.mo.monto, o.aprobado, o.t.acum, o.ref, JSON.stringify(fot), copia.firma ? copia.firma.u : '', new Date(), JSON.stringify(copia)]);
  const sc = sheet_('COTIZACIONES_TALLER'), vals = sc.getDataRange().getValues();
  for (let r = vals.length; r > 1; r--) if (vals[r - 1][0] === o.folio) sc.deleteRow(r);
  (o.lineas || []).forEach(l => sc.appendRow([o.folio, l.sku, l.desc, l.cant, l.precio, l.cant * l.precio]));
  if (o.cita) upsert_(sheet_('AGENDA_TALLER'), o.folio, [o.folio, o.cita.f, o.cita.h, o.cita.b, o.mec]);
  return { success: true, urls: { fotos: urls.fotos, firma: urls.firma }, total: tot + Number(o.mo.monto || 0) };
}
function listar_() { const s = sheet_('ORDENES_TALLER'); return s.getDataRange().getValues().slice(1).map(r => JSON.parse(r[21] || '{}')); }
