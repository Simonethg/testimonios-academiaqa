// Lectura de datos compartida por el validador y el generador del índice.
import { readFile, readdir } from 'node:fs/promises';
import { validarTestimonio, validarRuta } from '../assets/js/validar.js';

export const raiz = new URL('../', import.meta.url);
export const leerJSON = async (ruta) => JSON.parse(await readFile(new URL(ruta, raiz), 'utf8'));

/** Cursos válidos y clases por curso, desde data/cursos.json. */
export async function contexto() {
  const cursos = await leerJSON('data/cursos.json');
  const clases = {};
  for (const c of cursos) {
    if (c.clases) clases[c.id] = (await leerJSON(c.clases)).clases.map((x) => x.id);
  }
  return { cursos: cursos.map((c) => c.id), clases, hoy: new Date().toISOString().slice(0, 10) };
}

/** Lista todas las rutas de data/testimonios/<curso>/*.json (ignora los archivos ocultos). */
export async function listarArchivos() {
  const base = 'data/testimonios/';
  const rutas = [];
  for (const carpeta of await readdir(new URL(base, raiz), { withFileTypes: true })) {
    if (carpeta.name.startsWith('.')) continue;
    if (!carpeta.isDirectory()) { rutas.push(`${base}${carpeta.name}`); continue; }
    for (const a of await readdir(new URL(`${base}${carpeta.name}/`, raiz))) {
      if (!a.startsWith('.')) rutas.push(`${base}${carpeta.name}/${a}`);
    }
  }
  return rutas.sort();
}

/** Lee y valida todos los archivos. Devuelve { entradas, problemas }. */
export async function leerTestimonios(ctx) {
  const entradas = [];
  const problemas = [];
  const ids = new Set();
  for (const ruta of await listarArchivos()) {
    let t;
    try {
      t = await leerJSON(ruta);
    } catch (e) {
      problemas.push({ ruta, errores: [`no es un JSON válido: ${e.message}`] });
      continue;
    }
    const errores = [...validarRuta(ruta, t), ...validarTestimonio(t, ctx)];
    if (t && ids.has(t.id)) errores.push(`id «${t.id}» repetido`);
    if (t && t.id) ids.add(t.id);
    if (errores.length) problemas.push({ ruta, errores });
    else entradas.push(t);
  }
  entradas.sort((a, b) => b.fecha.localeCompare(a.fecha) || a.id.localeCompare(b.id));
  return { entradas, problemas };
}
