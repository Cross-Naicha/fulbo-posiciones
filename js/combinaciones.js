/* =========================================================
   LIGA DE FULBO - COMBINACIONES SCRIPT
   Author: Nicolás + ChatGPT
   Purpose: Loads and filters player combinations by result, size, and player.
   ========================================================= */


/* =========================================================
   1. ELEMENT REFERENCES AND VARIABLES
   ========================================================= */

// HTML elements
const tablaBody = document.querySelector('#tablaComb tbody');
const filterResultado = document.getElementById('filterResultado');
const filterTamano = document.getElementById('filterTamano');
const filterJugador = document.getElementById('filterJugador');
const btnReset = document.getElementById('btnReset');

// Data storage
let combinaciones = [];


/* =========================================================
   2. DATA LOADING
   ========================================================= */

/**
 * Fetches combination data from the JSON file.
 * Once loaded, populates the player filter and renders the full table.
 */
async function cargarCombinaciones() {
  try {
    const res = await fetch(`data/combinaciones.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    combinaciones = await res.json();

    poblarFiltroJugadores();
    renderTabla();

  } catch (err) {
    console.error("Error cargando combinaciones:", err);
    tablaBody.innerHTML = `
      <tr><td colspan="4" style="color:var(--muted)">Error cargando datos</td></tr>
    `;
  }
}


/* =========================================================
   3. POPULATE PLAYER FILTER
   ========================================================= */

/**
 * Collects all unique player names from the data and fills the
 * "filterJugador" dropdown menu.
 */
function poblarFiltroJugadores() {
  const jugadoresSet = new Set();

  for (const fila of combinaciones) {
    // Each combination may contain up to 4 players
    for (let i = 2; i <= 5; i++) {
      if (fila[i]) jugadoresSet.add(fila[i]);
    }
  }

  // Sort alphabetically (Spanish locale)
  const jugadores = Array.from(jugadoresSet).sort((a, b) => a.localeCompare(b, 'es'));

  for (const j of jugadores) {
    const opt = document.createElement('option');
    opt.value = j;
    opt.textContent = j;
    filterJugador.append(opt);
  }
}


/* =========================================================
   4. FILTERING AND TABLE RENDERING
   ========================================================= */

/**
 * Filters the combination data according to the selected filters:
 * - Result: winners or losers
 * - Size: groups of 2, 3, or 4
 * - Player: includes a specific player
 *
 * Then sorts and displays the table accordingly.
 */
function renderTabla() {
  const resSel = filterResultado.value;
  const tamSel = filterTamano.value;
  const jugSel = filterJugador.value;

  // Filter logic
  const filtradas = combinaciones.filter(fila => {
    const [resultado, tamano] = fila;

    const pasaResultado = !resSel || resultado === resSel;
    const pasaTamano = !tamSel || String(tamano) === tamSel;
    const pasaJugador = !jugSel || fila.slice(2, 6).includes(jugSel);

    return pasaResultado && pasaTamano && pasaJugador;
  });

  // If no results
  if (filtradas.length === 0) {
    tablaBody.innerHTML = `
      <tr><td colspan="4" style="color:var(--muted)">Sin resultados</td></tr>
    `;
    return;
  }

  // Sort by number of occurrences (descending)
  filtradas.sort((a, b) => b[6] - a[6]);

  // Clear and render
  tablaBody.innerHTML = '';
  for (const fila of filtradas) {
    const [resultado, tamano, j1, j2, j3, j4, veces] = fila;
    const jugadores = [j1, j2, j3, j4].filter(Boolean).join(', ');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:${resultado === 'GAN' ? 'var(--pos)' : 'var(--neg)'}">${resultado}</td>
      <td>${tamano}</td>
      <td>${jugadores}</td>
      <td>${veces}</td>
    `;
    tablaBody.appendChild(tr);
  }

  // Optional: smooth fade-in when table updates
  tablaBody.classList.add('fade-in');
  setTimeout(() => tablaBody.classList.remove('fade-in'), 350);
}


/* =========================================================
   5. EVENT LISTENERS
   ========================================================= */

// Update table when any filter changes
filterResultado.addEventListener('change', renderTabla);
filterTamano.addEventListener('change', renderTabla);
filterJugador.addEventListener('change', renderTabla);

// Reset filters and reload full table
btnReset.addEventListener('click', () => {
  filterResultado.value = '';
  filterTamano.value = '';
  filterJugador.value = '';
  renderTabla();
});


/* =========================================================
   6. INITIALIZATION
   ========================================================= */

/**
 * Initializes the page: loads data and sets up the filters.
 * Called automatically when the page loads.
 */
cargarCombinaciones();