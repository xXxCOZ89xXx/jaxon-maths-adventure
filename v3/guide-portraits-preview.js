/* Offline guide portraits only. Background art, avatars and saves stay authoritative. */
(function () {
  'use strict';
  const strip = document.querySelector('.demo-strip');
  if (!strip) return;
  const A = window.V3Art, priorGuide = A.guide;
  const files = Object.freeze({
    number: 'number-forest-guide.webp',
    fractions: 'fraction-desert-guide.webp',
    algebra: 'algebra-peaks-guide.webp',
    geometry: 'geometry-kingdom-guide.webp',
    ratio: 'ratio-island-guide.webp',
    statistics: 'statistics-city-guide.webp',
    probability: 'probability-portal-guide.webp',
    measure: 'measurement-mines-guide.webp',
    town: 'practical-maths-town-guide.webp',
  });
  const primaryGuides = Object.fromEntries(V3Engine.worlds.map(w => [w.guide, w.id]));
  const file = world => window.WorldGuidePortraitFiles?.[world] ||
    'v3/assets/world-guide-portraits-preview/' + files[world];
  A.guide = function (name, ...args) {
    const previous = priorGuide.call(this, name, ...args);
    const world = primaryGuides[name];
    if (!files[world]) return previous;
    return `<span class="world-guide-comparison" data-guide-world="${world}"><span class="world-guide-previous">${previous}</span><img class="world-guide-portrait" src="${file(world)}" alt="${A.esc(name)}, your guide" draggable="false" decoding="async"></span>`;
  };
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
