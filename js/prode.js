(function initProdePage() {
  const BIN_ID = "6a221853f5f4af5e29bb2583";
  const API_KEY = "$2a$10$GOKT1tAWaguksXB1ZE0FO.x1723cMViMcGp1Ee4iG.xGq9udSGCnS";
  const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
  const RESULTS_URL = "data/prode_results.json";

  const BASE = {
    naicha: "z5YP",
    pollo: "ncoT",
    mario: "g8sX",
    ponce: "a9vR",
    benja: "k3wL",
    berna: "h2mQ",
    lomba: "f7jD",
    chagay: "e6rS",
    cesar: "b1uN",
    mato: "c4tY",
    juan: "l9oW"
  };

  const els = {
    status: document.getElementById("prodeStatus"),
    loginPanel: document.getElementById("loginPanel"),
    accessCode: document.getElementById("accessCode"),
    loginBtn: document.getElementById("loginBtn"),
    loginStatus: document.getElementById("loginStatus"),
    userPanel: document.getElementById("userPanel"),
    currentUserLabel: document.getElementById("currentUserLabel"),
    refreshBtn: document.getElementById("refreshBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    matchesContainer: document.getElementById("matchesContainer"),
    saveBar: document.getElementById("saveBar"),
    saveBtn: document.getElementById("saveBtn"),
    saveStatus: document.getElementById("saveStatus"),
    resultsTable: document.querySelector("#resultsTable tbody"),
    resultsEmpty: document.getElementById("resultsEmpty")
  };

  let prode = {};
  let results = [];
  let currentUser = localStorage.getItem("prode_user") || "";

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    attachEvents();
    await Promise.all([loadData(), loadResults()]);
    if (currentUser && BASE[currentUser]) showSession();
    render();
    renderResults();
  }

  function attachEvents() {
    els.loginBtn.addEventListener("click", login);
    els.accessCode.addEventListener("keydown", event => {
      if (event.key === "Enter") login();
    });
    els.refreshBtn.addEventListener("click", async () => {
      await loadData();
      render();
      setSaveStatus("Datos actualizados.");
    });
    els.logoutBtn.addEventListener("click", logout);
    els.saveBtn.addEventListener("click", savePredictions);
    els.matchesContainer.addEventListener("input", handleScoreInput);
    els.matchesContainer.addEventListener("click", handleResultClick);
  }

  async function loadData() {
    setStatus("Leyendo JSONBin...");
    try {
      const res = await fetch(BASE_URL, {
        cache: "no-store",
        headers: { "X-Master-Key": API_KEY }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      prode = payload.record || {};
      setStatus("Datos cargados.");
    } catch (error) {
      console.error(error);
      prode = {};
      setStatus("No se pudo cargar el prode.");
      els.matchesContainer.innerHTML = `<div class="empty-state">Error al conectar con JSONBin.</div>`;
    }
  }

  async function loadResults() {
    try {
      const res = await fetch(`${RESULTS_URL}?v=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      results = Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.warn("No se pudo cargar prode_results.json", error);
      results = [];
    }
  }

  function login() {
    const code = els.accessCode.value.trim();
    const user = Object.keys(BASE).find(name => BASE[name] === code);
    if (!user) {
      els.loginStatus.textContent = "Clave incorrecta.";
      els.loginStatus.style.color = "var(--neg)";
      return;
    }
    currentUser = user;
    localStorage.setItem("prode_user", currentUser);
    els.accessCode.value = "";
    els.loginStatus.textContent = "";
    showSession();
    render();
  }

  function logout() {
    currentUser = "";
    localStorage.removeItem("prode_user");
    els.loginPanel.hidden = false;
    els.userPanel.hidden = true;
    els.saveBar.hidden = true;
    render();
  }

  function showSession() {
    els.loginPanel.hidden = true;
    els.userPanel.hidden = false;
    els.saveBar.hidden = false;
    els.currentUserLabel.textContent = capitalize(currentUser);
  }

  function render() {
    renderMatches();
  }

  function renderMatches() {
    if (!currentUser) {
      els.matchesContainer.innerHTML = `<div class="empty-state">Ingresa tu clave para cargar pronosticos.</div>`;
      return;
    }

    const matches = getMatches();

    if (!matches.length) {
      els.matchesContainer.innerHTML = `<div class="empty-state">No hay partidos para esos filtros.</div>`;
      return;
    }

    els.matchesContainer.innerHTML = matches.map(renderMatchCard).join("");
  }

  function renderMatchCard(match) {
    const prediction = normalizeTicket(match.tickets?.[currentUser]);
    const [homeGoals, awayGoals, result] = prediction;
    const title = `${escapeHtml(match.group || match.stage || "Mundial")} - ${escapeHtml(match.dateLabel || "Fecha TBD")}`;

    return `
      <article class="card prode-card" data-match-id="${escapeAttr(match.id)}">
        <div class="match-topline">
          <span>${title}</span>
          <span class="mono">${escapeHtml(match.timeLabel || "")}</span>
        </div>
        <div class="match-body">
          <div class="team-name">${escapeHtml(match.home)}</div>
          <div class="versus-pill">VS</div>
          <div class="team-name away">${escapeHtml(match.away)}</div>
        </div>
        <div class="ticket-editor">
          <div>
            <span class="eyebrow">Mi pronostico</span>
            <strong class="mono">${homeGoals}-${awayGoals} ${resultLabel(result)}</strong>
          </div>
          <div class="score-row">
            <input class="score-input" type="number" min="0" max="30" inputmode="numeric" data-field="home" value="${homeGoals}">
            <span class="score-sep">-</span>
            <input class="score-input" type="number" min="0" max="30" inputmode="numeric" data-field="away" value="${awayGoals}">
          </div>
          <div class="result-row" role="group" aria-label="Resultado">
            ${resultButton(1, match.home, result)}
            ${resultButton(0, "Empate", result)}
            ${resultButton(2, match.away, result)}
          </div>
        </div>
      </article>
    `;
  }

  function resultButton(value, label, activeValue) {
    const active = Number(value) === Number(activeValue) ? " active" : "";
    return `<button class="result-btn${active}" type="button" data-result="${value}" title="${escapeAttr(label)}">${escapeHtml(label)}</button>`;
  }

  function handleScoreInput(event) {
    if (!event.target.classList.contains("score-input")) return;
    const card = event.target.closest(".prode-card");
    const values = readScoreValues(card);
    if (values.home !== values.away) {
      setCardResult(card, inferResult(values.home, values.away));
    }
    updateCardPreview(card);
  }

  function handleResultClick(event) {
    const button = event.target.closest(".result-btn");
    if (!button) return;
    const card = button.closest(".prode-card");
    setCardResult(card, Number(button.dataset.result));
    updateCardPreview(card);
  }

  function setCardResult(card, result) {
    card.querySelectorAll(".result-btn").forEach(btn => {
      btn.classList.toggle("active", Number(btn.dataset.result) === Number(result));
    });
  }

  function updateCardPreview(card) {
    const values = readCardPrediction(card);
    const label = card.querySelector(".ticket-editor strong");
    label.textContent = `${values.home}-${values.away} ${resultLabel(values.result)}`;
  }

  function readScoreValues(card) {
    return {
      home: clampScore(card.querySelector('[data-field="home"]').value),
      away: clampScore(card.querySelector('[data-field="away"]').value)
    };
  }

  function readCardPrediction(card) {
    const { home, away } = readScoreValues(card);
    const active = card.querySelector(".result-btn.active");
    const result = active ? Number(active.dataset.result) : inferResult(home, away);
    return { home, away, result };
  }

  async function savePredictions() {
    if (!currentUser) return;
    const predictions = {};
    document.querySelectorAll(".prode-card").forEach(card => {
      const matchId = card.dataset.matchId;
      const values = readCardPrediction(card);
      predictions[matchId] = [values.home, values.away, values.result];
    });

    if (!Object.keys(predictions).length) {
      setSaveStatus("No hay partidos visibles para guardar.");
      return;
    }

    setSaving(true);
    setSaveStatus("Guardando...");

    try {
      const latestRes = await fetch(BASE_URL, {
        cache: "no-store",
        headers: { "X-Master-Key": API_KEY }
      });
      if (!latestRes.ok) throw new Error(`HTTP ${latestRes.status}`);

      const latestPayload = await latestRes.json();
      const latest = latestPayload.record || {};

      Object.entries(predictions).forEach(([matchId, ticket]) => {
        if (!latest[matchId]) latest[matchId] = { tickets: {}, metrics: {} };
        if (!latest[matchId].tickets) latest[matchId].tickets = {};
        latest[matchId].tickets[currentUser] = ticket;
      });

      const updateRes = await fetch(BASE_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": API_KEY
        },
        body: JSON.stringify(latest)
      });
      if (!updateRes.ok) throw new Error(`HTTP ${updateRes.status}`);

      prode = latest;
      render();
      setSaveStatus("Pronosticos guardados.");
      await loadResults();
      renderResults();
    } catch (error) {
      console.error(error);
      setSaveStatus("Error al guardar. Proba de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  function getMatches() {
    return Object.entries(prode)
      .filter(([, value]) => value && typeof value === "object" && value.tickets)
      .map(([id, value]) => {
        const metrics = value.metrics || {};
        return {
          id,
          tickets: value.tickets || {},
          home: metrics.match_home || "Local TBD",
          away: metrics.match_away || "Visitante TBD",
          group: metrics.match_group || "",
          stage: metrics.match_stage || "",
          dateLabel: metrics.match_date || "",
          timeLabel: metrics.match_time || ""
        };
      })
      .sort((a, b) => `${a.dateLabel} ${a.timeLabel} ${a.id}`.localeCompare(`${b.dateLabel} ${b.timeLabel} ${b.id}`));
  }

  function renderResults() {
    if (!els.resultsTable || !els.resultsEmpty) return;

    const rows = [...results].sort((a, b) => numberValue(b.puntos) - numberValue(a.puntos));
    els.resultsTable.innerHTML = "";
    els.resultsEmpty.hidden = rows.length > 0;

    rows.forEach((row, index) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${escapeHtml(row[0])}</td>
        <td class="mono">${numberValue(row[1])}</td>
        <td class="mono">${numberValue(row[2])}</td>
        <td class="mono">${numberValue(row[3])}</td>
        <td class="mono">${numberValue(row[4])}</td>
        <td class="mono">${formatPct(row[5])}</td>
        <td class="mono">${formatPct(row[6])}</td>
      `;

      els.resultsTable.appendChild(tr);
    });
  }

  function normalizeTicket(ticket) {
    if (!Array.isArray(ticket)) return [0, 0, 0];
    return [
      clampScore(ticket[0]),
      clampScore(ticket[1]),
      [0, 1, 2].includes(Number(ticket[2])) ? Number(ticket[2]) : 0
    ];
  }

  function inferResult(home, away) {
    if (home > away) return 1;
    if (away > home) return 2;
    return 0;
  }

  function resultLabel(result) {
    if (Number(result) === 1) return "L";
    if (Number(result) === 2) return "V";
    return "E";
  }

  function clampScore(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return 0;
    return Math.min(30, Math.floor(number));
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function setSaveStatus(message) {
    els.saveStatus.textContent = message;
  }

  function setSaving(isSaving) {
    els.saveBtn.disabled = isSaving;
    els.saveBtn.textContent = isSaving ? "Guardando..." : "Guardar pronosticos";
  }

  function capitalize(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
  }

  function normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function numberValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function formatPct(value) {
    if (value === "" || value === null || value === undefined) return "0%";
    if (typeof value === "string" && value.includes("%")) return escapeHtml(value);
    const number = Number(value);
    if (!Number.isFinite(number)) return "0%";
    const pct = number <= 1 ? number * 100 : number;
    return `${pct.toFixed(0)}%`;
  }
})();
