(async function initFixturePage() {
    const container = document.getElementById('fixtureContainer');
    const dateSelect = document.getElementById('dateSelect');
    const nameSearch = document.getElementById('nameSearch');

    let matchesRaw = [];
    let paisesData = [];

    // Diccionario para que la API (ingles/sin tildes) encuentre a tus jugadores
    const traducciones = {
        "Mexico": "México", 
        "South Korea": "Corea del Sur", 
        "USA": "Estados Unidos",
        "United States": "Estados Unidos", 
        "Spain": "España", 
        "Germany": "Alemania",
        "France": "Francia", 
        "Japan": "Japón", 
        "Morocco": "Marruecos",
        "Brazil": "Brasil", 
        "England": "Inglaterra", 
        "Belgium": "Bélgica",
        "Switzerland": "Suiza", 
        "Netherlands": "Países Bajos", 
        "Portugal": "Portugal",
        "Italy": "Italia", 
        "Canada": "Canadá", 
        "Uruguay": "Uruguay",
        "Haiti": "Haití",
        "Scotland": "Escocia",
        "South Africa": "Sudáfrica",
        "Ivory Coast": "Costa de Marfil",
        "Curaçao": "Curazao",
        "Netherlands": "Países Bajos",
        "Tunisia": "Túnez",
        "Belgium": "Bélgica",
        "Egypt": "Egipto",
        "Iran": "Irán",
        "New Zealand": "Nueva Zelanda",
        "Saudi Arabia": "Arabia Saudita",
        "Cape Verde Islands": "Cabo Verde",
        "Norway": "Noruega",
        "Algeria": "Argelia",
        "Jordan": "Jordania",
        "Uzbekistan": "Uzbekistán",
        "Croatia": "Croacia",
        "Panama": "Panamá",
        "Iraq": "Irak",
        "Turkey": "Turquía",
        "Ghana": "Ghana",
        "Sweden": "Suecia",
        "Bosnia-Herzegovina": "Bosnia",
        "Czechia": "Chequia",
        "Congo DR": "RD Congo"        
    };

    try {
        const [resP, resF] = await Promise.all([
            fetch(`data/paises_mundial.json?v=${Date.now()}`),
            fetch(`data/fixture_mundial.json?v=${Date.now()}`)
        ]);

        paisesData = await resP.json();
        matchesRaw = await resF.json();

        // 1. Llenar el combo de fechas con las fechas reales del fixture
        const fechasUnicas = [...new Set(matchesRaw.map(m => 
            new Date(m.utcDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
        ))];
        
        fechasUnicas.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f;
            opt.textContent = f;
            dateSelect.appendChild(opt);
        });

        // 2. Lógica de cruce de datos
        const buscarDueno = (nombreAPI) => {
            if (!nombreAPI) return { jug: "TBD", cod: "un", pais: "TBD" };
            const nombreBusqueda = traducciones[nombreAPI] || nombreAPI;
            const p = paisesData.find(x => x.pais.toLowerCase() === nombreBusqueda.toLowerCase());
            return p ? { jug: p.jugador, cod: p.codigo, pais: p.pais } 
                     : { jug: "Sin Asignar", cod: "un", pais: nombreBusqueda };
        };

        // 3. Función de dibujado con filtros
        function render() {
            const filterDate = dateSelect.value;
            const filterText = nameSearch.value.toLowerCase();
            
            container.innerHTML = '';
            const agrupados = {};

            const filtrados = matchesRaw.filter(m => {
                const home = buscarDueno(m.homeTeam?.name);
                const away = buscarDueno(m.awayTeam?.name);
                const fM = new Date(m.utcDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
                const grupo = (m.group || m.stage || "").toLowerCase().replace('_', ' ');

                const matchFecha = (filterDate === 'all' || fM === filterDate);
                const matchTexto = (
                    home.jug.toLowerCase().includes(filterText) || 
                    away.jug.toLowerCase().includes(filterText) ||
                    home.pais.toLowerCase().includes(filterText) ||
                    away.pais.toLowerCase().includes(filterText) ||
                    grupo.includes(filterText)
                );
                return matchFecha && matchTexto;
            });

            if (!filtrados.length) {
                container.innerHTML = '<div class="no-results">No se encontraron partidos con esos filtros.</div>';
                return;
            }

            // Agrupar por fecha para los títulos
            filtrados.forEach(m => {
                const fKey = new Date(m.utcDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
                if (!agrupados[fKey]) agrupados[fKey] = [];
                agrupados[fKey].push(m);
            });

            for (const fecha in agrupados) {
                const div = document.createElement('div');
                div.className = 'match-day-section';
                div.innerHTML = `<h3 class="day-title">${fecha}</h3>`;

                agrupados[fecha].forEach(m => {
                    const h = buscarDueno(m.homeTeam?.name);
                    const a = buscarDueno(m.awayTeam?.name);
                    const hora = new Date(m.utcDate).toLocaleTimeString('es-AR', { 
                        hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' 
                    });
                    const grp = m.group ? m.group.replace('_', ' ') : (m.stage ? m.stage.replace('_', ' ') : 'Mundial');

                    div.innerHTML += `
                        <div class="match-card-full">
                            <div class="game-header">${grp} | ${hora} hs</div>
                            <div class="vs-row">
                                <div class="team-box">
                                    <span class="player-highlight ${h.jug === 'Sin Asignar' ? 'unassigned-text' : ''}">${h.jug}</span>
                                    <div class="country-sub">
                                        <img src="https://flagcdn.com/w40/${h.cod}.png" onerror="this.src='https://flagcdn.com/w40/un.png'">
                                        <span>${m.homeTeam?.tla || 'TBD'}</span>
                                    </div>
                                </div>
                                <div class="score-box">${m.score.fullTime.home ?? '-'} : ${m.score.fullTime.away ?? '-'}</div>
                                <div class="team-box">
                                    <span class="player-highlight ${a.jug === 'Sin Asignar' ? 'unassigned-text' : ''}">${a.jug}</span>
                                    <div class="country-sub">
                                        <span>${m.awayTeam?.tla || 'TBD'}</span>
                                        <img src="https://flagcdn.com/w40/${a.cod}.png" onerror="this.src='https://flagcdn.com/w40/un.png'">
                                    </div>
                                </div>
                            </div>
                        </div>`;
                });
                container.appendChild(div);
            }
        }

        // Eventos
        dateSelect.addEventListener('change', render);
        nameSearch.addEventListener('input', render);

        render(); // Carga inicial

    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="color:red; text-align:center;">Error al cargar datos.</p>';
    }
})();