/* =========================================================
   LIGA DE FULBO – GENERADOR DE EQUIPOS (Versión móvil)
   ========================================================= */

const DATA = { jugadores: [], nombresEquipos: [], seleccionados: [], equipos: { A: [], B: [] } };
const els = {
  listaJugadores: q("#jugadores-lista"), contador: q("#contador"),
  faltantes: q("#faltantes"), btnAgregar: q("#btnAgregarJugador"),
  btnGenerar: q("#btnGenerarEquipos"), seccionSel: q("#seleccion-container"),
  seccionEq: q("#equipos-container"), colA: q("#colEquipoA"), colB: q("#colEquipoB"),
  nombreA: q("#nombreEquipoA"), nombreB: q("#nombreEquipoB"), balance: q("#balance"),
  btnWhats: q("#btnWhatsapp"), btnReiniciar: q("#btnReiniciar"),
  modal: q("#modal-overlay"), nuevoNombre: q("#nuevoNombre"),
  nivelBtns: qa(".nivel-btn"), btnGuardar: q("#btnGuardarNuevo"), btnCancelar: q("#btnCancelarNuevo"),
  modeBtns: qa(".mode-btn")
};
function q(s){return document.querySelector(s)}; function qa(s){return document.querySelectorAll(s)};

async function loadJSON(url){const r=await fetch(`${url}?v=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw Error();return r.json();}
function parseJugadores(raw){return raw.map(r=>({id:r[0],apodo:r[1],jugados:+r[2],efectividad:+r[3]}));}
function pickTwoNames(l){const L=[...l];const a=L.splice(Math.floor(Math.random()*L.length),1)[0];const b=L.splice(Math.floor(Math.random()*L.length),1)[0];return[a,b];}
function shuffle(a){return [...a].sort(()=>Math.random()-0.5);}

async function init(){
  const [jug,names]=await Promise.all([loadJSON('data/lista_jugadores.json'),loadJSON('data/lista_equipos.json')]);
  DATA.jugadores=parseJugadores(jug); DATA.nombresEquipos=names.map(n=>n[0]);
  renderLista();
}

function renderLista(){
  els.listaJugadores.innerHTML='';
  DATA.jugadores.forEach(j=>{
    const c=document.createElement('div');
    c.className='jugador-card';
    c.innerHTML=`<div class='jugador-nombre'>${j.apodo}</div><div class='jugador-eff'>${(j.efectividad*100).toFixed(0)}%</div>`;
    c.onclick=()=>toggleSel(j,c);
    els.listaJugadores.appendChild(c);
  });
  updateContador();
}

function toggleSel(j,c){
  const i=DATA.seleccionados.findIndex(p=>p.id===j.id);
  if(i>=0){DATA.seleccionados.splice(i,1);c.classList.remove('selected');}
  else if(DATA.seleccionados.length<10){DATA.seleccionados.push(j);c.classList.add('selected');}
  updateContador();
}

function updateContador(){
  els.contador.textContent=`${DATA.seleccionados.length} / 10 seleccionados`;
  els.btnGenerar.disabled=DATA.seleccionados.length!==10;
  els.faltantes.style.display=DATA.seleccionados.length<10?'block':'none';
}

/* === Agregar jugador === */
let nivel=0.5;
els.btnAgregar.onclick=()=>els.modal.style.display='flex';
els.btnCancelar.onclick=()=>cerrarModal();
els.nivelBtns.forEach(b=>b.onclick=()=>{nivel=parseFloat(b.dataset.eff);els.nivelBtns.forEach(x=>x.classList.remove('active'));b.classList.add('active');});
els.btnGuardar.onclick=()=>{
  const n=els.nuevoNombre.value.trim(); if(!n) return alert('Ingresá un nombre');
  DATA.seleccionados.push({id:'nuevo_'+Date.now(),apodo:n,jugados:0,efectividad:nivel});
  cerrarModal(); updateContador();
};
function cerrarModal(){els.modal.style.display='none'; els.nuevoNombre.value=''; els.nivelBtns.forEach(x=>x.classList.remove('active'));}

/* === Generar === */
els.modeBtns.forEach(b=>b.onclick=()=>{els.modeBtns.forEach(x=>x.classList.remove('active'));b.classList.add('active');els.btnGenerar.dataset.mode=b.dataset.mode;});
els.btnGenerar.onclick=()=>generar();
function generar(){
  const mode=els.btnGenerar.dataset.mode||'azar';
  const [nA,nB]=pickTwoNames(DATA.nombresEquipos); els.nombreA.textContent=nA; els.nombreB.textContent=nB;
  const p=[...DATA.seleccionados]; let A=[],B=[];
  if(mode==='azar'){const m=shuffle(p);m.forEach((x,i)=>(i%2?B:A).push(x));}
  else{const s=p.sort((a,b)=>b.efectividad-a.efectividad);let sa=0,sb=0;for(const x of s){if(sa<=sb){A.push(x);sa+=x.efectividad;}else{B.push(x);sb+=x.efectividad;}}}
  DATA.equipos={A,B}; mostrar();
}

/* === Mostrar equipos === */
function mostrar(){
  els.seccionSel.style.display='none'; els.seccionEq.style.display='block';
  renderCol(els.colA,DATA.equipos.A,'A'); renderCol(els.colB,DATA.equipos.B,'B');
  actualizarBalance();
}
function renderCol(col,arr,t){
  col.innerHTML=''; arr.forEach(p=>{
    const c=document.createElement('div');
    c.className=`player-card ${t.toLowerCase()}`;
    c.innerHTML=`<span>${p.apodo}</span><div><span class='player-eff'>${(p.efectividad*100).toFixed(0)}%</span> <button class='swap-btn' data-id='${p.id}'>⇄</button></div>`;
    col.appendChild(c);
  });
  col.querySelectorAll('.swap-btn').forEach(b=>b.onclick=()=>moverJugador(b.dataset.id));
}
function moverJugador(id){
  const enA=DATA.equipos.A.findIndex(p=>p.id==id);
  if(enA>=0){const [j]=DATA.equipos.A.splice(enA,1);DATA.equipos.B.push(j);}
  else{const i=DATA.equipos.B.findIndex(p=>p.id==id);if(i>=0){const [j]=DATA.equipos.B.splice(i,1);DATA.equipos.A.push(j);}}
  renderCol(els.colA,DATA.equipos.A,'A'); renderCol(els.colB,DATA.equipos.B,'B');
  actualizarBalance();
}
function actualizarBalance(){
  const sA=DATA.equipos.A.reduce((t,p)=>t+p.efectividad,0), sB=DATA.equipos.B.reduce((t,p)=>t+p.efectividad,0);
  els.balance.textContent=`⚫ ${sA.toFixed(2)} | ⚪ ${sB.toFixed(2)}  Δ ${(Math.abs(sA-sB)).toFixed(2)}`;
}

/* === Reiniciar === */
els.btnReiniciar.onclick=()=>{
  DATA.seleccionados=[]; DATA.equipos={A:[],B:[]};
  els.seccionEq.style.display='none'; els.seccionSel.style.display='block';
  renderLista(); updateContador();
}

/* === WhatsApp Corregido === */
els.btnWhats.onclick = () => {
  const msg = whatsMsg();
  // Al no poner un número después de wa.me/, WhatsApp abre el selector de chats
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
};

function whatsMsg() {
  const eqA = DATA.equipos.A.map(p => `• ${p.apodo}`).join('\n');
  const eqB = DATA.equipos.B.map(p => `• ${p.apodo}`).join('\n');
  
  // Usamos asteriscos (*) para negritas en WhatsApp
  return `*LIGA DE FULBO – Equipos de hoy*\n\n` +
         `*${els.nombreA.textContent.toUpperCase()}*\n${eqA}\n\n` +
         `*${els.nombreB.textContent.toUpperCase()}*\n${eqB}\n\n`
}

init();
