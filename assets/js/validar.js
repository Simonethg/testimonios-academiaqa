// Reglas compartidas por la página, el embed y la validación del PR (Node).
// Sin dependencias, para que funcione igual en el navegador y en GitHub Actions.

export const LIMITES = Object.freeze({
  mensajeMin: 10,
  mensajeMax: 280,
  nombreMax: 40,
  rolMax: 40,
  cohorteMax: 20,
});

const CAMPOS_PERMITIDOS = new Set([
  'id', 'curso', 'cohorte', 'fecha', 'clase_relacionada',
  'nombre_visible', 'rol_o_pais', 'mensaje', 'consentimiento_publicar',
]);
const OBLIGATORIOS = ['id', 'curso', 'cohorte', 'fecha', 'nombre_visible', 'mensaje', 'consentimiento_publicar'];

const RE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const RE_EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const RE_TELEFONO = /(?:\+?\d[\s().-]?){8,}/;
const RE_URL = /(?:https?:\/\/|www\.)\S+/i;
const RE_HTML = /[<>]/;

function fechaValida(texto) {
  if (typeof texto !== 'string' || !RE_FECHA.test(texto)) return false;
  const d = new Date(`${texto}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

function textoLimpio(valor, campo, max, errores, min = 1) {
  if (typeof valor !== 'string') { errores.push(`${campo}: tiene que ser texto`); return; }
  const largo = [...valor.trim()].length;
  if (largo < min) errores.push(`${campo}: tiene que tener al menos ${min} caracteres`);
  if (largo > max) errores.push(`${campo}: tiene ${largo} caracteres y el máximo es ${max}`);
  if (RE_HTML.test(valor)) errores.push(`${campo}: no puede tener < ni >`);
  if (RE_EMAIL.test(valor)) errores.push(`${campo}: no puede tener un email`);
  if (RE_TELEFONO.test(valor)) errores.push(`${campo}: no puede tener un teléfono`);
  if (RE_URL.test(valor)) errores.push(`${campo}: no puede tener links`);
}

/**
 * Valida una entrada. Devuelve la lista de errores (vacía si está bien).
 * @param {object} t entrada
 * @param {{cursos?: string[], clases?: Record<string,string[]>, hoy?: string}} ctx
 */
export function validarTestimonio(t, ctx = {}) {
  const errores = [];
  if (t === null || typeof t !== 'object' || Array.isArray(t)) return ['la entrada tiene que ser un objeto'];

  for (const campo of Object.keys(t)) {
    if (!CAMPOS_PERMITIDOS.has(campo)) errores.push(`${campo}: campo no permitido`);
  }
  for (const campo of OBLIGATORIOS) {
    if (!(campo in t)) errores.push(`${campo}: falta el campo`);
  }

  if ('id' in t && (typeof t.id !== 'string' || !RE_ID.test(t.id) || t.id.length > 60)) {
    errores.push('id: solo minúsculas, números y guiones (máximo 60)');
  }
  if ('curso' in t) {
    if (typeof t.curso !== 'string') errores.push('curso: tiene que ser texto');
    else if (ctx.cursos && !ctx.cursos.includes(t.curso)) errores.push(`curso: «${t.curso}» no está en data/cursos.json`);
  }
  if ('cohorte' in t) textoLimpio(t.cohorte, 'cohorte', LIMITES.cohorteMax, errores);
  if ('fecha' in t) {
    if (!fechaValida(t.fecha)) errores.push('fecha: formato AAAA-MM-DD');
    else if (ctx.hoy && t.fecha > ctx.hoy) errores.push('fecha: no puede ser futura');
  }
  if ('clase_relacionada' in t) {
    const clases = ctx.clases && ctx.clases[t.curso];
    if (typeof t.clase_relacionada !== 'string') errores.push('clase_relacionada: tiene que ser texto');
    else if (clases && !clases.includes(t.clase_relacionada)) errores.push(`clase_relacionada: «${t.clase_relacionada}» no existe para ese curso`);
  }
  if ('nombre_visible' in t) textoLimpio(t.nombre_visible, 'nombre_visible', LIMITES.nombreMax, errores);
  if ('rol_o_pais' in t) textoLimpio(t.rol_o_pais, 'rol_o_pais', LIMITES.rolMax, errores);
  if ('mensaje' in t) textoLimpio(t.mensaje, 'mensaje', LIMITES.mensajeMax, errores, LIMITES.mensajeMin);
  if ('consentimiento_publicar' in t && t.consentimiento_publicar !== true) {
    errores.push('consentimiento_publicar: tiene que ser true para poder publicarse');
  }
  return errores;
}

/** Valida la lista completa (incluye ids repetidos). */
export function validarLista(lista, ctx = {}) {
  if (!Array.isArray(lista)) return [{ indice: -1, errores: ['el archivo tiene que ser una lista [ ]'] }];
  const vistos = new Set();
  const resultado = [];
  lista.forEach((t, indice) => {
    const errores = validarTestimonio(t, ctx);
    if (t && typeof t.id === 'string') {
      if (vistos.has(t.id)) errores.push(`id: «${t.id}» está repetido`);
      vistos.add(t.id);
    }
    if (errores.length) resultado.push({ indice, id: t && t.id, errores });
  });
  return resultado;
}

/** Lo que se muestra: solo entradas válidas y con consentimiento. */
export function publicables(lista, ctx = {}) {
  if (!Array.isArray(lista)) return [];
  return lista.filter((t) => validarTestimonio(t, ctx).length === 0);
}

/**
 * Reglas del archivo individual: data/testimonios/<curso>/<fecha>-<slug>.json
 * El id tiene que ser el nombre del archivo sin .json, la carpeta tiene que ser
 * el curso y el nombre tiene que empezar con la fecha.
 */
export function validarRuta(ruta, t) {
  const errores = [];
  const m = /^data\/testimonios\/([a-z0-9-]+)\/(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/.exec(ruta);
  if (!m) return [`${ruta}: la ruta tiene que ser data/testimonios/<curso>/<AAAA-MM-DD>-<tu-nombre>.json`];
  const [, carpeta, fecha] = m;
  const nombre = ruta.split('/').pop().replace(/\.json$/, '');
  if (t && typeof t === 'object') {
    if (t.curso !== carpeta) errores.push(`${ruta}: la carpeta (${carpeta}) no coincide con el curso (${t.curso})`);
    if (t.fecha !== fecha) errores.push(`${ruta}: la fecha del nombre (${fecha}) no coincide con el campo fecha (${t.fecha})`);
    if (t.id !== nombre) errores.push(`${ruta}: el id tiene que ser «${nombre}»`);
  }
  return errores;
}
