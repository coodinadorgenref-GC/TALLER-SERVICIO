const ETAPAS=[['recepcion','Recepción','#475569','Motos de nuevo ingreso'],['taller','Taller','#B45309','Técnico asignado'],['cotizacion','Cotización','#1E40AF','Presupuesto y adicionales'],['autorizado','Autorizado','#0F766E','Cliente autoriza o rechaza'],['entregado','Entregado','#15803D','Lavada y entregada']];
const ETMIG={diagnostico:'taller',reparacion:'autorizado'};   // nombres de etapa anteriores
// Fotos generales de la moto al recibirla: [clave, nombre, obligatoria]
const FOTOS_GRAL=[['g_tablero','Tablero / km',0],['g_izq','Lado izquierdo',1],['g_trasera','Trasera',1],['g_der','Lado derecho',1],['g_frente','Frente',1]];
// Agencias (cuenta → columna AGENCIA de Usuarios_Autorizados) y su logo
const AGENCIAS_TALLER=['BAJAJ CANCUN','BAJAJ TIZIMIN','BAJAJ VALLADOLID','CARABELA V1','CAUCEL VENTO','PISTE VENTO','SUZUKI TIZIMIN','SUZUKI VALLADOLID','TICUL VENTO','TIZIMIN VENTO','UMAN VENTO','PISTE MUEBLES'];
const ZONA_AG={'UMAN VENTO':'MERIDA','CAUCEL VENTO':'MERIDA','TICUL VENTO':'MERIDA'};   // las demás son de VALLADOLID
const LEG=['Valladolid','Tizimín','Kantunilkin'];   // sucursales de la versión anterior
const LOGO_BASE='https://coodinadorgenref-gc.github.io/CATALOGO-DE-INVENTARIO/logo-';
const multi=a=>a==='TODAS'||/^ZONA /.test(a||'');
const permitidas=a=>a==='TODAS'?AGENCIAS_TALLER:/^ZONA /.test(a)?AGENCIAS_TALLER.filter(x=>(ZONA_AG[x]||'VALLADOLID')===a.slice(5)):[a];
const logoDe=a=>{a=String(a||'').toUpperCase();return a.includes('PISTE MUEBLES')||a.includes('BAJAJ')?'bajaj':a.includes('SUZUKI')?'suzuki':a.includes('VENTO')?'vento':'carabela'};
const TIPOS={SC:'Servicio cupón',SP:'Servicio preventivo',SB:'Servicio básico',SM:'Servicio mayor',SR:'Servicio de reparación',G:'Garantía',SD:'Servicio de diagnóstico'};
// Formato impreso: inventario de 32 puntos con cantidad
const INV32=['Amortiguador trasero','Batería','Contrapeso de manubrio / puños','Juego de espejo','Juego de herramientas','Llave original','Manual de usuario','Escape / mofle','Tanque de combustible','Neumáticos, rines, disco y frenos','Parrilla trasera','Reflejantes','Salpicadera delantera','Direccionales delanteros','Direccionales traseros','Motor completo','Tablero / velocímetro','Faro delantero','Asiento','Posapiés delanteros','Posapiés traseros','Palanca de velocidades','Palanca de freno','Claxon','Póliza de garantía','Luz trasera (freno)','Micas','Cubiertas','Molduras','Tapón de gasolina','Tapón de aceite','Pedal de arranque'];
const CATS=[['Motor y transmisión','Estado general y encendido'],['Sistema eléctrico y luces','Faro, direccionales, tablero, claxon'],['Frenos y suspensión','Manetas, amortiguadores, líquido'],['Neumáticos y rodamiento','Presión, desgaste, rines'],['Carrocería y estructura','Espejos, asiento, plásticos, escape'],['Niveles y seguridad','Combustible y niveles']];
const COND=[['nr','N/R','No revisado'],['ok','OK','Sin trabajo'],['px','Próximo','Trabajo próximo'],['ur','Urgente','Trabajo urgente']];
const AUT=[['pend','Pendiente'],['aut','Autorizado'],['gar','Garantía'],['rech','Rechazado']];
const MOTIVOS=['Precio alto','Lo verá después','Lo compró en otro lado','Sin presupuesto','Otro'];
const FIRMAS=[['ref','Refaccionaria'],['mec','Mecánico'],['cli','Cliente'],['vobo','V.o.B.o.']];
const BAHIAS=[1,2,3],HORAS=[8,9,10,11,12,13,14,15,16,17];
const BASE=[['16510-39J00-000','Filtro de aceite',66],['99CMX-21050-P95','Aceite 20W50 0.946 L',126],['INSUMO BASICO','Insumo básico',50]];
const datosAg=a=>/CARABELA/i.test(a||'')?{n:'CARABELA VALLADOLID',d:'C. 41 EXT. 182C X 32 Y 34 C.P. 97780 VALLADOLID, YUCATÁN',t:'985 856 1976'}:{n:a||'',d:'',t:''};
const LEYENDA='En caso de que el presupuesto no sea aceptado, el consumidor deberá pagar exclusivamente el costo por la revisión y diagnóstico, y el prestador del servicio entregará la unidad en las condiciones en que fue entregada, exceptuando las consecuencias inevitables del diagnóstico.';
const CERT='Certifico y acepto que revisé las condiciones de la unidad y me explicaron el trabajo realizado a la unidad.';
