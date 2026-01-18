const menu = document.getElementById("menu");
const game = document.getElementById("game");
const resultBox = document.getElementById("resultBox");
const resultText = document.getElementById("resultText");

let unlockedLevel = 1;
let currentLevel = 1;
let gameStarted = false;

let targetCookies = 0;
let brokenCookies = 0;
let taps = 0;
let missed = 0;
let lives = 3;

let difficulty = "normal";
let initialLives = 3;

let timeLeft = 30;
let timer;
let lastResult = "";

let coins = 0;
const DAILY_REWARD_AMOUNT = 50;
const REWARD_STORAGE_KEY = "lastDailyRewardTime";

let currentTheme = "dark";
const THEME_STORAGE_KEY = "playerTheme";

let bossHealth = 5;
const BOSS_REWARD_COINS = 200;

// 🛍️ SHOP ITEMS SYSTEM
const MAX_LIVES = 5;
let bombCount = 0;
const MAX_BOMBS = 3;
let goldenCookieActive = false;
const GOLDEN_COOKIE_PRICE = 300;
const GOLDEN_COOKIE_SPAWN_CHANCE = 0.15; // 15% chance per spawn
const GOLDEN_COOKIE_REWARD = 75; // Base coin reward

const SHOP_ITEMS = [
  {
    id: "extralife",
    name: "Extra Life",
    icon: "❤️",
    price: 100,
    effect: "Gain +1 life",
    purchase: purchaseExtraLife,
    canPurchase: canPurchaseExtraLife
  },
  {
    id: "bomb",
    name: "Bomb",
    icon: "💣",
    price: 150,
    effect: "Clear all bad items",
    purchase: purchaseBomb,
    canPurchase: canPurchaseBomb
  },
  {
    id: "goldencookie",
    name: "Golden Cookies",
    icon: "🍪✨",
    price: 300,
    effect: "Rare golden cookies with bonus",
    purchase: purchaseGoldenCookie,
    canPurchase: canPurchaseGoldenCookie
  }
];

function canPurchaseExtraLife() {
  return lives < MAX_LIVES;
}

function purchaseExtraLife() {
  if (coins < 100) return false;
  coins -= 100;
  lives = Math.min(lives + 1, MAX_LIVES);
  saveCoins();
  document.getElementById("lives").innerText = lives;
  showPurchaseFeedback("❤️ +1 LIFE!", "#FF6B6B");
  renderShopItems();
  return true;
}

function canPurchaseBomb() {
  return bombCount < MAX_BOMBS;
}

function purchaseBomb() {
  if (coins < 150) return false;
  coins -= 150;
  bombCount++;
  saveCoins();
  updateBombDisplay();
  showPurchaseFeedback("💣 +1 BOMB!", "#FF9800");
  renderShopItems();
  return true;
}

function canPurchaseGoldenCookie() {
  return !goldenCookieActive;
}

function purchaseGoldenCookie() {
  if (coins < GOLDEN_COOKIE_PRICE) return false;
  coins -= GOLDEN_COOKIE_PRICE;
  goldenCookieActive = true;
  saveCoins();
  showPurchaseFeedback("🍪✨ Golden Cookies Unlocked!", "#FFD700");
  renderShopItems();
  return true;
}

function updateBombDisplay() {
  const bombDisplay = document.getElementById("bombDisplay");
  const bombBtn = document.getElementById("bombBtn");
  const bombCountSpan = document.getElementById("bombCount");
  
  bombCountSpan.innerText = bombCount;
  
  if (bombCount > 0 && gameStarted) {
    bombDisplay.style.display = "block";
    bombBtn.style.display = "block";
  } else {
    bombDisplay.style.display = "none";
    bombBtn.style.display = "none";
  }
}

function useBomb() {
  if (bombCount <= 0 || !gameStarted) return;
  
  // Remove all bad items from the game
  const badItems = document.querySelectorAll(".item.donut, .item.pizza");
  
  if (badItems.length === 0) {
    showPurchaseFeedback("No bad items to clear!", "#FF9999");
    return;
  }
  
  // Create explosion at center of screen
  createBombExplosion(window.innerWidth / 2, window.innerHeight / 2);
  
  // Remove bad items with animation
  badItems.forEach((item, index) => {
    setTimeout(() => {
      const rect = item.getBoundingClientRect();
      createBombParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
      item.remove();
    }, index * 50);
  });
  
  bombCount--;
  updateBombDisplay();
  showPurchaseFeedback("💥 BOOM! Clear!", "#FF6B35");
  
  // Play bomb sound
  bombSound();
}

function createBombExplosion(x, y) {
  const explosion = document.createElement("div");
  explosion.className = "bomb-explosion";
  explosion.style.left = x + "px";
  explosion.style.top = y + "px";
  
  game.appendChild(explosion);
  
  setTimeout(() => explosion.remove(), 600);
}

function createBombParticles(x, y) {
  const particleCount = 12;
  const colors = ["💥", "🟠", "🔴", "⭐"];
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "bomb-particle";
    
    const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const distance = 80 + Math.random() * 120;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    
    const fontSize = 16 + Math.random() * 16;
    const duration = 500 + Math.random() * 300;
    
    particle.style.left = x + "px";
    particle.style.top = y + "px";
    particle.style.setProperty("--tx", tx + "px");
    particle.style.setProperty("--ty", ty + "px");
    particle.style.fontSize = fontSize + "px";
    particle.style.setProperty("--duration", (duration / 1000) + "s");
    particle.textContent = colors[Math.floor(Math.random() * colors.length)];
    
    game.appendChild(particle);
    
    setTimeout(() => particle.remove(), duration);
  }
}

function bombSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(150, now);
    o.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    o.start();
    o.stop(now + 0.3);
  } catch (e) {}
}

function switchShopTab(tab) {
  // Hide all sections
  document.getElementById("itemsSection").classList.remove("active");
  document.getElementById("themesSection").classList.remove("active");
  
  // Remove active class from all tabs
  document.getElementById("tab-items").classList.remove("active");
  document.getElementById("tab-themes").classList.remove("active");
  
  // Show selected section and tab
  if (tab === "items") {
    document.getElementById("itemsSection").classList.add("active");
    document.getElementById("tab-items").classList.add("active");
  } else if (tab === "themes") {
    document.getElementById("themesSection").classList.add("active");
    document.getElementById("tab-themes").classList.add("active");
  }
}

function renderShopItems() {
  const grid = document.getElementById("shopItemsGrid");
  grid.innerHTML = "";
  
  SHOP_ITEMS.forEach(item => {
    const card = document.createElement("div");
    card.className = "shop-card";
    
    const canBuy = item.canPurchase();
    const afforded = coins >= item.price;
    
    if (!canBuy) {
      card.classList.add("disabled");
    }
    if (afforded && canBuy) {
      card.classList.add("purchasable");
    }
    
    card.innerHTML = `
      <div class="shop-card-icon">${item.icon}</div>
      <div class="shop-card-name">${item.name}</div>
      <div class="shop-card-effect">${item.effect}</div>
      <div class="shop-card-price">💰 ${item.price}</div>
      <button class="shop-card-btn ${!canBuy ? 'disabled' : (afforded ? 'purchasable' : '')}" 
              onclick="purchaseShopItem('${item.id}')"
              ${!canBuy || !afforded ? 'disabled' : ''}>
        ${!canBuy ? 'MAX' : (afforded ? 'BUY' : 'NEED ' + (item.price - coins))}
      </button>
    `;
    
    grid.appendChild(card);
  });
}

function purchaseShopItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;
  
  if (!item.canPurchase()) {
    showPurchaseFeedback("Maximum reached!", "#FF9999");
    return;
  }
  
  if (coins < item.price) {
    showPurchaseFeedback("Not enough coins!", "#FFB347");
    return;
  }
  
  if (item.purchase()) {
    // Feedback is shown in the purchase function
  }
}

function showPurchaseFeedback(message, bgColor = "#4CAF50") {
  const feedback = document.getElementById("purchaseFeedback");
  const content = document.getElementById("purchaseFeedbackContent");
  content.textContent = message;
  content.style.backgroundColor = bgColor;
  feedback.style.display = "flex";
  feedback.style.animation = "none";
  void feedback.offsetWidth; // Force reflow
  feedback.style.animation = "purchaseFade 1.5s ease-out forwards";
  
  setTimeout(() => {
    feedback.style.display = "none";
  }, 1500);
}

let currentCombo = 0;
const COMBO_BASE_BONUS = 10;

// 💔 MISS FEEDBACK
function showMissFeedback(message = "MISSED") {
  const feedback = document.getElementById("missFeedback");
  feedback.textContent = message;
  feedback.style.animation = "none";
  void feedback.offsetWidth; // Force reflow
  feedback.style.animation = "missFade 1.2s ease-out forwards";
}

// 🎵 MUSIC
const bgMusic = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_5c8c8c8e59.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.25;

function toggleMusic() {
  bgMusic.paused ? bgMusic.play().catch(()=>{}) : bgMusic.pause();
}

// 💰 DAILY REWARD SYSTEM
function loadCoins() {
  const savedCoins = localStorage.getItem("playerCoins");
  coins = savedCoins ? parseInt(savedCoins) : 0;
  document.getElementById("coins").innerText = coins;
}

function saveCoins() {
  localStorage.setItem("playerCoins", coins);
  document.getElementById("coins").innerText = coins;
}

function checkDailyReward() {
  const now = Date.now();
  const lastRewardTime = localStorage.getItem(REWARD_STORAGE_KEY);
  
  // If no previous reward or more than 24 hours have passed
  if (!lastRewardTime || now - parseInt(lastRewardTime) >= 24 * 60 * 60 * 1000) {
    // Show reward popup
    setTimeout(() => {
      document.getElementById("dailyRewardBox").style.display = "flex";
    }, 500);
  }
}

function claimDailyReward() {
  coins += DAILY_REWARD_AMOUNT;
  saveCoins();
  localStorage.setItem(REWARD_STORAGE_KEY, Date.now());
}

function closeDailyReward() {
  document.getElementById("dailyRewardBox").style.display = "none";
  claimDailyReward();
}

// 📚 LEVEL 1 TUTORIAL
function showTutorial() {
  const tutorialBox = document.getElementById("tutorialBox");
  document.getElementById("tutorialText").textContent = "Tap the cookie 🍪, avoid others";
  tutorialBox.style.display = "block";
  
  // Hide after 3 seconds
  setTimeout(() => {
    tutorialBox.style.display = "none";
  }, 3000);
}

function showBossAlert() {
  const tutorialBox = document.getElementById("tutorialBox");
  document.getElementById("tutorialText").textContent = "👑 BOSS LEVEL! Tap 5 times to defeat 🍪";
  tutorialBox.style.display = "block";
  
  // Hide after 4 seconds
  setTimeout(() => {
    tutorialBox.style.display = "none";
  }, 4000);
}

// 🎨 THEME SYSTEM
function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  currentTheme = savedTheme || "dark";
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  document.body.className = theme + "-theme";
  currentTheme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function openShop() {
  document.getElementById("shopBox").style.display = "flex";
  renderShopItems();
  switchShopTab("items");
}

function closeShop() {
  document.getElementById("shopBox").style.display = "none";
}

function setTheme(theme) {
  applyTheme(theme);
}
// 🔥 COMBO SYSTEM
function incrementCombo() {
  currentCombo++;
  displayCombo();
  
  // Award bonus coins based on combo
  const comboBonus = Math.floor((currentCombo - 1) * COMBO_BASE_BONUS * 0.5);
  if (comboBonus > 0) {
    coins += comboBonus;
    saveCoins();
  }
}

function resetCombo() {
  currentCombo = 0;
  hideCombo();
}

function displayCombo() {
  const comboText = document.getElementById("comboText");
  const comboEmoji = currentCombo >= 10 ? "🔥🔥" : "🔥";
  comboText.textContent = `COMBO x${currentCombo} ${comboEmoji}`;
  comboText.style.display = "block";
  
  // Apply different animation classes based on combo level
  comboText.classList.remove("combo-5plus", "combo-10plus");
  if (currentCombo >= 10) {
    comboText.classList.add("combo-10plus");
  } else if (currentCombo >= 5) {
    comboText.classList.add("combo-5plus");
    triggerShake();
  }
  
  // Trigger animation by forcing reflow
  void comboText.offsetWidth;
}

function hideCombo() {
  document.getElementById("comboText").style.display = "none";
}
// � BOSS LEVEL SYSTEM
function spawnBoss() {
  const bossSpeed = 800; // Very fast
  
  setTimeout(() => {
    const boss = document.createElement("div");
    boss.className = "item cookie boss";
    boss.textContent = "🍪";
    boss.style.left = Math.random() * (window.innerWidth - 140) + "px";
    boss.style.animationDuration = bossSpeed + "ms";
    
    // Add health display
    bossHealth = 5;
    const healthDisplay = document.createElement("div");
    healthDisplay.className = "boss-health";
    healthDisplay.textContent = bossHealth;
    boss.appendChild(healthDisplay);
    
    boss.onclick = (e) => {
      e.stopPropagation();
      taps++;
      document.getElementById("taps").innerText = taps;
      
      bossHealth--;
      healthDisplay.textContent = bossHealth;
      
      crackSound();
      const rect = boss.getBoundingClientRect();
      createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
      
      if (bossHealth <= 0) {
        // Boss defeated
        triggerShake();
        coins += BOSS_REWARD_COINS;
        saveCoins();
        
        boss.classList.add("cut");
        setTimeout(() => boss.remove(), 300);
        
        lastResult = "win";
        showResult("👑 BOSS DEFEATED!<br>+200 Coins!");
      }
    };
    
    boss.addEventListener("animationend", () => {
      if (bossHealth > 0) {
        missed++;
        document.getElementById("missed").innerText = missed;
        triggerShake();
        loseLife("❌ BOSS ESCAPED!");
      }
      boss.remove();
    });
    
    game.appendChild(boss);
  }, 500);
}

// �📳 SCREEN SHAKE EFFECT
function triggerShake() {
  game.classList.remove("shake");
  void game.offsetWidth; // Force reflow to restart animation
  game.classList.add("shake");
  setTimeout(() => game.classList.remove("shake"), 200);
}

// 🎆 PARTICLE BURST EFFECT
function createParticles(x, y) {
  const particleCount = 16; // More particles for juicy effect
  const particleEmojis = ["🍪", "🟤", "✨", "⭐", "💫"];
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    
    const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 60 + Math.random() * 100;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 30; // Upward bias
    
    // Random size variation
    const sizeMultiplier = 0.6 + Math.random() * 0.8; // 0.6 to 1.4
    const fontSize = 12 + Math.random() * 20; // 12px to 32px
    
    // Random rotation
    const rotation = Math.random() * 720 - 360;
    const rotationSpeed = (Math.random() * 1200 - 600); // Extra rotation during animation
    
    // Random duration for varied effect
    const duration = 600 + Math.random() * 400; // 600-1000ms
    
    particle.style.left = x + "px";
    particle.style.top = y + "px";
    particle.style.setProperty("--tx", tx + "px");
    particle.style.setProperty("--ty", ty + "px");
    particle.style.setProperty("--rotation", rotation + "deg");
    particle.style.setProperty("--rotationSpeed", rotationSpeed + "deg");
    particle.style.fontSize = fontSize + "px";
    particle.style.setProperty("--duration", (duration / 1000) + "s");
    
    // Vary particle types
    const emoji = particleEmojis[Math.floor(Math.random() * particleEmojis.length)];
    particle.textContent = emoji;
    
    // Add specific class for animation variation
    if (Math.random() > 0.5) {
      particle.classList.add("spin-particle");
    } else {
      particle.classList.add("spiral-particle");
    }
    
    game.appendChild(particle);
    
    setTimeout(() => particle.remove(), duration);
  }
}

// 🔊 POP - Reusable AudioContext
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// 🍪 CRACKING SOUND
function crackSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(600, now);
    o.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    o.start();
    o.stop(now + 0.1);
  } catch (e) {}
}

// 🍰 SMASH SOUND
function smashSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(300, now);
    o.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    o.start();
    o.stop(now + 0.15);
  } catch (e) {}
}

// 🥖 THUD SOUND
function thudSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(400, now);
    o.frequency.exponentialRampToValueAtTime(150, now + 0.12);
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    o.start();
    o.stop(now + 0.12);
  } catch (e) {}
}

// 🍩 BOING SOUND
function boingSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(500, now);
    o.frequency.exponentialRampToValueAtTime(350, now + 0.08);
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.25, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    o.start();
    o.stop(now + 0.08);
  } catch (e) {}
}

// 🍕 SIZZLE SOUND
function sizzleSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(250, now);
    o.frequency.exponentialRampToValueAtTime(80, now + 0.2);
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    o.start();
    o.stop(now + 0.2);
  } catch (e) {}
}

// 🔒 LEVEL BUTTONS
for (let i = 1; i <= 20; i++) {
  const b = document.createElement("button");
  b.innerText = i;
  b.className = i === 1 ? "unlocked" : "locked";
  b.onclick = () => i <= unlockedLevel && startLevel(i, false);
  menu.appendChild(b);
}

// Level menu removed - using side panel instead

// ⏱️ TIMER
function startTimer() {
  clearInterval(timer);
  timeLeft = 30;
  document.getElementById("time").innerText = timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("time").innerText = timeLeft;
    if (timeLeft <= 0) loseLife("⏱️ TIME UP!");
  }, 1000);
}

// 🎯 DIFFICULTY SELECTION
function showDifficulty() {
  document.getElementById("instructionsBox").style.display = "none";
  document.getElementById("difficultyBox").style.display = "flex";
}

function selectDifficulty(mode) {
  difficulty = mode;
  document.getElementById("difficultyBox").style.display = "none";
  gameStarted = true;
  
  // Set initial lives based on difficulty
  if (difficulty === "easy") {
    initialLives = 5;
  } else if (difficulty === "normal") {
    initialLives = 3;
  } else if (difficulty === "hard") {
    initialLives = 2;
  }
  
  startLevel(1, true);
}

function closeInstructions() {
  document.getElementById("instructionsBox").style.display = "none";
  gameStarted = true;
  startLevel(1, true);
}

// ▶️ START LEVEL
function startLevel(level, resetLives) {
  bgMusic.play().catch(()=>{});
  clearInterval(timer);
  game.innerHTML = "";

  currentLevel = level;
  gameStarted = true;
  brokenCookies = 0;
  taps = 0;
  missed = 0;
  resetCombo();
  if (resetLives) lives = initialLives;
  
  // Update unlocked level
  unlockedLevel = Math.max(unlockedLevel, level);

  // Boss level special settings
  if (level === 10) {
    targetCookies = 1; // Only need to defeat boss
    document.getElementById("target").innerText = "BOSS";
  } else {
    targetCookies = 2 + level; // 🔥 TARGET INCREASES
    document.getElementById("target").innerText = targetCookies;
  }

  document.getElementById("taps").innerText = taps;
  document.getElementById("missed").innerText = missed;
  document.getElementById("lives").innerText = lives;

  // Show bomb display if bombs are available
  updateBombDisplay();

  startTimer();
  spawnItems();
  
  // Show tutorial on level 1
  if (level === 1) {
    showTutorial();
  }
  
  // Show boss alert on level 10
  if (level === 10) {
    showBossAlert();
  }
  
  // Update level display
  updateLevelDisplay(level);
}

// 📊 UPDATE LEVEL DISPLAY
function updateLevelDisplay(level) {
  const levelDisplay = document.getElementById("levelDisplay");
  const displayText = level === 10 ? "LEVEL 10 👑 BOSS" : `LEVEL ${level}`;
  
  // Only trigger animation if text actually changes
  if (levelDisplay.textContent !== displayText) {
    levelDisplay.classList.remove("updated");
    void levelDisplay.offsetWidth; // Force reflow to restart animation
    levelDisplay.textContent = displayText;
    levelDisplay.classList.add("updated");
  }
}

// ❤️ LIFE
function loseLife(msg, showPopup = true) {
  lives--;
  document.getElementById("lives").innerText = lives;
  resetCombo();

  if (lives <= 0) {
    lastResult = "gameover";
    showResult("💀 GAME OVER");
  } else if (showPopup) {
    lastResult = "retry";
    showResult(msg);
  }
}

// 🍪 + � + 🥖 + 🍩 + 🍕 SPAWN
function spawnItems() {  // Boss level at level 10
  if (currentLevel === 10) {
    spawnBoss();
    return;
  }
    let speed = Math.max(1500, 4500 - currentLevel * 200);
  
  // Adjust speed based on difficulty
  if (difficulty === "easy") {
    speed *= 1.5; // 50% slower
  } else if (difficulty === "hard") {
    speed *= 0.6; // 40% faster
  }
  
  const goodItems = [
    { type: "cookie", emoji: "🍪" },
    { type: "cake", emoji: "🍰" },
    { type: "bread", emoji: "🥖" }
  ];
  const badItems = [
    { type: "donut", emoji: "🍩", label: "DONUT" },
    { type: "pizza", emoji: "🍕", label: "PIZZA" }
  ];

  for (let i = 0; i < targetCookies + 4; i++) {
    setTimeout(() => {
      const item = document.createElement("div");
      const isGood = i < targetCookies;
      const itemData = isGood ? goodItems[Math.floor(Math.random() * goodItems.length)] : badItems[Math.floor(Math.random() * badItems.length)];
      const itemSize = Math.min(80, window.innerWidth * 0.08);

      item.className = "item " + itemData.type;
      item.textContent = itemData.emoji;
      item.style.left = Math.random() * (window.innerWidth - itemSize) + "px";
      item.style.animationDuration = speed + "ms";

      item.onclick = () => {
        taps++;
        document.getElementById("taps").innerText = taps;

        if (isGood) {
          // Play different sound based on item type
          if (itemData.type === "cookie") crackSound();
          else if (itemData.type === "cake") smashSound();
          else if (itemData.type === "bread") thudSound();
          
          const rect = item.getBoundingClientRect();
          createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
          item.classList.add("cut");
          brokenCookies++;
          
          // Increment combo on good item
          incrementCombo();
          
          setTimeout(() => item.remove(), 300);

          if (brokenCookies === targetCookies) {
            lastResult = "win";
            showResult("✅ LEVEL COMPLETE!");
          }
        } else {
          // Play different sound for bad items
          if (itemData.type === "donut") boingSound();
          else if (itemData.type === "pizza") sizzleSound();
          
          // Reset combo on bad item
          resetCombo();
          triggerShake();
          showMissFeedback(itemData.label);
          item.remove();
          loseLife("❌ " + itemData.label + "!", false);
        }
      };

      item.addEventListener("animationend", () => {
        if (isGood) {
          missed++;
          document.getElementById("missed").innerText = missed;
          triggerShake();
          resetCombo();
          showMissFeedback("MISSED");
          loseLife("❌ MISSED!", false);
        }
        item.remove();
      });

      game.appendChild(item);
    }, i * 500);
  }

  // Spawn golden cookies if active
  if (goldenCookieActive) {
    spawnGoldenCookies(speed);
  }
}

// 🍪✨ GOLDEN COOKIES
function spawnGoldenCookies(speed) {
  const numGoldenCookies = 2 + Math.floor(targetCookies / 3);
  
  for (let i = 0; i < numGoldenCookies; i++) {
    setTimeout(() => {
      // Random chance to actually spawn golden cookie
      if (Math.random() > GOLDEN_COOKIE_SPAWN_CHANCE) return;
      
      const goldenCookie = document.createElement("div");
      const itemSize = Math.min(80, window.innerWidth * 0.08);
      
      goldenCookie.className = "item golden-cookie";
      goldenCookie.textContent = "🍪✨";
      goldenCookie.style.left = Math.random() * (window.innerWidth - itemSize) + "px";
      goldenCookie.style.animationDuration = (speed * 0.8) + "ms";
      
      goldenCookie.onclick = (e) => {
        e.stopPropagation();
        taps++;
        document.getElementById("taps").innerText = taps;
        
        // Golden cookie reward
        const reward = GOLDEN_COOKIE_REWARD + Math.floor(currentLevel * 5);
        coins += reward;
        saveCoins();
        
        // Visual effects
        const rect = goldenCookie.getBoundingClientRect();
        createGoldenParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
        goldenCookie.classList.add("collected");
        
        // Increment combo
        incrementCombo();
        
        // Feedback
        showPurchaseFeedback(`✨ +${reward} Coins!`, "#FFD700");
        goldenCookieCollectSound();
        
        setTimeout(() => goldenCookie.remove(), 300);
      };
      
      goldenCookie.addEventListener("animationend", () => {
        goldenCookie.remove();
      });
      
      game.appendChild(goldenCookie);
    }, Math.random() * (targetCookies + 4) * 500);
  }
}

function createGoldenParticles(x, y) {
  const particleCount = 20;
  const colors = ["✨", "⭐", "💛", "🌟"];
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "golden-particle";
    
    const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const distance = 60 + Math.random() * 150;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 40;
    
    const fontSize = 14 + Math.random() * 18;
    const duration = 700 + Math.random() * 400;
    
    particle.style.left = x + "px";
    particle.style.top = y + "px";
    particle.style.setProperty("--tx", tx + "px");
    particle.style.setProperty("--ty", ty + "px");
    particle.style.fontSize = fontSize + "px";
    particle.style.setProperty("--duration", (duration / 1000) + "s");
    particle.textContent = colors[Math.floor(Math.random() * colors.length)];
    
    game.appendChild(particle);
    
    setTimeout(() => particle.remove(), duration);
  }
}

function goldenCookieCollectSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Create a pleasant chime sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(1600, now + 0.1);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc1.start();
    osc2.start();
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
  } catch (e) {}
}

// 🟦 RESULT
function getStarRating(missedCount) {
  if (missedCount === 0) return 3;
  if (missedCount <= 2) return 2;
  return 1;
}

function showResult(text) {
  clearInterval(timer);
  resultText.innerText = text;
  
  // Show stars only on level win
  const resultStars = document.getElementById("resultStars");
  if (lastResult === "win") {
    const stars = getStarRating(missed);
    resultStars.innerText = "⭐".repeat(stars);
  } else {
    resultStars.innerText = "";
  }
  
  resultBox.style.display = "flex";
}

function closeResult() {
  resultBox.style.display = "none";

  if (lastResult === "win") {
    if (unlockedLevel < currentLevel + 1) {
      unlockedLevel = currentLevel + 1;
    }
    renderLevelGrid();
    startLevel(Math.min(currentLevel + 1, 20), true);
  } else if (lastResult === "retry") {
    startLevel(currentLevel, false);
  } else {
    startLevel(unlockedLevel, true);
  }
}

function replayLevel() {
  resultBox.style.display = "none";
  startLevel(currentLevel, false);
}

function nextLevel() {
  resultBox.style.display = "none";
  
  if (lastResult === "win") {
    if (unlockedLevel < currentLevel + 1) {
      unlockedLevel = currentLevel + 1;
    }
    renderLevelGrid();
    startLevel(Math.min(currentLevel + 1, 20), true);
  } else {
    // If not a win, go back to main menu
    startLevel(unlockedLevel, true);
  }
}

// 🎯 LEVEL SELECTION PANEL
function renderLevelGrid() {
  const levelGrid = document.getElementById("levelGrid");
  levelGrid.innerHTML = "";
  
  // Create 20 levels
  for (let i = 1; i <= 20; i++) {
    const levelBtn = document.createElement("button");
    levelBtn.className = "level-btn";
    
    // Determine if level is unlocked
    const isUnlocked = i <= unlockedLevel;
    const isCurrent = i === currentLevel && gameStarted;
    
    if (isUnlocked) {
      levelBtn.classList.add("unlocked");
    } else {
      levelBtn.classList.add("locked");
    }
    
    if (isCurrent) {
      levelBtn.classList.add("current");
    }
    
    // Special boss level indicator
    const displayNumber = i === 10 ? "👑" : i;
    const statusText = i === 10 ? "BOSS" : (isUnlocked ? "✓" : "🔒");
    
    levelBtn.innerHTML = `
      <div class="level-number">${displayNumber}</div>
      <div class="level-status">${statusText}</div>
    `;
    
    if (isUnlocked) {
      levelBtn.onclick = () => selectLevel(i);
    } else {
      levelBtn.disabled = true;
    }
    
    levelGrid.appendChild(levelBtn);
  }
}

function openLevelPanel() {
  const panel = document.getElementById("levelPanel");
  panel.classList.add("open");
  renderLevelGrid();
  document.body.style.overflow = "hidden";
}

function closeLevelPanel() {
  const panel = document.getElementById("levelPanel");
  panel.classList.remove("open");
  document.body.style.overflow = "";
}

function selectLevel(level) {
  closeLevelPanel();
  startLevel(level, true);
}

// Close panel on escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLevelPanel();
  }
  if (e.code === "Space") {
    e.preventDefault();
    useBomb();
  }
});

// Close panel on background click
document.getElementById("levelPanel").addEventListener("click", (e) => {
  if (e.target.id === "levelPanel") {
    closeLevelPanel();
  }
});

document.getElementById("instructionsBox").style.display = "flex";

// Initialize coins and check daily reward
loadCoins();
checkDailyReward();

// Initialize theme
loadTheme();

// Initialize level grid
renderLevelGrid();
let gamePaused = false;
let gameInterval = null; // agar tum setInterval use kar rahe ho

function pauseGame() {
  gamePaused = true;

  // intervals stop
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
}

function resumeGame() {
  if (!gamePaused) return;

  gamePaused = false;
  startGameLoop(); // tumhara existing game loop yahin se chale
}
