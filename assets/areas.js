/* Pagina Aree: le cinque aree sono schede. Toccandone una, a destra (sotto, al telefono) compaiono
   anteprima e numeri. Senza JavaScript le schede restano tutte visibili, una sotto l'altra.
   L'indirizzo segue la scelta (/aree/#livigno), così un'area si può linkare. */
(function(){
  var tabs = [].slice.call(document.querySelectorAll('.area-tab'));
  if (!tabs.length) return;
  var panels = tabs.map(function(t){ return document.getElementById(t.getAttribute('aria-controls')); });
  var root = document.querySelector('.areas-x');

  function select(i, focus, fromHash){
    tabs.forEach(function(t, k){
      var on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
    });
    if (focus) tabs[i].focus({ preventScroll: true });
    /* al telefono le schede sono una riga che scorre di lato: porta in vista quella scelta, senza muovere la pagina */
    var row = tabs[i].parentNode;
    if (row.scrollWidth > row.clientWidth) row.scrollTo({ left: tabs[i].offsetLeft - 16, behavior: fromHash ? 'auto' : 'smooth' });
    if (!fromHash && history.replaceState) history.replaceState(null, '', '#' + panels[i].id);
  }
  function fromHash(){
    var id = location.hash.slice(1);
    for (var k = 0; k < panels.length; k++) if (panels[k].id === id) return k;
    return -1;
  }

  tabs.forEach(function(t, i){
    t.addEventListener('click', function(){ select(i, false); });
    t.addEventListener('keydown', function(e){
      var n = tabs.length, j = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = n - 1;
      if (j < 0) return;
      e.preventDefault(); select(j, true);
    });
  });
  window.addEventListener('hashchange', function(){ var k = fromHash(); if (k >= 0) select(k, false, true); });

  root.classList.add('js');
  var start = fromHash();
  select(start >= 0 ? start : 0, false, true);
})();
