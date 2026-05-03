export function initToast() {
  if (typeof window === 'undefined') return;
  window.toast = function (msg, isError = false) {
    const existing = document.getElementById('__toast__');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = '__toast__';
    el.className = 'toast' + (isError ? ' toast-error' : '');
    el.textContent = msg;
    document.body.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(8px)';
      setTimeout(() => el.remove(), 300);
    }, 2800);
  };
}
