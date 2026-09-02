(function (root) {
  "use strict";

  const C = {
    bg: "#090B0D",
    arch: "#161B1E",
    mid: "#30383B",
    lit: "#89918A",
    ivory: "#D9D6C7",
    red: "#B94B40",
    energy: "#C9B986",
    void: "#050607",
    deep: "#0B0E10",
    ink: "#070809",
  };

  const VIEWS = {
    overview: { x: 0, y: 10, w: 1800, h: 2320 },
    sas: { x: 20, y: 1210, w: 720, h: 540 },
    "sas-open": { x: 40, y: 1140, w: 1040, h: 560 },
    distributor: { x: 50, y: 770, w: 760, h: 560 },
    observatory: { x: 1085, y: 250, w: 700, h: 580 },
    archives: { x: 10, y: 230, w: 700, h: 560 },
    elevator: { x: 700, y: 420, w: 500, h: 980 },
    chamber: { x: 340, y: 1680, w: 1120, h: 740 },
    alcove: { x: 430, y: 430, w: 280, h: 240 },
    revelation: { x: -1320, y: -980, w: 4540, h: 4780 },
  };

  const GLYPH_PATHS = {
    orion:
      "M7 30 V6 H29 M7 17 H20",
    vecteur:
      "M6 26 L16 6 L26 26 M10 26 L16 14 L22 26",
    noyau:
      "M16 7 A8 8 0 1 1 15.99 7 M16 15 V29 M10 29 H22",
  };

  const attr = (attrs) =>
    Object.entries(attrs)
      .filter(([, value]) => value !== undefined && value !== null && value !== false)
      .map(([key, value]) => `${key}="${String(value).replace(/"/g, "&quot;")}"`)
      .join(" ");

  const el = (tag, attrs, inner) => {
    if (inner === undefined) return `<${tag} ${attr(attrs)}/>`;
    const content = Array.isArray(inner) ? inner.join("") : inner;
    return `<${tag} ${attr(attrs)}>${content}</${tag}>`;
  };

  const group = (attrs, inner) => el("g", attrs, inner);
  const rect = (attrs) => el("rect", attrs);
  const path = (attrs) => el("path", attrs);
  const circle = (attrs) => el("circle", attrs);
  const ellipse = (attrs) => el("ellipse", attrs);
  const line = (attrs) => el("line", attrs);
  const text = (attrs, inner) => el("text", attrs, inner);
  const use = (href, attrs) => el("use", Object.assign({ href }, attrs));

  const range = (count) => Array.from({ length: count }, (_, index) => index);

  const defs = () =>
    el("defs", {}, [
      el(
        "linearGradient",
        { id: "void-fall", x1: "0", y1: "0", x2: "0", y2: "1" },
        [
          el("stop", { offset: "0%", "stop-color": "#12171a" }),
          el("stop", { offset: "45%", "stop-color": "#07090a" }),
          el("stop", { offset: "100%", "stop-color": "#030404" }),
        ],
      ),
      el(
        "linearGradient",
        { id: "wall-left", x1: "0", y1: "0", x2: "1", y2: "0" },
        [
          el("stop", { offset: "0%", "stop-color": "#1a2023" }),
          el("stop", { offset: "100%", "stop-color": "#14191c" }),
        ],
      ),
      el(
        "radialGradient",
        { id: "lamp-wash", cx: "35%", cy: "30%", r: "75%" },
        [
          el("stop", { offset: "0%", "stop-color": "#D9D6C7", "stop-opacity": "0.38" }),
          el("stop", { offset: "42%", "stop-color": "#B94B40", "stop-opacity": "0.12" }),
          el("stop", { offset: "100%", "stop-color": "#090B0D", "stop-opacity": "0" }),
        ],
      ),
      el(
        "filter",
        { id: "glow-small", x: "-80%", y: "-80%", width: "260%", height: "260%" },
        [
          el("feGaussianBlur", { stdDeviation: "1.4", result: "b" }),
          el("feMerge", {}, [
            el("feMergeNode", { in: "b" }),
            el("feMergeNode", { in: "SourceGraphic" }),
          ]),
        ],
      ),
      el(
        "symbol",
        { id: "rivet", viewBox: "0 0 8 8" },
        circle({ cx: "4", cy: "4", r: "1.6", fill: "#30383B" }),
      ),
      el(
        "symbol",
        { id: "rail-post", viewBox: "0 0 10 28" },
        [
          line({ x1: "5", y1: "0", x2: "5", y2: "28", stroke: "#89918A", "stroke-width": "1.2" }),
          line({ x1: "1", y1: "6", x2: "9", y2: "6", stroke: "#30383B", "stroke-width": "1" }),
        ],
      ),
      el(
        "symbol",
        { id: "locker", viewBox: "0 0 28 90" },
        [
          rect({ x: "1", y: "1", width: "26", height: "88", fill: "#161B1E", stroke: "#30383B", "stroke-width": "1" }),
          rect({ x: "4", y: "6", width: "20", height: "18", fill: "#12171a", stroke: "#30383B", "stroke-width": "0.7" }),
          rect({ x: "4", y: "28", width: "20", height: "34", fill: "#12171a", stroke: "#30383B", "stroke-width": "0.7" }),
          rect({ x: "4", y: "66", width: "20", height: "16", fill: "#12171a", stroke: "#30383B", "stroke-width": "0.7" }),
          circle({ cx: "20", cy: "48", r: "1.4", fill: "#89918A" }),
        ],
      ),
      el(
        "symbol",
        { id: "slit", viewBox: "0 0 8 22" },
        rect({ x: "3", y: "1", width: "2", height: "20", fill: "#090B0D" }),
      ),
      el(
        "symbol",
        { id: "glyph-orion", viewBox: "0 0 32 32" },
        path({ d: GLYPH_PATHS.orion, fill: "none", stroke: "currentColor", "stroke-width": "2.2", "stroke-linecap": "square" }),
      ),
      el(
        "symbol",
        { id: "glyph-vecteur", viewBox: "0 0 32 32" },
        path({ d: GLYPH_PATHS.vecteur, fill: "none", stroke: "currentColor", "stroke-width": "2.2", "stroke-linecap": "square", "stroke-linejoin": "miter" }),
      ),
      el(
        "symbol",
        { id: "glyph-noyau", viewBox: "0 0 32 32" },
        path({ d: GLYPH_PATHS.noyau, fill: "none", stroke: "currentColor", "stroke-width": "2.2", "stroke-linecap": "square" }),
      ),
      el(
        "clipPath",
        { id: "clip-well" },
        rect({ x: "730", y: "170", width: "340", height: "1590" }),
      ),
      el(
        "clipPath",
        { id: "clip-sas-opening" },
        rect({ x: "598", y: "1338", width: "140", height: "276" }),
      ),
    ]);

  const boltRow = (x, y, count, gap, vertical) =>
    range(count)
      .map((index) =>
        use("#rivet", vertical
          ? { x, y: y + index * gap, width: "8", height: "8" }
          : { x: x + index * gap, y, width: "8", height: "8" }),
      )
      .join("");

  const walkway = (x, y, w, posts) =>
    group({ class: "walkway" }, [
      rect({ x, y, width: w, height: "7", fill: "#30383B" }),
      rect({ x, y: y - 1, width: w, height: "2", fill: "#89918A", opacity: "0.45" }),
      line({ x1: x, y1: y - 16, x2: x + w, y2: y - 16, stroke: "#89918A", "stroke-width": "1.1" }),
      range(posts)
        .map((index) => use("#rail-post", {
          x: x + 6 + index * ((w - 12) / Math.max(posts - 1, 1)),
          y: y - 16,
          width: "10",
          height: "28",
        }))
        .join(""),
    ]);

  const stairs = (x, y, steps, rise, run) =>
    group({ class: "stairs" }, range(steps).map((index) =>
      rect({
        x: x + index * run,
        y: y - index * rise,
        width: run + 2,
        height: rise,
        fill: index % 2 ? "#1c2326" : "#161B1E",
        stroke: "#30383B",
        "stroke-width": "0.6",
      }),
    ));

  const pillar = (x, y, w, h) =>
    group({}, [
      rect({ x, y, width: w, height: h, fill: "url(#wall-left)", stroke: "#0d1113", "stroke-width": "1" }),
      rect({ x: x + w - 5, y, width: "5", height: h, fill: "#0f1315", opacity: "0.7" }),
      rect({ x: x + 3, y, width: "2", height: h, fill: "#30383B", opacity: "0.35" }),
    ]);

  const cable = (x1, y1, cx, cy, x2, y2) =>
    path({
      d: `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`,
      fill: "none",
      stroke: "#30383B",
      "stroke-width": "1.6",
    });

  const layerBackground = () =>
    group({ id: "layer-background", class: "layer-background" }, [
      rect({ x: "-900", y: "-800", width: "3600", height: "4000", fill: C.bg }),
      rect({ x: "0", y: "0", width: "1800", height: "2400", fill: C.deep }),
      range(14)
        .map((index) =>
          line({
            x1: -800 + index * 280,
            y1: -700,
            x2: -800 + index * 280,
            y2: 3100,
            stroke: "#12171a",
            "stroke-width": "18",
          }),
        )
        .join(""),
      group({ opacity: "0.55" }, [
        rect({ x: "40", y: "20", width: "1720", height: "150", fill: "#14191c" }),
        range(9)
          .map((index) =>
            rect({
              x: 70 + index * 190,
              y: "28",
              width: "48",
              height: "132",
              fill: "#0c1012",
            }),
          )
          .join(""),
        rect({ x: "720", y: "8", width: "360", height: "70", fill: "#101418" }),
      ]),
    ]);

  const distantBay = (x, y, w, h) =>
    group({ class: "distant-bay" }, [
      rect({ x, y, width: w, height: h, fill: "#101418", stroke: "#1c2427", "stroke-width": "2" }),
      range(6)
        .map((index) =>
          rect({
            x: x + 18,
            y: y + 20 + index * (h / 6.4),
            width: w - 36,
            height: "10",
            fill: "#0a0d0f",
          }),
        )
        .join(""),
      rect({ x: x + w * 0.42, y, width: "8", height: h, fill: "#090B0D" }),
    ]);

  const layerRevelation = () =>
    group({ id: "layer-revelation", class: "layer-revelation" }, [
      distantBay(-620, 80, 280, 980),
      distantBay(-480, 1180, 220, 860),
      distantBay(-1180, 200, 360, 1400),
      distantBay(-980, 1680, 300, 1100),
      distantBay(1960, 40, 320, 1100),
      distantBay(2080, 1280, 260, 920),
      distantBay(2480, 180, 380, 1600),
      distantBay(2680, 1860, 280, 980),
      rect({ x: "-760", y: "-480", width: "3320", height: "90", fill: "#151b1e" }),
      rect({ x: "-760", y: "2860", width: "3320", height: "120", fill: "#12171a" }),
      path({
        d: "M-700 420 L-220 180 L-220 760 L-700 920 Z",
        fill: "#14191c",
        stroke: "#30383B",
        "stroke-width": "1.5",
      }),
      path({
        d: "M2480 360 L2920 80 L2920 820 L2480 980 Z",
        fill: "#14191c",
        stroke: "#30383B",
        "stroke-width": "1.5",
      }),
      group({ class: "distant-wells" }, [
        rect({ x: "-280", y: "40", width: "90", height: "2100", fill: "#050607" }),
        rect({ x: "1990", y: "-40", width: "110", height: "2280", fill: "#050607" }),
        range(8)
          .map((index) =>
            ellipse({
              cx: "-235",
              cy: 180 + index * 240,
              rx: "38",
              ry: "11",
              fill: "none",
              stroke: "#30383B",
              "stroke-width": "1.2",
            }),
          )
          .join(""),
      ]),
      group({ class: "distant-energy" }, [
        path({
          class: "distant-line",
          d: "M-640 640 H3200",
          fill: "none",
          stroke: C.energy,
          "stroke-width": "2",
        }),
        path({
          class: "distant-line delay-2",
          d: "M-640 1480 H3200",
          fill: "none",
          stroke: C.energy,
          "stroke-width": "1.6",
        }),
        path({
          class: "distant-line delay-4",
          d: "M-500 2100 H3000",
          fill: "none",
          stroke: C.energy,
          "stroke-width": "1.4",
        }),
        path({
          class: "distant-line delay-1",
          d: "M-235 80 V2200",
          fill: "none",
          stroke: C.energy,
          "stroke-width": "1.5",
        }),
        path({
          class: "distant-line delay-3",
          d: "M2045 40 V2300",
          fill: "none",
          stroke: C.energy,
          "stroke-width": "1.5",
        }),
      ]),
    ]);

  const layerWell = () =>
    group({ id: "well", class: "well" }, [
      rect({ x: "708", y: "150", width: "384", height: "1620", fill: "#0a0d0f", stroke: "#1a2225", "stroke-width": "3" }),
      rect({ x: "730", y: "170", width: "340", height: "1590", fill: "url(#void-fall)" }),
      group({ "clip-path": "url(#clip-well)" }, [
        rect({ x: "848", y: "190", width: "104", height: "1480", fill: "#0e1315", opacity: "0.55" }),
        range(11)
          .map((index) =>
            use("#slit", {
              x: 868 + (index % 2) * 28,
              y: 240 + index * 128,
              width: "8",
              height: "22",
              opacity: "0.55",
            }),
          )
          .join(""),
        range(10)
          .map((index) => {
            const y = 240 + index * 148;
            return [
              ellipse({
                cx: "900",
                cy: y,
                rx: String(158 - index * 3),
                ry: String(16 + index * 0.6),
                fill: "none",
                stroke: "#30383B",
                "stroke-width": "2.2",
                opacity: String(0.85 - index * 0.04),
              }),
              rect({
                x: "732",
                y: y - 6,
                width: "336",
                height: "8",
                fill: "#161B1E",
                opacity: "0.55",
              }),
            ].join("");
          })
          .join(""),
        walkway(732, 620, 336, 9),
        walkway(732, 980, 336, 9),
        walkway(732, 1340, 150, 4),
        walkway(980, 1340, 88, 3),
      ]),
      pillar(690, 160, 28, 1170),
      pillar(690, 1628, 28, 132),
      pillar(1082, 160, 32, 1600),
      range(7)
        .map((index) =>
          path({
            d: `M690 ${280 + index * 220} L718 ${250 + index * 220} L718 ${330 + index * 220} L690 ${360 + index * 220} Z`,
            fill: "#1a2124",
            stroke: "#30383B",
            "stroke-width": "1",
          }),
        )
        .join(""),
      range(6)
        .map((index) =>
          path({
            d: `M1114 ${300 + index * 230} L1082 ${270 + index * 230} L1082 ${350 + index * 230} L1114 ${380 + index * 230} Z`,
            fill: "#1a2124",
            stroke: "#30383B",
            "stroke-width": "1",
          }),
        )
        .join(""),
      line({ x1: "846", y1: "180", x2: "846", y2: "1748", stroke: "#30383B", "stroke-width": "3" }),
      line({ x1: "954", y1: "180", x2: "954", y2: "1748", stroke: "#30383B", "stroke-width": "3" }),
      line({ x1: "840", y1: "180", x2: "840", y2: "1748", stroke: "#1c2427", "stroke-width": "1.2" }),
      line({ x1: "960", y1: "180", x2: "960", y2: "1748", stroke: "#1c2427", "stroke-width": "1.2" }),
      group({ class: "gantry" }, [
        rect({ x: "748", y: "408", width: "304", height: "10", fill: "#30383B" }),
        rect({ x: "888", y: "408", width: "8", height: "96", fill: "#89918A", opacity: "0.55" }),
        rect({ x: "872", y: "500", width: "40", height: "14", fill: "#161B1E", stroke: "#30383B" }),
      ]),
      rect({ x: "640", y: "860", width: "58", height: "14", fill: "#30383B" }),
      rect({ x: "640", y: "920", width: "58", height: "10", fill: "#1a2124" }),
      rect({ x: "640", y: "1120", width: "58", height: "14", fill: "#30383B" }),
      cable(200, 80, 420, 260, 730, 200),
      cable(1080, 90, 1280, 300, 1680, 140),
      cable(80, 240, 300, 500, 720, 430),
      cable(1100, 220, 1400, 480, 1760, 260),
      cable(760, 80, 900, 40, 1040, 80),
    ]);

  const layerArchitecture = () =>
    group({ id: "layer-architecture", class: "layer-architecture" }, [
      layerWell(),
      group({ id: "mass-archives" }, [
        rect({ x: "36", y: "250", width: "670", height: "520", fill: "#14191c", stroke: "#1e2629", "stroke-width": "2" }),
        rect({ x: "50", y: "268", width: "430", height: "486", fill: "#101418" }),
        rect({ x: "54", y: "272", width: "422", height: "18", fill: "#1a2124" }),
        range(9)
          .map((index) =>
            use("#locker", {
              x: 62 + index * 46,
              y: 300,
              width: "28",
              height: "90",
            }),
          )
          .join(""),
        range(9)
          .map((index) =>
            use("#locker", {
              x: 62 + index * 46,
              y: 398,
              width: "28",
              height: "90",
            }),
          )
          .join(""),
        range(7)
          .map((index) =>
            rect({
              x: 70 + index * 58,
              y: "500",
              width: "46",
              height: "210",
              fill: "#161B1E",
              stroke: "#30383B",
              "stroke-width": "1",
            }),
          )
          .join(""),
        range(7)
          .map((index) =>
            range(5)
              .map((row) =>
                line({
                  x1: 76 + index * 58,
                  y1: 520 + row * 36,
                  x2: 108 + index * 58,
                  y2: 520 + row * 36,
                  stroke: "#30383B",
                  "stroke-width": "1",
                }),
              )
              .join(""),
          )
          .join(""),
        rect({ x: "490", y: "300", width: "196", height: "430", fill: "#161B1E", stroke: "#30383B", "stroke-width": "1.4" }),
        boltRow(498, 312, 8, 48, true),
        rect({ x: "40", y: "248", width: "14", height: "524", fill: "#1c2427" }),
        text({ x: "64", y: "290", class: "svg-label", fill: C.ivory }, "ARCHIVES"),
      ]),
      group({ id: "mass-observatory" }, [
        path({
          d: "M1118 318 L1710 292 L1736 780 L1144 806 Z",
          fill: "#151b1e",
          stroke: "#1e2629",
          "stroke-width": "2",
        }),
        path({
          d: "M1148 360 L1688 340 L1704 742 L1166 762 Z",
          fill: "#0e1214",
        }),
        path({
          d: "M1148 360 L1688 340 L1672 392 L1160 408 Z",
          fill: "#1a2124",
        }),
        walkway(1070, 448, 120, 3),
        walkway(1070, 702, 90, 2),
        range(5)
          .map((index) =>
            rect({
              x: 1180 + index * 90,
              y: "318",
              width: "10",
              height: "470",
              fill: "#0a0d0f",
              opacity: "0.55",
            }),
          )
          .join(""),
        text({ x: "1180", y: "350", class: "svg-label", fill: C.ivory }, "OBSERVATOIRE"),
      ]),
      group({ id: "mass-distributor" }, [
        rect({ x: "70", y: "790", width: "620", height: "450", fill: "#13181b", stroke: "#1e2629", "stroke-width": "2" }),
        rect({ x: "88", y: "808", width: "360", height: "414", fill: "#101418" }),
        pillar(70, 790, 22, 450),
        pillar(668, 790, 22, 450),
        rect({ x: "110", y: "820", width: "300", height: "36", fill: "#1a2124" }),
        boltRow(120, 828, 12, 22, false),
        path({
          d: "M92 1238 L92 1180 L210 1180 L210 1238 Z",
          fill: "#161B1E",
        }),
        stairs(210, 1238, 8, 14, 18),
        text({ x: "118", y: "846", class: "svg-label", fill: C.ivory }, "DISTRIBUTEUR"),
      ]),
      group({ id: "mass-sas" }, [
        path({
          d: "M58 1278 L730 1278 L730 1338 L598 1338 L598 1614 L730 1614 L730 1688 L48 1688 L48 1410 L58 1400 Z",
          fill: "#161B1E",
          stroke: "#222a2d",
          "stroke-width": "2",
        }),
        rect({ x: "78", y: "1304", width: "512", height: "360", fill: "#0f1316" }),
        path({
          d: "M78 1664 L590 1664 L570 1628 L96 1628 Z",
          fill: "#1a2124",
        }),
        path({
          d: "M78 1304 L590 1304 L570 1344 L96 1344 Z",
          fill: "#1c2427",
        }),
        rect({ x: "78", y: "1304", width: "18", height: "360", fill: "#1a2124" }),
        boltRow(90, 1320, 10, 32, true),
        range(11)
          .map((index) =>
            line({
              x1: 96 + index * 42,
              y1: "1628",
              x2: 96 + index * 42,
              y2: "1664",
              stroke: "#30383B",
              "stroke-width": "1",
            }),
          )
          .join(""),
        range(4)
          .map((index) =>
            rect({
              x: 110 + index * 90,
              y: "1388",
              width: "54",
              height: "8",
              fill: "#1a2124",
            }),
          )
          .join(""),
        path({
          d: "M250 1518 h70 v86 h-70 z",
          fill: "#12171a",
          stroke: "#30383B",
          "stroke-width": "1.4",
        }),
        circle({ cx: "285", cy: "1560", r: "16", fill: "none", stroke: "#89918A", "stroke-width": "2" }),
        circle({ cx: "285", cy: "1560", r: "4", fill: "#89918A" }),
        text({ x: "96", y: "1334", class: "svg-label", fill: C.ivory }, "SAS"),
      ]),
      group({ id: "mass-chamber" }, [
        path({
          d: "M360 1748 H1440 V2320 H360 Z",
          fill: "#12171a",
          stroke: "#1e2629",
          "stroke-width": "2.4",
        }),
        rect({ x: "730", y: "1748", width: "340", height: "40", fill: "#090B0D" }),
        path({
          d: "M380 2288 L1420 2288 L1380 2210 L420 2210 Z",
          fill: "#1a2124",
        }),
        range(5)
          .map((index) =>
            rect({
              x: 410 + index * 200,
              y: "1758",
              width: "26",
              height: "530",
              fill: "#161B1E",
            }),
          )
          .join(""),
        text({ x: "400", y: "1784", class: "svg-label", fill: C.ivory }, "CHAMBRE PROFONDE"),
      ]),
      group({ opacity: "0.7" }, [
        rect({ x: "1180", y: "900", width: "520", height: "720", fill: "#101418" }),
        range(4)
          .map((index) =>
            rect({
              x: 1220 + index * 120,
              y: "920",
              width: "36",
              height: "680",
              fill: "#161B1E",
            }),
          )
          .join(""),
        walkway(1070, 1088, 280, 6),
      ]),
    ]);

  const rotor = (id, x, y, type) => {
    const arm =
      type === "straight"
        ? [
            rect({ x: "-7", y: "-38", width: "14", height: "76", rx: "4", fill: "#89918A" }),
            circle({ cx: "0", cy: "-38", r: "7", fill: "#D9D6C7" }),
            circle({ cx: "0", cy: "38", r: "7", fill: "#D9D6C7" }),
          ]
        : [
            path({
              d: "M-38 -7 H-7 V38 H7 V-7 H-38 Z",
              fill: "#89918A",
            }),
            circle({ cx: "-38", cy: "0", r: "7", fill: "#D9D6C7" }),
            circle({ cx: "0", cy: "38", r: "7", fill: "#D9D6C7" }),
          ];
    return group({ id, class: "rotor", transform: `translate(${x} ${y})` }, [
      circle({ r: "52", fill: "#0d1113", stroke: "#30383B", "stroke-width": "3" }),
      circle({ r: "46", fill: "#161B1E" }),
      group({ class: "rotor-arm", "data-rotor": id }, arm),
      circle({ r: "8", fill: "#30383B", stroke: "#89918A", "stroke-width": "1.4" }),
      path({
        class: "hit-tick",
        d: "M-58 -58 H-44 M-58 -58 V-44",
        fill: "none",
        stroke: "#D9D6C7",
        "stroke-width": "1.4",
      }),
    ]);
  };

  const opticalRing = (id, r) =>
    group({ id, class: "optical-ring" }, [
      circle({ r, fill: "none", stroke: "#30383B", "stroke-width": "10" }),
      circle({ r, fill: "none", stroke: "#161B1E", "stroke-width": "6" }),
      group({ class: "ring-arm", "data-ring": id }, [
        circle({ r, fill: "none", stroke: "#89918A", "stroke-width": "2.2", "stroke-dasharray": "8 18", opacity: "0.4" }),
        path({
          d: `M0 ${-r + 2} L-7 ${-r - 16} L7 ${-r - 16} Z`,
          fill: "#D9D6C7",
        }),
      ]),
    ]);

  const layerMachines = () =>
    group({ id: "layer-machines", class: "layer-machines" }, [
      group({ id: "machine-distributor" }, [
        rect({ x: "168", y: "888", width: "280", height: "300", rx: "8", fill: "#161B1E", stroke: "#30383B", "stroke-width": "2" }),
        rect({ x: "184", y: "904", width: "248", height: "268", fill: "#0c1012" }),
        rotor("rotor-0", 280, 960, "bend"),
        rotor("rotor-1", 280, 1070, "straight"),
        rotor("rotor-2", 280, 1180, "bend"),
        group({ class: "branch-selector" }, [
          rect({ x: "470", y: "868", width: "186", height: "92", fill: "#161B1E", stroke: "#30383B", "stroke-width": "1.6" }),
          text({ x: "484", y: "890", class: "svg-label", fill: C.lit }, "BRANCHE"),
          text({ x: "496", y: "956", class: "svg-label", fill: C.lit }, "ARCH."),
          text({ x: "574", y: "956", class: "svg-label", fill: C.lit }, "OBS."),
          rect({ id: "lever-track", x: "492", y: "906", width: "142", height: "34", rx: "4", fill: "#0c1012", stroke: "#30383B" }),
          rect({ id: "lever-knob", x: "500", y: "910", width: "48", height: "26", fill: "#89918A" }),
        ]),
      ]),
      group({ id: "machine-observatory", transform: "translate(1360 540)" }, [
        circle({ r: "168", fill: "#0b0f11", stroke: "#30383B", "stroke-width": "3" }),
        circle({ r: "160", fill: "none", stroke: "#161B1E", "stroke-width": "10" }),
        line({ x1: "0", y1: "-188", x2: "0", y2: "-78", stroke: "#D9D6C7", "stroke-width": "2.4" }),
        path({ d: "M-10 -188 H10 M0 -198 V-178", stroke: "#D9D6C7", "stroke-width": "2", fill: "none" }),
        text({ x: "12", y: "-176", class: "svg-label", fill: C.ivory }, "AXE"),
        opticalRing("ring-0", 128),
        opticalRing("ring-1", 96),
        opticalRing("ring-2", 64),
        circle({ r: "18", fill: "#161B1E", stroke: "#89918A", "stroke-width": "2" }),
      ]),
      group({ id: "machine-receiver", transform: "translate(1608 470)" }, [
        rect({ x: "0", y: "0", width: "110", height: "168", fill: "#161B1E", stroke: "#30383B", "stroke-width": "1.6" }),
        rect({ x: "10", y: "12", width: "90", height: "96", fill: "#0c1012" }),
        group({ class: "receiver-glyphs" }, [
          use("#glyph-vecteur", { x: "16", y: "20", width: "24", height: "24", class: "glyph-slot", "data-glyph": "vecteur" }),
          use("#glyph-orion", { x: "43", y: "20", width: "24", height: "24", class: "glyph-slot", "data-glyph": "orion" }),
          use("#glyph-noyau", { x: "70", y: "20", width: "24", height: "24", class: "glyph-slot", "data-glyph": "noyau" }),
        ]),
        rect({ x: "18", y: "120", width: "74", height: "32", fill: "#0c1012", stroke: "#30383B" }),
        text({ x: "28", y: "140", class: "svg-label", fill: C.lit }, "REC."),
      ]),
      group({ id: "machine-elevator" }, [
        group({ id: "elevator-cage", class: "elevator-cage" }, [
          rect({ x: "852", y: "560", width: "96", height: "118", fill: "#1a2124", stroke: "#89918A", "stroke-width": "1.8" }),
          path({ d: "M856 564 L944 674 M944 564 L856 674", stroke: "#30383B", "stroke-width": "1.4" }),
          rect({ x: "852", y: "662", width: "96", height: "10", fill: "#89918A", opacity: "0.55" }),
          rect({ x: "888", y: "580", width: "24", height: "40", fill: "#0c1012", stroke: "#30383B" }),
        ]),
      ]),
      group({ id: "machine-chamber" }, [
        ellipse({ cx: "900", cy: "2080", rx: "430", ry: "210", fill: "#161B1E", stroke: "#30383B", "stroke-width": "3" }),
        ellipse({ cx: "900", cy: "2080", rx: "360", ry: "160", fill: "#101418" }),
        circle({ cx: "900", cy: "2060", r: "118", fill: "#0c1012", stroke: "#89918A", "stroke-width": "3" }),
        circle({ id: "chamber-core", cx: "900", cy: "2060", r: "72", fill: "#161B1E", stroke: "#30383B", "stroke-width": "4" }),
        group({ id: "chamber-gear", class: "chamber-gear" }, [
          circle({ cx: "900", cy: "2060", r: "96", fill: "none", stroke: "#30383B", "stroke-width": "10" }),
          range(8)
            .map((index) => {
              const a = (index / 8) * Math.PI * 2;
              const x1 = 900 + Math.cos(a) * 88;
              const y1 = 2060 + Math.sin(a) * 88;
              const x2 = 900 + Math.cos(a) * 118;
              const y2 = 2060 + Math.sin(a) * 118;
              return line({ x1, y1, x2, y2, stroke: "#89918A", "stroke-width": "8" });
            })
            .join(""),
        ]),
        group({ class: "pistons" }, [
          rect({ id: "piston-a", x: "520", y: "1988", width: "86", height: "28", fill: "#89918A" }),
          rect({ id: "piston-b", x: "1190", y: "1988", width: "86", height: "28", fill: "#89918A" }),
          rect({ x: "500", y: "1978", width: "24", height: "48", fill: "#30383B" }),
          rect({ x: "1272", y: "1978", width: "24", height: "48", fill: "#30383B" }),
        ]),
        rect({ x: "760", y: "2260", width: "280", height: "180", fill: "#161B1E" }),
        rect({ x: "640", y: "2320", width: "520", height: "220", fill: "#14191c" }),
        ellipse({ cx: "900", cy: "2480", rx: "380", ry: "90", fill: "#101418" }),
      ]),
      group({ id: "machine-archives-terminal" }, [
        rect({ x: "92", y: "620", width: "150", height: "86", fill: "#161B1E", stroke: "#30383B", "stroke-width": "1.4" }),
        rect({ x: "104", y: "632", width: "126", height: "48", fill: "#0c1012" }),
        line({ x1: "112", y1: "644", x2: "214", y2: "644", stroke: "#30383B", "stroke-width": "1.2" }),
        line({ x1: "112", y1: "656", x2: "198", y2: "656", stroke: "#30383B", "stroke-width": "1.2" }),
        line({ x1: "112", y1: "668", x2: "186", y2: "668", stroke: "#30383B", "stroke-width": "1.2" }),
        text({ x: "108", y: "698", class: "svg-label", fill: C.lit }, "TERMINAL"),
      ]),
    ]);

  const layerConduits = () =>
    group({ id: "layer-conduits", class: "layer-conduits" }, [
      path({
        id: "pipe-in",
        class: "conduit",
        d: "M120 960 H228",
        fill: "none",
        stroke: "#30383B",
        "stroke-width": "10",
        "stroke-linecap": "square",
      }),
      path({
        id: "pipe-ab",
        class: "conduit",
        d: "M280 1012 V1018",
        fill: "none",
        stroke: "#30383B",
        "stroke-width": "10",
      }),
      path({
        id: "pipe-ab-long",
        class: "conduit",
        d: "M280 1012 V1028",
        fill: "none",
        stroke: "#30383B",
        "stroke-width": "10",
      }),
      path({
        id: "pipe-bc",
        class: "conduit",
        d: "M280 1122 V1138",
        fill: "none",
        stroke: "#30383B",
        "stroke-width": "10",
      }),
      path({
        id: "pipe-out",
        class: "conduit",
        d: "M332 1180 H520 V1340 H840",
        fill: "none",
        stroke: "#30383B",
        "stroke-width": "10",
        "stroke-linejoin": "miter",
      }),
      path({
        id: "pipe-archives",
        class: "conduit branch-pipe branch-archives",
        d: "M470 914 H520 V640 H430",
        fill: "none",
        stroke: "#30383B",
        "stroke-width": "8",
      }),
      path({
        id: "pipe-observatory",
        class: "conduit branch-pipe branch-observatory",
        d: "M612 914 H980 V540 H1200",
        fill: "none",
        stroke: "#30383B",
        "stroke-width": "8",
      }),
      path({
        class: "conduit-flow",
        "data-flow": "IN",
        d: "M120 960 H228",
        fill: "none",
        stroke: C.energy,
        "stroke-width": "3",
      }),
      path({
        class: "conduit-flow",
        "data-flow": "A",
        d: "M280 1012 V1028",
        fill: "none",
        stroke: C.energy,
        "stroke-width": "3",
      }),
      path({
        class: "conduit-flow",
        "data-flow": "B",
        d: "M280 1122 V1138",
        fill: "none",
        stroke: C.energy,
        "stroke-width": "3",
      }),
      path({
        class: "conduit-flow",
        "data-flow": "OUT",
        d: "M332 1180 H520 V1340 H840",
        fill: "none",
        stroke: C.energy,
        "stroke-width": "3",
      }),
      path({
        class: "conduit-flow branch-flow",
        "data-flow": "archives",
        d: "M470 914 H520 V640 H430",
        fill: "none",
        stroke: C.energy,
        "stroke-width": "2.4",
      }),
      path({
        class: "conduit-flow branch-flow",
        "data-flow": "observatory",
        d: "M612 914 H980 V540 H1200",
        fill: "none",
        stroke: C.energy,
        "stroke-width": "2.4",
      }),
      path({
        class: "beam",
        d: "M1360 540 L1608 530",
        fill: "none",
        stroke: C.energy,
        "stroke-width": "3",
      }),
      text({ x: "118", y: "948", class: "svg-label", fill: C.lit }, "ENTRÉE"),
      text({ x: "430", y: "1168", class: "svg-label", fill: C.lit }, "SORTIE"),
    ]);

  const layerDoors = () =>
    group({ id: "layer-doors", class: "layer-doors" }, [
      group({ id: "sas-shutter", "clip-path": "url(#clip-sas-opening)" }, [
        rect({
          class: "shutter-leaf",
          x: "598",
          y: "1338",
          width: "132",
          height: "276",
          fill: "#30383B",
          stroke: "#89918A",
          "stroke-width": "2",
        }),
        group({ class: "shutter-leaf" }, range(8).map((index) =>
          line({
            x1: "604",
            y1: 1360 + index * 32,
            x2: "722",
            y2: 1360 + index * 32,
            stroke: "#161B1E",
            "stroke-width": "4",
          }),
        )),
      ]),
      group({ id: "sealed-door" }, [
        rect({ x: "526", y: "430", width: "132", height: "196", fill: "#0c1012", stroke: "#30383B", "stroke-width": "2" }),
        rect({
          class: "seal-panel",
          x: "532",
          y: "436",
          width: "120",
          height: "184",
          fill: "#161B1E",
          stroke: "#89918A",
          "stroke-width": "1.4",
        }),
        use("#glyph-orion", { x: "548", y: "456", width: "28", height: "28", class: "seal-glyph", "data-glyph": "orion" }),
        use("#glyph-vecteur", { x: "578", y: "500", width: "28", height: "28", class: "seal-glyph", "data-glyph": "vecteur" }),
        use("#glyph-noyau", { x: "548", y: "544", width: "28", height: "28", class: "seal-glyph", "data-glyph": "noyau" }),
      ]),
      group({ id: "alcove-inner", class: "alcove-inner" }, [
        rect({ x: "470", y: "458", width: "70", height: "148", fill: "#0a0d0f" }),
        rect({ x: "482", y: "520", width: "46", height: "54", fill: "#161B1E", stroke: "#C9B986", "stroke-width": "1.4" }),
        rect({ x: "494", y: "532", width: "22", height: "18", fill: "#89918A" }),
        text({ x: "476", y: "512", class: "svg-label", fill: C.ivory }, "AUTH"),
      ]),
    ]);

  const layerLighting = () =>
    group({ id: "layer-lighting", class: "layer-lighting" }, [
      ellipse({ cx: "210", cy: "1420", rx: "210", ry: "190", fill: "url(#lamp-wash)" }),
      group({ filter: "url(#glow-small)" }, [
        circle({ cx: "168", cy: "1368", r: "9", fill: C.red, class: "emergency-lamp" }),
        circle({ cx: "168", cy: "1368", r: "4", fill: C.ivory, opacity: "0.85" }),
      ]),
      rect({ x: "148", y: "1378", width: "40", height: "8", fill: "#30383B" }),
      group({ class: "power-lights" }, [
        circle({ cx: "840", cy: "1340", r: "4", fill: C.energy, class: "power-node" }),
        circle({ cx: "430", cy: "640", r: "4", fill: C.energy, class: "power-node archives-node" }),
        circle({ cx: "1200", cy: "540", r: "4", fill: C.energy, class: "power-node observatory-node" }),
        circle({ cx: "900", cy: "2060", r: "10", fill: C.energy, class: "power-node chamber-node" }),
      ]),
    ]);

  const hit = (id, label, extra, shape) => {
    const common = Object.assign(
      {
        id: `hit-${id}`,
        class: "hit",
        tabindex: "0",
        role: "button",
        "aria-label": label,
        "data-interactive": id,
        "focusable": "true",
      },
      extra || {},
    );
    return shape === "circle" ? circle(common) : rect(common);
  };

  const layerInteractions = () =>
    group({ id: "layer-interactions", class: "layer-interactions" }, [
      hit("sas-control", "Commande du volet", { x: "188", y: "1458", width: "86", height: "64", rx: "4", fill: "#1a2124", stroke: "#D9D6C7", "stroke-width": "1.3" }),
      rect({ x: "198", y: "1470", width: "66", height: "16", fill: "#89918A" }),
      rect({ x: "210", y: "1494", width: "42", height: "16", fill: C.red, opacity: "0.85" }),
      hit("goto-overview", "Regarder le puits", { x: "598", y: "1338", width: "132", height: "276", fill: "transparent" }),
      hit("goto-sas", "Aller au sas", { x: "58", y: "1278", width: "540", height: "410", fill: "transparent" }),
      hit("goto-distributor", "Aller au distributeur", { x: "70", y: "790", width: "620", height: "450", fill: "transparent" }),
      hit("goto-archives", "Aller aux archives", { x: "36", y: "250", width: "670", height: "520", fill: "transparent" }),
      hit("goto-observatory", "Aller à l’observatoire", { x: "1118", y: "292", width: "618", height: "514", fill: "transparent" }),
      hit("goto-elevator", "Aller à l’ascenseur", { x: "830", y: "200", width: "140", height: "1540", fill: "transparent" }),
      hit("goto-chamber", "Descendre vers la chambre", { x: "360", y: "1748", width: "1080", height: "560", fill: "transparent" }),
      hit("goto-alcove", "Entrer dans l’alcôve", { x: "470", y: "458", width: "70", height: "148", fill: "transparent" }),
      hit("conductor-0", "Rotor conducteur 1", { cx: "280", cy: "960", r: "52", fill: "transparent" }, "circle"),
      hit("conductor-1", "Rotor conducteur 2", { cx: "280", cy: "1070", r: "52", fill: "transparent" }, "circle"),
      hit("conductor-2", "Rotor conducteur 3", { cx: "280", cy: "1180", r: "52", fill: "transparent" }, "circle"),
      hit("branch-observatory", "Alimenter l’observatoire", { x: "568", y: "906", width: "66", height: "34", fill: "transparent" }),
      hit("branch-archives", "Alimenter les archives", { x: "492", y: "906", width: "66", height: "34", fill: "transparent" }),
      hit("ring-0", "Anneau optique extérieur", { cx: "1360", cy: "540", r: "136", fill: "transparent" }, "circle"),
      hit("ring-1", "Anneau optique médian", { cx: "1360", cy: "540", r: "102", fill: "transparent" }, "circle"),
      hit("ring-2", "Anneau optique intérieur", { cx: "1360", cy: "540", r: "70", fill: "transparent" }, "circle"),
      hit("seal-orion", "Glyphe équerre", { x: "542", y: "450", width: "40", height: "40", fill: "transparent" }),
      hit("seal-vecteur", "Glyphe chevron", { x: "572", y: "494", width: "40", height: "40", fill: "transparent" }),
      hit("seal-noyau", "Glyphe anneau", { x: "542", y: "538", width: "40", height: "40", fill: "transparent" }),
      hit("alcove-auth", "Commande d’autorisation", { x: "478", y: "516", width: "54", height: "62", fill: "transparent" }),
      hit("chamber-control", "Commande principale", { x: "848", y: "2148", width: "104", height: "54", fill: "#1a2124", stroke: "#D9D6C7", "stroke-width": "1.4" }),
      rect({ x: "864", y: "2162", width: "72", height: "18", fill: "#89918A" }),
      hit("terminal", "Terminal des archives", { x: "92", y: "620", width: "150", height: "86", fill: "transparent" }),
      hit("elevator-mid", "Niveau de l’installation", { x: "852", y: "560", width: "96", height: "40", fill: "transparent" }),
      hit("elevator-deep", "Descendre à la chambre", { x: "852", y: "640", width: "96", height: "40", fill: "transparent" }),
    ]);

  const layerForeground = () =>
    group({ id: "layer-foreground", class: "layer-foreground" }, [
      path({
        d: "M0 0 H70 V2400 H0 Z",
        fill: "#0b0e10",
        opacity: "0.55",
      }),
      path({
        d: "M1730 0 H1800 V2400 H1730 Z",
        fill: "#0b0e10",
        opacity: "0.4",
      }),
      path({
        d: "M0 2280 L220 2400 H0 Z",
        fill: "#07090a",
        opacity: "0.8",
      }),
      path({
        d: "M1480 2360 L1800 2200 V2400 Z",
        fill: "#07090a",
        opacity: "0.7",
      }),
    ]);

  const build = () =>
    el(
      "svg",
      {
        id: "installation",
        class: "installation",
        viewBox: "20 1210 720 540",
        role: "img",
        "aria-label": "Coupe de l’installation abandonnée",
        preserveAspectRatio: "xMidYMid meet",
      },
      [
        defs(),
        group({ id: "world-root", class: "world" }, [
          layerBackground(),
          layerRevelation(),
          layerArchitecture(),
          layerMachines(),
          layerConduits(),
          layerDoors(),
          layerLighting(),
          layerInteractions(),
          layerForeground(),
        ]),
      ],
    );

  root.ExploreSvg = {
    VIEWS,
    GLYPH_PATHS,
    build,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
