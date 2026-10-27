/* Offline Test Camp presentation experiment. No save, avatar or cloud changes. */
(function () {
  'use strict';
  if (!document.querySelector('.demo-strip')) return;
  const A = window.V3Art;
  const scene = A.scene, guide = A.guide;
  const files = {
    forest: 'number-forest-painted-backdrop.jpg',
    rowan: 'rowan-guide-portrait-transparent.webp',
  };
  const file = name => window.PaintedForestPreviewFiles?.[name] ||
    'v3/assets/painted-forest-preview/' + files[name];

  A.scene = function (id, ...args) {
    const html = scene.call(this, id, ...args);
    if (id !== 'number') return html;
    // Preserve the original scene image and all live restoration/object layers.
    return html.replace('world-number', 'world-number painted-forest-scene')
      .replace(/^(<div\b[^>]*>)/, '$1' +
        `<img class="painted-forest-backdrop" src="${file('forest')}" alt="" aria-hidden="true" draggable="false" decoding="async">`);
  };
  A.guide = function (name, ...args) {
    const html = guide.call(this, name, ...args);
    if (name !== 'Rowan') return html;
    return `<span class="rowan-art-comparison"><span class="rowan-current-art">${html}</span><img class="rowan-painted-art" src="${file('rowan')}" alt="Rowan, your adult guide" draggable="false" decoding="async"></span>`;
  };

  const label = document.createElement('label');
  label.className = 'painted-art-control';
  label.append('Development art preview ');
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Compare Number Forest artwork');
  for (const [value, text] of [['painted', 'Painted forest + Rowan'], ['current', 'Current artwork']]) {
    const option = document.createElement('option');
    option.value = value; option.textContent = text; select.append(option);
  }
  // URL-only preference: never add development preferences to learner saves.
  select.value = new URLSearchParams(location.search).get('art') === 'current' ? 'current' : 'painted';
  function apply() {
    document.documentElement.dataset.forestArt = select.value;
  }
  select.addEventListener('change', apply);
  apply();
  label.append(select);
  document.querySelector('.demo-strip').append(label);
})();
