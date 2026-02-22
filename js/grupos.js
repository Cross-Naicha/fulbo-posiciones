(async function initGroupsPage() {
    const wrapper = document.getElementById('groupsWrapper');

    try {
        const [resP, resF] = await Promise.all([
            fetch(`data/paises_mundial.json?v=${Date.now()}`),
            fetch(`data/fixture_mundial.json?v=${Date.now()}`)
        ]);

        const paises = await resP.json();
        const fixture = await resF.json();

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
        "Panama": "Panamá"
    };

        // 2. Inicializar objeto de posiciones
        const stats = {};

        // Crear base de datos para cada país que está en el JSON
        paises.forEach(p => {
            stats[p.pais] = { 
                nombre: p.pais, jugador: p.jugador, codigo: p.codigo, 
                pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, dg:0, pts:0, grupo: "TBD" 
            };
        });

        // 3. Procesar resultados del fixture
        fixture.forEach(m => {
            const hNameAPI = m.homeTeam?.name;
            const aNameAPI = m.awayTeam?.name;
            if (!hNameAPI || !aNameAPI) return;

            const hName = traducciones[hNameAPI] || hNameAPI;
            const aName = traducciones[aNameAPI] || aNameAPI;

            // Asignar grupo si no lo tiene
            if (stats[hName]) stats[hName].grupo = m.group || "Eliminatorias";
            if (stats[aName]) stats[aName].grupo = m.group || "Eliminatorias";

            // Si el partido ya se jugó (tiene goles)
            if (m.score?.fullTime?.home !== null && stats[hName] && stats[aName]) {
                const gh = m.score.fullTime.home;
                const ga = m.score.fullTime.away;

                stats[hName].pj++; stats[aName].pj++;
                stats[hName].gf += gh; stats[hName].gc += ga;
                stats[aName].gf += ga; stats[aName].gc += gh;

                if (gh > ga) { stats[hName].pts += 3; stats[hName].pg++; stats[aName].pp++; }
                else if (gh < ga) { stats[aName].pts += 3; stats[aName].pg++; stats[hName].pp++; }
                else { stats[hName].pts += 1; stats[aName].pts += 1; stats[hName].pe++; stats[aName].pe++; }
                
                stats[hName].dg = stats[hName].gf - stats[hName].gc;
                stats[aName].dg = stats[aName].gf - stats[aName].gc;
            }
        });

        // 4. Agrupar por Grupo y Renderizar
        const gruposFinales = {};
        Object.values(stats).forEach(s => {
            if (s.grupo === "TBD" || s.grupo === "Eliminatorias") return;
            if (!gruposFinales[s.grupo]) gruposFinales[s.grupo] = [];
            gruposFinales[s.grupo].push(s);
        });

        wrapper.innerHTML = "";
        
        // Ordenar los grupos alfabéticamente
        Object.keys(gruposFinales).sort().forEach(gKey => {
            const teams = gruposFinales[gKey].sort((a,b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
            
            const groupDiv = document.createElement('div');
            groupDiv.className = 'group-container';
            
            let tableHtml = `
                <div class="group-title"><span>${gKey.replace('_', ' ')}</span></div>
                <table class="group-table">
                    <thead>
                        <tr><th class="txt-left">Jugador / Equipo</th><th>PJ</th><th>DG</th><th class="pts-bold">PTS</th></tr>
                    </thead>
                    <tbody>`;

            teams.forEach((t, index) => {
                const qClass = index < 2 ? 'row-q' : ''; // Resalta los 2 primeros
                tableHtml += `
                    <tr class="${qClass}">
                        <td class="txt-left">
                            <div class="team-cell">
                                <img src="https://flagcdn.com/w40/${t.codigo}.png">
                                <div>
                                    <b>${t.jugador}</b><br>
                                    <span>${t.nombre}</span>
                                </div>
                            </div>
                        </td>
                        <td>${t.pj}</td>
                        <td>${t.dg > 0 ? '+'+t.dg : t.dg}</td>
                        <td class="pts-bold">${t.pts}</td>
                    </tr>`;
            });

            groupDiv.innerHTML = tableHtml + `</tbody></table>`;
            wrapper.appendChild(groupDiv);
        });

    } catch (e) {
        console.error(e);
        wrapper.innerHTML = "Error al calcular posiciones.";
    }
})();