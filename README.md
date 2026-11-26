# TALLER-SERVICIO
PWA responsiva (celular y PC) para órdenes de servicio de taller de motos, inspirada en el flujo de Superservice Triage.
Estática (GitHub Pages) + Google Apps Script (`gas/taller_api.gs`) + Drive para fotos y firmas.

## Acceso
- Se entra con usuario y contraseña de `Usuarios_Autorizados` (mismo login del catálogo y el REPORTEADOR).
- Solo cuentas con ROL admin, vendedor o gerente. Las cuentas `cliente` no entran.
- La agencia sale de la columna AGENCIA de la cuenta; define el logo del encabezado y la agencia de las órdenes.
  Las cuentas TODAS o ZONA … eligen la agencia con el botón junto al engranaje.

## Mapa de procesos
1. **Recepción**: captura de la orden y Carrocería: fotos generales de la moto (frente, trasera, lados; tablero opcional) y daños numerados sobre el dibujo de la moto, cada uno con su foto.
2. **Taller**: la moto entra y se asigna el técnico.
3. **Cotización**: presupuesto de los trabajos y de los adicionales detectados.
4. **Autorizado**: el cliente autoriza o rechaza los conceptos.
5. **Entregado**: trabajos terminados, moto lavada y firma del cliente.

## Novedades v51
- **Garantías (control interno)**: la orden de garantía ya no pide la firma del cliente al salir de Recepción, no lleva aviso legal ni autorización, y los conceptos no tienen estado de autorización ni se cobran (se muestra el costo de refacciones solo como control interno). Para pasar a Cotización y etapas siguientes es obligatorio registrar al menos una refacción.
- **Solo para la agencia**: una garantía no se puede enviar por WhatsApp ni copiar enlace, y el Apps Script (`verOrden`, `fotoCliente`, `autorizarCliente`) rechaza cualquier enlace de cliente de una orden tipo G. Pegar `gas/taller_api.gs` y publicar nueva versión.
- **Configuración › Colaboradores en tabla**: columnas Colaborador, Puesto, Estado y Acciones (Editar / Dar de baja), filtros por puesto y, al final de la tabla, la fila **Dar de alta a un colaborador** con el mismo estilo que Agregar concepto de Cotización. En celular cada fila pasa a tarjeta.

## Novedades v50
- **Folio con prefijo de agencia** en todas las órdenes: `BCN-SP-0001` (agencia-tipo-consecutivo). Cada agencia lleva su propio consecutivo por tipo. Prefijos: BAJAJ CANCUN BCN, BAJAJ TIZIMIN BTZ, BAJAJ VALLADOLID BVA, CARABELA V1 CV1, CAUCEL VENTO CAU, PISTE VENTO PVE, SUZUKI TIZIMIN STZ, SUZUKI VALLADOLID SVA, TICUL VENTO TIC, TIZIMIN VENTO TVE, UMAN VENTO UMA, PISTE MUEBLES PMU (`PREF_AG` en `js/data.js`). Las órdenes anteriores conservan su folio.
- **Técnico principal**: solo administrador, gerente y jefe de taller lo eligen (en cualquier etapa); el resto lo ve sin editar.
- **Jefe de taller**: nuevo puesto en Configuración › Colaboradores; la cuenta cuyo nombre coincide con un jefe de taller de su agencia puede asignar técnico.
- **Configuración › Colaboradores**: botón **Editar** en cada colaborador (cambiar nombre y tipo de cuenta/puesto) y alta renovada.
- **Apps Script v15**: pegar `gas/taller_api.gs` y publicar nueva versión (`siguienteFolio` con prefijo, `editarColaborador`, puesto JEFE DE TALLER).

## Novedades v49
- **Configuración › Garantías sin cortes**: el contenido de Configuración ahora se desplaza completo (una regla de estilo le quitaba el scroll y se cortaban las secciones largas).
- **Pestaña Garantía solo cuando aplica**: si la orden dice ¿Es garantía? **No**, no aparece la pestaña Garantía; con **Sí** (y en toda orden G) sí aparece.
- **Puntos identificados**: nuevas opciones **Número de serie (VIN)** y **Tablero con kilometraje**. No cuentan como daños, se copian al crear la orden de garantía y sirven como foto de ese formato si no se sube otra.
- **Columna Garantía en el Panel** (después de Taller): ahí viven las órdenes de garantía; las órdenes normales no pasan por ella.
- **Técnico en la garantía**: al crearla sin orden original se elige el técnico; si se copia desde una orden de trabajo se respeta el técnico que tenía asignado (si no tenía, se pide).
- **Apps Script**: `gas/taller_api.gs` incluye la columna `garantia` al mover sola la orden a Autorizado cuando el cliente autoriza; pegar y publicar nueva versión.

## Novedades v48
- **Garantía ligada a la orden original**: al crear una garantía (pestaña Garantía, botón del encabezado o tipo **G Garantía** del menú de nueva orden, que ahora pide la orden de origen) se crea una orden con folio **G-xxxx** que copia de la original el Cliente y unidad y la Inspección (checklist, llantas, carrocería, accesorios y fotos ya subidas). La orden de garantía queda con **¿Es garantía? = Sí** (fijo) y la original con **No**; elegir Sí en una orden normal abre la creación de la garantía. La cotización de la garantía empieza vacía.
- **Sonido**: tono de confirmación al mover una orden, botón de bocina en el encabezado que muestra si el sonido está activo o en silencio, y estado visible en Configuración › Notificaciones.
- **Panel**: no se selecciona texto y se desplaza entre etapas con clic sostenido y arrastre (en espacios libres de las columnas y encabezados; las tarjetas siguen arrastrándose para cambiar de etapa).
- **Orden con un solo scroll**: datos de la orden (hasta Técnico principal), pestañas y contenido se desplazan juntos; las pestañas quedan fijas arriba.
- **Seguimientos**: botones sin recortes ni encimados.
- **Panel**: columnas de ancho estándar y barra de desplazamiento lateral visible.
- **Configuración con tamaño estándar**: mismo ancho y alto en todas las secciones (solo se desplaza el contenido). Secciones **General**, **Aspecto**, **Notificaciones** (Avisos con sonido), **Colaboradores** (altas y bajas) y **Panel de control** (cada agencia arma su propio flujo: columnas nuevas con nombre y color editables, entre Citas (siempre la primera) y Entregado (siempre la última); las 6 originales solo se pueden renombrar).
- **Garantía con formato editable por marca**: la pestaña **Garantía** vive dentro de toda orden: lista las garantías ligadas y crea una orden de garantía ligada al folio original. Trae la pestaña **Garantía** con los campos y las fotos de evidencia que pide la marca, indicador de pendientes e impresión del formato. Admin y gerente editan los formatos en **Configuración › Garantías** (formato general + uno propio por marca; campos de texto, fecha o número, fotos obligatorias u opcionales, reordenar y quitar). Los formatos se comparten en todas las agencias (clave `garantia_fmt` en `CONFIG_TALLER`; requiere Apps Script v14).
- **Avisos con sonido** cuando una orden cambia de etapa, en todos los dispositivos con la app abierta (hasta 30 s de retraso; se puede apagar en Configuración).
- **Apps Script v14**: pegar `gas/taller_api.gs` y publicar una nueva versión (claves `etapas_cfg|AGENCIA` en `CONFIG_TALLER`, una por agencia).

## Novedades v44
- **Columna Citas** del Panel: solo lista las citas de hoy (sin botones ni textos de ayuda). Una orden nueva en el día es, por definición, **sin cita**; las citas se programan desde la Agenda.
- **Agenda por técnico**: línea de tiempo con el técnico en la primera columna y la hora de 08:00 am a 07:00 pm en saltos de 15 minutos. Se agenda tocando un horario libre; las citas aparecen como bloques por color (programada, llegó, no llegó) y la línea roja marca la hora actual.
- **Nueva cita**: fecha, hora, tipo de servicio, cliente (propietario), teléfono (WhatsApp), correo, serie / VIN, marca, modelo, año y nota, más técnico y duración (opcionales). Al capturar un VIN ya conocido se completan los datos de la moto y del cliente. Recibir la cita pasa todos esos datos a la orden.
- **Llantas**: lista de medidas comunes para delantera y trasera, y atajos con las medidas ya usadas en esa moto o en ese modelo.
- **Apps Script v13**: pegar `gas/taller_api.gs` y publicar una nueva versión.

## Novedades v43
- **Citas**: viven en la **Agenda** (se programan para hoy o días posteriores, con fecha, hora, bahía, tipo, cliente, WhatsApp, moto y nota). La columna **Citas** del Panel, a la izquierda de Recepción, muestra las de hoy de la agencia; **Recibir** abre la orden en Recepción con los datos ya llenos (orden *con cita*). Un cliente que llega sin cita se atiende con **Nueva orden** (orden *sin cita*). Solo se recibe el día de la cita.
- **Reporte**: nueva tabla **Órdenes con cita y sin cita** (órdenes, % y autorizado) y **Citas del periodo** (programadas, llegaron, no llegaron, canceladas).
- **Lavado**: nueva columna entre Autorizado y Entregado; para entregar la moto debe pasar por Lavado. Se elimina la pestaña **Cierre** (Entrega, Diagnóstico del técnico); **Aviso legal** y **Próximo servicio** quedan debajo de la Cotización y el aviso «unidad lista» aparece al estar en Lavado.
- **Historial**: ahora muestra las visitas de la misma moto (por VIN o placas) con fecha, folio, tipo, km, técnico, trabajos autorizados y total cobrado.
- **Aceite del motor**: la bayoneta / drenado es una fila más de **Motor y combustible** con los mismos colores y fotos (las órdenes anteriores conservan su captura y sus fotos de bayoneta pasan a la fila).
- **Apps Script v12**: pegar `gas/taller_api.gs` y publicar una nueva versión (crea la hoja `CITAS_TALLER`).

## Novedades v42
- **Celular · botón Atrás**: cada capa abierta (orden, ventana, aviso, visor de fotos) es un paso del historial. Atrás cierra la ventana o el visor; desde una orden regresa al Panel sin importar la pestaña.
- **Celular · ventanas**: encabezado fijo con botón **Cerrar** siempre visible (Configuración, Mover a…, etc.), altura ajustada a la pantalla real del teléfono y respeto del borde inferior del iPhone.
- **Pestañas deslizables**: en la orden, deslizar a izquierda o derecha cambia entre Cliente y unidad, Inspección, Llantas, Carrocería, Cotización, Cierre e Historial; en el Panel, entre las etapas. No se activa sobre firma, campos de texto, tablas con desplazamiento horizontal ni a menos de 24 px del borde (gesto de regreso de iOS).

## Novedades v41
- **Mover a…** ahora es una lista desplegable bajo la flecha junto a **Siguiente** (en la orden abierta): muestra las etapas con su color, marca la actual y se cierra al elegir, al tocar fuera o con Esc. Las etapas bloqueadas (por requisitos o por firma del cliente) se ven atenuadas y al elegirlas la app explica por qué.

## Novedades v40
- **Cotización**: los totales vuelven a ser filas de la tabla, alineadas bajo Importe (Identificado, TOTAL A COBRAR, Pendiente por autorizar, Rechazado / diferido). Se quitó el cuadro oscuro junto a Agregar concepto.
- **Orden ya firmada por el cliente**: ya no regresa sola a Autorizado; solo se puede mover hacia atrás a **Taller** (para trabajarla) y al volver a avanzar el cliente puede autorizar de nuevo desde el enlace.
- **Enlace del cliente**: la descripción ya no se encima; la tabla con Aceptar / Rechazar se muestra cuando hay ancho suficiente y en pantallas angostas cada concepto es una fila compacta.

## Novedades v39
- **Autorizado automático**: cuando el cliente autoriza desde el enlace, la orden pasa sola a la columna **Autorizado** (también las órdenes que ya tenían la autorización guardada y seguían en otra columna). Queda registrado en el Historial.
- **Firma del cliente**: en Cotización solo queda el botón **Enviar visto bueno por WhatsApp**; abajo se ve la firma del cliente y la opción **Recabar firma en el taller**.
- **Tabla de cotización rediseñada**: concepto en dos líneas (área y operación), borde de color según el estado, estado y importe alineados, y un bloque **TOTAL A COBRAR** grande con el desglose (identificado, por autorizar, garantía, rechazado / diferido). **Agregar concepto** ahora comparte la cuadrícula de la tabla.
- **Enlace del cliente**: tabla como la referencia (Área, Descripción, Precio, Autorización) con **Aceptar** en verde y **Rechazar** opaco.
- **Apps Script v11**: pegar `gas/taller_api.gs` y publicar una nueva versión.

## Novedades v38
- **Autorización solo desde el enlace del cliente**: el cliente acepta o rechaza cada concepto, firma y guarda; lo aceptado pasa solo a Autorizado (en órdenes de garantía, a Garantía) y lo rechazado a Rechazado / diferido. El asesor también puede cambiar el estado de cada concepto a mano.
- Se quitó **Autorizar todo lo pendiente** y **Firmar en el taller**. En Cotización queda la tarjeta de solo lectura con el estado de la firma y **Copiar enlace**.
- **Enlace del cliente**: nuevo acabado (resumen inicial con pasos, tarjetas planas, resumen en vivo de aceptados / rechazados / por decidir y total a pagar antes de firmar).
- **Apps Script v10**: hay que pegar `gas/taller_api.gs` y publicar una nueva versión para que las garantías queden en Garantía.

## Novedades v37
- **Cotización**: Identificado (subtotal), Autorizado (a cobrar, resaltado como total), Garantía, Pendiente y Rechazado / diferido ahora son el pie de la misma tabla, alineados bajo la columna Importe, en lugar de una barra aparte.
- **Faltan datos del vehículo**: cuando aparece ese aviso, el borde de cada campo que falta (Marca, Modelo, Año, Serie / VIN, Km, Combustible) se marca en rojo y se quita al capturarlo. El aviso de abajo y el botón Siguiente también se actualizan al momento, sin tener que salir del campo.

## Novedades v36
- **Serie / VIN**: círculo verde con paloma junto al rótulo cuando ya se capturaron los 17 caracteres. Al dar clic o entrar al campo, o al presionar Enter, se vuelven a traer todos los datos de la serie (año, marca, modelo) y de la base de motos (cliente, teléfono, dirección, fecha de compra...).
- Se quitó la tarjeta **Hoja multipuntos** de Inspección (contador de revisados, botón Todo OK y leyenda de colores); los puntos de revisión siguen igual.

## Novedades v35
- **Botón Siguiente arriba a la izquierda** del encabezado de la orden (junto al folio y la etapa), con una flecha que abre *Mover a…* para elegir cualquier etapa. Si falta algo para avanzar el botón se ve deshabilitado y el aviso sigue en la parte inferior. En la última etapa se conserva *Clonar por garantía* abajo y *Mover a…* a la derecha.
- **Fecha de compra** se llena sola con la fecha de venta de la base de motos al completar el Serie / VIN (o al elegir una moto del cliente); si la capturas a mano no se vuelve a pisar. También está en Datos del vehículo en celular.
- **Dirección** se completa desde la base de motos junto con cliente y teléfono (solo si está vacía) y aparece en el aviso *se completó*.
- **Motor** se quitó de la orden: ya no se pide para avanzar de etapa y en la orden impresa se reemplazó por la fecha de compra.

## Novedades v34
- **Modelo por serie (VIN)**: además del año y la marca, al completar los 17 caracteres se sugiere el **modelo**. El VIN no trae el modelo escrito: se toma de la base de motos (`MOTOS_TALLER`), buscando las motos con el mismo prefijo de 8 caracteres (fábrica + descriptor). Si un modelo domina (85 % o más) se llena solo cuando el campo está vacío; si hay varios, el aviso del VIN muestra botones para elegir. Si la moto ya está en la base, manda su modelo. Lo capturado a mano nunca se pisa.
- **Requiere actualizar `gas/taller_api.gs` a v9** (nueva acción `modeloVin`): pégalo en Apps Script y publica una nueva versión de la implementación. Sin eso la app sigue funcionando y avisa una vez que falta actualizar el script.
- **Kilometraje con comas** cada 3 cifras mientras se escribe (1,500 · 112,569), también en *Próximo servicio*, en la orden impresa, en el enlace del cliente y en el WhatsApp de seguimiento.
- **Técnico principal**: una vez asignado, el nombre se conserva al cambiar de etapa y también se muestra en Recepción (antes decía "Sin asignar" al regresar la orden a Recepción).

## Novedades v29
- **Correo electrónico** del cliente en la orden; se guarda en la base de motos y se completa solo la próxima vez (el reporte de ventas no trae correo: se va juntando con las visitas).
- **Quién trae la moto**: nombre opcional cuando no es el propietario. Es dato de cada visita (sale en la orden impresa), no se guarda en la base.
- El campo del cliente se rotula "Cliente (propietario)". `base_motos.csv` puede traer una columna `email` opcional.

## Novedades v28
- **Base de motos** (hoja `MOTOS_TALLER` en la API del taller, `gas/taller_api.gs` v7): una fila por VIN con cliente, teléfono, dirección, marca, modelo con cilindraje, año, placas, fecha de venta, factura, sucursal y origen (VENTA / TALLER / VENTA+TALLER). Kilometraje y combustible no se guardan: se capturan en cada visita.
- Al completar el **VIN** se llenan solos los datos vacíos de la orden; al escribir el **teléfono** (10 dígitos) se ofrecen las motos de ese cliente. Lo ya capturado nunca se pisa.
- Cada orden guardada registra su moto en la base: así entra un cliente al que el grupo no le vendió.
- Importador en Configuración (solo administrador): acepta el reporte de ventas GCVEN02 en CSV o `base_motos.csv`; se queda con la venta vigente más reciente por VIN y no pisa lo capturado en visitas.
- La marca de la base manda sobre la de la tabla del VIN; si el VIN completo da una marca inequívoca, corrige la marca capturada. Aviso del VIN en una línea con botones pequeños.

### Puesta en marcha de la base de motos
1. En Apps Script pega `gas/taller_api.gs` (v7), escribe una clave secreta en `TALLER_CLAVE` (la base se niega sin clave porque trae datos personales), ejecuta `setup()` y publica una nueva versión de la implementación.
2. En la app: toca Sincronizar (ícono de la barra superior); cuando pida la clave del taller, escribe la misma y Guardar.
3. Configuración → Importar base de motos (CSV): sube `base_motos.csv` (historial) y después cada mes el GCVEN02 en CSV.
4. No subas `base_motos.csv` ni el reporte a este repositorio: contienen datos personales de clientes.

## Novedades v26
- Tabla de marcas del Serie / VIN rehecha con el reporte de ventas 2023-2026 (~10,300 motos): **98 % se llena sola y correcta**, 2 % pide elegir y 0.06 % se equivoca.
- Corrección: `3EF…` y varias series `LFF…` son **Carabela** (no Vento); Vento es `3MU…`. Nuevas marcas: Carabela, Veloci, Islo, Motomel, Kurazai, Atul, Benelli, Hercules.
- La marca ahora también se llena sola en órdenes que ya tenían el VIN capturado (antes solo al teclear la serie).
- Fábricas que arman la misma moto para varias marcas (`3EE`, `LFF`, `LHJ`, `LNG`, `LC6`): la app muestra botones con las marcas posibles para elegir.

## Novedades v25
- **Marca / fabricante obligatoria** para pasar de Recepción (en órdenes anteriores se rellena sola si la serie la permite).
- Series `3MU…` reconocidas como Vento; Suzuki `MB8…`, `LC6PCJ…`, `LC6PCH…`; Haojue `LC6PCKGM…`.
- Series `LC6PCKAW…` y `LC6JCK4P…` (Haojue Suzuki) se venden como Suzuki y como Haojue: la app pide elegir la marca con un botón.
- Si la marca capturada no coincide con la de la serie, se avisa y se ofrece usar la de la serie.

## Novedades v24
- Datos del vehículo: nuevo campo **Marca / fabricante** que se llena solo con el Serie / VIN (Bajaj MD2, Vento 3EF/LFF, Haojue LC6PCK, Suzuki LC6PCJ/MB8/JS1/RFD/MLC, Hercules H93, Honda, Yamaha). Se puede corregir a mano y sugiere las marcas conocidas.
- Series de e-bike (BIC-… bicicleta, TRI-… triciclo) se reconocen como marca *E-Bike*; no traen año.
- La marca se copia a las órdenes de garantía, seguimiento y cita, y sale en la orden impresa junto al modelo.

## Novedades v23
- Unidad: *Accesorios y documentos* ahora viven dentro de *Datos del asesor de servicio* (recepción de la unidad).
- Serie / VIN: con los 17 caracteres se detecta el año de la moto (posición 10 del VIN) y se llena solo; si el año capturado no coincide se avisa y se ofrece usar el de la serie. También se muestra el fabricante cuando se reconoce (Bajaj, Suzuki, Honda, Yamaha). (El modelo se sugiere desde v34 con la base de motos; ver Novedades v34.)

## Novedades v22
- Daños y detalles: *Recepción* es un tipo más en la lista de cada punto de la moto; al elegirlo el detalle dice "Fotos de ingreso" y se toman o eligen varias fotos. Para salir de Recepción se pide al menos una foto de ingreso.
- No se avanza de Recepción sin los datos del vehículo (modelo, año, serie/VIN, motor, kilometraje y combustible; las placas son opcionales).
- *Pasar a cotización* no duplica un hallazgo ya enviado.
- Cierre: se quitó *Quien recibe la unidad*.

## Novedades v21
- Unidad: *Datos del asesor de servicio* (el asesor de servicio es quien crea la orden; también se captura el asesor de refacciones) y *Asignación en taller* (solo técnico, sin bahía).
- Las fotos generales de la moto ahora se toman en Carrocería › Daños y detalles › **Recepción**.
- Cierre: ya no se recaban las firmas de Refaccionaria, Mecánico, Cliente y V.o.B.o.; para entregar solo se pide la moto lavada.

## Novedades v20
- Cotización: agregar SKU, mano de obra y conceptos manuales dentro de la tabla (al pie); la mano de obra se captura solo en pesos; se quitó "Hallazgo adicional con foto" (los hallazgos viven en Inspección). Las horas se calculan en Reporte con la tarifa por hora.

## Novedades v19
- **Rechazo de cotización**: al rechazar un concepto se elige el motivo y la fecha de seguimiento y se confirma con *Guardar rechazo*; queda en Seguimientos.
- **Reporte** (solo admin y gerente, junto a Seguimientos): tarifa de mano de obra por hora de cada agencia. En la cotización la mano de obra lleva horas (.5, 1, 1.25…) y el monto se calcula, o se captura el monto y se calculan las horas.
- **Placas** en Datos del vehículo (también en búsqueda e impresión).
- **Foto bayoneta / drenado de aceite**: admite varias fotos.
- Requiere publicar `gas/taller_api.gs` v5 (nueva hoja `CONFIG_TALLER`) para compartir la tarifa entre dispositivos.

## Puesta en marcha
1. Pega `gas/taller_api.gs` en tu proyecto de Apps Script, ejecuta `setup()` y publica como Web App (acceso: Cualquier persona).
2. Pon la URL de la Web App en `js/api.js` (`TALLER_API`) y sube el cambio. Ya no se captura dentro de la app.

## Visto bueno para el cliente (enlace con firma)
"Enviar visto bueno por WhatsApp" sube la orden y manda un enlace personal (`cliente.html?o=FOLIO&k=TOKEN`). El cliente ve fotos de ingreso, carrocería, inspección y cotización, acepta o rechaza cada concepto y firma. El logo sale de la agencia de la orden. La autorización vuelve al taller con la sincronización y aparece en la tarjeta de la orden.
Acciones públicas del Apps Script (protegidas con el token de la orden): `verOrden`, `autorizarCliente`, `fotoCliente` (gas v6).
