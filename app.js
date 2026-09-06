/**
 * Telegram Mini App - APK Store & Monetag Integration + Admin Panel + Firebase Firestore
 */

// State Application
let games = [];
let activeCategory = 'Todos';
let searchQuery = '';
let currentTimer = null;
let currentGameForDownload = null;
let db = null;

// Configuración de Admin Password & Monetag
const ADMIN_PASSWORD = "admin";

// ----------------------------------------------------
// CONFIGURACIÓN DE FIREBASE (Proyecto: apptelegram-6aa9a)
// ----------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyD5I_qLIG_6jg7UiYowdnBgCFo5XhohPfc",
  authDomain: "apptelegram-6aa9a.firebaseapp.com",
  projectId: "apptelegram-6aa9a",
  storageBucket: "apptelegram-6aa9a.firebasestorage.app",
  messagingSenderId: "985520386327",
  appId: "1:985520386327:web:48f0e60b66e200b5ed0752",
  measurementId: "G-ZV41HC84PT"
};

// Inicializar Firebase Firestore
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("🔥 Firebase Firestore conectado exitosamente");
  } catch (e) {
    console.warn("Error al inicializar Firebase:", e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTelegramSDK();
  loadGames();
  setupEventListeners();
  setupAdminListeners();

  // Auto-recargar el catálogo cada 15 segundos para sincronizar cambios
  setInterval(() => {
    loadGames();
  }, 15000);
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
 * 2. Cargar Juegos (Sincronización en tiempo real con Firebase Firestore o games.json)
 */
async function loadGames() {
  if (db) {
    db.collection("games").get().then(async (snapshot) => {
      const fbGames = [];
      snapshot.forEach((doc) => {
        fbGames.push({ docId: doc.id, ...doc.data() });
      });

      let baseJsonGames = [];
      try {
        const res = await fetch('./games.json?v=' + Date.now());
        if (res.ok) baseJsonGames = await res.json();
      } catch(e) {}

      const map = new Map();
      baseJsonGames.forEach(g => map.set(g.id, g));
      fbGames.forEach(g => map.set(g.id || g.docId, g));

      games = Array.from(map.values());
      renderCategories();
      renderGames();
    }).catch((error) => {
      console.warn("Error leyendo Firestore:", error);
      fetchLocalJsonGames();
    });
  } else {
    fetchLocalJsonGames();
  }
}

async function fetchLocalJsonGames() {
  try {
    const response = await fetch('./games.json?t=' + Date.now());
    if (response.ok) {
      games = await response.json();
    }
  } catch (error) {
    console.warn('Error al cargar games.json:', error);
  }

  renderCategories();
  renderGames();
}

/**
 * 3. Renderizado de Categorías Solicitadas: Todos, Nuevo, Apps, Games, Sin internet
 */
function renderCategories() {
  const container = document.getElementById('categoryContainer');
  const customCategories = ['Todos', 'Nuevo', 'Apps', 'Games', 'Sin internet'];

  container.innerHTML = customCategories.map(cat => `
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
    let matchesCategory = false;
    const cat = activeCategory.toLowerCase();
    const gameCat = (game.category || '').toLowerCase();

    if (activeCategory === 'Todos') {
      matchesCategory = true;
    } else if (cat === 'nuevo') {
      matchesCategory = gameCat.includes('nuevo') || gameCat.includes('mod') || game.isNew === true;
    } else if (cat === 'apps') {
      matchesCategory = gameCat.includes('app') || gameCat.includes('aplicacion');
    } else if (cat === 'games') {
      matchesCategory = gameCat.includes('game') || gameCat.includes('juego') || gameCat.includes('rpg') || gameCat.includes('acción') || gameCat.includes('accion');
    } else if (cat === 'sin internet') {
      matchesCategory = gameCat.includes('offline') || gameCat.includes('sin internet');
    } else {
      matchesCategory = gameCat === cat;
    }

    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          gameCat.includes(searchQuery.toLowerCase());

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

  // Llenar datos en el modal
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
  
  // Abrir modal
  downloadModal.classList.remove('opacity-0', 'pointer-events-none');
  modalContainer.classList.remove('translate-y-full');

  // Disparar anuncio de Monetag ÚNICAMENTE durante la navegación (al hacer clic en un juego)
  if (typeof show_11738612 === 'function') {
    show_11738612().catch((e) => console.warn('Monetag navigation ad bypassed:', e));
  }

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
 * 7. Descarga Directa Limpia (Sin Anuncios)
 */
function executeMonetagAndDownload() {
  openDownloadLink();
}

function openDownloadLink() {
  if (currentGameForDownload && currentGameForDownload.downloadUrl) {
    const url = currentGameForDownload.downloadUrl;
    
    // Si estamos dentro del entorno de Telegram WebApp
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url);
    } else {
      // Si estamos en navegador convencional, abrir en nueva pestaña
      window.open(url, '_blank');
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

  // Verificar si la URL contiene ?admin=true para mostrar el botón
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('admin') === 'true') {
    adminLoginBtn.classList.remove('hidden');
  }

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

  // Copiar JSON del catálogo
  document.getElementById('copyJsonBtn')?.addEventListener('click', () => {
    const jsonStr = JSON.stringify(games, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      alert('¡Catálogo JSON copiado al portapapeles! Puedes pegarlo en tu archivo games.json de GitHub si deseas guardarlo permanentemente.');
    }).catch(err => {
      console.warn('Error al copiar:', err);
      prompt('Copia este código JSON para tu archivo games.json:', jsonStr);
    });
  });
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

async function saveGameFromForm() {
  const docIdVal = document.getElementById('formGameId').value;
  const gameData = {
    id: docIdVal ? parseInt(docIdVal) : Date.now(),
    title: document.getElementById('formTitle').value.trim(),
    category: document.getElementById('formCategory').value.trim(),
    size: document.getElementById('formSize').value.trim(),
    version: document.getElementById('formVersion').value.trim(),
    androidReq: document.getElementById('formReq').value.trim() || 'Android 5.0+',
    icon: document.getElementById('formIcon').value.trim(),
    downloadUrl: document.getElementById('formDownloadUrl').value.trim(),
    description: document.getElementById('formDesc').value.trim(),
    createdAt: new Date().toISOString()
  };

  if (db) {
    try {
      if (docIdVal) {
        // Actualizar en Firestore
        const existingGame = games.find(g => g.id === parseInt(docIdVal) || g.docId === docIdVal);
        if (existingGame && existingGame.docId) {
          await db.collection("games").doc(existingGame.docId).update(gameData);
        } else {
          await db.collection("games").add(gameData);
        }
      } else {
        // Crear nuevo documento en Firestore
        await db.collection("games").add(gameData);
      }
      alert('¡Juego guardado en Firebase exitosamente!');
    } catch (err) {
      console.error("Error al guardar en Firebase:", err);
      alert("Error al guardar en Firebase: " + err.message);
    }
  } else {
    // Fallback local
    if (docIdVal) {
      const index = games.findIndex(g => g.id === parseInt(docIdVal));
      if (index !== -1) games[index] = gameData;
    } else {
      games.unshift(gameData);
    }
    renderCategories();
    renderGames();
    renderAdminGamesList();
    alert('¡Juego guardado localmente!');
  }

  resetGameForm();
}

async function deleteGame(gameId) {
  if (confirm('¿Estás seguro de que deseas eliminar este juego del catálogo?')) {
    if (db) {
      const targetGame = games.find(g => g.id === gameId || g.docId === gameId);
      if (targetGame && targetGame.docId) {
        try {
          await db.collection("games").doc(targetGame.docId).delete();
          alert('Juego eliminado de Firebase');
        } catch (e) {
          console.error("Error al eliminar de Firebase:", e);
        }
      }
    } else {
      games = games.filter(g => g.id !== gameId);
      renderCategories();
      renderGames();
      renderAdminGamesList();
    }
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
