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


/** Carga cursos, clases de los cursos que las tienen y mensajes publicados. */
export async function cargarDatos() {
  const [cursos, reales] = await Promise.all([leerJSON('data/cursos.json'), leerJSON('data/testimonios.json')]);
  const clasesPorCurso = {};
  await Promise.all(cursos.filter((c) => c.clases).map(async (c) => {
    clasesPorCurso[c.id] = await leerJSON(c.clases);
  }));
  const lista = Array.isArray(reales) ? reales : [];
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

/** Tarjeta de un mensaje, con el tono de color de su curso. */
export function tarjetaMensaje(m, { cursos, clasesPorCurso }, indice = 0) {
  const datosClases = clasesPorCurso && clasesPorCurso[m.curso];
  const clase = m.clase_relacionada && datosClases ? datosClases.clases.find((c) => c.id === m.clase_relacionada) : null;
  const meta = [nombreCurso(cursos, m.curso, true)];
  if (clase) meta.push(etiquetaClase(clase));
  meta.push(formatearFecha(m.fecha, { day: 'numeric', month: 'short', year: 'numeric' }));
  const tono = Math.max(0, cursos.findIndex((c) => c.id === m.curso)) % 4;
  const inicial = [...m.nombre_visible.trim()][0] || '·';
  const li = el('li', { class: 'tarjeta', 'data-tono': String(tono) },
    el('blockquote', { class: 'tarjeta__mensaje' }, el('p', { text: m.mensaje })),
    el('div', { class: 'tarjeta__pie' },
      el('span', { class: 'tarjeta__avatar', 'aria-hidden': 'true', text: inicial.toUpperCase() }),
      el('div', { class: 'tarjeta__autor' },
        el('p', { class: 'tarjeta__nombre' },
          el('span', { text: m.nombre_visible }),
          m.rol_o_pais ? el('span', { class: 'tarjeta__rol', text: ` · ${m.rol_o_pais}` }) : null),
        el('p', { class: 'tarjeta__meta', text: meta.join(' · ') }))));
  // Variables de animación por CSSOM (permitido por la CSP, a diferencia de style="...").
  li.style.setProperty('--orden', String(indice));
  return li;
}
