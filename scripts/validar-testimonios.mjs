// Valida cada archivo de data/testimonios/<curso>/. Se corre en cada Pull Request
// (GitHub Actions) y a mano con: npm run validar
// Con un argumento valida un archivo de lista, por ejemplo: node scripts/validar-testimonios.mjs data/testimonios.json
import { contexto, leerJSON, leerTestimonios } from './datos.mjs';
import { validarLista } from '../assets/js/validar.js';

const ctx = await contexto();
const archivoLista = process.argv[2];

if (archivoLista) {
  const problemas = validarLista(await leerJSON(archivoLista), ctx);
  if (problemas.length) {
    console.error(`✗ ${archivoLista}: ${problemas.length} entrada(s) con problemas`);
    for (const p of problemas) console.error(`  · posición ${p.indice}: ${p.errores.join('; ')}`);
    process.exit(1);
  }
  console.log(`✓ ${archivoLista}: todas las entradas son válidas`);
} else {
  const { entradas, problemas } = await leerTestimonios(ctx);
  if (problemas.length) {
    console.error(`✗ ${problemas.length} archivo(s) con problemas:`);
    for (const p of problemas) {
      console.error(`  · ${p.ruta}`);
      for (const e of p.errores) console.error(`      - ${e}`);
    }
    process.exit(1);
  }
  console.log(`✓ data/testimonios/: ${entradas.length} mensaje(s) válidos`);
}
