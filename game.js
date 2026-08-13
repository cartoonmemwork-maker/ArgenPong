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

    // Dibujar las paletas
    drawPaddles();
}


// ============================================================
// INICIALIZACIÓN
// ============================================================

drawGame();
