# Correos Mensuales · Solicitud Nº Preventivos

`correos-preventivos.html` es la réplica en un único archivo (HTML + CSS + JS, sin
dependencias externas) del libro `Solicitud_Preventivos__Correos_Mensuales_2026.xlsm`.
Se abre haciendo doble clic; no necesita servidor ni conexión.

## Equivalencia con las macros del libro

| Botón del Excel | Macro VBA | En la aplicación |
|---|---|---|
| E-mail sobre el logo MAVENTS | `CorreoMAVENTS` | Botón **Preparar correo** de la tarjeta MAVENTS |
| E-mail sobre el logo Albali | `CorreoSALAVE` | Botón **Preparar correo** de la tarjeta SALAVE |
| E-mail sobre el logo Telice | `CorreoTELICE` | Botón **Preparar correo** de la tarjeta TELICE |
| E-mail sobre UTE MTO. CHATO | `CorreoCHATO` | Botón **Preparar correo** de la tarjeta CHATO |
| INFORMAR A SOAV | `CorreoSOAV` | **Preparar correo a SOAV**, con el mes anterior calculado automáticamente |
| 📂 (hipervínculo de la celda P25) | — | Enlace 📂 a la carpeta de ADIF |
| — | `AbrirWebsEnNuevasVentanas` | **Abrir carpetas SharePoint (INECO + ADIF)** |

Las celdas B4 y C4 (mes y año) son el selector de mes y el campo de año de la barra superior.

## Salida del correo

La macro hacía `MailItem.Display` para abrir el borrador en Outlook. Desde el navegador
no se puede automatizar Outlook, así que cada correo se descarga como **.eml**: se abre
en Outlook como borrador sin enviar (cabecera `X-Unsent: 1`), listo para revisar y
mandar. ### Tipografía

Todo el correo va en Calibri 11. La fuente se repite en cada `<td>` y `<th>`: Outlook
usa el motor de Word, que **no hereda** la fuente desde `<table>`, así que la tabla del
correo original salía con la tipografía por defecto. El aviso a SOAV usaba además
`<font size='11pt'>`, que no es un tamaño válido y Outlook ignoraba; ahora lleva estilos
en línea.

### La firma

El `.eml` sale **sin firma**: la pone Outlook al abrir el borrador, con la que tenga
configurada para mensajes nuevos. Todo el cuerpo va dentro de una única celda de tabla
para que no pueda insertarse nada entre el saludo y la tabla de preventivos.

### Destinatarios

**Modificar Para** y **Modificar CC** abren la lista de destinatarios de ese correo,
una dirección por línea. El cambio se guarda en el navegador y sustituye a la lista
del libro; *Recuperar los del libro* deshace la modificación.

Cada contrato lleva el color de su logotipo en el libro: azul marino en MAVENTS
(#184878), coral de Albali en SALAVE (#E4786C) y oliva de Telice en TELICE (#484824).
CHATO no tiene logotipo en el libro, así que usa el azul corporativo (#002060).

## Datos

Las cuatro hojas de contrato están replicadas con sus filas *Programadas*, *Realizadas*
y *% grado de cumplimiento*. Los valores se guardan en el navegador (localStorage).

Dos cálculos que en el libro eran valores fijos ya desfasados se recalculan aquí:
*Objetivo anual* (suma de los doce meses) y *Consecución acumulada* (de enero al mes
seleccionado). En TELICE el orden es PLO, RACA, RACO; la macro
original intercambiaba las etiquetas de las dos últimas filas.
