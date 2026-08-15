```javascript
// ============================================================
// ARGENPONG — GAME.JS
// ============================================================

// ============================================================
// VARIABLES / CONFIGURACIÓN
// ============================================================

const W = 1280;
const H = 720;
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TABLE = {
    margin: 10,
    left: 10,
    right: W - 10,
    top: 10,
    bottom: H - 10
};

const COLORS = {
    green: "#1f5f3a",
    blue: "#174a78",
    black: "#000000"
};

const DEFAULTS = {
    courtColor: "black",
    paddleSensitivity: 1,
    ballSpeed: 5,
    progressive: false,
    progressiveSensitivity: 1
};

const PADDLE = {
    width: 20,
    height: 120,
    margin: 40,
    speed: 8
};

const BALL = {
    size: 20,
    maxSpeed: 11,
    baseY: 5
};

const SENS = {
    min: 0.5,
    max: 2,
    step: 0.1
};

const PHYSICS = {
    speedMin: 1,
    speedMax: 10,
    speedStep: 1,
    sensitivityMin: 0.5,
    sensitivityMax: 2,
    sensitivityStep: 0.1,
    increment: 0.05
};

const MATCH = {
    winScore: 11,
    winMargin: 2
};

const UI = {
    menuTitle: "bold 48px monospace",
    menuButton: "bold 24px monospace",
    winner: "bold 52px monospace",
    revenge: "bold 28px monospace",
    buttonW: 300,
    buttonH: 60,
    gap: 20
};

const SUBMENU = {
    buttonW: 280,
    buttonH: 55,
    gap: 15,
    startY: 150
};

const CONTROLS = {
    buttonW: 180,
    buttonH: 42,
    leftX: 140,
    rightX: 680,
    startY: 170,
    rowGap: 58
};

const REVENGE = {
    width: 260,
    height: 60,
    x: (W - 260) / 2,
    y: H / 2 + 55
};

const CENTER_LINE = {
    width: 4,
    dash: 20,
    gap: 20
};

// ============================================================
// ESTADO DEL JUEGO
// ============================================================

let courtColor = DEFAULTS.courtColor;

let leftScore = 0;
let rightScore = 0;

let servingPlayer = "left";

let gameOver = false;
let winner = null;

let gamePaused = false;
let settingsOpen = false;
let controlsOpen = false;
let backgroundOpen = false;
let physicsOpen = false;

let hoveredButton = null;
let waitingForKey = null;

let ballSpeed = DEFAULTS.ballSpeed;
let progressiveSpeed = DEFAULTS.progressive;
let progressiveSensitivity = DEFAULTS.progressiveSensitivity;

// ============================================================
// PALETAS / PELOTA
// ============================================================

const leftPaddle = {
    x: PADDLE.margin,
    y: (H - PADDLE.height) / 2
};

const rightPaddle = {
    x: W - PADDLE.margin - PADDLE.width,
    y: (H - PADDLE.height) / 2
};

const ball = {
    x: (W - BALL.size) / 2,
    y: (H - BALL.size) / 2,
    velocityX: DEFAULTS.ballSpeed,
    velocityY: BALL.baseY
};

// ============================================================
// CONTROLES
// ============================================================

const playerDefaults = {
    left: {
        up: "w",
        down: "s",
        mouse: false,
        sensitivity: DEFAULTS.paddleSensitivity
    },
    right: {
        up: "ArrowUp",
        down: "ArrowDown",
        mouse: false,
        sensitivity: DEFAULTS.paddleSensitivity
    }
};

const playerControls = structuredClone(playerDefaults);
const keys = {};

let mouseY = H / 2;
let previousMouseY = null;

// ============================================================
// AUDIO
// ============================================================

let audioContext = null;
let audioMuted = false;

function initializeAudio() {
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === "suspended") audioContext.resume();
}

function playSound(frequency, duration, volume) {
    if (audioMuted || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime
    );

    gain.gain.setValueAtTime(
        volume,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

const sounds = {
    wall: () => playSound(500, 0.06, 0.08),
    paddle: () => playSound(800, 0.07, 0.1),
    point: () => playSound(180, 0.2, 0.12)
};

function toggleMute() {
    audioMuted = !audioMuted;
}

// ============================================================
// UTILIDADES
// ============================================================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function round1(value) {
    return Math.round(value * 10) / 10;
}

function isInsideButton(mx, my, x, y, w, h) {
    return (
        mx >= x &&
        mx <= x + w &&
        my >= y &&
        my <= y + h
    );
}

function buttonY(start, index, height, gap) {
    return start + index * (height + gap);
}

function canvasMouse(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) * W / rect.width,
        y: (event.clientY - rect.top) * H / rect.height
    };
}

function formatKey(key) {
    const names = {
        ArrowUp: "↑",
        ArrowDown: "↓",
        ArrowLeft: "←",
        ArrowRight: "→",
        " ": "SPACE"
    };

    return names[key] ||
        (key.length === 1 ? key.toUpperCase() : key.toUpperCase());
}

function setCourtColor(color) {
    if (COLORS[color]) courtColor = color;
}

// ============================================================
// RESTABLECER AJUSTES
// ============================================================

function resetControlsDefaults() {
    for (const player of ["left", "right"]) {
        playerControls[player] = {
            ...structuredClone(playerDefaults[player])
        };
    }

    waitingForKey = null;
}

function resetBackgroundDefaults() {
    courtColor = DEFAULTS.courtColor;
}

function resetPhysicsDefaults() {
    ballSpeed = DEFAULTS.ballSpeed;
    progressiveSpeed = DEFAULTS.progressive;
    progressiveSensitivity = DEFAULTS.progressiveSensitivity;
}

// ============================================================
// TECLADO
// ============================================================

window.addEventListener("keydown", event => {
    initializeAudio();

    // Reasignación de controles
    if (waitingForKey) {
        event.preventDefault();

        if (event.key === "Escape") {
            waitingForKey = null;
            return;
        }

        const { player, action } = waitingForKey;

        // Evitamos asignar teclas reservadas
        if (event.key !== "Escape") {
            playerControls[player][action] = event.key;
        }

        waitingForKey = null;
        return;
    }

    const key = event.key.toLowerCase();

    if (key === "m") {
        event.preventDefault();
        toggleMute();
        return;
    }

    if (event.key === "Escape") {
        event.preventDefault();
        handleEscape();
        return;
    }

    if (gamePaused || gameOver) return;

    keys[event.key] = true;
});

window.addEventListener("keyup", event => {
    keys[event.key] = false;
});

// ============================================================
// ESC — COMPORTAMIENTO GLOBAL
// ============================================================

function handleEscape() {
    if (gameOver) return;

    // Desde cualquier submenu:
    // ESC vuelve directamente al juego.
    if (
        waitingForKey ||
        controlsOpen ||
        backgroundOpen ||
        physicsOpen ||
        settingsOpen
    ) {
        waitingForKey = null;
        controlsOpen = false;
        backgroundOpen = false;
        physicsOpen = false;
        settingsOpen = false;
        gamePaused = false;
        hoveredButton = null;
        return;
    }

    // Si estamos pausados, continuar.
    if (gamePaused) {
        gamePaused = false;
        hoveredButton = null;
        return;
    }

    // Si estamos jugando, pausar.
    gamePaused = true;
    hoveredButton = null;
}

// ============================================================
// MOUSE
// ============================================================

canvas.addEventListener("mousemove", event => {
    const { x, y } = canvasMouse(event);

    mouseY = y;

    // Control por mouse
    if (
        !gamePaused &&
        !gameOver &&
        !settingsOpen &&
        !controlsOpen &&
        !backgroundOpen &&
        !physicsOpen
    ) {
        if (previousMouseY !== null) {
            const delta = y - previousMouseY;

            if (playerControls.left.mouse) {
                leftPaddle.y +=
                    delta * playerControls.left.sensitivity;
            }

            if (playerControls.right.mouse) {
                rightPaddle.y +=
                    delta * playerControls.right.sensitivity;
            }
        }
    }

    previousMouseY = y;

    updateHoveredButton(x, y);
});

// ============================================================
// CLICK
// ============================================================

canvas.addEventListener("click", event => {
    const { x, y } = canvasMouse(event);

    if (gameOver) {
        if (
            isInsideButton(
                x,
                y,
                REVENGE.x,
                REVENGE.y,
                REVENGE.width,
                REVENGE.height
            )
        ) {
            restartGame();
        }

        return;
    }

    if (controlsOpen) {
        handleControlsClick(x, y);
        return;
    }

    if (backgroundOpen) {
        handleBackgroundClick(x, y);
        return;
    }

    if (physicsOpen) {
        handlePhysicsClick(x, y);
        return;
    }

    if (settingsOpen) {
        handleSettingsClick(x, y);
        return;
    }

    if (gamePaused) {
        handlePauseClick(x, y);
    }
});

// ============================================================
// PAUSA
// ============================================================

function pauseButton(index) {
    return buttonY(
        H / 2 - 70,
        index,
        UI.buttonH,
        UI.gap
    );
}

function handlePauseClick(x, y) {
    const bx = (W - UI.buttonW) / 2;

    if (
        isInsideButton(
            x,
            y,
            bx,
            pauseButton(0),
            UI.buttonW,
            UI.buttonH
        )
    ) {
        gamePaused = false;
        return;
    }

    if (
        isInsideButton(
            x,
            y,
            bx,
            pauseButton(1),
            UI.buttonW,
            UI.buttonH
        )
    ) {
        settingsOpen = true;
    }
}

// ============================================================
// AJUSTES
// ============================================================

function settingsButton(index) {
    const start = H / 2 - 125;

    return buttonY(
        start,
        index,
        55,
        15
    );
}

function handleSettingsClick(x, y) {
    const bx = (W - 240) / 2;

    const actions = [
        () => controlsOpen = true,
        () => backgroundOpen = true,
        () => physicsOpen = true,
        () => settingsOpen = false
    ];

    for (let i = 0; i < actions.length; i++) {
        if (
            isInsideButton(
                x,
                y,
                bx,
                settingsButton(i),
                240,
                55
            )
        ) {
            actions[i]();
            hoveredButton = null;
            return;
        }
    }
}

// ============================================================
// FONDO
// ============================================================

function backgroundButton(index) {
    return buttonY(
        SUBMENU.startY,
        index,
        SUBMENU.buttonH,
        SUBMENU.gap
    );
}

function handleBackgroundClick(x, y) {
    const bx = (W - SUBMENU.buttonW) / 2;

    const colors = ["green", "blue", "black"];

    for (let i = 0; i < colors.length; i++) {
        if (
            isInsideButton(
                x,
                y,
                bx,
                backgroundButton(i),
                SUBMENU.buttonW,
                SUBMENU.buttonH
            )
        ) {
            setCourtColor(colors[i]);
            return;
        }
    }

    if (
        isInsideButton(
            x,
            y,
            bx,
            backgroundButton(3),
            SUBMENU.buttonW,
            SUBMENU.buttonH
        )
    ) {
        backgroundOpen = false;
    }
}

// ============================================================
// FÍSICAS
// ============================================================

function physicsButton(index) {
    return buttonY(
        SUBMENU.startY,
        index,
        SUBMENU.buttonH,
        SUBMENU.gap
    );
}

function handlePhysicsClick(x, y) {
    const bx = (W - 300) / 2;

    if (
        isInsideButton(
            x,
            y,
            bx,
            physicsButton(0),
            300,
            55
        )
    ) {
        ballSpeed = clamp(
            ballSpeed + PHYSICS.speedStep,
            PHYSICS.speedMin,
            PHYSICS.speedMax
        );
        return;
    }

    if (
        isInsideButton(
            x,
            y,
            bx,
            physicsButton(1),
            300,
            55
        )
    ) {
        ballSpeed = clamp(
            ballSpeed - PHYSICS.speedStep,
            PHYSICS.speedMin,
            PHYSICS.speedMax
        );
        return;
    }

    if (
        isInsideButton(
            x,
            y,
            bx,
            physicsButton(2),
            300,
            55
        )
    ) {
        progressiveSpeed = !progressiveSpeed;
        return;
    }

    const sensY = physicsButton(3);

    if (
        isInsideButton(
            x,
            y,
            bx,
            sensY,
            45,
            55
        )
    ) {
        progressiveSensitivity = round1(
            clamp(
                progressiveSensitivity -
                PHYSICS.sensitivityStep,
                PHYSICS.sensitivityMin,
                PHYSICS.sensitivityMax
            )
        );
        return;
    }

    if (
        isInsideButton(
            x,
            y,
            bx + 255,
            sensY,
            45,
            55
        )
    ) {
        progressiveSensitivity = round1(
            clamp(
                progressiveSensitivity +
                PHYSICS.sensitivityStep,
                PHYSICS.sensitivityMin,
                PHYSICS.sensitivityMax
            )
        );
        return;
    }

    if (
        isInsideButton(
            x,
            y,
            bx,
            physicsButton(4),
            300,
            55
        )
    ) {
        physicsOpen = false;
    }

    if (
        isInsideButton(
            x,
            y,
            bx,
            physicsButton(5),
            300,
            55
        )
    ) {
        resetPhysicsDefaults();
    }
}

// ============================================================
// CONTROLES
// ============================================================

function controlRow(index) {
    return CONTROLS.startY +
        index * CONTROLS.rowGap;
}

function controlPlayerX(player) {
    return player === "left"
        ? CONTROLS.leftX
        : CONTROLS.rightX;
}

function startKeyRebind(player, action) {
    waitingForKey = { player, action };
}

function changeSensitivity(player, amount) {
    const data = playerControls[player];

    data.sensitivity = round1(
        clamp(
            data.sensitivity + amount,
            SENS.min,
            SENS.max
        )
    );
}

function handleControlsClick(x, y) {
    for (const player of ["left", "right"]) {
        const px = controlPlayerX(player);
        const bx = px + 125;

        // ARRIBA
        if (
            isInsideButton(
                x,
                y,
                bx,
                controlRow(0),
                CONTROLS.buttonW,
                CONTROLS.buttonH
            )
        ) {
            startKeyRebind(player, "up");
            return;
        }

        // ABAJO
        if (
            isInsideButton(
                x,
                y,
                bx,
                controlRow(1),
                CONTROLS.buttonW,
                CONTROLS.buttonH
            )
        ) {
            startKeyRebind(player, "down");
            return;
        }

        // MOUSE
        if (
            isInsideButton(
                x,
                y,
                bx,
                controlRow(2),
                CONTROLS.buttonW,
                CONTROLS.buttonH
            )
        ) {
            playerControls[player].mouse =
                !playerControls[player].mouse;
            return;
        }

        // SENS -
        if (
            isInsideButton(
                x,
                y,
                bx,
                controlRow(3),
                45,
                CONTROLS.buttonH
            )
        ) {
            changeSensitivity(
                player,
                -SENS.step
            );
            return;
        }

        // SENS +
        if (
            isInsideButton(
                x,
                y,
                bx + 135,
                controlRow(3),
                45,
                CONTROLS.buttonH
            )
        ) {
            changeSensitivity(
                player,
                SENS.step
            );
            return;
        }
    }

    // VOLVER
    if (
        isInsideButton(
            x,
            y,
            (W - 220) / 2,
            625,
            220,
            50
        )
    ) {
        controlsOpen = false;
        waitingForKey = null;
        return;
    }

    // RESTABLECER
    if (
        isInsideButton(
            x,
            y,
            (W - 220) / 2,
            565,
            220,
            50
        )
    ) {
        resetControlsDefaults();
    }
}

// ============================================================
// HOVER
// ============================================================

function updateHoveredButton(x, y) {
    hoveredButton = null;

    if (gameOver) {
        if (
            isInsideButton(
                x,
                y,
                REVENGE.x,
                REVENGE.y,
                REVENGE.width,
                REVENGE.height
            )
        ) {
            hoveredButton = "revenge";
        }

        return;
    }

    if (controlsOpen) {
        updateControlsHover(x, y);
        return;
    }

    if (backgroundOpen) {
        updateBackgroundHover(x, y);
        return;
    }

    if (physicsOpen) {
        updatePhysicsHover(x, y);
        return;
    }

    if (settingsOpen) {
        updateSettingsHover(x, y);
        return;
    }

    if (gamePaused) {
        const bx = (W - UI.buttonW) / 2;

        if (
            isInsideButton(
                x,
                y,
                bx,
                pauseButton(0),
                UI.buttonW,
                UI.buttonH
            )
        ) {
            hoveredButton = "continue";
            return;
        }

        if (
            isInsideButton(
                x,
                y,
                bx,
                pauseButton(1),
                UI.buttonW,
                UI.buttonH
            )
        ) {
            hoveredButton = "settings";
        }
    }
}

function updateSettingsHover(x, y) {
    const bx = (W - 240) / 2;

    const ids = [
        "controls",
        "background",
        "physics",
        "settingsBack"
    ];

    for (let i = 0; i < ids.length; i++) {
        if (
            isInsideButton(
                x,
                y,
                bx,
                settingsButton(i),
                240,
                55
            )
        ) {
            hoveredButton = ids[i];
            return;
        }
    }
}

function updateBackgroundHover(x, y) {
    const bx = (W - SUBMENU.buttonW) / 2;

    const ids = [
        "background-green",
        "background-blue",
        "background-black",
        "backgroundBack"
    ];

    for (let i = 0; i < ids.length; i++) {
        if (
            isInsideButton(
                x,
                y,
                bx,
                backgroundButton(i),
                SUBMENU.buttonW,
                SUBMENU.buttonH
            )
        ) {
            hoveredButton = ids[i];
            return;
        }
    }
}

function updatePhysicsHover(x, y) {
    const bx = (W - 300) / 2;

    const ids = [
        "physics-speed-plus",
        "physics-speed-minus",
        "physics-progressive"
    ];

    for (let i = 0; i < ids.length; i++) {
        if (
            isInsideButton(
                x,
                y,
                bx,
                physicsButton(i),
                300,
                55
            )
        ) {
            hoveredButton = ids[i];
            return;
        }
    }

    if (
        isInsideButton(
            x,
            y,
            bx,
            physicsButton(3),
            45,
            55
        )
    ) {
        hoveredButton = "physics-sens-minus";
        return;
    }

    if (
        isInsideButton(
            x,
            y,
            bx + 255,
            physicsButton(3),
            45,
            55
        )
    ) {
        hoveredButton = "physics-sens-plus";
        return;
    }

    if (
        isInsideButton(
            x,
            y,
            bx,
            physicsButton(4),
            300,
            55
        )
    ) {
        hoveredButton = "physicsBack";
        return;
    }

    if (
        isInsideButton(
            x,
            y,
            bx,
            physicsButton(5),
            300,
            55
        )
    ) {
        hoveredButton = "physicsReset";
    }
}

function updateControlsHover(x, y) {
    for (const player of ["left", "right"]) {
        const px = controlPlayerX(player);
        const bx = px + 125;

        const ids = [
            `${player}-up`,
            `${player}-down`,
            `${player}-mouse`
        ];

        for (let i = 0; i < ids.length; i++) {
            if (
                isInsideButton(
                    x,
                    y,
                    bx,
                    controlRow(i),
                    CONTROLS.buttonW,
                    CONTROLS.buttonH
                )
            ) {
                hoveredButton = ids[i];
                return;
            }
        }

        if (
            isInsideButton(
                x,
                y,
                bx,
                controlRow(3),
                45,
                CONTROLS.buttonH
            )
        ) {
            hoveredButton = `${player}-sens-minus`;
            return;
        }

        if (
            isInsideButton(
                x,
                y,
                bx + 135,
                controlRow(3),
                45,
                CONTROLS.buttonH
            )
        ) {
            hoveredButton = `${player}-sens-plus`;
            return;
        }
    }

    if (
        isInsideButton(
            x,
            y,
            (W - 220) / 2,
            565,
            220,
            50
        )
    ) {
        hoveredButton = "controlsReset";
        return;
    }

    if (
        isInsideButton(
            x,
            y,
            (W - 220) / 2,
            625,
            220,
            50
        )
    ) {
        hoveredButton = "controlsBack";
    }
}

// ============================================================
// PALETAS
// ============================================================

function updatePaddles() {
    if (gamePaused || gameOver) return;

    for (const player of ["left", "right"]) {
        const paddle =
            player === "left"
                ? leftPaddle
                : rightPaddle;

        const controls =
            playerControls[player];

        if (keys[controls.up]) {
            paddle.y -=
                PADDLE.speed *
                controls.sensitivity;
        }

        if (keys[controls.down]) {
            paddle.y +=
                PADDLE.speed *
                controls.sensitivity;
        }

        paddle.y = clamp(
            paddle.y,
            TABLE.top,
            TABLE.bottom - PADDLE.height
        );
    }
}

// ============================================================
// FÍSICA DE LA PELOTA
// ============================================================

function applyProgressiveSpeed() {
    if (!progressiveSpeed) return;

    const multiplier =
        1 +
        PHYSICS.increment *
        progressiveSensitivity;

    const max = Math.min(
        PHYSICS.speedMax,
        BALL.maxSpeed
    );

    const vx = Math.abs(ball.velocityX) * multiplier;
    const vy = Math.abs(ball.velocityY) * multiplier;

    ball.velocityX =
        Math.sign(ball.velocityX || 1) *
        Math.min(vx, max);

    ball.velocityY =
        Math.sign(ball.velocityY || 1) *
        Math.min(vy, max);
}

function updateBall() {
    if (gamePaused || gameOver) return;

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Pared superior
    if (ball.y <= TABLE.top) {
        ball.y = TABLE.top;
        ball.velocityY *= -1;
        applyProgressiveSpeed();
        sounds.wall();
    }

    // Pared inferior
    if (ball.y + BALL.size >= TABLE.bottom) {
        ball.y = TABLE.bottom - BALL.size;
        ball.velocityY *= -1;
        applyProgressiveSpeed();
        sounds.wall();
    }

    // Paleta izquierda
    if (
        ball.x <= leftPaddle.x + PADDLE.width &&
        ball.x + BALL.size >= leftPaddle.x &&
        ball.y + BALL.size >= leftPaddle.y &&
        ball.y <= leftPaddle.y + PADDLE.height &&
        ball.velocityX < 0
    ) {
        ball.x = leftPaddle.x + PADDLE.width;
        ball.velocityX *= -1;
        applyProgressiveSpeed();
        sounds.paddle();
    }

    // Paleta derecha
    if (
        ball.x + BALL.size >= rightPaddle.x &&
        ball.x <= rightPaddle.x + PADDLE.width &&
        ball.y + BALL.size >= rightPaddle.y &&
        ball.y <= rightPaddle.y + PADDLE.height &&
        ball.velocityX > 0
    ) {
        ball.x = rightPaddle.x - BALL.size;
        ball.velocityX *= -1;
        applyProgressiveSpeed();
        sounds.paddle();
    }

    // Punto para derecha
    if (ball.x + BALL.size < TABLE.left) {
        rightScore++;
        sounds.point();
        handlePoint();
        return;
    }

    // Punto para izquierda
    if (ball.x > TABLE.right) {
        leftScore++;
        sounds.point();
        handlePoint();
    }
}

// ============================================================
// LÓGICA DEL PARTIDO
// ============================================================

function checkWinner() {
    if (
        leftScore < MATCH.winScore &&
        rightScore < MATCH.winScore
    ) {
        return false;
    }

    return (
        Math.abs(leftScore - rightScore) >=
        MATCH.winMargin
    );
}

function updateServe() {
    if (leftScore >= 10 && rightScore >= 10) {
        servingPlayer =
            servingPlayer === "left"
                ? "right"
                : "left";

        return;
    }

    const block =
        Math.floor(
            (leftScore + rightScore) / 2
        );

    servingPlayer =
        block % 2 === 0
            ? "left"
            : "right";
}

function resetBall() {
    ball.x = (W - BALL.size) / 2;
    ball.y = (H - BALL.size) / 2;

    ball.velocityX =
        servingPlayer === "left"
            ? Math.abs(ballSpeed)
            : -Math.abs(ballSpeed);

    ball.velocityY =
        Math.sign(ball.velocityY || 1) *
        BALL.baseY;
}

function handlePoint() {
    if (checkWinner()) {
        gameOver = true;

        winner =
            leftScore > rightScore
                ? "left"
                : "right";

        return;
    }

    updateServe();
    resetBall();
}

function restartGame() {
    leftScore = 0;
    rightScore = 0;

    servingPlayer = "left";

    gameOver = false;
    winner = null;

    gamePaused = false;
    settingsOpen = false;
    controlsOpen = false;
    backgroundOpen = false;
    physicsOpen = false;

    waitingForKey = null;
    hoveredButton = null;

    leftPaddle.y =
        (H - PADDLE.height) / 2;

    rightPaddle.y =
        (H - PADDLE.height) / 2;

    resetBall();
}

// ============================================================
// MOTOR GRÁFICO
// ============================================================

function drawButton(text, x, y, w, h, id = null) {
    const hover = hoveredButton === id;

    ctx.lineWidth = hover ? 5 : 3;
    ctx.strokeStyle = "#FFFFFF";

    if (hover) {
        ctx.fillStyle =
            "rgba(255,255,255,0.12)";

        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = UI.menuButton;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        text,
        x + w / 2,
        y + h / 2
    );

    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
}

function drawControlLabel(text, x, y) {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.fillText(
        text,
        x,
        y + CONTROLS.buttonH / 2
    );
}

function drawControlButton(
    text,
    x,
    y,
    w,
    h,
    id = null
) {
    const hover = hoveredButton === id;

    ctx.lineWidth = hover ? 4 : 2;
    ctx.strokeStyle = "#FFFFFF";

    if (hover) {
        ctx.fillStyle =
            "rgba(255,255,255,0.12)";

        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        text,
        x + w / 2,
        y + h / 2
    );

    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
}

// ============================================================
// MESA
// ============================================================

function drawTable() {
    ctx.fillStyle = COLORS[courtColor];

    ctx.fillRect(
        TABLE.left,
        TABLE.top,
        TABLE.right - TABLE.left,
        TABLE.bottom - TABLE.top
    );

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;

    ctx.strokeRect(
        TABLE.left,
        TABLE.top,
        TABLE.right - TABLE.left,
        TABLE.bottom - TABLE.top
    );

    ctx.lineWidth = CENTER_LINE.width;

    ctx.setLineDash([
        CENTER_LINE.dash,
        CENTER_LINE.gap
    ]);

    ctx.beginPath();
    ctx.moveTo(W / 2, TABLE.top);
    ctx.lineTo(W / 2, TABLE.bottom);
    ctx.stroke();

    ctx.setLineDash([]);
}

// ============================================================
// PALETAS / PELOTA / MARCADOR
// ============================================================

function drawPaddles() {
    ctx.fillStyle = "#FFFFFF";

    ctx.fillRect(
        leftPaddle.x,
        leftPaddle.y,
        PADDLE.width,
        PADDLE.height
    );

    ctx.fillRect(
        rightPaddle.x,
        rightPaddle.y,
        PADDLE.width,
        PADDLE.height
    );
}

function drawBall() {
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();

    ctx.arc(
        ball.x + BALL.size / 2,
        ball.y + BALL.size / 2,
        BALL.size / 2,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function drawScore() {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 48px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    ctx.fillText(
        String(leftScore).padStart(2, "0"),
        W / 4,
        TABLE.bottom - 20
    );

    ctx.fillText(
        String(rightScore).padStart(2, "0"),
        W * 3 / 4,
        TABLE.bottom - 20
    );

    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
}

// ============================================================
// MENÚ DE PAUSA
// ============================================================

function drawPauseMenu() {
    drawOverlay(0.70);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = UI.menuTitle;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "PAUSA",
        W / 2,
        H / 2 - 150
    );

    const bx = (W - UI.buttonW) / 2;

    drawButton(
        "CONTINUAR",
        bx,
        pauseButton(0),
        UI.buttonW,
        UI.buttonH,
        "continue"
    );

    drawButton(
        "AJUSTES",
        bx,
        pauseButton(1),
        UI.buttonW,
        UI.buttonH,
        "settings"
    );

    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
}

// ============================================================
// AJUSTES
// ============================================================

function drawSettingsMenu() {
    drawOverlay(0.75);

    drawTitle("AJUSTES");

    const bx = (W - 240) / 2;

    const buttons = [
        ["CONTROLES", "controls"],
        ["FONDO", "background"],
        ["FÍSICAS", "physics"],
        ["VOLVER", "settingsBack"]
    ];

    buttons.forEach(([text, id], i) => {
        drawButton(
            text,
            bx,
            settingsButton(i),
            240,
            55,
            id
        );
    });
}

// ============================================================
// FONDO
// ============================================================

function drawBackgroundMenu() {
    drawOverlay(0.80);
    drawTitle("FONDO");

    const bx = (W - SUBMENU.buttonW) / 2;

    const buttons = [
        ["VERDE", "background-green"],
        ["AZUL", "background-blue"],
        ["NEGRO", "background-black"],
        ["RESTABLECER", "background-reset"],
        ["VOLVER", "backgroundBack"]
    ];

    buttons.forEach(([text, id], i) => {
        drawButton(
            text,
            bx,
            backgroundButton(i),
            SUBMENU.buttonW,
            SUBMENU.buttonH,
            id
        );
    });
}

// ============================================================
// FÍSICAS
// ============================================================

function drawPhysicsMenu() {
    drawOverlay(0.80);
    drawTitle("FÍSICAS");

    const bx = (W - 300) / 2;

    drawButton(
        `VELOCIDAD +   ${ballSpeed}`,
        bx,
        physicsButton(0),
        300,
        55,
        "physics-speed-plus"
    );

    drawButton(
        `VELOCIDAD -   ${ballSpeed}`,
        bx,
        physicsButton(1),
        300,
        55,
        "physics-speed-minus"
    );

    drawButton(
        `PROGRESIVA: ${progressiveSpeed ? "ON" : "OFF"}`,
        bx,
        physicsButton(2),
        300,
        55,
        "physics-progressive"
    );

    const sy = physicsButton(3);

    drawControlLabel(
        "SENS. PROGRESIVA",
        bx - 120,
        sy
    );

    drawControlButton(
        "-",
        bx,
        sy,
        45,
        55,
        "physics-sens-minus"
    );

    drawControlButton(
        progressiveSensitivity.toFixed(1),
        bx + 55,
        sy,
        200,
        55
    );

    drawControlButton(
        "+",
        bx + 255,
        sy,
        45,
        55,
        "physics-sens-plus"
    );

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";

    ctx.fillText(
        `VELOCIDAD ACTUAL: ${ballSpeed}`,
        W / 2,
        520
    );

    drawButton(
        "VOLVER",
        bx,
        physicsButton(4),
        300,
        55,
        "physicsBack"
    );

    drawButton(
        "RESTABLECER",
        bx,
        physicsButton(5),
        300,
        55,
        "physicsReset"
    );

    ctx.textAlign = "start";
}

// ============================================================
// CONTROLES
// ============================================================

function drawControlsMenu() {
    drawOverlay(0.80);
    drawTitle("CONTROLES");

    ctx.font = "bold 30px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";

    // Columnas centradas de forma simétrica
    const centers = {
        left: 360,
        right: 920
    };

    ctx.fillText("IZQUIERDA", centers.left, 120);
    ctx.fillText("DERECHA", centers.right, 120);

    for (const player of ["left", "right"]) {
        const data = playerControls[player];
        const px =
            player === "left"
                ? CONTROLS.leftX
                : CONTROLS.rightX;

        const bx = px + 125;

        drawControlLabel(
            "ARRIBA",
            px,
            controlRow(0)
        );

        drawControlButton(
            waitingForKey?.player === player &&
            waitingForKey?.action === "up"
                ? "PRESIONÁ..."
                : formatKey(data.up),
            bx,
            controlRow(0),
            CONTROLS.buttonW,
            CONTROLS.buttonH,
            `${player}-up`
        );

        drawControlLabel(
            "ABAJO",
            px,
            controlRow(1)
        );

        drawControlButton(
            waitingForKey?.player === player &&
            waitingForKey?.action === "down"
                ? "PRESIONÁ..."
                : formatKey(data.down),
            bx,
            controlRow(1),
            CONTROLS.buttonW,
            CONTROLS.buttonH,
            `${player}-down`
        );

        drawControlLabel(
            "MOUSE",
            px,
            controlRow(2)
        );

        drawControlButton(
            data.mouse ? "ON" : "OFF",
            bx,
            controlRow(2),
            CONTROLS.buttonW,
            CONTROLS.buttonH,
            `${player}-mouse`
        );

        drawControlLabel(
            "SENS.",
            px,
            controlRow(3)
        );

        drawControlButton(
            "-",
            bx,
            controlRow(3),
            45,
            CONTROLS.buttonH,
            `${player}-sens-minus`
        );

        drawControlButton(
            data.sensitivity.toFixed(1),
            bx + 50,
            controlRow(3),
            80,
            CONTROLS.buttonH
        );

        drawControlButton(
            "+",
            bx + 135,
            controlRow(3),
            45,
            CONTROLS.buttonH,
            `${player}-sens-plus`
        );
    }

    ctx.font = "16px monospace";
    ctx.fillText(
        "Click en una tecla para reasignarla · ESC cancela",
        W / 2,
        535
    );

    drawButton(
        "RESTABLECER",
        (W - 220) / 2,
        565,
        220,
        50,
        "controlsReset"
    );

    drawButton(
        "VOLVER",
        (W - 220) / 2,
        625,
        220,
        50,
        "controlsBack"
    );

    ctx.textAlign = "start";
}

// ============================================================
// VICTORIA
// ============================================================

function drawVictoryScreen() {
    drawOverlay(0.65);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = UI.winner;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        winner === "left"
            ? "LA IZQUIERDA GANA"
            : "LA DERECHA GANA",
        W / 2,
        H / 2 - 35
    );

    drawButton(
        "¿REVANCHA?",
        REVENGE.x,
        REVENGE.y,
        REVENGE.width,
        REVENGE.height,
        "revenge"
    );

    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
}

// ============================================================
// UTILIDADES GRÁFICAS
// ============================================================

function drawOverlay(alpha) {
    ctx.fillStyle =
        `rgba(0,0,0,${alpha})`;

    ctx.fillRect(
        TABLE.left,
        TABLE.top,
        TABLE.right - TABLE.left,
        TABLE.bottom - TABLE.top
    );
}

function drawTitle(text) {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = UI.menuTitle;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        text,
        W / 2,
        70
    );
}

// ============================================================
// DIBUJAR TODO
// ============================================================

function drawGame() {
    ctx.clearRect(0, 0, W, H);

    drawTable();
    drawPaddles();
    drawBall();
    drawScore();

    if (gameOver) {
        drawVictoryScreen();
        return;
    }

    if (controlsOpen) {
        drawControlsMenu();
        return;
    }

    if (backgroundOpen) {
        drawBackgroundMenu();
        return;
    }

    if (physicsOpen) {
        drawPhysicsMenu();
        return;
    }

    if (settingsOpen) {
        drawSettingsMenu();
        return;
    }

    if (gamePaused) {
        drawPauseMenu();
    }
}

// ============================================================
// LOOP
// ============================================================

function gameLoop() {
    updatePaddles();
    updateBall();
    drawGame();

    requestAnimationFrame(gameLoop);
}

gameLoop();
```
