/* Offline Fraction Desert art experiment. Uses the existing preview art switch. */
(function () {
  'use strict';
  if (!document.querySelector('.demo-strip')) return;
  const A = window.V3Art;
  const scene = A.scene, guide = A.guide;
  const files = {
    desert: 'fraction-desert-painted-backdrop.jpg',
    saff: 'fraction-desert-guide-transparent.webp',
  };
  const file = name => window.FractionDesertPreviewFiles?.[name] ||
    'v3/assets/fraction-desert-preview/' + files[name];

  A.scene = function (id, ...args) {
    const html = scene.call(this, id, ...args);
    if (id !== 'fractions') return html;
    return html.replace('world-fractions', 'world-fractions painted-desert-scene')
      .replace(/^(<div\b[^>]*>)/, '$1' +
        `<img class="painted-desert-backdrop" src="${file('desert')}" alt="" aria-hidden="true" draggable="false" decoding="async">`);
  };
  A.guide = function (name, ...args) {
    const html = guide.call(this, name, ...args);
    if (name !== 'Saff') return html;
    return `<span class="desert-guide-art-comparison"><span class="desert-guide-current-art">${html}</span><img class="desert-guide-painted-art" src="${file('saff')}" alt="Saff, your adult guide" draggable="false" decoding="async"></span>`;
  };
})();
