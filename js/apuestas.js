/* =========================
   CONFIG
========================= */

const BIN_ID = "69a372a743b1c97be9a7964b";
const API_KEY = "$2a$10$GOKT1tAWaguksXB1ZE0FO.x1723cMViMcGp1Ee4iG.xGq9udSGCnS";

let CURRENT_USER = null;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

/* =========================
   STATE
========================= */

let data = null;
let selectedSide = null;
let pendingBet = null;

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await fetchData();
  populateUserSelector();
  attachEvents();
  renderAll();
}

/* =========================
   FETCH & SAVE
========================= */

async function fetchData() {
  const res = await fetch(BASE_URL, {
    headers: { "X-Master-Key": API_KEY }
  });

  if (!res.ok) {
    alert("Error conectando con JSONBin");
    return;
  }

  const json = await res.json();
  data = json.record;
}

async function saveData() {
  await fetch(BASE_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": API_KEY
    },
    body: JSON.stringify(data)
  });
}

/* =========================
   USER SELECTOR
========================= */

function populateUserSelector() {
  const select = document.getElementById("userSelect");
  select.innerHTML = "";

  Object.keys(data.usuarios).forEach(user => {
    const option = document.createElement("option");
    option.value = user;
    option.textContent = user;
    select.appendChild(option);
  });

  const savedUser = localStorage.getItem("liga_user");
  if (savedUser && data.usuarios[savedUser]) {
    CURRENT_USER = savedUser;
    select.value = savedUser;
  } else {
    CURRENT_USER = select.value;
  }
}

function handleUserChange(e) {
  CURRENT_USER = e.target.value;
  localStorage.setItem("liga_user", CURRENT_USER);
  renderAll();
}

/* =========================
   MARKET CALCULATION
========================= */

function calculateMarket() {
  const apuestas = data.mercado_activo.apuestas;

  let poolA = 0;
  let poolB = 0;

  apuestas.forEach(a => {
    if (a.lado === "A") poolA += a.monto;
    if (a.lado === "B") poolB += a.monto;
  });

  const total = poolA + poolB;

  let cuotaA = "-";
  let cuotaB = "-";
  let pctA = 0;
  let pctB = 0;

  if (total > 0) {
    if (poolA > 0) cuotaA = (total / poolA).toFixed(2);
    if (poolB > 0) cuotaB = (total / poolB).toFixed(2);

    pctA = ((poolA / total) * 100).toFixed(0);
    pctB = ((poolB / total) * 100).toFixed(0);
  }

  return { poolA, poolB, total, cuotaA, cuotaB, pctA, pctB };
}

/* =========================
   RENDER
========================= */

function renderAll() {
  renderMarket();
  renderUserPanel();
  renderRanking();
  renderComments();
}

function renderMarket() {
  const m = calculateMarket();

    const cards = document.querySelectorAll(".streak");
    cards.forEach(c => c.classList.remove("dominant"));

    if (m.poolA > m.poolB) cards[0].classList.add("dominant");
    if (m.poolB > m.poolA) cards[1].classList.add("dominant");

  document.getElementById("pctA").innerText = m.pctA + "%";
  document.getElementById("pctB").innerText = m.pctB + "%";
  document.getElementById("cuotaA").innerText = m.cuotaA;
  document.getElementById("cuotaB").innerText = m.cuotaB;
  document.getElementById("poolA").innerText = "$" + m.poolA;
  document.getElementById("poolB").innerText = "$" + m.poolB;
  document.getElementById("totalPool").innerText = "$" + m.total;

  document.querySelectorAll(".streak-name")[0].innerText = data.mercado_activo.ladoA;
  document.querySelectorAll(".streak-name")[1].innerText = data.mercado_activo.ladoB;

  document.getElementById("marketInfo").innerText =
    `${data.mercado_activo.match_id} · Cierre: ${data.mercado_activo.fecha_cierre}`;
}

function renderUserPanel() {
  if (!CURRENT_USER || !data.usuarios[CURRENT_USER]) return;

  const user = data.usuarios[CURRENT_USER];
  const meta = data.meta;

  const max = Math.floor(user.saldo * meta.max_porcentaje_apuesta);

  document.getElementById("userName").innerText = CURRENT_USER;
  document.getElementById("saldoActual").innerText = "$" + user.saldo;
  document.getElementById("maxPermitido").innerText = "$" + max;
  document.getElementById("saldoProyectado").innerText = "-";
}

function renderRanking() {
  const tbody = document.querySelector("#rankingTable tbody");
  tbody.innerHTML = "";

  const users = Object.entries(data.usuarios)
    .sort((a, b) => b[1].saldo - a[1].saldo);

  users.forEach((u, i) => {
    const roi = ((u[1].saldo - data.meta.saldo_inicial) / data.meta.saldo_inicial).toFixed(2);

    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${u[0]}</td>
        <td>$${u[1].saldo}</td>
        <td>${roi}</td>
      </tr>
    `;
  });
}

function renderComments() {
  const container = document.getElementById("comentariosContainer");
  container.innerHTML = "";

  const apuestas = [...data.mercado_activo.apuestas]
    .sort((a, b) => b.timestamp - a.timestamp);

  if (apuestas.length === 0) {
    container.innerHTML = `<div class="mono" style="opacity:.6;">Aún no hay comentarios.</div>`;
    return;
  }

  apuestas.forEach(a => {
    if (!a.comentario) return;

    container.innerHTML += `
      <div class="bet-comment-box">
        <strong>${a.usuario}</strong>: ${a.comentario}
      </div>
    `;
  });
}

/* =========================
   EVENTS
========================= */

function attachEvents() {
  document.getElementById("userSelect").addEventListener("change", handleUserChange);

  document.getElementById("sideA").addEventListener("click", () => {
    selectedSide = "A";
    setActiveButton();
  });

  document.getElementById("sideB").addEventListener("click", () => {
    selectedSide = "B";
    setActiveButton();
  });

  document.getElementById("apostarBtn").addEventListener("click", prepareBet);

  document.getElementById("montoInput").addEventListener("input", updateProjected);

  document.getElementById("confirmPinBtn").addEventListener("click", confirmPin);
  document.getElementById("cancelPinBtn")?.addEventListener("click", closePinModal);
}

/* =========================
   PIN LOGIC
========================= */

function prepareBet() {
  if (!CURRENT_USER) return alert("Seleccioná un usuario.");

  const monto = Number(document.getElementById("montoInput").value);
  const meta = data.meta;
  const user = data.usuarios[CURRENT_USER];
  const mercado = data.mercado_activo;

  if (!selectedSide) return alert("Seleccioná un lado.");
  if (!monto || monto < meta.min_apuesta) return alert("Monto inválido.");

  const max = Math.floor(user.saldo * meta.max_porcentaje_apuesta);
  if (monto > max) return alert("Supera el máximo permitido.");

  if (mercado.apuestas.some(a => a.usuario === CURRENT_USER))
    return alert("Ya apostaste en este mercado.");

  if (Date.now() > new Date(mercado.fecha_cierre).getTime())
    return alert("Mercado cerrado.");

  pendingBet = { monto };

  openPinModal();
}

function openPinModal() {
  document.getElementById("pinModal").style.display = "block";
}

function closePinModal() {
  document.getElementById("pinModal").style.display = "none";
  document.getElementById("pinInput").value = "";
}

async function confirmPin() {
  const inputPin = document.getElementById("pinInput").value;
  const realPin = data.usuarios[CURRENT_USER].pin;

  if (inputPin !== realPin) {
    alert("PIN incorrecto.");
    return;
  }

  await executeBet();
  closePinModal();
}

async function executeBet() {
  const mercado = data.mercado_activo;
  const monto = pendingBet.monto;
  const m = calculateMarket();
  const cuota = selectedSide === "A" ? m.cuotaA : m.cuotaB;

  mercado.apuestas.push({
    usuario: CURRENT_USER,
    lado: selectedSide,
    monto: monto,
    timestamp: Date.now(),
    comentario: document.getElementById("comentarioInput").value,
    cuota_al_momento: cuota
  });

  await saveData();
  await fetchData();
  renderAll();

  document.getElementById("montoInput").value = "";
  document.getElementById("comentarioInput").value = "";
  selectedSide = null;
  setActiveButton();
  pendingBet = null;
}

/* =========================
   UI HELPERS
========================= */

function setActiveButton() {
  document.getElementById("sideA").classList.remove("active-a");
  document.getElementById("sideB").classList.remove("active-b");

  if (selectedSide === "A")
    document.getElementById("sideA").classList.add("active-a");

  if (selectedSide === "B")
    document.getElementById("sideB").classList.add("active-b");
}

function updateProjected() {
  if (!CURRENT_USER) return;

  const monto = Number(document.getElementById("montoInput").value);
  if (!monto || !selectedSide) return;

  const m = calculateMarket();
  const user = data.usuarios[CURRENT_USER];

  let cuota = selectedSide === "A" ? m.cuotaA : m.cuotaB;
  if (cuota === "-") return;

  const payout = monto * cuota;
  const proyectado = (user.saldo - monto + payout).toFixed(2);

  document.getElementById("saldoProyectado").innerText = "$" + proyectado;
}