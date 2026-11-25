# Muro de gratitud · AcademiaQA

**Muro:** https://simonethg.github.io/testimonios-academiaqa/ · **Guía para dejar tu mensaje:** [CONTRIBUTING.md](CONTRIBUTING.md)

Los mensajes de las personas que hicieron los cursos de AcademiaQA y de Simoneth Gomez (@SimonethG · @academia_qa). Por ahora tiene dos cursos, TestingAI (en vivo) y la Carrera QA con IA (asincrónica), y se van sumando los cursos que incluyan el muro al final.

- **Muro:** una sola pantalla, sin scroll y con pocos elementos: el título, una línea que explica qué es, el selector de curso, un botón «Dejar mi mensaje» y los mensajes, que se pasan de página con flechas si no entran.
- **Widget:** `embed.html?curso=...`, para que la página de cada curso en www.simonethg.com y academiaqa.com muestre sus propios mensajes.
- **Datos abiertos:** `data/testimonios.json`, un JSON público que cualquier sitio puede leer.

Inspirado en la idea de [Proof of Gratitude](https://github.com/mariaelisaaraya/Proof-of-Gratitude), de María Elisa Araya. El código de este repo es propio: no se copió código de ese proyecto.

## ¿Cómo se suma un mensaje?

Solo por **Pull Request**, con **un archivo por persona** para que no haya choques. La guía para alumnos está en [CONTRIBUTING.md](CONTRIBUTING.md).

1. La persona toca «Dejar mi mensaje», elige su curso y el formulario le arma el archivo `data/testimonios/<curso>/<AAAA-MM-DD>-<nombre>.json`. El botón «Crear mi archivo en GitHub» abre el editor de GitHub con el archivo ya completado.
2. Abre el Pull Request con la plantilla, que incluye la casilla de consentimiento.
3. La acción **Validar testimonios** (`.github/workflows/validar-testimonios.yml`) revisa cada archivo: campos, largos, que el curso esté en `data/cursos.json`, que la carpeta, la fecha y el id coincidan con el nombre, y que no haya email, teléfono, links ni HTML. Si el PR viene de un fork, solo puede **agregar** archivos dentro de `data/testimonios/<curso>/`.
4. Simoneth revisa el texto y lo une. **Unido = aprobado.**
5. La acción **Publicar en GitHub Pages** (`.github/workflows/publicar-pages.yml`) junta todos los archivos en `data/testimonios.json` y publica el sitio. No hace falta servidor.

La página y el widget, además, vuelven a validar cada entrada en el navegador y no muestran las que no cumplan las reglas o no tengan `consentimiento_publicar: true`.

## Sumar un curso nuevo

1. Agregá el curso a `data/cursos.json`:
   ```json
   {
     "id": "nombre-del-curso",
     "nombre": { "es": "Nombre del curso (modalidad)", "en": "Course name (format)" },
     "nombre_corto": { "es": "Nombre corto", "en": "Short name" },
     "cohorte_actual": "asincronica",
     "clases": null,
     "url": "https://academiaqa.com/courses/..."
   }
   ```
2. Creá la carpeta `data/testimonios/nombre-del-curso/` con un archivo vacío `.gitkeep`.
3. Si el curso tiene clases en vivo, creá un archivo como `data/clases-testingai.json` y poné su ruta en `clases`: el formulario va a ofrecer elegir la clase relacionada y la tarjeta la muestra. Si es asincrónico, dejá `"clases": null`.
4. Corré `npm test` y `npm run validar`. El curso aparece solo en el selector del muro y del formulario, y en el widget con `?curso=nombre-del-curso`.

## Estructura

```
index.html                     Muro (una pantalla) con las ventanas «Dejar mi mensaje» y «Privacidad»
embed.html                     Widget para insertar en otros sitios
data/cursos.json               Cursos habilitados
data/clases-testingai.json     Clases de la cohorte TestingAI 2026-10
data/testimonios/<curso>/      Un archivo por mensaje (lo que suman los alumnos)
data/testimonios.json          Índice público generado con npm run generar (no se edita a mano)
assets/js/validar.js           Reglas compartidas por el muro, el widget y las acciones de GitHub
assets/js/                     Resto del código (sin dependencias ni librerías externas)
assets/css/estilos.css         Estilos (modo claro y oscuro)
assets/fonts/                  Kanit autoalojada (SIL Open Font License 1.1)
i18n/es.json, i18n/en.json     Textos en español e inglés
scripts/                       Validador, generador del índice y tests (Node 22, sin dependencias)
```

## Formato de cada mensaje

```json
{
  "id": "2026-12-02-ana",
  "curso": "testingai-vivo",
  "cohorte": "2026-10",
  "fecha": "2026-12-02",
  "clase_relacionada": "clase-08",
  "nombre_visible": "Ana",
  "rol_o_pais": "QA · Argentina",
  "mensaje": "Hasta 280 caracteres.",
  "consentimiento_publicar": true
}
```

`clase_relacionada` (solo para cursos con clases) y `rol_o_pais` son opcionales. No hay campos de email ni de teléfono, y la validación rechaza cualquier campo que no esté en esta lista.

## Correrlo en tu computadora

```bash
npm run generar                  # arma data/testimonios.json desde data/testimonios/
python3 -m http.server 8080      # o cualquier servidor estático
# http://localhost:8080/                              muro real
# http://localhost:8080/?curso=testingai-vivo         muro de un curso
# http://localhost:8080/embed.html?curso=carrera-qa-ia
npm test                         # tests de las reglas
npm run validar                  # valida cada archivo
```

## Publicarlo en GitHub Pages

El muro está publicado en **https://simonethg.github.io/testimonios-academiaqa/** desde el repo público [`Simonethg/testimonios-academiaqa`](https://github.com/Simonethg/testimonios-academiaqa), con **Settings → Pages → Source: GitHub Actions**. En cada cambio de `main`, la acción valida, genera `data/testimonios.json` y vuelve a publicar. Si algún día cambia el nombre del repo, hay que actualizar `REPO_URL` en `assets/js/config.js`.

Conviene activar en **Settings → Branches** la regla de `main` que pide el check «Validar testimonios» en verde antes de unir.

## Usar los mensajes en otro sitio

En los ejemplos, `BASE` es `https://simonethg.github.io/testimonios-academiaqa`.

### Opción 1: widget con iframe (lo más simple, sirve en WordPress)

En un bloque «HTML personalizado»:

```html
<iframe
  src="https://simonethg.github.io/testimonios-academiaqa/embed.html?curso=testingai-vivo&lang=es&tema=claro&max=6"
  title="Mensajes de alumnos de TestingAI"
  loading="lazy"
  style="width:100%;border:0;min-height:420px"
  id="testimonios-aqa"></iframe>
<script>
  // Opcional: ajusta la altura del iframe a su contenido.
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://simonethg.github.io') return;
    if (e.data && e.data.tipo === 'testimonios-academiaqa:altura') {
      document.getElementById('testimonios-aqa').style.height = e.data.altura + 'px';
    }
  });
</script>
```

Parámetros de `embed.html`:

| Parámetro | Valores | Para qué |
|---|---|---|
| `curso` | `testingai-vivo`, `carrera-qa-ia` (o cualquier id de `data/cursos.json`) | Muestra solo ese curso. Sin `curso`, muestra todos. |
| `lang` | `es`, `en` | Idioma de los textos del widget (los mensajes quedan como los escribió cada persona). |
| `tema` | `claro`, `oscuro` | Fuerza el modo. Sin `tema`, sigue la preferencia del sistema. |
| `max` | 1 a 24 | Cuántos mensajes mostrar (los más nuevos primero). Por defecto, 6. |
| `titulo` | `0` | Oculta el título del widget. |

Si el sitio tiene una Content Security Policy, tiene que permitir `frame-src https://simonethg.github.io`.

### Opción 2: leer el JSON y pintarlo con el estilo del sitio

`data/testimonios.json` es una lista con todos los mensajes publicados, los más nuevos primero, y la genera la acción de Pages. GitHub Pages sirve los archivos con `Access-Control-Allow-Origin: *`, así que se pueden leer desde cualquier dominio:

```html
<ul id="testimonios"></ul>
<script>
  fetch('https://simonethg.github.io/testimonios-academiaqa/data/testimonios.json')
    .then(function (r) { return r.json(); })
    .then(function (lista) {
      var ul = document.getElementById('testimonios');
      lista
        .filter(function (t) { return t.curso === 'testingai-vivo' && t.consentimiento_publicar === true; })
        .slice(0, 6)
        .forEach(function (t) {
          var li = document.createElement('li');
          var p = document.createElement('p');
          p.textContent = t.mensaje;                 // siempre textContent, nunca innerHTML
          var autor = document.createElement('strong');
          autor.textContent = t.nombre_visible + (t.rol_o_pais ? ' · ' + t.rol_o_pais : '');
          li.append(p, autor);
          ul.append(li);
        });
    });
</script>
```

Aunque los datos ya pasaron la validación, el sitio que los muestre tiene que usar `textContent` (o el escapado de su plantilla) y filtrar por `consentimiento_publicar`.

## Privacidad

Solo se publica lo que la persona escribe: su nombre visible, su rol o país (si lo agrega) y su mensaje. No se piden emails ni teléfonos, y la validación rechaza los mensajes que los incluyan. No hay anuncios, analítica ni rastreadores: la página no hace pedidos a ningún otro sitio. Para quitar un mensaje, alcanza con un Pull Request que borre su archivo.

## Calidad

- Accesibilidad: WCAG 2.2 AA, revisada con axe en escritorio y móvil, en modo claro y oscuro, también con las ventanas abiertas. Se usa con teclado (las ventanas retienen el foco, se cierran con Escape y lo devuelven al botón) y respeta `prefers-reduced-motion`.
- Una pantalla: el muro calcula cuántas tarjetas entran en el alto disponible y pagina el resto. Si no entra ni una (por ejemplo, con zoom al 200 %), el muro se desplaza por dentro y no se pierde contenido.
- Seguridad: Content Security Policy sin scripts en línea, todo el texto de los alumnos se pinta con `textContent`, sin dependencias externas, y las acciones de GitHub corren con permisos mínimos y fijadas por SHA.
- Idiomas: español e inglés.

## Licencia

- **Código:** MIT (`LICENSE`).
- **Textos y mensajes:** Creative Commons Atribución 4.0 Internacional, CC BY 4.0 (`LICENSE-CONTENT`). Quien suma su mensaje acepta publicarlo bajo esa licencia. Para reutilizar un mensaje en otro sitio, citá su nombre visible y el muro.
- **Fuente Kanit:** SIL Open Font License 1.1 (`assets/fonts/OFL.txt`).
