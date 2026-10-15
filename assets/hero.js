/* Anteprima 3D della home. Su computer parte da sola, a pagina caricata e quando il browser è libero.
   Su telefono e tablet al suo posto c'è un'immagine: il 3D (three.js e grafo, circa 260 KB compressi
   e qualche secondo di calcolo) si carica solo se tocchi «Prova l'anteprima 3D». */
(function(){
  var hero = document.getElementById('hero'); if (!hero) return;
  var box = document.getElementById('mapbox'), btn = document.getElementById('try3d');
  var SCRIPTS = ['/assets/vendor/three.min.js', '/assets/graph-data.js', '/assets/map3d.js'];
  var wide = window.matchMedia('(min-width: 901px)');
  var started = false;

  function add(src){
    return new Promise(function(ok, ko){ var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.body.appendChild(s); });
  }
  function start(){
    if (started) return; started = true;
    /* al telefono la mappa prende il posto dell'immagine, nel suo riquadro */
    if (box && !wide.matches) box.appendChild(document.getElementById('net'));
    hero.classList.add('live');
    SCRIPTS.reduce(function(p, src){ return p.then(function(){ return add(src); }); }, Promise.resolve());
  }
  function whenIdle(){ (window.requestIdleCallback || function(f){ setTimeout(f, 200); })(start, { timeout: 2000 }); }

  if (btn) btn.addEventListener('click', start);
  if (wide.matches) { if (document.readyState === 'complete') whenIdle(); else window.addEventListener('load', whenIdle); }
  else if (wide.addEventListener) wide.addEventListener('change', function(e){ if (e.matches) whenIdle(); });
})();
