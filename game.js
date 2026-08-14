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
// CONFIGURACIÓN DEL MENÚ DE PAUSA
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
// ENTRADA DEL JUGADOR
// ============================================================

const keys = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
};


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
// EVENTOS DE TECLADO
// ============================================================

window.addEventListener("keydown", (event) => {

    const key = event.key.toLowerCase();

    initializeAudio();


    // --------------------------------------------------------
    // Mute / Unmute
    // --------------------------------------------------------

    if (key === "m") {

        event.preventDefault();

        toggleMute();

        return;
    }


    // --------------------------------------------------------
    // ESC — PAUSA / CONTINUAR
    // --------------------------------------------------------

    if (event.key === "Escape") {

        event.preventDefault();

        handleEscape();

        return;
    }


    // --------------------------------------------------------
    // Si estamos en pausa, no mover las paletas
    // --------------------------------------------------------

    if (gamePaused) {
        return;
    }


    // --------------------------------------------------------
    // Si terminó el partido, no aceptar controles
    // --------------------------------------------------------

    if (gameOver) {
        return;
    }


    // --------------------------------------------------------
    // Jugador 1
    // --------------------------------------------------------

    if (key === "w") {
        keys.w = true;
    }

    if (key === "s") {
        keys.s = true;
    }


    // --------------------------------------------------------
    // Jugador 2
    // --------------------------------------------------------

    if (event.key === "ArrowUp") {

        keys.ArrowUp = true;

        event.preventDefault();
    }

    if (event.key === "ArrowDown") {

        keys.ArrowDown = true;

        event.preventDefault();
    }
});


window.addEventListener("keyup", (event) => {

    const key = event.key.toLowerCase();

    if (key === "w") {
        keys.w = false;
    }

    if (key === "s") {
        keys.s = false;
    }

    if (event.key === "ArrowUp") {
        keys.ArrowUp = false;
    }

    if (event.key === "ArrowDown") {
        keys.ArrowDown = false;
    }
});


// ============================================================
// CONTROL DE ESC
// ============================================================

function handleEscape() {

    // --------------------------------------------------------
    // Durante la pantalla de victoria, ESC no hace nada
    // --------------------------------------------------------

    if (gameOver) {
        return;
    }


    // --------------------------------------------------------
    // Si estamos dentro de ajustes
    // --------------------------------------------------------

    if (settingsOpen) {

        settingsOpen = false;

        gamePaused = true;

        return;
    }


    // --------------------------------------------------------
    // Si estamos pausados
    // --------------------------------------------------------

    if (gamePaused) {

        gamePaused = false;

        return;
    }


    // --------------------------------------------------------
    // Pausar
    // --------------------------------------------------------

    gamePaused = true;
}


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
// BOTONES DE AJUSTES
// ============================================================

const SETTINGS_BUTTON_WIDTH = 240;
const SETTINGS_BUTTON_HEIGHT = 55;

const SETTINGS_BUTTON_GAP = 15;

const SETTINGS_START_Y =
    CANVAS_HEIGHT / 2 - 100;


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
    // VOLVER
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

        settingsOpen = false;

        return;
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
    // Jugador 1
    // --------------------------------------------------------

    if (keys.w) {
        leftPaddle.y -= PADDLE_SPEED;
    }

    if (keys.s) {
        leftPaddle.y += PADDLE_SPEED;
    }


    // --------------------------------------------------------
    // Jugador 2
    // --------------------------------------------------------

    if (keys.ArrowUp) {
        rightPaddle.y -= PADDLE_SPEED;
    }

    if (keys.ArrowDown) {
        rightPaddle.y += PADDLE_SPEED;
    }


    // --------------------------------------------------------
    // Límites
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

    // --------------------------------------------------------
    // Fondo
    // --------------------------------------------------------

    context.fillStyle =
        COURT_COLORS[courtColor];

    context.fillRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT - COURT_LEFT,
        COURT_BOTTOM - COURT_TOP
    );


    // --------------------------------------------------------
    // Borde
    // --------------------------------------------------------

    context.strokeStyle = "#FFFFFF";
    context.lineWidth = 4;

    context.strokeRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT - COURT_LEFT,
        COURT_BOTTOM - COURT_TOP
    );


    // --------------------------------------------------------
    // Línea central
    // --------------------------------------------------------

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
    height
) {

    context.strokeStyle = "#FFFFFF";
    context.lineWidth = 3;

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

    // --------------------------------------------------------
    // Oscurecer cancha
    // --------------------------------------------------------

    context.fillStyle =
        "rgba(0, 0, 0, 0.70)";

    context.fillRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT - COURT_LEFT,
        COURT_BOTTOM - COURT_TOP
    );


    // --------------------------------------------------------
    // Título
    // --------------------------------------------------------

    context.fillStyle = "#FFFFFF";

    context.font = MENU_TITLE_FONT;

    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(
        "PAUSA",
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 - 150
    );


    // --------------------------------------------------------
    // CONTINUAR
    // --------------------------------------------------------

    const buttonX =
        (CANVAS_WIDTH - MENU_BUTTON_WIDTH) / 2;

    drawMenuButton(
        "CONTINUAR",
        buttonX,
        getPauseButtonY(0),
        MENU_BUTTON_WIDTH,
        MENU_BUTTON_HEIGHT
    );


    // --------------------------------------------------------
    // AJUSTES
    // --------------------------------------------------------

    drawMenuButton(
        "AJUSTES",
        buttonX,
        getPauseButtonY(1),
        MENU_BUTTON_WIDTH,
        MENU_BUTTON_HEIGHT
    );


    context.textAlign = "start";
    context.textBaseline = "alphabetic";
}


// ============================================================
// RENDERIZADO DE AJUSTES
// ============================================================

function drawSettingsMenu() {

    // --------------------------------------------------------
    // Oscurecer cancha
    // --------------------------------------------------------

    context.fillStyle =
        "rgba(0, 0, 0, 0.75)";

    context.fillRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT - COURT_LEFT,
        COURT_BOTTOM - COURT_TOP
    );


    // --------------------------------------------------------
    // Título
    // --------------------------------------------------------

    context.fillStyle = "#FFFFFF";

    context.font = MENU_TITLE_FONT;

    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(
        "AJUSTES",
        CANVAS_WIDTH / 2,
        90
    );


    const buttonX =
        (CANVAS_WIDTH - SETTINGS_BUTTON_WIDTH) / 2;


    // --------------------------------------------------------
    // VERDE
    // --------------------------------------------------------

    drawMenuButton(
        "VERDE",
        buttonX,
        SETTINGS_START_Y,
        SETTINGS_BUTTON_WIDTH,
        SETTINGS_BUTTON_HEIGHT
    );


    // --------------------------------------------------------
    // AZUL
    // --------------------------------------------------------

    drawMenuButton(
        "AZUL",
        buttonX,
        SETTINGS_START_Y +
            SETTINGS_BUTTON_HEIGHT +
            SETTINGS_BUTTON_GAP,
        SETTINGS_BUTTON_WIDTH,
        SETTINGS_BUTTON_HEIGHT
    );


    // --------------------------------------------------------
    // NEGRO
    // --------------------------------------------------------

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
        SETTINGS_BUTTON_HEIGHT
    );


    // --------------------------------------------------------
    // VOLVER
    // --------------------------------------------------------

    drawMenuButton(
        "VOLVER",
        buttonX,
        SETTINGS_START_Y +
            3 *
            (
                SETTINGS_BUTTON_HEIGHT +
                SETTINGS_BUTTON_GAP
            ),
        SETTINGS_BUTTON_WIDTH,
        SETTINGS_BUTTON_HEIGHT
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


    context.strokeStyle = "#FFFFFF";
    context.lineWidth = 3;

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
    // Menú de pausa
    // --------------------------------------------------------

    if (gamePaused && !settingsOpen && !gameOver) {

        drawPauseMenu();
    }


    // --------------------------------------------------------
    // Menú de ajustes
    // --------------------------------------------------------

    if (settingsOpen && !gameOver) {

        drawSettingsMenu();
    }


    // --------------------------------------------------------
    // Pantalla de victoria
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
