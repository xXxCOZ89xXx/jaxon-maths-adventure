/* Original SVG artwork. No external assets or requests. */
(function () {
  "use strict";
  const E = window.V3Engine,
    C = window.V3Curriculum;
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  function tree(x, y, k = 1) {
    return `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-5 0h10v-48H-5" fill="#715943"/><path d="M0-113l-32 48h15l-25 34h84L17-65h15z" fill="#2b654c"/><path d="M0-113v82h42L17-65h15z" fill="#3f8960"/><path d="M0-113l-32 48h15l-25 34h12L9-69H-4L15-92z" fill="#78ad70" opacity=".6"/></g>`;
  }
  function building(x, y, h = 60, color = "#dfcbb0") {
    return `<g transform="translate(${x} ${y})"><path d="M-27 0v-${h}l27-15 28 15v${h}L0 16z" fill="${color}"/><path d="M0 16v-${h}l28-${15}v${h}z" fill="#000" opacity=".14"/><path d="M-27-${h}L0-${h + 15}l28 15L0-${h - 15}z" fill="#f5eedb"/><path d="M-17-${h - 19}h9v15h-9zM9-${h - 17}h9v15H9z" fill="#7dafb3"/></g>`;
  }
  function explorer(s, inline = false) {
    const equipped = C.catalog.filter(
      (x) => s.equipped.includes(x.id) && s.bought.includes(x.id),
    );
    const slot = (n) => equipped.find((x) => x.slot === n);
    const head = slot("Headwear"),
      outfit = slot("Outfits"),
      back = slot("Back items"),
      acc = slot("Accessories"),
      pet = slot("Companions"),
      bg = slot("Backgrounds");
    const hue = outfit ? C.catalog.indexOf(outfit) * 32 : 150;
    return `<svg class="explorer ${inline ? "inline-explorer" : ""}" viewBox="0 0 180 210" role="img" aria-label="Explorer wearing ${esc(equipped.map((x) => x.label).join(", ") || "starter outfit")}"><ellipse cx="87" cy="192" rx="56" ry="11" fill="#153f32" opacity=".15"/>${bg ? `<path d="M15 30h150v150H15z" fill="hsl(${C.catalog.indexOf(bg) * 28} 25% 83%)"/>` : ""}${back ? `<path d="M111 87h33v65h-33z" fill="#b89657"/><text x="125" y="120" font-size="25">${back.ico}</text>` : ""}<path d="M56 146h27v43H55zM92 146h26v43H92z" fill="#354c55"/><path d="M50 182h34v14H48zM92 182h33v14H92z" fill="#243e3b"/><path d="M51 86h69v69H51z" fill="hsl(${hue} 36% 39%)"/><path d="M51 86h69v15H51z" fill="hsl(${hue} 40% 53%)"/><path d="M36 93h18v55H36zM119 93h18v55h-18z" fill="#bb9c7c"/><path d="M36 93h18v29H36zM119 93h18v29h-18z" fill="hsl(${hue} 36% 39%)"/><path d="M61 42h50v47H61z" fill="#d4b28b"/><path d="M57 36h58v22H57zM57 51h10v18H57z" fill="#493e31"/><path d="M72 61h6v7h-6zM96 61h6v7h-6z" fill="#243e3b"/><path d="M82 78h12" stroke="#906b50" stroke-width="3"/>${head ? `<path d="M54 30h64v23H54z" fill="hsl(${C.catalog.indexOf(head) * 37} 42% 48%)"/><text x="68" y="46" font-size="24">${head.ico}</text>` : ""}${acc ? `<text x="61" y="125" font-size="30">${acc.ico}</text>` : ""}${pet ? `<text x="129" y="184" font-size="33">${pet.ico}</text>` : ""}<path d="M54 132h64v8H54z" fill="#bcab77"/><path d="M78 129h13v14H78z" fill="#e8c478"/></svg>`;
  }
  function townScene(level = 0, settled = 0, done = []) {
    const names = [
        "Market",
        "Café",
        "Bank",
        "Shops",
        "Station",
        "Home",
        "Cinema",
        "Workshop",
      ],
      colors = [
        "#c38e67",
        "#6e9988",
        "#8a9da6",
        "#b58f9d",
        "#7d97b0",
        "#bdab7b",
        "#9b8cae",
        "#8a9c73",
      ];
    return `<svg class="world-scene town-scene" viewBox="0 0 780 460" role="img" aria-label="Practical Maths Town, ${level} of 3 restoration stages, ${settled} visits completed"><path d="M0 0h780v460H0z" fill="#e6dfca"/><circle cx="688" cy="55" r="27" fill="#fff6dc"/><path d="M34 106h712v318H34z" fill="#a8b991"/><path d="M34 252h712v48H34zM363 106h51v318h-51z" fill="#d1c3a2"/><path d="M34 274h712M389 106v318" stroke="#e9e0c7" stroke-width="3" stroke-dasharray="12 12"/>${names
      .map((name, i) => {
        const x = 108 + (i % 4) * 183,
          y = i < 4 ? 205 : 365,
          open =
            done.includes(window.V3Town.venues[i].id) ||
            level >= (i < 3 ? 1 : i < 6 ? 2 : 3);
        return `<g transform="translate(${x} ${y})"><path d="M-52 0v-72l52-23 53 23V0L0 20z" fill="${open ? colors[i] : "#aba99a"}"/><path d="M0 20v-72l53-20V0z" fill="#203d33" opacity=".13"/><path d="M-52-72L0-95l53 23L0-50z" fill="#f5ead2"/><path d="M-47-44h43v24h-43z" fill="${open ? "#d7e6d4" : "#c5c5b4"}"/><path d="M14-35h25v38H14z" fill="#536b60"/><path d="M-58-51l62 23v12l-62-22z" fill="${open ? "#ead7a1" : "#b5b29d"}"/><path d="M-41-44l8 3v12l-8-3zM-20-36l8 3v12l-8-3z" fill="${open ? colors[i] : "#858d7d"}"/><text x="0" y="39" text-anchor="middle" fill="#203d33" font-size="15" font-family="system-ui" font-weight="750">${name}</text>${open ? '<path d="M40-88v-28h17l-5 8 5 8H40" fill="#587b58"/>' : ""}</g>`;
      })
      .join(
        "",
      )}${level >= 2 ? '<path d="M44 404h690" stroke="#d8e8b8" stroke-width="7"/>' : ""}${level >= 3 ? '<path d="M45 82h690" stroke="#6a8761" stroke-width="3"/><path d="M80 82l12 21 12-21m70 0l12 21 12-21m70 0l12 21 12-21m70 0l12 21 12-21m70 0l12 21 12-21m70 0l12 21 12-21" fill="#cc9865"/>' : ""}<path d="M376 273h24v20h-24z" fill="#5c8565"/><path d="M380 260h16v14h-16z" fill="#c6a57f"/></svg>`;
  }
  function scene(id, level = 0, before = false, settled = 0) {
    const w = E.worlds.find((w) => w.id === id) || E.worlds[0];
    const l = before ? 0 : level;
    const style = `--scene-sky:${w.sky}`;
    if (id === "town") return townScene(l, before ? 0 : settled);
    let props = "";
    if (id === "number") {
      props =
        tree(165, 255, 1.15) +
        tree(248, 226, 0.8) +
        tree(573, 273, 1.15) +
        tree(633, 307, 0.8) +
        tree(135, 321, 0.7) +
        (l >= 2
          ? tree(530, 350, 0.8)
          : '<path d="M520 350v-55m0 20l-17-16m17 4l14-20" stroke="#746f55" stroke-width="8"/>') +
        (l >= 3
          ? building(400, 225, 50, "#c5a577")
          : '<path d="M370 231h60v-14h-60z" fill="#aba795"/>');
    }
    if (id === "fractions") {
      props =
        '<path d="M167 279l67-102 65 102zM488 263l58-89 62 89z" fill="#dfbd7b"/>' +
        building(589, 300, l >= 3 ? 70 : 20, "#d6b472") +
        (l >= 2
          ? '<ellipse cx="290" cy="300" rx="70" ry="25" fill="#65bab8"/>' +
            tree(240, 286, 0.65)
          : '<ellipse cx="290" cy="300" rx="70" ry="25" fill="#a98a54"/>');
    }
    if (id === "algebra") {
      props =
        '<path d="M126 290l112-161 91 161zM458 275l107-160 100 160z" fill="#94a6b5"/><path d="M209 171l29-42 29 51-32-10zM535 159l30-44 33 49-29-12z" fill="#f7f5e9"/>' +
        building(405, 265, l >= 1 ? 75 : 35, "#a0acb7") +
        `<path d="M342 225h22v75h-22" fill="${l >= 2 ? "#e9c877" : "#738594"}"/>`;
    }
    if (id === "algebra" && l >= 3)
      props +=
        '<path d="M440 225v-64h55v64m-55-55h55" fill="none" stroke="#ecd48f" stroke-width="12"/>';
    if (id === "geometry") {
      props =
        building(210, 290, l >= 2 ? 115 : 30, "#c3b4cc") +
        building(540, 280, l >= 3 ? 115 : 30, "#c3b4cc") +
        building(380, 250, l >= 1 ? 75 : 20, "#dfcbd4");
    }
    if (id === "ratio") {
      props =
        '<ellipse cx="265" cy="290" rx="91" ry="45" fill="#e8d79e"/>' +
        tree(209, 265, 0.7) +
        `<path d="M466 276h130v20H466zM484 296v34M574 296v34" fill="${l >= 2 ? "#ba9973" : "#8d9282"}" stroke="#796c57" stroke-width="8"/>` +
        (l >= 3
          ? '<path d="M440 345h95l-17 20h-58z" fill="#f2ead0"/><path d="M486 345v-70l40 61h-40" fill="#f1c47c"/>'
          : "");
    }
    if (id === "statistics") {
      props =
        [200, 280, 480, 560]
          .map((x, i) =>
            building(
              x,
              280 + (i % 2) * 28,
              45 + (l ? i * 16 : 0),
              l >= 2 ? "#bed5b5" : "#9ba5ae",
            ),
          )
          .join("") + building(390, 235, l >= 3 ? 110 : 20, "#d9c7a5");
    }
    if (id === "probability") {
      props =
        `<ellipse cx="390" cy="238" rx="65" ry="92" fill="${l >= 3 ? "#b89be9" : "#9c8cae"}" stroke="#d8c9e3" stroke-width="18"/><ellipse cx="390" cy="238" rx="39" ry="64" fill="${l >= 1 ? "#dee2f7" : "#756584"}"/>` +
        [180, 580]
          .map((x) => building(x, 300, l >= 2 ? 55 : 20, "#b8a3c7"))
          .join("");
    }
    if (id === "measure") {
      props =
        '<path d="M132 295l96-152 94 152zM462 285l105-153 96 153z" fill="#b4a18d"/>' +
        `<path d="M242 287v-55a32 32 0 0164 0v55" fill="#514e49"/><path d="M260 290l-37 72m64-72l-22 72" stroke="#dac9a8" stroke-width="6"/>` +
        (l >= 1 ? '<path d="M225 320h44l-7 24h-30z" fill="#a8b9ac"/>' : "") +
        (l >= 2 ? '<circle cx="275" cy="220" r="9" fill="#ffe7a1"/>' : "");
    }
    if (id === "measure" && l >= 3)
      props +=
        '<path d="M463 285v-104h61v104m-61-91h61" fill="none" stroke="#d7c49a" stroke-width="8"/><path d="M473 230h42v25h-42z" fill="#b8c5a8"/>';
    return `<svg class="world-scene" viewBox="0 0 780 460" style="${style}" role="img" aria-label="${esc(w.name)}: ${l === 0 ? "before restoration" : l + " of 3 landmarks restored"}"><path d="M0 0h780v460H0z" fill="${w.sky}"/><circle cx="648" cy="76" r="34" fill="#fff9df" opacity=".8"/><g fill="#fff" opacity=".45"><path d="M80 80h115v16H80zM102 64h62v16h-62zM440 58h111v14H440zM464 44h57v14h-57z"/></g><path d="M58 288L370 143l347 139-316 158z" fill="${w.ground}"/><path d="M58 288v39l343 151v-38z" fill="#5c6652"/><path d="M401 440v38l316-157v-39z" fill="#414f44"/><path d="M58 288l312-145 347 139-316 158z" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="3"/><path d="M321 181l-38 40 27 28-25 33 62 33-21 35 75 38 49-25-79-38 24-32-62-34 23-30-25-20 36-18z" fill="${id === "fractions" && l === 0 ? "#a88c5a" : "#74b7c1"}"/><path d="M167 335l86-45 32 12 64 29 55-28 136 61" fill="none" stroke="#d4c49a" stroke-width="23"/>${l >= 1 ? '<path d="M278 306l67 32 42-21" fill="none" stroke="#e7cf9e" stroke-width="26"/><path d="M279 292l67 31 42-21m-109 5v-25m67 56v-25m42 5v-26" fill="none" stroke="#8b7351" stroke-width="5"/>' : '<path d="M284 309l12 6m74 10l12-6" stroke="#8b7351" stroke-width="14"/>'}${props}${!before && settled >= 1 ? building(660, 357, 20 + Math.min(4, settled) * 8, "#d5c491") : ""}${!before && settled >= 4 ? '<path d="M145 355l20-9 20 9v18h-40z" fill="#d0b989"/>' : ""}${!before && settled >= 8 ? '<path d="M190 190h40v9h-40zM208 152h5v38h-5zM213 152h27l-7 10 7 10h-27" fill="#e8ce92"/>' : ""}<g transform="translate(424 341)"><ellipse cy="23" rx="17" ry="6" fill="#294d3a" opacity=".3"/><path d="M-8 4h7v19h-7zM3 4h7v19H3z" fill="#374d50"/><path d="M-11-21h24V7h-24z" fill="#e4bd6f"/><path d="M-7-38h17v17H-7z" fill="#cfac83"/><path d="M-9-43h22v9H-9z" fill="#576c4c"/></g><g fill="#e4d6b0"><path d="M110 309h11v7h-11zM580 340h13v8h-13zM474 212h10v6h-10z"/></g></svg>`;
  }
  function camp(s) {
    const n = s.milestones.length,
      projects = window.V3Adventure.state(s).campProjects,
      placements = window.V3Adventure.state(s).camp,
      keepsakes = window.V3Adventure.collections(s);
    const decorations = Object.entries(placements)
      .filter(([slot, id]) => id)
      .map(([slot, id], i) => {
        const c = keepsakes.find((c) => c.id === id);
        return c
          ? `<g transform="translate(${[320, 155, 545][["shelf", "garden", "gate"].indexOf(slot)]} ${slot === "garden" ? 280 : slot === "gate" ? 345 : 185})"><title>${esc(c.name)} at camp ${slot}</title><path d="M0-16l12 8-12 8-12-8z" fill="#f2d496" stroke="#5e7953" stroke-width="3"/></g>`
          : "";
      })
      .join("");
    return `<svg class="camp-scene" viewBox="0 0 680 370" role="img" aria-label="Base Camp with ${n} learning landmarks earned"><path d="M0 0h680v370H0z" fill="#d4e3c8"/><circle cx="566" cy="66" r="29" fill="#fff6d5"/><path d="M0 300L250 146l430 140v84H0z" fill="#92ac79"/><path d="M0 338l280-93 400 83" fill="none" stroke="#d7c69a" stroke-width="34"/>${tree(100, 244, 0.9)}${tree(584, 280, 1.05)}${tree(535, 188, 0.65)}<path d="M177 289l75-110 82 110z" fill="#d9b875"/><path d="M252 179v110h82z" fill="#b68c58"/><path d="M231 289l21-64 23 64z" fill="#5d634c"/><path d="M177 289l-10 12m167-12l10 12" stroke="#5d634c" stroke-width="3"/>${n >= 1 ? [354, 448].map((x, i) => `<path d="M${x} ${320 - i * 9}v-67" stroke="#6b7154" stroke-width="5"/><path d="M${x - 10} ${260 - i * 5}h20v24h-20z" fill="#f6d991" stroke="#8f7848" stroke-width="3"/>`).join("") : ""}${n >= 3 ? building(415, 223, 55, "#c6a779") : ""}${n >= 6 ? '<path d="M127 324l55-28 55 18-55 29z" fill="#6f8250"/><path d="M148 323l34-15m-16 25l34-15" stroke="#a5bc6c" stroke-width="9"/>' : ""}${n >= 12 ? '<path d="M487 313h57v30h-57z" fill="#b3956c"/><path d="M480 313l37-25 35 25z" fill="#737f58"/><text x="500" y="339" font-size="24">◆</text>' : ""}${n >= 24 ? building(350, 145, 52, "#e1c69b") : ""}${projects.greenhouse ? '<path d="M440 290v-32l30-22 30 22v32z" fill="#a7c6ae" stroke="#5e8168" stroke-width="4"/><path d="M470 236v54m-30-32h60" stroke="#5e8168" stroke-width="3"/>' : ""}${projects.lookout ? '<path d="M66 243v-94h50v94m-55-94h60v-17H61z" fill="#bca16a" stroke="#6b7956" stroke-width="5"/>' : ""}${projects.noticeboard ? '<path d="M302 333v-65h65v65m-65-12h65" fill="#d6bd83" stroke="#6b7956" stroke-width="5"/><path d="M313 281h15v19h-15zM342 281h15v19h-15z" fill="#f2e5bd"/>' : ""}${decorations}</svg>`;
  }
  window.V3Art = { scene, explorer, esc, camp, townScene };
})();
