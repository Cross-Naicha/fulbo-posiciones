/* =========================================================
   1. LOAD TEXTS AND ANNOUNCEMENTS
   ========================================================= */

/**
 * Fetches all static texts (titles, subtitles, ticker, etc.)
 * from textos.json and fills them into the HTML.
 * Also handles announcements that appear once per session.
 */
let ANNOUNCEMENTS = [];

fetch('textos.json')
  .then(r => r.json())
  .then(data => {
    // Fill static text content
    document.getElementById('auspiciante').textContent = data.auspiciante;
    document.getElementById('titulo').textContent = data.titulo;
    document.getElementById('subtitulo').textContent = data.subtitulo;
    document.getElementById('fechas_1').textContent = data.fechas_1;
    document.getElementById('fechas_2').textContent = data.fechas_2;
    document.getElementById('frase_chiqui').textContent = data.frase_chiqui;
    document.getElementById('novedades').textContent = data.novedades;
    document.getElementById('riesgo').textContent = data.riesgo;

    // Set ticker text (rotating banner)
    const a = document.getElementById('tickerA');
    const b = document.getElementById('tickerB');
    if (a && b) {
      a.textContent = data.ticker;
      b.textContent = data.ticker;
    }

    // Handle announcements (only show once per session)
    ANNOUNCEMENTS = data.anuncios || [];
    if (ANNOUNCEMENTS.length > 0 && !sessionStorage.getItem("announcements_shown")) {
      startAnnouncements();
      sessionStorage.setItem("announcements_shown", "true");
    }
  })
  .catch(err => console.error("Error loading texts:", err));