/* ============ modulo beta ============
   Le iscrizioni arrivano via email a BETA_TO attraverso un servizio di form esterno
   (Web3Forms o Formspree). La chiave NON sta nel repo: assets/config.js è vuoto e viene
   riscritto alla pubblicazione da un secret (vedi docs/FORM.md).
   Senza configurazione il pulsante apre il programma di posta con l'indirizzo precompilato. */
(function(){
  var T = (window.SKIMAP_T || {}).beta || {};
  var CFG = window.SKIMAP_CONFIG || {};
  var BETA_TO = 'chris.business.skimap@gmail.com';
  var form = document.getElementById('beta-form'); if (!form) return;
  var input = document.getElementById('email');
  var ok = document.getElementById('beta-ok'), err = document.getElementById('beta-err'), btn = document.getElementById('beta-submit');
  var viaMail = document.getElementById('beta-mailto'), bad = document.getElementById('beta-invalid');
  var hp = document.getElementById('botcheck');

  function mailto(email){
    return 'mailto:' + BETA_TO + '?subject=' + encodeURIComponent(T.subject) + '&body=' + encodeURIComponent(T.mailBody(email));
  }
  function busy(on){ btn.disabled = on; btn.textContent = on ? T.sending : T.send; }
  function hideAll(){ ok.hidden = true; err.hidden = true; viaMail.hidden = true; bad.hidden = true; }
  function done(){ hideAll(); ok.hidden = false; form.reset(); busy(false); }
  function fail(){ hideAll(); err.hidden = false; busy(false); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (hp && hp.checked) return;           /* trappola anti-bot: gli umani non la vedono */
    var email = (input.value || '').trim();
    hideAll();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { input.setAttribute('aria-invalid','true'); bad.hidden = false; input.focus(); return; }
    input.removeAttribute('aria-invalid');

    var page = location.href.split('#')[0];
    if (CFG.web3formsKey) {
      busy(true);
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: CFG.web3formsKey,
          subject: T.formSubject,
          from_name: T.fromName,
          email: email,
          message: T.formMessage(email, page),
          botcheck: hp ? hp.checked : false
        })
      }).then(function(r){ return r.json(); }).then(function(j){ if (j && j.success) done(); else fail(); }).catch(fail);
    } else if (CFG.formspreeUrl) {
      busy(true);
      fetch(CFG.formspreeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email, _subject: T.formSubject, message: T.formMessage(email, page) })
      }).then(function(r){ if (r.ok) done(); else fail(); }).catch(fail);
    } else {
      /* Col client di posta non sappiamo se l'email partirà davvero: dipende da Invia, e il
         client potrebbe anche non aprirsi. Quindi niente "Grazie" (sarebbe una promessa), ma
         l'istruzione e l'indirizzo; il campo resta pieno, per chi deve riprovare. */
      window.location.href = mailto(email);
      viaMail.hidden = false;
    }
  });
})();
