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

## Novedades v23
- Unidad: *Accesorios y documentos* ahora viven dentro de *Datos del asesor de servicio* (recepción de la unidad).
- Serie / VIN: con los 17 caracteres se detecta el año de la moto (posición 10 del VIN) y se llena solo; si el año capturado no coincide se avisa y se ofrece usar el de la serie. También se muestra el fabricante cuando se reconoce (Bajaj, Suzuki, Honda, Yamaha). El modelo no se puede obtener del VIN.

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
