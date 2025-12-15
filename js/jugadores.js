/* =========================================================
   JUGADORES – Render de tarjetas (Look A)
   Archivo: JS/jugadores.js
   ========================================================= */

/** ===== CONFIG (dejado abierto para que elijas emojis) ===== */
const CONFIG = {
  DATA_URL: "data/jugadores.json", // cambiá ruta si tu JSON vive en otro lado
  STAR_EMOJI: "⭐",
  BLOCK_EMOJI: "🏆",  // <- CAMBIÁ ESTO cuando quieras (👑, 🥇, etc.)
  BLOCK_SIZE: 5,      // cada BLOCK_EMOJI representa 5 títulos
  SHOW_EMPTY_STARS: false, // si stars = 0, mostrar "" en vez de algo
};

/** ===== Helpers ===== */
function clampInt(n, min, max) {
  const x = Number.isFinite(n) ? Math.trunc(n) : 0;
  return Math.max(min, Math.min(max, x));
}

function buildStarsString(stars) {
  const s = clampInt(stars, 0, 10_000);

  if (s === 0 && !CONFIG.SHOW_EMPTY_STARS) return "";

  const blocks = Math.floor(s / CONFIG.BLOCK_SIZE);
  const rest = s % CONFIG.BLOCK_SIZE;

  return `${CONFIG.BLOCK_EMOJI.repeat(blocks)}${CONFIG.STAR_EMOJI.repeat(rest)}`;
}

function safeJoinPath(base, file) {
  if (!base) return file || "";
  if (!file) return "";
  const b = base.endsWith("/") ? base : base + "/";
  return file.startsWith("/") ? file.slice(1) : b + file;
}

/** ===== Render ===== */
function renderPlayers(data) {
  const grid = document.getElementById("playersGrid");
  const tpl = document.getElementById("playerCardTpl");

  if (!grid || !tpl) return;

  const meta = data?.meta || {};
  const basePath = meta.imageBasePath || "";

  const players = Array.isArray(data?.players) ? data.players : [];

  // Limpia grid
  grid.innerHTML = "";

  // Filtra + ordena
  const visible = players
    .filter(p => p && p.active !== false)
    .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

  if (visible.length === 0) {
    grid.innerHTML = `<div style="opacity:.8; padding: 0.5rem;">No hay jugadores para mostrar.</div>`;
    return;
  }

  for (const p of visible) {
    const node = tpl.content.cloneNode(true);

    const card = node.querySelector(".player-card");
    const bg = node.querySelector(".player-bg");
    const starsEl = node.querySelector(".player-stars");
    const nameEl = node.querySelector(".player-name");

    const text = (p.text ?? "").toString().trim();
    const stars = clampInt(Number(p.stars), 0, 10_000);

    // Texto
    if (nameEl) nameEl.textContent = text || "Jugador";

    // Fondo
    const photo = (p.photo ?? "").toString().trim();
    if (bg && photo) {
      const url = safeJoinPath(basePath, photo);
      bg.style.backgroundImage = `url("${url}")`;
    } else if (bg) {
      bg.style.backgroundImage = "none";
      bg.style.background = "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
    }

    // Estrellas (bloques de 5 + resto)
    const starsStr = buildStarsString(stars);
    if (starsEl) {
      starsEl.textContent = starsStr;
      starsEl.style.display = starsStr ? "inline-flex" : "none";
      starsEl.setAttribute("aria-label", `${stars} títulos`);
      starsEl.title = `${stars} títulos`;
    }

    // Accesibilidad / debug mínimo
    if (card) {
      card.dataset.playerId = (p.id ?? "").toString();
    }

    grid.appendChild(node);
  }
}

/** ===== Init ===== */
async function initPlayersPage() {
  try {
    const res = await fetch(CONFIG.DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${CONFIG.DATA_URL}`);

    const data = await res.json();
    renderPlayers(data);
  } catch (err) {
    console.error("[Jugadores] Error:", err);

    const grid = document.getElementById("playersGrid");
    if (grid) {
      grid.innerHTML = `<div style="opacity:.85; padding: 0.5rem;">
        Error cargando jugadores. Revisá consola y la ruta del JSON.
      </div>`;
    }
  }
}

// Tu script está con "defer" en el HTML, así que DOM ya existe.
initPlayersPage();
