(function initCupSystem() {
    let rankingByPos = {};
    let globalMatches = []; 

    // --- HELPERS ---
    function isCode(s) { return /^(QF|SF|Q|S)\d+$/i.test(String(s).trim()); }

    function getMatchById(id) {
        return globalMatches.find(m => m.id_partido === id);
    }

    function resolveName(s) {
        const raw = String(s || '').trim();
        if (!raw) return 'A definir';
        
        if (isCode(raw)) {
            const matchPrevio = getMatchById(raw);
            if (matchPrevio) {
                const ganador = getWinner(matchPrevio);
                if (ganador) return resolveName(ganador); 
            }
            
            const etiquetas = { 'QF': 'QF', 'SF': 'SF', 'Q': 'Clasif. ', 'S': 'Clasif. ' };
            const prefix = raw.match(/^[A-Z]+/)[0];
            const num = raw.match(/\d+$/)[0];

            if ((prefix === 'Q' || prefix === 'S') && rankingByPos[num]) {
                return `${rankingByPos[num]}`;
            }
            return `${etiquetas[prefix] || 'Ganador'} ${num}`;
        }
        return raw;
    }

    function getResult(p) {
        const idaJ1 = p.ida && p.ida.goles_j1 !== null ? p.ida.goles_j1 : 0;
        const idaJ2 = p.ida && p.ida.goles_j2 !== null ? p.ida.goles_j2 : 0;
        const vueJ1 = p.vuelta && p.vuelta.goles_j1 !== null ? p.vuelta.goles_j1 : 0;
        const vueJ2 = p.vuelta && p.vuelta.goles_j2 !== null ? p.vuelta.goles_j2 : 0;
        
        const playedIda = (p.ida && p.ida.goles_j1 !== null);
        const playedVuelta = (p.vuelta && p.vuelta.goles_j1 !== null);
        
        return { 
            t1: idaJ1 + vueJ1, 
            t2: idaJ2 + vueJ2, 
            played: playedIda, 
            finished: playedIda && playedVuelta 
        };
    }

    function getWinner(p) {
        const r = getResult(p);
        if (!r.finished) return null; 
        if (r.t1 > r.t2) return p.jugador1;
        if (r.t2 > r.t1) return p.jugador2;
        return p.ventaja || null; 
    }

    function createMatchCard(p, isFinal = false) {
        const res = getResult(p);
        const win = getWinner(p);
        const card = document.createElement('article');
        card.className = `streak ${win ? 'blue' : 'gray'} ${isFinal ? 'is-final' : ''}`;
        
        // Lógica de fechas mejorada (Igual a la del index)
        const fIda = p.fechas?.ida || 'TBD';
        const fVue = p.fechas?.vuelta || 'TBD';
        let fechaDisplay = 'TBD';
        
        if (fIda !== 'TBD' && fVue !== 'TBD') {
            fechaDisplay = `Ida: ${fIda} | Vuelta: ${fVue}`;
        } else if (fIda !== 'TBD') {
            fechaDisplay = `Ida: ${fIda}`;
        } else if (fVue !== 'TBD') {
            fechaDisplay = `Vuelta: ${fVue}`;
        }

        card.innerHTML = `
            <div class="streak-top">
                <span class="badge ${win ? 'blue' : ''}">${p.id_partido || 'CUP'}</span>
                <span class="badge">${fechaDisplay}</span>
            </div>
            <div class="streak-main" style="display:flex; justify-content:space-between; align-items:center; margin: 10px 0;">
                <div class="streak-name mono" style="flex:1;">${resolveName(p.jugador1)}</div>
                <div class="streak-len" style="margin: 0 10px; min-width:60px; text-align:center; background:var(--line); border-radius:4px;">
                    ${res.played ? `${res.t1} - ${res.t2}` : 'vs'}
                </div>
                <div class="streak-name mono" style="flex:1; text-align:right;">${resolveName(p.jugador2)}</div>
            </div>
            <div class="streak-footer" style="display:flex; justify-content:space-between; font-size:11px; border-top:1px solid var(--line); padding-top:5px;">
                <span>Vantaggio: ${resolveName(p.ventaja)}</span>
                ${win ? `<strong style="color:var(--pos)">Pasa: ${resolveName(win)}</strong>` : 
                (res.played && !res.finished ? '<span style="color:var(--accent)">En definición...</span>' : '<span>In attesa</span>')}
            </div>
        `;
        return card;
    }

    function renderClasificacion(rows) {
        const table = document.getElementById('clasifTable');
        if (!table || !rows.length) return;
        let html = `<thead><tr><th>Pos</th><th>Jugador</th><th>PTS</th><th>PJ</th><th>DG</th></tr></thead><tbody>`;
        rows.forEach(r => {
            let cl = r.S == 1 ? 'clasif-ok' : (r.S == 2 ? 'clasif-risk' : '');
            html += `<tr class="${cl}"><td>${r.N}</td><td style="text-align:left">${r.JUG}</td><td>${r.PTS}</td><td>${r.J}</td><td>${r.GOL}</td></tr>`;
        });
        table.innerHTML = html + `</tbody>`;
        document.getElementById('clasifStatus').style.display = 'none';
        document.getElementById('clasifTableWrap').style.display = 'block';
    }

    async function loadAll() {
        try {
            const [cRes, clRes] = await Promise.all([
                fetch(`data/copas.json?v=${Date.now()}`),
                fetch(`data/clasificacion_copas.json?v=${Date.now()}`)
            ]);
            const copasJson = await cRes.json();
            const clasifData = await clRes.json();
            const copa = Array.isArray(copasJson) ? copasJson[0] : copasJson;

            clasifData.forEach(r => { rankingByPos[r.N] = r.JUG; });
            renderClasificacion(clasifData);

            const b = copa.bracket || {};
            globalMatches = [...(b.cuartos || []), ...(b.semifinales || []), ...(b.final || [])];

            const fill = (data, gridId, statusId, emptyId) => {
                const grid = document.getElementById(gridId);
                if (document.getElementById(statusId)) document.getElementById(statusId).style.display = 'none';
                if (data && data.length) {
                    grid.innerHTML = '';
                    data.forEach(p => grid.appendChild(createMatchCard(p, gridId === 'finalGrid')));
                    grid.style.display = 'grid';
                } else if (document.getElementById(emptyId)) {
                    document.getElementById(emptyId).style.display = 'block';
                }
            };

            fill(b.cuartos, 'cuartosGrid', 'cuartosStatus', 'cuartosEmpty');
            fill(b.semifinales, 'semisGrid', 'semisStatus', 'semisEmpty');
            fill(b.final, 'finalGrid', 'finalStatus', 'finalEmpty');

        } catch (e) { console.error("Error:", e); }
    }
    document.addEventListener('DOMContentLoaded', loadAll);
})();