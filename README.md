# Testimonios AcademiaQA

Mensajes de las personas que hicieron los cursos de AcademiaQA y de Simoneth Gomez (@SimonethG · @academia_qa), clase por clase. Empieza con la cohorte en vivo de TestingAI (octubre a diciembre de 2026) y sigue sumando los mensajes de la Carrera QA con IA y de los demás cursos.

- **Página:** una línea de tiempo donde cada punto es una clase de TestingAI y se enciende cuando alguien deja un mensaje, con contadores, filtro por curso y las tarjetas de los mensajes.
- **Widget:** `embed.html`, para mostrar los mensajes en las páginas de los cursos de www.simonethg.com y academiaqa.com.
- **Datos abiertos:** `data/testimonios.json`, un JSON público que cualquier sitio puede leer.

Inspirado en la idea de [Proof of Gratitude](https://github.com/mariaelisaaraya/Proof-of-Gratitude), de María Elisa Araya. El código de este repo es propio: no se copió código de ese proyecto.

## ¿Cómo se suma un mensaje?

Solo por **Pull Request**. La guía para alumnos está en [CONTRIBUTING.md](CONTRIBUTING.md).

1. La persona agrega su entrada a `data/testimonios.json` (el formulario de la página se la arma) y abre un Pull Request con la plantilla, que incluye la casilla de consentimiento.
2. La acción **Validar testimonios** (`.github/workflows/validar-testimonios.yml`) revisa el formato, los largos y que no haya email, teléfono, links ni HTML. Si el PR viene de un fork y toca otro archivo, falla.
3. Simoneth revisa el texto y lo une. **Unido = aprobado:** todo lo que está en `main` se publica.

La página y el widget, además, vuelven a validar cada entrada en el navegador y no muestran las que no cumplan las reglas o no tengan `consentimiento_publicar: true`.

## Estructura

```
index.html                 Página principal (línea de tiempo, mensajes, cómo sumarse, privacidad)
embed.html                 Widget para insertar en otros sitios
data/testimonios.json      Mensajes reales (empieza vacío)
data/ejemplos.json         Tres mensajes de muestra; solo se ven con ?demo=1
data/cursos.json           Cursos válidos
data/clases-testingai.json Clases de la cohorte TestingAI 2026-10
assets/js/validar.js       Reglas compartidas por la página, el widget y la acción de GitHub
assets/js/                 Resto del código (sin dependencias ni librerías externas)
assets/css/estilos.css     Estilos (modo claro y oscuro)
assets/fonts/              Kanit autoalojada (SIL Open Font License 1.1)
i18n/es.json, i18n/en.json Textos en español e inglés
scripts/                   Validador y tests (Node 22, sin dependencias)
```

## Formato de cada mensaje

```json
{
  "id": "ana-clase-08",
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

`clase_relacionada` y `rol_o_pais` son opcionales. No hay campos de email ni de teléfono, y la validación rechaza cualquier campo que no esté en esta lista.

## Correrlo en tu computadora

```bash
python3 -m http.server 8080      # o cualquier servidor estático
# http://localhost:8080/             página real
# http://localhost:8080/?demo=1      con los mensajes de muestra
# http://localhost:8080/embed.html?curso=testingai-vivo
npm test                         # tests de las reglas
npm run validar                  # valida data/testimonios.json
```

## Publicarlo en GitHub Pages

Cuando Simoneth lo apruebe: repo público `Simonethg/testimonios-academiaqa`, **Settings → Pages → Deploy from a branch → `main` / root**. Queda en `https://simonethg.github.io/testimonios-academiaqa/`. Si el repo termina con otro nombre, cambiá `REPO_URL` en `assets/js/config.js`.

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
| `curso` | `testingai-vivo`, `carrera-qa-ia`, `otro-academiaqa` | Muestra solo ese curso. Sin `curso`, muestra todos. |
| `lang` | `es`, `en` | Idioma de los textos del widget (los mensajes quedan como los escribió cada persona). |
| `tema` | `claro`, `oscuro` | Fuerza el modo. Sin `tema`, sigue la preferencia del sistema. |
| `max` | 1 a 24 | Cuántos mensajes mostrar (los más nuevos primero). Por defecto, 6. |
| `titulo` | `0` | Oculta el título del widget. |

Si el sitio tiene una Content Security Policy, tiene que permitir `frame-src https://simonethg.github.io`.

### Opción 2: leer el JSON y pintarlo con el estilo del sitio

GitHub Pages sirve los archivos con `Access-Control-Allow-Origin: *`, así que se pueden leer desde cualquier dominio:

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

Solo se publica lo que la persona escribe: su nombre visible, su rol o país (si lo agrega) y su mensaje. No se piden emails ni teléfonos, y la validación rechaza los mensajes que los incluyan. No hay anuncios, analítica ni rastreadores: la página no hace pedidos a ningún otro sitio. Para quitar un mensaje, alcanza con un Pull Request que lo borre.

## Calidad

- Accesibilidad: WCAG 2.2 AA, revisada con axe en escritorio y móvil, en modo claro y oscuro; se usa con teclado y respeta `prefers-reduced-motion`.
- Seguridad: Content Security Policy sin scripts en línea, todo el texto de los alumnos se pinta con `textContent`, sin dependencias externas, y la acción de GitHub corre con permisos de solo lectura y acciones fijadas por SHA.
- Idiomas: español e inglés.

## Licencia

Pendiente de definir. La fuente Kanit se distribuye bajo la SIL Open Font License 1.1 (`assets/fonts/OFL.txt`).
