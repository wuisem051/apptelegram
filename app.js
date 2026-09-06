/**
 * Telegram Mini App - APK Store & Monetag Integration
 */

// State Application
let games = [];
let activeCategory = 'Todos';
let searchQuery = '';
let currentTimer = null;
let currentGameForDownload = null;

// Configuración de Monetag Direct / SmartLink (Reemplazar con tu propia URL de Smartlink o Monetag Tag)
const MONETAG_SMARTLINK_URL = "https://www.highperformanceformat.com/YOUR_SMARTLINK_ID";

document.addEventListener('DOMContentLoaded', () => {
  initTelegramSDK();
  loadGames();
  setupEventListeners();
});

/**
 * 1. Inicialización de Telegram WebApp SDK
 */
function initTelegramSDK() {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // Expandir a pantalla completa
    tg.expand();
    
    // Avisar que la app está lista
    tg.ready();

    // Adaptar colores al tema de Telegram si aplica
    document.documentElement.classList.add('dark'); // Forzar dark mode por defecto
    
    // Configurar color del Header de Telegram
    if (tg.setHeaderColor) {
      tg.setHeaderColor('#0f172a');
    }
  }
}

/**
 * 2. Cargar Juegos desde JSON o fallback incorporado
 */
async function loadGames() {
  try {
    const response = await fetch('./games.json');
    if (!response.ok) throw new Error('Error al cargar games.json');
    games = await response.json();
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
      },
      {
        id: 3,
        title: "GTA San Andreas (Android)",
        category: "Acción",
        size: "2.4 GB",
        version: "v2.10",
        androidReq: "Android 7.0+",
        icon: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=150&q=80",
        description: "El clásico juego de mundo abierto ahora completamente optimizado para Android. Incluye soporte para mandos externos y mejores texturas.",
        downloadUrl: "https://example.com/download/gta-sa.apk"
      }
    ];
  }

  renderCategories();
  renderGames();
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

  // Event Listeners para botones de categoría
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

  // Filtrado por categoría y búsqueda
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
 * 5. Event Listeners (Buscador, Modales)
 */
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderGames();
  });

  const closeModalBtn = document.getElementById('closeModalBtn');
  closeModalBtn.addEventListener('click', closeModal);

  // Cerrar al dar click fuera del modal
  const downloadModal = document.getElementById('downloadModal');
  downloadModal.addEventListener('click', (e) => {
    if (e.target === downloadModal) closeModal();
  });

  // Botón de Descarga Final con Monetag Trigger
  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.addEventListener('click', executeMonetagAndDownload);
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

  // Reset de la vista de temporizador
  const timerSection = document.getElementById('timerSection');
  const actionSection = document.getElementById('downloadActionSection');
  timerSection.classList.remove('hidden');
  actionSection.classList.add('hidden');

  // Abrir modal con animación
  const downloadModal = document.getElementById('downloadModal');
  const modalContainer = document.getElementById('modalContainer');
  
  downloadModal.classList.remove('opacity-0', 'pointer-events-none');
  modalContainer.classList.remove('translate-y-full');

  // Iniciar Cuenta Regresiva (7 segundos)
  startTimer(7);
}

function closeModal() {
  if (currentTimer) clearInterval(currentTimer);

  const downloadModal = document.getElementById('downloadModal');
  const modalContainer = document.getElementById('modalContainer');

  modalContainer.classList.add('translate-y-full');
  downloadModal.classList.add('opacity-0', 'pointer-events-none');
}

/**
 * 7. Temporizador Animado
 */
function startTimer(seconds) {
  let timeLeft = seconds;
  const timerText = document.getElementById('timerText');
  const timerProgress = document.getElementById('timerProgress');
  const fullDash = 175.9; // Perímetro de r=28 (2 * PI * 28)

  if (currentTimer) clearInterval(currentTimer);

  timerText.textContent = timeLeft;
  timerProgress.style.strokeDashoffset = '0';

  currentTimer = setInterval(() => {
    timeLeft--;
    timerText.textContent = timeLeft;
    
    // Actualizar anillo de progreso
    const offset = fullDash - (timeLeft / seconds) * fullDash;
    timerProgress.style.strokeDashoffset = offset;

    if (timeLeft <= 0) {
      clearInterval(currentTimer);
      // Revelar botón de descarga
      document.getElementById('timerSection').classList.add('hidden');
      document.getElementById('downloadActionSection').classList.remove('hidden');

      // Haptic Feedback de Telegram si está disponible
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    }
  }, 1000);
}

/**
 * 8. Integración Monetag + Redirección Final de Descarga
 */
function executeMonetagAndDownload() {
  if (!currentGameForDownload) return;

  // Option A: Si usas Rewarded / Interstitial In-Page de Monetag mediante objeto global
  if (typeof show_monetag === 'function') {
    show_monetag().then(() => {
      openDownloadLink();
    }).catch(() => {
      openDownloadLink();
    });
  } else {
    // Option B: SmartLink u OnClick Ad Direct Trigger (Dispara el anuncio en nueva pestaña y luego abre la descarga)
    // Disparar anuncio de Monetag vía SmartLink
    if (MONETAG_SMARTLINK_URL && MONETAG_SMARTLINK_URL !== "https://www.highperformanceformat.com/YOUR_SMARTLINK_ID") {
      window.open(MONETAG_SMARTLINK_URL, '_blank');
    }

    // Abrir enlace real de APK
    openDownloadLink();
  }
}

function openDownloadLink() {
  if (currentGameForDownload && currentGameForDownload.downloadUrl) {
    if (window.Telegram?.WebApp?.openLink) {
      // Usar API nativa de Telegram WebApp para abrir enlaces externos
      window.Telegram.WebApp.openLink(currentGameForDownload.downloadUrl);
    } else {
      window.open(currentGameForDownload.downloadUrl, '_blank');
    }
  }
  closeModal();
}
