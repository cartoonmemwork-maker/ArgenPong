// ============================================================
// RESOLUCIÓN
// ============================================================

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;


// ============================================================
// REFERENCIA AL CANVAS
// ============================================================

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");


// ============================================================
// CONFIGURACIÓN DE LA CANCHA
// ============================================================

const COURT_MARGIN = 10;

const COURT_LEFT = COURT_MARGIN;
const COURT_RIGHT = CANVAS_WIDTH - COURT_MARGIN;
const COURT_TOP = COURT_MARGIN;
const COURT_BOTTOM = CANVAS_HEIGHT - COURT_MARGIN;


// ============================================================
// COLORES DE CANCHA
// ============================================================

const COURT_COLORS = {
    green: "#1f5f3a",
    blue: "#174a78",
    black: "#000000"
};

let courtColor = "black";


// ============================================================
// CONFIGURACIÓN DE LAS PALETAS
// ============================================================

const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 120;
const PADDLE_MARGIN = 40;
const PADDLE_SPEED = 8;


// ============================================================
// CONFIGURACIÓN DE LA PELOTA
// ============================================================

const BALL_SIZE = 20;
const BALL_SPEED_X = 7;
const BALL_SPEED_Y = 5;


// ============================================================
// CONFIGURACIÓN DE LA LÍNEA CENTRAL
// ============================================================

const CENTER_LINE_WIDTH = 4;
const CENTER_LINE_DASH = 20;
const CENTER_LINE_GAP = 20;


// ============================================================
// CONFIGURACIÓN DEL MARCADOR
// ============================================================

const SCORE_FONT = "bold 48px monospace";
const SCORE_Y = COURT_BOTTOM - 20;


// ============================================================
// CONFIGURACIÓN DEL PARTIDO
// ============================================================

const GAME_WIN_SCORE = 11;
const WIN_MARGIN = 2;


// ============================================================
// CONFIGURACIÓN DE LA PANTALLA DE VICTORIA
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
// CONFIGURACIÓN DEL MENÚ
// ============================================================

const MENU_TITLE_FONT = "bold 48px monospace";
const MENU_BUTTON_FONT = "bold 24px monospace";

const MENU_BUTTON_WIDTH = 300;
const MENU_BUTTON_HEIGHT = 60;

const MENU_BUTTON_GAP = 20;

const MENU_START_Y =
    CANVAS_HEIGHT / 2 - 70;


// ============================================================
// ESTADO DEL MENÚ
// ============================================================

let gamePaused = false;
let settingsOpen = false;
let controlsOpen = false;


// ============================================================
// HOVER
// ============================================================

let hoveredButton = null;


// ============================================================
// CONFIGURACIÓN DE AUDIO
// ============================================================

let audioContext = null;
let audioMuted = false;


// ============================================================
// ESTADO DEL MARCADOR
// ============================================================

let leftScore = 0;
let rightScore = 0;


// ============================================================
// ESTADO DEL SAQUE
// ============================================================

let servingPlayer = "left";


// ============================================================
// ESTADO DEL PARTIDO
// ============================================================

let gameOver = false;
let winner = null;


// ============================================================
// ESTADO DE LAS PALETAS
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
// ESTADO DE LA PELOTA
// ============================================================

const ball = {
    x: (CANVAS_WIDTH - BALL_SIZE) / 2,
    y: (CANVAS_HEIGHT - BALL_SIZE) / 2,
    velocityX: BALL_SPEED_X,
    velocityY: BALL_SPEED_Y
};


// ============================================================
// CONFIGURACIÓN DE CONTROLES
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


// ============================================================
// ESTADO DE TECLAS
// ============================================================

const keys = {};


// ============================================================
// REASIGNACIÓN DE TECLAS
// ============================================================

let waitingForKey = null;


// ============================================================
// MOUSE
// ============================================================

let mouseY = CANVAS_HEIGHT / 2;
let previousMouseY = null;


// ============================================================
// CONFIGURACIÓN DEL MENÚ DE AJUSTES
// ============================================================

const SETTINGS_BUTTON_WIDTH = 240;
const SETTINGS_BUTTON_HEIGHT = 55;

const SETTINGS_BUTTON_GAP = 15;

const SETTINGS_START_Y =
    CANVAS_HEIGHT / 2 - 125;


// ============================================================
// CONFIGURACIÓN DEL MENÚ DE CONTROLES
// ============================================================

const CONTROLS_BUTTON_WIDTH = 180;
const CONTROLS_BUTTON_HEIGHT = 42;

const CONTROLS_LEFT_X = 180;
const CONTROLS_RIGHT_X =
    CANVAS_WIDTH - 180 - CONTROLS_BUTTON_WIDTH;

const CONTROLS_START_Y = 170;

const CONTROLS_ROW_GAP = 58;

const SENSITIVITY_MIN = 0.5;
const SENSITIVITY_MAX = 2.0;
const SENSITIVITY_STEP = 0.1;


// ============================================================
// SISTEMA DE AUDIO
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


// ============================================================
// SONIDOS
// ============================================================

function playWallSound() {
    playSound(500, 0.06, 0.08);
}


function playPaddleSound() {
    playSound(800, 0.07, 0.1);
}


function playMissSound() {
    playSound(180, 0.2, 0.12);
}


// ============================================================
// MUTE / UNMUTE
// ============================================================

function toggleMute() {

    audioMuted = !audioMuted;

    console.log(
        audioMuted
            ? "Audio: MUTE"
            : "Audio: ON"
    );
}


// ============================================================
// CAMBIAR COLOR DE CANCHA
// ============================================================

function setCourtColor(color) {

    if (!COURT_COLORS[color]) {
        return;
    }

    courtColor = color;
}


// ============================================================
// FORMATEAR TECLA
// ============================================================

function formatKey(key) {

    if (key === "ArrowUp") {
        return "↑";
    }

    if (key === "ArrowDown") {
        return "↓";
    }

    if (key === "ArrowLeft") {
        return "←";
    }

    if (key === "ArrowRight") {
        return "→";
    }

    if (key === " ") {
        return "SPACE";
    }

    if (key.length === 1) {
        return key.toUpperCase();
    }

    return key.toUpperCase();
}


// ============================================================
// EVENTOS DE TECLADO
// ============================================================

window.addEventListener("keydown", (event) => {

    initializeAudio();


    // --------------------------------------------------------
    // REASIGNACIÓN DE CONTROL
    // --------------------------------------------------------

    if (waitingForKey) {

        event.preventDefault();

        const player =
            waitingForKey.player;

        const action =
            waitingForKey.action;

        // ESC cancela la reasignación
        if (event.key === "Escape") {

            waitingForKey = null;

            return;
        }

        playerControls[player][action] =
            event.key;

        waitingForKey = null;

        return;
    }


    const key = event.key.toLowerCase();


    // --------------------------------------------------------
    // MUTE / UNMUTE
    // --------------------------------------------------------

    if (key === "m") {

        event.preventDefault();

        toggleMute();

        return;
    }


    // --------------------------------------------------------
    // ESC
    // --------------------------------------------------------

    if (event.key === "Escape") {

        event.preventDefault();

        handleEscape();

        return;
    }


    // --------------------------------------------------------
    // PAUSA
    // --------------------------------------------------------

    if (gamePaused || gameOver) {
        return;
    }


    // --------------------------------------------------------
    // GUARDAR ESTADO DE TECLA
    // --------------------------------------------------------

    keys[event.key] = true;
});


window.addEventListener("keyup", (event) => {

    keys[event.key] = false;
});


// ============================================================
// CONTROL DE ESC
// ============================================================

function handleEscape() {

    if (gameOver) {
        return;
    }


    // --------------------------------------------------------
    // REASIGNACIÓN
    // --------------------------------------------------------

    if (waitingForKey) {

        waitingForKey = null;

        return;
    }


    // --------------------------------------------------------
    // CONTROLES
    // --------------------------------------------------------

    if (controlsOpen) {

        controlsOpen = false;

        hoveredButton = null;

        return;
    }


    // --------------------------------------------------------
    // AJUSTES
    // --------------------------------------------------------

    if (settingsOpen) {

        settingsOpen = false;

        hoveredButton = null;

        return;
    }


    // --------------------------------------------------------
    // PAUSA
    // --------------------------------------------------------

    if (gamePaused) {

        gamePaused = false;

        hoveredButton = null;

        return;
    }


    // --------------------------------------------------------
    // PAUSAR
    // --------------------------------------------------------

    gamePaused = true;

    hoveredButton = null;
}


// ============================================================
// MOUSEMOVE
// ============================================================

canvas.addEventListener("mousemove", (event) => {

    const rect = canvas.getBoundingClientRect();

    const scaleX =
        CANVAS_WIDTH / rect.width;

    const scaleY =
        CANVAS_HEIGHT / rect.height;

    const mouseX =
        (event.clientX - rect.left) * scaleX;

    const currentMouseY =
        (event.clientY - rect.top) * scaleY;

    mouseY = currentMouseY;


    // --------------------------------------------------------
    // MOUSE COMO CONTROL
    // --------------------------------------------------------

    if (
        !gamePaused &&
        !gameOver &&
        !settingsOpen &&
        !controlsOpen
    ) {

        if (previousMouseY !== null) {

            const delta =
                currentMouseY - previousMouseY;


            if (playerControls.left.mouse) {

                leftPaddle.y +=
                    delta *
                    playerControls.left.sensitivity;
            }


            if (playerControls.right.mouse) {

                rightPaddle.y +=
                    delta *
                    playerControls.right.sensitivity;
            }
        }
    }


    previousMouseY = currentMouseY;


    // --------------------------------------------------------
    // HOVER
    // --------------------------------------------------------

    updateHoveredButton(
        mouseX,
        currentMouseY
    );
});


// ============================================================
// CLICK SOBRE EL CANVAS
// ============================================================

canvas.addEventListener("click", (event) => {

    const rect = canvas.getBoundingClientRect();

    const scaleX =
        CANVAS_WIDTH / rect.width;

    const scaleY =
        CANVAS_HEIGHT / rect.height;

    const mouseX =
        (event.clientX - rect.left) * scaleX;

    const mouseY =
        (event.clientY - rect.top) * scaleY;


    // --------------------------------------------------------
    // PANTALLA DE VICTORIA
    // --------------------------------------------------------

    if (gameOver) {

        if (
            mouseX >= REVENGE_BUTTON_X &&
            mouseX <=
                REVENGE_BUTTON_X + REVENGE_BUTTON_WIDTH &&
            mouseY >= REVENGE_BUTTON_Y &&
            mouseY <=
                REVENGE_BUTTON_Y + REVENGE_BUTTON_HEIGHT
        ) {

            restartGame();
        }

        return;
    }


    // --------------------------------------------------------
    // CONTROLES
    // --------------------------------------------------------

    if (controlsOpen) {

        handleControlsClick(
            mouseX,
            mouseY
        );

        return;
    }


    // --------------------------------------------------------
    // AJUSTES
    // --------------------------------------------------------

    if (settingsOpen) {

        handleSettingsClick(
            mouseX,
            mouseY
        );

        return;
    }


    // --------------------------------------------------------
    // MENÚ DE PAUSA
    // --------------------------------------------------------

    if (gamePaused) {

        handlePauseMenuClick(
            mouseX,
            mouseY
        );

        return;
    }
});


// ============================================================
// BOTONES DEL MENÚ DE PAUSA
// ============================================================

function getPauseButtonY(index) {

    return MENU_START_Y +
        index *
        (MENU_BUTTON_HEIGHT + MENU_BUTTON_GAP);
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


// ============================================================
// CLICK — MENÚ DE PAUSA
// ============================================================

function handlePauseMenuClick(mouseX, mouseY) {

    const buttonX =
        (CANVAS_WIDTH - MENU_BUTTON_WIDTH) / 2;


    // --------------------------------------------------------
    // CONTINUAR
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // AJUSTES
    // --------------------------------------------------------

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

        return;
    }
}


// ============================================================
// CLICK — AJUSTES
// ============================================================

function handleSettingsClick(mouseX, mouseY) {

    const buttonX =
        (CANVAS_WIDTH - SETTINGS_BUTTON_WIDTH) / 2;


    // --------------------------------------------------------
    // VERDE
    // --------------------------------------------------------

    if (
        isInsideButton(
            mouseX,
            mouseY,
            buttonX,
            SETTINGS_START_Y,
            SETTINGS_BUTTON_WIDTH,
            SETTINGS_BUTTON_HEIGHT
        )
    ) {

        setCourtColor("green");

        return;
    }


    // --------------------------------------------------------
    // AZUL
    // --------------------------------------------------------

    if (
        isInsideButton(
            mouseX,
            mouseY,
            buttonX,
            SETTINGS_START_Y +
                SETTINGS_BUTTON_HEIGHT +
                SETTINGS_BUTTON_GAP,
            SETTINGS_BUTTON_WIDTH,
            SETTINGS_BUTTON_HEIGHT
        )
    ) {

        setCourtColor("blue");

        return;
    }


    // --------------------------------------------------------
    // NEGRO
    // --------------------------------------------------------

    if (
        isInsideButton(
            mouseX,
            mouseY,
            buttonX,
            SETTINGS_START_Y +
                2 *
                (
                    SETTINGS_BUTTON_HEIGHT +
                    SETTINGS_BUTTON_GAP
                ),
            SETTINGS_BUTTON_WIDTH,
            SETTINGS_BUTTON_HEIGHT
        )
    ) {

        setCourtColor("black");

        return;
    }


    // --------------------------------------------------------
    // CONTROLES
    // --------------------------------------------------------

    if (
        isInsideButton(
            mouseX,
            mouseY,
            buttonX,
            SETTINGS_START_Y +
                3 *
                (
                    SETTINGS_BUTTON_HEIGHT +
                    SETTINGS_BUTTON_GAP
                ),
            SETTINGS_BUTTON_WIDTH,
            SETTINGS_BUTTON_HEIGHT
        )
    ) {

        controlsOpen = true;

        return;
    }


    // --------------------------------------------------------
    // VOLVER
    // --------------------------------------------------------

    if (
        isInsideButton(
            mouseX,
            mouseY,
            buttonX,
            SETTINGS_START_Y +
                4 *
                (
                    SETTINGS_BUTTON_HEIGHT +
                    SETTINGS_BUTTON_GAP
                ),
            SETTINGS_BUTTON_WIDTH,
            SETTINGS_BUTTON_HEIGHT
        )
    ) {

        settingsOpen = false;

        return;
    }
}


// ============================================================
// CONFIGURACIÓN DE FILAS DE CONTROLES
// ============================================================

function getControlRowY(index) {

    return CONTROLS_START_Y +
        index * CONTROLS_ROW_GAP;
}


// ============================================================
// INICIAR REASIGNACIÓN
// ============================================================

function startKeyRebind(player, action) {

    waitingForKey = {
        player: player,
        action: action
    };
}


// ============================================================
// CAMBIAR SENSIBILIDAD
// ============================================================

function changeSensitivity(player, amount) {

    let value =
        playerControls[player].sensitivity +
        amount;

    value =
        Math.max(
            SENSITIVITY_MIN,
            Math.min(
                SENSITIVITY_MAX,
                value
            )
        );

    playerControls[player].sensitivity =
        Math.round(value * 10) / 10;
}


// ============================================================
// CLICK — CONTROLES
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


        // ----------------------------------------------------
        // ARRIBA
        // ----------------------------------------------------

        if (
            isInsideButton(
                mouseX,
                mouseY,
                player.x + 125,
                getControlRowY(0),
                CONTROLS_BUTTON_WIDTH,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            startKeyRebind(
                player.name,
                "up"
            );

            return;
        }


        // ----------------------------------------------------
        // ABAJO
        // ----------------------------------------------------

        if (
            isInsideButton(
                mouseX,
                mouseY,
                player.x + 125,
                getControlRowY(1),
                CONTROLS_BUTTON_WIDTH,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            startKeyRebind(
                player.name,
                "down"
            );

            return;
        }


        // ----------------------------------------------------
        // MOUSE
        // ----------------------------------------------------

        if (
            isInsideButton(
                mouseX,
                mouseY,
                player.x + 125,
                getControlRowY(2),
                CONTROLS_BUTTON_WIDTH,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            data.mouse =
                !data.mouse;

            return;
        }


        // ----------------------------------------------------
        // SENSIBILIDAD -
        // ----------------------------------------------------

        if (
            isInsideButton(
                mouseX,
                mouseY,
                player.x + 125,
                getControlRowY(3),
                45,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            changeSensitivity(
                player.name,
                -SENSITIVITY_STEP
            );

            return;
        }


        // ----------------------------------------------------
        // SENSIBILIDAD +
        // ----------------------------------------------------

        if (
            isInsideButton(
                mouseX,
                mouseY,
                player.x + 260,
                getControlRowY(3),
                45,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            changeSensitivity(
                player.name,
                SENSITIVITY_STEP
            );

            return;
        }
    }


    // --------------------------------------------------------
    // VOLVER
    // --------------------------------------------------------

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

        waitingForKey = null;
    }
}


// ============================================================
// HOVER
// ============================================================

function updateHoveredButton(mouseX, mouseY) {

    hoveredButton = null;


    // --------------------------------------------------------
    // VICTORIA
    // --------------------------------------------------------

    if (gameOver) {

        if (
            isInsideButton(
                mouseX,
                mouseY,
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


    // --------------------------------------------------------
    // CONTROLES
    // --------------------------------------------------------

    if (controlsOpen) {

        updateControlsHover(
            mouseX,
            mouseY
        );

        return;
    }


    // --------------------------------------------------------
    // AJUSTES
    // --------------------------------------------------------

    if (settingsOpen) {

        updateSettingsHover(
            mouseX,
            mouseY
        );

        return;
    }


    // --------------------------------------------------------
    // PAUSA
    // --------------------------------------------------------

    if (gamePaused) {

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

            hoveredButton = "continue";

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

            hoveredButton = "settings";

            return;
        }
    }
}


// ============================================================
// HOVER — AJUSTES
// ============================================================

function updateSettingsHover(mouseX, mouseY) {

    const buttonX =
        (CANVAS_WIDTH - SETTINGS_BUTTON_WIDTH) / 2;


    const buttons = [
        {
            id: "green",
            y: SETTINGS_START_Y
        },
        {
            id: "blue",
            y:
                SETTINGS_START_Y +
                SETTINGS_BUTTON_HEIGHT +
                SETTINGS_BUTTON_GAP
        },
        {
            id: "black",
            y:
                SETTINGS_START_Y +
                2 *
                (
                    SETTINGS_BUTTON_HEIGHT +
                    SETTINGS_BUTTON_GAP
                )
        },
        {
            id: "controls",
            y:
                SETTINGS_START_Y +
                3 *
                (
                    SETTINGS_BUTTON_HEIGHT +
                    SETTINGS_BUTTON_GAP
                )
        },
        {
            id: "settingsBack",
            y:
                SETTINGS_START_Y +
                4 *
                (
                    SETTINGS_BUTTON_HEIGHT +
                    SETTINGS_BUTTON_GAP
                )
        }
    ];


    for (const button of buttons) {

        if (
            isInsideButton(
                mouseX,
                mouseY,
                buttonX,
                button.y,
                SETTINGS_BUTTON_WIDTH,
                SETTINGS_BUTTON_HEIGHT
            )
        ) {

            hoveredButton = button.id;

            return;
        }
    }
}


// ============================================================
// HOVER — CONTROLES
// ============================================================

function updateControlsHover(mouseX, mouseY) {

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

        const x =
            player.x + 125;


        if (
            isInsideButton(
                mouseX,
                mouseY,
                x,
                getControlRowY(0),
                CONTROLS_BUTTON_WIDTH,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            hoveredButton =
                player.name + "-up";

            return;
        }


        if (
            isInsideButton(
                mouseX,
                mouseY,
                x,
                getControlRowY(1),
                CONTROLS_BUTTON_WIDTH,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            hoveredButton =
                player.name + "-down";

            return;
        }


        if (
            isInsideButton(
                mouseX,
                mouseY,
                x,
                getControlRowY(2),
                CONTROLS_BUTTON_WIDTH,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            hoveredButton =
                player.name + "-mouse";

            return;
        }


        if (
            isInsideButton(
                mouseX,
                mouseY,
                x,
                getControlRowY(3),
                45,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            hoveredButton =
                player.name + "-sens-minus";

            return;
        }


        if (
            isInsideButton(
                mouseX,
                mouseY,
                x + 135,
                getControlRowY(3),
                45,
                CONTROLS_BUTTON_HEIGHT
            )
        ) {

            hoveredButton =
                player.name + "-sens-plus";

            return;
        }
    }


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

        hoveredButton = "controlsBack";
    }
}


// ============================================================
// ACTUALIZACIÓN DE LAS PALETAS
// ============================================================

function updatePaddles() {

    if (gamePaused || gameOver) {
        return;
    }


    // --------------------------------------------------------
    // IZQUIERDA — TECLADO
    // --------------------------------------------------------

    if (
        keys[playerControls.left.up]
    ) {

        leftPaddle.y -= PADDLE_SPEED;
    }


    if (
        keys[playerControls.left.down]
    ) {

        leftPaddle.y += PADDLE_SPEED;
    }


    // --------------------------------------------------------
    // DERECHA — TECLADO
    // --------------------------------------------------------

    if (
        keys[playerControls.right.up]
    ) {

        rightPaddle.y -= PADDLE_SPEED;
    }


    if (
        keys[playerControls.right.down]
    ) {

        rightPaddle.y += PADDLE_SPEED;
    }


    // --------------------------------------------------------
    // LÍMITES
    // --------------------------------------------------------

    const topLimit = COURT_TOP;

    const bottomLimit =
        COURT_BOTTOM - PADDLE_HEIGHT;


    if (leftPaddle.y < topLimit) {
        leftPaddle.y = topLimit;
    }

    if (leftPaddle.y > bottomLimit) {
        leftPaddle.y = bottomLimit;
    }


    if (rightPaddle.y < topLimit) {
        rightPaddle.y = topLimit;
    }

    if (rightPaddle.y > bottomLimit) {
        rightPaddle.y = bottomLimit;
    }
}


// ============================================================
// ACTUALIZACIÓN DE LA PELOTA
// ============================================================

function updateBall() {

    if (gamePaused || gameOver) {
        return;
    }


    // --------------------------------------------------------
    // Movimiento
    // --------------------------------------------------------

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;


    // --------------------------------------------------------
    // Techo
    // --------------------------------------------------------

    if (ball.y <= COURT_TOP) {

        ball.y = COURT_TOP;

        ball.velocityY *= -1;

        playWallSound();
    }


    // --------------------------------------------------------
    // Piso
    // --------------------------------------------------------

    if (ball.y + BALL_SIZE >= COURT_BOTTOM) {

        ball.y =
            COURT_BOTTOM - BALL_SIZE;

        ball.velocityY *= -1;

        playWallSound();
    }


    // --------------------------------------------------------
    // Paleta izquierda
    // --------------------------------------------------------

    if (
        ball.x <= leftPaddle.x + PADDLE_WIDTH &&
        ball.x + BALL_SIZE >= leftPaddle.x &&
        ball.y + BALL_SIZE >= leftPaddle.y &&
        ball.y <= leftPaddle.y + PADDLE_HEIGHT &&
        ball.velocityX < 0
    ) {

        ball.x =
            leftPaddle.x + PADDLE_WIDTH;

        ball.velocityX *= -1;

        playPaddleSound();
    }


    // --------------------------------------------------------
    // Paleta derecha
    // --------------------------------------------------------

    if (
        ball.x + BALL_SIZE >= rightPaddle.x &&
        ball.x <= rightPaddle.x + PADDLE_WIDTH &&
        ball.y + BALL_SIZE >= rightPaddle.y &&
        ball.y <= rightPaddle.y + PADDLE_HEIGHT &&
        ball.velocityX > 0
    ) {

        ball.x =
            rightPaddle.x - BALL_SIZE;

        ball.velocityX *= -1;

        playPaddleSound();
    }


    // --------------------------------------------------------
    // Gol — izquierda
    // --------------------------------------------------------

    if (ball.x + BALL_SIZE < COURT_LEFT) {

        rightScore++;

        playMissSound();

        handlePoint();

        return;
    }


    // --------------------------------------------------------
    // Gol — derecha
    // --------------------------------------------------------

    if (ball.x > COURT_RIGHT) {

        leftScore++;

        playMissSound();

        handlePoint();

        return;
    }
}


// ============================================================
// PROCESAR PUNTO
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
// COMPROBAR GANADOR
// ============================================================

function checkGameWinner() {

    const scoreDifference =
        Math.abs(leftScore - rightScore);


    if (
        leftScore < GAME_WIN_SCORE &&
        rightScore < GAME_WIN_SCORE
    ) {
        return false;
    }


    if (scoreDifference < WIN_MARGIN) {
        return false;
    }


    return true;
}


// ============================================================
// ACTUALIZAR SAQUE
// ============================================================

function updateServe() {

    const totalPoints =
        leftScore + rightScore;


    // --------------------------------------------------------
    // DEUCE
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // CADA DOS PUNTOS
    // --------------------------------------------------------

    const serveBlock =
        Math.floor(totalPoints / 2);


    if (serveBlock % 2 === 0) {

        servingPlayer = "left";

    } else {

        servingPlayer = "right";
    }
}


// ============================================================
// REINICIO DE LA PELOTA
// ============================================================

function resetBall() {

    ball.x =
        (CANVAS_WIDTH - BALL_SIZE) / 2;

    ball.y =
        (CANVAS_HEIGHT - BALL_SIZE) / 2;


    if (servingPlayer === "left") {

        ball.velocityX =
            Math.abs(BALL_SPEED_X);

    } else {

        ball.velocityX =
            -Math.abs(BALL_SPEED_X);
    }


    if (ball.velocityY === 0) {

        ball.velocityY = BALL_SPEED_Y;
    }
}


// ============================================================
// REINICIAR PARTIDO — REVANCHA
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

    waitingForKey = null;

    leftPaddle.y =
        (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;

    rightPaddle.y =
        (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;

    resetBall();
}


// ============================================================
// RENDERIZADO DE LA CANCHA
// ============================================================

function drawCourt() {

    context.fillStyle =
        COURT_COLORS[courtColor];

    context.fillRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT - COURT_LEFT,
        COURT_BOTTOM - COURT_TOP
    );


    context.strokeStyle = "#FFFFFF";
    context.lineWidth = 4;

    context.strokeRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT - COURT_LEFT,
        COURT_BOTTOM - COURT_TOP
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
// RENDERIZADO DE LAS PALETAS
// ============================================================

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


// ============================================================
// RENDERIZADO DE LA PELOTA
// ============================================================

function drawBall() {

    const centerX =
        ball.x + BALL_SIZE / 2;

    const centerY =
        ball.y + BALL_SIZE / 2;

    const radius =
        BALL_SIZE / 2;


    context.fillStyle = "#FFFFFF";

    context.beginPath();

    context.arc(
        centerX,
        centerY,
        radius,
        0,
        Math.PI * 2
    );

    context.fill();
}


// ============================================================
// RENDERIZADO DEL MARCADOR
// ============================================================

function drawScore() {

    context.fillStyle = "#FFFFFF";

    context.font = SCORE_FONT;

    context.textAlign = "center";

    context.textBaseline = "bottom";


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
    context.textBaseline = "alphabetic";
}


// ============================================================
// BOTÓN GENÉRICO DE MENÚ
// ============================================================

function drawMenuButton(
    text,
    x,
    y,
    width,
    height,
    buttonId = null
) {

    const isHovered =
        hoveredButton === buttonId;


    context.lineWidth =
        isHovered ? 5 : 3;

    context.strokeStyle =
        "#FFFFFF";


    if (isHovered) {

        context.fillStyle =
            "rgba(255, 255, 255, 0.12)";

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


    context.fillStyle = "#FFFFFF";

    context.font = MENU_BUTTON_FONT;

    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(
        text,
        x + width / 2,
        y + height / 2
    );

    context.textAlign = "start";
    context.textBaseline = "alphabetic";
}


// ============================================================
// RENDERIZADO DEL MENÚ DE PAUSA
// ============================================================

function drawPauseMenu() {

    context.fillStyle =
        "rgba(0, 0, 0, 0.70)";

    context.fillRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT - COURT_LEFT,
        COURT_BOTTOM - COURT_TOP
    );


    context.fillStyle = "#FFFFFF";

    context.font = MENU_TITLE_FONT;

    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(
        "PAUSA",
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 - 150
    );


    const buttonX =
        (CANVAS_WIDTH - MENU_BUTTON_WIDTH) / 2;


    drawMenuButton(
        "CONTINUAR",
        buttonX,
        getPauseButtonY(0),
        MENU_BUTTON_WIDTH,
        MENU_BUTTON_HEIGHT,
        "continue"
    );


    drawMenuButton(
        "AJUSTES",
        buttonX,
        getPauseButtonY(1),
        MENU_BUTTON_WIDTH,
        MENU_BUTTON_HEIGHT,
        "settings"
    );


    context.textAlign = "start";
    context.textBaseline = "alphabetic";
}


// ============================================================
// RENDERIZADO DE AJUSTES
// ============================================================

function drawSettingsMenu() {

    context.fillStyle =
        "rgba(0, 0, 0, 0.75)";

    context.fillRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT - COURT_LEFT,
        COURT_BOTTOM - COURT_TOP
    );


    context.fillStyle = "#FFFFFF";

    context.font = MENU_TITLE_FONT;

    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(
        "AJUSTES",
        CANVAS_WIDTH / 2,
        70
    );


    const buttonX =
        (CANVAS_WIDTH - SETTINGS_BUTTON_WIDTH) / 2;


    drawMenuButton(
        "VERDE",
        buttonX,
        SETTINGS_START_Y,
        SETTINGS_BUTTON_WIDTH,
        SETTINGS_BUTTON_HEIGHT,
        "green"
    );


    drawMenuButton(
        "AZUL",
        buttonX,
        SETTINGS_START_Y +
            SETTINGS_BUTTON_HEIGHT +
            SETTINGS_BUTTON_GAP,
        SETTINGS_BUTTON_WIDTH,
        SETTINGS_BUTTON_HEIGHT,
        "blue"
    );


    drawMenuButton(
        "NEGRO",
        buttonX,
        SETTINGS_START_Y +
            2 *
            (
                SETTINGS_BUTTON_HEIGHT +
                SETTINGS_BUTTON_GAP
            ),
        SETTINGS_BUTTON_WIDTH,
        SETTINGS_BUTTON_HEIGHT,
        "black"
    );


    drawMenuButton(
        "CONTROLES",
        buttonX,
        SETTINGS_START_Y +
            3 *
            (
                SETTINGS_BUTTON_HEIGHT +
                SETTINGS_BUTTON_GAP
            ),
        SETTINGS_BUTTON_WIDTH,
        SETTINGS_BUTTON_HEIGHT,
        "controls"
    );


    drawMenuButton(
        "VOLVER",
        buttonX,
        SETTINGS_START_Y +
            4 *
            (
                SETTINGS_BUTTON_HEIGHT +
                SETTINGS_BUTTON_GAP
            ),
        SETTINGS_BUTTON_WIDTH,
        SETTINGS_BUTTON_HEIGHT,
        "settingsBack"
    );


    context.textAlign = "start";
    context.textBaseline = "alphabetic";
}


// ============================================================
// TEXTO DE CONTROL
// ============================================================

function drawControlLabel(
    text,
    x,
    y
) {

    context.fillStyle = "#FFFFFF";

    context.font = "bold 20px monospace";

    context.textAlign = "left";
    context.textBaseline = "middle";

    context.fillText(
        text,
        x,
        y + CONTROLS_BUTTON_HEIGHT / 2
    );
}


// ============================================================
// BOTÓN DE CONTROL
// ============================================================

function drawControlButton(
    text,
    x,
    y,
    width,
    height,
    buttonId
) {

    const isHovered =
        hoveredButton === buttonId;


    context.lineWidth =
        isHovered ? 4 : 2;

    context.strokeStyle =
        "#FFFFFF";


    if (isHovered) {

        context.fillStyle =
            "rgba(255, 255, 255, 0.12)";

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


    context.fillStyle = "#FFFFFF";

    context.font = "bold 18px monospace";

    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(
        text,
        x + width / 2,
        y + height / 2
    );


    context.textAlign = "start";
    context.textBaseline = "alphabetic";
}


// ============================================================
// RENDERIZADO DE CONTROLES
// ============================================================

function drawControlsMenu() {

    context.fillStyle =
        "rgba(0, 0, 0, 0.80)";

    context.fillRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT - COURT_LEFT,
        COURT_BOTTOM - COURT_TOP
    );


    // --------------------------------------------------------
    // TÍTULO
    // --------------------------------------------------------

    context.fillStyle = "#FFFFFF";

    context.font = MENU_TITLE_FONT;

    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(
        "CONTROLES",
        CANVAS_WIDTH / 2,
        65
    );


    // --------------------------------------------------------
    // NOMBRES
    // --------------------------------------------------------

    context.font = "bold 30px monospace";

    context.fillText(
        "IZQUIERDA",
        CONTROLS_LEFT_X + 145,
        120
    );

    context.fillText(
        "DERECHA",
        CONTROLS_RIGHT_X + 145,
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


        // ----------------------------------------------------
        // ARRIBA
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // ABAJO
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // MOUSE
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // SENSIBILIDAD
        // ----------------------------------------------------

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


    // --------------------------------------------------------
    // INSTRUCCIÓN
    // --------------------------------------------------------

    context.font = "16px monospace";
    context.fillStyle = "#FFFFFF";
    context.textAlign = "center";

    context.fillText(
        "Hacé click en una tecla para reasignarla · ESC cancela",
        CANVAS_WIDTH / 2,
        545
    );


    // --------------------------------------------------------
    // VOLVER
    // --------------------------------------------------------

    drawMenuButton(
        "VOLVER",
        (CANVAS_WIDTH - 220) / 2,
        625,
        220,
        50,
        "controlsBack"
    );


    context.textAlign = "start";
    context.textBaseline = "alphabetic";
}


// ============================================================
// RENDERIZADO DE LA PANTALLA DE VICTORIA
// ============================================================

function drawVictoryScreen() {

    context.fillStyle =
        "rgba(0, 0, 0, 0.65)";

    context.fillRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT - COURT_LEFT,
        COURT_BOTTOM - COURT_TOP
    );


    context.fillStyle = "#FFFFFF";

    context.font = WINNER_FONT;

    context.textAlign = "center";
    context.textBaseline = "middle";


    const winnerText =
        winner === "left"
            ? "LA IZQUIERDA GANA"
            : "LA DERECHA GANA";


    context.fillText(
        winnerText,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 - 35
    );


    context.lineWidth =
        hoveredButton === "revenge"
            ? 5
            : 3;

    context.strokeStyle = "#FFFFFF";


    if (hoveredButton === "revenge") {

        context.fillStyle =
            "rgba(255, 255, 255, 0.12)";

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


    context.fillStyle = "#FFFFFF";

    context.font = REVENGE_FONT;

    context.fillText(
        "¿REVANCHA?",
        CANVAS_WIDTH / 2,
        REVENGE_BUTTON_Y +
            REVENGE_BUTTON_HEIGHT / 2
    );


    context.textAlign = "start";
    context.textBaseline = "alphabetic";
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


    // --------------------------------------------------------
    // MENÚ DE PAUSA
    // --------------------------------------------------------

    if (
        gamePaused &&
        !settingsOpen &&
        !controlsOpen &&
        !gameOver
    ) {

        drawPauseMenu();
    }


    // --------------------------------------------------------
    // MENÚ DE AJUSTES
    // --------------------------------------------------------

    if (
        settingsOpen &&
        !controlsOpen &&
        !gameOver
    ) {

        drawSettingsMenu();
    }


    // --------------------------------------------------------
    // MENÚ DE CONTROLES
    // --------------------------------------------------------

    if (
        controlsOpen &&
        !gameOver
    ) {

        drawControlsMenu();
    }


    // --------------------------------------------------------
    // PANTALLA DE VICTORIA
    // --------------------------------------------------------

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
// INICIALIZACIÓN
// ============================================================

gameLoop();
