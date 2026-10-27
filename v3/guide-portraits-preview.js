/* Offline comparison control; the shared renderer supplies the approved guides. */
(function () {
  'use strict';
  const strip = document.querySelector('.demo-strip');
  if (!strip) return;
  const label = document.createElement('label');
  label.className = 'painted-art-control';
  label.append('Guide portraits ');
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Compare guide portraits');
  for (const [value, text] of [['supplied', 'New world guides'], ['previous', 'Previous guides']]) {
    const option = document.createElement('option');
    option.value = value; option.textContent = text; select.append(option);
  }
  select.value = new URLSearchParams(location.search).get('guides') === 'previous' ? 'previous' : 'supplied';
  const apply = () => { document.documentElement.dataset.guidePortraits = select.value; };
  select.addEventListener('change', apply); apply();
  label.append(select); strip.append(label);
})();
