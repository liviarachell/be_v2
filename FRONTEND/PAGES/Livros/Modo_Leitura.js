(() => {
  const API = `${window.location.origin}/api`;
  const TOKEN_KEY = 'lebrasil_token';
  const bar = document.getElementById('barra-progresso');
  if (!bar) return;

  const title = (document.title || '').trim().slice(0, 45);
  const known = {
    'Dom Casmurro': { autor: 'Machado de Assis', genero: 'Romance' },
    'Iracema': { autor: 'José de Alencar', genero: 'Romance' },
    'O Cortiço': { autor: 'Aluísio Azevedo', genero: 'Romance' },
    'O Guarani': { autor: 'José de Alencar', genero: 'Romance' },
    'O Primo Basílio': { autor: 'Eça de Queirós', genero: 'Romance' },
    'Vidas Secas': { autor: 'Graciliano Ramos', genero: 'Romance' }
  };

  async function api(path, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
    });
    if (!response.ok) return null;
    return response.json().catch(() => null);
  }

  function progressPercent() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return 100;
    return Math.max(0, Math.min(100, Math.round((window.scrollY / max) * 100)));
  }

  let bookId = null;
  let saveTimer;

  window.mudarFonte = function mudarFonte(delta) {
    const content = document.querySelector('.post-wrap');
    if (!content) return;
    const current = Number.parseFloat(content.dataset.fontSize || getComputedStyle(content).fontSize) || 16;
    const next = Math.max(12, Math.min(32, current + Number(delta || 0)));
    content.dataset.fontSize = String(next);
    content.style.fontSize = `${next}px`;
  };

  function updateProgressLabel(percent) {
    const label = document.querySelector('.progress-bar-inner');
    if (label) label.textContent = `${percent}%`;
  }
  async function initialize() {
    const result = await api('/books');
    if (!result) return;
    let book = result.livros.find(item => item.titulo.toLowerCase() === title.toLowerCase());
    if (!book) {
      const metadata = known[title] || { autor: 'Autor não informado', genero: null };
      const created = await api('/books', {
        method: 'POST',
        body: JSON.stringify({ titulo: title, autor: metadata.autor, genero: metadata.genero })
      });
      book = created?.livro || null;
    }
    if (book) {
      bookId = book.id;
      updateBar(Number(book.progresso) || 0);
    }
  }

  function updateBar(percent) {
    bar.style.width = `${percent}%`;
    updateProgressLabel(percent);
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Progresso de leitura');
    bar.setAttribute('aria-valuenow', String(percent));
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
  }

  async function saveProgress() {
    const progress = progressPercent();
    updateBar(progress);
    if (!bookId || !localStorage.getItem(TOKEN_KEY)) return;
    await api(`/books/${bookId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ progresso: progress })
    });
  }

  window.addEventListener('scroll', () => {
    updateBar(progressPercent());
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveProgress, 800);
  }, { passive: true });
  window.addEventListener('pagehide', saveProgress);
  initialize();
})();
