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

const TABLE = {
    left: 10,
    right: W - 10,
    top: 10,
    bottom: H - 10,

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

const BALL = {
    size: 20,

    speedLevels: [
        5,
        6.1,
        7.3,
        8.8,
        10.5,
        12.8,
        15.6,
        18.9,
        23.2,
        25
    ],

    defaultLevel: 5,
    baseYRatio: 0.7,
    progressiveFactor: 1.04,
    maxSpeed: 25
};

const SPIN = {
    defaultEnabled: true,
    deadZone: 0.8,
    fullStrengthPaddleSpeed: 16,
    curvePerStep: 0.0075,
    speedInfluence: 0.13,
    decay: 0.99,
    wallRetention: 0.75,
    epsilon: 0.001
};

const TIMING = {
    defaultFps: 60,
    options: [24, 60, 120],
    referenceFps: 60,
    maxSteps: 5
};

const REPLAY = {
    defaultEnabled: true,
    defaultMode: "match",
    captureFps: 60,
    playbackFps: 60,
    startSpeed: 0.9,
    endSpeed: 0.25,
    kmhPerSpeedUnit:
        116 /
        BALL.maxSpeed,
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
        side: "LADO",
        left: "IZQUIERDA",
        right: "DERECHA",
        easy: "FÁCIL",
        normal: "NORMAL",
        hard: "DIFÍCIL",
        back: "VOLVER",
        rematch: "¿REVANCHA?",
        mainMenu: "MENÚ INICIAL",
        yes: "SÍ",
        no: "NO",
        green: "VERDE",
        blue: "AZUL",
        black: "NEGRO",
        velocity: "VELOCIDAD",
        progressive: "VELOCIDAD PROGRESIVA",
        resetDefaults: "RESTABLECER POR DEFECTO",
        controls: "CONTROLES",
        background: "FONDO",
        physics: "FÍSICAS",
        sound: "SONIDO",
        continue: "CONTINUAR",
        restart: "REINICIAR PARTIDA",
        settings: "AJUSTES",
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
        winLeft: "LA IZQUIERDA GANA",
        winRight: "LA DERECHA GANA",
        replay: "REPETICIÓN",
        replayAuto: "REPRODUCCIÓN AUTOMÁTICA",
        frequency: "FRECUENCIA",
        replayMatch: "MATCH",
        replayAll: "TODOS LOS TANTOS",
        replaySpeed: "VELOCIDAD",
        instantReplay: "REPETICIÓN INSTANTÁNEA",
        skipReplay: "PRESIONE CUALQUIER TECLA PARA OMITIR",
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
        side: "SIDE",
        left: "LEFT",
        right: "RIGHT",
        easy: "EASY",
        normal: "NORMAL",
        hard: "HARD",
        back: "BACK",
        rematch: "REMATCH?",
        mainMenu: "MAIN MENU",
        yes: "YES",
        no: "NO",
        green: "GREEN",
        blue: "BLUE",
        black: "BLACK",
        velocity: "SPEED",
        progressive: "PROGRESSIVE SPEED",
        resetDefaults: "RESTORE DEFAULTS",
        controls: "CONTROLS",
        background: "BACKGROUND",
        physics: "PHYSICS",
        sound: "SOUND",
        continue: "CONTINUE",
        restart: "RESTART MATCH",
        settings: "SETTINGS",
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
        winLeft: "LEFT SIDE WINS",
        winRight: "RIGHT SIDE WINS",
        replay: "REPLAY",
        replayAuto: "AUTOMATIC REPLAY",
        frequency: "FREQUENCY",
        replayMatch: "MATCH",
        replayAll: "EVERY POINT",
        replaySpeed: "SPEED",
        instantReplay: "INSTANT REPLAY",
        skipReplay: "PRESS ANY KEY TO SKIP",
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
        returns: 5
    },

    normal: {
        label: "NORMAL",
        returns: 15
    },

    hard: {
        label: "DIFÍCIL",
        returns: 30
    }
};


// ============================================================
// ESTADO
// ============================================================

let courtColor = "black";

let audioContext = null;
let audioMuted = false;

let ballSpeedLevel = BALL.defaultLevel;
let progressiveSpeed = true;
let spinEnabled = SPIN.defaultEnabled;
let physicsFps = TIMING.defaultFps;

let previousFrameTime = null;
let frameAccumulator = 0;

let leftScore = 0;
let rightScore = 0;

let servingPlayer = "left";

let gameOver = false;
let winner = null;

let gamePaused = false;
let gameMode = null;

let startMenuOpen = true;
let aiMenuOpen = false;

let settingsOpen = false;
let controlsOpen = false;
let backgroundOpen = false;
let physicsOpen = false;
let fpsOpen = false;
let replayOpen = false;
let languageOpen = false;

let confirmOpen = null;
let hoveredButton = null;
let waitingForKey = null;

let humanSide = "left";
let aiDifficulty = "normal";
let aiReturns = 0;

let previousMouseY = null;
let activeSlider = null;
let pointerUnlockPauseTime = -Infinity;
let escapeResumeTime = -Infinity;
let pendingMouseDelta = 0;

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
    spinSpeedOffset: 0
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

const wallSound = () =>
    sound(500, 0.06, 0.08);

const paddleSound = () =>
    sound(800, 0.07, 0.1);

const pointSound = () =>
    sound(180, 0.2, 0.12);


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

    waitingForKey = null;
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

function resetBall() {

    ball.x =
        (W - BALL.size) / 2;

    ball.y =
        (H - BALL.size) / 2;

    ball.spin =
        0;

    ball.spinSpeedOffset =
        0;

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
            3,
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

    resetPaddles();
    resetBall();

    requestMouseCapture();
}

function startGame(
    mode,
    side = "left",
    difficulty = "normal"
) {

    gameMode =
        mode;

    humanSide =
        side;

    aiDifficulty =
        difficulty;

    startMenuOpen = false;
    aiMenuOpen = false;

    settingsOpen = false;
    controlsOpen = false;
    backgroundOpen = false;
    physicsOpen = false;
    fpsOpen = false;
    replayOpen = false;
    languageOpen = false;

    resetMatch();
}

function goToStartMenu() {

    releaseMouseCapture();

    startMenuOpen = true;
    aiMenuOpen = false;

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
    fpsOpen = false;
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

    if (
        replayMode === "all"
    ) {
        return true;
    }

    const enteredMatch =
        !previousMatchSide &&
        Boolean(
            matchPointSide()
        );

    return (
        enteredMatch ||
        checkWinner()
    );
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

    replayPlaying = true;
    replayPosition = 0;
    replayLastTime = null;
    replayPlaybackAccumulator = 0;

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

    if (
        currentLanguage() === "en"
    ) {

        return `${Math.round(
            speedKmh *
            REPLAY.mphPerKmh
        )} mph`;
    }

    return `${Math.round(
        speedKmh
    )} km/h`;
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
    replayClip = [];
    replayPosition = 0;
    replayLastTime = null;
    replayPlaybackAccumulator = 0;
    replayFinishTime =
        performance.now();

    finalizePoint();
    resetReplayCapture();

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
}

function applyBallSpin(
    paddle
) {

    if (!spinEnabled) {
        return;
    }


    const paddleSpeed =
        paddle.vy;

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


    if (strength <= 0) {
        return;
    }


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


    const speedFactor =
        1 +
        driveDirection *
        strength *
        SPIN.speedInfluence;


    const speedBefore =
        Math.hypot(
            ball.vx,
            ball.vy
        );


    scaleBallVelocity(
        speedFactor
    );


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

        const angle =
            ball.spin *
            SPIN.curvePerStep *
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

    const limit =
        AI_LEVELS[
            aiDifficulty
        ].returns;

    const progress =
        clamp(
            aiReturns /
            limit,
            0,
            1
        );

    /*
        Empieza al 100%.

        A medida que devuelve,
        pierde capacidad de movimiento.

        5 / 15 / 30 determinan
        cuánto tarda en degradarse.
    */

    return Math.max(
        0.08,

        1 -
        progress *
        0.92
    );
}

function registerAIReturn(side) {

    if (
        gameMode !== "ai"
    ) {
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

function updateAI(
    stepScale = 1
) {

    if (
        gameMode !== "ai"
    ) {
        return;
    }

    const paddle =
        sidePaddle(
            otherSide(
                humanSide
            )
        );

    const sensitivity =
        aiMovementSensitivity();

    const target =
        ball.y +
        BALL.size / 2;

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
        (
            0.35 +
            sensitivity *
            0.9
        );


    const tracking =
        0.26 +
        sensitivity *
        0.18;


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

        humanMoveAI(
            stepScale
        );

        updateAI(
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
        paddle
    );

    markReplayReturn();
    paddleSound();
}


// ============================================================
// PELOTA
// ============================================================

function updateBall(
    stepScale = 1
) {

    if (
        startMenuOpen ||
        gamePaused ||
        gameOver ||
        replayPlaying ||
        !gameMode
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

        wallSound();


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

        wallSound();
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


    captureReplayFrame(
        stepScale
    );

    const previousMatchSide =
        matchPointSide();


    // PUNTO DERECHA

    if (
        ball.x +
        BALL.size <
        TABLE.left
    ) {

        rightScore++;

        pointSound();
        handlePoint(
            previousMatchSide
        );


    // PUNTO IZQUIERDA

    } else if (
        ball.x >
        TABLE.right
    ) {

        leftScore++;

        pointSound();
        handlePoint(
            previousMatchSide
        );
    }
}


// ============================================================
// TECLADO
// ============================================================

window.addEventListener(
    "keydown",
    event => {

        initAudio();


        if (replayPlaying) {

            event.preventDefault();
            finishReplay();

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
            startMenuOpen ||
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
    fpsOpen = false;
    replayOpen = false;
    languageOpen = false;

    confirmOpen = null;

    waitingForKey = null;
    hoveredButton = null;

    requestMouseCapture();
}

function handleEscape() {

    if (startMenuOpen) {

        if (aiMenuOpen) {
            aiMenuOpen = false;
        }

        return;
    }

    if (gameOver) {
        return;
    }

    const submenuOpen =
        settingsOpen ||
        controlsOpen ||
        backgroundOpen ||
        physicsOpen ||
        fpsOpen ||
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
// MOUSE
// ============================================================

function mouseControlActive() {

    if (
        gameMode === "ai"
    ) {
        return aiControls.mouse;
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

    if (
        startMenuOpen ||
        gamePaused ||
        gameOver ||
        replayPlaying ||
        !Number.isFinite(delta)
    ) {
        return;
    }


    // VS IA

    if (
        gameMode === "ai" &&
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
        startMenuOpen ||
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
        startMenuOpen ||
        gamePaused ||
        gameOver ||
        replayPlaying ||
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
            mouseControlActive()
        ) {

            gamePaused =
                true;

            pointerUnlockPauseTime =
                performance.now();
        }
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
            !startMenuOpen &&
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

        if (replayPlaying) {

            finishReplay();

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
    rect
) {

    items.push({
        id,
        label,
        value,
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


    // MENU INICIAL

    if (
        startMenuOpen &&
        !aiMenuOpen
    ) {

        add(
            "local",
            t("localPvp"),
            buttonRect(
                0,
                3
            )
        );

        add(
            "ai",
            t("vsAi"),
            buttonRect(
                1,
                3
            )
        );

        add(
            "online",
            t("onlinePvp"),
            buttonRect(
                2,
                3
            ),
            true
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
                390
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
                390
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
                390
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
                390
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
                390
            )
        );

        return items;
    }


    // VICTORIA

    if (gameOver) {

        add(
            "revenge",
            t("rematch"),
            {
                x:
                    W / 2 - 130,

                y:
                    H / 2 + 55,

                w: 260,
                h: 60
            }
        );

        add(
            "victoryMenu",
            t("mainMenu"),
            {
                x:
                    W / 2 - 130,

                y:
                    H / 2 + 135,

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
                        4,
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


    // FPS

    if (fpsOpen) {

        TIMING.options
            .forEach(
                (
                    fps,
                    index
                ) => {

                    add(
                        `fps${fps}`,

                        fps ===
                        physicsFps

                            ? `${fps} FPS · ${t("active")}`
                            : `${fps} FPS`,

                        buttonRect(
                            index,
                            4,
                            320,
                            55,
                            15,
                            380
                        )
                    );
                }
            );

        add(
            "fpsBack",
            t("back"),
            buttonRect(
                3,
                4,
                320,
                55,
                15,
                380
            )
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
            }
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

            buttonRect(
                0,
                3,
                520,
                58,
                16,
                380
            )
        );

        add(
            "replayMode",

            `${t("frequency")}: ${
                replayMode === "match"
                    ? t("replayMatch")
                    : t("replayAll")
            }`,

            buttonRect(
                1,
                3,
                520,
                58,
                16,
                380
            )
        );

        add(
            "replayBack",
            t("back"),
            buttonRect(
                2,
                3,
                520,
                58,
                16,
                380
            )
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
                        8,
                        390,
                        43,
                        7,
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


    add(
        "aiControlsReset",
        t("resetDefaults"),
        {
            x:
                W / 2 - 185,

            y: 510,

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

            y: 580,

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
        id ===
        "online"
    ) {
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
        "fps"
    ) {

        fpsOpen =
            true;

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

        settingsOpen =
            false;

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
        "fpsBack"
    ) {

        fpsOpen =
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
        id ===
        "replayMode"
    ) {

        replayMode =
            replayMode === "match"

                ? "all"
                : "match";

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
        id === "fps24" ||
        id === "fps60" ||
        id === "fps120"
    ) {

        setPhysicsFps(
            Number(
                id.slice(3)
            )
        );

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
            (
                !item.disabled ||
                item.id === "online"
            ) &&
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
        hoveredButton &&
        hoveredButton !== "online"
            ? "pointer"
            : "default";
}


// ============================================================
// RENDER BASE
// ============================================================

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
}

function drawBall() {

    ctx.fillStyle =
        "#FFFFFF";

    ctx.beginPath();

    ctx.arc(
        ball.x +
        BALL.size / 2,

        ball.y +
        BALL.size / 2,

        BALL.size / 2,

        0,
        Math.PI * 2
    );

    ctx.fill();
}


// ============================================================
// MARCADOR
// ============================================================

function drawScore() {

    /*
        Usamos baseline alfabética
        para poder medir el borde visual
        real de los números.
    */

    const scoreBaselineY =
        TABLE.bottom - 23;

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
        return;
    }


    /*
        Obtenemos el borde visual
        inferior REAL del contador.
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


    const scoreVisualBottom =
        scoreBaselineY +
        descent;


    /*
        MATCH queda exactamente
        en el centro entre:

        borde visual del número
        y borde inferior de la mesa.
    */

    const matchY =
        scoreVisualBottom +
        (
            TABLE.bottom -
            scoreVisualBottom
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
        "middle";


    ctx.fillText(
        "MATCH",

        side === "left"
            ? W / 4
            : W * 3 / 4,

        matchY
    );


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
}

function drawButton(item) {

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
}

function drawSlider(item) {

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
}


// ============================================================
// START
// ============================================================

function drawArgenPongLogo() {

    const centerX =
        W / 2;

    ctx.save();

    ctx.shadowColor =
        "rgba(108,172,228,.35)";

    ctx.shadowBlur =
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
        "rgba(255,184,28,.55)";

    ctx.shadowBlur =
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

    ctx.fillStyle =
        "#000000";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    if (!aiMenuOpen) {

        drawArgenPongLogo();

    } else {

        title(
            t("chooseSide"),
            125,
            "bold 42px monospace"
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
            180
        );
    }


    const items =
        interactiveItems();


    items.forEach(
        drawButton
    );


    if (
        !aiMenuOpen &&
        hoveredButton === "online"
    ) {

        const online =
            items.find(
                item =>
                    item.id ===
                    "online"
            );


        if (online) {

            const blink =
                0.25 +
                0.75 *
                (
                    Math.sin(
                        performance.now() /
                        260
                    ) +
                    1
                ) /
                2;

            ctx.save();

            ctx.globalAlpha =
                blink;

            ctx.fillStyle =
                "rgba(255,255,255,.65)";

            ctx.font =
                "bold 14px monospace";

            ctx.textAlign =
                "center";


            ctx.fillText(
                t("comingSoon"),
                W / 2,
                online.rect.y +
                online.rect.h +
                22
            );

            ctx.restore();
        }
    }
}


// ============================================================
// MENUS
// ============================================================

function drawPause() {

    overlay(0.72);

    title(
        t("pause"),
        110
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

function drawFps() {

    overlay(0.82);

    title(
        "FPS",
        75
    );

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

    ctx.beginPath();

    ctx.arc(
        frame.ballX +
        BALL.size / 2,
        frame.ballY +
        BALL.size / 2,
        BALL.size / 2,
        0,
        Math.PI * 2
    );

    ctx.fill();

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

    ctx.restore();
}


// ============================================================
// VICTORIA
// ============================================================

function drawVictory() {

    overlay(0.68);


    title(
        winner ===
        "left"

            ? t("winLeft")
            : t("winRight"),

        H / 2 - 50,

        UI.winner
    );


    interactiveItems()
        .forEach(
            drawButton
        );
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


    if (startMenuOpen) {

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


    if (fpsOpen) {

        drawFps();

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

        frameAccumulator -=
            stepMs;

        if (replayPlaying) {

            frameAccumulator =
                0;

            break;
        }
    }


    drawGame();

    requestAnimationFrame(
        loop
    );
}


resetBall();
requestAnimationFrame(
    loop
);
