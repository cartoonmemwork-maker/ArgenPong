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
// CONFIGURACIÓN DE MOVIMIENTO
// ============================================================

const PADDLE_SPEED = 8;

// ============================================================
// ESTADO DE LOS CONTROLES
// ============================================================

const keys = {
    w: false,
    s: false
};
// ============================================================
// ACTUALIZACIÓN DE LA PALETA IZQUIERDA
// ============================================================

function updateLeftPaddle() {
    if (keys.w) {
        leftPaddle.y -= PADDLE_SPEED;
    }

    if (keys.s) {
        leftPaddle.y += PADDLE_SPEED;
    }

    // Evitar que la paleta salga por arriba
    if (leftPaddle.y < 0) {
        leftPaddle.y = 0;
    }

    // Evitar que la paleta salga por abajo
    if (leftPaddle.y + PADDLE_HEIGHT > CANVAS_HEIGHT) {
        leftPaddle.y = CANVAS_HEIGHT - PADDLE_HEIGHT;
    }
}

// ============================================================
// ENTRADA DEL JUGADOR
// ============================================================

window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "w") {
        keys.w = true;
    }

    if (event.key.toLowerCase() === "s") {
        keys.s = true;
    }
});

window.addEventListener("keyup", (event) => {
    if (event.key.toLowerCase() === "w") {
        keys.w = false;
    }

    if (event.key.toLowerCase() === "s") {
        keys.s = false;
    }
});

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

// ============================================================
// BUCLE PRINCIPAL
// ============================================================

function gameLoop() {
    updateLeftPaddle();
    drawGame();

    requestAnimationFrame(gameLoop);
}

gameLoop();
