(function initMundialSystem() {
    let datosPaises = [];

    // 1. TABLA DE POSICIONES
    function renderTablaMundial(rows) {
        const table = document.getElementById('clasifTable');
        if (!table || !rows.length) return;
        let html = `<thead><tr><th>Pos</th><th>Jugador</th><th>PTS</th><th>PJ</th><th>DG</th></tr></thead><tbody>`;
        rows.forEach(r => {
            let cl = r.S == 1 ? 'clasif-ok' : (r.S == 2 ? 'clasif-risk' : '');
            html += `<tr class="${cl}"><td>${r.N}</td><td style="text-align:left">${r.JUG}</td><td>${r.PTS}</td><td>${r.J}</td><td>${r.GOL}</td></tr>`;
        });
        table.innerHTML = html + `</tbody>`;
        document.getElementById('clasifTableWrap').style.display = 'block';
    }

    // 2. CARRUSEL DE PARTIDOS (MATCH CENTER)
    function renderMatchCenter(fixture, paises) {
        const container = document.getElementById('matchCenterContainer');
        if (!container) return;

        const getInfo = (name) => {
            const p = paises.find(x => x.pais.toLowerCase() === name.toLowerCase());
            return p ? { jug: p.jugador, cod: p.codigo } : { jug: "Sin Asignar", cod: "un" };
        };

        let html = `<div class="section-header"><h2>Partidos de Hoy</h2><span class="scroll-hint">DESLIZA ➔</span></div><div class="match-carousel">`;

        fixture.slice(0, 15).forEach(m => {
            const home = getInfo(m.homeTeam.name);
            const away = getInfo(m.awayTeam.name);
            const fecha = new Date(m.utcDate).toLocaleDateString([], {day:'2-digit', month:'2-digit'});

            html += `
                <div class="match-card">
                    <div class="match-meta">${m.group || m.stage} | ${fecha}</div>
                    <div class="duel-row">
                        <div class="duel-side">
                            <span class="player-name ${home.jug === 'Sin Asignar' ? 'unassigned' : ''}">${home.jug}</span>
                            <div class="country-tag"><img src="https://flagcdn.com/w40/${home.cod}.png" alt=""><span>${m.homeTeam.tla || 'TBD'}</span></div>
                        </div>
                        <div class="vs-circle">VS</div>
                        <div class="duel-side">
                            <span class="player-name ${away.jug === 'Sin Asignar' ? 'unassigned' : ''}">${away.jug}</span>
                            <div class="country-tag"><span>${m.awayTeam.tla || 'TBD'}</span><img src="https://flagcdn.com/w40/${away.cod}.png" alt=""></div>
                        </div>
                    </div>
                </div>`;
        });
        container.innerHTML = html + `</div>`;
    }

    // 3. LISTA DE EQUIPOS (BOMBOS)
    function renderPaises(lista) {
        const container = document.getElementById('paisesContainer');
        if (!container) return;
        container.innerHTML = '';
        lista.forEach(p => {
            const card = document.createElement('div');
            card.className = `country-item bombo-border-${p.bombo}`;
            card.innerHTML = `
                <div class="country-flex">
                    <img src="https://flagcdn.com/w160/${p.codigo}.png" class="flag-mini">
                    <div class="country-info">
                        <div class="main-row"><span class="c-name">${p.pais}</span><span class="c-abr">${p.abr}</span></div>
                        <div class="sub-row"><span class="c-bombo">BOMBO ${p.bombo}</span><span class="c-player">${p.jugador}</span></div>
                    </div>
                </div>`;
            container.appendChild(card);
        });
    }

    async function cargarTodo() {
        try {
            const [resC, resP, resF] = await Promise.all([
                fetch(`data/clasificacion_mundial.json?v=${Date.now()}`),
                fetch(`data/paises_mundial.json?v=${Date.now()}`),
                fetch(`data/fixture_mundial.json?v=${Date.now()}`)
            ]);
            const clasif = await resC.json();
            const paises = await resP.json();
            const fixture = await resF.json();
            
            datosPaises = paises;
            renderTablaMundial(clasif);
            renderMatchCenter(fixture, paises);
            renderPaises(paises);

            document.getElementById('filterSearch')?.addEventListener('input', (e) => {
                const txt = e.target.value.toLowerCase();
                renderPaises(datosPaises.filter(p => p.pais.toLowerCase().includes(txt) || p.jugador.toLowerCase().includes(txt)));
            });
        } catch (e) { console.error("Error crítico:", e); }
    }
    document.addEventListener('DOMContentLoaded', cargarTodo);
})();