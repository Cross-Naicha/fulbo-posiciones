/* =========================================================
   LIGA DE FULBO - MAIN SCRIPT
   ========================================================= */

/* ========== 1. SCROLL TO TOP + FAB MENU ========== */
(function initScrollToTop() {
  const btn = document.getElementById('toTopBtn');
  const fabMenu = document.getElementById('fabMenu');
  let pressTimer = null;
  let menuOpen = false;

  if (!btn) return;

  const toggle = () => {
    if (window.scrollY > 100 && !document.body.classList.contains('locked')) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
      // si scrollea, cerramos el menú
      hideFabMenu();
    }
  };

  function showFabMenu() {
    fabMenu?.classList.add('show');
    menuOpen = true;
  }
  function hideFabMenu() {
    fabMenu?.classList.remove('show');
    menuOpen = false;
  }

  window.addEventListener('scroll', toggle, { passive: true });
  window.addEventListener('resize', toggle);
  document.addEventListener('DOMContentLoaded', toggle);

  // click normal: sube
  btn.addEventListener('click', e => {
    // si el menú está abierto y hace click, lo cerramos
    if (menuOpen) {
      hideFabMenu();
      return;
    }
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // long press en mobile
  btn.addEventListener('touchstart', e => {
    pressTimer = setTimeout(() => {
      showFabMenu();
    }, 420);
  }, { passive: true });

  btn.addEventListener('touchend', e => {
    clearTimeout(pressTimer);
  });

  // cerrar si toca fuera
  document.addEventListener('touchstart', e => {
    if (!menuOpen) return;
    if (!fabMenu.contains(e.target) && e.target !== btn) {
      hideFabMenu();
    }
  }, { passive: true });

})();

/* ========== 2. LOCK / UNLOCK OVERLAY (WHATSAPP PANEL) ========== */
const CONFIG = {
  manual_force_lock: false,
  auto_lock_enabled: true,
  last_unlock_at: "2025-10-30T00:00:00-03:00",
  whatsapp_link: "https://wa.me/5493815303224?text=Querido%20Chiqui...",
  whatsapp_qr_src: "data/qr-whatsapp.png"
};

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

function initLockCycle() {
  applyLockUI(computeLockedState());
  setInterval(() => applyLockUI(computeLockedState()), 30000);
}

/* ========== 4. TABLA DE POSICIONES 2.0 ========== */
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

async function initTabla() {
  try {
    setStatus("Cargando datos...");
    const [resPos, resUlt] = await Promise.all([
      fetch("data/posiciones.json?v=" + Date.now()),
      fetch("data/ultimos_5_todos.json?v=" + Date.now())
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
  llenarSelect();
}

els.modoBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    els.modoBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    modoActual = btn.dataset.modo;
    renderTabla();
  });
});

function renderTabla() {
  els.head.innerHTML = "";
  els.body.innerHTML = "";

  let headers = [];
  switch (modoActual) {
    case "compacto": headers = ["N°", "Jugador", "Pts", "Últimos 5"]; break;
    case "intermedio": headers = ["N°", "Jugador", "Pts", "J", "DG"]; break;
    case "completo": headers = ["N°", "Jugador", "Pts", "G", "E", "P"]; break;
  }

  const trHead = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    trHead.appendChild(th);
  });
  els.head.appendChild(trHead);

  posiciones.slice(0, 10).forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.style.animationDelay = `${i * 40}ms`;

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

      const delta = r.Δ ?? "";
      let deltaClass = "";
      if (delta.includes("↑")) deltaClass = "pos";
      else if (delta.includes("↓")) deltaClass = "neg";

    //   Enlaces a jugadores deshabilitados temporalmente
    //   tr.innerHTML = `
    //     <td>${r.N ?? ""}</td>
    //     <td><a href="jugador.html?id=${r.ID}">${r.JUG}</a></td>
    //     <td>${r.PTS}</td>
    //     <td></td>
    //   `;
    //   tr.lastElementChild.appendChild(resultDiv);
    // }

      tr.innerHTML = `
        <td>${r.N ?? ""}</td>
        <td>${r.JUG}</td>
        <td>${r.PTS}</td>
        <td></td>
      `;
      tr.lastElementChild.appendChild(resultDiv);
    }

    // if (modoActual === "intermedio") {
    //   const dg = r.GOL ?? "";
    //   const dgClass = dg.includes("+") ? "pos" : dg.includes("-") ? "neg" : "";
    //   tr.innerHTML = `
    //     <td>${r.N ?? ""}</td>
    //     <td><a href="jugador.html?id=${r.ID}">${r.JUG}</a></td>
    //     <td>${r.PTS}</td>
    //     <td>${r.J}</td>
    //     <td class="${dgClass}">${dg}</td>
    //   `;
    // }
  
    if (modoActual === "intermedio") {
      const dg = r.GOL ?? "";
      const dgClass = dg.includes("+") ? "pos" : dg.includes("-") ? "neg" : "";
      tr.innerHTML = `
        <td>${r.N ?? ""}</td>
        <td>${r.JUG}</td>
        <td>${r.PTS}</td>
        <td>${r.J}</td>
        <td class="${dgClass}">${dg}</td>
      `;
    }

    // if (modoActual === "completo") {
    //   const wClass = Number(r.G) > 0 ? "pos" : "";
    //   const dClass = Number(r.E) > 0 ? "draw" : "";
    //   const lClass = Number(r.P) > 0 ? "neg" : "";
    //   tr.innerHTML = `
    //     <td>${r.N ?? ""}</td>
    //     <td><a href="jugador.html?id=${r.ID}">${r.JUG}</a></td>
    //     <td>${r.PTS}</td>
    //     <td class="${wClass}">${r.G}</td>
    //     <td class="${dClass}">${r.E}</td>
    //     <td class="${lClass}">${r.P}</td>
    //   `;
    // }

    if (modoActual === "completo") {
      const wClass = Number(r.G) > 0 ? "pos" : "";
      const dClass = Number(r.E) > 0 ? "draw" : "";
      const lClass = Number(r.P) > 0 ? "neg" : "";
      tr.innerHTML = `
        <td>${r.N ?? ""}</td>
        <td>${r.JUG}</td>
        <td>${r.PTS}</td>
        <td class="${wClass}">${r.G}</td>
        <td class="${dClass}">${r.E}</td>
        <td class="${lClass}">${r.P}</td>
      `;
    }

    els.body.appendChild(tr);
  });

  const idSel = select?.value;
  if (idSel) {
    resaltarJugador(idSel);
    renderMiniTabla(idSel);
  }
}

/* ===== SELECTOR DE JUGADOR ===== */
const select = document.getElementById("jugadorSelect");

function llenarSelect() {
  if (!select) return;
  select.innerHTML = '<option value="">— Filtrar jugador —</option>';
  posiciones.slice(0, 10).forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.ID;
    opt.textContent = r.JUG;
    select.appendChild(opt);
  });
}

select?.addEventListener("change", () => {
  const idSel = select.value;
  resaltarJugador(idSel);
  renderMiniTabla(idSel);
});

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

/* ===== MINI TABLA ===== */
const focusCard = document.getElementById("jugadorFocus");
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
    const deltaClass = delta.includes("↑") ? "pos" : delta.includes("↓") ? "neg" : "";
    trBody.innerHTML = `
      <td>${jugador.N}</td>
      <td class="${deltaClass}">${delta}</td>
      <td>${jugador.PTS}</td>
      <td></td>
    `;
    trBody.lastElementChild.appendChild(div);
  }
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

/* ========== 5. RACHAS SECTION (mejorada) ========== */
const streaksStatus = document.getElementById('streaksStatus');
const streaksGrid = document.getElementById('streaksGrid');
const streaksEmpty = document.getElementById('streaksEmpty');
const streakTabs = document.getElementById('streakTabs');

let ALL_STREAKS = [];
let streakAutoIndex = 0;
let streakAutoTimer = null;

function rachaColor(tipo) {
  const t = (tipo || '').toLowerCase();
  if (t.includes('presente')) return 'blue';
  if (t.includes('victorias')) return 'green';
  if (t.includes('invicto')) return 'green';
  if (t.includes('derrotas')) return 'red';
  if (t.includes('sin ganar')) return 'darkred';
  if (t.includes('paternidad')) return 'yellow';
  if (t.includes('ausente')) return 'gray';
  return 'gray';
}

function streakCard(item) {
  const el = document.createElement('article');
  const color = rachaColor(item.racha);
  el.className = `streak ${color}`;

  const top = document.createElement('div');
  top.className = 'streak-top';
  const badge = document.createElement('span');
  badge.className = `badge ${color}`;
  badge.textContent = item.racha || '';
  top.appendChild(badge);

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

async function loadStreaks() {
  streaksStatus.style.display = 'block';
  streaksGrid.style.display = 'none';
  streaksEmpty.style.display = 'none';

  try {
    const res = await fetch(`data/rachas.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Proxima Temporada');
    const arr = await res.json();
    ALL_STREAKS = arr;

    if (arr.length === 0) {
      streaksStatus.style.display = 'none';
      streaksEmpty.style.display = 'block';
      return;
    }

    renderStreaksByFilter('victorias');
    // startStreakAuto();

  } catch (err) {
    console.error(err);
    streaksStatus.textContent = 'Error al cargar rachas: ' + err.message;
  }
}

function renderStreaksByFilter(filter) {
  if (!ALL_STREAKS.length) return;
  streaksGrid.innerHTML = '';

  // filtro
  let filtered = ALL_STREAKS.slice();

  if (filter !== 'todas') {
    filtered = filtered.filter(s => {
      const r = (s.racha || '').toLowerCase();
      switch (filter) {
        case 'victorias': return r.includes('victoria') || r.includes('invicto');
        case 'derrotas': return r.includes('derrota') || r.includes('sin ganar') || r.includes('perder');
        case 'paternidad': return r.includes('paternidad');
        case 'ausente': return r.includes('ausente');
        default: return true;
      }
    });
  }

  // orden
  filtered.sort((a, b) => (b.extension || 0) - (a.extension || 0));

  if (!filtered.length) {
    streaksGrid.style.display = 'none';
    streaksEmpty.style.display = 'block';
    return;
  }

  // animación
  streaksGrid.classList.remove('slide-in-right');
  void streaksGrid.offsetWidth;
  streaksGrid.classList.add('slide-in-right');

  for (const s of filtered) {
    streaksGrid.appendChild(streakCard(s));
  }

  streaksStatus.style.display = 'none';
  streaksEmpty.style.display = 'none';
  streaksGrid.style.display = 'grid';
}

if (streakTabs) {
  streakTabs.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    streakTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    renderStreaksByFilter(filter);
    // pausar/reiniciar autoplay
    restartStreakAuto(filter);
  });
}

const STREAK_FILTERS_ORDER = ['todas', 'victorias', 'derrotas', 'paternidad', 'ausente'];

// function startStreakAuto() {
//   if (streakAutoTimer) clearInterval(streakAutoTimer);
//   streakAutoTimer = setInterval(() => {
//     streakAutoIndex = (streakAutoIndex + 1) % STREAK_FILTERS_ORDER.length;
//     const nextFilter = STREAK_FILTERS_ORDER[streakAutoIndex];

//     // marcar botón
//     const btn = [...streakTabs.querySelectorAll('button')].find(b => b.dataset.filter === nextFilter);
//     if (btn) {
//       streakTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
//       btn.classList.add('active');
//     }

//     renderStreaksByFilter(nextFilter);
//   }, 8000); // 8s
// }

// function restartStreakAuto(currentFilter) {
//   if (streakAutoTimer) clearInterval(streakAutoTimer);
//   streakAutoIndex = STREAK_FILTERS_ORDER.indexOf(currentFilter);
//   if (streakAutoIndex < 0) streakAutoIndex = 0;
//   startStreakAuto();
// }

/* ========== 6. COMBINACIONES DESTACADAS (v2 con paginación) ========== */
const combStatus = document.getElementById('combStatus');
const combGrid = document.getElementById('combGrid');
const combEmpty = document.getElementById('combEmpty');
const combTipo = document.getElementById('combTipo');
const combSize = document.getElementById('combSize');

let ALL_COMBOS = [];
let activeTipos = new Set(['GAN']);
let activeSizes = new Set();
let combPage = 0;
let combPages = 0;
let combAutoTimer = null;

async function loadCombinaciones() {
  combStatus.style.display = 'block';
  combGrid.style.display = 'none';
  combEmpty.style.display = 'none';

  try {
    const res = await fetch(`data/combinaciones.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('No disponible');
    const arr = await res.json();
    ALL_COMBOS = arr;

    // Detectar tamaños
    const sizes = new Set(arr.map(x => x[1]).filter(Boolean));
    combSize.innerHTML = '<span class="comb-label">Tamaño:</span>';
    [...sizes].sort((a,b)=>a-b).forEach(sz => {
      const btn = document.createElement('button');
      btn.textContent = sz;
      btn.dataset.size = sz;
      btn.classList.add('active');
      combSize.appendChild(btn);
      activeSizes.add(String(sz));
    });

    renderCombos();
    // startCombAuto();

  } catch (err) {
    console.error(err);
    combStatus.textContent = 'Error: ' + err.message;
  }
}

function renderCombos(page = 0) {
  if (!ALL_COMBOS.length) return;
  combGrid.innerHTML = '';

  const filtered = ALL_COMBOS.filter(row => {
    const tipo = row[0];
    const size = String(row[1]);
    return activeTipos.has(tipo) && activeSizes.has(size);
  });

  if (!filtered.length) {
    combGrid.style.display = 'none';
    combEmpty.style.display = 'block';
    return;
  }

  combPages = Math.ceil(filtered.length / 6);
  combPage = (page + combPages) % combPages; // loop seguro

  const start = combPage * 6;
  const slice = filtered.slice(start, start + 6);

  combGrid.classList.remove('slide-in-right');
  void combGrid.offsetWidth;
  combGrid.classList.add('slide-in-right');

  slice.forEach(row => {
    const tipo = row[0];
    const size = row[1];
    const names = row.slice(2, 2 + size).filter(Boolean);
    const ganados = row[6] ?? 0;

    const article = document.createElement('article');
    const color = (tipo === 'GAN') ? 'green' : 'red';
    article.className = `streak ${color}`;

    const top = document.createElement('div');
    top.className = 'streak-top';
    const badge = document.createElement('span');
    badge.className = `badge ${color}`;
    badge.textContent = (tipo === 'GAN') ? `GAN` : `PER`;
    const len = document.createElement('span');
    len.className = 'streak-len';
    len.textContent = `${ganados} PJ`;
    top.append(badge, len);

    const main = document.createElement('div');
    main.className = 'streak-main';
    const name = document.createElement('div');
    name.className = 'streak-name';
    name.textContent = names.join(' + ');
    main.appendChild(name);

    article.append(top, main);
    combGrid.appendChild(article);
  });

  combStatus.style.display = 'none';
  combEmpty.style.display = 'none';
  combGrid.style.display = 'grid';

  renderCombDots();
}

/* === PUNTITOS DE PÁGINA === */
function renderCombDots() {
  let dots = document.getElementById('combDots');
  if (!dots) {
    dots = document.createElement('div');
    dots.id = 'combDots';
    dots.className = 'comb-dots';
    combGrid.parentElement.appendChild(dots);
  }
  dots.innerHTML = '';

  for (let i = 0; i < combPages; i++) {
    const dot = document.createElement('span');
    dot.className = 'comb-dot' + (i === combPage ? ' active' : '');
    dot.dataset.page = i;
    dots.appendChild(dot);
  }
}

/* === MANEJAR CLICS EN PUNTITOS === */
document.addEventListener('click', e => {
  const dot = e.target.closest('.comb-dot');
  if (!dot) return;
  const p = Number(dot.dataset.page);
  renderCombos(p);
  restartCombAuto(p);
});

/* === ROTACIÓN AUTOMÁTICA === */
// function startCombAuto() {
//   if (combAutoTimer) clearInterval(combAutoTimer);
//   combAutoTimer = setInterval(() => {
//     combPage = (combPage + 1) % combPages;
//     renderCombos(combPage);
//   }, 3000);
// }

// function restartCombAuto(p) {
//   if (combAutoTimer) clearInterval(combAutoTimer);
//   combPage = p;
//   startCombAuto();
// }

/* === FILTROS DE TIPO Y TAMAÑO === */
combTipo?.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const tipo = btn.dataset.tipo;
  if (!tipo) return;

  if (activeTipos.has(tipo) && activeTipos.size > 1) {
    activeTipos.delete(tipo);
    btn.classList.remove('active');
  } else {
    activeTipos.add(tipo);
    btn.classList.add('active');
  }
  renderCombos(0);
  restartCombAuto(0);
});

combSize?.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const size = btn.dataset.size;
  if (!size) return;

  if (activeSizes.has(size) && activeSizes.size > 1) {
    activeSizes.delete(size);
    btn.classList.remove('active');
  } else {
    activeSizes.add(size);
    btn.classList.add('active');
  }
  renderCombos(0);
  restartCombAuto(0);
});

/* ========== 7. LAST MATCHES ========== */
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

  const top = document.createElement('div');
  top.className = 'streak-top';

  const badge = document.createElement('span');
  badge.className = `badge ${color}`;
  badge.textContent = fecha;

  const bal = document.createElement('span');
  bal.className = 'streak-len';
  bal.textContent = `+${partido.balance}`;

  top.append(badge, bal);

  const main = document.createElement('div');
  main.className = 'streak-teams';

  const eqA = document.createElement('div');
  eqA.className = 'streak-name ' + (partido.balance === 0 ? 'yellow' : 'green');
  eqA.textContent = partido.team_a.join(', ');

  const eqB = document.createElement('div');
  eqB.className = 'streak-name ' + (partido.balance === 0 ? 'yellow' : 'red');
  eqB.textContent = partido.team_b.join(', ');

  if (partido.balance > 0) eqA.classList.add('winner');

  main.append(eqA, eqB);
  el.append(top, main);
  return el;
}

async function loadMatches() {
  const matchesStatus = document.getElementById('matchesStatus');
  const matchesGrid = document.getElementById('matchesGrid');
  const matchesEmpty = document.getElementById('matchesEmpty');
  const ultimoContenedor = document.getElementById('ultimo-resultado-container');
  const ultimoCard = document.getElementById('ultimo-match-card');

  try {
    const res = await fetch(`data/partidos.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Todavía no hay partidos...');
    
    const obj = await res.json();
    const entries = Object.entries(obj).sort(([f1], [f2]) => f2.localeCompare(f1));

    if (!entries.length) {
      if (matchesEmpty) matchesEmpty.style.display = 'block';
      return;
    }

if (ultimoContenedor && ultimoCard) {
      const [fecha, partido] = entries[0];
      ultimoContenedor.style.display = 'block';
      
      const esEmpate = partido.balance === 0;
      const ganoA = partido.balance > 0;
      const ganoB = partido.balance < 0;

      const golesA = ganoA ? partido.balance : 0;
      const golesB = ganoB ? Math.abs(partido.balance) : 0;

      // El HTML ahora genera la tarjeta completa con su propia sombra y fondo
      ultimoCard.innerHTML = `
        <article class="streak ${!esEmpate ? 'blue' : 'gray'}" style="border-left: 8px solid ${ganoA ? 'var(--accent)' : ganoB ? 'var(--neg)' : 'var(--line)'}; margin: 0; box-shadow: 0 8px 24px rgba(0,0,0,0.3);">
          <div class="streak-top">
            <span class="badge blue">ÚLTIMO REPORTE</span>
            <span class="badge">${fecha}</span>
          </div>
          
          <div class="streak-main" style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0; gap: 15px; padding: 0 10px;">
            
            <div style="flex: 1; text-align: left;">
              <div style="color: var(--accent); font-size: 10px; font-weight: 800; margin-bottom: 8px; letter-spacing: 1px; text-transform: uppercase;">
                Equipo A ${ganoA ? '🏆' : ''}
              </div>
              <div class="mono" style="font-size: 0.85rem; color: var(--ink); line-height: 1.5; font-weight: 500;">
                ${partido.team_a.join('<br>')}
              </div>
            </div>

            <div style="background: var(--line); padding: 12px 18px; border-radius: 10px; min-width: 95px; text-align: center; box-shadow: inset 0 0 15px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05);">
              <div class="mono" style="font-size: 2rem; font-weight: 900; color: #fff; letter-spacing: 3px;">
                ${golesA}-${golesB}
              </div>
            </div>

            <div style="flex: 1; text-align: right;">
              <div style="color: var(--neg); font-size: 10px; font-weight: 800; margin-bottom: 8px; letter-spacing: 1px; text-transform: uppercase;">
                ${ganoB ? '🏆' : ''} Equipo B
              </div>
              <div class="mono" style="font-size: 0.85rem; color: var(--ink); line-height: 1.5; font-weight: 500;">
                ${partido.team_b.join('<br>')}
              </div>
            </div>

          </div>

          <div class="streak-footer" style="text-align: center; font-size: 0.75rem; border-top: 1px solid var(--line); padding-top: 10px; color: var(--muted); font-style: italic; letter-spacing: 0.5px;">
            ${esEmpate ? 'Jornada de máxima paridad' : (ganoA ? 'Victoria contundente del Equipo A' : 'Victoria estratégica del Equipo B')}
          </div>
        </article>
      `;
    }

    if (matchesGrid) {
      matchesGrid.innerHTML = '';
      for (const [fecha, partido] of entries.slice(0, 6)) {
        matchesGrid.appendChild(matchCard(fecha, partido));
      }
    }

    if (matchesStatus) matchesStatus.style.display = 'none';
    if (matchesGrid) matchesGrid.style.display = 'grid';

  } catch (err) {
    console.error(err);
    if (matchesStatus) matchesStatus.textContent = err.message;
  }
}

async function cargarPreviewNoticia() {
  const tituloNoticia = document.getElementById('noticia-semanal-titulo');
  if (!tituloNoticia) return;

  try {
    const res = await fetch(`data/noticias.json?v=${Date.now()}`);
    const noticias = await res.json();
    
    if (noticias.length > 0) {
      // Tomamos el título de la primera noticia (la más nueva)
      tituloNoticia.textContent = noticias[0].titulo;
    }
  } catch (e) {
    tituloNoticia.textContent = "Revisá la última crónica de la jornada";
  }
}

// Llamala al final del DOMContentLoaded o de loadMatches
cargarPreviewNoticia();

async function initCopaPreview() {

  const PARTIDO_DESTACADO = "F1"; // ← ELEGIR QUE PARTIDO MOSTRAR

  const previewContainer = document.getElementById('copaPreview');
  const previewGrid = document.getElementById('previewGrid');
  if (!previewContainer) return;

  try {
    const [cRes, clRes] = await Promise.all([
      fetch(`data/copas.json?v=${Date.now()}`),
      fetch(`data/clasificacion_copas.json?v=${Date.now()}`)
    ]);
    
    const copasJson = await cRes.json();
    const clasifData = await clRes.json();
    const copa = copasJson[0];
    const ranking = {};
    clasifData.forEach(r => { ranking[r.N] = r.JUG; });

    const b = copa.bracket;
    const todos = [...(b.cuartos || []), ...(b.semifinales || []), ...(b.final || [])];

    // Buscamos el primer partido pendiente (vuelta sin goles)
    const proximo = todos.find(p => p.id_partido === PARTIDO_DESTACADO);

    if (proximo) {
      const iJ1 = proximo.ida?.goles_j1 || 0;
      const iJ2 = proximo.ida?.goles_j2 || 0;
      const vJ1 = proximo.vuelta?.goles_j1 || 0;
      const vJ2 = proximo.vuelta?.goles_j2 || 0;
      const totalJ1 = iJ1 + vJ1;
      const totalJ2 = iJ2 + vJ2;
      const jugado = proximo.ida?.goles_j1 !== null;

      // Lógica de fechas
      const fIda = proximo.fechas?.ida || 'TBD';
      const fVue = proximo.fechas?.vuelta || 'TBD';
      let fechaDisplay = 'TBD';
      if (fIda !== 'TBD' && fVue !== 'TBD') {
          fechaDisplay = `Ida: ${fIda} | Vuelta: ${fVue}`;
      } else if (fIda !== 'TBD') {
          fechaDisplay = `Ida: ${fIda}`;
      }

      const resolver = (s) => {
        const raw = String(s || '').trim();
        const num = raw.match(/\d+$/);
        return num && ranking[num[0]] ? ranking[num[0]] : raw;
      };

      previewContainer.style.display = 'block';
      previewGrid.innerHTML = `
        <article class="streak ${jugado ? 'blue' : 'gray'}" style="border-left: 8px solid var(--accent); margin: 0; box-shadow: 0 8px 24px rgba(0,0,0,0.3);">
          <div class="streak-top">
            <span class="badge blue">${proximo.id_partido}</span>
            <span class="badge">${fechaDisplay}</span>
          </div>
          
          <div class="streak-main" style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0; gap: 15px; padding: 0 10px;">
            
            <div style="flex: 1; text-align: left;">
              <div style="color: var(--accent); font-size: 10px; font-weight: 800; margin-bottom: 8px; letter-spacing: 1px; text-transform: uppercase;">
                LOCAL
              </div>
              <div class="mono" style="font-size: 0.9rem; color: var(--ink); line-height: 1.4; font-weight: 500;">
                ${resolver(proximo.jugador1)}
              </div>
            </div>

            <div style="background: var(--line); padding: 12px 18px; border-radius: 10px; min-width: 95px; text-align: center; box-shadow: inset 0 0 15px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05);">
              <div class="mono" style="font-size: 2rem; font-weight: 900; color: #fff; letter-spacing: 3px;">
                ${jugado ? `${totalJ1}-${totalJ2}` : 'vs'}
              </div>
            </div>

            <div style="flex: 1; text-align: right;">
              <div style="color: var(--neg); font-size: 10px; font-weight: 800; margin-bottom: 8px; letter-spacing: 1px; text-transform: uppercase;">
                VISITANTE
              </div>
              <div class="mono" style="font-size: 0.9rem; color: var(--ink); line-height: 1.4; font-weight: 500;">
                ${resolver(proximo.jugador2)}
              </div>
            </div>

          </div>

          <div class="streak-footer" style="display:flex; justify-content:space-between; font-size:11px; border-top:1px solid var(--line); padding-top:10px; margin-top:8px; color:var(--muted); font-style: italic;">
            <span>Vantaggio: ${resolver(proximo.ventaja)}</span>
            ${jugado && !proximo.vuelta?.goles_j1 ? 
              '<span style="color:var(--accent)">En definición (Vuelta TBD)</span>' : 
              '<span>Próximo encuentro</span>'}
          </div>
        </article>
      `;
    }
  } catch (e) {
    console.warn("Copa preview error:", e);
  }
}

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', initCopaPreview);

/* ========== 8. INIT ========== */
// initLockCycle();
initTabla();
loadMatches();
