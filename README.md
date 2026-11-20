# TALLER-SERVICIO
PWA responsiva (celular y PC) para órdenes de servicio de taller de motos, inspirada en el flujo de Superservice Triage.
Estática (GitHub Pages) + Google Apps Script (`gas/taller_api.gs`) + Drive para fotos y firmas.

## Acceso
- Se entra con usuario y contraseña de `Usuarios_Autorizados` (mismo login del catálogo y el REPORTEADOR).
- Solo cuentas con ROL admin, vendedor o gerente. Las cuentas `cliente` no entran.
- La agencia sale de la columna AGENCIA de la cuenta; define el logo del encabezado y la agencia de las órdenes.
  Las cuentas TODAS o ZONA … eligen la agencia con el botón junto al engranaje.

## Mapa de procesos
1. **Recepción**: captura de la orden y fotos generales de la moto (frente, trasera, lados; tablero opcional).
2. **Taller**: la moto entra y se asigna el técnico.
3. **Cotización**: presupuesto de los trabajos y de los adicionales detectados.
4. **Autorizado**: el cliente autoriza o rechaza los conceptos.
5. **Entregado**: trabajos terminados, moto lavada y firma del cliente.

## Puesta en marcha
1. Pega `gas/taller_api.gs` en tu proyecto de Apps Script, ejecuta `setup()` y publica como Web App (acceso: Cualquier persona).
2. En la app: Configuración → Conexión (avanzado) → URL de la Web App (ya viene precargada).
