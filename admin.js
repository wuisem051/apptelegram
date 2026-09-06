/**
 * Panel de Administración Independiente - APK Store (Firebase Firestore Integration)
 */

let db = null;
let gamesList = [];
const ADMIN_PASSWORD = "admin";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD5I_qLIG_6jg7UiYowdnBgCFo5XhohPfc",
  authDomain: "apptelegram-6aa9a.firebaseapp.com",
  projectId: "apptelegram-6aa9a",
  storageBucket: "apptelegram-6aa9a.firebasestorage.app",
  messagingSenderId: "985520386327",
  appId: "1:985520386327:web:48f0e60b66e200b5ed0752",
  measurementId: "G-ZV41HC84PT"
};

// Inicializar Firebase
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("🔥 Firebase Firestore conectado en Panel Admin");
  } catch (e) {
    console.error("Error al inicializar Firebase:", e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
  setupNavigation();
  setupForms();
});

/**
 * 1. Autenticación / Login
 */
function setupLogin() {
  const loginForm = document.getElementById('loginForm');
  const loginPassword = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');
  const loginScreen = document.getElementById('loginScreen');
  const adminDashboard = document.getElementById('adminDashboard');
  const logoutBtn = document.getElementById('logoutBtn');

  // Si ya inició sesión previamente en esta pestaña
  if (sessionStorage.getItem('admin_authenticated') === 'true') {
    loginScreen.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    initAdminData();
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (loginPassword.value === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authenticated', 'true');
      loginScreen.classList.add('hidden');
      adminDashboard.classList.remove('hidden');
      loginError.classList.add('hidden');
      initAdminData();
    } else {
      loginError.classList.remove('hidden');
    }
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('admin_authenticated');
    location.reload();
  });
}

/**
 * 2. Navegación del Panel Lateral (Pestañas)
 */
function setupNavigation() {
  const menuCatBtn = document.getElementById('menuCatBtn');
  const menuSettingsBtn = document.getElementById('menuSettingsBtn');
  const menuAnalyticsBtn = document.getElementById('menuAnalyticsBtn');

  const viewCatalog = document.getElementById('viewCatalog');
  const viewSettings = document.getElementById('viewSettings');
  const viewAnalytics = document.getElementById('viewAnalytics');

  const navItems = [
    { btn: menuCatBtn, view: viewCatalog },
    { btn: menuSettingsBtn, view: viewSettings },
    { btn: menuAnalyticsBtn, view: viewAnalytics }
  ];

  navItems.forEach(item => {
    item.btn.addEventListener('click', () => {
      navItems.forEach(i => {
        i.btn.className = "w-full text-left px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm flex items-center justify-between border border-slate-800 transition-colors";
        i.view.classList.add('hidden');
      });

      item.btn.className = "w-full text-left px-4 py-3 rounded-2xl bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-sm flex items-center justify-between shadow-sm";
      item.view.classList.remove('hidden');

      if (item.btn === menuAnalyticsBtn) loadAnalytics();
      if (item.btn === menuSettingsBtn) loadHeaderSettings();
    });
  });
}

/**
 * 3. Inicialización de Datos de Firebase
 */
function initAdminData() {
  if (!db) return;

  // Escuchar cambios en la colección 'games'
  db.collection("games").onSnapshot(snapshot => {
    gamesList = [];
    snapshot.forEach(doc => {
      gamesList.push({ docId: doc.id, ...doc.data() });
    });
    renderAdminGamesTable();
  }, err => console.error("Error al escuchar games:", err));

  loadHeaderSettings();
}

/**
 * 4. Gestión del Formulario de Juegos
 */
function setupForms() {
  const adminGameForm = document.getElementById('adminGameForm');
  const adminFormReset = document.getElementById('adminFormReset');
  const headerSettingsForm = document.getElementById('headerSettingsForm');
  const copyFullJsonBtn = document.getElementById('copyFullJsonBtn');

  adminGameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveGame();
  });

  adminFormReset.addEventListener('click', resetAdminGameForm);

  headerSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveHeaderSettings();
  });

  copyFullJsonBtn.addEventListener('click', () => {
    const cleanGames = gamesList.map(g => {
      const { docId, createdAt, ...rest } = g;
      return rest;
    });
    const jsonStr = JSON.stringify(cleanGames, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      alert("¡JSON de catálogo copiado al portapapeles! Puedes pegarlo en GitHub.");
    }).catch(() => prompt("Copia el JSON:", jsonStr));
  });
}

async function saveGame() {
  const docId = document.getElementById('adminFormId').value;
  const gameData = {
    id: docId ? parseInt(document.getElementById('adminTitle').getAttribute('data-id') || Date.now()) : Date.now(),
    title: document.getElementById('adminTitle').value.trim(),
    category: document.getElementById('adminCategory').value,
    size: document.getElementById('adminSize').value.trim(),
    version: document.getElementById('adminVersion').value.trim(),
    rating: document.getElementById('adminRating').value,
    icon: document.getElementById('adminIcon').value.trim(),
    downloadUrl: document.getElementById('adminDownloadUrl').value.trim(),
    description: document.getElementById('adminDesc').value.trim(),
    updatedAt: new Date().toISOString()
  };

  if (!db) {
    alert("Error: Firebase no está conectado.");
    return;
  }

  try {
    if (docId) {
      await db.collection("games").doc(docId).update(gameData);
      alert("¡Juego actualizado en la Mini App de Telegram!");
    } else {
      await db.collection("games").add(gameData);
      alert("¡Juego publicado con éxito en Telegram!");
    }
    resetAdminGameForm();
  } catch (err) {
    alert("Error al guardar en Firebase: " + err.message);
  }
}

function resetAdminGameForm() {
  document.getElementById('adminFormId').value = '';
  document.getElementById('adminTitle').value = '';
  document.getElementById('adminCategory').value = 'Nuevo';
  document.getElementById('adminSize').value = '';
  document.getElementById('adminVersion').value = '';
  document.getElementById('adminRating').value = '5.0';
  document.getElementById('adminIcon').value = '';
  document.getElementById('adminDownloadUrl').value = '';
  document.getElementById('adminDesc').value = '';
  document.getElementById('formModeTitle').innerHTML = '<i class="fa-solid fa-plus-circle text-green-400"></i> Publicar Nuevo Juego / App';
}

function renderAdminGamesTable() {
  const container = document.getElementById('gamesAdminTable');
  if (gamesList.length === 0) {
    container.innerHTML = '<p class="text-sm text-slate-500 py-4 text-center">No hay juegos en la base de datos.</p>';
    return;
  }

  container.innerHTML = gamesList.map(game => `
    <div class="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
      <div class="flex items-center gap-3 min-w-0">
        <img src="${game.icon}" class="w-12 h-12 rounded-xl object-cover border border-slate-800 flex-shrink-0">
        <div class="min-w-0">
          <h4 class="font-bold text-sm text-slate-100 truncate">${game.title}</h4>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span class="px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-semibold border border-green-500/20 text-[10px]">${game.category}</span>
            <span class="text-amber-400 font-bold flex items-center gap-1"><i class="fa-solid fa-star text-[10px]"></i> ${game.rating || '5.0'}</span>
            <span>${game.size}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-shrink-0">
        <button onclick="editGameAdmin('${game.docId}')" class="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 font-bold text-xs rounded-xl flex items-center gap-1">
          <i class="fa-solid fa-pen"></i> Editar
        </button>
        <button onclick="deleteGameAdmin('${game.docId}')" class="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-bold text-xs rounded-xl flex items-center gap-1">
          <i class="fa-solid fa-trash"></i> Borrar
        </button>
      </div>
    </div>
  `).join('');
}

window.editGameAdmin = function(docId) {
  const game = gamesList.find(g => g.docId === docId);
  if (!game) return;

  document.getElementById('adminFormId').value = game.docId;
  document.getElementById('adminTitle').value = game.title;
  document.getElementById('adminTitle').setAttribute('data-id', game.id || Date.now());
  document.getElementById('adminCategory').value = game.category || 'Nuevo';
  document.getElementById('adminSize').value = game.size;
  document.getElementById('adminVersion').value = game.version;
  document.getElementById('adminRating').value = game.rating || '5.0';
  document.getElementById('adminIcon').value = game.icon;
  document.getElementById('adminDownloadUrl').value = game.downloadUrl;
  document.getElementById('adminDesc').value = game.description;

  document.getElementById('formModeTitle').innerHTML = '<i class="fa-solid fa-pen-to-square text-amber-400"></i> Editando Juego';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteGameAdmin = async function(docId) {
  if (confirm("¿Estás seguro de eliminar este juego definitivamente de la Mini App?")) {
    try {
      await db.collection("games").doc(docId).delete();
      alert("Juego eliminado con éxito.");
    } catch (e) {
      alert("Error al eliminar: " + e.message);
    }
  }
};

/**
 * 5. Ajustes de Marca (Título / Subtítulo)
 */
async function loadHeaderSettings() {
  if (!db) return;
  try {
    const doc = await db.collection("settings").doc("header").get();
    if (doc.exists) {
      const data = doc.data();
      if (data.title) document.getElementById('headerTitleInput').value = data.title;
      if (data.subtitle) document.getElementById('headerSubtitleInput').value = data.subtitle;
    }
  } catch (e) {
    console.warn("Error leyendo header settings:", e);
  }
}

async function saveHeaderSettings() {
  const title = document.getElementById('headerTitleInput').value.trim();
  const subtitle = document.getElementById('headerSubtitleInput').value.trim();

  if (!db) return;
  try {
    await db.collection("settings").doc("header").set({ title, subtitle });
    alert("¡Título y subtítulo de la Mini App actualizados con éxito!");
  } catch (e) {
    alert("Error al guardar ajustes: " + e.message);
  }
}

/**
 * 6. Analíticas & Registros por País
 */
async function loadAnalytics() {
  const logsContainer = document.getElementById('analyticsLogsContainer');
  const totalCountEl = document.getElementById('analyticsTotalCount');
  const topCountryEl = document.getElementById('analyticsTopCountry');

  if (!db) {
    logsContainer.innerHTML = '<p class="text-slate-500">Conecta Firebase para ver analíticas.</p>';
    return;
  }

  try {
    const snapshot = await db.collection("downloads").orderBy("timestamp", "desc").limit(100).get();
    const logs = [];
    const countryMap = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      logs.push(data);
      if (data.country) {
        countryMap[data.country] = (countryMap[data.country] || 0) + 1;
      }
    });

    totalCountEl.textContent = logs.length;

    let maxC = 0;
    let topC = "-";
    Object.keys(countryMap).forEach(c => {
      if (countryMap[c] > maxC) {
        maxC = countryMap[c];
        topC = `${c} (${maxC} descargas)`;
      }
    });
    topCountryEl.textContent = topC;

    if (logs.length === 0) {
      logsContainer.innerHTML = '<p class="text-sm text-slate-500 py-4 text-center">Aún no hay descargas registradas.</p>';
      return;
    }

    logsContainer.innerHTML = logs.map(log => `
      <div class="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h4 class="font-bold text-slate-100 truncate">${log.gameTitle}</h4>
          <p class="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            ${log.countryFlag && log.countryFlag.startsWith('http') ? `<img src="${log.countryFlag}" class="w-4 h-3 rounded shadow-sm inline">` : '🌐'}
            <span class="font-semibold text-slate-300">${log.country}</span>
          </p>
        </div>
        <span class="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-xs rounded-xl whitespace-nowrap">
          ${log.timeFormatted} (${log.dateFormatted})
        </span>
      </div>
    `).join('');

  } catch (err) {
    console.error("Error al cargar analíticas:", err);
    logsContainer.innerHTML = '<p class="text-sm text-red-400 py-4">Error al cargar historial de analíticas.</p>';
  }
}
