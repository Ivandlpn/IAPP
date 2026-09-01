# Correos Mensuales · Solicitud Nº Preventivos

`correos-preventivos.html` es la réplica en un único archivo (HTML + CSS + JS, sin
dependencias externas) del libro `Solicitud_Preventivos__Correos_Mensuales_2026.xlsm`.
Se abre haciendo doble clic; no necesita servidor ni conexión.

## Equivalencia con las macros del libro

| Botón del Excel | Macro VBA | En la aplicación |
|---|---|---|
| E-mail sobre el logo MAVENTS | `CorreoMAVENTS` | Botón **E-mail** de la tarjeta MAVENTS |
| E-mail sobre el logo Albali | `CorreoSALAVE` | Botón **E-mail** de la tarjeta SALAVE |
| E-mail sobre el logo Telice | `CorreoTELICE` | Botón **E-mail** de la tarjeta TELICE |
| E-mail sobre UTE MTO. CHATO | `CorreoCHATO` | Botón **E-mail** de la tarjeta CHATO |
| TODOS LOS CONTRATOS EJE ESTE | `CorreoLAVESTE` | **E-mail · los 4 contratos** (cola CHATO → SALAVE → TELICE → MAVENTS) |
| INFORMAR A SOAV | `CorreoSOAV` | **E-mail · SOAV**, con el mes anterior calculado automáticamente |
| 📂 (hipervínculo de la celda P25) | — | Enlace 📂 a la carpeta de ADIF |
| — | `AbrirWebsEnNuevasVentanas` | **Abrir carpetas SharePoint (INECO + ADIF)** |

Las celdas B4 y C4 (mes y año) son el selector de mes y el campo de año de la barra superior.

## Salida del correo

La macro hacía `MailItem.Display` para que Outlook abriera el borrador con la firma.
Desde el navegador no se puede automatizar Outlook, así que cada correo ofrece:

- **Descargar .eml** — se abre en Outlook como borrador sin enviar (cabecera `X-Unsent: 1`);
  Outlook añade la firma. Es la vía más parecida a la macro.
- **Copiar cuerpo** — copia la tabla con formato para pegarla en un mensaje nuevo.
- **Copiar Para / Copiar CC** — destinatarios al portapapeles.
- **Abrir en cliente** — enlace `mailto:` (el cuerpo va en texto plano, es una limitación del protocolo).

El HTML del cuerpo es idéntico carácter a carácter al que generaban las macros.

## Datos

Las cuatro hojas de contrato están replicadas con sus filas *Programadas*, *Realizadas*
y *% grado de cumplimiento*. Los valores se guardan en el navegador (localStorage) y
pueden exportarse e importarse en JSON desde el menú **Datos**.

Dos cálculos que en el libro eran valores fijos ya desfasados se recalculan aquí:
*Objetivo anual* (suma de los doce meses) y *Consecución acumulada* (de enero al mes
seleccionado). En TELICE se respeta el orden de la hoja — PLO, RACA, RACO —; la macro
original intercambiaba las etiquetas de las dos últimas filas.
