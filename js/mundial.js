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

const clasifStatus    = document.getElementById('clasifStatus');
const clasifEmpty     = document.getElementById('clasifEmpty');
const clasifTableWrap = document.getElementById('clasifTableWrap');
const clasifTable     = document.getElementById('clasifTable');

// Modo de cómo mostrar los potenciales de cuartos:
// 'inline'  -> Q1 (Chagay) vs Q8 (P11)
// 'footer'  -> Q1 vs Q8  + bloque abajo "Q1: Chagay"
const POTENCIALES_MODE = 'footer';

// Mapa global posición -> nombre del jugador (según clasificacion_copas.json)
let rankingByPos = {};

// Mapeo entre id_partido del bracket y la posición de ranking que queremos mostrar
// Ajustá este objeto según cómo armes tu llave:
const slotPosMap = {
  Q1: 1,
  Q2: 2,
  Q3: 3,
  Q4: 4,
  S1: 1,  // ej: semifinal 1 con el 1°
  S2: 2,
  F1: 1   // ej: final etiquetada con el 1°
};


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

  // slots "puros" por defecto
  let j1 = p.jugador1;
  let j2 = p.jugador2;

  // Si estamos en modo inline y es partido de cuartos: resolvemos nombres
  if (POTENCIALES_MODE === 'inline' && isQuarterMatch(p)) {
    j1 = resolveSlotName(p.jugador1);
    j2 = resolveSlotName(p.jugador2);
  }

  if (Number.isFinite(ida.goles_j1) && Number.isFinite(ida.goles_j2)) {
    return `${j1} ${ida.goles_j1} - ${ida.goles_j2} ${j2} (Ida)`;
  }
  return `${j1} vs ${j2} (Ida)`;
}

function lineaVuelta(p) {
  const vuelta = p.vuelta;
  if (!vuelta) return '';

  let j1 = p.jugador1;
  let j2 = p.jugador2;

  if (POTENCIALES_MODE === 'inline' && isQuarterMatch(p)) {
    j1 = resolveSlotName(p.jugador1);
    j2 = resolveSlotName(p.jugador2);
  }

  if (Number.isFinite(vuelta.goles_j1) && Number.isFinite(vuelta.goles_j2)) {
    // Vuelta: J2 local
    return `${j2} ${vuelta.goles_j2} - ${vuelta.goles_j1} ${j1} (Vuelta)`;
  }
  return `${j2} vs ${j1} (Vuelta)`;
}

function isQuarterSlot(slot) {
  if (!slot) return false;
  const up = String(slot).trim().toUpperCase();
  return /^Q(\d+)$/.test(up);  // Q1, Q2, ..., Q8
}

function isQuarterMatch(p) {
  return isQuarterSlot(p.jugador1) && isQuarterSlot(p.jugador2);
}

// Solo usado en modo 'inline': Q1 -> "Q1 (Chagay)"
function resolveSlotName(slot) {
  if (!slot) return '';
  const raw = String(slot).trim();
  const up = raw.toUpperCase();

  const match = /^Q(\d+)$/.exec(up);
  if (!match) return raw; // S1, F1, nombres reales, etc.

  const pos = Number(match[1]);
  const nombre = rankingByPos[pos];
  if (!nombre) return raw;

  return `${raw} (${nombre})`;
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

  const baseId = p.id_partido ? String(p.id_partido).toUpperCase() : '';

  ganadorBadge.textContent = `${baseId || ''}: ${ganador ? ganador : 'Pendiente'}`;


  top.append(fechasBadge, ganadorBadge);

  // === GLOBAL GRANDE + INFO DEL LOCAL ===
  const main = document.createElement('div');
  main.className = 'streak-main';

  const infoLocal = document.createElement('div');
  infoLocal.className = 'streak-name mono';

  let ventajaTxt = p.ventaja;
  if (POTENCIALES_MODE === 'inline' && isQuarterSlot(p.ventaja)) {
    ventajaTxt = resolveSlotName(p.ventaja);
  }

  infoLocal.textContent = `Ventaja: ${ventajaTxt || p.ventaja || '-'}`;


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

    // === BLOQUE DE POTENCIALES (solo cuartos y modo 'footer') ===
  if (POTENCIALES_MODE === 'footer' && isQuarterMatch(p)) {
    const potWrap = document.createElement('div');
    potWrap.className = 'streak-teams mono';

    const title = document.createElement('div');
    title.className = 'streak-name';
    title.style.fontSize = '12px';
    title.style.opacity = '0.8';
    title.textContent = 'Potenciales:';
    potWrap.appendChild(title);

    // slots involucrados: jugador1, jugador2, ventaja (puede repetirse)
    const slots = [p.jugador1, p.jugador2];
    if (p.ventaja && !slots.includes(p.ventaja)) {
      slots.push(p.ventaja);
    }

    slots.forEach(slot => {
      if (!isQuarterSlot(slot)) return;
      const raw = String(slot).trim().toUpperCase();
      const match = /^Q(\d+)$/.exec(raw);
      if (!match) return;

      const pos = Number(match[1]);
      const nombre = rankingByPos[pos] || '—';

      const line = document.createElement('div');
      line.className = 'streak-name';
      line.style.fontSize = '12px';
      line.textContent = `${raw}: ${nombre}`;
      potWrap.appendChild(line);
    });

    el.appendChild(potWrap);
  }

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
  // Estados iniciales
  cuartosStatus.style.display = 'block';
  semisStatus.style.display   = 'block';
  finalStatus.style.display   = 'block';

  cuartosGrid.style.display = 'none';
  semisGrid.style.display   = 'none';
  finalGrid.style.display   = 'none';

  cuartosEmpty.style.display = 'none';
  semisEmpty.style.display   = 'none';
  finalEmpty.style.display   = 'none';

  clasifStatus.style.display    = 'block';
  clasifEmpty.style.display     = 'none';
  clasifTableWrap.style.display = 'none';

  try {
    // 1) Copa + clasificación (como antes)
    const [copaRes, clasifRes] = await Promise.all([
      fetch(`data/mundial.json?v=${Date.now()}`, { cache: 'no-store' }),
      fetch(`data/posiciones.json?v=${Date.now()}`, { cache: 'no-store' })
    ]);

    if (!copaRes.ok)  throw new Error('No se pudo cargar copas.json');
    if (!clasifRes.ok) throw new Error('No se pudo cargar clasificacion_copas.json');

    const copaData   = await copaRes.json();
    const clasifData = await clasifRes.json();

    // 2) Intentamos cargar overrides de semis/final (opcional)
    let override = {};
    try {
      const overrideRes = await fetch(`data/copas_semis_final.json?v=${Date.now()}`, { cache: 'no-store' });
      if (overrideRes.ok) {
        override = await overrideRes.json();
      }
    } catch (e) {
      // si falla, simplemente no usamos overrides
      console.warn('No se pudo cargar copas_semis_final.json (opcional):', e);
    }

    // 3) Render de clasificación
    if (Array.isArray(clasifData)) {
      renderClasificacion(clasifData);

      // llenar rankingByPos para las tarjetas (pos -> nombre)
      rankingByPos = {};
      clasifData.forEach(r => {
        const pos = Number(r.N);
        if (Number.isFinite(pos)) {
          rankingByPos[pos] = r.JUG;
        }
      });
    } else {
      renderClasificacion([]);
    }

    // 4) Copa
    let copa = null;
    if (Array.isArray(copaData)) {
      copa = copaData[0];
    } else {
      copa = copaData;
    }
    if (!copa) throw new Error('No se encontró ninguna copa para mostrar');

    if (copa.nombre && copaSubtitulo) {
      copaSubtitulo.textContent = copa.nombre;
    }
    if (copa.descripcion && copaDescripcion) {
      copaDescripcion.textContent = copa.descripcion;
    }

    const bracket = copa.bracket || {};

    // Semis y final: si hay override, usamos eso; si no, lo del bracket
    const semisData = (override.semifinales && override.semifinales.length)
      ? override.semifinales
      : (bracket.semifinales || []);

    const finalData = (override.final && override.final.length)
      ? override.final
      : (bracket.final || []);

    // Cuartos siempre desde copas.json (con Q1..Q8)
    renderRound(bracket.cuartos || [], cuartosGrid, cuartosStatus, cuartosEmpty);

    // Semis y final desde override o bracket
    renderRound(semisData, semisGrid, semisStatus, semisEmpty);
    renderRound(finalData, finalGrid, finalStatus, finalEmpty);

  } catch (err) {
    console.error(err);
    const msg = 'Error al cargar la copa: ' + err.message;

    cuartosStatus.textContent = msg;
    semisStatus.textContent   = msg;
    finalStatus.textContent   = msg;
    clasifStatus.textContent  = msg;

    cuartosStatus.style.display = 'block';
    semisStatus.style.display   = 'block';
    finalStatus.style.display   = 'block';

    cuartosGrid.style.display = 'none';
    semisGrid.style.display   = 'none';
    finalGrid.style.display   = 'none';

    cuartosEmpty.style.display = 'none';
    semisEmpty.style.display   = 'none';
    finalEmpty.style.display   = 'none';

    clasifTableWrap.style.display = 'none';
    clasifEmpty.style.display     = 'none';
  }
}


function renderClasificacion(rows) {
  // Limpio la tabla
  clasifTable.innerHTML = '';

  if (!rows || !rows.length) {
    clasifStatus.style.display = 'none';
    clasifTableWrap.style.display = 'none';
    clasifEmpty.style.display = 'block';
    return;
  }

  clasifStatus.style.display = 'none';
  clasifEmpty.style.display = 'none';
  clasifTableWrap.style.display = 'block';

  // Encabezado
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');

  ['Pos', 'Jugador', 'PTS', 'J', 'G', 'GOL'].forEach(txt => {
    const th = document.createElement('th');
    th.textContent = txt;
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);

  // Cuerpo
  const tbody = document.createElement('tbody');

  rows.forEach(r => {
    const tr = document.createElement('tr');

    // Fondo según S
    if (Number(r.S) === 1) {
      tr.classList.add('clasif-ok');      // verde
    } else if (Number(r.S) === 2) {
      tr.classList.add('clasif-risk');    // amarillo
    }

    const cPos   = document.createElement('td');
    const cJug   = document.createElement('td');
    const cPts   = document.createElement('td');
    const cJ     = document.createElement('td');
    const cG     = document.createElement('td');
    const cGol   = document.createElement('td');

    cPos.textContent = r.N;
    cJug.textContent = r.JUG;
    cPts.textContent = r.PTS;
    cJ.textContent   = r.J;
    cG.textContent   = r.G;
    cGol.textContent = r.GOL;

    tr.append(cPos, cJug, cPts, cJ, cG, cGol);
    tbody.appendChild(tr);
  });

  clasifTable.append(thead, tbody);
}


/* ========== 7. INIT ========== */

loadCopa();
