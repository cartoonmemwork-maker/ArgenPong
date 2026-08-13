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


window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (key === "w") {
        keys.w = true;
    }

    if (key === "s") {
        keys.s = true;
    }

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

    if (ball.y <= 0) {
        ball.y = 0;
        ball.velocityY *= -1;
    }


    // --------------------------------------------------------
    // Rebote contra el piso
    // --------------------------------------------------------

    if (ball.y + BALL_SIZE >= CANVAS_HEIGHT) {
        ball.y = CANVAS_HEIGHT - BALL_SIZE;
        ball.velocityY *= -1;
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
        ball.x = leftPaddle.x + PADDLE_WIDTH;
        ball.velocityX *= -1;
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
        ball.x = rightPaddle.x - BALL_SIZE;
        ball.velocityX *= -1;
    }


    // --------------------------------------------------------
    // Reinicio provisional
    // --------------------------------------------------------

    // Por ahora, si la pelota sale por un lateral,
    // simplemente vuelve al centro.

    if (ball.x + BALL_SIZE < 0 || ball.x > CANVAS_WIDTH) {
        ball.x = (CANVAS_WIDTH - BALL_SIZE) / 2;
        ball.y = (CANVAS_HEIGHT - BALL_SIZE) / 2;

        ball.velocityX *= -1;
    }
}


// ============================================================
// RENDERIZADO
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


function drawBall() {

    context.fillStyle = "#FFFFFF";

    context.fillRect(
        ball.x, + BALL_SIZE / 2
        ball.y, + BALL_SIZE / 2
        BALL_SIZE,
        BALL_SIZE / 2
    );
}


// ============================================================
// DIBUJAR EL JUEGO
// ============================================================

function drawGame() {

    // Limpiar el canvas
    context.clearRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    );

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
