/* Renders the uniform sport setup stub from the shared sports config (sports-config.js). */
(function () {
  var el = document.getElementById('sport-app'); if (!el || !window.TheReadSports) return;
  var s = window.TheReadSports.get(el.getAttribute('data-sport'));
  el.innerHTML = s ? window.TheReadSports.stub(s) : '<p>Sport not found.</p>';
})();
