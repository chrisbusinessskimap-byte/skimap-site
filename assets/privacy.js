/* Mostra nell'informativa il paragrafo giusto sulla richiesta di partecipare alla beta:
   senza servizio di form configurato il modulo apre il programma di posta (default, vale anche senza JavaScript);
   con Web3Forms o Formspree configurati si mostra il paragrafo che nomina il servizio. */
(function(){
  var c = window.SKIMAP_CONFIG || {};
  var mode = c.web3formsKey ? 'web3forms' : (c.formspreeUrl ? 'formspree' : 'mail');
  var els = document.querySelectorAll('[data-beta]');
  for (var i = 0; i < els.length; i++) els[i].hidden = els[i].getAttribute('data-beta') !== mode;
})();
