/**
 * API del taller (Google Apps Script) — v14 (columnas personalizadas del panel por agencia: claves etapas_cfg|AGENCIA en CONFIG_TALLER; v13: citas con correo, VIN, marca, año, técnico y duración; v12: citas de la Agenda: hojas CITAS_TALLER, acciones listarCitas / guardarCita; v11: la orden pasa a la columna Autorizado cuando el cliente autoriza; v10: garantías: lo que acepta el cliente queda en Garantía; v9: modeloVin: modelo probable de la moto a partir del prefijo del VIN, leído de MOTOS_TALLER; v8: colaboradores por agencia COLABORADORES_TALLER: listarColaboradores / guardarColaborador / importarColaboradores; v7: base de motos MOTOS_TALLER: buscarVin / buscarMotos / importarMotos y registro automático desde cada orden; v6: enlace de visto bueno para el cliente: verOrden / autorizarCliente / fotoCliente con token por orden; v5: tarifa de mano de obra por agencia en CONFIG_TALLER; v4: foto por número de daño en Carrocería, proxy de fotos de Drive para PC).
 * Pega este archivo en tu proyecto, ejecuta setup() una vez y publica:
 * Implementar > Nueva implementación (o Administrar > Editar > Nueva versión)
 * Tipo: Aplicación web · Ejecutar como: Yo · Quién tiene acceso: Cualquier persona.
 * Hojas: ORDENES_TALLER, COTIZACIONES_TALLER, AGENDA_TALLER, CONFIG_TALLER, MOTOS_TALLER, COLABORADORES_TALLER. Fotos y firmas: Drive/TALLER_FOTOS/<folio>.
 * IMPORTANTE: la base de motos trae nombres, teléfonos y direcciones de clientes. Sus acciones se niegan si TALLER_CLAVE está vacía:
 * escribe una clave (cualquier texto secreto) aquí y la misma en Configuración de la app.
 */
const TALLER_CLAVE = ''; // obligatoria para la base de motos; opcional para lo demás. Escribe la misma en Configuración de la app
const H = {
  ORDENES_TALLER: ['folio','sucursal','tipo','etapa','cliente','tel','modelo','vin','km','garantia','mecanico','bahia','tiempo_real_ms','inventario_presentes','total_cotizado','total_autorizado','ref','proximo_servicio','actualizado','json'],
  COTIZACIONES_TALLER: ['folio','tipo','sku','descripcion','cantidad','precio','importe','minutos','estado','motivo_rechazo','seguimiento'],
  AGENDA_TALLER: ['folio','fecha','hora','bahia','mecanico'],
  // Citas programadas desde la Agenda (una fila por cita; la columna json es la cita completa). estado: prog / llego / no / cancel
  CITAS_TALLER: ['id','agencia','fecha','hora','cliente','tel','moto','tipo','estado','folio','actualizado','json'],
  CONFIG_TALLER: ['clave','valor','actualizado'],
  // Colaboradores por agencia (sugerencias de Asesor de servicio, Asesor de refacciones y Técnico). activo: SI / NO (la baja no borra la fila).
  COLABORADORES_TALLER: ['agencia','puesto','nombre','activo','actualizado'],
  // Una fila por moto (VIN). origen: VENTA (la vendió el grupo), TALLER (se registró en una orden) o VENTA+TALLER.
  // km y combustible NO van aquí: se capturan en cada visita. fecha_venta queda lista para validar garantías.
  MOTOS_TALLER: ['vin','cliente','tel','email','direccion','ciudad','marca','modelo','anio','placas','fecha_venta','factura','sucursal_venta','cve_cliente','origen','actualizado']
};
function setup() { Object.keys(H).forEach(function (n) { sheet_(n); }); }
function sheet_(n) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), s = ss.getSheetByName(n);
  if (!s) {
    s = ss.insertSheet(n); s.appendRow(H[n]); s.setFrozenRows(1);
    // MOTOS_TALLER en texto plano: conserva ceros a la izquierda (cve_cliente) y no convierte fechas ni teléfonos.
    if (n === 'MOTOS_TALLER') s.getRange(1, 1, s.getMaxRows(), H[n].length).setNumberFormat('@');
  }
  return s;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return out_({ success: true, servicio: 'taller', version: 9 }); }
function doPost(e) {
  var b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ success: false, message: String(err) }); }
  // Las acciones del cliente (enlace de visto bueno) no usan la clave del taller: se protegen con el token de cada orden.
  var pub = b.action === 'verOrden' || b.action === 'autorizarCliente' || b.action === 'fotoCliente';
  if (!pub && TALLER_CLAVE && b.clave !== TALLER_CLAVE) return out_({ success: false, message: 'Clave inválida' });
  // La base de motos tiene datos personales de clientes: sin TALLER_CLAVE no se atiende.
  if ((b.action === 'buscarVin' || b.action === 'buscarMotos' || b.action === 'modeloVin' || b.action === 'importarMotos') && !TALLER_CLAVE) return out_({ success: false, message: 'Define TALLER_CLAVE (clave) en el script y en Configuración de la app para usar la base de motos' });
  // Lecturas sin bloqueo para poder bajar varias fotos a la vez.
  if (b.action === 'foto' || b.action === 'fotoCliente' || b.action === 'verOrden' || b.action === 'buscarVin' || b.action === 'buscarMotos' || b.action === 'modeloVin') {
    try {
      if (b.action === 'foto') return out_(foto_(b.id));
      if (b.action === 'fotoCliente') return out_(fotoCliente_(b.folio, b.tok, b.id));
      if (b.action === 'buscarVin') return out_(buscarVin_(b.vin));
      if (b.action === 'buscarMotos') return out_(buscarMotos_(b.campo, b.q));
      if (b.action === 'modeloVin') return out_(modelosDeVin_(b.vin));
      return out_(verOrden_(b.folio, b.tok));
    } catch (err) { return out_({ success: false, message: String(err) }); }
  }
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (b.action === 'siguienteFolio') return out_({ success: true, folio: siguienteFolio_(b.tipo) });
    if (b.action === 'guardarOrden') return out_(guardarOrden_(b.orden));
    if (b.action === 'listarOrdenes') return out_({ success: true, ordenes: listar_() });
    if (b.action === 'listarCitas') return out_({ success: true, citas: listarCitas_() });
    if (b.action === 'guardarCita') return out_(guardarCita_(b.cita));
    if (b.action === 'eliminarOrden') return out_(eliminarOrden_(b.folio));
    if (b.action === 'leerConfig') return out_({ success: true, config: leerConfig_() });
    if (b.action === 'guardarConfig') return out_(guardarConfig_(b.cfgK, b.cfgV));
    if (b.action === 'autorizarCliente') return out_(autorizarCliente_(b));
    if (b.action === 'importarMotos') return out_(importarMotos_(b.filas));
    if (b.action === 'listarColaboradores') return out_(listarColaboradores_());
    if (b.action === 'guardarColaborador') return out_(guardarColaborador_(b.agencia, b.puesto, b.nombre, b.activo !== false));
    if (b.action === 'importarColaboradores') return out_(importarColaboradores_(b.filas));
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
  // La moto de la orden queda registrada en MOTOS_TALLER (si el grupo no se la vendió, así entra a la base). Nunca debe impedir guardar la orden.
  try { registrarMotoDeOrden_(o); } catch (err) { }
  var sc = sheet_('COTIZACIONES_TALLER'), vals = sc.getDataRange().getValues();
  for (var r = vals.length; r > 1; r--) if (vals[r - 1][0] === o.folio) sc.deleteRow(r);
  L.forEach(function (l) { sc.appendRow([o.folio, l.t, l.sku, l.desc, l.cant, l.precio, (Number(l.cant) || 0) * (Number(l.precio) || 0), l.min || 0, l.st, l.mot || '', l.seg || '']); });
  if (o.cita) upsert_(sheet_('AGENDA_TALLER'), o.folio, [o.folio, o.cita.f, o.cita.h, o.cita.b, o.mec]);
  return { success: true, urls: urls, total: t.aut };
}
// ---------- Citas (CITAS_TALLER) ----------
function listarCitas_() {
  return sheet_('CITAS_TALLER').getDataRange().getValues().slice(1).map(function (r) { try { return JSON.parse(r[11] || '{}'); } catch (e) { return {}; } });
}
function guardarCita_(c) {
  if (!c || !/^CT[0-9A-Z]{4,30}$/.test(String(c.id || ''))) return { success: false, message: 'Cita inválida' };
  var t = function (v, n) { return String(v === null || v === undefined ? '' : v).slice(0, n || 200); };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t(c.f, 10)) || !/^\d{2}:\d{2}$/.test(t(c.t, 5))) return { success: false, message: 'Fecha u hora inválida' };
  var cita = { id: c.id, suc: t(c.suc, 60), f: t(c.f, 10), t: t(c.t, 5), b: t(c.b, 3), tipo: t(c.tipo, 4), cliente: t(c.cliente, 120), tel: t(c.tel, 30), modelo: t(c.modelo, 120), marca: t(c.marca, 60), anio: t(c.anio, 4), email: t(c.email, 120), vin: t(c.vin, 25).toUpperCase(), mec: t(c.mec, 80), dur: Math.min(480, Math.max(15, Number(c.dur) || 60)), nota: t(c.nota, 500),
    est: ['prog', 'llego', 'no', 'cancel'].indexOf(c.est) >= 0 ? c.est : 'prog', folio: t(c.folio, 30), por: t(c.por, 80), cre: Number(c.cre) || Date.now(), upd: Number(c.upd) || Date.now() };
  var s = sheet_('CITAS_TALLER'), v = s.getDataRange().getValues(), fila = -1;
  for (var i = 1; i < v.length; i++) if (v[i][0] === cita.id) { fila = i; break; }
  if (fila >= 0) { try { var prev = JSON.parse(v[fila][11] || '{}'); if ((prev.upd || 0) > cita.upd) return { success: true, cita: prev }; } catch (e) {} }
  upsert_(s, cita.id, [cita.id, cita.suc, cita.f, cita.t, cita.cliente, cita.tel, cita.modelo, cita.tipo, cita.est, cita.folio, new Date(), JSON.stringify(cita)]);
  return { success: true };
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
  k = String(k || '');
  // v14: columnas personalizadas del panel (JSON), una clave por agencia: etapas_cfg|AGENCIA
  if (/^etapas_cfg\|.{1,60}$/.test(k)) {
    v = String(v == null ? '' : v);
    if (v.length > 40000) return { success: false, message: 'Configuración demasiado grande' };
    try { JSON.parse(v); } catch (e) { return { success: false, message: 'Configuración inválida' }; }
    upsert_(sheet_('CONFIG_TALLER'), k, [k, v, new Date()]);
    return { success: true };
  }
  if (!/^tarifa_mo\|.{1,60}$/.test(k)) return { success: false, message: 'Clave de configuración inválida' };
  v = Number(v); if (!(v >= 0)) return { success: false, message: 'Valor inválido' };
  upsert_(sheet_('CONFIG_TALLER'), String(k), [String(k), v, new Date()]);
  return { success: true };
}

// ---------- Colaboradores (COLABORADORES_TALLER) ----------
var PUESTOS_COL = ['ASESOR DE SERVICIO', 'ASESOR DE REFACCIONES', 'MECANICO'];
function colNorm_(v) { return String(v === null || v === undefined ? '' : v).replace(/\s+/g, ' ').trim().toUpperCase().slice(0, 80); }
function listarColaboradores_() {
  var out = [];
  sheet_('COLABORADORES_TALLER').getDataRange().getValues().slice(1).forEach(function (r) {
    if (r[0] && r[2] && colNorm_(r[3]) !== 'NO') out.push({ a: colNorm_(r[0]), p: colNorm_(r[1]), n: colNorm_(r[2]) });
  });
  return { success: true, colaboradores: out };
}
// Alta (activo = true) o baja (activo = false) de un colaborador. La baja solo marca NO: las órdenes viejas conservan el nombre.
function guardarColaborador_(agencia, puesto, nombre, activo) {
  var a = colNorm_(agencia), p = colNorm_(puesto), n = colNorm_(nombre);
  if (!a || PUESTOS_COL.indexOf(p) < 0 || n.length < 3) return { success: false, message: 'Datos de colaborador inválidos' };
  var s = sheet_('COLABORADORES_TALLER'), v = s.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) {
    if (colNorm_(v[i][0]) === a && colNorm_(v[i][1]) === p && colNorm_(v[i][2]) === n) {
      s.getRange(i + 1, 4, 1, 2).setValues([[activo ? 'SI' : 'NO', new Date()]]);
      return { success: true };
    }
  }
  if (activo) s.appendRow([a, p, n, 'SI', new Date()]);
  return { success: true };
}
// Carga masiva (CSV con AGENCIA, PUESTO, NOMBRE). No duplica: reactiva a quien estaba dado de baja.
function importarColaboradores_(filas) {
  var s = sheet_('COLABORADORES_TALLER'), v = s.getDataRange().getValues(), idx = {}, nuevas = [], nue = 0, rea = 0, omi = 0;
  for (var i = 1; i < v.length; i++) idx[colNorm_(v[i][0]) + '|' + colNorm_(v[i][1]) + '|' + colNorm_(v[i][2])] = i;
  (filas || []).forEach(function (f) {
    var a = colNorm_(f && f.agencia), p = colNorm_(f && f.puesto), n = colNorm_(f && f.nombre);
    if (!a || PUESTOS_COL.indexOf(p) < 0 || n.length < 3) { omi++; return; }
    var k = a + '|' + p + '|' + n;
    if (idx[k] === undefined) { nuevas.push([a, p, n, 'SI', new Date()]); idx[k] = -1; nue++; }
    else if (idx[k] > 0 && colNorm_(v[idx[k]][3]) === 'NO') { s.getRange(idx[k] + 1, 4, 1, 2).setValues([['SI', new Date()]]); v[idx[k]][3] = 'SI'; rea++; }
    else omi++;
  });
  if (nuevas.length) s.getRange(s.getLastRow() + 1, 1, nuevas.length, 5).setValues(nuevas);
  return { success: true, nuevos: nue, reactivados: rea, omitidos: omi };
}

// ---------- Base de motos (MOTOS_TALLER) ----------
var MOTO_CAMPOS_VENTA = ['fecha_venta', 'factura', 'sucursal_venta', 'cve_cliente'];
var MOTO_CAMPOS_PERSONA = ['cliente', 'tel', 'email', 'direccion', 'ciudad', 'marca', 'modelo', 'anio', 'placas'];
function nVin_(v) { return String(v || '').toUpperCase().replace(/\s+/g, ''); }
function nPlacas_(v) { return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function nTel_(v) { var d = String(v || '').replace(/\D/g, ''); if (d.length === 12 && d.indexOf('52') === 0) d = d.slice(2); return d; }
function nEmail_(v) { var e = String(v || '').trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120 ? e : ''; }
function txt_(v) { return String(v === null || v === undefined ? '' : v).replace(/\s+/g, ' ').trim().slice(0, 200); }
function motoObj_(r) { var o = {}; H.MOTOS_TALLER.forEach(function (k, i) { o[k] = r[i] === null || r[i] === undefined ? '' : String(r[i]); }); return o; }
function motoFila_(o) { return H.MOTOS_TALLER.map(function (k) { return o[k] === undefined || o[k] === null ? '' : o[k]; }); }
// Escribe filas desde la fila f0 (1 = encabezado), agregando filas a la hoja si hace falta y en texto plano.
function escribirMotos_(s, f0, filas) {
  if (!filas.length) return;
  var falta = f0 + filas.length - 1 - s.getMaxRows();
  if (falta > 0) s.insertRowsAfter(s.getMaxRows(), falta);
  var r = s.getRange(f0, 1, filas.length, H.MOTOS_TALLER.length);
  r.setNumberFormat('@'); r.setValues(filas);
}
function filaDeVin_(s, vin) {
  var n = s.getLastRow(); if (n < 2) return -1;
  var v = s.getRange(2, 1, n - 1, 1).getValues();
  for (var i = 0; i < v.length; i++) if (nVin_(v[i][0]) === vin) return i + 2;
  return -1;
}
function buscarVin_(vin) {
  vin = nVin_(vin);
  if (vin.length < 8) return { success: true, moto: null };
  var s = sheet_('MOTOS_TALLER'), f = filaDeVin_(s, vin);
  return { success: true, moto: f < 0 ? null : motoObj_(s.getRange(f, 1, 1, H.MOTOS_TALLER.length).getValues()[0]) };
}
// Busca por teléfono (10 dígitos) o por placas. Devuelve hasta 8 motos, la venta más reciente primero.
function buscarMotos_(campo, q) {
  var col = campo === 'placas' ? H.MOTOS_TALLER.indexOf('placas') + 1 : campo === 'tel' ? H.MOTOS_TALLER.indexOf('tel') + 1 : 0;
  if (!col) return { success: false, message: 'Campo inválido' };
  q = campo === 'tel' ? nTel_(q) : nPlacas_(q);
  if (q.length < (campo === 'tel' ? 10 : 4)) return { success: true, motos: [] };
  var s = sheet_('MOTOS_TALLER'), n = s.getLastRow(); if (n < 2) return { success: true, motos: [] };
  var v = s.getRange(2, col, n - 1, 1).getValues(), hit = [];
  for (var i = 0; i < v.length; i++) if ((campo === 'tel' ? nTel_(v[i][0]) : nPlacas_(v[i][0])) === q) hit.push(i + 2);
  var motos = hit.slice(0, 40).map(function (f) { return motoObj_(s.getRange(f, 1, 1, H.MOTOS_TALLER.length).getValues()[0]); });
  motos.sort(function (a, b) { return String(b.fecha_venta).localeCompare(String(a.fecha_venta)); });
  return { success: true, motos: motos.slice(0, 8) };
}
// Modelo probable a partir del VIN. El VIN no trae el modelo escrito, pero las motos de la base con el mismo prefijo (primeros 8 caracteres: fábrica + descriptor) casi siempre son el mismo modelo.
// Devuelve hasta 5 modelos con cuántas motos de la base tiene cada uno, el más frecuente primero. La app decide si lo llena sola (un modelo domina) o pide elegir.
function modelosDeVin_(vin) {
  vin = nVin_(vin);
  if (vin.length < 8) return { success: true, modelos: [], total: 0 };
  var pre = vin.slice(0, 8), s = sheet_('MOTOS_TALLER'), n = s.getLastRow();
  if (n < 2) return { success: true, modelos: [], total: 0 };
  var cm = H.MOTOS_TALLER.indexOf('modelo') + 1;
  var v = s.getRange(2, 1, n - 1, cm).getValues(), cuenta = {}, total = 0;
  for (var i = 0; i < v.length; i++) {
    if (nVin_(v[i][0]).indexOf(pre) !== 0) continue;
    var m = txt_(v[i][cm - 1]).toUpperCase(); if (!m) continue;
    cuenta[m] = (cuenta[m] || 0) + 1; total++;
  }
  var lista = Object.keys(cuenta).map(function (k) { return { m: k, n: cuenta[k] }; }).sort(function (a, b) { return b.n - a.n; });
  return { success: true, modelos: lista.slice(0, 5), total: total };
}
// Importa/actualiza en bloque (desde el reporte de ventas). No pisa lo que el taller ya capturó en visitas.
function importarMotos_(filas) {
  if (!Array.isArray(filas)) return { success: false, message: 'Faltan filas' };
  if (filas.length > 3000) return { success: false, message: 'Máximo 3000 filas por envío' };
  var s = sheet_('MOTOS_TALLER'), n = s.getLastRow(), C = H.MOTOS_TALLER.length;
  var data = n >= 2 ? s.getRange(2, 1, n - 1, C).getValues().map(motoObj_) : [], idx = {};
  data.forEach(function (o, i) { idx[nVin_(o.vin)] = i; });
  var nuevas = [], cambiadas = {}, ahora = new Date().toISOString(), nNue = 0, nAct = 0, omit = 0;
  filas.forEach(function (f) {
    var vin = nVin_(f.vin); if (vin.length < 8) { omit++; return; }
    var inc = { vin: vin, cliente: txt_(f.cliente), tel: nTel_(f.tel), email: nEmail_(f.email), direccion: txt_(f.direccion), ciudad: txt_(f.ciudad), marca: txt_(f.marca), modelo: txt_(f.modelo), anio: txt_(f.anio), placas: nPlacas_(f.placas),
      fecha_venta: txt_(f.fecha_venta), factura: txt_(f.factura), sucursal_venta: txt_(f.sucursal_venta), cve_cliente: txt_(f.cve_cliente) };
    var i = idx[vin];
    if (i === undefined) {
      inc.origen = 'VENTA'; inc.actualizado = ahora; idx[vin] = data.length + nuevas.length; nuevas.push(inc); nNue++; return;
    }
    var old = i < data.length ? data[i] : nuevas[i - data.length];
    // Una venta más vieja que la ya guardada no la reemplaza.
    if (old.fecha_venta && inc.fecha_venta && inc.fecha_venta < old.fecha_venta) { omit++; return; }
    var visitado = String(old.origen).indexOf('TALLER') >= 0;
    MOTO_CAMPOS_VENTA.forEach(function (k) { if (inc[k]) old[k] = inc[k]; });
    MOTO_CAMPOS_PERSONA.forEach(function (k) { if (k !== 'direccion' && k !== 'ciudad' && inc[k] && (!visitado || !old[k])) old[k] = inc[k]; });
    // Dirección y ciudad van juntas: si el taller ya corrigió la dirección, no se le vuelve a pegar la ciudad de la venta.
    if (inc.direccion && (!visitado || !old.direccion)) { old.direccion = inc.direccion; old.ciudad = inc.ciudad; }
    old.origen = visitado ? 'VENTA+TALLER' : 'VENTA'; old.actualizado = ahora;
    if (i < data.length) cambiadas[i] = true;
    nAct++;
  });
  var ids = Object.keys(cambiadas);
  if (ids.length) escribirMotos_(s, 2, data.map(motoFila_));
  if (nuevas.length) escribirMotos_(s, 2 + data.length, nuevas.map(motoFila_));
  return { success: true, nuevas: nNue, actualizadas: nAct, omitidas: omit, total: data.length + nuevas.length };
}
// Cada orden guardada deja (o completa) su moto en la base: cliente, teléfono, correo, dirección, marca, modelo, año y placas. km, combustible y quién trae la moto no (son de cada visita).
function registrarMotoDeOrden_(o) {
  var vin = nVin_(o.vin); if (vin.length < 8) return;
  var s = sheet_('MOTOS_TALLER'), f = filaDeVin_(s, vin), ahora = new Date().toISOString();
  var inc = { cliente: txt_(o.cliente), tel: nTel_(o.tel), email: nEmail_(o.email), direccion: txt_(o.dir), marca: txt_(o.marca), modelo: txt_(o.modelo), anio: txt_(o.anio), placas: nPlacas_(o.placas) };
  if (f < 0) {
    var nu = { vin: vin, cliente: inc.cliente, tel: inc.tel, email: inc.email, direccion: inc.direccion, ciudad: '', marca: inc.marca, modelo: inc.modelo, anio: inc.anio, placas: inc.placas, fecha_venta: '', factura: '', sucursal_venta: '', cve_cliente: '', origen: 'TALLER', actualizado: ahora };
    escribirMotos_(s, s.getLastRow() + 1, [motoFila_(nu)]); return;
  }
  var old = motoObj_(s.getRange(f, 1, 1, H.MOTOS_TALLER.length).getValues()[0]);
  ['cliente', 'tel', 'email', 'marca', 'modelo', 'anio', 'placas'].forEach(function (k) { if (inc[k]) old[k] = inc[k]; });
  // La app arma la dirección como "dirección, ciudad": si no la cambiaron, se deja tal cual está en la base.
  var dirBase = [old.direccion, old.ciudad].filter(function (x) { return x; }).join(', ');
  if (inc.direccion && inc.direccion !== dirBase) { old.direccion = inc.direccion; old.ciudad = ''; }
  old.origen = String(old.origen).indexOf('VENTA') >= 0 ? 'VENTA+TALLER' : 'TALLER'; old.actualizado = ahora;
  escribirMotos_(s, f, [motoFila_(old)]);
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
    l.st = (d.st === 'aut' && o.tipo === 'G') ? 'gar' : d.st;   // orden de garantía: lo aceptado queda en Garantía (sin cargo)
    if (d.st === 'rech') { l.mot = String(d.mot || 'Otro').slice(0, 40); if (!l.seg) l.seg = seg; }
    hecho.push({ i: d.i, desc: l.desc, st: l.st, mot: l.mot || '', seg: l.seg || '' });
  }
  if (!hecho.length) return { success: false, message: 'No hay conceptos pendientes de autorizar' };
  o.firmas = o.firmas || {};
  o.firmas.aut = { n: nombre, u: subir_(o.folio, 'firma-autoriza', 'data:image/png;base64,' + m[1]) };
  o.auth = { t: Date.now(), n: nombre, d: hecho };
  if (['recepcion', 'taller', 'cotizacion', 'diagnostico'].indexOf(o.etapa) >= 0) {   // el cliente ya decidió: la orden pasa sola a la columna Autorizado
    o.etapa = 'autorizado';
    (o.hist = o.hist || []).push({ t: Date.now(), u: nombre, x: 'Etapa: Autorizado (el cliente autorizó desde el enlace)' });
  }
  o.upd = Date.now();
  var r = guardarOrden_(o);
  return { success: true, total: r.total };
}
// Aplica a la orden que llega del taller la autorización que ya está guardada en el servidor.
function mezclaAuth_(o, prev) {
  o.auth = prev.auth;
  if (prev.etapa === 'autorizado' && ['recepcion', 'taller', 'cotizacion', 'diagnostico'].indexOf(o.etapa) >= 0) o.etapa = 'autorizado';
  o.firmas = o.firmas || {};
  if (prev.firmas && prev.firmas.aut && !(o.firmas.aut && o.firmas.aut.d)) o.firmas.aut = prev.firmas.aut;
  (prev.auth.d || []).forEach(function (d) {
    var l = (o.lineas || [])[d.i];
    if (l && l.desc === d.desc && l.st === 'pend') { l.st = d.st; if (d.mot) l.mot = d.mot; if (d.st === 'rech' && !l.seg) l.seg = d.seg || ''; }
  });
}
