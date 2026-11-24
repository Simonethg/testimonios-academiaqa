// Dónde va a vivir el repo público. Cambiar acá si el nombre final es otro.
export const REPO_URL = 'https://github.com/Simonethg/testimonios-academiaqa';
// Abre el editor de GitHub para crear un archivo nuevo en la carpeta del curso.
// GitHub completa el nombre (filename) y el contenido (value) del archivo.
export const crearArchivoURL = (curso, nombre, contenido) => `${REPO_URL}/new/main/data/testimonios/${encodeURIComponent(curso)}?filename=${encodeURIComponent(nombre)}&value=${encodeURIComponent(contenido)}`;
export const GUIA_URL = `${REPO_URL}/blob/main/CONTRIBUTING.md`;
export const SITIO_URL = 'https://www.simonethg.com';
