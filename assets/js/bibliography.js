(function () {
  'use strict';
  var status = document.getElementById('status');
  fetch('../files/lxyang-260205.bib', { cache: 'no-cache' })
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.text();
    })
    .then(function (text) {
      if (!/^\s*@(?:inproceedings|article|misc)\s*\{/i.test(text)) throw new Error('Unexpected bibliography format.');
      document.getElementById('bibliography').textContent = text;
      var entries = text.match(/^@\w+\{/gm) || [];
      status.textContent = entries.length + ' entries';
    })
    .catch(function () {
      status.textContent = 'The text could not be loaded. Please try the Download .bib link.';
    });
}());
