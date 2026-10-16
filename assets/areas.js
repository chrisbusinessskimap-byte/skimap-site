/* Pagina Aree: la cartina dell'Italia. Toccando una regione (sulla cartina o nell'elenco) la cartina si
   stringe a sinistra, al telefono in alto, e compaiono i comprensori di quella regione. Senza JavaScript
   le regioni stanno tutte sotto la cartina, e i link portano lì.
   L'indirizzo segue la scelta (/aree/#veneto), e il tasto indietro del browser torna a tutta l'Italia.
   Vale anche il vecchio indirizzo di un'area (/aree/#livigno): apre la sua regione e porta alla scheda. */
(function(){
  var root = document.querySelector('.it-x');
  if (!root) return;
  var panels = [].slice.call(root.querySelectorAll('.it-region'));
  var ids = panels.map(function(p){ return p.id; });
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* da un indirizzo alla regione da aprire, e alla scheda a cui portare */
  function target(hash){
    var id = hash.replace(/^#/, '');
    if (ids.indexOf(id) >= 0) return { region: id };
    var card = id && document.getElementById(id);
    var panel = card && card.closest && card.closest('.it-region');
    return panel ? { region: panel.id, card: card } : { region: null };
  }

  function apply(t){
    root.classList.toggle('sel', !!t.region);
    panels.forEach(function(p){ p.classList.toggle('on', p.id === t.region); });
    [].forEach.call(root.querySelectorAll('[data-region]'), function(el){
      var on = el.getAttribute('data-region') === t.region;
      if (el.classList.contains('it-reg')) el.classList.toggle('on', on);
      if (el.closest('.it-list')) { if (on) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current'); }
    });
    /* al telefono l'elenco è una riga che scorre di lato: porta in vista la regione scelta, senza muovere la pagina */
    var cur = root.querySelector('.it-list [aria-current]'), row = cur && cur.closest('.it-list');
    if (row && row.scrollWidth > row.clientWidth) row.scrollLeft = cur.parentNode.offsetLeft - 12;
  }

  /* la cartina che si stringe è una transizione di vista, dove il browser la sa fare */
  function show(t, scroll){
    var run = function(){ apply(t); };
    if (document.startViewTransition && !reduce.matches) document.startViewTransition(run); else run();
    if (!scroll) return;
    var to = t.card || (t.region ? document.getElementById(t.region) : root);
    /* al telefono la regione sta sotto la miniatura: si porta in vista il titolo; a computer la cima del blocco */
    if (!t.card && t.region && window.matchMedia('(min-width: 901px)').matches) to = root;
    requestAnimationFrame(function(){ to.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' }); });
  }

  root.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || !root.contains(a)) return;
    var hash = a.getAttribute('href');
    var t = hash === '#elenco' ? { region: null } : target(hash);
    if (hash !== '#elenco' && !t.region) return;
    e.preventDefault();
    if (history.pushState) history.pushState(null, '', t.region ? hash : location.pathname);
    show(t, true);
  });
  window.addEventListener('popstate', function(){ show(target(location.hash), false); });
  window.addEventListener('hashchange', function(){ show(target(location.hash), true); });

  root.classList.add('js');
  var start = target(location.hash);
  apply(start);
  if (start.card) requestAnimationFrame(function(){ start.card.scrollIntoView({ block: 'start' }); });
})();
