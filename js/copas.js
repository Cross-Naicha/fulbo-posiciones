/* =========================================================
   LIGA DE FULBO - COPAS SCRIPT (ida/vuelta + fechas)
   ========================================================= */

/* ========== 1. SCROLL TO TOP + FAB MENU (igual que en main.js) ========== */
(function initScrollToTop() {
  const btn = document.getElementById('toTopBtn');
  const fabMenu = document.getElementById('fabMenu');
  let pressTimer = null;
  let menuOpen = false;

  if (!btn) return;

  const toggle = () => {
    if (window.scrollY > 100) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
      hideFabMenu();
    }
  };

  function showFabMenu() {
    if (!fabMenu) return;
    fabMenu.classList.add('show');
    menuOpen = true;
  }
  function hideFabMenu() {
    if (!fabMenu) return;
    fabMenu.classList.remove('show');
    menuOpen = false;
  }

  window.addEventListener('scroll', toggle, { passive: true });
  window.addEventListener('resize', toggle);
  document.addEventListener('DOMContentLoaded', toggle);

  btn.addEventListener('click', e => {
    if (menuOpen) {
      hideFabMenu();
      return;
    }
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  btn.addEventListener('touchstart', () => {
    pressTimer = setTimeout(() => {
      showFabMenu();
    }, 420);
  }, { passive: true });

  btn.addEventListener('touchend', () => {
    clearTimeout(pressTimer);
  });

  document.addEventListener('touchstart', e => {
    if (!menuOpen) return;
    if (!fabMenu.contains(e.target) && e.target !== btn) {
      hideFabMenu();
    }
  }, { passive: true });
})();

/* ========== 2. ELEMENTOS DE LA PÁGINA DE COPAS ========== */

const cuartosStatus = document.getElementById('cuartosStatus');
const cuartosGrid   = document.getElementById('cuartosGrid');
const cuartosEmpty  = document.getElementById('cuartosEmpty');

const semisStatus   = document.getElementById('semisStatus');
const semisGrid     = document.getElementById('semisGrid');
const semisEmpty    = document.getElementById('semisEmpty');

const finalStatus   = document.getElementById('finalStatus');
const finalGrid     = document.getElementById('finalGrid');
const finalEmpty    = document.getElementById('finalEmpty');

const copaSubtitulo   = document.getElementById('copaSubtitulo');
const copaDescripcion = document.getElementById('copaDescripcion');

/* ========== 3. HELPERS: GLOBAL, GANADOR, FECHAS ========== */

function sumaLeg(leg) {
  if (!leg) return { j1: 0, j2: 0, completo: false };
  const g1 = typeof leg.goles_j1 === 'number' ? leg.goles_j1 : 0;
  const g2 = typeof leg.goles_j2 === 'number' ? leg.goles_j2 : 0;
  const completo = Number.isFinite(leg.goles_j1) && Number.isFinite(leg.goles_j2);
  return { j1: g1, j2: g2, completo };
}

function globalPartido(p) {
  const ida = sumaLeg(p.ida);
  const vuelta = sumaLeg(p.vuelta);
  const totalJ1 = ida.j1 + vuelta.j1;
  const totalJ2 = ida.j2 + vuelta.j2;
  const hayAlguno = ida.completo || vuelta.completo;
  return { totalJ1, totalJ2, hayAlguno };
}

function ganadorPartido(p) {
  if (p.ganador) return p.ganador;

  const { totalJ1, totalJ2, hayAlguno } = globalPartido(p);
  if (!hayAlguno) return null;
  if (totalJ1 > totalJ2) return p.jugador1;
  if (totalJ2 > totalJ1) return p.jugador2;
  return null; // empate global
}

function fechasTexto(p) {
  const fIda = p.fechas?.ida || null;
  const fVuelta = p.fechas?.vuelta || null;

  if (fIda && fVuelta) {
    return `Ida: ${fIda} · Vuelta: ${fVuelta}`;
  }
  if (fIda) return `Ida: ${fIda}`;
  if (fVuelta) return `Vuelta: ${fVuelta}`;
  return 'Fechas a definir';
}

// Para ordenar: usamos fecha de ida si existe, sino de vuelta, sino vacío
function fechaPrincipalOrden(p) {
  const fIda = p.fechas?.ida || '';
  const fVuelta = p.fechas?.vuelta || '';
  return fIda || fVuelta || '';
}

/* ========== 4. TARJETA DE CRUCE (IDA/VUELTA) ========== */

function colorPartido(p) {
  const g = ganadorPartido(p);
  if (!g) return 'gray'; // pendiente o empate global
  return 'blue';
}

function textoGlobal(p) {
  const { totalJ1, totalJ2, hayAlguno } = globalPartido(p);
  if (!hayAlguno) return 'vs';

  const ganador = ganadorPartido(p);
  if (!ganador) {
    return `${totalJ1} – ${totalJ2}`;
  }

  const j1Primero = ganador === p.jugador1;
  if (j1Primero) {
    return `${totalJ1} – ${totalJ2}`;
  } else {
    return `${totalJ2} – ${totalJ1}`;
  }
}

function lineaIda(p) {
  const ida = p.ida;
  if (!ida) return '';

  if (Number.isFinite(ida.goles_j1) && Number.isFinite(ida.goles_j2)) {
    // J1 local, J2 visitante
    return `${p.jugador1} ${ida.goles_j1} - ${ida.goles_j2} ${p.jugador2} (Ida)`;
  }
  return `${p.jugador1} vs ${p.jugador2} (Ida)`;
}

function lineaVuelta(p) {
  const vuelta = p.vuelta;
  if (!vuelta) return '';

  if (Number.isFinite(vuelta.goles_j1) && Number.isFinite(vuelta.goles_j2)) {
    // En la vuelta queremos: J2 goles_j2 - goles_j1 J1 (Vuelta)
    return `${p.jugador2} ${vuelta.goles_j2} - ${vuelta.goles_j1} ${p.jugador1} (Vuelta)`;
  }
  return `${p.jugador2} vs ${p.jugador1} (Vuelta)`;
}

function copaMatchCard(p) {
  const el = document.createElement('article');
  const color = colorPartido(p);
  el.className = `streak ${color}`;

  // === TOP: fechas (ida/vuelta) + ganador ===
  const top = document.createElement('div');
  top.className = 'streak-top';

  const fechasBadge = document.createElement('span');
  fechasBadge.className = `badge ${color}`;
  fechasBadge.textContent = fechasTexto(p);

  const ganadorBadge = document.createElement('span');
  ganadorBadge.className = 'badge';
  const ganador = ganadorPartido(p);
  ganadorBadge.textContent = `${p.id_partido}: ${ganador ? ganador : 'Pendiente'}`;

  top.append(fechasBadge, ganadorBadge);

  // === GLOBAL GRANDE + INFO DEL LOCAL ===
  const main = document.createElement('div');
  main.className = 'streak-main';

  // Primera línea de texto: quién es local (jugador1)
  const infoLocal = document.createElement('div');
  infoLocal.className = 'streak-name mono';
  infoLocal.textContent = `Ventaja: ${p.ventaja}`;

  const globalSpan = document.createElement('div');
  globalSpan.className = 'streak-len';
  globalSpan.textContent = textoGlobal(p);

  main.append(infoLocal, globalSpan);

  // === DETALLE IDA / VUELTA ABAJO ===
  const details = document.createElement('div');
  details.className = 'streak-teams';

  const l1 = document.createElement('div');
  l1.className = 'streak-name mono';
  l1.textContent = lineaIda(p);

  const l2 = document.createElement('div');
  l2.className = 'streak-name mono';
  l2.textContent = lineaVuelta(p);

  if (l1.textContent) details.appendChild(l1);
  if (l2.textContent) details.appendChild(l2);

  el.append(top, main, details);
  return el;
}

/* ========== 5. RENDER DE UNA RONDA ========== */

function renderRound(partidos, grid, statusEl, emptyEl) {
  grid.innerHTML = '';

  if (!partidos || !partidos.length) {
    statusEl.style.display = 'none';
    grid.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  const ordenados = partidos.slice().sort((a, b) => {
    if (a.numero != null && b.numero != null) return a.numero - b.numero;
    const fa = fechaPrincipalOrden(a);
    const fb = fechaPrincipalOrden(b);
    return fa.localeCompare(fb);
  });

  ordenados.forEach(p => {
    grid.appendChild(copaMatchCard(p));
  });

  statusEl.style.display = 'none';
  emptyEl.style.display = 'none';
  grid.style.display = 'grid';
}

/* ========== 6. CARGA DE COPA DESDE JSON ========== */

async function loadCopa() {
  cuartosStatus.style.display = 'block';
  semisStatus.style.display   = 'block';
  finalStatus.style.display   = 'block';

  cuartosGrid.style.display = 'none';
  semisGrid.style.display   = 'none';
  finalGrid.style.display   = 'none';

  cuartosEmpty.style.display = 'none';
  semisEmpty.style.display   = 'none';
  finalEmpty.style.display   = 'none';

  try {
    const res = await fetch(`data/copas.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo cargar copas.json');
    const data = await res.json();

    let copa = null;
    if (Array.isArray(data)) {
      copa = data[0];
    } else {
      copa = data;
    }
    if (!copa) throw new Error('No se encontró ninguna copa para mostrar');

    if (copa.nombre && copaSubtitulo) {
      copaSubtitulo.textContent = copa.nombre;
    }
    if (copa.descripcion && copaDescripcion) {
      copaDescripcion.textContent = copa.descripcion;
    }

    const bracket = copa.bracket || {};
    renderRound(bracket.cuartos     || [], cuartosGrid, cuartosStatus, cuartosEmpty);
    renderRound(bracket.semifinales || [], semisGrid,   semisStatus,   semisEmpty);
    renderRound(bracket.final       || [], finalGrid,   finalStatus,   finalEmpty);

  } catch (err) {
    console.error(err);
    const msg = 'Error al cargar la copa: ' + err.message;

    cuartosStatus.textContent = msg;
    semisStatus.textContent   = msg;
    finalStatus.textContent   = msg;

    cuartosStatus.style.display = 'block';
    semisStatus.style.display   = 'block';
    finalStatus.style.display   = 'block';

    cuartosGrid.style.display = 'none';
    semisGrid.style.display   = 'none';
    finalGrid.style.display   = 'none';

    cuartosEmpty.style.display = 'none';
    semisEmpty.style.display   = 'none';
    finalEmpty.style.display   = 'none';
  }
}

/* ========== 7. INIT ========== */

loadCopa();
