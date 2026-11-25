import {
  estado, t, iniciarIdioma, cargarIdioma, temaActual, aplicarTema,
  cargarDatos, nombreCurso, etiquetaClase, el, tarjetaMensaje,
} from './comun.js';
import { validarTestimonio } from './validar.js';
import { crearArchivoURL, GUIA_URL } from './config.js';

const $ = (id) => document.getElementById(id);
let datos = null;
const vista = { curso: 'todos', inicio: 0, fin: 0, historial: [] };

const temaClase = (c) => (c.tema ? c.tema[estado.idioma] || c.tema.es : t('proximamente'));
const clasesDe = (curso) => (datos.clasesPorCurso[curso] ? datos.clasesPorCurso[curso].clases : null);
const delCurso = () => datos.mensajes.filter((m) => vista.curso === 'todos' || m.curso === vista.curso);

/* ---------- Selector de curso ---------- */
function pintarCursos() {
  const opciones = [{ id: 'todos', texto: t('filtro_todos') },
    ...datos.cursos.map((c) => ({ id: c.id, texto: nombreCurso(datos.cursos, c.id, true) }))];
  $('botones-cursos').replaceChildren(...opciones.map((o) => el('button', {
    type: 'button',
    class: 'boton-curso',
    'aria-pressed': String(vista.curso === o.id),
    onclick: () => elegirCurso(o.id),
    text: o.texto,
  })));
  moverIndicador();
}

// Mueve la pastilla de fondo del selector hasta el curso elegido.
function moverIndicador() {
  const activo = document.querySelector('.boton-curso[aria-pressed="true"]');
  const indicador = $('indicador-curso');
  if (!activo || !indicador) return;
  indicador.style.setProperty('--x', `${activo.offsetLeft}px`);
  indicador.style.setProperty('--ancho', `${activo.offsetWidth}px`);
  indicador.classList.add('cursos__indicador--listo');
}

function elegirCurso(id) {
  vista.curso = id;
  reiniciarPaginas();
  pintarCursos();
  pintarMuro();
  const url = new URL(window.location.href);
  if (id === 'todos') url.searchParams.delete('curso'); else url.searchParams.set('curso', id);
  window.history.replaceState(null, '', url);
}

/* ---------- Muro: entra en la pantalla y se pagina ---------- */
function reiniciarPaginas() { vista.inicio = 0; vista.historial = []; }

function pintarMuro() {
  const lista = delCurso();
  const n = lista.length;
  $('conteo').textContent = n ? `${n} ${n === 1 ? t('mensajes_uno') : t('mensajes_varios')}` : '';
  $('titulo-muro').hidden = n === 0;
  const ul = $('mensajes');
  ul.replaceChildren();
  $('vacio').hidden = n > 0;
  $('vacio-texto').textContent = t(vista.curso === 'todos' ? 'vacio_texto_todos' : 'vacio_texto');
  if (!n) { $('paginacion').hidden = true; return; }

  // Suma tarjetas mientras entren en el alto disponible; como mínimo, una.
  // La paginación se muestra antes de medir, para que el alto sea el final.
  $('paginacion').hidden = false;
  const muro = $('muro');
  let fin = vista.inicio;
  while (fin < n) {
    const tarjeta = tarjetaMensaje(lista[fin], datos, fin - vista.inicio);
    ul.append(tarjeta);
    if (fin > vista.inicio && muro.scrollHeight > muro.clientHeight + 1) { tarjeta.remove(); break; }
    fin += 1;
  }
  vista.fin = fin;
  const hayMas = fin < n;
  $('paginacion').hidden = vista.inicio === 0 && !hayMas;
  $('pagina-anterior').disabled = vista.inicio === 0;
  $('pagina-siguiente').disabled = !hayMas;
  $('pagina-texto').textContent = `${vista.inicio + 1}–${fin} ${t('de')} ${n}`;
}

function paginaSiguiente() {
  if (vista.fin >= delCurso().length) return;
  vista.historial.push(vista.inicio);
  vista.inicio = vista.fin;
  pintarMuro();
}
function paginaAnterior() {
  if (!vista.historial.length) return;
  vista.inicio = vista.historial.pop();
  pintarMuro();
}

/* ---------- Formulario (diálogo) ---------- */
function opcion(valor, texto, elegida) {
  const o = el('option', { value: valor, text: texto });
  if (elegida) o.selected = true;
  return o;
}
function pintarSelectsForm() {
  const previo = $('f-curso').value;
  $('f-curso').replaceChildren(opcion('', t('form_curso_elegir'), !previo),
    ...datos.cursos.map((c) => opcion(c.id, nombreCurso(datos.cursos, c.id), c.id === previo)));
  pintarClasesForm();
}
function pintarClasesForm() {
  const clases = clasesDe($('f-curso').value);
  const previa = $('f-clase').value;
  $('campo-clase').hidden = !clases;
  $('f-clase').replaceChildren(opcion('', t('form_clase_ninguna'), !previa),
    ...(clases || []).filter((c) => c.estado === 'dada').map((c) => opcion(c.id, `${etiquetaClase(c)} · ${temaClase(c)}`, c.id === previa)));
}

function slug(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'mensaje';
}
function hoyLocal() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function armarEntrada(evento) {
  evento.preventDefault();
  const curso = $('f-curso').value;
  const cursoDatos = datos.cursos.find((c) => c.id === curso);
  const clase = clasesDe(curso) ? $('f-clase').value : '';
  const fecha = hoyLocal();
  const id = `${fecha}-${slug($('f-nombre').value)}`;
  const entrada = { id, curso, cohorte: cursoDatos ? cursoDatos.cohorte_actual : '', fecha };
  if (clase) entrada.clase_relacionada = clase;
  entrada.nombre_visible = $('f-nombre').value.trim();
  if ($('f-rol').value.trim()) entrada.rol_o_pais = $('f-rol').value.trim();
  entrada.mensaje = $('f-mensaje').value.trim();
  entrada.consentimiento_publicar = $('f-consentimiento').checked;

  let errores = validarTestimonio(entrada, datos.ctx).filter((e) => !e.startsWith('id:') && !e.startsWith('cohorte:'));
  if (!cursoDatos) errores = [`${t('form_curso')}: ${t('form_curso_elegir')}`, ...errores.filter((e) => !e.startsWith('curso:'))];
  const caja = $('form-errores');
  if (errores.length) {
    caja.replaceChildren(el('p', { text: t('form_errores') }), el('ul', {}, errores.map((e) => el('li', { text: e }))));
    caja.hidden = false;
    $('resultado').hidden = true;
    caja.focus();
    return;
  }
  caja.hidden = true;
  const nombre = `${id}.json`;
  const contenido = `${JSON.stringify(entrada, null, 2)}\n`;
  $('f-archivo').value = `data/testimonios/${curso}/${nombre}`;
  $('f-salida').value = contenido;
  $('enlace-crear').href = crearArchivoURL(curso, nombre, contenido);
  $('resultado').hidden = false;
  $('estado-copia').textContent = '';
  $('f-archivo').focus();
}

async function copiar() {
  try {
    await navigator.clipboard.writeText($('f-salida').value);
  } catch {
    $('f-salida').select();
    document.execCommand('copy');
  }
  $('estado-copia').textContent = t('form_copiado');
}

/* ---------- Diálogos ---------- */
let origenDialogo = null;
function abrirDialogo(id, origen) {
  origenDialogo = origen;
  const d = $(id);
  d.showModal();
  if (id === 'dialogo-como' && vista.curso !== 'todos' && !$('f-curso').value) {
    $('f-curso').value = vista.curso;
    pintarClasesForm();
  }
}
function prepararDialogos() {
  document.querySelectorAll('[data-abrir]').forEach((b) => b.addEventListener('click', () => abrirDialogo(b.dataset.abrir, b)));
  document.querySelectorAll('dialog').forEach((d) => {
    d.querySelectorAll('[data-cerrar]').forEach((b) => b.addEventListener('click', () => d.close()));
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    d.addEventListener('close', () => { if (origenDialogo) origenDialogo.focus(); });
  });
}

/* ---------- General ---------- */
function pintarTema() { $('boton-tema').setAttribute('aria-pressed', String(temaActual() === 'oscuro')); }

function pintarTodo() {
  pintarCursos();
  pintarMuro();
  pintarSelectsForm();
  pintarTema();
  document.querySelectorAll('[data-idioma]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.idioma === estado.idioma)));
}

async function iniciar() {
  await iniciarIdioma();
  $('enlace-guia').href = GUIA_URL;
  prepararDialogos();
  try {
    datos = await cargarDatos();
  } catch (e) {
    $('vacio').hidden = false;
    console.error(e.message);
    return;
  }
  const pedido = estado.params.get('curso');
  if (pedido && datos.cursos.some((c) => c.id === pedido)) vista.curso = pedido;
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  pintarTodo();

  $('pagina-siguiente').addEventListener('click', paginaSiguiente);
  $('pagina-anterior').addEventListener('click', paginaAnterior);
  $('boton-tema').addEventListener('click', () => { aplicarTema(temaActual() === 'oscuro' ? 'claro' : 'oscuro'); pintarTema(); });
  document.querySelectorAll('[data-idioma]').forEach((b) => b.addEventListener('click', async () => { await cargarIdioma(b.dataset.idioma); pintarTodo(); }));
  $('f-curso').addEventListener('change', pintarClasesForm);
  $('f-mensaje').addEventListener('input', (e) => { $('f-restantes').textContent = String(280 - [...e.target.value].length); });
  $('formulario').addEventListener('submit', armarEntrada);
  $('boton-copiar').addEventListener('click', copiar);
  let espera;
  window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(() => { moverIndicador(); reiniciarPaginas(); pintarMuro(); }, 150); });
}

iniciar();
