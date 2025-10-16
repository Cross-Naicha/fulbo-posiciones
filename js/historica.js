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
   5. TABLE OF POSITIONS
   ========================================================= */

/**
 * Fetches and displays player ranking data from posiciones.json.
 */
const status = document.getElementById("status");
const tabla = document.getElementById("tabla");
const tbody = document.getElementById("tbody");

function setStatus(msg) {
  status.textContent = msg;
  status.style.display = "block";
  tabla.style.display = "none";
}
function showTable() {
  status.style.display = "none";
  tabla.style.display = "table";
}
function fmt2(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : v;
}

async function loadTable() {
  try {
    setStatus("Cargando datos…");
    const res = await fetch(`data/posiciones_historicas.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const rows = await res.json();
    tbody.innerHTML = "";

    // Show only top 10 players
    const top10 = rows.slice(0, 30);

    for (const r of top10) {
      const tr = document.createElement("tr");

      let deltaClass = "";
      if (r.Δ?.includes("↑")) deltaClass = "up";
      else if (r.Δ?.includes("↓")) deltaClass = "down";

      let golClass = "";
      const golNum = parseInt(r.GOL?.replace(/[^\d-]/g, "") || "0", 10);
      if (golNum > 0) golClass = "pos";
      else if (golNum < 0) golClass = "neg";

      const gClass = r.G >= 0 ? "pos" : "";
      const eClass = r.E >= 0 ? "draw" : "";
      const pClass = r.P >= 0 ? "neg" : "";

      tr.innerHTML = `
        <td>${r.N ?? ""}</td>
        <td class="${deltaClass}">${r.Δ ?? ""}</td>
        <td><a href="jugador.html?id=${r.ID}">${r.JUG ?? ""}</a></td>
        <td>${r.J ?? ""}</td>
        <td>${r.PTS ?? ""}</td>
        <td class="${gClass}">${r.G ?? ""}</td>
        <td class="${eClass}">${r.E ?? ""}</td>
        <td class="${pClass}">${r.P ?? ""}</td>
        <td class="${golClass}">${r.GOL ?? ""}</td>
      `;
      tbody.appendChild(tr);
    }
    showTable();

  } catch (err) {
    setStatus("Error al cargar datos: " + err.message);
    console.error(err);
  }
}

/* =========================================================
   8. INITIALIZATION
   ========================================================= */

/**
 * Runs all startup functions once the page is ready.
 * This ensures everything loads correctly in order.
 */
loadTable();