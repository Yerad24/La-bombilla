import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

// ============================================================
// CONFIGURACIÓN GENERAL — todos los "números de diseño" del juego.
// Cambia valores aquí sin tocar la lógica.
// ============================================================

// ---------- ESCENARIO FIJO ----------
// El juego se dibuja SIEMPRE en esta resolución interna (1920x1080).
// El CSS escala el canvas como si fuera una imagen: idéntico en cualquier pantalla.
const DESIGN_W = 1920;
const DESIGN_H = 1080;

// ---------- SLIDERS DE TAMAÑO (5 posiciones sin números) ----------
// Cada slider del menú usa estos 5 pasos: 10%, 30%, 50%, 75%, 100%.
const SIZE_STEPS = [0.1, 0.3, 0.5, 0.75, 1];
const SIZE_DEFAULT = 4; // posición inicial = índice 4 = 100%

// ---------- PANTALLA Y AMBIENTE ----------
const PIXEL = 6;        // tamaño del "píxel" interno (look retro)
const ROOM_ZOOM = 1.15; // zoom de la imagen de la habitación
const DARKNESS = 0.94;  // oscuridad con la luz apagada (0 = visible, 1 = negro)
const VIGNETTE = 0.60;  // oscurecido de bordes (viñeta)

// ---------- TEXTOS ----------
const UI_TEXT_SIZE = 26; // tamaño base; los sliders lo multiplican

// ---------- BOMBILLA ----------
const BULB_Y_RATIO = 0.26; // altura de la bombilla (fracción de la habitación)
const BULB_RADIUS = 111;   // radio base (el slider BOMBILLA lo multiplica)

// ---------- CUERDA Y TIRADOR ----------
const ROPE_END_RATIO = 0.60; // altura de reposo del tirador
const ROPE_THICKNESS = 4;    // grosor de la cuerda
const ROPE_SEGMENTS = 19;    // segmentos de física (más = más suave)
const ROPE_REACH = 800;      // alcance máximo del arrastre
const PULL_SIZE = 21;        // radio del tirador (el mango)

// ---------- TIRÓN (tensión de la cuerda) ----------
const PULL_THRESHOLD = 150; // tensión para encender/apagar
const WARN_PULL = 120;      // tensión de advertencia (rojo + temblor + cristalitos)
const BREAK_PULL = 240;     // tensión de explosión

// ---------- LUCIÉRNAGAS ----------
const FIREFLY_COUNT = 36;       // cantidad
const FIREFLY_SIZE_MIN = 8;     // tamaño mínimo
const FIREFLY_SIZE_MAX = 15;    // tamaño máximo
const FIREFLY_AURA = 30;        // radio del aura luminosa
const FIREFLY_WALL_RATIO = 0.4; // fracción que se pega a las paredes
const FIREFLY_APPROACH = 0.55;  // aceleración hacia la luz
const FIREFLY_JUMP = 4.5;       // impulso del "golpecito" al vidrio
const FIREFLY_SCATTER = 7;      // huida al explotar
const FIREFLY_DISPERSE = 1.5;   // dispersión al apagar
const FIREFLY_WALL_PULL = 0.02; // lentitud de regreso a la pared

// ---------- FÍSICA DE LA CUERDA ----------
const ROPE_GRAVITY = 1.73; // gravedad (peso al caer)
const ROPE_DAMPING = 0.92; // amortiguación al soltar (evita rebotes raros)

// ---------- POLVO EN LA LUZ ----------
const DUST_COUNT = 8;          // motas simultáneas
const DUST_FALL_MIN = 0.3;     // caída mínima
const DUST_FALL_MAX = 0.8;     // caída máxima
const DUST_SIZE_MIN = 4;       // tamaño mínimo
const DUST_SIZE_MAX = 8;       // tamaño máximo
const DUST_ALPHA_MAX = 0.7;    // opacidad máxima
const DUST_INITIAL_COUNT = 25; // motas al instante al encender

// ---------- AURA DEL CONO ----------
const CONE_AURA_LAYERS = 4;    // capas de bloom del cono
const CONE_AURA_SIZE = 1.8;    // (referencia) tamaño del aura
const CONE_EDGE_SOFTNESS = 12; // suavizado de bordes del cono

// ---------- GATO ----------
const CAT_SIZE = 180;        // tamaño base
const CAT_EYE_GLOW = 6;      // brillo de ojos en la oscuridad
const CAT_WALK_SPEED = 0.07; // velocidad al pasear
const CAT_FLEE_SPEED = 0.6;  // velocidad al huir
const CAT_FLOOR_MIN = 0.71;  // borde superior de su zona de suelo
const CAT_FLOOR_MAX = 0.92;  // borde inferior
const CAT_MARGIN = 3;        // qué tan metido se queda en el cono

// ---------- CRISTALITOS (sonido de advertencia) ----------
const GLASS_TINK_MIN = 1800; // frecuencia mínima
const GLASS_TINK_MAX = 4400; // frecuencia máxima

// ---------- TORMENTA ----------
const STORM_MIN_INTERVAL = 18;    // seg mínimos entre relámpagos
const STORM_MAX_INTERVAL = 40;    // seg máximos
const STORM_FLASH_DURATION = 0.7; // duración del destello
const STORM_INTENSITY = 0.8;      // intensidad del destello
const STORM_THUNDER_MIN = 0.8;    // retardo mínimo del trueno
const STORM_THUNDER_MAX = 2.5;    // retardo máximo
const STORM_VOLUME = 0.35;        // volumen base del trueno

// ---------- EVENTOS ALEATORIOS (el foco falla solo) ----------
const EVENT_MIN_INTERVAL = 15;  // seg mínimos entre fallos
const EVENT_MAX_INTERVAL = 35;  // seg máximos
const EVENT_FLICKER_TIME = 0.5; // duración del parpadeo

// ---------- VIBRACIÓN MÓVIL ----------
const VIBRATE_BREAK = 120; // ms al explotar
const VIBRATE_CLICK = 15;  // ms al hacer click

// ---------- EXPLOSIÓN ----------
const BOOM_SPARKS = 26;     // chispas brillantes
const BOOM_SHARDS = 20;     // vidrios
const BOOM_RING_GROW = 1.9; // cuánto crece el anillo (en radios de bombilla)

// ---------- ENVEJECIMIENTO DE LA BOMBILLA ----------
const AGE_FULL_TIME = 600; // segundos de luz para llegar al 100% de vejez

// ---------- MODO FIESTA (arcoíris) ----------
const RAINBOW_CLICKS = 7;        // clicks seguidos en la bombilla para activarlo
const RAINBOW_TIME = 25.20;      // segundos que dura
const PARTY_PULSE_SPEED = 6;     // velocidad del bombeo de cámara
const PARTY_PULSE_AMOUNT = 0.09; // cuánto se acerca la cámara (9%)
const PARTY_DANCE_SPEED = 8;     // velocidad del baile del gato
const PARTY_MUSIC_FILE = "/audio/music/party.mp3"; // tu canción de fiesta

// ---------- POLILLA DORADA (aparece cada 3-10 min) ----------
const MOTH_SPAWN_INTERVAL_MIN = 180; // seg mínimos para que aparezca
const MOTH_SPAWN_INTERVAL_MAX = 600; // seg máximos
const MOTH_REWARD = 10;              // plata que da al atraparla
const MOTH_SIZE = 12;                // tamaño
const MOTH_SPEED = 1.8;              // velocidad de vuelo

// ---------- POMODORO (cada 25 min de luz) ----------
const POMODORO_TIME = 25 * 60;      // seg con luz encendida para completarlo
const POMODORO_BREAK_TIME = 5 * 60; // (referencia) descanso sugerido

// ---------- ECONOMÍA INTERNA ----------
const START_BULBS = 5;           // bombillas regaladas al inicio
const BULB_PRICE_BASE = 1;       // precio con plata del juego al principio
const BULB_PRICE_AFTER = 5;      // precio después de romper las 5 regaladas
const IDLE_INCOME_SECONDS = 300; // +$1 cada 5 MINUTOS con la luz encendida
const IDLE_INCOME_AMOUNT = 1;    // cuánto paga cada ciclo
const DAILY_FREE_BULBS = 1;      // bombilla gratis cada 24h
const MAX_BULB_STOCK = 10;       // tope de inventario para la gratis diaria
const AD_HOUSE_SECONDS = 5;      // duración del house-ad de respaldo
const RESET_GIFT_BULBS = 2;      // bombillas de regalo al resetear
const RESET_GIFT_MONEY = 10;     // plata de regalo al resetear

// ============================================================
// 🔗 ENLACES DE MONETIZACIÓN (lo único que debes editar a mano)
// ------------------------------------------------------------
// PATREON_URL : tu página pública de Patreon (colaboradores).
// PAYPAL_URL  : tu paypal.me para donaciones directas.
// BULB_LINK   : enlace ouo.io cuyo DESTINO es
//               https://la-bombilla-kappa.vercel.app/?grant=bulb10
// RESET_LINK  : enlace ouo.io cuyo DESTINO es
//               https://la-bombilla-kappa.vercel.app/?grant=reset
//               (si lo dejas "", el reseteo usa el house-ad de respaldo)
// ============================================================
const PATREON_URL = "https://www.patreon.com/Pix_World";
const PAYPAL_URL = "https://paypal.me/Yeison965";
const BULB_LINK = "https://ouo.io/J2EfGA";
const RESET_LINK = ""; // ej: "https://ouo.io/xxxxxx"

// ============================================================
// 💛 COLABORADORES — gente que dona en Patreon
// Edita esta lista cada mes con tus patrones activos.
// vip = $5 (nombre dorado) · gato = $3 · luciernaga = $1
// ============================================================
const COLLABS = {
  vip: [],        // ej: ["Juan Pérez"]
  gato: [],       // ej: ["María Gómez"]
  luciernaga: [], // ej: ["Pedro Ruiz"]
};

// ---------- LOGROS (31) ----------
const ACH_LIST = [
  { id: "luz", name: "PRIMERA LUZ", desc: "Enciende la bombilla por primera vez" },
  { id: "carechimba", name: "CARECHIMBA", desc: "Rompe tu primera bombilla" },
  { id: "serie", name: "ROTO EN SERIE", desc: "Rompe 5 bombillas" },
  { id: "quiebra", name: "EN QUIEBRA", desc: "Quedate en deuda" },
  { id: "control", name: "AUTOCONTROL", desc: "20 tirones sin romper" },
  { id: "luciernagas", name: "AMIGO DE LAS LUCIÉRNAGAS", desc: "60s con la luz encendida" },
  { id: "gato", name: "ASUSTAGATOS", desc: "Asusta al gato" },
  { id: "tormentas", name: "CAZATORMENTAS", desc: "Presencia 3 tormentas" },
  { id: "mijito", name: "MIJITO", desc: "Acaricia al gato" },
  { id: "gatofeliz", name: "AMIGO FELINO", desc: "10 maullidos" },
  { id: "manos", name: "MANOS A LA OBRA", desc: "Primer tirón" },
  { id: "adicto", name: "ADICTO AL TIRÓN", desc: "50 tirones" },
  { id: "maraton", name: "MARATONISTA", desc: "200 tirones" },
  { id: "cuidadoso", name: "CUIDADOSO", desc: "50 tirones sin romper" },
  { id: "ahorrativo", name: "AHORRATIVO", desc: "Junta $10" },
  { id: "derrochador", name: "SIN FONDO", desc: "Gasta toda tu plata" },
  { id: "deudor10", name: "PRESTAMISTA HARTO", desc: "Debes $10 o más" },
  { id: "coleccionista", name: "COLECCIONISTA", desc: "10 logros" },
  { id: "completista", name: "COMPLETISTA", desc: "Todos los logros" },
  { id: "arcoiris", name: "MODO FIESTA", desc: "Activa el arcoíris" },
  { id: "fiesta3", name: "ARCOÍRIS ADICTO", desc: "3 arcoíris" },
  { id: "vieja", name: "VIEJA CONFIABLE", desc: "Bombilla al 100% de vejez" },
  { id: "tormentas10", name: "PARARRAYOS", desc: "10 tormentas" },
  { id: "eventos5", name: "INSOMNE", desc: "5 fallos espontáneos" },
  { id: "luz180", name: "LUMINOTERAPIA", desc: "3 minutos de luz" },
  { id: "serial10", name: "ROTO EN SERIE X10", desc: "10 bombillas rotas" },
  { id: "serial25", name: "CARECHIMBA PRO", desc: "25 bombillas rotas" },
  { id: "egoista", name: "CORAZÓN DE PIEDRA", desc: "Apaga la luz con el gato paseando" },
  { id: "moth", name: "CAZADOR DE POLILLAS", desc: "Atrapa una polilla dorada" },
  { id: "pomodoro", name: "SALUDABLE", desc: "Completa un pomodoro" },
  { id: "pomodoro5", name: "DISCIPLINADO", desc: "Completa 5 pomodoros" },
];

// ---------- ARCHIVOS DE AUDIO (public/audio/) ----------
const MUSIC_FILES = ["/audio/music/track1.mp3", "/audio/music/track2.mp3"];
const AMB_FILES = { rain: "/audio/amb/rain.mp3", night: "/audio/amb/night.mp3" };

// ---------- localStorage: leer/guardar sin romperse si falla ----------
const loadNum = (key, def) => {
  try {
    const v = localStorage.getItem(key);
    return v !== null && !isNaN(Number(v)) ? Number(v) : def;
  } catch { return def; }
};
const saveNum = (key, v) => { try { localStorage.setItem(key, String(v)); } catch {} };
const loadJSON = (key, def) => {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : def;
  } catch { return def; }
};
const saveJSON = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };

// ============================================================
// SLIDER DE RAYITAS (5 posiciones, sin números)
// value = índice 0..4, onChange devuelve el índice elegido.
// Las rayitas son .tick y la línea deslizante es el thumb del input.
// ============================================================
const TickSlider = ({ value, onChange }) => (
  <div className="tick-slider">
    {/* las 5 rayitas marcadoras, separadas 25% entre sí */}
    {[0, 1, 2, 3, 4].map((i) => (
      <span
        key={i}
        className={value === i ? "tick on" : "tick"}
        style={{ left: `${i * 25}%` }}
      />
    ))}
    {/* la línea deslizante encima de las rayitas */}
    <input
      type="range"
      min="0"
      max="4"
      step="1"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
);

function App() {
  // Ref al <canvas>: el lienzo donde se dibuja TODO el juego
  const canvasRef = useRef(null);

  // Estado de la escena: "off" | "on" | "broken"
  const [status, setStatus] = useState("off");
  const statusRef = useRef("off"); // copia para el bucle de dibujo (sin re-renders)

  // ---------- plata, roturas y pomodoros (persistidos) ----------
  const [money, setMoney] = useState(() => loadNum("ptb_money", 5));
  const [brokenTotal, setBrokenTotal] = useState(() => loadNum("ptb_broken", 0));
  const [pomodoros, setPomodoros] = useState(() => loadNum("ptb_pomodoros", 0));

  // ---------- economía / tienda ----------
  const [bulbs, setBulbs] = useState(() => loadNum("ptb_bulbs", START_BULBS)); // inventario
  const [lastDaily, setLastDaily] = useState(() => loadNum("ptb_daily", 0));   // última gratis diaria
  const [shopOpen, setShopOpen] = useState(false);   // panel de tienda abierto
  const [adState, setAdState] = useState(null);      // { left } = house-ad de respaldo activo

  // ---------- logros ----------
  const [unlocked, setUnlocked] = useState(() => loadJSON("ptb_ach", []));
  const unlockedRef = useRef(unlocked); // lista espejo para chequeos rápidos
  const [toast, setToast] = useState(null); // cartelito superior
  const toastT = useRef(null);              // timeout del cartelito
  const [pomodoroNotice, setPomodoroNotice] = useState(false); // aviso gigante de descanso

  // ---------- paneles ----------
  const [menuOpen, setMenuOpen] = useState(false);       // menú principal
  const [sizeOpen, setSizeOpen] = useState(false);       // sub-menú TAMAÑO
  const [achOpen, setAchOpen] = useState(false);         // panel de logros
  const [collabOpen, setCollabOpen] = useState(false);   // panel de COLABORADORES
  const [confirmReset, setConfirmReset] = useState(false); // 2º click = confirmar reset
  const confirmT = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ---------- helpers de economía (estables, los usa el motor) ----------
  // suma/resta plata del juego y guarda en localStorage
  const addMoney = useCallback((n) => {
    setMoney((m) => {
      const next = m + n;
      saveNum("ptb_money", next);
      return next;
    });
  }, []);

  // suma/resta bombillas del inventario y guarda
  const addBulbs = useCallback((n) => {
    setBulbs((b) => {
      const next = Math.max(0, b + n);
      saveNum("ptb_bulbs", next);
      return next;
    });
  }, []);

  // muestra un cartelito temporal arriba
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // desbloquea un logro una sola vez, lo guarda, avisa y paga +$1
  const unlock = useCallback((id, title) => {
    if (unlockedRef.current.includes(id)) return;
    unlockedRef.current = [...unlockedRef.current, id];
    saveJSON("ptb_ach", unlockedRef.current);
    setUnlocked(unlockedRef.current);
    showToast(`LOGRO: ${title}`);
    addMoney(1);
  }, [addMoney, showToast]);

  // ---------- RESETEO CON REGALO (lo dispara ?grant=reset o el house-ad) ----------
  // Borra el progreso, regala 2 bombillas + $10 y recarga la página.
  const doReset = useCallback(() => {
    try {
      ["ptb_money", "ptb_broken", "ptb_ach", "ptb_stats", "ptb_pomodoros", "ptb_daily", "ptb_bulbs"]
        .forEach((k) => localStorage.removeItem(k));
      saveNum("ptb_bulbs", RESET_GIFT_BULBS);
      saveNum("ptb_money", RESET_GIFT_MONEY);
    } catch {}
    window.location.reload();
  }, []);

  // logros de plata (vigilando el saldo)
  useEffect(() => {
    if (money >= 10) unlock("ahorrativo", "AHORRATIVO");
    if (money <= 0) unlock("derrochador", "SIN FONDO");
    if (money <= -10) unlock("deudor10", "PRESTAMISTA HARTO");
  }, [money, unlock]);

  // logros de colección
  useEffect(() => {
    if (unlocked.length >= 10) unlock("coleccionista", "COLECCIONISTA");
    if (unlocked.length >= ACH_LIST.length - 1) unlock("completista", "COMPLETISTA");
  }, [unlocked, unlock]);

  // ---------- bombilla gratis diaria (cada 24h, tope de inventario) ----------
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      if (now - lastDaily >= 24 * 60 * 60 * 1000) {
        setLastDaily(now);
        saveNum("ptb_daily", now);
        setBulbs((b) => {
          const next = Math.min(MAX_BULB_STOCK, b + DAILY_FREE_BULBS);
          saveNum("ptb_bulbs", next);
          return next;
        });
        showToast(`BOMBILLA GRATIS DIARIA +${DAILY_FREE_BULBS}`);
      }
    };
    check();
    const id = setInterval(check, 30000); // revisa cada 30s por si dejaste la pestaña abierta
    return () => clearInterval(id);
  }, [lastDaily, showToast]);

  // ============================================================
  // 🔗 ENTREGA AUTOMÁTICA POR ENLACES ACORTADORES
  // ------------------------------------------------------------
  // Cuando el jugador completa un enlace ouo.io, el acortador lo
  // regresa al juego con la URL cargada de ?grant=...
  //   ?grant=bulb10 → +10 bombillas
  //   ?grant=reset  → reseteo con regalo (2 bombillas + $10)
  // Se limpia la URL ANTES de actuar para que no se repita al recargar.
  // ============================================================
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const grant = params.get("grant");
      if (!grant) return;
      // limpia ?grant= de la URL sin recargar
      params.delete("grant");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
      if (grant === "bulb10") {
        addBulbs(10);
        showToast("GRACIAS: +10 BOMBILLAS");
      } else if (grant === "reset") {
        showToast("RESETEANDO CON REGALO...");
        doReset();
      }
    } catch {}
  }, [addBulbs, showToast, doReset]);

  // ---------- countdown del house-ad de respaldo ----------
  useEffect(() => {
    if (!adState || adState.left <= 0) return;
    const id = setTimeout(
      () => setAdState((s) => (s ? { ...s, left: s.left - 1 } : s)),
      1000
    );
    return () => clearTimeout(id);
  }, [adState]);

  // ---------- ajustes del menú (persistidos) ----------
  const [settings, setSettings] = useState(() => {
    const s = loadJSON("ptb_settings", null);
    return {
      music: s?.music ?? true,
      track: s?.track ?? 0,
      sfx: s?.sfx ?? true,
      weather: s?.weather ?? "night",
      text: s?.text ?? true,
      storm: s?.storm ?? true,
      size: {
        text: s?.size?.text ?? SIZE_DEFAULT, // slider TEXTO
        bulb: s?.size?.bulb ?? SIZE_DEFAULT, // slider BOMBILLA (+cuerda)
        fly: s?.size?.fly ?? SIZE_DEFAULT,   // slider LUCIÉRNAGAS
        ui: s?.size?.ui ?? SIZE_DEFAULT,     // slider INTERFAZ
      },
      vol: { music: 0.5, sfx: 0.8, amb: 0.5, ...(s?.vol || {}) },
    };
  });
  const sfxRef = useRef(settings.sfx);     // ¿efectos encendidos? (lo lee el motor)
  const volRef = useRef(settings.vol);     // volúmenes (los lee el motor)
  const stormRef = useRef(settings.storm); // ¿tormenta activada? (lo lee el motor)
  const sizeRef = useRef({ bulb: 1, fly: 1 }); // escalas (las lee el motor)

  // guarda ajustes y sincroniza los refs que usa el motor
  useEffect(() => {
    saveJSON("ptb_settings", settings);
    sfxRef.current = settings.sfx;
    volRef.current = settings.vol;
    stormRef.current = settings.storm;
    sizeRef.current = {
      bulb: SIZE_STEPS[settings.size.bulb] ?? 1,
      fly: SIZE_STEPS[settings.size.fly] ?? 1,
    };
  }, [settings]);

  const setSize = (key, idx) =>
    setSettings((s) => ({ ...s, size: { ...s.size, [key]: idx } }));

  // ---------- tamaño del frame (siempre 16:9, centrado en la ventana) ----------
  const [frame, setFrame] = useState({ w: DESIGN_W, h: DESIGN_H });
  useEffect(() => {
    const f = () => {
      const base = Math.min(window.innerWidth, (window.innerHeight * 16) / 9);
      setFrame({ w: base, h: (base * 9) / 16 });
    };
    f();
    window.addEventListener("resize", f);
    document.addEventListener("fullscreenchange", f);
    return () => {
      window.removeEventListener("resize", f);
      document.removeEventListener("fullscreenchange", f);
    };
  }, []);

  // ---------- tamaños de texto ----------
  // INTERFAZ = HUD/menú/toast/logros (--ui-size)
  // TEXTO = mensajes centrales (--game-text)
  const uiSize = Math.max(6, Math.round(UI_TEXT_SIZE * (SIZE_STEPS[settings.size.ui] ?? 1)));
  const textSize = Math.max(6, Math.round(UI_TEXT_SIZE * (SIZE_STEPS[settings.size.text] ?? 1)));

  // ---------- audio: música + ambiente ----------
  const musicRef = useRef(null);
  const ambRef = useRef(null);
  const [started, setStarted] = useState(false); // primer gesto = autoplay permitido

  // el navegador exige un gesto del usuario antes de reproducir audio
  useEffect(() => {
    const f = () => setStarted(true);
    window.addEventListener("pointerdown", f, { once: true });
    return () => window.removeEventListener("pointerdown", f);
  }, []);

  // Reproducción de música (el volumen va aparte para no reiniciar)
  useEffect(() => {
    if (!musicRef.current) {
      musicRef.current = new Audio();
      musicRef.current.loop = true;
    }
    const m = musicRef.current;
    if (started && settings.music) {
      const desired = MUSIC_FILES[settings.track];
      if (!m.src.endsWith(desired)) m.src = desired;
      m.play().catch(() => {});
    } else m.pause();
  }, [settings.music, settings.track, started]);

  // MODO FIESTA: el motor avisa para pausar/reanudar la música normal
  useEffect(() => {
    const onParty = (e) => {
      const m = musicRef.current;
      if (!m) return;
      if (e.detail?.on) m.pause();
      else if (settings.music && started) m.play().catch(() => {});
    };
    window.addEventListener("party-music", onParty);
    return () => window.removeEventListener("party-music", onParty);
  }, [settings.music, started]);

  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = settings.vol.music;
  }, [settings.vol.music]);

  // Ambiente (clima): lluvia / noche / nada
  useEffect(() => {
    if (!ambRef.current) {
      ambRef.current = new Audio();
      ambRef.current.loop = true;
    }
    const a = ambRef.current;
    if (started && settings.weather !== "off" && AMB_FILES[settings.weather]) {
      const desired = AMB_FILES[settings.weather];
      if (!a.src.endsWith(desired)) a.src = desired;
      a.play().catch(() => {});
    } else a.pause();
  }, [settings.weather, started]);

  useEffect(() => {
    if (ambRef.current) ambRef.current.volume = settings.vol.amb;
  }, [settings.vol.amb]);

  // Limpieza al desmontar: silenciar todo
  useEffect(() => () => {
    if (musicRef.current) musicRef.current.pause();
    if (ambRef.current) ambRef.current.pause();
  }, []);

  // ---------- estado de pantalla completa ----------
  useEffect(() => {
    const f = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);

  // mantiene el ref de status sincronizado con el estado
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // ============================================================
  // MOTOR DEL JUEGO — canvas, física, dibujo, sonido procedural
  // ============================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Canvas invisible donde se compone la habitación iluminada del cono
    const lightCanvas = document.createElement("canvas");
    const lctx = lightCanvas.getContext("2d");

    // Imagen pixel-art de la habitación
    const room = new Image();

    // Coordenadas de diseño SIEMPRE fijas (el CSS escala el resultado)
    let viewW = DESIGN_W, viewH = DESIGN_H;

    // ---------- layout de la habitación ----------
    let roomR = [0, 0, 0, 0]; // rect [x, y, w, h]
    let bandTop = 0, bandH = 0, bandBottom = 0; // franja vertical de la habitación
    let pix = PIXEL;
    // Tamaños escalables por los sliders del menú
    let bulbR = BULB_RADIUS, pullS = PULL_SIZE, ropeT = ROPE_THICKNESS, catS = CAT_SIZE, ffScale = 1;
    let lastBulb = -1, lastFly = -1; // detectan cambios de slider

    // cámara del modo fiesta (bombeo)
    let camPulse = 0;
    let wasRainbow = false;
    let partyAudio = null;

    // polilla dorada
    let moth = null;
    let mothTimer = MOTH_SPAWN_INTERVAL_MIN + Math.random() * (MOTH_SPAWN_INTERVAL_MAX - MOTH_SPAWN_INTERVAL_MIN);
    let mothGlow = 0;

    // pomodoro + ingreso pasivo
    let pomodoroAccum = 0;
    let idleAccum = 0;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const bandY = (r) => bandTop + bandH * r; // fracción → Y dentro de la habitación

    const roomRect = () => {
      const iw = room.naturalWidth || 16, ih = room.naturalHeight || 9;
      const s = Math.min(viewW / iw, viewH / ih) * ROOM_ZOOM;
      const dw = iw * s, dh = ih * s;
      return [(viewW - dw) / 2, (viewH - dh) / 2, dw, dh];
    };

    // recalcula franja + tamaños (sliders y carga de imagen)
    const refreshLayout = () => {
      roomR = roomRect();
      bandTop = roomR[1];
      bandH = roomR[3];
      bandBottom = bandTop + bandH;
      pix = PIXEL;
      bulbR = BULB_RADIUS * sizeRef.current.bulb;             // bombilla
      ropeT = Math.max(1, ROPE_THICKNESS * sizeRef.current.bulb); // grosor de cuerda
      pullS = PULL_SIZE * sizeRef.current.bulb;               // tirador
      catS = CAT_SIZE;                                         // gato no escala
      ffScale = sizeRef.current.fly;                           // luciérnagas
      if (cat) cat.y = clamp(cat.y, bandY(CAT_FLOOR_MIN), bandY(CAT_FLOOR_MAX));
    };

    room.onload = () => {
      refreshLayout();
      createRope(statusRef.current === "broken");
    };
    room.src = "/assets/habitacion.webp";

    // ---------- variables vivas ----------
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let dragging = false;
    let pull = 0, displayPull = 0, maxStretch = 0;
    let shake = 0, flash = 0;
    let lastStatus = statusRef.current;
    let animationFrame = 0;
    let flickerTime = 0;
    let timeSec = 0;

    let rainbowTime = 0;
    let bulbStreak = 0;
    let lastBulbClick = 0;

    let stormTimer = STORM_MIN_INTERVAL + Math.random() * (STORM_MAX_INTERVAL - STORM_MIN_INTERVAL);
    let lightningTime = 0;
    let thunderDelay = 0;

    let eventTimer = EVENT_MIN_INTERVAL + Math.random() * (EVENT_MAX_INTERVAL - EVENT_MIN_INTERVAL);

    // estadísticas persistidas (para logros)
    let stats = {
      pulls: 0, meows: 0, rainbows: 0, storms: 0, events: 0, lit: 0, age: 0, moths: 0,
      ...loadJSON("ptb_stats", {}),
    };
    const saveStats = () => saveJSON("ptb_stats", stats);
    let saveAcc = 0;

    let ons = 0, softStreak = 0;
    let brokenCount = loadNum("ptb_broken", 0);

    let points = [];    // segmentos de la cuerda (verlet)
    let fireflies = []; // luciérnagas
    let shards = [];    // vidrios de la explosión
    let sparks = [];    // chispas brillantes
    let dust = [];      // motas de polvo
    let boomRing = 0, boomX = 0, boomY = 0; // anillo de estallido

    let cat = null;

    const mix = (a, b, t) => a.map((c, i) => Math.round(c + (b[i] - c) * t));
    const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
    const bulbBase = () => ({ x: viewW / 2, y: bandY(BULB_Y_RATIO) });
    const hueNow = () => (timeSec * 140) % 360; // color ciclando del arcoíris

    const ropeNaturalLength = () =>
      bandY(ROPE_END_RATIO) - (bandY(BULB_Y_RATIO) + bulbR);

    const coneHalfWidthAt = (y) => {
      const by = bandY(BULB_Y_RATIO);
      const topY = by + bulbR * 0.3;
      const t = clamp((y - topY) / (bandBottom - topY), 0, 1);
      return bulbR * 0.55 + (roomR[2] * 0.15 - bulbR * 0.55) * t;
    };

    const resetCat = () => {
      const y = bandY(0.86);
      cat = {
        x: viewW / 2 + viewW * 0.04,
        y,
        targetX: viewW / 2,
        targetY: y,
        dir: -1,
        state: "idle",
        timer: 0,
        walkPhase: 0, // ¡OJO: dos puntos, no signo igual!
        blinkTimer: 2 + Math.random() * 3,
        hop: 0,
        gone: false,
      };
    };

    // ============================================================
    // SONIDO — WebAudio (respaldo) + archivos mp3 con volumen global
    // ============================================================
    let audioCtx = null;
    let sfxBus = null; // ganancia MAESTRA de los efectos procedurales

    const ensureAudio = () => {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        sfxBus = audioCtx.createGain();
        sfxBus.connect(audioCtx.destination);
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
    };

    const makeNoise = (dur) => {
      const buffer = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * dur), audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      return src;
    };

    // Reproductor de SFX con archivo mp3 + fallback procedural
    const sfxCache = {};
    const playSfx = (name, vol, fallback) => {
      if (!sfxRef.current) return; // efectos apagados en el menú
      if (!sfxCache[name]) {
        const a = new Audio(`/audio/sfx/${name}.mp3`);
        a.preload = "auto";
        sfxCache[name] = a;
      }
      const c = sfxCache[name].cloneNode();
      c.volume = vol * volRef.current.sfx;
      const p = c.play();
      if (p) p.catch(() => { if (fallback) fallback(); });
    };

    // MÚSICA DE FIESTA: arranca al entrar y se detiene al salir del modo
    const startPartyMusic = () => {
      if (!partyAudio) {
        partyAudio = new Audio(PARTY_MUSIC_FILE);
        partyAudio.loop = true;
      }
      partyAudio.volume = volRef.current.music;
      try { partyAudio.currentTime = 0; } catch {}
      partyAudio.play().catch(() => {}); // si no existe el mp3, simplemente no suena
    };
    const stopPartyMusic = () => {
      if (partyAudio) partyAudio.pause();
    };

    // sonido al atrapar la polilla (subida brillante)
    const procMothCatch = () => {
      if (!audioCtx) return;
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(880, t);
      o.frequency.exponentialRampToValueAtTime(1760, t + 0.1);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(sfxBus);
      o.start(t);
      o.stop(t + 0.35);
    };

    // campanita del pomodoro (3 notas suaves)
    const procPomodoro = () => {
      if (!audioCtx) return;
      const t = audioCtx.currentTime;
      for (let i = 0; i < 3; i++) {
        const o = audioCtx.createOscillator();
        o.type = "sine";
        o.frequency.value = 660 + i * 110;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.0001, t + i * 0.15);
        g.gain.exponentialRampToValueAtTime(0.08, t + i * 0.15 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.15 + 0.4);
        o.connect(g).connect(sfxBus);
        o.start(t + i * 0.15);
        o.stop(t + i * 0.15 + 0.45);
      }
    };

    const procTink = (vol) => {
      if (!audioCtx) return;
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      o.type = "triangle";
      const f = GLASS_TINK_MIN + Math.random() * (GLASS_TINK_MAX - GLASS_TINK_MIN);
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.05);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      o.connect(g).connect(sfxBus);
      o.start(t);
      o.stop(t + 0.09);
    };

    const procMeow = () => {
      if (!audioCtx) return;
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(400, t);
      o.frequency.exponentialRampToValueAtTime(900, t + 0.12);
      o.frequency.exponentialRampToValueAtTime(500, t + 0.3);
      const f = audioCtx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 1200;
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(f).connect(g).connect(sfxBus);
      o.start(t);
      o.stop(t + 0.4);
    };

    const procFlicker = () => {
      if (!audioCtx) return;
      let t = audioCtx.currentTime;
      const attempts = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < attempts; i++) {
        const click = makeNoise(0.02);
        const cf = audioCtx.createBiquadFilter();
        cf.type = "highpass";
        cf.frequency.value = 2000;
        const cg = audioCtx.createGain();
        cg.gain.setValueAtTime(0.08, t);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
        click.connect(cf).connect(cg).connect(sfxBus);
        click.start(t);

        const dur = 0.06 + Math.random() * 0.12;
        const o = audioCtx.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(100 + Math.random() * 20, t + 0.01);
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.0001, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.05 + Math.random() * 0.03, t + 0.025);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.01 + dur);
        o.connect(g).connect(sfxBus);
        o.start(t);
        o.stop(t + 0.03 + dur);

        t += 0.08 + Math.random() * 0.14;
      }
    };

    const procThunder = () => {
      if (!audioCtx) return;
      const t = audioCtx.currentTime;
      const dur = 2.5 + Math.random() * 1.5;

      const noise = makeNoise(dur);
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + dur);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(STORM_VOLUME, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      noise.connect(filter).connect(g).connect(sfxBus);
      noise.start(t);

      const o = audioCtx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(50, t);
      o.frequency.exponentialRampToValueAtTime(30, t + dur);
      const og = audioCtx.createGain();
      og.gain.setValueAtTime(0.0001, t);
      og.gain.exponentialRampToValueAtTime(STORM_VOLUME * 0.6, t + 0.1);
      og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(og).connect(sfxBus);
      o.start(t);
      o.stop(t + dur);
    };

    const procClick = (on) => {
      if (!audioCtx) return;
      const t = audioCtx.currentTime;

      const tick = makeNoise(0.035);
      const bp = audioCtx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2600;
      bp.Q.value = 1.5;
      const tg = audioCtx.createGain();
      tg.gain.setValueAtTime(0.2, t);
      tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      tick.connect(bp).connect(tg).connect(sfxBus);
      tick.start(t);

      const tock = audioCtx.createOscillator();
      tock.type = "triangle";
      tock.frequency.setValueAtTime(on ? 480 : 360, t + 0.015);
      tock.frequency.exponentialRampToValueAtTime(on ? 240 : 180, t + 0.1);
      const og = audioCtx.createGain();
      og.gain.setValueAtTime(0.0001, t + 0.015);
      og.gain.exponentialRampToValueAtTime(0.15, t + 0.03);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      tock.connect(og).connect(sfxBus);
      tock.start(t);
      tock.stop(t + 0.16);

      if (on) {
        const hum = audioCtx.createOscillator();
        hum.type = "sine";
        hum.frequency.value = 96;
        const hg = audioCtx.createGain();
        hg.gain.setValueAtTime(0.0001, t);
        hg.gain.exponentialRampToValueAtTime(0.04, t + 0.2);
        hg.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        hum.connect(hg).connect(sfxBus);
        hum.start(t);
        hum.stop(t + 1.2);
      }
    };

    const procBreak = () => {
      if (!audioCtx) return;
      const t = audioCtx.currentTime;

      const noise = makeNoise(0.4);
      const filter = audioCtx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 1800;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      noise.connect(filter).connect(gain).connect(sfxBus);
      noise.start(t);

      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.22);
      const g2 = audioCtx.createGain();
      g2.gain.setValueAtTime(0.25, t);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(g2).connect(sfxBus);
      osc.start(t);
      osc.stop(t + 0.3);
    };

    // wrappers: archivo primero, procedural si falta
    const playClickSfx = (on) => playSfx("click", 0.9, () => procClick(on));
    const playBreakSfx = () => playSfx("break", 1, procBreak);
    const playThunderSfx = () => playSfx("thunder", 0.9, procThunder);
    const playBuzzSfx = () => playSfx("buzz", 0.8, procFlicker);
    const playMothCatchSfx = () => playSfx("moth", 0.8, procMothCatch);
    const playPomodoroSfx = () => playSfx("pomodoro", 0.7, procPomodoro);

    // cristalitos al jalar fuerte (zona de advertencia)
    const updateGlassSound = () => {
      if (!dragging) return;
      if (statusRef.current === "broken") return;
      if (pull < WARN_PULL) return;

      const t = clamp((pull - WARN_PULL) / (BREAK_PULL - WARN_PULL), 0, 1);
      if (Math.random() < 0.12 + t * 0.4) {
        const vol = 0.02 + t * 0.05;
        playSfx("glass", Math.min(1, vol * 8), () => procTink(vol));
      }
    };

    // ============================================================
    // TORMENTA
    // ============================================================
    const lightningAlpha = () => {
      if (lightningTime <= 0) return 0;
      const t = STORM_FLASH_DURATION - lightningTime;
      const flash1 = Math.exp(-t * 8) * (0.7 + 0.3 * Math.sin(t * 60));
      const t2 = Math.max(0, t - 0.22);
      const flash2 = Math.exp(-t2 * 6) * 0.6 * (0.7 + 0.3 * Math.sin(t2 * 50));
      return clamp(Math.max(flash1, flash2), 0, 1) * STORM_INTENSITY;
    };

    const startleFireflies = () => {
      for (const f of fireflies) {
        f.vx += (Math.random() - 0.5) * 3;
        f.vy += (Math.random() - 0.5) * 3;
      }
    };

    const updateStorm = (dt) => {
      if (!stormRef.current) return; // tormenta apagada en el menú

      stormTimer -= dt;
      if (stormTimer <= 0 && lightningTime <= 0) {
        lightningTime = STORM_FLASH_DURATION;
        thunderDelay = STORM_THUNDER_MIN + Math.random() * (STORM_THUNDER_MAX - STORM_THUNDER_MIN);
        stormTimer = STORM_MIN_INTERVAL + Math.random() * (STORM_MAX_INTERVAL - STORM_MIN_INTERVAL);
        startleFireflies();

        if (statusRef.current === "on") {
          stats.storms++;
          saveStats();
          if (stats.storms >= 3) unlock("tormentas", "CAZATORMENTAS");
          if (stats.storms >= 10) unlock("tormentas10", "PARARRAYOS");
        }
      }

      if (lightningTime > 0) lightningTime -= dt;

      if (thunderDelay > 0) {
        thunderDelay -= dt;
        if (thunderDelay <= 0) playThunderSfx();
      }
    };

    const drawStorm = () => {
      if (!stormRef.current) return;
      const la = lightningAlpha();
      if (la <= 0.01 || !room.complete) return;

      ctx.save();
      ctx.globalAlpha = la * 0.5;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(room, ...roomR);
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 1;

      ctx.fillStyle = `rgba(160,190,255,${la * 0.22})`;
      ctx.fillRect(0, 0, viewW, viewH);

      const lg = ctx.createLinearGradient(0, 0, viewW, 0);
      lg.addColorStop(0, `rgba(200,220,255,${la * 0.25})`);
      lg.addColorStop(0.5, `rgba(200,220,255,${la * 0.08})`);
      lg.addColorStop(1, "rgba(200,220,255,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.restore();
    };

    // ============================================================
    // EVENTOS ALEATORIOS (más frecuentes si la bombilla es vieja)
    // ============================================================
    const updateRandomEvent = (st, dt) => {
      if (st !== "on" || flickerTime > 0) return;
      eventTimer -= dt * (1 + (stats.age / 100) * 1.5);
      if (eventTimer <= 0) {
        flickerTime = EVENT_FLICKER_TIME;
        playBuzzSfx();
        startleFireflies();
        stats.events++;
        saveStats();
        if (stats.events >= 5) unlock("eventos5", "INSOMNE");
        eventTimer = EVENT_MIN_INTERVAL + Math.random() * (EVENT_MAX_INTERVAL - EVENT_MIN_INTERVAL);
      }
    };

    // ============================================================
    // CUERDA — cadena de puntos con física verlet
    // ============================================================
    const createRope = (broken = false) => {
      const { x } = bulbBase();
      const startY = broken
        ? bandY(BULB_Y_RATIO) - bulbR   // rota: cuelga del casquillo
        : bandY(BULB_Y_RATIO) + bulbR;  // sana: del borde inferior
      const endY = broken ? startY + ropeNaturalLength() : bandY(ROPE_END_RATIO);
      const len = (endY - startY) / (ROPE_SEGMENTS - 1);
      points = [];
      for (let i = 0; i < ROPE_SEGMENTS; i++) {
        const y = startY + i * len;
        points.push({ x, y, oldX: x, oldY: y });
      }
    };

    // ============================================================
    // LUCIÉRNAGAS
    // ============================================================
    const createFireflies = () => {
      fireflies = [];
      for (let i = 0; i < FIREFLY_COUNT; i++) {
        const wall = i < FIREFLY_COUNT * FIREFLY_WALL_RATIO;
        const left = Math.random() < 0.5;
        fireflies.push({
          x: Math.random() * viewW,
          y: Math.random() * viewH,
          vx: 0, vy: 0,
          wander: Math.random() * Math.PI * 2,
          phase: Math.random() * Math.PI * 2,
          blink: 0.03 + Math.random() * 0.05,
          size: FIREFLY_SIZE_MIN + Math.random() * (FIREFLY_SIZE_MAX - FIREFLY_SIZE_MIN),
          wall,
          wallX: left
            ? 15 + Math.random() * viewW * 0.16
            : viewW * 0.84 + Math.random() * (viewW * 0.16 - 15),
          wallY: viewH * (0.15 + Math.random() * 0.7),
        });
      }
    };

    const scatterFireflies = () => {
      for (const f of fireflies) {
        const ddx = f.x - viewW / 2;
        const ddy = f.y - bandY(BULB_Y_RATIO);
        const d = Math.hypot(ddx, ddy) || 1;
        const s = FIREFLY_SCATTER + Math.random() * FIREFLY_SCATTER;
        f.vx = (ddx / d) * s;
        f.vy = (ddy / d) * s;
      }
    };

    const disperseFireflies = () => {
      for (const f of fireflies) {
        const ddx = f.x - viewW / 2;
        const ddy = f.y - bandY(BULB_Y_RATIO);
        const d = Math.hypot(ddx, ddy) || 1;
        const s = FIREFLY_DISPERSE + Math.random() * FIREFLY_DISPERSE;
        f.vx = (ddx / d) * s;
        f.vy = (ddy / d) * s;
      }
    };

    // ============================================================
    // POLVO
    // ============================================================
    const floorY = () => bandY(0.92);

    const spawnDust = (bx, by) => {
      const top = by + bulbR * 0.5;
      const y = top + Math.random() * (floorY() - top);
      const progress = (y - by) / (bandBottom - by) || 0;
      const halfW = bulbR * 0.55 + (roomR[2] * 0.15 - bulbR * 0.55) * progress;
      dust.push({
        x: bx + (Math.random() * 2 - 1) * halfW * 0.9,
        y,
        vy: DUST_FALL_MIN + Math.random() * (DUST_FALL_MAX - DUST_FALL_MIN),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.03,
        alpha: 0,
        size: DUST_SIZE_MIN + Math.random() * (DUST_SIZE_MAX - DUST_SIZE_MIN),
      });
    };

    const spawnInitialDust = (bx, by) => {
      for (let i = 0; i < DUST_INITIAL_COUNT; i++) {
        const top = by + bulbR * 0.5;
        const y = top + Math.random() * (floorY() - top);
        const progress = (y - by) / (bandBottom - by) || 0;
        const halfW = bulbR * 0.55 + (roomR[2] * 0.15 - bulbR * 0.55) * progress;
        dust.push({
          x: bx + (Math.random() * 2 - 1) * halfW * 0.9,
          y,
          vy: DUST_FALL_MIN + Math.random() * (DUST_FALL_MAX - DUST_FALL_MIN),
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.01 + Math.random() * 0.03,
          alpha: DUST_ALPHA_MAX * (0.3 + Math.random() * 0.7),
          size: DUST_SIZE_MIN + Math.random() * (DUST_SIZE_MAX - DUST_SIZE_MIN),
        });
      }
    };

    const drawDust = (on, bx, by) => {
      if (!on) {
        dust = [];
        return;
      }

      if (dust.length < DUST_COUNT && Math.random() < 0.8) {
        spawnDust(bx, by);
      }

      ctx.save();
      ctx.fillStyle = "rgb(255,240,200)";
      dust = dust.filter((d) => {
        d.y += d.vy;
        d.wobble += d.wobbleSpeed;
        d.x += Math.sin(d.wobble) * 0.3;

        if (d.alpha < DUST_ALPHA_MAX) {
          d.alpha = Math.min(d.alpha + 0.03, DUST_ALPHA_MAX);
        }

        const gone = d.y > floorY();
        if (!gone) {
          const nearFloor = clamp((floorY() - d.y) / 80, 0, 1);
          ctx.globalAlpha = d.alpha * nearFloor;
          ctx.fillRect(Math.round(d.x), Math.round(d.y), d.size, d.size);
        }
        return !gone;
      });
      ctx.restore();
    };

    // ============================================================
    // POLILLA DORADA — aparece rara vez, da $10 al atraparla
    // ============================================================
    const spawnMoth = () => {
      moth = {
        x: Math.random() * viewW,
        y: viewH * 0.3 + Math.random() * viewH * 0.4,
        vx: (Math.random() - 0.5) * MOTH_SPEED * 2,
        vy: (Math.random() - 0.5) * MOTH_SPEED * 2,
        wingPhase: Math.random() * Math.PI * 2,
        life: 20, // segundos de vida si no la atrapas
      };
    };

    const updateMoth = (dt) => {
      if (!moth) {
        mothTimer -= dt;
        if (mothTimer <= 0) {
          spawnMoth();
          mothTimer = MOTH_SPAWN_INTERVAL_MIN + Math.random() * (MOTH_SPAWN_INTERVAL_MAX - MOTH_SPAWN_INTERVAL_MIN);
        }
        return;
      }

      moth.wingPhase += dt * 20; // aleteo
      moth.life -= dt;

      // vuelo errático con tope de velocidad
      moth.vx += (Math.random() - 0.5) * 0.3;
      moth.vy += (Math.random() - 0.5) * 0.3;
      const speed = Math.hypot(moth.vx, moth.vy);
      if (speed > MOTH_SPEED) {
        moth.vx = (moth.vx / speed) * MOTH_SPEED;
        moth.vy = (moth.vy / speed) * MOTH_SPEED;
      }

      moth.x += moth.vx;
      moth.y += moth.vy;

      // rebotes en los bordes
      if (moth.x < 20 || moth.x > viewW - 20) moth.vx *= -1;
      if (moth.y < 20 || moth.y > viewH - 20) moth.vy *= -1;

      moth.x = clamp(moth.x, 20, viewW - 20);
      moth.y = clamp(moth.y, 20, viewH - 20);

      if (moth.life <= 0) {
        moth = null; // se fue sin que la atraparas
      }
    };

    const drawMoth = () => {
      if (!moth) return;
      mothGlow = (Math.sin(timeSec * 3) + 1) * 0.5; // brillo pulsante

      ctx.save();
      ctx.translate(moth.x, moth.y);

      // aura dorada aditiva
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.3 + mothGlow * 0.2;
      const aura = ctx.createRadialGradient(0, 0, 1, 0, 0, MOTH_SIZE * 2.5);
      aura.addColorStop(0, "rgba(255,215,0,0.8)");
      aura.addColorStop(1, "rgba(255,215,0,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, MOTH_SIZE * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // alas que aletean
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.9;
      const wingAngle = Math.sin(moth.wingPhase) * 0.8;
      ctx.fillStyle = "#ffd700";

      ctx.save();
      ctx.rotate(wingAngle);
      ctx.beginPath();
      ctx.ellipse(-MOTH_SIZE * 0.6, 0, MOTH_SIZE * 0.8, MOTH_SIZE * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.rotate(-wingAngle);
      ctx.beginPath();
      ctx.ellipse(MOTH_SIZE * 0.6, 0, MOTH_SIZE * 0.8, MOTH_SIZE * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // cuerpo
      ctx.fillStyle = "#daa520";
      ctx.beginPath();
      ctx.ellipse(0, 0, MOTH_SIZE * 0.3, MOTH_SIZE * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // click sobre la polilla = +$10 y logro
    const catchMoth = () => {
      if (!moth) return false;
      const d = Math.hypot(mouseX - moth.x, mouseY - moth.y);
      if (d < MOTH_SIZE * 2.5) {
        stats.moths++;
        saveStats();
        unlock("moth", "CAZADOR DE POLILLAS");
        addMoney(MOTH_REWARD);
        showToast(`POLILLA ATRAPADA +$${MOTH_REWARD}`);
        playMothCatchSfx();
        moth = null;
        return true;
      }
      return false;
    };

    // ============================================================
    // GATO (incluye baile en modo fiesta)
    // ============================================================
    const updateCat = (st, dt) => {
      if (!cat || cat.gone) return;

      cat.blinkTimer -= dt;
      if (cat.blinkTimer < -0.15) cat.blinkTimer = 2 + Math.random() * 4;

      if (cat.hop > 0) cat.hop = Math.max(0, cat.hop - dt * 2.5);

      // MODO FIESTA: el gato baila al ritmo
      if (st === "on" && rainbowTime > 0) {
        cat.state = "dance";
        cat.walkPhase += dt * 14; // patitas rápidas
        cat.dir = Math.sin(timeSec * PARTY_PULSE_SPEED) >= 0 ? 1 : -1; // cambia de lado al beat
        return;
      }
      // se acabó la fiesta: vuelve a su rutina
      if (cat.state === "dance") {
        cat.state = st === "on" ? "sit" : "idle";
        cat.timer = 1;
      }

      if (cat.state === "flee") {
        cat.x += cat.dir * viewW * CAT_FLEE_SPEED * dt;
        cat.walkPhase += dt * 25;
        if (cat.x < -150 || cat.x > viewW + 150) cat.gone = true;
        return;
      }

      if (st === "on") {
        if (cat.state === "idle") {
          cat.state = "sit";
          cat.timer = 0.5 + Math.random();
        }
        if (cat.state === "sit") {
          cat.timer -= dt;
          if (cat.timer <= 0) {
            cat.state = "walk";
            const ty = bandY(CAT_FLOOR_MIN + Math.random() * (CAT_FLOOR_MAX - CAT_FLOOR_MIN));
            const hw = Math.max(20, coneHalfWidthAt(ty) * CAT_MARGIN - catS);
            cat.targetY = ty;
            cat.targetX = viewW / 2 + (Math.random() * 2 - 1) * hw;
          }
        } else if (cat.state === "walk") {
          const speed = viewW * CAT_WALK_SPEED * dt;
          const dx = cat.targetX - cat.x;
          const dy = cat.targetY - cat.y;

          if (Math.abs(dx) < speed && Math.abs(dy) < 2) {
            cat.x = cat.targetX;
            cat.y = cat.targetY;
            cat.state = "sit";
            cat.timer = 1.5 + Math.random() * 3;
          } else {
            cat.dir = dx > 0 ? 1 : -1;
            cat.x += Math.sign(dx) * speed;
            cat.y += clamp(dy, -1, 1) * speed * 0.5; // sube/baja SUAVE, sin saltos
            cat.walkPhase += dt * 10;
          }

          const hw = Math.max(20, coneHalfWidthAt(cat.y) * CAT_MARGIN - catS);
          cat.x = clamp(cat.x, -catS * 2, viewW + catS * 2);
          cat.y = clamp(cat.y, bandY(CAT_FLOOR_MIN), bandY(CAT_FLOOR_MAX));
        }
      } else if (st === "off") {
        if (cat.state === "walk" || cat.state === "sit") cat.state = "idle";
      }
    };

    const drawCat = () => {
      if (!cat || cat.gone) return;
      const st = statusRef.current;
      const showBody = st === "on" && cat.state !== "idle";

      // profundidad: más chico lejos (arriba), más grande cerca (abajo)
      const depthT = clamp(
        (cat.y - bandY(CAT_FLOOR_MIN)) / (bandY(CAT_FLOOR_MAX) - bandY(CAT_FLOOR_MIN)),
        0, 1
      );
      const depthScale = 0.75 + 0.45 * depthT;
      const u = (catS / 10) * depthScale;

      // baile: saltos al beat, balanceo y giro ligero
      const dancing = cat.state === "dance";
      const beat = timeSec * PARTY_DANCE_SPEED;
      const danceHop = dancing ? -Math.abs(Math.sin(beat)) * u * 2.0 : 0;
      const sway = dancing ? Math.sin(beat * 0.5) * u * 1.4 : 0;
      const rot = dancing ? Math.sin(beat) * 0.10 : 0;
      const hopOff = -Math.sin(Math.min(cat.hop, 1) * Math.PI) * catS * 0.25 + danceHop;

      ctx.save();
      ctx.translate(Math.round(cat.x + sway), Math.round(cat.y + hopOff));
      if (rot) ctx.rotate(rot);
      ctx.scale(cat.dir, 1);

      const walking = cat.state === "walk" || cat.state === "flee";
      const swing = (walking || dancing) ? Math.sin(cat.walkPhase) : 0;
      const bob = walking ? Math.abs(Math.cos(cat.walkPhase)) * u * 0.3 : 0;
      const tailWag = Math.sin(timeSec * (dancing ? 10 : 2.5)) * 0.5 + 0.5;

      const body = "#1c1610";

      if (showBody) {
        // cola que se mece
        ctx.strokeStyle = body;
        ctx.lineWidth = u * 0.8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-u * 2.6, -u * 1.6 - bob);
        ctx.quadraticCurveTo(
          -u * 4, -u * 2 - bob,
          -u * (4 + tailWag), -u * (3.2 + tailWag) - bob
        );
        ctx.stroke();

        // patitas con ciclo de caminar
        ctx.fillStyle = body;
        ctx.fillRect(-u * 2.4 + swing * u * 0.6, -u * 1.2, u * 0.9, u * 1.4);
        ctx.fillRect(-u * 1.2 - swing * u * 0.6, -u * 1.2, u * 0.9, u * 1.4);
        ctx.fillRect(u * 1.0 - swing * u * 0.6, -u * 1.2, u * 0.9, u * 1.4);
        ctx.fillRect(u * 2.0 + swing * u * 0.6, -u * 1.2, u * 0.9, u * 1.4);

        // cuerpo + cabeza + orejas
        ctx.fillRect(-u * 2.8, -u * 2.6 - bob, u * 5.6, u * 1.8);
        ctx.fillRect(u * 1.6, -u * 4.2 - bob, u * 2.6, u * 2.2);
        ctx.fillRect(u * 1.7, -u * 5.0 - bob, u * 0.8, u * 0.9);
        ctx.fillRect(u * 3.2, -u * 5.0 - bob, u * 0.8, u * 0.9);

        // brillo cálido del lomo (luz de la bombilla)
        ctx.fillStyle = "rgba(255,190,110,0.22)";
        ctx.fillRect(-u * 2.8, -u * 2.6 - bob, u * 5.6, u * 0.4);
        ctx.fillRect(u * 1.6, -u * 4.2 - bob, u * 2.6, u * 0.4);

        // ojos brillantes
        ctx.fillStyle = "#ffd54a";
        ctx.shadowColor = "rgba(255,213,74,0.8)";
        ctx.shadowBlur = 6;
        ctx.fillRect(u * 2.1, -u * 3.4 - bob, u * 0.6, u * 0.6);
        ctx.fillRect(u * 3.3, -u * 3.4 - bob, u * 0.6, u * 0.6);
        ctx.shadowBlur = 0;
      } else {
        // apagado: solo los ojos (con parpadeo)
        if (cat.blinkTimer > 0) {
          ctx.fillStyle = "#ffd54a";
          ctx.shadowColor = "rgba(255,213,74,0.9)";
          ctx.shadowBlur = CAT_EYE_GLOW;
          ctx.fillRect(u * 2.1, -u * 3.4, u * 0.6, u * 0.6);
          ctx.fillRect(u * 3.3, -u * 3.4, u * 0.6, u * 0.6);
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore();
    };

    // ============================================================
    // ¡PLA! — romper la bombilla
    // ============================================================
    const breakBulb = () => {
      dragging = false;
      pull = 0;
      maxStretch = 0;
      flash = 1;
      flickerTime = 0;
      dust = [];
      softStreak = 0;

      if (navigator.vibrate) navigator.vibrate(VIBRATE_BREAK);

      brokenCount++;
      saveNum("ptb_broken", brokenCount);
      setBrokenTotal(brokenCount);
      if (brokenCount === 1) unlock("carechimba", "CARECHIMBA");
      if (brokenCount >= 5) unlock("serie", "ROTO EN SERIE");
      if (brokenCount >= 10) unlock("serial10", "ROTO EN SERIE X10");
      if (brokenCount >= 25) unlock("serial25", "CARECHIMBA PRO");
      if (cat && !cat.gone) unlock("gato", "ASUSTAGATOS");

      if (cat && !cat.gone) {
        cat.state = "flee";
        cat.dir = cat.x < viewW / 2 ? -1 : 1;
      }

      const { x, y } = bulbBase();
      boomX = x;
      boomY = y;
      boomRing = 1;

      const k = bulbR / 60; // factor de escala de la explosión

      shards = [];
      for (let i = 0; i < BOOM_SHARDS; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (1.5 + Math.random() * 4) * k;
        shards.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 2 * k,
          life: 1,
          size: (3 + Math.random() * 6) * k,
        });
      }

      sparks = [];
      for (let i = 0; i < BOOM_SPARKS; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (2 + Math.random() * 6) * k;
        sparks.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 1 * k,
          life: 1,
          size: (2 + Math.random() * 4) * k,
        });
      }

      createRope(true);
      playBreakSfx();
      setStatus("broken");
    };

    const drawSparks = () => {
      if (!sparks.length) return;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      sparks = sparks.filter((s) => s.life > 0);
      for (const s of sparks) {
        s.vy += 0.08;
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.03;
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = "rgb(255,220,120)";
        ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
      }
      ctx.restore();
    };

    const drawBoomRing = () => {
      if (boomRing <= 0) return;
      boomRing -= 0.04;
      const p = 1 - boomRing;
      const r = bulbR * (0.6 + p * BOOM_RING_GROW);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.max(0, boomRing) * 0.8;
      ctx.strokeStyle = "rgb(255,240,180)";
      ctx.lineWidth = Math.max(1, 5 * (bulbR / 60) * boomRing);
      ctx.beginPath();
      ctx.arc(boomX, boomY, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    // ============================================================
    // TAMAÑO (buffer fijo; el CSS escala)
    // ============================================================
    const resize = () => {
      viewW = DESIGN_W;
      viewH = DESIGN_H;
      refreshLayout();
      canvas.width = Math.ceil(viewW / pix);
      canvas.height = Math.ceil(viewH / pix);
      lightCanvas.width = canvas.width;
      lightCanvas.height = canvas.height;
      createRope(statusRef.current === "broken");
      if (!fireflies.length) createFireflies();
      if (!cat) resetCat();
    };

    // ============================================================
    // MOUSE — mapea pantalla → coordenadas de diseño (compensa el zoom de cámara)
    // ============================================================
    const updateMouse = (e) => {
      const r = canvas.getBoundingClientRect();
      let x = (e.clientX - r.left) * (viewW / r.width);
      let y = (e.clientY - r.top) * (viewH / r.height);
      if (camPulse > 0.001) {
        const k = 1 + camPulse;
        x = (x - viewW / 2) / k + viewW / 2;
        y = (y - viewH / 2) / k + viewH / 2;
      }
      mouseX = x;
      mouseY = y;
    };

    const onPointerDown = (e) => {
      ensureAudio();
      updateMouse(e);

      // 1) intentar atrapar la polilla (prioridad máxima)
      if (catchMoth()) return;

      const end = points[points.length - 1];
      const nearRope = !!end && Math.hypot(mouseX - end.x, mouseY - end.y) < pullS * 3;

      // 2) acariciar al gato SOLO si no estás intentando agarrar la cuerda
      if (!nearRope && cat && !cat.gone) {
        const cy = cat.y - catS * 0.3;
        if (Math.hypot(mouseX - cat.x, mouseY - cy) < catS * 1.2) {
          playSfx("meow", 0.9, procMeow);
          cat.hop = 1;
          stats.meows++;
          saveStats();
          unlock("mijito", "MIJITO");
          if (stats.meows >= 10) unlock("gatofeliz", "AMIGO FELINO");
          return;
        }
      }

      // 3) clicks seguidos en la BOMBILLA = modo fiesta
      const dBulb = Math.hypot(mouseX - viewW / 2, mouseY - bandY(BULB_Y_RATIO));
      if (dBulb < bulbR * 1.1 && statusRef.current !== "broken") {
        const now = performance.now();
        bulbStreak = now - lastBulbClick < 800 ? bulbStreak + 1 : 1;
        lastBulbClick = now;
        playSfx("glass", 0.3, () => procTink(0.05));
        if (bulbStreak >= RAINBOW_CLICKS) {
          bulbStreak = 0;
          rainbowTime = RAINBOW_TIME;
          stats.rainbows++;
          saveStats();
          unlock("arcoiris", "MODO FIESTA");
          if (stats.rainbows >= 3) unlock("fiesta3", "ARCOÍRIS ADICTO");
        }
      }

      // 4) agarrar la cuerda
      if (nearRope) {
        dragging = true;
        maxStretch = 0;
        canvas.style.cursor = "grabbing";
        try { canvas.setPointerCapture(e.pointerId); } catch {}
      }
    };

    const onPointerMove = (e) => {
      updateMouse(e);
      const end = points[points.length - 1];
      if (!end) return;

      if (!dragging) {
        canvas.style.cursor =
          Math.hypot(mouseX - end.x, mouseY - end.y) < pullS * 3 ? "grab" : "default";
        return;
      }

      const restX = viewW / 2;
      const restY = bandY(ROPE_END_RATIO);

      let dx = mouseX - restX;
      let dy = mouseY - restY;
      const dist = Math.hypot(dx, dy);

      if (dist > ROPE_REACH) {
        dx = (dx / dist) * ROPE_REACH;
        dy = (dy / dist) * ROPE_REACH;
      }

      const minDY = bandY(BULB_Y_RATIO) + bulbR + 10 - restY;
      if (dy < minDY) dy = minDY;

      targetX = restX + dx;
      targetY = restY + dy;

      if (statusRef.current === "broken") {
        pull = 0;
        return;
      }

      const anchorX = viewW / 2;
      const anchorY = bandY(BULB_Y_RATIO) + bulbR;
      const stretched =
        Math.hypot(targetX - anchorX, targetY - anchorY) - ropeNaturalLength();

      pull = Math.max(0, stretched);
      if (pull >= BREAK_PULL) { breakBulb(); return; }
      maxStretch = Math.max(maxStretch, pull);
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      canvas.style.cursor = "default";

      // amortiguación al soltar (evita que la cuerda rebote rara)
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        p.oldX = p.x - (p.x - p.oldX) * ROPE_DAMPING;
        p.oldY = p.y - (p.y - p.oldY) * ROPE_DAMPING;
      }

      if (maxStretch >= PULL_THRESHOLD && statusRef.current !== "broken") {
        const next = statusRef.current !== "on";
        playClickSfx(next);
        if (navigator.vibrate) navigator.vibrate(VIBRATE_CLICK);

        if (next) {
          ons++;
          softStreak++;
          if (ons === 1) unlock("luz", "PRIMERA LUZ");
          if (softStreak >= 20) unlock("control", "AUTOCONTROL");
          if (softStreak >= 50) unlock("cuidadoso", "CUIDADOSO");
          flickerTime = 0.6;
        } else {
          if (cat && !cat.gone && cat.state === "walk") unlock("egoista", "CORAZÓN DE PIEDRA");
        }

        stats.pulls++;
        saveStats();
        if (stats.pulls >= 1) unlock("manos", "MANOS A LA OBRA");
        if (stats.pulls >= 50) unlock("adicto", "ADICTO AL TIRÓN");
        if (stats.pulls >= 200) unlock("maraton", "MARATONISTA");

        setStatus(next ? "on" : "off");
      }
      pull = 0;
      maxStretch = 0;
    };

    // ============================================================
    // FÍSICA DE LA CUERDA (verlet + restricciones)
    // ============================================================
    const updatePhysics = (bx, by) => {
      if (!points.length) return;
      const gravity = ROPE_GRAVITY, friction = 0.96;
      const broken = statusRef.current === "broken";
      const pinY = broken ? by - bulbR : by + bulbR;

      for (let i = 1; i < points.length; i++) {
        const p = points[i];

        if (dragging && i === points.length - 1) {
          p.x = targetX;
          p.y = targetY;
          continue;
        }

        const vx = (p.x - p.oldX) * friction;
        const vy = (p.y - p.oldY) * friction;
        p.oldX = p.x;
        p.oldY = p.y;
        p.x += vx;
        p.y += vy + gravity;
      }

      const startY = broken ? by - bulbR : by + bulbR;
      const endY = broken ? startY + ropeNaturalLength() : bandY(ROPE_END_RATIO);
      const segLen = (endY - startY) / (ROPE_SEGMENTS - 1);

      for (let it = 0; it < 3; it++) {
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i], b = points[i + 1];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1;
          const diff = (d - segLen) / d;
          if (i !== 0) { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; }
          if (!(dragging && i === points.length - 2)) {
            b.x -= dx * diff * 0.5;
            b.y -= dy * diff * 0.5;
          }
        }
        points[0].x = bx;
        points[0].y = pinY;
      }
    };

    // ============================================================
    // HABITACIÓN
    // ============================================================
    const drawRoomDark = () => {
      if (!room.complete) return;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(room, ...roomR);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = `rgba(0,0,0,${DARKNESS})`;
      ctx.fillRect(0, 0, viewW, viewH);
    };

    const drawVignette = () => {
      const g = ctx.createRadialGradient(
        viewW / 2, viewH * 0.45, viewH * 0.25,
        viewW / 2, viewH * 0.5, viewH * 0.9
      );
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, `rgba(0,0,0,${VIGNETTE})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, viewW, viewH);
    };

    const conePath = (c, bx, by, scale = 1) => {
      const topW = bulbR * 0.55 * scale;
      const bottomW = roomR[2] * 0.15 * scale;
      c.beginPath();
      c.moveTo(bx - topW, by + bulbR * 0.3);
      c.lineTo(bx + topW, by + bulbR * 0.3);
      c.lineTo(bx + bottomW, bandBottom);
      c.lineTo(bx - bottomW, bandBottom);
      c.closePath();
    };

    const drawLitCone = (bx, by) => {
      if (!room.complete) return;
      lctx.setTransform(1 / pix, 0, 0, 1 / pix, 0, 0);
      lctx.clearRect(0, 0, viewW, viewH);

      lctx.globalCompositeOperation = "source-over";
      lctx.imageSmoothingEnabled = true;
      lctx.drawImage(room, ...roomR);
      lctx.globalCompositeOperation = "source-atop";
      lctx.fillStyle = rainbowTime > 0
        ? `hsla(${hueNow()}, 90%, 60%, 0.25)`
        : "rgba(255,190,90,0.18)";
      lctx.fillRect(0, 0, viewW, viewH);

      lctx.globalCompositeOperation = "destination-in";
      const g = lctx.createLinearGradient(0, by, 0, bandBottom);
      g.addColorStop(0, "rgba(0,0,0,0.95)");
      g.addColorStop(0.7, "rgba(0,0,0,0.7)");
      g.addColorStop(1, "rgba(0,0,0,0.4)");
      lctx.fillStyle = g;
      lctx.shadowColor = "rgba(0,0,0,0.8)";
      lctx.shadowBlur = CONE_EDGE_SOFTNESS;
      conePath(lctx, bx, by, 1.02);
      lctx.fill();
      lctx.shadowBlur = 0;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(lightCanvas, 0, 0);
      ctx.restore();
    };

    const drawConeAura = (bx, by) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < CONE_AURA_LAYERS; i++) {
        const layerScale = 1 + (i + 1) * 0.15;
        const alpha = 0.08 / (i + 1);

        const g = ctx.createLinearGradient(bx, by, bx, bandBottom);
        if (rainbowTime > 0) {
          g.addColorStop(0, `hsla(${hueNow()}, 90%, 60%, ${alpha * 1.2})`);
          g.addColorStop(1, `hsla(${(hueNow() + 120) % 360}, 90%, 50%, 0)`);
        } else {
          g.addColorStop(0, `rgba(255,230,150,${alpha * 1.2})`);
          g.addColorStop(0.3, `rgba(255,210,120,${alpha})`);
          g.addColorStop(0.7, `rgba(255,190,90,${alpha * 0.5})`);
          g.addColorStop(1, "rgba(255,170,70,0)");
        }

        ctx.fillStyle = g;
        ctx.shadowColor = rainbowTime > 0
          ? `hsla(${hueNow()}, 90%, 60%, 0.3)`
          : "rgba(255,200,100,0.3)";
        ctx.shadowBlur = 20 + i * 15;
        conePath(ctx, bx, by, layerScale);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    };

    const drawBeam = (bx, by) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      const g1 = ctx.createLinearGradient(bx, by, bx, bandBottom);
      if (rainbowTime > 0) {
        g1.addColorStop(0, `hsla(${hueNow()}, 90%, 65%, 0.25)`);
        g1.addColorStop(1, `hsla(${(hueNow() + 90) % 360}, 90%, 55%, 0)`);
      } else {
        g1.addColorStop(0, "rgba(255,220,130,0.25)");
        g1.addColorStop(0.3, "rgba(255,210,110,0.12)");
        g1.addColorStop(0.6, "rgba(255,200,100,0.06)");
        g1.addColorStop(1, "rgba(255,190,80,0)");
      }
      ctx.fillStyle = g1;
      conePath(ctx, bx, by, 1);
      ctx.fill();

      const g2 = ctx.createLinearGradient(bx, by, bx, bandBottom);
      g2.addColorStop(0, rainbowTime > 0 ? `hsla(${(hueNow() + 180) % 360}, 90%, 70%, 0.15)` : "rgba(255,240,180,0.15)");
      g2.addColorStop(1, "rgba(255,200,120,0)");
      ctx.fillStyle = g2;
      conePath(ctx, bx, by, 0.7);
      ctx.fill();

      ctx.restore();
    };

    const drawGlow = (bx, by) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(bx, by, 5, bx, by, bulbR * 2);
      if (rainbowTime > 0) {
        g.addColorStop(0, `hsla(${hueNow()}, 90%, 75%, 0.35)`);
        g.addColorStop(1, `hsla(${hueNow()}, 90%, 50%, 0)`);
      } else {
        g.addColorStop(0, "rgba(255,245,190,0.35)");
        g.addColorStop(0.5, "rgba(255,210,120,0.06)");
        g.addColorStop(1, "rgba(255,180,80,0)");
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, bulbR * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawBulbAura = (bx, by) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(bx, by, bulbR, bx, by, bulbR * 3);
      if (rainbowTime > 0) {
        g.addColorStop(0, `hsla(${hueNow()}, 90%, 70%, 0.2)`);
        g.addColorStop(1, `hsla(${hueNow()}, 90%, 50%, 0)`);
      } else {
        g.addColorStop(0, "rgba(255,230,180,0.15)");
        g.addColorStop(0.5, "rgba(255,200,100,0.05)");
        g.addColorStop(1, "rgba(255,180,80,0)");
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, bulbR * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawCeilingCord = (bx, by) => {
      const R = bulbR;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(viewW / 2, 0);
      ctx.lineTo(bx, by - R - R * 0.42);
      ctx.strokeStyle = statusRef.current === "on" ? "#8a7a58" : "#5d6470";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    };

    // ============================================================
    // LUCIÉRNAGAS
    // ============================================================
    const drawFireflies = (st, bx, by) => {
      const on = st === "on";

      ctx.save();
      for (const f of fireflies) {
        f.phase += f.blink;

        if (on) {
          const ddx = bx - f.x;
          const ddy = by - f.y;
          const d = Math.hypot(ddx, ddy) || 1;

          if (d > bulbR + 8) {
            f.vx += (ddx / d) * FIREFLY_APPROACH;
            f.vy += (ddy / d) * FIREFLY_APPROACH;
          } else {
            f.vx -= (ddx / d) * FIREFLY_JUMP + (Math.random() - 0.5) * 0.8;
            f.vy -= (ddy / d) * FIREFLY_JUMP + (Math.random() - 0.5) * 0.8;
          }
          f.vx *= 0.95;
          f.vy *= 0.95;
        } else if (f.wall) {
          const wdx = f.wallX - f.x;
          const wdy = f.wallY - f.y;
          const wd = Math.hypot(wdx, wdy) || 1;
          if (wd > 6) {
            f.vx += (wdx / wd) * FIREFLY_WALL_PULL;
            f.vy += (wdy / wd) * FIREFLY_WALL_PULL;
          }
          f.vx += (Math.random() - 0.5) * 0.05;
          f.vy += (Math.random() - 0.5) * 0.05;
          f.vx *= 0.985;
          f.vy *= 0.985;
        } else {
          f.wander += (Math.random() - 0.5) * 0.4;
          f.vx += Math.cos(f.wander) * 0.06;
          f.vy += Math.sin(f.wander) * 0.06;
          const m = 12;
          if (f.x < m) f.vx += 0.08;
          if (f.x > viewW - m) f.vx -= 0.08;
          if (f.y < m) f.vy += 0.08;
          if (f.y > viewH - m) f.vy -= 0.08;
          const sp = Math.hypot(f.vx, f.vy);
          if (sp > 1.2) {
            f.vx = (f.vx / sp) * 1.2;
            f.vy = (f.vy / sp) * 1.2;
          }
          f.vx *= 0.985;
          f.vy *= 0.985;
        }

        f.x += f.vx;
        f.y += f.vy;

        const b = Math.max(0, Math.sin(f.phase));
        const glow = b * b;

        const scaledSize = f.size * ffScale;
        const scaledAura = FIREFLY_AURA * ffScale;

        if (glow > 0.02) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = glow * 0.30;
          const aura = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, scaledAura);
          aura.addColorStop(0, "rgba(170,255,90,0.9)");
          aura.addColorStop(1, "rgba(170,255,90,0)");
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(f.x, f.y, scaledAura, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        }

        ctx.globalAlpha = 0.25 + 0.75 * glow;
        ctx.fillStyle = "rgb(190,255,110)";
        ctx.fillRect(f.x - scaledSize / 2, f.y - scaledSize / 2, scaledSize, scaledSize);
      }
      ctx.restore();
    };

    // ============================================================
    // CUERDA + MANGO orientado con la física
    // ============================================================
    const drawRope = () => {
      if (!points.length) return;

      displayPull += ((dragging ? pull : 0) - displayPull) * 0.25;
      const redT = clamp((displayPull - 40) / (BREAK_PULL - 40), 0, 1);
      const base = statusRef.current === "on" ? [232, 218, 170] : [214, 199, 158];
      const ropeColor = rgb(mix(base, [226, 60, 50], redT));
      const pullColor = rgb(
        mix(statusRef.current === "on" ? [247, 235, 200] : [235, 225, 195], [226, 60, 50], redT)
      );

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.strokeStyle = ropeColor;
      ctx.lineWidth = ropeT;
      ctx.lineCap = "round";
      ctx.stroke();

      const end = points[points.length - 1];
      const prev = points[points.length - 2] || points[0];
      let ddx = end.x - prev.x;
      let ddy = end.y - prev.y;
      const dl = Math.hypot(ddx, ddy) || 1;
      ddx /= dl;
      ddy /= dl;

      const nx = end.x + ddx * pullS * 1.1;
      const ny = end.y + ddy * pullS * 1.1;

      ctx.strokeStyle = pullColor;
      ctx.lineWidth = pullS * 0.55;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      ctx.fillStyle = pullColor;
      ctx.beginPath();
      ctx.arc(nx, ny, pullS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // ============================================================
    // BOMBILLA (envejece, se atenúa y se pone arcoíris)
    // ============================================================
    const drawBulb = (bx, by) => {
      const on = statusRef.current === "on";
      const R = bulbR;
      const flickering = flickerTime > 0;
      const shouldDrawOn = on && (!flickering || Math.sin(flickerTime * 30) > 0);
      ctx.save();

      ctx.fillStyle = shouldDrawOn ? "#cbb56a" : "#566170";
      ctx.fillRect(bx - R * 0.45, by - R - R * 0.42, R * 0.9, R * 0.42);

      ctx.beginPath();
      ctx.arc(bx, by, R, 0, Math.PI * 2);
      if (shouldDrawOn) {
        if (rainbowTime > 0) {
          ctx.fillStyle = `hsl(${hueNow()}, 90%, 65%)`;
          ctx.shadowColor = `hsla(${hueNow()}, 90%, 60%, 0.8)`;
          ctx.shadowBlur = 14;
        } else {
          const aged = mix([217, 168, 61], [130, 120, 95], (stats.age / 100) * 0.7);
          const g = ctx.createRadialGradient(bx - R * 0.3, by - R * 0.3, 4, bx, by, R);
          g.addColorStop(0, "#fffde7");
          g.addColorStop(0.45, "#ffe9a0");
          g.addColorStop(1, rgb(aged));
          ctx.fillStyle = g;
          ctx.shadowColor = "rgba(255,210,70,0.8)";
          ctx.shadowBlur = 14;
        }
      } else {
        ctx.fillStyle = "rgba(210,230,240,0.05)";
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      if (!shouldDrawOn) {
        ctx.strokeStyle = "rgba(170,120,70,0.55)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx - R * 0.25, by - R * 0.3, R * 0.45, Math.PI * 0.9, Math.PI * 1.5);
        ctx.strokeStyle = "rgba(255,255,255,0.10)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(bx - R * 0.3, by - R * 0.15);
      ctx.lineTo(bx - R * 0.12, by + R * 0.2);
      ctx.lineTo(bx + R * 0.12, by - R * 0.2);
      ctx.lineTo(bx + R * 0.3, by + R * 0.2);
      ctx.strokeStyle = shouldDrawOn ? (rainbowTime > 0 ? "#fff" : "#ffc928") : "#8a5f32";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    };

    const drawBroken = (bx, by) => {
      const R = bulbR;
      ctx.save();
      ctx.fillStyle = "#566170";
      ctx.fillRect(bx - R * 0.45, by - R - R * 0.42, R * 0.9, R * 0.42);
      ctx.fillStyle = "rgba(190,215,225,0.75)";
      ctx.beginPath();
      ctx.moveTo(bx - R * 0.4, by - R);
      ctx.lineTo(bx - R * 0.25, by - R + R * 0.3);
      ctx.lineTo(bx - R * 0.1, by - R);
      ctx.lineTo(bx + R * 0.05, by - R + R * 0.22);
      ctx.lineTo(bx + R * 0.2, by - R);
      ctx.lineTo(bx + R * 0.35, by - R + R * 0.15);
      ctx.lineTo(bx + R * 0.4, by - R);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawShards = () => {
      if (!shards.length) return;
      ctx.save();
      shards = shards.filter((s) => s.life > 0);
      for (const s of shards) {
        s.vy += 0.12;
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.012;
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = "rgb(210,230,240)";
        ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
      }
      ctx.restore();
    };

    // ============================================================
    // RENDER — bucle principal a 60fps
    // ============================================================
    const draw = () => {
      // si moviste los sliders de bombilla/luciérnagas, recalcula al vuelo
      if (
        room.complete &&
        (sizeRef.current.bulb !== lastBulb || sizeRef.current.fly !== lastFly)
      ) {
        lastBulb = sizeRef.current.bulb;
        lastFly = sizeRef.current.fly;
        refreshLayout();
      }

      ctx.setTransform(1 / pix, 0, 0, 1 / pix, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, viewW, viewH);

      // CÁMARA DEL MODO FIESTA: bombeo que se acerca y vuelve varias veces
      camPulse = rainbowTime > 0
        ? Math.max(0, Math.sin(timeSec * PARTY_PULSE_SPEED)) * PARTY_PULSE_AMOUNT
        : 0;
      if (camPulse > 0.001) {
        ctx.translate(viewW / 2, viewH / 2);
        ctx.scale(1 + camPulse, 1 + camPulse);
        ctx.translate(-viewW / 2, -viewH / 2);
      }

      if (sfxBus) sfxBus.gain.value = volRef.current.sfx;

      const st = statusRef.current;
      const dt = 1 / 60;
      timeSec += dt;

      if (st === "on") {
        stats.lit += dt;
        stats.age = Math.min(100, stats.age + dt / (AGE_FULL_TIME / 100));
        if (stats.lit >= 60) unlock("luciernagas", "AMIGO DE LAS LUCIÉRNAGAS");
        if (stats.lit >= 180) unlock("luz180", "LUMINOTERAPIA");
        if (stats.age >= 100) unlock("vieja", "VIEJA CONFIABLE");

        // INGRESO PASIVO: +$1 cada 5 minutos con la luz encendida
        idleAccum += dt;
        if (idleAccum >= IDLE_INCOME_SECONDS) {
          idleAccum = 0;
          addMoney(IDLE_INCOME_AMOUNT);
        }

        // POMODORO: cada 25 min de luz, campanita + aviso de descanso
        pomodoroAccum += dt;
        if (pomodoroAccum >= POMODORO_TIME) {
          pomodoroAccum = 0;
          setPomodoros((p) => {
            const next = p + 1;
            saveNum("ptb_pomodoros", next);
            return next;
          });
          unlock("pomodoro", "SALUDABLE");
          if ((loadNum("ptb_pomodoros", 0) + 1) >= 5) unlock("pomodoro5", "DISCIPLINADO");
          playPomodoroSfx();
          setPomodoroNotice(true);
          setTimeout(() => setPomodoroNotice(false), 8000);
        }

        saveAcc += dt;
        if (saveAcc > 5) {
          saveAcc = 0;
          saveStats();
        }
      }

      if (rainbowTime > 0) rainbowTime -= dt;

      // MÚSICA DE FIESTA: arranca al entrar y se detiene al salir del modo
      if (rainbowTime > 0 && !wasRainbow) {
        wasRainbow = true;
        startPartyMusic();
        window.dispatchEvent(new CustomEvent("party-music", { detail: { on: true } }));
      }
      if (rainbowTime <= 0 && wasRainbow) {
        wasRainbow = false;
        stopPartyMusic();
        window.dispatchEvent(new CustomEvent("party-music", { detail: { on: false } }));
      }
      if (partyAudio && rainbowTime > 0) partyAudio.volume = volRef.current.music;

      // transiciones de estado
      if (lastStatus !== "broken" && st === "broken") scatterFireflies();
      if (lastStatus === "on" && st === "off") disperseFireflies();
      if (lastStatus === "broken" && st !== "broken") {
        createRope(false);
        // el gato vuelve entrando caminando por una orilla (sin teleport)
        if (cat && cat.gone) {
          cat.gone = false;
          cat.state = "walk";
          const fromLeft = Math.random() < 0.5;
          cat.x = fromLeft ? -catS * 2 : viewW + catS * 2;
          cat.y = bandY(0.86);
          cat.dir = fromLeft ? 1 : -1;
          cat.targetX = viewW / 2 + (Math.random() * 0.3 - 0.15) * viewW;
          cat.targetY = bandY(CAT_FLOOR_MIN + Math.random() * (CAT_FLOOR_MAX - CAT_FLOOR_MIN));
        } else if (!cat) {
          resetCat();
        }
      }

      if (lastStatus !== "on" && st === "on") {
        const { x, y } = bulbBase();
        spawnInitialDust(x, y);
      }

      lastStatus = st;

      if (flickerTime > 0) flickerTime -= 1 / 60;

      const target = dragging
        ? clamp((pull - WARN_PULL) / (BREAK_PULL - WARN_PULL), 0, 1)
        : 0;
      shake += (target - shake) * 0.2;
      const bx = viewW / 2 + (Math.random() * 2 - 1) * 5 * shake;
      const by = bandY(BULB_Y_RATIO) + (Math.random() * 2 - 1) * 3 * shake;

      updatePhysics(bx, by);
      updateCat(st, dt);
      updateMoth(dt);
      updateGlassSound();
      updateStorm(dt);
      updateRandomEvent(st, dt);

      drawRoomDark();
      drawVignette();

      const bulbOn = st === "on" && (flickerTime <= 0 || Math.sin(flickerTime * 30) > 0);

      if (bulbOn) {
        const dim = 1 - (stats.age / 100) * 0.45; // vejez = luz más tenue
        ctx.globalAlpha = (1 - shake * Math.random() * 0.8) * dim;
        drawConeAura(bx, by);
        drawBeam(bx, by);
        drawLitCone(bx, by);
        drawGlow(bx, by);
        drawBulbAura(bx, by);
        ctx.globalAlpha = 1;
      }

      drawMoth();
      drawCat();
      drawDust(bulbOn, bx, by);
      drawFireflies(st, bx, by);
      drawCeilingCord(bx, by);
      drawRope();
      if (st === "broken") drawBroken(viewW / 2, bandY(BULB_Y_RATIO));
      else drawBulb(bx, by);

      drawSparks();
      drawBoomRing();
      drawShards();

      drawStorm();

      if (flash > 0) {
        ctx.fillStyle = `rgba(255,240,220,${flash * 0.9})`;
        ctx.fillRect(0, 0, viewW, viewH);
        flash -= 0.05;
      }

      animationFrame = requestAnimationFrame(draw);
    };

    // ============================================================
    // EVENTOS
    // ============================================================
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", resize);

    resize();
    draw();

    return () => {
      cancelAnimationFrame(animationFrame);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", resize);
      clearTimeout(toastT.current);
      if (partyAudio) partyAudio.pause();
      if (audioCtx) audioCtx.close();
    };
  }, [unlock, addMoney, showToast]);

  // ============================================================
  // ECONOMÍA / TIENDA / COLABORADORES / RESETEO
  // ============================================================

  // precio dinámico: $1 al inicio, $5 después de romper las 5 regaladas
  const bulbPrice = brokenTotal >= START_BULBS ? BULB_PRICE_AFTER : BULB_PRICE_BASE;

  // Reponer bombilla: 1º inventario, 2º plata del juego, 3º tienda
  const changeBulb = () => {
    if (bulbs > 0) {
      addBulbs(-1);
      setStatus("off");
      return;
    }
    if (money >= bulbPrice) {
      addMoney(-bulbPrice);
      setStatus("off");
      return;
    }
    setShopOpen(true);
  };

  // abre tu Patreon en pestaña nueva
  const openPatreon = () => {
    if (PATREON_URL) window.open(PATREON_URL, "_blank");
    else showToast("CONFIGURA PATREON_URL");
  };

  // abre tu PayPal en pestaña nueva (donación directa)
  const openPaypal = () => {
    if (PAYPAL_URL) window.open(PAYPAL_URL, "_blank");
    else showToast("CONFIGURA PAYPAL_URL");
  };

  // abre el enlace ouo.io de las 10 bombillas; al completarlo,
  // el acortador regresa al juego con ?grant=bulb10 y se entregan solas
  const openBulbLink = () => {
    if (BULB_LINK) {
      showToast("COMPLETA EL ENLACE Y VUELVE...");
      window.open(BULB_LINK, "_blank");
    } else {
      showToast("CONFIGURA BULB_LINK");
    }
  };

  // house-ad de respaldo (solo si RESET_LINK está vacío)
  const showHouseAd = () => {
    setMenuOpen(false);
    setAdState({ left: AD_HOUSE_SECONDS });
  };

  // al cerrar el house-ad: ejecuta el reseteo con regalo
  const claimAdAndReset = () => {
    setAdState(null);
    doReset();
  };

  // RESETEAR TODO: confirmar → enlace ouo (?grant=reset) → reseteo automático
  const resetAll = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      clearTimeout(confirmT.current);
      confirmT.current = setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    setConfirmReset(false);
    setMenuOpen(false);
    if (RESET_LINK) {
      showToast("COMPLETA EL ENLACE PARA RESETEAR...");
      window.open(RESET_LINK, "_blank");
    } else {
      showHouseAd(); // respaldo sin enlace configurado
    }
  };

  // botón de consuelo: perdona la deuda y devuelve $5
  const forgiveDebt = () => {
    setMoney(5);
    saveNum("ptb_money", 5);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const setVol = (key, value) =>
    setSettings((s) => ({ ...s, vol: { ...s.vol, [key]: value } }));

  // ============================================================
  // JSX — capa visible
  // ============================================================
  return (
    <main className="scene">
      {/* escenario 16:9 centrado; el CSS lo escala como una imagen */}
      <div
        className="frame"
        style={{
          width: `${frame.w}px`,
          height: `${frame.h}px`,
          "--ui-size": `${uiSize}px`,     // tamaño de HUD/menú/toast/logros
          "--game-text": `${textSize}px`, // tamaño de los mensajes centrales
        }}
      >
        <canvas ref={canvasRef} className="game-canvas" />

        {/* HUD: plata, inventario, roturas y logros */}
        <div className="hud">
          <span className={money < 0 ? "debt" : ""}>${money}</span>
          <span>💡{bulbs}</span>
          <span className="dim">ROTAS: {brokenTotal}</span>
          <span className="dim">LOGROS: {unlocked.length}/{ACH_LIST.length}</span>
        </div>

        {/* aviso gigante de pomodoro */}
        {pomodoroNotice && (
          <div className="pomodoro-notice">
            🍅 POMODORO COMPLETADO<br/>
            <small>Descansa tus ojos 5 min</small>
          </div>
        )}

        {/* MENÚ desplegable */}
        <div className="menu-wrap">
          <button className="menu-btn" onClick={() => setMenuOpen((o) => !o)}>
            MENU
          </button>

          {menuOpen && (
            <div className="menu-panel">
              {/* accesos rápidos: tienda y colaboradores */}
              <div className="menu-row">
                <button onClick={() => { setShopOpen(true); setMenuOpen(false); }}>
                  🛒 TIENDA
                </button>
                <button onClick={() => { setCollabOpen(true); setMenuOpen(false); }}>
                  💛 COLABORADORES
                </button>
              </div>

              {/* donación directa */}
              <div className="menu-row">
                <button onClick={openPatreon}>💖 PATREON</button>
              </div>

              {/* sub-menú de tamaños */}
              <div className="menu-row">
                <button
                  className={sizeOpen ? "active" : ""}
                  onClick={() => setSizeOpen((o) => !o)}
                >
                  {sizeOpen ? "TAMAÑO ▾" : "TAMAÑO ▸"}
                </button>
              </div>

              {sizeOpen && (
                <>
                  <div className="menu-row">
                    <span>TEXTO</span>
                    <TickSlider value={settings.size.text} onChange={(i) => setSize("text", i)} />
                  </div>
                  <div className="menu-row">
                    <span>BOMBILLA</span>
                    <TickSlider value={settings.size.bulb} onChange={(i) => setSize("bulb", i)} />
                  </div>
                  <div className="menu-row">
                    <span>LUCIERNAGAS</span>
                    <TickSlider value={settings.size.fly} onChange={(i) => setSize("fly", i)} />
                  </div>
                  <div className="menu-row">
                    <span>INTERFAZ</span>
                    <TickSlider value={settings.size.ui} onChange={(i) => setSize("ui", i)} />
                  </div>
                </>
              )}

              {/* música */}
              <div className="menu-row">
                <span>MUSICA</span>
                <button
                  className={settings.music ? "active" : ""}
                  onClick={() => setSettings((s) => ({ ...s, music: !s.music }))}
                >
                  {settings.music ? "ON" : "OFF"}
                </button>
                <button onClick={() => setSettings((s) => ({ ...s, track: (s.track + 1) % 2 }))}>
                  PISTA {settings.track + 1}
                </button>
              </div>

              <div className="menu-row">
                <span>VOL MUSICA</span>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={settings.vol.music}
                  onChange={(e) => setVol("music", Number(e.target.value))}
                />
              </div>

              {/* efectos de sonido */}
              <div className="menu-row">
                <span>EFECTOS</span>
                <button
                  className={settings.sfx ? "active" : ""}
                  onClick={() => setSettings((s) => ({ ...s, sfx: !s.sfx }))}
                >
                  {settings.sfx ? "ON" : "OFF"}
                </button>
              </div>
              <div className="menu-row">
                <span>VOL EFECTOS</span>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={settings.vol.sfx}
                  onChange={(e) => setVol("sfx", Number(e.target.value))}
                />
              </div>

              {/* clima / ambiente */}
              <div className="menu-row">
                <span>CLIMA</span>
                <button
                  className={settings.weather === "rain" ? "active" : ""}
                  onClick={() => setSettings((s) => ({ ...s, weather: "rain" }))}
                >
                  LLUVIA
                </button>
                <button
                  className={settings.weather === "night" ? "active" : ""}
                  onClick={() => setSettings((s) => ({ ...s, weather: "night" }))}
                >
                  NOCHE
                </button>
                <button
                  className={settings.weather === "off" ? "active" : ""}
                  onClick={() => setSettings((s) => ({ ...s, weather: "off" }))}
                >
                  OFF
                </button>
              </div>
              <div className="menu-row">
                <span>VOL CLIMA</span>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={settings.vol.amb}
                  onChange={(e) => setVol("amb", Number(e.target.value))}
                />
              </div>

              {/* textos centrales del juego */}
              <div className="menu-row">
                <span>TEXTO JUEGO</span>
                <button
                  className={settings.text ? "active" : ""}
                  onClick={() => setSettings((s) => ({ ...s, text: !s.text }))}
                >
                  {settings.text ? "ON" : "OFF"}
                </button>
              </div>

              {/* tormenta */}
              <div className="menu-row">
                <span>TORMENTA</span>
                <button
                  className={settings.storm ? "active" : ""}
                  onClick={() => setSettings((s) => ({ ...s, storm: !s.storm }))}
                >
                  {settings.storm ? "ON" : "OFF"}
                </button>
              </div>

              {/* pantalla completa */}
              <div className="menu-row">
                <button onClick={toggleFullscreen}>
                  {isFullscreen ? "SALIR DE PANTALLA" : "PANTALLA COMPLETA"}
                </button>
              </div>

              {/* logros */}
              <div className="menu-row">
                <button onClick={() => { setAchOpen(true); setMenuOpen(false); }}>
                  VER LOGROS
                </button>
              </div>

              {/* perdón de deuda */}
              <div className="menu-row">
                <button onClick={forgiveDebt}>PERDONAR DEUDA</button>
              </div>

              {/* reseteo con anuncio */}
              <div className="menu-row">
                <button
                  className={confirmReset ? "active" : ""}
                  onClick={resetAll}
                >
                  {confirmReset ? "¿SEGURO? (VERÁS UN ANUNCIO)" : "RESETEAR TODO"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* cartelito superior (logros, compras, avisos) */}
        {toast && <div className="toast">{toast}</div>}

        {/* ---------- TIENDA (3 enlaces) ---------- */}
        {shopOpen && (
          <div className="overlay" onClick={() => setShopOpen(false)}>
            <div className="shop-panel" onClick={(e) => e.stopPropagation()}>
              <h3>TIENDA</h3>
              <p className="shop-sub">Inventario: 💡{bulbs} · Plata: ${money}</p>

              {/* ganar bombillas con enlace acortador */}
              <div className="shop-section">
                <button className="shop-btn reward" onClick={openBulbLink}>
                  🔗 GANAR 10 BOMBILLAS<br/>
                  <small>completa el enlace acortado</small>
                </button>
              </div>

              {/* donaciones directas */}
              <div className="shop-section">
                <button className="shop-btn premium" onClick={openPaypal}>
                  💳 DONAR POR PAYPAL
                </button>
                <button className="shop-btn premium" onClick={openPatreon}>
                  💖 APOYAR EN PATREON
                </button>
              </div>

              {/* compra con plata del juego */}
              <div className="shop-section">
                <div className="shop-title">CON PLATA DEL JUEGO</div>
                <button
                  className="shop-btn"
                  onClick={() => {
                    if (money >= bulbPrice) {
                      addMoney(-bulbPrice);
                      addBulbs(1);
                      showToast("+1 BOMBILLA");
                    } else {
                      showToast("NO TE ALCANZA LA PLATA");
                    }
                  }}
                >
                  💡 1 bombilla · ${bulbPrice}
                </button>
                <p className="shop-hint">💰 +$1 cada 5 min · 🦋 polilla = +$10 · ⏰ +1 gratis/24h</p>
              </div>

              <button onClick={() => setShopOpen(false)}>CERRAR</button>
            </div>
          </div>
        )}

        {/* ---------- HOUSE-AD de respaldo (solo si RESET_LINK está vacío) ---------- */}
        {adState && (
          <div className="overlay ad-overlay">
            <div className="ad-box">
              <div className="ad-tag">ANUNCIO</div>
              <div className="ad-fake">
                <p>💖 PIXWORLD</p>
                <p className="dim">Hecho con amor y bombillas rotas en Popayán 🇨🇴</p>
                <button className="shop-btn premium" onClick={openPatreon}>
                  APOYAR EN PATREON
                </button>
              </div>
              {adState.left > 0 ? (
                <div className="ad-timer">Puedes cerrar en {adState.left}s</div>
              ) : (
                <button className="shop-btn reward" onClick={claimAdAndReset}>
                  CERRAR Y RESETEAR
                </button>
              )}
            </div>
          </div>
        )}

        {/* ---------- COLABORADORES ---------- */}
        {collabOpen && (
          <div className="overlay" onClick={() => setCollabOpen(false)}>
            <div className="collab-panel" onClick={(e) => e.stopPropagation()}>
              <h3>COLABORADORES</h3>
              <p className="collab-sub">Gente que mantiene la luz encendida 💛</p>

              {/* tier VIP ($5) — nombres dorados */}
              <div className="collab-section">
                <div className="collab-tier">🌈 CARECHIMBA VIP</div>
                <div className="collab-names gold">
                  {COLLABS.vip.length
                    ? COLLABS.vip.map((n, i) => <span key={i}>{n}</span>)
                    : <span className="empty">— sé el primero —</span>}
                </div>
              </div>

              {/* tier gato ($3) */}
              <div className="collab-section">
                <div className="collab-tier">🐈 GATO DE LA BOMBILLA</div>
                <div className="collab-names">
                  {COLLABS.gato.length
                    ? COLLABS.gato.map((n, i) => <span key={i}>{n}</span>)
                    : <span className="empty">— sé el primero —</span>}
                </div>
              </div>

              {/* tier luciérnaga ($1) */}
              <div className="collab-section">
                <div className="collab-tier">💡 LUCIÉRNAGA</div>
                <div className="collab-names">
                  {COLLABS.luciernaga.length
                    ? COLLABS.luciernaga.map((n, i) => <span key={i}>{n}</span>)
                    : <span className="empty">— sé el primero —</span>}
                </div>
              </div>

              <p className="collab-cta">¿Quieres aparecer aquí?</p>
              <button className="shop-btn premium" onClick={openPatreon}>
                APOYAR EN PATREON
              </button>

              <button onClick={() => setCollabOpen(false)}>CERRAR</button>
            </div>
          </div>
        )}

        {/* ---------- PANEL DE LOGROS ---------- */}
        {achOpen && (
          <div className="overlay" onClick={() => setAchOpen(false)}>
            <div className="ach-panel" onClick={(e) => e.stopPropagation()}>
              <h3>LOGROS ({unlocked.length}/{ACH_LIST.length})</h3>
              {ACH_LIST.map((a) => (
                <div key={a.id} className={unlocked.includes(a.id) ? "ach on" : "ach"}>
                  <span className="ach-name">{a.name}</span>
                  <span className="ach-desc">{a.desc}</span>
                </div>
              ))}
              <button onClick={() => setAchOpen(false)}>CERRAR</button>
            </div>
          </div>
        )}

        {/* ---------- TEXTOS CENTRALES ---------- */}
        <div className="ui">
          {settings.text && status === "off" && <p>TIRA DE LA CUERDA SUAVE</p>}
          {settings.text && status === "on" && (
            <>
              <p>NO ES NADA MAS <br />QUEDATE O VETE</p>
              <p className="dim">TIRA DE NUEVO PARA APAGAR</p>
            </>
          )}
          {status === "broken" && (
            <>
              {settings.text && <p>CARECHIMBA ROMPISTE LA BOMBILLA</p>}
              {settings.text && <p className="dim">CAMBIALA YA</p>}
              {settings.text && bulbs === 0 && money < bulbPrice && (
                <p className="dim debt">SIN BOMBILLAS NI PLATA... VISITA LA TIENDA</p>
              )}
              <button onClick={changeBulb}>CAMBIAR BOMBILLA (💡{bulbs} · ${bulbPrice})</button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;