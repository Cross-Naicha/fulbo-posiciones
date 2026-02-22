(function() {
  const container = document.getElementById('fabMenu');
  const mainBtn = document.getElementById('btnFabMain');
  const upBtn = document.getElementById('btnScrollUp');

  if (!mainBtn || !container) return;

  mainBtn.onclick = (e) => {
    e.stopPropagation();
    container.classList.toggle('open');
  };

  if (upBtn) {
    upBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) container.classList.remove('open');
  });
})();