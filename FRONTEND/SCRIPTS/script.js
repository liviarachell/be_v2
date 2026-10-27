(() => {
  const API = `${window.location.origin}/api`;
  const TOKEN_KEY = 'lebrasil_token';

  function token() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(value) { localStorage.setItem(TOKEN_KEY, value); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token()) headers.Authorization = `Bearer ${token()}`;
    const response = await fetch(`${API}${path}`, { ...options, headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.erro || 'Não foi possível concluir a operação.');
    return body;
  }

  function value(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
  }

  function tell(message) { window.alert(message); }

  window.cadastrarConta = async function cadastrarConta() {
    const nome = value('nome_user');
    const email = value('email');
    const cpf = value('cpf');
    const senha = document.getElementById('senha1')?.value || '';
    const confirmarSenha = document.getElementById('senha2')?.value || '';
    if (!nome || !email || !cpf || !senha || !confirmarSenha) return tell('Preencha todos os campos.');
    if (senha !== confirmarSenha) return tell('As senhas não coincidem.');
    try {
      const result = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ nome, email, cpf, senha, confirmarSenha })
      });
      setToken(result.token);
      tell('Cadastro realizado com sucesso!');
      window.location.href = '/paginaPrincipal.html';
    } catch (error) { tell(error.message); }
  };

  window.LogarConta = async function LogarConta() {
    const email = value('email');
    const senha = document.getElementById('senha')?.value || '';
    if (!email || !senha) return tell('Informe seu e-mail e sua senha.');
    try {
      const result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) });
      setToken(result.token);
      window.location.href = '/paginaPrincipal.html';
    } catch (error) { tell(error.message); }
  };

  window.sairSite = function sairSite() {
    clearToken();
    window.location.href = '/Login.html';
  };

  window.mostrarInfo = function mostrarInfo(id) {
    const element = document.getElementById(id);
    if (element) element.hidden = !element.hidden;
  };

  window.submitEssay = function submitEssay() {
    tell('O salvamento de redações ainda não está disponível: o banco recebido não possui uma tabela de redações.');
  };

  window.navigateToStep = function navigateToStep(step) {
    const validStep = [1, 2, 3].includes(Number(step)) ? Number(step) : 1;
    document.querySelectorAll('[id^="view-"]').forEach(el => {
      const active = el.id === `view-${validStep}`;
      el.hidden = !active;
      el.classList.toggle('active', active);
    });
    document.querySelectorAll('[id^="pill-step-"]').forEach(el => el.classList.toggle('active', el.id === `pill-step-${validStep}`));
    const backButton = document.getElementById('back-btn');
    if (backButton) backButton.style.display = validStep > 1 ? '' : 'none';
  };

  window.goBack = function goBack() {
    const active = [...document.querySelectorAll('[id^="view-"]')].find(el => !el.hidden);
    const current = active ? Number(active.id.replace('view-', '')) : 1;
    window.navigateToStep(Math.max(1, current - 1));
  };

  window.selectTheme = function selectTheme(title, category, level, xp) {
    const titleElement = document.getElementById('selected-theme-title');
    const levelElement = document.getElementById('theme-level-badge');
    const xpElement = document.getElementById('theme-xp-badge');
    if (titleElement) titleElement.textContent = title;
    if (levelElement) levelElement.textContent = level;
    if (xpElement) xpElement.textContent = `${xp} ao completar`;
    const levelClass = String(level || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (levelElement) levelElement.className = `badge ${levelClass}`;
    window.navigateToStep(2);
  };

  window.updateEditorStats = function updateEditorStats() {
    const editor = document.getElementById('essay-input');
    if (!editor) return;
    const text = editor.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = editor.value.length;
    const progress = Math.min(100, Math.round((words / 150) * 100));
    const charsElement = document.getElementById('chars-count');
    const wordsElement = document.getElementById('words-count-footer');
    const percentElement = document.getElementById('progress-percent');
    const fillElement = document.getElementById('progress-fill');
    const leftElement = document.getElementById('words-left-text');
    if (charsElement) charsElement.textContent = `${chars} chars`;
    if (wordsElement) wordsElement.textContent = `${words} palavras`;
    if (percentElement) percentElement.textContent = `${progress}%`;
    if (fillElement) fillElement.style.width = `${progress}%`;
    if (leftElement) leftElement.textContent = words >= 150
      ? 'Mínimo de 150 palavras atingido'
      : `Faltam ${150 - words} palavras para poder enviar`;
  };

  async function loadProfile() {
    if (!document.getElementById('nome') || !token()) return;
    try {
      const { usuario } = await request('/me');
      const name = document.getElementById('nome');
      if (name) name.textContent = usuario.nome;
      const avatar = document.getElementById('avatar-inicial');
      if (avatar) avatar.textContent = (usuario.nome || '?').trim().charAt(0).toUpperCase();
    } catch (error) {
      if (/Token inválido|Autenticação necessária/.test(error.message)) clearToken();
    }
  }

  async function loadBookProgressCards() {
    if (!token()) return;
    try {
      const { livros } = await request('/books');
      document.querySelectorAll('[data-book-title]').forEach(card => {
        const book = livros.find(item => item.titulo.toLowerCase() === card.dataset.bookTitle.toLowerCase());
        if (!book) return;
        const progress = card.querySelector('[data-book-progress]');
        if (progress) progress.textContent = `${Number(book.progresso) || 0}%`;
      });
    } catch (error) {
      console.warn('Não foi possível carregar o progresso dos livros:', error.message);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[type="password"]').forEach(input => {
      const button = input.closest('.input-wrapper')?.querySelector('button[id^="mostrarSenha"]');
      if (button) button.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    });
    loadProfile();
    loadBookProgressCards();
    if (document.getElementById('essay-input')) window.updateEditorStats();
  });
})();
