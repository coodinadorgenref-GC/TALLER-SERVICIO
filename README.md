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

## Novedades v19
- **Rechazo de cotización**: al rechazar un concepto se elige el motivo y la fecha de seguimiento y se confirma con *Guardar rechazo*; queda en Seguimientos.
- **Reporte** (solo admin y gerente, junto a Seguimientos): tarifa de mano de obra por hora de cada agencia. En la cotización la mano de obra lleva horas (.5, 1, 1.25…) y el monto se calcula, o se captura el monto y se calculan las horas.
- **Placas** en Datos del vehículo (también en búsqueda e impresión).
- **Foto bayoneta / drenado de aceite**: admite varias fotos.
- Requiere publicar `gas/taller_api.gs` v5 (nueva hoja `CONFIG_TALLER`) para compartir la tarifa entre dispositivos.

## Puesta en marcha
1. Pega `gas/taller_api.gs` en tu proyecto de Apps Script, ejecuta `setup()` y publica como Web App (acceso: Cualquier persona).
2. Pon la URL de la Web App en `js/api.js` (`TALLER_API`) y sube el cambio. Ya no se captura dentro de la app.
