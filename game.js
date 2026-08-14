// ============================================================
// ARGENPONG — GAME.JS
// ============================================================

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");

// ============================================================
// CANCHA
// ============================================================

const COURT_MARGIN = 10;

const COURT_LEFT = COURT_MARGIN;
const COURT_RIGHT = CANVAS_WIDTH - COURT_MARGIN;
const COURT_TOP = COURT_MARGIN;
const COURT_BOTTOM = CANVAS_HEIGHT - COURT_MARGIN;

const COURT_COLORS = {
    green: "#1f5f3a",
    blue: "#174a78",
    black: "#000000"
};

let courtColor = "black";

// ============================================================
// PALETAS
// ============================================================

const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 120;
const PADDLE_MARGIN = 40;

const PADDLE_SPEED = 8;

const PADDLE_SENSITIVITY_MIN = 0.5;
const PADDLE_SENSITIVITY_MAX = 2.0;
const PADDLE_SENSITIVITY_STEP = 0.1;

// ============================================================
// PELOTA / FÍSICAS
// ============================================================

const BALL_SIZE = 20;

const BALL_SPEED_X = 7;
const BALL_SPEED_Y = 5;

let ballSpeed = BALL_SPEED_X;

let progressiveSpeed = false;
let progressiveSensitivity = 1.0;

const PHYSICS_SPEED_MIN = 3;
const PHYSICS_SPEED_MAX = 15;
const PHYSICS_SPEED_STEP = 1;

const PHYSICS_SENSITIVITY_MIN = 0.5;
const PHYSICS_SENSITIVITY_MAX = 2.0;
const PHYSICS_SENSITIVITY_STEP = 0.1;

const PROGRESSIVE_INCREMENT = 0.05;

// ============================================================
// LÍNEA CENTRAL
// ============================================================

const CENTER_LINE_WIDTH = 4;
const CENTER_LINE_DASH = 20;
const CENTER_LINE_GAP = 20;

// ============================================================
// MARCADOR
// ============================================================

const SCORE_FONT = "bold 48px monospace";
const SCORE_Y = COURT_BOTTOM - 20;

// ============================================================
// PARTIDO
// ============================================================

const GAME_WIN_SCORE = 11;
const WIN_MARGIN = 2;

// ============================================================
// VICTORIA
// ============================================================

const WINNER_FONT = "bold 52px monospace";
const REVENGE_FONT = "bold 28px monospace";

const REVENGE_BUTTON_WIDTH = 260;
const REVENGE_BUTTON_HEIGHT = 60;

const REVENGE_BUTTON_X =
    (CANVAS_WIDTH - REVENGE_BUTTON_WIDTH) / 2;

const REVENGE_BUTTON_Y =
    CANVAS_HEIGHT / 2 + 55;

// ============================================================
// MENÚ
// ============================================================

const MENU_TITLE_FONT = "bold 48px monospace";
const MENU_BUTTON_FONT = "bold 24px monospace";

const MENU_BUTTON_WIDTH = 300;
const MENU_BUTTON_HEIGHT = 60;
const MENU_BUTTON_GAP = 20;

const MENU_START_Y =
    CANVAS_HEIGHT / 2 - 70;

// ============================================================
// ESTADO DE MENÚS
// ============================================================

let gamePaused = false;
let settingsOpen = false;
let controlsOpen = false;
let backgroundOpen = false;
let physicsOpen = false;

let hoveredButton = null;

// ============================================================
// AUDIO
// ============================================================

let audioContext = null;
let audioMuted = false;

// ============================================================
// MARCADOR
// ============================================================

let leftScore = 0;
let rightScore = 0;

// ============================================================
// SAQUE
// ============================================================

let servingPlayer = "left";

// ============================================================
// PARTIDO
// ============================================================

let gameOver = false;
let winner = null;

// ============================================================
// PALETAS
// ============================================================

const leftPaddle = {
    x: PADDLE_MARGIN,
    y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2
};

const rightPaddle = {
    x: CANVAS_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH,
    y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2
};

// ============================================================
// PELOTA
// ============================================================

const ball = {
    x: (CANVAS_WIDTH - BALL_SIZE) / 2,
    y: (CANVAS_HEIGHT - BALL_SIZE) / 2,
    velocityX: BALL_SPEED_X,
    velocityY: BALL_SPEED_Y
};

// ============================================================
// CONTROLES
// ============================================================

const playerControls = {
    left: {
        up: "w",
        down: "s",
        mouse: false,
        sensitivity: 1
    },

    right: {
        up: "ArrowUp",
        down: "ArrowDown",
        mouse: false,
        sensitivity: 1
    }
};

const keys = {};

let waitingForKey = null;

// ============================================================
// MOUSE
// ============================================================

let mouseY = CANVAS_HEIGHT / 2;
let previousMouseY = null;

// ============================================================
// MENÚ CONTROLES
// ============================================================

const CONTROLS_BUTTON_WIDTH = 180;
const CONTROLS_BUTTON_HEIGHT = 42;

const CONTROLS_LEFT_X = 140;
const CONTROLS_RIGHT_X = 680;

const CONTROLS_START_Y = 170;
const CONTROLS_ROW_GAP = 58;

// ============================================================
// MENÚ AJUSTES
// ============================================================

const SETTINGS_BUTTON_WIDTH = 280;
const SETTINGS_BUTTON_HEIGHT = 55;
const SETTINGS_BUTTON_GAP = 15;

const SETTINGS_START_Y = 150;

// ============================================================
// SUBMENÚ FONDO
// ============================================================

const BACKGROUND_BUTTON_WIDTH = 280;
const BACKGROUND_BUTTON_HEIGHT = 55;
const BACKGROUND_BUTTON_GAP = 15;

const BACKGROUND_START_Y = 160;

// ============================================================
// SUBMENÚ FÍSICAS
// ============================================================

const PHYSICS_BUTTON_WIDTH = 300;
const PHYSICS_BUTTON_HEIGHT = 55;
const PHYSICS_BUTTON_GAP = 15;

const PHYSICS_START_Y = 150;

// ============================================================
// AUDIO
// ============================================================

function initializeAudio() {

    if (!audioContext) {
        audioContext = new AudioContext();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function playSound(frequency, duration, volume) {

    if (audioMuted || !audioContext) {
        return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "square";

    oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime
    );

    gainNode.gain.setValueAtTime(
        volume,
        audioContext.currentTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(
        audioContext.currentTime + duration
    );
}

function playWallSound() {
    playSound(500, 0.06, 0.08);
}

function playPaddleSound() {
    playSound(800, 0.07, 0.1);
}

function playMissSound() {
    playSound(180, 0.2, 0.12);
}

function toggleMute() {
    audioMuted = !audioMuted;
}

// ============================================================
// UTILIDADES
// ============================================================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function formatKey(key) {

    if (key === "ArrowUp") return "↑";
    if (key === "ArrowDown") return "↓";
    if (key === " ") return "SPACE";

    return key.toUpperCase();
}

function getControlRowY(index) {
    return CONTROLS_START_Y +
        index * CONTROLS_ROW_GAP;
}

function isInsideButton(
    mouseX,
    mouseY,
    x,
    y,
    width,
    height
) {

    return (
        mouseX >= x &&
        mouseX <= x + width &&
        mouseY >= y &&
        mouseY <= y + height
    );
}

function getPauseButtonY(index) {
    return MENU_START_Y +
        index * (MENU_BUTTON_HEIGHT + MENU_BUTTON_GAP);
}

// ============================================================
// COLOR DE CANCHA
// ============================================================

function setCourtColor(color) {

    if (COURT_COLORS[color]) {
        courtColor = color;
    }
}

// ============================================================
// PROGRESIÓN DE VELOCIDAD
// ============================================================

function increaseBallSpeed() {

    if (!progressiveSpeed) {
        return;
    }

    const factor =
        1 + PROGRESSIVE_INCREMENT * progressiveSensitivity;

    const currentSpeed =
        Math.sqrt(
            ball.velocityX * ball.velocityX +
            ball.velocityY * ball.velocityY
        );

    const newSpeed =
        Math.min(
            currentSpeed * factor,
            ballSpeed * 3
        );

    const directionX =
        ball.velocityX >= 0 ? 1 : -1;

    const directionY =
        ball.velocityY >= 0 ? 1 : -1;

    const ratio =
        Math.abs(ball.velocityY) /
        Math.max(Math.abs(ball.velocityX), 0.001);

    let newVX =
        newSpeed / Math.sqrt(1 + ratio * ratio);

    let newVY =
        newVX * ratio;

    ball.velocityX = newVX * directionX;
    ball.velocityY = newVY * directionY;
}

// ============================================================
// CONTROLES DE TECLADO
// ============================================================

window.addEventListener("keydown", (event) => {

    initializeAudio();

    const key = event.key.toLowerCase();

    // MUTE
    if (key === "m") {

        event.preventDefault();
        toggleMute();

        return;
    }

    // ESC
    if (event.key === "Escape") {

        event.preventDefault();

        if (waitingForKey) {
            waitingForKey = null;
            return;
        }

        handleEscape();

        return;
    }

    // REASIGNACIÓN
    if (waitingForKey) {

        event.preventDefault();

        const player =
            playerControls[waitingForKey.player];

        const action =
            waitingForKey.action;

        if (
            event.key !== "Escape" &&
            event.key !== "m"
        ) {
            player[action] = event.key;
            waitingForKey = null;
        }

        return;
    }

    if (gamePaused || gameOver) {
        return;
    }

    // CONTROLES DINÁMICOS
    if (key === playerControls.left.up.toLowerCase()) {
        keys.leftUp = true;
    }

    if (key === playerControls.left.down.toLowerCase()) {
        keys.leftDown = true;
    }

    if (event.key === playerControls.right.up) {
        keys.rightUp = true;
        event.preventDefault();
    }

    if (event.key === playerControls.right.down) {
        keys.rightDown = true;
        event.preventDefault();
    }
});

window.addEventListener("keyup", (event) => {

    const key = event.key.toLowerCase();

    if (key === playerControls.left.up.toLowerCase()) {
        keys.leftUp = false;
    }

    if (key === playerControls.left.down.toLowerCase()) {
        keys.leftDown = false;
    }

    if (event.key === playerControls.right.up) {
        keys.rightUp = false;
    }

    if (event.key === playerControls.right.down) {
        keys.rightDown = false;
    }
});

// ============================================================
// MOUSE
// ============================================================

canvas.addEventListener("mousemove", (event) => {

    const rect =
        canvas.getBoundingClientRect();

    const scaleY =
        CANVAS_HEIGHT / rect.height;

    mouseY =
        (event.clientY - rect.top) * scaleY;
});

// ============================================================
// ESC
// ============================================================

function handleEscape() {

    if (gameOver) {
        return;
    }

    if (waitingForKey) {
        waitingForKey = null;
        return;
    }

    if (backgroundOpen) {
        backgroundOpen = false;
        return;
    }

    if (physicsOpen) {
        physicsOpen = false;
        return;
    }

    if (controlsOpen) {
        controlsOpen = false;
        return;
    }

    if (settingsOpen) {
        settingsOpen = false;
        return;
    }

    gamePaused = !gamePaused;
}

// ============================================================
// CLICK
// ============================================================

canvas.addEventListener("click", (event) => {

    const rect =
        canvas.getBoundingClientRect();

    const scaleX =
        CANVAS_WIDTH / rect.width;

    const scaleY =
        CANVAS_HEIGHT / rect.height;

    const mouseX =
        (event.clientX - rect.left) * scaleX;

    const mouseYClick =
        (event.clientY - rect.top) * scaleY;

    if (gameOver) {

        if (
            isInsideButton(
                mouseX,
                mouseYClick,
                REVENGE_BUTTON_X,
                REVENGE_BUTTON_Y,
                REVENGE_BUTTON_WIDTH,
                REVENGE_BUTTON_HEIGHT
            )
        ) {
            restartGame();
        }

        return;
    }

    if (backgroundOpen) {
        handleBackgroundClick(mouseX, mouseYClick);
        return;
    }

    if (physicsOpen) {
        handlePhysicsClick(mouseX, mouseYClick);
        return;
    }

    if (controlsOpen) {
        handleControlsClick(mouseX, mouseYClick);
        return;
    }

    if (settingsOpen) {
        handleSettingsClick(mouseX, mouseYClick);
        return;
    }

    if (gamePaused) {
        handlePauseMenuClick(mouseX, mouseYClick);
    }
});

// ============================================================
// HOVER
// ============================================================

canvas.addEventListener("mousemove", (event) => {

    const rect =
        canvas.getBoundingClientRect();

    const scaleX =
        CANVAS_WIDTH / rect.width;

    const scaleY =
        CANVAS_HEIGHT / rect.height;

    const mouseX =
        (event.clientX - rect.left) * scaleX;

    const mouseYClick =
        (event.clientY - rect.top) * scaleY;

    hoveredButton = null;

    // VICTORIA
    if (gameOver) {

        if (
            isInsideButton(
                mouseX,
                mouseYClick,
                REVENGE_BUTTON_X,
                REVENGE_BUTTON_Y,
                REVENGE_BUTTON_WIDTH,
                REVENGE_BUTTON_HEIGHT
            )
        ) {
            hoveredButton = "revenge";
        }

        return;
    }

    // PAUSA
    if (gamePaused &&
        !settingsOpen &&
        !controlsOpen &&
        !backgroundOpen &&
        !physicsOpen) {

        const x =
            (CANVAS_WIDTH - MENU_BUTTON_WIDTH) / 2;

        if (
            isInsideButton(
                mouseX,
                mouseYClick,
                x,
                getPauseButtonY(0),
                MENU_BUTTON_WIDTH,
                MENU_BUTTON_HEIGHT
            )
        ) {
            hoveredButton = "continue";
        }

        if (
            isInsideButton(
                mouseX,
                mouseYClick,
                x,
                getPauseButtonY(1),
                MENU_BUTTON_WIDTH,
                MENU_BUTTON_HEIGHT
            )
        ) {
            hoveredButton = "settings";
        }

        return;
    }
});

// ============================================================
// MENÚ PAUSA
// ============================================================

function handlePauseMenuClick(mouseX, mouseY) {

    const buttonX =
        (CANVAS_WIDTH - MENU_BUTTON_WIDTH) / 2;

    if (
        isInsideButton(
            mouseX,
            mouseY,
            buttonX,
            getPauseButtonY(0),
            MENU_BUTTON_WIDTH,
            MENU_BUTTON_HEIGHT
        )
    ) {
        gamePaused = false;
        return;
    }

    if (
        isInsideButton(
            mouseX,
            mouseY,
            buttonX,
            getPauseButtonY(1),
            MENU_BUTTON_WIDTH,
            MENU_BUTTON_HEIGHT
        )
    ) {
        settingsOpen = true;
    }
}

// ============================================================
// AJUSTES
// ============================================================

function handleSettingsClick(mouseX, mouseY) {

    const x =
        (CANVAS_WIDTH - SETTINGS_BUTTON_WIDTH) / 2;

    const buttons = [
        {
            id: "controls",
            text: "CONTROLES"
        },
        {
            id: "background",
            text: "FONDO"
        },
        {
            id: "physics",
            text: "FÍSICAS"
        },
        {
            id: "back",
            text: "VOLVER"
        }
    ];

    buttons.forEach((button, index) => {

        const y =
            SETTINGS_START_Y +
            index *
            (SETTINGS_BUTTON_HEIGHT + SETTINGS_BUTTON_GAP);

        if (
            isInsideButton(
                mouseX,
                mouseY,
                x,
                y,
                SETTINGS_BUTTON_WIDTH,
                SETTINGS_BUTTON_HEIGHT
            )
        ) {

            if (button.id === "controls") {
                controlsOpen = true;
            }

            if (button.id === "background") {
                backgroundOpen = true;
            }

            if (button.id === "physics") {
                physicsOpen = true;
            }

            if (button.id === "back") {
                settingsOpen = false;
            }
        }
    });
}

// ============================================================
// FONDO
// ============================================================

function handleBackgroundClick(mouseX, mouseY) {

    const x =
        (CANVAS_WIDTH - BACKGROUND_BUTTON_WIDTH) / 2;

    const colors = [
        "green",
        "blue",
        "black"
    ];

    colors.forEach((color, index) => {

        const y =
            BACKGROUND_START_Y +
            index *
            (BACKGROUND_BUTTON_HEIGHT +
             BACKGROUND_BUTTON_GAP);

        if (
            isInsideButton(
                mouseX,
                mouseY,
                x,
                y,
                BACKGROUND_BUTTON_WIDTH,
                BACKGROUND_BUTTON_HEIGHT
            )
        ) {
            setCourtColor(color);
        }
    });

    const backY =
        BACKGROUND_START_Y +
        3 *
        (
            BACKGROUND_BUTTON_HEIGHT +
            BACKGROUND_BUTTON_GAP
        );

    if (
        isInsideButton(
            mouseX,
            mouseY,
            x,
            backY,
            BACKGROUND_BUTTON_WIDTH,
            BACKGROUND_BUTTON_HEIGHT
        )
    ) {
        backgroundOpen = false;
    }
}

// ============================================================
// FÍSICAS
// ============================================================

function handlePhysicsClick(mouseX, mouseY) {

    const x =
        (CANVAS_WIDTH - PHYSICS_BUTTON_WIDTH) / 2;

    const y1 = PHYSICS_START_Y;

    const y2 =
        y1 +
        PHYSICS_BUTTON_HEIGHT +
        PHYSICS_BUTTON_GAP;

    const y3 =
        y2 +
        PHYSICS_BUTTON_HEIGHT +
        PHYSICS_BUTTON_GAP;

    const y4 =
        y3 +
        PHYSICS_BUTTON_HEIGHT +
        PHYSICS_BUTTON_GAP;

    if (
        isInsideButton(
            mouseX,
            mouseY,
            x,
            y1,
            PHYSICS_BUTTON_WIDTH,
            PHYSICS_BUTTON_HEIGHT
        )
    ) {
        ballSpeed =
            clamp(
                ballSpeed + PHYSICS_SPEED_STEP,
                PHYSICS_SPEED_MIN,
                PHYSICS_SPEED_MAX
            );

        return;
    }

    if (
        isInsideButton(
            mouseX,
            mouseY,
            x,
            y2,
            PHYSICS_BUTTON_WIDTH,
            PHYSICS_BUTTON_HEIGHT
        )
    ) {
        progressiveSpeed = !progressiveSpeed;
        return;
    }

    if (
        isInsideButton(
            mouseX,
            mouseY,
            x,
            y3,
            PHYSICS_BUTTON_WIDTH,
            PHYSICS_BUTTON_HEIGHT
        )
    ) {
        progressiveSensitivity =
            clamp(
                progressiveSensitivity +
                PHYSICS_SENSITIVITY_STEP,
                PHYSICS_SENSITIVITY_MIN,
                PHYSICS_SENSITIVITY_MAX
            );

        return;
    }

    if (
        isInsideButton(
            mouseX,
            mouseY,
            x,
            y4,
            PHYSICS_BUTTON_WIDTH,
            PHYSICS_BUTTON_HEIGHT
        )
    ) {
        physicsOpen = false;
    }
}

// ============================================================
// CONTROLES
// ============================================================

function handleControlsClick(mouseX, mouseY) {

    const players = [
        {
            name: "left",
            x: CONTROLS_LEFT_X
        },
        {
            name: "right",
            x: CONTROLS_RIGHT_X
        }
    ];

    for (const player of players) {

        const data =
            playerControls[player.name];

        const x =
            player.x;

        // ARRIBA
        if (
            isInsideButton(
                mouseX,
                mouseY,
                x + 125,
                getControlRowY(0),
                CONTROLS_BUTTON_WIDTH,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            waitingForKey = {
                player: player.name,
                action: "up"
            };

            return;
        }

        // ABAJO
        if (
            isInsideButton(
                mouseX,
                mouseY,
                x + 125,
                getControlRowY(1),
                CONTROLS_BUTTON_WIDTH,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            waitingForKey = {
                player: player.name,
                action: "down"
            };

            return;
        }

        // MOUSE
        if (
            isInsideButton(
                mouseX,
                mouseY,
                x + 125,
                getControlRowY(2),
                CONTROLS_BUTTON_WIDTH,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            data.mouse = !data.mouse;
            return;
        }

        // SENSIBILIDAD -
        if (
            isInsideButton(
                mouseX,
                mouseY,
                x + 125,
                getControlRowY(3),
                45,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            data.sensitivity =
                clamp(
                    data.sensitivity -
                    PADDLE_SENSITIVITY_STEP,
                    PADDLE_SENSITIVITY_MIN,
                    PADDLE_SENSITIVITY_MAX
                );

            return;
        }

        // SENSIBILIDAD +
        if (
            isInsideButton(
                mouseX,
                mouseY,
                x + 260,
                getControlRowY(3),
                45,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            data.sensitivity =
                clamp(
                    data.sensitivity +
                    PADDLE_SENSITIVITY_STEP,
                    PADDLE_SENSITIVITY_MIN,
                    PADDLE_SENSITIVITY_MAX
                );

            return;
        }
    }

    // VOLVER
    if (
        isInsideButton(
            mouseX,
            mouseY,
            (CANVAS_WIDTH - 220) / 2,
            625,
            220,
            50
        )
    ) {
        controlsOpen = false;
    }
}

// ============================================================
// ACTUALIZAR PALETAS
// ============================================================

function updatePaddles() {

    if (gamePaused || gameOver) {
        return;
    }

    const leftSensitivity =
        playerControls.left.sensitivity;

    const rightSensitivity =
        playerControls.right.sensitivity;

    // --------------------------------------------------------
    // IZQUIERDA — TECLADO
    // --------------------------------------------------------

    if (keys.leftUp) {
        leftPaddle.y -=
            PADDLE_SPEED * leftSensitivity;
    }

    if (keys.leftDown) {
        leftPaddle.y +=
            PADDLE_SPEED * leftSensitivity;
    }

    // --------------------------------------------------------
    // DERECHA — TECLADO
    // --------------------------------------------------------

    if (keys.rightUp) {
        rightPaddle.y -=
            PADDLE_SPEED * rightSensitivity;
    }

    if (keys.rightDown) {
        rightPaddle.y +=
            PADDLE_SPEED * rightSensitivity;
    }

    // --------------------------------------------------------
    // MOUSE IZQUIERDA
    // --------------------------------------------------------

    if (playerControls.left.mouse) {

        const target =
            mouseY -
            PADDLE_HEIGHT / 2;

        leftPaddle.y +=
            (target - leftPaddle.y) *
            0.15 *
            leftSensitivity;
    }

    // --------------------------------------------------------
    // MOUSE DERECHA
    // --------------------------------------------------------

    if (playerControls.right.mouse) {

        const target =
            mouseY -
            PADDLE_HEIGHT / 2;

        rightPaddle.y +=
            (target - rightPaddle.y) *
            0.15 *
            rightSensitivity;
    }

    // --------------------------------------------------------
    // LÍMITES
    // --------------------------------------------------------

    const topLimit =
        COURT_TOP;

    const bottomLimit =
        COURT_BOTTOM -
        PADDLE_HEIGHT;

    leftPaddle.y =
        clamp(
            leftPaddle.y,
            topLimit,
            bottomLimit
        );

    rightPaddle.y =
        clamp(
            rightPaddle.y,
            topLimit,
            bottomLimit
        );
}

// ============================================================
// ACTUALIZAR PELOTA
// ============================================================

function updateBall() {

    if (gamePaused || gameOver) {
        return;
    }

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // --------------------------------------------------------
    // TECHO
    // --------------------------------------------------------

    if (ball.y <= COURT_TOP) {

        ball.y = COURT_TOP;

        ball.velocityY *= -1;

        increaseBallSpeed();
        playWallSound();
    }

    // --------------------------------------------------------
    // PISO
    // --------------------------------------------------------

    if (
        ball.y + BALL_SIZE >=
        COURT_BOTTOM
    ) {

        ball.y =
            COURT_BOTTOM -
            BALL_SIZE;

        ball.velocityY *= -1;

        increaseBallSpeed();
        playWallSound();
    }

    // --------------------------------------------------------
    // PALETA IZQUIERDA
    // --------------------------------------------------------

    if (
        ball.x <=
            leftPaddle.x +
            PADDLE_WIDTH &&

        ball.x + BALL_SIZE >=
            leftPaddle.x &&

        ball.y + BALL_SIZE >=
            leftPaddle.y &&

        ball.y <=
            leftPaddle.y +
            PADDLE_HEIGHT &&

        ball.velocityX < 0
    ) {

        ball.x =
            leftPaddle.x +
            PADDLE_WIDTH;

        ball.velocityX *= -1;

        increaseBallSpeed();
        playPaddleSound();
    }

    // --------------------------------------------------------
    // PALETA DERECHA
    // --------------------------------------------------------

    if (
        ball.x + BALL_SIZE >=
            rightPaddle.x &&

        ball.x <=
            rightPaddle.x +
            PADDLE_WIDTH &&

        ball.y + BALL_SIZE >=
            rightPaddle.y &&

        ball.y <=
            rightPaddle.y +
            PADDLE_HEIGHT &&

        ball.velocityX > 0
    ) {

        ball.x =
            rightPaddle.x -
            BALL_SIZE;

        ball.velocityX *= -1;

        increaseBallSpeed();
        playPaddleSound();
    }

    // --------------------------------------------------------
    // GOL — IZQUIERDA
    // --------------------------------------------------------

    if (
        ball.x + BALL_SIZE <
        COURT_LEFT
    ) {

        rightScore++;

        playMissSound();

        handlePoint();

        return;
    }

    // --------------------------------------------------------
    // GOL — DERECHA
    // --------------------------------------------------------

    if (
        ball.x >
        COURT_RIGHT
    ) {

        leftScore++;

        playMissSound();

        handlePoint();
    }
}

// ============================================================
// PUNTO
// ============================================================

function handlePoint() {

    if (checkGameWinner()) {

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

// ============================================================
// GANADOR
// ============================================================

function checkGameWinner() {

    const difference =
        Math.abs(
            leftScore -
            rightScore
        );

    if (
        leftScore < GAME_WIN_SCORE &&
        rightScore < GAME_WIN_SCORE
    ) {
        return false;
    }

    return difference >= WIN_MARGIN;
}

// ============================================================
// SAQUE
// ============================================================

function updateServe() {

    const totalPoints =
        leftScore +
        rightScore;

    // DEUCE
    if (
        leftScore >= 10 &&
        rightScore >= 10
    ) {

        servingPlayer =
            servingPlayer === "left"
                ? "right"
                : "left";

        return;
    }

    // CADA DOS PUNTOS
    const block =
        Math.floor(
            totalPoints / 2
        );

    servingPlayer =
        block % 2 === 0
            ? "left"
            : "right";
}

// ============================================================
// RESET PELOTA
// ============================================================

function resetBall() {

    ball.x =
        (CANVAS_WIDTH -
         BALL_SIZE) / 2;

    ball.y =
        (CANVAS_HEIGHT -
         BALL_SIZE) / 2;

    // IMPORTANTE:
    // cada punto vuelve a la velocidad inicial
    ball.velocityY =
        BALL_SPEED_Y;

    ball.velocityX =
        servingPlayer === "left"
            ? Math.abs(ballSpeed)
            : -Math.abs(ballSpeed);
}

// ============================================================
// REVANCHA
// ============================================================

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

    leftPaddle.y =
        (CANVAS_HEIGHT -
         PADDLE_HEIGHT) / 2;

    rightPaddle.y =
        (CANVAS_HEIGHT -
         PADDLE_HEIGHT) / 2;

    resetBall();
}

// ============================================================
// DIBUJAR CANCHA
// ============================================================

function drawCourt() {

    context.fillStyle =
        COURT_COLORS[courtColor];

    context.fillRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT -
        COURT_LEFT,
        COURT_BOTTOM -
        COURT_TOP
    );

    context.strokeStyle =
        "#FFFFFF";

    context.lineWidth = 4;

    context.strokeRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT -
        COURT_LEFT,
        COURT_BOTTOM -
        COURT_TOP
    );

    context.lineWidth =
        CENTER_LINE_WIDTH;

    context.setLineDash([
        CENTER_LINE_DASH,
        CENTER_LINE_GAP
    ]);

    context.beginPath();

    context.moveTo(
        CANVAS_WIDTH / 2,
        COURT_TOP
    );

    context.lineTo(
        CANVAS_WIDTH / 2,
        COURT_BOTTOM
    );

    context.stroke();

    context.setLineDash([]);
}

// ============================================================
// PALETAS
// ============================================================

function drawPaddles() {

    context.fillStyle =
        "#FFFFFF";

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

// ============================================================
// PELOTA
// ============================================================

function drawBall() {

    const centerX =
        ball.x +
        BALL_SIZE / 2;

    const centerY =
        ball.y +
        BALL_SIZE / 2;

    context.fillStyle =
        "#FFFFFF";

    context.beginPath();

    context.arc(
        centerX,
        centerY,
        BALL_SIZE / 2,
        0,
        Math.PI * 2
    );

    context.fill();
}

// ============================================================
// MARCADOR
// ============================================================

function drawScore() {

    context.fillStyle =
        "#FFFFFF";

    context.font =
        SCORE_FONT;

    context.textAlign =
        "center";

    context.textBaseline =
        "bottom";

    context.fillText(
        String(leftScore).padStart(2, "0"),
        CANVAS_WIDTH / 4,
        SCORE_Y
    );

    context.fillText(
        String(rightScore).padStart(2, "0"),
        CANVAS_WIDTH * 3 / 4,
        SCORE_Y
    );

    context.textAlign = "start";
    context.textBaseline =
        "alphabetic";
}

// ============================================================
// BOTÓN
// ============================================================

function drawMenuButton(
    text,
    x,
    y,
    width,
    height,
    buttonId = null
) {

    const hover =
        hoveredButton === buttonId;

    context.lineWidth =
        hover ? 5 : 3;

    context.strokeStyle =
        "#FFFFFF";

    if (hover) {

        context.fillStyle =
            "rgba(255,255,255,0.12)";

        context.fillRect(
            x,
            y,
            width,
            height
        );
    }

    context.strokeRect(
        x,
        y,
        width,
        height
    );

    context.fillStyle =
        "#FFFFFF";

    context.font =
        MENU_BUTTON_FONT;

    context.textAlign =
        "center";

    context.textBaseline =
        "middle";

    context.fillText(
        text,
        x + width / 2,
        y + height / 2
    );

    context.textAlign = "start";
    context.textBaseline =
        "alphabetic";
}

// ============================================================
// PAUSA
// ============================================================

function drawPauseMenu() {

    context.fillStyle =
        "rgba(0,0,0,0.70)";

    context.fillRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT -
        COURT_LEFT,
        COURT_BOTTOM -
        COURT_TOP
    );

    context.fillStyle =
        "#FFFFFF";

    context.font =
        MENU_TITLE_FONT;

    context.textAlign =
        "center";

    context.textBaseline =
        "middle";

    context.fillText(
        "PAUSA",
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 - 150
    );

    const x =
        (CANVAS_WIDTH -
         MENU_BUTTON_WIDTH) / 2;

    drawMenuButton(
        "CONTINUAR",
        x,
        getPauseButtonY(0),
        MENU_BUTTON_WIDTH,
        MENU_BUTTON_HEIGHT,
        "continue"
    );

    drawMenuButton(
        "AJUSTES",
        x,
        getPauseButtonY(1),
        MENU_BUTTON_WIDTH,
        MENU_BUTTON_HEIGHT,
        "settings"
    );
}

// ============================================================
// AJUSTES PRINCIPALES
// ============================================================

function drawSettingsMenu() {

    drawOverlay();

    drawTitle(
        "AJUSTES",
        70
    );

    const x =
        (CANVAS_WIDTH -
         SETTINGS_BUTTON_WIDTH) / 2;

    drawMenuButton(
        "CONTROLES",
        x,
        SETTINGS_START_Y,
        SETTINGS_BUTTON_WIDTH,
        SETTINGS_BUTTON_HEIGHT,
        "controls"
    );

    drawMenuButton(
        "FONDO",
        x,
        SETTINGS_START_Y +
        1 *
        (SETTINGS_BUTTON_HEIGHT +
         SETTINGS_BUTTON_GAP),
        SETTINGS_BUTTON_WIDTH,
        SETTINGS_BUTTON_HEIGHT,
        "background"
    );

    drawMenuButton(
        "FÍSICAS",
        x,
        SETTINGS_START_Y +
        2 *
        (SETTINGS_BUTTON_HEIGHT +
         SETTINGS_BUTTON_GAP),
        SETTINGS_BUTTON_WIDTH,
        SETTINGS_BUTTON_HEIGHT,
        "physics"
    );

    drawMenuButton(
        "VOLVER",
        x,
        SETTINGS_START_Y +
        3 *
        (SETTINGS_BUTTON_HEIGHT +
         SETTINGS_BUTTON_GAP),
        SETTINGS_BUTTON_WIDTH,
        SETTINGS_BUTTON_HEIGHT,
        "settingsBack"
    );
}

// ============================================================
// FONDO
// ============================================================

function drawBackgroundMenu() {

    drawOverlay();

    drawTitle(
        "FONDO",
        70
    );

    const x =
        (CANVAS_WIDTH -
         BACKGROUND_BUTTON_WIDTH) / 2;

    const colors = [
        ["VERDE", "green"],
        ["AZUL", "blue"],
        ["NEGRO", "black"]
    ];

    colors.forEach(
        ([name, color], index) => {

            drawMenuButton(
                name,
                x,
                BACKGROUND_START_Y +
                index *
                (
                    BACKGROUND_BUTTON_HEIGHT +
                    BACKGROUND_BUTTON_GAP
                ),
                BACKGROUND_BUTTON_WIDTH,
                BACKGROUND_BUTTON_HEIGHT,
                "bg-" + color
            );
        }
    );

    drawMenuButton(
        "VOLVER",
        x,
        BACKGROUND_START_Y +
        3 *
        (
            BACKGROUND_BUTTON_HEIGHT +
            BACKGROUND_BUTTON_GAP
        ),
        BACKGROUND_BUTTON_WIDTH,
        BACKGROUND_BUTTON_HEIGHT,
        "backgroundBack"
    );
}

// ============================================================
// FÍSICAS
// ============================================================

function drawPhysicsMenu() {

    drawOverlay();

    drawTitle(
        "FÍSICAS",
        70
    );

    const x =
        (CANVAS_WIDTH -
         PHYSICS_BUTTON_WIDTH) / 2;

    const y1 =
        PHYSICS_START_Y;

    const y2 =
        y1 +
        PHYSICS_BUTTON_HEIGHT +
        PHYSICS_BUTTON_GAP;

    const y3 =
        y2 +
        PHYSICS_BUTTON_HEIGHT +
        PHYSICS_BUTTON_GAP;

    const y4 =
        y3 +
        PHYSICS_BUTTON_HEIGHT +
        PHYSICS_BUTTON_GAP;

    drawMenuButton(
        "VELOCIDAD  " +
        ballSpeed,
        x,
        y1,
        PHYSICS_BUTTON_WIDTH,
        PHYSICS_BUTTON_HEIGHT,
        "physicsSpeed"
    );

    drawMenuButton(
        progressiveSpeed
            ? "PROGRESIVA  ON"
            : "PROGRESIVA  OFF",
        x,
        y2,
        PHYSICS_BUTTON_WIDTH,
        PHYSICS_BUTTON_HEIGHT,
        "physicsProgressive"
    );

    drawMenuButton(
        "SENS.  " +
        progressiveSensitivity.toFixed(1),
        x,
        y3,
        PHYSICS_BUTTON_WIDTH,
        PHYSICS_BUTTON_HEIGHT,
        "physicsSensitivity"
    );

    drawMenuButton(
        "VOLVER",
        x,
        y4,
        PHYSICS_BUTTON_WIDTH,
        PHYSICS_BUTTON_HEIGHT,
        "physicsBack"
    );
}

// ============================================================
// CONTROLES
// ============================================================

function drawControlLabel(
    text,
    x,
    y
) {

    context.fillStyle =
        "#FFFFFF";

    context.font =
        "bold 20px monospace";

    context.textAlign =
        "left";

    context.textBaseline =
        "middle";

    context.fillText(
        text,
        x,
        y +
        CONTROLS_BUTTON_HEIGHT / 2
    );
}

function drawControlButton(
    text,
    x,
    y,
    width,
    height,
    buttonId
) {

    const hover =
        hoveredButton === buttonId;

    context.lineWidth =
        hover ? 4 : 2;

    context.strokeStyle =
        "#FFFFFF";

    if (hover) {

        context.fillStyle =
            "rgba(255,255,255,0.12)";

        context.fillRect(
            x,
            y,
            width,
            height
        );
    }

    context.strokeRect(
        x,
        y,
        width,
        height
    );

    context.fillStyle =
        "#FFFFFF";

    context.font =
        "bold 18px monospace";

    context.textAlign =
        "center";

    context.textBaseline =
        "middle";

    context.fillText(
        text,
        x + width / 2,
        y + height / 2
    );
}

function drawControlsMenu() {

    drawOverlay();

    drawTitle(
        "CONTROLES",
        65
    );

    context.fillStyle =
        "#FFFFFF";

    context.font =
        "bold 30px monospace";

    context.textAlign =
        "center";

    context.textBaseline =
        "middle";

    // COLUMNAS ALINEADAS
    const leftCenter =
        CONTROLS_LEFT_X + 210;

    const rightCenter =
        CONTROLS_RIGHT_X + 210;

    context.fillText(
        "IZQUIERDA",
        leftCenter,
        120
    );

    context.fillText(
        "DERECHA",
        rightCenter,
        120
    );

    const players = [
        {
            name: "left",
            x: CONTROLS_LEFT_X
        },
        {
            name: "right",
            x: CONTROLS_RIGHT_X
        }
    ];

    for (const player of players) {

        const data =
            playerControls[player.name];

        const x =
            player.x;

        drawControlLabel(
            "ARRIBA",
            x,
            getControlRowY(0)
        );

        drawControlButton(
            waitingForKey &&
            waitingForKey.player === player.name &&
            waitingForKey.action === "up"
                ? "PRESIONÁ..."
                : formatKey(data.up),
            x + 125,
            getControlRowY(0),
            CONTROLS_BUTTON_WIDTH,
            CONTROLS_BUTTON_HEIGHT,
            player.name + "-up"
        );

        drawControlLabel(
            "ABAJO",
            x,
            getControlRowY(1)
        );

        drawControlButton(
            waitingForKey &&
            waitingForKey.player === player.name &&
            waitingForKey.action === "down"
                ? "PRESIONÁ..."
                : formatKey(data.down),
            x + 125,
            getControlRowY(1),
            CONTROLS_BUTTON_WIDTH,
            CONTROLS_BUTTON_HEIGHT,
            player.name + "-down"
        );

        drawControlLabel(
            "MOUSE",
            x,
            getControlRowY(2)
        );

        drawControlButton(
            data.mouse ? "ON" : "OFF",
            x + 125,
            getControlRowY(2),
            CONTROLS_BUTTON_WIDTH,
            CONTROLS_BUTTON_HEIGHT,
            player.name + "-mouse"
        );

        drawControlLabel(
            "SENS.",
            x,
            getControlRowY(3)
        );

        drawControlButton(
            "-",
            x + 125,
            getControlRowY(3),
            45,
            CONTROLS_BUTTON_HEIGHT,
            player.name + "-sens-minus"
        );

        drawControlButton(
            data.sensitivity.toFixed(1),
            x + 175,
            getControlRowY(3),
            80,
            CONTROLS_BUTTON_HEIGHT,
            null
        );

        drawControlButton(
            "+",
            x + 260,
            getControlRowY(3),
            45,
            CONTROLS_BUTTON_HEIGHT,
            player.name + "-sens-plus"
        );
    }

    context.font =
        "16px monospace";

    context.textAlign =
        "center";

    context.fillText(
        "Hacé click en una tecla para reasignarla · ESC cancela",
        CANVAS_WIDTH / 2,
        545
    );

    drawMenuButton(
        "VOLVER",
        (CANVAS_WIDTH - 220) / 2,
        625,
        220,
        50,
        "controlsBack"
    );
}

// ============================================================
// OVERLAY / TÍTULO
// ============================================================

function drawOverlay() {

    context.fillStyle =
        "rgba(0,0,0,0.80)";

    context.fillRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT -
        COURT_LEFT,
        COURT_BOTTOM -
        COURT_TOP
    );
}

function drawTitle(
    text,
    y
) {

    context.fillStyle =
        "#FFFFFF";

    context.font =
        MENU_TITLE_FONT;

    context.textAlign =
        "center";

    context.textBaseline =
        "middle";

    context.fillText(
        text,
        CANVAS_WIDTH / 2,
        y
    );
}

// ============================================================
// VICTORIA
// ============================================================

function drawVictoryScreen() {

    context.fillStyle =
        "rgba(0,0,0,0.65)";

    context.fillRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT -
        COURT_LEFT,
        COURT_BOTTOM -
        COURT_TOP
    );

    context.fillStyle =
        "#FFFFFF";

    context.font =
        WINNER_FONT;

    context.textAlign =
        "center";

    context.textBaseline =
        "middle";

    context.fillText(
        winner === "left"
            ? "LA IZQUIERDA GANA"
            : "LA DERECHA GANA",
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 - 35
    );

    const hover =
        hoveredButton === "revenge";

    context.lineWidth =
        hover ? 5 : 3;

    context.strokeStyle =
        "#FFFFFF";

    if (hover) {

        context.fillStyle =
            "rgba(255,255,255,0.12)";

        context.fillRect(
            REVENGE_BUTTON_X,
            REVENGE_BUTTON_Y,
            REVENGE_BUTTON_WIDTH,
            REVENGE_BUTTON_HEIGHT
        );
    }

    context.strokeRect(
        REVENGE_BUTTON_X,
        REVENGE_BUTTON_Y,
        REVENGE_BUTTON_WIDTH,
        REVENGE_BUTTON_HEIGHT
    );

    context.fillStyle =
        "#FFFFFF";

    context.font =
        REVENGE_FONT;

    context.fillText(
        "¿REVANCHA?",
        CANVAS_WIDTH / 2,
        REVENGE_BUTTON_Y +
        REVENGE_BUTTON_HEIGHT / 2
    );
}

// ============================================================
// DIBUJAR TODO
// ============================================================

function drawGame() {

    context.clearRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    );

    drawCourt();
    drawPaddles();
    drawBall();
    drawScore();

    if (
        gamePaused &&
        !settingsOpen &&
        !controlsOpen &&
        !backgroundOpen &&
        !physicsOpen &&
        !gameOver
    ) {
        drawPauseMenu();
    }

    if (
        settingsOpen &&
        !controlsOpen &&
        !backgroundOpen &&
        !physicsOpen &&
        !gameOver
    ) {
        drawSettingsMenu();
    }

    if (backgroundOpen && !gameOver) {
        drawBackgroundMenu();
    }

    if (physicsOpen && !gameOver) {
        drawPhysicsMenu();
    }

    if (controlsOpen && !gameOver) {
        drawControlsMenu();
    }

    if (gameOver) {
        drawVictoryScreen();
    }
}

// ============================================================
// BUCLE PRINCIPAL
// ============================================================

function gameLoop() {

    updatePaddles();
    updateBall();

    drawGame();

    requestAnimationFrame(gameLoop);
}

// ============================================================
// INICIO
// ============================================================

gameLoop();
