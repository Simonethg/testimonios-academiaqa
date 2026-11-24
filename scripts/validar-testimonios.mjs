// Valida data/testimonios.json. Se corre en cada Pull Request (GitHub Actions)
// y a mano con: npm run validar
import { readFile } from 'node:fs/promises';
import { validarLista } from '../assets/js/validar.js';

const raiz = new URL('../', import.meta.url);
const leer = async (ruta) => JSON.parse(await readFile(new URL(ruta, raiz), 'utf8'));

async function main() {
  const archivo = process.argv[2] || 'data/testimonios.json';
  let lista;
  try {
    lista = await leer(archivo);
  } catch (e) {
    console.error(`✗ ${archivo} no es un JSON válido: ${e.message}`);
    process.exit(1);
  }
  const cursos = (await leer('data/cursos.json')).map((c) => c.id);
  const testingai = await leer('data/clases-testingai.json');
  const clases = { [testingai.curso]: testingai.clases.map((c) => c.id) };
  const hoy = new Date().toISOString().slice(0, 10);

  const problemas = validarLista(lista, { cursos, clases, hoy });
  if (problemas.length) {
    console.error(`✗ ${archivo}: ${problemas.length} entrada(s) con problemas`);
    for (const p of problemas) {
      console.error(`  · posición ${p.indice}${p.id ? ` (id ${p.id})` : ''}`);
      for (const e of p.errores) console.error(`      - ${e}`);
    }
    process.exit(1);
  }
  console.log(`✓ ${archivo}: ${lista.length} entrada(s) válidas`);
}

main();
