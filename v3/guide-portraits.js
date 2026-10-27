/* Approved primary guide portraits. Original guides remain available on image failure. */
(function () {
  'use strict';
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
  document.documentElement.dataset.guidePortraits = 'supplied';
  const mark = e => {
    if (!e.target.matches?.('.world-guide-portrait')) return;
    e.target.parentElement.classList.toggle('portrait-ready', e.type === 'load');
  };
  document.addEventListener('load', mark, true);
  document.addEventListener('error', mark, true);
})();
