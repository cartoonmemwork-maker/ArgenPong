// ============================================================
// ARGENPONG — GAME.JS
// ============================================================

// ==================== VARIABLES ====================

const W = 1280, H = 720;
const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");

const TABLE = { left: 10, right: W - 10, top: 10, bottom: H - 10 };
const COLORS = {
    green: "#1f5f3a",
    blue: "#174a78",
    black: "#000000"
};

const DEFAULTS = {
    background: "black",
    left: { up: "w", down: "s", mouse: false, sensitivity: 1 },
    right: { up: "ArrowUp", down: "ArrowDown", mouse: false, sensitivity: 1 },
    physics: {
        speed: 5,
        progressive: false,
        progressiveSensitivity: 1
    },
    muted: false
};

let courtColor = DEFAULTS.background;
let ballSpeed = DEFAULTS.physics.speed;
let progressiveSpeed = DEFAULTS.physics.progressive;
let progressiveSensitivity = DEFAULTS.physics.progressiveSensitivity;
let audioMuted = DEFAULTS.muted;

const playerControls = {
    left: { ...DEFAULTS.left },
    right: { ...DEFAULTS.right }
};

const keys = {};
let waitingForKey = null;

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

let audioContext = null;


// ==================== MESA ====================

const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 120;
const PADDLE_MARGIN = 40;

const leftPaddle = {
    x: PADDLE_MARGIN,
    y: (H - PADDLE_HEIGHT) / 2
};

const rightPaddle = {
    x: W - PADDLE_MARGIN - PADDLE_WIDTH,
    y: (H - PADDLE_HEIGHT) / 2
};

const ball = {
    size: 20,
    x: (W - 20) / 2,
    y: (H - 20) / 2,
    velocityX: 7,
    velocityY: 5
};


// ==================== CONFIGURACIÓN ====================

const SCORE_FONT = "bold 48px monospace";
const MENU_TITLE_FONT = "bold 48px monospace";
const MENU_BUTTON_FONT = "bold 24px monospace";
const WINNER_FONT = "bold 52px monospace";
const REVENGE_FONT = "bold 28px monospace";

const GAME_WIN_SCORE = 11;
const WIN_MARGIN = 2;

const CENTER_LINE_WIDTH = 4;
const CENTER_LINE_DASH = 20;
const CENTER_LINE_GAP = 20;

const PADDLE_SENSITIVITY_MIN = 0.5;
const PADDLE_SENSITIVITY_MAX = 2;
const PADDLE_SENSITIVITY_STEP = 0.1;

const PHYSICS_SPEED_MIN = 1;
const PHYSICS_SPEED_MAX = 10;

const PHYSICS_SENSITIVITY_MIN = 0.5;
const PHYSICS_SENSITIVITY_MAX = 2;
const PHYSICS_SENSITIVITY_STEP = 0.1;

const REVENGE = {
    x: W / 2 - 130,
    y: H / 2 + 55,
    w: 260,
    h: 60
};

const MENU = {
    w: 300,
    h: 60,
    gap: 20,
    startY: H / 2 - 70
};

const SETTINGS = {
    w: 280,
    h: 55,
    gap: 15,
    startY: 150
};

const CONTROLS = {
    buttonW: 180,
    buttonH: 42,
    leftX: 180,
    rightX: W - 180 - 180,
    startY: 170,
    rowGap: 58
};


// ==================== UTILIDADES ====================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function inside(x, y, bx, by, bw, bh) {
    return x >= bx && x <= bx + bw &&
           y >= by && y <= by + bh;
}

function formatKey(key) {
    const names = {
        ArrowUp: "↑",
        ArrowDown: "↓",
        ArrowLeft: "←",
        ArrowRight: "→",
        " ": "SPACE"
    };

    return names[key] || (key.length === 1 ? key.toUpperCase() : key.toUpperCase());
}

function controlRow(index) {
    return CONTROLS.startY + index * CONTROLS.rowGap;
}


// ==================== AUDIO ====================

function initializeAudio() {
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === "suspended") audioContext.resume();
}

function playSound(frequency, duration, volume) {
    if (audioMuted || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

function playWallSound() {
    playSound(500, 0.06, 0.08);
}

function playPaddleSound() {
    playSound(800, 0.07, 0.1);
}

function playPointSound() {
    playSound(180, 0.2, 0.12);
}

function toggleMute() {
    audioMuted = !audioMuted;
}


// ==================== FÍSICAS ====================

// 1 → 3
// 5 → 7
// 10 → 11
function getBaseBallSpeed() {
    return 3 + (ballSpeed - 1) * (8 / 9);
}

function getPaddleSpeed(player) {
    return 8 * playerControls[player].sensitivity;
}

function applyProgressiveSpeed() {
    if (!progressiveSpeed) return;

    const amount =
        0.05 +
        (progressiveSensitivity - 0.5) *
        (0.25 - 0.05) /
        1.5;

    const maxSpeed = 14;

    const sx = Math.sign(ball.velocityX);
    const sy = Math.sign(ball.velocityY);

    ball.velocityX =
        sx * Math.min(Math.abs(ball.velocityX) + amount, maxSpeed);

    ball.velocityY =
        sy * Math.min(Math.abs(ball.velocityY) + amount, maxSpeed);
}


// ==================== PELOTA ====================

function resetBall() {
    ball.x = (W - ball.size) / 2;
    ball.y = (H - ball.size) / 2;

    const speed = getBaseBallSpeed();

    ball.velocityX =
        servingPlayer === "left" ? speed : -speed;

    ball.velocityY =
        Math.random() < 0.5 ? -5 : 5;
}


// ==================== PALETAS ====================

function limitPaddles() {
    const min = TABLE.top;
    const max = TABLE.bottom - PADDLE_HEIGHT;

    leftPaddle.y = clamp(leftPaddle.y, min, max);
    rightPaddle.y = clamp(rightPaddle.y, min, max);
}

function updatePaddles() {
    if (gamePaused || gameOver) return;

    const leftSpeed = getPaddleSpeed("left");
    const rightSpeed = getPaddleSpeed("right");

    if (!playerControls.left.mouse) {
        if (keys[playerControls.left.up]) leftPaddle.y -= leftSpeed;
        if (keys[playerControls.left.down]) leftPaddle.y += leftSpeed;
    }

    if (!playerControls.right.mouse) {
        if (keys[playerControls.right.up]) rightPaddle.y -= rightSpeed;
        if (keys[playerControls.right.down]) rightPaddle.y += rightSpeed;
    }

    limitPaddles();
}


// ==================== ENTRADAS ====================

window.addEventListener("keydown", event => {
    initializeAudio();

    // Reasignación de teclas
    if (waitingForKey) {
        event.preventDefault();

        if (event.key === "Escape") {
            waitingForKey = null;
            return;
        }

        playerControls[waitingForKey.player][waitingForKey.action] = event.key;
        waitingForKey = null;
        return;
    }

    const key = event.key.toLowerCase();

    // Mute
    if (key === "m") {
        event.preventDefault();
        toggleMute();
        return;
    }

    // ESC — SIEMPRE vuelve al juego
    if (event.key === "Escape") {
        event.preventDefault();

        gamePaused = false;
        settingsOpen = false;
        controlsOpen = false;
        backgroundOpen = false;
        physicsOpen = false;
        hoveredButton = null;
        waitingForKey = null;

        return;
    }

    if (gamePaused || gameOver) return;

    keys[event.key] = true;
});

window.addEventListener("keyup", event => {
    keys[event.key] = false;
});


// ==================== MOUSE ====================

let previousMouseY = null;

canvas.addEventListener("mousemove", event => {
    const rect = canvas.getBoundingClientRect();

    const mouseX =
        (event.clientX - rect.left) *
        W / rect.width;

    const mouseY =
        (event.clientY - rect.top) *
        H / rect.height;

    // Mouse como control durante el juego
    if (
        !gamePaused &&
        !gameOver &&
        !settingsOpen &&
        !controlsOpen &&
        !backgroundOpen &&
        !physicsOpen
    ) {
        if (previousMouseY !== null) {
            const delta = mouseY - previousMouseY;

            if (playerControls.left.mouse) {
                leftPaddle.y +=
                    delta * playerControls.left.sensitivity;
            }

            if (playerControls.right.mouse) {
                rightPaddle.y +=
                    delta * playerControls.right.sensitivity;
            }

            limitPaddles();
        }
    }

    previousMouseY = mouseY;

    updateHover(mouseX, mouseY);
});

canvas.addEventListener("click", event => {
    const rect = canvas.getBoundingClientRect();

    const mouseX =
        (event.clientX - rect.left) *
        W / rect.width;

    const mouseY =
        (event.clientY - rect.top) *
        H / rect.height;

    if (gameOver) {
        if (hit("revenge", mouseX, mouseY)) restartGame();
        return;
    }

    if (controlsOpen) {
        handleControlsClick(mouseX, mouseY);
        return;
    }

    if (backgroundOpen) {
        handleBackgroundClick(mouseX, mouseY);
        return;
    }

    if (physicsOpen) {
        handlePhysicsClick(mouseX, mouseY);
        return;
    }

    if (settingsOpen) {
        handleSettingsClick(mouseX, mouseY);
        return;
    }

    if (gamePaused) {
        handlePauseClick(mouseX, mouseY);
    }
});


// ==================== BOTONES ====================

function getButton(id) {
    const pause = {
        continue: {
            x: W / 2 - MENU.w / 2,
            y: MENU.startY,
            w: MENU.w,
            h: MENU.h
        },
        settings: {
            x: W / 2 - MENU.w / 2,
            y: MENU.startY + MENU.h + MENU.gap,
            w: MENU.w,
            h: MENU.h
        }
    };

    const settings = {
        controls: { x: W / 2 - SETTINGS.w / 2, y: SETTINGS.startY, w: SETTINGS.w, h: SETTINGS.h },
        background: { x: W / 2 - SETTINGS.w / 2, y: SETTINGS.startY + 70, w: SETTINGS.w, h: SETTINGS.h },
        physics: { x: W / 2 - SETTINGS.w / 2, y: SETTINGS.startY + 140, w: SETTINGS.w, h: SETTINGS.h },
        settingsBack: { x: W / 2 - SETTINGS.w / 2, y: SETTINGS.startY + 210, w: SETTINGS.w, h: SETTINGS.h }
    };

    const background = {
        green: { x: W / 2 - SETTINGS.w / 2, y: SETTINGS.startY, w: SETTINGS.w, h: SETTINGS.h },
        blue: { x: W / 2 - SETTINGS.w / 2, y: SETTINGS.startY + 70, w: SETTINGS.w, h: SETTINGS.h },
        black: { x: W / 2 - SETTINGS.w / 2, y: SETTINGS.startY + 140, w: SETTINGS.w, h: SETTINGS.h },
        backgroundDefault: { x: W / 2 - SETTINGS.w / 2, y: SETTINGS.startY + 210, w: SETTINGS.w, h: SETTINGS.h },
        backgroundBack: { x: W / 2 - SETTINGS.w / 2, y: SETTINGS.startY + 280, w: SETTINGS.w, h: SETTINGS.h }
    };

    const controls = {
        leftUp: { x: CONTROLS.leftX + 125, y: controlRow(0), w: CONTROLS.buttonW, h: CONTROLS.buttonH },
        leftDown: { x: CONTROLS.leftX + 125, y: controlRow(1), w: CONTROLS.buttonW, h: CONTROLS.buttonH },
        leftMouse: { x: CONTROLS.leftX + 125, y: controlRow(2), w: CONTROLS.buttonW, h: CONTROLS.buttonH },
        leftMinus: { x: CONTROLS.leftX + 125, y: controlRow(3), w: 45, h: CONTROLS.buttonH },
        leftPlus: { x: CONTROLS.leftX + 260, y: controlRow(3), w: 45, h: CONTROLS.buttonH },

        rightUp: { x: CONTROLS.rightX + 125, y: controlRow(0), w: CONTROLS.buttonW, h: CONTROLS.buttonH },
        rightDown: { x: CONTROLS.rightX + 125, y: controlRow(1), w: CONTROLS.buttonW, h: CONTROLS.buttonH },
        rightMouse: { x: CONTROLS.rightX + 125, y: controlRow(2), w: CONTROLS.buttonW, h: CONTROLS.buttonH },
        rightMinus: { x: CONTROLS.rightX + 125, y: controlRow(3), w: 45, h: CONTROLS.buttonH },
        rightPlus: { x: CONTROLS.rightX + 260, y: controlRow(3), w: 45, h: CONTROLS.buttonH },

        controlsDefault: { x: W / 2 - 130, y: 560, w: 260, h: 50 },
        controlsBack: { x: W / 2 - 110, y: 625, w: 220, h: 50 }
    };

    const physics = {
        speed: { x: W / 2 - 300, y: 150, w: 600, h: 55 },
        progressive: { x: W / 2 - 300, y: 220, w: 600, h: 55 },
        progressiveSens: { x: W / 2 - 300, y: 290, w: 600, h: 55 },
        physicsDefault: { x: W / 2 - 140, y: 390, w: 280, h: 50 },
        physicsBack: { x: W / 2 - 110, y: 455, w: 220, h: 50 }
    };

    if (pause[id]) return pause[id];
    if (settings[id]) return settings[id];
    if (background[id]) return background[id];
    if (controls[id]) return controls[id];
    if (physics[id]) return physics[id];

    if (id === "revenge") return REVENGE;

    return null;
}

function hit(id, x, y) {
    const b = getButton(id);
    return b && inside(x, y, b.x, b.y, b.w, b.h);
}


// ==================== PAUSA / AJUSTES ====================

function handlePauseClick(x, y) {
    if (hit("continue", x, y)) {
        gamePaused = false;
        return;
    }

    if (hit("settings", x, y)) {
        settingsOpen = true;
    }
}

function handleSettingsClick(x, y) {
    if (hit("controls", x, y)) {
        controlsOpen = true;
        return;
    }

    if (hit("background", x, y)) {
        backgroundOpen = true;
        return;
    }

    if (hit("physics", x, y)) {
        physicsOpen = true;
        return;
    }

    if (hit("settingsBack", x, y)) {
        settingsOpen = false;
    }
}


// ==================== CONTROLES ====================

function startKeyRebind(player, action) {
    waitingForKey = { player, action };
}

function changeSensitivity(player, amount) {
    const value = clamp(
        playerControls[player].sensitivity + amount,
        PADDLE_SENSITIVITY_MIN,
        PADDLE_SENSITIVITY_MAX
    );

    playerControls[player].sensitivity =
        Math.round(value * 10) / 10;
}

function handleControlsClick(x, y) {
    const players = [
        { name: "left", x: CONTROLS.leftX },
        { name: "right", x: CONTROLS.rightX }
    ];

    for (const player of players) {
        const c = playerControls[player.name];
        const bx = player.x + 125;

        if (inside(x, y, bx, controlRow(0), CONTROLS.buttonW, CONTROLS.buttonH)) {
            startKeyRebind(player.name, "up");
            return;
        }

        if (inside(x, y, bx, controlRow(1), CONTROLS.buttonW, CONTROLS.buttonH)) {
            startKeyRebind(player.name, "down");
            return;
        }

        if (inside(x, y, bx, controlRow(2), CONTROLS.buttonW, CONTROLS.buttonH)) {
            c.mouse = !c.mouse;
            return;
        }

        if (inside(x, y, bx, controlRow(3), 45, CONTROLS.buttonH)) {
            changeSensitivity(player.name, -PADDLE_SENSITIVITY_STEP);
            return;
        }

        if (inside(x, y, player.x + 260, controlRow(3), 45, CONTROLS.buttonH)) {
            changeSensitivity(player.name, PADDLE_SENSITIVITY_STEP);
            return;
        }
    }

    if (hit("controlsDefault", x, y)) {
        playerControls.left = { ...DEFAULTS.left };
        playerControls.right = { ...DEFAULTS.right };
        waitingForKey = null;
        return;
    }

    if (hit("controlsBack", x, y)) {
        controlsOpen = false;
        waitingForKey = null;
    }
}


// ==================== FONDO ====================

function handleBackgroundClick(x, y) {
    if (hit("green", x, y)) courtColor = "green";
    else if (hit("blue", x, y)) courtColor = "blue";
    else if (hit("black", x, y)) courtColor = "black";
    else if (hit("backgroundDefault", x, y)) courtColor = DEFAULTS.background;
    else if (hit("backgroundBack", x, y)) backgroundOpen = false;
}


// ==================== FÍSICAS ====================

function physicsBarValue(x) {
    const b = getButton("speed");
    const percentage = clamp((x - b.x) / b.w, 0, 1);
    return Math.round(1 + percentage * 9);
}

function progressiveBarValue(x) {
    const b = getButton("progressiveSens");
    const percentage = clamp((x - b.x) / b.w, 0, 1);

    return Math.round(
        (PADDLE_SENSITIVITY_MIN +
            percentage *
            (PADDLE_SENSITIVITY_MAX - PADDLE_SENSITIVITY_MIN)) * 10
    ) / 10;
}

function handlePhysicsClick(x, y) {
    if (hit("speed", x, y)) {
        ballSpeed = physicsBarValue(x);
        resetBall();
        return;
    }

    if (hit("progressive", x, y)) {
        progressiveSpeed = !progressiveSpeed;
        return;
    }

    if (hit("progressiveSens", x, y)) {
        progressiveSensitivity = progressiveBarValue(x);
        return;
    }

    if (hit("physicsDefault", x, y)) {
        ballSpeed = DEFAULTS.physics.speed;
        progressiveSpeed = DEFAULTS.physics.progressive;
        progressiveSensitivity = DEFAULTS.physics.progressiveSensitivity;
        resetBall();
        return;
    }

    if (hit("physicsBack", x, y)) {
        physicsOpen = false;
    }
}


// ==================== PELOTA ====================

function updateBall() {
    if (gamePaused || gameOver) return;

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Rebote superior
    if (ball.y <= TABLE.top) {
        ball.y = TABLE.top;
        ball.velocityY = Math.abs(ball.velocityY);
        applyProgressiveSpeed();
        playWallSound();
    }

    // Rebote inferior
    if (ball.y + ball.size >= TABLE.bottom) {
        ball.y = TABLE.bottom - ball.size;
        ball.velocityY = -Math.abs(ball.velocityY);
        applyProgressiveSpeed();
        playWallSound();
    }

    // Paleta izquierda
    if (
        ball.velocityX < 0 &&
        ball.x <= leftPaddle.x + PADDLE_WIDTH &&
        ball.x + ball.size >= leftPaddle.x &&
        ball.y + ball.size >= leftPaddle.y &&
        ball.y <= leftPaddle.y + PADDLE_HEIGHT
    ) {
        ball.x = leftPaddle.x + PADDLE_WIDTH;
        ball.velocityX = Math.abs(ball.velocityX);
        applyProgressiveSpeed();
        playPaddleSound();
    }

    // Paleta derecha
    if (
        ball.velocityX > 0 &&
        ball.x + ball.size >= rightPaddle.x &&
        ball.x <= rightPaddle.x + PADDLE_WIDTH &&
        ball.y + ball.size >= rightPaddle.y &&
        ball.y <= rightPaddle.y + PADDLE_HEIGHT
    ) {
        ball.x = rightPaddle.x - ball.size;
        ball.velocityX = -Math.abs(ball.velocityX);
        applyProgressiveSpeed();
        playPaddleSound();
    }

    // Punto para derecha
    if (ball.x + ball.size < TABLE.left) {
        rightScore++;
        playPointSound();
        handlePoint();
        return;
    }

    // Punto para izquierda
    if (ball.x > TABLE.right) {
        leftScore++;
        playPointSound();
        handlePoint();
    }
}


// ==================== LÓGICA DEL PARTIDO ====================

function handlePoint() {
    if (checkWinner()) {
        gameOver = true;
        winner = leftScore > rightScore ? "left" : "right";
        return;
    }

    updateServe();
    resetBall();
}

function checkWinner() {
    if (leftScore < GAME_WIN_SCORE && rightScore < GAME_WIN_SCORE) {
        return false;
    }

    return Math.abs(leftScore - rightScore) >= WIN_MARGIN;
}

function updateServe() {
    // Deuce: saque alternado cada punto
    if (leftScore >= 10 && rightScore >= 10) {
        servingPlayer =
            servingPlayer === "left" ? "right" : "left";
        return;
    }

    // Normal: saque cada dos puntos
    servingPlayer =
        Math.floor((leftScore + rightScore) / 2) % 2 === 0
            ? "left"
            : "right";
}


// ==================== REINICIO ====================

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

    leftPaddle.y = (H - PADDLE_HEIGHT) / 2;
    rightPaddle.y = (H - PADDLE_HEIGHT) / 2;

    resetBall();
}


// ==================== HOVER ====================

function updateHover(x, y) {
    hoveredButton = null;

    if (gameOver) {
        if (hit("revenge", x, y)) hoveredButton = "revenge";
        return;
    }

    if (controlsOpen) {
        const ids = [
            "leftUp", "leftDown", "leftMouse", "leftMinus", "leftPlus",
            "rightUp", "rightDown", "rightMouse", "rightMinus", "rightPlus",
            "controlsDefault", "controlsBack"
        ];

        for (const id of ids) {
            if (hit(id, x, y)) {
                hoveredButton = id;
                return;
            }
        }
        return;
    }

    if (backgroundOpen) {
        const ids = [
            "green", "blue", "black",
            "backgroundDefault", "backgroundBack"
        ];

        for (const id of ids) {
            if (hit(id, x, y)) {
                hoveredButton = id;
                return;
            }
        }
        return;
    }

    if (physicsOpen) {
        const ids = [
            "speed", "progressive", "progressiveSens",
            "physicsDefault", "physicsBack"
        ];

        for (const id of ids) {
            if (hit(id, x, y)) {
                hoveredButton = id;
                return;
            }
        }
        return;
    }

    if (settingsOpen) {
        const ids = [
            "controls", "background", "physics", "settingsBack"
        ];

        for (const id of ids) {
            if (hit(id, x, y)) {
                hoveredButton = id;
                return;
            }
        }
        return;
    }

    if (gamePaused) {
        if (hit("continue", x, y)) hoveredButton = "continue";
        else if (hit("settings", x, y)) hoveredButton = "settings";
    }
}


// ==================== MOTOR GRÁFICO ====================

function drawButton(id, text) {
    const b = getButton(id);
    if (!b) return;

    const hover = hoveredButton === id;

    context.fillStyle =
        hover
            ? "rgba(255,255,255,0.12)"
            : "rgba(0,0,0,0.15)";

    context.fillRect(b.x, b.y, b.w, b.h);

    context.strokeStyle = "#FFFFFF";
    context.lineWidth = hover ? 5 : 3;
    context.strokeRect(b.x, b.y, b.w, b.h);

    context.fillStyle = "#FFFFFF";
    context.font = MENU_BUTTON_FONT;
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(
        text,
        b.x + b.w / 2,
        b.y + b.h / 2
    );
}

function drawBar(id, label, value, min, max) {
    const b = getButton(id);
    const hover = hoveredButton === id;

    context.fillStyle =
        hover
            ? "rgba(255,255,255,0.12)"
            : "rgba(0,0,0,0.15)";

    context.fillRect(b.x, b.y, b.w, b.h);

    context.strokeStyle = "#FFFFFF";
    context.lineWidth = hover ? 5 : 3;
    context.strokeRect(b.x, b.y, b.w, b.h);

    context.fillStyle = "#FFFFFF";
    context.font = "bold 20px monospace";
    context.textAlign = "left";
    context.textBaseline = "middle";

    context.fillText(label, b.x + 18, b.y + b.h / 2);

    const barX = b.x + b.w - 190;
    const barY = b.y + 18;
    const barW = 150;
    const barH = 18;

    context.strokeRect(barX, barY, barW, barH);

    const percentage = (value - min) / (max - min);

    context.fillRect(
        barX,
        barY,
        barW * percentage,
        barH
    );

    context.textAlign = "right";

    context.fillText(
        value.toFixed ? value.toFixed(1) : value,
        barX + barW + 25,
        b.y + b.h / 2
    );
}

function drawOverlay(alpha = 0.75) {
    context.fillStyle = `rgba(0,0,0,${alpha})`;

    context.fillRect(
        TABLE.left,
        TABLE.top,
        TABLE.right - TABLE.left,
        TABLE.bottom - TABLE.top
    );
}

function drawTitle(text, y = 70) {
    context.fillStyle = "#FFFFFF";
    context.font = MENU_TITLE_FONT;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, W / 2, y);
}


// ==================== MESA ====================

function drawTable() {
    context.fillStyle = COLORS[courtColor];

    context.fillRect(
        TABLE.left,
        TABLE.top,
        TABLE.right - TABLE.left,
        TABLE.bottom - TABLE.top
    );

    context.strokeStyle = "#FFFFFF";
    context.lineWidth = 4;

    context.strokeRect(
        TABLE.left,
        TABLE.top,
        TABLE.right - TABLE.left,
        TABLE.bottom - TABLE.top
    );

    context.lineWidth = CENTER_LINE_WIDTH;
    context.setLineDash([
        CENTER_LINE_DASH,
        CENTER_LINE_GAP
    ]);

    context.beginPath();
    context.moveTo(W / 2, TABLE.top);
    context.lineTo(W / 2, TABLE.bottom);
    context.stroke();

    context.setLineDash([]);
}


// ==================== OBJETOS ====================

function drawPaddles() {
    context.fillStyle = "#FFFFFF";

    context.fillRect(
        leftPaddle.x,
        leftPaddle.y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
    );

    context.fillRect(
        rightPaddle.x,
        rightPaddle.y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
    );
}

function drawBall() {
    context.fillStyle = "#FFFFFF";

    context.beginPath();

    context.arc(
        ball.x + ball.size / 2,
        ball.y + ball.size / 2,
        ball.size / 2,
        0,
        Math.PI * 2
    );

    context.fill();
}

function drawScore() {
    context.fillStyle = "#FFFFFF";
    context.font = SCORE_FONT;
    context.textAlign = "center";
    context.textBaseline = "bottom";

    context.fillText(
        String(leftScore).padStart(2, "0"),
        W / 4,
        H - 20
    );

    context.fillText(
        String(rightScore).padStart(2, "0"),
        W * 3 / 4,
        H - 20
    );
}


// ==================== MENÚ PAUSA ====================

function drawPauseMenu() {
    drawOverlay(0.70);
    drawTitle("PAUSA", H / 2 - 150);

    drawButton("continue", "CONTINUAR");
    drawButton("settings", "AJUSTES");
}


// ==================== AJUSTES ====================

function drawSettingsMenu() {
    drawOverlay(0.75);
    drawTitle("AJUSTES");

    drawButton("controls", "CONTROLES");
    drawButton("background", "FONDO");
    drawButton("physics", "FÍSICAS");
    drawButton("settingsBack", "VOLVER");
}


// ==================== CONTROLES ====================

function drawControlLabel(text, x, y) {
    context.fillStyle = "#FFFFFF";
    context.font = "bold 20px monospace";
    context.textAlign = "left";
    context.textBaseline = "middle";

    context.fillText(
        text,
        x,
        y + CONTROLS.buttonH / 2
    );
}

function drawControlsMenu() {
    drawOverlay(0.80);
    drawTitle("CONTROLES", 65);

    context.font = "bold 30px monospace";
    context.textAlign = "center";

    context.fillText(
        "IZQUIERDA",
        CONTROLS.leftX + 145,
        120
    );

    context.fillText(
        "DERECHA",
        CONTROLS.rightX + 145,
        120
    );

    const players = [
        { name: "left", x: CONTROLS.leftX },
        { name: "right", x: CONTROLS.rightX }
    ];

    for (const player of players) {
        const c = playerControls[player.name];
        const x = player.x;

        drawControlLabel("ARRIBA", x, controlRow(0));

        drawButtonControl(
            player.name + "Up",
            waitingForKey &&
            waitingForKey.player === player.name &&
            waitingForKey.action === "up"
                ? "PRESIONÁ..."
                : formatKey(c.up)
        );

        drawControlLabel("ABAJO", x, controlRow(1));

        drawButtonControl(
            player.name + "Down",
            waitingForKey &&
            waitingForKey.player === player.name &&
            waitingForKey.action === "down"
                ? "PRESIONÁ..."
                : formatKey(c.down)
        );

        drawControlLabel("MOUSE", x, controlRow(2));

        drawButtonControl(
            player.name + "Mouse",
            c.mouse ? "ON" : "OFF"
        );

        drawControlLabel("SENS.", x, controlRow(3));

        drawButtonControl(player.name + "Minus", "-");
        drawButtonControl(player.name + "Plus", "+");

        // Valor de sensibilidad
        const valueX = x + 225;

        context.fillStyle = "#FFFFFF";
        context.font = "bold 18px monospace";
        context.textAlign = "center";
        context.textBaseline = "middle";

        context.fillText(
            c.sensitivity.toFixed(1),
            valueX,
            controlRow(3) + CONTROLS.buttonH / 2
        );
    }

    context.font = "16px monospace";
    context.textAlign = "center";

    context.fillText(
        "Click en ARRIBA/ABAJO para reasignar · ESC cancela",
        W / 2,
        545
    );

    drawButton("controlsDefault", "RESTABLECER POR DEFECTO");
    drawButton("controlsBack", "VOLVER");
}

function drawButtonControl(id, text) {
    const b = getButton(id);
    const hover = hoveredButton === id;

    context.fillStyle =
        hover
            ? "rgba(255,255,255,0.12)"
            : "rgba(0,0,0,0.15)";

    context.fillRect(b.x, b.y, b.w, b.h);

    context.strokeStyle = "#FFFFFF";
    context.lineWidth = hover ? 4 : 2;
    context.strokeRect(b.x, b.y, b.w, b.h);

    context.fillStyle = "#FFFFFF";
    context.font = "bold 18px monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(
        text,
        b.x + b.w / 2,
        b.y + b.h / 2
    );
}


// ==================== FONDO ====================

function drawBackgroundMenu() {
    drawOverlay(0.80);
    drawTitle("FONDO");

    drawButton("green", "VERDE");
    drawButton("blue", "AZUL");
    drawButton("black", "NEGRO");
    drawButton("backgroundDefault", "RESTABLECER POR DEFECTO");
    drawButton("backgroundBack", "VOLVER");
}


// ==================== FÍSICAS ====================

function drawPhysicsMenu() {
    drawOverlay(0.80);
    drawTitle("FÍSICAS");

    drawBar(
        "speed",
        "VELOCIDAD",
        ballSpeed,
        PHYSICS_SPEED_MIN,
        PHYSICS_SPEED_MAX
    );

    drawButton(
        "progressive",
        `VELOCIDAD PROGRESIVA: ${progressiveSpeed ? "ON" : "OFF"}`
    );

    drawBar(
        "progressiveSens",
        "SENSIBILIDAD PROGRESIVA",
        progressiveSensitivity,
        PHYSICS_SENSITIVITY_MIN,
        PHYSICS_SENSITIVITY_MAX
    );

    context.fillStyle = "#FFFFFF";
    context.font = "bold 18px monospace";
    context.textAlign = "center";

    context.fillText(
        `VELOCIDAD BASE: ${getBaseBallSpeed().toFixed(1)}`,
        W / 2,
        375
    );

    drawButton(
        "physicsDefault",
        "RESTABLECER POR DEFECTO"
    );

    drawButton(
        "physicsBack",
        "VOLVER"
    );
}


// ==================== VICTORIA ====================

function drawVictoryScreen() {
    drawOverlay(0.65);

    context.fillStyle = "#FFFFFF";
    context.font = WINNER_FONT;
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(
        winner === "left"
            ? "LA IZQUIERDA GANA"
            : "LA DERECHA GANA",
        W / 2,
        H / 2 - 35
    );

    drawButton("revenge", "¿REVANCHA?");
}


// ==================== RENDER FINAL ====================

function drawGame() {
    context.clearRect(0, 0, W, H);

    drawTable();
    drawPaddles();
    drawBall();
    drawScore();

    if (gameOver) {
        drawVictoryScreen();
    } else if (controlsOpen) {
        drawControlsMenu();
    } else if (backgroundOpen) {
        drawBackgroundMenu();
    } else if (physicsOpen) {
        drawPhysicsMenu();
    } else if (settingsOpen) {
        drawSettingsMenu();
    } else if (gamePaused) {
        drawPauseMenu();
    }
}


// ==================== BUCLE PRINCIPAL ====================

function gameLoop() {
    updatePaddles();
    updateBall();
    drawGame();

    requestAnimationFrame(gameLoop);
}


// ==================== INICIO ====================

resetBall();
gameLoop();
