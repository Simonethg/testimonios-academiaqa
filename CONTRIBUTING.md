# Cómo dejar tu mensaje

Si hiciste un curso de AcademiaQA, podés dejar en pocas líneas qué te llevás. Los mensajes se suman con un **Pull Request** en GitHub: Simoneth lo revisa y, cuando lo aprueba y lo une, tu mensaje aparece en la página. Si lo hacés desde el navegador, no hace falta instalar nada.

De paso, practicás algo que en QA se usa todos los días: proponer un cambio, pasar una validación automática y esperar la revisión.

## 1. Armá tu entrada

La forma más fácil es usar el formulario «Armá tu entrada» de la página. No envía nada: solo arma el texto y te deja copiarlo.

Si preferís escribirla a mano, copiá esta plantilla y completala:

```json
{
  "id": "tu-nombre-clase-08",
  "curso": "testingai-vivo",
  "cohorte": "2026-10",
  "fecha": "2026-12-02",
  "clase_relacionada": "clase-08",
  "nombre_visible": "Tu nombre o apodo",
  "rol_o_pais": "QA · Argentina",
  "mensaje": "Qué te llevás del curso, en 280 caracteres o menos.",
  "consentimiento_publicar": true
}
```

| Campo | ¿Es obligatorio? | Qué va |
|---|---|---|
| `id` | Sí | Un identificador único: minúsculas, números y guiones. Por ejemplo, `ana-clase-08`. |
| `curso` | Sí | Uno de los cursos de `data/cursos.json`: `testingai-vivo`, `carrera-qa-ia` u `otro-academiaqa`. |
| `cohorte` | Sí | Para TestingAI en vivo, `2026-10`. Para un curso grabado, `async`. |
| `fecha` | Sí | La fecha de hoy, en formato `AAAA-MM-DD`. |
| `clase_relacionada` | No | Solo para TestingAI: la clase que más te sirvió, por ejemplo `clase-08`. La lista está en `data/clases-testingai.json`. |
| `nombre_visible` | Sí | Cómo querés aparecer: tu nombre, tu nombre y la inicial del apellido o un apodo. Hasta 40 caracteres. |
| `rol_o_pais` | No | Tu rol o tu país, si querés mostrarlo. Hasta 40 caracteres. |
| `mensaje` | Sí | Entre 10 y 280 caracteres. Sin email, teléfono, links ni los signos `<` y `>`. |
| `consentimiento_publicar` | Sí | Tiene que ser `true`. Sin eso, el mensaje no se publica. |

## 2. Sumala al archivo

1. Abrí [`data/testimonios.json`](data/testimonios.json) en GitHub y tocá el lápiz para editarlo. GitHub te va a ofrecer crear tu propia copia del proyecto (un *fork*): aceptá.
2. El archivo es una lista entre corchetes `[ ]`. Pegá tu entrada al final, antes del `]`.
   - Si la lista está vacía (`[]`), queda así: `[ { ...tu entrada... } ]`.
   - Si ya hay mensajes, agregá una coma después de la `}` del último y pegá la tuya a continuación.
3. Cambiá **solo** ese archivo. Si el Pull Request toca otros archivos, la validación lo rechaza.

## 3. Creá el Pull Request

1. Abajo de todo, elegí «Create a new branch for this commit and start a pull request» y confirmá.
2. Completá la plantilla del Pull Request y marcá las casillas, incluida la de consentimiento.
3. Esperá la validación automática (el check «Validar testimonios»). Si sale en rojo, abrí el detalle: dice qué campo corregir. Corregilo en el mismo Pull Request y se vuelve a correr.

## 4. Revisión

Simoneth revisa cada mensaje. Si lo aprueba, lo une al proyecto y aparece en la página y en los sitios donde se muestran estos mensajes. Si hay que ajustar algo, te lo comenta en el Pull Request.

## Para probar en tu computadora (opcional)

Si clonaste el repo y tenés Node 22:

```bash
npm test          # tests de las reglas
npm run validar   # valida data/testimonios.json
```

## Privacidad

Solo se publica lo que escribís en tu entrada. No pongas email, teléfono ni otros datos de contacto: la validación los rechaza. Tu usuario de GitHub queda visible en el Pull Request. Si más adelante querés que se quite tu mensaje, abrí un Pull Request que lo borre o escribile a Simoneth por sus redes.
