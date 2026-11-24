import { publicables } from './validar.js';

const IDIOMAS = ['es', 'en'];
const params = new URLSearchParams(window.location.search);
let textos = {};

export const estado = { idioma: 'es', params };

function idiomaInicial() {
  const pedido = params.get('lang');
  if (IDIOMAS.includes(pedido)) return pedido;
  try {
    const guardado = localStorage.getItem('aqa-idioma');
    if (IDIOMAS.includes(guardado)) return guardado;
  } catch { /* sin almacenamiento: se usa el idioma del navegador */ }
  return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
}

export const t = (clave) => (clave in textos ? textos[clave] : clave);

async function leerJSON(ruta) {
  const r = await fetch(ruta, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`No se pudo leer ${ruta} (${r.status})`);
  return r.json();
}

export async function cargarIdioma(idioma) {
  estado.idioma = IDIOMAS.includes(idioma) ? idioma : 'es';
  textos = await leerJSON(`i18n/${estado.idioma}.json`);
  document.documentElement.lang = estado.idioma;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-alt]').forEach((el) => { el.setAttribute('alt', t(el.dataset.i18nAlt)); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  try { localStorage.setItem('aqa-idioma', estado.idioma); } catch { /* opcional */ }
}

export async function iniciarIdioma() { await cargarIdioma(idiomaInicial()); }

// Tema claro u oscuro: respeta prefers-color-scheme y se puede cambiar a mano.
export function temaActual() {
  return document.documentElement.dataset.tema
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro');
}
export function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  try { localStorage.setItem('aqa-tema', tema); } catch { /* opcional */ }
}
export function temaInicial() {
  const pedido = params.get('tema');
  let guardado = null;
  try { guardado = localStorage.getItem('aqa-tema'); } catch { /* opcional */ }
  const tema = ['claro', 'oscuro'].includes(pedido) ? pedido : guardado;
  if (['claro', 'oscuro'].includes(tema)) document.documentElement.dataset.tema = tema;
}

export function formatearFecha(iso, opciones = { day: 'numeric', month: 'short' }) {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat(estado.idioma === 'es' ? 'es-AR' : 'en-US', opciones).format(d);
}

export const esDemo = () => params.get('demo') === '1';
export const esEjemplo = (m) => typeof m.id === 'string' && m.id.startsWith('ejemplo-');

/** Carga cursos, clases de los cursos que las tienen y mensajes. Con ?demo=1 suma los ejemplos. */
export async function cargarDatos() {
  const [cursos, reales] = await Promise.all([leerJSON('data/cursos.json'), leerJSON('data/testimonios.json')]);
  const clasesPorCurso = {};
  await Promise.all(cursos.filter((c) => c.clases).map(async (c) => {
    clasesPorCurso[c.id] = await leerJSON(c.clases);
  }));
  let lista = Array.isArray(reales) ? reales : [];
  if (esDemo()) {
    const ejemplos = await leerJSON('data/ejemplos.json');
    lista = lista.concat(Array.isArray(ejemplos) ? ejemplos : []);
  }
  const ctx = {
    cursos: cursos.map((c) => c.id),
    clases: Object.fromEntries(Object.entries(clasesPorCurso).map(([k, v]) => [k, v.clases.map((x) => x.id)])),
  };
  const mensajes = publicables(lista, ctx).sort((a, b) => b.fecha.localeCompare(a.fecha));
  return { cursos, clasesPorCurso, mensajes, ctx };
}

export function nombreCurso(cursos, id, corto = false) {
  const c = cursos.find((x) => x.id === id);
  if (!c) return id;
  const n = corto && c.nombre_corto ? c.nombre_corto : c.nombre;
  return n[estado.idioma] || n.es;
}

export const etiquetaClase = (c) => (c.numero === 0 ? t('bienvenida') : `${t('clase')} ${c.numero}`);

// Crea elementos sin innerHTML: todo el texto de los alumnos va por textContent.
export function el(etiqueta, props = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') nodo.className = v;
    else if (k === 'text') nodo.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') nodo.addEventListener(k.slice(2), v);
    else nodo.setAttribute(k, v === true ? '' : String(v));
  }
  for (const h of hijos.flat()) if (h) nodo.append(h);
  return nodo;
}

/** Tarjeta de un mensaje. */
export function tarjetaMensaje(m, { cursos, clasesPorCurso }) {
  const datosClases = clasesPorCurso && clasesPorCurso[m.curso];
  const clase = m.clase_relacionada && datosClases ? datosClases.clases.find((c) => c.id === m.clase_relacionada) : null;
  const meta = [nombreCurso(cursos, m.curso, true)];
  if (clase) meta.push(etiquetaClase(clase));
  meta.push(formatearFecha(m.fecha, { day: 'numeric', month: 'short', year: 'numeric' }));
  return el('li', { class: `tarjeta${esEjemplo(m) ? ' tarjeta--ejemplo' : ''}` },
    el('blockquote', { class: 'tarjeta__mensaje' }, el('p', { text: m.mensaje })),
    el('p', { class: 'tarjeta__autor' },
      el('span', { class: 'tarjeta__nombre', text: m.nombre_visible }),
      m.rol_o_pais ? el('span', { class: 'tarjeta__rol', text: `· ${m.rol_o_pais}` }) : null,
      esEjemplo(m) ? el('span', { class: 'etiqueta-ejemplo', text: t('ejemplo') }) : null),
    el('p', { class: 'tarjeta__meta', text: meta.join(' · ') }));
}
