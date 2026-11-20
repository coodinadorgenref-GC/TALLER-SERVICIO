const ETAPAS=[['recepcion','Recepción','#475569'],['diagnostico','Diagnóstico','#B45309'],['cotizacion','Cotización','#1E40AF'],['reparacion','Reparación','#0F766E'],['entregado','Entregado','#15803D']];
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
const SUC={'Valladolid':{n:'CARABELA VALLADOLID',d:'C. 41 EXT. 182C X 32 Y 34 C.P. 97780 VALLADOLID, YUCATÁN',t:'985 856 1976'},'Tizimín':{n:'CARABELA TIZIMÍN',d:'',t:''},'Kantunilkin':{n:'CARABELA KANTUNILKIN',d:'',t:''}};
const LEYENDA='En caso de que el presupuesto no sea aceptado, el consumidor deberá pagar exclusivamente el costo por la revisión y diagnóstico, y el prestador del servicio entregará la unidad en las condiciones en que fue entregada, exceptuando las consecuencias inevitables del diagnóstico.';
const CERT='Certifico y acepto que revisé las condiciones de la unidad y me explicaron el trabajo realizado a la unidad.';
