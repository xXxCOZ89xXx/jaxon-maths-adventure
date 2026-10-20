/* Original, deterministic isometric dioramas. No external images, fonts or engine. */
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
  const palettes = {
    number: ["#183c3b", "#91b9a1", "#558660", "#315c47", "#a9ca83"],
    fractions: ["#6b493f", "#edcc96", "#d8b074", "#af7c51", "#fae1a7"],
    algebra: ["#263e59", "#bdcfdd", "#8fa7bb", "#566e85", "#dbe9ea"],
    geometry: ["#363c60", "#c7bdd4", "#9296b1", "#626680", "#ddd4cf"],
    ratio: ["#174956", "#8bc7c6", "#e5cf8b", "#b09460", "#f8e4a9"],
    statistics: ["#233d55", "#a1bfc4", "#648b83", "#3e665e", "#bfd1b0"],
    probability: ["#241f4d", "#a3a2d0", "#7771a2", "#4e4977", "#cec4eb"],
    measure: ["#3a3d49", "#b0a9a2", "#9f8c71", "#6c6254", "#d7c5a1"],
    town: ["#284e50", "#bbd6cf", "#97b08a", "#63816a", "#d7dbaf"],
  };
  const poly = (pts, fill, extra = "") =>
    `<path d="${pts}" fill="${fill}" ${extra}/>`;
  const at = (x, y, body, k = 1) =>
    `<g transform="translate(${x} ${y}) scale(${k})">${body}</g>`;
  function block(
    x,
    y,
    w = 40,
    d = 22,
    h = 35,
    color = "#afbc9d",
    roof = "#d9ddb8",
    shadow = true,
  ) {
    return at(
      x,
      y,
      `${shadow ? `<ellipse cy="8" rx="${w + 8}" ry="${d + 4}" fill="#102e30" opacity=".15"/>` : ""}${poly(`M-${w} 0L0 ${d}V${d - h}L-${w} -${h}Z`, color)}${poly(`M0 ${d}L${w} 0V-${h}L0 ${d - h}Z`, color)}${poly(`M0 ${d}L${w} 0V-${h}L0 ${d - h}Z`, "#102d38", 'opacity=".23"')}${poly(`M-${w} -${h}L0 -${h + d}L${w} -${h}L0 ${d - h}Z`, roof)}<path d="M-${w} -${h}L0 ${d - h}L${w} -${h}" fill="none" stroke="#fff" stroke-opacity=".22"/>`,
    );
  }
  function pine(x, y, k = 1, color = "#326e56") {
    return at(
      x,
      y,
      `<ellipse cy="5" rx="27" ry="10" fill="#163e37" opacity=".2"/>${block(0, 0, 5, 3, 42, "#83674b", "#b9986a")}${[0, 1, 2].map((i) => `${poly(`M0 ${-110 + i * 23}L-${33 + i * 5} ${-53 + i * 19}L0 ${-35 + i * 19}L${33 + i * 5} ${-53 + i * 19}Z`, color)}${poly(`M0 ${-110 + i * 23}V${-35 + i * 19}L${33 + i * 5} ${-53 + i * 19}Z`, "#102e35", 'opacity=".22"')}<path d="M0 ${-110 + i * 23}L-${33 + i * 5} ${-53 + i * 19}L0 ${-63 + i * 19}" fill="#badb9c" opacity=".22"/>`).join("")}`,
      k,
    );
  }
  function house(x, y, k = 1, color = "#d4ba8e", label = "", lit = true) {
    return at(
      x,
      y,
      block(0, 0, 46, 24, 65, color, "#ead9b1") +
        poly("M-52 -65L0 -114L52 -65L0 -40Z", "#486c60") +
        poly("M0 -114L52 -65L0 -40Z", "#264e49") +
        `<path d="M-32-45l17 8v21l-17-8zM15-37l17-8v21l-17 8z" fill="${lit ? "#f5d98e" : "#667e79"}"/><path d="M-7-21l14-7V15L-7 8Z" fill="#3a554c"/><path d="M-33-45v21m18-13l-17-8M15-26l17-8" stroke="#8d7b57" stroke-width="2"/>${label ? `<g transform="translate(0 40)"><rect x="-62" y="-13" width="124" height="27" rx="5" fill="#f6edd7"/><text text-anchor="middle" y="5" fill="#223e38" font-size="15" font-family="system-ui" font-weight="700">${esc(label)}</text></g>` : ""}`,
      k,
    );
  }
  function lamp(x, y, on = true) {
    return at(
      x,
      y,
      `<path d="M0 0v-54h15" stroke="#3e5651" stroke-width="4" fill="none"/><path d="M9-56h13v17H9z" fill="${on ? "#ffe0a0" : "#74867a"}" stroke="#5c6250" stroke-width="2"/>${on ? '<circle class="scene-glow" cx="16" cy="-47" r="20" fill="#ffe4a1" opacity=".16"/>' : ""}`,
    );
  }
  function bridge(x, y, restored = true) {
    return at(
      x,
      y,
      `${[0, 1, 2, 3, 4, 5]
        .filter((i) => restored || i < 2 || i > 4)
        .map((i) => block(i * 12, -i * 6, 29, 10, 8, "#956f4c", "#d4b17a"))
        .join(
          "",
        )}${restored ? '<path d="M-30-13l61-30m-61 30v-20m61-10v-20M28 10l61-30m-61 30v-20m61-10v-20" stroke="#795739" stroke-width="4" fill="none"/>' : ""}`,
    );
  }
  function gear(x, y, on = true, k = 1) {
    return at(
      x,
      y,
      `<path d="M-25-8h7l4-7-4-6 11-7 4 7h7l4-7 11 7-4 6 4 7h7V5h-7l-4 7 4 6-11 7-4-7h-7l-4 7-11-7 4-6-4-7h-7z" fill="${on ? "#dab976" : "#8b9293"}" stroke="#43565c" stroke-width="3"/><circle r="10" fill="#4a7171"/><circle r="4" fill="${on ? "#bdeba6" : "#687f80"}"/>`,
      k,
    );
  }
  function vessel(x, y, k = 1) {
    return at(
      x,
      y,
      poly("M-45 0L30 10L55-8L-25-18Z", "#f3e4be") +
        poly("M-45 0L30 10L25 24L-35 13Z", "#925f48") +
        '<path d="M0 3v-90" stroke="#6b5d4a" stroke-width="4"/>' +
        poly("M-4-86L-4-12L-48-20Z", "#f4e6c7") +
        poly("M4-80L42-14L4-12Z", "#e2a65c"),
      k,
    );
  }
  function terrain(id, l) {
    const p = palettes[id],
      parts = [];
    for (let sum = 0; sum <= 14; sum++)
      for (let a = 0; a < 8; a++) {
        const b = sum - a;
        if (b < 0 || b > 7 || (a === 0 && b === 0) || (a === 7 && b === 7))
          continue;
        const x = 450 + (a - b) * 43,
          y = 238 + (a + b) * 19;
        const water =
          (id === "ratio" && (a < 2 || b > 5)) ||
          (["number", "fractions"].includes(id) && a === 3);
        let top = water
          ? id === "fractions" && !l
            ? "#ae8c59"
            : "#5cabb6"
          : p[2];
        if (id === "town" && (a === 3 || a === 4 || b === 3 || b === 4))
          top = "#bbc2af";
        parts.push(block(x, y, 43, 19, water ? 26 : 35, p[3], top, false));
        if (!water && (a * 7 + b * 11) % 4 === 0)
          parts.push(
            poly(
              `M${x - 26} ${y - 34}l22-9 25 10-22 9Z`,
              p[4],
              'opacity=".16"',
            ),
          );
        if (water && !(id === "fractions" && !l))
          parts.push(
            `<path d="M${x - 19} ${y - 19}l20 8m-6-15l17 7" stroke="#d3f2e4" stroke-opacity=".45" fill="none"/>`,
          );
        else if ((a * 13 + b * 7) % 5 === 0)
          parts.push(
            `<path d="M${x - 15} ${y - 24}l13 5m-4 5l13 5" stroke="${p[3]}" opacity=".23"/>`,
          );
      }
    return parts.join("");
  }
  const venueNames = [
    "Market",
    "Café",
    "Bank",
    "Shops",
    "Station",
    "Home",
    "Cinema",
    "Workshop",
  ];
  function venue(x, y, i, lit = true, k = 1) {
    const colors = [
      "#c7885e",
      "#769e93",
      "#92a4ac",
      "#b88996",
      "#7697a8",
      "#c9b779",
      "#9180ae",
      "#969d76",
    ];
    let body = house(0, 0, 1, lit ? colors[i] : "#9c9f93", "", lit);
    if ([0, 1, 3].includes(i))
      body += `<path d="M-52-47l49 23v13l-49-23z" fill="#f2ddae"/><path d="M-43-43l10 5v13l-10-5zm20 9l10 5v13l-10-5z" fill="${colors[i]}"/>`;
    if (i === 2)
      body += `<path d="M-45-61l42 20v26l-42-20z" fill="#d5d7c3"/><path d="M-35-53v25m13-19v25m13-19v25" stroke="#758985" stroke-width="5"/>`;
    if (i === 4)
      body += `<circle cx="0" cy="-80" r="13" fill="#eee3c5"/><path d="M0-89v9l7 3" stroke="#355459" stroke-width="2" fill="none"/>`;
    if (i === 6)
      body += `<path d="M-28-43l22 11v20l-22-11z" fill="#333c56"/><path d="M-21-34l11 6" stroke="#e6c17d" stroke-width="4"/>`;
    if (i === 7) body += gear(24, -61, lit, 0.55);
    body += `<rect x="-58" y="26" width="116" height="26" rx="4" fill="#f5ead1"/><text x="0" y="44" text-anchor="middle" font-size="14" font-family="system-ui" font-weight="750" fill="#29493e">${venueNames[i]}</text>`;
    return at(x, y, body, k);
  }
  function landmarks(id, l, settled) {
    const live = l > 0;
    let s = "";
    if (id === "number")
      s = [
        pine(290, 285, 1.12),
        pine(393, 257, 0.75),
        pine(555, 288, 1.3),
        pine(663, 351, 1.08),
        pine(211, 357, 0.8),
        bridge(408, 350, live),
        l >= 2
          ? pine(560, 430, 0.72)
          : '<path d="M560 430v-67m0 29l-22-17m22-2l16-25" stroke="#79694f" stroke-width="8"/>',
        l >= 3
          ? house(445, 267, 0.76, "#b69b70", "Workshop")
          : block(445, 267, 36, 20, 13, "#928f7c", "#b6b399"),
        pine(365, 453, 0.7),
      ].join("");
    if (id === "fractions")
      s = `${block(330, 290, 55, 28, l >= 3 ? 65 : 20, "#c59e66", "#f3d294")}${block(330, 290, 30, 16, l >= 3 ? 93 : 27, "#d9b274", "#f5d99b")}${poly("M596 237L681 324L515 324Z", "#b69064")}${poly("M596 237L681 324L600 324Z", "#e1bc7c")}<path d="M390 339l130 58-72 41" stroke="${live ? "#78c9c5" : "#aa8d61"}" stroke-width="14" fill="none"/>${l >= 2 ? '<ellipse cx="478" cy="420" rx="52" ry="23" fill="#74bebb"/>' : ""}${pine(252, 358, 0.75, "#6b8a60")}${pine(542, 408, 0.7, "#6d9c6c")}${bridge(405, 357, live)}${block(624, 377, 24, 14, l >= 3 ? 73 : 17, "#c7a06e", "#f3d698")}`;
    if (id === "algebra")
      s = `<path d="M247 297l96-159 87 159zM511 273l88-162 108 162z" fill="#7189a1"/><path d="M343 138l-28 46 26-11 27 13zM599 111l-27 49 29-10 27 10z" fill="#d8e7e6"/>${block(456, 345, 47, 25, live ? 103 : 35, "#8099a4", "#bccbd0")}${gear(457, 274, live, 0.9)}<path d="M365 318v93m45-115v89m-45-59l45-22" stroke="#496574" stroke-width="7" fill="none"/>${block(385, l >= 2 ? 335 : 407, 24, 13, 20, "#e1ba72", "#f3db9b")}<path d="M502 345l91 42v-87" stroke="${l >= 3 ? "#eed28c" : "#526c79"}" stroke-width="9" fill="none"/>${gear(593, 291, l >= 3, 0.6)}`;
    if (id === "geometry")
      s = `${block(447, 325, 103, 45, live ? 74 : 19, "#9b9cb2", "#d4c9d2")}${[
        [-78, 17],
        [0, -28],
        [78, 17],
      ]
        .map(([x, y], i) =>
          at(
            447 + x,
            325 + y,
            block(0, 0, 30, 17, l > i ? 135 : 29, "#b9b6c7", "#e5dacd") +
              `${[
                [-22, -8],
                [0, 3],
                [22, -8],
              ]
                .map(([a, b]) =>
                  block(
                    a,
                    b - (l > i ? 135 : 29),
                    8,
                    5,
                    13,
                    "#c2bbca",
                    "#e6d7cc",
                  ),
                )
                .join(
                  "",
                )}${l > i ? '<path d="M0-158v-30h28l-8 10 8 10H0" fill="#81af91"/>' : ""}`,
          ),
        )
        .join(
          "",
        )}<path d="M429 333v-29a18 18 0 0136 0v29" fill="#514c68"/>${bridge(417, 386, live)}${pine(229, 373, 0.8, "#65788c")}${pine(625, 410, 0.9, "#627c8e")}`;
    if (id === "ratio")
      s = `${pine(353, 280, 0.9, "#618d6a")}${house(533, 310, 0.8, "#e0c38d", "Harbour", l >= 3)}${[0, 1, 2, 3].map((i) => block(350 + i * 29, 351 + i * 13, 32, 13, live ? 24 : 10, "#97714c", "#d5b17a")).join("")}${l >= 2 ? vessel(306, 428, 0.9) : block(306, 428, 24, 10, 10, "#8b9785", "#bbba9d")}${block(638, 361, 20, 12, l >= 3 ? 115 : 31, "#e2d9ba", "#e8bb71")}${live ? lamp(636, 252, true) : ""}${block(511, 401, 22, 13, 27, "#ac895b", "#e5c38b")}`;
    if (id === "statistics")
      s = `${[
        [295, 300, 60],
        [385, 288, 103],
        [526, 295, 84],
        [612, 350, 131],
        [355, 404, 77],
      ]
        .map(([x, y, h], i) =>
          at(
            x,
            y,
            block(
              0,
              0,
              32,
              19,
              live ? h : h * 0.5,
              ["#83a5a4", "#a9b49d", "#d1b488"][i % 3],
              "#dae0c0",
            ) +
              [0, 1, 2]
                .filter(j => j * 19 <= (live ? h : h * 0.5) - 18)
                .map(
                  (j) =>
                    `<path d="M-22 ${-(live ? h : h * 0.5) + 15 + j * 19}l12 6v9l-12-6zM10 ${-(live ? h : h * 0.5) + 22 + j * 19}l12-6v9l-12 6z" fill="${l >= 2 ? "#f4d791" : "#688784"}"/>`,
                )
                .join(""),
          ),
        )
        .join(
          "",
        )}${house(474, 360, 0.9, "#c9bf9e", "Observatory", l >= 3)}${[0, 1, 2].map((i) => block(495 + i * 29, 438 - i * 13, 11, 7, live ? (i + 1) * 20 : 14, "#4e8277", "#a8c8a2")).join("")}${lamp(278, 379, live)}${lamp(602, 408, l >= 2)}`;
    if (id === "probability")
      s = `${block(452, 329, 91, 38, 30, "#665f91", "#aaa0cb")}<ellipse cx="452" cy="242" rx="64" ry="91" fill="${l >= 3 ? "#9e9bd5" : "#535377"}" stroke="#a99ac6" stroke-width="17"/><ellipse cx="452" cy="242" rx="40" ry="67" fill="${live ? "#c3d8e5" : "#393b60"}"/><path d="M432 193l36 27-36 29 36 30-32 22" fill="none" stroke="${live ? "#f6dfae" : "#7c729b"}" stroke-width="5"/>${[
        [-137, 55],
        [136, 55],
        [-80, -37],
        [80, -37],
      ]
        .map(([x, y], i) =>
          at(
            452 + x,
            329 + y,
            block(0, 0, 20, 12, l >= 2 ? 61 : 25, "#837b9f", "#c2aed1") +
              poly("M0-105l16 23-16 23-16-23Z", live ? "#b6d8c7" : "#9a8fae"),
          ),
        )
        .join("")}`;
    if (id === "measure")
      s = `<path d="M223 320l109-164 90 164zM496 292l91-162 109 162z" fill="#897f77"/><path d="M289 331v-58a42 42 0 0184 0v58" fill="#303c41" stroke="#bd9e72" stroke-width="13"/><path d="M319 321l-78 114m104-107l-76 120" stroke="#d5bf97" stroke-width="6"/>${[0, 1, 2, 3].map((i) => `<path d="M${303 - i * 18} ${346 + i * 24}l28 10" stroke="#755f48" stroke-width="7"/>`).join("")}${live ? at(284, 386, block(0, 0, 24, 14, 22, "#769a95", "#bdd0b3") + '<circle cx="-13" cy="19" r="7" fill="#39484a"/><circle cx="16" cy="23" r="7" fill="#39484a"/>') : ""}${at(559, 355, block(0, 0, 34, 20, l >= 3 ? 103 : 24, "#a8926e", "#d7bf8c") + gear(0, l >= 3 ? -75 : -20, live, 0.75))}${lamp(375, 322, l >= 2)}${poly("M611 398l19-45 19 45-19 20Z", l >= 2 ? "#a5d9cc" : "#899b98")}`;
    if (id === "town")
      s =
        [
          [420, 266],
          [521, 310],
          [626, 354],
          [320, 310],
          [217, 354],
          [422, 410],
          [526, 454],
          [320, 454],
        ]
          .map(([x, y], i) =>
            venue(x, y, i, l >= Math.floor(i / 3) + 1 || settled > i, 0.72),
          )
          .join("") +
        lamp(390, 363, true) +
        lamp(467, 400, true) +
        (l >= 3
          ? '<path d="M268 250l325 145" stroke="#8b7961" stroke-width="2"/><path d="M305 267l9 23 10-15m51 19l9 23 10-15m51 19l9 23 10-15m51 19l9 23 10-15" fill="#e3bb78"/>'
          : "");
    if (id !== "town" && settled > 0)
      s += house(629, 444, 0.5, "#c8b784", "", true);
    return s;
  }
  // Fixed geometry and bounded object counts keep these original landscapes light on iPad.
  function landscape(id, l, front = false) {
    const p = palettes[id];
    if (front) {
      const stones = [195, 242, 650, 706].map((x, i) => block(x, 470 + i % 2 * 24, 12 + i * 2, 7, 9, p[3], p[4])).join("");
      if (id === "number") return pine(80, 535, 1.8, "#214b3d") + pine(830, 558, 2.1, "#214b3d") + stones + '<path d="M423 496v59m13-54v59m13-63v58" stroke="#8acbd0" stroke-width="8" opacity=".7"/>';
      if (id === "fractions") return '<path d="M0 504Q145 410 244 560H0M669 560Q816 414 900 485V560" fill="#c69760"/>' + stones + palm(770, 497, 1.4);
      if (id === "ratio") return '<path d="M0 513q100-36 200 0t200 0t200 0t300 0M0 540q100-36 200 0t200 0t200 0t300 0" stroke="#bde4de" stroke-width="4" fill="none" opacity=".4"/>' + palm(804, 535, 1.6) + vessel(123, 489, .8);
      if (id === "probability") return [100,790].map((x,i)=>at(x,505,poly("M0-120l34 60L0 0l-34-60Z",i?"#8b9ebf":"#a497c1"))).join("") + stones;
      if (id === "measure") return '<path d="M0 0h120l-44 98L0 185M900 0H780l44 98 76 87M0 560v-110l113-61-35 171M900 560V419l-92-36-48 177" fill="#303b40"/>' + stones;
      if (id === "algebra") return pine(94, 530, 1.7, "#496b75") + pine(817, 540, 1.8, "#496b75") + stones;
      if (id === "geometry") return block(80,555,70,36,143,"#686c89","#aaa9bf") + block(841,555,70,36,143,"#686c89","#aaa9bf") + stones;
      return stones + lamp(125, 503, l > 0) + lamp(785, 515, l > 0);
    }
    let body = '<path d="M0 315Q166 210 320 299T610 270T900 302V560H0Z" fill="' + p[3] + '" opacity=".3"/>';
    if (id === "number") body += [40,130,720,810,890].map((x,i)=>pine(x,310+i%2*35,.8+i%3*.2,p[3])).join("") + '<path d="M58 230q13-15 26 0m34-30q13-15 26 0" stroke="#b9cead" stroke-width="3" fill="none"/>';
    if (id === "fractions") body += '<path d="M0 292L170 125l170 167M623 292l134-183 143 183" fill="#a67c55"/><path d="M170 125v167H340M757 109v183H900" fill="#deb87a"/>' + palm(135,340,.8);
    if (id === "ratio") body += '<path d="M0 303h900v257H0Z" fill="#438f9e" opacity=".6"/>' + vessel(745,255,.55) + '<path d="M73 244l32-20 34 20m-18-8v-61h26v61" fill="#c9c7a3"/>';
    if (id === "algebra") body += '<path d="M0 311L117 73l174 238M630 311L782 45l118 266" fill="#68869d"/><path d="M117 73l-33 67 33-17 43 21M782 45l-39 68 39-20 32 24" fill="#e0ece7"/><path d="M95 206l650-41" stroke="#b6cbd0" stroke-width="2"/>' + block(677,190,16,9,22,"#b29d6a","#f2d89c");
    if (id === "geometry") body += [80,160,745,825].map((x,i)=>block(x,287,25,15,95+i%2*50,"#767993","#c9c1d3") + at(x,137-i%2*50,poly("M-30 50L0 0L30 50Z","#595d7b"))).join("") + '<path d="M58 288h135m525 0h145" stroke="#a6a4b8" stroke-width="20"/>';
    if (id === "statistics" || id === "town") body += [45,105,173,730,801,871].map((x,i)=>block(x,300,24,13,55+(i%3)*31,p[3],p[4]) + '<path d="M'+(x-14)+' 255v12m7-8v12" stroke="#d8ca8a" stroke-width="4"/>').join("");
    if (id === "probability") body += Array.from({length:24},(_,i)=>'<path d="M'+((i*137+33)%900)+' '+((i*47+15)%220)+'h3v3h-3z" fill="#e4dfb9" opacity=".7"/>').join("") + '<path d="M130 220Q450-50 780 200Q470 8 130 220Z" fill="#a7c4c5" opacity=".14"/>';
    if (id === "measure") body += '<path d="M0 0h900v86l-69-35-52 99-81-80-80 47-139-83-116 66-83-51-90 100-99-73L0 160Z" fill="#444649"/>' + [130,730,812].map((x,i)=>at(x,299,poly("M0-70l20 35L0 0l-20-35Z",i?"#a6c8bb":"#c4b0c9"))).join("");
    return body;
  }
  function palm(x,y,k=1) {
    return at(x,y,'<path d="M0 0l7-99" stroke="#a57e51" stroke-width="12"/><path d="M7-99q-49-42-77 1 40-12 77-1m0 0q48-45 78-3-40-9-78 3m0 0q-16-48-42-30 28 5 42 30m0 0q34-46 52-28-27 4-52 28" fill="#62875c"/>',k);
  }
  function worksite(id, kind, value = 0, selected = [], solved = false, min = -6, max = 6) {
    const p = palettes[id] || palettes.number;
    let body = "";
    if (kind === "line") {
      const x = 80 + 640 * Math.max(0, Math.min(1, (value-min)/(max-min || 1)));
      body = '<path d="M30 158Q200 102 390 160T770 158v82H30Z" fill="#549eae"/><path d="M48 133H752" stroke="#8b6b47" stroke-width="30"/>' + Array.from({length:max-min+1},(_,i)=>{const dx=80+640*i/(max-min||1);return '<path d="M'+dx+' 119v30" stroke="#f1d7a2" stroke-width="3"/>';}).join("") + at(x,112,miniExplorer(),.95) + '<path d="M'+x+' 154v34l-11-9h22z" fill="#f4d584"/>' + '<text x="'+x+'" y="216" text-anchor="middle" fill="#fff5d2" font-size="23" font-family="system-ui">'+esc(value)+'</text>';
    } else if (["fraction","chance"].includes(kind)) {
      body = Array.from({length:kind === "fraction" ? 4 : 8},(_,i)=>block(100+i*85,162,35,18,selected.includes(i)?59:20,selected.includes(i)?"#4e9fa8":p[3],selected.includes(i)?"#a5e1d6":p[4])).join("");
    } else {
      body = block(400,175,150,42,28,p[3],p[4]) + gear(400,105,solved,1.35) + '<path d="M268 112h90m83 0h90" stroke="#e4cb92" stroke-width="7"/>' + [0,1,2].map(i=>block(295+i*105,150,22,12,24+Math.min(65,Math.abs(Number(value)||0)%14*4),p[3],solved?"#c6dfa3":"#d7b97b")).join("");
    }
    return '<svg class="worksite" viewBox="0 0 800 240" role="img" aria-label="'+esc(kind === "line" ? "Bridge marker at " + value : solved ? "Worksite restored" : "Worksite preview; use the controls below to make your plan")+'"><path d="M0 240V40l400-40 400 40v200Z" fill="'+p[0]+'"/>'+body+'</svg>';
  }
  function scene(id, level = 0, before = false, settled = 0) {
    if (!palettes[id]) id = "number";
    const p = palettes[id],
      l = before ? 0 : Math.min(3, level),
      w = E.worlds.find((w) => w.id === id);
    const uid = "sky-" + id + "-" + l + "-" + (before ? "before" : "now");
    return `<svg class="world-scene scene-${id}" viewBox="0 0 900 560" role="img" aria-label="${esc(w.name)}: ${l === 0 ? "before restoration" : l + " of 3 landmarks restored"}"><defs><linearGradient id="${uid}" x2="0" y2="1"><stop stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs><rect width="900" height="560" fill="url(#${uid})"/><circle cx="706" cy="104" r="61" fill="#ffe7b3" opacity=".08"/><circle cx="706" cy="104" r="34" fill="#fff2cc" opacity=".85"/><path d="M0 225l118-71 119 83 130-104 127 79 107-76 129 93 90-57 80 53v335H0z" fill="${p[0]}" opacity=".22"/><g fill="#eff4df" opacity=".13"><path d="M89 102h140v8H89zM120 88h80v14h-80zM505 67h100v8H505z"/></g><ellipse cx="450" cy="488" rx="299" ry="37" fill="#142e39" opacity=".18"/>${landscape(id,l)}${terrain(id, l)}${landmarks(id, l, before ? 0 : settled)}${at(id === "statistics" ? 365 : 453, id === "statistics" ? 451 : 423, miniExplorer(), 0.7)}${landscape(id,l,true)}<g fill="${p[4]}" opacity=".7"><path d="M179 406h7v7h-7zM677 437h6v6h-6zM566 459h5v5h-5z"/></g></svg>`;
  }
  function miniExplorer() {
    return '<ellipse cy="7" rx="15" ry="6" fill="#153b36" opacity=".25"/><path d="M-8-6h7V8h-7zM3-6h7V8H3z" fill="#253e48"/><path d="M-12-34h26v30h-26z" fill="#e6b96c"/><path d="M-8-54h19v20H-8z" fill="#d2ad83"/><path d="M-11-60h25v11h-25z" fill="#326652"/><path d="M-16-30h5v21h-5zM14-30h5v14l9-8 4 5-13 13h-5z" fill="#c29d79"/><path d="M-5-45h3v4h-3zm10 0h3v4H5z" fill="#243d3e"/><path d="M-2-37h7" stroke="#885d42" stroke-width="2"/><path d="M-12-32h26v6H-12zm18 5h6v18H6z" fill="#b36a48"/><path d="M-12-14h11v13h-11z" fill="#846541"/>';
  }
  function petShape(id, color = "#c78e56") {
    if (id === "frog")
      return '<path d="M-22-24h44V1h-44z" fill="#83aa68"/><circle cx="-13" cy="-26" r="9" fill="#9abc79"/><circle cx="13" cy="-26" r="9" fill="#9abc79"/><circle cx="-13" cy="-27" r="3" fill="#2e4643"/><circle cx="13" cy="-27" r="3" fill="#2e4643"/><path d="M-12-8h24" stroke="#446444" stroke-width="3"/>';
    if (id === "axolotl")
      return '<path d="M-19-26h38V2h-38z" fill="#d4a0af"/><path d="M-19-20l-15-12m15 19l-17-2m55-5l15-12m-15 19l17-2" stroke="#b97697" stroke-width="6"/><path d="M-10-16h4v5h-4zM7-16h4v5H7z" fill="#3a444d"/>';
    if (id === "robot")
      return '<path d="M-18-28h36V2h-36z" fill="#91b6ac"/><path d="M-12-23h24v12h-24z" fill="#304b53"/><path d="M-8-20h4v4h-4zM5-20h4v4H5z" fill="#d5edb0"/><path d="M0-28v-8m-12 38v8m24-8v8" stroke="#78998f" stroke-width="5"/>';
    if (id === "bee")
      return '<ellipse cx="-10" cy="-22" rx="13" ry="8" fill="#dbead9"/><ellipse cx="12" cy="-22" rx="13" ry="8" fill="#dbead9"/><path d="M-21-17h42V3h-42z" fill="#dfb45b"/><path d="M-9-17v20M5-17v20" stroke="#3e5146" stroke-width="7"/>';
    return `<path d="M-19-24l-5-18 16 13h17l15-13-5 18v26h-38z" fill="${color}"/><path d="M-12-13h5v5h-5zM7-13h5v5H7z" fill="#263f43"/><path d="M-9 2l9-10L9 2z" fill="#e7dbb8"/><path d="M19-6l16-8 6 12-20 6z" fill="${color}"/>`;
  }
  function explorer(s, inline = false) {
    const items = C.catalog.filter(
      (i) =>
        (s.equipped || []).includes(i.id) && (s.bought || []).includes(i.id),
    );
    const slot = (n) => items.find((i) => i.slot === n),
      head = slot("Headwear"),
      outfit = slot("Outfits"),
      back = slot("Back items"),
      acc = slot("Accessories"),
      pet = slot("Companions"),
      bg = slot("Backgrounds");
    const hue = outfit ? C.catalog.indexOf(outfit) * 32 : 150,
      color = `hsl(${hue} 32% 38%)`;
    return `<svg class="explorer ${inline ? "inline-explorer" : ""}" viewBox="0 0 180 210" role="img" aria-label="Explorer wearing ${esc(items.map((i) => i.label).join(", ") || "starter outfit")}">${bg ? '<path d="M8 5h164v183H8z" fill="#c2d8c2"/><path d="M8 150l44-54 39 27 40-75 41 102v38H8z" fill="#749e88" opacity=".5"/>' : ""}<ellipse cx="86" cy="191" rx="56" ry="12" fill="#183b34" opacity=".15"/>${back ? '<path d="M112 83l27-10v75l-27 10z" fill="#a78150"/><path d="M119 86h12v31h-12z" fill="#d2ae6d"/>' : ""}${back?.id === "wings" ? '<path d="M55 112L10 48v57l45 40M117 112l53-64v57l-53 40" fill="#b5d8d2" stroke="#5c8b8c" stroke-width="3"/>' : ""}<path d="M55 144h28v43H55zM93 144h26v43H93z" fill="#344d57"/><path d="M49 180h35v15H46zM92 180h36v15H92z" fill="#243e41"/><path d="M51 87h69v70H51z" fill="${color}"/><path d="M51 87h69v14H51z" fill="hsl(${hue} 35% 51%)"/><path d="M36 94h18v55H36zM119 94h18v55h-18z" fill="#bb9874"/><path d="M36 94h18v29H36zM119 94h18v29h-18z" fill="${color}"/><path d="M61 40h50v48H61z" fill="#d3ad83"/><path d="M57 35h58v22H57zM57 49h10v18H57z" fill="#423b32"/><path d="M72 61h6v7h-6zM96 61h6v7h-6z" fill="#263d3f"/><path d="M79 75q8 8 17-1" fill="none" stroke="#885c42" stroke-width="3"/><path d="M70 57l10-2m14 0l10 3" stroke="#503e31" stroke-width="3"/><path d="M63 88l22 12 24-12-10 22-14-9-13 9z" fill="#c99757"/><path d="M57 104v25m58-25v25" stroke="#f1dda7" stroke-width="2" stroke-dasharray="3 4"/>${head ? `<path d="M53 30h65v23H53z" fill="hsl(${C.catalog.indexOf(head) * 37} 37% 46%)"/><path d="M48 49h76v7H48z" fill="#324a44"/>${head.id === "crown" ? '<path d="M53 32V16l16 12 16-19 16 19 17-12v16z" fill="#e4bb65"/>' : head.id === "wizardhat" ? '<path d="M53 30l35-29 30 29z" fill="#66839f"/>' : head.id === "tophat" ? '<path d="M62 7h46v26H62z" fill="#45505b"/>' : '<path d="M65 32h13v13H65z" fill="#dbe2b0"/>'}` : ""}${acc ? `<path d="M63 102l23 25 24-25" stroke="#c5aa67" stroke-width="3" fill="none"/><path d="M79 119h15v16H79z" fill="#e6c575"/>${acc.id === "glasses" ? '<path d="M65 59h17v13H65zM91 59h17v13H91zM82 64h9" fill="none" stroke="#293e48" stroke-width="4"/>' : ""}` : ""}<path d="M54 134h64v8H54z" fill="#9a8058"/><path d="M79 132h13v12H79z" fill="#e1be70"/><path d="M60 103h15v20H60z" fill="#e4d4a4" opacity=".7"/>${pet ? at(145, 180, petShape(pet.id, pet.id === "frog" ? "#82ac6c" : pet.id === "axolotl" ? "#d2a1ab" : "#c78c58"), 0.7) : ""}</svg>`;
  }
  function icon(item) {
    const i =
      typeof item === "string" ? C.catalog.find((x) => x.id === item) : item;
    if (!i) return "";
    const hue = C.catalog.indexOf(i) * 31,
      base = `hsl(${hue} 28% 55%)`;
    let b = block(40, 56, 25, 14, 24, base, "#e2d7ab");
    if (i.slot === "Companions") b = at(40, 56, petShape(i.id, base));
    if (i.slot === "Headwear")
      b =
        '<path d="M13 48h54v9H13zM22 21h36v28H22z" fill="' +
        base +
        '"/><path d="M25 23h8v22h-8z" fill="#fff" opacity=".2"/>';
    if (i.slot === "Outfits")
      b =
        '<path d="M12 27l17-9h22l17 9-8 19-11-5v27H29V41l-9 5z" fill="' +
        base +
        '"/><path d="M36 19v47" stroke="#e8d9a8" stroke-width="4"/>';
    if (i.slot === "Accessories")
      b =
        i.id === "glasses"
          ? '<path d="M8 30h24v20H8zM48 30h24v20H48zM32 38h16" fill="none" stroke="#38574f" stroke-width="5"/>'
          : i.id === "watch"
            ? '<path d="M31 3h18v74H31z" fill="#677a65"/><circle cx="40" cy="40" r="20" fill="#dfc98d"/><circle cx="40" cy="40" r="14" fill="#f4e8c4"/><path d="M40 29v11l8 4" stroke="#35594e" stroke-width="3" fill="none"/>'
            : i.id === "sword"
              ? '<path d="M40 5l9 13-5 35h-8l-5-35z" fill="#b6ccca"/><path d="M23 52h34v7H23zM35 59h10v17H35z" fill="#aa8a54"/>'
              : i.id === "wand"
                ? '<path d="M24 70l30-48" stroke="#826a48" stroke-width="6"/><path d="M55 4l5 12 14 2-11 9 3 14-11-8-12 8 4-14-11-9 14-2z" fill="#dabb72"/>'
                : i.id === "scarf"
                  ? '<path d="M12 22h56v18H12zM43 40h16v30H43z" fill="' +
                    base +
                    '"/><path d="M15 23v16m13-16v16m18 6h12" stroke="#e1ca90" stroke-width="4"/>'
                  : i.id === "gloves"
                    ? '<path d="M14 22h17v37H14l-5-21h5zM49 22h17v16h5l-5 21H49z" fill="' +
                      base +
                      '"/>'
                    : '<path d="M21 7h12l9 28L31 40Z M47 7h12L49 40L38 35Z" fill="#668d87"/><circle cx="40" cy="51" r="20" fill="#d8b46b"/><path d="M40 37l5 9 11 1-8 7 2 11-10-6-10 6 2-11-8-7 11-1z" fill="#f2db97"/>';
    if (i.slot === "Back items")
      b =
        i.id === "wings" || i.id === "dragon"
          ? '<path d="M36 55L5 8v31l25 26M44 55L75 8v31L50 65" fill="' +
            base +
            '" stroke="#537976" stroke-width="3"/>'
          : i.id === "shield"
            ? '<path d="M40 7L68 20V49L40 75L12 49V20Z" fill="' +
              base +
              '" stroke="#bda166" stroke-width="5"/><path d="M40 16v45M22 30h36" stroke="#e7d5a4" stroke-width="5"/>'
            : i.id === "parachute"
              ? '<path d="M5 31a35 25 0 0170 0Z" fill="' +
                base +
                '"/><path d="M5 31l31 38m39-38L44 69M25 31l13 38m18-38L42 69" stroke="#6a795e" stroke-width="2"/><path d="M33 65h14v10H33z" fill="#b49262"/>'
              : i.id === "jetpack"
                ? '<path d="M13 13h20v45H13zM47 13h20v45H47z" fill="#87a4a4"/><path d="M33 27h14v18H33z" fill="#b5c3ab"/><path d="M17 60l6 16 6-16m22 0l6 16 6-16" fill="#e2bc77"/>'
                : '<path d="M17 13h46v57H17z" fill="' +
                  base +
                  '"/><path d="M23 43h34v21H23zM30 15v24m20-24v24" fill="#e3c591" stroke="#826f4e" stroke-width="3"/>';
    if (i.slot === "Backgrounds")
      b =
        '<path d="M5 10h70v60H5z" fill="#a6c2b6"/><path d="M5 61l24-37 22 31 14-17 10 23v9H5z" fill="' +
        base +
        '"/>';
    return `<svg viewBox="0 0 80 80" class="item-art" aria-hidden="true">${b}</svg>`;
  }
  function guide(name) {
    const hash = [...String(name)].reduce((n,c)=>n+c.charCodeAt(0),0), i=hash%4;
    const known = {Rowan:0, Saff:1, Finn:2, Kit:3, Marin:0, Ada:2, Nova:3, Flint:2, Priya:1};
    const pose = known[name] ?? i, colors=["#537b5d","#ad7853","#697b9e","#8c6d8f"], skin=["#d4ac82","#aa7956","#bf936d","#dfb991"];
    const hair = ['<path d="M17 33V14h48v21H54V25H28v12Z" fill="#6a4935"/><path d="M8 24h65v8H8zM20 8h42v17H20z" fill="#587452"/>','<path d="M14 67V17h52v53l-12-6V29H26v40Z" fill="#3d3634"/>','<path d="M18 35V14h46v21H53V25H28v10Z" fill="#c5c5b5"/><path d="M19 16l13-9 14 8 16-7v13Z" fill="#d9d3bd"/>','<path d="M15 40V12h49v28H53V25H26v15Z" fill="#4c3c44"/><path d="M13 20l28-17 26 17Z" fill="#a88e62"/>'][pose];
    return '<div class="guide-avatar" aria-hidden="true"><svg viewBox="0 0 80 90"><path d="M0 0h80v90H0z" fill="#d9dfbf"/><path d="M8 90V63l25-9h16l24 9v27" fill="'+colors[pose]+'"/><path d="M23 23h34v35L41 68 23 54Z" fill="'+skin[pose]+'"/>'+hair+'<path d="M29 38l7-2m10 0l7 2" stroke="#493c31" stroke-width="2"/><path d="M30 41h4v5h-4zm17 0h4v5h-4z" fill="#233e3b"/><path d="M35 52q7 6 13-1" fill="none" stroke="#744a3b" stroke-width="2"/><path d="M28 62l13 10 15-10-7 17-8-7-7 7z" fill="#e0bd73"/>'+(['Finn','Flint'].includes(name)?'<path d="M13 19h55v8H13zM23 3h36v17H23z" fill="#b99960"/><path d="M34 9h15v12H34z" fill="#ecd6a1"/>':name==='Marin'?'<path d="M12 18h57v10H12zM23 4h35v15H23z" fill="#334f67"/>':name==='Nova'?'<path d="M13 19L40 0l27 19Z" fill="#776091"/><path d="M55 25h7v30h-7z" fill="#c5a9bc"/>':name==='Kit'?'<path d="M25 5l10 8 7-10 8 10 11-8v16H25z" fill="#d4b071"/>':'')+(pose===2?'<path d="M25 39h13v11H25zm19 0h13v11H44zm-6 4h6" fill="none" stroke="#354e51" stroke-width="2"/>':pose===1?'<circle cx="58" cy="53" r="3" fill="#e4c477"/>':'')+'<path d="M15 73h11v17H15z" fill="#bda16c"/></svg></div>';
  }
  function atSvg(body) {
    return `<svg viewBox="-25 -70 50 90">${body}</svg>`;
  }
  function townScene(level = 0, settled = 0, done = []) {
    return scene(
      "town",
      Math.max(level, done.length >= 6 ? 2 : 0),
      false,
      Math.max(settled, done.length),
    );
  }
  function keepsake(c) {
    const name=String(c.name).toLowerCase(); let body;
    if(/leaf|seed|rose|flower/.test(name))body='<path d="M40 65V20" stroke="#527f57" stroke-width="5"/><path d="M40 43Q9 42 13 19Q41 18 40 43M40 52Q72 49 67 28Q42 28 40 52" fill="#80a66a"/>';
    else if(/gear|cog|wheel/.test(name))body=at(40,40,gear(0,0,true));
    else if(/chart|ticket|notebook|card|pass|pencil|token/.test(name))body='<path d="M17 10h46v61H17z" fill="#e5ce97" stroke="#95835e" stroke-width="3"/><path d="M26 25h28m-28 11h28m-28 11h17m-17 11h25" stroke="#6f8d76" stroke-width="4"/>';
    else if(/mug|vessel|pot|cup|basket/.test(name))body='<path d="M18 21h37v39l-8 10H26l-8-10z" fill="#c99668"/><path d="M55 28h13v25H55" fill="none" stroke="#9c7954" stroke-width="6"/><path d="M22 28h29" stroke="#e6c790" stroke-width="5"/>';
    else if(/flag|pennant|sail|badge|crest/.test(name))body='<path d="M25 72V10" stroke="#907750" stroke-width="5"/><path d="M28 13h37L52 30l13 17H28Z" fill="#739b8b"/><path d="M34 19h8v22h-8z" fill="#c6d6ac"/>';
    else body='<path d="M40 8l22 30-22 31-22-31Z" fill="#91bab1" stroke="#5e8c84" stroke-width="3"/><path d="M40 8v61L18 38Z" fill="#cbd9b5"/><path d="M22 69h36v7H22z" fill="#b79560"/>';
    return `<svg class="keepsake-art" viewBox="0 0 80 80" aria-hidden="true">${body}</svg>`;
  }
  function product(name, i=0) {
    let body;
    if (/apple|fruit/i.test(name)) body = '<path d="M40 30q-25-17-29 9-3 26 25 28 26 4 29-23 2-26-25-14" fill="#b96c4c"/><path d="M40 31l4-17" stroke="#776542" stroke-width="5"/><path d="M45 23q19-21 24-6-10 14-24 6" fill="#708e51"/><path d="M22 39v12" stroke="#df9870" stroke-width="5"/>';
    else if (/milk/i.test(name)) body = '<path d="M24 26l8-15h20l9 15v44H24Z" fill="#f0e8ca" stroke="#7a9b98" stroke-width="2"/><path d="M24 27h37v12H24zM30 48h25v16H30z" fill="#86afa8"/><path d="M32 11v16h20V11" fill="#d3dbc6"/>';
    else if (/bread|loaf/i.test(name)) body = '<path d="M12 40q0-24 28-24t28 24v26H12Z" fill="#bc8e56"/><path d="M19 41q0-17 21-17t21 17v18H19Z" fill="#e3bd7d"/><path d="M28 27l-6 15m20-17-7 17m20-13-7 15" stroke="#a47744" stroke-width="3"/>';
    else body = block(40,57,23,14,28,["#9ba86e","#b6805b","#8aa7a2"][i%3],"#e7d19c") + '<path d="M31 24h18v18H31z" fill="#e8ddba"/>';
    return '<svg class="product-image" viewBox="0 0 80 80" aria-hidden="true">'+body+'</svg>';
  }
  function project(id, built=false) {
    let body;
    if (id === "greenhouse") body=block(100,133,60,29,53,"#7caa98","#c2dbb7")+poly("M40 80L100 22L160 80L100 110Z","#b7d6b5")+'<path d="M100 23v109M71 52v64m58-64v64M40 81l60 29 60-29" stroke="#578475" stroke-width="4"/>'+at(100,128,poly("M0-35l-21-16L-18-25 0-15 20-35 22-55 0-35Z","#5d895c"));
    else if (id === "lookout") body=block(100,135,33,18,92,"#9c8058","#d7bd7f")+poly("M48 43L100 4L152 43L100 69Z","#527c60")+'<path d="M76 65v53m14-45v53m-16-30 16 9m-16-24 16 9" stroke="#d7bd85" stroke-width="4"/><path d="M100 5v-4h30l-10 12h-20" fill="#e8c87b"/>';
    else body='<path d="M48 148V46h104v102" stroke="#7d6345" stroke-width="9" fill="#ba9a64"/><path d="M45 41L100 12l55 29Z" fill="#547b5c"/><path d="M61 61h29v41H61zM105 68h30v29h-30zM80 111h40v18H80z" fill="#ecdbac"/><path d="M66 72h18m-18 9h14m26-3h22" stroke="#8a9e78" stroke-width="3"/>';
    return '<svg class="project-image" viewBox="0 0 200 160" aria-hidden="true"><ellipse cx="100" cy="144" rx="77" ry="12" fill="#30543d" opacity=".13"/><g opacity="'+(built?1:.65)+'">'+body+'</g></svg>';
  }
  function location(id) {
    const ids = [
        "market",
        "cafe",
        "bank",
        "shops",
        "station",
        "home",
        "leisure",
        "work",
      ],
      i = Math.max(0, ids.indexOf(id));
    const detail =
      i === 1
        ? block(300, 426, 29, 15, 35, "#a88860", "#e2cc9c") +
          block(571, 423, 29, 15, 35, "#a88860", "#e2cc9c")
        : i === 4
          ? '<path d="M265 428l330 52m-330-39l330 52" stroke="#4b6868" stroke-width="6"/>'
          : i === 7
            ? gear(560, 399, true, 1.4)
            : [0, 1, 2]
                .map((n) =>
                  block(
                    286 + n * 35,
                    426 + n * 14,
                    19,
                    11,
                    22 + n * 7,
                    "#a78b5e",
                    "#e0bd75",
                  ),
                )
                .join("");
    return `<svg class="world-scene location-scene" viewBox="0 0 900 560" role="img" aria-label="Inside Practical Maths Town: ${venueNames[i]}"><rect width="900" height="560" fill="#b4cec2"/><path d="M0 220l230-100 180 95 200-110 290 140v315H0z" fill="#799e8b" opacity=".4"/>${terrain("town", 3)}${pine(232, 346, 0.9)}${venue(450, 354, i, true, 1.7)}${detail}${lamp(640, 401)}${at(418, 446, miniExplorer(), 1.1)}</svg>`;
  }
  function camp(s) {
    const n = s.milestones.length,
      a = window.V3Adventure.state(s),
      p = palettes.number;
    return `<svg class="camp-scene" viewBox="0 0 900 560" role="img" aria-label="Base Camp with ${n} learning landmarks earned"><rect width="900" height="560" fill="#aac8b7"/><path d="M0 226l100-65 130 70 150-114 173 120 154-88 193 102v309H0z" fill="#4c7d6c" opacity=".35"/>${terrain("number", 3)}${pine(278, 291, 1.3)}${pine(591, 288, 1.5)}${pine(665, 387, 1.05)}${pine(203, 361, 0.8)}${poly("M342 388L412 264L504 380L415 414Z", "#d7b36f")}${poly("M412 264L504 380L415 414Z", "#a27b4d")}${poly("M389 398L414 319L444 397L415 414Z", "#3c5e50")}${n >= 1 ? lamp(518, 426) + lamp(349, 432) : ""}${n >= 3 ? house(491, 286, 0.76, "#b89e76", "Workshop") : ""}${n >= 6 ? block(573, 413, 45, 22, 10, "#7d7650", "#5f8d64") + pine(570, 398, 0.35) : ""}${n >= 12 ? house(307, 359, 0.55, "#bba475", "Lodge") : ""}${n >= 24 ? house(435, 235, 0.6, "#d2bd8c", "Hall") : ""}${a.campProjects.greenhouse ? at(581, 365, block(0, 0, 31, 18, 41, "#81ad9f", "#b9dbba") + '<path d="M-30-42L0-74L31-42L0-24z" fill="#c9e1bf" stroke="#5b8b79" stroke-width="3"/>') : ""}${a.campProjects.lookout ? at(276, 312, block(0, 0, 25, 15, 112, "#a68b61", "#d7bd7e") + poly("M-36-113L0-144L36-113L0-92Z", "#426e5c")) : ""}${a.campProjects.noticeboard ? at(464, 454, '<path d="M-23 0v-61h46V0m-46-51h46v35h-46" fill="#c6ab72" stroke="#775f45" stroke-width="5"/><path d="M-13-43h11v16h-11zM7-43h11v16H7z" fill="#f0dfb7"/>') : ""}${Object.entries(
      a.camp,
    )
      .filter(([, id]) => id)
      .map(([slot, id], i) =>
        at(
          360 + i * 72,
          456 - i * 13,
          `<title>${esc(window.V3Adventure.collections(s).find((c) => c.id === id)?.name || "Keepsake")} at camp ${slot}</title>` +
            block(0, 0, 15, 9, 23, "#9d8b61", "#e2c989") +
            at(-18,-62,keepsake(window.V3Adventure.collections(s).find((c)=>c.id===id) || {name:"Keepsake"}).replace(/<svg[^>]*>/,"<g>").replace("</svg>","</g>"), .45),
        ),
      )
      .join("")}${at(460, 425, miniExplorer())}${pine(65,530,1.5,"#3d7057")}${pine(835,530,1.6,"#3d7057")}</svg>`;
  }
  window.V3Art = {
    primitives: {block,at,poly,pine,lamp,house,gear,vessel,miniExplorer},
    scene,
    worksite,
    explorer,
    esc,
    camp,
    townScene,
    icon,
    guide,
    venue,
    location,
    keepsake,
    product,
    project,
  };
})();
