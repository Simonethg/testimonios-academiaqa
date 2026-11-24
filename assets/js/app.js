import {
  estado, t, iniciarIdioma, cargarIdioma, temaActual, aplicarTema,
  cargarDatos, formatearFecha, nombreCurso, el, tarjetaMensaje, esDemo,
} from './comun.js';
import { validarTestimonio } from './validar.js';
import { ARCHIVO_DATOS, GUIA_URL } from './config.js';

const $ = (id) => document.getElementById(id);
let datos = null;
const vista = { curso: 'todos', clase: null };

function lunesDe(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  const dia = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dia);
  return d.toISOString().slice(0, 10);
}

const etiquetaClase = (c) => (c.numero === 0 ? t('bienvenida') : `${t('clase')} ${c.numero}`);
const temaClase = (c) => (c.tema ? c.tema[estado.idioma] || c.tema.es : t('proximamente'));
const contarTexto = (n) => `${n} ${n === 1 ? t('mensajes_uno') : t('mensajes_varios')}`;

function mensajesFiltrados() {
  return datos.mensajes.filter((m) => (vista.curso === 'todos' || m.curso === vista.curso)
    && (!vista.clase || m.clase_relacionada === vista.clase));
}

function porClase() {
  const mapa = new Map();
  for (const m of datos.mensajes) {
    if (m.curso !== datos.testingai.curso || !m.clase_relacionada) continue;
    mapa.set(m.clase_relacionada, (mapa.get(m.clase_relacionada) || 0) + 1);
  }
  return mapa;
}

function pintarContadores() {
  const lista = datos.mensajes.filter((m) => vista.curso === 'todos' || m.curso === vista.curso);
  const personas = new Set(lista.map((m) => m.nombre_visible.trim().toLowerCase()));
  const clasesDadas = datos.testingai.clases.filter((c) => c.estado === 'dada').length;
  const semanas = new Set(lista.map((m) => {
    const c = datos.testingai.clases.find((x) => x.id === m.clase_relacionada);
    return lunesDe(c ? c.fecha : m.fecha);
  }));
  $('n-personas').textContent = String(personas.size);
  $('n-clases').textContent = String(clasesDadas);
  $('n-semanas').textContent = String(semanas.size);
  $('t-personas').textContent = t(personas.size === 1 ? 'contador_personas_uno' : 'contador_personas');
  $('t-semanas').textContent = t(semanas.size === 1 ? 'contador_semanas_uno' : 'contador_semanas');
}

function pintarLinea() {
  const linea = $('linea');
  linea.replaceChildren();
  const visible = vista.curso === 'todos' || vista.curso === datos.testingai.curso;
  $('seccion-linea').hidden = !visible;
  if (!visible) return;

  const conteo = porClase();
  const semanas = new Map();
  for (const c of datos.testingai.clases) {
    const lunes = lunesDe(c.fecha);
    if (!semanas.has(lunes)) semanas.set(lunes, []);
    semanas.get(lunes).push(c);
  }
  let n = 0;
  for (const [lunes, clases] of semanas) {
    n += 1;
    const puntos = clases.map((c) => {
      const cant = conteo.get(c.id) || 0;
      const tipo = c.estado === 'proxima' ? 'proxima' : cant ? 'mensajes' : 'dada';
      const fecha = formatearFecha(c.fecha, { weekday: 'short', day: 'numeric', month: 'short' });
      const etiqueta = `${etiquetaClase(c)}, ${fecha}: ${temaClase(c)}. ${contarTexto(cant)}.`;
      return el('li', { class: 'linea__clase' },
        el('button', {
          type: 'button',
          class: `punto punto--${tipo}${vista.clase === c.id ? ' punto--activo' : ''}`,
          'aria-label': etiqueta,
          'data-clase': c.id,
          'aria-pressed': vista.clase === c.id ? 'true' : 'false',
          onclick: () => elegirClase(c.id),
        }, cant ? el('span', { class: 'punto__n', 'aria-hidden': 'true', text: String(cant) }) : null),
        el('span', { class: 'linea__nombre', 'aria-hidden': 'true', text: etiquetaClase(c) }),
        el('span', { class: 'linea__fecha', 'aria-hidden': 'true', text: formatearFecha(c.fecha) }),
        el('span', { class: `linea__tema${c.tema ? '' : ' linea__tema--proxima'}`, 'aria-hidden': 'true', text: temaClase(c) }));
    });
    linea.append(el('li', { class: 'linea__semana' },
      el('p', { class: 'linea__titulo-semana' },
        el('span', { text: `${t('semana')} ${n}` }),
        el('span', { class: 'linea__desde', text: formatearFecha(lunes) })),
      el('ul', { class: 'linea__clases', role: 'list' }, puntos)));
  }
}

function pintarDetalle() {
  const detalle = $('detalle');
  const c = datos.testingai.clases.find((x) => x.id === vista.clase);
  if (!c) { detalle.hidden = true; detalle.replaceChildren(); return; }
  const cant = porClase().get(c.id) || 0;
  detalle.replaceChildren(
    el('p', { class: 'detalle__clase', text: `${etiquetaClase(c)} · ${formatearFecha(c.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}` }),
    el('p', { class: 'detalle__tema', text: temaClase(c) }),
    el('p', { class: 'detalle__conteo', text: cant ? contarTexto(cant) : t('sin_mensajes_clase') }));
  detalle.hidden = false;
}

function pintarMensajes() {
  const lista = mensajesFiltrados();
  const ul = $('mensajes');
  ul.replaceChildren(...lista.map((m) => tarjetaMensaje(m, { cursos: datos.cursos, clases: datos.testingai.clases })));
  const c = datos.testingai.clases.find((x) => x.id === vista.clase);
  $('filtro-clase').hidden = !c;
  if (c) $('filtro-clase-texto').textContent = `${t('mensajes_de_clase')} ${etiquetaClase(c)}.`;
  $('vacio').hidden = lista.length > 0 || Boolean(c);
  ul.hidden = lista.length === 0;
}

function pintarTodo() {
  pintarContadores();
  pintarLinea();
  pintarDetalle();
  pintarMensajes();
  pintarSelects();
  pintarTema();
  document.querySelectorAll('[data-idioma]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.idioma === estado.idioma)));
}

function elegirClase(id) {
  vista.clase = vista.clase === id ? null : id;
  pintarLinea();
  pintarDetalle();
  pintarMensajes();
  const boton = document.querySelector(`#linea [data-clase="${CSS.escape(id)}"]`);
  if (boton) boton.focus();
}

function opcion(valor, texto, elegida) {
  const o = el('option', { value: valor, text: texto });
  if (elegida) o.selected = true;
  return o;
}

function pintarSelects() {
  $('filtro-curso').replaceChildren(
    opcion('todos', t('filtro_todos'), vista.curso === 'todos'),
    ...datos.cursos.map((c) => opcion(c.id, nombreCurso(datos.cursos, c.id), vista.curso === c.id)));
  const cursoForm = $('f-curso').value || datos.testingai.curso;
  $('f-curso').replaceChildren(...datos.cursos.map((c) => opcion(c.id, nombreCurso(datos.cursos, c.id), c.id === cursoForm)));
  pintarClasesForm();
}

function pintarClasesForm() {
  const sel = $('f-clase');
  const previa = sel.value;
  const esTestingAI = $('f-curso').value === datos.testingai.curso;
  const clases = esTestingAI ? datos.testingai.clases.filter((c) => c.estado === 'dada') : [];
  sel.replaceChildren(opcion('', t('form_clase_ninguna'), !previa),
    ...clases.map((c) => opcion(c.id, `${etiquetaClase(c)} · ${temaClase(c)}`, c.id === previa)));
  sel.disabled = !esTestingAI;
}

function pintarTema() {
  const oscuro = temaActual() === 'oscuro';
  $('boton-tema').setAttribute('aria-pressed', String(oscuro));
  $('texto-tema').textContent = t('tema_oscuro');
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
  const clase = $('f-clase').disabled ? '' : $('f-clase').value;
  const fecha = hoyLocal();
  const entrada = {
    id: `${slug($('f-nombre').value)}-${clase || fecha}`,
    curso,
    cohorte: curso === datos.testingai.curso ? datos.testingai.cohorte : 'async',
    fecha,
  };
  if (clase) entrada.clase_relacionada = clase;
  entrada.nombre_visible = $('f-nombre').value.trim();
  if ($('f-rol').value.trim()) entrada.rol_o_pais = $('f-rol').value.trim();
  entrada.mensaje = $('f-mensaje').value.trim();
  entrada.consentimiento_publicar = $('f-consentimiento').checked;

  const errores = validarTestimonio(entrada, {
    cursos: datos.cursos.map((c) => c.id),
    clases: { [datos.testingai.curso]: datos.testingai.clases.map((c) => c.id) },
  }).filter((e) => !e.startsWith('id:'));
  const caja = $('form-errores');
  if (errores.length) {
    caja.replaceChildren(el('p', { text: t('form_errores') }), el('ul', {}, errores.map((e) => el('li', { text: e }))));
    caja.hidden = false;
    $('resultado').hidden = true;
    caja.focus();
    return;
  }
  caja.hidden = true;
  $('f-salida').value = JSON.stringify(entrada, null, 2);
  $('resultado').hidden = false;
  $('estado-copia').textContent = '';
  $('f-salida').focus();
}

async function copiar() {
  const salida = $('f-salida');
  try {
    await navigator.clipboard.writeText(salida.value);
  } catch {
    salida.select();
    document.execCommand('copy');
  }
  $('estado-copia').textContent = t('form_copiado');
}

async function iniciar() {
  await iniciarIdioma();
  if (esDemo()) $('aviso-demo').hidden = false;
  $('enlace-guia').href = GUIA_URL;
  $('enlace-archivo').href = ARCHIVO_DATOS;

  try {
    datos = await cargarDatos();
  } catch (e) {
    $('vacio').hidden = false;
    console.error(e.message);
    return;
  }
  const pedido = estado.params.get('curso');
  if (pedido && datos.cursos.some((c) => c.id === pedido)) vista.curso = pedido;
  pintarTodo();

  $('filtro-curso').addEventListener('change', (e) => { vista.curso = e.target.value; vista.clase = null; pintarTodo(); });
  $('quitar-filtro-clase').addEventListener('click', () => { vista.clase = null; pintarLinea(); pintarDetalle(); pintarMensajes(); $('titulo-mensajes').focus(); });
  $('boton-tema').addEventListener('click', () => { aplicarTema(temaActual() === 'oscuro' ? 'claro' : 'oscuro'); pintarTema(); });
  document.querySelectorAll('[data-idioma]').forEach((b) => b.addEventListener('click', async () => { await cargarIdioma(b.dataset.idioma); pintarTodo(); }));
  $('f-curso').addEventListener('change', pintarClasesForm);
  $('f-mensaje').addEventListener('input', (e) => { $('f-restantes').textContent = String(280 - [...e.target.value].length); });
  $('formulario').addEventListener('submit', armarEntrada);
  $('boton-copiar').addEventListener('click', copiar);
}

iniciar();
