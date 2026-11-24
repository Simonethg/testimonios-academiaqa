// Junta los archivos de data/testimonios/<curso>/ en data/testimonios.json,
// el archivo público que leen la página, el widget y los otros sitios.
// Lo corre la acción de GitHub Pages en cada cambio de main, y a mano: npm run generar
import { writeFile } from 'node:fs/promises';
import { contexto, leerTestimonios, raiz } from './datos.mjs';

const { entradas, problemas } = await leerTestimonios(await contexto());
if (problemas.length) {
  console.error(`✗ Hay ${problemas.length} archivo(s) inválidos. Corré npm run validar para ver el detalle.`);
  process.exit(1);
}
await writeFile(new URL('data/testimonios.json', raiz), `${JSON.stringify(entradas, null, 2)}\n`);
console.log(`✓ data/testimonios.json generado con ${entradas.length} mensaje(s)`);
