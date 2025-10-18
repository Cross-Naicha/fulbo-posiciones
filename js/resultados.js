/* =========================================================
   LIGA DE FULBO – ARMADOR DE EQUIPOS (versión móvil)
   Autor: Nicolás + ChatGPT
   Fecha: 2025-10
   ========================================================= */

/* === CONFIGURACIÓN JSONBIN === */
const BIN_ID = "68f393b5d0ea881f40a9f544";
const JSONBIN_KEY = "$2a$10$4xAKRNd3ji/59Jv/TNO19OCTcBwwMtvIsyAbYC9w5Kl/TFU98VVs6";
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const CACHE_KEY = "ultimoPartidoFulbo";

/* === ELEMENTOS DOM === */
const grid = document.getElementById("jugadoresGrid");
const statusJugadores = document.getElementById("statusJugadores");
const btnConfirmar = document.getElementById("btnConfirmarEquipos");
const contSeleccion = document.getElementById("seleccion-container");
const contEquipos = document.getElementById("equipos-container");
const colA = document.getElementById("colEquipoA");
const colB = document.getElementById("colEquipoB");
const msg = document.getElementById("msgResultado");

/* === MODAL === */
const modal = document.getElementById("modal-overlay");
const btnAgregar = document.getElementById("btnAgregarJugador");
const btnGuardarNuevo = document.getElementById("btnGuardarNuevo");
const btnCancelarNuevo = document.getElementById("btnCancelarNuevo");
const inputNuevoApodo = document.getElementById("nuevoApodo");

/* === ESTADO === */
let jugadores = [];
let asignaciones = {}; // { apodo: "A" | "B" | null }

/* =========================================================
   1. CARGAR JUGADORES DESDE JSON
   ========================================================= */
async function cargarJugadores() {
  try {
    const res = await fetch("data/jugadores.json");
    if (!res.ok) throw new Error("No se pudo cargar jugadores");
    const data = await res.json();
    jugadores = data.map(j => j.apodo);
    renderJugadores();
  } catch (err) {
    statusJugadores.textContent = "⚠️ Error al cargar jugadores";
    console.error(err);
  }
}

/* =========================================================
   2. RENDERIZAR TARJETAS STREAK
   ========================================================= */
function renderJugadores() {
  grid.innerHTML = "";
  statusJugadores.textContent = "";

  jugadores.forEach(apodo => {
    asignaciones[apodo] = null; // sin equipo

    const card = document.createElement("div");
    card.className = "streak jugador-card no-jugo";
    card.textContent = apodo;

    // cambio de estado con toque/click
    card.addEventListener("click", () => toggleJugador(apodo, card));

    grid.appendChild(card);
  });

  actualizarBotonConfirmar();
}

/* =========================================================
   3. TOGGLE DE JUGADOR (A ↔ B ↔ ninguno)
   ========================================================= */
function toggleJugador(apodo, card) {
  const estadoActual = asignaciones[apodo];
  let nuevoEstado;

  if (estadoActual === "A") nuevoEstado = "B";
  else if (estadoActual === "B") nuevoEstado = null;
  else nuevoEstado = "A";

  asignaciones[apodo] = nuevoEstado;

  card.classList.remove("equipoA", "equipoB", "no-jugo");
  if (nuevoEstado === "A") card.classList.add("equipoA");
  else if (nuevoEstado === "B") card.classList.add("equipoB");
  else card.classList.add("no-jugo");

  actualizarBotonConfirmar();
}

/* =========================================================
   4. VALIDACIÓN Y CONFIRMACIÓN
   ========================================================= */
function actualizarBotonConfirmar() {
  const eqA = Object.values(asignaciones).filter(v => v === "A").length;
  const eqB = Object.values(asignaciones).filter(v => v === "B").length;
  btnConfirmar.disabled = !(eqA === 5 && eqB === 5);
}

btnConfirmar.onclick = () => {
  const eqA = jugadores.filter(j => asignaciones[j] === "A");
  const eqB = jugadores.filter(j => asignaciones[j] === "B");

  if (eqA.length !== 5 || eqB.length !== 5) {
    alert("⚠️ Debe haber 5 jugadores por equipo.");
    return;
  }

  mostrarEquipos(eqA, eqB);
};

/* =========================================================
   5. MOSTRAR EQUIPOS Y PERMITIR CORRECCIÓN
   ========================================================= */
function mostrarEquipos(eqA, eqB) {
  contSeleccion.style.display = "none";
  contEquipos.style.display = "block";

  colA.innerHTML = "";
  colB.innerHTML = "";
  eqA.forEach(j => {
    const p = document.createElement("p");
    p.textContent = j;
    colA.appendChild(p);
  });
  eqB.forEach(j => {
    const p = document.createElement("p");
    p.textContent = j;
    colB.appendChild(p);
  });
}

document.getElementById("btnCorregir").onclick = () => {
  contEquipos.style.display = "none";
  contSeleccion.style.display = "block";
};

/* =========================================================
   6. AGREGAR NUEVO JUGADOR
   ========================================================= */
btnAgregar.onclick = () => {
  inputNuevoApodo.value = "";
  modal.style.display = "flex";
  inputNuevoApodo.focus();
};

btnGuardarNuevo.onclick = () => {
  const nuevo = inputNuevoApodo.value.trim();
  if (!nuevo) return alert("Ingresá un apodo válido.");
  if (jugadores.includes(nuevo)) return alert("Ese jugador ya existe.");

  jugadores.push(nuevo);
  modal.style.display = "none";
  renderJugadores();
};

btnCancelarNuevo.onclick = () => {
  modal.style.display = "none";
};

/* =========================================================
   7. GUARDAR RESULTADO EN JSONBIN
   ========================================================= */
document.getElementById("btnGuardarResultado").onclick = async () => {
  const goalsA = Number(document.getElementById("golesA").value);
  const goalsB = Number(document.getElementById("golesB").value);

  if (isNaN(goalsA) || isNaN(goalsB)) {
    msg.textContent = "⚠️ Ingresá números válidos.";
    return;
  }

  // obtener equipos actuales
  const teamA = jugadores.filter(j => asignaciones[j] === "A");
  const teamB = jugadores.filter(j => asignaciones[j] === "B");
  if (teamA.length !== 5 || teamB.length !== 5) {
    msg.textContent = "⚠️ Se necesitan 5 jugadores por equipo. ⚠️";
    return;
  }

  let dataFinal = {
    fecha: new Date().toISOString().split("T")[0],
    equipos: { A: teamA, B: teamB },
    resultado: {A: goalsA, B: goalsB},
  };

  msg.textContent = "⏳ Guardando en JSONBin... ⏳";

  try {
    const ok = await guardarEnJsonBin(dataFinal);
    msg.textContent = ok
      ? "✅ Partido guardado correctamente."
      : "⚠️ Error al guardar. Copia de respaldo local creada.";
  } catch (err) {
    msg.textContent = "❌ Error inesperado.";
    console.error(err);
  }
};

/* =========================================================
   8. GUARDAR EN JSONBIN
   ========================================================= */
async function guardarEnJsonBin(data) {
  try {
    const res = await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Key": JSONBIN_KEY
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error(err);
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return false;
  }
}

/* =========================================================
   9. INICIALIZAR
   ========================================================= */
document.addEventListener("DOMContentLoaded", cargarJugadores);
