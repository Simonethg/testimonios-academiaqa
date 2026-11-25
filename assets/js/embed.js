// Widget para insertar en las landings con un iframe:
// embed.html?curso=testingai-vivo&lang=es&tema=claro&max=6
import { estado, iniciarIdioma, cargarDatos, tarjetaMensaje } from './comun.js';

const $ = (id) => document.getElementById(id);

function avisarAltura() {
  // El sitio que inserta el iframe puede escuchar este mensaje para ajustar la altura.
  if (window.parent !== window) {
    window.parent.postMessage({ tipo: 'testimonios-academiaqa:altura', altura: document.documentElement.scrollHeight }, '*');
  }
}

async function iniciar() {
  await iniciarIdioma();
  if (estado.params.get('titulo') === '0') $('embed-titulo').hidden = true;
  const max = Math.min(Math.max(parseInt(estado.params.get('max') || '6', 10) || 6, 1), 24);
  const curso = estado.params.get('curso');
  try {
    const datos = await cargarDatos();
    const lista = datos.mensajes.filter((m) => !curso || m.curso === curso).slice(0, max);
    $('mensajes').replaceChildren(...lista.map((m, i) => tarjetaMensaje(m, datos, i)));
    $('vacio').hidden = lista.length > 0;
    const enlace = new URL('index.html', window.location.href);
    if (curso) enlace.searchParams.set('curso', curso);
    $('ver-mas').href = enlace.pathname + enlace.search;
  } catch (e) {
    $('vacio').hidden = false;
    console.error(e.message);
  }
  avisarAltura();
  new ResizeObserver(avisarAltura).observe(document.body);
}

iniciar();
