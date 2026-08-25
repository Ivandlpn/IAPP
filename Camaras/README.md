# Listados de cámaras por ámbito

Tres listados generados con el mismo formato que `Cámaras_unificado_v2_SOAV.xlsx`
(hoja `Listado cámaras LAV`, 31 columnas, misma cabecera, anchos, estilo,
autofiltro `A1:AD…` y panel inmovilizado en `A2`).

**La columna AD identifica el ámbito**: `ALBALI`, `CHATO` o `TOVAL`.
Se mantiene sin título, igual que en el fichero original, donde esa columna
contiene `LAV Noreste`.

| Fichero | Cámaras | Origen |
|---|---|---|
| `Camaras_unificado_v2_ALBALI.xlsx` | 512 | `Listado Cámaras ALBALI.xlsx` (export SystemReport) |
| `Camaras_unificado_v2_CHATO.xlsx` | 158 | `Listado Cámaras CHATO.xlsx` |
| `Camaras_unificado_v2_TOVAL.xlsx` | 1.967 | `Listado Cámaras TOVAL.xlsx` |

Total: **2.637 cámaras**.

## Correspondencia de columnas

### CHATO y TOVAL
Ambos ficheros ya venían con la cabecera del formato destino, así que el
volcado es 1:1 emparejando por nombre de columna. Verificado celda a celda:
4.424 y 55.076 celdas comparadas respectivamente, **0 diferencias**.

Dos detalles del origen:
- La columna `LAV` del origen (`CHATO` / `lav-6`) es constante en todo el
  fichero y queda recogida en la columna AD, por lo que no se duplica en la
  columna A.
- En CHATO, `PUERTA DE ENLACE (GATEWAY)` se mapea a `PUERTA DE ENLACE (GATEWEY)`,
  que es como está escrito en el fichero original.

### ALBALI
El origen es un export `SystemReport` con una sección por modelo y columnas
propias. Correspondencia aplicada:

| Origen | Destino |
|---|---|
| `Friendly Name` | `REFERENCIA` y `NOMBRE DISPOSITIVO` |
| `IP Address` | `DIRECCIÓN IP` |
| `MAC Address` | `DIRECCIÓN MAC` (normalizada a mayúsculas) |
| `Version` | `FIRMWARE` |
| `Serial #` | `NÚMERO DE SERIE` (forzado a texto) |
| `UDN` | `COD / HARDWARE` |
| Cabecera de sección, p.ej. `IXE10DN CÁMARA FIJA IP` | `MODELO` = `IXE10DN`, `TIPO CAMARA` = `CÁMARA FIJA IP` |
| — | `TECNOLOGÍA` = `Digital` (todas las secciones son cámaras IP) |

La última columna del export (constante `False` en las 512 filas) se descarta.

## Avisos sobre los datos de origen

- **ALBALI sin ubicación.** El export no trae ubicación ni PK, así que las
  columnas `UBICACIÓN`, `SWITCH`, `BOCA`, `ANILLO` y `MÁSCARA DE RED` quedan
  vacías. El nombre del dispositivo (`6AA_P_3427_CF01`) parece codificarla,
  pero no se ha derivado nada por no inventar dato.
- **ALBALI declara más equipos de los que lista.** Las cabeceras de sección
  suman 563 dispositivos y solo hay 512 filas (faltan 36 en `IXE10DN`, 5 en
  `TXB-N`, 3 en `IBP131-1ER`, 6 en `IEE10DN`, 1 en `IBP231-1ER`). Conviene
  pedir el export completo.
- **Dos huecos en ALBALI**, ya presentes en el origen: `6AA_L_LCH_CF01` sin
  número de serie y `6AA_D_483A_DM12` sin firmware.
- **El número de serie se guarda como texto** para evitar el problema del
  fichero original, donde Excel convirtió las series a número y truncó a 15
  dígitos (639 series quedaron reducidas a 79 valores distintos).
- **Máscaras sin puntos** (`255255255192`) en CHATO y TOVAL: se respeta el
  formato del origen, que es también el mayoritario en el fichero original.

## Regenerar

```
python3 scripts/generar_listados.py <dir_con_los_xlsx_origen> <dir_salida>
```
