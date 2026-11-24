// Tests de las reglas (particiones de equivalencia y valores límite). Correr: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { validarTestimonio, validarLista, publicables, LIMITES } from '../assets/js/validar.js';

const ctx = { cursos: ['testingai-vivo', 'carrera-qa-ia'], clases: { 'testingai-vivo': ['clase-08'] }, hoy: '2026-11-23' };
const base = () => ({
  id: 'ana-clase-08', curso: 'testingai-vivo', cohorte: '2026-10', fecha: '2026-11-23',
  clase_relacionada: 'clase-08', nombre_visible: 'Ana', rol_o_pais: 'QA · Argentina',
  mensaje: 'Aprendí a investigar un bug con SQL.', consentimiento_publicar: true,
});

test('entrada correcta pasa', () => assert.deepEqual(validarTestimonio(base(), ctx), []));
test('mensaje de 280 pasa y de 281 no', () => {
  assert.deepEqual(validarTestimonio({ ...base(), mensaje: 'a'.repeat(LIMITES.mensajeMax) }, ctx), []);
  assert.equal(validarTestimonio({ ...base(), mensaje: 'a'.repeat(LIMITES.mensajeMax + 1) }, ctx).length, 1);
});
test('mensaje de 9 no pasa y de 10 sí', () => {
  assert.equal(validarTestimonio({ ...base(), mensaje: 'a'.repeat(9) }, ctx).length, 1);
  assert.deepEqual(validarTestimonio({ ...base(), mensaje: 'a'.repeat(10) }, ctx), []);
});
test('sin consentimiento no se publica', () => {
  assert.ok(validarTestimonio({ ...base(), consentimiento_publicar: false }, ctx).length);
  assert.equal(publicables([{ ...base(), consentimiento_publicar: false }], ctx).length, 0);
});
test('rechaza email, teléfono, links y HTML', () => {
  for (const m of ['escribime a ana@mail.com ya', 'llamame al +54 11 5555 5555', 'mirá https://x.com/a', 'hola <img src=x onerror=alert(1)>']) {
    assert.ok(validarTestimonio({ ...base(), mensaje: m }, ctx).length, m);
  }
});
test('rechaza campos extra, curso desconocido, clase inexistente y fecha futura', () => {
  assert.ok(validarTestimonio({ ...base(), email: 'x' }, ctx).length);
  assert.ok(validarTestimonio({ ...base(), curso: 'otro' }, ctx).length);
  assert.ok(validarTestimonio({ ...base(), clase_relacionada: 'clase-99' }, ctx).length);
  assert.ok(validarTestimonio({ ...base(), fecha: '2026-11-24' }, ctx).length);
  assert.ok(validarTestimonio({ ...base(), fecha: '2026-02-30' }, ctx).length);
});
test('ids repetidos se marcan', () => assert.equal(validarLista([base(), base()], ctx).length, 1));
test('archivo que no es lista', () => assert.equal(validarLista({}, ctx).length, 1));

import { validarRuta } from '../assets/js/validar.js';
const ruta = 'data/testimonios/testingai-vivo/2026-11-23-ana.json';
const conRuta = () => ({ ...base(), id: '2026-11-23-ana' });
test('ruta correcta pasa', () => assert.deepEqual(validarRuta(ruta, conRuta()), []));
test('carpeta distinta del curso falla', () => assert.ok(validarRuta('data/testimonios/carrera-qa-ia/2026-11-23-ana.json', conRuta()).length));
test('id distinto del nombre de archivo falla', () => assert.ok(validarRuta(ruta, base()).length));
test('fecha del nombre distinta del campo falla', () => assert.ok(validarRuta('data/testimonios/testingai-vivo/2026-11-22-ana.json', { ...conRuta(), id: '2026-11-22-ana' }).length));
test('ruta fuera de data/testimonios falla', () => {
  assert.ok(validarRuta('data/otro/2026-11-23-ana.json', conRuta()).length);
  assert.ok(validarRuta('data/testimonios/testingai-vivo/../../index.html', conRuta()).length);
});
