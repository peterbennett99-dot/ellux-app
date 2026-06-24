(function () {
  var script = document.currentScript;
  if (!script) return;

  var origin = new URL(script.src).origin;
  var params = new URLSearchParams();
  ['agent', 'avatar', 'secret', 'voice', 'accent', 'name'].forEach(function (key) {
    var val = script.getAttribute('data-' + key);
    if (val) params.set(key, val);
  });
  params.set('launcher', '1');
  if (script.getAttribute('data-autostart') === '1') params.set('autostart', '1');

  var COLLAPSED = { width: '76px', height: '76px' };
  var EXPANDED = { width: '380px', height: '600px' };

  var iframe = document.createElement('iframe');
  iframe.src = origin + '/embed?' + params.toString();
  iframe.title = script.getAttribute('data-name') || 'AI Assistant';
  iframe.allow = 'camera; microphone; autoplay';
  iframe.style.position = 'fixed';
  iframe.style.bottom = '20px';
  iframe.style.right = '20px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '16px';
  iframe.style.boxShadow = '0 8px 30px rgba(0,0,0,0.35)';
  iframe.style.zIndex = '999999';
  iframe.style.background = 'transparent';
  iframe.style.colorScheme = 'normal';
  iframe.style.width = COLLAPSED.width;
  iframe.style.height = COLLAPSED.height;
  iframe.style.borderRadius = '50%';

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.source !== 'ellux-embed' || e.data.type !== 'resize') return;
    if (e.data.expanded) {
      iframe.style.width = EXPANDED.width;
      iframe.style.height = EXPANDED.height;
      iframe.style.borderRadius = '16px';
    } else {
      iframe.style.width = COLLAPSED.width;
      iframe.style.height = COLLAPSED.height;
      iframe.style.borderRadius = '50%';
    }
  });

  document.body.appendChild(iframe);
})();
