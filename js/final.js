(function initFinalCountdown(){
  const wrap = document.getElementById("countdown");
  if(!wrap) return;

  const kickoffStr = wrap.dataset.kickoff; // e.g. 2025-12-20T21:30:00-03:00
  const kickoff = new Date(kickoffStr);
  const meta = document.getElementById("finalMeta");

  const elD = document.getElementById("cdDays");
  const elH = document.getElementById("cdHours");
  const elM = document.getElementById("cdMins");
  const elS = document.getElementById("cdSecs");

  function pad(n){ return String(n).padStart(2, "0"); }

  function tick(){
    const now = new Date();
    let diff = kickoff - now;

    if (isNaN(kickoff.getTime())) {
      if(meta) meta.textContent = "⚠️ Fecha/hora inválida en data-kickoff.";
      return;
    }

    if(diff <= 0){
      elD.textContent = "00";
      elH.textContent = "00";
      elM.textContent = "00";
      elS.textContent = "00";
      if(meta) meta.textContent = "🟢 ¡Es hoy!";
      return;
    }

    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    elD.textContent = pad(days);
    elH.textContent = pad(hours);
    elM.textContent = pad(mins);
    elS.textContent = pad(secs);

    if(meta){
      // Texto “humano” con fecha local del navegador
      meta.textContent = `Lomba vs. Chagay: ${kickoff.toLocaleString("es-AR")}`;
    }
  }

  tick();
  setInterval(tick, 1000);
})();
