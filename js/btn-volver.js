/* =========================================================
   LIGA DE FULBO - FLOATING BACK BUTTON SCRIPT
   Author: Nicolás + ChatGPT
   Purpose: Handles the behavior of the floating back button.
   ========================================================= */

/**
 * Adds click functionality to the back button.
 * If a target URL is provided, it navigates there.
 * Otherwise, it uses browser history (window.history.back()).
 */

(function initBackButton() {
  const btn = document.getElementById('btnVolver');
  if (!btn) return;

  // Optional: set your default target page
  const defaultTarget = 'index.html'; // You can change or leave empty

  btn.addEventListener('click', () => {
    if (defaultTarget) {
      window.location.href = defaultTarget;
    } else {
      window.history.back();
    }
  });
})();
