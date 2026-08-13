// ============================================================
// CONFIGURACIÓN
// ============================================================

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;


// ============================================================
// REFERENCIA AL CANVAS
// ============================================================

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");


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
// CONFIGURACIÓN DE LA CANCHA
// ============================================================

const COURT_MARGIN = 10;
const CENTER_LINE_WIDTH = 4;
const CENTER_LINE_DASH = 20;
const CENTER_LINE_GAP = 20;


// ============================================================
// CONFIGURACIÓN DE AUDIO
// ============================================================

let audioContext = null;


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

    if (!audioContext) {
        return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = frequency;

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
// SONIDOS DEL JUEGO
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
// EVENTOS DE TECLADO
// ============================================================

window.addEventListener("keydown", (event) => {

    initializeAudio();

    const key = event.key.toLowerCase();

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

    // Jugador 1
    if (key === "w") {
        keys.w = false;
    }

    if (key === "s") {
        keys.s = false;
    }


    // Jugador 2
    if (event.key === "ArrowUp") {
        keys.ArrowUp = false;
    }

    if (event.key === "ArrowDown") {
        keys.ArrowDown = false;
    }
});


// ============================================================
// ACTUALIZACIÓN DE LAS PALETAS
// ============================================================

function updatePaddles() {

    // --------------------------------------------------------
    // Jugador 1 — W / S
    // --------------------------------------------------------

    if (keys.w) {
        leftPaddle.y -= PADDLE_SPEED;
    }

    if (keys.s) {
        leftPaddle.y += PADDLE_SPEED;
    }


    // --------------------------------------------------------
    // Jugador 2 — Flechas
    // --------------------------------------------------------

    if (keys.ArrowUp) {
        rightPaddle.y -= PADDLE_SPEED;
    }

    if (keys.ArrowDown) {
        rightPaddle.y += PADDLE_SPEED;
    }


    // --------------------------------------------------------
    // Límites de las paletas
    // --------------------------------------------------------

    leftPaddle.y = Math.max(
        0,
        Math.min(
            CANVAS_HEIGHT - PADDLE_HEIGHT,
            leftPaddle.y
        )
    );

    rightPaddle.y = Math.max(
        0,
        Math.min(
            CANVAS_HEIGHT - PADDLE_HEIGHT,
            rightPaddle.y
        )
    );
}


// ============================================================
// ACTUALIZACIÓN DE LA PELOTA
// ============================================================

function updateBall() {

    // --------------------------------------------------------
    // Movimiento
    // --------------------------------------------------------

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;


    // --------------------------------------------------------
    // Rebote contra el techo
    // --------------------------------------------------------

    if (ball.y <= COURT_MARGIN) {

        ball.y = COURT_MARGIN;
        ball.velocityY *= -1;

        playWallSound();
    }


    // --------------------------------------------------------
    // Rebote contra el piso
    // --------------------------------------------------------

    if (
        ball.y + BALL_SIZE >=
        CANVAS_HEIGHT - COURT_MARGIN
    ) {

        ball.y =
            CANVAS_HEIGHT -
            COURT_MARGIN -
            BALL_SIZE;

        ball.velocityY *= -1;

        playWallSound();
    }


    // --------------------------------------------------------
    // Colisión con la paleta izquierda
    // --------------------------------------------------------

    if (
        ball.x <= leftPaddle.x + PADDLE_WIDTH &&
        ball.x + BALL_SIZE >= leftPaddle.x &&
        ball.y + BALL_SIZE >= leftPaddle.y &&
        ball.y <= leftPaddle.y + PADDLE_HEIGHT &&
        ball.velocityX < 0
    ) {

        ball.x =
            leftPaddle.x +
            PADDLE_WIDTH;

        ball.velocityX *= -1;

        playPaddleSound();
    }


    // --------------------------------------------------------
    // Colisión con la paleta derecha
    // --------------------------------------------------------

    if (
        ball.x + BALL_SIZE >= rightPaddle.x &&
        ball.x <= rightPaddle.x + PADDLE_WIDTH &&
        ball.y + BALL_SIZE >= rightPaddle.y &&
        ball.y <= rightPaddle.y + PADDLE_HEIGHT &&
        ball.velocityX > 0
    ) {

        ball.x =
            rightPaddle.x -
            BALL_SIZE;

        ball.velocityX *= -1;

        playPaddleSound();
    }


    // --------------------------------------------------------
    // Pelota fuera de la cancha
    // --------------------------------------------------------

    if (
        ball.x + BALL_SIZE < 0 ||
        ball.x > CANVAS_WIDTH
    ) {

        playMissSound();

        ball.x =
            (CANVAS_WIDTH - BALL_SIZE) / 2;

        ball.y =
            (CANVAS_HEIGHT - BALL_SIZE) / 2;

        ball.velocityX *= -1;
    }
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
        COURT_MARGIN,
        COURT_MARGIN,
        CANVAS_WIDTH - COURT_MARGIN * 2,
        CANVAS_HEIGHT - COURT_MARGIN * 2
    );


    // --------------------------------------------------------
    // Línea central
    // --------------------------------------------------------

    context.lineWidth = CENTER_LINE_WIDTH;

    context.setLineDash([
        CENTER_LINE_DASH,
        CENTER_LINE_GAP
    ]);

    context.beginPath();

    context.moveTo(
        CANVAS_WIDTH / 2,
        COURT_MARGIN
    );

    context.lineTo(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT - COURT_MARGIN
    );

    context.stroke();

    context.setLineDash([]);
}


// ============================================================
// RENDERIZADO DE LAS PALETAS
// ============================================================

function drawPaddles() {

    context.fillStyle = "#FFFFFF";


    // Paleta izquierda
    context.fillRect(
        leftPaddle.x,
        leftPaddle.y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
    );


    // Paleta derecha
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
// DIBUJAR EL JUEGO
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
