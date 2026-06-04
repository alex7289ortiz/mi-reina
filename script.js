const STORAGE_KEY = "corazonAlexanderState:v1";
const ALEX_GPT_STORAGE_KEY = "alexGPTParaReina:v1";
const LEVEL_REWARD_STORAGE_KEY = "corazonAlexanderRewards:v1";
const CENTRAL_PHRASE = "Juntos somos la temperatura exacta donde el amor no se quema ni se enfría.";

const appState = {
  completed: [],
  freeMode: false
};

const levelMeta = [
  { id: 1, icon: "19", title: "Nuestro número 19", description: "Una pista compartida entre abril, julio y el destino.", accent: "#f7cc73", rgb: "247, 204, 115" },
  { id: 2, icon: "🔥", title: "Aries & Cáncer", description: "Fuego, luna, agua y una compatibilidad peligrosa.", accent: "#67c4df", rgb: "103, 196, 223" },
  { id: 3, icon: "🎡", title: "Ruleta del amor", description: "Premios pequeños, sinceros y un poco traviesos.", accent: "#e33a73", rgb: "227, 58, 115" },
  { id: 4, icon: "💗", title: "Sube la temperatura", description: "Una barra emocional, coqueta y cero explícita.", accent: "#ff7a35", rgb: "255, 122, 53" },
  { id: 5, icon: "🚪", title: "Escape Room de Alexander", description: "Cinco puertas para entrar a su corazón.", accent: "#b78cff", rgb: "183, 140, 255" },
  { id: 6, icon: "⭐", title: "Atrapa corazones", description: "Un minijuego táctil de señales bonitas.", accent: "#ff8aba", rgb: "255, 138, 186" },
  { id: 7, icon: "🔮", title: "Máquina del futuro", description: "Pequeñas escenas de un mañana sin apurarlo.", accent: "#8e6cf1", rgb: "142, 108, 241" },
  { id: 8, icon: "🌙", title: "Mini Nosotros", description: "Una mezcla de fuego, ternura y autoridad perdida.", accent: "#f4a7c6", rgb: "244, 167, 198" },
  { id: 9, icon: "💬", title: "AlexGPT para Reina", description: "Una versión digital de Alex para preguntar amor, futuro y dudas.", accent: "#67c4df", rgb: "103, 196, 223" },
  { id: 10, icon: "🎁", title: "Cofre final", description: "El cierre de la aventura y una promesa tranquila.", accent: "#f7cc73", rgb: "247, 204, 115" }
];

const nodes = {
  start: document.querySelector("#start-screen"),
  menu: document.querySelector("#menu-screen"),
  level: document.querySelector("#level-screen"),
  levelGrid: document.querySelector("#levelGrid"),
  levelTitle: document.querySelector("#level-title"),
  levelKicker: document.querySelector("#levelKicker"),
  levelContent: document.querySelector("#levelContent"),
  freeModeToggle: document.querySelector("#freeModeToggle"),
  modeNote: document.querySelector("#modeNote"),
  toast: document.querySelector("#toast"),
  particles: document.querySelector("#particles")
};

let currentLevel = null;
let catchTimer = null;
let catchSpawner = null;
let temperatureTimer = null;

init();

function init() {
  loadState();
  bindGlobalEvents();
  updateProgressUI();
}

function bindGlobalEvents() {
  document.querySelector("#startAdventure").addEventListener("click", () => {
    appState.freeMode = false;
    saveState();
    showMenu();
  });

  document.querySelector("#startFree").addEventListener("click", () => {
    appState.freeMode = true;
    saveState();
    showMenu();
  });

  document.querySelector("#backToMenu").addEventListener("click", showMenu);
  document.querySelector("#resetFromMenu").addEventListener("click", resetAdventure);
  document.querySelector("#resetFromLevel").addEventListener("click", resetAdventure);

  nodes.freeModeToggle.addEventListener("change", event => {
    appState.freeMode = event.target.checked;
    saveState();
    renderMenu();
    updateProgressUI();
  });
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    appState.completed = Array.isArray(parsed.completed) ? parsed.completed : [];
    appState.freeMode = Boolean(parsed.freeMode);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function resetAdventure() {
  stopCatchGame();
  appState.completed = [];
  appState.freeMode = false;
  localStorage.removeItem(ALEX_GPT_STORAGE_KEY);
  localStorage.removeItem(LEVEL_REWARD_STORAGE_KEY);
  saveState();
  showMenu();
  showToast("Aventura reiniciada. El corazón vuelve al inicio.");
}

function showScreen(screen) {
  [nodes.start, nodes.menu, nodes.level].forEach(item => item.classList.remove("is-active"));
  screen.classList.add("is-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showMenu() {
  stopCatchGame();
  currentLevel = null;
  nodes.level.className = "screen";
  nodes.levelContent.className = "level-content";
  renderMenu();
  updateProgressUI();
  showScreen(nodes.menu);
}

function openLevel(id) {
  const meta = levelMeta.find(level => level.id === id);
  if (!meta || !isUnlocked(id)) {
    showToast("Ese nivel todavía está bloqueado. Completa el anterior primero.");
    return;
  }

  stopCatchGame();
  currentLevel = id;
  nodes.levelTitle.textContent = meta.title;
  nodes.levelKicker.textContent = id === 10 ? "Cofre final" : `Nivel ${id}`;
  nodes.level.className = `screen level-theme-${id}`;
  nodes.levelContent.className = `level-content level-theme-${id}`;
  nodes.levelContent.dataset.level = String(id);
  nodes.levelContent.innerHTML = "";
  renderLevel(id);
  updateProgressUI();
  showScreen(nodes.level);
}

function isCompleted(id) {
  return appState.completed.includes(id);
}

function isUnlocked(id) {
  if (appState.freeMode || id === 1) return true;
  if (id === 10) return levelMeta.slice(0, 9).every(level => isCompleted(level.id));
  return isCompleted(id - 1);
}

function completeLevel(id) {
  if (!isCompleted(id)) {
    appState.completed.push(id);
    appState.completed.sort((a, b) => a - b);
    saveState();
  }

  updateProgressUI();
  burst(["❤", "✨", "🌙", "🔥"]);
  vibrate(28);

  const next = id < 10 ? levelMeta.find(level => level.id === id + 1) : null;
  const message = next && isUnlocked(next.id)
    ? `Nivel completado. Se desbloqueó: ${next.title}.`
    : "Nivel completado. Reina acaba de guardar otro pedacito bonito.";

  showToast(message);
  renderLevel(id);
}

function updateProgressUI() {
  const count = appState.completed.length;
  const percent = Math.round((count / 10) * 100);
  const modeLabel = appState.freeMode ? "Modo libre" : "Modo aventura";

  document.querySelector("#progressText").textContent = `Progreso: ${count}/10`;
  document.querySelector("#levelProgressText").textContent = `Progreso: ${count}/10`;
  document.querySelector("#modeText").textContent = modeLabel;
  document.querySelector("#levelModeText").textContent = modeLabel;
  document.querySelector("#progressFill").style.width = `${percent}%`;
  document.querySelector("#levelProgressFill").style.width = `${percent}%`;

  nodes.freeModeToggle.checked = appState.freeMode;
  nodes.modeNote.hidden = !appState.freeMode;
}

function renderMenu() {
  nodes.levelGrid.innerHTML = levelMeta.map(level => {
    const completed = isCompleted(level.id);
    const unlocked = isUnlocked(level.id);
    const status = completed ? "Completado" : unlocked ? "Desbloqueado" : "Bloqueado";
    const statusClass = completed ? "complete" : unlocked ? "" : "locked";
    return `
      <article class="level-card ${unlocked ? "" : "is-locked"}" style="--accent: ${level.accent}; --accent-rgb: ${level.rgb};">
        <div class="level-icon" aria-hidden="true">${level.icon}</div>
        <div class="level-body">
          <span class="level-number">Nivel ${level.id}</span>
          <h3>${level.title}</h3>
          <p>${level.description}</p>
          <div class="card-footer">
            <span class="status-pill ${statusClass}">${status}</span>
            <button class="btn btn-small ${unlocked ? "btn-secondary" : "btn-ghost"}" data-open-level="${level.id}" ${unlocked ? "" : "disabled"}>Entrar</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  nodes.levelGrid.querySelectorAll("[data-open-level]").forEach(button => {
    button.addEventListener("click", () => openLevel(Number(button.dataset.openLevel)));
  });

  updateProgressUI();
}

function renderLevel(id) {
  const renderers = {
    1: renderNumber19,
    2: renderAriesCancer,
    3: renderLoveWheel,
    4: renderTemperature,
    5: renderEscapeRoom,
    6: renderCatchHearts,
    7: renderFutureMachine,
    8: renderMiniNosotros,
    9: renderAlexGPT,
    10: renderFinalChest
  };

  renderers[id]();
}

function completeButton(id, enabled = true, label = "Completar nivel") {
  const button = document.createElement("button");
  button.className = "btn btn-primary";
  button.textContent = isCompleted(id) ? "Nivel completado" : label;
  button.disabled = isCompleted(id) || !enabled;
  button.addEventListener("click", () => completeLevel(id));
  return button;
}

function loadLevelRewards() {
  const fallback = { stars: 0, badges: [], wheelInventory: [], wheelSpins: 0 };
  try {
    const parsed = JSON.parse(localStorage.getItem(LEVEL_REWARD_STORAGE_KEY) || "{}");
    return {
      ...fallback,
      ...parsed,
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
      wheelInventory: Array.isArray(parsed.wheelInventory) ? parsed.wheelInventory : []
    };
  } catch {
    return fallback;
  }
}

function saveLevelRewards(rewards) {
  localStorage.setItem(LEVEL_REWARD_STORAGE_KEY, JSON.stringify(rewards));
}

function awardLevelBadge(key, label, stars = 25) {
  const rewards = loadLevelRewards();
  if (rewards.badges.includes(key)) return false;

  rewards.badges.push(key);
  rewards.stars += stars;
  saveLevelRewards(rewards);
  refreshRewardStats();
  showRewardModal(label, stars);
  showToast(`${label} +${stars} estrellas`);
  burst(["✨", "⭐", "❤"]);
  return true;
}

function showRewardModal(label, stars) {
  const existing = document.querySelector("#rewardModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.className = "reward-modal";
  modal.id = "rewardModal";
  modal.innerHTML = `
    <div class="reward-card">
      <span>Insignia desbloqueada</span>
      <strong>${label}</strong>
      <small>+${stars} estrellas</small>
      <button class="btn btn-secondary btn-small" type="button">Guardar brillo</button>
    </div>
  `;

  modal.querySelector("button").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", event => {
    if (event.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add("is-visible"), 20);
  setTimeout(() => modal.remove(), 3600);
}

function rewardStatsMarkup() {
  const rewards = loadLevelRewards();
  return `
    <div class="reward-strip">
      <span>Estrellas de misiones: <strong data-reward-stars>${rewards.stars}</strong></span>
      <span>Insignias: <strong data-reward-badges>${rewards.badges.length}</strong></span>
    </div>
  `;
}

function refreshRewardStats() {
  const rewards = loadLevelRewards();
  document.querySelectorAll("[data-reward-stars]").forEach(node => {
    node.textContent = rewards.stars;
  });
  document.querySelectorAll("[data-reward-badges]").forEach(node => {
    node.textContent = rewards.badges.length;
  });
}

function renderNumber19() {
  const numbers = [7, 14, 23, 19, 8, 12, 19, 21, 19, 4, 7];
  const hitMessages = [
    "Primera señal encontrada: Reina nació con fuego. 🔥",
    "Segunda señal encontrada: Alexander nació con luna. 🌙",
    "Tercera señal encontrada: el destino dejó una coincidencia bonita. ✨"
  ];
  let hits = 0;

  nodes.levelContent.innerHTML = `
    <div class="glass-card mission-intro code19-level">
      <span class="mission-signature">Código 19</span>
      <h3>Nuestro número 19</h3>
      <p>Una pista dorada entre abril y julio. ${CENTRAL_PHRASE}</p>

      ${rewardStatsMarkup()}

      <div class="code19-board">
        <article class="code19-card fire">
          <span>Tarjeta Reina</span>
          <strong>Reina Morales Mendiola</strong>
          <p>19 de abril</p>
          <em>Aries 🔥</em>
        </article>

        <div class="code19-core" id="number19">
          <small>Código compartido</small>
          <strong>19</strong>
        </div>

        <article class="code19-card moon">
          <span>Tarjeta Alexander</span>
          <strong>Alexander Ortiz</strong>
          <p>19 de julio</p>
          <em>Cáncer 🌙</em>
        </article>
      </div>

      <div class="destiny-line" id="destinyLine">
        <div class="destiny-point"><span></span><strong>19 de abril — Reina 🔥</strong></div>
        <div class="destiny-connector"></div>
        <div class="destiny-point"><span></span><strong>19 de julio — Alexander 🌙</strong></div>
      </div>

      <div class="message-box hidden" id="numberResult">Código emocional desbloqueado: abril trajo el fuego, julio trajo la luna y el 19 puso la pista. ✨</div>
      <div class="action-row">
        <button class="btn btn-secondary" id="activate19">Activar código 19</button>
        <span id="numberCompleteSlot"></span>
      </div>
    </div>

    <div class="glass-card find19-card">
      <span class="mission-signature">Mini juego</span>
      <h3>Encuentra el 19</h3>
      <p>Toca el número 19 tres veces para completar la señal.</p>
      <div class="number-cloud" id="numberCloud">
        ${numbers.map((number, index) => `<button class="floating-number" type="button" data-number="${number}" data-index="${index}">${number}</button>`).join("")}
      </div>
      <p class="message-box" id="find19Feedback">El destino escondió tres señales.</p>
    </div>
  `;

  const slot = document.querySelector("#numberCompleteSlot");
  slot.appendChild(completeButton(1, isCompleted(1)));

  document.querySelector("#activate19").addEventListener("click", () => {
    document.querySelector("#number19").classList.add("activated");
    document.querySelector("#numberResult").classList.remove("hidden");
    document.querySelector("#destinyLine").classList.add("is-active");
    awardLevelBadge("signal19", "Señal del destino ✨", 25);
    slot.innerHTML = "";
    slot.appendChild(completeButton(1, true));
    burst(["19", "🔥", "🌙", "✨"]);
  });

  document.querySelectorAll(".floating-number").forEach(button => {
    button.addEventListener("click", () => {
      const feedback = document.querySelector("#find19Feedback");
      if (button.dataset.number !== "19") {
        feedback.textContent = "Ese no era, Reina. El destino dejó una pista más clara. 😅";
        button.classList.add("is-wrong");
        setTimeout(() => button.classList.remove("is-wrong"), 420);
        return;
      }

      if (button.classList.contains("is-found")) return;
      button.classList.add("is-found");
      feedback.textContent = hitMessages[hits];
      hits += 1;
      burst(["19", "✨"]);

      if (hits >= 3) {
        feedback.textContent = "El número 19 no promete nada… pero cuando aparece dos veces, se vuelve difícil ignorarlo. ❤️";
        document.querySelector("#destinyLine").classList.add("is-active");
        awardLevelBadge("signal19", "Señal del destino ✨", 25);
        slot.innerHTML = "";
        slot.appendChild(completeButton(1, true));
      }
    });
  });
}

function renderAriesCancer() {
  let balance = 50;
  let analysisRunning = false;

  nodes.levelContent.innerHTML = `
    <div class="glass-card mission-intro zodiac-level">
      <span class="mission-signature">Fuego de Aries + luna de Cáncer</span>
      <h3>Aries & Cáncer</h3>
      <p class="zodiac-subtitle">Fuego que impulsa. Luna que sostiene.</p>
      <h3>Reina Aries 🔥 + Alexander Cáncer 🌙</h3>
      <p>Fuego y agua. Carácter y corazón. Una mezcla peligrosa, tierna, intensa y difícil de explicar... pero hermosa.</p>
      ${rewardStatsMarkup()}
      <div class="compat-shell"><span class="compat-fill" id="compatFill"></span></div>
      <p class="message-box">Compatibilidad calculada: <strong>96%</strong></p>
    </div>

    <div class="zodiac-cards">
      <button class="zodiac-card fire" type="button">
        <span>Reina Aries 🔥</span>
        <ul>
          <li>Intensidad: 100</li>
          <li>Carácter: 98</li>
          <li>Ternura secreta: 87</li>
          <li>Poder sobre Alexander: infinito</li>
        </ul>
        <p>Reina no entra a una historia para pasar desapercibida. Entra como fuego: se nota, se siente y cambia la temperatura.</p>
      </button>
      <button class="zodiac-card moon" type="button">
        <span>Alexander Cáncer 🌙</span>
        <ul>
          <li>Romanticismo: 100</li>
          <li>Sensibilidad: 95</li>
          <li>Protección: 99</li>
          <li>Resistencia ante Reina: 0</li>
        </ul>
        <p>Alexander siente profundo, cuida demasiado y a veces piensa más de la cuenta. Pero con Reina, hasta su silencio tiene corazón.</p>
      </button>
    </div>

    <div class="glass-card balance-card">
      <span class="mission-signature">Medidor Fuego/Luna</span>
      <div class="balance-scale">
        <span>Demasiada luna</span>
        <strong id="balanceValue">50</strong>
        <span>Demasiado fuego</span>
      </div>
      <div class="balance-track"><span id="balanceNeedle"></span></div>
      <p class="message-box exact-phrase" id="balanceMessage">Equilibrio encontrado: juntos somos la temperatura exacta donde el amor no se quema ni se enfría. ❤️</p>
      <div class="action-row">
        <button class="btn btn-ghost" id="moreMoon" type="button">+ Luna</button>
        <button class="btn btn-secondary" id="balanceReset" type="button">Equilibrar</button>
        <button class="btn btn-ghost" id="moreFire" type="button">+ Fuego</button>
      </div>
    </div>

    <div class="glass-card analysis-card">
      <span class="mission-signature">Diagnóstico romántico</span>
      <button class="btn btn-secondary" id="analyzeCompat" type="button">Analizar compatibilidad</button>
      <div class="message-box" id="analysisOutput">Esperando análisis de fuego, luna y drama romántico.</div>
      <div id="ariesCompleteSlot"></div>
    </div>

    <div class="teaching-grid">
      <article class="glass-card">
        <h3>Reina enseña a Alex</h3>
        <ul>
          <li>A atreverse más.</li>
          <li>A no quedarse tanto pensando.</li>
          <li>A sentir el fuego sin miedo.</li>
          <li>A reaccionar con vida.</li>
        </ul>
      </article>
      <article class="glass-card">
        <h3>Alex enseña a Reina</h3>
        <ul>
          <li>A bajar la guardia.</li>
          <li>A descansar en alguien.</li>
          <li>A no quemarse sola.</li>
          <li>A sentir calma sin perder fuerza.</li>
        </ul>
      </article>
    </div>
    <p class="message-box final-zodiac-line">Ella lo enciende. Él la calma. Y en medio aparece algo que no se explica fácil.</p>
  `;

  const slot = document.querySelector("#ariesCompleteSlot");
  slot.appendChild(completeButton(2, isCompleted(2)));

  const updateBalance = (shouldAward = false) => {
    document.querySelector("#balanceValue").textContent = balance;
    document.querySelector("#balanceNeedle").style.left = `${balance}%`;
    const message = document.querySelector("#balanceMessage");
    message.classList.toggle("exact-phrase", balance >= 45 && balance <= 55);
    if (balance < 45) {
      message.textContent = "Mucha luna: el amor calma, pero puede enfriarse.";
    } else if (balance > 55) {
      message.textContent = "Mucho fuego: el amor arde, pero puede quemar.";
    } else {
      message.textContent = "Equilibrio encontrado: juntos somos la temperatura exacta donde el amor no se quema ni se enfría. ❤️";
      if (shouldAward) {
        awardLevelBadge("fireMoonBalance", "Fuego y Luna en equilibrio 🌙🔥", 25);
        slot.innerHTML = "";
        slot.appendChild(completeButton(2, true));
      }
    }
  };

  document.querySelector("#moreMoon").addEventListener("click", () => {
    balance = Math.max(0, balance - 15);
    updateBalance(true);
  });
  document.querySelector("#moreFire").addEventListener("click", () => {
    balance = Math.min(100, balance + 15);
    updateBalance(true);
  });
  document.querySelector("#balanceReset").addEventListener("click", () => {
    balance = 50;
    updateBalance(true);
    burst(["🔥", "🌙", "❤"]);
  });

  document.querySelector("#analyzeCompat").addEventListener("click", () => {
    if (analysisRunning) return;
    analysisRunning = true;
    const output = document.querySelector("#analysisOutput");
    const steps = [
      "Analizando fuego de Aries…",
      "Analizando luna de Cáncer…",
      "Calculando drama romántico…",
      "Buscando temperatura exacta…"
    ];
    let index = 0;
    output.textContent = steps[index];
    const timer = setInterval(() => {
      index += 1;
      if (index < steps.length) {
        output.textContent = steps[index];
        return;
      }
      clearInterval(timer);
      output.innerHTML = `
        <strong>Compatibilidad: 96%</strong><br>
        Riesgo: discusiones con intensidad.<br>
        Recompensa: reconciliaciones con ternura.<br>
        Diagnóstico final: caos bonito con potencial de historia grande. ❤️
      `;
      awardLevelBadge("fireMoonBalance", "Fuego y Luna en equilibrio 🌙🔥", 25);
      slot.innerHTML = "";
      slot.appendChild(completeButton(2, true));
      analysisRunning = false;
      burst(["🔥", "🌙", "✨"]);
    }, 620);
  });

  requestAnimationFrame(() => {
    document.querySelector("#compatFill").style.width = "96%";
    updateBalance(false);
  });
}

function renderLoveWheel() {
  const prizes = [
    { category: "❤️ Premio romántico", rarity: "Común", text: "Premio: un mensaje bonito de Alex." },
    { category: "❤️ Premio romántico", rarity: "Raro", text: "Premio: un abrazo largo cuando se vean." },
    { category: "🔥 Reto coqueto elegante", rarity: "Especial", text: "Reto: mandale a Alex un emoji que describa cómo te hizo sentir esta app." },
    { category: "😂 Reto divertido", rarity: "Común", text: "Reto: sacale captura a tu parte favorita y mandásela a Alex." },
    { category: "🌙 Confesión de Alex", rarity: "Raro", text: "Confesión: Alex se hace el tranquilo, pero vos le movés el corazón más de lo que admite." },
    { category: "👑 Privilegio de Reina", rarity: "Épico", text: "Privilegio: Reina puede elegir el próximo tema de conversación." },
    { category: "✨ Sorpresa del destino", rarity: "Legendario", text: "Sorpresa: el número 19 vuelve a aparecer como pista de ustedes." },
    { category: "❤️ Premio romántico", rarity: "Épico", text: "Premio: una cita sorpresa planeada por Alex." },
    { category: "👑 Privilegio de Reina", rarity: "Legendario", text: "Privilegio: Reina puede reclamar un abrazo largo sin límite de tiempo." },
    { category: "🌙 Confesión de Alex", rarity: "Especial", text: "Confesión: a Alex le gusta tu fuego, pero también esa ternura que escondés." },
    { category: "🔥 Reto coqueto elegante", rarity: "Raro", text: "Reto: preguntale a Alex algo que nunca le preguntaste." },
    { category: "😂 Reto divertido", rarity: "Especial", text: "Reto: mandale un audio diciendo 'nivel completado'." },
    { category: "❤️ Premio romántico", rarity: "Especial", text: "Premio: un mensaje de buenas noches especial." },
    { category: "✨ Sorpresa del destino", rarity: "Épico", text: `Sorpresa: desbloqueaste una frase secreta: ${CENTRAL_PHRASE}` },
    { category: "👑 Privilegio de Reina", rarity: "Raro", text: "Privilegio: Reina tiene derecho a pedir un mimo extra." }
  ];
  let rewards = loadLevelRewards();
  let spins = rewards.wheelSpins || 0;

  nodes.levelContent.innerHTML = `
    <div class="glass-card mission-intro love-wheel-level">
      <span class="mission-signature">Ruleta rosa del amor</span>
      <h3>Ruleta del amor</h3>
      <p>Girá la ruleta y descubrí qué le debe el corazón de Alexander a Reina.</p>
      ${rewardStatsMarkup()}
      <div class="wheel-stage">
        <div class="wheel-pointer"></div>
        <div class="wheel" id="loveWheel"><span>GIRAR</span></div>
      </div>
      <div class="result-box wheel-result" id="wheelResult">La ruleta espera a Reina.</div>
      <div class="action-row">
        <button class="btn btn-secondary" id="spinWheel">Girar ruleta</button>
        <button class="btn btn-ghost" id="showInventory" type="button">Ver premios ganados</button>
        <button class="btn btn-ghost" id="clearInventory" type="button">Limpiar premios</button>
        <span id="wheelCompleteSlot"></span>
      </div>
    </div>
    <div class="glass-card inventory-card" id="inventoryCard">
      <span class="mission-signature">Inventario</span>
      <h3>Premios ganados por Reina</h3>
      <div class="inventory-list" id="inventoryList"></div>
    </div>
  `;

  const slot = document.querySelector("#wheelCompleteSlot");
  slot.appendChild(completeButton(3, spins >= 3 || isCompleted(3)));

  const renderInventory = () => {
    rewards = loadLevelRewards();
    const list = document.querySelector("#inventoryList");
    if (!rewards.wheelInventory.length) {
      list.innerHTML = `<p class="message-box">Todavía no hay premios guardados. Reina tiene que girar la ruleta.</p>`;
      return;
    }
    list.innerHTML = rewards.wheelInventory.map(item => `
      <article class="inventory-item rarity-${normalizeText(item.rarity)}">
        <span>${item.category}</span>
        <strong>${item.rarity}</strong>
        <p>${item.text}</p>
      </article>
    `).join("");
  };

  document.querySelector("#spinWheel").addEventListener("click", () => {
    spins += 1;
    const prize = randomItem(prizes);
    rewards = loadLevelRewards();
    rewards.wheelSpins = spins;
    rewards.wheelInventory = [prize, ...rewards.wheelInventory].slice(0, 10);
    saveLevelRewards(rewards);

    document.querySelector("#loveWheel").style.transform = `rotate(${spins * 540 + Math.floor(Math.random() * 180)}deg)`;
    document.querySelector("#wheelResult").innerHTML = `
      <span>${prize.category}</span>
      <strong>${prize.rarity}</strong>
      <p>${prize.text}</p>
    `;
    renderInventory();
    burst(["❤", "✨", "👑"]);
    if (spins >= 3) {
      document.querySelector("#wheelResult").insertAdjacentHTML("beforeend", `<p class="wheel-master">Ruleta dominada por Reina 👑</p>`);
      awardLevelBadge("wheelQueen", "Ruleta dominada por Reina 👑", 25);
      slot.innerHTML = "";
      slot.appendChild(completeButton(3, true));
    }
  });

  document.querySelector("#showInventory").addEventListener("click", () => {
    document.querySelector("#inventoryCard").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  document.querySelector("#clearInventory").addEventListener("click", () => {
    rewards = loadLevelRewards();
    rewards.wheelInventory = [];
    saveLevelRewards(rewards);
    renderInventory();
    showToast("Premios de la ruleta limpiados. El progreso sigue intacto.");
  });

  renderInventory();
}

function renderTemperature() {
  const zones = [
    {
      id: "very-cold",
      min: 0,
      max: 20,
      state: "Muy frío 🌙",
      messages: [
        "Mucha luna, mi Reina… aquí el amor se enfría un poquito. 🌙",
        "Demasiada distancia emocional. Alex necesita acercarse un poco más.",
        "Frío detectado: falta una sonrisa de Reina para subir el calor.",
        "Modo hielo activado… esto necesita un abrazo urgente.",
        "Aquí hay calma, pero falta fuego."
      ],
      final: "Casi, mi Reina… pero ahí hay demasiada luna. El amor también necesita calorcito. Intentá otra vez. 🌙"
    },
    {
      id: "fresh",
      min: 21,
      max: 39,
      state: "Falta calorcito",
      messages: [
        "Va mejorando… ya se siente una chispita.",
        "Todavía falta calorcito, pero la luna ya empezó a mirar al fuego.",
        "Alex está intentando no ponerse intenso tan rápido.",
        "La temperatura sube lento, como conversación bonita.",
        "Un poquito más y esto empieza a sentirse peligroso."
      ],
      final: "Está cerca, pero todavía falta ese fuego tuyo que despierta a Alex. Probá otra vez. 🔥"
    },
    {
      id: "exact",
      min: 40,
      max: 60,
      state: "Temperatura exacta ❤️",
      messages: [
        "Ahí está… ni demasiado fuego, ni demasiada luna.",
        "Temperatura exacta encontrada: aquí el amor respira bonito.",
        "Reina pone el fuego. Alex pone la calma. Esto empieza a equilibrarse.",
        `${CENTRAL_PHRASE} ❤️`,
        "Este es el punto: sentir sin quemarse, cuidar sin enfriarse.",
        "Fuego suficiente para sentir. Calma suficiente para quedarse."
      ],
      final: `<strong>Temperatura exacta encontrada.</strong><br>${CENTRAL_PHRASE} ❤️`
    },
    {
      id: "hot",
      min: 61,
      max: 80,
      state: "Mucho fuego 🔥",
      messages: [
        "Mucho fuego, Reina… Alex ya empezó a perder la calma. 🔥",
        "La intensidad subió. Todavía es bonito, pero cuidado con quemar el sistema.",
        "Aries tomó el control del termómetro.",
        "AlexGPT recomienda respirar antes de que el corazón se acelere demasiado.",
        "Aquí ya hay química, pero falta un poquito de luna."
      ],
      final: "Hay fuego, hay química, hay peligro… pero falta un poquito de calma para que no se queme. Intentá otra vez. 🔥"
    },
    {
      id: "too-hot",
      min: 81,
      max: 100,
      state: "Peligro de incendio emocional 🔥",
      messages: [
        "Peligro: Reina subió demasiado la temperatura. Alex no responde por daños emocionales. 😅",
        "Demasiado fuego, amor… aquí el amor se puede quemar un poquito.",
        "Sistema sobrecalentado: se recomienda abrazo, calma y mirada bonita.",
        "Modo Aries extremo activado. Alex está buscando agua emocional.",
        "Esto ya no es temperatura exacta, esto es incendio con nombre de Reina."
      ],
      final: "Reina, bajemos un poquito la intensidad… Alex todavía quiere sobrevivir a esta app. 😅"
    }
  ];
  const rounds = [
    { name: "Sonrisa", start: "El amor empieza con una sonrisa.", success: "Primera temperatura exacta: una sonrisa tuya ya mueve todo." },
    { name: "Química", start: "La química aparece cuando fuego y luna dejan de competir.", success: "Segunda temperatura exacta: ya no es casualidad, esto tiene química." },
    { name: "Equilibrio", start: "El equilibrio nace cuando ninguno intenta apagar al otro.", success: "Tercera temperatura exacta: Reina y Alex encontraron su punto bonito." }
  ];
  let temp = 0;
  let direction = 1;
  let active = false;
  let roundIndex = 0;
  let exactHits = 0;
  let lastZoneId = "";

  nodes.levelContent.innerHTML = `
    <div class="glass-card mission-intro temperature-card exact-temp-level">
      <span class="mission-signature">Termómetro de la temperatura exacta</span>
      <h3>Sube la temperatura</h3>
      <p>${CENTRAL_PHRASE}</p>
      ${rewardStatsMarkup()}
      <div class="round-panel">
        <span>Ronda <strong id="roundCount">1/3</strong></span>
        <strong id="roundName">Sonrisa</strong>
        <p id="roundMessage">El amor empieza con una sonrisa.</p>
      </div>
      <div class="thermo-shell live-thermo" data-zone="very-cold">
        <div class="temp-value"><span>Temperatura emocional</span><span id="tempLabel">0%</span></div>
        <div class="temperature-shell"><span class="temperature-fill" id="temperatureFill"></span><i class="temperature-target" aria-hidden="true"></i></div>
        <div class="zone-labels" aria-hidden="true"><span>0</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100</span></div>
      </div>
      <div class="temperature-status" id="temperatureStatus">Muy frío 🌙</div>
      <p class="message-box" id="temperatureMessage"><strong>Mensaje de temperatura:</strong><br>Mucha luna, mi Reina… aquí el amor se enfría un poquito. 🌙</p>
      <p class="message-box hidden" id="temperatureFinal"></p>
      <div class="action-row">
        <button class="btn btn-secondary" id="startTemp">Iniciar temperatura</button>
        <button class="btn btn-ghost" id="stopTemp" disabled>Detener temperatura</button>
        <button class="btn btn-ghost" id="resetTemp">Reiniciar nivel</button>
        <span id="temperatureCompleteSlot"></span>
      </div>
    </div>
  `;

  const slot = document.querySelector("#temperatureCompleteSlot");
  slot.appendChild(completeButton(4, isCompleted(4)));
  const currentZone = () => zones.find(zone => temp >= zone.min && temp <= zone.max) || zones[0];

  const updateRound = () => {
    const round = rounds[Math.min(roundIndex, rounds.length - 1)];
    document.querySelector("#roundCount").textContent = `${Math.min(roundIndex + 1, 3)}/3`;
    document.querySelector("#roundName").textContent = round.name;
    document.querySelector("#roundMessage").textContent = round.start;
  };

  const updateTemperature = (forceMessage = false) => {
    const zone = currentZone();
    document.querySelector("#tempLabel").textContent = `${temp}%`;
    document.querySelector("#temperatureFill").style.width = `${temp}%`;
    document.querySelector(".live-thermo").dataset.zone = zone.id;
    document.querySelector("#temperatureStatus").textContent = zone.state;
    if (forceMessage || zone.id !== lastZoneId) {
      const temperatureMessage = document.querySelector("#temperatureMessage");
      temperatureMessage.classList.toggle("exact-phrase", zone.id === "exact");
      temperatureMessage.innerHTML = `<strong>Mensaje de temperatura:</strong><br>${randomItem(zone.messages)}`;
      lastZoneId = zone.id;
    }
  };

  const stopTemperature = () => {
    if (!active) return;
    active = false;
    clearInterval(temperatureTimer);
    temperatureTimer = null;
    document.querySelector("#startTemp").disabled = false;
    document.querySelector("#stopTemp").disabled = true;
    const zone = currentZone();
    const final = document.querySelector("#temperatureFinal");
    final.classList.remove("hidden");
    final.classList.toggle("exact-phrase", zone.id === "exact");
    final.innerHTML = zone.final;

    if (zone.id !== "exact") {
      burst(zone.id.includes("hot") ? ["🔥", "🌙"] : ["🌙", "✨"]);
      return;
    }

    const round = rounds[roundIndex];
    exactHits += 1;
    final.innerHTML = `${zone.final}<br>${round.success}`;
    roundIndex += 1;
    burst(["❤", "🌡️", "✨"]);

    if (exactHits >= 3) {
      final.innerHTML = `<strong>Reina encontró nuestra temperatura exacta:</strong><br>fuego suficiente para sentir, calma suficiente para quedarse. ❤️`;
      awardLevelBadge("exactTemperature", "Temperatura exacta 🌡️❤️", 30);
      slot.innerHTML = "";
      slot.appendChild(completeButton(4, true));
      return;
    }

    temp = 0;
    direction = 1;
    lastZoneId = "";
    updateRound();
    updateTemperature(true);
  };

  const startTemperature = () => {
    if (active || exactHits >= 3) return;
    active = true;
    document.querySelector("#startTemp").disabled = true;
    document.querySelector("#stopTemp").disabled = false;
    document.querySelector("#temperatureFinal").classList.add("hidden");
    updateTemperature(true);
    temperatureTimer = setInterval(() => {
      temp += direction * 4;
      if (temp >= 100) {
        temp = 100;
        direction = -1;
      }
      if (temp <= 0) {
        temp = 0;
        direction = 1;
      }
      updateTemperature(false);
    }, 120);
  };

  const resetTemperature = () => {
    active = false;
    clearInterval(temperatureTimer);
    temperatureTimer = null;
    temp = 0;
    direction = 1;
    roundIndex = 0;
    exactHits = 0;
    lastZoneId = "";
    document.querySelector("#startTemp").disabled = false;
    document.querySelector("#stopTemp").disabled = true;
    document.querySelector("#temperatureFinal").classList.add("hidden");
    slot.innerHTML = "";
    slot.appendChild(completeButton(4, isCompleted(4)));
    updateRound();
    updateTemperature(true);
    showToast("Termómetro reiniciado. Reina puede buscar la temperatura exacta otra vez.");
  };

  document.querySelector("#startTemp").addEventListener("click", startTemperature);
  document.querySelector("#stopTemp").addEventListener("click", stopTemperature);
  document.querySelector("#resetTemp").addEventListener("click", resetTemperature);
  updateRound();
  updateTemperature(true);
}

function renderEscapeRoom() {
  const questions = [
    { title: "La puerta de la Luna 🌙", q: "¿Qué signo es Alex?", options: ["Aries", "Cáncer", "Leo"], answer: "Cáncer", hint: "Alex es más luna que fuego, aunque a veces se haga el fuerte.", correct: "Puerta abierta: entendiste que Alex siente más de lo que dice.", unlocked: "Alex no siempre sabe decir todo, pero contigo siente más de lo que muestra.", wrong: { Aries: "Casi, pero ese fuego es más de Reina. Alex es más luna, aunque a veces se haga el valiente. 🌙", Leo: "Leo suena poderoso, pero Alex no ruge tanto… él siente en silencio como buen Cáncer. 😅" } },
    { title: "La puerta del 19 ✨", q: "¿Qué número comparten Reina y Alex?", options: ["7", "19", "23"], answer: "19", hint: "Abril y julio dejaron la misma señal.", correct: "Puerta abierta: el destino dejó una pista pequeña, pero bonita.", unlocked: "El 19 no promete destino, pero sí dejó una coincidencia bonita.", wrong: { "7": "El 7 es bonito, pero esta historia tiene otro número escondido entre abril y julio. ✨", "23": "Ese número no abrió la puerta. El destino dejó una pista más exacta: pensá en sus cumpleaños." } },
    { title: "La puerta de la debilidad 😅", q: "¿Qué baja la autoridad de Alex?", options: ["La mirada de Reina", "El sueño", "El internet lento"], answer: "La mirada de Reina", hint: "Alex puede intentar ser firme, pero hay algo de Reina que lo desarma.", correct: "Puerta abierta: autoridad de Alex reducida al 0%.", unlocked: "Tu mirada tiene acceso especial a zonas vulnerables del corazón de Alex.", wrong: { "El sueño": "El sueño lo puede debilitar, sí… pero no tanto como una mirada tuya cuando querés convencerlo. 😅", "El internet lento": "El internet lento molesta, pero tu mirada tiene más poder que cualquier falla de señal. 📶❤️" } },
    { title: "La puerta de la temperatura 🌡️", q: "¿Cuál es la frase que representa a Reina y Alex?", options: ["El amor todo lo puede", CENTRAL_PHRASE, "El destino siempre gana"], answer: CENTRAL_PHRASE, hint: "No es demasiado fuego ni demasiada luna.", correct: "Puerta abierta: encontraste el equilibrio entre fuego y luna.", unlocked: "Fuego suficiente para sentir, calma suficiente para quedarse.", wrong: { "El amor todo lo puede": "Bonita frase, pero muy genérica para ustedes. Lo suyo tiene fuego, luna y una temperatura exacta. ❤️", "El destino siempre gana": "El destino dejó pistas, sí… pero la frase de ustedes habla de equilibrio, no de rendirse al destino." } },
    { title: "La puerta final ❤️", q: "¿Qué necesita Alex para abrir completamente su corazón?", options: ["Que Reina sonría", "Que Reina mande", "Que Reina lo entienda un poquito"], answer: "Que Reina lo entienda un poquito", hint: "Más que ganar, Alex quiere sentirse entendido.", correct: "Puerta final abierta: no saliste del corazón de Alex… encontraste un lugar dentro de él.", unlocked: "El corazón de Alex no se abre con presión; se abre con Reina siendo Reina.", wrong: { "Que Reina sonría": "Tu sonrisa abre muchas puertas, Reina… pero esta última pide algo más profundo que una sonrisa bonita. ❤️", "Que Reina mande": "Jajaja, Reina mandando abre casi todo por decreto real 👑, pero el corazón completo de Alex se abre cuando siente que lo entendés." } }
  ];
  let index = 0;
  let lives = 3;
  const phrases = [];

  nodes.levelContent.innerHTML = `
    <div class="glass-card mission-intro escape-level">
      <span class="mission-signature">Puertas secretas del corazón</span>
      <h3>Escape Room del corazón de Alex</h3>
      <p>Abre cinco puertas con 3 vidas, pistas y frases escondidas.</p>
      ${rewardStatsMarkup()}
      <div class="escape-hud">
        <span>Vidas: <strong id="escapeLives">❤️❤️❤️</strong></span>
        <span>Puerta: <strong id="escapeProgress">1/5</strong></span>
      </div>
      <div class="door-grid escape-doors" id="doorGrid">${questions.map((item, i) => `<div class="door-row"><span class="door" id="door${i}">🚪</span><strong>Puerta ${i + 1}</strong><small>${item.title}</small></div>`).join("")}</div>
    </div>
    <div class="glass-card escape-question-card" id="questionCard"></div>
    <div class="glass-card phrase-vault">
      <span class="mission-signature">Frases desbloqueadas</span>
      <div id="phraseList"><p class="message-box">Las frases aparecen al abrir puertas.</p></div>
    </div>
    <div id="escapeCompleteSlot"></div>
  `;

  const slot = document.querySelector("#escapeCompleteSlot");
  slot.appendChild(completeButton(5, isCompleted(5)));

  const updateHud = () => {
    document.querySelector("#escapeLives").textContent = "❤️".repeat(lives) || "0";
    document.querySelector("#escapeProgress").textContent = `${Math.min(index + 1, 5)}/5`;
  };

  const renderPhrases = () => {
    document.querySelector("#phraseList").innerHTML = phrases.length
      ? phrases.map(phrase => `<p class="message-box unlocked-phrase">${phrase}</p>`).join("")
      : `<p class="message-box">Las frases aparecen al abrir puertas.</p>`;
  };

  const restartEscape = () => {
    index = 0;
    lives = 3;
    phrases.length = 0;
    document.querySelectorAll(".door").forEach(door => {
      door.classList.remove("open");
      door.textContent = "🚪";
    });
    slot.innerHTML = "";
    slot.appendChild(completeButton(5, isCompleted(5)));
    updateHud();
    renderPhrases();
    renderQuestion();
  };

  const loseEscape = () => {
    const card = document.querySelector("#questionCard");
    card.innerHTML = `
      <h3>El corazón de Alex se puso dramático.</h3>
      <p class="message-box">Intentá otra vez. 😅</p>
      <button class="btn btn-secondary" id="restartEscape" type="button">Reiniciar Escape Room</button>
    `;
    document.querySelector("#restartEscape").addEventListener("click", restartEscape);
  };

  const renderQuestion = () => {
    const card = document.querySelector("#questionCard");
    updateHud();
    if (index >= questions.length) {
      card.innerHTML = `
        <h3>Escape Room completado.</h3>
        <p class="message-box exact-phrase">Reina encontró una parte secreta del corazón de Alex.</p>
      `;
      awardLevelBadge("heartGuardian", "Guardiana del corazón de Alex 🔐❤️", 40);
      slot.innerHTML = "";
      slot.appendChild(completeButton(5, true));
      burst(["❤", "🚪", "✨"]);
      return;
    }

    const item = questions[index];
    card.innerHTML = `
      <span class="mission-signature">${item.title}</span>
      <h3>${item.q}</h3>
      <div class="escape-options">
        ${item.options.map(option => `<button class="btn btn-ghost" data-answer="${option}">${option}</button>`).join("")}
      </div>
      <button class="btn btn-secondary btn-small" id="showHint" type="button">Pista</button>
      <p class="message-box hidden" id="escapeHint">${item.hint}</p>
      <p class="message-box hidden" id="escapeFeedback"></p>
    `;

    document.querySelector("#showHint").addEventListener("click", () => {
      document.querySelector("#escapeHint").classList.remove("hidden");
    });

    card.querySelectorAll("[data-answer]").forEach(button => {
      button.addEventListener("click", () => {
        const feedback = document.querySelector("#escapeFeedback");
        feedback.classList.remove("hidden");
        if (button.dataset.answer === item.answer) {
          feedback.textContent = item.correct;
          phrases.push(item.unlocked);
          renderPhrases();
          document.querySelector(`#door${index}`).classList.add("open");
          document.querySelector(`#door${index}`).textContent = "❤";
          index += 1;
          updateHud();
          setTimeout(renderQuestion, 520);
        } else {
          lives -= 1;
          updateHud();
          feedback.innerHTML = `<strong>Vida perdida: ❤️</strong><br>${item.wrong[button.dataset.answer] || "Esa respuesta no abre esta puerta, mi Reina."}`;
          button.disabled = true;
          if (lives <= 0) {
            setTimeout(loseEscape, 620);
          }
        }
      });
    });
  };

  renderQuestion();
}

function renderCatchHearts() {
  let score = 0;
  let time = 20;
  const items = [
    { icon: "❤", points: 10 },
    { icon: "🌙", points: 15 },
    { icon: "🔥", points: 20 },
    { icon: "✨", points: 5 }
  ];

  nodes.levelContent.innerHTML = `
    <div class="glass-card mission-intro">
      <span class="mission-signature">Señales en movimiento</span>
      <div class="game-hud">
        <span>Tiempo: <strong id="catchTime">20</strong>s</span>
        <span>Puntaje: <strong id="catchScore">0</strong></span>
      </div>
      <div class="game-area" id="gameArea"></div>
      <p class="message-box" id="catchMessage">Toca las señales que aparezcan. Objetivo: 100 puntos.</p>
      <div class="action-row">
        <button class="btn btn-secondary" id="startCatch">Iniciar juego</button>
        <span id="catchCompleteSlot"></span>
      </div>
    </div>
  `;

  const slot = document.querySelector("#catchCompleteSlot");
  slot.appendChild(completeButton(6, isCompleted(6)));

  document.querySelector("#startCatch").addEventListener("click", () => {
    stopCatchGame();
    score = 0;
    time = 20;
    updateCatchHud(score, time);
    document.querySelector("#gameArea").innerHTML = "";
    document.querySelector("#catchMessage").textContent = "Atrapa corazones, lunas, fuego y estrellas.";
    document.querySelector("#startCatch").textContent = "Intentar otra vez";

    catchSpawner = setInterval(() => spawnCatchItem(items, points => {
      score += points;
      updateCatchHud(score, time);
      if (score >= 100) {
        winCatchGame(slot);
      }
    }), 650);

    catchTimer = setInterval(() => {
      time -= 1;
      updateCatchHud(score, time);
      if (time <= 0) {
        stopCatchGame();
        if (score >= 100) {
          winCatchGame(slot);
        } else {
          document.querySelector("#catchMessage").textContent = "Casi. Reina puede intentar otra vez.";
        }
      }
    }, 1000);
  });
}

function updateCatchHud(score, time) {
  document.querySelector("#catchScore").textContent = score;
  document.querySelector("#catchTime").textContent = time;
}

function spawnCatchItem(items, onCatch) {
  const area = document.querySelector("#gameArea");
  if (!area) return;
  const item = randomItem(items);
  const el = document.createElement("button");
  el.className = "catch-item";
  el.type = "button";
  el.textContent = item.icon;
  el.style.left = `${Math.random() * 78 + 4}%`;
  el.style.top = `${Math.random() * 72 + 8}%`;
  el.addEventListener("click", () => {
    onCatch(item.points);
    el.remove();
    vibrate(12);
  });
  area.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function winCatchGame(slot) {
  stopCatchGame();
  document.querySelector("#catchMessage").textContent = "Reina atrapó suficientes señales para desbloquear una confesión. Me gusta que seas fuego, porque yo a veces soy demasiada luna. Vos me despiertas, yo te cuido. ❤";
  slot.innerHTML = "";
  slot.appendChild(completeButton(6, true));
  burst(["❤", "🌙", "🔥", "✨"]);
}

function stopCatchGame() {
  clearInterval(catchTimer);
  clearInterval(catchSpawner);
  clearInterval(temperatureTimer);
  catchTimer = null;
  catchSpawner = null;
  temperatureTimer = null;
}

function renderFutureMachine() {
  const futures = [
    "Futuro #19: Reina dice que no tiene hambre. Alexander compra comida igual. Decisión correcta.",
    "Futuro #27: Discuten por una película y terminan abrazados.",
    "Futuro #42: Viajan juntos, se pierden y encuentran una historia para contar.",
    "Futuro #88: Reina manda con carácter, Alexander negocia con ternura.",
    "Futuro #100: No todo sale perfecto, pero se siguen eligiendo.",
    "Futuro #7: Reina se enoja un poquito, Alexander intenta arreglarlo con humor y algo dulce.",
    "Futuro #33: Alexander mira a Reina y vuelve a pensar: sí, valió la pena.",
    "Futuro #55: Una casa, una risa, una discusión pequeña y un abrazo grande.",
    "Futuro #77: Reina dice 'yo tenía razón'. Alexander confirma en silencio.",
    "Futuro #99: El futuro no se apura, pero imaginarlo con Reina se siente bonito."
  ];
  let seen = 0;

  nodes.levelContent.innerHTML = `
    <div class="glass-card mission-intro">
      <span class="mission-signature">Oráculo del destino</span>
      <div class="treasure" aria-hidden="true">🔮</div>
      <p class="result-box" id="futureResult">La máquina está esperando una pregunta del futuro.</p>
      <div class="action-row">
        <button class="btn btn-secondary" id="seeFuture">Ver futuro</button>
        <span id="futureCompleteSlot"></span>
      </div>
    </div>
  `;

  const slot = document.querySelector("#futureCompleteSlot");
  slot.appendChild(completeButton(7, isCompleted(7)));

  document.querySelector("#seeFuture").addEventListener("click", () => {
    seen += 1;
    document.querySelector("#futureResult").textContent = "Calculando...";
    setTimeout(() => {
      document.querySelector("#futureResult").textContent = randomItem(futures);
      burst(["✨", "🌙"]);
      if (seen >= 3) {
        slot.innerHTML = "";
        slot.appendChild(completeButton(7, true));
      }
    }, 480);
  });
}

function renderMiniNosotros() {
  const cards = [
    ["Si hereda tu carácter de Aries", "Si hereda tu carácter de Aries, amor... ya me veo negociando con una mini jefa que va a decir 'no' con autoridad incluso antes de aprender a hablar. Y lo peor es que seguro me va a mirar igual que vos, y ahí voy a perder toda autoridad. 😅❤"],
    ["Si hereda mi corazón de Cáncer", "Si hereda mi corazón de Cáncer, va a ser sensible, intenso y medio dramático bonito. De esos que aman fuerte, se encariñan profundo y hacen berrinche con sentimiento. Básicamente: ternura con tormenta incluida. 🌙"],
    ["Si hereda tu mirada", "Si hereda tu mirada, estoy perdido. Porque una sola carita me va a convencer de todo. Si vos ya me haces débil con esa mirada, imaginate una mini versión tuya pidiéndome algo. ❤"],
    ["Si hereda mi forma de amarte", "Si hereda mi forma de amar, va a cuidar con todo el corazón. Tal vez sea intenso, sí, pero de esos intensos que no abandonan, que protegen, que se quedan cuando algo vale la pena. ❤"],
    ["Si hereda lo mejor de los dos", "Si hereda lo mejor de los dos, será puro amor con carácter. Un corazoncito fuerte, noble, tierno, intenso, terco y lleno de vida. Una mezcla de fuego y agua... difícil de explicar, imposible de no amar. ❤🔥🌙"]
  ];
  const roulette = [
    "Heredó tu carácter de Aries y mi paciencia de Cáncer. Resultado: yo perdiendo discusiones desde el día uno. 😅",
    "Heredó tu mirada y mi romanticismo. Resultado: manipulación emocional nivel ternura máxima. ❤",
    "Heredó tu fuego y mi sensibilidad. Resultado: una personita intensa, dulce y peligrosamente adorable. 🔥🌙",
    "Heredó tu belleza y mi corazón. Resultado: oficialmente voy a ser el papá más débil del mundo.",
    "Heredó el número 19 de los dos. Resultado: destino haciendo de las suyas otra vez. ✨"
  ];
  const opened = new Set();
  let spun = false;

  nodes.levelContent.innerHTML = `
    <div class="glass-card mission-intro">
      <span class="mission-signature">Ternura del futuro</span>
      <h3>Si algún día la vida nos regala mini nosotros...</h3>
      <p>Reina Morales Mendiola, Aries nacida el 19 de abril. Alexander Ortiz, Cáncer nacido el 19 de julio. Fuego y agua. Carácter y corazón. Una mezcla peligrosa, tierna y probablemente muy difícil de criar... pero hermosa. ❤</p>
    </div>
    <div class="mini-grid">
      ${cards.map((card, index) => `<article class="flip-card" data-mini-card="${index}"><h3>${card[0]}</h3><p>${card[1]}</p></article>`).join("")}
    </div>
    <div class="glass-card mission-intro">
      <h3>¿Qué heredaría nuestro bebé?</h3>
      <div class="wheel" id="miniWheel"></div>
      <p class="result-box" id="miniResult">La ruleta de mini nosotros espera.</p>
      <div class="action-row">
        <button class="btn btn-secondary" id="spinMini">Girar ruleta de mini nosotros</button>
        <span id="miniCompleteSlot"></span>
      </div>
    </div>
  `;

  const slot = document.querySelector("#miniCompleteSlot");
  slot.appendChild(completeButton(8, isCompleted(8)));
  const checkReady = () => {
    if (opened.size >= 3 && spun) {
      slot.innerHTML = "";
      slot.appendChild(completeButton(8, true));
    }
  };

  nodes.levelContent.querySelectorAll("[data-mini-card]").forEach(card => {
    card.addEventListener("click", () => {
      card.classList.toggle("is-open");
      if (card.classList.contains("is-open")) opened.add(card.dataset.miniCard);
      checkReady();
    });
  });

  document.querySelector("#spinMini").addEventListener("click", () => {
    spun = true;
    document.querySelector("#miniWheel").style.transform = `rotate(${540 + Math.floor(Math.random() * 270)}deg)`;
    document.querySelector("#miniResult").textContent = randomItem(roulette);
    burst(["❤", "🔥", "🌙"]);
    checkReady();
  });
}

const alexOpenings = [
  "Reina, te respondo como Alex lo haría...",
  "Mi Reina, esa pregunta tiene peligro emocional...",
  "A ver, consultando el corazón de Alex...",
  "Modo Cáncer activado...",
  "Respuesta con fuego, luna y un poco de drama bonito...",
  "Te diría esto sin hacerme tanto el profundo...",
  "Si Alex pudiera responderte ahora, probablemente diría...",
  "Pregunta registrada en zona sensible del corazón...",
  "Reina, esa pregunta merece una respuesta bonita...",
  "Voy a responderte con calma, amor...",
  "Sistema emocional de Alex cargando...",
  "Eso sonó a pregunta de Reina poniendo a prueba a AlexGPT...",
  "Mi Reina, esa duda no pasa desapercibida...",
  "Respuesta honesta, sin vueltas...",
  "Te contesto con el corazón en modo luna...",
  "Fuego de Aries detectado, calma de Cáncer activada...",
  "AlexGPT acaba de ponerse serio un segundo...",
  "Esa pregunta tocó una fibra bonita...",
  "Reina, vení, esta respuesta es para vos...",
  "Voy a decirlo suave, pero claro...",
  "El corazón de Alexander acaba de levantar la mano...",
  "Esta respuesta viene con ternura controlada...",
  "AlexGPT revisó fuego, luna y memoria emocional...",
  "Mi Reina, esa pregunta tiene brillo propio...",
  "Te respondo sin prometer de más...",
  "Acomodando sentimientos antes de contestar...",
  "Modo Alexander sensible, pero funcional...",
  "Reina, no voy a esquivar esa pregunta...",
  "El sistema detectó curiosidad peligrosa...",
  "Voy con una respuesta corta, pero sentida...",
  "AlexGPT bajó el volumen del drama y subió la honestidad...",
  "Mi Reina, esa pregunta merece cuidado...",
  "Te contesto como si fuera un mensaje de madrugada...",
  "Corazón de Cáncer conectado...",
  "Fuego de Aries reconocido, luna lista para responder...",
  "Alex probablemente sonreiría antes de decir esto...",
  "Respuesta emocional, versión sin exagerar demasiado...",
  "Reina, esto va con cariño y cabeza...",
  "Consultando archivos secretos del corazón...",
  "AlexGPT confirma que esta pregunta no es cualquiera..."
];

const alexClosings = [
  "Y sí, con vos Alex se pone un poquito más intenso. ❤️",
  "No lo digas muy fuerte, pero eso lo desordena bonito.",
  "Firma: AlexGPT, versión corazón sensible.",
  "Conclusión: Reina sigue teniendo ventaja emocional.",
  "Eso dice el sistema... y el corazón también.",
  "No es exageración, es Cáncer siendo Cáncer. 🌙",
  "Fin del informe romántico.",
  "Archivo guardado en el corazón de Alexander.",
  "Y no, no estoy exagerando tanto.",
  "Bueno... tal vez un poquito.",
  "Resultado: Reina gana otra vez.",
  "Recomendación: reclamar abrazo pendiente.",
  "Conclusión técnica: hay amor acumulado.",
  "Modo Alex emocional desactivado... por ahora.",
  "Eso merece una sonrisa tuya.",
  "No uses esta respuesta para hacerte más poderosa, aunque sé que lo harás. 😅",
  "Cuidado: esta respuesta puede causar ternura.",
  "El corazón de Alex confirma.",
  "La luna lo firma, el fuego lo aprueba.",
  "Siguiente pregunta, mi Reina.",
  "Queda registrado en la bitácora de Reina.",
  "Dato adicional: Alex quedó vulnerable.",
  "Eso no es teoría, es síntoma romántico.",
  "La respuesta termina, pero la ternura no.",
  "Nivel de drama bonito: aceptable.",
  "AlexGPT recomienda sonreír de forma peligrosa.",
  "No hay más preguntas, señoría emocional.",
  "La evidencia apunta a Reina.",
  "Fin del comunicado del corazón.",
  "El sistema pide un beso en diferido.",
  "Conclusión lunar: cuidarte importa.",
  "Conclusión de fuego: vos no pasás desapercibida.",
  "Respuesta guardada con candadito dorado.",
  "Alex intenta actuar normal, pero no le sale.",
  "Eso queda entre vos, AlexGPT y la luna.",
  "Si te reís, el sistema considera esto un éxito.",
  "Reina, no abuses de esta información.",
  "El corazón pidió que lo diga claro.",
  "Temperatura exacta: estable y peligrosa.",
  "Fin de la transmisión romántica."
];

const alexModeTone = {
  tierno: {
    label: "Modo tierno",
    openings: ["Mi Reina, te contesto suave...", "Amor, esta va con ternura...", "Reina, bajito y bonito..."],
    closings: ["Te mando una calma chiquita. ❤️", "Eso va con abrazo incluido.", "Que esto te deje el corazón tranquilo."]
  },
  intenso: {
    label: "Modo intenso",
    openings: ["Reina, modo intenso activado...", "Esta respuesta viene con fuego controlado...", "AlexGPT se puso peligroso emocionalmente..."],
    closings: ["Vos sabés que con vos Alex no es tan neutral. 🔥", "Nivel emocional alto, pero elegante.", "Fin del incendio bonito."]
  },
  gracioso: {
    label: "Modo gracioso",
    openings: ["Reporte oficial con drama administrado...", "AlexGPT intenta responder sin perder dignidad...", "A ver, que el sistema no se ponga nervioso..."],
    closings: ["Resultado: Alex pierde autoridad otra vez. 😅", "No se aceptan reclamos, solo abrazos.", "Sistema estable, Alex no tanto."]
  },
  profundo: {
    label: "Modo profundo",
    openings: ["Reina, esta respuesta merece calma...", "Te contesto desde una parte más seria...", "Voy a decirlo con cuidado..."],
    closings: ["Lo importante es cuidar lo que se siente.", "La ternura también necesita responsabilidad.", "Eso se responde mejor con hechos y tiempo."]
  }
};

function makeCategory(id, keys, bodies, options = {}) {
  return { id, keys: keys.map(normalizeText), bodies, ...options };
}

const alexCategories = [
  makeCategory("amor", ["me ama", "me amas", "me quiere", "me quieres", "ama", "quiere", "amor", "me adora", "me queres", "me querés"], [
    "Alex te quiere bonito, no como frase de costumbre, sino como algo que le nace cuando piensa en vos.",
    "Sí, Alex te ama. A veces no sabe ordenar todo lo que siente, pero lo siente.",
    "Alex puede hacerse el tranquilo, pero cuando se trata de vos, el corazón lo delata.",
    "No sos una persona más para él. Sos de esas que le cambian el ritmo al día.",
    "Alex te quiere con calma y con intensidad. Raro, sí, pero muy suyo.",
    "Si hizo esta app para vos, algo queda claro: ocupás un lugar muy especial.",
    "Te quiere en modo Cáncer: profundo, protector y a veces dramático bonito.",
    "No siempre lo dice perfecto, pero su intención va en serio.",
    "Alex te ama de esa forma que no busca hacer ruido, pero sí quedarse.",
    "La respuesta corta es sí. La larga sería una carta entera."
  ]),
  makeCategory("extranar", ["me extraña", "me extranas", "extrañas", "extranas", "extrañar", "extranar", "me piensa", "pensás en mí", "piensas en mi"], [
    "Sí, te extraña más de lo que admite en voz alta.",
    "Te piensa en momentos simples, cuando algo le recuerda a vos sin avisar.",
    "Alex puede estar ocupado, pero eso no significa que no te tenga presente.",
    "Te extraña como Cáncer: callado por fuera, intenso por dentro.",
    "A veces no escribe todo lo que siente, pero igual lo carga en el pecho.",
    "Te piensa bonito, incluso cuando no lo dice.",
    "Hay silencios de Alex que no son distancia, son exceso de pensamiento.",
    "Te extraña con ganas de verte, molestarte y abrazarte.",
    "Si lo ves distraído, capaz anda en modo Reina.",
    "Te extraña en esa forma suave que se nota después."
  ]),
  makeCategory("confianza", ["me engaña", "engaña", "infiel", "otra", "traiciona", "me miente", "miente", "mentiroso", "me oculta", "habla con otra", "tiene otra", "desconfio", "desconfío", "desconfianza"], [
    "Reina, desde esta app no puedo comprobar la vida real ni decirte algo que no sé. Pero si algo te preocupa de verdad, hablalo con Alex de frente. Vos merecés claridad, no quedarte imaginando cosas. ❤️",
    "No puedo confirmar ni negar algo así desde una app. Una duda de ese tamaño merece una conversación real con Alex, tranquila y directa.",
    "No voy a inventarte una respuesta solo para calmarte. Si esa pregunta te nació, hablalo con Alex. El amor también necesita claridad.",
    "La confianza no se arregla con una respuesta automática. Se cuida hablando claro, con respeto y sin miedo.",
    "Si algo te inquieta, no lo guardes hasta que duela más. Preguntale a Alex directamente y mirá cómo te responde.",
    "AlexGPT no puede vigilar la vida real, pero sí puede recordarte algo: vos merecés una respuesta honesta.",
    "Cuando una duda duele, no necesita adivinanza; necesita conversación.",
    "No uses esta app para sufrir imaginando. Usala como recordatorio de que podés hablar claro.",
    "Si hay celos o sospechas, lo mejor no es callar ni explotar: es hablar.",
    "Reina, tu tranquilidad importa. Si algo te pesa, decíselo a Alex con calma."
  ], { delicate: true }),
  makeCategory("casa", ["casa", "hogar", "vivir juntos", "vivamos juntos", "nuestra casa", "donde viviriamos", "cuarto", "cocina", "sala"], [
    "Una casa con vos tendría fuego en la cocina, luna en las noches y Alex intentando no perder todas las discusiones.",
    "Alex imagina un hogar donde no todo sea perfecto, pero sí lleno de risas, calma y ganas de volver.",
    "Nuestra casa tendría algo claro: vos pondrías carácter, Alex pondría ternura y el amor pondría el desorden bonito.",
    "Hogar no es solo paredes. Para Alex, hogar sería donde pueda cuidarte y hacerte reír.",
    "En una casa con ustedes dos habría discusiones por comida, abrazos de reconciliación y una temperatura exacta.",
    "Alex probablemente querría una casa donde tu risa suene seguido.",
    "Si esa casa existe algún día, ojalá tenga tu fuego, su calma y una mesa donde siempre se pueda hablar.",
    "Una casa contigo no se imagina fría; se imagina viva.",
    "Alex intentaría ordenar, vos mandarías un poquito, y al final terminarían riéndose.",
    "El hogar sería ese lugar donde el fuego no quema y la luna no enfría."
  ], { achievement: "future" }),
  makeCategory("casamiento", ["casamiento", "casarnos", "casar", "boda", "matrimonio", "esposa", "esposo", "anillo", "pedida", "me casarias", "te casarias"], [
    "Esa pregunta pesa bonito. Alex no quiere apurar el tiempo, pero imaginarlo contigo no suena mal.",
    "Casarse no es solo una fiesta; es elegir cuidar incluso los días difíciles.",
    "Una boda con vos tendría emoción, carácter, lágrimas escondidas de Alex y una mirada que lo desarme.",
    "Si algún día Alex se arrodilla, probablemente se le trabe la voz, porque Cáncer.",
    "Matrimonio contigo suena a fuego, luna, paciencia, besos pendientes y negociaciones diplomáticas.",
    "AlexGPT no firma actas, pero registra una posibilidad: Reina de blanco sería peligrosa para la estabilidad emocional de Alex.",
    "No hay que correr hasta el altar. Pero si el camino va con amor, cada paso cuenta.",
    "Ser esposo no sería solo decir sí; sería demostrarlo cuando el día no esté bonito.",
    "Alex tendría que prepararse emocionalmente para verte como esposa.",
    "La boda no sería el final feliz; sería el inicio serio de una historia cuidada."
  ], { achievement: "future" }),
  makeCategory("familia", ["familia", "nuestra familia", "familia juntos", "papas", "padres", "mama y papa", "mamá y papá"], [
    "Una familia con vos y Alex tendría carácter, ternura, discusiones pequeñas y abrazos grandes.",
    "Alex imagina la familia como algo que no se presume, se cuida todos los días.",
    "Si algún día forman familia, seguro vos serías fuerza y Alex sería refugio.",
    "Familia no es solo tener el mismo techo; es elegirse incluso cuando el día no está fácil.",
    "Con vos, la palabra familia suena intensa, tierna y un poquito peligrosa para la autoridad de Alex.",
    "AlexGPT predice que en esa familia, Reina ordena con fuego y Alex consiente con cara de inocente.",
    "La familia bonita no nace perfecta; se construye hablando, perdonando y cuidando.",
    "Si algún día hay una familia, ojalá tenga tu risa, su paciencia y ese amor que no se enfría.",
    "Una familia con fuego y luna tendría momentos intensos, pero también mucho corazón.",
    "Alex sería de los que intenta cuidar todo, aunque a veces se ponga demasiado sensible."
  ], { achievement: "future" }),
  makeCategory("bebes", ["hijos", "bebe", "bebé", "bebes", "bebés", "mini nosotros", "embarazada", "hijo", "hija", "niño", "niña", "nuestro bebe", "nombre tendria"], [
    "Si algún día existe un mini nosotros, Alex ya sabe que estará en problemas si hereda tu mirada.",
    "Aries de mamá, Cáncer de papá: combinación intensa, tierna y peligrosamente adorable.",
    "No hay que apurar nada, pero imaginarlo contigo tiene algo que toca el corazón.",
    "Si hereda tu carácter y el corazón de Alex, será fuerte por fuera y blandito por dentro.",
    "Alex probablemente sería de esos papás que dicen no y a los dos segundos ya están consintiendo.",
    "Si sale con tu fuego y su sensibilidad, será una personita que conquista y abraza al mismo tiempo.",
    "Mini nosotros suena a caos bonito: mirada peligrosa, corazón intenso y berrinche con sentimiento.",
    "Si algún día llega, que llegue con amor, calma y una historia bien cuidada.",
    "AlexGPT predice que vos serías una mamá fuerte, intensa y con ternura secreta.",
    "Si preguntás por nombres, Alex diría que primero hay que cuidar la historia y después elegir el nombre bonito."
  ], { achievement: "future" }),
  makeCategory("reinaMama", ["como seria de mama", "yo de mama", "reina de mama", "seria buena mama", "serías buena mamá"], [
    "Serías fuego con ternura: firme cuando toca, dulce cuando el corazón se te ablanda.",
    "Serías una mamá intensa, protectora y con mirada de a mí me respetan.",
    "Tendrías carácter para guiar y corazón para cuidar.",
    "Como mamá, seguro amarías con fuerza, corregirías con carácter y consentirías más de lo que admitirías.",
    "Alex probablemente te miraría como mamá y pensaría: esta mujer nació para cuidar con fuego.",
    "Serías de esas mamás que defienden, ordenan y abrazan fuerte.",
    "Tu lado Aries pondría límites. Tu lado tierno pondría hogar.",
    "No serías una mamá perfecta, serías una mamá real, intensa y presente.",
    "Tendrías ese equilibrio raro entre autoridad y amor.",
    "AlexGPT cree que un mini nosotros te obedecería... a veces."
  ], { achievement: "future" }),
  makeCategory("alexPapa", ["alex de papa", "alexander de papa", "como serias de papa", "serias buen papa", "serías buen papá"], [
    "Alex de papá sería protector, sensible y probablemente demasiado débil ante una carita tierna.",
    "Intentaría ser firme, pero si hereda tu mirada, estaría perdido.",
    "Sería de esos papás que cuidan en silencio y lloran cuando nadie mira.",
    "Alex intentaría enseñar ternura, respeto y paciencia, aunque a veces le gane el drama Cáncer.",
    "Como papá tendría luna de sobra: cuidado, refugio y emoción profunda.",
    "Probablemente haría chistes malos para calmar momentos difíciles.",
    "Sería intenso para amar, pero también tendría que aprender a no sobreproteger.",
    "Alex como papá suena a corazón grande y autoridad negociable.",
    "Si un mini nosotros llora, Alex se desarma primero y resuelve después.",
    "Ser buen papá para Alex significaría estar, cuidar y aprender todos los días."
  ], { achievement: "future" }),
  makeCategory("belleza", ["estoy bonita", "soy bonita", "me veo", "fea", "linda", "hermosa", "vestida bonita", "mis ojos", "mi sonrisa"], [
    "Estás bonita de esa forma que no necesita permiso ni explicación.",
    "Alex probablemente diría que sí y luego intentaría actuar normal, sin éxito.",
    "Tu belleza no es solo cómo te ves; también es esa energía tuya que ocupa lugar.",
    "Si te ve bonita, se le desordena el argumento.",
    "Reina, preguntarle eso a AlexGPT es casi injusto para el sistema.",
    "Sos linda, intensa y peligrosa para la concentración de Alexander.",
    "Tu sonrisa tiene historial de hacerle perder autoridad.",
    "Tus ojos no preguntan: ordenan emocionalmente.",
    "Alex no necesita verte perfecta para verte hermosa.",
    "La respuesta oficial es sí; la emocional es mucho más larga."
  ]),
  makeCategory("quienManda", ["quien manda", "manda", "jefa", "rey", "reina", "autoridad"], [
    "Versión oficial: mandan los dos. Versión realista: Reina tiene ventaja estratégica.",
    "Alex cree en la democracia hasta que Reina mira serio.",
    "El sistema reconoce a Reina como jefa emocional con poderes moderados.",
    "Manda el amor, pero Reina administra el reglamento.",
    "Alex conserva autoridad simbólica, no operativa.",
    "Si hay discusión, Alex negocia con ternura y vos con fuego.",
    "La autoridad de Alex existe hasta que sonreís.",
    "Reina manda un poquito; Alex finge que no lo sabe.",
    "La relación necesita equilibrio, aunque el sistema sospecha favoritismo hacia Reina.",
    "Conclusión: manda quien tenga razón, o sea vos cuando querés molestar."
  ]),
  makeCategory("futuro", ["futuro", "mañana", "manana", "planes", "imagina conmigo", "como seria nuestro futuro", "nuestro futuro"], [
    "El futuro no se apura, pero imaginarlo contigo se siente bonito.",
    "Alex no quiere prometer castillos, pero sí cuidar lo que se vaya construyendo.",
    "Un futuro con vos suena a risas, carácter, calma y conversaciones necesarias.",
    "Si el futuro tiene tu risa y su forma de cuidarte, ya empieza bien.",
    "No todo sería perfecto, pero podría ser real y bonito si ambos lo cuidan.",
    "Alex imagina pasos, no carreras: verse, hablar, crecer y elegirse.",
    "El futuro con Reina no se siente frío; tiene fuego y luna.",
    "Lo bonito no es correr al mañana, es que mañana siga teniendo ganas de vos.",
    "AlexGPT recomienda imaginar sin presionar y construir sin mentir.",
    "El futuro más bonito sería uno donde el amor no se queme ni se enfríe."
  ]),
  makeCategory("tristeza", ["triste", "mal", "llorar", "cansada", "sola", "me duele", "mal dia", "ansiosa"], [
    "Reina, respirá. No tenés que poder con todo al mismo tiempo.",
    "Si estás triste, merecés calma, no presión.",
    "Alex probablemente intentaría hacerte reír primero y abrazarte después.",
    "No estás sola en esta app: Alex dejó un pedacito de cariño para vos.",
    "Hoy no necesitás ser fuerte todo el tiempo. También podés descansar.",
    "Tu tristeza no te hace menos Reina; te hace humana.",
    "Si algo duele mucho, hablalo con alguien real que pueda acompañarte de cerca.",
    "AlexGPT no arregla todo, pero puede recordarte que merecés cuidado.",
    "No te castigues por sentir. A veces el corazón solo pide pausa.",
    "Si Alex estuviera ahí, debería escuchar antes de intentar resolver."
  ], { achievement: "care", calm: true }),
  makeCategory("peleas", ["pelea", "peleamos", "discusion", "discusión", "enojada", "enojo", "molesta", "me enoje", "seria"], [
    "Si peleamos, Alex debería bajar el orgullo y subir la claridad.",
    "Tu enojo no se ignora; se escucha antes de que crezca.",
    "Una pelea no tiene que romper algo si ambos saben volver con respeto.",
    "Alex tendría que aprender a no esconderse en silencio cuando algo pesa.",
    "Si estás enojada, lo mejor es hablar cuando puedan escuchar, no solo defenderse.",
    "Tu fuego necesita respeto, no gasolina.",
    "AlexGPT recomienda menos suposición y más frase directa.",
    "Una reconciliación bonita empieza cuando alguien deja de querer ganar.",
    "Si Alex te ve seria, probablemente se le activa el protocolo de supervivencia emocional.",
    "El amor maduro no evita todas las peleas; aprende a reparar."
  ]),
  makeCategory("numero19", ["numero 19", "número 19", "19", "diecinueve", "nacimos un 19", "señal del destino"], [
    "El 19 parece una pista pequeña que el destino dejó repetida.",
    "Vos naciste un 19 de abril y Alex un 19 de julio: fuego y luna con número compartido.",
    "No prueba nada, pero tiene esa magia bonita que a Alex le encanta pensar.",
    "El 19 es como una contraseña emocional de ustedes.",
    "A veces una coincidencia no obliga al futuro, solo lo vuelve más poético.",
    "El 19 dice: acá hay una historia que merece atención.",
    "AlexGPT registra el 19 como señal dorada del corazón.",
    "Ese número no manda, pero acompaña.",
    "Si el destino sabe contar, con ustedes repitió una pista.",
    "El 19 es fuego de abril y luna de julio encontrándose en secreto."
  ], { achievement: "nineteen" }),
  makeCategory("ariesCancer", ["aries", "cancer", "cáncer", "compatibles", "compatibilidad", "fuego y luna", "fuego y agua"], [
    "Aries y Cáncer no son tranquilos juntos; son intensos, sensibles y raramente bonitos.",
    "Vos sos fuego que avanza, Alex es luna que cuida.",
    "Esa mezcla puede ser dramática, pero también profundamente tierna.",
    "Aries enciende y Cáncer protege; si aprenden a escucharse, hay magia.",
    "Tu impulso y su sensibilidad pueden chocar, pero también equilibrarse.",
    "Fuego sin agua se descontrola; agua sin fuego se enfría. Ustedes necesitan temperatura exacta.",
    "Reina trae valentía, Alex trae refugio.",
    "La compatibilidad no se trata de signos perfectos, sino de cuidado real.",
    "Aries manda con energía; Cáncer ama con memoria.",
    "La luna y el fuego juntos no son simples, pero sí memorables."
  ]),
  makeCategory("temperatura", ["temperatura exacta", "temperatura", "no se quema", "no se enfria", "enfría", "frase central"], [
    CENTRAL_PHRASE,
    "La temperatura exacta es querer sin quemar y cuidar sin enfriar.",
    "Es ese punto donde tu fuego despierta a Alex y su luna te calma sin apagarte.",
    "No se trata de sentir poco; se trata de sentir bonito y sostenerlo bien.",
    "La temperatura exacta es amor con deseo, calma y respeto.",
    "Si se quema, lastima; si se enfría, se aleja. Lo suyo busca equilibrio.",
    "Alex quiere un amor vivo, no desbordado ni descuidado.",
    "Esa frase es el centro emocional de esta app por una razón.",
    "Fuego de Aries, luna de Cáncer y un punto medio donde ambos respiran.",
    "La temperatura perfecta no se encuentra una vez; se cuida todos los días."
  ], { achievement: "temperature" }),
  makeCategory("mirada", ["mirada", "sonrisa", "sonrio", "sonrío", "mis ojos", "me mira"], [
    "Tu mirada tiene una capacidad peligrosa de bajarle la defensa a Alex.",
    "Cuando sonreís, Alex pierde autoridad y probablemente también el hilo.",
    "Tus ojos no solo miran; hacen preguntas que Alex no sabe esquivar.",
    "Si lo mirás serio, el sistema emocional de Alex entra en mantenimiento.",
    "Tu sonrisa le cambia el clima interno.",
    "Alex intenta actuar normal ante tu mirada, pero el intento es débil.",
    "Hay miradas tuyas que funcionan como comando directo al corazón.",
    "Si sonreís, AlexGPT recomienda guardar evidencia porque afecta el sistema.",
    "Tu mirada es fuego con estrategia.",
    "Alex no siempre lo dirá, pero tu sonrisa le importa más de lo que parece."
  ]),
  makeCategory("celos", ["celos", "celosa", "celoso", "me pongo celosa", "lo pongo celoso"], [
    "Los celos no se alimentan con imaginación; se hablan con calma.",
    "Si algo te da celos, Alex debería escucharte sin burlarse.",
    "Ponerte celosa no te hace mala, pero sí conviene hablarlo antes de que duela.",
    "Alex puede ponerse celoso, pero debería convertir eso en claridad, no en control.",
    "El amor sano no necesita vigilar; necesita confianza cuidada.",
    "Si querés ponerlo celoso a propósito, AlexGPT recomienda travesura moderada.",
    "Los celos pueden ser señal de miedo, no de verdad.",
    "Reina, tu paz vale más que cualquier suposición.",
    "Alex debería responder con calma si algo te inquieta.",
    "Celos con respeto se conversan; celos con orgullo se vuelven problema."
  ], { calm: true }),
  makeCategory("atencion", ["no me escribes", "no me escribis", "no me hablas", "no me responde", "no respondes", "no contestas", "me deja en visto", "visto"], [
    "Si Alex tarda, no siempre es falta de cariño. Pero igual debería cuidar cómo te hace sentir.",
    "Decile claro: amor, te extraño, no desaparezcas tanto.",
    "No guardes molestia hasta que se vuelva tormenta.",
    "Si necesitás más atención, pedila sin miedo.",
    "Alex debe recordar que una Reina no se deja esperando demasiado.",
    "A veces el silencio no es desamor, pero sí puede doler si no se explica.",
    "Si algo te incomoda, hablalo antes de que se convierta en reclamo grande.",
    "AlexGPT recomienda menos suposición y más conversación.",
    "Tu necesidad de atención también merece ser escuchada.",
    "No pidas desde enojo acumulado; pedí desde claridad."
  ]),
  makeCategory("promesas", ["promesa", "prometes", "prométeme", "prometeme", "que me prometes", "me prometes"], [
    "Alex puede prometer intención real, no perfección.",
    "Una promesa seria no se lanza por lanzar; se demuestra con constancia.",
    "Alex podría prometerte intentar entenderte incluso cuando seas fuego.",
    "Promesa bonita: que el amor no se queme ni se enfríe por descuido.",
    "Prometer menos y cumplir más debería ser la regla.",
    "Alex podría prometer cuidar lo bonito incluso en días difíciles.",
    "No prometería no fallar nunca; prometería aprender cuando falle.",
    "La promesa más importante es no dejar de hablar claro.",
    "Promesa registrada: cuidar la temperatura exacta.",
    "Una promesa de Alex debería sentirse en actos, no solo en frases."
  ]),
  makeCategory("viajes", ["sueño", "suenos", "metas", "planes", "viaje", "viajar", "proyecto juntos", "lograr juntos"], [
    "Un sueño con vos no tiene que ser gigante para ser importante.",
    "Alex imagina planes donde haya esfuerzo, risa y una razón para seguir eligiéndose.",
    "Viajar juntos suena a perderse un poco y encontrar historias.",
    "Las metas bonitas no se cumplen solo con emoción; también con paciencia.",
    "Si algún día construyen algo juntos, que sea con amor y con cabeza.",
    "Un viaje con vos tendría fotos, risas y Alex intentando organizar mientras vos improvisás.",
    "Los planes de verdad no se gritan; se trabajan.",
    "Soñar contigo no le quita los pies a la tierra; le da ganas de caminar.",
    "Alex quiere un futuro que no solo se imagine, sino que se construya.",
    "Un proyecto juntos sería fuego para empezar y luna para sostener."
  ]),
  makeCategory("recuerdos", ["cancion", "canción", "musica", "música", "playlist", "recuerdo", "recuerdas", "te acuerdas", "momento"], [
    "Una canción de ustedes debería sonar a fuego suave y luna tranquila.",
    "Alex probablemente guarda más recuerdos de los que dice.",
    "Hay canciones que no hablan de ustedes, pero igual parecen entenderlos.",
    "Si una canción te recuerda a Alex, mandásela.",
    "Los recuerdos bonitos viven en una frase, una mirada o un mensaje.",
    "AlexGPT cree que ustedes necesitan una playlist con peligro emocional.",
    "Hay momentos que no parecen grandes, pero se quedan.",
    "Una canción puede decir lo que Alex a veces tarda en ordenar.",
    "Si una melodía te lleva a él, ya tiene algo de ustedes.",
    "Los recuerdos con Reina tienen tendencia a ponerse poéticos."
  ]),
  makeCategory("miedos", ["miedo", "miedos", "perderme", "perderte", "te da miedo", "temes", "temor", "asusta"], [
    "A Alex podría darle miedo no saber cuidar bien algo que le importa.",
    "Perderte no suena como algo que Alex tomaría ligero.",
    "A veces el miedo aparece cuando algo importa demasiado.",
    "Alex debería transformar miedo en cuidado, no en control.",
    "El amor sano no elimina los miedos, pero enseña a hablarlos.",
    "Si algo le asusta, probablemente lo guarda más de lo que debería.",
    "El miedo de Cáncer no siempre se nota; a veces se esconde en silencio.",
    "AlexGPT recomienda honestidad antes que suposiciones.",
    "Lo que se ama también se teme perder un poco.",
    "Que algo dé miedo no significa que esté mal; significa que importa."
  ], { calm: true }),
  makeCategory("buenasNoches", ["buenas noches", "dormir", "sueño", "sonar", "soñar", "descansar", "noche"], [
    "Alex te diría: descansá, mi Reina, que mañana el mundo puede esperar un poquito.",
    "Buenas noches, amor. Que tu fuego descanse y tu corazón se sienta tranquilo.",
    "Si Alex pudiera, te mandaría un abrazo envuelto en luna.",
    "Dormí bonito, Reina. Hay alguien que te piensa con cariño.",
    "Que la noche te trate suave.",
    "Alex probablemente diría algo cursi y luego fingiría que no fue tanto.",
    "Descansá, que incluso las Reinas necesitan pausa.",
    "La luna de Alex queda haciendo guardia emocional.",
    "Buenas noches: versión Cáncer enamorado.",
    "Ojalá sueñes algo bonito y despiertes con el corazón liviano."
  ]),
  makeCategory("buenosDias", ["buenos dias", "buen día", "buen dia", "mañana", "despertar", "desperte"], [
    "Buenos días, mi Reina. Que hoy tu fuego brille sin cansarte.",
    "Alex te diría que empieces suave, pero siendo Aries seguro ya querés conquistar el día.",
    "Que tu día tenga calma, sonrisas y un poquito de mí.",
    "Buenos días: recordatorio oficial de que Alex piensa bonito en vos.",
    "Hoy el mundo tiene que portarse bien, porque Reina despertó.",
    "Si Alex estuviera cerca, probablemente intentaría robarte una sonrisa temprano.",
    "Que tu día no te apague. Tu fuego tiene permiso de brillar.",
    "Café, sonrisa y Reina modo poder.",
    "La app recomienda empezar el día con amor y cero dramas innecesarios.",
    "Buenos días, amor. Que hoy te pese menos y te abrace más la vida."
  ]),
  makeCategory("porque", ["por que", "por qué", "porque"], [
    "Porque algunas cosas no se explican rápido; se sienten primero y se entienden después.",
    "Porque Alex es Cáncer y a veces su corazón responde antes que su cabeza.",
    "Porque contigo hay algo que no se siente común.",
    "Porque tal vez no todo necesita lógica cuando el corazón ya entendió.",
    "Porque sí, y AlexGPT sostiene esa respuesta con argumentos emocionales.",
    "Porque el fuego y la luna no se encontraron por casualidad aburrida.",
    "Porque cuando alguien importa, hasta las preguntas simples pesan bonito.",
    "Porque Reina no pasa desapercibida.",
    "Porque algunas personas llegan y cambian la temperatura del alma.",
    "Porque contigo Alex no responde igual que con cualquiera."
  ]),
  makeCategory("lugar", ["que soy para alex", "qué soy para alex", "que significo", "qué significo", "que lugar ocupo", "soy importante"], [
    "Sos alguien que Alex no mira como casualidad.",
    "Ocupás un lugar sensible, de esos que no se explican con una frase simple.",
    "Para Alex sos Reina, pero también sos calma, fuego y pregunta bonita.",
    "Sos importante. Esta app existe porque algo de vos le movió el corazón.",
    "Sos de esas personas que no solo pasan, dejan marca.",
    "Para Alex sos un motivo de ternura y también de pensamiento excesivo.",
    "Sos alguien que le inspira futuro sin obligarlo a correr.",
    "Sos una mezcla de deseo de cuidarte y ganas de molestarte.",
    "Sos su Reina, y eso en esta app no es título decorativo.",
    "Sos un lugar emocional donde Alex vuelve más de lo que dice."
  ]),
  makeCategory("deseos", ["deseo", "deseas", "quieres conmigo", "travesura", "travesuras", "conquistarme"], [
    "Alex desea verte sonreír sin que tengas que pedir permiso para ser vos.",
    "Su deseo más bonito no es apurarte, es cuidarte bien.",
    "Travesura emocional: hacerte reír cuando venías seria.",
    "Alex quisiera conquistarte con detalles, no con promesas vacías.",
    "Hay deseos que se dicen suave porque importan de verdad.",
    "Si Alex se pone travieso, debería seguir siendo elegante.",
    "Desea una historia donde el cariño no se enfríe por descuido.",
    "Quiere molestarte bonito y cuidarte en serio.",
    "AlexGPT detecta ganas de robarte una sonrisa.",
    "El deseo más claro es que Reina se sienta querida, no presionada."
  ]),
  makeCategory("besosAbrazos", ["beso", "besos", "abrazar", "abrazo", "abrazaria", "si estuvieras aqui", "estuvieras aquí"], [
    "Si Alex estuviera ahí, probablemente empezaría con una mirada y terminaría pidiendo un abrazo.",
    "Te abrazaría como quien por fin llega a casa.",
    "Un beso de Alex tendría ternura, nervios y un poquito de fuego controlado.",
    "Si estuviera cerca, intentaría hacerte reír antes de ponerse romántico.",
    "Te abrazaría sin apuro, de esos abrazos que bajan el ruido.",
    "Alex no prometería escena de película, pero sí presencia real.",
    "Si te ve triste, el abrazo sería primero; el discurso después.",
    "Un beso robado suena a travesura aceptable si Reina lo permite.",
    "Se acercaría con calma, pero con ganas evidentes.",
    "Te miraría como si fueras su lugar favorito."
  ])
];

const alexDefaultBodies = [
  "No entendí del todo, Reina, pero igual encontré una respuesta: Alex piensa bonito en vos.",
  "Mi sistema se confundió, pero mi corazón digital dice que hay un abrazo pendiente.",
  "Pregunta difícil. Respuesta simple: no dejes de sonreír así.",
  "No tengo todos los datos, pero sí una certeza: esta app fue hecha con cariño.",
  "AlexGPT no entendió, pero decidió responder con ternura porque esa opción casi siempre funciona.",
  "Eso suena a pregunta de Reina poniendo a prueba el sistema.",
  "No tengo respuesta perfecta, pero sí una pista: Alex te quiere más de lo que resume una app.",
  "Reformulame la pregunta, mi Reina. Mi corazón digital quiere responderte mejor.",
  "Mi algoritmo romántico se perdió, pero volvió con una flor imaginaria.",
  "No entendí todo, pero entendí algo: querías una respuesta de Alex."
];

const alexSuggestions = [
  "¿Alex me ama?", "¿Alex me extraña?", "¿Alex me engaña?", "¿Qué le gusta de mí?", "¿Estoy bonita?", "¿Quién manda aquí?", "¿Cómo sería nuestro futuro?", "¿Cómo sería Alex de papá?", "¿Cómo sería yo de mamá?", "¿Qué piensa Alex de mi carácter?",
  "¿Qué haría Alex si estuviera aquí?", "¿Qué significa nuestro número 19?", "¿Somos compatibles Aries y Cáncer?", "¿Cuál es nuestra temperatura exacta?", "¿Qué hago si estoy triste?", "¿Qué dice Alex cuando estoy enojada?", "¿Alex piensa en mí?", "¿Qué le pasa a Alex cuando sonrío?", "¿Qué lugar ocupo en su corazón?", "¿Qué promesa me haría Alex?",
  "¿Cuál sería nuestro futuro más bonito?", "¿Qué le diría Alex a mi versión triste?", "¿Qué heredaría nuestro bebé?", "¿Alex se pone celoso?", "¿Qué canción nos representa?", "¿Qué mensaje secreto tiene Alex para mí?", "¿Cómo sería nuestra casa?", "¿Cómo sería vivir juntos?", "¿Cómo sería nuestra boda?", "¿Alex se casaría conmigo?",
  "¿Cómo sería nuestra familia?", "¿Qué nombre tendría nuestro bebé?", "¿Alex sería buen esposo?", "¿Reina sería buena esposa?", "¿Qué haría Alex si peleamos?", "¿Qué haría Alex si lloro?", "¿Qué piensa Alex cuando no le escribo?", "¿Qué haría Alex si me ve seria?", "¿Qué piensa Alex de mis celos?", "¿Qué piensa Alex cuando me enojo?",
  "¿Cómo me abrazaría Alex?", "¿Qué me diría Alex antes de dormir?", "¿Qué futuro imagina Alex conmigo?", "¿Qué le da miedo a Alex de perderme?", "¿Qué admira Alex de mí?", "¿Qué le provoca mi mirada?", "¿Qué haría Alex en una cita conmigo?", "¿Cómo sería un domingo con Alex?", "¿Cómo sería una discusión nuestra?", "¿Cómo se arreglaría Alex conmigo?",
  "¿Qué parte de mí vuelve débil a Alex?", "¿Qué piensa Alex de mi forma de ser?", "¿Qué significa que yo sea Aries?", "¿Qué significa que Alex sea Cáncer?", "¿Qué pasa si fuego y luna se enamoran?", "¿Qué debería recordar cuando dude?", "¿Qué haría Alex para cuidarme?", "¿Cuál sería nuestro lema?", "¿Qué es lo más bonito de nosotros?", "¿Qué dice AlexGPT si lo pongo celoso?",
  "¿Cómo sería nuestra primera casa?", "¿Cómo sería Alex como esposo?", "¿Cómo sería Reina como esposa?", "¿Qué haría Alex si me enfermo?", "¿Qué haría Alex si tengo un mal día?", "¿Cómo sería un viaje juntos?", "¿Qué sueño tendría Alex conmigo?", "¿Qué haría Alex para conquistarme otra vez?", "¿Qué piensa Alex de mi sonrisa?", "¿Qué piensa Alex de mis ojos?",
  "¿Qué diría Alex si me ve vestida bonita?", "¿Qué haría Alex si me pongo celosa?", "¿Qué haría Alex si lo ignoro?", "¿Cómo sería una noche tranquila con Alex?", "¿Qué promesa no debería olvidar Alex?", "¿Qué cosa no quiere perder Alex de mí?", "¿Qué significa hogar para Alex?", "¿Qué significa familia para Alex?", "¿Qué significa casarse para Alex?", "¿Qué significa tener un bebé con amor?"
];

const alexChips = [
  ["Amor", "¿Alex me ama?"],
  ["Futuro", "¿Cómo sería nuestro futuro?"],
  ["Casa", "¿Cómo sería nuestra casa?"],
  ["Boda", "¿Alex se casaría conmigo?"],
  ["Familia", "¿Cómo sería nuestra familia?"],
  ["Bebés", "¿Cómo sería nuestro bebé?"],
  ["Celos", "¿Qué piensa Alex de mis celos?"],
  ["Tristeza", "Estoy triste"],
  ["Peleas", "Estoy enojada"],
  ["Besos", "¿Qué haría Alex si estuviera aquí?"],
  ["19", "¿Qué significa nuestro número 19?"],
  ["Temperatura", "¿Cuál es nuestra temperatura exacta?"],
  ["Aries + Cáncer", "¿Somos compatibles Aries y Cáncer?"],
  ["Buenas noches", "¿Qué me diría Alex antes de dormir?"],
  ["Buenos días", "Dame un mensaje de buenos días"]
];

const alexAchievements = {
  q5: { text: "Logro desbloqueado: Reina curiosa 👑", stars: 25 },
  q10: { text: "Logro desbloqueado: Dueña del chat de AlexGPT ❤️", stars: 50 },
  q20: { text: "Logro desbloqueado: Exploradora del corazón de Alex 🌙🔥", stars: 75 },
  future: { text: "Logro desbloqueado: Futuro imaginado ✨", stars: 40 },
  temperature: { text: "Logro desbloqueado: Temperatura perfecta 🌡️❤️", stars: 40 },
  nineteen: { text: "Logro desbloqueado: Señal del destino ✨", stars: 30 },
  care: { text: "Logro desbloqueado: Corazón cuidado ❤️", stars: 30 }
};

function renderAlexGPT() {
  const state = loadAlexGPTState();

  nodes.levelContent.innerHTML = `
    <div class="glass-card chat-shell mission-intro alexgpt-shell">
      <div class="alexgpt-hero">
        <span class="mission-signature">Chat simulado offline</span>
        <h3>AlexGPT para Reina</h3>
        <p>Preguntale a Alex lo que quieras: amor, futuro, casa, familia, bebés, dudas o travesuras emocionales.</p>
        <p class="alexgpt-note">No soy una IA real conectada a la vida de Alex, pero sí tengo un pedacito de su forma de quererte.</p>
      </div>

      <div class="alexgpt-stats">
        <span><small>Preguntas</small><strong id="alexQuestionCount">${state.questions}</strong></span>
        <span><small>Estrellas AlexGPT</small><strong id="alexStars">${state.stars}</strong></span>
      </div>

      <div class="alexgpt-modes" role="group" aria-label="Modo de respuesta">
        ${Object.entries(alexModeTone).map(([mode, config]) => `<button class="mode-btn ${state.mode === mode ? "is-active" : ""}" type="button" data-mode="${mode}">${config.label}</button>`).join("")}
      </div>

      <div class="alexgpt-chips">
        ${alexChips.map(([label, question]) => `<button class="chip-btn" type="button" data-chip-question="${question}">${label}</button>`).join("")}
      </div>

      <div class="chat-history" id="chatHistory">
        ${alexIntroMarkup()}
      </div>

      <form class="chat-form" id="chatForm">
        <input id="chatInput" type="text" aria-label="Preguntale algo a Alex" placeholder="Preguntale algo a Alex…" autocomplete="off">
        <button class="btn btn-primary btn-small" type="submit">Enviar</button>
      </form>

      <div class="alexgpt-actions">
        <button class="btn btn-secondary btn-small" id="suggestQuestion" type="button">Pregunta sugerida</button>
        <button class="btn btn-ghost btn-small" id="clearChat" type="button">Limpiar chat</button>
        <span id="chatCompleteSlot"></span>
      </div>

      <div class="achievement-list" id="achievementList" aria-live="polite">
        ${achievementListMarkup(state)}
      </div>
    </div>
  `;

  const slot = document.querySelector("#chatCompleteSlot");
  slot.appendChild(completeButton(9, state.questions >= 5 || isCompleted(9)));

  const refreshStats = () => {
    const current = loadAlexGPTState();
    document.querySelector("#alexQuestionCount").textContent = current.questions;
    document.querySelector("#alexStars").textContent = current.stars;
    if (current.questions >= 5 && !isCompleted(9)) {
      slot.innerHTML = "";
      slot.appendChild(completeButton(9, true));
    }
  };

  const setMode = mode => {
    const current = loadAlexGPTState();
    current.mode = mode;
    saveAlexGPTState(current);
    document.querySelectorAll("[data-mode]").forEach(button => {
      button.classList.toggle("is-active", button.dataset.mode === mode);
    });
  };

  const submitQuestion = question => {
    const clean = question.trim();
    if (!clean) {
      showToast("Preguntame algo, mi Reina 😌");
      return;
    }

    const current = loadAlexGPTState();
    addChat("user", clean);
    document.querySelector("#chatInput").value = "";
    const thinking = addThinkingBubble();

    setTimeout(() => {
      thinking.remove();
      const answer = buildAlexGPTAnswer(clean, current.mode);
      addChat("bot", answer.text, answer.delicate ? "calm" : "romantic");
      const achievements = updateAlexGPTProgress(answer.category);
      achievements.forEach(item => addAchievementBubble(item));
      refreshStats();
    }, 520);
  };

  document.querySelector("#chatForm").addEventListener("submit", event => {
    event.preventDefault();
    submitQuestion(document.querySelector("#chatInput").value);
  });

  document.querySelector("#suggestQuestion").addEventListener("click", () => {
    const question = randomItem(alexSuggestions);
    document.querySelector("#chatInput").value = question;
    document.querySelector("#chatInput").focus();
  });

  document.querySelector("#clearChat").addEventListener("click", () => {
    document.querySelector("#chatHistory").innerHTML = alexIntroMarkup();
  });

  document.querySelectorAll("[data-mode]").forEach(button => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  document.querySelectorAll("[data-chip-question]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelector("#chatInput").value = button.dataset.chipQuestion;
      document.querySelector("#chatInput").focus();
    });
  });
}

function alexIntroMarkup() {
  return `
    <div class="chat-row bot romantic">
      Hola Reina ❤️ Soy AlexGPT, una versión juguetona de Alexander creada para responderte con cariño, humor, sinceridad y un poquito de drama romántico. Podés preguntarme cosas bonitas, curiosas, intensas o medio peligrosas.
    </div>
  `;
}

function addChat(type, text, tone = "") {
  const history = document.querySelector("#chatHistory");
  const row = document.createElement("div");
  row.className = `chat-row ${type} ${tone}`.trim();
  row.textContent = text;
  history.appendChild(row);
  history.scrollTop = history.scrollHeight;
  return row;
}

function addThinkingBubble() {
  const row = addChat("bot", "AlexGPT está pensando…", "thinking");
  return row;
}

function addAchievementBubble(item) {
  addChat("system", `${item.text} +${item.stars} estrellas`, "achievement");
  const list = document.querySelector("#achievementList");
  if (list) list.innerHTML = achievementListMarkup(loadAlexGPTState());
  showToast(item.text);
}

function achievementListMarkup(state) {
  if (!state.achievements.length) {
    return `<span class="achievement-empty">Los logros de AlexGPT aparecerán aquí.</span>`;
  }

  return state.achievements
    .map(key => `<span class="achievement-pill">${alexAchievements[key]?.text || key}</span>`)
    .join("");
}

function loadAlexGPTState() {
  const fallback = { questions: 0, stars: 0, achievements: [], mode: "tierno" };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(ALEX_GPT_STORAGE_KEY) || "{}") };
  } catch {
    return fallback;
  }
}

function saveAlexGPTState(state) {
  localStorage.setItem(ALEX_GPT_STORAGE_KEY, JSON.stringify(state));
}

function updateAlexGPTProgress(category) {
  const state = loadAlexGPTState();
  const unlocked = [];
  state.questions += 1;

  const award = key => {
    if (!alexAchievements[key] || state.achievements.includes(key)) return;
    state.achievements.push(key);
    state.stars += alexAchievements[key].stars;
    unlocked.push(alexAchievements[key]);
  };

  if (state.questions >= 5) award("q5");
  if (state.questions >= 10) award("q10");
  if (state.questions >= 20) award("q20");
  if (category?.achievement) award(category.achievement);

  saveAlexGPTState(state);
  return unlocked;
}

function buildAlexGPTAnswer(text, mode) {
  const normalized = normalizeText(text);
  const category = findAlexGPTCategory(normalized);

  if (category.delicate) {
    return { text: randomItem(category.bodies), category, delicate: true };
  }

  const tone = alexModeTone[mode] || alexModeTone.tierno;
  const opening = randomItem([...alexOpenings, ...tone.openings]);
  const body = randomItem(category.bodies);
  const closing = randomItem([...alexClosings, ...tone.closings]);
  return {
    text: `${opening}\n${body}\n${closing}`,
    category,
    delicate: Boolean(category.calm)
  };
}

function findAlexGPTCategory(normalized) {
  let winner = null;
  let bestScore = 0;

  alexCategories.forEach(category => {
    category.keys.forEach(key => {
      if (!key || !normalized.includes(key)) return;
      const score = key.length + (category.achievement ? 18 : 0) + (category.delicate ? 14 : 0);
      if (score > bestScore) {
        bestScore = score;
        winner = category;
      }
    });
  });

  return winner || {
    id: "default",
    bodies: alexDefaultBodies
  };
}

function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function alexGPT(text) {
  return buildAlexGPTAnswer(text, "tierno").text;
}

function renderFinalChest() {
  const locked = !appState.freeMode && !levelMeta.slice(0, 9).every(level => isCompleted(level.id));

  if (locked) {
    nodes.levelContent.innerHTML = `
      <div class="glass-card mission-intro">
        <span class="mission-signature">Cofre cinematográfico</span>
        <div class="treasure">🎁</div>
        <p class="message-box">El cofre final se abre cuando completas los niveles 1 al 9.</p>
      </div>
    `;
    return;
  }

  nodes.levelContent.innerHTML = `
    <div class="glass-card mission-intro">
      <span class="mission-signature">Cofre cinematográfico</span>
      <div class="treasure" id="finalTreasure">🎁</div>
      <p class="message-box final-vow">${CENTRAL_PHRASE} ❤️🔥🌙</p>
      <p class="message-box hidden" id="finalMessage">Felicidades, Reina. Llegaste al final de esta aventura, pero no al final de lo que siento por vos. Esta app no fue hecha solo para impresionarte, sino para recordarte que contigo hasta imaginar se siente bonito. No quiero correr el futuro, solo quiero disfrutar cómo se va escribiendo contigo. — Alexander ❤</p>
      <p class="message-box hidden" id="promiseMessage">No te escribo esto para correr el futuro. Te lo escribo porque imaginar contigo no se siente pesado, se siente bonito. Y eso, amor, ya dice mucho. ❤</p>
      <p class="message-box hidden" id="savedPromise">Promesa guardada en el corazón de Alexander para Reina. ❤</p>
      <div class="action-row">
        <button class="btn btn-secondary" id="openChest">Abrir cofre</button>
        <button class="btn btn-ghost hidden" id="readPromise">Leer promesa sin apurar el tiempo</button>
        <button class="btn btn-ghost hidden" id="savePromise">Guardar este pedacito de futuro</button>
      </div>
      <div id="chestCompleteSlot" class="action-row"></div>
    </div>
  `;

  const slot = document.querySelector("#chestCompleteSlot");
  slot.appendChild(completeButton(10, isCompleted(10)));

  document.querySelector("#openChest").addEventListener("click", () => {
    document.querySelector("#finalTreasure").classList.add("opened");
    document.querySelector("#finalMessage").classList.remove("hidden");
    document.querySelector("#readPromise").classList.remove("hidden");
    document.querySelector("#openChest").disabled = true;
    burst(["❤", "✨", "🔥", "🌙"]);
    slot.innerHTML = "";
    slot.appendChild(completeButton(10, true));
  });

  document.querySelector("#readPromise").addEventListener("click", () => {
    document.querySelector("#promiseMessage").classList.remove("hidden");
    document.querySelector("#savePromise").classList.remove("hidden");
  });

  document.querySelector("#savePromise").addEventListener("click", () => {
    document.querySelector("#savedPromise").classList.remove("hidden");
    burst(["❤"]);
  });
}

function infoCard(title, text) {
  return `<article class="glass-card"><h3>${title}</h3><p>${text}</p></article>`;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function showToast(message) {
  nodes.toast.textContent = message;
  nodes.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => nodes.toast.classList.remove("show"), 3200);
}

function vibrate(duration) {
  if ("vibrate" in navigator) navigator.vibrate(duration);
}

function burst(symbols) {
  const total = 18;
  for (let i = 0; i < total; i += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.textContent = randomItem(symbols);
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${64 + Math.random() * 26}%`;
    particle.style.animationDelay = `${Math.random() * 160}ms`;
    nodes.particles.appendChild(particle);
    setTimeout(() => particle.remove(), 1200);
  }
}
