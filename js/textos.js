/* =========================================================
   1. LOAD TEXTS AND ANNOUNCEMENTS (RESILIENT VERSION)
   ========================================================= */

let ANNOUNCEMENTS = [];

fetch('textos.json')
  .then(r => r.json())
  .then(data => {
    
    // Función de seguridad: solo escribe si el elemento existe en el HTML
    const safelyFill = (id, content) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = content || "";
      }
    };

    // Llenado de textos estáticos con protección ante faltantes
    safelyFill('auspiciante', data.auspiciante);
    safelyFill('titulo', data.titulo);
    safelyFill('subtitulo', data.subtitulo);
    safelyFill('fechas_1', data.fechas_1);
    safelyFill('fechas_2', data.fechas_2);
    safelyFill('fechas_3', data.fechas_3);
    safelyFill('frase_chiqui', data.frase_chiqui);
    safelyFill('novedades', data.novedades);
    safelyFill('riesgo', data.riesgo);

    // Ticker text (Rotating banner)
    const a = document.getElementById('tickerA');
    const b = document.getElementById('tickerB');
    if (a && b) {
      a.textContent = data.ticker || "";
      b.textContent = data.ticker || "";
    }

    // Handle announcements
    ANNOUNCEMENTS = data.anuncios || [];
    if (ANNOUNCEMENTS.length > 0 && !sessionStorage.getItem("announcements_shown")) {
      // Verificamos que la función startAnnouncements exista antes de llamarla
      if (typeof startAnnouncements === 'function') {
        startAnnouncements();
      }
      sessionStorage.setItem("announcements_shown", "true");
    }
  })
  .catch(err => console.error("Error loading texts:", err));