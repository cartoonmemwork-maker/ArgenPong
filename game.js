const W = 1280;
const H = 720;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// ============================================================
// CONFIG
// ============================================================

const BRAND = {
    blue: "#6CACE4",
    gold: "#FFB81C",
    ink: "#050B18"
};

const TABLE_REGULATION = {
    lengthMeters: 2.74,
    widthMeters: 1.525
};

const TABLE_HEIGHT =
    H - 20;

const TABLE_PIXELS_PER_METER =
    TABLE_HEIGHT /
    TABLE_REGULATION.widthMeters;

const TABLE_WIDTH =
    TABLE_HEIGHT *
    TABLE_REGULATION.lengthMeters /
    TABLE_REGULATION.widthMeters;

const TABLE = {
    left:
        (W - TABLE_WIDTH) / 2,

    right:
        (W + TABLE_WIDTH) / 2,

    top:
        (H - TABLE_HEIGHT) / 2,

    bottom:
        (H + TABLE_HEIGHT) / 2,

    colors: {
        green: "#1f5f3a",
        blue: "#174a78",
        black: "#000000"
    }
};

const PADDLE = {
    w: 20,
    h: 120,
    margin: 40
};

const SPEED_SCALE = {
    initialKmhLevels: [
        20,
        27.5,
        35,
        42.5,
        50,
        58,
        66,
        74,
        82,
        90
    ],
    maxKmh: 116,
    kmhPerSpeedUnit: 4,
    referenceFps: 60,
    progressiveReturnsToMax: 20
};

/*
    A escala real, una unidad interna equivale
    a unos 0.47 km/h. La cámara del juego usa
    una escala temporal cercana a 0.118x para
    representar velocidades reales sin perder
    legibilidad ni atravesar paletas entre cuadros.
*/

SPEED_SCALE.physicalKmhPerSpeedUnit =
    SPEED_SCALE.referenceFps *
    3.6 /
    TABLE_PIXELS_PER_METER;

SPEED_SCALE.timeScale =
    SPEED_SCALE.physicalKmhPerSpeedUnit /
    SPEED_SCALE.kmhPerSpeedUnit;

const BALL = {
    size:
        TABLE_PIXELS_PER_METER *
        0.04,

    colors: {
        white: "#FFFFFF",
        orange: BRAND.gold
    },

    defaultColor: "white",
    defaultShape: "round",

    speedLevels:
        SPEED_SCALE.initialKmhLevels
            .map(
                speedKmh =>
                    speedKmh /
                    SPEED_SCALE.kmhPerSpeedUnit
            ),

    defaultLevel: 5,
    baseYRatio: 0.42,
    maxAIVerticalRatio: 0.8,
    progressiveFactor:
        Math.pow(
            SPEED_SCALE.maxKmh /
            SPEED_SCALE.initialKmhLevels[4],

            1 /
            SPEED_SCALE.progressiveReturnsToMax
        ),
    maxSpeed:
        SPEED_SCALE.maxKmh /
        SPEED_SCALE.kmhPerSpeedUnit
};

const SPIN = {
    defaultEnabled: true,
    deadZone: 0.6,
    blockMaxPaddleSpeed: 1.1,
    fullStrengthPaddleSpeed: 14,
    curvePerStep: 0.0095,
    speedInfluence: 0.16,
    backspinSpeedInfluence: 0.14,
    blockSpeedRetention: 0.82,
    topspinCurveMultiplier: 1.08,
    backspinCurveMultiplier: 1.18,
    topspinBounceVerticalBoost: 1.08,
    backspinBounceHorizontalRetention: 0.84,
    decay: 0.992,
    wallRetention: 0.8,
    epsilon: 0.001
};

const TIMING = {
    defaultFps: 60,
    options: [60, 120],
    referenceFps:
        SPEED_SCALE.referenceFps,
    maxSteps: 5
};

const ONLINE_SYNC = {
    snapshotEverySteps: 1,
    smoothingMs: 18,
    maxPredictionMs: 50,
    snapDistance: W * 0.22
};

const REPLAY = {
    defaultEnabled: true,
    defaultMode: "matchSpeed",
    modeOptions: [
        "matchSpeed",
        "match",
        "speed",
        "all"
    ],
    speedThresholdKmh: 100,
    captureFps: 60,
    playbackFps: 60,
    startSpeed: 0.9,
    endSpeed: 0.25,
    kmhPerSpeedUnit:
        SPEED_SCALE.kmhPerSpeedUnit,
    mphPerKmh: 0.621371,
    trailFrames: 90,
    maxFrames: 1200
};

const LANGUAGE = {
    defaultMode: "auto",
    options: ["auto", "es", "en"]
};

const TEXT = {
    es: {
        space: "ESPACIO",
        localPvp: "PVP LOCAL",
        vsAi: "VS IA",
        onlinePvp: "PVP ONLINE",
        onlineJoin: "UNIRME",
        onlineSelectSide: "CREAR PARTIDA",
        activeMatches: "PARTIDAS EN CURSO",
        fullscreen: "PANTALLA COMPLETA",
        exitFullscreen: "SALIR DE PANTALLA COMPLETA",
        practiceKeys: "CLICK, ENTER O ESPACIO PARA PRACTICAR",
        practiceTouch: "UN TOQUE PARA PRACTICAR",
        waitingRematch: "ESPERANDO AL RIVAL",
        you: "VOS",
        opponent: "RIVAL",
        youLost: "Perdiste",
        searchingOpponent: "BUSCANDO OPONENTE",
        waitingOpponent: "ESPERANDO OPONENTE",
        opponentFound: "OPONENTE ENCONTRADO",
        onlineConnecting: "CONECTANDO",
        onlineNotConfigured: "FALTA CONFIGURAR EL SERVIDOR ONLINE",
        onlineConnectionError: "NO SE PUDO CONECTAR",
        opponentLeft: "EL OPONENTE SE DESCONECTÓ",
        clickRecapture: "CLICK PARA RECUPERAR EL MOUSE",
        side: "LADO",
        left: "IZQUIERDA",
        right: "DERECHA",
        easy: "FÁCIL",
        normal: "NORMAL",
        hard: "DIFÍCIL",
        difficulty: "DIFICULTAD",
        back: "VOLVER",
        rematch: "REVANCHA",
        mainMenu: "MENÚ INICIAL",
        yes: "SÍ",
        no: "NO",
        green: "VERDE",
        blue: "AZUL",
        black: "NEGRO",
        velocity: "VELOCIDAD INICIAL",
        progressive: "VELOCIDAD PROGRESIVA",
        resetDefaults: "RESTABLECER POR DEFECTO",
        controls: "CONTROLES",
        background: "MESA",
        physics: "FÍSICAS",
        ball: "PELOTA",
        score: "MARCADOR",
        top: "ARRIBA",
        bottom: "ABAJO",
        color: "COLOR",
        white: "BLANCA",
        orange: "NARANJA",
        shape: "FORMA",
        round: "REDONDA",
        square: "CUADRADA",
        sound: "SONIDO",
        continue: "CONTINUAR",
        restart: "REINICIAR PARTIDA",
        settings: "AJUSTES",
        classicPong: "PONG CLÁSICO",
        argenPong: "ARGENPONG",
        press: "PRESIONÁ...",
        pause: "PAUSA",
        chooseSide: "ELEGÍ TU LADO",
        chooseDifficulty: "Después seleccioná la dificultad",
        comingSoon: "PRÓXIMAMENTE",
        confirmRestart: "¿REINICIAR PARTIDA?",
        confirmMenu: "¿VOLVER AL MENÚ?",
        loseCurrent: "Se perderá la partida actual.",
        up: "ARRIBA",
        down: "ABAJO",
        mouse: "MOUSE",
        sensitivity: "SENS.",
        player: "JUGADOR",
        aiVsAi: "IA VS IA",
        aiLeft: "IA IZQUIERDA",
        aiRight: "IA DERECHA",
        winLeft: "LA IZQUIERDA GANA",
        winRight: "LA DERECHA GANA",
        youWon: "Ganaste",
        solWins: "GPT-5.6 Sol Gana",
        replay: "REPETICIONES INSTANTÁNEAS",
        replayAuto: "REPRODUCCIÓN AUTOMÁTICA",
        frequency: "FRECUENCIA",
        replayMatch: "MATCH",
        replayMatchSpeed: "MATCH + MÁS DE 100 KM/H",
        replayFast: "MÁS DE 100 KM/H",
        replayAll: "TODOS LOS TANTOS",
        defaults: "POR DEFECTO",
        replaySpeed: "VELOCIDAD",
        instantReplay: "REPETICIÓN INSTANTÁNEA",
        skipReplay: "ESC, ESPACIO, ENTER O CLICK PARA OMITIR",
        letCall: "LET",
        language: "IDIOMA",
        automatic: "AUTOMÁTICO",
        spanish: "ESPAÑOL",
        english: "ENGLISH",
        active: "ACTIVO"
    },

    en: {
        space: "SPACE",
        localPvp: "LOCAL PVP",
        vsAi: "VS AI",
        onlinePvp: "ONLINE PVP",
        onlineJoin: "JOIN",
        onlineSelectSide: "CREATE MATCH",
        activeMatches: "MATCHES IN PROGRESS",
        fullscreen: "FULLSCREEN",
        exitFullscreen: "EXIT FULLSCREEN",
        practiceKeys: "CLICK, ENTER OR SPACE TO PRACTICE",
        practiceTouch: "ONE TAP TO PRACTICE",
        waitingRematch: "WAITING FOR OPPONENT",
        you: "YOU",
        opponent: "OPPONENT",
        youLost: "You lost",
        searchingOpponent: "SEARCHING FOR OPPONENT",
        waitingOpponent: "WAITING FOR OPPONENT",
        opponentFound: "OPPONENT FOUND",
        onlineConnecting: "CONNECTING",
        onlineNotConfigured: "ONLINE SERVER NOT CONFIGURED",
        onlineConnectionError: "CONNECTION FAILED",
        opponentLeft: "OPPONENT DISCONNECTED",
        clickRecapture: "CLICK TO RECAPTURE MOUSE",
        side: "SIDE",
        left: "LEFT",
        right: "RIGHT",
        easy: "EASY",
        normal: "NORMAL",
        hard: "HARD",
        difficulty: "DIFFICULTY",
        back: "BACK",
        rematch: "REMATCH",
        mainMenu: "MAIN MENU",
        yes: "YES",
        no: "NO",
        green: "GREEN",
        blue: "BLUE",
        black: "BLACK",
        velocity: "INITIAL SPEED",
        progressive: "PROGRESSIVE SPEED",
        resetDefaults: "RESTORE DEFAULTS",
        controls: "CONTROLS",
        background: "TABLE",
        physics: "PHYSICS",
        ball: "BALL",
        score: "SCORE",
        top: "TOP",
        bottom: "BOTTOM",
        color: "COLOR",
        white: "WHITE",
        orange: "ORANGE",
        shape: "SHAPE",
        round: "ROUND",
        square: "SQUARE",
        sound: "SOUND",
        continue: "CONTINUE",
        restart: "RESTART MATCH",
        settings: "SETTINGS",
        classicPong: "CLASSIC PONG",
        argenPong: "ARGENPONG",
        press: "PRESS...",
        pause: "PAUSE",
        chooseSide: "CHOOSE YOUR SIDE",
        chooseDifficulty: "Then select the difficulty",
        comingSoon: "COMING SOON",
        confirmRestart: "RESTART MATCH?",
        confirmMenu: "RETURN TO MENU?",
        loseCurrent: "The current match will be lost.",
        up: "UP",
        down: "DOWN",
        mouse: "MOUSE",
        sensitivity: "SENS.",
        player: "PLAYER",
        aiVsAi: "AI VS AI",
        aiLeft: "LEFT AI",
        aiRight: "RIGHT AI",
        winLeft: "LEFT SIDE WINS",
        winRight: "RIGHT SIDE WINS",
        youWon: "You Won",
        solWins: "GPT-5.6 Sol Wins",
        replay: "INSTANT REPLAYS",
        replayAuto: "AUTOMATIC REPLAY",
        frequency: "FREQUENCY",
        replayMatch: "MATCH",
        replayMatchSpeed: "MATCH + OVER 62 MPH",
        replayFast: "OVER 62 MPH",
        replayAll: "EVERY POINT",
        defaults: "DEFAULTS",
        replaySpeed: "SPEED",
        instantReplay: "INSTANT REPLAY",
        skipReplay: "ESC, SPACE, ENTER OR CLICK TO SKIP",
        letCall: "LET",
        language: "LANGUAGE",
        automatic: "AUTOMATIC",
        spanish: "ESPAÑOL",
        english: "ENGLISH",
        active: "ACTIVE"
    }
};

const MATCH = {
    win: 11,
    margin: 2
};

const LET = {
    maxWallBounces: 10,
    displayMs: 900
};

const SCORE = {
    defaultPosition: "bottom"
};

const SENS = {
    min: 0.1,
    max: 1,
    step: 0.1,
    default: 0.6
};

const UI = {
    title: "bold 48px monospace",
    button: "bold 24px monospace",
    score: "bold 48px monospace",
    winner: "bold 52px monospace"
};

const LOCAL_DEFAULTS = {
    left: {
        up: "w",
        down: "s",
        mouse: true,
        sensitivity: SENS.default
    },

    right: {
        up: "ArrowUp",
        down: "ArrowDown",
        mouse: false,
        sensitivity: SENS.default
    }
};

const AI_DEFAULTS = {
    up1: "w",
    up2: "ArrowUp",
    down1: "s",
    down2: "ArrowDown",
    mouse: true,
    sensitivity: SENS.default
};

const AI_LEVELS = {
    easy: {
        label: "FÁCIL",
        returns: 5,
        anticipation: 0.44,
        response: 0.7,
        baseSensitivity: 0.66,
        demandScale: 0.72,
        tracking: 0.31,
        reactionSteps: 10,
        correctionSteps: 20,
        aimError: 42,
        spinAwareness: 0.12,
        shotStrength: 0.55,
        blockChance: 0.5,
        backspinChance: 0.14
    },

    normal: {
        label: "NORMAL",
        returns: 10,
        anticipation: 0.62,
        response: 0.84,
        baseSensitivity: 0.78,
        demandScale: 0.82,
        tracking: 0.35,
        reactionSteps: 7,
        correctionSteps: 14,
        aimError: 24,
        spinAwareness: 0.64,
        shotStrength: 0.76,
        blockChance: 0.38,
        backspinChance: 0.24
    },

    hard: {
        label: "DIFÍCIL",
        returns: 20,
        anticipation: 0.9,
        response: 1,
        baseSensitivity: 0.94,
        demandScale: 1,
        tracking: 0.44,
        reactionSteps: 3,
        correctionSteps: 6,
        aimError: 8,
        spinAwareness: 1,
        shotStrength: 0.94,
        blockChance: 0.22,
        backspinChance: 0.3
    }
};


// ============================================================
// ESTADO
// ============================================================

let courtColor = "black";
let scorePosition = SCORE.defaultPosition;

let audioContext = null;
let audioMuted = false;

let ballSpeedLevel = BALL.defaultLevel;
let progressiveSpeed = true;
let spinEnabled = SPIN.defaultEnabled;
let physicsFps = TIMING.defaultFps;
let ballColor = BALL.defaultColor;
let ballShape = BALL.defaultShape;
let classicPongMode = false;
let classicPongSavedSettings = null;

let previousFrameTime = null;
let frameAccumulator = 0;

let leftScore = 0;
let rightScore = 0;

let leftVictories = 0;
let rightVictories = 0;

let servingPlayer = "left";

let gameOver = false;
let winner = null;

let consecutiveWallBounces = 0;
let letActive = false;
let letTimer = null;

let gamePaused = false;
let gameMode = null;

let startMenuOpen = true;
let aiMenuOpen = false;
let onlineMenuOpen = false;

const onlineSession = {
    screen: "closed",
    role: null,
    side: "left",
    countdown: null,
    errorKey: null,
    remoteTargetY:
        (H - PADDLE.h) / 2,
    savedSettings: null,
    snapshotAccumulator: 0,
    latencyMs: null,
    guestBall: null,
    practiceBall: null,
    practiceTapTime: -Infinity,
    localRematchReady: false,
    remoteRematchReady: false,
    localReplaySkipReady: false,
    remoteReplaySkipReady: false,
    queueMode: null,
    queueTimer: null,
    returningToQueue: false,
    activeMatches: null,
    statsTimer: null,
    pointerHint: false,
    countdownTimers: []
};

let settingsOpen = false;
let controlsOpen = false;
let backgroundOpen = false;
let physicsOpen = false;
let ballOpen = false;
let replayOpen = false;
let languageOpen = false;
let settingsFromStart = false;

let confirmOpen = null;
let hoveredButton = null;
let waitingForKey = null;

let humanSide = "left";
let aiDifficulty = "normal";
let aiVsAiEnabled = false;
let aiLeftDifficulty = "normal";
let aiRightDifficulty = "normal";
let aiReturns = 0;
let aiState = "idle";
let aiReactionRemaining = 0;
let aiCorrectionRemaining = 0;
let aiAimY = H / 2;
let aiAimError = 0;
let aiShotIntent = "block";

const createAutoplayAIBrain = () => ({
    state: "idle",
    reactionRemaining: 0,
    correctionRemaining: 0,
    aimY: H / 2,
    aimError: 0,
    shotIntent: "block",
    returns: 0
});

const autoplayAIBrains = {
    left: createAutoplayAIBrain(),
    right: createAutoplayAIBrain()
};

let previousMouseY = null;
let activeSlider = null;
let pointerUnlockPauseTime = -Infinity;
let escapeResumeTime = -Infinity;
let pendingMouseDelta = 0;
const activeTouchPointers =
    new Map();

let lastTouchInteractionTime =
    -Infinity;

let lastFullscreenTouchTime =
    -Infinity;

let lastFullscreenTouchPoint =
    null;

let suppressCanvasClickUntil =
    -Infinity;

let replayAutoEnabled = REPLAY.defaultEnabled;
let replayMode = REPLAY.defaultMode;
let languageMode = LANGUAGE.defaultMode;

let replayPlaying = false;
let replayFrames = [];
let replayReturnIndices = [];
let replayCaptureAccumulator = 0;
let replayClip = [];
let replayPosition = 0;
let replayLastTime = null;
let replayPlaybackAccumulator = 0;
let replayFinishTime = -Infinity;
let replayReachedSpeedThreshold = false;

const localControls = {
    left: { ...LOCAL_DEFAULTS.left },
    right: { ...LOCAL_DEFAULTS.right }
};

const aiControls = {
    ...AI_DEFAULTS
};

const keys = {};


// ============================================================
// OBJETOS
// ============================================================

const leftPaddle = {
    x: PADDLE.margin,
    y: (H - PADDLE.h) / 2,
    previousY: (H - PADDLE.h) / 2,
    vy: 0
};

const rightPaddle = {
    x: W - PADDLE.margin - PADDLE.w,
    y: (H - PADDLE.h) / 2,
    previousY: (H - PADDLE.h) / 2,
    vy: 0
};

const ball = {
    x: (W - BALL.size) / 2,
    y: (H - BALL.size) / 2,
    vx: 0,
    vy: 0,
    spin: 0,
    spinSpeedOffset: 0,
    shotType: "none"
};


// ============================================================
// UTILS
// ============================================================

const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

const round1 = value =>
    Math.round(value * 10) / 10;

const otherSide = side =>
    side === "left"
        ? "right"
        : "left";

const sidePaddle = side =>
    side === "left"
        ? leftPaddle
        : rightPaddle;

const aiDifficultyForSide = side =>
    aiVsAiEnabled

        ? side === "left"
            ? aiLeftDifficulty
            : aiRightDifficulty

        : aiDifficulty;

const difficultyLabel = difficulty =>
    t(difficulty);

function nextAIDifficulty(
    difficulty
) {

    const difficulties = [
        "easy",
        "normal",
        "hard"
    ];

    const index =
        difficulties.indexOf(
            difficulty
        );

    return difficulties[
        (
            index + 1 +
            difficulties.length
        ) %
        difficulties.length
    ];
}

const currentBallSpeed = () =>
    BALL.speedLevels[
        ballSpeedLevel - 1
    ];

const currentStepMs = () =>
    1000 /
    physicsFps;

const currentStepScale = () =>
    TIMING.referenceFps /
    physicsFps;

function currentLanguage() {

    if (
        languageMode !== "auto"
    ) {
        return languageMode;
    }

    const browserLanguage =
        typeof navigator !== "undefined"

            ? navigator.language || "es"
            : "es";

    return browserLanguage
        .toLowerCase()
        .startsWith("es")

            ? "es"
            : "en";
}

function t(key) {

    const language =
        currentLanguage();

    return (
        TEXT[language][key] ||
        TEXT.es[key] ||
        key
    );
}

function languageModeLabel() {

    if (
        languageMode === "es"
    ) {
        return t("spanish");
    }

    if (
        languageMode === "en"
    ) {
        return t("english");
    }

    return t("automatic");
}

function replayModeLabel(
    mode = replayMode
) {

    const labels = {
        matchSpeed:
            t("replayMatchSpeed"),

        match:
            t("replayMatch"),

        speed:
            t("replayFast"),

        all:
            t("replayAll")
    };

    return (
        labels[mode] ||
        labels[REPLAY.defaultMode]
    );
}

function setPhysicsFps(
    fps
) {

    if (
        !TIMING.options
            .includes(fps)
    ) {
        return;
    }

    physicsFps =
        fps;

    previousFrameTime =
        null;

    frameAccumulator =
        0;
}

function inside(x, y, rect) {
    return (
        x >= rect.x &&
        x <= rect.x + rect.w &&
        y >= rect.y &&
        y <= rect.y + rect.h
    );
}

function mousePos(event) {

    const rect =
        canvas.getBoundingClientRect();

    return {
        x:
            (event.clientX - rect.left) *
            W /
            rect.width,

        y:
            (event.clientY - rect.top) *
            H /
            rect.height
    };
}

function formatKey(key) {

    const names = {
        ArrowUp: "↑",
        ArrowDown: "↓",
        ArrowLeft: "←",
        ArrowRight: "→",
        " ": t("space")
    };

    return (
        names[key] ||
        key.toUpperCase()
    );
}


// ============================================================
// AUDIO
// ============================================================

function initAudio() {

    if (!audioContext) {
        audioContext =
            new AudioContext();
    }

    if (
        audioContext.state ===
        "suspended"
    ) {
        audioContext.resume();
    }
}

function sound(
    frequency,
    duration,
    volume
) {

    if (
        audioMuted ||
        !audioContext
    ) {
        return;
    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        "square";

    oscillator.frequency
        .setValueAtTime(
            frequency,
            audioContext.currentTime
        );

    gain.gain
        .setValueAtTime(
            volume,
            audioContext.currentTime
        );

    gain.gain
        .exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime +
            duration
        );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime +
        duration
    );
}

function sendOnlineSound(kind) {

    if (
        gameMode === "online" &&
        onlineSession.role === "host" &&
        onlineSession.screen === "playing"
    ) {
        onlineTransport()?.sendEvent({
            type: "sound",
            kind
        });
    }
}

const wallSound = (
    syncOnline = true
) => {
    sound(500, 0.06, 0.08);

    if (syncOnline) {
        sendOnlineSound("wall");
    }
};

const paddleSound = (
    syncOnline = true
) => {
    sound(800, 0.07, 0.1);

    if (syncOnline) {
        sendOnlineSound("paddle");
    }
};

const pointSound = (
    syncOnline = true
) => {
    sound(180, 0.2, 0.12);

    if (syncOnline) {
        sendOnlineSound("point");
    }
};

function playOnlineSound(kind) {

    if (kind === "wall") {
        wallSound(false);
    } else if (kind === "paddle") {
        paddleSound(false);
    } else if (kind === "point") {
        pointSound(false);
    }
}


// ============================================================
// RESET
// ============================================================

function resetLocalControls() {

    Object.assign(
        localControls.left,
        LOCAL_DEFAULTS.left
    );

    Object.assign(
        localControls.right,
        LOCAL_DEFAULTS.right
    );

    waitingForKey = null;
}

function resetAIControls() {

    Object.assign(
        aiControls,
        AI_DEFAULTS
    );

    aiVsAiEnabled =
        false;

    aiLeftDifficulty =
        "normal";

    aiRightDifficulty =
        "normal";

    resetAutoplayAIThinking();

    waitingForKey = null;
}

function resetAutoplayAIThinking() {

    for (
        const side of
        ["left", "right"]
    ) {

        Object.assign(
            autoplayAIBrains[side],
            createAutoplayAIBrain()
        );
    }
}

function resetAIThinking() {

    aiState =
        "idle";

    aiReactionRemaining =
        0;

    aiCorrectionRemaining =
        0;

    aiAimY =
        H / 2;

    aiAimError =
        0;

    aiShotIntent =
        "block";

    resetAutoplayAIThinking();
}

function resetPhysics() {

    ballSpeedLevel =
        BALL.defaultLevel;

    progressiveSpeed =
        true;

    spinEnabled =
        SPIN.defaultEnabled;

    if (
        gameMode &&
        !gameOver
    ) {
        resetBall();
    }
}

function currentBallColor() {

    return (
        BALL.colors[
            ballColor
        ] ||
        BALL.colors.white
    );
}

function initialBallSpeedText() {

    const speedKmh =
        SPEED_SCALE.initialKmhLevels[
            ballSpeedLevel - 1
        ];

    if (
        currentLanguage() === "en"
    ) {

        return `${ballSpeedLevel} · ${Math.round(
            speedKmh *
            REPLAY.mphPerKmh
        )} mph`;
    }

    return `${ballSpeedLevel} · ${
        Number.isInteger(
            speedKmh
        )

            ? speedKmh
            : speedKmh.toFixed(1)
    } km/h`;
}

function setBallShape(
    shape
) {

    if (
        ![
            "round",
            "square"
        ].includes(shape)
    ) {
        return;
    }

    ballShape =
        shape;
}

function resetBallAppearance() {

    ballColor =
        BALL.defaultColor;

    setBallShape(
        BALL.defaultShape
    );
}

function toggleClassicPongPreset() {

    if (!classicPongMode) {

        classicPongSavedSettings = {
            courtColor,
            scorePosition,
            ballColor,
            ballShape
        };

        classicPongMode = true;
        courtColor = "black";
        scorePosition = "top";
        ballColor = "white";

        setBallShape(
            "square"
        );

    } else {

        const saved =
            classicPongSavedSettings;

        classicPongMode = false;
        classicPongSavedSettings = null;

        courtColor =
            saved?.courtColor ||
            "black";

        scorePosition =
            saved?.scorePosition ||
            SCORE.defaultPosition;

        ballColor =
            saved?.ballColor ||
            BALL.defaultColor;

        setBallShape(
            saved?.ballShape ||
            BALL.defaultShape
        );
    }

}

function startSettingsActive() {

    return (
        startMenuOpen &&
        settingsFromStart &&
        (
            settingsOpen ||
            controlsOpen ||
            backgroundOpen ||
            physicsOpen ||
            ballOpen ||
            replayOpen ||
            languageOpen
        )
    );
}

function closeStartSettings() {

    settingsFromStart = false;
    settingsOpen = false;
    controlsOpen = false;
    backgroundOpen = false;
    physicsOpen = false;
    ballOpen = false;
    replayOpen = false;
    languageOpen = false;
    waitingForKey = null;
    hoveredButton = null;
}

function resetPaddles() {

    const centerY =
        (H - PADDLE.h) / 2;

    leftPaddle.y =
        centerY;

    leftPaddle.previousY =
        centerY;

    leftPaddle.vy =
        0;

    rightPaddle.y =
        centerY;

    rightPaddle.previousY =
        centerY;

    rightPaddle.vy =
        0;
}

function clearLetTimer() {

    if (letTimer !== null) {
        clearTimeout(letTimer);
        letTimer = null;
    }
}

function resetLetState() {

    clearLetTimer();

    consecutiveWallBounces = 0;
    letActive = false;
}

function resetBall() {

    resetLetState();

    ball.x =
        (W - BALL.size) / 2;

    ball.y =
        (H - BALL.size) / 2;

    ball.spin =
        0;

    ball.spinSpeedOffset =
        0;

    ball.shotType =
        "none";

    const speed =
        currentBallSpeed();

    const verticalRatio =
        BALL.baseYRatio /
        Math.hypot(
            1,
            BALL.baseYRatio
        );

    const verticalSpeed =
        Math.max(
            2,
            speed *
            verticalRatio
        );

    const horizontalSpeed =
        Math.sqrt(
            Math.max(
                0,
                speed * speed -
                verticalSpeed *
                verticalSpeed
            )
        );

    ball.vx =
        (
            servingPlayer === "left"
                ? 1
                : -1
        ) *
        horizontalSpeed;

    ball.vy =
        (
            ball.vy < 0
                ? -1
                : 1
        ) *
        verticalSpeed;

    // Cada punto reinicia
    // el desgaste de la IA.
    aiReturns = 0;

    resetAIThinking();

    resetReplayCapture();
}

function resetMatch() {

    replayPlaying = false;
    replayClip = [];

    leftScore = 0;
    rightScore = 0;

    servingPlayer =
        "left";

    gameOver = false;
    winner = null;

    gamePaused = false;
    confirmOpen = null;

    if (
        gameMode === "online" &&
        onlineSession.role === "guest"
    ) {
        onlineSession.guestBall = null;
    }

    resetPaddles();
    resetBall();

    requestMouseCapture();
}

function startGame(
    mode,
    side = "left",
    difficulty = "normal"
) {

    requestTouchLandscape();

    leftVictories = 0;
    rightVictories = 0;

    gameMode =
        mode;

    humanSide =
        side;

    aiDifficulty =
        difficulty;

    startMenuOpen = false;
    aiMenuOpen = false;
    onlineMenuOpen = false;
    settingsFromStart = false;

    settingsOpen = false;
    controlsOpen = false;
    backgroundOpen = false;
    physicsOpen = false;
    ballOpen = false;
    replayOpen = false;
    languageOpen = false;

    resetMatch();
}

function onlineTransport() {

    return (
        window.ArgenPongOnline ||
        null
    );
}

function clearOnlineCountdown() {

    onlineSession.countdownTimers
        .forEach(clearTimeout);

    onlineSession.countdownTimers = [];
    onlineSession.countdown = null;
}

function clearOnlineQueueTimer() {

    if (
        onlineSession.queueTimer !==
        null
    ) {
        clearTimeout(
            onlineSession.queueTimer
        );

        onlineSession.queueTimer =
            null;
    }
}

function clearOnlineStatsPolling() {

    if (
        onlineSession.statsTimer !==
        null
    ) {
        clearInterval(
            onlineSession.statsTimer
        );

        onlineSession.statsTimer =
            null;
    }
}

function refreshOnlineStats() {

    if (
        !startMenuOpen ||
        !onlineMenuOpen ||
        onlineSession.screen !== "menu"
    ) {
        return;
    }

    const transport =
        onlineTransport();

    if (
        !transport ||
        typeof transport.getStats !==
            "function"
    ) {
        return;
    }

    let request;

    try {
        request =
            transport.getStats();
    } catch {
        return;
    }

    Promise.resolve(request)
        .then(
            stats => {
                if (
                    startMenuOpen &&
                    onlineMenuOpen &&
                    onlineSession.screen ===
                        "menu" &&
                    Number.isFinite(
                        stats.activeMatches
                    )
                ) {
                    onlineSession.activeMatches =
                        Math.max(
                            0,
                            Math.trunc(
                                stats.activeMatches
                            )
                        );
                }
            }
        )
        .catch(
            () => {}
        );
}

function startOnlineStatsPolling() {

    clearOnlineStatsPolling();
    onlineSession.activeMatches =
        null;

    refreshOnlineStats();

    onlineSession.statsTimer =
        setInterval(
            refreshOnlineStats,
            5000
        );
}

function saveOfflineSettings() {

    if (onlineSession.savedSettings) {
        return;
    }

    onlineSession.savedSettings = {
        ballSpeedLevel,
        progressiveSpeed,
        spinEnabled,
        physicsFps,
        replayAutoEnabled,
        replayMode
    };
}

function applyOnlineDefaults() {

    saveOfflineSettings();

    ballSpeedLevel =
        BALL.defaultLevel;

    progressiveSpeed = true;
    spinEnabled = true;
    physicsFps = 60;
    replayAutoEnabled =
        REPLAY.defaultEnabled;
    replayMode =
        REPLAY.defaultMode;
}

function restoreOfflineSettings() {

    const saved =
        onlineSession.savedSettings;

    if (!saved) {
        return;
    }

    ballSpeedLevel =
        saved.ballSpeedLevel;
    progressiveSpeed =
        saved.progressiveSpeed;
    spinEnabled =
        saved.spinEnabled;
    physicsFps =
        saved.physicsFps;
    replayAutoEnabled =
        saved.replayAutoEnabled;
    replayMode =
        saved.replayMode;

    onlineSession.savedSettings =
        null;
}

function resetOnlineSession() {

    clearOnlineCountdown();
    clearOnlineQueueTimer();
    clearOnlineStatsPolling();

    onlineSession.screen = "closed";
    onlineSession.role = null;
    onlineSession.side = "left";
    onlineSession.errorKey = null;
    onlineSession.remoteTargetY =
        (H - PADDLE.h) / 2;
    onlineSession.snapshotAccumulator = 0;
    onlineSession.latencyMs = null;
    onlineSession.guestBall = null;
    onlineSession.practiceBall = null;
    onlineSession.practiceTapTime =
        -Infinity;
    onlineSession.localRematchReady =
        false;
    onlineSession.remoteRematchReady =
        false;
    onlineSession.localReplaySkipReady =
        false;
    onlineSession.remoteReplaySkipReady =
        false;
    onlineSession.queueMode = null;
    onlineSession.returningToQueue =
        false;
    onlineSession.activeMatches =
        null;
    onlineSession.pointerHint = false;
    activeTouchPointers.clear();
}

function onlineStateSnapshot() {

    return {
        ball: {
            x: ball.x,
            y: ball.y,
            vx: ball.vx,
            vy: ball.vy,
            spin: ball.spin,
            spinSpeedOffset:
                ball.spinSpeedOffset,
            shotType: ball.shotType
        },
        leftPaddleY: leftPaddle.y,
        rightPaddleY: rightPaddle.y,
        leftScore,
        rightScore,
        leftVictories,
        rightVictories,
        servingPlayer,
        letActive,
        gameOver,
        winner
    };
}

function reflectOnlineBallY(value) {

    const min =
        TABLE.top;

    const max =
        TABLE.bottom -
        BALL.size;

    const span =
        max - min;

    if (
        !Number.isFinite(value) ||
        span <= 0
    ) {
        return min;
    }

    const period =
        span * 2;

    let offset =
        (value - min) %
        period;

    if (offset < 0) {
        offset += period;
    }

    return (
        offset <= span

            ? min + offset
            : max -
              (offset - span)
    );
}

function updateOnlineGuestBall(
    timestamp
) {

    const visual =
        onlineSession.guestBall;

    if (
        gameMode !== "online" ||
        onlineSession.role !== "guest" ||
        onlineSession.screen !==
            "playing" ||
        replayPlaying ||
        letActive ||
        !visual
    ) {
        return;
    }

    const frameMs =
        clamp(
            timestamp -
            visual.lastFrameAt,
            0,
            50
        );

    visual.lastFrameAt =
        timestamp;

    const predictionMs =
        clamp(
            timestamp -
            visual.receivedAt,
            0,
            ONLINE_SYNC.maxPredictionMs
        );

    const predictionSteps =
        predictionMs /
        (
            1000 /
            TIMING.referenceFps
        );

    const predictedX =
        visual.snapshotX +
        visual.vx *
        predictionSteps;

    const predictedY =
        reflectOnlineBallY(
            visual.snapshotY +
            visual.vy *
            predictionSteps
        );

    const error =
        Math.hypot(
            predictedX - ball.x,
            predictedY - ball.y
        );

    if (
        error >
        ONLINE_SYNC.snapDistance
    ) {
        ball.x = predictedX;
        ball.y = predictedY;
        return;
    }

    const smoothing =
        1 -
        Math.exp(
            -frameMs /
            ONLINE_SYNC.smoothingMs
        );

    ball.x +=
        (
            predictedX -
            ball.x
        ) *
        smoothing;

    ball.y +=
        (
            predictedY -
            ball.y
        ) *
        smoothing;
}

function applyOnlineSnapshot(
    snapshot
) {

    if (
        onlineSession.role !== "guest" ||
        !snapshot ||
        !snapshot.ball
    ) {
        return;
    }

    const nextBallX =
        Number.isFinite(
            snapshot.ball.x
        )

            ? snapshot.ball.x
            : ball.x;

    const nextBallY =
        Number.isFinite(
            snapshot.ball.y
        )

            ? snapshot.ball.y
            : ball.y;

    const nextBallVx =
        Number.isFinite(
            snapshot.ball.vx
        )

            ? snapshot.ball.vx
            : ball.vx;

    const nextBallVy =
        Number.isFinite(
            snapshot.ball.vy
        )

            ? snapshot.ball.vy
            : ball.vy;

    const nextLetActive =
        Boolean(
            snapshot.letActive
        );

    const nextLeftScore =
        clamp(
            Math.trunc(
                Number.isFinite(
                    snapshot.leftScore
                )

                    ? snapshot.leftScore
                    : 0
            ),
            0,
            99
        );

    const nextRightScore =
        clamp(
            Math.trunc(
                Number.isFinite(
                    snapshot.rightScore
                )

                    ? snapshot.rightScore
                    : 0
            ),
            0,
            99
        );

    const nextLeftVictories =
        clamp(
            Math.trunc(
                Number.isFinite(
                    snapshot.leftVictories
                )

                    ? snapshot.leftVictories
                    : leftVictories
            ),
            0,
            9999
        );

    const nextRightVictories =
        clamp(
            Math.trunc(
                Number.isFinite(
                    snapshot.rightVictories
                )

                    ? snapshot.rightVictories
                    : rightVictories
            ),
            0,
            9999
        );

    const previousVisual =
        onlineSession.guestBall;

    const scoreChanged =
        nextLeftScore !== leftScore ||
        nextRightScore !== rightScore;

    const paddleBounce =
        previousVisual &&
        previousVisual.vx *
        nextBallVx < 0;

    const visualError =
        Math.hypot(
            nextBallX - ball.x,
            nextBallY - ball.y
        );

    const snapPosition =
        !previousVisual ||
        scoreChanged ||
        paddleBounce ||
        Boolean(
            snapshot.gameOver
        ) ||
        nextLetActive !==
            letActive ||
        visualError >
            ONLINE_SYNC.snapDistance;

    for (
        const key of
        [
            "vx",
            "vy",
            "spin",
            "spinSpeedOffset"
        ]
    ) {
        if (
            Number.isFinite(
                snapshot.ball[key]
            )
        ) {
            ball[key] =
                snapshot.ball[key];
        }
    }

    if (
        typeof snapshot.ball.shotType ===
        "string"
    ) {
        ball.shotType =
            snapshot.ball.shotType;
    }

    const now =
        performance.now();

    onlineSession.guestBall = {
        snapshotX: nextBallX,
        snapshotY: nextBallY,
        vx: nextBallVx,
        vy: nextBallVy,
        receivedAt: now,
        lastFrameAt:
            previousVisual

                ? previousVisual.lastFrameAt
                : now
    };

    if (snapPosition) {
        ball.x = nextBallX;
        ball.y = nextBallY;

        onlineSession.guestBall
            .lastFrameAt = now;
    }

    if (
        onlineSession.side !== "left" &&
        Number.isFinite(
            snapshot.leftPaddleY
        )
    ) {
        leftPaddle.y =
            snapshot.leftPaddleY;
    }

    if (
        onlineSession.side !== "right" &&
        Number.isFinite(
            snapshot.rightPaddleY
        )
    ) {
        rightPaddle.y =
            snapshot.rightPaddleY;
    }

    leftScore =
        nextLeftScore;

    rightScore =
        nextRightScore;

    leftVictories =
        nextLeftVictories;

    rightVictories =
        nextRightVictories;

    letActive =
        nextLetActive;

    servingPlayer =
        snapshot.servingPlayer ===
        "right"

            ? "right"
            : "left";

    gameOver =
        Boolean(snapshot.gameOver);

    winner =
        snapshot.winner === "left" ||
        snapshot.winner === "right"

            ? snapshot.winner
            : null;

    if (gameOver) {
        releaseMouseCapture();
    }
}

function sendOnlineSnapshot(
    force = false
) {

    if (
        gameMode !== "online" ||
        onlineSession.role !== "host" ||
        onlineSession.screen !== "playing"
    ) {
        return;
    }

    if (!force) {
        onlineSession.snapshotAccumulator++;

        if (
            onlineSession.snapshotAccumulator <
            ONLINE_SYNC.snapshotEverySteps
        ) {
            return;
        }
    }

    onlineSession.snapshotAccumulator = 0;

    onlineTransport()?.sendSnapshot(
        onlineStateSnapshot()
    );
}

function failOnline(errorKey) {

    clearOnlineCountdown();
    resetLetState();

    onlineTransport()?.close(
        false
    );

    releaseMouseCapture();
    restoreOfflineSettings();

    startMenuOpen = true;
    aiMenuOpen = false;
    onlineMenuOpen = true;
    gameMode = null;
    gamePaused = false;
    gameOver = false;
    winner = null;

    replayPlaying = false;
    replayClip = [];
    resetReplayCapture();
    resetOnlineRematchChoices();
    resetOnlineReplaySkipChoices();
    resetOnlinePractice();

    onlineSession.screen = "error";
    onlineSession.errorKey =
        errorKey;
    onlineSession.role = null;
    onlineSession.countdown = null;
}

function beginOnlineGame() {

    if (
        onlineSession.screen ===
        "playing"
    ) {
        return;
    }

    clearOnlineCountdown();
    clearOnlineStatsPolling();
    applyOnlineDefaults();

    onlineSession.practiceBall = null;
    onlineSession.localRematchReady =
        false;
    onlineSession.remoteRematchReady =
        false;

    startGame(
        "online",
        onlineSession.side
    );

    onlineSession.screen = "playing";
    onlineSession.pointerHint =
        !touchControlsPreferred() &&
        document.pointerLockElement !==
            canvas;

    sendOnlineSnapshot(true);
}

function setOnlineCountdown(value) {

    onlineSession.screen =
        "countdown";
    onlineSession.countdown =
        value;
}

function startHostCountdown() {

    clearOnlineCountdown();
    setOnlineCountdown(3);

    onlineTransport()?.sendEvent({
        type: "countdown",
        value: 3
    });

    [
        [1000, 2],
        [2000, 1]
    ].forEach(
        ([delay, value]) => {
            onlineSession.countdownTimers
                .push(
                    setTimeout(
                        () => {
                            setOnlineCountdown(
                                value
                            );

                            onlineTransport()
                                ?.sendEvent({
                                    type:
                                        "countdown",
                                    value
                                });
                        },
                        delay
                    )
                );
        }
    );

    onlineSession.countdownTimers.push(
        setTimeout(
            () => {
                onlineTransport()
                    ?.sendEvent({
                        type: "start"
                    });

                beginOnlineGame();
            },
            3000
        )
    );
}

function resetOnlinePractice() {

    onlineSession.practiceBall = null;
    onlineSession.practiceTapTime =
        -Infinity;
}

function launchOnlinePracticeBall() {

    if (
        !startMenuOpen ||
        !onlineMenuOpen ||
        onlineSession.screen !==
            "waiting" ||
        onlineSession.practiceBall
    ) {
        return false;
    }

    const paddle =
        sidePaddle(
            onlineSession.side
        );

    const size =
        BALL.size;

    const speed =
        BALL.speedLevels[
            BALL.defaultLevel - 1
        ];

    const verticalSpeed =
        speed *
        (
            Math.random() < 0.5
                ? -0.32
                : 0.32
        );

    const horizontalSpeed =
        Math.sqrt(
            Math.max(
                0,
                speed * speed -
                verticalSpeed *
                verticalSpeed
            )
        );

    const direction =
        onlineSession.side === "left"
            ? 1
            : -1;

    onlineSession.practiceBall = {
        x:
            onlineSession.side === "left"

                ? paddle.x +
                  PADDLE.w +
                  8
                : paddle.x -
                  size -
                  8,

        y:
            paddle.y +
            PADDLE.h / 2 -
            size / 2,

        vx:
            horizontalSpeed *
            direction,

        vy: verticalSpeed,
        size
    };

    return true;
}

function updateOnlinePracticeBall(
    stepScale = 1
) {

    const practice =
        onlineSession.practiceBall;

    if (
        !practice ||
        !startMenuOpen ||
        !onlineMenuOpen ||
        onlineSession.screen !==
            "waiting"
    ) {
        return;
    }

    practice.x +=
        practice.vx *
        stepScale;

    practice.y +=
        practice.vy *
        stepScale;

    if (
        practice.y <=
        TABLE.top
    ) {
        practice.y =
            TABLE.top;
        practice.vy =
            Math.abs(
                practice.vy
            );
        wallSound();

    } else if (
        practice.y +
        practice.size >=
        TABLE.bottom
    ) {
        practice.y =
            TABLE.bottom -
            practice.size;
        practice.vy =
            -Math.abs(
                practice.vy
            );
        wallSound();
    }

    if (
        onlineSession.side ===
            "left" &&
        practice.x +
            practice.size >=
            TABLE.right
    ) {
        practice.x =
            TABLE.right -
            practice.size;
        practice.vx =
            -Math.abs(
                practice.vx
            );
        wallSound();

    } else if (
        onlineSession.side ===
            "right" &&
        practice.x <=
            TABLE.left
    ) {
        practice.x =
            TABLE.left;
        practice.vx =
            Math.abs(
                practice.vx
            );
        wallSound();
    }

    const paddle =
        sidePaddle(
            onlineSession.side
        );

    const movingTowardPaddle =
        onlineSession.side === "left"

            ? practice.vx < 0
            : practice.vx > 0;

    const overlapsPaddle =
        practice.x <
            paddle.x +
            PADDLE.w &&
        practice.x +
            practice.size >
            paddle.x &&
        practice.y <
            paddle.y +
            PADDLE.h &&
        practice.y +
            practice.size >
            paddle.y;

    if (
        movingTowardPaddle &&
        overlapsPaddle
    ) {
        const speed =
            Math.hypot(
                practice.vx,
                practice.vy
            );

        const hitOffset =
            clamp(
                (
                    practice.y +
                    practice.size / 2 -
                    (
                        paddle.y +
                        PADDLE.h / 2
                    )
                ) /
                (
                    PADDLE.h / 2
                ),
                -1,
                1
            );

        practice.vy =
            clamp(
                hitOffset *
                speed *
                0.78 +
                paddle.vy *
                0.28,
                -speed * 0.9,
                speed * 0.9
            );

        const horizontal =
            Math.sqrt(
                Math.max(
                    1,
                    speed * speed -
                    practice.vy *
                    practice.vy
                )
            );

        if (
            onlineSession.side ===
            "left"
        ) {
            practice.x =
                paddle.x +
                PADDLE.w;
            practice.vx =
                Math.abs(horizontal);

        } else {
            practice.x =
                paddle.x -
                practice.size;
            practice.vx =
                -Math.abs(horizontal);
        }

        paddleSound();
    }

    const missed =
        onlineSession.side === "left"

            ? practice.x +
              practice.size <
              TABLE.left

            : practice.x >
              TABLE.right;

    if (missed) {
        onlineSession.practiceBall =
            null;
    }
}

function drawOnlinePracticeBall() {

    const practice =
        onlineSession.practiceBall;

    if (
        onlineSession.screen !==
            "waiting" ||
        !practice
    ) {
        return;
    }

    ctx.save();
    applyElementShadow();

    ctx.fillStyle =
        currentBallColor();

    drawBallShape(
        practice.x +
            practice.size / 2,
        practice.y +
            practice.size / 2,
        practice.size
    );

    ctx.restore();
}

function resetOnlineRematchChoices() {

    onlineSession.localRematchReady =
        false;

    onlineSession.remoteRematchReady =
        false;
}

function resetOnlineReplaySkipChoices() {

    onlineSession.localReplaySkipReady =
        false;

    onlineSession.remoteReplaySkipReady =
        false;
}

function maybeSkipOnlineReplay() {

    if (
        onlineSession.role === "host" &&
        replayPlaying &&
        onlineSession.localReplaySkipReady &&
        onlineSession.remoteReplaySkipReady
    ) {
        onlineTransport()?.sendEvent({
            type: "replay_skip"
        });

        finishReplay();
    }
}

function requestOnlineReplaySkip() {

    if (
        gameMode !== "online" ||
        !replayPlaying ||
        onlineSession.localReplaySkipReady
    ) {
        return;
    }

    onlineSession.localReplaySkipReady =
        true;

    onlineTransport()?.sendEvent({
        type: "replay_skip_ready",
        ready: true
    });

    maybeSkipOnlineReplay();
}

function finishOnlineRematchCountdown() {

    clearOnlineCountdown();

    onlineSession.screen =
        "playing";

    onlineSession.pointerHint =
        !touchControlsPreferred() &&
        document.pointerLockElement !==
            canvas;

    if (
        onlineSession.role ===
        "host"
    ) {
        onlineTransport()?.sendEvent({
            type: "rematch_start"
        });

        sendOnlineSnapshot(true);
    }
}

function startHostRematchCountdown() {

    if (
        onlineSession.role !==
            "host"
    ) {
        return;
    }

    clearOnlineCountdown();
    resetOnlineRematchChoices();
    resetMatch();
    setOnlineCountdown(3);

    onlineTransport()?.sendEvent({
        type: "rematch_countdown",
        value: 3
    });

    [
        [1000, 2],
        [2000, 1]
    ].forEach(
        ([delay, value]) => {
            onlineSession.countdownTimers
                .push(
                    setTimeout(
                        () => {
                            setOnlineCountdown(
                                value
                            );

                            onlineTransport()
                                ?.sendEvent({
                                    type:
                                        "rematch_countdown",
                                    value
                                });
                        },
                        delay
                    )
                );
        }
    );

    onlineSession.countdownTimers.push(
        setTimeout(
            finishOnlineRematchCountdown,
            3000
        )
    );
}

function maybeStartOnlineRematch() {

    if (
        onlineSession.role ===
            "host" &&
        gameOver &&
        onlineSession.localRematchReady &&
        onlineSession.remoteRematchReady
    ) {
        startHostRematchCountdown();
    }
}

function toggleOnlineRematch() {

    if (
        gameMode !== "online" ||
        !gameOver
    ) {
        return;
    }

    onlineSession.localRematchReady =
        !onlineSession
            .localRematchReady;

    onlineTransport()?.sendEvent({
        type: "rematch_ready",
        ready:
            onlineSession
                .localRematchReady
    });

    maybeStartOnlineRematch();
}

function handleOnlineEvent(event) {

    if (!event) {
        return;
    }

    if (
        event.type ===
        "leave_online_menu"
    ) {
        goToOnlineMenu(
            false
        );
        return;
    }

    if (
        event.type === "sound" &&
        onlineSession.role === "guest"
    ) {
        playOnlineSound(
            event.kind
        );
        return;
    }

    if (
        event.type === "countdown" &&
        onlineSession.role === "guest"
    ) {
        setOnlineCountdown(
            clamp(
                Math.trunc(event.value),
                1,
                3
            )
        );
        return;
    }

    if (
        event.type === "start" &&
        onlineSession.role === "guest"
    ) {
        beginOnlineGame();
        return;
    }

    if (
        event.type ===
        "replay_skip_ready" &&
        replayPlaying
    ) {
        onlineSession.remoteReplaySkipReady =
            Boolean(event.ready);

        maybeSkipOnlineReplay();
        return;
    }

    if (
        event.type ===
        "replay_skip" &&
        onlineSession.role === "guest" &&
        replayPlaying
    ) {
        finishReplay();
        return;
    }

    if (
        event.type ===
        "rematch_ready"
    ) {
        onlineSession.remoteRematchReady =
            Boolean(event.ready);

        maybeStartOnlineRematch();
        return;
    }

    if (
        event.type ===
            "rematch_countdown" &&
        onlineSession.role === "guest"
    ) {
        const value =
            clamp(
                Math.trunc(event.value),
                1,
                3
            );

        if (value === 3) {
            resetOnlineRematchChoices();
            resetMatch();
        }

        setOnlineCountdown(value);
        return;
    }

    if (
        event.type ===
            "rematch_start" &&
        onlineSession.role === "guest"
    ) {
        finishOnlineRematchCountdown();
        return;
    }

    if (
        event.type === "replay" &&
        onlineSession.role === "guest" &&
        Array.isArray(event.clip) &&
        event.clip.length >= 2
    ) {
        applyOnlineSnapshot(
            event.snapshot
        );

        replayClip =
            event.clip
                .slice(
                    0,
                    REPLAY.maxFrames
                )
                .filter(
                    frame =>
                        frame &&
                        Number.isFinite(
                            frame.ballX
                        ) &&
                        Number.isFinite(
                            frame.ballY
                        )
                );

        if (
            replayClip.length < 2
        ) {
            replayClip = [];
            return;
        }
        resetOnlineReplaySkipChoices();
        replayPlaying = true;
        replayPosition = 0;
        replayLastTime = null;
        replayPlaybackAccumulator = 0;
    }
}

function configureOnlineTransport() {

    const transport =
        onlineTransport();

    if (!transport) {
        return;
    }

    transport.setHandlers({
        matched({ role, side }) {
            onlineSession.role = role;
            onlineSession.queueMode =
                onlineSession.queueMode ||
                (
                    role === "host"
                        ? "host"
                        : "join"
                );
            onlineSession.side = side;
            humanSide = side;
            onlineSession.screen =
                "connecting";
            resetOnlinePractice();
            resetPaddles();
        },

        ready() {
            if (
                onlineSession.role ===
                "host"
            ) {
                startHostCountdown();
            }
        },

        latency({ ms }) {
            onlineSession.latencyMs =
                Number.isFinite(ms)

                    ? Math.max(
                        0,
                        Math.round(ms)
                    )
                    : null;
        },

        data(message) {
            if (
                message.type === "input" &&
                onlineSession.role === "host" &&
                message.input &&
                Number.isFinite(
                    message.input.targetY
                )
            ) {
                onlineSession.remoteTargetY =
                    message.input.targetY;
                return;
            }

            if (
                message.type === "snapshot"
            ) {
                applyOnlineSnapshot(
                    message.snapshot
                );
                return;
            }

            if (
                message.type === "event"
            ) {
                handleOnlineEvent(
                    message.event
                );
            }
        },

        error({ code }) {
            failOnline(
                code === "not_configured"

                    ? "onlineNotConfigured"
                    : "onlineConnectionError"
            );
        },

        opponentLeft() {
            if (
                onlineSession.returningToQueue
            ) {
                return;
            }

            failOnline(
                "opponentLeft"
            );
        },

        connectionLost() {
            failOnline(
                "onlineConnectionError"
            );
        }
    });
}

function goToOnlineMenu(
    notifyOpponent = true
) {

    if (
        notifyOpponent &&
        onlineSession.role
    ) {
        onlineTransport()?.sendEvent({
            type:
                "leave_online_menu"
        });
    }

    resetLetState();
    clearOnlineCountdown();
    clearOnlineQueueTimer();
    clearOnlineStatsPolling();

    onlineTransport()?.close();
    restoreOfflineSettings();
    releaseMouseCapture();

    startMenuOpen = true;
    aiMenuOpen = false;
    onlineMenuOpen = true;
    settingsFromStart = false;

    gameMode = null;
    gamePaused = false;
    gameOver = false;
    winner = null;

    settingsOpen = false;
    controlsOpen = false;
    backgroundOpen = false;
    physicsOpen = false;
    ballOpen = false;
    replayOpen = false;
    languageOpen = false;
    confirmOpen = null;
    waitingForKey = null;
    hoveredButton = null;

    replayPlaying = false;
    replayClip = [];
    resetReplayCapture();
    resetPaddles();
    resetOnlineSession();

    onlineSession.screen = "menu";
    onlineSession.errorKey = null;

    startOnlineStatsPolling();
}

function returnOnlineToQueue() {

    if (
        gameMode !== "online" ||
        onlineSession.returningToQueue
    ) {
        return;
    }

    const queueMode =
        onlineSession.queueMode ||
        (
            onlineSession.role === "host"
                ? "host"
                : "join"
        );

    const side =
        onlineSession.side;

    onlineSession.returningToQueue =
        true;

    clearOnlineCountdown();
    clearOnlineQueueTimer();
    clearOnlineStatsPolling();
    resetLetState();

    onlineTransport()?.close();
    restoreOfflineSettings();
    releaseMouseCapture();

    startMenuOpen = true;
    aiMenuOpen = false;
    onlineMenuOpen = true;

    gameMode = null;
    gamePaused = false;
    gameOver = false;
    winner = null;

    settingsOpen = false;
    controlsOpen = false;
    backgroundOpen = false;
    physicsOpen = false;
    ballOpen = false;
    replayOpen = false;
    languageOpen = false;
    confirmOpen = null;
    waitingForKey = null;
    hoveredButton = null;

    replayPlaying = false;
    replayClip = [];
    resetReplayCapture();
    resetOnlineRematchChoices();
    resetOnlineReplaySkipChoices();
    resetOnlinePractice();
    resetPaddles();

    onlineSession.queueMode =
        queueMode;
    onlineSession.role = null;
    onlineSession.side = side;
    onlineSession.errorKey = null;
    onlineSession.latencyMs = null;
    onlineSession.guestBall = null;
    onlineSession.remoteTargetY =
        (H - PADDLE.h) / 2;
    onlineSession.snapshotAccumulator =
        0;
    onlineSession.pointerHint = false;
    onlineSession.screen =
        queueMode === "host"
            ? "waiting"
            : "searching";

    humanSide = side;
    activeTouchPointers.clear();

    onlineSession.queueTimer =
        setTimeout(
            () => {
                onlineSession.queueTimer =
                    null;
                onlineSession.returningToQueue =
                    false;

                if (
                    !startMenuOpen ||
                    !onlineMenuOpen ||
                    onlineSession.queueMode !==
                        queueMode
                ) {
                    return;
                }

                if (queueMode === "host") {
                    onlineTransport()?.host(
                        onlineSession.side
                    );
                } else {
                    onlineTransport()?.join();
                }
            },
            120
        );
}

function goToStartMenu() {

    resetLetState();

    if (
        gameMode === "online" ||
        onlineMenuOpen
    ) {
        clearOnlineCountdown();
        onlineTransport()?.close();
        restoreOfflineSettings();
        resetOnlineSession();
    }

    releaseMouseCapture();

    startMenuOpen = true;
    aiMenuOpen = false;
    onlineMenuOpen = false;
    settingsFromStart = false;

    gamePaused = false;
    gameOver = false;

    winner = null;

    confirmOpen = null;
    hoveredButton = null;
    waitingForKey = null;

    settingsOpen = false;
    controlsOpen = false;
    backgroundOpen = false;
    physicsOpen = false;
    ballOpen = false;
    replayOpen = false;
    languageOpen = false;

    replayPlaying = false;
    replayClip = [];
    resetReplayCapture();

    gameMode = null;
}


// ============================================================
// REPETICIÓN
// ============================================================

function resetReplayCapture() {

    replayFrames = [];
    replayReturnIndices = [];
    replayCaptureAccumulator = 0;
    replayReachedSpeedThreshold = false;
}

function registerReplaySpeedThreshold() {

    if (
        Math.hypot(
            ball.vx,
            ball.vy
        ) *
        REPLAY.kmhPerSpeedUnit >
        REPLAY.speedThresholdKmh
    ) {

        replayReachedSpeedThreshold =
            true;
    }
}

function replaySnapshot() {

    return {
        ballX: ball.x,
        ballY: ball.y,
        ballVx: ball.vx,
        ballVy: ball.vy,
        ballSpeed:
            Math.hypot(
                ball.vx,
                ball.vy
            ),
        leftPaddleY: leftPaddle.y,
        rightPaddleY: rightPaddle.y
    };
}

function pushReplaySnapshot() {

    replayFrames.push(
        replaySnapshot()
    );

    if (
        replayFrames.length >
        REPLAY.maxFrames
    ) {

        const removeCount =
            replayFrames.length -
            REPLAY.maxFrames;

        replayFrames.splice(
            0,
            removeCount
        );

        replayReturnIndices =
            replayReturnIndices
                .map(
                    index =>
                        index -
                        removeCount
                )
                .filter(
                    index =>
                        index >= 0
                );
    }
}

function captureReplayFrame(
    stepScale
) {

    if (
        replayPlaying ||
        startMenuOpen ||
        gamePaused ||
        gameOver ||
        !gameMode
    ) {
        return;
    }

    registerReplaySpeedThreshold();

    replayCaptureAccumulator +=
        stepScale *
        REPLAY.captureFps /
        TIMING.referenceFps;

    while (
        replayCaptureAccumulator >= 1
    ) {

        pushReplaySnapshot();

        replayCaptureAccumulator -=
            1;
    }
}

function markReplayReturn() {

    replayReturnIndices.push(
        replayFrames.length
    );

    if (
        replayReturnIndices.length > 2
    ) {

        const keepFrom =
            replayReturnIndices[
                replayReturnIndices.length - 2
            ];

        replayFrames =
            replayFrames.slice(
                keepFrom
            );

        replayReturnIndices =
            replayReturnIndices
                .slice(-2)
                .map(
                    index =>
                        index -
                        keepFrom
                );
    }
}

function shouldReplayPoint(
    previousMatchSide
) {

    if (!replayAutoEnabled) {
        return false;
    }

    const enteredMatch =
        !previousMatchSide &&
        Boolean(
            matchPointSide()
        );

    const matchReplay =
        enteredMatch ||
        checkWinner();

    if (
        replayMode === "all"
    ) {
        return true;
    }

    if (
        replayMode === "speed"
    ) {
        return (
            replayReachedSpeedThreshold ||
            checkWinner()
        );
    }

    if (
        replayMode === "matchSpeed"
    ) {
        return (
            matchReplay ||
            replayReachedSpeedThreshold
        );
    }

    return matchReplay;
}

function startPointReplay(
    previousMatchSide
) {

    if (
        !shouldReplayPoint(
            previousMatchSide
        )
    ) {
        return false;
    }

    pushReplaySnapshot();

    const startIndex =
        replayReturnIndices.length >= 2

            ? replayReturnIndices[
                replayReturnIndices.length - 2
            ]
            : 0;

    replayClip =
        replayFrames.slice(
            startIndex
        );

    if (
        replayClip.length < 2
    ) {
        return false;
    }

    if (gameMode === "online") {
        resetOnlineReplaySkipChoices();
    }

    replayPlaying = true;
    replayPosition = 0;
    replayLastTime = null;
    replayPlaybackAccumulator = 0;

    if (
        gameMode === "online" &&
        onlineSession.role === "host"
    ) {
        onlineTransport()?.sendEvent({
            type: "replay",
            clip: replayClip,
            snapshot:
                onlineStateSnapshot()
        });
    }

    return true;
}

function replayPlaybackSpeed() {

    const progress =
        replayClip.length > 1

            ? clamp(
                replayPosition /
                (
                    replayClip.length - 1
                ),
                0,
                1
            )
            : 0;

    const easedProgress =
        progress *
        progress *
        (
            3 -
            2 *
            progress
        );

    return (
        REPLAY.startSpeed +
        (
            REPLAY.endSpeed -
            REPLAY.startSpeed
        ) *
        easedProgress
    );
}

function replaySpeedText(
    frame
) {

    const speedUnits =
        Number.isFinite(
            frame.ballSpeed
        )

            ? frame.ballSpeed
            : Math.hypot(
                frame.ballVx,
                frame.ballVy
            );

    const speedKmh =
        speedUnits *
        REPLAY.kmhPerSpeedUnit;

    const maxSpeedKmh =
        Math.round(
            BALL.maxSpeed *
            REPLAY.kmhPerSpeedUnit
        );

    const reachedMaxSpeed =
        speedUnits >=
        BALL.maxSpeed -
        0.000001;

    if (
        currentLanguage() === "en"
    ) {

        const maxSpeedMph =
            Math.round(
                maxSpeedKmh *
                REPLAY.mphPerKmh
            );

        const displayedMph =
            reachedMaxSpeed

                ? maxSpeedMph
                : Math.min(
                    Math.round(
                        speedKmh *
                        REPLAY.mphPerKmh
                    ),
                    maxSpeedMph - 1
                );

        return `${displayedMph} mph`;
    }

    const displayedKmh =
        reachedMaxSpeed

            ? maxSpeedKmh
            : Math.min(
                Math.round(
                    speedKmh
                ),
                maxSpeedKmh - 1
            );

    return `${displayedKmh} km/h`;
}

function updateReplay(
    timestamp
) {

    if (!replayPlaying) {
        return;
    }

    if (
        replayLastTime === null
    ) {

        replayLastTime =
            timestamp;

        return;
    }

    const elapsed =
        Math.min(
            timestamp -
            replayLastTime,
            100
        );

    replayLastTime =
        timestamp;

    replayPlaybackAccumulator +=
        elapsed;

    const playbackStepMs =
        1000 /
        REPLAY.playbackFps;

    while (
        replayPlaybackAccumulator >=
        playbackStepMs
    ) {

        replayPosition +=
            replayPlaybackSpeed();

        replayPlaybackAccumulator -=
            playbackStepMs;
    }

    if (
        replayPosition >=
        replayClip.length - 1
    ) {
        finishReplay();
    }
}

function finishReplay() {

    if (!replayPlaying) {
        return;
    }

    replayPlaying = false;

    if (gameMode === "online") {
        resetOnlineReplaySkipChoices();
    }

    replayClip = [];
    replayPosition = 0;
    replayLastTime = null;
    replayPlaybackAccumulator = 0;
    replayFinishTime =
        performance.now();

    if (
        gameMode === "online" &&
        onlineSession.role === "guest"
    ) {
        resetReplayCapture();
        return;
    }

    finalizePoint();
    resetReplayCapture();

    sendOnlineSnapshot(true);

    if (!gameOver) {
        requestMouseCapture();
    }
}


// ============================================================
// PARTIDO
// ============================================================

function checkWinner() {

    if (
        leftScore < MATCH.win &&
        rightScore < MATCH.win
    ) {
        return false;
    }

    return (
        Math.abs(
            leftScore -
            rightScore
        ) >=
        MATCH.margin
    );
}

function updateServe() {

    if (
        leftScore >= 10 &&
        rightScore >= 10
    ) {

        servingPlayer =
            otherSide(
                servingPlayer
            );

        return;
    }

    servingPlayer =
        Math.floor(
            (
                leftScore +
                rightScore
            ) /
            2
        ) %
        2 ===
        0

            ? "left"
            : "right";
}

function finalizePoint() {

    if (checkWinner()) {

        gameOver =
            true;

        winner =
            leftScore >
            rightScore

                ? "left"
                : "right";

        if (winner === "left") {
            leftVictories++;
        } else {
            rightVictories++;
        }

        releaseMouseCapture();
        resetReplayCapture();

        return;
    }

    updateServe();
    resetBall();
}

function handlePoint(
    previousMatchSide
) {

    if (
        startPointReplay(
            previousMatchSide
        )
    ) {
        return;
    }

    finalizePoint();
}

function awardPoint(side) {

    const previousMatchSide =
        matchPointSide();

    if (side === "left") {

        leftScore++;

    } else {

        rightScore++;
    }

    pointSound();

    handlePoint(
        previousMatchSide
    );
}


// ============================================================
// MATCH POINT
// ============================================================

function wouldWinNext(side) {

    const left =
        leftScore +
        (
            side === "left"
                ? 1
                : 0
        );

    const right =
        rightScore +
        (
            side === "right"
                ? 1
                : 0
        );

    return (
        (
            left >= MATCH.win ||
            right >= MATCH.win
        ) &&
        Math.abs(
            left -
            right
        ) >=
        MATCH.margin
    );
}

function matchPointSide() {

    const left =
        wouldWinNext("left");

    const right =
        wouldWinNext("right");

    if (
        left &&
        !right
    ) {
        return "left";
    }

    if (
        right &&
        !left
    ) {
        return "right";
    }

    return null;
}


// ============================================================
// FÍSICA
// ============================================================

function scaleBallVelocity(
    scale
) {

    if (
        !Number.isFinite(scale) ||
        scale <= 0
    ) {
        return;
    }

    ball.vx *= scale;
    ball.vy *= scale;


    const speed =
        Math.hypot(
            ball.vx,
            ball.vy
        );


    if (
        speed > BALL.maxSpeed
    ) {

        const capScale =
            BALL.maxSpeed /
            speed;

        ball.vx *= capScale;
        ball.vy *= capScale;
    }
}

function setBallSpeed(
    targetSpeed
) {

    const currentSpeed =
        Math.hypot(
            ball.vx,
            ball.vy
        );

    if (
        currentSpeed <= 0 ||
        !Number.isFinite(
            targetSpeed
        ) ||
        targetSpeed <= 0
    ) {
        return;
    }

    scaleBallVelocity(
        targetSpeed /
        currentSpeed
    );
}

function clearBallSpin() {

    const speedFactor =
        1 +
        ball.spinSpeedOffset;


    if (
        speedFactor > 0 &&
        ball.spinSpeedOffset !==
            0
    ) {

        scaleBallVelocity(
            1 /
            speedFactor
        );
    }


    ball.spin =
        0;

    ball.spinSpeedOffset =
        0;

    ball.shotType =
        "none";
}

function isAISide(
    side
) {

    return (
        gameMode === "ai" &&
        (
            aiVsAiEnabled ||
            side ===
                otherSide(
                    humanSide
                )
        )
    );
}

function limitAIOutgoingAngle(
    side
) {

    if (!isAISide(side)) {
        return;
    }

    const horizontalSpeed =
        Math.abs(
            ball.vx
        );

    const verticalSpeed =
        Math.abs(
            ball.vy
        );

    if (
        horizontalSpeed <= 0 ||
        verticalSpeed <=
            horizontalSpeed *
            BALL.maxAIVerticalRatio
    ) {
        return;
    }

    const speed =
        Math.hypot(
            ball.vx,
            ball.vy
        );

    const limitedHorizontal =
        speed /
        Math.hypot(
            1,
            BALL.maxAIVerticalRatio
        );

    ball.vx =
        (
            Math.sign(
                ball.vx
            ) || 1
        ) *
        limitedHorizontal;

    ball.vy =
        (
            Math.sign(
                ball.vy
            ) || 1
        ) *
        limitedHorizontal *
        BALL.maxAIVerticalRatio;
}

function aiShotIntentForSide(
    side
) {

    return aiVsAiEnabled

        ? autoplayAIBrains[
            side
        ].shotIntent

        : aiShotIntent;
}

function spinPaddleSpeed(
    paddle,
    side
) {

    if (!isAISide(side)) {
        return paddle.vy;
    }

    const shotIntent =
        aiShotIntentForSide(
            side
        );

    if (
        shotIntent ===
        "block"
    ) {
        return 0;
    }

    const contactDistance =
        Math.abs(
            ball.y +
            BALL.size / 2 -
            (
                paddle.y +
                PADDLE.h / 2
            )
        );

    if (
        contactDistance >
        PADDLE.h * 0.38
    ) {
        return 0;
    }

    const level =
        AI_LEVELS[
            aiDifficultyForSide(
                side
            )
        ];

    const strengthSpeed =
        SPIN.deadZone +
        (
            SPIN.fullStrengthPaddleSpeed -
            SPIN.deadZone
        ) *
        level.shotStrength;

    const incomingDirection =
        Math.sign(
            ball.vy
        ) || 1;

    return (
        shotIntent ===
        "topspin"

            ? incomingDirection
            : -incomingDirection
    ) *
    strengthSpeed;
}

function storeSpinSpeedFactor(
    speedBefore
) {

    const speedAfter =
        Math.hypot(
            ball.vx,
            ball.vy
        );

    ball.spinSpeedOffset =
        speedBefore > 0

            ? speedAfter /
              speedBefore -
              1

            : 0;
}

function applyBallSpin(
    paddle,
    side
) {

    if (!spinEnabled) {
        return;
    }


    const paddleSpeed =
        spinPaddleSpeed(
            paddle,
            side
        );

    const speedBefore =
        Math.hypot(
            ball.vx,
            ball.vy
        );


    /*
        Una paleta prácticamente quieta
        absorbe parte de la velocidad.

        El bloqueo no agrega curva
        y el cambio dura hasta la devolución.
    */

    if (
        Math.abs(
            paddleSpeed
        ) <=
        SPIN.blockMaxPaddleSpeed
    ) {

        ball.shotType =
            "block";

        if (progressiveSpeed) {

            scaleBallVelocity(
                SPIN.blockSpeedRetention
            );

            storeSpinSpeedFactor(
                speedBefore
            );
        }

        return;
    }

    const strength =
        clamp(
            (
                Math.abs(
                    paddleSpeed
                ) -
                SPIN.deadZone
            ) /
            (
                SPIN.fullStrengthPaddleSpeed -
                SPIN.deadZone
            ),

            0,
            1
        );


    /*
        La dirección absoluta de la paleta
        curva la pelota hacia arriba o abajo.

        Multiplicar por la dirección horizontal
        mantiene el mismo resultado visual
        para ambos lados de la mesa.
    */

    ball.spin =
        Math.sign(
            paddleSpeed
        ) *
        Math.sign(
            ball.vx
        ) *
        strength;


    /*
        Acompañar el movimiento vertical
        de la pelota genera un golpe ofensivo.

        Contradecirlo genera un golpe flotado.
        El modificador dura hasta el próximo golpe
        y nunca se acumula entre paletas.
    */

    const driveDirection =
        paddleSpeed *
        ball.vy >= 0

            ? 1
            : -1;


    ball.shotType =
        driveDirection > 0

            ? "topspin"
            : "backspin";


    const speedFactor =
        driveDirection > 0

            ? 1 +
              strength *
              SPIN.speedInfluence

            : 1 -
              strength *
              SPIN.backspinSpeedInfluence;


    if (progressiveSpeed) {

        scaleBallVelocity(
            speedFactor
        );

        storeSpinSpeedFactor(
            speedBefore
        );
    }
}

function updateBallSpin(
    stepScale = 1
) {

    if (!spinEnabled) {
        return;
    }


    if (
        Math.abs(
            ball.spin
        ) >=
        SPIN.epsilon
    ) {

        const curveMultiplier =
            ball.shotType ===
                "topspin"

                ? SPIN.topspinCurveMultiplier
                : ball.shotType ===
                    "backspin"

                    ? SPIN.backspinCurveMultiplier
                    : 1;

        const angle =
            ball.spin *
            SPIN.curvePerStep *
            curveMultiplier *
            stepScale;

        const cos =
            Math.cos(angle);

        const sin =
            Math.sin(angle);

        const vx =
            ball.vx;

        const vy =
            ball.vy;


        ball.vx =
            vx * cos -
            vy * sin;

        ball.vy =
            vx * sin +
            vy * cos;
    }


    ball.spin *=
        Math.pow(
            SPIN.decay,
            stepScale
        );


    if (
        Math.abs(
            ball.spin
        ) <
        SPIN.epsilon
    ) {
        ball.spin = 0;
    }
}

function applySpinBounceResponse() {

    if (!spinEnabled) {
        return;
    }

    const speed =
        Math.hypot(
            ball.vx,
            ball.vy
        );

    if (speed <= 0) {
        return;
    }

    const horizontalDirection =
        Math.sign(
            ball.vx
        ) || 1;

    const verticalDirection =
        Math.sign(
            ball.vy
        ) || 1;


    if (
        ball.shotType ===
        "topspin"
    ) {

        const verticalSpeed =
            Math.min(
                speed * 0.94,

                Math.abs(
                    ball.vy
                ) *
                SPIN.topspinBounceVerticalBoost
            );

        ball.vy =
            verticalDirection *
            verticalSpeed;

        ball.vx =
            horizontalDirection *
            Math.sqrt(
                Math.max(
                    0,
                    speed * speed -
                    verticalSpeed *
                    verticalSpeed
                )
            );

    } else if (
        ball.shotType ===
        "backspin"
    ) {

        const horizontalSpeed =
            Math.abs(
                ball.vx
            ) *
            SPIN.backspinBounceHorizontalRetention;

        ball.vx =
            horizontalDirection *
            horizontalSpeed;

        ball.vy =
            verticalDirection *
            Math.sqrt(
                Math.max(
                    0,
                    speed * speed -
                    horizontalSpeed *
                    horizontalSpeed
                )
            );
    }
}

function increaseBallSpeed() {

    if (!progressiveSpeed) {
        return;
    }

    const currentSpeed =
        Math.hypot(
            ball.vx,
            ball.vy
        );

    if (
        currentSpeed <= 0 ||
        currentSpeed >= BALL.maxSpeed
    ) {
        return;
    }

    const nextSpeed =
        Math.min(
            currentSpeed *
            BALL.progressiveFactor,

            BALL.maxSpeed
        );

    const scale =
        nextSpeed /
        currentSpeed;

    ball.vx *= scale;
    ball.vy *= scale;
}


// ============================================================
// VELOCIDAD DE PALETAS
// ============================================================

function keyboardSpeed(
    sensitivity
) {

    const t =
        (
            sensitivity -
            SENS.min
        ) /
        (
            SENS.max -
            SENS.min
        );

    /*
        0.1 = 6
        0.6 = ~13.8
        1.0 = 20

        El valor por defecto 0.6
        acompaña el nuevo estándar de juego.
    */

    return (
        6 +
        t * 14
    );
}


// ============================================================
// PVP LOCAL
// ============================================================

function localMove(
    stepScale = 1
) {

    for (
        const side of
        [
            "left",
            "right"
        ]
    ) {

        const controls =
            localControls[side];

        const paddle =
            sidePaddle(side);

        const speed =
            keyboardSpeed(
                controls.sensitivity
            ) *
            stepScale;

        if (
            keys[
                controls.up
            ]
        ) {
            paddle.y -= speed;
        }

        if (
            keys[
                controls.down
            ]
        ) {
            paddle.y += speed;
        }
    }
}


// ============================================================
// JUGADOR VS IA
// ============================================================

function humanMoveAI(
    stepScale = 1
) {

    const paddle =
        sidePaddle(
            humanSide
        );

    const speed =
        keyboardSpeed(
            aiControls.sensitivity
        ) *
        stepScale;

    const up =
        keys[aiControls.up1] ||
        keys[aiControls.up2];

    const down =
        keys[aiControls.down1] ||
        keys[aiControls.down2];

    if (up) {
        paddle.y -= speed;
    }

    if (down) {
        paddle.y += speed;
    }
}

function onlineLocalMove(
    stepScale = 1
) {

    const paddle =
        sidePaddle(
            onlineSession.side
        );

    const speed =
        keyboardSpeed(
            SENS.default
        ) *
        stepScale;

    const up =
        keys.w ||
        keys.W ||
        keys.ArrowUp;

    const down =
        keys.s ||
        keys.S ||
        keys.ArrowDown;

    if (up) {
        paddle.y -= speed;
    }

    if (down) {
        paddle.y += speed;
    }

    if (
        onlineSession.role ===
        "guest"
    ) {
        onlineTransport()?.sendInput({
            targetY: paddle.y
        });
    }
}

function onlineRemoteMove(
    stepScale = 1
) {

    if (
        onlineSession.role !== "host"
    ) {
        return;
    }

    const paddle =
        sidePaddle(
            otherSide(
                onlineSession.side
            )
        );

    const maxMove =
        keyboardSpeed(
            SENS.default
        ) *
        stepScale *
        1.25;

    paddle.y += clamp(
        onlineSession.remoteTargetY -
            paddle.y,
        -maxMove,
        maxMove
    );
}

function clampPaddles() {

    const maxY =
        TABLE.bottom -
        PADDLE.h;

    leftPaddle.y =
        clamp(
            leftPaddle.y,
            TABLE.top,
            maxY
        );

    rightPaddle.y =
        clamp(
            rightPaddle.y,
            TABLE.top,
            maxY
        );
}

function updatePaddleMotion(
    stepScale = 1
) {

    for (
        const paddle of
        [
            leftPaddle,
            rightPaddle
        ]
    ) {

        paddle.vy =
            stepScale > 0

                ? (
                    paddle.y -
                    paddle.previousY
                ) /
                stepScale

                : 0;

        paddle.previousY =
            paddle.y;
    }
}


// ============================================================
// IA
// ============================================================

function aiMovementSensitivity() {

    const level =
        AI_LEVELS[
            aiDifficulty
        ];

    const limit =
        level.returns;

    const progress =
        clamp(
            aiReturns /
            limit,
            0,
            1
        );

    /*
        Cada dificultad parte de
        una capacidad distinta.

        A medida que devuelve,
        pierde capacidad de movimiento.

        5 / 10 / 20 determinan
        cuánto tarda en degradarse.
    */

    return Math.max(
        0.1,

        level.baseSensitivity *
        (
            1 -
            progress *
            0.78
        )
    );
}

function registerAIReturn(side) {

    if (
        gameMode !== "ai"
    ) {
        return;
    }

    if (aiVsAiEnabled) {

        autoplayAIBrains[
            side
        ].returns++;

        return;
    }

    if (
        side !==
        otherSide(
            humanSide
        )
    ) {
        return;
    }

    aiReturns++;
}

function reflectPredictedBallY(
    value
) {

    const radius =
        BALL.size / 2;

    const minY =
        TABLE.top +
        radius;

    const maxY =
        TABLE.bottom -
        radius;

    const span =
        maxY -
        minY;

    const cycle =
        span * 2;

    const offset =
        (
            (
                value -
                minY
            ) %
            cycle +
            cycle
        ) %
        cycle;

    return (
        offset <= span

            ? minY +
              offset

            : maxY -
              (
                  offset -
                  span
              )
    );
}

function predictedBallYAtPaddle(
    side,
    spinAwareness = 0
) {

    const paddle =
        sidePaddle(
            side
        );

    const ballCenterX =
        ball.x +
        BALL.size / 2;

    const ballCenterY =
        ball.y +
        BALL.size / 2;

    if (
        Math.abs(
            ball.vx
        ) <
        0.000001
    ) {
        return ballCenterY;
    }

    const targetX =
        side === "left"

            ? paddle.x +
              PADDLE.w +
              BALL.size / 2

            : paddle.x -
              BALL.size / 2;

    const travelSteps =
        (
            targetX -
            ballCenterX
        ) /
        ball.vx;

    if (travelSteps <= 0) {
        return ballCenterY;
    }

    const linearPrediction =
        reflectPredictedBallY(
        ballCenterY +
        ball.vy *
        travelSteps
    );

    if (
        !spinEnabled ||
        Math.abs(
            ball.spin
        ) <
            SPIN.epsilon ||
        spinAwareness <= 0
    ) {
        return linearPrediction;
    }

    const spinPrediction =
        spinPredictedBallYAtPaddle(
            side,
            linearPrediction
        );

    return (
        linearPrediction +
        (
            spinPrediction -
            linearPrediction
        ) *
        clamp(
            spinAwareness,
            0,
            1
        )
    );
}

function spinPredictedBallYAtPaddle(
    side,
    fallback
) {

    const paddle =
        sidePaddle(
            side
        );

    const radius =
        BALL.size / 2;

    const targetX =
        side === "left"

            ? paddle.x +
              PADDLE.w +
              radius

            : paddle.x -
              radius;

    let predictedX =
        ball.x;

    let predictedY =
        ball.y;

    let predictedVx =
        ball.vx;

    let predictedVy =
        ball.vy;

    let predictedSpin =
        ball.spin;


    const applyPredictedBounce =
        () => {

            const speed =
                Math.hypot(
                    predictedVx,
                    predictedVy
                );

            if (speed <= 0) {
                return;
            }

            const horizontalDirection =
                Math.sign(
                    predictedVx
                ) || 1;

            const verticalDirection =
                Math.sign(
                    predictedVy
                ) || 1;

            if (
                ball.shotType ===
                "topspin"
            ) {

                const verticalSpeed =
                    Math.min(
                        speed * 0.94,

                        Math.abs(
                            predictedVy
                        ) *
                        SPIN.topspinBounceVerticalBoost
                    );

                predictedVy =
                    verticalDirection *
                    verticalSpeed;

                predictedVx =
                    horizontalDirection *
                    Math.sqrt(
                        Math.max(
                            0,
                            speed * speed -
                            verticalSpeed *
                            verticalSpeed
                        )
                    );

            } else if (
                ball.shotType ===
                "backspin"
            ) {

                const horizontalSpeed =
                    Math.abs(
                        predictedVx
                    ) *
                    SPIN.backspinBounceHorizontalRetention;

                predictedVx =
                    horizontalDirection *
                    horizontalSpeed;

                predictedVy =
                    verticalDirection *
                    Math.sqrt(
                        Math.max(
                            0,
                            speed * speed -
                            horizontalSpeed *
                            horizontalSpeed
                        )
                    );
            }
        };


    for (
        let step = 0;
        step < 360;
        step++
    ) {

        if (
            Math.abs(
                predictedSpin
            ) >=
            SPIN.epsilon
        ) {

            const curveMultiplier =
                ball.shotType ===
                    "topspin"

                    ? SPIN.topspinCurveMultiplier
                    : ball.shotType ===
                        "backspin"

                        ? SPIN.backspinCurveMultiplier
                        : 1;

            const angle =
                predictedSpin *
                SPIN.curvePerStep *
                curveMultiplier;

            const cos =
                Math.cos(angle);

            const sin =
                Math.sin(angle);

            const vx =
                predictedVx;

            const vy =
                predictedVy;

            predictedVx =
                vx * cos -
                vy * sin;

            predictedVy =
                vx * sin +
                vy * cos;
        }

        predictedSpin *=
            SPIN.decay;

        if (
            Math.abs(
                predictedSpin
            ) <
            SPIN.epsilon
        ) {
            predictedSpin = 0;
        }

        predictedX +=
            predictedVx;

        predictedY +=
            predictedVy;


        if (
            predictedY <=
            TABLE.top
        ) {

            predictedY =
                TABLE.top;

            predictedVy =
                Math.abs(
                    predictedVy
                );

            predictedSpin *=
                SPIN.wallRetention;

            applyPredictedBounce();

        } else if (
            predictedY +
            BALL.size >=
            TABLE.bottom
        ) {

            predictedY =
                TABLE.bottom -
                BALL.size;

            predictedVy =
                -Math.abs(
                    predictedVy
                );

            predictedSpin *=
                SPIN.wallRetention;

            applyPredictedBounce();
        }


        const centerX =
            predictedX +
            radius;

        const reachedPaddle =
            side === "left"

                ? centerX <=
                  targetX

                : centerX >=
                  targetX;

        if (reachedPaddle) {

            return clamp(
                predictedY +
                radius,

                TABLE.top +
                radius,

                TABLE.bottom -
                radius
            );
        }
    }

    return fallback;
}

function aiFatigueRatio(
    level,
    returnCount = aiReturns
) {

    return clamp(
        returnCount /
        level.returns,
        0,
        1
    );
}

function chooseAIShotIntent(
    level,
    returnCount = aiReturns
) {

    const speed =
        Math.hypot(
            ball.vx,
            ball.vy
        );

    const fatigue =
        aiFatigueRatio(
            level,
            returnCount
        );


    /*
        Ante una pelota extrema o al final
        de su capacidad, la IA prioriza
        una devolución defensiva.
    */

    if (
        speed >= 27 ||
        fatigue >= 0.96
    ) {
        return "block";
    }

    const speedPressure =
        clamp(
            (
                speed -
                14
            ) /
            16,
            0,
            1
        );

    const blockChance =
        clamp(
            level.blockChance +
            speedPressure *
                0.12 +
            fatigue *
                0.14,
            0,
            0.85
        );

    const backspinChance =
        clamp(
            level.backspinChance,
            0,
            0.45
        );

    const roll =
        Math.random();

    if (roll < blockChance) {
        return "block";
    }

    if (
        roll <
        blockChance +
        backspinChance
    ) {
        return "backspin";
    }

    return "topspin";
}

function transitionAIState(
    nextState,
    level,
    paddle
) {

    if (
        aiState ===
        nextState
    ) {
        return;
    }

    aiState =
        nextState;

    aiCorrectionRemaining =
        0;


    if (
        nextState ===
        "arcadeTracking"
    ) {

        const fatigue =
            aiFatigueRatio(
                level
            );

        aiReactionRemaining =
            level.reactionSteps;

        aiAimY =
            paddle.y +
            PADDLE.h / 2;

        aiAimError =
            (
                Math.random() *
                2 -
                1
            ) *
            level.aimError *
            (
                1 +
                fatigue *
                0.75
            );

        aiShotIntent =
            chooseAIShotIntent(
                level
            );

        return;
    }


    aiReactionRemaining =
        0;

    aiAimError =
        0;

    aiShotIntent =
        "block";
}

function updateAITarget(
    aiSide,
    level,
    ballCenter,
    stepScale
) {

    if (
        aiReactionRemaining >
        0
    ) {

        aiReactionRemaining =
            Math.max(
                0,
                aiReactionRemaining -
                stepScale
            );

        return aiAimY;
    }


    aiCorrectionRemaining -=
        stepScale;

    if (
        aiCorrectionRemaining <=
        0
    ) {

        const prediction =
            predictedBallYAtPaddle(
                aiSide,
                level.spinAwareness
            );

        aiAimY =
            clamp(
                ballCenter +
                (
                    prediction -
                    ballCenter
                ) *
                level.anticipation +
                aiAimError,

                TABLE.top +
                PADDLE.h / 2,

                TABLE.bottom -
                PADDLE.h / 2
            );

        aiCorrectionRemaining =
            level.correctionSteps;
    }

    return aiAimY;
}

function updateAI(
    stepScale = 1
) {

    if (
        gameMode !== "ai"
    ) {
        return;
    }

    const aiSide =
        otherSide(
            humanSide
        );

    const paddle =
        sidePaddle(
            aiSide
        );

    const level =
        AI_LEVELS[
            aiDifficulty
        ];

    const sensitivity =
        aiMovementSensitivity();

    const endurance =
        1 -
        aiFatigueRatio(
            level
        ) *
        0.7;

    const ballCenter =
        ball.y +
        BALL.size / 2;

    const movingTowardAI =
        aiSide === "left"

            ? ball.vx < 0
            : ball.vx > 0;

    const nextState =
        movingTowardAI

            ? "arcadeTracking"
            : "recovering";

    transitionAIState(
        nextState,
        level,
        paddle
    );

    let target =
        H / 2;

    if (movingTowardAI) {

        target =
            updateAITarget(
                aiSide,
                level,
                ballCenter,
                stepScale
            );
    }

    const center =
        paddle.y +
        PADDLE.h / 2;

    const delta =
        target -
        center;


    /*
        La IA escala su capacidad
        con la velocidad REAL de la pelota.

        Así Difícil puede sobrevivir
        a la velocidad progresiva
        sin volverse invencible.
    */

    const ballDemand =
        Math.max(
            12,

            Math.abs(
                ball.vy
            ) *
            1.35 +

            Math.abs(
                ball.vx
            ) *
            0.38
        );


    /*
        La sensibilidad sigue
        reduciendo la capacidad.

        Al principio puede seguir
        incluso una pelota rápida.

        Al acercarse al límite de
        devoluciones empieza a quedarse.
    */

    const maxStep =
        ballDemand *
        level.demandScale *
        (
            0.28 +
            sensitivity *
            0.72
        ) *
        level.response *
        endurance;


    const tracking =
        level.tracking *
        (
            0.65 +
            sensitivity *
            0.35
        ) *
        (
            0.55 +
            endurance *
            0.45
        );


    const movement =
        clamp(
            delta *
            tracking,

            -maxStep,
            maxStep
        ) *
        stepScale;


    paddle.y +=
        clamp(
            movement,

            Math.min(
                0,
                delta
            ),

            Math.max(
                0,
                delta
            )
        );
}

function transitionAutoplayAIState(
    brain,
    nextState,
    level,
    paddle
) {

    if (
        brain.state ===
        nextState
    ) {
        return;
    }

    brain.state =
        nextState;

    brain.correctionRemaining =
        0;

    if (
        nextState ===
        "arcadeTracking"
    ) {

        const fatigue =
            aiFatigueRatio(
                level,
                brain.returns
            );

        brain.reactionRemaining =
            level.reactionSteps;

        brain.aimY =
            paddle.y +
            PADDLE.h / 2;

        brain.aimError =
            (
                Math.random() *
                2 -
                1
            ) *
            level.aimError *
            (
                1 +
                fatigue *
                0.75
            );

        brain.shotIntent =
            chooseAIShotIntent(
                level,
                brain.returns
            );

        return;
    }

    brain.reactionRemaining =
        0;

    brain.aimError =
        0;

    brain.shotIntent =
        "block";
}

function updateAutoplayAITarget(
    side,
    brain,
    level,
    ballCenter,
    stepScale
) {

    if (
        brain.reactionRemaining >
        0
    ) {

        brain.reactionRemaining =
            Math.max(
                0,
                brain.reactionRemaining -
                stepScale
            );

        return brain.aimY;
    }

    brain.correctionRemaining -=
        stepScale;

    if (
        brain.correctionRemaining <=
        0
    ) {

        const prediction =
            predictedBallYAtPaddle(
                side,
                level.spinAwareness
            );

        brain.aimY =
            clamp(
                ballCenter +
                (
                    prediction -
                    ballCenter
                ) *
                level.anticipation +
                brain.aimError,

                TABLE.top +
                PADDLE.h / 2,

                TABLE.bottom -
                PADDLE.h / 2
            );

        brain.correctionRemaining =
            level.correctionSteps;
    }

    return brain.aimY;
}

function updateAutoplayAI(
    side,
    stepScale = 1
) {

    const paddle =
        sidePaddle(
            side
        );

    const level =
        AI_LEVELS[
            aiDifficultyForSide(
                side
            )
        ];

    const brain =
        autoplayAIBrains[
            side
        ];

    const fatigue =
        aiFatigueRatio(
            level,
            brain.returns
        );

    const sensitivity =
        Math.max(
            0.1,
            level.baseSensitivity *
            (
                1 -
                fatigue *
                0.78
            )
        );

    const endurance =
        1 -
        fatigue *
        0.7;

    const ballCenter =
        ball.y +
        BALL.size / 2;

    const movingTowardAI =
        side === "left"

            ? ball.vx < 0
            : ball.vx > 0;

    const nextState =
        movingTowardAI

            ? "arcadeTracking"
            : "recovering";

    transitionAutoplayAIState(
        brain,
        nextState,
        level,
        paddle
    );

    let target =
        H / 2;

    if (movingTowardAI) {

        target =
            updateAutoplayAITarget(
                side,
                brain,
                level,
                ballCenter,
                stepScale
            );
    }

    const center =
        paddle.y +
        PADDLE.h / 2;

    const delta =
        target -
        center;

    const ballDemand =
        Math.max(
            12,

            Math.abs(
                ball.vy
            ) *
            1.35 +

            Math.abs(
                ball.vx
            ) *
            0.38
        );

    const maxStep =
        ballDemand *
        level.demandScale *
        (
            0.28 +
            sensitivity *
            0.72
        ) *
        level.response *
        endurance;

    const tracking =
        level.tracking *
        (
            0.65 +
            sensitivity *
            0.35
        ) *
        (
            0.55 +
            endurance *
            0.45
        );

    const movement =
        clamp(
            delta *
            tracking,

            -maxStep,
            maxStep
        ) *
        stepScale;

    paddle.y +=
        clamp(
            movement,

            Math.min(
                0,
                delta
            ),

            Math.max(
                0,
                delta
            )
        );
}

function updatePaddles(
    stepScale = 1
) {

    const onlineLobbyActive =
        startMenuOpen &&
        onlineMenuOpen &&
        [
            "waiting",
            "connecting",
            "countdown"
        ].includes(
            onlineSession.screen
        );

    if (onlineLobbyActive) {
        onlineLocalMove(
            stepScale
        );
        onlineRemoteMove(
            stepScale
        );
        clampPaddles();
        return;
    }

    if (
        startMenuOpen ||
        gamePaused ||
        gameOver ||
        !gameMode
    ) {
        return;
    }

    if (
        gameMode ===
        "local"
    ) {

        localMove(
            stepScale
        );

    } else if (
        gameMode ===
        "ai"
    ) {

        if (aiVsAiEnabled) {

            updateAutoplayAI(
                "left",
                stepScale
            );

            updateAutoplayAI(
                "right",
                stepScale
            );

        } else {

            humanMoveAI(
                stepScale
            );

            updateAI(
                stepScale
            );
        }

    } else if (
        gameMode ===
        "online"
    ) {

        onlineLocalMove(
            stepScale
        );

        onlineRemoteMove(
            stepScale
        );
    }

    clampPaddles();
}


// ============================================================
// COLISIONES
// ============================================================

function paddleCollision(
    paddle,
    side
) {

    const movingToward =
        side === "left"
            ? ball.vx < 0
            : ball.vx > 0;

    if (!movingToward) {
        return false;
    }

    return (
        ball.x +
            BALL.size >=
            paddle.x &&

        ball.x <=
            paddle.x +
            PADDLE.w &&

        ball.y +
            BALL.size >=
            paddle.y &&

        ball.y <=
            paddle.y +
            PADDLE.h
    );
}

function bouncePaddle(
    paddle,
    side
) {

    consecutiveWallBounces = 0;

    clearBallSpin();

    ball.x =
        side === "left"

            ? paddle.x +
              PADDLE.w

            : paddle.x -
              BALL.size;

    ball.vx =
        (
            side === "left"
                ? 1
                : -1
        ) *
        Math.abs(
            ball.vx
        );

    registerAIReturn(
        side
    );

    increaseBallSpeed();
    applyBallSpin(
        paddle,
        side
    );

    limitAIOutgoingAngle(
        side
    );

    registerReplaySpeedThreshold();

    markReplayReturn();
    paddleSound();
}


// ============================================================
// PELOTA
// ============================================================

function callLet() {

    if (letActive) {
        return;
    }

    clearLetTimer();

    letActive = true;
    consecutiveWallBounces = 0;

    ball.vx = 0;
    ball.vy = 0;
    clearBallSpin();
    resetReplayCapture();

    sendOnlineSnapshot(true);

    letTimer =
        setTimeout(
            () => {
                letTimer = null;
                letActive = false;

                resetBall();
                sendOnlineSnapshot(true);
            },
            LET.displayMs
        );
}

function registerWallBounce() {

    consecutiveWallBounces++;

    if (
        consecutiveWallBounces >
        LET.maxWallBounces
    ) {
        callLet();
        return true;
    }

    return false;
}

function updateBall(
    stepScale = 1
) {

    if (
        startMenuOpen ||
        gamePaused ||
        gameOver ||
        replayPlaying ||
        letActive ||
        !gameMode
    ) {
        return;
    }

    if (
        gameMode === "online" &&
        (
            onlineSession.role ===
                "guest" ||
            onlineSession.screen !==
                "playing"
        )
    ) {
        return;
    }

    updateBallSpin(
        stepScale
    );

    ball.x +=
        ball.vx *
        stepScale;

    ball.y +=
        ball.vy *
        stepScale;

    // PARED SUPERIOR

    if (
        ball.y <=
        TABLE.top
    ) {

        ball.y =
            TABLE.top;

        ball.vy =
            Math.abs(
                ball.vy
            );

        ball.spin *=
            SPIN.wallRetention;

        applySpinBounceResponse();

        wallSound();

        if (registerWallBounce()) {
            return;
        }


    // PARED INFERIOR

    } else if (
        ball.y +
        BALL.size >=
        TABLE.bottom
    ) {

        ball.y =
            TABLE.bottom -
            BALL.size;

        ball.vy =
            -Math.abs(
                ball.vy
            );

        ball.spin *=
            SPIN.wallRetention;

        applySpinBounceResponse();

        wallSound();

        if (registerWallBounce()) {
            return;
        }
    }


    // PALETA IZQUIERDA

    if (
        paddleCollision(
            leftPaddle,
            "left"
        )
    ) {

        bouncePaddle(
            leftPaddle,
            "left"
        );


    // PALETA DERECHA

    } else if (
        paddleCollision(
            rightPaddle,
            "right"
        )
    ) {

        bouncePaddle(
            rightPaddle,
            "right"
        );
    }


    if (!progressiveSpeed) {

        setBallSpeed(
            currentBallSpeed()
        );
    }


    captureReplayFrame(
        stepScale
    );

    // PUNTO DERECHA

    if (
        ball.x +
        BALL.size <
        TABLE.left
    ) {

        awardPoint(
            "right"
        );


    // PUNTO IZQUIERDA

    } else if (
        ball.x >
        TABLE.right
    ) {

        awardPoint(
            "left"
        );
    }
}


// ============================================================
// TECLADO
// ============================================================

function replaySkipKey(
    event
) {

    return (
        event.key ===
            "Escape" ||
        event.key ===
            "Enter" ||
        event.code ===
            "Space" ||
        event.key ===
            " "
    );
}

window.addEventListener(
    "keydown",
    event => {

        initAudio();


        if (replayPlaying) {

            if (
                replaySkipKey(
                    event
                )
            ) {
                event.preventDefault();

                if (
                    gameMode === "online"
                ) {
                    requestOnlineReplaySkip();
                } else {
                    finishReplay();
                }
            }

            return;
        }


        // REASIGNAR TECLA

        if (waitingForKey) {

            event.preventDefault();

            if (
                event.key ===
                "Escape"
            ) {

                waitingForKey =
                    null;

                closeMenusToGame(
                    true
                );

                return;
            }

            setRebindKey(
                waitingForKey,
                event.key
            );

            waitingForKey =
                null;

            return;
        }


        // MUTE

        if (
            event.key
                .toLowerCase() ===
            "m"
        ) {

            event.preventDefault();

            audioMuted =
                !audioMuted;

            return;
        }


        // ESC

        if (
            event.key ===
            "Escape"
        ) {

            event.preventDefault();

            handleEscape();

            return;
        }


        if (
            startMenuOpen &&
            onlineMenuOpen &&
            onlineSession.screen ===
                "waiting" &&
            (
                event.key === "Enter" ||
                event.code === "Space" ||
                event.key === " "
            )
        ) {
            event.preventDefault();
            launchOnlinePracticeBall();
            return;
        }


        if (
            (
                startMenuOpen &&
                !onlinePointerActive()
            ) ||
            gamePaused ||
            gameOver
        ) {
            return;
        }


        keys[
            event.key
        ] =
            true;


        if (
            event.key
                .startsWith(
                    "Arrow"
                )
        ) {
            event.preventDefault();
        }
    }
);

window.addEventListener(
    "keyup",
    event => {

        keys[
            event.key
        ] =
            false;
    }
);

function setRebindKey(
    id,
    key
) {

    if (
        gameMode ===
        "local"
    ) {

        const [
            side,
            action
        ] =
            id.split(":");

        localControls[
            side
        ][
            action
        ] =
            key;

    } else {

        aiControls[
            id
        ] =
            key;
    }
}


// ============================================================
// ESC / NAVEGACIÓN
// ============================================================

function closeMenusToGame(
    fromEscape = false
) {

    if (
        !gameMode ||
        startMenuOpen
    ) {
        return;
    }

    if (fromEscape) {

        escapeResumeTime =
            performance.now();
    }

    gamePaused = false;

    settingsOpen = false;
    controlsOpen = false;
    backgroundOpen = false;
    physicsOpen = false;
    ballOpen = false;
    replayOpen = false;
    languageOpen = false;

    confirmOpen = null;

    waitingForKey = null;
    hoveredButton = null;

    requestMouseCapture();
}

function handleEscape() {

    if (startMenuOpen) {

        if (startSettingsActive()) {

            closeStartSettings();
            return;
        }

        if (onlineMenuOpen) {

            goToStartMenu();
            return;
        }

        if (aiMenuOpen) {

            aiMenuOpen = false;
        }

        return;
    }

    if (gameOver) {
        return;
    }

    if (gameMode === "online") {
        return;
    }

    const submenuOpen =
        settingsOpen ||
        controlsOpen ||
        backgroundOpen ||
        physicsOpen ||
        ballOpen ||
        replayOpen ||
        languageOpen ||
        Boolean(
            confirmOpen
        );

    if (submenuOpen) {

        closeMenusToGame(
            true
        );

        return;
    }

    if (
        gamePaused &&
        performance.now() -
        pointerUnlockPauseTime <
        250
    ) {
        return;
    }

    if (
        gamePaused
    ) {

        closeMenusToGame(
            true
        );

        return;
    }

    gamePaused =
        true;

    releaseMouseCapture();
}


// ============================================================
// MOUSE Y TÁCTIL
// ============================================================

function touchControlsPreferred() {

    const coarsePointer =
        typeof window.matchMedia ===
            "function" &&
        window.matchMedia(
            "(pointer: coarse)"
        ).matches;

    const noHover =
        typeof window.matchMedia ===
            "function" &&
        window.matchMedia(
            "(hover: none)"
        ).matches;

    return (
        navigator.maxTouchPoints > 0 &&
        (
            coarsePointer ||
            noHover
        )
    );
}

function currentFullscreenElement() {

    return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        null
    );
}

function fullscreenSupported() {

    const root =
        document.documentElement;

    return Boolean(
        root.requestFullscreen ||
        root.webkitRequestFullscreen
    );
}

function toggleFullscreen() {

    if (
        currentFullscreenElement()
    ) {
        const exit =
            document.exitFullscreen ||
            document.webkitExitFullscreen;

        if (
            typeof exit === "function"
        ) {
            try {
                const request =
                    exit.call(document);

                if (
                    request &&
                    typeof request.catch ===
                        "function"
                ) {
                    request.catch(
                        () => {}
                    );
                }
            } catch {}
        }

        return;
    }

    const root =
        document.documentElement;

    const enter =
        root.requestFullscreen ||
        root.webkitRequestFullscreen;

    if (
        typeof enter !== "function"
    ) {
        return;
    }

    try {
        const request =
            enter.call(root, {
                navigationUI: "hide"
            });

        if (
            request &&
            typeof request.then ===
                "function"
        ) {
            request
                .then(
                    requestTouchLandscape
                )
                .catch(
                    () => {}
                );
        } else {
            requestTouchLandscape();
        }
    } catch {}
}

function requestTouchLandscape() {

    if (
        !touchControlsPreferred() ||
        !screen.orientation ||
        typeof screen.orientation.lock !==
            "function"
    ) {
        return;
    }

    try {
        const request =
            screen.orientation.lock(
                "landscape"
            );

        if (
            request &&
            typeof request.catch ===
                "function"
        ) {
            request.catch(
                () => {}
            );
        }
    } catch {}
}


// ============================================================
// MOUSE
// ============================================================

function onlinePointerActive() {

    return (
        gameMode === "online" ||
        (
            startMenuOpen &&
            onlineMenuOpen &&
            [
                "waiting",
                "connecting",
                "countdown"
            ].includes(
                onlineSession.screen
            )
        )
    );
}

function touchPaddleControlActive() {

    if (
        !touchControlsPreferred() ||
        gamePaused ||
        gameOver ||
        replayPlaying
    ) {
        return false;
    }

    if (onlinePointerActive()) {
        return [
            "waiting",
            "connecting",
            "countdown",
            "playing"
        ].includes(
            onlineSession.screen
        );
    }

    if (startMenuOpen) {
        return false;
    }

    if (gameMode === "ai") {
        return !aiVsAiEnabled;
    }

    return gameMode === "local";
}

function touchSideForPoint(point) {

    if (onlinePointerActive()) {
        return onlineSession.side;
    }

    if (
        gameMode === "ai" &&
        !aiVsAiEnabled
    ) {
        return humanSide;
    }

    if (gameMode === "local") {
        return (
            point.x < W / 2
                ? "left"
                : "right"
        );
    }

    return null;
}

function moveTouchPaddle(
    event,
    side
) {

    const {
        y
    } =
        mousePos(event);

    const paddle =
        sidePaddle(side);

    paddle.y =
        clamp(
            y -
            PADDLE.h / 2,
            TABLE.top,
            TABLE.bottom -
            PADDLE.h
        );

    if (
        gameMode === "online" &&
        onlineSession.role ===
            "guest" &&
        side === onlineSession.side
    ) {
        onlineTransport()?.sendInput({
            targetY: paddle.y
        });
    }
}

function mouseControlActive() {

    if (onlinePointerActive()) {
        return true;
    }

    if (
        gameMode === "ai"
    ) {
        return (
            !aiVsAiEnabled &&
            aiControls.mouse
        );
    }

    if (
        gameMode === "local"
    ) {

        return (
            localControls.left.mouse ||
            localControls.right.mouse
        );
    }

    return false;
}

function moveMousePaddles(
    delta
) {

    const onlineActive =
        onlinePointerActive();

    if (
        (
            startMenuOpen &&
            !onlineActive
        ) ||
        gamePaused ||
        gameOver ||
        replayPlaying ||
        !Number.isFinite(delta)
    ) {
        return;
    }


    // VS IA

    if (onlineActive) {

        sidePaddle(
            onlineSession.side
        ).y +=
            delta *
            (
                0.75 +
                SENS.default *
                2
            );

    } else if (
        gameMode === "ai" &&
        !aiVsAiEnabled &&
        aiControls.mouse
    ) {

        sidePaddle(
            humanSide
        ).y +=
            delta *
            (
                0.75 +
                aiControls.sensitivity *
                2
            );


    // PVP LOCAL

    } else if (
        gameMode === "local"
    ) {

        for (
            const side of
            [
                "left",
                "right"
            ]
        ) {

            const controls =
                localControls[side];

            if (
                controls.mouse
            ) {

                sidePaddle(
                    side
                ).y +=
                    delta *
                    (
                        0.75 +
                        controls.sensitivity *
                        2
                    );
            }
        }
    }

    clampPaddles();
}

function queueMouseMovement(
    delta
) {

    if (
        (
            startMenuOpen &&
            !onlinePointerActive()
        ) ||
        gamePaused ||
        gameOver ||
        replayPlaying ||
        !Number.isFinite(delta)
    ) {
        return;
    }

    pendingMouseDelta +=
        delta;
}

function requestMouseCapture() {

    if (
        (
            startMenuOpen &&
            !onlinePointerActive()
        ) ||
        gamePaused ||
        gameOver ||
        replayPlaying ||
        touchControlsPreferred() ||
        !mouseControlActive() ||
        document.pointerLockElement ===
            canvas ||
        typeof canvas.requestPointerLock !==
            "function"
    ) {
        return;
    }

    previousMouseY =
        null;

    pendingMouseDelta =
        0;

    let request =
        null;

    try {

        request =
            canvas.requestPointerLock();

    } catch {
        return;
    }

    if (
        request &&
        typeof request.catch ===
            "function"
    ) {
        request.catch(
            () => {}
        );
    }
}

function releaseMouseCapture() {

    if (
        document.pointerLockElement ===
            canvas &&
        typeof document.exitPointerLock ===
            "function"
    ) {
        document.exitPointerLock();
    }

    previousMouseY =
        null;

    pendingMouseDelta =
        0;
}

document.addEventListener(
    "mousemove",
    event => {

        if (
            document.pointerLockElement !==
            canvas
        ) {
            return;
        }

        const rect =
            canvas.getBoundingClientRect();

        const delta =
            event.movementY *
            H /
            rect.height;

        queueMouseMovement(
            delta
        );
    }
);

document.addEventListener(
    "pointerlockchange",
    () => {

        previousMouseY =
            null;

        if (
            document.pointerLockElement ===
            canvas
        ) {
            onlineSession.pointerHint =
                false;
        }

        if (
            document.pointerLockElement !==
                canvas &&
            !startMenuOpen &&
            !gamePaused &&
            !gameOver &&
            !replayPlaying &&
            performance.now() -
                replayFinishTime >
                250 &&
            performance.now() -
                escapeResumeTime >
                250 &&
            mouseControlActive() &&
            !touchControlsPreferred()
        ) {

            if (
                gameMode === "online"
            ) {
                onlineSession.pointerHint =
                    true;
            } else {
                gamePaused =
                    true;

                pointerUnlockPauseTime =
                    performance.now();
            }
        }
    }
);

canvas.addEventListener(
    "pointerdown",
    event => {

        if (
            event.pointerType !==
                "touch"
        ) {
            return;
        }

        const point =
            mousePos(event);

        const now =
            performance.now();

        if (
            event.isPrimary !== false &&
            lastFullscreenTouchPoint &&
            now -
                lastFullscreenTouchTime <=
                340 &&
            Math.hypot(
                point.x -
                    lastFullscreenTouchPoint.x,
                point.y -
                    lastFullscreenTouchPoint.y
            ) <= 80 &&
            fullscreenSupported()
        ) {
            lastFullscreenTouchTime =
                -Infinity;

            lastFullscreenTouchPoint =
                null;

            suppressCanvasClickUntil =
                now + 600;

            lastTouchInteractionTime =
                now;

            event.preventDefault();
            toggleFullscreen();
            return;
        }

        if (
            event.isPrimary !== false
        ) {
            lastFullscreenTouchTime =
                now;

            lastFullscreenTouchPoint = {
                x: point.x,
                y: point.y
            };
        }

        if (
            !touchPaddleControlActive()
        ) {
            return;
        }

        const touchingButton =
            interactiveItems()
                .some(
                    item =>
                        inside(
                            point.x,
                            point.y,
                            item.hitRect ||
                            item.rect
                        )
                );

        if (touchingButton) {
            return;
        }

        lastTouchInteractionTime =
            now;

        if (
            onlinePointerActive() &&
            onlineSession.screen ===
                "waiting"
        ) {
            launchOnlinePracticeBall();
        }

        const side =
            touchSideForPoint(
                point
            );

        if (
            !side ||
            [
                ...activeTouchPointers
                    .values()
            ].includes(side)
        ) {
            return;
        }

        activeTouchPointers.set(
            event.pointerId,
            side
        );

        try {
            canvas.setPointerCapture(
                event.pointerId
            );
        } catch {}

        event.preventDefault();

        moveTouchPaddle(
            event,
            side
        );
    },
    {
        passive: false
    }
);

canvas.addEventListener(
    "pointermove",
    event => {

        if (
            event.pointerType !==
                "touch"
        ) {
            return;
        }

        const side =
            activeTouchPointers.get(
                event.pointerId
            );

        if (!side) {
            return;
        }

        event.preventDefault();

        moveTouchPaddle(
            event,
            side
        );
    },
    {
        passive: false
    }
);

const releaseTouchPaddle =
    event => {

        if (
            !activeTouchPointers.has(
                event.pointerId
            )
        ) {
            return;
        }

        event.preventDefault();

        activeTouchPointers.delete(
            event.pointerId
        );
    };

canvas.addEventListener(
    "pointerup",
    releaseTouchPaddle,
    {
        passive: false
    }
);

canvas.addEventListener(
    "pointercancel",
    releaseTouchPaddle,
    {
        passive: false
    }
);

window.addEventListener(
    "blur",
    () => {
        activeTouchPointers.clear();
    }
);

canvas.addEventListener(
    "mousemove",
    event => {

        if (
            document.pointerLockElement ===
            canvas
        ) {
            return;
        }

        const {
            x,
            y
        } =
            mousePos(event);


        if (
            (
                !startMenuOpen ||
                onlinePointerActive()
            ) &&
            !gamePaused &&
            !gameOver &&
            previousMouseY !==
                null
        ) {

            const delta =
                y -
                previousMouseY;


            queueMouseMovement(
                delta
            );
        }


        previousMouseY =
            y;


        updateHover(
            x,
            y
        );


        if (activeSlider) {

            const slider =
                interactiveItems()
                    .find(
                        item =>
                            item.id ===
                                activeSlider &&

                            item.type ===
                                "slider"
                    );

            if (slider) {

                updateSlider(
                    slider,
                    x
                );
            }
        }
    }
);

window.addEventListener(
    "mouseup",
    () => {

        activeSlider =
            null;
    }
);

canvas.addEventListener(
    "mousedown",
    event => {

        if (replayPlaying) {
            return;
        }

        const {
            x,
            y
        } =
            mousePos(event);

        const slider =
            interactiveItems()
                .find(
                    item =>
                        item.type ===
                            "slider" &&

                        inside(
                            x,
                            y,
                            item.hitRect ||
                            item.rect
                        )
                );

        if (!slider) {
            return;
        }

        activeSlider =
            slider.id;

        updateSlider(
            slider,
            x
        );
    }
);

canvas.addEventListener(
    "click",
    event => {

        const now =
            performance.now();

        if (
            now <
            suppressCanvasClickUntil
        ) {
            event.preventDefault();
            return;
        }

        if (
            event.detail >= 2 &&
            fullscreenSupported()
        ) {
            toggleFullscreen();
            return;
        }

        if (replayPlaying) {

            if (
                gameMode === "online"
            ) {
                requestOnlineReplaySkip();
            } else {
                finishReplay();
            }

            return;
        }

        const {
            x,
            y
        } =
            mousePos(event);

        const hit =
            interactiveItems()
                .find(
                    item =>
                        inside(
                            x,
                            y,
                            item.hitRect ||
                            item.rect
                        )
                );

        if (
            hit &&
            !hit.disabled &&
            hit.type !==
                "slider"
        ) {

            handleAction(
                hit.id
            );

        } else {

            if (
                performance.now() -
                    lastTouchInteractionTime >
                500
            ) {
                launchOnlinePracticeBall();
            }

            requestMouseCapture();
        }
    }
);


// ============================================================
// UI DATA
// ============================================================

function buttonRect(
    index,
    count,
    width = 320,
    height = 58,
    gap = 16,
    centerY = 390
) {

    const total =
        count *
        height +
        (
            count -
            1
        ) *
        gap;

    return {
        x:
            (W - width) /
            2,

        y:
            centerY -
            total / 2 +
            index *
            (
                height +
                gap
            ),

        w:
            width,

        h:
            height
    };
}

function addSlider(
    items,
    id,
    label,
    value,
    min,
    max,
    rect,
    displayValue = null
) {

    items.push({
        id,
        label,
        value,
        displayValue,
        min,
        max,
        rect,

        type:
            "slider",

        hitRect: {
            x:
                rect.x - 10,

            y:
                rect.y - 30,

            w:
                rect.w + 20,

            h:
                rect.h + 50
        }
    });
}

function interactiveItems() {

    const items = [];

    const add = (
        id,
        text,
        rect,
        disabled = false
    ) => {

        items.push({
            id,
            text,
            rect,
            disabled,
            type: "button"
        });
    };

    // PVP ONLINE

    if (
        startMenuOpen &&
        onlineMenuOpen
    ) {

        if (
            onlineSession.screen ===
            "menu"
        ) {
            add(
                "onlineJoin",
                t("onlineJoin"),
                buttonRect(
                    0,
                    3,
                    390,
                    56,
                    16,
                    430
                )
            );

            add(
                "onlineHost",
                t("onlineSelectSide"),
                buttonRect(
                    1,
                    3,
                    390,
                    56,
                    16,
                    430
                )
            );

            add(
                "onlineBack",
                t("back"),
                buttonRect(
                    2,
                    3,
                    390,
                    56,
                    16,
                    430
                )
            );

            return items;
        }

        if (
            onlineSession.screen ===
            "waiting"
        ) {
            add(
                "onlineSide",
                `${t("side")}: ${
                    onlineSession.side ===
                    "left"

                        ? t("left")
                        : t("right")
                }`,
                {
                    x: W / 2 - 190,
                    y: 530,
                    w: 380,
                    h: 52
                }
            );
        }

        if (
            onlineSession.screen !==
            "countdown"
        ) {
            add(
                "onlineBack",
                t("back"),
                {
                    x: W / 2 - 120,
                    y:
                        onlineSession.screen ===
                        "waiting"

                            ? 600
                            : 570,
                    w: 240,
                    h: 52
                }
            );
        }

        return items;
    }

    // MENU INICIAL

    if (
        startMenuOpen &&
        !aiMenuOpen &&
        !startSettingsActive()
    ) {

        add(
            "ai",
            t("vsAi"),
            buttonRect(
                0,
                4,
                340,
                50,
                12,
                420
            )
        );

        add(
            "local",
            t("localPvp"),
            buttonRect(
                1,
                4,
                340,
                50,
                12,
                420
            )
        );

        add(
            "online",
            t("onlinePvp"),
            buttonRect(
                2,
                4,
                340,
                50,
                12,
                420
            )
        );

        add(
            "startSettings",
            t("settings"),
            buttonRect(
                3,
                4,
                340,
                50,
                12,
                420
            )
        );

        return items;
    }


    // MENU IA

    if (
        startMenuOpen &&
        aiMenuOpen
    ) {

        add(
            "side",

            `${t("side")}: ${
                humanSide ===
                "left"

                    ? t("left")
                    : t("right")
            }`,

            buttonRect(
                0,
                5,
                360,
                54,
                13,
                480
            )
        );

        add(
            "easy",
            t("easy"),
            buttonRect(
                1,
                5,
                360,
                54,
                13,
                480
            )
        );

        add(
            "normal",
            t("normal"),
            buttonRect(
                2,
                5,
                360,
                54,
                13,
                480
            )
        );

        add(
            "hard",
            t("hard"),
            buttonRect(
                3,
                5,
                360,
                54,
                13,
                480
            )
        );

        add(
            "aiBack",
            t("back"),
            buttonRect(
                4,
                5,
                360,
                54,
                13,
                480
            )
        );

        return items;
    }


    // VICTORIA

    if (gameOver) {

        const difficultySelectable =
            gameMode === "ai" &&
            !aiVsAiEnabled;

        if (difficultySelectable) {

            add(
                "victoryDifficulty",

                `${t("difficulty")}: ${difficultyLabel(
                    aiDifficulty
                )}`,

                {
                    x:
                        W / 2 - 180,

                    y:
                        H / 2 + 30,

                    w: 360,
                    h: 52
                }
            );
        }

        if (gameMode === "online") {
            add(
                "onlineRematch",
                `${t("rematch")} ${
                    (
                        onlineSession
                            .localRematchReady ||
                        onlineSession
                            .remoteRematchReady
                    )

                        ? "✓"
                        : "□"
                }`,
                {
                    x:
                        W / 2 - 150,
                    y:
                        H / 2 + 55,
                    w: 300,
                    h: 60
                }
            );

        } else {
            add(
                "revenge",
                t("rematch"),
                {
                    x:
                        W / 2 - 130,

                    y:
                        H / 2 +
                        (
                            difficultySelectable

                                ? 95
                                : 55
                        ),

                    w: 260,
                    h: 60
                }
            );
        }

        add(
            gameMode === "online"

                ? "onlineReturn"
                : "victoryMenu",

            gameMode === "online"

                ? t("back")
                : t("mainMenu"),

            {
                x:
                    W / 2 - 130,

                y:
                    H / 2 +
                    (
                        gameMode === "online"

                            ? 135
                            : difficultySelectable

                                ? 175
                                : 135
                    ),

                w: 260,
                h: 52
            }
        );

        return items;
    }


    // CONFIRMACION

    if (confirmOpen) {

        add(
            "confirmYes",
            t("yes"),
            {
                x:
                    W / 2 - 200,

                y:
                    H / 2 + 40,

                w: 180,
                h: 55
            }
        );

        add(
            "confirmNo",
            t("no"),
            {
                x:
                    W / 2 + 20,

                y:
                    H / 2 + 40,

                w: 180,
                h: 55
            }
        );

        return items;
    }


    // CONTROLES

    if (controlsOpen) {

        return (
            gameMode ===
            "local"

                ? localControlItems(
                    items,
                    add
                )

                : aiControlItems(
                    items,
                    add
                )
        );
    }


    // FONDO

    if (backgroundOpen) {

        [
            ["green", t("green")],
            ["blue", t("blue")],
            ["black", t("black")],
            [
                "scorePosition",
                `${t("score")}: ${t(
                    scorePosition
                )}`
            ],
            ["backgroundBack", t("back")]

        ].forEach(
            (
                [
                    id,
                    text
                ],
                index
            ) => {

                add(
                    id,
                    text,

                    buttonRect(
                        index,
                        5,
                        280,
                        55,
                        15,
                        380
                    )
                );
            }
        );

        return items;
    }

    // PELOTA

    if (ballOpen) {

        [
            [
                "ballColor",
                `${t("color")}: ${t(
                    ballColor
                )}`
            ],

            [
                "ballShape",
                `${t("shape")}: ${t(
                    ballShape
                )}`
            ],

            [
                "ballDefaults",
                t("defaults")
            ],

            [
                "ballBack",
                t("back")
            ]

        ].forEach(
            (
                [
                    id,
                    text
                ],
                index
            ) => {

                add(
                    id,
                    text,

                    buttonRect(
                        index,
                        4,
                        430,
                        58,
                        15,
                        390
                    )
                );
            }
        );

        return items;
    }

    // FISICAS

    if (physicsOpen) {

        addSlider(
            items,
            "ballSpeed",
            t("velocity"),
            ballSpeedLevel,
            1,
            10,
            {
                x:
                    W / 2 - 180,

                y: 170,

                w: 360,
                h: 20
            },
            initialBallSpeedText()
        );

        add(
            "progressive",

            `${t("progressive")}: ${
                progressiveSpeed
                    ? "ON"
                    : "OFF"
            }`,

            {
                x:
                    W / 2 - 230,

                y: 240,

                w: 460,
                h: 55
            }
        );

        add(
            "spin",

            `SPIN: ${
                spinEnabled
                    ? "ON"
                    : "OFF"
            }`,

            {
                x:
                    W / 2 - 230,

                y: 320,

                w: 460,
                h: 55
            },
            false
        );

        add(
            "physicsReset",
            t("resetDefaults"),
            {
                x:
                    W / 2 - 190,

                y: 415,

                w: 380,
                h: 50
            }
        );

        add(
            "physicsBack",
            t("back"),
            {
                x:
                    W / 2 - 110,

                y: 480,

                w: 220,
                h: 50
            }
        );

        return items;
    }


    // REPETICIÓN

    if (replayOpen) {

        add(
            "replayAuto",

            `${t("replayAuto")}: ${
                replayAutoEnabled
                    ? "ON"
                    : "OFF"
            }`,

            {
                x: 330,
                y: 125,
                w: 620,
                h: 50
            }
        );

        REPLAY.modeOptions
            .forEach(
                (
                    mode,
                    index
                ) => {

                    add(
                        `replayMode:${mode}`,

                        `${replayModeLabel(
                            mode
                        )}${
                            replayMode ===
                            mode

                                ? ` · ${t("active")}`
                                : ""
                        }`,

                        {
                            x: 315,
                            y:
                                225 +
                                index * 54,
                            w: 650,
                            h: 46
                        }
                    );
                }
            );

        add(
            "replayDefaults",
            t("defaults"),
            {
                x: 390,
                y: 465,
                w: 500,
                h: 46
            }
        );

        add(
            "replayBack",
            t("back"),
            {
                x: 500,
                y: 525,
                w: 280,
                h: 46
            }
        );

        return items;
    }


    // IDIOMA

    if (languageOpen) {

        [
            ["langAuto", "auto", t("automatic")],
            ["langEs", "es", t("spanish")],
            ["langEn", "en", t("english")]

        ].forEach(
            (
                [
                    id,
                    mode,
                    label
                ],
                index
            ) => {

                add(
                    id,

                    mode === languageMode

                        ? `${label} · ${t("active")}`
                        : label,

                    buttonRect(
                        index,
                        4,
                        360,
                        55,
                        15,
                        380
                    )
                );
            }
        );

        add(
            "languageBack",
            t("back"),
            buttonRect(
                3,
                4,
                360,
                55,
                15,
                380
            )
        );

        return items;
    }


    // AJUSTES

    if (settingsOpen) {

        [
            [
                "controls",
                t("controls")
            ],

            [
                "background",
                t("background")
            ],

            [
                "ballSettings",
                t("ball")
            ],

            [
                "physics",
                t("physics")
            ],

            [
                "fps",
                `FPS: ${physicsFps}`
            ],

            [
                "replay",
                t("replay")
            ],

            [
                "language",
                `${t("language")}: ${languageModeLabel()}`
            ],

            [
                "sound",

                `${t("sound")}: ${
                    audioMuted
                        ? "OFF"
                        : "ON"
                }`
            ],

            [
                "classicPong",
                t(
                    classicPongMode
                        ? "argenPong"
                        : "classicPong"
                )
            ],

            [
                "settingsBack",
                t("back")
            ]

        ].forEach(
            (
                [
                    id,
                    text
                ],
                index
            ) => {

                add(
                    id,
                    text,

                    buttonRect(
                        index,
                        10,
                        430,
                        39,
                        5,
                        390
                    )
                );
            }
        );

        return items;
    }


    // PAUSA

    if (gamePaused) {

        [
            [
                "continue",
                t("continue")
            ],

            [
                "restart",
                t("restart")
            ],

            [
                "mainMenu",
                t("mainMenu")
            ],

            [
                "settings",
                t("settings")
            ]

        ].forEach(
            (
                [
                    id,
                    text
                ],
                index
            ) => {

                add(
                    id,
                    text,

                    buttonRect(
                        index,
                        4,
                        330,
                        58,
                        15,
                        390
                    )
                );
            }
        );
    }

    return items;
}


// ============================================================
// CONTROLES PVP
// ============================================================

function localControlItems(
    items,
    add
) {

    const columns = {
        left: 140,
        right: 720
    };

    for (
        const side of
        [
            "left",
            "right"
        ]
    ) {

        const x =
            columns[side];

        const controls =
            localControls[
                side
            ];


        add(
            `${side}:up`,

            waitingForKey ===
            `${side}:up`

                ? t("press")
                : formatKey(
                    controls.up
                ),

            {
                x:
                    x + 125,

                y: 175,

                w: 180,
                h: 42
            }
        );


        add(
            `${side}:down`,

            waitingForKey ===
            `${side}:down`

                ? t("press")
                : formatKey(
                    controls.down
                ),

            {
                x:
                    x + 125,

                y: 235,

                w: 180,
                h: 42
            }
        );


        add(
            `${side}:mouse`,

            controls.mouse
                ? "ON"
                : "OFF",

            {
                x:
                    x + 125,

                y: 295,

                w: 180,
                h: 42
            }
        );


        add(
            `${side}:sensMinus`,
            "-",
            {
                x:
                    x + 125,

                y: 365,

                w: 45,
                h: 42
            }
        );


        add(
            `${side}:sensPlus`,
            "+",
            {
                x:
                    x + 260,

                y: 365,

                w: 45,
                h: 42
            }
        );
    }


    add(
        "localControlsReset",
        t("resetDefaults"),
        {
            x:
                W / 2 - 185,

            y: 520,

            w: 370,
            h: 50
        }
    );


    add(
        "controlsBack",
        t("back"),
        {
            x:
                W / 2 - 110,

            y: 590,

            w: 220,
            h: 50
        }
    );

    return items;
}


// ============================================================
// CONTROLES VS IA
// ============================================================

function aiControlItems(
    items,
    add
) {

    const x =
        570;

    add(
        "aiVsAi",

        `${t("aiVsAi")}: ${
            aiVsAiEnabled
                ? "ON"
                : "OFF"
        }`,

        {
            x:
                W / 2 - 210,

            y:
                aiVsAiEnabled
                    ? 135
                    : 430,

            w: 420,
            h: 48
        }
    );


    if (aiVsAiEnabled) {

        add(
            "aiLeftDifficulty",

            `${t("aiLeft")}: ${
                difficultyLabel(
                    aiLeftDifficulty
                )
            }`,

            {
                x: 155,
                y: 280,
                w: 430,
                h: 58
            }
        );

        add(
            "aiRightDifficulty",

            `${t("aiRight")}: ${
                difficultyLabel(
                    aiRightDifficulty
                )
            }`,

            {
                x: 695,
                y: 280,
                w: 430,
                h: 58
            }
        );

    } else {

    add(
        "up1",

        waitingForKey ===
        "up1"

            ? t("press")
            : formatKey(
                aiControls.up1
            ),

        {
            x,
            y: 175,

            w: 95,
            h: 42
        }
    );


    add(
        "up2",

        waitingForKey ===
        "up2"

            ? t("press")
            : formatKey(
                aiControls.up2
            ),

        {
            x:
                x + 105,

            y: 175,

            w: 95,
            h: 42
        }
    );


    add(
        "down1",

        waitingForKey ===
        "down1"

            ? t("press")
            : formatKey(
                aiControls.down1
            ),

        {
            x,
            y: 235,

            w: 95,
            h: 42
        }
    );


    add(
        "down2",

        waitingForKey ===
        "down2"

            ? t("press")
            : formatKey(
                aiControls.down2
            ),

        {
            x:
                x + 105,

            y: 235,

            w: 95,
            h: 42
        }
    );


    add(
        "aiMouse",

        aiControls.mouse
            ? "ON"
            : "OFF",

        {
            x,
            y: 295,

            w: 200,
            h: 42
        }
    );


    add(
        "aiSensMinus",
        "-",
        {
            x,
            y: 365,

            w: 45,
            h: 42
        }
    );


    add(
        "aiSensPlus",
        "+",
        {
            x:
                x + 155,

            y: 365,

            w: 45,
            h: 42
        }
    );

    }


    add(
        "aiControlsReset",
        t("resetDefaults"),
        {
            x:
                W / 2 - 185,

            y: 520,

            w: 370,
            h: 50
        }
    );


    add(
        "controlsBack",
        t("back"),
        {
            x:
                W / 2 - 110,

            y: 590,

            w: 220,
            h: 50
        }
    );

    return items;
}


// ============================================================
// SLIDER
// ============================================================

function updateSlider(
    slider,
    mouseX
) {

    const ratio =
        clamp(
            (
                mouseX -
                slider.rect.x
            ) /
            slider.rect.w,

            0,
            1
        );


    if (
        slider.id ===
        "ballSpeed"
    ) {

        ballSpeedLevel =
            clamp(
                Math.round(
                    1 +
                    ratio *
                    9
                ),

                1,
                10
            );


        if (
            gameMode &&
            !gameOver
        ) {

            resetBall();
        }
    }
}


// ============================================================
// ACCIONES
// ============================================================

function handleAction(id) {

    initAudio();


    if (
        id === "fullscreen"
    ) {
        toggleFullscreen();
        return;
    }


    if (
        id ===
        "startSettings"
    ) {
        settingsFromStart = true;
        settingsOpen = true;
        aiMenuOpen = false;
        onlineMenuOpen = false;
        return;
    }


    if (
        id ===
        "online"
    ) {
        requestTouchLandscape();

        onlineMenuOpen = true;
        onlineSession.screen = "menu";
        onlineSession.queueMode = null;
        onlineSession.errorKey = null;
        resetPaddles();
        startOnlineStatsPolling();
        return;
    }


    if (
        id === "onlineJoin"
    ) {
        clearOnlineStatsPolling();

        onlineSession.queueMode =
            "join";
        onlineSession.screen =
            "searching";
        onlineSession.errorKey = null;

        onlineTransport()?.join();
        return;
    }


    if (
        id === "onlineHost"
    ) {
        clearOnlineStatsPolling();

        onlineSession.queueMode =
            "host";
        onlineSession.side = "left";
        humanSide = "left";
        onlineSession.screen =
            "waiting";
        onlineSession.errorKey = null;
        resetOnlinePractice();
        resetPaddles();

        onlineTransport()?.host(
            onlineSession.side
        );

        return;
    }


    if (
        id === "onlineSide"
    ) {
        onlineSession.side =
            otherSide(
                onlineSession.side
            );
        humanSide =
            onlineSession.side;
        resetOnlinePractice();
        resetPaddles();

        onlineTransport()?.updateSide(
            onlineSession.side
        );
        return;
    }


    if (
        id === "onlineBack"
    ) {
        if (
            onlineSession.screen ===
            "menu"
        ) {
            goToStartMenu();
        } else {
            goToOnlineMenu();
        }
        return;
    }


    if (
        id ===
        "local"
    ) {

        startGame(
            "local"
        );

        return;
    }


    if (
        id ===
        "ai"
    ) {

        aiMenuOpen =
            true;

        humanSide =
            "left";

        return;
    }


    if (
        id ===
        "side"
    ) {

        humanSide =
            otherSide(
                humanSide
            );

        return;
    }


    if (
        [
            "easy",
            "normal",
            "hard"
        ].includes(id)
    ) {

        startGame(
            "ai",
            humanSide,
            id
        );

        return;
    }


    if (
        id ===
        "aiBack"
    ) {

        aiMenuOpen =
            false;

        return;
    }


    if (
        id ===
        "continue"
    ) {

        gamePaused =
            false;

        requestMouseCapture();

        return;
    }


    if (
        id ===
        "restart"
    ) {

        confirmOpen =
            "restart";

        return;
    }


    if (
        id ===
        "mainMenu"
    ) {

        confirmOpen =
            "menu";

        return;
    }


    if (
        id ===
        "settings"
    ) {

        settingsOpen =
            true;

        return;
    }


    if (
        id ===
        "confirmYes"
    ) {

        const action =
            confirmOpen;

        confirmOpen =
            null;

        if (
            action ===
            "restart"
        ) {

            resetMatch();

        } else {

            goToStartMenu();
        }

        return;
    }


    if (
        id ===
        "confirmNo"
    ) {

        confirmOpen =
            null;

        return;
    }


    if (
        id ===
        "controls"
    ) {

        controlsOpen =
            true;

        return;
    }


    if (
        id ===
        "background"
    ) {

        backgroundOpen =
            true;

        return;
    }


    if (
        id ===
        "physics"
    ) {

        physicsOpen =
            true;

        return;
    }


    if (
        id ===
        "ballSettings"
    ) {

        ballOpen =
            true;

        return;
    }


    if (
        id ===
        "ballColor"
    ) {


        ballColor =
            ballColor === "white"

                ? "orange"
                : "white";

        return;
    }


    if (
        id ===
        "ballShape"
    ) {


        setBallShape(
            ballShape === "round"

                ? "square"
                : "round"
        );

        return;
    }


    if (
        id ===
        "ballDefaults"
    ) {

        resetBallAppearance();

        return;
    }


    if (
        id ===
        "ballBack"
    ) {

        ballOpen =
            false;

        return;
    }


    if (
        id ===
        "fps"
    ) {

        setPhysicsFps(
            physicsFps === 60

                ? 120
                : 60
        );

        return;
    }


    if (
        id ===
        "replay"
    ) {

        replayOpen =
            true;

        return;
    }


    if (
        id ===
        "language"
    ) {

        languageOpen =
            true;

        return;
    }


    if (
        id ===
        "sound"
    ) {

        audioMuted =
            !audioMuted;

        return;
    }


    if (
        id ===
        "settingsBack"
    ) {

        if (settingsFromStart) {
            closeStartSettings();
        } else {
            settingsOpen =
                false;
        }

        return;
    }


    if (
        id ===
        "controlsBack"
    ) {

        controlsOpen =
            false;

        waitingForKey =
            null;

        return;
    }


    if (
        id ===
        "scorePosition"
    ) {


        scorePosition =
            scorePosition === "bottom"

                ? "top"
                : "bottom";

        return;
    }


    if (
        id ===
        "backgroundBack"
    ) {

        backgroundOpen =
            false;

        return;
    }


    if (
        id ===
        "physicsBack"
    ) {

        physicsOpen =
            false;

        return;
    }

    if (
        id ===
        "replayAuto"
    ) {

        replayAutoEnabled =
            !replayAutoEnabled;

        return;
    }


    if (
        id.startsWith(
            "replayMode:"
        )
    ) {

        const nextMode =
            id.split(":")[1];

        if (
            REPLAY.modeOptions
                .includes(
                    nextMode
                )
        ) {

            replayMode =
                nextMode;
        }

        return;
    }


    if (
        id ===
        "replayDefaults"
    ) {

        replayAutoEnabled =
            REPLAY.defaultEnabled;

        replayMode =
            REPLAY.defaultMode;

        return;
    }


    if (
        id ===
        "replayBack"
    ) {

        replayOpen =
            false;

        return;
    }


    if (
        id ===
        "languageBack"
    ) {

        languageOpen =
            false;

        return;
    }


    const languageActions = {
        langAuto: "auto",
        langEs: "es",
        langEn: "en"
    };

    if (
        languageActions[id]
    ) {

        languageMode =
            languageActions[id];

        return;
    }

    if (
        [
            "green",
            "blue",
            "black"
        ].includes(id)
    ) {


        courtColor =
            id;

        return;
    }


    if (
        id ===
        "classicPong"
    ) {

        toggleClassicPongPreset();
        return;
    }


    // CONTROLES PVP

    if (
        gameMode ===
        "local"
    ) {

        const [
            side,
            action
        ] =
            id.split(":");


        if (
            side &&
            action &&
            localControls[
                side
            ]
        ) {

            const controls =
                localControls[
                    side
                ];


            if (
                action ===
                    "up" ||
                action ===
                    "down"
            ) {

                waitingForKey =
                    id;

                return;
            }


            if (
                action ===
                "mouse"
            ) {

                controls.mouse =
                    !controls.mouse;

                return;
            }


            if (
                action ===
                "sensMinus"
            ) {

                controls.sensitivity =
                    round1(
                        clamp(
                            controls.sensitivity -
                            SENS.step,

                            SENS.min,
                            SENS.max
                        )
                    );

                return;
            }


            if (
                action ===
                "sensPlus"
            ) {

                controls.sensitivity =
                    round1(
                        clamp(
                            controls.sensitivity +
                            SENS.step,

                            SENS.min,
                            SENS.max
                        )
                    );

                return;
            }
        }


        if (
            id ===
            "localControlsReset"
        ) {

            resetLocalControls();

            return;
        }
    }


    // CONTROLES IA

    if (
        gameMode ===
        "ai"
    ) {

        if (
            id ===
            "aiVsAi"
        ) {

            aiVsAiEnabled =
                !aiVsAiEnabled;

            waitingForKey =
                null;

            resetAIThinking();

            return;
        }


        if (
            id ===
            "aiLeftDifficulty"
        ) {

            aiLeftDifficulty =
                nextAIDifficulty(
                    aiLeftDifficulty
                );

            resetAutoplayAIThinking();

            return;
        }


        if (
            id ===
            "aiRightDifficulty"
        ) {

            aiRightDifficulty =
                nextAIDifficulty(
                    aiRightDifficulty
                );

            resetAutoplayAIThinking();

            return;
        }

        if (
            [
                "up1",
                "up2",
                "down1",
                "down2"
            ].includes(id)
        ) {

            waitingForKey =
                id;

            return;
        }


        if (
            id ===
            "aiMouse"
        ) {

            aiControls.mouse =
                !aiControls.mouse;

            return;
        }


        if (
            id ===
            "aiSensMinus"
        ) {

            aiControls.sensitivity =
                round1(
                    clamp(
                        aiControls.sensitivity -
                        SENS.step,

                        SENS.min,
                        SENS.max
                    )
                );

            return;
        }


        if (
            id ===
            "aiSensPlus"
        ) {

            aiControls.sensitivity =
                round1(
                    clamp(
                        aiControls.sensitivity +
                        SENS.step,

                        SENS.min,
                        SENS.max
                    )
                );

            return;
        }


        if (
            id ===
            "aiControlsReset"
        ) {

            resetAIControls();

            return;
        }
    }


    // FISICAS

    if (
        id ===
        "progressive"
    ) {

        progressiveSpeed =
            !progressiveSpeed;

        if (!progressiveSpeed) {

            clearBallSpin();

            setBallSpeed(
                currentBallSpeed()
            );
        }

        return;
    }


    if (
        id ===
        "spin"
    ) {

        spinEnabled =
            !spinEnabled;

        if (!spinEnabled) {
            clearBallSpin();
        }

        return;
    }


    if (
        id ===
        "physicsReset"
    ) {

        resetPhysics();

        return;
    }


    // FINAL

    if (
        id ===
        "victoryDifficulty"
    ) {

        aiDifficulty =
            nextAIDifficulty(
                aiDifficulty
            );

        resetAIThinking();

        return;
    }


    if (
        id ===
        "onlineRematch"
    ) {
        toggleOnlineRematch();
        return;
    }


    if (
        id ===
        "onlineReturn"
    ) {
        goToOnlineMenu();
        return;
    }


    if (
        id ===
        "revenge"
    ) {

        resetMatch();

        return;
    }


    if (
        id ===
        "victoryMenu"
    ) {

        goToStartMenu();
    }
}


// ============================================================
// HOVER
// ============================================================

function updateHover(
    x,
    y
) {

    hoveredButton =
        null;

    for (
        const item of
        interactiveItems()
    ) {

        if (
            !item.disabled &&
            inside(
                x,
                y,
                item.hitRect ||
                item.rect
            )
        ) {

            hoveredButton =
                item.id;

            break;
        }
    }

    canvas.style.cursor =
        hoveredButton
            ? "pointer"
            : "default";
}


// ============================================================
// RENDER BASE
// ============================================================

function applyElementShadow(
    blur = 8,
    offset = 3
) {

    ctx.shadowColor =
        "rgba(0,0,0,.78)";

    ctx.shadowBlur =
        blur;

    ctx.shadowOffsetX =
        offset;

    ctx.shadowOffsetY =
        offset;
}

function courtSceneVisible() {

    return (
        !startMenuOpen ||
        startSettingsActive() ||
        (
            onlineMenuOpen &&
            onlineSession.screen !==
                "menu"
        )
    );
}

function drawTable() {

    ctx.fillStyle =
        TABLE.colors[
            courtColor
        ];

    ctx.fillRect(
        TABLE.left,
        TABLE.top,
        TABLE.right -
        TABLE.left,
        TABLE.bottom -
        TABLE.top
    );

    ctx.strokeStyle =
        "#FFFFFF";

    ctx.lineWidth =
        4;

    ctx.strokeRect(
        TABLE.left,
        TABLE.top,
        TABLE.right -
        TABLE.left,
        TABLE.bottom -
        TABLE.top
    );

    ctx.setLineDash([
        20,
        20
    ]);

    ctx.beginPath();

    ctx.moveTo(
        W / 2,
        TABLE.top
    );

    ctx.lineTo(
        W / 2,
        TABLE.bottom
    );

    ctx.stroke();

    ctx.setLineDash([]);
}

function drawPaddles() {

    ctx.save();
    applyElementShadow();

    ctx.fillStyle =
        "#FFFFFF";

    ctx.fillRect(
        leftPaddle.x,
        leftPaddle.y,
        PADDLE.w,
        PADDLE.h
    );

    ctx.fillRect(
        rightPaddle.x,
        rightPaddle.y,
        PADDLE.w,
        PADDLE.h
    );

    ctx.restore();
}

function drawBallShape(
    centerX,
    centerY,
    size = BALL.size
) {

    if (
        ballShape ===
        "square"
    ) {

        ctx.fillRect(
            centerX -
            size / 2,

            centerY -
            size / 2,

            size,
            size
        );

        return;
    }

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        size / 2,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawBall() {

    ctx.save();
    applyElementShadow();

    ctx.fillStyle =
        currentBallColor();

    drawBallShape(
        ball.x +
        BALL.size / 2,

        ball.y +
        BALL.size / 2
    );

    ctx.restore();
}


// ============================================================
// MARCADOR
// ============================================================

function drawScore() {

    ctx.save();
    applyElementShadow(
        5,
        2
    );

    /*
        Usamos baseline alfabética
        para poder medir el borde visual
        real de los números.
    */

    const scoreBaselineY =
        scorePosition === "top"

            ? TABLE.top + 58
            : TABLE.bottom - 23;

    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        UI.score;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "alphabetic";


    const leftText =
        String(
            leftScore
        ).padStart(
            2,
            "0"
        );

    const rightText =
        String(
            rightScore
        ).padStart(
            2,
            "0"
        );


    ctx.fillText(
        leftText,
        W / 4,
        scoreBaselineY
    );

    ctx.fillText(
        rightText,
        W * 3 / 4,
        scoreBaselineY
    );


    const side =
        matchPointSide();


    if (
        !side ||
        gameOver
    ) {
        ctx.restore();
        return;
    }


    /*
        Obtenemos el borde visual REAL
        orientado hacia el límite elegido.
    */

    const metrics =
        ctx.measureText(
            side === "left"
                ? leftText
                : rightText
        );


    const descent =
        Number.isFinite(
            metrics.actualBoundingBoxDescent
        )
            ? metrics.actualBoundingBoxDescent
            : 2;


    const ascent =
        Number.isFinite(
            metrics.actualBoundingBoxAscent
        )
            ? metrics.actualBoundingBoxAscent
            : 42;


    const scoreVisualEdge =
        scorePosition === "top"

            ? scoreBaselineY -
              ascent
            : scoreBaselineY +
              descent;


    const tableEdge =
        scorePosition === "top"

            ? TABLE.top
            : TABLE.bottom;


    /*
        MATCH queda exactamente
        en el centro entre:

        borde visual del número
        y el límite elegido de la mesa.
    */

    const matchVisualCenterY =
        scoreVisualEdge +
        (
            tableEdge -
            scoreVisualEdge
        ) /
        2;


    const blink =
        0.25 +
        0.75 *
        (
            (
                Math.sin(
                    performance.now() /
                    260
                ) +
                1
            ) /
            2
        );


    ctx.save();

    ctx.globalAlpha =
        blink;

    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        "bold 13px monospace";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "alphabetic";

    const matchMetrics =
        ctx.measureText(
            "MATCH"
        );

    const matchAscent =
        Number.isFinite(
            matchMetrics
                .actualBoundingBoxAscent
        )

            ? matchMetrics
                .actualBoundingBoxAscent
            : 10;

    const matchDescent =
        Number.isFinite(
            matchMetrics
                .actualBoundingBoxDescent
        )

            ? matchMetrics
                .actualBoundingBoxDescent
            : 2;

    const matchBaselineY =
        matchVisualCenterY +
        (
            matchAscent -
            matchDescent
        ) /
        2;

    ctx.fillText(
        "MATCH",

        side === "left"
            ? W / 4
            : W * 3 / 4,

        matchBaselineY
    );


    ctx.restore();
    ctx.restore();
}


// ============================================================
// UI DRAW
// ============================================================

function overlay(
    alpha = 0.78
) {

    ctx.fillStyle =
        `rgba(0,0,0,${alpha})`;

    ctx.fillRect(
        TABLE.left,
        TABLE.top,
        TABLE.right -
        TABLE.left,
        TABLE.bottom -
        TABLE.top
    );
}

function title(
    text,
    y = 90,
    font = UI.title
) {

    ctx.save();

    if (courtSceneVisible()) {
        applyElementShadow(
            5,
            2
        );
    }

    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        font;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        text,
        W / 2,
        y
    );

    ctx.restore();
}

function drawButton(item) {

    ctx.save();

    if (courtSceneVisible()) {
        applyElementShadow(
            5,
            2
        );
    }

    const hover =
        hoveredButton ===
        item.id;

    const rect =
        item.rect;


    ctx.fillStyle =
        item.disabled

            ? "rgba(255,255,255,.03)"

            : hover
                ? "rgba(255,255,255,.13)"
                : "rgba(0,0,0,.1)";


    ctx.fillRect(
        rect.x,
        rect.y,
        rect.w,
        rect.h
    );


    ctx.strokeStyle =
        item.disabled

            ? "rgba(255,255,255,.35)"

            : "#FFFFFF";


    ctx.lineWidth =
        hover
            ? 5
            : 3;


    ctx.strokeRect(
        rect.x,
        rect.y,
        rect.w,
        rect.h
    );


    ctx.fillStyle =
        item.disabled

            ? "rgba(255,255,255,.5)"

            : "#FFFFFF";


    ctx.font =
        UI.button;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    ctx.fillText(
        item.text,

        rect.x +
        rect.w / 2,

        rect.y +
        rect.h / 2
    );

    ctx.restore();
}

function drawSlider(item) {

    ctx.save();

    if (courtSceneVisible()) {
        applyElementShadow(
            5,
            2
        );
    }

    const hover =
        hoveredButton ===
            item.id ||
        activeSlider ===
            item.id;


    const {
        x,
        y,
        w,
        h
    } =
        item.rect;


    const ratio =
        (
            item.value -
            item.min
        ) /
        (
            item.max -
            item.min
        );


    const knobX =
        x +
        ratio *
        w;


    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        "bold 20px monospace";

    ctx.textBaseline =
        "middle";

    ctx.textAlign =
        "left";


    ctx.fillText(
        item.label,
        x,
        y - 25
    );


    ctx.textAlign =
        "right";


    ctx.fillText(
        item.displayValue ||
        String(
            item.value
        ),

        x + w,
        y - 25
    );


    ctx.strokeStyle =
        "#FFFFFF";

    ctx.lineWidth =
        hover
            ? 4
            : 2;


    ctx.strokeRect(
        x,
        y,
        w,
        h
    );


    ctx.fillStyle =
        "#FFFFFF";


    ctx.fillRect(
        x,
        y,
        ratio * w,
        h
    );


    ctx.beginPath();


    ctx.arc(
        knobX,
        y + h / 2,
        hover
            ? 10
            : 8,
        0,
        Math.PI * 2
    );


    ctx.fill();

    ctx.restore();
}

// ============================================================
// START
// ============================================================

function drawArgenPongLogo(
    scale = 0.84
) {

    const centerX =
        W / 2;

    const neonPulse =
        0.22 +
        0.78 *
        (
            Math.sin(
                performance.now() /
                300
            ) +
            1
        ) /
        2;

    ctx.save();

    ctx.translate(
        centerX,
        0
    );

    ctx.scale(
        scale,
        scale
    );

    ctx.translate(
        -centerX,
        0
    );

    ctx.shadowColor =
        `rgba(108,172,228,${
            0.24 +
            neonPulse *
            0.58
        })`;

    ctx.shadowBlur =
        14 +
        neonPulse *
        24;

    ctx.fillStyle =
        BRAND.ink;

    ctx.strokeStyle =
        BRAND.blue;

    ctx.lineWidth =
        3;

    ctx.beginPath();

    ctx.moveTo(
        centerX - 245,
        42
    );

    ctx.lineTo(
        centerX + 245,
        42
    );

    ctx.lineTo(
        centerX + 215,
        205
    );

    ctx.lineTo(
        centerX,
        244
    );

    ctx.lineTo(
        centerX - 215,
        205
    );

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur =
        0;

    ctx.fillStyle =
        BRAND.blue;

    ctx.font =
        "900 32px Arial, sans-serif";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "ARGEN",
        centerX,
        82
    );

    ctx.font =
        "900 66px Arial, sans-serif";

    const pWidth =
        ctx.measureText("P").width;

    const ngWidth =
        ctx.measureText("NG").width;

    const ballDiameter =
        48;

    const letterGap =
        8;

    const wordWidth =
        pWidth +
        ngWidth +
        ballDiameter +
        letterGap * 2;

    const wordStart =
        centerX -
        wordWidth / 2;


    // Paleta integrada al escudo.

    ctx.save();

    ctx.translate(
        wordStart - 48,
        147
    );

    ctx.rotate(-0.2);

    ctx.fillStyle =
        BRAND.blue;

    ctx.fillRect(
        -6,
        20,
        12,
        31
    );

    ctx.beginPath();

    ctx.ellipse(
        0,
        -5,
        22,
        31,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();
    ctx.restore();


    // La pelota reemplaza la O de PONG.

    ctx.fillStyle =
        "#FFFFFF";

    ctx.textAlign =
        "left";

    ctx.fillText(
        "P",
        wordStart,
        148
    );

    const ballCenterX =
        wordStart +
        pWidth +
        letterGap +
        ballDiameter / 2;

    ctx.fillStyle =
        BRAND.gold;

    ctx.shadowColor =
        `rgba(255,184,28,${
            0.35 +
            neonPulse *
            0.5
        })`;

    ctx.shadowBlur =
        10 +
        neonPulse *
        18;

    ctx.beginPath();

    ctx.arc(
        ballCenterX,
        148,
        ballDiameter / 2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur =
        0;

    ctx.fillStyle =
        "rgba(255,255,255,.65)";

    ctx.beginPath();

    ctx.arc(
        ballCenterX - 7,
        140,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#FFFFFF";

    ctx.fillText(
        "NG",
        ballCenterX +
        ballDiameter / 2 +
        letterGap,
        148
    );


    // Remate angular de estética eSport.

    ctx.strokeStyle =
        BRAND.blue;

    ctx.lineWidth =
        5;

    ctx.shadowColor =
        `rgba(108,172,228,${
            0.28 +
            neonPulse *
            0.62
        })`;

    ctx.shadowBlur =
        8 +
        neonPulse *
        16;

    ctx.beginPath();

    ctx.moveTo(
        centerX - 155,
        194
    );

    ctx.lineTo(
        centerX - 30,
        213
    );

    ctx.lineTo(
        centerX + 155,
        194
    );

    ctx.stroke();

    ctx.shadowBlur =
        0;

    ctx.strokeStyle =
        BRAND.gold;

    ctx.lineWidth =
        3;

    ctx.beginPath();

    ctx.moveTo(
        centerX - 30,
        213
    );

    ctx.lineTo(
        centerX + 35,
        207
    );

    ctx.stroke();

    ctx.fillStyle =
        "rgba(255,255,255,.78)";

    ctx.font =
        "bold 12px monospace";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "1.1 BETA",
        centerX,
        226
    );

    ctx.restore();
}

function drawStart() {

    if (
        onlineMenuOpen &&
        onlineSession.screen !==
        "menu"
    ) {
        drawTable();

        if (
            onlineSession.screen ===
            "waiting"
        ) {
            ctx.save();
            applyElementShadow();
            ctx.fillStyle = "#FFFFFF";

            const paddle =
                sidePaddle(
                    onlineSession.side
                );

            ctx.fillRect(
                paddle.x,
                paddle.y,
                PADDLE.w,
                PADDLE.h
            );
            ctx.restore();

            drawOnlinePracticeBall();
        }

        if (
            [
                "connecting",
                "countdown"
            ].includes(
                onlineSession.screen
            )
        ) {
            drawPaddles();
        }

        const blink =
            0.3 +
            0.7 *
            (
                Math.sin(
                    performance.now() /
                    260
                ) +
                1
            ) /
            2;

        const statusKey =
            onlineSession.screen ===
            "searching"

                ? "searchingOpponent"
                : onlineSession.screen ===
                    "waiting"

                    ? "waitingOpponent"
                    : onlineSession.screen ===
                        "error"

                        ? onlineSession.errorKey ||
                          "onlineConnectionError"
                        : "opponentFound";

        ctx.save();
        ctx.globalAlpha =
            onlineSession.screen ===
            "error"

                ? 1
                : blink;

        title(
            t(statusKey),
            112,
            "bold 30px monospace"
        );
        ctx.restore();

        if (
            onlineSession.screen ===
            "waiting"
        ) {
            title(
                t(
                    touchControlsPreferred()

                        ? "practiceTouch"
                        : "practiceKeys"
                ),
                160,
                "14px monospace"
            );
        }

        if (
            onlineSession.screen ===
            "connecting"
        ) {
            title(
                t("onlineConnecting"),
                160,
                "18px monospace"
            );
        }

        if (
            onlineSession.screen ===
            "countdown"
        ) {
            title(
                String(
                    onlineSession.countdown ||
                    3
                ),
                H / 2,
                "bold 108px monospace"
            );
        }

        interactiveItems()
            .forEach(drawButton);

        return;
    }

    ctx.fillStyle =
        "#000000";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    drawArgenPongLogo();


    if (onlineMenuOpen) {

        title(
            t("onlinePvp"),
            270,
            "bold 30px monospace"
        );

        title(
            `${t("activeMatches")}: ${
                Number.isFinite(
                    onlineSession
                        .activeMatches
                )

                    ? onlineSession
                        .activeMatches
                    : "--"
            }`,
            308,
            "16px monospace"
        );

    } else if (aiMenuOpen) {

        title(
            t("chooseSide"),
            270,
            "bold 26px monospace"
        );


        ctx.font =
            "18px monospace";

        ctx.fillStyle =
            "#FFFFFF";

        ctx.textAlign =
            "center";


        ctx.fillText(
            t("chooseDifficulty"),
            W / 2,
            302
        );
    }


    const items =
        interactiveItems();


    items.forEach(
        drawButton
    );


}


// ============================================================
// MENUS
// ============================================================

function drawPause() {

    overlay(0.72);

    drawArgenPongLogo(
        0.64
    );

    title(
        t("pause"),
        214,
        "bold 30px monospace"
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}

function drawSettings() {

    overlay(0.8);

    title(
        t("settings"),
        75
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}

function drawBackground() {

    overlay(0.82);

    title(
        t("background"),
        75
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}

function drawBallSettings() {

    overlay(0.82);

    title(
        t("ball"),
        75
    );

    ctx.save();
    applyElementShadow();

    ctx.fillStyle =
        currentBallColor();

    drawBallShape(
        W / 2,
        145,
        BALL.size
    );

    ctx.fillStyle =
        "rgba(255,255,255,.82)";

    ctx.font =
        "16px monospace";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        `40 mm · ${t(
            ballShape
        )}`,

        W / 2,
        185
    );

    ctx.restore();

    interactiveItems()
        .forEach(
            drawButton
        );
}

function drawReplaySettings() {

    overlay(0.82);

    title(
        t("replay"),
        75
    );

    ctx.fillStyle =
        "rgba(255,255,255,.82)";

    ctx.font =
        "bold 18px monospace";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        t("frequency"),
        W / 2,
        202
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}

function drawLanguage() {

    overlay(0.82);

    title(
        t("language"),
        75
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}

function drawConfirm() {

    overlay(0.84);

    title(
        confirmOpen ===
        "restart"

            ? t("confirmRestart")
            : t("confirmMenu"),

        H / 2 - 80,

        "bold 42px monospace"
    );


    ctx.font =
        "20px monospace";

    ctx.fillStyle =
        "#FFFFFF";

    ctx.textAlign =
        "center";


    ctx.fillText(
        t("loseCurrent"),

        W / 2,
        H / 2 - 25
    );


    interactiveItems()
        .forEach(
            drawButton
        );
}

function drawPhysics() {

    overlay(0.84);

    title(
        t("physics"),
        65
    );


    const items =
        interactiveItems();


    items
        .filter(
            item =>
                item.type ===
                "slider"
        )
        .forEach(
            drawSlider
        );


    items
        .filter(
            item =>
                item.type ===
                "button"
        )
        .forEach(
            drawButton
        );
}


// ============================================================
// CONTROLES
// ============================================================

function drawControls() {

    overlay(0.84);


    if (
        gameMode ===
        "local"
    ) {

        drawLocalControls();

    } else {

        drawAIControls();
    }
}

function drawLocalControls() {

    title(
        t("controls"),
        65
    );


    const columns = {
        left: 140,
        right: 720
    };


    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        "bold 30px monospace";

    ctx.textAlign =
        "center";


    ctx.fillText(
        t("left"),
        360,
        125
    );


    ctx.fillText(
        t("right"),
        940,
        125
    );


    for (
        const side of
        [
            "left",
            "right"
        ]
    ) {

        const x =
            columns[side];

        const controls =
            localControls[
                side
            ];


        ctx.font =
            "bold 20px monospace";

        ctx.textAlign =
            "left";


        ctx.fillText(
            t("up"),
            x,
            202
        );


        ctx.fillText(
            t("down"),
            x,
            262
        );


        ctx.fillText(
            t("mouse"),
            x,
            322
        );


        ctx.fillText(
            t("sensitivity"),
            x,
            392
        );


        ctx.textAlign =
            "center";

        ctx.font =
            "bold 18px monospace";


        ctx.fillText(
            controls.sensitivity
                .toFixed(1),

            x + 215,
            392
        );
    }


    interactiveItems()
        .forEach(
            drawButton
        );
}

function drawAIControls() {

    title(
        t("controls"),
        65
    );

    if (aiVsAiEnabled) {

        ctx.fillStyle =
            "rgba(255,255,255,.78)";

        ctx.font =
            "18px monospace";

        ctx.textAlign =
            "center";

        ctx.fillText(
            `${t("easy")} · ${
                t("normal")
            } · ${t("hard")}`,
            W / 2,
            235
        );

        interactiveItems()
            .forEach(
                drawButton
            );

        return;
    }


    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        "bold 30px monospace";

    ctx.textAlign =
        "center";


    ctx.fillText(
        t("player"),
        W / 2,
        125
    );


    ctx.font =
        "bold 20px monospace";

    ctx.textAlign =
        "left";


    [
        [t("up"), 202],
        [t("down"), 262],
        [t("mouse"), 322],
        [t("sensitivity"), 392]

    ].forEach(
        (
            [
                text,
                y
            ]
        ) => {

            ctx.fillText(
                text,
                390,
                y
            );
        }
    );


    ctx.textAlign =
        "center";

    ctx.font =
        "bold 18px monospace";


    ctx.fillText(
        aiControls.sensitivity
            .toFixed(1),

        670,
        392
    );


    interactiveItems()
        .forEach(
            drawButton
        );
}


// ============================================================
// REPETICIÓN
// ============================================================

function replayFrameAt(
    position
) {

    if (!replayClip.length) {
        return replaySnapshot();
    }

    const firstIndex =
        clamp(
            Math.floor(position),
            0,
            replayClip.length - 1
        );

    const secondIndex =
        clamp(
            firstIndex + 1,
            0,
            replayClip.length - 1
        );

    const ratio =
        clamp(
            position - firstIndex,
            0,
            1
        );

    const first =
        replayClip[firstIndex];

    const second =
        replayClip[secondIndex];

    const mix =
        key =>
            first[key] +
            (
                second[key] -
                first[key]
            ) *
            ratio;

    return {
        ballX: mix("ballX"),
        ballY: mix("ballY"),
        ballVx: mix("ballVx"),
        ballVy: mix("ballVy"),
        ballSpeed: mix("ballSpeed"),
        leftPaddleY: mix("leftPaddleY"),
        rightPaddleY: mix("rightPaddleY")
    };
}

function drawReplayTrajectory(
    visibleFrame
) {

    if (
        replayClip.length < 2
    ) {
        return;
    }

    const currentIndex =
        clamp(
            Math.floor(
                replayPosition
            ),
            0,
            replayClip.length - 1
        );

    const startIndex =
        Math.max(
            1,
            currentIndex -
            REPLAY.trailFrames +
            1
        );

    const fractionalProgress =
        clamp(
            replayPosition -
            currentIndex,
            0,
            1
        );

    const completeSegments =
        Math.max(
            0,
            currentIndex -
            startIndex +
            1
        );

    const segmentCount =
        completeSegments +
        (
            fractionalProgress > 0
                ? 1
                : 0
        );

    if (!segmentCount) {
        return;
    }

    ctx.save();

    ctx.lineWidth =
        4;

    ctx.lineCap =
        "round";

    ctx.shadowColor =
        BRAND.blue;

    ctx.shadowBlur =
        5;

    let drawnSegments =
        0;

    const drawSegment = (
        previous,
        current
    ) => {

        drawnSegments++;

        const ageRatio =
            drawnSegments /
            segmentCount;

        ctx.globalAlpha =
            0.08 +
            ageRatio *
            0.72;

        ctx.strokeStyle =
            BRAND.blue;

        ctx.beginPath();

        ctx.moveTo(
            previous.ballX +
            BALL.size / 2,
            previous.ballY +
            BALL.size / 2
        );

        ctx.lineTo(
            current.ballX +
            BALL.size / 2,
            current.ballY +
            BALL.size / 2
        );

        ctx.stroke();
    };

    for (
        let index = startIndex;
        index <= currentIndex;
        index++
    ) {

        const previous =
            replayClip[index - 1];

        const current =
            replayClip[index];

        drawSegment(
            previous,
            current
        );
    }

    if (
        fractionalProgress > 0 &&
        currentIndex <
            replayClip.length - 1
    ) {

        drawSegment(
            replayClip[currentIndex],
            visibleFrame
        );
    }

    ctx.restore();
}

function drawReplay() {

    const frame =
        replayFrameAt(
            replayPosition
        );

    drawTable();
    drawReplayTrajectory(
        frame
    );

    ctx.save();
    applyElementShadow();

    ctx.fillStyle =
        "#FFFFFF";

    ctx.fillRect(
        leftPaddle.x,
        frame.leftPaddleY,
        PADDLE.w,
        PADDLE.h
    );

    ctx.fillRect(
        rightPaddle.x,
        frame.rightPaddleY,
        PADDLE.w,
        PADDLE.h
    );

    ctx.fillStyle =
        currentBallColor();

    drawBallShape(
        frame.ballX +
        BALL.size / 2,

        frame.ballY +
        BALL.size / 2
    );

    ctx.restore();

    drawScore();

    const blink =
        0.25 +
        0.75 *
        (
            (
                Math.sin(
                    performance.now() /
                    260
                ) +
                1
            ) /
            2
        );

    ctx.save();
    applyElementShadow(
        5,
        2
    );

    ctx.textBaseline =
        "alphabetic";

    ctx.textAlign =
        "left";

    ctx.font =
        "bold 20px monospace";

    ctx.fillStyle =
        BRAND.blue;

    ctx.globalAlpha =
        blink;

    ctx.fillText(
        t("instantReplay"),
        TABLE.left + 22,
        TABLE.top + 28
    );

    ctx.globalAlpha =
        1;

    ctx.fillStyle =
        "#FFFFFF";

    const speedLabel =
        `${t("replaySpeed")}: `;

    ctx.font =
        "bold 18px monospace";

    ctx.fillText(
        speedLabel,
        TABLE.left + 22,
        TABLE.top + 58
    );

    const speedLabelWidth =
        ctx.measureText(
            speedLabel
        ).width;

    ctx.font =
        "18px monospace";

    ctx.fillText(
        replaySpeedText(
            frame
        ),
        TABLE.left +
        22 +
        speedLabelWidth,
        TABLE.top + 58
    );

    ctx.font =
        "16px monospace";

    ctx.fillText(
        t("skipReplay"),
        TABLE.left + 22,
        TABLE.top + 84
    );

    if (gameMode === "online") {
        ctx.fillText(
            `${t("you")}: ${
                onlineSession
                    .localReplaySkipReady

                    ? "✓"
                    : "□"
            }   ·   ${t("opponent")}: ${
                onlineSession
                    .remoteReplaySkipReady

                    ? "✓"
                    : "□"
            }`,
            TABLE.left + 22,
            TABLE.top + 110
        );
    }

    ctx.restore();
}


// ============================================================
// VICTORIA
// ============================================================

function victoryTitle() {

    if (
        gameMode ===
        "online"
    ) {
        return (
            winner ===
            onlineSession.side

                ? t("youWon")
                : t("youLost")
        );
    }

    if (
        gameMode ===
        "ai" &&
        !aiVsAiEnabled
    ) {

        return (
            winner ===
            humanSide

                ? t("youWon")
                : t("solWins")
        );
    }

    return (
        winner ===
        "left"

            ? t("winLeft")
            : t("winRight")
    );
}

function victoryCounterText() {

    if (
        gameMode === "online"
    ) {
        const localVictories =
            onlineSession.side === "left"

                ? leftVictories
                : rightVictories;

        const rivalVictories =
            onlineSession.side === "left"

                ? rightVictories
                : leftVictories;

        return `${t("you")} ${localVictories} - ${rivalVictories} ${t("opponent")}`;
    }

    if (
        gameMode === "ai" &&
        !aiVsAiEnabled
    ) {
        const localVictories =
            humanSide === "left"

                ? leftVictories
                : rightVictories;

        const rivalVictories =
            humanSide === "left"

                ? rightVictories
                : leftVictories;

        return `${t("you")} ${localVictories} - ${rivalVictories} ${t("opponent")}`;
    }

    return `${t("left")} ${leftVictories} - ${rightVictories} ${t("right")}`;
}

function drawVictory() {

    overlay(0.68);


    title(
        victoryTitle(),

        H / 2 - 50,

        UI.winner
    );

    title(
        victoryCounterText(),
        H / 2 + 10,
        "bold 18px monospace"
    );


    interactiveItems()
        .forEach(
            drawButton
        );
}

function drawLetCall() {

    if (!letActive) {
        return;
    }

    const blink =
        0.35 +
        0.65 *
        (
            Math.sin(
                performance.now() /
                180
            ) +
            1
        ) /
        2;

    ctx.save();
    ctx.globalAlpha = blink;

    title(
        t("letCall"),
        H / 2,
        "bold 72px monospace"
    );

    ctx.restore();
}

function drawOnlineGameCountdown() {

    if (
        gameMode !== "online" ||
        startMenuOpen ||
        onlineSession.screen !==
            "countdown"
    ) {
        return;
    }

    title(
        String(
            onlineSession.countdown ||
            3
        ),
        H / 2,
        "bold 108px monospace"
    );
}

function drawOnlineLatency() {

    if (
        gameMode !== "online" ||
        onlineSession.screen !==
            "playing"
    ) {
        return;
    }

    const value =
        Number.isFinite(
            onlineSession.latencyMs
        )

            ? `${onlineSession.latencyMs} ms`
            : "-- ms";

    ctx.save();
    applyElementShadow(
        3,
        1
    );
    ctx.fillStyle =
        "rgba(255,255,255,.68)";
    ctx.font =
        "12px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(
        value,
        W - 14,
        12
    );
    ctx.restore();
}

function drawOnlinePointerHint() {

    if (
        gameMode !== "online" ||
        !onlineSession.pointerHint ||
        replayPlaying ||
        gameOver
    ) {
        return;
    }

    ctx.save();
    applyElementShadow(
        5,
        2
    );
    ctx.fillStyle =
        "rgba(0,0,0,.62)";
    ctx.fillRect(
        W / 2 - 245,
        TABLE.bottom - 74,
        490,
        46
    );
    ctx.strokeStyle =
        BRAND.blue;
    ctx.lineWidth = 2;
    ctx.strokeRect(
        W / 2 - 245,
        TABLE.bottom - 74,
        490,
        46
    );
    ctx.fillStyle = "#FFFFFF";
    ctx.font =
        "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        t("clickRecapture"),
        W / 2,
        TABLE.bottom - 51
    );
    ctx.restore();
}


// ============================================================
// RENDER PRINCIPAL
// ============================================================

function drawGame() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );


    if (
        startMenuOpen &&
        !startSettingsActive()
    ) {

        drawStart();

        return;
    }


    if (replayPlaying) {

        drawReplay();

        return;
    }


    drawTable();
    drawPaddles();
    drawBall();
    drawScore();
    drawOnlineLatency();
    drawOnlinePointerHint();
    drawOnlineGameCountdown();
    drawLetCall();


    if (gameOver) {

        drawVictory();

        return;
    }


    if (confirmOpen) {

        drawConfirm();

        return;
    }


    if (controlsOpen) {

        drawControls();

        return;
    }


    if (backgroundOpen) {

        drawBackground();

        return;
    }


    if (ballOpen) {

        drawBallSettings();

        return;
    }

    if (replayOpen) {

        drawReplaySettings();

        return;
    }


    if (languageOpen) {

        drawLanguage();

        return;
    }


    if (physicsOpen) {

        drawPhysics();

        return;
    }


    if (settingsOpen) {

        drawSettings();

        return;
    }


    if (gamePaused) {

        drawPause();
    }
}


// ============================================================
// LOOP
// ============================================================

function loop(
    timestamp
) {

    if (replayPlaying) {

        updateReplay(
            timestamp
        );

        previousFrameTime =
            timestamp;

        frameAccumulator =
            0;

        drawGame();

        requestAnimationFrame(
            loop
        );

        return;
    }

    if (
        previousFrameTime ===
        null
    ) {
        previousFrameTime =
            timestamp;
    }


    const stepMs =
        currentStepMs();

    const stepScale =
        currentStepScale();


    const elapsed =
        Math.min(
            timestamp -
            previousFrameTime,

            stepMs *
            TIMING.maxSteps
        );


    previousFrameTime =
        timestamp;

    frameAccumulator +=
        elapsed;


    const stepsToRun =
        Math.min(
            TIMING.maxSteps,

            Math.floor(
                frameAccumulator /
                stepMs
            )
        );

    const mouseDeltaPerStep =
        stepsToRun > 0

            ? pendingMouseDelta /
              stepsToRun

            : 0;


    if (
        stepsToRun > 0
    ) {
        pendingMouseDelta =
            0;
    }


    for (
        let frameStep = 0;
        frameStep < stepsToRun;
        frameStep++
    ) {

        moveMousePaddles(
            mouseDeltaPerStep
        );

        updatePaddles(
            stepScale
        );

        updatePaddleMotion(
            stepScale
        );

        updateOnlinePracticeBall(
            stepScale
        );


        const ballSubsteps =
            Math.max(
                1,
                Math.ceil(
                    stepScale
                )
            );

        const ballStepScale =
            stepScale /
            ballSubsteps;


        for (
            let step = 0;
            step < ballSubsteps;
            step++
        ) {

            updateBall(
                ballStepScale
            );

            if (replayPlaying) {
                break;
            }
        }

        sendOnlineSnapshot();

        frameAccumulator -=
            stepMs;

        if (replayPlaying) {

            frameAccumulator =
                0;

            break;
        }
    }


    updateOnlineGuestBall(
        timestamp
    );

    drawGame();

    requestAnimationFrame(
        loop
    );
}


configureOnlineTransport();
resetBall();
requestAnimationFrame(
    loop
);
