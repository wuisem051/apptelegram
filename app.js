/**
 * Telegram Mini App - APK Store & Monetag Integration + Admin Panel CRUD
 */

// State Application
let games = [];
let activeCategory = 'Todos';
let searchQuery = '';
let currentTimer = null;
let currentGameForDownload = null;

// Configuración de Admin Password & Monetag
const ADMIN_PASSWORD = "admin"; // Cambiar por tu contraseña preferida
const MONETAG_SMARTLINK_URL = "https://www.highperformanceformat.com/YOUR_SMARTLINK_ID";

document.addEventListener('DOMContentLoaded', () => {
  initTelegramSDK();
  loadGames();
  setupEventListeners();
  setupAdminListeners();
});

/**
 * 1. Inicialización de Telegram WebApp SDK
 */
function initTelegramSDK() {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();
    document.documentElement.classList.add('dark');
    if (tg.setHeaderColor) {
      tg.setHeaderColor('#0f172a');
    }
  }
}

/**
 * 2. Cargar Juegos (localStorage prioridad + games.json fallback)
 */
async function loadGames() {
  const localData = localStorage.getItem('apk_store_games');
  if (localData) {
    try {
      games = JSON.parse(localData);
      renderCategories();
      renderGames();
      return;
    } catch (e) {
      console.warn('Error leyendo localStorage:', e);
    }
  }

  try {
    const response = await fetch('./games.json');
    if (!response.ok) throw new Error('Error al cargar games.json');
    games = await response.json();
    saveGamesToStorage();
  } catch (error) {
    console.warn('Cargando catálogo local de respaldo:', error);
    games = [
      {
        id: 1,
        title: "Subway Surfers (MOD Dinero)",
        category: "Offline",
        size: "145 MB",
        version: "v3.18.0",
        androidReq: "Android 5.0+",
        icon: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=150&q=80",
        description: "Corre a toda velocidad escapando del inspector. Modificación con dinero, monedas e llaves ilimitadas para desbloquear todos los personajes.",
        downloadUrl: "https://example.com/download/subway-surfers-mod.apk"
      },
      {
        id: 2,
        title: "Genshin Impact APK",
        category: "RPG",
        size: "650 MB",
        version: "v4.2.0",
        androidReq: "Android 8.0+",
        icon: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80",
        description: "Explora Teyvat en este fascinante juego RPG de mundo abierto. Gráficos de consola optimizados para celulares de gama media y alta.",
        downloadUrl: "https://example.com/download/genshin-impact.apk"
      }
    ];
    saveGamesToStorage();
  }

  renderCategories();
  renderGames();
}

function saveGamesToStorage() {
  localStorage.setItem('apk_store_games', JSON.stringify(games));
}

/**
 * 3. Renderizado de Categorías
 */
function renderCategories() {
  const container = document.getElementById('categoryContainer');
  const categories = ['Todos', ...new Set(games.map(g => g.category))];

  container.innerHTML = categories.map(cat => `
    <button 
      class="category-btn whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
        cat === activeCategory 
          ? 'bg-green-500 text-slate-950 shadow-md shadow-green-500/20' 
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
      }"
      data-category="${cat}">
      ${cat}
    </button>
  `).join('');

  container.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      activeCategory = e.currentTarget.getAttribute('data-category');
      renderCategories();
      renderGames();
    });
  });
}

/**
 * 4. Renderizado Dinámico del Grid de Juegos
 */
function renderGames() {
  const grid = document.getElementById('gamesGrid');
  const noResults = document.getElementById('noResults');
  const gameCount = document.getElementById('gameCount');

  const filtered = games.filter(game => {
    const matchesCategory = activeCategory === 'Todos' || game.category === activeCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  gameCount.textContent = `${filtered.length} Juego${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');
  grid.innerHTML = filtered.map(game => `
    <div class="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-700 transition-all shadow-sm">
      <div class="flex items-center gap-3 min-w-0">
        <img src="${game.icon}" alt="${game.title}" class="w-14 h-14 rounded-2xl object-cover border border-slate-800 flex-shrink-0 shadow-md">
        <div class="min-w-0">
          <h4 class="font-bold text-sm text-slate-100 truncate">${game.title}</h4>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-[10px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md">${game.category}</span>
            <span class="text-xs text-slate-400 font-medium">${game.size}</span>
          </div>
        </div>
      </div>
      <button 
        onclick="openDownloadModal(${game.id})"
        class="flex-shrink-0 px-3.5 py-2 bg-slate-800 hover:bg-green-500 text-green-400 hover:text-slate-950 font-extrabold text-xs rounded-xl border border-slate-700 hover:border-green-500 transition-all flex items-center gap-1.5 shadow-sm">
        <i class="fa-solid fa-download"></i> APK
      </button>
    </div>
  `).join('');
}

/**
 * 5. Event Listeners Generales
 */
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderGames();
  });

  document.getElementById('closeModalBtn').addEventListener('click', closeModal);

  const downloadModal = document.getElementById('downloadModal');
  downloadModal.addEventListener('click', (e) => {
    if (e.target === downloadModal) closeModal();
  });

  document.getElementById('downloadBtn').addEventListener('click', executeMonetagAndDownload);
}

/**
 * 6. Modal de Descarga con Temporizador
 */
function openDownloadModal(gameId) {
  const game = games.find(g => g.id === gameId);
  if (!game) return;

  currentGameForDownload = game;

  document.getElementById('modalTitle').textContent = game.title;
  document.getElementById('modalIcon').src = game.icon;
  document.getElementById('modalCategory').textContent = game.category;
  document.getElementById('modalSize').innerHTML = `<i class="fa-solid fa-hard-drive mr-1"></i>${game.size}`;
  document.getElementById('modalVersion').innerHTML = `<i class="fa-solid fa-code-branch mr-1"></i>${game.version}`;
  document.getElementById('modalReq').textContent = game.androidReq || 'Android 5.0+';
  document.getElementById('modalDesc').textContent = game.description;

  document.getElementById('timerSection').classList.remove('hidden');
  document.getElementById('downloadActionSection').classList.add('hidden');

  const downloadModal = document.getElementById('downloadModal');
  const modalContainer = document.getElementById('modalContainer');
  
  downloadModal.classList.remove('opacity-0', 'pointer-events-none');
  modalContainer.classList.remove('translate-y-full');

  startTimer(7);
}

function closeModal() {
  if (currentTimer) clearInterval(currentTimer);
  const downloadModal = document.getElementById('downloadModal');
  const modalContainer = document.getElementById('modalContainer');
  modalContainer.classList.add('translate-y-full');
  downloadModal.classList.add('opacity-0', 'pointer-events-none');
}

function startTimer(seconds) {
  let timeLeft = seconds;
  const timerText = document.getElementById('timerText');
  const timerProgress = document.getElementById('timerProgress');
  const fullDash = 175.9;

  if (currentTimer) clearInterval(currentTimer);

  timerText.textContent = timeLeft;
  timerProgress.style.strokeDashoffset = '0';

  currentTimer = setInterval(() => {
    timeLeft--;
    timerText.textContent = timeLeft;
    
    const offset = fullDash - (timeLeft / seconds) * fullDash;
    timerProgress.style.strokeDashoffset = offset;

    if (timeLeft <= 0) {
      clearInterval(currentTimer);
      document.getElementById('timerSection').classList.add('hidden');
      document.getElementById('downloadActionSection').classList.remove('hidden');

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    }
  }, 1000);
}

/**
 * 7. Monetag & Redirección
 */
function executeMonetagAndDownload() {
  if (!currentGameForDownload) return;

  if (typeof show_monetag === 'function') {
    show_monetag().then(() => {
      openDownloadLink();
    }).catch(() => {
      openDownloadLink();
    });
  } else {
    if (MONETAG_SMARTLINK_URL && !MONETAG_SMARTLINK_URL.includes("YOUR_SMARTLINK_ID")) {
      window.open(MONETAG_SMARTLINK_URL, '_blank');
    }
    openDownloadLink();
  }
}

function openDownloadLink() {
  if (currentGameForDownload && currentGameForDownload.downloadUrl) {
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(currentGameForDownload.downloadUrl);
    } else {
      window.open(currentGameForDownload.downloadUrl, '_blank');
    }
  }
  closeModal();
}

/**
 * 8. PANEL DE ADMINISTRACIÓN (CRUD Completo)
 */
function setupAdminListeners() {
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const adminAuthModal = document.getElementById('adminAuthModal');
  const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
  const adminAuthForm = document.getElementById('adminAuthForm');
  const adminPassInput = document.getElementById('adminPassInput');
  const authErrorMsg = document.getElementById('authErrorMsg');

  const adminPanelModal = document.getElementById('adminPanelModal');
  const closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn');

  const gameForm = document.getElementById('gameForm');
  const resetFormBtn = document.getElementById('resetFormBtn');

  // Abrir Modal de Autenticación
  adminLoginBtn.addEventListener('click', () => {
    adminPassInput.value = '';
    authErrorMsg.classList.add('hidden');
    adminAuthModal.classList.remove('opacity-0', 'pointer-events-none');
  });

  closeAuthModalBtn.addEventListener('click', () => {
    adminAuthModal.classList.add('opacity-0', 'pointer-events-none');
  });

  // Validar Contraseña
  adminAuthForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (adminPassInput.value === ADMIN_PASSWORD) {
      adminAuthModal.classList.add('opacity-0', 'pointer-events-none');
      openAdminPanel();
    } else {
      authErrorMsg.classList.remove('hidden');
    }
  });

  // Cerrar Panel Admin
  closeAdminPanelBtn.addEventListener('click', () => {
    adminPanelModal.classList.add('opacity-0', 'pointer-events-none');
  });

  // Formulario Crear / Editar Juego
  gameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveGameFromForm();
  });

  resetFormBtn.addEventListener('click', resetGameForm);
}

function openAdminPanel() {
  const adminPanelModal = document.getElementById('adminPanelModal');
  resetGameForm();
  renderAdminGamesList();
  adminPanelModal.classList.remove('opacity-0', 'pointer-events-none');
}

function resetGameForm() {
  document.getElementById('formGameId').value = '';
  document.getElementById('formTitle').value = '';
  document.getElementById('formCategory').value = '';
  document.getElementById('formSize').value = '';
  document.getElementById('formVersion').value = '';
  document.getElementById('formReq').value = 'Android 5.0+';
  document.getElementById('formIcon').value = '';
  document.getElementById('formDownloadUrl').value = '';
  document.getElementById('formDesc').value = '';
  document.getElementById('saveGameBtn').textContent = 'Guardar Juego';
}

function saveGameFromForm() {
  const idVal = document.getElementById('formGameId').value;
  const gameData = {
    id: idVal ? parseInt(idVal) : Date.now(),
    title: document.getElementById('formTitle').value.trim(),
    category: document.getElementById('formCategory').value.trim(),
    size: document.getElementById('formSize').value.trim(),
    version: document.getElementById('formVersion').value.trim(),
    androidReq: document.getElementById('formReq').value.trim() || 'Android 5.0+',
    icon: document.getElementById('formIcon').value.trim(),
    downloadUrl: document.getElementById('formDownloadUrl').value.trim(),
    description: document.getElementById('formDesc').value.trim()
  };

  if (idVal) {
    // Editar existente
    const index = games.findIndex(g => g.id === parseInt(idVal));
    if (index !== -1) games[index] = gameData;
  } else {
    // Agregar nuevo
    games.unshift(gameData);
  }

  saveGamesToStorage();
  renderCategories();
  renderGames();
  renderAdminGamesList();
  resetGameForm();

  alert('¡Juego guardado correctamente!');
}

function editGame(gameId) {
  const game = games.find(g => g.id === gameId);
  if (!game) return;

  document.getElementById('formGameId').value = game.id;
  document.getElementById('formTitle').value = game.title;
  document.getElementById('formCategory').value = game.category;
  document.getElementById('formSize').value = game.size;
  document.getElementById('formVersion').value = game.version;
  document.getElementById('formReq').value = game.androidReq || 'Android 5.0+';
  document.getElementById('formIcon').value = game.icon;
  document.getElementById('formDownloadUrl').value = game.downloadUrl;
  document.getElementById('formDesc').value = game.description;

  document.getElementById('saveGameBtn').textContent = 'Actualizar Juego';
}

function deleteGame(gameId) {
  if (confirm('¿Estás seguro de que deseas eliminar este juego del catálogo?')) {
    games = games.filter(g => g.id !== gameId);
    saveGamesToStorage();
    renderCategories();
    renderGames();
    renderAdminGamesList();
  }
}

function renderAdminGamesList() {
  const container = document.getElementById('adminGamesList');
  if (games.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-500">No hay juegos en la lista.</p>';
    return;
  }

  container.innerHTML = games.map(game => `
    <div class="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
      <div class="flex items-center gap-2 min-w-0">
        <img src="${game.icon}" class="w-8 h-8 rounded-lg object-cover">
        <span class="font-bold text-slate-200 truncate">${game.title}</span>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="editGame(${game.id})" class="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/20"><i class="fa-solid fa-pen"></i></button>
        <button onclick="deleteGame(${game.id})" class="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}
