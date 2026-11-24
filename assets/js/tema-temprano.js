// Aplica el tema guardado antes de pintar, para que no parpadee.
(function () {
  try {
    var p = new URLSearchParams(window.location.search).get('tema');
    var g = p === 'claro' || p === 'oscuro' ? p : localStorage.getItem('aqa-tema');
    if (g === 'claro' || g === 'oscuro') document.documentElement.setAttribute('data-tema', g);
  } catch (e) { /* sin almacenamiento */ }
})();
