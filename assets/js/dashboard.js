/* ==========================================================================
   ONDA dashboard replica
   Built from the demo data in "ONDA Demo and Notes.pdf". Every chart is
   generated as SVG so bars, lines and figures can animate on scroll.
   Exposes window.OndaDash = { STEPS, mount(el), show(index, opts) }.
   ========================================================================== */
(function () {
  "use strict";

  var C = {
    ink: "#242963",
    gold: "#d5bc67",
    pos: "#116e57",
    neg: "#a8302e",
    lav: ["#0e3b5e", "#6e7199", "#8a8db0", "#a7aac6", "#bcbfd6", "#c8cadd", "#d2d4e4", "#dadce9", "#e1e3ee"],
    entity: ["#4b4f86", "#242963", "#7d80aa", "#a9abc8", "#d9dbe8"]
  };

  /* ---------- story steps (left column copy) ---------- */
  var STEPS = [
    {
      page: 0,
      title: "Cover Page",
      text: "The home page is customisable to your brand and preference. Enter the dashboard via “View Your Portfolio” — a printable report exists as well.",
      tracks: ["Your branding", "Printable report", "Private & confidential"]
    },
    {
      page: 1,
      title: "Portfolio Summary",
      head: "Portfolio Summary",
      text: "Total portfolio value, FYTD return, liquid and illiquid assets, asset allocation and net asset value on one screen. Filter by fiscal year, asset class, entity or holding.",
      tracks: ["Total Portfolio Value", "FYTD Return", "Liquid & Illiquid Assets", "Net Asset Value"]
    },
    {
      page: 2,
      title: "Cumulative Return",
      head: "Cumulative Return",
      dates: "01-Jul-21  to  31-May-26",
      text: "Provides a monthly and financial year view of historical investment performance in $ and %’s.",
      tracks: ["Total Return ($’000)", "Cumulative Total Return", "Monthly Return Summary", "IRR (%)"]
    },
    {
      page: 3,
      title: "Asset Allocation, Liquidity & FX",
      head: "Asset Class, Liquidity & FX Exposures",
      text: "Compare exposures to Asset Classes in an absolute sense and relative to the Portfolio’s Strategic Asset Allocation (SAA), and see what proportion of the portfolio is liquid and in which currencies it is held.",
      tracks: ["Strategic Asset Allocation", "Deviation from SAA", "Portfolio Liquidity", "Currency Exposure"]
    },
    {
      page: 5,
      title: "Entity & Provider Performance",
      head: "Portfolio by Entity",
      text: "Provides a view of Investment Exposures and Performance of a Legal Entity — and by Provider, whether broker, wealth advisor, investment platform, fund or direct holding.",
      tracks: ["Total Group AUM", "Entities by Return", "Entities by IRR", "Entities by MV"]
    },
    {
      page: 7,
      title: "Tear Sheet",
      head: "Tear Sheet",
      text: "A detailed view of a single investment: its value within the portfolio, performance and income using a variety of measures, stock price history, and performance relative to a benchmark.",
      tracks: ["ROI & IRR", "MOIC", "Stock Price", "Indexed Benchmark"]
    },
    {
      page: 12,
      title: "Private Equity",
      head: "Private Equity Cumulative Net Cash Flows",
      dates: "01-Jul-23  to  30-Jun-26",
      text: "Measures actual cash flows for Private Equity investments from calls and distributions, presented on a gross and a net basis — the first portion of a J-Curve report.",
      tracks: ["Cumulative Calls", "Cumulative Distributions", "Net Cash-Flows", "DPI · TVPI · IRR"]
    }
  ];

  var PAGES = [
    "Cover Page", "Portfolio Summary", "Cumulative Return", "Asset Allocation",
    "Investment Performance", "Entity Performance", "Provider Performance", "Tear Sheet",
    "Top & Bottom Performers", "Comparative Performance", "Private Equity Performance (AUD)",
    "Global Private Equity Performance (USD)", "Private Equity Cumulative Net Cash-Flows",
    "Capital Call Forecast Quarterly", "FX Performance Attribution", "Portfolio Activity",
    "Income Activity", "Income Prediction", "Methodologies and Calculations", "FAQs"
  ];

  /* ---------- small helpers ---------- */
  function fmtK(v) {
    var s = Math.abs(v).toLocaleString("en-AU");
    return v < 0 ? "(" + s + ")" : s;
  }
  function td(v, isPct) {
    if (v === null || v === undefined || v === "") return "<td></td>";
    var txt = isPct ? Math.abs(v).toFixed(2) : Math.abs(v).toLocaleString("en-AU");
    if (v < 0) return '<td class="n">(' + txt + ")</td>";
    return "<td>" + txt + "</td>";
  }
  function scale(d0, d1, r0, r1) {
    return function (v) { return r0 + ((v - d0) / (d1 - d0)) * (r1 - r0); };
  }
  function wrapLabel(txt, x, y, anchor) {
    var parts = String(txt).split("\n");
    var out = '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || "middle") + '">';
    parts.forEach(function (p, i) {
      out += '<tspan x="' + x + '" dy="' + (i === 0 ? 0 : 10) + '">' + p + "</tspan>";
    });
    return out + "</text>";
  }
  /* smooth path through points (cardinal spline) */
  function smooth(pts, t) {
    t = t === undefined ? 0.18 : t;
    var d = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) * t, c1y = p1[1] + (p2[1] - p0[1]) * t;
      var c2x = p2[0] - (p3[0] - p1[0]) * t, c2y = p2[1] - (p3[1] - p1[1]) * t;
      d += " C" + c1x.toFixed(1) + "," + c1y.toFixed(1) + " " + c2x.toFixed(1) + "," + c2y.toFixed(1) + " " + p2[0].toFixed(1) + "," + p2[1].toFixed(1);
    }
    return d;
  }
  function yAxis(o, y, ticks, fmt) {
    var s = "";
    ticks.forEach(function (tk) {
      var yy = y(tk);
      s += '<line class="' + (tk === 0 ? "zero" : "grid") + '" x1="' + o.l + '" x2="' + (o.w - o.r) + '" y1="' + yy + '" y2="' + yy + '"/>';
      s += '<text x="' + (o.l - 8) + '" y="' + (yy + 3) + '" text-anchor="end">' + (fmt ? fmt(tk) : tk) + "</text>";
    });
    return s;
  }

  /* vertical bars (positive / negative aware) */
  function vbars(o) {
    var y = scale(o.min, o.max, o.h - o.b, o.t);
    var n = o.data.length, band = (o.w - o.l - o.r) / n, bw = band * (o.bw || 0.62);
    var s = '<svg class="chart" viewBox="0 0 ' + o.w + " " + o.h + '" preserveAspectRatio="xMidYMid meet">';
    s += yAxis(o, y, o.ticks, o.fmt);
    if (o.yTitle) s += '<text transform="translate(10 ' + ((o.t + o.h - o.b) / 2) + ') rotate(-90)" text-anchor="middle">' + o.yTitle + "</text>";
    o.data.forEach(function (d, i) {
      var x = o.l + band * i + (band - bw) / 2;
      var y0 = y(0), y1 = y(d.v), top = Math.min(y0, y1), hgt = Math.max(1, Math.abs(y1 - y0));
      var col = d.c || (d.v < 0 ? C.neg : o.color || C.pos);
      s += '<rect class="bar" data-neg="' + (d.v < 0 ? 1 : 0) + '" x="' + x.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hgt.toFixed(1) + '" fill="' + col + '" rx="1"/>';
      if (d.l !== undefined && !o.noLabels) s += wrapLabel(d.l, x + bw / 2, o.h - o.b + 13);
    });
    if (o.overlay) s += o.overlay(o, band, y);
    return s + "</svg>";
  }

  /* line chart, one or many series */
  function lines(o) {
    var y = scale(o.min, o.max, o.h - o.b, o.t);
    var n = o.labels.length, step = (o.w - o.l - o.r) / (n - 1);
    var s = '<svg class="chart" viewBox="0 0 ' + o.w + " " + o.h + '" preserveAspectRatio="xMidYMid meet">';
    s += yAxis(o, y, o.ticks, o.fmt);
    if (o.yTitle) s += '<text transform="translate(10 ' + ((o.t + o.h - o.b) / 2) + ') rotate(-90)" text-anchor="middle">' + o.yTitle + "</text>";
    o.labels.forEach(function (lb, i) {
      if (lb) s += wrapLabel(lb, o.l + step * i, o.h - o.b + 14);
    });
    o.series.forEach(function (se) {
      var pts = se.vals.map(function (v, i) { return [o.l + step * i, y(v)]; });
      var d = smooth(pts, se.t);
      if (se.area) {
        s += '<path class="area" d="' + d + " L" + pts[pts.length - 1][0] + "," + (o.h - o.b) + " L" + pts[0][0] + "," + (o.h - o.b) + ' Z" fill="' + se.color + '" fill-opacity="0.16"/>';
      }
      s += '<path class="draw" d="' + d + '" fill="none" stroke="' + se.color + '" stroke-width="' + (se.width || 1.8) + '" stroke-linecap="round"/>';
      if (se.dots) {
        pts.forEach(function (p) {
          s += '<circle class="dot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.6" fill="' + (se.dotColor || se.color) + '"/>';
        });
      }
    });
    return s + "</svg>";
  }

  /* horizontal bars, optionally paired (current vs target) */
  function hbars(o) {
    var x = scale(0, o.max, o.l, o.w - o.r);
    var n = o.data.length, band = (o.h - o.t - o.b) / n;
    var s = '<svg class="chart" viewBox="0 0 ' + o.w + " " + o.h + '" preserveAspectRatio="xMidYMid meet">';
    (o.ticks || []).forEach(function (tk) {
      s += '<line class="grid" x1="' + x(tk) + '" x2="' + x(tk) + '" y1="' + o.t + '" y2="' + (o.h - o.b) + '"/>';
      s += '<text x="' + x(tk) + '" y="' + (o.h - o.b + 13) + '" text-anchor="middle">' + tk + "</text>";
    });
    if (o.xTitle) s += '<text x="' + ((o.l + o.w - o.r) / 2) + '" y="' + (o.h - 2) + '" text-anchor="middle">' + o.xTitle + "</text>";
    o.data.forEach(function (d, i) {
      var yb = o.t + band * i;
      s += '<text class="lbl-strong" x="' + (o.l - 8) + '" y="' + (yb + band / 2 + 3) + '" text-anchor="end">' + d.l + "</text>";
      var vals = d.v instanceof Array ? d.v : [d.v];
      var bh = Math.min(o.barH || 14, (band * 0.72) / vals.length);
      var start = yb + (band - bh * vals.length - (vals.length - 1) * 2) / 2;
      vals.forEach(function (v, j) {
        var col = (o.colors && o.colors[j]) || d.c || C.ink;
        s += '<rect class="hbar" x="' + o.l + '" y="' + (start + j * (bh + 2)).toFixed(1) + '" width="' + Math.max(1, x(v) - o.l).toFixed(1) + '" height="' + bh.toFixed(1) + '" fill="' + col + '"/>';
      });
      if (o.values) s += '<text class="lbl-strong" x="' + (x(vals[0]) + 6) + '" y="' + (yb + band / 2 + 3) + '">' + vals[0].toFixed(2) + "</text>";
    });
    return s + "</svg>";
  }

  /* donut drawn from arcs so each segment can "draw" in */
  function donut(o) {
    var cx = o.size / 2, cy = o.size / 2, r = o.r, total = 0, a0 = -Math.PI / 2;
    o.segs.forEach(function (sg) { total += sg.v; });
    var s = '<svg class="chart" viewBox="0 0 ' + o.size + " " + o.size + '" preserveAspectRatio="xMidYMid meet">';
    o.segs.forEach(function (sg) {
      var a1 = a0 + (sg.v / total) * Math.PI * 2 - 0.004;
      var large = a1 - a0 > Math.PI ? 1 : 0;
      var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      s += '<path class="draw arc" d="M' + x0.toFixed(2) + "," + y0.toFixed(2) + " A" + r + "," + r + " 0 " + large + " 1 " + x1.toFixed(2) + "," + y1.toFixed(2) + '" fill="none" stroke="' + sg.c + '" stroke-width="' + o.thick + '"/>';
      var am = (a0 + a1) / 2, lr = r + o.thick / 2 + 14;
      if (sg.label) {
        var lx = cx + lr * Math.cos(am), ly = cy + lr * Math.sin(am);
        s += '<text class="lbl-strong" x="' + lx.toFixed(1) + '" y="' + (ly + 3).toFixed(1) + '" text-anchor="' + (Math.cos(am) >= 0 ? "start" : "end") + '">' + sg.label + "</text>";
      }
      a0 = a1 + 0.004;
    });
    return s + "</svg>";
  }

  function kpi(label, num, opts) {
    opts = opts || {};
    return '<div class="card kpi"><h6>' + label + "</h6>" +
      '<strong><span data-num="' + num + '" data-dec="' + (opts.dec === undefined ? 2 : opts.dec) + '" data-pre="' + (opts.pre || "") + '" data-suf="' + (opts.suf || "") + '">' +
      (opts.pre || "") + num.toFixed(opts.dec === undefined ? 2 : opts.dec) + (opts.suf || "") + "</span></strong>" +
      (opts.delta ? '<span class="delta">▲ ' + opts.delta + "</span>" : "") +
      "<small>" + (opts.note || "") + "</small></div>";
  }

  /* ======================================================================
     Panels
     ====================================================================== */

  function panelSummary() {
    var alloc = [
      { l: "Property", v: 38.77 }, { l: "Int’l\nEquity", v: 22.86 }, { l: "Australian\nEquity", v: 17.21 },
      { l: "Hedge\nFunds", v: 8.36 }, { l: "Fixed\nIncome", v: 4.15 }, { l: "Private\nCredit", v: 3.43 },
      { l: "Private\nEquity", v: 3.02 }, { l: "Collectibles", v: 1.24 }, { l: "Cash &\nCash Equiv.", v: 0.96 }
    ].map(function (d, i) { d.c = C.lav[i]; return d; });

    var rows = [
      ["Property", 108945, 3851, 116107, 2059, 5970, 5.44],
      ["Private Equity", 8501, 1140, 9033, 105, -503, -5.47],
      ["Private Credit", 8079, 2582, 10275, 623, 317, 3.49],
      ["International Equity", 54351, 9064, 68473, 637, 5696, 9.91],
      ["Hedge Funds", 15058, 5658, 25032, 224, 4539, 27.10],
      ["Fixed Income", 12973, -564, 12428, 211, 220, 1.74],
      ["Australian Equity", 46224, 3135, 51529, 1363, 3534, 7.53]
    ];
    var tbody = rows.map(function (r) {
      return "<tr><td>" + r[0] + "</td>" + td(r[1]) + td(r[2]) + td(r[3]) + td(r[4]) + td(r[5]) + td(r[6], true) + "</tr>";
    }).join("");

    return '<div class="panel" style="grid-template-rows:84px minmax(0,1fr)">' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">' +
        kpi("Total Portfolio Value", 299.47, { pre: "$", suf: "M", delta: "4.63%", note: "Vs Last Month" }) +
        kpi("FYTD Return", 7.32, { suf: "%", delta: "44.45%", note: "Vs Same Period Last Year" }) +
        kpi("Liquid Assets", 150.49, { pre: "$", suf: "M", delta: "6.26%", note: "Vs Last Month" }) +
        kpi("Illiquid Assets", 148.98, { pre: "$", suf: "M", delta: "3.03%", note: "Vs Last Month" }) +
      "</div>" +
      '<div style="display:grid;grid-template-columns:0.92fr 1.08fr;gap:10px;min-height:0">' +
        '<div class="card"><h5>Asset Allocation</h5><div style="height:calc(100% - 18px)">' +
          vbars({ w: 440, h: 420, l: 34, r: 6, t: 8, b: 36, min: 0, max: 40, ticks: [0, 10, 20, 30, 40], data: alloc, yTitle: "Asset Allocation (%)" }) +
        "</div></div>" +
        '<div style="display:grid;grid-template-rows:0.9fr 1.1fr;gap:10px;min-height:0">' +
          '<div class="card"><h5>Net Asset Value</h5>' +
            '<div class="legend"><span><i style="background:' + C.ink + '"></i>Closing MV (Net)</span><span><i style="background:' + C.gold + '"></i>Closing MV (Exc Cash &amp; Loan)</span></div>' +
            '<div style="height:calc(100% - 34px)">' +
            lines({ w: 500, h: 150, l: 52, r: 10, t: 6, b: 22, min: 250, max: 305, ticks: [260, 280, 300],
              fmt: function (v) { return v + ",000"; },
              labels: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"],
              series: [
                { vals: [262, 265.5, 270.5, 275.4, 274.6, 280.9, 281.2, 287.3, 278.1, 284.4, 296.9], color: C.ink, dots: true, width: 1.6 },
                { vals: [260.2, 263.4, 268.6, 273.1, 272.9, 279.2, 278.8, 285.1, 275.9, 281.8, 293.6], color: C.gold, dots: true, width: 1.6 }
              ] }) +
          "</div></div>" +
          '<div class="card"><h5>Performance Summary</h5>' +
            '<table class="dtable dtable--tight"><thead><tr><th>Asset Class</th><th>Opening MV<br>($’000)</th><th>Net Cash Flow<br>($’000)</th><th>Current MV<br>($’000)</th><th>Income<br>($’000)</th><th>Return<br>($’000)</th><th>IRR<br>(%)</th></tr></thead>' +
            "<tbody>" + tbody + '<tr class="total"><td>Total</td><td>260,479</td><td>25,060</td><td>299,470</td><td>5,932</td><td>19,873</td><td>7.43</td></tr></tbody></table>' +
          "</div>" +
        "</div>" +
      "</div></div>";
  }

  function panelCumulative() {
    var q = [400, 800, -700, -3500, -100, 2200, 1300, 1900, 600, 4700, 4900, 1500, 5500, 6100, -4600, 9000, 10300, 3500, -9000, 13600];
    var qLabels = ["Q3\n2021", "Q4", "Q1\n2022", "Q2", "Q3", "Q4", "Q1\n2023", "Q2", "Q3", "Q4", "Q1\n2024", "Q2", "Q3", "Q4", "Q1\n2025", "Q2", "Q3", "Q4", "Q1\n2026", "Q2"];
    var cum = [];
    q.reduce(function (acc, v) { acc += v / 1000; cum.push(acc); return acc; }, 0);

    var overlay = function (o, band) {
      var yR = scale(-12, 52, o.h - o.b, o.t);
      var pts = cum.map(function (v, i) { return [o.l + band * i + band / 2, yR(v)]; });
      var s = '<path class="draw" d="' + smooth(pts) + '" fill="none" stroke="' + C.ink + '" stroke-width="2"/>';
      pts.forEach(function (p) { s += '<circle class="dot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.4" fill="' + C.ink + '"/>'; });
      [0, 10, 20, 30, 40, 50].forEach(function (tk) {
        s += '<text x="' + (o.w - o.r + 8) + '" y="' + (yR(tk) + 3) + '">' + tk + "</text>";
      });
      s += '<text transform="translate(' + (o.w - 6) + " " + ((o.t + o.h - o.b) / 2) + ') rotate(90)" text-anchor="middle">Cumulative Total Return ($M)</text>';
      return s;
    };

    var months = [
      ["2021", null, null, null, null, null, null, 3.66, 1.46, -1.45, -0.04, 2.44, 2.03, 9.12],
      ["2022", -3.83, -1.05, 1.63, -0.51, -3.27, -4.82, 2.63, 0.00, -2.72, 1.78, 2.10, 0.31, -5.24],
      ["2023", 2.19, -0.27, 0.37, 0.59, -0.27, 1.49, 1.07, 0.36, -0.88, -1.33, 1.97, 3.08, 8.57],
      ["2024", 0.52, 1.28, 1.86, -0.49, -0.38, 1.58, 1.58, -0.36, 1.68, 0.85, 1.60, 0.62, 11.06],
      ["2025", 1.65, -1.28, -2.59, -0.24, 2.04, 2.36, 1.54, 1.32, 1.56, 0.77, -0.69, 1.36, 8.27],
      ["2026", -0.05, -0.18, -3.23, 2.18, 3.15, null, null, null, null, null, null, null, 1.79]
    ];
    var body = months.map(function (r) {
      var cells = "<td>" + r[0] + "</td>";
      for (var i = 1; i < r.length; i++) cells += r[i] === null ? "<td></td>" : td(r[i], true).replace("<td", i === r.length - 1 ? '<td style="font-weight:700"' : "<td");
      return "<tr>" + cells + "</tr>";
    }).join("");

    return '<div class="panel" style="grid-template-rows:1.3fr 1fr">' +
      '<div class="card"><h5>Total Return &amp; Cumulative Total Return</h5>' +
        '<div class="legend" style="justify-content:center"><span><i style="background:' + C.pos + '"></i>Total Return Positive ($’000)</span><span><i style="background:' + C.neg + '"></i>Total Return Negative ($’000)</span><span><i style="background:' + C.ink + '"></i>Cumulative Total Return ($M)</span></div>' +
        '<div style="height:calc(100% - 34px)">' +
        vbars({ w: 940, h: 250, l: 60, r: 44, t: 8, b: 30, min: -11000, max: 14500, ticks: [-10000, -5000, 0, 5000, 10000],
          fmt: function (v) { return v < 0 ? "(" + Math.abs(v).toLocaleString("en-AU") + ")" : v.toLocaleString("en-AU"); },
          data: q.map(function (v, i) { return { v: v, l: qLabels[i] }; }), yTitle: "Monthly Return ($’000)", overlay: overlay }) +
      "</div></div>" +
      '<div class="card"><h5>Monthly Total Return Summary (%)</h5>' +
        '<table class="dtable"><thead><tr><th>Year</th><th>Jan</th><th>Feb</th><th>Mar</th><th>Apr</th><th>May</th><th>Jun</th><th>Jul</th><th>Aug</th><th>Sep</th><th>Oct</th><th>Nov</th><th>Dec</th><th>IRR (%)</th></tr></thead><tbody>' + body + "</tbody></table>" +
      "</div></div>";
  }

  function panelAllocation() {
    var saa = [
      ["Property", 38.77, 30], ["International Equity", 22.86, 20], ["Australian Equity", 17.21, 20],
      ["Hedge Funds", 8.36, 10], ["Fixed Income", 4.15, 4], ["Private Credit", 3.43, 3],
      ["Private Equity", 3.02, 10], ["Collectables", 1.24, 1], ["Cash & Cash Equivalents", 0.96, 2]
    ].map(function (r) { return { l: r[0], v: [r[1], r[2]] }; });

    var fx = [["AUD", 86.02], ["USD", 12.42], ["JPY", 0.98], ["HKD", 0.44], ["EUR", 0.11], ["GBP", 0.02]]
      .map(function (r, i) { return { l: r[0], v: r[1], c: i === 0 ? C.ink : "#bfc3da" }; });

    return '<div class="panel" style="grid-template-rows:1.12fr 1fr">' +
      '<div class="card"><h5>Asset Allocation vs Strategic Asset Allocation (SAA)</h5>' +
        '<div class="legend"><span><i style="background:' + C.gold + '"></i>Current (%)</span><span><i style="background:' + C.ink + '"></i>SAA (%)</span><span style="margin-left:auto;color:' + C.pos + ';font-weight:600">✓ Asset Allocation within Target Bands</span></div>' +
        '<div style="height:calc(100% - 34px)">' +
        hbars({ w: 940, h: 240, l: 130, r: 20, t: 4, b: 4, max: 40, data: saa, colors: [C.gold, C.ink], barH: 8 }) +
      "</div></div>" +
      '<div style="display:grid;grid-template-columns:0.9fr 1.1fr;gap:10px;min-height:0">' +
        '<div class="card"><h5>Portfolio Liquidity</h5>' +
          '<div class="legend"><span><i style="background:' + C.ink + '"></i>Liquid</span><span><i style="background:' + C.gold + '"></i>Illiquid</span></div>' +
          '<div style="height:calc(100% - 34px)">' +
          donut({ size: 220, r: 62, thick: 30, segs: [{ v: 50.25, c: C.ink, label: "50.25%" }, { v: 49.75, c: C.gold, label: "49.75%" }] }) +
        "</div></div>" +
        '<div class="card"><h5>Currency Exposure</h5><div style="height:calc(100% - 18px)">' +
          hbars({ w: 520, h: 210, l: 40, r: 40, t: 6, b: 26, max: 90, ticks: [0, 20, 40, 60, 80], data: fx, values: true, barH: 18, xTitle: "Closing MV (%)" }) +
        "</div></div>" +
      "</div></div>";
  }

  function panelEntity() {
    var rows = [
      ["Direct Assets", 29.37, 72537, 4024, 79224, 1626, 4289, 5.82],
      ["ONDA Alpha Strat", 14.80, 28113, 10159, 39920, 169, 1817, 6.26],
      ["ONDA Investment Trust No 1", 31.05, 73454, 7941, 83751, 1700, 4057, 5.24],
      ["ONDA Investment Trust No 2", 23.78, 54588, 2865, 64140, 1630, 8317, 14.88],
      ["ONDA Super", 1.01, 2751, -77, 2716, 70, 112, 4.21]
    ];
    var body = rows.map(function (r) {
      return "<tr><td>" + r[0] + "</td>" + td(r[1], true) + td(r[2]) + td(r[3]) + td(r[4]) + td(r[5]) + td(r[6]) + td(r[7], true) + "</tr>";
    }).join("");
    var names = ["ONDA\nTrust No 2", "Direct\nAssets", "ONDA\nTrust No 1", "ONDA\nAlpha Strat", "ONDA\nSuper"];

    return '<div class="panel" style="grid-template-rows:84px auto minmax(0,1fr)">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">' +
        kpi("Total Group AUM", 269.75, { pre: "$", suf: "M", delta: "4.87%", note: "vs. Last Month" }) +
        '<div class="card kpi"><h6>Entities</h6><strong><span data-num="5" data-dec="0">5</span></strong><small>Total of <b>224</b> Holdings</small></div>' +
        kpi("Income", 5.19, { pre: "$", suf: "M", delta: "9.61%", note: "vs. Same Period Last Year" }) +
      "</div>" +
      '<div class="card"><h5>Asset Allocation and Performance</h5>' +
        '<table class="dtable"><thead><tr><th>Entity</th><th>Allocation (%)</th><th>Opening MV ($’000)</th><th>Net Purchases (Sales) ($’000)</th><th>Current MV ($’000)</th><th>Income ($’000)</th><th>Return ($’000)</th><th>IRR (%)</th></tr></thead>' +
        "<tbody>" + body + '<tr class="total"><td>Total</td><td>100.00</td><td>231,442</td><td>24,912</td><td>269,750</td><td>5,195</td><td>18,592</td><td>7.79</td></tr></tbody></table>' +
      "</div>" +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;min-height:0">' +
        '<div class="card"><h5>Entities by Return</h5><div style="height:calc(100% - 18px)">' +
          vbars({ w: 300, h: 190, l: 40, r: 4, t: 6, b: 28, min: 0, max: 10000, ticks: [0, 5000, 10000], fmt: function (v) { return v.toLocaleString("en-AU"); },
            data: [8317, 4289, 4057, 1817, 112].map(function (v, i) { return { v: v, l: names[i] }; }) }) +
        "</div></div>" +
        '<div class="card"><h5>Entities by IRR (%)</h5><div style="height:calc(100% - 18px)">' +
          vbars({ w: 300, h: 190, l: 26, r: 4, t: 6, b: 28, min: 0, max: 20, ticks: [0, 5, 10, 15, 20],
            data: [14.88, 6.26, 5.82, 5.24, 4.21].map(function (v, i) { return { v: v, l: ["ONDA\nTrust No 2", "ONDA\nAlpha Strat", "Direct\nAssets", "ONDA\nTrust No 1", "ONDA\nSuper"][i] }; }) }) +
        "</div></div>" +
        '<div class="card"><h5>Entities by MV (%)</h5><div style="height:calc(100% - 18px)">' +
          donut({ size: 200, r: 52, thick: 26, segs: [
            { v: 31.05, c: C.entity[0], label: "31.05%" }, { v: 29.37, c: C.entity[1], label: "29.37%" },
            { v: 23.78, c: C.entity[2], label: "23.78%" }, { v: 14.8, c: C.entity[3], label: "14.8%" },
            { v: 1.01, c: C.entity[4], label: "1.01%" }] }) +
        "</div></div>" +
      "</div></div>";
  }

  function panelTearSheet() {
    var mths = ["Jul\n2025", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan\n2026", "Feb", "Mar", "Apr", "May"];
    var roi = [5, 12, 13, 14, 12, 21, 33, 48, 37, 43, 58];

    var waterfall = (function () {
      var o = { w: 440, h: 160, l: 30, r: 6, t: 6, b: 24 };
      var y = scale(0, 62, o.h - o.b, o.t);
      var band = (o.w - o.l - o.r) / roi.length, bw = band * 0.6;
      var s = '<svg class="chart" viewBox="0 0 ' + o.w + " " + o.h + '" preserveAspectRatio="xMidYMid meet">';
      s += yAxis(o, y, [0, 20, 40, 60]);
      var prev = 0;
      roi.forEach(function (v, i) {
        var x = o.l + band * i + (band - bw) / 2, up = v >= prev;
        var top = y(Math.max(v, prev)), hgt = Math.max(1.5, Math.abs(y(v) - y(prev)));
        s += '<rect class="bar" data-neg="' + (up ? 0 : 1) + '" x="' + x.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hgt.toFixed(1) + '" fill="' + (up ? C.pos : C.neg) + '"/>';
        s += wrapLabel(mths[i], x + bw / 2, o.h - o.b + 12);
        prev = v;
      });
      return s + "</svg>";
    })();

    function kv(rows) {
      return '<table class="dtable dtable--tight" style="font-size:9.5px">' + rows.map(function (r) {
        return '<tr><td style="font-weight:500;color:#5b6078;border:0;padding:1.6px 0">' + r[0] + '</td><td style="text-align:' + (r[2] || "left") + ';border:0;padding:1.6px 0;font-weight:600">' + r[1] + "</td></tr>";
      }).join("") + "</table>";
    }

    return '<div class="panel" style="grid-template-rows:128px 1fr 1fr">' +
      '<div style="display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:10px">' +
        '<div class="card"><h5>Investment Detail</h5>' + kv([["Name", "Bhp Group Limited"], ["Geography", "Australia"], ["Asset Class", "Australian Equity"], ["Sub Class", "Australian Equity - Direct"], ["Symbol", "BHP"], ["Manager", "JPMorgan, UBS, Minchin"]]) + "</div>" +
        '<div class="card"><h5>My Position</h5>' + kv([["Quantity", "20,272.00", "right"], ["Last Price", "62.31", "right"], ["Opening Value", "982,143.75", "right"], ["Current Value", "1,263,148.32", "right"], ["Currency", "AUD", "right"], ["% of Total Portfolio", "0.42", "right"]]) + "</div>" +
        '<div class="card"><h5>Performance</h5>' + kv([["Income ($)", "34,761", "right"], ["Total Return ($)", "529,495", "right"], ["ROI (%)", "46.16", "right"], ["IRR (%)", '<span data-num="78.72" data-dec="2">78.72</span>', "right"], ["MOIC", "1.58", "right"], ["Cost Return (%)", "28.64", "right"]]) + "</div>" +
      "</div>" +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;min-height:0">' +
        '<div class="card"><h5>Market Value</h5><div style="height:calc(100% - 18px)">' +
          lines({ w: 440, h: 160, l: 40, r: 8, t: 6, b: 24, min: 700, max: 1300, ticks: [800, 1000, 1200], fmt: function (v) { return v.toLocaleString("en-AU"); },
            labels: mths, series: [{ vals: [1050, 790, 780, 800, 760, 820, 900, 1010, 950, 1010, 1263], color: C.ink, width: 2, dots: true, t: 0.2 }], yTitle: "Market Value ($K)" }) +
        "</div></div>" +
        '<div class="card"><h5>Return on Investment</h5><div style="height:calc(100% - 18px)">' + waterfall + "</div></div>" +
      "</div>" +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;min-height:0">' +
        '<div class="card"><h5>Stock Price</h5><div style="height:calc(100% - 18px)">' +
          lines({ w: 440, h: 160, l: 40, r: 8, t: 6, b: 24, min: 36, max: 64, ticks: [40, 50, 60],
            labels: mths, series: [{ vals: [39, 43.2, 42.6, 43.6, 41.9, 45.6, 50.6, 58.6, 50.4, 54, 62.3], color: C.ink, width: 2, dots: true, t: 0.2 }], yTitle: "Price ($)" }) +
        "</div></div>" +
        '<div class="card"><h5>Performance Benchmark: Asset NAV vs Indexed Benchmark</h5>' +
          '<div class="legend"><span><i style="background:' + C.gold + '"></i>Bhp Group Limited</span><span><i style="background:' + C.ink + '"></i>ASX 200 Accum</span></div>' +
          '<div style="height:calc(100% - 34px)">' +
          lines({ w: 440, h: 140, l: 30, r: 8, t: 6, b: 22, min: 0.95, max: 1.75, ticks: [1, 1.2, 1.4, 1.6], fmt: function (v) { return v.toFixed(1); },
            labels: ["Jul 2025", "", "Sep 2025", "", "Nov 2025", "", "Jan 2026", "", "Mar 2026", "", "May 2026", ""],
            series: [
              { vals: [1, 1.07, 1.17, 1.15, 1.18, 1.13, 1.24, 1.37, 1.59, 1.37, 1.47, 1.7], color: C.gold, area: true, dots: true, dotColor: "#7fb3e0", width: 1.8 },
              { vals: [1, 1.02, 1.05, 1.05, 1.05, 1.03, 1.04, 1.06, 1.1, 1.02, 1.04, 1.05], color: C.ink, dots: true, width: 1.8 }
            ] }) +
        "</div></div>" +
      "</div></div>";
  }

  function panelPrivateEquity() {
    var calls = [0, 0, 0, 0, -0.9, -0.9, -1.4, -1.4, -1.6, -2.9, -2.9, -3.7, -3.85, -4.0, -4.0, -4.0, -4.25, -4.5, -4.5, -4.65, -4.85, -5.95, -6.1, -7.0, -7.45, -7.45, -7.55, -7.95, -7.95, -7.95, -7.95, -7.95, -7.95, -7.95, -8.2, -8.2];
    var dist = [0, 0, 0, 0, 0.1, 0.1, 0.1, 0.1, 0.4, 0.4, 0.4, 0.4, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.5, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1];
    var mn = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    var labels = calls.map(function (_, i) { var mi = i % 12, yr = 2023 + Math.floor((i + 6) / 12); return mn[mi] + "\n" + yr; });

    var o = { w: 940, h: 330, l: 40, r: 8, t: 8, b: 30 };
    var y = scale(-9, 1.6, o.h - o.b, o.t);
    var band = (o.w - o.l - o.r) / calls.length, bw = band * 0.72;
    var s = '<svg class="chart" viewBox="0 0 ' + o.w + " " + o.h + '" preserveAspectRatio="xMidYMid meet">';
    s += yAxis(o, y, [-8, -6, -4, -2, 0], function (v) { return v + "M"; });
    var net = [];
    calls.forEach(function (c, i) {
      var x = o.l + band * i + (band - bw) / 2, y0 = y(0);
      if (c < 0) s += '<rect class="bar" data-neg="1" x="' + x.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (y(c) - y0).toFixed(1) + '" fill="' + C.neg + '"/>';
      if (dist[i] > 0) s += '<rect class="bar" data-neg="0" x="' + x.toFixed(1) + '" y="' + y(dist[i]).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (y0 - y(dist[i])).toFixed(1) + '" fill="' + C.pos + '"/>';
      s += wrapLabel(labels[i], x + bw / 2, o.h - o.b + 12);
      net.push([x + bw / 2, y(c + dist[i])]);
    });
    s += '<path class="draw" d="' + smooth(net, 0.2) + '" fill="none" stroke="' + C.ink + '" stroke-width="2.2"/>';
    s += "</svg>";

    return '<div class="panel" style="grid-template-rows:84px minmax(0,1fr)">' +
      '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px">' +
        kpi("Commitment", 19.99, { pre: "$", suf: "M", note: "Private Equity - Fund" }) +
        kpi("Called", 11.24, { pre: "$", suf: "M", note: "Capital called" }) +
        kpi("Uncalled", 8.75, { pre: "$", suf: "M", note: "Remaining" }) +
        kpi("Distribution", 1.14, { pre: "$", suf: "M", note: "To date" }) +
        kpi("Current MV", 9.03, { pre: "$", suf: "M", note: "As of 31-May-26" }) +
        kpi("TVPI", 0.91, { suf: "x", note: "DPI 0.10" }) +
      "</div>" +
      '<div class="card"><h5>Cumulative Net Cash Flows</h5>' +
        '<div class="legend" style="justify-content:center"><span><i style="background:' + C.neg + '"></i>Cumulative Calls</span><span><i style="background:' + C.pos + '"></i>Cumulative Distributions</span><span><i style="background:' + C.ink + '"></i>Cumulative Net Cash-Flows</span></div>' +
        '<div style="height:calc(100% - 34px)">' + s + "</div>" +
      "</div></div>";
  }

  /* ======================================================================
     Shell
     ====================================================================== */

  var ICON_HOME = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5 2 10.2V22h7v-6.5h6V22h7V10.2z"/></svg>';
  var ICON_BARS = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="3" y="10" width="3.5" height="11"/><rect x="8.5" y="4" width="3.5" height="17"/><rect x="14" y="13" width="3.5" height="8"/><rect x="2" y="21" width="20" height="1.6"/></svg>';
  var ICON_FILTER = '<svg viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M1 1.5h14M4 6h8M6.5 10.5h3"/></svg>';
  var CURSOR = '<svg class="cursor" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 2l13 7.2-5.6 1.4L7.6 16z" fill="#fff" stroke="#15171c" stroke-width="1.2" stroke-linejoin="round"/></svg>';

  var el = {}, current = -1, panels = [], gsap = window.gsap;

  function mount(root) {
    var side = PAGES.map(function (p, i) { return '<li data-page="' + i + '">' + p + "</li>"; }).join("");
    root.innerHTML =
      '<div class="dash__chrome"><span class="dash__dots"><i></i><i></i><i></i></span><span>ONDA Platform</span>' +
        '<span class="dash__url">platform.ondagroup.com / investment-report</span>' +
        '<span class="dash__secure"><i></i>Secure session</span></div>' +
      '<div class="dash__body">' +
        '<aside class="dash__side"><h4>Pages <span>‹</span></h4><ul>' + side + '<span class="dash__marker"></span></ul></aside>' +
        '<div class="dash__main">' +
          '<div class="dash__head"><span class="dash__icon">' + ICON_BARS + '</span><span class="dash__title">Portfolio Summary</span>' +
            '<span class="dash__badge">ONDA</span><span class="dash__arrows"><i>‹</i><i>›</i></span></div>' +
          '<div class="dash__filter">' + ICON_FILTER + '<span class="dash__dates">01-Jul-25  to  31-May-26</span></div>' +
          '<div class="dash__panels"></div>' +
          '<div class="dash__foot"><span>© 2026 ONDA GROUP DASHBOARD</span><span class="dash__tools"><i></i><i></i><i></i></span></div>' +
          '<div class="cover">' +
            '<img class="cover__logo" src="assets/img/logo-white.webp" alt="">' +
            '<div class="cover__report">Investment Report</div>' +
            '<div class="cover__dates">01-Jul-25 &nbsp; to &nbsp; 31-May-26</div>' +
            '<div class="cover__rule"></div>' +
            '<div class="cover__title">Family Office Investment Reporting Reimagined</div>' +
            '<span class="cover__btn">View Your Portfolio</span>' +
            '<div class="cover__conf">This report is <b>private and confidential.</b></div>' +
            '<div class="cover__loc">Lamington National Park (Woonoongoora),<br>Yugambeh Country,<br>Queensland</div>' +
          "</div>" +
          CURSOR +
        "</div>" +
      "</div>";

    el.root = root;
    el.side = root.querySelectorAll(".dash__side li");
    el.marker = root.querySelector(".dash__marker");
    el.title = root.querySelector(".dash__title");
    el.icon = root.querySelector(".dash__icon");
    el.dates = root.querySelector(".dash__dates");
    el.panels = root.querySelector(".dash__panels");
    el.cover = root.querySelector(".cover");
    el.btn = root.querySelector(".cover__btn");
    el.cursor = root.querySelector(".cursor");
    el.arrows = root.querySelectorAll(".dash__arrows i");

    var builders = [null, panelSummary, panelCumulative, panelAllocation, panelEntity, panelTearSheet, panelPrivateEquity];
    builders.forEach(function (b, i) {
      if (!b) { panels[i] = null; return; }
      var wrap = document.createElement("div");
      wrap.innerHTML = b();
      panels[i] = wrap.firstChild;
      el.panels.appendChild(panels[i]);
    });

    // remember final bar geometry so it can be grown back from zero
    root.querySelectorAll(".bar").forEach(function (r) {
      r.dataset.y = r.getAttribute("y");
      r.dataset.h = r.getAttribute("height");
    });
    root.querySelectorAll(".hbar").forEach(function (r) { r.dataset.w = r.getAttribute("width"); });

    // measure strokes once so they can draw in
    root.querySelectorAll(".draw").forEach(function (p) {
      var len = p.getTotalLength ? Math.ceil(p.getTotalLength()) + 2 : 1000;
      p.style.strokeDasharray = len;
      p.dataset.len = len;
    });
  }

  function moveMarker(pageIdx) {
    el.side.forEach(function (li, i) { li.classList.toggle("is-on", i === pageIdx); });
    var li = el.side[pageIdx];
    if (!li) return;
    el.marker.style.height = li.offsetHeight + "px";
    el.marker.style.transform = "translateY(" + li.offsetTop + "px)";
  }

  function countUp(node, reduced) {
    var to = parseFloat(node.dataset.num), dec = parseInt(node.dataset.dec || "2", 10);
    var pre = node.dataset.pre || "", suf = node.dataset.suf || "";
    var render = function (v) { node.textContent = pre + v.toLocaleString("en-AU", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; };
    if (reduced) { render(to); return; }
    var o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.3, ease: "power3.out", onUpdate: function () { render(o.v); } });
  }

  function animateIn(panel, reduced) {
    var tl = gsap.timeline();
    var cards = panel.querySelectorAll(".card");
    var bars = panel.querySelectorAll(".bar");
    var hb = panel.querySelectorAll(".hbar");
    var draws = panel.querySelectorAll(".draw");
    var dots = panel.querySelectorAll(".dot");
    var areas = panel.querySelectorAll(".area");
    var rows = panel.querySelectorAll("tbody tr");

    gsap.set(panel, { autoAlpha: 1, y: 0 });
    panel.classList.add("is-on");
    panel.querySelectorAll("[data-num]").forEach(function (n) { countUp(n, reduced); });

    if (reduced) {
      draws.forEach(function (p) { p.style.strokeDashoffset = 0; });
      return tl;
    }

    // bars grow from their baseline by animating geometry (SVG transform origins are unreliable)
    var bar = function (r) { return { y: +r.dataset.y, h: +r.dataset.h, neg: r.dataset.neg === "1" }; };
    var add = function (targets, from, to, at) { if (targets.length) tl.fromTo(targets, from, to, at); };

    add(cards, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power3.out" }, 0);
    add(bars,
      { attr: { height: 0, y: function (i, t) { var b = bar(t); return b.neg ? b.y : b.y + b.h; } } },
      { attr: { height: function (i, t) { return bar(t).h; }, y: function (i, t) { return bar(t).y; } },
        duration: 0.8, ease: "power3.out", stagger: Math.min(0.04, 0.9 / Math.max(1, bars.length)) }, 0.12);
    add(hb, { attr: { width: 0 } }, { attr: { width: function (i, t) { return +t.dataset.w; } }, duration: 0.8, stagger: 0.03, ease: "power3.out" }, 0.12);
    add(draws, { strokeDashoffset: function (i, t) { return t.dataset.len; } }, { strokeDashoffset: 0, duration: 1.2, stagger: 0.12, ease: "power2.inOut" }, 0.2);
    add(areas, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 0.8);
    add(dots, { attr: { r: 0 } }, { attr: { r: 2.6 }, duration: 0.3, stagger: 0.012, ease: "back.out(3)" }, 0.6);
    add(rows, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.035, ease: "power2.out" }, 0.25);
    return tl;
  }

  function pressCursor(target, onDone) {
    var main = el.root.querySelector(".dash__main").getBoundingClientRect();
    var r = target.getBoundingClientRect();
    var k = main.width / el.root.querySelector(".dash__main").offsetWidth || 1; // account for stage scale
    var x = (r.left - main.left) / k + (r.width / k) * 0.6;
    var y = (r.top - main.top) / k + (r.height / k) * 0.55;
    return gsap.timeline({ onComplete: onDone })
      .set(el.cursor, { x: x + 160, y: y + 120, autoAlpha: 0 })
      .to(el.cursor, { autoAlpha: 1, duration: 0.15 })
      .to(el.cursor, { x: x, y: y, duration: 0.55, ease: "power2.inOut" })
      .add(function () { target.classList.add("is-press"); })
      .to(el.cursor, { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 })
      .add(function () { target.classList.remove("is-press"); })
      .to(el.cursor, { autoAlpha: 0, duration: 0.2 }, "+=0.1");
  }

  /* show(index) — switch the dashboard to a story step */
  function show(i, opts) {
    opts = opts || {};
    if (i === current) return;
    var prev = current, reduced = !!opts.reduced, step = STEPS[i];
    current = i;
    gsap.killTweensOf(el.cursor);
    gsap.set(el.cursor, { autoAlpha: 0 });

    moveMarker(step.page);

    // header text
    if (step.head) {
      el.icon.innerHTML = i === 1 ? ICON_BARS : ICON_HOME;
      if (reduced) {
        el.title.textContent = step.head;
      } else {
        gsap.timeline()
          .to(el.title, { autoAlpha: 0, y: -8, duration: 0.18 })
          .add(function () { el.title.textContent = step.head; })
          .fromTo(el.title, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power3.out" });
      }
      el.dates.textContent = step.dates || "01-Jul-25  to  31-May-26";
    }

    // outgoing panel
    panels.forEach(function (p, idx) {
      if (!p || idx === i) return;
      gsap.killTweensOf(p);
      if (idx === prev && !reduced) {
        gsap.to(p, { autoAlpha: 0, y: -10, duration: 0.25, onComplete: function () { p.classList.remove("is-on"); } });
      } else {
        gsap.set(p, { autoAlpha: 0 });
        p.classList.remove("is-on");
      }
    });

    // cover handling
    if (i === 0) {
      gsap.killTweensOf(el.cover);
      el.cover.style.visibility = "visible";
      gsap.to(el.cover, { autoAlpha: 1, scale: 1, duration: reduced ? 0 : 0.5, ease: "power3.out" });
      return;
    }

    var reveal = function () {
      if (!reduced && prev > 0) {
        var arrow = i > prev ? el.arrows[1] : el.arrows[0];
        arrow.classList.add("is-press");
        setTimeout(function () { arrow.classList.remove("is-press"); }, 260);
      }
      animateIn(panels[i], reduced);
    };

    if (prev === 0 && !reduced) {
      // click through the cover, then zoom into the summary
      pressCursor(el.btn, function () {
        if (current !== i) return;
        gsap.to(el.cover, { autoAlpha: 0, scale: 1.04, duration: 0.45, ease: "power2.in" });
        reveal();
      });
    } else {
      gsap.to(el.cover, { autoAlpha: 0, duration: reduced ? 0 : 0.3 });
      reveal();
    }
  }

  window.OndaDash = { STEPS: STEPS, mount: mount, show: show };
})();
