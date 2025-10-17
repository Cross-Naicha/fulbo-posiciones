const els = {
    anio: document.getElementById('filtroAnio'),
    mes: document.getElementById('filtroMes'),
    comp: document.getElementById('filtroComp'),
    jug: document.getElementById('filtroJugador'),
    lista: document.getElementById('listaPartidos'),
    vacio: document.getElementById('sinResultados')
  };

  let PARTIDOS = [];

  function limpiarNombre(n) {
    return n.replace(/\s+/g,' ').replace(/,+$/,'').trim();
  }

  function initFiltros() {
    const años = [...new Set(PARTIDOS.map(p => p[0].slice(0,4)))];
    const comps = [...new Set(PARTIDOS.map(p => p[1]))];
    const jugadores = new Set();

    for (const p of PARTIDOS) {
      const [eqA, eqB] = p[3].split('VS.');
      const lista = (eqA + ',' + eqB).split(',').map(x => limpiarNombre(x));
      lista.forEach(n => { if (n) jugadores.add(n); });
    }

    años.forEach(a => els.anio.add(new Option(a,a)));
    comps.forEach(c => els.comp.add(new Option(c,c)));
    [...jugadores].sort((a,b)=>a.localeCompare(b))
      .forEach(j => els.jug.add(new Option(j,j)));

    const meses = [
      ["01","Ene"],["02","Feb"],["03","Mar"],["04","Abr"],["05","May"],["06","Jun"],
      ["07","Jul"],["08","Ago"],["09","Sep"],["10","Oct"],["11","Nov"],["12","Dic"]
    ];
    meses.forEach(([num,nom]) => els.mes.add(new Option(nom,num)));
  }

  function destacar(nombre, texto) {
    if (!nombre) return texto;
    const regex = new RegExp(`\\b(${nombre})\\b`, 'gi');
    return texto.replace(regex, `<span class="highlight">$1</span>`);
  }

  function renderLista() {
    const fa = els.anio.value;
    const fm = els.mes.value;
    const fc = els.comp.value;
    const fj = els.jug.value;

    els.lista.innerHTML = '';

    const filtrados = PARTIDOS.filter(p => {
      const [fecha, comp, nro, desc, res] = p;
      if (fa && !fecha.startsWith(fa)) return false;
      if (fm && fecha.slice(5,7) !== fm) return false;
      if (fc && comp !== fc) return false;
      if (fj && fj !== '' && !desc.toLowerCase().includes(fj.toLowerCase())) return false;
      return true;
    });

    if (filtrados.length === 0) {
      els.vacio.style.display = 'block';
      return;
    }
    els.vacio.style.display = 'none';

    filtrados.forEach(([fecha, comp, nro, desc, res]) => {
      const [eqA, eqB] = desc.split(' VS.');
      const eqA_html = destacar(fj, eqA.trim());
      const eqB_html = destacar(fj, eqB.trim());
      const div = document.createElement('div');
      div.className = 'match';
      div.innerHTML = `
        <div class="match-top">
          <span>${fecha} · ${comp}</span>
          <span>Partido ${nro}</span>
        </div>
        <div class="match-teams">
          <div><strong>${eqA_html}</strong></div>
          <div>VS.</div>
          <div><strong>${eqB_html}</strong></div>
        </div>
        <div class="match-result">Balance + ${res ?? '-'}</div>
      `;
      els.lista.append(div);
    });
  }

  ['anio','mes','comp','jug'].forEach(k =>
    els[k].addEventListener('change', renderLista)
  );

  // === CARGAR DESDE fechas.json ===
  fetch('data/fechas.json?v='+Date.now())
    .then(res => res.json())
    .then(data => {
      PARTIDOS = data;
      initFiltros();
      renderLista();
    })
    .catch(err => {
      console.error('Error cargando fechas.json:', err);
      els.vacio.textContent = 'Error al cargar los datos';
      els.vacio.style.display = 'block';
    });