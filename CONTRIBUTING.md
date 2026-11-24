# Cómo dejar tu mensaje en el muro de gratitud

Si hiciste un curso de AcademiaQA, podés dejar en pocas líneas qué te llevás. Cada mensaje es **un archivo nuevo** que sumás con un **Pull Request** en GitHub: Simoneth lo revisa y, cuando lo une, tu mensaje aparece en el muro. Desde el navegador no hace falta instalar nada.

De paso, practicás algo que en QA se usa todos los días: proponer un cambio, pasar una validación automática y esperar la revisión.

## 1. Armá tu archivo

Lo más fácil es tocar «Dejar mi mensaje» en el muro: elegís tu curso, completás el formulario y te da el nombre del archivo y su contenido. El formulario no envía nada. El botón «Crear mi archivo en GitHub» abre GitHub con el archivo nuevo ya completado.

Si preferís hacerlo a mano, el archivo va en la carpeta de tu curso:

```
data/testimonios/<curso>/<AAAA-MM-DD>-<tu-nombre>.json
```

Por ejemplo, `data/testimonios/testingai-vivo/2026-12-02-ana.json`, con este contenido:

```json
{
  "id": "2026-12-02-ana",
  "curso": "testingai-vivo",
  "cohorte": "2026-10",
  "fecha": "2026-12-02",
  "clase_relacionada": "clase-08",
  "nombre_visible": "Ana",
  "rol_o_pais": "QA · Argentina",
  "mensaje": "Qué te llevás del curso, en 280 caracteres o menos.",
  "consentimiento_publicar": true
}
```

| Campo | ¿Es obligatorio? | Qué va |
|---|---|---|
| `id` | Sí | El nombre del archivo sin `.json`. |
| `curso` | Sí | `testingai-vivo` (TestingAI en vivo) o `carrera-qa-ia` (Carrera QA con IA). Tiene que coincidir con la carpeta. |
| `cohorte` | Sí | Para TestingAI, `2026-10`. Para la Carrera QA con IA, `asincronica`. |
| `fecha` | Sí | La fecha de hoy, en formato `AAAA-MM-DD`. Tiene que coincidir con el comienzo del nombre del archivo. |
| `clase_relacionada` | No | Solo para TestingAI: la clase que más te sirvió, por ejemplo `clase-08`. La lista está en `data/clases-testingai.json`. |
| `nombre_visible` | Sí | Cómo querés aparecer: tu nombre, tu nombre y la inicial del apellido o un apodo. Hasta 40 caracteres. |
| `rol_o_pais` | No | Tu rol o tu país, si querés mostrarlo. Hasta 40 caracteres. |
| `mensaje` | Sí | Entre 10 y 280 caracteres. Sin email, teléfono, links ni los signos `<` y `>`. |
| `consentimiento_publicar` | Sí | Tiene que ser `true`: aceptás que tu mensaje se publique bajo la licencia CC BY 4.0. Sin eso, no se publica. |

## 2. Creá el archivo y el Pull Request

1. En GitHub, entrá a la carpeta `data/testimonios/` y después a la de tu curso. Tocá **Add file → Create new file**. Como no tenés permiso para guardar directo, GitHub te ofrece crear tu propia copia del proyecto (un *fork*): aceptá.
2. Escribí el nombre del archivo y pegá el contenido.
3. Abajo de todo, elegí «Create a new branch for this commit and start a pull request» y confirmá.
4. Completá la plantilla del Pull Request y marcá las casillas, incluida la de consentimiento.

Agregá **solo tu archivo nuevo**. Si el Pull Request cambia o borra otros archivos, la validación lo rechaza. Como cada persona suma su propio archivo, no hay choques entre Pull Requests.

## 3. Validación y revisión

El check «Validar testimonios» revisa tu archivo. Si sale en rojo, abrí el detalle: dice qué corregir. Corregilo en el mismo Pull Request y se vuelve a correr.

Simoneth revisa cada mensaje. Si lo aprueba, lo une y tu mensaje aparece en el muro y en las páginas de los cursos donde se muestra. Si hay que ajustar algo, te lo comenta en el Pull Request.

## Para probar en tu computadora (opcional)

Si clonaste el repo y tenés Node 22:

```bash
npm test          # tests de las reglas
npm run validar   # valida cada archivo de data/testimonios/
npm run generar   # arma data/testimonios.json para ver el muro con tu mensaje
```

## Licencia

Tu mensaje se publica bajo la licencia Creative Commons Atribución 4.0 (CC BY 4.0): cualquiera puede mostrarlo citando tu nombre visible. El código del muro es MIT.

## Privacidad

Solo se publica lo que escribís en tu archivo. No pongas email, teléfono ni otros datos de contacto: la validación los rechaza. Tu usuario de GitHub queda visible en el Pull Request. Si más adelante querés que se quite tu mensaje, abrí un Pull Request que borre tu archivo o escribile a Simoneth por sus redes.
