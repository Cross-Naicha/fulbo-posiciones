/* =========================================================
   LIGA DE FULBO - PLAYER PROFILE SCRIPT
   Author: Nicolás + ChatGPT
   Purpose: Handles data loading and rendering for player profile pages.
   ========================================================= */


/* =========================================================
   1. UTILITY FUNCTIONS
   ========================================================= */

/** Parse URL parameters (used to get ?id= or ?slug=) */
const qs = new URLSearchParams(location.search);

/** Cache-busting helper for fetch calls */
const bust = () => Date.now();

/** Safely set text content of an element */
const setText = (id, v) => {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
};

/** Format ISO date ("yyyy-mm-dd") to dd/mm/yyyy */
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

/** Shortcuts for DOM creation */
const el = (sel) => document.querySelector(sel);
const div = (cls, html = "") => {
  const d = document.createElement("div");
  if (cls) d.className = cls;
  d.innerHTML = html;
  return d;
};

/**
 * Clears a container and returns a helper to show a placeholder message.
 * Example:
 *   const no = emptyOr(root, 'No data');
 *   if (!data) { no(); return; }
 */
const emptyOr = (container, fallbackText) => {
  container.innerHTML = "";
  return (text) => {
    container.innerHTML = `<div class="status">${text || fallbackText}</div>`;
  };
};


/* =========================================================
   2. DATA LOADING
   ========================================================= */

/** Load player JSON by numeric ID */
async function loadById(id) {
  const res = await fetch(`.../data/players/${id}.json?v=${bust()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se encontró el JSON del jugador.");
  return await res.json();
}

/** Load player JSON using a “slug” (nickname-based reference) */
async function loadBySlug(slug) {
  const res = await fetch(`data/players/index.json?v=${bust()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo leer data/players/index.json");
  const lista = await res.json();
  const ref = lista.find((p) => (p.slug || "") === slug);
  if (!ref) throw new Error("Slug inválido.");
  return await loadById(ref.id);
}


/* =========================================================
   3. RENDERING: SUMMARY SECTION
   ========================================================= */

function renderSummary(root, data) {
  const no = emptyOr(root, "Métrica no disponible / necesita más partidos");
  const b = data.basic_statistics;
  if (!b) return no();

  const { partidos, puntos, efectividad, promedio, ganados = 0, empatados = 0, perdidos = 0, apodo } = b;
  const kpis = div("kpis");

  // Helper to create KPI cards
  const makeKPI = (label, val) => {
    const k = div("kpi");
    k.innerHTML = `<div class="label">${label}</div><div class="val">${val ?? "—"}</div>`;
    return k;
  };

  kpis.append(
    makeKPI("Partidos", partidos ?? "—"),
    makeKPI("Puntos", puntos ?? "—"),
    makeKPI("%", typeof efectividad === "number" ? `${(efectividad * 100).toFixed(0)}%` : "—"),
    makeKPI("PMX", typeof promedio === "number" ? promedio : "—")
  );

  root.innerHTML = "";
  root.appendChild(kpis);

  // W/D/L summary badges
  const wld = div("wld");
  wld.append(div("badge ok", ganados ?? 0), div("badge warn", empatados ?? 0), div("badge bad", perdidos ?? 0));
  root.appendChild(wld);

  // Update document title and header
  const nombre = data.basic_statistics?.apodo || data.jugador || "Jugador";
  document.title = nombre;
  setText("player-name", nombre);
  setText("subtitle", "");

}


/* =========================================================
   4. RENDERING: STREAKS SECTION
   ========================================================= */

function renderStreaks(root, data) {
  const no = emptyOr(root, "Métrica no disponible / necesita más partidos");
  const w = data.winning_streak_statistics;
  const l = data.losses_streak_statistics;
  const p = data.present_streak_statistics;
  if (!w && !l && !p) return no();

  root.innerHTML = "";

  const makeRow = (titulo, obj, activeColorClass) => {
    const row = div("");
    if (!obj) return div("row muted", `<strong>${titulo}:</strong> Métrica no disponible`);

    const estado = obj.actual ? "ACTIVA" : "Inactiva";
    const dotClass = obj.actual ? activeColorClass : "off";

    // Top line (label + pill indicator)
    const head = div("row");
    const pill = div("pill");
    pill.append(div(`dot ${dotClass}`), div("", estado));
    head.append(div("", `<strong>${titulo}</strong>`), pill);

    // Bottom line (dates and length)
    const sameDay = obj.empieza && obj.termina && obj.empieza === obj.termina;
    const rango = obj.empieza
      ? sameDay
        ? fmtDate(obj.empieza)
        : `${fmtDate(obj.empieza)} — ${fmtDate(obj.termina)}`
      : "—";
    const dates = div("muted", `${rango} · Extensión: ${obj.extension ?? "—"}`);

    row.append(head, dates);
    return row;
  };

  root.append(
    makeRow("Invicto", w, "ok"),
    div("separator"),
    makeRow("Derrotas", l, "bad"),
    div("separator"),
    makeRow("Presentes", p, "present"),
    div("separator")
  );

  const pa = w && (w["puntos acumulados"] ?? w["puntos_acumulados"]);
  if (pa != null) root.appendChild(div("hint", `Puntos durante la racha INVICTO: ${pa}`));
}


/* =========================================================
   5. RENDERING: LAST 5 MATCHES
   ========================================================= */

function renderLast5(root, data) {
  const no = emptyOr(root, "Métrica no disponible / necesita más partidos");
  const L = data.last_5;
  if (!L || typeof L !== "object" || Object.keys(L).length === 0) return no();

  const entries = Object.entries(L)
    .map(([date, res]) => ({ date, res: (res || "").toUpperCase() }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const normalized = entries.slice(0, 5);
  while (normalized.length < 5) normalized.push({ date: null, res: "A" });

  const wrap = div("last5");
  normalized.forEach(({ date, res }) => {
    let cls = "off",
      txt = "Ausente";
    if (res === "G") (cls = "ok"), (txt = "Ganado");
    else if (res === "E") (cls = "warn"), (txt = "Empatado");
    else if (res === "P") (cls = "bad"), (txt = "Perdido");
    const item = div("item");
    item.append(div(`dot ${cls}`), div("", date ? `${fmtDate(date)} — ${txt}` : `— ${txt}`));
    wrap.appendChild(item);
  });

  root.innerHTML = "";
  root.appendChild(wrap);
}


/* =========================================================
   6. RENDERING: BALANCE SECTION
   ========================================================= */

function renderBalance(root, data) {
  const no = emptyOr(root, "Métrica no disponible / necesita más partidos");
  const B = data.balance_vs;
  if (!B || typeof B !== "object") return no();

  const pos = [],
    zero = [],
    neg = [];

  Object.entries(B).forEach(([name, val]) => {
    if (val > 0) pos.push([name, val]);
    else if (val < 0) neg.push([name, val]);
    else zero.push([name, val]);
  });

  const mkSection = (title, arr, cls) => {
    const sec = div("");
    sec.appendChild(div("section-title", title));
    const list = div("list");

    if (arr.length === 0) list.appendChild(div("muted", "—"));

    arr
      .sort((a, b) => (cls === "bad" ? a[1] - b[1] : b[1] - a[1]))
      .forEach(([name, val]) => {
        const row = div("kv");
        row.innerHTML = `<span class="name">${name}</span><span class="val">${
          val > 0 ? "+" + val : val
        }</span>`;
        const v = row.querySelector(".val");
        if (cls === "ok") v.style.color = "var(--ok)";
        if (cls === "bad") v.style.color = "var(--bad)";
        list.appendChild(row);
      });

    sec.appendChild(list);
    return sec;
  };

  root.innerHTML = "";
  root.append(
    mkSection("Paternidad", pos, "ok"),
    div("separator"),
    mkSection("Sin Reconocer", zero, "off"),
    div("separator"),
    mkSection("Filiación", neg, "bad")
  );
}


/* =========================================================
   7. RENDERING: PARTNERS SECTION
   ========================================================= */

function renderPartners(root, data) {
  const no = emptyOr(root, "Métrica no disponible / necesita más partidos");
  const best = data.best_partner;
  const worst = data.worse_partner;
  if (!best && !worst) return no();

  const mkSection = (title, obj, cls) => {
    const sec = div("");
    sec.appendChild(div("section-title", title));
    const list = div("list");

    if (!obj || Object.keys(obj).length === 0) {
      list.appendChild(div("muted", "—"));
    } else {
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, val]) => {
          const row = div("kv");
          row.innerHTML = `<span class="name">${name}</span><span class="val">${val ?? 0}</span>`;
          const v = row.querySelector(".val");
          if (cls === "ok") v.style.color = "var(--ok)";
          if (cls === "bad") v.style.color = "var(--bad)";
          list.appendChild(row);
        });
    }

    sec.appendChild(list);
    return sec;
  };

  root.innerHTML = "";
  root.append(mkSection("Mejores", best, "ok"), div("separator"), mkSection("Peores", worst, "bad"));
}


/* =========================================================
   8. INITIALIZATION
   ========================================================= */

async function boot() {
  const id = qs.get("id");
  const slug = qs.get("slug");

  const summary = el("#summary");
  const streaks = el("#streaks");
  const last5 = el("#last5");
  const balance = el("#balance");
  const partners = el("#partners");

  try {
    let data;
    if (id) data = await loadById(id);
    else if (slug) data = await loadBySlug(slug);
    else throw new Error("Falta ?id= o ?slug=");

    const nombre = data.jugador || "Jugador";
    document.title = `${nombre} — Perfil`;
    setText("player-name", `${nombre}${data.basic_statistics?.apodo ? ": " + data.basic_statistics.apodo : ""}`);
    setText("subtitle", "Perfil");

    renderSummary(summary, data);
    renderStreaks(streaks, data);
    renderLast5(last5, data);
    renderBalance(balance, data);
    renderPartners(partners, data);

  } catch (err) {
    console.error(err);
    [summary, streaks, last5, balance, partners].forEach(
      (b) => b && (b.innerHTML = `<div class="status">${err.message}<br>Volvé a la tabla y elegí un jugador válido.</div>`)
    );
  }
}

// === Start when the page loads ===
boot();
