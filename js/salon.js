// =========================================================
// SALÓN DE LA FAMA - LÓGICA PRINCIPAL
// =========================================================

// ---- 1. Datos (JSON de ejemplo, después lo reemplazás por el tuyo) ----

const SALON_DE_LA_FAMA_DATA = {
  salon_de_la_fama: [
    {
      year: 2025,
      expanded: false,
      tarjetas: [
        {
          titulo: "MARIO | Liga de los Fundadores 2025",
          competencia: "Especial",
          prioridad: 1
        },
        {
          titulo: "LOMBA | Liga de Transición 2025",
          competencia: "Especial",
          prioridad: 3
        },
        {
          titulo: "LOMBA | Liga de Primavera 2025",
          competencia: "Liga",
          prioridad: 2
        }
      ]
    },
    {
      year: 2026,
      expanded: true,
      tarjetas: [
        {
          titulo: "MARIO | Liga de Verano 2026",
          competencia: "Liga",
          prioridad: 2
        },
        {
          titulo: "CHAGAY | Liga de Otoño 2026",
          competencia: "Liga",
          prioridad: 2
        },
        {
          titulo: "??? | Liga de Invierno 2026",
          competencia: "Liga",
          prioridad: 2
        },
        {
          titulo: "??? | Liga de Primavera 2026",
          competencia: "Liga",
          prioridad: 2
        },
        {
          titulo: "BAG | Copa Apertura 2026",
          competencia: "Copa",
          prioridad: 1
        },
        {
          titulo: "??? | Copa Clausura 2026",
          competencia: "Copa",
          prioridad: 1
        },
        {
          titulo: "MARIO | SuperCopa Estival 2026",
          competencia: "SuperCopa",
          prioridad: 3
        },
        {
          titulo: "??? | SuperCopa Invernal 2026",
          competencia: "SuperCopa",
          prioridad: 3
        },
        {
          titulo: "Mario, Bag, Cesar, Marcelo, Naicha | Copa Natalicio 2026",
          competencia: "Escritorio",
          prioridad: 1
        }
      ]
    }
  ]
};

// ---- 2. Mapa de colores por competencia (JS aplica el color) ----

const COMPETENCIA_COLORS = {
  Copa: "#f5b400",
  Liga: "#4caf50",
  SuperCopa: "#ff7043",
  Especial: "#b1c2c1ff"
};

// ---- 3. Estado de UI ----

let activeCompetenciaFilter = "todas"; // "todas" | nombre competencia
let activeYear = null; // año seleccionado en timeline (para marcarlo)

// ---- 4. Utilidades ----

function getUniqueCompetencias(data) {
  const set = new Set();
  data.salon_de_la_fama.forEach((yearBlock) => {
    (yearBlock.tarjetas || []).forEach((card) => {
      if (card.competencia) {
        set.add(card.competencia);
      }
    });
  });
  return Array.from(set).sort();
}

function sortYearsDesc(data) {
  return [...data.salon_de_la_fama].sort((a, b) => b.year - a.year);
}

function smoothScrollTo(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const offset = window.scrollY || window.pageYOffset;
  const targetY = rect.top + offset - 80; // un poco arriba del bloque
  window.scrollTo({ top: targetY, behavior: "smooth" });
}

// ---- 5. Render: Línea de tiempo ----

function renderTimeline(years) {
  const timelineContainer = document.querySelector(".hof-timeline");
  if (!timelineContainer) return;

  timelineContainer.innerHTML = "";

  years.forEach((yearBlock, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hof-timeline-btn";
    btn.textContent = yearBlock.year;

    // Año activo inicial = el primero (que ya viene ordenado de mayor a menor)
    if (index === 0) {
      activeYear = yearBlock.year;
      btn.classList.add("hof-timeline-btn--active");
    }

    btn.dataset.year = yearBlock.year;

    btn.addEventListener("click", () => {
      activeYear = yearBlock.year;
      updateTimelineActiveState();
      const section = document.querySelector(
        `.hof-year[data-year-section="${yearBlock.year}"]`
      );
      smoothScrollTo(section);
    });

    timelineContainer.appendChild(btn);
  });
}

function updateTimelineActiveState() {
  const buttons = document.querySelectorAll(".hof-timeline-btn");
  buttons.forEach((btn) => {
    const year = Number(btn.dataset.year);
    if (year === activeYear) {
      btn.classList.add("hof-timeline-btn--active");
    } else {
      btn.classList.remove("hof-timeline-btn--active");
    }
  });
}

// ---- 6. Render: Filtros por competencia ----

function renderFilters(competencias) {
  const filtersContainer = document.querySelector(".hof-filters");
  if (!filtersContainer) return;

  filtersContainer.innerHTML = "";

  // Botón "Todas"
  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = "hof-filter-btn hof-filter-btn--active";
  allBtn.textContent = "Todas";
  allBtn.dataset.competencia = "todas";
  allBtn.addEventListener("click", () => {
    activeCompetenciaFilter = "todas";
    updateFiltersActiveState();
    applyCompetenciaFilter();
  });
  filtersContainer.appendChild(allBtn);

  // Resto de competencias
  competencias.forEach((comp) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hof-filter-btn";
    btn.textContent = comp;
    btn.dataset.competencia = comp;

    btn.addEventListener("click", () => {
      activeCompetenciaFilter = comp;
      updateFiltersActiveState();
      applyCompetenciaFilter();
    });

    filtersContainer.appendChild(btn);
  });
}

function updateFiltersActiveState() {
  const buttons = document.querySelectorAll(".hof-filter-btn");
  buttons.forEach((btn) => {
    const comp = btn.dataset.competencia;
    if (comp === activeCompetenciaFilter) {
      btn.classList.add("hof-filter-btn--active");
    } else {
      btn.classList.remove("hof-filter-btn--active");
    }
  });
}

function applyCompetenciaFilter() {
  const cards = document.querySelectorAll(".hof-card");
  cards.forEach((card) => {
    const comp = card.dataset.competencia;
    if (
      activeCompetenciaFilter === "todas" ||
      activeCompetenciaFilter === comp
    ) {
      card.classList.remove("hof-card--hidden");
    } else {
      card.classList.add("hof-card--hidden");
    }
  });
}

// ---- 7. Render: Años + tarjetas ----

function renderYears(years) {
  const yearsContainer = document.getElementById("hof-years");
  if (!yearsContainer) return;

  yearsContainer.innerHTML = "";

  years.forEach((yearBlock) => {
    const yearSection = document.createElement("article");
    yearSection.className = "hof-year";
    yearSection.dataset.yearSection = yearBlock.year;

    if (yearBlock.expanded) {
      yearSection.classList.add("hof-year--expanded");
    }

    // HEADER DEL AÑO
    const header = document.createElement("header");
    header.className = "hof-year-header";
    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.setAttribute(
      "aria-expanded",
      yearBlock.expanded ? "true" : "false"
    );

    const headingWrapper = document.createElement("div");
    headingWrapper.className = "hof-year-heading";

    const title = document.createElement("div");
    title.className = "hof-year-label";
    title.textContent = yearBlock.year;

    const tagline = document.createElement("div");
    tagline.className = "hof-year-tagline";
    tagline.textContent = "Momentos destacados de la temporada";

    headingWrapper.appendChild(title);
    headingWrapper.appendChild(tagline);

    const toggleWrapper = document.createElement("div");
    toggleWrapper.className = "hof-year-toggle";

    const toggleText = document.createElement("span");
    toggleText.textContent = yearBlock.expanded ? "Cerrar" : "Abrir";

    const toggleIcon = document.createElement("span");
    toggleIcon.className = "hof-year-toggle-icon";
    toggleIcon.innerHTML = "›";

    toggleWrapper.appendChild(toggleText);
    toggleWrapper.appendChild(toggleIcon);

    header.appendChild(headingWrapper);
    header.appendChild(toggleWrapper);

    // CUERPO (COLAPSABLE)
    const body = document.createElement("div");
    body.className = "hof-year-body";

    const bodyInner = document.createElement("div");
    bodyInner.className = "hof-year-body-inner";

    const grid = document.createElement("div");
    grid.className = "hof-year-grid";

    // Ordenamos tarjetas por prioridad (1 más alto)
    const tarjetasOrdenadas = [...(yearBlock.tarjetas || [])].sort(
      (a, b) => a.prioridad - b.prioridad
    );

    tarjetasOrdenadas.forEach((card) => {
      const cardEl = createCardElement(card);
      grid.appendChild(cardEl);
    });

    bodyInner.appendChild(grid);
    body.appendChild(bodyInner);

    // Insertamos todo
    yearSection.appendChild(header);
    yearSection.appendChild(body);
    yearsContainer.appendChild(yearSection);

    // Inicializamos altura del colapsable
    setInitialBodyHeight(yearSection, body, yearBlock.expanded);

    // Eventos de abrir/cerrar
    header.addEventListener("click", () =>
      toggleYearSection(yearSection, header, toggleText, body)
    );

    header.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" || evt.key === " ") {
        evt.preventDefault();
        toggleYearSection(yearSection, header, toggleText, body);
      }
    });
  });
}

// Crea una tarjeta individual
function createCardElement(card) {
  const cardEl = document.createElement("article");
  cardEl.className = "hof-card";
  cardEl.dataset.competencia = card.competencia || "";
  cardEl.dataset.prioridad = card.prioridad ?? 3;

  // Clase por prioridad para el grid
  if (card.prioridad === 1) {
    cardEl.classList.add("hof-card--priority-1");
  }

  // Color por competencia
  const comp = card.competencia;
  const color = COMPETENCIA_COLORS[comp] || "var(--accent)";
  cardEl.style.setProperty("--hof-accent", color);

  // Título
  const titleEl = document.createElement("h3");
  titleEl.className = "hof-card-title";
  titleEl.textContent = card.titulo;

  cardEl.appendChild(titleEl);

  // Meta (competencia + prioridad)
  const metaEl = document.createElement("div");
  metaEl.className = "hof-card-meta";

  const pill = document.createElement("span");
  pill.className = "hof-card-pill";
  pill.textContent = comp || "sin categoría";

  const priorityEl = document.createElement("span");
  priorityEl.className = "hof-card-priority";

  if (card.prioridad === 1) {
    priorityEl.textContent = "Épico";
  } else if (card.prioridad === 2) {
    priorityEl.textContent = "Destacado";
  } else {
    priorityEl.textContent = "Complementario";
  }

  metaEl.appendChild(pill);
  metaEl.appendChild(priorityEl);
  cardEl.appendChild(metaEl);

  return cardEl;
}

// ---- 8. Colapsables (años) ----

function setInitialBodyHeight(section, body, expanded) {
  if (expanded) {
    // Para que la transición funcione, seteamos max-height
    const scrollH = body.scrollHeight;
    body.style.maxHeight = `${scrollH}px`;
    section.classList.add("hof-year--expanded");
  } else {
    body.style.maxHeight = "0px";
    section.classList.remove("hof-year--expanded");
  }
}

function toggleYearSection(section, header, toggleTextEl, body) {
  const isExpanded = section.classList.contains("hof-year--expanded");
  const newExpanded = !isExpanded;

  section.classList.toggle("hof-year--expanded", newExpanded);
  header.setAttribute("aria-expanded", newExpanded ? "true" : "false");
  toggleTextEl.textContent = newExpanded ? "Cerrar" : "Abrir";

  if (newExpanded) {
    const scrollH = body.scrollHeight;
    body.style.maxHeight = `${scrollH}px`;
  } else {
    body.style.maxHeight = "0px";
  }
}

// ---- 9. Inicialización ----

document.addEventListener("DOMContentLoaded", () => {
  const yearsSorted = sortYearsDesc(SALON_DE_LA_FAMA_DATA);
  const competencias = getUniqueCompetencias(SALON_DE_LA_FAMA_DATA);

  renderTimeline(yearsSorted);
  renderFilters(competencias);
  renderYears(yearsSorted);

  // Aplicamos el filtro actual (por si en el futuro no es "todas")
  applyCompetenciaFilter();
});
