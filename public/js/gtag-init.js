// Disable GA on non-production hosts to avoid polluting analytics
(function(){
  var host = (location.hostname || '').toLowerCase();
  var prod = host === 'svhvac.com' || host === 'www.svhvac.com';
  window['ga-disable-G-2GNW86D06Y'] = !prod;
})();

window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-2GNW86D06Y');

