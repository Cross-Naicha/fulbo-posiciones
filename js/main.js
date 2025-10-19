/* =========================================================
   LIGA DE FULBO - MAIN SCRIPT
   Author: Nicolás + ChatGPT
   Purpose: Controls all dynamic behavior of the page,
   including text loading, overlays, table, streaks, and matches.
   ========================================================= */

/* =========================================================
   2. SCROLL TO TOP BUTTON
   ========================================================= */

/**
 * Adds a floating button that scrolls the page smoothly to the top.
 * The button appears only after scrolling down a bit.
 */
(function initScrollToTop() {
  const btn = document.getElementById('toTopBtn');
  if (!btn) return;

  const toggle = () => {
    if (window.scrollY > 100 && !document.body.classList.contains('locked')) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  };

  window.addEventListener('scroll', toggle, { passive: true });
  window.addEventListener('resize', toggle);
  document.addEventListener('DOMContentLoaded', toggle);

  btn.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* =========================================================
   3. LOCK / UNLOCK OVERLAY (WHATSAPP PANEL)
   ========================================================= */

/**
 * Manages the “locked” state of the page when results
 * need to be sent through WhatsApp or QR code.
 */
const CONFIG = {
  manual_force_lock: false,
  auto_lock_enabled: true,
  last_unlock_at: "2025-10-16T00:00:00-03:00",
  whatsapp_link: "https://wa.me/5493815303224?text=Querido%20Chiqui...",
  whatsapp_qr_src: "data/qr-whatsapp.png"
};

/**
 * Helper functions for calculating lock state.
 */
function parseISO(s) {
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t) : null;
}

function currentRoundStart(now = new Date()) {
  const d = new Date(now);
  const day = d.getDay();
  const candidate = new Date(d);
  candidate.setHours(21, 0, 0, 0);
  const daysSinceWed = (day + 7 - 3) % 7;
  candidate.setDate(candidate.getDate() - daysSinceWed);
  if (now < candidate) candidate.setDate(candidate.getDate() - 7);
  return candidate;
}

/**
 * Determines whether the overlay should be active.
 */
function computeLockedState() {
  const now = new Date();
  if (CONFIG.manual_force_lock) return true;
  if (!CONFIG.auto_lock_enabled) return false;

  const roundStart = currentRoundStart(now);
  const lastUnlock = parseISO(CONFIG.last_unlock_at);
  const afterRoundStart = now >= roundStart;
  const unlockedThisRound = lastUnlock && (lastUnlock >= roundStart);

  return afterRoundStart && !unlockedThisRound;
}

/**
 * Applies the visual lock/unlock state to the UI.
 */
function applyLockUI(locked) {
  const overlay = document.getElementById('lockOverlay');
  const waBtn = document.getElementById('waBtn');
  const waQR = document.getElementById('waQR');

  if (waBtn) waBtn.href = CONFIG.whatsapp_link || '#';
  if (waQR) waQR.src = CONFIG.whatsapp_qr_src || '';

  if (locked) {
    document.body.classList.add('locked');
    overlay.classList.add('active');
  } else {
    document.body.classList.remove('locked');
    overlay.classList.remove('active');
  }
}

/**
 * Checks every 60 seconds if the overlay should be visible.
 */
function initLockCycle() {
  applyLockUI(computeLockedState());
  setInterval(() => applyLockUI(computeLockedState()), 60000);
}


/* =========================================================
   4. ANNOUNCEMENT OVERLAY
   ========================================================= */

/**
 * Displays announcements from textos.json as a sequence
 * of modal-like windows that the user can click through.
 */
let currentAnn = 0;

function showAnnouncement(i) {
  const overlay = document.getElementById("annOverlay");

  if (i < ANNOUNCEMENTS.length) {
    document.body.classList.add("locked");
    overlay.classList.add("active");
    document.getElementById("annTitle").textContent = ANNOUNCEMENTS[i].title;

    // Convert line breaks into paragraphs
    document.getElementById("annBody").innerHTML =
      ANNOUNCEMENTS[i].body.split("\n\n").map(p => `<p>${p}</p>`).join("");
  } else {
    overlay.classList.remove("active");
    document.body.classList.remove("locked");
  }
}

function startAnnouncements() {
  currentAnn = 0;
  showAnnouncement(currentAnn);
}

document.getElementById("annNextBtn").addEventListener("click", () => {
  currentAnn++;
  showAnnouncement(currentAnn);
});

/* =========================================================
   TABLA DE POSICIONES 2.0
   ========================================================= */

const els = {
  status: document.getElementById("status"),
  tabla: document.getElementById("tabla"),
  head: document.getElementById("tabla-head"),
  body: document.getElementById("tabla-body"),
  modoBtns: document.querySelectorAll(".modo-btns button"),
};

let posiciones = [];
let ultimos = {};
let modoActual = "compacto";

init();

async function init() {
  try {
    setStatus("Cargando datos...");
    const [resPos, resUlt] = await Promise.all([
      fetch("data/posiciones.json?v=" + Date.now()),
      fetch("data/ultimos.json?v=" + Date.now())
    ]);
    if (!resPos.ok || !resUlt.ok) throw new Error("Error al cargar archivos JSON");
    posiciones = await resPos.json();
    ultimos = await resUlt.json();
    showTable();
    llenarSelect();
    renderTabla();
  } catch (err) {
    setStatus("Error: " + err.message);
    console.error(err);
  }
}

function setStatus(msg) {
  els.status.textContent = msg;
  els.status.style.display = "block";
  els.tabla.style.display = "none";
}
function showTable() {
  els.status.style.display = "none";
  els.tabla.style.display = "table";
}

/* ===== CAMBIO DE MODO ===== */
els.modoBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    els.modoBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    modoActual = btn.dataset.modo;
    renderTabla();
  });
});

/* ===== RENDER PRINCIPAL ===== */
function renderTabla() {
  els.head.innerHTML = "";
  els.body.innerHTML = "";

  let headers = [];
  switch (modoActual) {
    case "compacto":
      headers = ["N°", "Delta", "Jugador", "Pts", "Últimos 5"];
      break;
    case "intermedio":
      headers = ["N°", "Jugador", "Pts", "J", "DG"];
      break;
    case "completo":
      headers = ["N°", "Jugador", "Pts", "W", "D", "L"];
      break;
  }

  const trHead = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    trHead.appendChild(th);
  });
  els.head.appendChild(trHead);

  posiciones.slice(0,10).forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.style.animationDelay = `${i * 40}ms`; // escalonado suave

    // === Compacto ===
  if (modoActual === "compacto") {
    const ult = ultimos[r.ID];
    const resultDiv = document.createElement("div");
    resultDiv.className = "result-circles";

    for (let j = 1; j <= 5; j++) {
      const res = ult?.[j]?.situation || "N";
      const span = document.createElement("span");
      span.className = "res-" + res;
      resultDiv.appendChild(span);
    }

    // color de delta
    const delta = r.Δ ?? "";
    let deltaClass = "";
    if (delta.includes("↑")) deltaClass = "pos";
    else if (delta.includes("↓")) deltaClass = "neg";

    tr.innerHTML = `
      <td>${r.N ?? ""}</td>
      <td class="${deltaClass}">${delta}</td>
      <td><a href="jugador.html?id=${r.ID}">${r.JUG}</a></td>
      <td>${r.PTS}</td>
      <td></td>
    `;
    tr.lastElementChild.appendChild(resultDiv);
  }

  // === Intermedio ===
  if (modoActual === "intermedio") {
    const dg = r.GOL ?? "";
    const dgClass = dg.includes("+") ? "pos" : dg.includes("-") ? "neg" : "";
    
    tr.innerHTML = `
      <td>${r.N ?? ""}</td>
      <td><a href="jugador.html?id=${r.ID}">${r.JUG}</a></td>
      <td>${r.PTS}</td>
      <td>${r.J}</td>
      <td class="${dgClass}">${dg}</td>
    `;
  }


  // === Completo ===
  if (modoActual === "completo") {
    // aplica color según W, D, L
    const wClass = Number(r.G) > 0 ? "pos" : "";
    const dClass = Number(r.E) > 0 ? "draw" : "";
    const lClass = Number(r.P) > 0 ? "neg" : "";

    tr.innerHTML = `
      <td>${r.N ?? ""}</td>
      <td><a href="jugador.html?id=${r.ID}">${r.JUG}</a></td>
      <td>${r.PTS}</td>
      <td class="${wClass}">${r.G}</td>
      <td class="${dClass}">${r.E}</td>
      <td class="${lClass}">${r.P}</td>
    `;
  }

    els.body.appendChild(tr);
  });
  
  // mantener sincronizado el foco
  const idSel = select?.value;
  if (idSel) {
    resaltarJugador(idSel);
    renderMiniTabla(idSel);
  }

}

/* ===== SELECTOR DE JUGADOR ===== */
const select = document.getElementById("jugadorSelect");

// poblar select cuando se cargan posiciones
function llenarSelect() {
  const select = document.getElementById("jugadorSelect");
  if (!select) return;

  select.innerHTML = '<option value="">— Filtrar jugador —</option>';
  posiciones.slice(0, 10).forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.ID;
    opt.textContent = r.JUG;
    select.appendChild(opt);
  });
}

select.addEventListener("change", () => {
  const idSel = select.value;
  resaltarJugador(idSel);
});

// resalta la fila del jugador en la tabla actual
function resaltarJugador(id) {
  document.querySelectorAll("#tabla tbody tr").forEach(tr => {
    tr.classList.remove("highlight");
  });
  if (!id) return;
  const fila = [...document.querySelectorAll("#tabla tbody tr")].find(tr =>
    tr.querySelector("a")?.href.includes(`id=${id}`)
  );
  if (fila) fila.classList.add("highlight");
}

// llamar al llenarSelect después de cargar los datos
// reemplazá dentro de init(), justo después de renderTabla();
function showTable() {
  els.status.style.display = "none";
  els.tabla.style.display = "table";
  llenarSelect(); // <-- agregar esta línea dentro de tu flujo actual
}

/* ===== MINI TABLA DEL JUGADOR SELECCIONADO ===== */
const focusCard = document.getElementById("jugadorFocus");
const focusNombre = document.getElementById("focusNombre");
const focusHead = document.getElementById("focusHead");
const focusBody = document.getElementById("focusBody");

function renderMiniTabla(id) {
  if (!id) {
    focusCard.style.display = "none";
    return;
  }

  const jugador = posiciones.find(r => r.ID == id);
  if (!jugador) return;

  focusHead.innerHTML = "";
  focusBody.innerHTML = "";

  let headers = [];
  switch (modoActual) {
    case "compacto":
      headers = ["N°", "Δ", "Pts", "Últimos 5"];
      break;
    case "intermedio":
      headers = ["N°", "Pts", "J", "DG"];
      break;
    case "completo":
      headers = ["N°", "Pts", "W", "D", "L"];
      break;
  }

  const trHead = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    trHead.appendChild(th);
  });
  focusHead.appendChild(trHead);

  const trBody = document.createElement("tr");

  // === COMPACTO ===
  if (modoActual === "compacto") {
    const ult = ultimos[jugador.ID];
    const div = document.createElement("div");
    div.className = "result-circles";
    for (let j = 1; j <= 5; j++) {
      const res = ult?.[j]?.situation || "N";
      const span = document.createElement("span");
      span.className = "res-" + res;
      div.appendChild(span);
    }

    const delta = jugador.Δ ?? "";
    const deltaClass = delta.includes("↑")
      ? "pos"
      : delta.includes("↓")
      ? "neg"
      : "";

    trBody.innerHTML = `
      <td>${jugador.N}</td>
      <td class="${deltaClass}">${delta}</td>
      <td>${jugador.PTS}</td>
      <td></td>
    `;
    trBody.lastElementChild.appendChild(div);
  }

  // === INTERMEDIO ===
  if (modoActual === "intermedio") {
    const dg = jugador.GOL ?? "";
    const dgClass = dg.includes("+") ? "pos" : dg.includes("-") ? "neg" : "";

    trBody.innerHTML = `
      <td>${jugador.N}</td>
      <td>${jugador.PTS}</td>
      <td>${jugador.J}</td>
      <td class="${dgClass}">${dg}</td>
    `;
  }

  // === COMPLETO ===
  if (modoActual === "completo") {
    const wClass = Number(jugador.G) > 0 ? "pos" : "";
    const dClass = Number(jugador.E) > 0 ? "draw" : "";
    const lClass = Number(jugador.P) > 0 ? "neg" : "";

    trBody.innerHTML = `
      <td>${jugador.N}</td>
      <td>${jugador.PTS}</td>
      <td class="${wClass}">${jugador.G}</td>
      <td class="${dClass}">${jugador.E}</td>
      <td class="${lClass}">${jugador.P}</td>
    `;
  }

  focusBody.appendChild(trBody);
  focusCard.style.display = "block";
}


/* integrar con la selección existente */
select.addEventListener("change", () => {
  const idSel = select.value;
  resaltarJugador(idSel);
  renderMiniTabla(idSel);
});




/* =========================================================
   6. STREAKS SECTION
   ========================================================= */

/**
 * Loads streak data (victories, losses, rivalries, etc.)
 * from rachas.json and creates visual cards for each.
 */
const streaksStatus = document.getElementById('streaksStatus');
const streaksGrid = document.getElementById('streaksGrid');
const streaksEmpty = document.getElementById('streaksEmpty');

// Assign color based on streak type
function rachaColor(tipo) {
  const t = (tipo || '').toLowerCase();
  if (t.includes('presente')) return 'blue';
  if (t.includes('victorias')) return 'green';
  if (t.includes('invicto')) return 'darkgreen';
  if (t.includes('derrotas')) return 'red';
  if (t.includes('sin ganar')) return 'darkred';
  if (t.includes('paternidad')) return 'yellow';
  if (t.includes('ausente')) return 'gray';
  return 'gray';
}

// Build the HTML card for each streak
function streakCard(item) {
  const el = document.createElement('article');
  const color = rachaColor(item.racha);
  el.className = `streak ${color}`;

  // Top badge
  const top = document.createElement('div');
  top.className = 'streak-top';
  const badge = document.createElement('span');
  badge.className = `badge ${color}`;
  badge.textContent = item.racha || '';
  top.appendChild(badge);

  // Main area (player name or rivalry)
  const main = document.createElement('div');
  main.className = 'streak-main';

  const name = document.createElement('div');
  name.className = 'streak-name';

  if (item.racha && item.racha.toLowerCase().includes('paternidad')) {
    const [j1, j2] = (item.jugador || '').split('->').map(s => s.trim());
    const span1 = document.createElement('span');
    span1.className = 'pat-j1';
    span1.textContent = j1 || '';
    const arrow = document.createElement('span');
    arrow.className = 'pat-arrow';
    arrow.textContent = ' → ';
    const span2 = document.createElement('span');
    span2.className = 'pat-j2';
    span2.textContent = j2 || '';
    name.append(span1, arrow, span2);
  } else {
    name.textContent = item.jugador || '';
  }

  const len = document.createElement('div');
  len.className = 'streak-len';
  len.textContent = `x${item.extension ?? 0}`;
  main.append(name, len);

  el.append(top, main);
  return el;
}

// Load streak data
async function loadStreaks() {
  streaksStatus.style.display = 'block';
  streaksGrid.style.display = 'none';
  streaksEmpty.style.display = 'none';

  try {
    const res = await fetch(`data/rachas.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Proxima Temporada');
    const arr = await res.json();

    if (arr.length === 0) {
      streaksStatus.style.display = 'none';
      streaksEmpty.style.display = 'block';
      return;
    }

    // Sort streaks by priority
    arr.sort((a, b) => {
      const order = { blue: 0, green: 1, yellow: 2, red: 3, gray: 4 };
      const ca = rachaColor(a.racha);
      const cb = rachaColor(b.racha);
      if (order[ca] !== order[cb]) return order[ca] - order[cb];
      return (b.extension || 0) - (a.extension || 0);
    });

    streaksGrid.innerHTML = '';
    for (const s of arr) streaksGrid.appendChild(streakCard(s));

    streaksStatus.style.display = 'none';
    streaksGrid.style.display = 'grid';

  } catch (err) {
    console.error(err);
    streaksStatus.textContent = 'Error al cargar rachas: ' + err.message;
  }
}


/* =========================================================
   7. LAST MATCHES SECTION
   ========================================================= */

/**
 * Loads and displays the latest matches in streak card format.
 */
const matchesStatus = document.getElementById('matchesStatus');
const matchesGrid = document.getElementById('matchesGrid');
const matchesEmpty = document.getElementById('matchesEmpty');

function matchColor(balance) {
  return balance === 0 ? 'yellow' : 'green';
}

function matchCard(fecha, partido) {
  const el = document.createElement('article');
  const color = matchColor(partido.balance);
  el.className = `streak ${color}`;

  // Top section (date + score)
  const top = document.createElement('div');
  top.className = 'streak-top';

  const badge = document.createElement('span');
  badge.className = `badge ${color}`;
  badge.textContent = fecha;

  const bal = document.createElement('span');
  bal.className = 'streak-len';
  bal.textContent = `+${partido.balance}`;

  top.append(badge, bal);

  // Team names, one above another
  const main = document.createElement('div');
  main.className = 'streak-teams';

  const eqA = document.createElement('div');
  eqA.className = 'streak-name ' + (partido.balance === 0 ? 'yellow' : 'green');
  eqA.textContent = partido.team_a.join(', ');

  const eqB = document.createElement('div');
  eqB.className = 'streak-name ' + (partido.balance === 0 ? 'yellow' : 'red');
  eqB.textContent = partido.team_b.join(', ');

  if (partido.balance > 0) eqA.classList.add('winner'); // Team A wins

  main.append(eqA, eqB);
  el.append(top, main);
  return el;
}

async function loadMatches() {
  matchesStatus.style.display = 'block';
  matchesGrid.style.display = 'none';
  matchesEmpty.style.display = 'none';

  try {
    const res = await fetch(`data/partidos.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Proxima temporada');
    const obj = await res.json();

    const entries = Object.entries(obj).sort(([f1], [f2]) => f2.localeCompare(f1));

    if (entries.length === 0) {
      matchesStatus.style.display = 'none';
      matchesEmpty.style.display = 'block';
      return;
    }

    matchesGrid.innerHTML = '';
    for (const [fecha, partido] of entries.slice(0, 6)) {
      matchesGrid.appendChild(matchCard(fecha, partido));
    }

    matchesStatus.style.display = 'none';
    matchesGrid.style.display = 'grid';

  } catch (err) {
    console.error(err);
    matchesStatus.textContent = 'Error al cargar partidos: ' + err.message;
  }
}


/* =========================================================
   8. INITIALIZATION
   ========================================================= */

/**
 * Runs all startup functions once the page is ready.
 * This ensures everything loads correctly in order.
 */
initLockCycle();
init();
loadStreaks();
loadMatches();
