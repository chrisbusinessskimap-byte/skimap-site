/* Comune a tutte le pagine: menu del telefono, barra in alto, vecchi indirizzi con l'ancora. */
(function(){
  var T = window.SKIMAP_T || {};
  /* i vecchi indirizzi della home a sezioni (/#giro, /#beta…) portano alla pagina giusta */
  var R = T.redirects || {};
  function redirect(){ var h = location.hash.slice(1); if (R[h]) { location.replace(R[h]); return true; } }
  if (redirect()) return;
  window.addEventListener('hashchange', redirect);

  var menuBtn = document.getElementById('menu-btn');
  var menu = document.getElementById('mobile-menu');
  var nav = document.getElementById('nav');
  function close(){ menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function(){
      var open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', function(e){ if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && menu.classList.contains('open')) { close(); menuBtn.focus(); } });
  }
  /* sopra la mappa della home la barra è trasparente; scorrendo diventa piena */
  if (nav && document.getElementById('hero')) {
    var solid = function(){ nav.classList.toggle('solid', window.scrollY > 40); };
    window.addEventListener('scroll', solid, { passive:true });
    solid();
  }
})();
