/* =========================================================
   LIGA DE FULBO - MOTOR DE NOTICIAS (STANDALONE)
   ========================================================= */

(function() {
    let ALL_NEWS = [];

    // --- 1. CARGA INICIAL ---
    async function initNewsPage() {
        const grid = document.getElementById('archiveGrid');
        const status = document.getElementById('archiveStatus');
        const featured = document.getElementById('noticiaDestacada');

        try {
            // Fetch con cache busting para evitar noticias viejas
            const res = await fetch(`data/noticias_oposicion.json?v=${Date.now()}`);
            if (!res.ok) throw new Error("Archivo no encontrado");
            
            ALL_NEWS = await res.json();

            if (ALL_NEWS.length > 0) {
                // La primera noticia del JSON es siempre la "Destacada" (la más nueva)
                renderFeatured(ALL_NEWS[0]);
                // El resto (o todas) van al archivo
                renderArchive(ALL_NEWS);
            }
            
            if (status) status.style.display = 'none';
        } catch (e) {
            console.error(e);
            if (status) status.textContent = "Error al conectar con el archivo de noticias.";
        }
    }

    // --- 2. RENDERIZADO DE NOTICIA SEMANAL (DISEÑO COPA) ---
    function renderFeatured(n) {
        const container = document.getElementById('noticiaDestacada');
        if (!container) return;

        container.innerHTML = `
            <article class="streak blue" style="border-left: 8px solid var(--accent); cursor:pointer; padding:20px;" onclick="openNews('${n.id}')">
              <div class="streak-top">
                <span class="badge blue">REPORTE SEMANAL</span>
                <span class="badge">${n.fecha}</span>
              </div>
              
              <div class="streak-main" style="display:flex; justify-content:space-between; align-items:center; margin: 20px 0; gap: 15px;">
                         
                 <div style="background: var(--line); padding: 12px 18px; border-radius: 10px; min-width: 95px; text-align: center; box-shadow: inset 0 0 15px rgba(0,0,0,0.5);">
                    <div class="mono" style="font-size: 1.8rem; font-weight: 900; color: #fff;">${n.marcador}</div>
                 </div>
                 
                 <div style="flex:1; text-align:right; font-size:0.7rem; color:var(--muted); text-transform:uppercase;">Click para leer →</div>
              </div>

              <h2 style="font-size:1.3rem; margin-bottom:10px; line-height:1.2; color:var(--ink);">${n.titulo}</h2>
              <p style="font-size:0.9rem; color:var(--muted); line-height:1.5;">${n.resumen}</p>
            </article>
        `;
    }

    // --- 3. RENDERIZADO DEL ARCHIVO (MINI TARJETAS) ---
    function renderArchive(list) {
        const grid = document.getElementById('archiveGrid');
        if (!grid) return;

        grid.innerHTML = list.map(n => `
            <article class="streak news-mini-card" 
                     onclick="openNews('${n.id}')" 
                     data-players="${n.jugadores.join(',').toLowerCase()}"
                     style="margin-bottom:10px; border-left: 4px solid var(--line); padding:15px; cursor:pointer;">
                <div style="font-weight:700; color:var(--ink); font-size:1rem; margin-bottom:5px;">${n.titulo}</div>
                <div style="font-size:0.75rem; color:var(--muted);">
                    ${n.fecha} • <span style="color:var(--accent); font-weight:700;">${n.marcador}</span>
                </div>
            </article>
        `).join('');
    }

    // --- 4. MOTOR DE BÚSQUEDA (FILTRO REAL-TIME) ---
    const searchInput = document.getElementById('newsSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.news-mini-card');

            cards.forEach(card => {
                const title = card.innerText.toLowerCase();
                const players = card.getAttribute('data-players');
                
                // Si el término está en el título o en la lista oculta de jugadores
                if (title.includes(term) || players.includes(term)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // --- 5. LECTOR DE NOTICIAS (MODAL / OVERLAY) ---
    window.openNews = function(id) {
        const news = ALL_NEWS.find(n => n.id === id);
        if (!news) return;

        const overlay = document.getElementById('newsOverlay');
        const body = document.getElementById('newsFullBody');

        body.innerHTML = `
            <h2 style="color:var(--accent); margin-bottom:15px; line-height:1.2; font-size:1.5rem;">${news.titulo}</h2>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--muted); margin-bottom:20px; border-bottom:1px solid var(--line); padding-bottom:10px;">
                <span>${news.fecha}</span>
                <span class="mono">Resultado: ${news.marcador}</span>
            </div>
            <div style="line-height:1.8; color:var(--ink); font-size:1.05rem; white-space: pre-line; margin-bottom:25px;">
                ${news.cuerpo}
            </div>
            <div style="background:var(--line); padding:15px; border-radius:8px; font-size:0.75rem; color:var(--muted);">
                <strong>Mencionados:</strong> ${news.jugadores.join(', ')}
            </div>
        `;
        
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Bloquea scroll
    };

    const closeBtn = document.getElementById('closeNews');
    if (closeBtn) {
        closeBtn.onclick = () => {
            document.getElementById('newsOverlay').style.display = 'none';
            document.body.style.overflow = 'auto';
        };
    }

    // Cerrar overlay si toca fuera de la card
    const overlay = document.getElementById('newsOverlay');
    if (overlay) {
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        };
    }

    // Inicializar al cargar
    document.addEventListener('DOMContentLoaded', initNewsPage);
})();