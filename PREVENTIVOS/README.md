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

### Tipografía

Todo el correo va en Calibri 11. La fuente se repite en cada `<td>` y `<th>`: Outlook
usa el motor de Word, que **no hereda** la fuente desde `<table>`, así que la tabla del
correo original salía con la tipografía por defecto. El aviso a SOAV usaba además
`<font size='11pt'>`, que no es un tamaño válido y Outlook ignoraba; ahora lleva estilos
en línea.

### La firma

Outlook inserta su firma automática detrás del primer bloque que encuentra, y con
párrafos sueltos la colaba entre el saludo y la tabla. Dos medidas: el cuerpo del
`.eml` va dentro de una única celda de tabla —al haber un solo bloque, nada puede
colarse en medio— y **la firma la pone la propia aplicación**, siempre al final.

La firma de serie reproduce la corporativa del remitente con el logotipo oficial de
Ineco, que ya venía dentro del libro. Se cambia en **Datos → Mi firma**: basta copiarla
desde un mensaje de Outlook (Ctrl+C) y pegarla ahí (Ctrl+V). Con *Vaciar* se envía sin
firma y la pone Outlook.

Las imágenes de la firma no viajan como `data:` —Outlook no las pinta— sino como
partes MIME propias: el `.eml` es un `multipart/related` y cada imagen lleva su
`Content-ID`, referenciada desde el HTML con `cid:`.

Conviene desactivar la firma automática de Outlook para mensajes nuevos
(*Archivo → Opciones → Correo → Firmas*) para que no salga duplicada.

### Destinatarios

**Modificar Para** y **Modificar CC** abren la lista de destinatarios de ese correo,
una dirección por línea. El cambio se guarda en el navegador y sustituye a la lista
del libro; *Recuperar los del libro* deshace la modificación.

Cada contrato lleva el color de su logotipo en el libro: azul marino en MAVENTS
(#184878), coral de Albali en SALAVE (#E4786C) y oliva de Telice en TELICE (#484824).
CHATO no tiene logotipo en el libro, así que usa el azul corporativo (#002060).

## Exportar a Excel

El botón **⤓ Excel** de la barra superior (también en cada hoja y en el menú Datos)
descarga un `.xlsx` con las cinco hojas: un resumen en CORREOS y las cuatro hojas de
contrato, con las filas y columnas en la misma posición que en el libro original
(C7 y meses en G:R para MAVENTS, SALAVE y TELICE; A7 y meses en E:P para CHATO).
El libro se genera dentro del navegador, sin librerías externas ni conexión.

## Datos

Las cuatro hojas de contrato están replicadas con sus filas *Programadas*, *Realizadas*
y *% grado de cumplimiento*. Los valores se guardan en el navegador (localStorage) y
pueden exportarse e importarse en JSON desde el menú **Datos**.

Dos cálculos que en el libro eran valores fijos ya desfasados se recalculan aquí:
*Objetivo anual* (suma de los doce meses) y *Consecución acumulada* (de enero al mes
seleccionado). En TELICE el orden es PLO, RACA, RACO; la macro
original intercambiaba las etiquetas de las dos últimas filas.
