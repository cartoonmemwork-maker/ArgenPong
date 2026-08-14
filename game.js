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
// SONIDO — PELOTA CONTRA PARED
// ============================================================

function playWallSound() {

    playSound(
        500,
        0.06,
        0.08
    );
}


// ============================================================
// SONIDO — PELOTA CONTRA PALETA
// ============================================================

function playPaddleSound() {

    playSound(
        800,
        0.07,
        0.1
    );
}


// ============================================================
// SONIDO — PELOTA FUERA
// ============================================================

function playMissSound() {

    playSound(
        180,
        0.2,
        0.12
    );
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
    // No aceptar controles durante la pantalla de victoria
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
// CLICK — BOTÓN REVANCHA
// ============================================================

canvas.addEventListener("click", (event) => {

    if (!gameOver) {
        return;
    }


    // --------------------------------------------------------
    // Convertir coordenadas del navegador
    // a coordenadas internas del Canvas
    // --------------------------------------------------------

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
    // Comprobar si hizo click en REVANCHA
    // --------------------------------------------------------

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
});


// ============================================================
// ACTUALIZACIÓN DE LAS PALETAS
// ============================================================

function updatePaddles() {

    if (gameOver) {
        return;
    }


    // --------------------------------------------------------
    // Movimiento jugador 1
    // --------------------------------------------------------

    if (keys.w) {
        leftPaddle.y -= PADDLE_SPEED;
    }

    if (keys.s) {
        leftPaddle.y += PADDLE_SPEED;
    }


    // --------------------------------------------------------
    // Movimiento jugador 2
    // --------------------------------------------------------

    if (keys.ArrowUp) {
        rightPaddle.y -= PADDLE_SPEED;
    }

    if (keys.ArrowDown) {
        rightPaddle.y += PADDLE_SPEED;
    }


    // --------------------------------------------------------
    // Límites verticales
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

    if (gameOver) {
        return;
    }


    // --------------------------------------------------------
    // Movimiento
    // --------------------------------------------------------

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;


    // --------------------------------------------------------
    // Rebote contra techo
    // --------------------------------------------------------

    if (ball.y <= COURT_TOP) {

        ball.y = COURT_TOP;

        ball.velocityY *= -1;

        playWallSound();
    }


    // --------------------------------------------------------
    // Rebote contra piso
    // --------------------------------------------------------

    if (ball.y + BALL_SIZE >= COURT_BOTTOM) {

        ball.y =
            COURT_BOTTOM - BALL_SIZE;

        ball.velocityY *= -1;

        playWallSound();
    }


    // --------------------------------------------------------
    // Colisión con paleta izquierda
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
    // Colisión con paleta derecha
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
    // Gol — pelota sale por la izquierda
    // --------------------------------------------------------

    if (ball.x + BALL_SIZE < COURT_LEFT) {

        rightScore++;

        playMissSound();

        handlePoint();

        return;
    }


    // --------------------------------------------------------
    // Gol — pelota sale por la derecha
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

    // --------------------------------------------------------
    // Comprobar ganador
    // --------------------------------------------------------

    if (checkGameWinner()) {

        gameOver = true;

        winner =
            leftScore > rightScore
                ? "left"
                : "right";

        return;
    }


    // --------------------------------------------------------
    // Actualizar saque
    // --------------------------------------------------------

    updateServe();


    // --------------------------------------------------------
    // Preparar siguiente saque
    // --------------------------------------------------------

    resetBall();
}


// ============================================================
// COMPROBAR GANADOR
// ============================================================

function checkGameWinner() {

    const scoreDifference =
        Math.abs(leftScore - rightScore);


    // --------------------------------------------------------
    // Nadie llegó a 11
    // --------------------------------------------------------

    if (
        leftScore < GAME_WIN_SCORE &&
        rightScore < GAME_WIN_SCORE
    ) {
        return false;
    }


    // --------------------------------------------------------
    // Se necesitan 2 puntos de diferencia
    // --------------------------------------------------------

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
    // DEUCE — 10 / 10 o superior
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
    // SAQUE CADA DOS PUNTOS
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


    // --------------------------------------------------------
    // Dirección según el saque
    // --------------------------------------------------------

    if (servingPlayer === "left") {

        ball.velocityX =
            Math.abs(BALL_SPEED_X);

    } else {

        ball.velocityX =
            -Math.abs(BALL_SPEED_X);
    }


    // --------------------------------------------------------
    // Dirección vertical
    // --------------------------------------------------------

    if (ball.velocityY === 0) {

        ball.velocityY = BALL_SPEED_Y;
    }
}


// ============================================================
// REINICIAR PARTIDO — REVANCHA
// ============================================================

function restartGame() {

    // --------------------------------------------------------
    // Marcador
    // --------------------------------------------------------

    leftScore = 0;
    rightScore = 0;


    // --------------------------------------------------------
    // Saque inicial
    // --------------------------------------------------------

    servingPlayer = "left";


    // --------------------------------------------------------
    // Estado del partido
    // --------------------------------------------------------

    gameOver = false;
    winner = null;


    // --------------------------------------------------------
    // Reiniciar posiciones
    // --------------------------------------------------------

    leftPaddle.y =
        (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;

    rightPaddle.y =
        (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;


    // --------------------------------------------------------
    // Reiniciar pelota
    // --------------------------------------------------------

    resetBall();
}


// ============================================================
// RENDERIZADO DE LA CANCHA
// ============================================================

function drawCourt() {

    context.strokeStyle = "#FFFFFF";
    context.lineWidth = 4;


    // --------------------------------------------------------
    // Borde exterior
    // --------------------------------------------------------

    context.strokeRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT - COURT_LEFT,
        COURT_BOTTOM - COURT_TOP
    );


    // --------------------------------------------------------
    // Línea central punteada
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


    // --------------------------------------------------------
    // Paleta izquierda
    // --------------------------------------------------------

    context.fillRect(
        leftPaddle.x,
        leftPaddle.y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
    );


    // --------------------------------------------------------
    // Paleta derecha
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // Jugador izquierdo
    // --------------------------------------------------------

    context.fillText(
        String(leftScore).padStart(2, "0"),
        CANVAS_WIDTH / 4,
        SCORE_Y
    );


    // --------------------------------------------------------
    // Jugador derecho
    // --------------------------------------------------------

    context.fillText(
        String(rightScore).padStart(2, "0"),
        CANVAS_WIDTH * 3 / 4,
        SCORE_Y
    );


    context.textAlign = "start";
    context.textBaseline = "alphabetic";
}


// ============================================================
// RENDERIZADO DE LA PANTALLA DE VICTORIA
// ============================================================

function drawVictoryScreen() {

    // --------------------------------------------------------
    // Oscurecer ligeramente la cancha
    // --------------------------------------------------------

    context.fillStyle = "rgba(0, 0, 0, 0.65)";

    context.fillRect(
        COURT_LEFT,
        COURT_TOP,
        COURT_RIGHT - COURT_LEFT,
        COURT_BOTTOM - COURT_TOP
    );


    // --------------------------------------------------------
    // Texto ganador
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // Botón REVANCHA
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // Restaurar configuración
    // --------------------------------------------------------

    context.textAlign = "start";
    context.textBaseline = "alphabetic";
}


// ============================================================
// DIBUJAR EL JUEGO
// ============================================================

function drawGame() {

    context.clearRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    );


    // --------------------------------------------------------
    // Elementos normales
    // --------------------------------------------------------

    drawCourt();
    drawPaddles();
    drawBall();
    drawScore();


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
