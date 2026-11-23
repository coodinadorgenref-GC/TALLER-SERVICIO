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
