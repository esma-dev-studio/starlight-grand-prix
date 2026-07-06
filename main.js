import * as THREE from "three";

const TOTAL_LAPS = 3;
const TRACK_LAYOUT_STEPS = 420;
const TRACK_STEPS = (() => {
  const width = typeof window !== "undefined" ? window.innerWidth || 1280 : 1280;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const touch = typeof navigator !== "undefined" && (navigator.maxTouchPoints || 0) > 0;
  if (touch || width < 820 || dpr > 1.6) return 156;
  if (width < 1180 || dpr > 1.25) return 220;
  return 340;
})();
const TRACK_WIDTH = 22;
const PLAYER_ID = "player";
const DEG = Math.PI / 180;
const QUALITY = (() => {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const width = typeof window !== "undefined" ? window.innerWidth || 1280 : 1280;
  const isTouch = typeof navigator !== "undefined" && Math.max(navigator.maxTouchPoints || 0, 0) > 0;
  const low = dpr > 1.45 || width < 980 || isTouch;
  return {
    low,
    pixelRatio: Math.min(dpr, low ? 0.85 : 1.35),
    shadowSize: low ? 384 : 1024,
    environmentScale: low ? 0.12 : 0.62,
    speedLineCount: low ? 7 : 24,
    particleCap: low ? 52 : 180,
    tireMarkCap: low ? 24 : 90,
    maxBurst: low ? 4 : 14,
    effectRate: low ? 0.26 : 0.68,
    assistStrength: low ? 1.12 : 0.88,
    guideStep: low ? 42 : 18,
    minimapInterval: low ? 0.2 : 0.11,
    hudInterval: low ? 0.1 : 0.05,
    venueStep: low ? 150 : 46,
    menuFrameInterval: low ? 1100 : 520
  };
})();

const fallbackData = {
  titleCandidates: ["スターライト・グランプリ"],
  adoptedTitle: "スターライト・グランプリ",
  tagline: "星と惑星のあいだを走る、かっこいい宇宙レース。",
  world: "小型レーシングマシンで発光レールを走る、うちゅうグランプリ。",
  course: {
    name: "スターライト・オービットリング",
    description:
      "大きな惑星、宇宙ステーション、流星、ワープゲートをぬけて走る、発光レールの宇宙コース。",
    features: [
      "ワープゲート",
      "発光レール",
      "大きな惑星",
      "宇宙ステーション",
      "流星",
      "星くず",
      "ブーストパネル",
      "どうぐボックス"
    ]
  },
  difficulties: {
    Easy: { precision: 0.72, speed: 0.86, reaction: 0.8 },
    Normal: { precision: 0.92, speed: 0.98, reaction: 1 },
    Hard: { precision: 1.12, speed: 1.08, reaction: 1.2 }
  },
  characters: [
    {
      id: "sera",
      name: "Sera Vey",
      archetype: "solar duelist",
      description: "Amber visor, split cape, and polished gauntlets with a calm champion posture.",
      personality: "precise and fearless",
      colors: { primary: "#f7b84a", secondary: "#f25c6b", accent: "#fff7d6" },
      stats: { speed: 7, accel: 6, handling: 6, weight: 5, boost: 7 },
      kartDesign: "gold turbine speedster",
      victory: "throws a prism salute as the kart wings flare",
      defeat: "checks the telemetry and nods with a half smile"
    },
    {
      id: "moro",
      name: "Moro Quill",
      archetype: "foxlike archivist",
      description: "Long luminous ears, ink-blue pilot coat, lens charm, and quick tail gestures.",
      personality: "curious and tactical",
      colors: { primary: "#2ddbd3", secondary: "#22345a", accent: "#ffdf7e" },
      stats: { speed: 5, accel: 8, handling: 8, weight: 3, boost: 6 },
      kartDesign: "compact hover courier",
      victory: "spins the kart on a hover ring and stamps a glowing route seal",
      defeat: "scribbles a better line into a floating notebook"
    },
    {
      id: "bront",
      name: "Bront Forge",
      archetype: "mineral robot",
      description: "Obsidian armor plates, rose-lit core, heavy shoulder fins, and a tiny ceremonial scarf.",
      personality: "steady and protective",
      colors: { primary: "#8b5cf6", secondary: "#1c2433", accent: "#ff6fae" },
      stats: { speed: 6, accel: 4, handling: 4, weight: 9, boost: 5 },
      kartDesign: "armored grav-tread hauler",
      victory: "raises a shield banner while the chassis vents pink sparks",
      defeat: "buffs a dent out of the bumper with dignified patience"
    },
    {
      id: "niva",
      name: "Niva Bloom",
      archetype: "wind sprite mechanic",
      description: "Layered petal jacket, translucent goggles, floating wrench charms, and bright wing fins.",
      personality: "playful and inventive",
      colors: { primary: "#7ee787", secondary: "#26413b", accent: "#9ee7ff" },
      stats: { speed: 5, accel: 7, handling: 9, weight: 2, boost: 8 },
      kartDesign: "leaf-fin agility glider",
      victory: "plants a holographic flower that bursts into confetti motes",
      defeat: "laughs, retunes the engine, and launches a tiny test spark"
    },
    {
      id: "ix",
      name: "Ix Orbit",
      archetype: "small comet alien",
      description: "Glass helmet, comet tail plume, starlight freckles, and oversized racing gloves.",
      personality: "bold and unpredictable",
      colors: { primary: "#53a8ff", secondary: "#101827", accent: "#ff8f3d" },
      stats: { speed: 8, accel: 5, handling: 5, weight: 4, boost: 9 },
      kartDesign: "needle-nose astral sprint kart",
      victory: "loops around the podium leaving a tiny aurora ribbon",
      defeat: "floats upside down and applauds the winner"
    }
  ],
  karts: [
    {
      id: "sunspike",
      name: "Sunspike GT",
      className: "top speed",
      description: "Long-nose turbine kart with luminous side fins.",
      colors: { primary: "#f7b84a", secondary: "#4b2b3b", accent: "#fff0b3" },
      stats: { speed: 9, accel: 5, handling: 5, weight: 5, boost: 7 }
    },
    {
      id: "quartz-moth",
      name: "Quartz Moth",
      className: "acceleration",
      description: "Tiny hover wings and fast-reacting gyros.",
      colors: { primary: "#2ddbd3", secondary: "#132f4d", accent: "#fff5cc" },
      stats: { speed: 5, accel: 9, handling: 8, weight: 3, boost: 6 }
    },
    {
      id: "velvet-paw",
      name: "Velvet Paw",
      className: "handling",
      description: "Low feline stance, split tail spoilers, and quiet traction vanes.",
      colors: { primary: "#ff7aa2", secondary: "#26303f", accent: "#8df6ff" },
      stats: { speed: 6, accel: 7, handling: 9, weight: 4, boost: 6 }
    },
    {
      id: "citadel",
      name: "Citadel Ram",
      className: "heavy",
      description: "Armored nose, broad rails, and stable grav-treads.",
      colors: { primary: "#8b5cf6", secondary: "#171b28", accent: "#ff6fae" },
      stats: { speed: 6, accel: 4, handling: 4, weight: 10, boost: 5 }
    },
    {
      id: "skylace",
      name: "Skylace Arrow",
      className: "balanced",
      description: "Balanced frame with winglets and a bright rear ion braid.",
      colors: { primary: "#53a8ff", secondary: "#12233b", accent: "#ffbf63" },
      stats: { speed: 7, accel: 7, handling: 7, weight: 5, boost: 7 }
    }
  ],
  items: [
    {
      id: "pulse-lance",
      name: "Pulse Lance",
      icon: "PL",
      kind: "projectile",
      description: "A narrow front-firing energy dart.",
      color: "#73f7ff",
      strength: 2
    },
    {
      id: "static-bloom",
      name: "Static Bloom",
      icon: "SB",
      kind: "aoe",
      description: "A short interference burst around the racer.",
      color: "#ff6fae",
      strength: 3
    },
    {
      id: "solar-slip",
      name: "Solar Slip",
      icon: "SS",
      kind: "boost",
      description: "A warm boost that stretches the kart into a light streak.",
      color: "#ffc857",
      strength: 2
    },
    {
      id: "anchor-glyph",
      name: "Anchor Glyph",
      icon: "AG",
      kind: "trap",
      description: "A rear-placed sigil that tugs at the next kart.",
      color: "#8b5cf6",
      strength: 2
    },
    {
      id: "aegis-veil",
      name: "Aegis Veil",
      icon: "AV",
      kind: "shield",
      description: "A brief halo shield against impact and interference.",
      color: "#9ee7ff",
      strength: 1
    },
    {
      id: "comet-writ",
      name: "Comet Writ",
      icon: "CW",
      kind: "comeback",
      description: "A rare catch-up surge that shields and accelerates.",
      color: "#ffffff",
      strength: 5
    }
  ]
};

const RACE_MODES = [
  {
    id: "grandPrix",
    name: "グランプリ",
    shortName: "王者をめざす",
    description: "ライバル5人と3しゅう走る、本番レース。はじめてならここがおすすめ。",
    laps: 3,
    rivals: 5,
    accent: "#ffd166",
    icon: "crown"
  },
  {
    id: "singleRace",
    name: "シングルレース",
    shortName: "1レースだけ",
    description: "ライバル3人と2しゅうだけ走る、短く遊べるレース。",
    laps: 2,
    rivals: 3,
    accent: "#7df9ff",
    icon: "flag"
  },
  {
    id: "timeAttack",
    name: "タイムアタック",
    shortName: "じぶんとの勝負",
    description: "ライバルなしで3しゅう走り、いちばん速いタイムをねらうモード。",
    laps: 3,
    rivals: 0,
    accent: "#ff8fb8",
    icon: "clock",
    timeAttack: true
  }
];

const CHARACTER_ART = {
  "luna-mimi": {
    symbol: "☾",
    line: "月のカーブを読むうちゅうレーサー",
    shortLine: "月うさぎの軽い走り",
    victory: "つきのライン、ぴったりだったね！",
    signature: "月うさぎ",
    specialty: "まがりやすさ",
    machineNote: "せんようマシン: ムーン・スキッパー",
    mood: "quick"
  },
  "gamma-bolt": {
    symbol: "■",
    line: "重いマシンで押し切るロボット",
    shortLine: "ぶつかりに強い",
    victory: "コースは、ぜんぶ計算ずみだ。",
    signature: "重そうこう",
    specialty: "ぶつかりのつよさ",
    machineNote: "せんようマシン: アイアン・バスティオン",
    mood: "sturdy"
  },
  "nebi-mist": {
    symbol: "✦",
    line: "星雲の力で一気に加速する",
    shortLine: "スタートが速い",
    victory: "星くずの道、きれいだったね。",
    signature: "星雲のしっぽ",
    specialty: "スタートのはやさ",
    machineNote: "せんようマシン: ネビュラ・フロート",
    mood: "mystic"
  },
  "sora-ranger": {
    symbol: "▲",
    line: "どの道も走りやすい宇宙探検家",
    shortLine: "バランスよく走る",
    victory: "つぎの星まで、まだ走れるよ！",
    signature: "探検ヘルメット",
    specialty: "そうごうりょく",
    machineNote: "せんようマシン: スター・レンジャー",
    mood: "heroic"
  },
  "comet-rin": {
    symbol: "↗",
    line: "流星みたいに直線をぬける",
    shortLine: "まっすぐ速い",
    victory: "見えた？ いまの流星ライン！",
    signature: "流星スーツ",
    specialty: "はやさ",
    machineNote: "せんようマシン: コメット・スピア",
    mood: "sharp"
  }
};

function characterArt(character) {
  const id = character?.id || "";
  const fallback = {
    symbol: "走",
    line: friendlyDescription(character) || "宇宙を走るレーサー",
    shortLine: friendlyDescription(character) || "宇宙を走るレーサー",
    victory: character?.presentation?.victoryLine || "いい走りだったよ。",
    signature: "レーサー",
    specialty: character?.specialty || "そうごうりょく",
    machineNote: "せんようマシン",
    mood: "focused"
  };
  return { ...fallback, ...(CHARACTER_ART[id] || {}) };
}

function characterClassId(character) {
  return String(character?.id || "racer")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "racer";
}

function friendlyDescription(entity) {
  const description = firstSentence(entity?.description);
  return description && hasJapanese(description) ? description : "";
}

const DATA = normalizeData(window.AURORA_GAME_DATA || fallbackData);
const state = {
  mode: "title",
  selectedCharacter: 0,
  selectedKart: 0,
  selectedCourse: Math.max(0, (DATA.courses || []).findIndex((course) => course.id === DATA.course?.id)),
  trackCourseId: DATA.course?.id || "",
  trackNeedsRebuild: false,
  raceMode: "grandPrix",
  difficulty: "Normal",
  time: 0,
  finishTime: 0,
  countdown: 0,
  rank: 1,
  winner: null,
  startedAudio: false,
  lastFrame: 0,
  currentScreen: "title",
  helpReturnScreen: "title"
};

const input = {
  accel: false,
  brake: false,
  left: false,
  right: false,
  drift: false,
  itemPressed: false,
  steerAxis: 0,
  touchSteer: 0
};

const dom = {};
let renderer;
let scene;
let camera;
let cameraTarget = new THREE.Vector3();
let cameraShake = 0;
let clock;
let track = null;
let racers = [];
let player = null;
let projectiles = [];
let traps = [];
let particles = [];
let tireMarks = [];
let itemBoxes = [];
let boostPanels = [];
let obstacles = [];
let speedLines = [];
let audio = null;
let generatedTextureAtlas = null;
let kartLiveryAtlas = null;
let minimapContext = null;
let seed = 11;
let lastHudRank = 1;
let lastHudItem = "";
let lastHudCharacter = "";
let minimapTimer = 0;
let hudTimer = 0;
let lastMenuFrameTime = 0;
let menuDirty = true;
let environmentGroup = null;
let trackLights = [];
let threeReady = false;
let baseWarmupStarted = false;
let raceWarmupStarted = false;
let raceWarmupComplete = false;
let raceWarmupTimer = 0;
let adaptiveEffectScale = 1;
let frameCostAverage = 16;

init();

function normalizeData(raw) {
  const source = raw || {};
  const data = { ...fallbackData, ...source };
  data.adoptedTitle = source.adoptedTitle || source.title || source.selectedTitle?.jaName || source.selectedTitle?.name || fallbackData.adoptedTitle;
  data.tagline = source.tagline || source.selectedTitle?.pitch || fallbackData.tagline;
  data.titleCandidates = source.titleCandidates || source.candidates || fallbackData.titleCandidates;
  data.characters = (data.characters && data.characters.length ? data.characters : fallbackData.characters).map((c, i) => {
    const base = fallbackData.characters[i % fallbackData.characters.length];
    return {
      ...base,
      ...c,
      id: c.id || `racer-${i}`,
      archetype: c.archetype || c.role || base.archetype,
      colors: normalizeColors(c.colors, base.colors),
      stats: normalizeStats(c.stats),
      victory: c.victory || c.presentation?.victoryLine || base.victory,
      defeat: c.defeat || base.defeat,
      modelTrait: c.modelTrait || inferCharacterTrait(c, i)
    };
  });
  data.karts = (data.karts && data.karts.length ? data.karts : fallbackData.karts).map((k, i) => {
    const base = fallbackData.karts[i % fallbackData.karts.length];
    return {
      ...base,
      ...k,
      id: k.id || `kart-${i}`,
      className: k.className || k.type || base.className,
      colors: normalizeColors(k.colors, base.colors),
      stats: normalizeStats(k.stats)
    };
  });
  data.items = (data.items && data.items.length ? data.items : fallbackData.items).map((item, i) => ({
    ...fallbackData.items[i % fallbackData.items.length],
    ...item
  }));
  const courseSource = Array.isArray(source.courses) && source.courses.length
    ? source.courses
    : [source.course || fallbackData.course];
  data.courses = courseSource.map((course) => normalizeCourse(course));
  const defaultCourseId = source.defaults?.courseId || data.defaults?.courseId;
  data.course = data.courses.find((course) => course.id === defaultCourseId) || data.courses[0] || normalizeCourse(source.course);
  data.difficulties = { ...fallbackData.difficulties, ...(data.difficulties || {}) };
  return data;
}

function inferCharacterTrait(character, index) {
  const key = [character.id || "", character.name || "", character.role || "", character.description || "", character.jaRole || ""].join(" ").toLowerCase();
  if (key.includes("gamma") || key.includes("bolt") || key.includes("robot") || key.includes("ロボット")) return "robot";
  if (key.includes("nebi") || key.includes("mist") || key.includes("nebula") || key.includes("spirit") || key.includes("星雲") || key.includes("せいれい")) return "spirit";
  if (key.includes("luna") || key.includes("mimi") || key.includes("rabbit") || key.includes("うさぎ") || key.includes("comet") || key.includes("rin") || key.includes("meteor") || key.includes("流星")) return "beast";
  if (key.includes("sora") || key.includes("ranger") || key.includes("explorer") || key.includes("pilot") || key.includes("探検")) return "pilot";
  if (key.includes("kael") || key.includes("obsidian") || key.includes("mechanic")) return "robot";
  if (key.includes("seren") || key.includes("bard") || key.includes("echo")) return "spirit";
  if (key.includes("nox") || key.includes("courier") || key.includes("night")) return "beast";
  if (key.includes("mira") || key.includes("crystal") || key.includes("guardian")) return "guardian";
  return index % 5 === 1 ? "robot" : index % 5 === 2 ? "spirit" : index % 5 === 3 ? "beast" : "pilot";
}
function normalizeColors(colors, fallback) {
  if (Array.isArray(colors)) {
    return {
      primary: colors[0] || fallback.primary,
      secondary: colors[1] || fallback.secondary,
      accent: colors[2] || fallback.accent
    };
  }
  const merged = { ...fallback, ...(colors || {}) };
  if (colors?.body && !colors.primary) merged.primary = colors.body;
  if (colors?.trim && !colors.secondary) merged.secondary = colors.trim;
  if (colors?.glow && !colors.accent) merged.accent = colors.glow;
  return merged;
}

function normalizeCourse(course) {
  if (!course) return { ...fallbackData.course };
  const features = [
    ...(course.features || []),
    ...(course.waypointNotes || []).map((point) => point.roadFeel || point.id),
    ...(course.obstacles || []).map((obstacle) => obstacle.name),
    ...(course.boostPanels || []).map((panel) => panel.id || "boost panel"),
    ...(course.itemBoxes || []).map((box) => box.id || "item row")
  ].filter(Boolean);
  return {
    ...fallbackData.course,
    ...course,
    name: course.name || fallbackData.course.name,
    description: course.description || course.routeMood || course.theme || fallbackData.course.description,
    features: features.length ? [...new Set(features)].slice(0, 10) : fallbackData.course.features
  };
}

function normalizeStats(stats) {
  return {
    speed: clamp(Number(stats?.speed ?? 6), 1, 10),
    accel: clamp(Number(stats?.accel ?? stats?.acceleration ?? 6), 1, 10),
    handling: clamp(Number(stats?.handling ?? 6), 1, 10),
    weight: clamp(Number(stats?.weight ?? 5), 1, 10),
    boost: clamp(Number(stats?.boost ?? 6), 1, 10)
  };
}

function init() {
  cacheDom();
  document.documentElement.classList.toggle("low-quality", QUALITY.low);
  document.title = DATA.adoptedTitle;
  dom.gameTitle.textContent = DATA.adoptedTitle;
  dom.gameTagline.textContent = DATA.tagline || DATA.selectedTitle?.pitch || (typeof DATA.world === "string" ? DATA.world : DATA.world?.premise) || fallbackData.tagline;
  dom.courseName.textContent = displayName(DATA.course);
  dom.courseDescription.textContent = DATA.course.description;
  minimapContext = dom.minimap.getContext("2d");

  populateTitleMeta();
  populateModes();
  populateChoices();
  populateCourse();
  bindEvents();
  if (dom.startButton?.dataset.readyLabel) dom.startButton.textContent = dom.startButton.dataset.readyLabel;
  dom.startButton?.classList.remove("is-loading", "is-pressed");
  dom.startButton?.removeAttribute("aria-busy");
  const initialScreen = window.__earlyStartRequested ? "mode" : "title";
  showScreen(initialScreen);
  document.documentElement.classList.add("app-ready");
  clock = new THREE.Clock();
}
function cacheDom() {
  [
    "app",
    "gameCanvas",
    "hud",
    "hudRacerPanel",
    "hudRacerPortrait",
    "hudRacerName",
    "hudRacerLine",
    "screenOverlay",
    "titleScreen",
    "modeScreen",
    "selectScreen",
    "courseScreen",
    "pauseScreen",
    "helpScreen",
    "resultScreen",
    "countdown",
    "gameTitle",
    "gameTagline",
    "titleCandidates",
    "modeGrid",
    "modeSummary",
    "startButton",
    "helpTitleButton",
    "backFromModeButton",
    "backToTitleButton",
    "courseButton",
    "backToSelectButton",
    "raceButton",
    "resumeButton",
    "helpPauseButton",
    "restartPauseButton",
    "restartButton",
    "changeRacerButton",
    "closeHelpButton",
    "characterGrid",
    "kartGrid",
    "courseName",
    "courseDescription",
    "difficultySelector",
    "courseFeatures",
    "positionValue",
    "lapValue",
    "timeValue",
    "speedValue",
    "itemSlot",
    "minimap",
    "mobileControls",
    "touchSteer",
    "touchGas",
    "touchBrake",
    "touchDrift",
    "touchItem",
    "touchHelp",
    "touchPause",
    "resultTitle",
    "resultStats"
  ].forEach((id) => {
    dom[id] = document.getElementById(id);
  });
}
const uiTapGuard = new WeakMap();

function bindUiTap(button, action) {
  if (!button) return;
  const instantTouch = button.classList.contains("game-button") || button.classList.contains("touch-button") || button.closest("#difficultySelector");
  const run = (event, fromTouch = false) => {
    if (event?.cancelable) event.preventDefault();
    event?.stopPropagation?.();
    const now = performance.now();
    const last = uiTapGuard.get(button) || 0;
    if (now - last < 260) return;
    uiTapGuard.set(button, now);
    button.classList.add("is-pressed");
    window.setTimeout(() => button.classList.remove("is-pressed"), fromTouch ? 150 : 110);
    action(event);
  };
  const runTouchStart = (event) => {
    if (!instantTouch) return;
    if (event.pointerType && event.pointerType === "mouse") return;
    run(event, true);
  };
  button.addEventListener("pointerdown", runTouchStart, { passive: false });
  button.addEventListener("touchstart", runTouchStart, { passive: false });
  button.addEventListener("pointerup", (event) => run(event, true), { passive: false });
  button.addEventListener("touchend", (event) => run(event, true), { passive: false });
  button.addEventListener("click", (event) => {
    if (performance.now() - (uiTapGuard.get(button) || 0) < 320) {
      event.preventDefault();
      return;
    }
    run(event, false);
  });
}
function bindEvents() {
  const go = (screen) => showScreen(screen);
  const openHelp = (returnScreen = state.currentScreen || "title") => {
    state.helpReturnScreen = returnScreen;
    if (state.mode === "racing") {
      state.mode = "paused";
      state.helpReturnScreen = "pause";
    }
    showScreen("help");
  };
  const closeHelp = () => showScreen(state.helpReturnScreen || "title");
  const usePlayerItem = () => {
    if (state.mode !== "racing" || !player?.item) return;
    useItem(player);
  };

  bindUiTap(dom.startButton, () => go("mode"));
  bindUiTap(dom.helpTitleButton, () => openHelp("title"));
  bindUiTap(dom.backFromModeButton, () => go("title"));
  bindUiTap(dom.backToTitleButton, () => go("mode"));
  bindUiTap(dom.courseButton, () => {
    populateCourse();
    go("course");
  });
  bindUiTap(dom.backToSelectButton, () => go("select"));
  bindUiTap(dom.raceButton, () => startCountdown());
  bindUiTap(dom.resumeButton, () => resumeRace());
  bindUiTap(dom.helpPauseButton, () => openHelp("pause"));
  bindUiTap(dom.restartPauseButton, () => startCountdown());
  bindUiTap(dom.restartButton, () => startCountdown());
  bindUiTap(dom.changeRacerButton, () => {
    resetRaceIfReady();
    go("select");
  });
  bindUiTap(dom.closeHelpButton, closeHelp);
  bindUiTap(dom.touchHelp, () => openHelp(state.mode === "racing" ? "pause" : state.currentScreen));
  bindUiTap(dom.touchPause, () => {
    if (state.mode === "racing") pauseRace();
    else if (state.mode === "paused") resumeRace();
  });
  bindUiTap(dom.touchItem, usePlayerItem);

  dom.difficultySelector.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-difficulty]");
    if (!button) return;
    if (event?.cancelable) event.preventDefault();
    state.difficulty = button.dataset.difficulty || "Normal";
    dom.difficultySelector.querySelectorAll("button").forEach((segment) => {
      segment.classList.toggle("selected", segment === button);
    });
    resetRaceIfReady();
  });

  const keyMap = {
    ArrowUp: "accel",
    KeyW: "accel",
    ArrowDown: "brake",
    KeyS: "brake",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    Space: "drift"
  };
  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
    if (event.code === "Escape") {
      if (state.mode === "racing") pauseRace();
      else if (state.mode === "paused") resumeRace();
      return;
    }
    if ((event.code === "KeyE" || event.code === "ShiftLeft" || event.code === "ShiftRight") && !event.repeat) {
      usePlayerItem();
      return;
    }
    const key = keyMap[event.code];
    if (key) input[key] = true;
  }, { passive: false });

  window.addEventListener("keyup", (event) => {
    const key = keyMap[event.code];
    if (key) input[key] = false;
  });

  const bindHold = (button, key) => {
    if (!button) return;
    const set = (active) => {
      input[key] = active;
      button.classList.toggle("is-pressed", active);
    };
    const start = (event) => {
      if (event?.cancelable) event.preventDefault();
      event?.stopPropagation?.();
      button.setPointerCapture?.(event.pointerId);
      set(true);
    };
    const end = (event) => {
      if (event?.cancelable) event.preventDefault();
      event?.stopPropagation?.();
      button.releasePointerCapture?.(event.pointerId);
      set(false);
    };
    button.addEventListener("pointerdown", start, { passive: false });
    ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"].forEach((type) => {
      button.addEventListener(type, end, { passive: false });
    });
    button.addEventListener("touchstart", start, { passive: false });
    button.addEventListener("touchend", end, { passive: false });
    button.addEventListener("touchcancel", end, { passive: false });
  };
  bindHold(dom.touchGas, "accel");
  bindHold(dom.touchBrake, "brake");
  bindHold(dom.touchDrift, "drift");

  const touchPoint = (event) => event?.touches?.[0] || event?.changedTouches?.[0] || event;
  const updateTouchSteer = (event) => {
    const point = touchPoint(event);
    if (!point) return;
    const rect = dom.touchSteer.getBoundingClientRect();
    const center = rect.left + rect.width * 0.5;
    input.touchSteer = clamp((point.clientX - center) / (rect.width * 0.42), -1, 1);
    dom.touchSteer.style.setProperty("--steer-x", (input.touchSteer * rect.width * 0.32) + "px");
  };
  const clearTouchSteer = () => {
    input.touchSteer = 0;
    dom.touchSteer.style.setProperty("--steer-x", "0px");
    dom.touchSteer.classList.remove("is-pressed");
  };
  const startTouchSteer = (event) => {
    if (event?.cancelable) event.preventDefault();
    event?.stopPropagation?.();
    dom.touchSteer.setPointerCapture?.(event.pointerId);
    dom.touchSteer.classList.add("is-pressed");
    updateTouchSteer(event);
  };
  const moveTouchSteer = (event) => {
    if (!dom.touchSteer.classList.contains("is-pressed")) return;
    if (event?.cancelable) event.preventDefault();
    updateTouchSteer(event);
  };
  const endTouchSteer = (event) => {
    if (event?.cancelable) event.preventDefault();
    dom.touchSteer.releasePointerCapture?.(event.pointerId);
    clearTouchSteer();
  };
  dom.touchSteer.addEventListener("pointerdown", startTouchSteer, { passive: false });
  dom.touchSteer.addEventListener("pointermove", moveTouchSteer, { passive: false });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
    dom.touchSteer.addEventListener(type, endTouchSteer, { passive: false });
  });
  dom.touchSteer.addEventListener("touchstart", startTouchSteer, { passive: false });
  dom.touchSteer.addEventListener("touchmove", moveTouchSteer, { passive: false });
  dom.touchSteer.addEventListener("touchend", endTouchSteer, { passive: false });
  dom.touchSteer.addEventListener("touchcancel", endTouchSteer, { passive: false });

  const clearTouchInputs = () => {
    input.accel = false;
    input.brake = false;
    input.drift = false;
    [dom.touchGas, dom.touchBrake, dom.touchDrift].forEach((button) => button?.classList.remove("is-pressed"));
    clearTouchSteer();
  };
  window.addEventListener("blur", clearTouchInputs);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTouchInputs();
  });
}

function populateTitleMeta() {
  dom.titleCandidates.innerHTML = "";
  DATA.titleCandidates.slice(0, 3).forEach((candidate) => {
    const title = displayName(candidate) || "タイトル案";
    const selected = Boolean(candidate?.selected) || title === DATA.adoptedTitle || candidate?.name === DATA.adoptedTitle || candidate?.jaName === DATA.adoptedTitle;
    const tag = document.createElement("span");
    tag.textContent = selected ? `このゲーム: ${title}` : title;
    dom.titleCandidates.appendChild(tag);
  });
}

function populateModes() {
  dom.modeGrid.innerHTML = "";
  RACE_MODES.forEach((mode) => {
    const button = document.createElement("button");
    button.className = "mode-card " + (mode.id === state.raceMode ? "selected" : "");
    button.dataset.mode = mode.id;
    button.style.setProperty("--mode-accent", mode.accent);
    button.innerHTML =
      '<span class="mode-icon mode-' + escapeHtml(mode.icon) + '" aria-hidden="true"></span>' +
      '<strong>' + escapeHtml(mode.name) + '</strong>' +
      '<span class="mode-short">' + escapeHtml(mode.shortName) + '</span>' +
      '<small>' + escapeHtml(mode.description) + '</small>';
    bindUiTap(button, () => selectRaceMode(mode.id));
    dom.modeGrid.appendChild(button);
  });
}

function selectRaceMode(modeId) {
  state.raceMode = modeId;
  populateModes();
  populateCourse();
  resetRaceIfReady();
  showScreen("select");
}

function raceMode() {
  return RACE_MODES.find((mode) => mode.id === state.raceMode) || RACE_MODES[0];
}

function activeLapTotal() {
  return raceMode().laps || TOTAL_LAPS;
}

function modeSummaryText() {
  const mode = raceMode();
  return mode.name + ": " + mode.description;
}

function machineIndexForCharacter(character, fallbackIndex = 0) {
  if (!DATA.karts.length) return 0;
  const id = character?.machineId;
  const direct = id ? DATA.karts.findIndex((kart) => kart.id === id) : -1;
  if (direct >= 0) return direct;
  const owner = DATA.karts.findIndex((kart) => kart.ownerId && kart.ownerId === character?.id);
  if (owner >= 0) return owner;
  return clamp(Math.round(fallbackIndex), 0, DATA.karts.length - 1);
}

function machineForCharacter(character, fallbackIndex = 0) {
  return DATA.karts[machineIndexForCharacter(character, fallbackIndex)] || DATA.karts[0];
}

function markMenuDirty() {
  menuDirty = true;
}

function activeCourse() {
  return (DATA.courses && DATA.courses[state.selectedCourse]) || DATA.course || DATA.courses?.[0] || fallbackData.course;
}

function selectCourse(index) {
  state.selectedCourse = clamp(index, 0, Math.max(0, (DATA.courses || []).length - 1));
  DATA.course = activeCourse();
  state.trackNeedsRebuild = true;
  raceWarmupComplete = false;
  raceWarmupStarted = false;
  window.clearTimeout(raceWarmupTimer);
  raceWarmupTimer = 0;
  dom.courseName.textContent = displayName(DATA.course);
  dom.courseDescription.textContent = DATA.course.description;
  populateCourse();
  if (state.currentScreen === "course") scheduleRaceWarmup(QUALITY.low ? 1800 : 700);
  markMenuDirty();
}

function ensureCourseSelector() {
  if (dom.courseGrid) return dom.courseGrid;
  const grid = document.createElement("div");
  grid.id = "courseGrid";
  grid.className = "course-grid";
  dom.courseFeatures?.parentNode?.insertBefore(grid, dom.courseFeatures);
  dom.courseGrid = grid;
  return grid;
}

function refreshCharacterSelection() {
  dom.characterGrid?.querySelectorAll(".racer-set-card").forEach((card) => {
    const selected = Number(card.dataset.index) === state.selectedCharacter;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-selected", selected ? "true" : "false");
  });
  markMenuDirty();
}

function selectCharacterSet(index) {
  state.selectedCharacter = clamp(index, 0, DATA.characters.length - 1);
  const character = DATA.characters[state.selectedCharacter] || DATA.characters[0];
  state.selectedKart = machineIndexForCharacter(character, state.selectedCharacter);
  raceWarmupComplete = false;
  raceWarmupStarted = false;
  window.clearTimeout(raceWarmupTimer);
  raceWarmupTimer = 0;
  refreshCharacterSelection();
  if (track) resetRaceIfReady();
  previewSelection();
}
function combinedSetStats(character, machine) {
  const c = character?.stats || {};
  const m = machine?.stats || {};
  const average = (a, b, fallback = 5) => Math.round(((Number.isFinite(a) ? a : fallback) + (Number.isFinite(b) ? b : fallback)) / 2);
  return {
    speed: average(c.speed, m.speed),
    handling: average(c.handling, m.handling),
    strength: average(c.weight, m.weight),
    accel: average(c.accel, m.accel),
    boost: average(c.boost, m.boost)
  };
}

function setStatBars(character, machine) {
  const stats = combinedSetStats(character, machine);
  const rows = [["はやさ", stats.speed], ["まがりやすさ", stats.handling], ["つよさ", stats.strength]];
  return '<div class="stat-bars set-stat-bars">' + rows.map(([label, value]) =>
    '<span class="stat-bar"><b>' + label + '</b><i style="--value:' + (clamp(value, 1, 10) * 10) + '%"></i><em>' + value + '</em></span>'
  ).join("") + '</div>';
}

function populateChoices() {
  dom.characterGrid.innerHTML = "";
  dom.characterGrid.classList.add("racer-set-grid");
  if (dom.kartGrid) {
    dom.kartGrid.innerHTML = "";
    dom.kartGrid.hidden = true;
    dom.kartGrid.setAttribute("aria-hidden", "true");
    dom.kartGrid.classList.add("hidden");
  }

  DATA.characters.forEach((character, index) => {
    const machine = machineForCharacter(character, index);
    const art = characterArt(character);
    const selected = index === state.selectedCharacter;
    const button = document.createElement("button");
    button.className = "choice-card rich-card racer-card racer-set-card racer-" + characterClassId(character) + " " + (selected ? "selected" : "");
    button.dataset.index = index;
    button.dataset.character = character.id || "";
    button.dataset.machine = machine?.id || "";
    button.setAttribute("aria-selected", selected ? "true" : "false");
    button.style.setProperty("--primary", character.colors.primary || "#7df9ff");
    button.style.setProperty("--secondary", character.colors.secondary || "#14233b");
    button.style.setProperty("--accent", character.colors.accent || "#ffd166");
    button.style.setProperty("--machine-primary", machine?.colors?.primary || machine?.colors?.body || character.colors.primary || "#7df9ff");
    button.style.setProperty("--machine-secondary", machine?.colors?.secondary || machine?.colors?.trim || character.colors.secondary || "#14233b");
    button.style.setProperty("--machine-accent", machine?.colors?.accent || machine?.colors?.glow || character.colors.accent || "#ffd166");
    button.innerHTML =
      '<span class="racer-set-visuals">' +
        '<span class="set-character-slot">' + characterVisualMarkup(character, "set-character") + '</span>' +
        '<span class="set-machine-slot">' + kartVisualMarkup(machine) + '</span>' +
      '</span>' +
      '<span class="choice-kind">うちゅうレーサー</span>' +
      '<strong>' + escapeHtml(displayName(character)) + '</strong>' +
      '<small>' + escapeHtml(art.line) + '</small>' +
      '<span class="character-signature-label">とくい: ' + escapeHtml(art.specialty || character.specialty || "そうごうりょく") + '</span>' +
      '<span class="machine-name">せんようマシン ' + escapeHtml(displayName(machine)) + '</span>' +
      setStatBars(character, machine) +
      '<span class="racer-line">「' + escapeHtml(character.catchLine || art.victory) + '」</span>';
    bindUiTap(button, () => selectCharacterSet(index));
    dom.characterGrid.appendChild(button);
  });
  refreshCharacterSelection();
}

function populateCourse() {
  DATA.course = activeCourse();
  dom.courseName.textContent = displayName(DATA.course);
  dom.courseDescription.textContent = DATA.course.description;
  dom.courseFeatures.innerHTML = "";
  if (dom.modeSummary) dom.modeSummary.textContent = modeSummaryText();
  const grid = ensureCourseSelector();
  if (grid) {
    grid.innerHTML = "";
    grid.hidden = (DATA.courses || []).length <= 1;
    (DATA.courses || [DATA.course]).forEach((course, index) => {
      const selected = index === state.selectedCourse;
      const button = document.createElement("button");
      button.className = "course-card" + (selected ? " selected" : "");
      button.dataset.course = course.id || String(index);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      const featureText = (course.features || []).slice(0, 3).map(friendlyFeature).join(" / ");
      button.innerHTML =
        '<span class="course-orbit" aria-hidden="true"></span>' +
        '<strong>' + escapeHtml(displayName(course)) + '</strong>' +
        '<small>' + escapeHtml(course.description || course.theme || "うちゅうコース") + '</small>' +
        '<em>' + escapeHtml(featureText) + '</em>';
      bindUiTap(button, () => selectCourse(index));
      grid.appendChild(button);
    });
  }
  [...new Set((DATA.course.features || []).map(friendlyFeature).filter(Boolean))].slice(0, 8).forEach((feature) => {
    const item = document.createElement("span");
    item.textContent = feature;
    dom.courseFeatures.appendChild(item);
  });
}

function statLine(stats) {
  return "はやさ " + stats.speed + " / スタート " + stats.accel + " / まがる " + stats.handling;
}

function statBars(stats) {
  const rows = [["はやさ", stats.speed], ["スタート", stats.accel], ["まがる", stats.handling], ["ダッシュ", stats.boost]];
  return '<div class="stat-bars">' + rows.map(([label, value]) =>
    '<span class="stat-bar"><b>' + label + '</b><i style="--value:' + (clamp(value, 1, 10) * 10) + '%"></i><em>' + value + '</em></span>'
  ).join("") + '</div>';
}

function characterVisualMarkup(character, extraClass = "") {
  const trait = character.modelTrait || inferCharacterTrait(character, 0);
  const art = characterArt(character);
  const classes = ["choice-visual", "racer-visual", "trait-" + trait, "racer-" + characterClassId(character), extraClass].filter(Boolean).join(" ");
  return '<span class="' + escapeHtml(classes) + '" aria-hidden="true">' +
    '<span class="portrait-shadow"></span>' +
    '<span class="portrait-aura"></span>' +
    '<span class="portrait-backpack"></span>' +
    '<span class="portrait-shoulders"></span>' +
    '<span class="portrait-head"></span>' +
    '<span class="portrait-helmet"></span>' +
    '<span class="portrait-visor"></span>' +
    '<span class="portrait-brow brow-left"></span>' +
    '<span class="portrait-brow brow-right"></span>' +
    '<span class="portrait-eye eye-left"></span>' +
    '<span class="portrait-eye eye-right"></span>' +
    '<span class="portrait-mouth"></span>' +
    '<span class="portrait-extra extra-left"></span>' +
    '<span class="portrait-extra extra-right"></span>' +
    '<span class="portrait-signature signature-a"></span>' +
    '<span class="portrait-signature signature-b"></span>' +
    '<span class="portrait-signature signature-c"></span>' +
    '<span class="portrait-badge">' + escapeHtml(art.symbol) + '</span>' +
  '</span>';
}

function kartVisualMarkup(kart) {
  const type = kartVisualType(kart);
  return '<span class="choice-visual kart-visual type-' + escapeHtml(type) + '" data-machine="' + escapeHtml(kart.id || type) + '" aria-hidden="true">' +
    '<span class="kart-shadow"></span>' +
    '<span class="kart-nose"></span>' +
    '<span class="kart-body-shape"></span>' +
    '<span class="kart-cockpit"></span>' +
    '<span class="kart-side side-left"></span>' +
    '<span class="kart-side side-right"></span>' +
    '<span class="kart-wheel wheel-left"></span>' +
    '<span class="kart-wheel wheel-right"></span>' +
    '<span class="kart-boost"></span>' +
  '</span>';
}

function kartVisualType(kart) {
  const key = `${kart.id || ""} ${kart.name || ""} ${kart.type || ""} ${kart.className || ""}`.toLowerCase();
  if (kart.stats.weight >= 8 || key.includes("heavy") || key.includes("vault") || key.includes("anvil")) return "heavy";
  if (kart.stats.accel >= 9 || key.includes("light") || key.includes("skipper")) return "light";
  if (kart.stats.speed >= 9 || key.includes("speed") || key.includes("comet")) return "speed";
  if (kart.stats.handling >= 8 || key.includes("technique") || key.includes("lark")) return "turn";
  return "balance";
}

function displayName(entity) {
  if (!entity) return "";
  if (typeof entity === "string") return entity;
  return entity.jaName || entity.displayName || entity.name || entity.label || entity.id || "";
}

function hasJapanese(text) {
  return /[ぁ-んァ-ヶ一-龯]/.test(String(text || ""));
}

function firstSentence(text) {
  const value = String(text || "").trim();
  if (!value) return "";
  return value.split("。")[0].trim();
}

function friendlyCharacterLine(character) {
  return characterArt(character).line;
}

function friendlyKartLine(kart) {
  const description = firstSentence(kart.description);
  if (hasJapanese(description)) return description;
  const key = `${kart.type || kart.className || ""}`.toLowerCase();
  if (key.includes("light")) return "軽くて曲がりやすいカート";
  if (key.includes("heavy")) return "重くてぶつかりに強いカート";
  if (key.includes("speed")) return "まっすぐ速いカート";
  if (key.includes("technique") || key.includes("handling")) return "カーブが得意なカート";
  return "バランスのよいカート";
}

function friendlyFeature(feature) {
  const raw = String(feature || "").trim();
  if (!raw) return "";
  if (hasJapanese(raw)) return raw;
  const key = raw.toLowerCase();
  if (/(boost|kicker|panel|dash)/.test(key)) return "ブーストパネル";
  if (/(item|beacon|box|cache|row)/.test(key)) return "どうぐボックス";
  if (/(jump|ramp|leap|drop|hop|gravity)/.test(key)) return "ていじゅうりょくジャンプ";
  if (/(gate|warp|portal)/.test(key)) return "ワープゲート";
  if (/(rail|glow|neon)/.test(key)) return "発光レール";
  if (/(planet|moon|orb)/.test(key)) return "大きな惑星";
  if (/(station|dock|spire|antenna)/.test(key)) return "宇宙ステーション";
  if (/(meteor|comet|shooting)/.test(key)) return "流星";
  if (/(dust|star|spark)/.test(key)) return "星くず";
  if (/(sign|billboard|ad|panel)/.test(key)) return "宇宙の看板";
  if (/(shortcut|underpass|cut)/.test(key)) return "近道";
  if (/(curve|turn|spiral|chicane|switchback|arc)/.test(key)) return "カーブの道";
  if (/(straight|lane)/.test(key)) return "まっすぐ走る道";
  if (/(city|scenery|sky|cloud|tower|floating|space)/.test(key)) return "うちゅうのけしき";
  return raw.replace(/[-_]+/g, " ");
}
function scheduleBaseWarmup(delay = 700) {
  if (baseWarmupStarted || threeReady) return;
  baseWarmupStarted = true;
  const warm = () => {
    if (!threeReady) ensureThreeReady();
  };
  const queueWarmup = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(warm, { timeout: 1200 });
    } else {
      warm();
    }
  };
  window.setTimeout(queueWarmup, delay);
}
function scheduleRaceWarmup(delay = 900) {
  if (raceWarmupStarted || raceWarmupComplete) return;
  raceWarmupStarted = true;
  const warm = () => {
    raceWarmupTimer = 0;
    if (state.mode === "racing" || state.mode === "countdown" || raceWarmupComplete) return;
    try {
      ensureRaceAssetsReady({ createRacers: true });
    } catch (error) {
      raceWarmupStarted = false;
    }
  };
  const queueWarmup = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(warm, { timeout: QUALITY.low ? 2200 : 1200 });
    } else {
      warm();
    }
  };
  window.clearTimeout(raceWarmupTimer);
  raceWarmupTimer = window.setTimeout(queueWarmup, delay);
}

function ensureThreeReady() {
  if (threeReady) return;
  initThree();
  threeReady = true;
  renderer.setAnimationLoop(animate);
}

function ensureRaceAssetsReady(options = {}) {
  ensureThreeReady();
  ensureTrackForSelectedCourse();
  raceWarmupComplete = true;
  if (options.createRacers && !player) resetRace();
}

function resetRaceIfReady() {
  if (!track || !scene) return;
  resetRace();
}
function initThree() {
  renderer = new THREE.WebGLRenderer({
    canvas: dom.gameCanvas,
    antialias: !QUALITY.low,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(QUALITY.pixelRatio);
  renderer.shadowMap.enabled = !QUALITY.low;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.26;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x11243d, 0.0068);

  camera = new THREE.PerspectiveCamera(62, 1, 0.1, 1600);
  camera.position.set(0, 20, -36);

  const hemi = new THREE.HemisphereLight(0xe2fbff, 0x2c1b3a, 3.4);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1c4, 5.2);
  sun.position.set(-70, 115, 60);
  sun.castShadow = !QUALITY.low;
  sun.shadow.mapSize.set(QUALITY.shadowSize, QUALITY.shadowSize);
  sun.shadow.camera.left = -180;
  sun.shadow.camera.right = 180;
  sun.shadow.camera.top = 180;
  sun.shadow.camera.bottom = -180;
  scene.add(sun);

  const rose = new THREE.PointLight(0xff4f9b, 165, 280, 1.8);
  rose.position.set(70, 45, -65);
  scene.add(rose);

  const cyan = new THREE.PointLight(0x44e6ff, 165, 280, 1.8);
  cyan.position.set(-85, 34, 95);
  scene.add(cyan);

  loadGeneratedTextureAtlas();
  scene.add(makeSkyDome());
  scene.add(makeGroundPlane());
  createSpeedLines();
  resizeRenderer();

  if (window.RiftAudio) {
    try {
      audio = new window.RiftAudio();
    } catch (error) {
      audio = null;
    }
  }
}

function loadGeneratedTextureAtlas() {
  const loader = new THREE.TextureLoader();
  generatedTextureAtlas = loader.load("./assets/arcade-texture-atlas.png", prepareLoadedTexture);
  kartLiveryAtlas = loader.load("./assets/kart-livery-atlas.png", prepareLoadedTexture);
}

function prepareLoadedTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = renderer?.capabilities?.getMaxAnisotropy?.() || 1;
  texture.needsUpdate = true;
}

function createAtlasTileTexture(tileX = 0, tileY = 0) {
  if (!generatedTextureAtlas?.image?.width) return null;
  const texture = generatedTextureAtlas.clone();
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(0.25, 0.25);
  texture.offset.set(clamp(tileX, 0, 3) * 0.25, 0.75 - clamp(tileY, 0, 3) * 0.25);
  return texture;
}

function makeAtlasMaterial(tileX, tileY, fallbackColor = 0xffffff, opacity = 0.92) {
  const map = createAtlasTileTexture(tileX, tileY);
  return new THREE.MeshBasicMaterial({
    map,
    color: map ? 0xffffff : fallbackColor,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}
function createKartLiveryTileTexture(tileX = 0, tileY = 0) {
  if (!kartLiveryAtlas?.image?.width) return null;
  const texture = kartLiveryAtlas.clone();
  prepareLoadedTexture(texture);
  texture.repeat.set(0.25, 0.25);
  texture.offset.set(clamp(tileX, 0, 3) * 0.25, 0.75 - clamp(tileY, 0, 3) * 0.25);
  return texture;
}

function makeKartLiveryMaterial(tileX, tileY, tint = 0xffffff, opacity = 0.96) {
  const map = createKartLiveryTileTexture(tileX, tileY);
  return new THREE.MeshBasicMaterial({
    map,
    color: map ? 0xffffff : tint,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false
  });
}
function makeSkyDome() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#01030a");
  gradient.addColorStop(0.34, "#060c24");
  gradient.addColorStop(0.68, "#111044");
  gradient.addColorStop(1, "#020512");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const nebula = ctx.createRadialGradient(280, 380, 20, 280, 380, 420);
  nebula.addColorStop(0, "rgba(167,139,250,0.34)");
  nebula.addColorStop(0.42, "rgba(52,240,178,0.12)");
  nebula.addColorStop(1, "rgba(2,5,18,0)");
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const planet = ctx.createRadialGradient(782, 244, 8, 782, 244, 156);
  planet.addColorStop(0, "rgba(255,255,255,0.96)");
  planet.addColorStop(0.22, "rgba(110,231,255,0.9)");
  planet.addColorStop(0.66, "rgba(65,86,174,0.82)");
  planet.addColorStop(1, "rgba(8,12,40,0.12)");
  ctx.fillStyle = planet;
  ctx.beginPath();
  ctx.arc(782, 244, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,209,102,0.46)";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.ellipse(782, 258, 220, 46, -0.23, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 620; i += 1) {
    const size = 0.6 + rand() * 2.4;
    const x = rand() * canvas.width;
    const y = rand() * canvas.height;
    ctx.fillStyle = "rgba(226,248,255," + (0.16 + rand() * 0.72) + ")";
    ctx.fillRect(x, y, size, size);
  }

  for (let band = 0; band < 8; band += 1) {
    const y = 132 + band * 84 + rand() * 44;
    const hue = band % 3 === 0 ? "125,249,255" : band % 3 === 1 ? "255,79,216" : "255,209,102";
    ctx.strokeStyle = "rgba(" + hue + "," + (0.08 + rand() * 0.18) + ")";
    ctx.lineWidth = 8 + rand() * 24;
    ctx.beginPath();
    for (let x = -80; x <= canvas.width + 80; x += 38) {
      const wave = Math.sin(x * 0.012 + band * 1.2) * (22 + band * 2.4);
      if (x === -80) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 24; i += 1) {
    const x = rand() * canvas.width;
    const y = 40 + rand() * 620;
    const length = 70 + rand() * 150;
    const streak = ctx.createLinearGradient(x, y, x + length, y - length * 0.34);
    streak.addColorStop(0, "rgba(255,255,255,0)");
    streak.addColorStop(0.42, "rgba(125,249,255,0.76)");
    streak.addColorStop(1, "rgba(255,79,216,0)");
    ctx.strokeStyle = streak;
    ctx.lineWidth = 1.4 + rand() * 2.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y - length * 0.34);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(720, 48, 24),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false })
  );
  dome.renderOrder = -10;
  return dome;
}
function makeGroundPlane() {
  const group = new THREE.Group();
  const plane = new THREE.Mesh(
    new THREE.CircleGeometry(620, 96),
    new THREE.MeshStandardMaterial({
      color: 0x101929,
      roughness: 0.92,
      metalness: 0.08
    })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -7;
  plane.receiveShadow = true;
  group.add(plane);

  for (let i = 0; i < 24; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(90 + i * 18, 0.15, 6, 160),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? 0x17365a : 0x273d61,
        transparent: true,
        opacity: 0.3
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -6.7;
    group.add(ring);
  }
  return group;
}

function courseTrackPoints(course = activeCourse()) {
  const id = course?.id || "starlight-orbit-ring";
  if (id === "meteor-mining-belt") {
    return [
      new THREE.Vector3(0, 0, -118),
      new THREE.Vector3(62, 3, -124),
      new THREE.Vector3(122, 5, -78),
      new THREE.Vector3(92, 2, -24),
      new THREE.Vector3(132, 6, 34),
      new THREE.Vector3(78, 8, 98),
      new THREE.Vector3(8, 3, 124),
      new THREE.Vector3(-56, 0, 96),
      new THREE.Vector3(-122, 5, 62),
      new THREE.Vector3(-92, 10, -8),
      new THREE.Vector3(-138, 3, -70),
      new THREE.Vector3(-58, 0, -116)
    ];
  }
  if (id === "nebula-drift-stream") {
    return [
      new THREE.Vector3(0, 0, -132),
      new THREE.Vector3(88, 4, -118),
      new THREE.Vector3(148, 8, -42),
      new THREE.Vector3(120, 12, 42),
      new THREE.Vector3(48, 6, 120),
      new THREE.Vector3(-32, 2, 132),
      new THREE.Vector3(-112, 5, 74),
      new THREE.Vector3(-152, 9, -10),
      new THREE.Vector3(-96, 3, -82),
      new THREE.Vector3(-32, 0, -126)
    ];
  }
  return [
    new THREE.Vector3(0, 0, -120),
    new THREE.Vector3(70, 2, -105),
    new THREE.Vector3(128, 0, -48),
    new THREE.Vector3(118, 5, 20),
    new THREE.Vector3(72, 6, 70),
    new THREE.Vector3(24, 2, 116),
    new THREE.Vector3(-52, -1, 108),
    new THREE.Vector3(-132, 3, 58),
    new THREE.Vector3(-118, 8, -16),
    new THREE.Vector3(-72, 4, -68),
    new THREE.Vector3(-44, 0, -122)
  ];
}

function layoutIndex(index) {
  return ((Math.round(index * TRACK_STEPS / TRACK_LAYOUT_STEPS) % TRACK_STEPS) + TRACK_STEPS) % TRACK_STEPS;
}

function scaledCourseLayout(layout) {
  return {
    boostPanels: layout.boostPanels.map(layoutIndex),
    dirtZones: layout.dirtZones.map(([start, end, offset]) => [layoutIndex(start), layoutIndex(end), offset]),
    jumpRamps: layout.jumpRamps.map(layoutIndex),
    itemBoxes: layout.itemBoxes.map(([index, offset]) => [layoutIndex(index), offset]),
    obstacles: layout.obstacles.map(([index, offset, type]) => [layoutIndex(index), offset, type])
  };
}

function courseLayout(course = activeCourse()) {
  const id = course?.id || "starlight-orbit-ring";
  if (id === "meteor-mining-belt") {
    return scaledCourseLayout({
      boostPanels: [32, 118, 212, 306, 374],
      dirtZones: [[86, 112, -TRACK_WIDTH * 0.36], [248, 280, TRACK_WIDTH * 0.34]],
      jumpRamps: [152, 332],
      itemBoxes: [[52, -5], [52, 5], [136, 0], [202, -4], [202, 4], [286, -5], [286, 5], [366, 0]],
      obstacles: [[76, -TRACK_WIDTH * 0.6, "pylon"], [164, TRACK_WIDTH * 0.58, "crate"], [236, -TRACK_WIDTH * 0.6, "crate"], [318, TRACK_WIDTH * 0.58, "pylon"]]
    });
  }
  if (id === "nebula-drift-stream") {
    return scaledCourseLayout({
      boostPanels: [46, 154, 266, 352],
      dirtZones: [[126, 168, TRACK_WIDTH * 0.38], [292, 326, -TRACK_WIDTH * 0.36]],
      jumpRamps: [96, 238, 382],
      itemBoxes: [[64, -5], [64, 5], [172, -4], [172, 4], [250, 0], [324, -5], [324, 5], [394, 0]],
      obstacles: [[108, TRACK_WIDTH * 0.58, "crate"], [198, -TRACK_WIDTH * 0.6, "pylon"], [282, TRACK_WIDTH * 0.58, "pylon"], [360, -TRACK_WIDTH * 0.6, "crate"]]
    });
  }
  return scaledCourseLayout({
    boostPanels: [38, 126, 238, 324],
    dirtZones: [[154, 180, TRACK_WIDTH * 0.42], [260, 288, -TRACK_WIDTH * 0.38]],
    jumpRamps: [112, 218],
    itemBoxes: [[58, -5], [58, 5], [145, -4], [145, 5], [206, -4], [206, 4], [294, -5], [294, 5], [360, 0]],
    obstacles: [[82, -TRACK_WIDTH * 0.58, "crate"], [172, TRACK_WIDTH * 0.56, "pylon"], [247, -TRACK_WIDTH * 0.6, "crate"], [335, TRACK_WIDTH * 0.56, "pylon"]]
  });
}
function buildTrack() {
  const course = activeCourse();
  const points = courseTrackPoints(course);
  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", course.curveTension || 0.45);
  const samples = [];
  let totalLength = 0;
  for (let i = 0; i < TRACK_STEPS; i += 1) {
    const t = i / TRACK_STEPS;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    if (i > 0) totalLength += point.distanceTo(samples[i - 1].point);
    samples.push({ point, tangent, normal, distance: totalLength });
  }
  samples.forEach((sample, index) => {
    const next = samples[(index + 1) % TRACK_STEPS];
    sample.segmentLength = sample.point.distanceTo(next.point);
  });

  const trackInfo = { curve, samples, width: TRACK_WIDTH, group: new THREE.Group(), layout: courseLayout(course) };
  scene.add(trackInfo.group);

  createTrackRibbon(trackInfo, 0, TRACK_WIDTH, 0x1b2d3d, 0x2c5968, 0.97, true);
  createTrackRibbon(trackInfo, -TRACK_WIDTH * 0.5 - 0.55, 1.1, 0x5de7ff, 0x5de7ff, 0.82, false);
  createTrackRibbon(trackInfo, TRACK_WIDTH * 0.5 + 0.55, 1.1, 0xffc857, 0xffc857, 0.7, false);
  createTrackRibbon(trackInfo, 0, 0.2, 0x9ee7ff, 0x7fe8ff, 0.2, false, 14);
  createTrackRibbon(trackInfo, -13.5, 7, 0x1a3440, 0x72f6ff, 0.58, false, 1, 186, 228);
  addTrackStructure(trackInfo);

  addStartLine(trackInfo);
  addBoostPanels(trackInfo);
  addDirtZones(trackInfo);
  addJumpRamps(trackInfo);
  addItemBoxes(trackInfo);
  addObstacles(trackInfo);
  addRails(trackInfo);
  addRoadDetails(trackInfo);
  addRacingLineGuides(trackInfo);
  addCornerGuideMarkers(trackInfo);
  return trackInfo;
}

function createTrackRibbon(trackInfo, offset, width, color, emissive, opacity, receiveShadow, dashEvery = 1, start = 0, end = TRACK_STEPS) {
  const vertices = [];
  const indices = [];
  const uvs = [];
  const count = end - start;
  for (let n = 0; n <= count; n += 1) {
    const index = (start + n) % TRACK_STEPS;
    if (dashEvery > 1 && Math.floor(n / dashEvery) % 2 === 1) {
      vertices.push(0, -999, 0, 0, -999, 0);
      uvs.push(0, 0, 1, 0);
      continue;
    }
    const sample = trackInfo.samples[index];
    const center = sample.point.clone().addScaledVector(sample.normal, offset);
    const left = center.clone().addScaledVector(sample.normal, width * 0.5);
    const right = center.clone().addScaledVector(sample.normal, -width * 0.5);
    vertices.push(left.x, left.y + 0.03, left.z, right.x, right.y + 0.03, right.z);
    uvs.push(0, n / count, 1, n / count);
  }
  for (let n = 0; n < count; n += 1) {
    const a = n * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const materialOptions = {
    color,
    roughness: receiveShadow ? 0.52 : 0.25,
    metalness: receiveShadow ? 0.36 : 0.05,
    emissive,
    emissiveIntensity: receiveShadow ? 0.035 : 0.85,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide
  };
  if (receiveShadow && width > 8) {
    materialOptions.map = createRoadSurfaceTexture();
    materialOptions.roughnessMap = createRoadRoughnessTexture();
  }
  const material = new THREE.MeshStandardMaterial(materialOptions);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = receiveShadow;
  trackInfo.group.add(mesh);
  return mesh;
}

function addTrackStructure(trackInfo) {
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x142334, emissive: 0x173b52, emissiveIntensity: 0.32, roughness: 0.42, metalness: 0.55 });
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, emissive: 0x31536d, emissiveIntensity: 0.26, roughness: 0.5, metalness: 0.65 });
  const cyanGlow = new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.58, blending: THREE.AdditiveBlending, depthWrite: false });
  const amberGlow = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.52, blending: THREE.AdditiveBlending, depthWrite: false });

  for (let i = 0; i < TRACK_STEPS; i += (QUALITY.low ? 24 : 8)) {
    const sample = trackInfo.samples[i];
    const yaw = Math.atan2(sample.tangent.x, sample.tangent.z);
    [-1, 1].forEach((side) => {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.25, 5.8), sideMat);
      edge.position.copy(sample.point).addScaledVector(sample.normal, side * (TRACK_WIDTH * 0.54 + 0.32));
      edge.position.y -= 0.55;
      edge.rotation.y = yaw;
      edge.castShadow = true;
      edge.receiveShadow = true;
      trackInfo.group.add(edge);

      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 5.4), side > 0 ? cyanGlow : amberGlow);
      slit.position.copy(sample.point).addScaledVector(sample.normal, side * (TRACK_WIDTH * 0.53 + 0.68));
      slit.position.y += 0.28;
      slit.rotation.y = yaw;
      trackInfo.group.add(slit);
    });

    if (i % (QUALITY.low ? 48 : 16) === 0) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH * 1.08, 0.24, 0.42), beamMat);
      rib.position.copy(sample.point);
      rib.position.y -= 1.24;
      rib.rotation.y = yaw;
      rib.castShadow = true;
      trackInfo.group.add(rib);
    }

    if (i % (QUALITY.low ? 96 : 32) === 0) {
      const pylon = new THREE.Group();
      const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.34, 18 + rand() * 18, 8), beamMat);
      drop.position.y = -8;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.045, 8, 24), cyanGlow.clone());
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -16.2;
      pylon.add(drop, ring);
      pylon.position.copy(sample.point).addScaledVector(sample.normal, (i / 32) % 2 ? TRACK_WIDTH * 0.74 : -TRACK_WIDTH * 0.74);
      pylon.position.y -= 1.8;
      trackInfo.group.add(pylon);
    }
  }
}
function addStartLine(trackInfo) {
  const sample = trackInfo.samples[0];
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(TRACK_WIDTH + 3, 0.25, 2.2),
    new THREE.MeshStandardMaterial({
      color: 0xfff0b8,
      emissive: 0xffc857,
      emissiveIntensity: 0.9,
      roughness: 0.25
    })
  );
  line.position.copy(sample.point).addScaledVector(sample.tangent, 1.4);
  line.position.y += 0.18;
  line.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z) + Math.PI / 2;
  line.castShadow = true;
  trackInfo.group.add(line);

  for (let s = -1; s <= 1; s += 2) {
    const arch = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 20, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x203047, emissive: 0x225d7a, emissiveIntensity: 0.3 })
    );
    arch.position.copy(sample.point).addScaledVector(sample.normal, s * (TRACK_WIDTH * 0.55 + 2));
    arch.position.y += 10;
    trackInfo.group.add(arch);
  }

  const yaw = Math.atan2(sample.tangent.x, sample.tangent.z);
  const portal = new THREE.Group();
  const portalMat = new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.68, blending: THREE.AdditiveBlending, depthWrite: false });
  const amberMat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  [7.4, 8.8, 10.2].forEach((radius, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, index === 1 ? 0.08 : 0.045, 8, 96), index === 1 ? amberMat.clone() : portalMat.clone());
    ring.rotation.z = index * 0.25;
    portal.add(ring);
  });
  const gateCore = new THREE.Mesh(new THREE.PlaneGeometry(TRACK_WIDTH * 1.16, 9.4), new THREE.MeshBasicMaterial({ color: 0x9ee7ff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  portal.add(gateCore);
  portal.position.copy(sample.point).addScaledVector(sample.tangent, 3.0);
  portal.position.y += 8.6;
  portal.rotation.y = yaw;
  trackInfo.group.add(portal);
  const portalLight = new THREE.PointLight(0x7df9ff, 22, 72, 2);
  portalLight.position.copy(portal.position);
  trackInfo.group.add(portalLight);
}

function addBoostPanels(trackInfo) {
  (trackInfo.layout || courseLayout()).boostPanels.forEach((index, i) => {
    const sample = trackInfo.samples[index];
    const panelMap = createAtlasTileTexture(1, 0) || createRoadDecalTexture("arrow");
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(10.2, 0.28, 7.8),
      new THREE.MeshStandardMaterial({
        map: panelMap,
        color: 0xffffff,
        emissive: 0x20ffd6,
        emissiveMap: panelMap,
        emissiveIntensity: 1.85,
        roughness: 0.08,
        metalness: 0.46
      })
    );
    panel.position.copy(sample.point);
    panel.position.y += 0.16;
    panel.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
    panel.userData = { index, radius: 9 };
    trackInfo.group.add(panel);

    const glowPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(11.8, 9.2),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd166 : 0x7df9ff, transparent: true, opacity: 0.24, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    glowPlate.position.copy(sample.point);
    glowPlate.position.y += 0.2;
    glowPlate.rotation.x = -Math.PI / 2;
    glowPlate.rotation.z = -Math.atan2(sample.tangent.x, sample.tangent.z);
    trackInfo.group.add(glowPlate);

    const chevron = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 3.2, 3),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    chevron.position.copy(sample.point).addScaledVector(sample.tangent, 0.4);
    chevron.position.y += 0.34;
    chevron.rotation.x = Math.PI / 2;
    chevron.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
    chevron.scale.set(1.8, 0.72, 1);
    trackInfo.group.add(chevron);

    boostPanels.push(panel);
    addBeacon(sample.point, i % 2 ? 0xffc857 : 0x5de7ff);
  });
}

function addDirtZones(trackInfo) {
  (trackInfo.layout || courseLayout()).dirtZones.forEach(([start, end, offset]) => {
    createTrackRibbon(trackInfo, offset, 7.5, 0x705042, 0x341a16, 0.72, true, 1, start, end);
  });
}

function addJumpRamps(trackInfo) {
  (trackInfo.layout || courseLayout()).jumpRamps.forEach((index) => {
    const sample = trackInfo.samples[index];
    const ramp = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1.3, 7),
      new THREE.MeshStandardMaterial({
        color: 0x2d3f55,
        emissive: 0x355f7a,
        emissiveIntensity: 0.35,
        roughness: 0.35,
        metalness: 0.4
      })
    );
    ramp.position.copy(sample.point);
    ramp.position.y += 0.65;
    const yaw = Math.atan2(sample.tangent.x, sample.tangent.z);
    ramp.rotation.y = yaw;
    ramp.rotation.x = -10 * DEG;
    ramp.userData = { index, radius: 10 };
    trackInfo.group.add(ramp);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0x9ee7ff, transparent: true, opacity: 0.58, blending: THREE.AdditiveBlending, depthWrite: false });
    [0, 1].forEach((step) => {
      const lowGravityRing = new THREE.Mesh(new THREE.TorusGeometry(4.8 + step * 1.2, 0.07, 8, 64), ringMat.clone());
      lowGravityRing.position.copy(sample.point).addScaledVector(sample.tangent, 2.4 + step * 2.2);
      lowGravityRing.position.y += 4.4 + step * 1.2;
      lowGravityRing.rotation.y = yaw;
      lowGravityRing.rotation.z = step * 0.34;
      trackInfo.group.add(lowGravityRing);
    });
    obstacles.push({ mesh: ramp, radius: 0, type: "ramp", index });
  });
}

function addItemBoxes(trackInfo) {
  (trackInfo.layout || courseLayout()).itemBoxes.forEach(([index, offset], n) => {
    const sample = trackInfo.samples[index];
    const group = new THREE.Group();
    const glyphMap = createAtlasTileTexture(2 + (n % 2), 1) || createAdPanelTexture("\u3069\u3046\u3050", n + 50);
    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(3.35, 3.35, 3.35),
      new THREE.MeshStandardMaterial({
        map: glyphMap,
        color: 0xffffff,
        emissive: 0x60e9ff,
        emissiveMap: glyphMap,
        emissiveIntensity: 1.15,
        metalness: 0.28,
        roughness: 0.18,
        transparent: true,
        opacity: 0.84
      })
    );
    shell.rotation.set(0.12, 0.28, 0.08);
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.18, 1),
      new THREE.MeshStandardMaterial({
        color: 0xffd166,
        emissive: 0xff9f1c,
        emissiveIntensity: 1.15,
        roughness: 0.16,
        metalness: 0.28
      })
    );
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(2.18, 0.07, 8, 42),
      new THREE.MeshBasicMaterial({ color: n % 2 ? 0xff5fa8 : 0x7df9ff, transparent: true, opacity: 0.68, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    halo.rotation.x = Math.PI / 2;
    const base = new THREE.Mesh(
      new THREE.CircleGeometry(2.3, 36),
      new THREE.MeshBasicMaterial({ color: n % 2 ? 0xff5fa8 : 0x7df9ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    base.rotation.x = -Math.PI / 2;
    base.position.y = -2.15;
    group.add(shell, core, halo, base);
    group.position.copy(sample.point).addScaledVector(sample.normal, offset);
    group.position.y += 2.8;
    group.userData = { index, cooldown: 0, offset, shell, core, halo, baseY: group.position.y };
    trackInfo.group.add(group);
    itemBoxes.push(group);
  });
}

function addObstacles(trackInfo) {
  (trackInfo.layout || courseLayout()).obstacles.forEach(([index, offset, type]) => {
    const sample = trackInfo.samples[index];
    const mesh =
      type === "crate"
        ? new THREE.Mesh(
            new THREE.BoxGeometry(5, 4, 5),
            new THREE.MeshStandardMaterial({ color: 0x29364a, emissive: 0x402b57, emissiveIntensity: 0.2 })
          )
        : new THREE.Mesh(
            new THREE.ConeGeometry(2.2, 5.2, 6),
            new THREE.MeshStandardMaterial({ color: 0xff7a5c, emissive: 0xff3d81, emissiveIntensity: 0.35 })
          );
    mesh.position.copy(sample.point).addScaledVector(sample.normal, offset);
    mesh.position.y += type === "crate" ? 2 : 2.6;
    mesh.rotation.y = rand() * Math.PI;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    trackInfo.group.add(mesh);
    obstacles.push({
      mesh,
      radius: type === "crate" ? 3.8 : 2.05,
      type,
      index,
      normal: sample.normal.clone(),
      tangent: sample.tangent.clone()
    });
  });
}

function addRails(trackInfo) {
  for (let i = 0; i < TRACK_STEPS; i += (QUALITY.low ? 32 : 10)) {
    const sample = trackInfo.samples[i];
    for (let side = -1; side <= 1; side += 2) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 2.2, 0.8),
        new THREE.MeshStandardMaterial({
          color: side > 0 ? 0x263d55 : 0x3a304a,
          emissive: side > 0 ? 0x58d9ff : 0xffb45f,
          emissiveIntensity: 0.28
        })
      );
      post.position.copy(sample.point).addScaledVector(sample.normal, side * (TRACK_WIDTH * 0.55 + 0.7));
      post.position.y += 1.1;
      trackInfo.group.add(post);
    }
  }
}

function addRoadDetails(trackInfo) {
  const arrowMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xff9f1c, emissiveIntensity: 0.95, roughness: 0.2, metalness: 0.22 });
  const laneMat = new THREE.MeshBasicMaterial({ color: 0xbefbff, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false });
  addRoadDecalRuns(trackInfo);
  addRoadPanelSeams(trackInfo);
  for (let i = 8; i < TRACK_STEPS; i += (QUALITY.low ? 36 : 14)) {
    const sample = trackInfo.samples[i];
    const lane = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 4.4), laneMat);
    lane.position.copy(sample.point).addScaledVector(sample.normal, i % 28 === 0 ? -3.8 : 3.8);
    lane.position.y += 0.1;
    lane.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
    trackInfo.group.add(lane);
  }
  const guideArrowIndices = QUALITY.low ? [24, 138, 306] : [24, 96, 138, 214, 306, 372];
  guideArrowIndices.forEach((index, n) => {
    const sample = trackInfo.samples[layoutIndex(index)];
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(1.25, 2.9, 3), arrowMat);
    arrow.position.copy(sample.point).addScaledVector(sample.normal, n % 2 ? -2.4 : 2.4);
    arrow.position.y += 0.12;
    arrow.rotation.x = Math.PI / 2;
    arrow.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
    arrow.scale.set(1.4, 0.68, 1);
    trackInfo.group.add(arrow);
  });
  for (let i = 0; i < TRACK_STEPS; i += (QUALITY.low ? 48 : 16)) {
    const sample = trackInfo.samples[i];
    for (let side = -1; side <= 1; side += 2) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.18, 7.2),
        new THREE.MeshBasicMaterial({ color: side > 0 ? 0x58d9ff : 0xffc857, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      rail.position.copy(sample.point).addScaledVector(sample.normal, side * (TRACK_WIDTH * 0.58 + 0.9));
      rail.position.y += 1.72;
      rail.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
      trackInfo.group.add(rail);
    }
  }
}
function addRacingLineGuides(trackInfo) {
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: QUALITY.low ? 0.28 : 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
  const turnMat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: QUALITY.low ? 0.36 : 0.52, blending: THREE.AdditiveBlending, depthWrite: false });
  const step = Math.max(12, QUALITY.guideStep || 24);
  for (let i = Math.floor(step * 0.5); i < TRACK_STEPS; i += step) {
    const sample = trackInfo.samples[i];
    const future = trackInfo.samples[(i + Math.floor(step * 1.8)) % TRACK_STEPS];
    const curve = 1 - clamp(sample.tangent.dot(future.tangent), -1, 1);
    const laneOffset = curve > 0.12 ? (i % (step * 4) < step * 2 ? -2.6 : 2.6) : (i % (step * 3) === 0 ? 1.8 : -1.8);
    const yaw = Math.atan2(sample.tangent.x, sample.tangent.z);
    const dash = new THREE.Mesh(new THREE.BoxGeometry(curve > 0.12 ? 0.24 : 0.16, 0.045, curve > 0.12 ? 5.8 : 3.8), curve > 0.12 ? turnMat.clone() : lineMat.clone());
    dash.position.copy(sample.point).addScaledVector(sample.normal, laneOffset);
    dash.position.y += 0.18;
    dash.rotation.y = yaw;
    trackInfo.group.add(dash);

    if (curve > 0.14) {
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.9, 3), turnMat.clone());
      arrow.position.copy(sample.point).addScaledVector(sample.normal, laneOffset * 1.18).addScaledVector(sample.tangent, 1.15);
      arrow.position.y += 0.24;
      arrow.rotation.x = Math.PI / 2;
      arrow.rotation.y = yaw;
      arrow.scale.set(1.18, 0.62, 1);
      trackInfo.group.add(arrow);
    }
  }
}
function addCornerGuideMarkers(trackInfo) {
  const colors = [0x7df9ff, 0xffd166, 0xff4fd8, 0x34f0b2];
  const labels = ["TURN", "BOOST", "LOW-G", "ORBIT", "PIT", "GO"];
  const markerIndices = QUALITY.low ? [28, 166, 336] : [28, 70, 116, 166, 222, 274, 336, 388];
  markerIndices.forEach((index, n) => {
    const sample = trackInfo.samples[layoutIndex(index)];
    const side = n % 2 ? -1 : 1;
    const color = colors[n % colors.length];
    const yaw = Math.atan2(sample.tangent.x, sample.tangent.z);
    const marker = new THREE.Group();
    const sign = createTextSprite(labels[n % labels.length], color, 0.78);
    sign.position.set(0, 5.6, 0);
    sign.scale.set(7.2, 2.6, 1);
    marker.add(sign);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x0e1728, emissive: color, emissiveIntensity: 0.32, roughness: 0.34, metalness: 0.58 });
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.28, 5.0, 0.28), mastMat);
    mast.position.y = 2.4;
    marker.add(mast);
    for (let i = 0; i < 3; i += 1) {
      const chevron = new THREE.Mesh(new THREE.ConeGeometry(0.46, 1.2, 3), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false }));
      chevron.position.set(side * (1.0 + i * 0.62), 0.72, -1.4 + i * 1.2);
      chevron.rotation.x = Math.PI / 2;
      chevron.rotation.y = side > 0 ? Math.PI : 0;
      marker.add(chevron);
    }
    const baseLight = new THREE.PointLight(color, 6, 22, 2);
    baseLight.position.set(0, 4.4, 0);
    marker.add(baseLight);
    marker.position.copy(sample.point).addScaledVector(sample.normal, side * (TRACK_WIDTH * 0.72 + 6.2));
    marker.position.y += 0.6;
    marker.rotation.y = yaw + (side > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
    trackInfo.group.add(marker);
  });
}

function addRoadPanelSeams(trackInfo) {
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
  const gripMat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < TRACK_STEPS; i += (QUALITY.low ? 28 : 6)) {
    const sample = trackInfo.samples[i];
    const yaw = Math.atan2(sample.tangent.x, sample.tangent.z);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH * 0.88, 0.035, 0.08), seamMat);
    seam.position.copy(sample.point);
    seam.position.y += 0.11;
    seam.rotation.y = yaw;
    trackInfo.group.add(seam);

    if (i % (QUALITY.low ? 56 : 12) === 0) {
      [-1, 1].forEach((side) => {
        const grip = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.038, 2.0), gripMat);
        grip.position.copy(sample.point).addScaledVector(sample.normal, side * (TRACK_WIDTH * 0.32 + (i % 24 === 0 ? 0.9 : -0.4)));
        grip.position.y += 0.12;
        grip.rotation.y = yaw + side * 0.03;
        trackInfo.group.add(grip);
      });
    }
  }
}
function createRoadSurfaceTexture() {
  const canvas = document.createElement("canvas");
  const size = QUALITY.low ? 256 : 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#203246");
  gradient.addColorStop(0.5, "#111d2b");
  gradient.addColorStop(1, "#293c52");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += QUALITY.low ? 24 : 32) {
    ctx.fillStyle = "rgba(125, 249, 255, 0.08)";
    ctx.fillRect(0, y, size, 2);
  }
  for (let x = 0; x < size; x += QUALITY.low ? 48 : 64) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
    ctx.fillRect(x, 0, 1, size);
  }
  const scratchCount = QUALITY.low ? 90 : 260;
  for (let i = 0; i < scratchCount; i += 1) {
    const a = rand();
    ctx.fillStyle = a > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.12)";
    ctx.fillRect(rand() * size, rand() * size, 4 + rand() * (QUALITY.low ? 24 : 42), 1 + rand() * 3);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, QUALITY.low ? 12 : 20);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function createRoadRoughnessTexture() {
  const canvas = document.createElement("canvas");
  const size = QUALITY.low ? 128 : 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#999";
  ctx.fillRect(0, 0, size, size);
  const noiseCount = QUALITY.low ? 140 : 400;
  for (let i = 0; i < noiseCount; i += 1) {
    const value = Math.floor(95 + rand() * 95);
    ctx.fillStyle = `rgb(${value},${value},${value})`;
    ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 8, 1 + rand() * 8);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, QUALITY.low ? 10 : 18);
  return texture;
}
function addRoadDecalRuns(trackInfo) {
  const wearTexture = createRoadDecalTexture("wear");
  const arrowTexture = createRoadDecalTexture("arrow");
  const hazardTexture = createRoadDecalTexture("hazard");
  for (let i = 18; i < TRACK_STEPS; i += (QUALITY.low ? 54 : 18)) {
    const sample = trackInfo.samples[i];
    const lateral = ((i / 18) % 3 - 1) * 3.1;
    addRoadDecal(trackInfo, sample, lateral, 4.4 + rand() * 2.4, 1.1 + rand() * 0.8, wearTexture, 0.3 + rand() * 0.18);
  }
  const arrowDecalIndices = QUALITY.low ? [30, 148, 318] : [30, 66, 108, 148, 198, 252, 318, 382];
  arrowDecalIndices.forEach((index, n) => {
    addRoadDecal(trackInfo, trackInfo.samples[layoutIndex(index)], n % 2 ? -2.8 : 2.8, 5.8, 3.8, arrowTexture, 0.72);
  });
  const hazardDecalIndices = QUALITY.low ? [155, 274] : [155, 166, 177, 262, 274, 286];
  hazardDecalIndices.forEach((index, n) => {
    addRoadDecal(trackInfo, trackInfo.samples[layoutIndex(index)], n % 2 ? -4.4 : 4.4, 4.2, 2.4, hazardTexture, 0.68);
  });
}

function addRoadDecal(trackInfo, sample, lateral, length, width, texture, opacity) {
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  decal.position.copy(sample.point).addScaledVector(sample.normal, lateral);
  decal.position.y += 0.13;
  decal.rotation.x = -Math.PI / 2;
  decal.rotation.z = -Math.atan2(sample.tangent.x, sample.tangent.z);
  trackInfo.group.add(decal);
}

function createRoadDecalTexture(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 256);
  if (kind === "arrow") {
    ctx.fillStyle = "rgba(125, 249, 255, 0.22)";
    ctx.fillRect(110, 12, 36, 158);
    ctx.beginPath();
    ctx.moveTo(128, 238);
    ctx.lineTo(42, 142);
    ctx.lineTo(92, 142);
    ctx.lineTo(92, 24);
    ctx.lineTo(164, 24);
    ctx.lineTo(164, 142);
    ctx.lineTo(214, 142);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 209, 102, 0.86)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 8;
    ctx.stroke();
  } else if (kind === "hazard") {
    for (let x = -256; x < 512; x += 44) {
      ctx.fillStyle = "rgba(255, 176, 32, 0.88)";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 24, 0);
      ctx.lineTo(x + 280, 256);
      ctx.lineTo(x + 256, 256);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fillRect(0, 0, 256, 256);
  } else {
    for (let i = 0; i < 32; i += 1) {
      ctx.strokeStyle = `rgba(255,255,255,${0.05 + rand() * 0.14})`;
      ctx.lineWidth = 1 + rand() * 4;
      ctx.beginPath();
      const y = rand() * 256;
      ctx.moveTo(rand() * 70, y);
      ctx.lineTo(170 + rand() * 86, y + (rand() - 0.5) * 28);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let i = 0; i < 12; i += 1) ctx.fillRect(rand() * 256, rand() * 256, 20 + rand() * 70, 2 + rand() * 8);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function addBeacon(position, color) {
  const beacon = new THREE.PointLight(color, 20, 40, 2);
  beacon.position.copy(position);
  beacon.position.y += 6;
  scene.add(beacon);
  trackLights.push(beacon);
}

function buildEnvironment() {
  const city = new THREE.Group();
  addStarDustSea(city);

  const towerCount = QUALITY.low ? 12 : Math.round(132 * QUALITY.environmentScale);
  for (let i = 0; i < towerCount; i += 1) {
    const radius = 145 + rand() * 330;
    const angle = rand() * Math.PI * 2;
    const height = 18 + rand() * 125;
    const width = 8 + rand() * 24;
    const color = i % 4 === 0 ? 0x14243c : i % 4 === 1 ? 0x1c304b : i % 4 === 2 ? 0x25213b : 0x172a32;
    const glow = i % 3 === 0 ? 0x173e5e : i % 3 === 1 ? 0x4c2449 : 0x3a3517;
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, width * (0.72 + rand() * 0.5)),
      new THREE.MeshStandardMaterial({ color, emissive: glow, emissiveIntensity: 0.22, roughness: 0.62, metalness: 0.28 })
    );
    tower.position.set(Math.cos(angle) * radius, height * 0.5 - 22 - rand() * 18, Math.sin(angle) * radius);
    tower.rotation.y = rand() * Math.PI;
    tower.castShadow = !QUALITY.low && i % 9 === 0;
    tower.receiveShadow = false;
    city.add(tower);
    addTowerWindows(city, tower, width, height, i);

    if (i % 7 === 0) {
      const crown = new THREE.Mesh(
        new THREE.OctahedronGeometry(width * (0.32 + rand() * 0.18), 0),
        new THREE.MeshStandardMaterial({ color: 0x6cf7ff, emissive: i % 2 ? 0x6cf7ff : 0xffc857, emissiveIntensity: 0.9, roughness: 0.18, metalness: 0.3 })
      );
      crown.position.copy(tower.position);
      crown.position.y += height * 0.54 + 4;
      crown.rotation.y = rand() * Math.PI;
      city.add(crown);
    }
  }

  const orbitRingCount = QUALITY.low ? 3 : Math.round(28 * QUALITY.environmentScale);
  for (let i = 0; i < orbitRingCount; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(8 + rand() * 18, 0.42, 8, 42),
      new THREE.MeshStandardMaterial({ color: 0x1f3147, emissive: i % 2 ? 0x5ee7ff : 0xffc857, emissiveIntensity: 0.72, roughness: 0.25, metalness: 0.45 })
    );
    const s = track.samples[Math.floor(rand() * TRACK_STEPS)];
    ring.position.copy(s.point).addScaledVector(s.normal, rand() > 0.5 ? 38 + rand() * 38 : -38 - rand() * 38);
    ring.position.y += 14 + rand() * 34;
    ring.rotation.set(rand() * 0.6, rand() * Math.PI, rand() * 0.6);
    city.add(ring);
  }

  addSpaceGrandPrixSet(city);
  addOrbitVenueDetails(city);
  addAdPanels(city);
  if (!QUALITY.low) {
    addTracksideBillboards(city);
    addFestivalRaceProps(city);
    addDrones(city);
    addSpaceDrones(city);
    addSpectatorHolograms(city);
  }
  addLandmarkSpire(city, 126, 48, 0xff5fa8);
  addLandmarkSpire(city, 272, -52, 0x7df9ff);
  addNeonGate(city, 54, 0xffd166, "WARP");
  if (!QUALITY.low) {
    addNeonGate(city, 118, 0x60e9ff, "JUMP");
    addNeonGate(city, 308, 0xff5fa8, "ORBIT");
  }
  scene.add(city);
  environmentGroup = city;
  return city;
}

function addTowerWindows(city, tower, width, height, index) {
  if (height < 32) return;
  const material = new THREE.MeshBasicMaterial({ color: index % 2 ? 0x7df9ff : 0xffd166, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false });
  const rows = Math.min(QUALITY.low ? 1 : 9, Math.floor(height / 12));
  for (let r = 0; r < rows; r += 1) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.54, 0.32, 0.05), material);
    strip.position.copy(tower.position);
    strip.position.y = tower.position.y - height * 0.34 + r * (height * 0.68 / rows);
    strip.position.z += width * 0.51;
    strip.rotation.y = tower.rotation.y;
    city.add(strip);
  }
}

function addStarDustSea(city) {
  const dustMat = new THREE.MeshBasicMaterial({ color: 0x9ee7ff, transparent: true, opacity: 0.11, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const dustCount = QUALITY.low ? 24 : 72;
  for (let i = 0; i < dustCount; i += 1) {
    const dust = new THREE.Mesh(new THREE.CircleGeometry(10 + rand() * 38, QUALITY.low ? 8 : 18), dustMat);
    const angle = rand() * Math.PI * 2;
    const radius = 82 + rand() * 480;
    dust.position.set(Math.cos(angle) * radius, -24 - rand() * 42, Math.sin(angle) * radius);
    dust.rotation.x = -Math.PI / 2;
    dust.scale.set(1.2 + rand() * 2.8, 0.22 + rand() * 0.34, 1);
    city.add(dust);
  }
}

function addCloudSea(city) {
  addStarDustSea(city);
}

function createTextSprite(label, color = 0xffffff, opacity = 0.9) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  const hex = "#" + Number(color).toString(16).padStart(6, "0");
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, hex);
  gradient.addColorStop(0.5, "#081226");
  gradient.addColorStop(1, "#ffffff");
  ctx.fillStyle = "rgba(3, 8, 20, 0.72)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = hex;
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
  ctx.fillStyle = gradient;
  ctx.font = "bold 58px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(label || "STAR"), canvas.width / 2, canvas.height / 2 + 4);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let x = 36; x < canvas.width; x += 48) ctx.fillRect(x, 24, 18, 3);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, opacity, depthWrite: false }));
}

function addSpaceGrandPrixSet(city) {
  const planetMat = new THREE.MeshStandardMaterial({ color: 0x294d91, emissive: 0x122f7a, emissiveIntensity: 0.62, roughness: 0.38, metalness: 0.08 });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(42, QUALITY.low ? 28 : 48, QUALITY.low ? 14 : 24), planetMat);
  planet.position.set(-210, 82, -250);
  city.add(planet);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(62, 1.2, 8, QUALITY.low ? 48 : 96), new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending }));
  ring.position.copy(planet.position);
  ring.rotation.set(1.18, 0.12, -0.38);
  city.add(ring);

  const station = new THREE.Group();
  station.position.set(205, 58, -190);
  const stationMat = new THREE.MeshStandardMaterial({ color: 0x243248, emissive: 0x1c6f8e, emissiveIntensity: 0.48, roughness: 0.32, metalness: 0.56 });
  station.add(new THREE.Mesh(new THREE.SphereGeometry(11, QUALITY.low ? 16 : 24, QUALITY.low ? 10 : 16), stationMat));
  const stationRing = new THREE.Mesh(new THREE.TorusGeometry(25, 1.3, 8, QUALITY.low ? 36 : 72), new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.52, blending: THREE.AdditiveBlending }));
  stationRing.rotation.x = Math.PI / 2;
  station.add(stationRing);
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(48, 2.2, 3.2), stationMat);
    arm.rotation.y = side * 0.3;
    station.add(arm);
    const dock = new THREE.Mesh(new THREE.BoxGeometry(9, 7, 9), stationMat.clone());
    dock.position.set(side * 30, 0, 0);
    station.add(dock);
  });
  city.add(station);

  const meteorCount = QUALITY.low ? 4 : 18;
  for (let i = 0; i < meteorCount; i += 1) {
    const sample = track.samples[Math.floor(rand() * TRACK_STEPS)];
    const meteor = new THREE.Group();
    const dir = i % 2 ? 1 : -1;
    meteor.position.copy(sample.point).addScaledVector(sample.normal, dir * (70 + rand() * 110));
    meteor.position.y += 32 + rand() * 64;
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.9 + rand() * 0.9, 7 + rand() * 9, QUALITY.low ? 8 : 12), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff4fd8 : 0x7df9ff, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending }));
    core.rotation.z = -54 * DEG;
    meteor.add(core);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 1.1, 28 + rand() * 24, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
    tail.rotation.z = -54 * DEG;
    tail.position.set(-9, -7, 0);
    meteor.add(tail);
    city.add(meteor);
  }

  const grandPrixSigns = QUALITY.low
    ? [[24, "STAR"], [176, "MOON"], [338, "GO!"]]
    : [[24, "STAR"], [92, "BOOST"], [176, "MOON"], [248, "STATION"], [338, "GO!"]];
  grandPrixSigns.forEach(([index, label], i) => {
    const sample = track.samples[layoutIndex(index)];
    const sign = createTextSprite(label, i % 2 ? 0xff4fd8 : 0x7df9ff, 0.82);
    sign.position.copy(sample.point).addScaledVector(sample.normal, i % 2 ? 34 : -34);
    sign.position.y += 13 + i * 0.8;
    sign.scale.set(13, 5.2, 1);
    city.add(sign);
  });
}
function addOrbitVenueDetails(city) {
  const farPlanet = new THREE.Mesh(
    new THREE.SphereGeometry(30, QUALITY.low ? 24 : 44, QUALITY.low ? 12 : 22),
    new THREE.MeshStandardMaterial({ color: 0x3b1b5d, emissive: 0x3d1768, emissiveIntensity: 0.54, roughness: 0.42, metalness: 0.05 })
  );
  farPlanet.position.set(285, 116, 240);
  city.add(farPlanet);
  const farRing = new THREE.Mesh(new THREE.TorusGeometry(46, 0.9, 8, 88), new THREE.MeshBasicMaterial({ color: 0xff4fd8, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending }));
  farRing.position.copy(farPlanet.position);
  farRing.rotation.set(1.34, 0.28, 0.42);
  city.add(farRing);

  const moonMat = new THREE.MeshStandardMaterial({ color: 0xbfd7ff, emissive: 0x4b79a8, emissiveIntensity: 0.18, roughness: 0.68 });
  for (let i = 0; i < 3; i += 1) {
    const moon = new THREE.Mesh(new THREE.SphereGeometry(5 + i * 2.2, 20, 12), moonMat.clone());
    moon.position.set(245 + i * 23, 88 + i * 8, 205 - i * 18);
    city.add(moon);
  }

  const streakMat = new THREE.MeshBasicMaterial({ color: 0xdffbff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
  const streakCount = QUALITY.low ? 6 : Math.round(56 * QUALITY.environmentScale);
  for (let i = 0; i < streakCount; i += 1) {
    const streak = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 18 + rand() * 36), streakMat.clone());
    const angle = rand() * Math.PI * 2;
    const radius = 170 + rand() * 520;
    streak.position.set(Math.cos(angle) * radius, 24 + rand() * 180, Math.sin(angle) * radius);
    streak.rotation.set(rand() * 0.3, angle + Math.PI * 0.36, -26 * DEG);
    city.add(streak);
  }

  const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x2a2d39, emissive: 0x141a2a, emissiveIntensity: 0.16, roughness: 0.76, metalness: 0.08 });
  const asteroidCount = QUALITY.low ? 4 : Math.round(30 * QUALITY.environmentScale);
  for (let i = 0; i < asteroidCount; i += 1) {
    const asteroid = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + rand() * 3.8, 0), asteroidMat);
    const angle = rand() * Math.PI * 2;
    const radius = 130 + rand() * 270;
    asteroid.position.set(Math.cos(angle) * radius, -12 + rand() * 78, Math.sin(angle) * radius);
    asteroid.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    asteroid.scale.y = 0.62 + rand() * 0.9;
    city.add(asteroid);
  }

  for (let i = 0; i < TRACK_STEPS; i += QUALITY.venueStep) {
    const sample = track.samples[i];
    [-1, 1].forEach((side) => {
      const buoyColor = side > 0 ? 0x7df9ff : 0xffd166;
      const buoy = new THREE.Group();
      const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.72, 0), new THREE.MeshStandardMaterial({ color: 0x162235, emissive: buoyColor, emissiveIntensity: 0.42, roughness: 0.32, metalness: 0.48 }));
      const halo = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.04, 8, 32), new THREE.MeshBasicMaterial({ color: buoyColor, transparent: true, opacity: 0.54, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.rotation.x = Math.PI / 2;
      buoy.add(body, halo);
      if (!QUALITY.low) {
        const light = new THREE.PointLight(buoyColor, 4.5, 24, 2);
        light.position.y = 0.5;
        buoy.add(light);
      }
      buoy.position.copy(sample.point).addScaledVector(sample.normal, side * (TRACK_WIDTH * 0.66 + 7.4));
      buoy.position.y += 3.2 + Math.sin(i) * 0.8;
      city.add(buoy);
    });
  }
}

function addAdPanels(city) {
  const labels = ["AURORA", "RIFT", "LUMEN", "SKY ARC", "PRISM", "VELOCITY"];
  const adPanelIndices = QUALITY.low ? [34, 166, 338] : [34, 74, 166, 244, 338, 390];
  adPanelIndices.forEach((index, i) => {
    const sample = track.samples[layoutIndex(index)];
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 6),
      makeAtlasMaterial(i % 4, Math.floor(i / 4) % 2, 0x7df9ff, 0.92)
    );
    panel.position.copy(sample.point).addScaledVector(sample.normal, i % 2 ? -32 : 32);
    panel.position.y += 10 + (i % 3) * 4;
    panel.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z) + (i % 2 ? Math.PI * 0.5 : -Math.PI * 0.5);
    city.add(panel);
  });
}

function addTracksideBillboards(city) {
  const labels = ["\u30c0\u30c3\u30b7\u30e5", "\u30c9\u30ea\u30d5\u30c8", "\u3072\u304b\u308a", "\u30ec\u30fc\u30b9TV", "\u30d4\u30c3\u30c8", "\u7a7a\u306e\u9053", "\u30cd\u30aa\u30f3", "\u30b9\u30bf\u30fc\u30c8"];
  [18, 42, 92, 132, 188, 226, 284, 346].forEach((index, i) => {
    const sample = track.samples[layoutIndex(index)];
    const side = i % 2 ? -1 : 1;
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x101a2b, emissive: i % 2 ? 0xff5fa8 : 0x45e8ff, emissiveIntensity: 0.22, roughness: 0.38, metalness: 0.55 });
    const group = new THREE.Group();
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.42, 8.8, 0.42), mastMat);
    mast.position.y = 4.2;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.28, 0.28), mastMat);
    arm.position.set(side * -2.4, 7.7, 0);
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 3.0),
      makeAtlasMaterial((i + 1) % 4, 2 + Math.floor(i / 4), i % 2 ? 0xff5fa8 : 0x7df9ff, 0.96)
    );
    panel.position.set(side * -5.2, 7.7, 0);
    group.add(mast, arm, panel);
    group.position.copy(sample.point).addScaledVector(sample.normal, side * (TRACK_WIDTH * 0.72 + 5.5));
    group.position.y += 0.2;
    group.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z) + (side > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
    city.add(group);
  });
}

function addSpaceDrones(city) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x22344d, emissive: 0x1b5d75, emissiveIntensity: 0.34, roughness: 0.32, metalness: 0.42 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false });
  [26, 76, 142, 214, 302, 368].forEach((index, i) => {
    const sample = track.samples[layoutIndex(index)];
    const side = i % 2 ? -1 : 1;
    const ship = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), mat.clone());
    body.scale.set(7.8 + i * 0.35, 1.55, 2.15);
    body.castShadow = true;
    const gondola = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.72, 1.2), new THREE.MeshStandardMaterial({ color: 0x0f1728, emissive: 0xff5fa8, emissiveIntensity: 0.22, roughness: 0.4, metalness: 0.52 }));
    gondola.position.y = -1.35;
    const tail = new THREE.Mesh(new THREE.ConeGeometry(1.25, 2.4, 4), mat.clone());
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -7.6;
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 1.8), makeAtlasMaterial((i + 2) % 4, 3, i % 2 ? 0xff5fa8 : 0xffd166, 0.72));
    banner.position.set(1.8, -2.35, 0.05);
    [-1, 1].forEach((sideWing) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.1), glow.clone());
      wing.position.set(0.6, 0, sideWing * 2.25);
      wing.rotation.y = sideWing * 10 * DEG;
      ship.add(wing);
    });
    const noseLight = new THREE.PointLight(i % 2 ? 0xff5fa8 : 0x7df9ff, 8, 52, 2);
    noseLight.position.set(6.2, 0.1, 0);
    ship.add(body, gondola, tail, banner, noseLight);
    ship.position.copy(sample.point).addScaledVector(sample.normal, side * (50 + i * 7));
    ship.position.y += 30 + (i % 3) * 9;
    ship.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z) + (side > 0 ? -0.55 : 0.55);
    city.add(ship);
  });
}
function createAdPanelTexture(label, index) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, index % 2 ? "#1de7ff" : "#ff5fa8");
  gradient.addColorStop(0.48, "#111827");
  gradient.addColorStop(1, "#ffcf66");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(5, 9, 20, 0.72)";
  ctx.fillRect(18, 18, canvas.width - 36, canvas.height - 36);
  ctx.strokeStyle = index % 2 ? "#7df9ff" : "#ffd166";
  ctx.lineWidth = 6;
  ctx.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);
  ctx.font = "bold 54px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f6fcff";
  ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 2);
  for (let y = 36; y < canvas.height; y += 22) {
    ctx.fillStyle = "rgba(125, 249, 255, 0.16)";
    ctx.fillRect(40, y, canvas.width - 80, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addFestivalRaceProps(city) {
  const colors = [0xffd166, 0x7df9ff, 0xff5fa8, 0x7cff9b, 0xb38cff];
  [12, 28, 64, 104, 154, 202, 256, 314, 372].forEach((index, i) => {
    const sample = track.samples[layoutIndex(index)];
    const side = i % 2 ? -1 : 1;
    const group = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x18283a, emissive: colors[i % colors.length], emissiveIntensity: 0.18, roughness: 0.4, metalness: 0.48 });
    const poleA = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 8.6, 8), poleMat);
    const poleB = poleA.clone();
    poleA.position.set(-4.6, 4.2, 0);
    poleB.position.set(4.6, 4.2, 0);
    group.add(poleA, poleB);
    for (let f = 0; f < 7; f += 1) {
      const flag = new THREE.Mesh(
        new THREE.ConeGeometry(0.52, 1.15, 3),
        new THREE.MeshBasicMaterial({ color: colors[(i + f) % colors.length], transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      flag.position.set(-3.6 + f * 1.2, 8.15 + Math.sin(f + i) * 0.18, 0);
      flag.rotation.set(Math.PI / 2, 0, Math.PI / 6);
      group.add(flag);
    }
    const balloon = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 20, 12),
      new THREE.MeshStandardMaterial({ color: colors[(i + 2) % colors.length], emissive: colors[(i + 2) % colors.length], emissiveIntensity: 0.42, roughness: 0.26, metalness: 0.08 })
    );
    balloon.scale.set(1, 1.22, 1);
    balloon.position.set(0, 11.0 + (i % 3) * 0.8, 0);
    const tether = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.0, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.34 }));
    tether.position.set(0, 9.2, 0);
    group.add(balloon, tether);
    group.position.copy(sample.point).addScaledVector(sample.normal, side * (TRACK_WIDTH * 0.82 + 7.5));
    group.position.y += 0.3;
    group.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z) + (side > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
    city.add(group);
  });
}
function addDrones(city) {
  const droneCount = QUALITY.low ? 6 : 18;
  for (let i = 0; i < droneCount; i += 1) {
    const drone = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 1.2), new THREE.MeshStandardMaterial({ color: 0x26364f, emissive: 0x1c6b88, emissiveIntensity: 0.28, roughness: 0.34, metalness: 0.5 }));
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd166 : 0x7df9ff }));
    light.position.z = 0.68;
    drone.add(body, light);
    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.36), new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending }));
      wing.position.x = side * 1.55;
      drone.add(wing);
    });
    const sample = track.samples[(i * 31 + 16) % TRACK_STEPS];
    drone.position.copy(sample.point).addScaledVector(sample.normal, i % 2 ? 56 : -56);
    drone.position.y += 18 + (i % 5) * 5;
    drone.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z) + Math.PI * 0.5;
    city.add(drone);
  }
}

function addSpectatorHolograms(city) {
  const matA = new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false });
  const matB = new THREE.MeshBasicMaterial({ color: 0xff5fa8, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false });
  [46, 52, 58, 230, 236, 242, 248, 352, 358, 364].forEach((index, n) => {
    const sample = track.samples[layoutIndex(index)];
    const holoCount = QUALITY.low ? 2 : 6;
    for (let j = 0; j < holoCount; j += 1) {
      const holo = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.7 + rand() * 0.6, 4, 6), (n + j) % 2 ? matA.clone() : matB.clone());
      holo.position.copy(sample.point).addScaledVector(sample.normal, (n % 2 ? -1 : 1) * (TRACK_WIDTH * 0.78 + j * 1.45));
      holo.position.y += 1.1 + rand() * 0.4;
      holo.rotation.y = rand() * Math.PI;
      city.add(holo);
    }
  });
}

function addLandmarkSpire(city, index, offset, color) {
  const sample = track.samples[layoutIndex(index)];
  const group = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 4.8, 62, 8), new THREE.MeshStandardMaterial({ color: 0x19263d, emissive: color, emissiveIntensity: 0.24, roughness: 0.38, metalness: 0.44 }));
  stem.position.y = 31;
  const halo = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.28, 8, 42), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.64, blending: THREE.AdditiveBlending }));
  halo.position.y = 54;
  halo.rotation.x = Math.PI / 2;
  group.add(stem, halo);
  group.position.copy(sample.point).addScaledVector(sample.normal, offset);
  group.position.y -= 10;
  city.add(group);
}

function addNeonGate(city, index, color, label) {
  const sample = track.samples[layoutIndex(index)];
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x15233a, emissive: color, emissiveIntensity: 0.45, roughness: 0.28, metalness: 0.5 });
  [-1, 1].forEach((side) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 16, 1.2), mat);
    pillar.position.set(side * (TRACK_WIDTH * 0.66), 8, 0);
    pillar.castShadow = true;
    group.add(pillar);
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH * 1.42, 1.0, 1.1), mat);
  beam.position.y = 15.5;
  group.add(beam);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.4), new THREE.MeshBasicMaterial({ map: createAdPanelTexture(label, index), transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  sign.position.y = 12.7;
  sign.position.z = -0.7;
  group.add(sign);
  group.position.copy(sample.point).addScaledVector(sample.tangent, 2.0);
  group.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z) + Math.PI / 2;
  city.add(group);
}
function createSpeedLines() {
  const material = new THREE.MeshBasicMaterial({
    color: 0xbefbff,
    transparent: true,
    opacity: 0.0,
    depthWrite: false
  });
  for (let i = 0; i < QUALITY.speedLineCount; i += 1) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 7 + rand() * 10), material.clone());
    line.userData = {
      side: rand() > 0.5 ? 1 : -1,
      phase: rand() * 100,
      radius: 5 + rand() * 12
    };
    line.renderOrder = 10;
    camera.add(line);
    speedLines.push(line);
  }
  scene.add(camera);
}

function resetRace() {
  clearRaceObjects();
  racers = [];
  player = null;
  const chosenCharacter = DATA.characters[state.selectedCharacter] || DATA.characters[0];
  const chosenKart = machineForCharacter(chosenCharacter, state.selectedCharacter);
  state.selectedKart = machineIndexForCharacter(chosenCharacter, state.selectedCharacter);
  player = createRacer(PLAYER_ID, chosenCharacter, chosenKart, 0, 0, true);
  racers.push(player);

  const cpuLimit = QUALITY.low ? 2 : DATA.characters.length;
  const cpuCount = Math.min(raceMode().rivals, DATA.characters.length, cpuLimit);
  for (let i = 0; i < cpuCount; i += 1) {
    const character = DATA.characters[(i + 1) % DATA.characters.length];
    const kart = machineForCharacter(character, (i + 1) % DATA.characters.length);
    racers.push(createRacer(`cpu-${i}`, character, kart, i + 1, i % 2 ? 4 : -4, false));
  }
  state.time = 0;
  state.finishTime = 0;
  state.rank = 1;
  state.winner = null;
  updateHud();
  previewSelection();
}

function clearRaceObjects() {
  racers.forEach((racer) => scene.remove(racer.group));
  projectiles.forEach((p) => scene.remove(p.mesh));
  traps.forEach((trap) => scene.remove(trap.mesh));
  particles.forEach((particle) => scene.remove(particle.mesh));
  tireMarks.forEach((mark) => scene.remove(mark.mesh));
  racers = [];
  player = null;
  projectiles = [];
  traps = [];
  particles = [];
  tireMarks = [];
}

function disposeObject3D(object) {
  object?.traverse?.((child) => {
    child.geometry?.dispose?.();
    const materials = Array.isArray(child.material) ? child.material : child.material ? [child.material] : [];
    materials.forEach((material) => {
      material.map?.dispose?.();
      material.emissiveMap?.dispose?.();
      material.roughnessMap?.dispose?.();
      material.dispose?.();
    });
  });
}

function rebuildTrackForSelectedCourse() {
  if (!scene) return;
  clearRaceObjects();
  if (track?.group) {
    scene.remove(track.group);
    disposeObject3D(track.group);
  }
  if (environmentGroup) {
    scene.remove(environmentGroup);
    disposeObject3D(environmentGroup);
    environmentGroup = null;
  }
  trackLights.forEach((light) => scene.remove(light));
  trackLights = [];
  itemBoxes = [];
  boostPanels = [];
  obstacles = [];
  seed = 11 + state.selectedCourse * 101;
  DATA.course = activeCourse();
  track = buildTrack();
  buildEnvironment();
  state.trackCourseId = DATA.course?.id || "";
  state.trackNeedsRebuild = false;
  markMenuDirty();
}

function ensureTrackForSelectedCourse() {
  DATA.course = activeCourse();
  if (!track || state.trackNeedsRebuild || state.trackCourseId !== (DATA.course?.id || "")) {
    rebuildTrackForSelectedCourse();
  }
}

function createRacer(id, character, kart, gridSlot, laneOffset, isPlayer) {
  const startSample = track.samples[0];
  const gridBack = 8 + gridSlot * 5;
  const pos = startSample.point
    .clone()
    .addScaledVector(startSample.tangent, -gridBack)
    .addScaledVector(startSample.normal, laneOffset);
  const yaw = Math.atan2(startSample.tangent.x, startSample.tangent.z);
  const group = createKartModel(character, kart, isPlayer);
  group.position.copy(pos);
  group.rotation.y = yaw;
  scene.add(group);
  const nearest = nearestTrackSample(pos);
  return {
    id,
    character,
    kart,
    group,
    position: pos,
    velocity: new THREE.Vector3(),
    yaw,
    speed: 0,
    verticalSpeed: 0,
    jumpHeight: 0,
    wasAirborne: false,
    lap: 0,
    startedLap: false,
    trackIndex: nearest.index,
    progress: nearest.index > TRACK_STEPS * 0.55 ? nearest.index - TRACK_STEPS : nearest.index,
    rank: 1,
    finished: false,
    finishTime: 0,
    item: null,
    itemCooldown: 0,
    boostTimer: 0,
    shieldTimer: 0,
    stunTimer: 0,
    obstacleCooldown: 0,
    unstuckCooldown: 0,
    stuckTimer: 0,
    controlSteer: 0,
    boostPanelLock: 0,
    impactPose: 0,
    driftCharge: 0,
    driftActive: false,
    driftDir: 0,
    miniTurboTimer: 0,
    wobble: 0,
    laneOffset,
    ai: {
      targetOffset: laneOffset,
      noise: rand() * 10,
      useTimer: 1 + rand() * 2
    },
    isPlayer
  };
}

function createKartModel(character, kart, isPlayer) {
  const group = new THREE.Group();
  const profile = getKartVisualProfile(kart);
  const primary = new THREE.Color(kart.colors.primary || character.colors.primary);
  const secondary = new THREE.Color(kart.colors.secondary || character.colors.secondary);
  const accent = new THREE.Color(kart.boostColor || character.boostColor || kart.colors.glow || kart.colors.accent || character.colors.accent);
  group.userData.machineMotionParts = { pulse: [], spin: [], flutter: [], hover: [] };
  group.userData.machineProfile = profile;
  group.userData.machineType = profile.type;
  group.userData.signatureColor = accent;
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: primary,
    emissive: primary,
    emissiveIntensity: isPlayer ? 0.18 : 0.1,
    roughness: 0.31,
    metalness: 0.62,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18
  });
  const trimMat = new THREE.MeshPhysicalMaterial({
    color: secondary,
    emissive: secondary,
    emissiveIntensity: 0.16,
    roughness: 0.42,
    metalness: 0.55,
    clearcoat: 0.25
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x07111d, roughness: 0.5, metalness: 0.65 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.58, metalness: 0.2 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 0.42,
    roughness: 0.08,
    metalness: 0.05,
    transmission: 0.15,
    transparent: true,
    opacity: 0.72
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const chassis = new THREE.Group();
  group.add(chassis);

  const body = new THREE.Mesh(
    createPrismGeometry(profile.width, profile.height, profile.length, profile.frontScale, profile.rearScale),
    bodyMat
  );
  body.position.y = 1.08;
  body.castShadow = true;
  body.receiveShadow = true;
  chassis.add(body);

  const belly = new THREE.Mesh(new THREE.BoxGeometry(profile.width * 0.78, 0.34, profile.length * 0.86), darkMat);
  belly.position.set(0, 0.66, -0.15);
  belly.castShadow = true;
  chassis.add(belly);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(profile.width * 0.34, profile.length * 0.46, 4), bodyMat);
  nose.rotation.x = Math.PI / 2;
  nose.rotation.z = Math.PI / 4;
  nose.position.set(0, 1.15, profile.length * 0.57);
  nose.scale.set(profile.noseScale, 1, 0.58);
  nose.castShadow = true;
  chassis.add(nose);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(profile.width * 0.28, 24, 14), glassMat);
  canopy.scale.set(1.08, 0.48, 0.82);
  canopy.position.set(0, 1.88, -0.16);
  canopy.castShadow = true;
  chassis.add(canopy);

  addGlowStrip(chassis, 0, 1.73, profile.length * 0.25, profile.width * 0.08, profile.length * 0.84, accent, 0);
  addGlowStrip(chassis, -profile.width * 0.44, 1.13, 0, 0.08, profile.length * 0.72, accent, -0.04);
  addGlowStrip(chassis, profile.width * 0.44, 1.13, 0, 0.08, profile.length * 0.72, accent, 0.04);

  const driver = createDriverModel(character, accent, secondary, primary);
  driver.position.set(0, profile.seatY || 2.5, profile.seatZ || -0.42);
  driver.rotation.x = profile.driverPitch || 0;
  chassis.add(driver);

  const holoMarker = createRacerHoloMarker(character, kart, accent);
  holoMarker.position.set(profile.holoX || profile.width * 0.36, (profile.seatY || 2.5) + 1.05, (profile.seatZ || -0.42) - 0.38);
  chassis.add(trackMachinePart(group, "hover", holoMarker));

  const wingY = 2.05 + profile.height * 0.18;
  const spoiler = new THREE.Group();
  const spoilerWidth = profile.type === "bastion" ? profile.width * 1.06 : profile.type === "comet" ? profile.width * 0.72 : profile.type === "moon" ? profile.width * 0.72 : profile.width * 0.96;
  const spoilerDepth = ["moon", "nebula"].includes(profile.type) ? 0.36 : profile.type === "comet" ? 0.46 : 0.66;
  const spoilerBlade = new THREE.Mesh(new THREE.BoxGeometry(spoilerWidth, 0.14, spoilerDepth), trimMat);
  spoilerBlade.position.set(0, wingY, -profile.length * 0.54);
  spoilerBlade.rotation.x = (profile.type === "moon" ? -15 : -8) * DEG;
  spoilerBlade.castShadow = true;
  spoiler.add(spoilerBlade);
  [-1, 1].forEach((side) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.78, 0.18), darkMat);
    post.position.set(side * profile.width * 0.34, wingY - 0.4, -profile.length * 0.5);
    spoiler.add(post);
  });
  chassis.add(spoiler);
  addKartSilhouetteKit(chassis, profile, character, kart, primary, secondary, accent, bodyMat, trimMat, glowMat, darkMat);
  addPremiumKartLivery(chassis, profile, character, kart, primary, secondary, accent, darkMat);
  addDedicatedMachineKit(chassis, profile, character, kart, primary, secondary, accent, bodyMat, trimMat, glowMat, darkMat, group);

  [-1, 1].forEach((side) => {
    const sidePod = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, profile.length * 0.52), trimMat);
    sidePod.position.set(side * profile.width * 0.58, 0.98, -0.12);
    sidePod.rotation.z = side * -4 * DEG;
    sidePod.castShadow = true;
    chassis.add(sidePod);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, profile.length * 0.68), glowMat.clone());
    blade.position.set(side * profile.width * 0.76, 1.1, 0.18);
    blade.rotation.z = side * 8 * DEG;
    chassis.add(blade);

    const frontWing = new THREE.Mesh(new THREE.BoxGeometry(profile.width * 0.38, 0.14, 0.78), trimMat);
    frontWing.position.set(side * profile.width * 0.34, 0.82, profile.length * 0.47);
    frontWing.rotation.set(0, side * 10 * DEG, side * -7 * DEG);
    frontWing.castShadow = true;
    chassis.add(frontWing);
  });

  const wheelPositions = [
    [-profile.width * 0.58, 0.62, profile.length * 0.29],
    [profile.width * 0.58, 0.62, profile.length * 0.29],
    [-profile.width * 0.61, 0.62, -profile.length * 0.35],
    [profile.width * 0.61, 0.62, -profile.length * 0.35]
  ];
  const hoverRings = [];
  wheelPositions.forEach(([x, y, z], index) => {
    const wheel = createWheelAssembly(profile, accent, tireMat, glowMat, index > 1);
    wheel.position.set(x, y, z);
    wheel.userData.spin = true;
    hoverRings.push(wheel);
    chassis.add(wheel);
  });

  const enginePlumes = [];
  [-0.42, 0.42].forEach((x) => {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 1.05, 18), darkMat);
    pod.rotation.x = Math.PI / 2;
    pod.position.set(x * profile.width, 1.02, -profile.length * 0.63);
    pod.castShadow = true;
    chassis.add(pod);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.055, 8, 28), glowMat.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(pod.position).add(new THREE.Vector3(0, 0, -0.58));
    chassis.add(ring);

    const plume = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.9, 18, 1, true), glowMat.clone());
    plume.rotation.x = -Math.PI / 2;
    plume.position.copy(pod.position).add(new THREE.Vector3(0, 0, -1.18));
    plume.scale.set(0.65, 0.65, 0.5);
    enginePlumes.push(plume);
    chassis.add(plume);
  });

  const underglow = new THREE.Mesh(
    new THREE.CircleGeometry(profile.width * 0.78, 36),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.17, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  underglow.rotation.x = -Math.PI / 2;
  underglow.position.y = 0.11;
  group.add(underglow);

  const engine = new THREE.PointLight(accent, isPlayer ? 9 : 5, 18, 2);
  engine.position.set(0, 1.0, -profile.length * 0.68);
  chassis.add(engine);

  group.userData.engineLight = engine;
  group.userData.glowMat = glowMat;
  group.userData.chassis = chassis;
  group.userData.driverRoot = driver;
  group.userData.hoverRings = hoverRings;
  group.userData.enginePlumes = enginePlumes;
  group.userData.underglow = underglow;
  return group;
}

function createRacerHoloMarker(character, kart, accent) {
  const texture = createRacerHoloTexture(character, kart, accent);
  const material = new THREE.SpriteMaterial({ map: texture, color: 0xffffff, transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.18, 1.18, 1);
  return sprite;
}

function createRacerHoloTexture(character, kart, accent) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  const accentCss = new THREE.Color(accent).getStyle();
  const primary = character.colors?.primary || kart.colors?.primary || "#7df9ff";
  const secondary = character.colors?.secondary || kart.colors?.secondary || "#14233b";
  ctx.clearRect(0, 0, 160, 160);
  const halo = ctx.createRadialGradient(80, 80, 8, 80, 80, 76);
  halo.addColorStop(0, "rgba(255,255,255,0.9)");
  halo.addColorStop(0.26, accentCss.replace("rgb", "rgba").replace(")", ",0.58)"));
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, 160, 160);
  ctx.strokeStyle = accentCss;
  ctx.lineWidth = 5;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.roundRect(26, 26, 108, 108, 20);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = primary;
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 6;
  const id = character.id || "";
  if (id === "luna-mimi") {
    ctx.beginPath();
    ctx.arc(84, 80, 32, 0.2 * Math.PI, 1.75 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(61, 51, 8, 24, -0.28, 0, Math.PI * 2);
    ctx.ellipse(100, 51, 8, 24, 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "gamma-bolt") {
    ctx.fillRect(50, 52, 60, 50);
    ctx.strokeRect(50, 52, 60, 50);
    ctx.fillStyle = accentCss;
    ctx.fillRect(61, 72, 38, 10);
    ctx.fillRect(38, 90, 84, 16);
  } else if (id === "nebi-mist") {
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const outer = i === 0 ? 42 : 24;
      const x = 80 + Math.cos(a) * outer;
      const y = 80 + Math.sin(a) * outer;
      ctx.beginPath();
      ctx.arc(x, y, i === 0 ? 10 : 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(80, 80, 28, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === "sora-ranger") {
    ctx.beginPath();
    ctx.moveTo(80, 36);
    ctx.lineTo(111, 112);
    ctx.lineTo(80, 96);
    ctx.lineTo(49, 112);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accentCss;
    ctx.fillRect(75, 48, 10, 44);
  } else {
    ctx.beginPath();
    ctx.moveTo(112, 48);
    ctx.lineTo(88, 112);
    ctx.lineTo(73, 87);
    ctx.lineTo(45, 115);
    ctx.lineTo(64, 54);
    ctx.lineTo(80, 75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function trackMachinePart(group, kind, mesh) {
  const parts = group.userData.machineMotionParts || (group.userData.machineMotionParts = { pulse: [], spin: [], flutter: [], hover: [] });
  if (!parts[kind]) parts[kind] = [];
  mesh.userData.basePosition = mesh.position.clone();
  mesh.userData.baseRotation = mesh.rotation.clone();
  mesh.userData.baseScale = mesh.scale.clone();
  parts[kind].push(mesh);
  return mesh;
}

function addDedicatedMachineKit(chassis, profile, character, kart, primary, secondary, accent, bodyMat, trimMat, glowMat, darkMat, group) {
  const id = kart.id || "";
  const accentHex = accent.getHex ? accent.getHex() : accent;
  const primaryHex = primary.getHex ? primary.getHex() : primary;
  const secondaryHex = secondary.getHex ? secondary.getHex() : secondary;
  const glow = new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const softGlow = new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const metal = new THREE.MeshStandardMaterial({ color: secondaryHex, emissive: accentHex, emissiveIntensity: 0.2, roughness: 0.28, metalness: 0.64 });
  const bright = new THREE.MeshStandardMaterial({ color: primaryHex, emissive: accentHex, emissiveIntensity: 0.22, roughness: 0.22, metalness: 0.42 });

  if (id === "moon-skipper") {
    [-1, 1].forEach((side) => {
      const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.055, 8, 46, Math.PI * 1.35), glow.clone());
      crescent.position.set(side * profile.width * 0.74, 1.34, profile.length * 0.18);
      crescent.rotation.set(Math.PI / 2, side * 18 * DEG, side * 54 * DEG);
      chassis.add(trackMachinePart(group, "pulse", crescent));

      const feather = new THREE.Mesh(createPrismGeometry(0.18, 0.5, 1.58, 0.28, 1), bright);
      feather.position.set(side * profile.width * 0.64, 1.62, -profile.length * 0.18);
      feather.rotation.set(-8 * DEG, side * -22 * DEG, side * -20 * DEG);
      feather.castShadow = true;
      chassis.add(trackMachinePart(group, "flutter", feather));
    });
    const noseMoon = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.048, 8, 42, Math.PI * 1.45), glow.clone());
    noseMoon.position.set(0, 1.48, profile.length * 0.64);
    noseMoon.rotation.set(Math.PI / 2, 0, -32 * DEG);
    chassis.add(trackMachinePart(group, "pulse", noseMoon));
    [-1, 1].forEach((side) => {
      const skid = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, profile.length * 0.88), glow.clone());
      skid.position.set(side * profile.width * 0.54, 0.48, 0.02);
      skid.rotation.z = side * -5 * DEG;
      chassis.add(trackMachinePart(group, "pulse", skid));
    });
  } else if (id === "iron-bastion") {
    const bumper = new THREE.Mesh(createPrismGeometry(profile.width * 0.92, 0.64, 1.35, 0.86, 0.58), metal);
    bumper.position.set(0, 0.92, profile.length * 0.67);
    bumper.castShadow = true;
    chassis.add(bumper);
    [-1, 1].forEach((side) => {
      const armor = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.98, profile.length * 0.62), metal);
      armor.position.set(side * profile.width * 0.76, 1.12, -profile.length * 0.08);
      armor.rotation.z = side * -4 * DEG;
      armor.castShadow = true;
      chassis.add(armor);

      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.45, 10), bright);
      stack.position.set(side * profile.width * 0.32, 2.08, -profile.length * 0.58);
      stack.castShadow = true;
      chassis.add(trackMachinePart(group, "pulse", stack));

      const warning = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.12), glow.clone());
      warning.position.set(side * profile.width * 0.38, 2.86, -profile.length * 0.56);
      chassis.add(trackMachinePart(group, "pulse", warning));

      const crushJaw = new THREE.Mesh(createPrismGeometry(0.32, 0.44, 1.05, 1, 0.32), bright);
      crushJaw.position.set(side * profile.width * 0.34, 0.68, profile.length * 0.84);
      crushJaw.rotation.set(0, side * 10 * DEG, side * -8 * DEG);
      crushJaw.castShadow = true;
      chassis.add(crushJaw);
    });
  } else if (id === "nebula-float") {
    [0.92, 1.18, 1.44].forEach((scale, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(profile.width * 0.36 * scale, 0.028, 8, 70), glow.clone());
      ring.position.set(0, 1.25 + index * 0.13, -0.08 + index * 0.04);
      ring.rotation.set(12 * DEG, index * 16 * DEG, index % 2 ? 22 * DEG : -24 * DEG);
      ring.scale.z = 0.32 + index * 0.05;
      chassis.add(trackMachinePart(group, index ? "spin" : "pulse", ring));
    });
    for (let i = 0; i < 7; i += 1) {
      const mote = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09 + i * 0.006, 0), glow.clone());
      mote.position.set(-profile.width * 0.36 + i * profile.width * 0.12, 1.78 + Math.sin(i) * 0.28, -profile.length * 0.28 + Math.cos(i) * 0.28);
      chassis.add(trackMachinePart(group, "hover", mote));
    }
    const mist = new THREE.Mesh(new THREE.CircleGeometry(profile.width * 0.9, 48), softGlow.clone());
    mist.rotation.x = -Math.PI / 2;
    mist.position.y = 0.24;
    chassis.add(trackMachinePart(group, "pulse", mist));
    const shell = new THREE.Mesh(new THREE.SphereGeometry(profile.width * 0.5, 24, 12), softGlow.clone());
    shell.position.set(0, 1.32, -0.05);
    shell.scale.set(1.35, 0.22, 0.72);
    chassis.add(trackMachinePart(group, "pulse", shell));
  } else if (id === "star-ranger") {
    [-1, 1].forEach((side) => {
      const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.3, 6, 12), metal);
      pod.position.set(side * profile.width * 0.72, 1.24, -profile.length * 0.2);
      pod.rotation.x = Math.PI / 2;
      pod.castShadow = true;
      chassis.add(pod);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), glow.clone());
      lamp.position.set(side * profile.width * 0.72, 1.42, profile.length * 0.34);
      chassis.add(trackMachinePart(group, "pulse", lamp));
    });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.96, 8), metal);
    mast.position.set(0.42, 2.34, -profile.length * 0.14);
    mast.rotation.z = -16 * DEG;
    chassis.add(trackMachinePart(group, "flutter", mast));
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.2, 28, 1, true), glow.clone());
    dish.position.set(0.56, 2.83, -profile.length * 0.2);
    dish.rotation.set(0, 0, -16 * DEG);
    chassis.add(trackMachinePart(group, "spin", dish));
    [-1, 1].forEach((side) => {
      const explorerFin = new THREE.Mesh(createPrismGeometry(0.14, 0.72, 1.2, 0.28, 1), bright);
      explorerFin.position.set(side * profile.width * 0.48, 1.92, -profile.length * 0.48);
      explorerFin.rotation.set(-12 * DEG, side * -14 * DEG, side * -18 * DEG);
      explorerFin.castShadow = true;
      chassis.add(trackMachinePart(group, "flutter", explorerFin));
    });
  } else if (id === "comet-spear") {
    const spear = new THREE.Mesh(new THREE.ConeGeometry(profile.width * 0.18, profile.length * 0.62, 5), bright);
    spear.rotation.x = Math.PI / 2;
    spear.rotation.z = Math.PI / 4;
    spear.position.set(0, 1.12, profile.length * 0.82);
    spear.castShadow = true;
    chassis.add(spear);
    [-1, 1].forEach((side) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, profile.length * 1.02), glow.clone());
      rail.position.set(side * profile.width * 0.42, 1.62, -0.02);
      rail.rotation.z = side * 7 * DEG;
      chassis.add(trackMachinePart(group, "pulse", rail));

      const tailFin = new THREE.Mesh(createPrismGeometry(0.18, 1.02, 1.72, 0.18, 1), metal);
      tailFin.position.set(side * profile.width * 0.44, 1.78, -profile.length * 0.55);
      tailFin.rotation.set(-18 * DEG, side * -18 * DEG, side * -28 * DEG);
      tailFin.castShadow = true;
      chassis.add(trackMachinePart(group, "flutter", tailFin));

      const needleLight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, profile.length * 1.18), glow.clone());
      needleLight.position.set(side * profile.width * 0.18, 1.26, profile.length * 0.12);
      chassis.add(trackMachinePart(group, "pulse", needleLight));
    });
  }
}

function addPremiumKartLivery(chassis, profile, character, kart, primary, secondary, accent, darkMat) {
  const key = `${character.id || character.name || "racer"}-${kart.id || kart.name || "kart"}`;
  const seedValue = Math.abs([...key].reduce((acc, char) => acc + char.charCodeAt(0), 0));
  const accentHex = accent.getHex ? accent.getHex() : accent;
  const primaryHex = primary.getHex ? primary.getHex() : primary;
  const sideMat = makeKartLiveryMaterial(seedValue % 4, 0, primaryHex, 0.98);
  const hoodMat = makeKartLiveryMaterial((seedValue + 1) % 4, 1, primaryHex, 0.98);
  const rearMat = makeKartLiveryMaterial((seedValue + 2) % 4, 2, accentHex, 0.96);
  const techMat = makeKartLiveryMaterial((seedValue + 3) % 4, 3, accentHex, 0.92);
  const glassGlow = new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.56, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const redGlow = new THREE.MeshBasicMaterial({ color: 0xff315c, transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending, depthWrite: false });
  const whiteGlow = new THREE.MeshBasicMaterial({ color: 0xe9fbff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });

  const hood = new THREE.Mesh(new THREE.PlaneGeometry(profile.width * 0.72, profile.length * 0.34), hoodMat);
  hood.position.set(0, 1.64, profile.length * 0.18);
  hood.rotation.x = -Math.PI / 2;
  hood.rotation.z = 0.04;
  chassis.add(hood);

  const rearDeck = new THREE.Mesh(new THREE.PlaneGeometry(profile.width * 0.74, profile.length * 0.28), rearMat);
  rearDeck.position.set(0, 1.72, -profile.length * 0.3);
  rearDeck.rotation.x = -Math.PI / 2;
  rearDeck.rotation.z = -0.03;
  chassis.add(rearDeck);

  [-1, 1].forEach((side) => {
    const sidePanel = new THREE.Mesh(new THREE.PlaneGeometry(profile.length * 0.58, profile.height * 0.82), sideMat.clone());
    sidePanel.position.set(side * profile.width * 0.515, 1.12, -0.05);
    sidePanel.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    sidePanel.rotation.z = side * -0.02;
    chassis.add(sidePanel);

    const intake = new THREE.Mesh(new THREE.PlaneGeometry(profile.length * 0.18, profile.height * 0.34), techMat.clone());
    intake.position.set(side * profile.width * 0.535, 1.26, profile.length * 0.18);
    intake.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    chassis.add(intake);

    const sideLight = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.08, profile.length * 0.36), glassGlow.clone());
    sideLight.position.set(side * profile.width * 0.77, 1.42, -profile.length * 0.08);
    sideLight.rotation.z = side * 0.08;
    chassis.add(sideLight);

    const headlight = new THREE.Mesh(new THREE.PlaneGeometry(profile.width * 0.18, 0.22), whiteGlow.clone());
    headlight.position.set(side * profile.width * 0.22, 1.2, profile.length * 0.54);
    headlight.rotation.y = 0;
    headlight.rotation.z = side * -0.08;
    chassis.add(headlight);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(profile.width * 0.18, 0.1, 0.04), redGlow.clone());
    tail.position.set(side * profile.width * 0.28, 1.36, -profile.length * 0.68);
    chassis.add(tail);

    const mirrorFin = new THREE.Mesh(
      createPrismGeometry(0.22, 0.22, 0.62, 0.45, 0.9),
      new THREE.MeshStandardMaterial({ color: secondary, emissive: accent, emissiveIntensity: 0.18, roughness: 0.24, metalness: 0.62 })
    );
    mirrorFin.position.set(side * profile.width * 0.54, 1.92, profile.length * 0.08);
    mirrorFin.rotation.set(0, side * -0.24, side * -0.18);
    mirrorFin.castShadow = true;
    chassis.add(mirrorFin);
  });

  const rearPanel = new THREE.Mesh(new THREE.PlaneGeometry(profile.width * 0.78, 0.44), rearMat.clone());
  rearPanel.position.set(0, 1.28, -profile.length * 0.69);
  rearPanel.rotation.y = Math.PI;
  chassis.add(rearPanel);

  const diffuserMat = new THREE.MeshStandardMaterial({ color: 0x05070c, emissive: accent, emissiveIntensity: 0.08, roughness: 0.46, metalness: 0.72 });
  for (let i = -2; i <= 2; i += 1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 0.78), diffuserMat);
    fin.position.set(i * profile.width * 0.14, 0.68, -profile.length * 0.71);
    fin.rotation.x = -0.18;
    chassis.add(fin);
  }

  const boltMat = new THREE.MeshStandardMaterial({ color: 0xdcecff, emissive: 0x7df9ff, emissiveIntensity: 0.12, roughness: 0.2, metalness: 0.82 });
  [-1, 1].forEach((xSide) => {
    [-1, 1].forEach((zSide) => {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.028, 10), boltMat);
      bolt.position.set(xSide * profile.width * 0.28, 1.82, zSide * profile.length * 0.24);
      bolt.rotation.x = Math.PI / 2;
      chassis.add(bolt);
    });
  });
}
function addKartSilhouetteKit(chassis, profile, character, kart, primary, secondary, accent, bodyMat, trimMat, glowMat, darkMat) {
  const type = profile.type;
  const crestMat = new THREE.MeshStandardMaterial({ color: secondary, emissive: accent, emissiveIntensity: 0.22, roughness: 0.28, metalness: 0.58 });
  const glowColor = accent.getHex ? accent.getHex() : accent;

  const splitter = new THREE.Group();
  [-1, 1].forEach((side) => {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(profile.width * 0.42, 0.1, 1.3), trimMat);
    blade.position.set(side * profile.width * 0.28, 0.66, profile.length * 0.64);
    blade.rotation.set(0, side * 11 * DEG, side * -6 * DEG);
    blade.castShadow = true;
    splitter.add(blade);
  });
  const centerFang = new THREE.Mesh(new THREE.ConeGeometry(profile.width * 0.16, 1.55, 4), bodyMat);
  centerFang.rotation.x = Math.PI / 2;
  centerFang.rotation.z = Math.PI / 4;
  centerFang.position.set(0, 0.78, profile.length * 0.73);
  splitter.add(centerFang);
  chassis.add(splitter);

  [-1, 1].forEach((side) => {
    const suspension = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, profile.width * 0.5, 8), darkMat);
    suspension.position.set(side * profile.width * 0.47, 0.86, profile.length * 0.24);
    suspension.rotation.z = Math.PI / 2 + side * 8 * DEG;
    chassis.add(suspension);
    const rearSuspension = suspension.clone();
    rearSuspension.position.z = -profile.length * 0.36;
    rearSuspension.rotation.z = Math.PI / 2 - side * 8 * DEG;
    chassis.add(rearSuspension);
  });

  const dorsal = new THREE.Group();
  const finCount = ["heavy", "bastion", "comet"].includes(type) ? 3 : 2;
  for (let i = 0; i < finCount; i += 1) {
    const offset = finCount === 3 ? (i - 1) * profile.width * 0.23 : (i ? 1 : -1) * profile.width * 0.2;
    const fin = new THREE.Mesh(
      createPrismGeometry(0.2, ["speed", "comet"].includes(type) ? 1.1 : 0.86, ["heavy", "bastion"].includes(type) ? 1.4 : 1.05, 0.25, 1),
      crestMat
    );
    fin.position.set(offset, 1.86, -profile.length * 0.22 - i * 0.06);
    fin.rotation.x = -14 * DEG;
    fin.rotation.z = offset * -0.08;
    fin.castShadow = true;
    dorsal.add(fin);
  }
  chassis.add(dorsal);

  if (type === "speed" || type === "comet") {
    [-1, 1].forEach((side) => {
      const longRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, profile.length * 0.86), glowMat.clone());
      longRail.position.set(side * profile.width * 0.36, 1.78, 0.04);
      chassis.add(longRail);
    });
  } else if (type === "heavy" || type === "bastion") {
    [-1, 1].forEach((side) => {
      const armor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.82, profile.length * 0.38), crestMat);
      armor.position.set(side * profile.width * 0.72, 1.12, -profile.length * 0.12);
      armor.rotation.z = side * -5 * DEG;
      armor.castShadow = true;
      chassis.add(armor);
    });
  } else if (["light", "moon", "nebula", "ranger"].includes(type)) {
    [-1, 1].forEach((side) => {
      const sail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.82, profile.length * 0.44), glowMat.clone());
      sail.position.set(side * profile.width * 0.76, 1.62, -0.1);
      sail.rotation.z = side * 14 * DEG;
      chassis.add(sail);
    });
  }

  const rearGlow = new THREE.Mesh(
    new THREE.BoxGeometry(profile.width * 0.72, 0.08, 0.12),
    new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  rearGlow.position.set(0, 1.35, -profile.length * 0.67);
  chassis.add(rearGlow);

  const badgeTexture = createRacerBadgeTexture(character, kart);
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 0.44),
    new THREE.MeshBasicMaterial({ map: badgeTexture, transparent: true, opacity: 0.92, side: THREE.DoubleSide })
  );
  badge.position.set(0, 2.33, -profile.length * 0.48);
  badge.rotation.x = -10 * DEG;
  chassis.add(badge);
}

function createRacerBadgeTexture(character, kart) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  const c1 = character.colors?.primary || kart.colors?.primary || "#7df9ff";
  const c2 = kart.colors?.accent || character.colors?.accent || "#ffd166";
  const initials = displayName(character).split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "走";
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, c1);
  gradient.addColorStop(0.52, "#07111d");
  gradient.addColorStop(1, c2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(5, 9, 20, 0.72)";
  ctx.fillRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.strokeStyle = c2;
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.font = "bold 46px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f6fcff";
  ctx.fillText(initials, canvas.width / 2, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function getKartVisualProfile(kart) {
  const stats = kart.stats || {};
  const dedicated = {
    "moon-skipper": { type: "moon", width: 4.05, height: 0.88, length: 5.85, frontScale: 0.38, rearScale: 0.74, wheelRadius: 0.62, wheelTube: 0.11, noseScale: 1.08, seatY: 2.42, seatZ: -0.22, driverPitch: -4 * DEG },
    "iron-bastion": { type: "bastion", width: 5.55, height: 1.34, length: 6.75, frontScale: 0.84, rearScale: 1.16, wheelRadius: 0.98, wheelTube: 0.24, noseScale: 0.68, seatY: 2.64, seatZ: -0.38, driverPitch: 2 * DEG },
    "nebula-float": { type: "nebula", width: 4.55, height: 0.78, length: 5.95, frontScale: 0.56, rearScale: 0.7, wheelRadius: 0.58, wheelTube: 0.055, noseScale: 0.84, seatY: 2.54, seatZ: -0.2, driverPitch: -2 * DEG },
    "star-ranger": { type: "ranger", width: 4.85, height: 1.04, length: 6.25, frontScale: 0.62, rearScale: 0.96, wheelRadius: 0.8, wheelTube: 0.16, noseScale: 0.9, seatY: 2.54, seatZ: -0.34, driverPitch: -1 * DEG },
    "comet-spear": { type: "comet", width: 3.95, height: 0.82, length: 7.28, frontScale: 0.32, rearScale: 0.72, wheelRadius: 0.66, wheelTube: 0.1, noseScale: 1.24, seatY: 2.38, seatZ: -0.3, driverPitch: -6 * DEG }
  };
  if (dedicated[kart.id]) return dedicated[kart.id];

  const key = `${kart.id || ""} ${kart.name || ""} ${kart.className || ""} ${kart.type || ""}`.toLowerCase();
  const speedBias = (stats.speed || 0) - (stats.handling || 0);
  const heavyBias = (stats.weight || 0) > 8 || key.includes("heavy") || key.includes("vault") || key.includes("anvil");
  if (heavyBias) return { type: "heavy", width: 5.25, height: 1.18, length: 6.55, frontScale: 0.78, rearScale: 1.08, wheelRadius: 0.92, wheelTube: 0.2, noseScale: 0.72, seatY: 2.54, seatZ: -0.4 };
  if (key.includes("light") || key.includes("skipper") || (stats.accel || 0) >= 9) return { type: "light", width: 4.25, height: 0.92, length: 5.72, frontScale: 0.48, rearScale: 0.82, wheelRadius: 0.72, wheelTube: 0.14, noseScale: 0.92, seatY: 2.44, seatZ: -0.3 };
  if (key.includes("technique") || key.includes("handling") || (stats.handling || 0) >= 8) return { type: "handling", width: 4.6, height: 1.0, length: 5.95, frontScale: 0.62, rearScale: 0.9, wheelRadius: 0.8, wheelTube: 0.16, noseScale: 0.82, seatY: 2.48, seatZ: -0.35 };
  if (key.includes("speed") || key.includes("comet") || speedBias >= 3) return { type: "speed", width: 4.2, height: 0.88, length: 6.85, frontScale: 0.42, rearScale: 0.82, wheelRadius: 0.74, wheelTube: 0.15, noseScale: 1.08, seatY: 2.4, seatZ: -0.34 };
  return { type: "balanced", width: 4.75, height: 1.03, length: 6.18, frontScale: 0.6, rearScale: 0.94, wheelRadius: 0.8, wheelTube: 0.16, noseScale: 0.88, seatY: 2.5, seatZ: -0.38 };
}

function createPrismGeometry(width, height, length, frontScale, rearScale) {
  const fw = width * frontScale * 0.5;
  const rw = width * rearScale * 0.5;
  const y0 = -height * 0.5;
  const y1 = height * 0.5;
  const zf = length * 0.5;
  const zr = -length * 0.5;
  const vertices = new Float32Array([
    -fw, y0, zf, fw, y0, zf, rw, y0, zr, -rw, y0, zr,
    -fw * 0.78, y1, zf, fw * 0.78, y1, zf, rw * 0.82, y1, zr, -rw * 0.82, y1, zr
  ]);
  const indices = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addGlowStrip(parent, x, y, z, width, length, color, tilt) {
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(width, 0.055), 0.045, length),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  strip.position.set(x, y, z);
  strip.rotation.z = tilt;
  parent.add(strip);
}

function createWheelAssembly(profile, accent, tireMat, glowMat, rear) {
  const group = new THREE.Group();
  const type = profile.type || "balanced";
  const accentHex = accent.getHex ? accent.getHex() : accent;

  if (type === "nebula") {
    const ringMat = glowMat.clone();
    ringMat.opacity = 0.58;
    const outer = new THREE.Mesh(new THREE.TorusGeometry(profile.wheelRadius * 1.25, 0.038, 8, 46), ringMat);
    outer.rotation.y = Math.PI / 2;
    outer.scale.set(1, rear ? 0.78 : 0.96, 1);
    outer.userData.spin = true;
    group.add(outer);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(profile.wheelRadius * 0.72, 0.024, 8, 36), glowMat.clone());
    inner.rotation.y = Math.PI / 2;
    inner.rotation.z = rear ? 0.3 : -0.3;
    inner.userData.spin = true;
    group.add(inner);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(profile.wheelRadius * 0.22, 1), glowMat.clone());
    group.add(core);
    return group;
  }

  const tire = new THREE.Mesh(new THREE.TorusGeometry(profile.wheelRadius, profile.wheelTube, 14, type === "bastion" ? 42 : 36), tireMat);
  tire.rotation.y = Math.PI / 2;
  tire.scale.set(1, type === "comet" ? 0.72 : 1, type === "moon" ? 0.82 : 1);
  tire.castShadow = true;
  tire.userData.spin = true;
  group.add(tire);

  const treadMat = new THREE.MeshStandardMaterial({ color: type === "bastion" ? 0x1a1f2b : 0x111723, roughness: 0.72, metalness: type === "bastion" ? 0.3 : 0.12 });
  const treadCount = type === "bastion" ? 18 : type === "comet" ? 8 : 12;
  for (let i = 0; i < treadCount; i += 1) {
    const angle = (i / treadCount) * Math.PI * 2;
    const tread = new THREE.Mesh(new THREE.BoxGeometry(type === "bastion" ? 0.34 : 0.22, 0.05, type === "comet" ? 0.14 : 0.22), treadMat);
    tread.position.set(0, Math.sin(angle) * profile.wheelRadius, Math.cos(angle) * profile.wheelRadius);
    tread.rotation.x = -angle;
    group.add(tread);
  }

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(profile.wheelRadius * (type === "bastion" ? 0.45 : 0.35), profile.wheelRadius * 0.35, 0.26, 22),
    new THREE.MeshStandardMaterial({ color: accentHex, emissive: accentHex, emissiveIntensity: 0.82, roughness: 0.18, metalness: 0.35 })
  );
  hub.rotation.z = Math.PI / 2;
  group.add(hub);

  if (type === "moon") {
    const moonRing = new THREE.Mesh(new THREE.TorusGeometry(profile.wheelRadius * 0.88, 0.022, 8, 36, Math.PI * 1.42), glowMat.clone());
    moonRing.rotation.y = Math.PI / 2;
    moonRing.rotation.z = -26 * DEG;
    group.add(moonRing);
  } else if (type === "comet") {
    const plasma = new THREE.Mesh(new THREE.TorusGeometry(profile.wheelRadius * 1.18, 0.028, 8, 42), glowMat.clone());
    plasma.rotation.y = Math.PI / 2;
    plasma.scale.y = 0.62;
    group.add(plasma);
  } else if (type === "bastion") {
    [-1, 1].forEach((side) => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.12, profile.wheelRadius * 0.95, 0.18), treadMat);
      plate.position.x = side * 0.2;
      plate.castShadow = true;
      group.add(plate);
    });
  }

  const boltMat = new THREE.MeshStandardMaterial({ color: 0xe7f5ff, emissive: accentHex, emissiveIntensity: 0.22, roughness: 0.18, metalness: 0.8 });
  const boltCount = type === "bastion" ? 8 : 6;
  for (let i = 0; i < boltCount; i += 1) {
    const angle = (i / boltCount) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.035, 8), boltMat);
    bolt.position.set(0.15, Math.sin(angle) * profile.wheelRadius * 0.24, Math.cos(angle) * profile.wheelRadius * 0.24);
    bolt.rotation.z = Math.PI / 2;
    group.add(bolt);
  }

  const caliper = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, profile.wheelRadius * 0.34, profile.wheelRadius * 0.13),
    new THREE.MeshStandardMaterial({ color: rear ? 0xff5fa8 : 0xffd166, emissive: rear ? 0xff315c : 0xff9f1c, emissiveIntensity: 0.28, roughness: 0.22, metalness: 0.42 })
  );
  caliper.position.set(0.18, -profile.wheelRadius * 0.55, profile.wheelRadius * 0.2);
  group.add(caliper);

  const hover = new THREE.Mesh(new THREE.TorusGeometry(profile.wheelRadius * (type === "bastion" ? 1.0 : 1.08), 0.045, 8, 32), glowMat.clone());
  hover.rotation.y = Math.PI / 2;
  hover.scale.set(1, rear ? 0.86 : 0.78, 1);
  group.add(hover);
  return group;
}

function createDriverModel(character, accent, secondary, primary) {
  const group = new THREE.Group();
  const trait = character.modelTrait || character.id || "pilot";
  const characterPrimary = new THREE.Color(character.colors?.primary || primary);
  const characterSecondary = new THREE.Color(character.colors?.secondary || secondary);
  const characterAccent = new THREE.Color(character.colors?.accent || accent);
  primary = characterPrimary;
  secondary = characterSecondary;
  accent = characterAccent;
  group.userData.characterId = character.id || "";
  group.userData.characterMotionParts = { pulse: [], spin: [], flutter: [], sway: [] };
  const suit = new THREE.MeshPhysicalMaterial({
    color: secondary,
    emissive: secondary,
    emissiveIntensity: trait === "robot" ? 0.18 : 0.1,
    roughness: 0.36,
    metalness: trait === "robot" ? 0.7 : 0.28,
    clearcoat: 0.25
  });
  const skin = new THREE.MeshPhysicalMaterial({
    color: trait === "robot" ? primary : accent,
    emissive: trait === "spirit" ? accent : primary,
    emissiveIntensity: trait === "spirit" ? 0.58 : 0.18,
    roughness: 0.34,
    metalness: trait === "robot" ? 0.48 : 0.08,
    transparent: trait === "spirit",
    opacity: trait === "spirit" ? 0.82 : 1
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x07111d, roughness: 0.42, metalness: 0.4 });
  const glow = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const face = new THREE.MeshStandardMaterial({ color: 0xf7fbff, emissive: accent, emissiveIntensity: 0.35, roughness: 0.2 });

  const torso = new THREE.Mesh(
    trait === "robot" ? new THREE.BoxGeometry(1.08, 1.08, 0.68) : new THREE.CapsuleGeometry(0.56, 0.96, 8, 16),
    suit
  );
  torso.position.y = 0.04;
  torso.scale.set(trait === "robot" ? 1.1 : 1, trait === "beast" ? 0.98 : 1.06, trait === "spirit" ? 0.92 : 1);
  torso.rotation.x = 8 * DEG;
  torso.castShadow = true;
  group.add(torso);

  const chestLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.05), glow.clone());
  chestLight.position.set(0, 0.24, 0.46);
  group.add(chestLight);

  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), suit);
    shoulder.scale.set(trait === "robot" ? 1.55 : 1.12, 0.72, 0.84);
    shoulder.position.set(side * 0.54, 0.36, 0.02);
    group.add(shoulder);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.46, 6, 8), suit);
    arm.position.set(side * 0.66, 0.02, 0.15);
    arm.rotation.z = side * -18 * DEG;
    arm.rotation.x = 14 * DEG;
    group.add(arm);
  });

  const head = new THREE.Mesh(
    trait === "robot" ? new THREE.BoxGeometry(0.86, 0.68, 0.66) : new THREE.SphereGeometry(0.56, 24, 16),
    skin
  );
  head.position.y = 1.02;
  head.scale.set(trait === "beast" ? 0.92 : 1, trait === "spirit" ? 1.12 : 1, 1.04);
  head.castShadow = true;
  group.add(head);

  addEyePair(group, trait, face, glow, accent);
  addMouthLine(group, dark, trait);
  addCharacterExpression(group, character, trait, dark, glow, accent);
  addDriverBackSilhouette(group, trait, accent, primary, secondary, suit, glow);
  addDriverReadabilityKit(group, trait, accent, primary, secondary, dark, glow);

  if (trait === "beast") {
    addEar(group, -0.34, accent, 1.08);
    addEar(group, 0.34, accent, 1.08);
    addGogglePair(group, accent, dark);
    addScarfRibbon(group, primary, secondary);
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), skin);
    muzzle.scale.set(1.15, 0.55, 0.72);
    muzzle.position.set(0, 0.77, 0.42);
    group.add(muzzle);
  } else if (trait === "robot") {
    addArmorPlates(group, primary, accent);
    addAntenna(group, accent);
  } else if (trait === "spirit") {
    addSpiritTail(group, accent);
    addCrystalOrbit(group, accent);
    addWing(group, -0.66, accent, 1.15);
    addWing(group, 0.66, accent, 1.15);
  } else if (trait === "guardian") {
    addCrystalCrest(group, accent);
    addWing(group, -0.62, accent, 0.9);
    addWing(group, 0.62, accent, 0.9);
  } else {
    addPilotHelmet(group, accent, dark);
    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.82, 0.06), suit);
    cape.position.set(0, 0.18, -0.48);
    cape.rotation.x = -18 * DEG;
    group.add(cape);
  }
  addCharacterSignatureKit(group, character, trait, accent, primary, secondary, dark, glow, suit);
  return group;
}

function trackDriverPart(group, kind, mesh) {
  const parts = group.userData.characterMotionParts || (group.userData.characterMotionParts = { pulse: [], spin: [], flutter: [], sway: [] });
  if (!parts[kind]) parts[kind] = [];
  mesh.userData.basePosition = mesh.position.clone();
  mesh.userData.baseRotation = mesh.rotation.clone();
  mesh.userData.baseScale = mesh.scale.clone();
  parts[kind].push(mesh);
  return mesh;
}

function addCharacterExpression(group, character, trait, dark, glow, accent) {
  const id = character.id || "";
  const accentHex = accent.getHex ? accent.getHex() : accent;
  const browMat = new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending, depthWrite: false });
  const darkGlow = new THREE.MeshBasicMaterial({ color: 0x07111d, transparent: true, opacity: 0.92 });
  if (id === "luna-mimi") {
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.014, 6, 22, Math.PI), darkGlow);
    smile.position.set(0, 0.88, 0.62);
    smile.rotation.z = Math.PI;
    group.add(smile);
    const focus = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.035, 0.035), browMat);
    focus.position.set(0, 1.2, 0.61);
    focus.rotation.z = -4 * DEG;
    group.add(focus);
  } else if (id === "gamma-bolt") {
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.16, 0.05), new THREE.MeshStandardMaterial({ color: 0x050811, emissive: accentHex, emissiveIntensity: 0.72, roughness: 0.16, metalness: 0.58 }));
    visor.position.set(0, 1.1, 0.61);
    group.add(visor);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.06), darkGlow);
    jaw.position.set(0, 0.78, 0.61);
    group.add(jaw);
  } else if (id === "nebi-mist") {
    const wink = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), darkGlow);
    wink.position.set(0.22, 1.08, 0.62);
    wink.rotation.z = -14 * DEG;
    group.add(wink);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 6), glow.clone());
    cheek.position.set(-0.36, 0.94, 0.61);
    group.add(cheek);
  } else if (id === "sora-ranger") {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.045, 0.045), browMat);
    brow.position.set(0, 1.2, 0.6);
    brow.rotation.z = 3 * DEG;
    group.add(brow);
  } else if (id === "comet-rin") {
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.13, 0.045), new THREE.MeshStandardMaterial({ color: 0x05070f, emissive: accentHex, emissiveIntensity: 0.42, roughness: 0.18, metalness: 0.52 }));
    visor.position.set(0, 1.09, 0.61);
    visor.rotation.z = -5 * DEG;
    group.add(visor);
  } else if (id === "kael-obsidian") {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.045), browMat);
    brow.position.set(0, 1.22, 0.61);
    brow.rotation.z = -5 * DEG;
    group.add(brow);
  } else if (id === "seren-quill") {
    const wink = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), darkGlow);
    wink.position.set(0.21, 1.08, 0.62);
    wink.rotation.z = -14 * DEG;
    group.add(wink);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), glow.clone());
    cheek.position.set(-0.36, 0.94, 0.6);
    group.add(cheek);
  } else if (id === "nox-emberlain") {
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.14, 0.045), new THREE.MeshStandardMaterial({ color: 0x060a12, emissive: accentHex, emissiveIntensity: 0.24, roughness: 0.18, metalness: 0.42 }));
    visor.position.set(0, 1.08, 0.61);
    visor.rotation.z = -4 * DEG;
    group.add(visor);
  } else if (id === "mira-calcite") {
    const calm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.035, 0.04), browMat);
    calm.position.set(0, 1.18, 0.6);
    group.add(calm);
  }
}

function addCharacterSignatureKit(group, character, trait, accent, primary, secondary, dark, glow, suit) {
  const id = character.id || "";
  const accentHex = accent.getHex ? accent.getHex() : accent;
  const primaryHex = primary.getHex ? primary.getHex() : primary;
  const secondaryHex = secondary.getHex ? secondary.getHex() : secondary;
  const glowPlane = new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.58, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const metal = new THREE.MeshStandardMaterial({ color: secondaryHex, emissive: accentHex, emissiveIntensity: 0.22, roughness: 0.28, metalness: 0.48 });
  const bright = new THREE.MeshStandardMaterial({ color: primaryHex, emissive: accentHex, emissiveIntensity: 0.32, roughness: 0.22, metalness: 0.28 });


  if (id === "luna-mimi") {
    const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.035, 8, 48, Math.PI * 1.35), glow.clone());
    crescent.position.set(0, 1.18, -0.18);
    crescent.rotation.set(Math.PI / 2, 0, -36 * DEG);
    group.add(trackDriverPart(group, "pulse", crescent));
    const moonBadge = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), glowPlane.clone());
    moonBadge.position.set(0, 0.52, 0.53);
    group.add(trackDriverPart(group, "pulse", moonBadge));
    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.54, 4), bright);
      wing.position.set(side * 0.62, 0.62, -0.14);
      wing.rotation.z = side * -42 * DEG;
      group.add(trackDriverPart(group, "flutter", wing));
    });
  } else if (id === "gamma-bolt") {
    const reactor = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.86, 0.38), metal);
    reactor.position.set(0, 0.58, -0.72);
    reactor.castShadow = true;
    group.add(reactor);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 18), glow.clone());
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 0.62, -0.96);
    group.add(trackDriverPart(group, "pulse", core));
    [-1, 1].forEach((side) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.72, 0.22), bright);
      arm.position.set(side * 0.72, 0.56, 0.12);
      arm.rotation.z = side * -10 * DEG;
      group.add(trackDriverPart(group, "sway", arm));
    });
  } else if (id === "nebi-mist") {
    [0.62, 0.86, 1.06].forEach((radius, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.016, 8, 64), glow.clone());
      ring.position.set(0, 0.88 + index * 0.08, -0.34 - index * 0.04);
      ring.rotation.x = 4 * DEG;
      ring.rotation.z = index % 2 ? 18 * DEG : -12 * DEG;
      ring.scale.y = 0.54;
      group.add(trackDriverPart(group, index ? "spin" : "pulse", ring));
    });
    for (let i = 0; i < 5; i += 1) {
      const mote = new THREE.Mesh(new THREE.SphereGeometry(0.045 + i * 0.006, 8, 6), glow.clone());
      mote.position.set(-0.55 + i * 0.28, 1.18 + Math.sin(i) * 0.18, -0.28);
      group.add(trackDriverPart(group, "sway", mote));
    }
  } else if (id === "sora-ranger") {
    const mapCape = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.72), glowPlane.clone());
    mapCape.position.set(0, 0.42, -0.66);
    mapCape.rotation.x = -18 * DEG;
    group.add(trackDriverPart(group, "flutter", mapCape));
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.52, 8), glow.clone());
    antenna.position.set(0.32, 1.42, -0.08);
    antenna.rotation.z = -14 * DEG;
    group.add(trackDriverPart(group, "sway", antenna));
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.56, 0.22), metal);
    pack.position.set(0.48, 0.42, -0.72);
    group.add(pack);
  } else if (id === "comet-rin") {
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.7, 4), new THREE.MeshStandardMaterial({ color: 0x060813, emissive: secondaryHex, emissiveIntensity: 0.34, roughness: 0.3, metalness: 0.22 }));
    hood.position.set(0, 1.24, -0.08);
    hood.rotation.y = Math.PI / 4;
    hood.scale.z = 0.66;
    group.add(hood);
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.08, 0.055), glow.clone());
    scarf.position.set(-0.44, 0.26, -0.58);
    scarf.rotation.set(-34 * DEG, 0, 20 * DEG);
    group.add(trackDriverPart(group, "flutter", scarf));
    [-1, 1].forEach((side) => {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.72, 4), bright);
      fin.position.set(side * 0.58, 1.26, -0.16);
      fin.rotation.z = side * -30 * DEG;
      group.add(trackDriverPart(group, "pulse", fin));
    });
  } else if (id === "lyra-vale") {
    const mapCape = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.82), glowPlane.clone());
    mapCape.position.set(0, 0.42, -0.66);
    mapCape.rotation.x = -18 * DEG;
    group.add(trackDriverPart(group, "flutter", mapCape));

    const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.018, 6, 48, Math.PI * 1.55), glow.clone());
    orbit.position.set(0, 1.16, -0.16);
    orbit.rotation.x = Math.PI / 2;
    orbit.rotation.z = -34 * DEG;
    group.add(trackDriverPart(group, "pulse", orbit));

    [[-0.52, 0.92, -0.42, -0.36], [0.5, 0.76, -0.5, 0.28], [0.18, 1.43, -0.12, 0.68]].forEach(([x, y, z, rz], index) => {
      const shard = new THREE.Mesh(new THREE.BoxGeometry(0.28 - index * 0.04, 0.08, 0.025), glowPlane.clone());
      shard.position.set(x, y, z);
      shard.rotation.z = rz;
      group.add(trackDriverPart(group, "sway", shard));
    });
  } else if (id === "kael-obsidian") {
    const furnace = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.84, 0.36), metal);
    furnace.position.set(0, 0.58, -0.72);
    furnace.castShadow = true;
    group.add(furnace);

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 18), glow.clone());
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 0.62, -0.94);
    group.add(trackDriverPart(group, "pulse", core));

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.08), bright);
    handle.position.set(0.72, 0.38, 0.18);
    handle.rotation.z = -24 * DEG;
    group.add(trackDriverPart(group, "flutter", handle));
    const jawA = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.08), bright);
    jawA.position.set(0.82, 0.72, 0.2);
    jawA.rotation.z = 14 * DEG;
    group.add(jawA);
    const jawB = jawA.clone();
    jawB.position.y = 0.58;
    jawB.rotation.z = -8 * DEG;
    group.add(jawB);
  } else if (id === "seren-quill") {
    [0.66, 0.9].forEach((radius, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.018, 8, 64), glow.clone());
      ring.position.set(0, 0.92, -0.32 - index * 0.04);
      ring.rotation.x = 4 * DEG;
      ring.rotation.z = index ? 18 * DEG : -12 * DEG;
      ring.scale.y = 0.58;
      group.add(trackDriverPart(group, index ? "spin" : "pulse", ring));
    });
    const baton = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.84, 10), glow.clone());
    baton.position.set(-0.64, 0.42, 0.32);
    baton.rotation.set(34 * DEG, 0, -36 * DEG);
    group.add(trackDriverPart(group, "flutter", baton));
    for (let i = 0; i < 3; i += 1) {
      const mote = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), glow.clone());
      mote.position.set(-0.48 + i * 0.36, 1.28 + Math.sin(i) * 0.12, -0.28);
      group.add(trackDriverPart(group, "sway", mote));
    }
  } else if (id === "nox-emberlain") {
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.72, 4), new THREE.MeshStandardMaterial({ color: 0x090d17, emissive: secondaryHex, emissiveIntensity: 0.2, roughness: 0.34, metalness: 0.18 }));
    hood.position.set(0, 1.24, -0.08);
    hood.rotation.y = Math.PI / 4;
    hood.scale.z = 0.68;
    group.add(hood);

    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.48, 0.22), metal);
    bag.position.set(0.48, 0.42, -0.72);
    bag.rotation.z = -6 * DEG;
    group.add(trackDriverPart(group, "sway", bag));

    const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.96, 0.055), glow.clone());
    scarf.position.set(-0.42, 0.28, -0.56);
    scarf.rotation.set(-32 * DEG, 0, 18 * DEG);
    group.add(trackDriverPart(group, "flutter", scarf));

    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), glowPlane.clone());
    tag.position.set(0.12, 0.26, 0.52);
    group.add(trackDriverPart(group, "pulse", tag));
  } else if (id === "mira-calcite") {
    const shield = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 0), new THREE.MeshPhysicalMaterial({ color: primaryHex, emissive: accentHex, emissiveIntensity: 0.32, roughness: 0.12, metalness: 0.12, transmission: 0.12, transparent: true, opacity: 0.88 }));
    shield.position.set(0, 0.62, -0.78);
    shield.scale.set(0.92, 1.28, 0.18);
    shield.rotation.z = Math.PI / 4;
    group.add(trackDriverPart(group, "pulse", shield));

    [-1, 1].forEach((side) => {
      const pauldron = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.62, 5), bright);
      pauldron.position.set(side * 0.64, 0.78, 0.02);
      pauldron.rotation.z = side * -34 * DEG;
      group.add(trackDriverPart(group, "flutter", pauldron));
    });

    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.72, 5), bright);
    crest.position.set(0, 1.68, -0.02);
    group.add(trackDriverPart(group, "pulse", crest));
  }
}

function addDriverBackSilhouette(group, trait, accent, primary, secondary, suit, glow) {
  const glowColor = accent.getHex ? accent.getHex() : accent;
  if (trait === "robot") {
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.78, 0.34), suit);
    backpack.position.set(0, 0.58, -0.46);
    backpack.castShadow = true;
    group.add(backpack);
    [-1, 1].forEach((side) => {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.54, 0.08), glow.clone());
      vent.position.set(side * 0.28, 0.58, -0.66);
      group.add(vent);
    });
  } else if (trait === "beast") {
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.95, 10), new THREE.MeshStandardMaterial({ color: primary, emissive: secondary, emissiveIntensity: 0.22, roughness: 0.32 }));
    tail.position.set(-0.34, 0.05, -0.54);
    tail.rotation.set(-42 * DEG, 0, -22 * DEG);
    group.add(tail);
    const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 0.06), new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.66, blending: THREE.AdditiveBlending }));
    scarfTail.position.set(0.42, 0.26, -0.52);
    scarfTail.rotation.x = -28 * DEG;
    group.add(scarfTail);
  } else if (trait === "spirit") {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.025, 8, 36), glow.clone());
    halo.position.set(0, 1.24, -0.1);
    halo.rotation.x = Math.PI / 2;
    group.add(halo);
  } else {
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.16), new THREE.MeshStandardMaterial({ color: primary, emissive: secondary, emissiveIntensity: 0.18, roughness: 0.3, metalness: 0.2 }));
    collar.position.set(0, 0.62, -0.42);
    group.add(collar);
  }
}
function addDriverReadabilityKit(group, trait, accent, primary, secondary, dark, glow) {
  const accentHex = accent.getHex ? accent.getHex() : accent;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 8, 32), new THREE.MeshStandardMaterial({ color: primary, emissive: accent, emissiveIntensity: 0.38, roughness: 0.22, metalness: 0.36 }));
  rim.position.set(0, 1.05, -0.02);
  rim.rotation.x = Math.PI / 2;
  rim.scale.y = 0.78;
  group.add(rim);

  [-1, 1].forEach((side) => {
    const fin = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, trait === "beast" ? 0.9 : 0.68, 4),
      new THREE.MeshStandardMaterial({ color: secondary, emissive: accent, emissiveIntensity: 0.28, roughness: 0.28, metalness: 0.24 })
    );
    fin.position.set(side * 0.48, 1.42, -0.12);
    fin.rotation.set(0.12, 0, side * -0.36);
    fin.castShadow = true;
    group.add(fin);

    const cheekLight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.035), glow.clone());
    cheekLight.position.set(side * 0.43, 1.02, 0.48);
    group.add(cheekLight);
  });

  const backPlate = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.08), dark);
  backPlate.position.set(0, 0.58, -0.54);
  backPlate.rotation.x = -8 * DEG;
  group.add(backPlate);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.035), new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.76, blending: THREE.AdditiveBlending, depthWrite: false }));
  spine.position.set(0, 0.58, -0.6);
  spine.rotation.x = -8 * DEG;
  group.add(spine);
}
function addEyePair(group, trait, face, glow, accent) {
  const eyeWidth = trait === "robot" ? 0.18 : 0.11;
  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(eyeWidth, 0.075, 0.035), trait === "robot" ? glow.clone() : face);
    eye.position.set(side * 0.19, 1.08, 0.58);
    eye.rotation.z = side * -5 * DEG;
    group.add(eye);
  });
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.045, 0.035), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.58 }));
  brow.position.set(0, 1.2, 0.59);
  group.add(brow);
}

function addMouthLine(group, dark, trait) {
  if (trait === "robot") return;
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.03), dark);
  mouth.position.set(0, 0.86, 0.59);
  mouth.rotation.z = trait === "beast" ? -7 * DEG : 0;
  group.add(mouth);
}

function addEar(group, x, color, scale = 1) {
  const ear = new THREE.Mesh(
    new THREE.ConeGeometry(0.16 * scale, 0.92 * scale, 8),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.32, roughness: 0.28, metalness: 0.15 })
  );
  ear.position.set(x * 1.08, 1.72, -0.02);
  ear.rotation.z = x < 0 ? 18 * DEG : -18 * DEG;
  group.add(ear);
}

function addWing(group, x, color, scale = 1) {
  const wing = new THREE.Mesh(
    createPrismGeometry(0.12 * scale, 0.48 * scale, 0.9 * scale, 0.35, 1.0),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.58, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  wing.position.set(x, 0.5, -0.24);
  wing.rotation.set(8 * DEG, 0, x < 0 ? -27 * DEG : 27 * DEG);
  group.add(wing);
}

function addGogglePair(group, accent, dark) {
  [-1, 1].forEach((side) => {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.022, 8, 18), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.55 }));
    lens.position.set(side * 0.22, 1.12, 0.61);
    group.add(lens);
  });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.035), dark);
  bridge.position.set(0, 1.12, 0.62);
  group.add(bridge);
}

function addScarfRibbon(group, primary, secondary) {
  const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.05), new THREE.MeshStandardMaterial({ color: primary, emissive: secondary, emissiveIntensity: 0.18 }));
  scarf.position.set(0.12, 0.47, 0.42);
  scarf.rotation.z = -8 * DEG;
  group.add(scarf);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.46, 0.05), scarf.material);
  tail.position.set(-0.34, 0.24, 0.25);
  tail.rotation.set(-22 * DEG, 0, 16 * DEG);
  group.add(tail);
}

function addArmorPlates(group, primary, accent) {
  const armorMat = new THREE.MeshStandardMaterial({ color: primary, emissive: accent, emissiveIntensity: 0.12, roughness: 0.32, metalness: 0.72 });
  [-1, 1].forEach((side) => {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.24), armorMat);
    pad.position.set(side * 0.55, 0.72, 0.16);
    pad.rotation.z = side * 12 * DEG;
    group.add(pad);
  });
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.16), armorMat);
  jaw.position.set(0, 0.68, 0.38);
  group.add(jaw);
}

function addAntenna(group, accent) {
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 8), new THREE.MeshBasicMaterial({ color: accent }));
  mast.position.set(0.26, 1.35, 0.02);
  mast.rotation.z = -12 * DEG;
  group.add(mast);
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.9 }));
  bead.position.set(0.31, 1.56, 0.02);
  group.add(bead);
}

function addSpiritTail(group, accent) {
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.95, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.52, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  tail.rotation.x = -20 * DEG;
  tail.position.set(0, -0.48, -0.1);
  group.add(tail);
}

function addCrystalOrbit(group, accent) {
  for (let i = 0; i < 3; i += 1) {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.65, roughness: 0.18, metalness: 0.25 }));
    const a = (i / 3) * Math.PI * 2;
    shard.position.set(Math.cos(a) * 0.58, 0.86 + i * 0.06, Math.sin(a) * 0.18);
    shard.rotation.set(a, a * 0.4, a * 0.7);
    group.add(shard);
  }
}

function addCrystalCrest(group, accent) {
  [-1, 0, 1].forEach((side) => {
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.48 + Math.abs(side) * 0.14, 5), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.48, roughness: 0.2, metalness: 0.22 }));
    shard.position.set(side * 0.18, 1.34, -0.02);
    shard.rotation.z = side * -12 * DEG;
    group.add(shard);
  });
}

function addPilotHelmet(group, accent, dark) {
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.05), new THREE.MeshPhysicalMaterial({ color: 0x07111d, emissive: accent, emissiveIntensity: 0.55, roughness: 0.08, metalness: 0.5 }));
  visor.position.set(0, 0.99, 0.51);
  group.add(visor);
  const chin = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.12), dark);
  chin.position.set(0, 0.67, 0.42);
  group.add(chin);
}
function previewSelection() {
  if (!player) return;
  const character = DATA.characters[state.selectedCharacter] || DATA.characters[0];
  const kart = machineForCharacter(character, state.selectedCharacter);
  state.selectedKart = machineIndexForCharacter(character, state.selectedCharacter);
  player.character = character;
  player.kart = kart;
}

async function startCountdown() {
  startAudioOnce();
  state.mode = "countdown";
  dom.hud.classList.remove("hidden");
  dom.app?.classList.remove("is-menu");
  dom.app?.classList.add("is-racing");
  dom.screenOverlay.classList.add("hidden");
  dom.countdown.classList.remove("hidden");
  dom.countdown.textContent = "\u3058\u3085\u3093\u3073";
  dom.countdown.classList.add("pop");
  dom.mobileControls.classList.add("active");
  await waitForNextPaint();
  await wait(220);
  raceWarmupStarted = true;
  ensureRaceAssetsReady({ createRacers: true });
  if (state.currentScreen !== "course") {
    resetRace();
  } else {
    state.time = 0;
    state.finishTime = 0;
    state.rank = 1;
    state.winner = null;
    updateHud();
  }
  state.countdown = 3;
  for (const label of ["3", "2", "1", "スタート！"]) {
    dom.countdown.textContent = label;
    pulseCountdown(label);
    await wait(820);
  }
  dom.countdown.classList.add("hidden");
  state.mode = "racing";
  state.time = 0;
}

function pulseCountdown(label) {
  dom.countdown.classList.remove("pop");
  void dom.countdown.offsetWidth;
  dom.countdown.classList.add("pop");
  playAudio("countdown", label === "スタート！" ? 0 : Number(label));
}

function pauseRace() {
  if (state.mode !== "racing") return;
  state.mode = "paused";
  showScreen("pause");
}

function resumeRace() {
  if (state.mode !== "paused") return;
  state.mode = "racing";
  dom.app?.classList.remove("is-menu");
  dom.app?.classList.add("is-racing");
  dom.screenOverlay.classList.add("hidden");
  dom.pauseScreen.classList.add("hidden");
}

function finishRace() {
  state.mode = "result";
  state.finishTime = state.time;
  playAudio("goal");
  if (player) {
    player.group.userData.victoryPose = true;
    spawnGoalLightShow(player);
  }
  showScreen("result");
  const sorted = getRanking();
  const winner = sorted[0];
  const playerRank = sorted.findIndex((r) => r === player) + 1;
  const mode = raceMode();
  const playerCard = resultCharacterCardMarkup(player.character);
  if (mode.timeAttack) {
    dom.resultTitle.textContent = "タイムアタック完走！";
    dom.resultStats.innerHTML = playerCard + `
      <div><span>モード</span><strong>${escapeHtml(mode.name)}</strong></div>
      <div><span>タイム</span><strong>${formatTime(state.finishTime)}</strong></div>
      <div><span>しゅう</span><strong>${activeLapTotal()}しゅう</strong></div>
      <div><span>ひとこと</span><strong>じぶんのベストタイムにちょうせん！</strong></div>
    `;
    return;
  }
  dom.resultTitle.textContent = playerRank === 1 ? "1い！やったね！" : "レースのけっか";
  dom.resultStats.innerHTML = playerCard + `
    <div><span>モード</span><strong>${escapeHtml(mode.name)}</strong></div>
    <div><span>じゅんい</span><strong>${playerRank}/${racers.length}</strong></div>
    <div><span>タイム</span><strong>${formatTime(state.finishTime)}</strong></div>
    <div><span>1いのレーサー</span><strong>${escapeHtml(displayName(winner.character))}</strong></div>
  `;
}

function showScreen(name) {
  state.mode = name === "pause" ? "paused" : state.mode;
  dom.app?.classList.toggle("is-menu", !["racing", "countdown"].includes(state.mode));
  dom.app?.classList.toggle("is-racing", state.mode === "racing");
  dom.screenOverlay.classList.remove("hidden");
  state.currentScreen = name;
  [dom.titleScreen, dom.modeScreen, dom.selectScreen, dom.courseScreen, dom.pauseScreen, dom.helpScreen, dom.resultScreen].forEach((screen) => {
    screen.classList.add("hidden");
  });
  const hudVisible = name !== "help" && (["pause", "result"].includes(name) || state.mode === "racing");
  const controlsVisible = name !== "help" && (["pause", "result"].includes(name) || state.mode === "racing");
  dom.hud.classList.toggle("hidden", !hudVisible);
  dom.mobileControls.classList.toggle("active", controlsVisible);
  dom.app?.classList.toggle("is-menu", !["racing", "countdown"].includes(state.mode));
  dom.app?.classList.toggle("is-racing", state.mode === "racing");
  const map = {
    title: dom.titleScreen,
    mode: dom.modeScreen,
    select: dom.selectScreen,
    course: dom.courseScreen,
    pause: dom.pauseScreen,
    help: dom.helpScreen,
    result: dom.resultScreen
  };
  map[name].classList.remove("hidden");
  if (name === "course") {
    scheduleBaseWarmup(QUALITY.low ? 900 : 320);
    scheduleRaceWarmup(QUALITY.low ? 1800 : 900);
  }
  markMenuDirty();
}

function animate() {
  const now = performance.now();
  const menuScene = state.mode !== "racing" && state.mode !== "countdown";
  if (menuScene) {
    const interval = QUALITY.menuFrameInterval;
    if (!menuDirty && lastMenuFrameTime && now - lastMenuFrameTime < interval) return;
    lastMenuFrameTime = now;
    menuDirty = false;
  } else {
    lastMenuFrameTime = 0;
    menuDirty = true;
  }
  const clockDelta = clock.getDelta();
  const rawDt = Math.min(clockDelta, menuScene ? 0.032 : 0.05);
  const dt = rawDt || 0.016;
  updateAdaptiveQuality(clockDelta || dt, menuScene);
  updateScene(dt);
  renderer.render(scene, camera);
}

function updateAdaptiveQuality(frameSeconds, menuScene) {
  if (menuScene) {
    frameCostAverage = approach(frameCostAverage, 16, 0.4);
    adaptiveEffectScale = approach(adaptiveEffectScale, 1, 0.02);
    return;
  }
  const frameMs = clamp(frameSeconds * 1000, 8, 80);
  frameCostAverage = frameCostAverage * 0.94 + frameMs * 0.06;
  const target = frameCostAverage > 38 ? 0.42 : frameCostAverage > 30 ? 0.58 : frameCostAverage > 24 ? 0.78 : 1;
  adaptiveEffectScale = approach(adaptiveEffectScale, target, 0.03);
}

function effectChance(base) {
  return base * QUALITY.effectRate * adaptiveEffectScale;
}

function particleLimit() {
  return Math.max(24, Math.floor(QUALITY.particleCap * adaptiveEffectScale));
}

function burstLimit(count) {
  return Math.max(2, Math.floor(Math.min(count, QUALITY.maxBurst) * adaptiveEffectScale));
}
function updateScene(dt) {
  const raceActive = state.mode === "racing";
  if (raceActive) state.time += dt;

  itemBoxes.forEach((box) => {
    const phase = performance.now() * 0.003 + box.userData.index;
    box.position.y = (box.userData.baseY ?? box.position.y) + Math.sin(phase) * 0.18;
    if (box.userData.shell) {
      box.userData.shell.rotation.y += dt * 2.1;
      box.userData.shell.rotation.x += dt * 0.9;
    } else {
      box.rotation.y += dt * 1.6;
      box.rotation.x += dt * 0.65;
    }
    if (box.userData.core) box.userData.core.rotation.y -= dt * 1.3;
    if (box.userData.halo) box.userData.halo.rotation.z += dt * 1.8;
    if (box.userData.cooldown > 0) {
      box.userData.cooldown -= dt;
      box.visible = Math.floor(box.userData.cooldown * 8) % 2 === 0;
      if (box.userData.cooldown <= 0) box.visible = true;
    }
  });

  if (raceActive) {
    racers.forEach((racer) => updateRacer(racer, dt));
    updateProjectiles(dt);
    updateTraps(dt);
    updateRanks();
    hudTimer -= dt;
    if (hudTimer <= 0) {
      updateHud();
      hudTimer = QUALITY.hudInterval;
    }
    if (player.finished) finishRace();
  } else {
    racers.forEach((racer) => idleRacer(racer, dt));
  }
  updateParticles(dt);
  updateTireMarks(dt);
  updateCamera(dt);
  minimapTimer -= dt;
  if (minimapTimer <= 0) {
    updateMinimap();
    minimapTimer = QUALITY.minimapInterval;
  }
  updateAudio();
}

function updateRacer(racer, dt) {
  if (racer.finished) {
    racer.speed = approach(racer.speed, 0, 12 * dt);
    return;
  }
  racer.itemCooldown = Math.max(0, racer.itemCooldown - dt);
  racer.boostTimer = Math.max(0, racer.boostTimer - dt);
  racer.shieldTimer = Math.max(0, racer.shieldTimer - dt);
  racer.stunTimer = Math.max(0, racer.stunTimer - dt);
  racer.obstacleCooldown = Math.max(0, (racer.obstacleCooldown || 0) - dt);
  racer.unstuckCooldown = Math.max(0, (racer.unstuckCooldown || 0) - dt);
  racer.boostPanelLock = Math.max(0, (racer.boostPanelLock || 0) - dt);
  racer.impactPose = Math.max(0, (racer.impactPose || 0) - dt * 2.4);
  racer.miniTurboTimer = Math.max(0, racer.miniTurboTimer - dt);
  racer.wobble = Math.max(0, racer.wobble - dt * 3);

  const controls = racer.isPlayer ? readPlayerControls() : readCpuControls(racer, dt);
  if (racer.isPlayer) {
    const currentSteer = racer.controlSteer || 0;
    const steerRate = Math.abs(controls.steer) > Math.abs(currentSteer) ? 12 : 9;
    racer.controlSteer = approach(currentSteer, controls.steer, steerRate * dt);
    controls.steer = Math.abs(controls.steer) < 0.01 && Math.abs(racer.controlSteer) < 0.015 ? 0 : racer.controlSteer;
  }
  const stats = combinedStats(racer);
  const maxSpeed = (34 + stats.speed * 3.4) * (racer.isPlayer ? 1 : difficulty().speed);
  const accel = 15 + stats.accel * 2.1;
  const brake = 28 + stats.weight * 0.8;
  const handling = 1.3 + stats.handling * 0.11;
  const grip = 0.88 + stats.handling * 0.018 - stats.weight * 0.012;
  const boostPower = 1 + stats.boost * 0.045;
  const stunned = racer.stunTimer > 0;

  let throttle = controls.accel ? 1 : 0;
  let reverse = controls.brake ? 1 : 0;
  if (stunned) {
    throttle = 0;
    reverse = 0.2;
  }

  if (throttle) racer.speed += accel * dt;
  if (reverse) racer.speed -= racer.speed > 4 ? brake * dt : accel * 0.55 * dt;
  if (!throttle && !reverse) racer.speed = approach(racer.speed, 0, (6.5 + Math.abs(racer.speed) * 0.05) * dt);

  const boosting = racer.boostTimer > 0 || racer.miniTurboTimer > 0;
  const currentMax = maxSpeed * (boosting ? 1.32 * boostPower : 1);
  racer.speed = clamp(racer.speed, -maxSpeed * 0.32, currentMax);

  const steer = controls.steer;
  const speedFactor = clamp(Math.abs(racer.speed) / maxSpeed, 0.1, 1.1);
  const wantsDrift = controls.drift && Math.abs(steer) > 0.15 && racer.speed > maxSpeed * 0.32;
  if (wantsDrift && !racer.driftActive) {
    racer.driftActive = true;
    racer.driftDir = Math.sign(steer);
    racer.driftCharge = 0;
  }
  if (racer.driftActive) {
    racer.driftCharge += dt;
    if (!controls.drift || racer.speed < maxSpeed * 0.2) {
      if (racer.driftCharge > 0.75) {
        racer.miniTurboTimer = clamp(racer.driftCharge * 0.45, 0.45, 1.45);
        spawnBurst(racer.position, 0xffc857, 18, 1.5);
        playAudio("boost", 0.45);
      }
      racer.driftActive = false;
      racer.driftCharge = 0;
    }
  }

  const driftGrip = racer.driftActive ? 0.62 : 1;
  const turn = steer * handling * (racer.driftActive ? 1.42 : 1) * speedFactor * Math.sign(racer.speed || 1);
  racer.yaw += turn * dt;

  const forward = forwardFromYaw(racer.yaw);
  const lateral = new THREE.Vector3(forward.z, 0, -forward.x);
  const slide = racer.driftActive ? racer.driftDir * (1 - grip * driftGrip) * 4.2 : steer * (1 - grip) * 1.3;
  racer.velocity.copy(forward).multiplyScalar(racer.speed);
  racer.velocity.addScaledVector(lateral, slide * Math.abs(racer.speed));
  racer.position.addScaledVector(racer.velocity, dt);

  let nearest = nearestTrackSample(racer.position, racer.trackIndex);
  if (handleCourseAssist(racer, nearest, controls, dt)) {
    nearest = nearestTrackSample(racer.position, nearest.index);
  }
  handleSurface(racer, nearest, dt);
  handleRaceProgress(racer, nearest);
  handleItemPickup(racer);
  handleBoostPanels(racer, nearest);
  handleJumpRamps(racer, nearest);
  handleObstacleCollisions(racer, nearest);
  handleRacerContacts(racer, dt);
  handleStuckAssist(racer, nearest, controls, dt);

  const wasAirborne = racer.wasAirborne;
  if (racer.jumpHeight > 0 || racer.verticalSpeed > 0) {
    racer.verticalSpeed -= 34 * dt;
    racer.jumpHeight = Math.max(0, racer.jumpHeight + racer.verticalSpeed * dt);
    if (racer.jumpHeight === 0) racer.verticalSpeed = 0;
  }
  racer.wasAirborne = racer.jumpHeight > 0.08 || racer.verticalSpeed > 0;
  if (wasAirborne && !racer.wasAirborne) {
    spawnShockwave(racer.position, racer.kart.colors.accent || racer.character.colors.accent, racer.isPlayer ? 4.5 : 3.2);
    if (racer.isPlayer) cameraShake = Math.max(cameraShake, 0.28);
  }

  if (racer.driftActive && Math.random() < effectChance(0.45)) {
    spawnSparks(racer);
    addTireMark(racer);
  }
  if (boosting && Math.random() < effectChance(0.62)) {
    spawnBoostTrail(racer);
  }
  if (Math.abs(racer.speed) > 10 && Math.random() < effectChance(boosting ? 0.68 : 0.26)) {
    spawnMachineHoverParticles(racer, boosting);
  }
  if (Math.abs(racer.speed) > 18 && Math.random() < effectChance(boosting ? 0.58 : 0.22)) {
    spawnAirShearLine(racer, boosting);
  }

  racer.group.position.copy(racer.position);
  racer.group.position.y += racer.jumpHeight + 0.08;
  racer.group.rotation.y = racer.yaw;
  racer.group.rotation.z = -steer * 0.14 + (racer.driftActive ? -racer.driftDir * 0.11 : 0) + Math.sin(performance.now() * 0.02) * racer.wobble * 0.05;
  racer.group.rotation.x = clamp(racer.speed / maxSpeed, -0.18, 0.18) * -0.2 - (boosting ? 0.035 : 0);
  racer.group.traverse((child) => {
    if (child.userData.spin) child.rotation.x += racer.speed * dt * 0.55;
  });
  animateKartVisuals(racer, dt, speedFactor, boosting, steer);
  if (racer.group.userData.engineLight) {
    racer.group.userData.engineLight.intensity = boosting ? 16 : 4 + speedFactor * 5;
  }
}

function animateKartVisuals(racer, dt, speedFactor, boosting, steer) {
  const group = racer.group;
  const chassis = group.userData.chassis;
  const profile = group.userData.machineProfile || {};
  const t = performance.now() * 0.001;
  const impact = racer.wobble || racer.impactPose || 0;
  const driftLean = racer.driftActive ? -racer.driftDir * 0.1 : 0;
  const bob = Math.sin(t * 12 + racer.trackIndex * 0.03) * (0.035 + speedFactor * 0.035);
  if (chassis) {
    chassis.position.y = bob + (boosting ? 0.04 : 0);
    chassis.rotation.x = approach(chassis.rotation.x, -speedFactor * 0.052 + racer.jumpHeight * 0.004 - (boosting ? 0.025 : 0), 5 * dt);
    chassis.rotation.z = approach(chassis.rotation.z, steer * -0.052 + driftLean + Math.sin(t * 24) * impact * 0.045, 6 * dt);
    chassis.rotation.y = approach(chassis.rotation.y, (racer.driftActive ? racer.driftDir * 0.035 : 0) + Math.sin(t * 22) * impact * 0.018, 4 * dt);
  }
  if (group.userData.driverRoot) {
    const driver = group.userData.driverRoot;
    const baseY = profile.seatY || 2.5;
    driver.position.y = baseY + bob * 1.7 + (boosting ? 0.04 : 0);
    driver.position.x = Math.sin(t * 22) * impact * 0.045;
    driver.rotation.z = approach(driver.rotation.z, steer * -0.14 + driftLean * 1.35 + Math.sin(t * 18) * impact * 0.08, 7 * dt);
    driver.rotation.x = approach(driver.rotation.x, boosting ? -0.13 : racer.driftActive ? 0.055 : (profile.driverPitch || 0) + 0.02, 5 * dt);
    driver.rotation.y = approach(driver.rotation.y, -steer * 0.08 + (racer.driftActive ? -racer.driftDir * 0.06 : 0), 5 * dt);
    animateDriverSignature(racer, dt, speedFactor, boosting, steer);
  }
  (group.userData.hoverRings || []).forEach((wheel, index) => {
    wheel.scale.y = 1 + Math.sin(t * 20 + index) * 0.035 + (boosting ? 0.035 : 0);
    wheel.rotation.z += (boosting ? 3.8 : 1.9) * dt;
  });
  (group.userData.enginePlumes || []).forEach((plume, index) => {
    const pulse = 0.5 + speedFactor * 0.72 + (boosting ? 0.95 : 0) + Math.sin(t * 35 + index) * 0.08;
    plume.scale.set(0.44 + pulse * 0.18, 0.44 + pulse * 0.18, 0.34 + pulse * 0.5);
    if (plume.material) plume.material.opacity = clamp(0.16 + pulse * 0.24, 0.14, 0.66);
  });
  if (group.userData.underglow?.material) {
    group.userData.underglow.material.opacity = clamp(0.11 + speedFactor * 0.14 + (boosting ? 0.16 : 0), 0.08, 0.42);
  }
  animateMachineSignature(group, dt, speedFactor, boosting, steer, racer.driftActive ? racer.driftDir : 0, impact);
}

function animateMachineSignature(group, dt, speedFactor, boosting, steer, driftDir, impact) {
  const parts = group.userData.machineMotionParts;
  if (!parts) return;
  const t = performance.now() * 0.001;
  (parts.pulse || []).forEach((mesh, index) => {
    const base = mesh.userData.baseScale || new THREE.Vector3(1, 1, 1);
    const amount = 1 + Math.sin(t * (2.6 + index * 0.22)) * 0.075 + (boosting ? 0.16 : 0) + impact * 0.035;
    mesh.scale.set(base.x * amount, base.y * amount, base.z * amount);
    if (mesh.material && "opacity" in mesh.material) mesh.material.opacity = clamp(0.42 + speedFactor * 0.18 + (boosting ? 0.22 : 0), 0.26, 0.94);
  });
  (parts.spin || []).forEach((mesh, index) => {
    mesh.rotation.z += dt * (0.8 + speedFactor * 1.9 + (boosting ? 1.4 : 0) + index * 0.18);
    mesh.rotation.y += dt * 0.32;
  });
  (parts.flutter || []).forEach((mesh, index) => {
    const base = mesh.userData.baseRotation || new THREE.Euler();
    mesh.rotation.x = base.x + Math.sin(t * 5.6 + index) * (0.035 + speedFactor * 0.035) + (boosting ? -0.04 : 0);
    mesh.rotation.z = base.z + steer * -0.05 + driftDir * -0.08 + Math.sin(t * 4.2 + index) * 0.04;
  });
  (parts.hover || []).forEach((mesh, index) => {
    const base = mesh.userData.basePosition || mesh.position;
    mesh.position.x = base.x + Math.sin(t * 2.6 + index) * (0.04 + speedFactor * 0.02);
    mesh.position.y = base.y + Math.cos(t * 3.2 + index) * (0.055 + (boosting ? 0.045 : 0));
  });
}

function animateDriverSignature(racer, dt, speedFactor, boosting, steer) {
  const driver = racer.group.userData.driverRoot;
  const parts = driver?.userData?.characterMotionParts;
  if (!parts) return;
  const t = performance.now() * 0.001;
  (parts.pulse || []).forEach((mesh, index) => {
    const base = mesh.userData.baseScale || new THREE.Vector3(1, 1, 1);
    const amount = 1 + Math.sin(t * (2.2 + index * 0.35)) * 0.08 + (boosting ? 0.12 : 0);
    mesh.scale.set(base.x * amount, base.y * amount, base.z * amount);
    if (mesh.material && "opacity" in mesh.material) mesh.material.opacity = clamp(0.44 + speedFactor * 0.16 + (boosting ? 0.16 : 0), 0.32, 0.88);
  });
  (parts.spin || []).forEach((mesh, index) => {
    mesh.rotation.z += dt * (0.8 + speedFactor * 1.6 + index * 0.2);
  });
  (parts.flutter || []).forEach((mesh, index) => {
    const base = mesh.userData.baseRotation || new THREE.Euler();
    mesh.rotation.x = base.x + Math.sin(t * 5.1 + index) * (0.045 + speedFactor * 0.035);
    mesh.rotation.z = base.z + steer * -0.06 + Math.sin(t * 4.4 + index * 0.6) * 0.055 + (racer.driftActive ? -racer.driftDir * 0.06 : 0);
  });
  (parts.sway || []).forEach((mesh, index) => {
    const base = mesh.userData.basePosition || mesh.position;
    mesh.position.x = base.x + Math.sin(t * 3.0 + index) * (0.025 + speedFactor * 0.018);
    mesh.position.y = base.y + Math.cos(t * 2.4 + index) * 0.025;
  });
}

function readPlayerVisualSteerInput() {
  const steerKeys = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const touch = Math.abs(input.touchSteer) > 0.05 ? input.touchSteer : 0;
  return clamp(steerKeys + touch, -1, 1);
}

function readPlayerSteerInput() {
  return -readPlayerVisualSteerInput();
}

function readPlayerControls() {
  return {
    accel: input.accel,
    brake: input.brake,
    steer: readPlayerSteerInput(),
    drift: input.drift
  };
}

function readCpuControls(racer, dt) {
  const diff = difficulty();
  racer.ai.useTimer -= dt;
  if (racer.ai.useTimer <= 0 && racer.item) {
    useItem(racer);
    racer.ai.useTimer = 1.8 + rand() * 3.2;
  }

  const lookAhead = Math.floor(14 + clamp(racer.speed, 0, 70) * 0.45);
  const targetIndex = (racer.trackIndex + lookAhead) % TRACK_STEPS;
  const targetSample = track.samples[targetIndex];
  const offsetNoise = Math.sin(state.time * 0.75 + racer.ai.noise) * (1.2 / diff.precision);
  const target = targetSample.point
    .clone()
    .addScaledVector(targetSample.normal, racer.ai.targetOffset + offsetNoise);
  const toTarget = target.sub(racer.position);
  const desiredYaw = Math.atan2(toTarget.x, toTarget.z);
  const angle = shortestAngle(racer.yaw, desiredYaw);

  const futureA = track.samples[(racer.trackIndex + 8) % TRACK_STEPS].tangent;
  const futureB = track.samples[(racer.trackIndex + 30) % TRACK_STEPS].tangent;
  const curve = 1 - clamp(futureA.dot(futureB), -1, 1);
  let accel = curve < 0.18 || racer.speed < 24;
  let brake = curve > 0.48 && racer.speed > 26 * diff.speed;
  let steer = clamp(angle * 1.7 * diff.precision, -1, 1);

  racers.forEach((other) => {
    if (other === racer || other.finished) return;
    const dist = other.position.distanceTo(racer.position);
    if (dist < 8) {
      const local = other.position.clone().sub(racer.position);
      const right = new THREE.Vector3(Math.cos(racer.yaw), 0, -Math.sin(racer.yaw));
      steer -= Math.sign(local.dot(right)) * (8 - dist) * 0.04;
    }
  });

  if (racer.stunTimer > 0) {
    accel = false;
    brake = true;
  }
  const drift = curve > 0.24 && Math.abs(steer) > 0.32 && racer.speed > 22;
  return { accel, brake, steer: clamp(steer, -1, 1), drift };
}

function difficulty() {
  return DATA.difficulties[state.difficulty] || DATA.difficulties.Normal || fallbackData.difficulties.Normal;
}

function combinedStats(racer) {
  const c = racer.character.stats;
  const k = racer.kart.stats;
  return {
    speed: (c.speed + k.speed) * 0.5,
    accel: (c.accel + k.accel) * 0.5,
    handling: (c.handling + k.handling) * 0.5,
    weight: (c.weight + k.weight) * 0.5,
    boost: (c.boost + k.boost) * 0.5
  };
}

function handleCourseAssist(racer, nearest, controls, dt) {
  if (!racer.isPlayer || !nearest?.sample || racer.finished) return false;
  const movingIntent = controls.accel || racer.speed > 12;
  if (!movingIntent) return false;
  const absLateral = Math.abs(nearest.lateral || 0);
  const softEdge = TRACK_WIDTH * 0.34;
  const hardEdge = TRACK_WIDTH * 0.5;
  if (absLateral < softEdge) return false;
  const side = Math.sign(nearest.lateral || 1);
  const amount = clamp((absLateral - softEdge) / Math.max(0.01, hardEdge - softEdge), 0, 1);
  const assist = QUALITY.assistStrength || 1;
  const inward = -side;
  const pull = (1.6 + amount * 5.2) * assist * dt;
  racer.position.addScaledVector(nearest.sample.normal, inward * pull);
  racer.velocity.addScaledVector(nearest.sample.normal, inward * amount * 8.5 * assist * dt);
  const desiredYaw = Math.atan2(nearest.sample.tangent.x, nearest.sample.tangent.z);
  const steerRespect = Math.abs(controls.steer || 0) > 0.72 ? 0.42 : 1;
  racer.yaw += shortestAngle(racer.yaw, desiredYaw) * clamp(dt * (0.55 + amount * 1.45) * assist * steerRespect, 0, 0.105);
  if (amount > 0.82 && racer.speed > 0) {
    racer.speed = Math.max(racer.speed * (1 - 0.08 * dt), 13);
  }
  if (amount > 0.62 && rand() < effectChance(0.08)) {
    spawnBurst(racer.position, 0x7df9ff, 2, 0.42);
  }
  return true;
}
function handleSurface(racer, nearest, dt) {
  const offTrack = Math.abs(nearest.lateral) > TRACK_WIDTH * 0.52;
  const hardWall = Math.abs(nearest.lateral) > TRACK_WIDTH * 0.72;
  const rescueZone = Math.abs(nearest.lateral) > TRACK_WIDTH * 0.95;
  const layout = track?.layout || courseLayout();
  const dirt = layout.dirtZones.some(([start, end, offset]) => {
    const sameSide = offset === 0 || Math.sign(nearest.lateral || offset) === Math.sign(offset);
    return isIndexBetween(nearest.index, start, end) && sameSide && Math.abs(nearest.lateral) > TRACK_WIDTH * 0.2;
  });
  const shortcut =
    activeCourse().id === "starlight-orbit-ring" &&
    isIndexBetween(nearest.index, 186, 228) && nearest.lateral < -TRACK_WIDTH * 0.42 && nearest.lateral > -TRACK_WIDTH * 1.1;

  if ((offTrack && !shortcut) || dirt) {
    const offAmount = clamp((Math.abs(nearest.lateral) - TRACK_WIDTH * 0.52) / (TRACK_WIDTH * 0.58), 0, 1);
    const speedLoss = dirt ? 0.7 : 0.55 + offAmount * 0.75;
    racer.speed *= 1 - speedLoss * dt;

    if (offTrack && !shortcut) {
      const safeLateral = Math.sign(nearest.lateral) * TRACK_WIDTH * 0.46;
      const recoveryTarget = nearest.sample.point.clone().addScaledVector(nearest.sample.normal, safeLateral);
      const pull = racer.isPlayer ? 0.065 + offAmount * 0.12 : 0.045 + offAmount * 0.08;
      racer.position.lerp(recoveryTarget, clamp(pull, 0, 0.24));

      const desiredYaw = Math.atan2(nearest.sample.tangent.x, nearest.sample.tangent.z);
      racer.yaw += shortestAngle(racer.yaw, desiredYaw) * clamp(dt * (1.8 + offAmount * 3.2), 0, 0.22);
      racer.velocity.addScaledVector(nearest.sample.normal, -Math.sign(nearest.lateral) * offAmount * 12 * dt);

      if (racer.isPlayer && Math.random() < 0.12) spawnBurst(racer.position, 0x9ee7ff, 2, 0.55);
    } else if (racer.isPlayer && Math.random() < 0.08) {
      spawnBurst(racer.position, 0x80624e, 2, 0.75);
    }
  }

  if (hardWall && !shortcut) {
    const limit = Math.sign(nearest.lateral) * TRACK_WIDTH * 0.56;
    const target = nearest.sample.point.clone().addScaledVector(nearest.sample.normal, limit);
    racer.position.lerp(target, racer.isPlayer ? 0.22 : 0.16);
    racer.speed = Math.max(racer.speed * 0.62, racer.isPlayer ? 10 : 6);
    racer.wobble = Math.max(racer.wobble, 0.55);
    if (racer.isPlayer) cameraShake = Math.max(cameraShake, 0.18);
  }

  if (rescueZone && !shortcut) {
    const safeSide = Math.sign(nearest.lateral) * TRACK_WIDTH * 0.38;
    racer.position.copy(nearest.sample.point).addScaledVector(nearest.sample.normal, safeSide);
    racer.position.y = nearest.sample.point.y;
    racer.yaw = Math.atan2(nearest.sample.tangent.x, nearest.sample.tangent.z);
    racer.speed = Math.max(Math.abs(racer.speed) * 0.5, racer.isPlayer ? 14 : 9);
    racer.verticalSpeed = 0;
    racer.jumpHeight = 0;
    racer.wobble = 0.45;
    spawnShockwave(racer.position, racer.kart.colors.accent || racer.character.colors.accent, racer.isPlayer ? 3.8 : 2.8);
    if (racer.isPlayer) cameraShake = Math.max(cameraShake, 0.22);
  }
}

function handleRaceProgress(racer, nearest) {
  const old = racer.trackIndex;
  const next = nearest.index;
  if (old > TRACK_STEPS * 0.78 && next < TRACK_STEPS * 0.22 && racer.speed > 0) {
    if (racer.startedLap) {
      racer.lap += 1;
      if (racer.lap >= activeLapTotal()) {
        racer.finished = true;
        racer.finishTime = state.time;
      }
    } else {
      racer.startedLap = true;
    }
  } else if (old < TRACK_STEPS * 0.2 && next > TRACK_STEPS * 0.8 && racer.speed < -4) {
    racer.lap = Math.max(0, racer.lap - 1);
  }
  racer.trackIndex = next;
  if (!racer.startedLap && next > TRACK_STEPS * 0.55) {
    racer.progress = next - TRACK_STEPS;
  } else {
    racer.progress = racer.lap * TRACK_STEPS + next;
  }
}

function handleItemPickup(racer) {
  if (racer.item || racer.itemCooldown > 0) return;
  for (const box of itemBoxes) {
    if (!box.visible || box.userData.cooldown > 0) continue;
    if (racer.position.distanceTo(box.position) < 5.2) {
      racer.item = chooseItemForRank(racer.rank, racers.length);
      racer.itemCooldown = 0.4;
      box.userData.cooldown = 5.5;
      spawnBurst(box.position, 0xffd166, 18, 1.4);
      spawnShockwave(box.position, racer.item.color || 0xffd166, 5.2);
      playAudio("itemPickup");
      break;
    }
  }
}

function handleBoostPanels(racer, nearest) {
  for (const panel of boostPanels) {
    if (indexDistance(nearest.index, panel.userData.index) < 5 && Math.abs(nearest.lateral) < TRACK_WIDTH * 0.38) {
      const freshBoost = (racer.boostPanelLock || 0) <= 0;
      racer.boostTimer = Math.max(racer.boostTimer, 1.12);
      if (freshBoost) {
        const accent = colorToHex(racer.kart.boostColor || racer.character.boostColor || racer.kart.colors.accent || racer.character.colors.accent);
        racer.boostPanelLock = 0.5;
        racer.wobble = Math.max(racer.wobble, 0.24);
        spawnShockwave(racer.position, accent, racer.isPlayer ? 5.8 : 4.2);
        spawnBurst(racer.position, accent, racer.isPlayer ? 16 : 9, 1.65);
        spawnBoostTrail(racer);
        if (racer.isPlayer) {
          cameraShake = Math.max(cameraShake, 0.38);
          playAudio("boost", 0.55);
        }
      } else if (racer.isPlayer) {
        cameraShake = Math.max(cameraShake, 0.28);
      }
      break;
    }
  }
}

function handleJumpRamps(racer, nearest) {
  for (const obstacle of obstacles) {
    if (obstacle.type !== "ramp") continue;
    if (indexDistance(nearest.index, obstacle.index) < 3 && Math.abs(nearest.lateral) < TRACK_WIDTH * 0.34 && racer.jumpHeight < 0.1) {
      racer.verticalSpeed = 12 + Math.max(racer.speed, 0) * 0.08;
      racer.jumpHeight = 0.2;
      spawnBurst(racer.position, 0x9ee7ff, 10, 1);
      break;
    }
  }
}

function handleObstacleCollisions(racer, nearest) {
  obstacles.forEach((obstacle) => {
    if (obstacle.radius <= 0) return;
    const dx = racer.position.x - obstacle.mesh.position.x;
    const dz = racer.position.z - obstacle.mesh.position.z;
    const distSq = dx * dx + dz * dz;
    const hitRadius = obstacle.radius + (obstacle.type === "pylon" ? 0.95 : 1.35);
    if (distSq < hitRadius * hitRadius) {
      const dist = Math.sqrt(Math.max(distSq, 0.0001));
      const fallbackNormal = obstacle.normal || nearest?.sample?.normal || forwardFromYaw(racer.yaw);
      const away = dist > 0.01
        ? new THREE.Vector3(dx / dist, 0, dz / dist)
        : new THREE.Vector3(fallbackNormal.x, 0, fallbackNormal.z).normalize();
      const tangent = obstacle.tangent || nearest?.sample?.tangent || forwardFromYaw(racer.yaw);
      const overlap = hitRadius - dist;
      const slideSign = Math.sign(racer.velocity.dot(tangent) || racer.speed || 1);
      const slideStrength = obstacle.type === "pylon" ? 0.86 : 0.34;
      racer.position.addScaledVector(away, overlap * (obstacle.type === "pylon" ? 0.72 : 0.52));
      racer.position.addScaledVector(tangent, slideSign * overlap * slideStrength);
      if (nearest?.sample?.point) racer.position.y = nearest.sample.point.y;
      if (obstacle.type === "pylon") {
        racer.speed = racer.speed >= 0
          ? Math.max(racer.speed * 0.58, racer.isPlayer ? 12 : 7)
          : Math.min(racer.speed * 0.4, racer.isPlayer ? -5 : -3);
        const desiredYaw = Math.atan2(tangent.x, tangent.z);
        racer.yaw += shortestAngle(racer.yaw, desiredYaw) * 0.18;
      } else {
        racer.speed *= -0.14;
      }
      racer.wobble = 1;
      racer.impactPose = 1;
      if ((racer.obstacleCooldown || 0) <= 0) {
        cameraShake = racer.isPlayer ? Math.max(cameraShake, obstacle.type === "pylon" ? 0.34 : 0.65) : cameraShake;
        spawnBurst(racer.position, 0xff7a5c, obstacle.type === "pylon" ? 5 : 10, obstacle.type === "pylon" ? 0.7 : 1.1);
        spawnShockwave(racer.position, racer.kart.colors.accent || racer.character.colors.accent, obstacle.type === "pylon" ? 2.6 : 4.4);
        playAudio("collision", obstacle.type === "pylon" ? 0.28 : 0.55);
      }
      racer.obstacleCooldown = obstacle.type === "pylon" ? 0.28 : 0.42;
    }
  });
}
function handleStuckAssist(racer, nearest, controls, dt) {
  if (!nearest?.sample || racer.finished) return;
  const movingIntent = controls.accel || controls.brake || Math.abs(controls.steer || 0) > 0.22;
  if (!movingIntent || racer.unstuckCooldown > 0 || racer.jumpHeight > 0.2) {
    racer.stuckTimer = Math.max(0, (racer.stuckTimer || 0) - dt * 1.8);
    return;
  }
  const offLine = Math.abs(nearest.lateral) > TRACK_WIDTH * 0.42;
  const nearObstacle = obstacles.some((obstacle) => {
    if (obstacle.radius <= 0 || obstacle.type === "ramp") return false;
    if (indexDistance(nearest.index, obstacle.index) > 6) return false;
    const dx = racer.position.x - obstacle.mesh.position.x;
    const dz = racer.position.z - obstacle.mesh.position.z;
    const radius = obstacle.radius + (obstacle.type === "pylon" ? 4.2 : 3.4);
    return dx * dx + dz * dz < radius * radius;
  });
  const trapped = Math.abs(racer.speed) < (racer.isPlayer ? 5.2 : 3.8) && (nearObstacle || offLine || racer.obstacleCooldown > 0.18);
  if (!trapped) {
    racer.stuckTimer = Math.max(0, (racer.stuckTimer || 0) - dt * 2.2);
    return;
  }
  racer.stuckTimer = (racer.stuckTimer || 0) + dt;
  const limit = racer.isPlayer ? 0.55 : 1.0;
  if (racer.stuckTimer < limit) return;

  const targetIndex = (nearest.index + (racer.isPlayer ? 7 : 5)) % TRACK_STEPS;
  const sample = track.samples[targetIndex] || nearest.sample;
  const safeLateral = clamp(nearest.lateral || 0, -TRACK_WIDTH * 0.24, TRACK_WIDTH * 0.24);
  racer.position.copy(sample.point).addScaledVector(sample.normal, safeLateral);
  racer.position.y = sample.point.y;
  racer.yaw = Math.atan2(sample.tangent.x, sample.tangent.z);
  racer.velocity.copy(sample.tangent).multiplyScalar(racer.isPlayer ? 12 : 8);
  racer.speed = Math.max(Math.abs(racer.speed), racer.isPlayer ? 17 : 10);
  racer.verticalSpeed = 0;
  racer.jumpHeight = 0;
  racer.stuckTimer = 0;
  racer.obstacleCooldown = 0;
  racer.unstuckCooldown = 1.35;
  racer.wobble = Math.max(racer.wobble, 0.45);
  racer.impactPose = Math.max(racer.impactPose, 0.45);
  if (racer.isPlayer) {
    cameraShake = Math.max(cameraShake, 0.18);
    spawnBurst(racer.position, racer.kart.colors.accent || racer.character.colors.accent || 0x9ee7ff, 7, 0.82);
  }
}

function handleRacerContacts(racer, dt) {
  racers.forEach((other) => {
    if (other === racer || other.finished) return;
    const dist = racer.position.distanceTo(other.position);
    if (dist > 0 && dist < 4.1) {
      const push = racer.position.clone().sub(other.position).normalize().multiplyScalar((4.1 - dist) * 0.5);
      racer.position.add(push);
      other.position.sub(push);
      const speedSwap = racer.speed;
      racer.speed = racer.speed * 0.75 + other.speed * 0.18;
      other.speed = other.speed * 0.75 + speedSwap * 0.18;
      racer.wobble = 0.7;
      other.wobble = 0.7;
      racer.impactPose = 0.8;
      other.impactPose = 0.8;
      if (racer.isPlayer || other.isPlayer) {
        cameraShake = Math.max(cameraShake, 0.35);
        playAudio("collision", 0.25);
      }
    }
  });
}

function idleRacer(racer, dt) {
  const victory = racer.group.userData.victoryPose;
  const t = performance.now() * 0.001;
  racer.group.rotation.y += (victory ? 0.72 : racer.isPlayer ? 0.12 : 0.05) * dt;
  racer.group.rotation.z = victory ? Math.sin(t * 4.4) * 0.05 : approach(racer.group.rotation.z, 0, dt * 2);
  racer.group.position.y = racer.position.y + Math.sin(t * (victory ? 5.2 : 2.0) + racer.trackIndex) * (victory ? 0.18 : 0.08);
  animateKartVisuals(racer, dt, victory ? 0.72 : 0.22, victory, victory ? Math.sin(t * 2.4) * 0.32 : 0);
}

function chooseItemForRank(rank, total) {
  const lowRank = rank / total;
  const pool = [];
  DATA.items.forEach((item) => {
    let weight = 1;
    if (item.kind === "comeback") weight = lowRank > 0.65 ? 8 : 0.2;
    if (item.kind === "boost") weight = lowRank > 0.45 ? 5 : 1.6;
    if (item.kind === "projectile") weight = lowRank > 0.35 ? 3 : 2.2;
    if (item.kind === "aoe") weight = lowRank > 0.55 ? 4 : 1.2;
    if (item.kind === "trap" || item.kind === "shield") weight = lowRank < 0.35 ? 4 : 1.4;
    for (let i = 0; i < Math.max(1, Math.round(weight)); i += 1) pool.push(item);
  });
  return { ...pool[Math.floor(rand() * pool.length)] };
}

function useItem(racer) {
  if (!racer || !racer.item || racer.itemCooldown > 0 || racer.finished) return;
  const item = racer.item;
  racer.item = null;
  racer.itemCooldown = 0.55;
  playAudio("itemUse", item.kind);
  if (item.kind === "boost") {
    racer.boostTimer = Math.max(racer.boostTimer, 2.25);
    spawnBurst(racer.position, colorToHex(item.color), 22, 1.8);
    spawnShockwave(racer.position, colorToHex(item.color), 6.0);
  } else if (item.kind === "projectile") {
    spawnProjectile(racer, item);
  } else if (item.kind === "aoe") {
    spawnBloom(racer, item);
  } else if (item.kind === "trap") {
    spawnTrap(racer, item);
  } else if (item.kind === "shield") {
    racer.shieldTimer = Math.max(racer.shieldTimer, 5.0);
    spawnShield(racer, item);
  } else if (item.kind === "comeback") {
    racer.boostTimer = Math.max(racer.boostTimer, 3.4);
    racer.shieldTimer = Math.max(racer.shieldTimer, 3.0);
    spawnBloom(racer, item, 22, true);
  }
  updateHud();
}

function spawnProjectile(racer, item) {
  const forward = forwardFromYaw(racer.yaw);
  const mesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 2.6, 12),
    new THREE.MeshStandardMaterial({
      color: colorToHex(item.color),
      emissive: colorToHex(item.color),
      emissiveIntensity: 1.4
    })
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.rotation.y = racer.yaw;
  mesh.position.copy(racer.position).addScaledVector(forward, 5);
  mesh.position.y += 2.2;
  scene.add(mesh);
  projectiles.push({
    owner: racer,
    mesh,
    velocity: forward.multiplyScalar(72 + Math.max(racer.speed, 0)),
    life: 2.8,
    item
  });
}

function spawnBloom(racer, item, radius = 15, strong = false) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.12, 8, 48),
    new THREE.MeshBasicMaterial({
      color: colorToHex(item.color),
      transparent: true,
      opacity: 0.9
    })
  );
  ring.position.copy(racer.position);
  ring.position.y += 1.2;
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
  addParticle({ mesh: ring, life: 0.55, maxLife: 0.55, velocity: new THREE.Vector3(), scaleRate: radius });

  racers.forEach((other) => {
    if (other === racer || other.finished) return;
    if (other.shieldTimer > 0) {
      other.shieldTimer = 0;
      spawnBurst(other.position, 0x9ee7ff, 10, 1);
      return;
    }
    const dist = other.position.distanceTo(racer.position);
    if (dist < radius) {
      other.stunTimer = Math.max(other.stunTimer, strong ? 1.8 : 1.1);
      other.speed *= strong ? 0.45 : 0.65;
      spawnBurst(other.position, colorToHex(item.color), 14, 1.2);
    }
  });
}

function spawnTrap(racer, item) {
  const backward = forwardFromYaw(racer.yaw).multiplyScalar(-1);
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.18, 8, 32),
    new THREE.MeshStandardMaterial({
      color: colorToHex(item.color),
      emissive: colorToHex(item.color),
      emissiveIntensity: 1.05,
      transparent: true,
      opacity: 0.86
    })
  );
  mesh.position.copy(racer.position).addScaledVector(backward, 5);
  mesh.position.y += 0.5;
  mesh.rotation.x = Math.PI / 2;
  scene.add(mesh);
  traps.push({ owner: racer, mesh, life: 24, item });
}

function spawnShield(racer, item) {
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(4, 24, 12),
    new THREE.MeshBasicMaterial({
      color: colorToHex(item.color),
      transparent: true,
      opacity: 0.16,
      wireframe: true
    })
  );
  racer.group.add(shell);
  addParticle({ mesh: shell, life: 5, maxLife: 5, velocity: new THREE.Vector3(), parented: true });
}

function updateProjectiles(dt) {
  projectiles = projectiles.filter((projectile) => {
    projectile.life -= dt;
    projectile.mesh.position.addScaledVector(projectile.velocity, dt);
    projectile.mesh.rotation.z += dt * 12;
    spawnBurst(projectile.mesh.position, colorToHex(projectile.item.color), 1, 0.6);
    for (const racer of racers) {
      if (racer === projectile.owner || racer.finished) continue;
      if (racer.position.distanceTo(projectile.mesh.position) < 4.2) {
        hitRacer(racer, projectile.item, projectile.owner);
        scene.remove(projectile.mesh);
        return false;
      }
    }
    if (projectile.life <= 0) {
      scene.remove(projectile.mesh);
      return false;
    }
    return true;
  });
}

function updateTraps(dt) {
  traps = traps.filter((trap) => {
    trap.life -= dt;
    trap.mesh.rotation.z += dt * 2.4;
    for (const racer of racers) {
      if (racer === trap.owner || racer.finished) continue;
      if (racer.position.distanceTo(trap.mesh.position) < 4) {
        hitRacer(racer, trap.item, trap.owner, 0.85);
        scene.remove(trap.mesh);
        return false;
      }
    }
    if (trap.life <= 0) {
      scene.remove(trap.mesh);
      return false;
    }
    return true;
  });
}

function hitRacer(racer, item, owner, stun = 1.25) {
  if (racer.shieldTimer > 0) {
    racer.shieldTimer = 0;
    spawnBurst(racer.position, 0x9ee7ff, 18, 1.4);
    return;
  }
  racer.stunTimer = Math.max(racer.stunTimer, stun);
  racer.speed *= 0.42;
  racer.wobble = 1.2;
  spawnBurst(racer.position, colorToHex(item.color), 24, 1.8);
  spawnShockwave(racer.position, colorToHex(item.color), 6.8);
  if (racer.isPlayer || owner?.isPlayer) cameraShake = Math.max(cameraShake, 0.8);
  playAudio("collision", 0.7);
}

function spawnSparks(racer) {
  const accent = colorToHex(racer.kart.colors.accent || racer.character.colors.accent || 0xffd166);
  const hot = racer.driftCharge > 1.1 ? 0xfff2a6 : accent;
  const back = forwardFromYaw(racer.yaw).multiplyScalar(-1);
  const sideVector = new THREE.Vector3(Math.cos(racer.yaw), 0, -Math.sin(racer.yaw));
  [-1, 1].forEach((sideSign) => {
    const side = sideVector.clone().multiplyScalar(sideSign * 1.85);
    const origin = racer.position.clone().addScaledVector(back, 2.45).add(side);
    if (sideSign === (racer.driftDir || 1)) spawnBurst(origin, hot, 3, 1.15);
    for (let i = 0; i < 2; i += 1) {
      const spark = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.055, 1.15 + rand() * 1.8),
        new THREE.MeshBasicMaterial({ color: hot, transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      spark.position.copy(origin).addScaledVector(sideVector, (rand() - 0.5) * 0.6);
      spark.position.y += 0.1 + rand() * 0.38;
      spark.rotation.y = racer.yaw + (rand() - 0.5) * 0.46;
      spark.rotation.z = (rand() - 0.5) * 0.4;
      scene.add(spark);
      addParticle({ mesh: spark, velocity: back.clone().multiplyScalar(10 + rand() * 12).addScaledVector(sideVector, sideSign * (2 + rand() * 5)), life: 0.24 + rand() * 0.18, maxLife: 0.42 });
    }
  });
}

function spawnBoostTrail(racer) {
  const back = forwardFromYaw(racer.yaw).multiplyScalar(-1);
  const side = new THREE.Vector3(Math.cos(racer.yaw), 0, -Math.sin(racer.yaw));
  const origin = racer.position.clone().addScaledVector(back, 3.7);
  const accent = colorToHex(racer.kart.boostColor || racer.character.boostColor || racer.kart.colors.glow || racer.kart.colors.accent || racer.character.colors.accent || 0x7df9ff);
  spawnBurst(origin, accent, 5, 1.75);
  [-1, 1].forEach((sideSign) => {
    if (rand() > 0.78 && !racer.isPlayer) return;
    const streak = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 + rand() * 0.1, 0.08 + rand() * 0.08, 4.8 + rand() * 3.8),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    streak.position.copy(origin).addScaledVector(side, sideSign * (0.7 + rand() * 0.5));
    streak.position.y += 0.55 + rand() * 1.0;
    streak.rotation.y = racer.yaw + (rand() - 0.5) * 0.26;
    streak.rotation.x = (rand() - 0.5) * 0.18;
    scene.add(streak);
    addParticle({ mesh: streak, velocity: back.clone().multiplyScalar(18 + rand() * 16), life: 0.3 + rand() * 0.22, maxLife: 0.54 });
  });
  if (rand() < 0.42) {
    const ribbon = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5 + rand() * 0.9, 5.8 + rand() * 3.4),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    ribbon.position.copy(origin);
    ribbon.position.y += 0.28;
    ribbon.rotation.x = -Math.PI / 2;
    ribbon.rotation.z = -racer.yaw + (rand() - 0.5) * 0.18;
    scene.add(ribbon);
    addParticle({ mesh: ribbon, velocity: back.clone().multiplyScalar(8 + rand() * 6), life: 0.26 + rand() * 0.18, maxLife: 0.44, scaleRate: 1.7 });
  }
}

function spawnMachineHoverParticles(racer, boosting = false) {
  const accent = colorToHex(racer.kart.boostColor || racer.character.boostColor || racer.kart.colors.accent || racer.character.colors.accent || 0x7df9ff);
  const back = forwardFromYaw(racer.yaw).multiplyScalar(-1);
  const side = new THREE.Vector3(Math.cos(racer.yaw), 0, -Math.sin(racer.yaw));
  const sideSign = rand() > 0.5 ? 1 : -1;
  const origin = racer.position.clone().addScaledVector(back, 1.7 + rand() * 1.8).addScaledVector(side, sideSign * (1.2 + rand() * 1.8));
  origin.y += 0.18 + rand() * 0.38;
  const mote = new THREE.Mesh(
    new THREE.SphereGeometry(boosting ? 0.11 + rand() * 0.1 : 0.06 + rand() * 0.08, 8, 6),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: boosting ? 0.78 : 0.46, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  mote.position.copy(origin);
  scene.add(mote);
  addParticle({ mesh: mote, velocity: back.clone().multiplyScalar(4 + rand() * (boosting ? 12 : 5)).addScaledVector(side, sideSign * (0.8 + rand() * 2.4)), life: 0.26 + rand() * 0.3, maxLife: 0.56 });
}

function spawnAirShearLine(racer, boosting = false) {
  const accent = colorToHex(racer.kart.boostColor || racer.character.boostColor || racer.kart.colors.accent || racer.character.colors.accent || 0x7df9ff);
  const back = forwardFromYaw(racer.yaw).multiplyScalar(-1);
  const side = new THREE.Vector3(Math.cos(racer.yaw), 0, -Math.sin(racer.yaw));
  const sideSign = rand() > 0.5 ? 1 : -1;
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.055, boosting ? 5.6 + rand() * 3.2 : 3.2 + rand() * 2.4),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: boosting ? 0.54 : 0.3, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  line.position.copy(racer.position).addScaledVector(side, sideSign * (2.8 + rand() * 2.4)).addScaledVector(back, 1.2 + rand() * 2.2);
  line.position.y += 0.9 + rand() * 1.2;
  line.rotation.y = racer.yaw + (rand() - 0.5) * 0.18;
  line.rotation.x = (rand() - 0.5) * 0.12;
  scene.add(line);
  addParticle({ mesh: line, velocity: back.clone().multiplyScalar(10 + rand() * (boosting ? 16 : 8)), life: 0.2 + rand() * 0.18, maxLife: 0.38 });
}

function spawnGoalLightShow(racer) {
  const accent = colorToHex(racer.kart.boostColor || racer.character.boostColor || racer.kart.colors.accent || racer.character.colors.accent || 0xffd166);
  const origin = racer.position.clone();
  spawnBurst(origin, accent, 36, 2.35);
  spawnShockwave(origin, accent, 9.2);
  for (let i = 0; i < 4; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.2 + i * 0.42, 0.06, 8, 64),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.82 - i * 0.1, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.position.copy(origin);
    ring.position.y += 1.1 + i * 0.42;
    ring.rotation.x = Math.PI / 2 + i * 0.18;
    ring.rotation.z = i * 0.4;
    scene.add(ring);
    addParticle({ mesh: ring, velocity: new THREE.Vector3(0, 1.1 + i * 0.22, 0), life: 0.9 + i * 0.12, maxLife: 1.02 + i * 0.12, scaleRate: 3.2 + i * 0.8 });
  }
  const light = new THREE.PointLight(accent, 34, 62, 2);
  light.position.copy(origin);
  light.position.y += 4.5;
  scene.add(light);
  addParticle({ mesh: light, velocity: new THREE.Vector3(), life: 0.85, maxLife: 0.85 });
}

function spawnBurst(origin, color, count, power) {
  const safeCount = burstLimit(count);
  for (let i = 0; i < safeCount; i += 1) {
    const shard = i % 4 === 0;
    const geometry = shard
      ? new THREE.TetrahedronGeometry(0.16 + rand() * 0.18, 0)
      : new THREE.SphereGeometry(0.1 + rand() * 0.14, 8, 6);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.94, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    mesh.position.copy(origin);
    mesh.position.y += 0.4 + rand() * 1.6;
    mesh.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    const velocity = new THREE.Vector3(rand() - 0.5, rand() * 0.9, rand() - 0.5).normalize().multiplyScalar(power * (3 + rand() * 7));
    scene.add(mesh);
    addParticle({ mesh, velocity, life: 0.35 + rand() * 0.45, maxLife: 0.8, spin: shard ? (rand() - 0.5) * 10 : 0 });
  }
}

function spawnShockwave(origin, color, radius) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.055, 8, 54),
    new THREE.MeshBasicMaterial({ color: colorToHex(color), transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  ring.position.copy(origin);
  ring.position.y += 0.18;
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
  addParticle({ mesh: ring, life: 0.46, maxLife: 0.46, velocity: new THREE.Vector3(), scaleRate: radius });
}
function addParticle(particle) {
  while (particles.length >= particleLimit()) {
    const old = particles.shift();
    if (!old) break;
    if (old.parented) old.mesh.parent?.remove(old.mesh);
    else scene.remove(old.mesh);
  }
  particles.push(particle);
}

function updateParticles(dt) {
  particles = particles.filter((particle) => {
    particle.life -= dt;
    if (!particle.parented) {
      particle.mesh.position.addScaledVector(particle.velocity, dt);
      particle.velocity.y -= 4 * dt;
    }
    if (particle.spin) {
      particle.mesh.rotation.x += particle.spin * dt;
      particle.mesh.rotation.z += particle.spin * 0.7 * dt;
    }
    if (particle.scaleRate) {
      const scale = (1 - particle.life / particle.maxLife) * particle.scaleRate;
      particle.mesh.scale.set(scale, scale, scale);
    }
    if (particle.mesh.material) {
      particle.mesh.material.opacity = Math.max(0, particle.life / particle.maxLife) * (particle.parented ? 0.2 : 1);
    }
    if (particle.life <= 0) {
      if (particle.parented) particle.mesh.parent?.remove(particle.mesh);
      else scene.remove(particle.mesh);
      return false;
    }
    return true;
  });
}

function addTireMark(racer) {
  if (tireMarks.length > QUALITY.tireMarkCap) {
    const old = tireMarks.shift();
    scene.remove(old.mesh);
  }
  const mark = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 3.1),
    new THREE.MeshBasicMaterial({ color: 0x070a0d, transparent: true, opacity: 0.22, depthWrite: false })
  );
  const back = forwardFromYaw(racer.yaw).multiplyScalar(-1.8);
  mark.position.copy(racer.position).add(back);
  mark.position.y += 0.07;
  mark.rotation.x = -Math.PI / 2;
  mark.rotation.z = -racer.yaw;
  scene.add(mark);
  tireMarks.push({ mesh: mark, life: 5, maxLife: 5 });
}

function updateTireMarks(dt) {
  tireMarks = tireMarks.filter((mark) => {
    mark.life -= dt;
    mark.mesh.material.opacity = 0.22 * Math.max(0, mark.life / mark.maxLife);
    if (mark.life <= 0) {
      scene.remove(mark.mesh);
      return false;
    }
    return true;
  });
}

function updateRanks() {
  const sorted = getRanking();
  sorted.forEach((racer, index) => {
    racer.rank = index + 1;
  });
  state.rank = player.rank;
}

function getRanking() {
  return [...racers].sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });
}

function friendlyItemIcon(item) {
  if (!item) return "--";
  if (item.icon && String(item.icon).length <= 3) return item.icon;
  const key = String(item.kind || item.id || item.name || "").toLowerCase();
  if (key.includes("boost") || key.includes("dash")) return "GO";
  if (key.includes("projectile") || key.includes("arrow")) return "→";
  if (key.includes("aoe") || key.includes("wave")) return "☆";
  if (key.includes("trap") || key.includes("hazard")) return "◇";
  if (key.includes("shield") || key.includes("veil")) return "守";
  if (key.includes("comeback") || key.includes("comet")) return "★";
  return "道";
}

function updateHud() {
  if (!player) return;
  updateHudCharacter();
  const rankDelta = state.rank - lastHudRank;
  if (rankDelta !== 0) {
    dom.positionValue.classList.remove("rank-bump", "rank-up", "rank-down");
    void dom.positionValue.offsetWidth;
    dom.positionValue.classList.add("rank-bump", rankDelta < 0 ? "rank-up" : "rank-down");
    lastHudRank = state.rank;
  }
  const boosting = player.boostTimer > 0 || player.miniTurboTimer > 0;
  const speedKmh = Math.max(0, Math.round(player.speed * 3.1));
  dom.hud.classList.toggle("is-boosting", boosting);
  dom.hud.classList.toggle("is-drifting", player.driftActive);
  dom.hud.style.setProperty("--speed-pct", `${clamp(speedKmh / 220, 0, 1) * 100}%`);
  dom.hud.style.setProperty("--boost-pct", `${clamp(Math.max(player.boostTimer, player.miniTurboTimer) / 3.4, 0, 1) * 100}%`);
  dom.hud.style.setProperty("--drift-pct", `${clamp(player.driftCharge / 1.45, 0, 1) * 100}%`);
  dom.positionValue.textContent = `${state.rank}/${racers.length}`;
  const lapTotal = activeLapTotal();
  dom.lapValue.textContent = `${Math.min(player.lap + 1, lapTotal)}/${lapTotal}`;
  dom.timeValue.textContent = formatTime(state.time);
  dom.speedValue.textContent = String(speedKmh);
  dom.mobileControls.classList.toggle("has-item-ready", Boolean(player.item));
  dom.touchItem.setAttribute("aria-label", player.item ? `${displayName(player.item)}を使う` : "どうぐを使う");
  const itemKey = player.item ? player.item.id || player.item.name : "empty";
  if (itemKey !== lastHudItem) {
    dom.itemSlot.classList.remove("item-pulse", "has-item", "is-empty");
    void dom.itemSlot.offsetWidth;
    dom.itemSlot.classList.add("item-pulse", player.item ? "has-item" : "is-empty");
    lastHudItem = itemKey;
    dom.itemSlot.style.setProperty("--item-color", player.item?.color || "#ffffff");
    dom.itemSlot.dataset.itemKind = player.item?.kind || "empty";
    dom.itemSlot.replaceChildren();
    const icon = document.createElement("span");
    icon.className = "item-icon";
    icon.textContent = friendlyItemIcon(player.item);
    const name = document.createElement("span");
    name.className = "item-name";
    name.textContent = player.item ? displayName(player.item) : "なし";
    dom.itemSlot.append(icon, name);
  }
}

function updateHudCharacter() {
  if (!player?.character || !dom.hudRacerPortrait) return;
  const character = player.character;
  const art = characterArt(character);
  const key = character.id || displayName(character);
  if (key === lastHudCharacter) return;
  lastHudCharacter = key;
  dom.hudRacerPortrait.innerHTML = characterVisualMarkup(character, "hud-racer-visual");
  dom.hudRacerName.textContent = displayName(character);
  dom.hudRacerLine.textContent = art.shortLine || art.line;
  dom.hudRacerPanel?.style.setProperty("--primary", character.colors?.primary || "#7df9ff");
  dom.hudRacerPanel?.style.setProperty("--secondary", character.colors?.secondary || "#14233b");
  dom.hudRacerPanel?.style.setProperty("--accent", character.colors?.accent || "#ffd166");
  dom.hudRacerPanel?.setAttribute("data-character", character.id || "");
}

function resultCharacterCardMarkup(character) {
  const art = characterArt(character);
  const machine = machineForCharacter(character, DATA.characters.indexOf(character));
  const primary = character.colors?.primary || "#7df9ff";
  const secondary = character.colors?.secondary || "#14233b";
  const accent = character.boostColor || character.colors?.accent || "#ffd166";
  const machinePrimary = machine?.colors?.primary || machine?.colors?.body || primary;
  const machineSecondary = machine?.colors?.secondary || machine?.colors?.trim || secondary;
  const machineAccent = machine?.boostColor || machine?.colors?.accent || machine?.colors?.glow || accent;
  return '<div class="result-racer-card racer-' + escapeHtml(characterClassId(character)) + '" style="--primary:' + escapeHtml(primary) + ';--secondary:' + escapeHtml(secondary) + ';--accent:' + escapeHtml(accent) + ';--machine-primary:' + escapeHtml(machinePrimary) + ';--machine-secondary:' + escapeHtml(machineSecondary) + ';--machine-accent:' + escapeHtml(machineAccent) + '">' +
    '<span class="result-racer-visuals">' +
      '<span class="result-racer-portrait">' + characterVisualMarkup(character, "result-racer-visual") + '</span>' +
      '<span class="result-machine-portrait">' + kartVisualMarkup(machine) + '</span>' +
    '</span>' +
    '<span class="result-racer-copy">' +
      '<span>???????</span>' +
      '<strong>' + escapeHtml(displayName(character)) + '</strong>' +
      '<small>' + escapeHtml(art.victory) + '</small>' +
    '</span>' +
  '</div>';
}

function updateMinimap() {
  const ctx = minimapContext;
  if (!ctx || !track) return;
  const w = dom.minimap.width;
  const h = dom.minimap.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(7, 13, 24, 0.38)";
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(0.5, 0.5);
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(124, 231, 255, 0.42)";
  ctx.beginPath();
  track.samples.forEach((sample, index) => {
    const x = sample.point.x;
    const y = sample.point.z;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();
  racers.forEach((racer) => {
    ctx.fillStyle = racer.isPlayer ? "#ffd166" : "#d7f7ff";
    ctx.beginPath();
    ctx.arc(racer.position.x, racer.position.z, racer.isPlayer ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function updateCamera(dt) {
  if (!player) return;
  const forward = forwardFromYaw(player.yaw);
  const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  const speed01 = clamp(player.speed / 62, 0, 1);
  const boosting = player.boostTimer > 0 || player.miniTurboTimer > 0;
  const steerLean = readPlayerVisualSteerInput();
  const driftLean = player.driftActive ? -player.driftDir : 0;
  const behind = 17.5 + speed01 * 7.5 + (boosting ? 5.0 : 0);
  const height = 7.4 + speed01 * 3.4;
  const targetPos = player.position
    .clone()
    .addScaledVector(forward, -behind)
    .addScaledVector(right, steerLean * 1.25 + driftLean * 0.8)
    .add(new THREE.Vector3(0, height + player.jumpHeight * 0.5, 0));
  if (cameraShake > 0) {
    targetPos.x += (rand() - 0.5) * cameraShake;
    targetPos.y += (rand() - 0.5) * cameraShake * 0.7;
    cameraShake = Math.max(0, cameraShake - dt * 2.6);
  }
  camera.position.lerp(targetPos, 1 - Math.pow(0.001, dt));
  cameraTarget.copy(player.position).addScaledVector(forward, 11 + speed01 * 13);
  cameraTarget.addScaledVector(right, player.driftActive ? driftLean * 2.5 : steerLean * 1.2);
  cameraTarget.y += 3.0 + speed01 * 2.2 + player.jumpHeight * 0.24;
  const roll = clamp(-steerLean * 0.045 + driftLean * 0.085, -0.13, 0.13);
  camera.up.lerp(new THREE.Vector3(Math.sin(roll), Math.cos(roll), 0), 1 - Math.pow(0.004, dt));
  camera.lookAt(cameraTarget);
  camera.fov = approach(camera.fov, 56 + speed01 * 12 + (boosting ? 10 : 0), 38 * dt);
  camera.updateProjectionMatrix();

  speedLines.forEach((line, index) => {
    const lineSpeed = speed01 + (boosting ? 0.48 : 0);
    line.material.opacity = clamp((lineSpeed - 0.24) * 1.7, 0, 0.68);
    line.position.set(
      line.userData.side * (3 + (index % 5) * 1.3),
      -2 + ((index * 1.7) % 6),
      -8 - ((performance.now() * 0.03 + line.userData.phase) % 30)
    );
  });
}

function updateAudio() {
  if (!audio || !player) return;
  const speed01 = clamp(player.speed / 68, 0, 1);
  audio.setEngine?.(speed01, player.boostTimer > 0 ? 1 : 0);
}

function playAudio(name, ...args) {
  if (!audio) return;
  const aliases = {
    countdown: ["countdown", "playCountdown"],
    boost: ["boost", "playBoost"],
    itemPickup: ["itemPickup", "playItemPickup", "playItemGet"],
    itemUse: ["itemUse", "playItemUse", "playUseItem"],
    collision: ["collision", "playCollision", "playCrash"],
    goal: ["goal", "playGoal", "playFinish"]
  };
  const methods = aliases[name] || [name];
  for (const method of methods) {
    if (typeof audio[method] === "function") {
      audio[method](...args);
      return;
    }
  }
}

function startAudioOnce() {
  if (state.startedAudio) return;
  state.startedAudio = true;
  audio?.resume?.();
  audio?.startMusic?.();
}

function resizeRenderer() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  markMenuDirty();
}

function nearestTrackSample(position, startIndex = null) {
  let best = null;
  let bestDist = Infinity;
  const useLocalScan = Number.isFinite(startIndex);
  const scanRange = useLocalScan ? 72 : TRACK_STEPS;
  const center = useLocalScan ? Math.round(startIndex) : 0;
  const half = Math.floor(scanRange / 2);
  for (let n = 0; n < scanRange; n += 1) {
    const index = useLocalScan ? (center - half + n + TRACK_STEPS) % TRACK_STEPS : n;
    const sample = track.samples[index];
    const dx = position.x - sample.point.x;
    const dz = position.z - sample.point.z;
    const distSq = dx * dx + dz * dz;
    if (distSq < bestDist) {
      bestDist = distSq;
      best = { sample, index };
    }
  }
  const delta = position.clone().sub(best.sample.point);
  best.lateral = delta.dot(best.sample.normal);
  return best;
}

function forwardFromYaw(yaw) {
  return new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
}

function shortestAngle(from, to) {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function indexDistance(a, b) {
  const raw = Math.abs(a - b);
  return Math.min(raw, TRACK_STEPS - raw);
}

function isIndexBetween(index, start, end) {
  if (start <= end) return index >= start && index <= end;
  return index >= start || index <= end;
}

function approach(value, target, amount) {
  if (value < target) return Math.min(target, value + amount);
  if (value > target) return Math.max(target, value - amount);
  return value;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

function colorToHex(color) {
  if (typeof color === "number") return color;
  if (!color) return 0xffffff;
  return new THREE.Color(color).getHex();
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds || 0);
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const tenths = Math.floor((safe * 10) % 10);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${tenths}`;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

