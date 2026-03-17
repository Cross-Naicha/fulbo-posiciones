// TIMER
let intervalo = null;

function formatearCountdown(ms) {
  const totalSec = Math.floor(ms / 1000);

  const horas = Math.floor(totalSec / 3600); // 🔥 horas totales (incluye días)
  const minutos = Math.floor((totalSec % 3600) / 60);
  const segundos = totalSec % 60;

  return `${String(horas).padStart(2, '0')} h ${String(minutos).padStart(2, '0')} m ${String(segundos).padStart(2, '0')} s`;
}

function iniciarCountdown() {
  const el = document.getElementById("timer");
  if (!el) return;

  const target = new Date("2026-03-18T20:00:00-03:00");

  if (intervalo) clearInterval(intervalo);

  intervalo = setInterval(() => {
    const ahora = new Date();
    const diff = target - ahora;

    if (diff <= 0) {
      el.textContent = "¡Es hoy!";
      clearInterval(intervalo);
      return;
    }

    el.textContent = formatearCountdown(diff);
  }, 1000);
}

iniciarCountdown();