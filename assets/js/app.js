import {
  estado, t, iniciarIdioma, cargarIdioma, temaActual, aplicarTema,
  cargarDatos, formatearFecha, nombreCurso, etiquetaClase, el, tarjetaMensaje, esDemo,
} from './comun.js';
import { validarTestimonio } from './validar.js';
import { crearArchivoURL, GUIA_URL } from './config.js';

const $ = (id) => document.getElementById(id);
let datos = null;
const vista = { curso: 'todos', clase: null, inicio: 0, historial: [] };

function lunesDe(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

const temaClase = (c) => (c.tema ? c.tema[estado.idioma] || c.tema.es : t('proximamente'));
const contarTexto = (n) => `${n} ${n === 1 ? t('mensajes_uno') : t('mensajes_varios')}`;
const clasesDe = (curso) => (datos.clasesPorCurso[curso] ? datos.clasesPorCurso[curso].clases : null);

function delCurso() {
  return datos.mensajes.filter((m) => vista.curso === 'todos' || m.curso === vista.curso);
}
function filtrados() {
  return delCurso().filter((m) => !vista.clase || m.clase_relacionada === vista.clase);
}

/* ---------- Selector de curso ---------- */
function pintarCursos() {
  const opciones = [{ id: 'todos', texto: t('filtro_todos') },
    ...datos.cursos.map((c) => ({ id: c.id, texto: nombreCurso(datos.cursos, c.id, true) }))];
  $('botones-cursos').replaceChildren(...opciones.map((o) => el('button', {
    type: 'button',
    class: 'boton-chico boton-curso',
    'aria-pressed': String(vista.curso === o.id),
    onclick: () => elegirCurso(o.id),
    text: o.texto,
  })));
}

function elegirCurso(id) {
  vista.curso = id;
  vista.clase = null;
  reiniciarPaginas();
  pintarTodo();
  const url = new URL(window.location.href);
  if (id === 'todos') url.searchParams.delete('curso'); else url.searchParams.set('curso', id);
  window.history.replaceState(null, '', url);
}

/* ---------- Contadores ---------- */
function chip(n, claveUno, claveVarios) {
  return el('li', {}, el('strong', { text: String(n) }), el('span', { text: t(n === 1 ? claveUno : claveVarios) }));
}
function pintarContadores() {
  const lista = delCurso();
  const personas = new Set(lista.map((m) => m.nombre_visible.trim().toLowerCase())).size;
  const chips = [chip(personas, 'contador_personas_uno', 'contador_personas')];
  const clases = clasesDe(vista.curso);
  if (vista.curso === 'todos') {
    chips.push(chip(datos.cursos.length, 'contador_cursos_uno', 'contador_cursos'));
  } else if (clases) {
    chips.push(chip(clases.filter((c) => c.estado === 'dada').length, 'contador_clases', 'contador_clases'));
    const semanas = new Set(lista.map((m) => {
      const c = clases.find((x) => x.id === m.clase_relacionada);
      return lunesDe(c ? c.fecha : m.fecha);
    })).size;
    chips.push(chip(semanas, 'contador_semanas_uno', 'contador_semanas'));
  }
  $('contadores').replaceChildren(...chips);
}

/* ---------- Línea de tiempo (solo cursos con clases) ---------- */
function textoDetalle(c) {
  const cant = datos.mensajes.filter((m) => m.curso === vista.curso && m.clase_relacionada === c.id).length;
  return `${etiquetaClase(c)} · ${formatearFecha(c.fecha, { weekday: 'short', day: 'numeric', month: 'short' })} · ${temaClase(c)} · ${cant ? contarTexto(cant) : t('sin_mensajes_clase')}`;
}
function detallePorDefecto() {
  const c = clasesDe(vista.curso)?.find((x) => x.id === vista.clase);
  $('detalle').textContent = c ? textoDetalle(c) : t('linea_ayuda');
}

function pintarLinea() {
  const clases = clasesDe(vista.curso);
  $('seccion-linea').hidden = !clases;
  $('linea').replaceChildren();
  if (!clases) return;
  const semanas = new Map();
  for (const c of clases) {
    const k = lunesDe(c.fecha);
    if (!semanas.has(k)) semanas.set(k, []);
    semanas.get(k).push(c);
  }
  for (const grupo of semanas.values()) {
    $('linea').append(el('li', { class: 'linea__semana' }, el('ol', { class: 'linea__clases' }, grupo.map((c) => {
      const cant = datos.mensajes.filter((m) => m.curso === vista.curso && m.clase_relacionada === c.id).length;
      const tipo = c.estado === 'proxima' ? 'proxima' : cant ? 'mensajes' : 'dada';
      const elegida = vista.clase === c.id;
      return el('li', { class: 'linea__clase' }, el('button', {
        type: 'button',
        class: `linea__boton${elegida ? ' linea__boton--activo' : ''}`,
        'aria-pressed': String(elegida),
        'data-clase': c.id,
        onclick: () => elegirClase(c.id),
        onfocus: () => { $('detalle').textContent = textoDetalle(c); },
        onmouseenter: () => { $('detalle').textContent = textoDetalle(c); },
        onblur: detallePorDefecto,
        onmouseleave: detallePorDefecto,
      },
      el('span', { class: `punto punto--${tipo}`, 'aria-hidden': 'true' }, cant ? el('span', { class: 'punto__n', text: String(cant) }) : null),
      el('span', { class: 'linea__nombre', text: etiquetaClase(c) }),
      el('span', { class: 'linea__fecha', text: formatearFecha(c.fecha, { day: '2-digit', month: '2-digit' }) }),
      // El nombre accesible empieza con el texto visible y suma el tema y los mensajes.
      el('span', { class: 'visualmente-oculto', text: `: ${temaClase(c)}. ${contarTexto(cant)}.` })));
    }))));
  }
  detallePorDefecto();
  // En pantallas angostas, deja a la vista la clase elegida o la última dada.
  const linea = $('linea');
  if (linea.scrollWidth > linea.clientWidth) {
    const dadas = clases.filter((c) => c.estado === 'dada');
    const foco = vista.clase || (dadas.length ? dadas[dadas.length - 1].id : null);
    const boton = foco && linea.querySelector(`[data-clase="${CSS.escape(foco)}"]`);
    if (boton) linea.scrollLeft = Math.max(0, boton.offsetLeft - linea.offsetLeft - linea.clientWidth + boton.offsetWidth + 24);
  }
}

function elegirClase(id) {
  vista.clase = vista.clase === id ? null : id;
  reiniciarPaginas();
  pintarLinea();
  pintarMuro();
  const boton = document.querySelector(`#linea [data-clase="${CSS.escape(id)}"]`);
  if (boton) boton.focus();
}

/* ---------- Muro con páginas que entran en la pantalla ---------- */
function reiniciarPaginas() { vista.inicio = 0; vista.historial = []; }

function pintarMuro() {
  const lista = filtrados();
  const clase = vista.clase ? clasesDe(vista.curso)?.find((c) => c.id === vista.clase) : null;
  $('subtitulo-mensajes').textContent = clase ? ` · ${etiquetaClase(clase)}`
    : vista.curso === 'todos' ? '' : ` · ${nombreCurso(datos.cursos, vista.curso)}`;
  $('quitar-filtro-clase').hidden = !clase;

  const ul = $('mensajes');
  ul.replaceChildren();
  $('vacio').hidden = lista.length > 0 || Boolean(clase);
  if (!lista.length) {
    if (clase) ul.append(el('li', { class: 'tarjeta tarjeta--vacia' }, el('p', { text: t('sin_mensajes_clase') })));
    $('paginacion').hidden = true;
    return;
  }
  // Suma tarjetas mientras entren en el alto disponible; como mínimo, una.
  // La paginación se muestra antes de medir, para que el alto sea el final.
  $('paginacion').hidden = false;
  const muro = $('muro');
  let fin = vista.inicio;
  while (fin < lista.length) {
    const tarjeta = tarjetaMensaje(lista[fin], datos);
    ul.append(tarjeta);
    if (fin > vista.inicio && muro.scrollHeight > muro.clientHeight + 1) { tarjeta.remove(); break; }
    fin += 1;
  }
  vista.fin = fin;
  const total = lista.length;
  const hayMas = fin < total;
  $('paginacion').hidden = vista.inicio === 0 && !hayMas;
  $('pagina-anterior').disabled = vista.inicio === 0;
  $('pagina-siguiente').disabled = !hayMas;
  $('pagina-texto').textContent = `${vista.inicio + 1}–${fin} ${t('de')} ${total}`;
}

function paginaSiguiente() {
  if (vista.fin >= filtrados().length) return;
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
  pintarContadores();
  pintarLinea();
  pintarMuro();
  pintarSelectsForm();
  pintarTema();
  document.querySelectorAll('[data-idioma]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.idioma === estado.idioma)));
}

async function iniciar() {
  await iniciarIdioma();
  if (esDemo()) $('aviso-demo').hidden = false;
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

  $('quitar-filtro-clase').addEventListener('click', () => {
    vista.clase = null; reiniciarPaginas(); pintarLinea(); pintarMuro(); $('titulo-mensajes').focus();
  });
  $('pagina-siguiente').addEventListener('click', paginaSiguiente);
  $('pagina-anterior').addEventListener('click', paginaAnterior);
  $('boton-tema').addEventListener('click', () => { aplicarTema(temaActual() === 'oscuro' ? 'claro' : 'oscuro'); pintarTema(); });
  document.querySelectorAll('[data-idioma]').forEach((b) => b.addEventListener('click', async () => { await cargarIdioma(b.dataset.idioma); pintarTodo(); }));
  $('f-curso').addEventListener('change', pintarClasesForm);
  $('f-mensaje').addEventListener('input', (e) => { $('f-restantes').textContent = String(280 - [...e.target.value].length); });
  $('formulario').addEventListener('submit', armarEntrada);
  $('boton-copiar').addEventListener('click', copiar);
  let espera;
  window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(() => { reiniciarPaginas(); pintarMuro(); }, 150); });
}

iniciar();
