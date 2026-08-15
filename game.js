// ============================================================
// ARGENPONG — GAME.JS
// ============================================================


// ============================================================
// 1. CANVAS Y DIMENSIONES
// ============================================================

const W = 1280;
const H = 720;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// ============================================================
// 2. CONFIGURACIÓN GENERAL
// ============================================================

const TABLE = {
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
    progressiveSpeed: false,
    progressiveSensitivity: 1
};


// ============================================================
// 3. CONFIGURACIÓN DE PALETAS Y PELOTA
// ============================================================

const PADDLE = {
    width: 20,
    height: 120,
    margin: 40,
    speed: 8
};

const BALL = {
    size: 20,
    verticalSpeed: 5,
    maxSpeed: 11
};


// ============================================================
// 4. CONFIGURACIÓN DE FÍSICAS
// ============================================================

const PHYSICS = {
    speedMin: 1,
    speedMax: 10,
    speedStep: 1,

    sensitivityMin: 0.5,
    sensitivityMax: 2,
    sensitivityStep: 0.1,

    // Porcentaje de aumento aplicado en cada rebote.
    incrementPerBounce: 0.05
};


// ============================================================
// 5. CONFIGURACIÓN DEL PARTIDO
// ============================================================

const MATCH = {
    winScore: 11,
    winMargin: 2
};


// ============================================================
// 6. CONFIGURACIÓN VISUAL
// ============================================================

const CENTER_LINE = {
    width: 4,
    dash: 20,
    gap: 20
};

const UI = {
    titleFont: "bold 48px monospace",
    buttonFont: "bold 24px monospace",
    winnerFont: "bold 52px monospace"
};


// ============================================================
// 7. CONFIGURACIÓN DE MENÚS
// ============================================================

// Menú de pausa
const PAUSE_UI = {
    buttonWidth: 300,
    buttonHeight: 60,
    gap: 20,

    startY: H / 2 - 70
};

// Menú principal de ajustes
const SETTINGS_UI = {
    buttonWidth: 240,
    buttonHeight: 55,
    gap: 15,

    startY: H / 2 - 125
};

// Submenús generales
const SUBMENU_UI = {
    buttonWidth: 280,
    buttonHeight: 55,
    gap: 15,

    startY: 150
};

// Menú de controles
const CONTROLS_UI = {
    buttonWidth: 180,
    buttonHeight: 42,

    leftX: 140,
    rightX: 680,

    startY: 170,
    rowGap: 58,

    bottomButtonWidth: 220,
    bottomButtonHeight: 50
};

// Menú de físicas
//
// Todas las posiciones de este menú están definidas acá.
// El dibujo, el hover y el click utilizan estas mismas
// definiciones.
const PHYSICS_UI = {
    width: 300,
    height: 55,

    centerX: (W - 300) / 2,

    speedPlusY: 150,
    speedMinusY: 220,
    progressiveY: 290,

    sensitivityY: 360,

    backY: 470,
    resetY: 540,

    sensitivityButtonWidth: 45,
    sensitivityValueWidth: 200
};

// Pantalla de victoria
const VICTORY_UI = {
    buttonWidth: 260,
    buttonHeight: 60,

    x: (W - 260) / 2,
    y: H / 2 + 55
};


// ============================================================
// 8. ESTADO DEL JUEGO
// ============================================================

let courtColor = DEFAULTS.courtColor;

let leftScore = 0;
let rightScore = 0;

let servingPlayer = "left";

let gameOver = false;
let winner = null;

let gamePaused = false;


// ============================================================
// 9. ESTADO DE MENÚS
// ============================================================

let settingsOpen = false;
let controlsOpen = false;
let backgroundOpen = false;
let physicsOpen = false;

let hoveredButton = null;
let waitingForKey = null;


// ============================================================
// 10. ESTADO DE FÍSICAS
// ============================================================

let ballSpeed = DEFAULTS.ballSpeed;

let progressiveSpeed =
    DEFAULTS.progressiveSpeed;

let progressiveSensitivity =
    DEFAULTS.progressiveSensitivity;


// ============================================================
// 11. JUGADORES Y PALETAS
// ============================================================

const leftPaddle = {
    x: PADDLE.margin,
    y: (H - PADDLE.height) / 2
};

const rightPaddle = {
    x: W - PADDLE.margin - PADDLE.width,
    y: (H - PADDLE.height) / 2
};


// ============================================================
// 12. PELOTA
// ============================================================

const ball = {
    x: (W - BALL.size) / 2,
    y: (H - BALL.size) / 2,

    velocityX: DEFAULTS.ballSpeed,
    velocityY: BALL.verticalSpeed
};


// ============================================================
// 13. CONTROLES DEL JUGADOR
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

const playerControls = {
    left: {
        ...playerDefaults.left
    },

    right: {
        ...playerDefaults.right
    }
};

const keys = {};

let mouseY = H / 2;
let previousMouseY = null;


// ============================================================
// 14. AUDIO
// ============================================================

let audioContext = null;
let audioMuted = false;

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

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

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

    oscillator.stop(
        audioContext.currentTime + duration
    );
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
// 15. UTILIDADES GENERALES
// ============================================================

function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}

function round1(value) {
    return Math.round(value * 10) / 10;
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

function canvasMouse(event) {
    const rect =
        canvas.getBoundingClientRect();

    return {
        x:
            (event.clientX - rect.left) *
            W /
            rect.width,

        y:
            (event.clientY - rect.top) *
            H /
            rect.height
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

    return (
        names[key] ||
        (
            key.length === 1
                ? key.toUpperCase()
                : key.toUpperCase()
        )
    );
}


// ============================================================
// 16. ESTADO DE MENÚS
// ============================================================

function closeAllMenus() {
    settingsOpen = false;
    controlsOpen = false;
    backgroundOpen = false;
    physicsOpen = false;

    waitingForKey = null;
    hoveredButton = null;
}

function isAnyMenuOpen() {
    return (
        settingsOpen ||
        controlsOpen ||
        backgroundOpen ||
        physicsOpen
    );
}


// ============================================================
// 17. RESTABLECER CONFIGURACIÓN
// ============================================================

function resetControlsDefaults() {
    playerControls.left = {
        ...playerDefaults.left
    };

    playerControls.right = {
        ...playerDefaults.right
    };

    waitingForKey = null;
}

function resetBackgroundDefaults() {
    courtColor =
        DEFAULTS.courtColor;
}

function resetPhysicsDefaults() {
    ballSpeed =
        DEFAULTS.ballSpeed;

    progressiveSpeed =
        DEFAULTS.progressiveSpeed;

    progressiveSensitivity =
        DEFAULTS.progressiveSensitivity;

    resetBall();
}


// ============================================================
// 18. ENTRADA DE TECLADO
// ============================================================

window.addEventListener(
    "keydown",
    event => {

        initializeAudio();


        // ----------------------------------------------------
        // REASIGNACIÓN DE CONTROLES
        // ----------------------------------------------------

        if (waitingForKey) {
            event.preventDefault();

            if (event.key === "Escape") {
                waitingForKey = null;
                return;
            }

            const {
                player,
                action
            } = waitingForKey;

            playerControls[player][action] =
                event.key;

            waitingForKey = null;

            return;
        }


        // ----------------------------------------------------
        // MUTE
        // ----------------------------------------------------

        if (
            event.key.toLowerCase() === "m"
        ) {
            event.preventDefault();

            toggleMute();

            return;
        }


        // ----------------------------------------------------
        // ESC
        // ----------------------------------------------------

        if (event.key === "Escape") {
            event.preventDefault();

            handleEscape();

            return;
        }


        // ----------------------------------------------------
        // CONTROLES DURANTE EL JUEGO
        // ----------------------------------------------------

        if (
            gamePaused ||
            gameOver
        ) {
            return;
        }

        keys[event.key] = true;
    }
);

window.addEventListener(
    "keyup",
    event => {
        keys[event.key] = false;
    }
);


// ============================================================
// 19. COMPORTAMIENTO DE ESC
// ============================================================

function handleEscape() {

    if (gameOver) {
        return;
    }


    // Si hay un submenú abierto,
    // ESC vuelve directamente al juego.
    if (isAnyMenuOpen()) {
        closeAllMenus();

        gamePaused = false;

        return;
    }


    // Si está pausado,
    // ESC continúa.
    if (gamePaused) {
        gamePaused = false;

        hoveredButton = null;

        return;
    }


    // Si está jugando,
    // ESC pausa.
    gamePaused = true;

    hoveredButton = null;
}


// ============================================================
// 20. ENTRADA DE MOUSE
// ============================================================

canvas.addEventListener(
    "mousemove",
    event => {

        const {
            x,
            y
        } = canvasMouse(event);

        mouseY = y;


        // ----------------------------------------------------
        // CONTROL DE PALETA CON MOUSE
        // ----------------------------------------------------

        if (
            !gamePaused &&
            !gameOver &&
            !isAnyMenuOpen()
        ) {

            if (previousMouseY !== null) {

                const delta =
                    y - previousMouseY;


                if (
                    playerControls.left.mouse
                ) {
                    leftPaddle.y +=
                        delta *
                        playerControls.left.sensitivity;
                }


                if (
                    playerControls.right.mouse
                ) {
                    rightPaddle.y +=
                        delta *
                        playerControls.right.sensitivity;
                }

                clampPaddles();
            }
        }


        previousMouseY = y;

        updateHoveredButton(x, y);
    }
);


// ============================================================
// 21. CLICK DEL MOUSE
// ============================================================

canvas.addEventListener(
    "click",
    event => {

        initializeAudio();

        const {
            x,
            y
        } = canvasMouse(event);


        // Pantalla de victoria
        if (gameOver) {
            handleVictoryClick(x, y);
            return;
        }


        // Submenús
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


        // Menú de pausa
        if (gamePaused) {
            handlePauseClick(x, y);
        }
    }
);


// ============================================================
// 22. PAUSA — LÓGICA
// ============================================================

function getPauseButton(index) {
    return {
        x:
            (W - PAUSE_UI.buttonWidth) / 2,

        y:
            PAUSE_UI.startY +
            index *
                (
                    PAUSE_UI.buttonHeight +
                    PAUSE_UI.gap
                ),

        width:
            PAUSE_UI.buttonWidth,

        height:
            PAUSE_UI.buttonHeight
    };
}

function handlePauseClick(x, y) {

    const continueButton =
        getPauseButton(0);

    const settingsButton =
        getPauseButton(1);


    if (
        isInsideButton(
            x,
            y,
            continueButton.x,
            continueButton.y,
            continueButton.width,
            continueButton.height
        )
    ) {
        gamePaused = false;
        hoveredButton = null;

        return;
    }


    if (
        isInsideButton(
            x,
            y,
            settingsButton.x,
            settingsButton.y,
            settingsButton.width,
            settingsButton.height
        )
    ) {
        settingsOpen = true;
        hoveredButton = null;

        return;
    }
}


// ============================================================
// 23. AJUSTES — LÓGICA
// ============================================================

function getSettingsButton(index) {
    return {
        x:
            (W - SETTINGS_UI.buttonWidth) / 2,

        y:
            SETTINGS_UI.startY +
            index *
                (
                    SETTINGS_UI.buttonHeight +
                    SETTINGS_UI.gap
                ),

        width:
            SETTINGS_UI.buttonWidth,

        height:
            SETTINGS_UI.buttonHeight
    };
}

function handleSettingsClick(x, y) {

    const buttons = [
        {
            index: 0,
            action: () => {
                settingsOpen = false;
                controlsOpen = true;
            }
        },

        {
            index: 1,
            action: () => {
                settingsOpen = false;
                backgroundOpen = true;
            }
        },

        {
            index: 2,
            action: () => {
                settingsOpen = false;
                physicsOpen = true;
            }
        },

        {
            index: 3,
            action: () => {
                settingsOpen = false;
                gamePaused = true;
            }
        }
    ];


    for (const buttonData of buttons) {

        const button =
            getSettingsButton(
                buttonData.index
            );

        if (
            isInsideButton(
                x,
                y,
                button.x,
                button.y,
                button.width,
                button.height
            )
        ) {
            buttonData.action();

            hoveredButton = null;

            return;
        }
    }
}


// ============================================================
// 24. FONDO — LÓGICA
// ============================================================

function getBackgroundButton(index) {
    return {
        x:
            (W - SUBMENU_UI.buttonWidth) / 2,

        y:
            SUBMENU_UI.startY +
            index *
                (
                    SUBMENU_UI.buttonHeight +
                    SUBMENU_UI.gap
                ),

        width:
            SUBMENU_UI.buttonWidth,

        height:
            SUBMENU_UI.buttonHeight
    };
}

function handleBackgroundClick(x, y) {

    const colors = [
        "green",
        "blue",
        "black"
    ];


    // Colores
    for (
        let i = 0;
        i < colors.length;
        i++
    ) {

        const button =
            getBackgroundButton(i);

        if (
            isInsideButton(
                x,
                y,
                button.x,
                button.y,
                button.width,
                button.height
            )
        ) {
            courtColor = colors[i];

            return;
        }
    }


    // Restablecer
    const resetButton =
        getBackgroundButton(3);

    if (
        isInsideButton(
            x,
            y,
            resetButton.x,
            resetButton.y,
            resetButton.width,
            resetButton.height
        )
    ) {
        resetBackgroundDefaults();

        return;
    }


    // Volver
    const backButton =
        getBackgroundButton(4);

    if (
        isInsideButton(
            x,
            y,
            backButton.x,
            backButton.y,
            backButton.width,
            backButton.height
        )
    ) {
        backgroundOpen = false;

        return;
    }
}


// ============================================================
// 25. FÍSICAS — LÓGICA
// ============================================================

function getPhysicsButton(type) {

    const base = {
        width: PHYSICS_UI.width,
        height: PHYSICS_UI.height
    };


    switch (type) {

        case "speedPlus":
            return {
                ...base,
                x: PHYSICS_UI.centerX,
                y: PHYSICS_UI.speedPlusY
            };


        case "speedMinus":
            return {
                ...base,
                x: PHYSICS_UI.centerX,
                y: PHYSICS_UI.speedMinusY
            };


        case "progressive":
            return {
                ...base,
                x: PHYSICS_UI.centerX,
                y: PHYSICS_UI.progressiveY
            };


        case "sensitivityMinus":
            return {
                width:
                    PHYSICS_UI.sensitivityButtonWidth,

                height:
                    PHYSICS_UI.height,

                x:
                    PHYSICS_UI.centerX,

                y:
                    PHYSICS_UI.sensitivityY
            };


        case "sensitivityValue":
            return {
                width:
                    PHYSICS_UI.sensitivityValueWidth,

                height:
                    PHYSICS_UI.height,

                x:
                    PHYSICS_UI.centerX + 55,

                y:
                    PHYSICS_UI.sensitivityY
            };


        case "sensitivityPlus":
            return {
                width:
                    PHYSICS_UI.sensitivityButtonWidth,

                height:
                    PHYSICS_UI.height,

                x:
                    PHYSICS_UI.centerX + 255,

                y:
                    PHYSICS_UI.sensitivityY
            };


        case "back":
            return {
                ...base,
                x: PHYSICS_UI.centerX,
                y: PHYSICS_UI.backY
            };


        case "reset":
            return {
                ...base,
                x: PHYSICS_UI.centerX,
                y: PHYSICS_UI.resetY
            };


        default:
            return null;
    }
}

function handlePhysicsClick(x, y) {

    // Velocidad +
    const speedPlus =
        getPhysicsButton("speedPlus");

    if (
        isInsideButton(
            x,
            y,
            speedPlus.x,
            speedPlus.y,
            speedPlus.width,
            speedPlus.height
        )
    ) {
        ballSpeed =
            clamp(
                ballSpeed +
                    PHYSICS.speedStep,
                PHYSICS.speedMin,
                PHYSICS.speedMax
            );

        resetBall();

        return;
    }


    // Velocidad -
    const speedMinus =
        getPhysicsButton("speedMinus");

    if (
        isInsideButton(
            x,
            y,
            speedMinus.x,
            speedMinus.y,
            speedMinus.width,
            speedMinus.height
        )
    ) {
        ballSpeed =
            clamp(
                ballSpeed -
                    PHYSICS.speedStep,
                PHYSICS.speedMin,
                PHYSICS.speedMax
            );

        resetBall();

        return;
    }


    // Velocidad progresiva
    const progressive =
        getPhysicsButton("progressive");

    if (
        isInsideButton(
            x,
            y,
            progressive.x,
            progressive.y,
            progressive.width,
            progressive.height
        )
    ) {
        progressiveSpeed =
            !progressiveSpeed;

        return;
    }


    // Sensibilidad progresiva -
    const sensitivityMinus =
        getPhysicsButton(
            "sensitivityMinus"
        );

    if (
        isInsideButton(
            x,
            y,
            sensitivityMinus.x,
            sensitivityMinus.y,
            sensitivityMinus.width,
            sensitivityMinus.height
        )
    ) {
        progressiveSensitivity =
            round1(
                clamp(
                    progressiveSensitivity -
                        PHYSICS.sensitivityStep,
                    PHYSICS.sensitivityMin,
                    PHYSICS.sensitivityMax
                )
            );

        return;
    }


    // Sensibilidad progresiva +
    const sensitivityPlus =
        getPhysicsButton(
            "sensitivityPlus"
        );

    if (
        isInsideButton(
            x,
            y,
            sensitivityPlus.x,
            sensitivityPlus.y,
            sensitivityPlus.width,
            sensitivityPlus.height
        )
    ) {
        progressiveSensitivity =
            round1(
                clamp(
                    progressiveSensitivity +
                        PHYSICS.sensitivityStep,
                    PHYSICS.sensitivityMin,
                    PHYSICS.sensitivityMax
                )
            );

        return;
    }


    // Volver
    const back =
        getPhysicsButton("back");

    if (
        isInsideButton(
            x,
            y,
            back.x,
            back.y,
            back.width,
            back.height
        )
    ) {
        physicsOpen = false;

        return;
    }


    // Restablecer
    const reset =
        getPhysicsButton("reset");

    if (
        isInsideButton(
            x,
            y,
            reset.x,
            reset.y,
            reset.width,
            reset.height
        )
    ) {
        resetPhysicsDefaults();

        return;
    }
}


// ============================================================
// 26. CONTROLES — LÓGICA
// ============================================================

function getControlRowY(index) {
    return (
        CONTROLS_UI.startY +
        index *
            CONTROLS_UI.rowGap
    );
}

function getControlPlayerX(player) {
    return (
        player === "left"
            ? CONTROLS_UI.leftX
            : CONTROLS_UI.rightX
    );
}

function startKeyRebind(player, action) {
    waitingForKey = {
        player,
        action
    };
}

function changeSensitivity(
    player,
    amount
) {
    const data =
        playerControls[player];

    data.sensitivity =
        round1(
            clamp(
                data.sensitivity +
                    amount,
                SENSITIVITY.min,
                SENSITIVITY.max
            )
        );
}

function handleControlsClick(x, y) {

    for (
        const player of
        ["left", "right"]
    ) {

        const playerX =
            getControlPlayerX(player);

        const buttonX =
            playerX + 125;


        // Arriba
        if (
            isInsideButton(
                x,
                y,
                buttonX,
                getControlRowY(0),
                CONTROLS_UI.buttonWidth,
                CONTROLS_UI.buttonHeight
            )
        ) {
            startKeyRebind(
                player,
                "up"
            );

            return;
        }


        // Abajo
        if (
            isInsideButton(
                x,
                y,
                buttonX,
                getControlRowY(1),
                CONTROLS_UI.buttonWidth,
                CONTROLS_UI.buttonHeight
            )
        ) {
            startKeyRebind(
                player,
                "down"
            );

            return;
        }


        // Mouse
        if (
            isInsideButton(
                x,
                y,
                buttonX,
                getControlRowY(2),
                CONTROLS_UI.buttonWidth,
                CONTROLS_UI.buttonHeight
            )
        ) {
            playerControls[player].mouse =
                !playerControls[player].mouse;

            return;
        }


        // Sensibilidad -
        if (
            isInsideButton(
                x,
                y,
                buttonX,
                getControlRowY(3),
                45,
                CONTROLS_UI.buttonHeight
            )
        ) {
            changeSensitivity(
                player,
                -SENSITIVITY.step
            );

            return;
        }


        // Sensibilidad +
        if (
            isInsideButton(
                x,
                y,
                buttonX + 135,
                getControlRowY(3),
                45,
                CONTROLS_UI.buttonHeight
            )
        ) {
            changeSensitivity(
                player,
                SENSITIVITY.step
            );

            return;
        }
    }


    // Restablecer
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

        return;
    }


    // Volver
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
}


// ============================================================
// 27. PANTALLA DE VICTORIA — LÓGICA
// ============================================================

function handleVictoryClick(x, y) {

    if (
        isInsideButton(
            x,
            y,
            VICTORY_UI.x,
            VICTORY_UI.y,
            VICTORY_UI.buttonWidth,
            VICTORY_UI.buttonHeight
        )
    ) {
        restartGame();
    }
}


// ============================================================
// 28. MOVIMIENTO DE PALETAS
// ============================================================

function updatePaddles() {

    if (
        gamePaused ||
        gameOver ||
        isAnyMenuOpen()
    ) {
        return;
    }


    for (
        const player of
        ["left", "right"]
    ) {

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
    }


    clampPaddles();
}

function clampPaddles() {

    leftPaddle.y =
        clamp(
            leftPaddle.y,
            TABLE.top,
            TABLE.bottom -
                PADDLE.height
        );

    rightPaddle.y =
        clamp(
            rightPaddle.y,
            TABLE.top,
            TABLE.bottom -
                PADDLE.height
        );
}


// ============================================================
// 29. FÍSICA DE LA PELOTA
// ============================================================

function applyProgressiveSpeed() {

    if (!progressiveSpeed) {
        return;
    }


    const multiplier =
        1 +
        PHYSICS.incrementPerBounce *
        progressiveSensitivity;


    const maxSpeed =
        Math.min(
            PHYSICS.speedMax,
            BALL.maxSpeed
        );


    const newVelocityX =
        Math.min(
            Math.abs(ball.velocityX) *
                multiplier,
            maxSpeed
        );


    const newVelocityY =
        Math.min(
            Math.abs(ball.velocityY) *
                multiplier,
            maxSpeed
        );


    ball.velocityX =
        Math.sign(
            ball.velocityX || 1
        ) *
        newVelocityX;


    ball.velocityY =
        Math.sign(
            ball.velocityY || 1
        ) *
        newVelocityY;
}


// ============================================================
// 30. MOVIMIENTO Y COLISIONES DE LA PELOTA
// ============================================================

function updateBall() {

    if (
        gamePaused ||
        gameOver ||
        isAnyMenuOpen()
    ) {
        return;
    }


    ball.x += ball.velocityX;
    ball.y += ball.velocityY;


    // --------------------------------------------------------
    // PARED SUPERIOR
    // --------------------------------------------------------

    if (
        ball.y <= TABLE.top
    ) {
        ball.y = TABLE.top;

        ball.velocityY *= -1;

        applyProgressiveSpeed();

        sounds.wall();
    }


    // --------------------------------------------------------
    // PARED INFERIOR
    // --------------------------------------------------------

    if (
        ball.y + BALL.size >=
        TABLE.bottom
    ) {
        ball.y =
            TABLE.bottom -
            BALL.size;

        ball.velocityY *= -1;

        applyProgressiveSpeed();

        sounds.wall();
    }


    // --------------------------------------------------------
    // PALETA IZQUIERDA
    // --------------------------------------------------------

    if (
        ball.x <=
            leftPaddle.x +
            PADDLE.width &&

        ball.x + BALL.size >=
            leftPaddle.x &&

        ball.y + BALL.size >=
            leftPaddle.y &&

        ball.y <=
            leftPaddle.y +
            PADDLE.height &&

        ball.velocityX < 0
    ) {
        ball.x =
            leftPaddle.x +
            PADDLE.width;

        ball.velocityX *= -1;

        applyProgressiveSpeed();

        sounds.paddle();
    }


    // --------------------------------------------------------
    // PALETA DERECHA
    // --------------------------------------------------------

    if (
        ball.x + BALL.size >=
            rightPaddle.x &&

        ball.x <=
            rightPaddle.x +
            PADDLE.width &&

        ball.y + BALL.size >=
            rightPaddle.y &&

        ball.y <=
            rightPaddle.y +
            PADDLE.height &&

        ball.velocityX > 0
    ) {
        ball.x =
            rightPaddle.x -
            BALL.size;

        ball.velocityX *= -1;

        applyProgressiveSpeed();

        sounds.paddle();
    }


    // --------------------------------------------------------
    // PUNTO PARA LA DERECHA
    // --------------------------------------------------------

    if (
        ball.x + BALL.size <
        TABLE.left
    ) {
        rightScore++;

        sounds.point();

        handlePoint();

        return;
    }


    // --------------------------------------------------------
    // PUNTO PARA LA IZQUIERDA
    // --------------------------------------------------------

    if (
        ball.x >
        TABLE.right
    ) {
        leftScore++;

        sounds.point();

        handlePoint();

        return;
    }
}


// ============================================================
// 31. LÓGICA DEL PARTIDO
// ============================================================

function checkWinner() {

    if (
        leftScore <
            MATCH.winScore &&
        rightScore <
            MATCH.winScore
    ) {
        return false;
    }


    return (
        Math.abs(
            leftScore -
            rightScore
        ) >=
        MATCH.winMargin
    );
}

function updateServe() {

    // En 10-10 alternamos el saque.
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


    const scoreBlock =
        Math.floor(
            (
                leftScore +
                rightScore
            ) / 2
        );


    servingPlayer =
        scoreBlock % 2 === 0
            ? "left"
            : "right";
}

function resetBall() {

    ball.x =
        (W - BALL.size) / 2;

    ball.y =
        (H - BALL.size) / 2;


    // La velocidad horizontal vuelve
    // a la velocidad configurada.
    ball.velocityX =
        servingPlayer === "left"
            ? Math.abs(ballSpeed)
            : -Math.abs(ballSpeed);


    // La velocidad vertical también
    // vuelve a su valor inicial.
    ball.velocityY =
        Math.random() < 0.5
            ? -BALL.verticalSpeed
            : BALL.verticalSpeed;
}

function handlePoint() {

    // Si terminó el partido,
    // mostramos la pantalla de victoria.
    if (checkWinner()) {

        gameOver = true;

        winner =
            leftScore > rightScore
                ? "left"
                : "right";

        return;
    }


    // Nuevo saque.
    updateServe();

    // IMPORTANTE:
    // al hacer un PUNTO, la pelota vuelve
    // a la velocidad base configurada.
    resetBall();
}


// ============================================================
// 32. REINICIO DEL PARTIDO
// ============================================================

function restartGame() {

    leftScore = 0;
    rightScore = 0;

    servingPlayer = "left";

    gameOver = false;
    winner = null;

    gamePaused = false;

    closeAllMenus();


    leftPaddle.y =
        (H - PADDLE.height) / 2;

    rightPaddle.y =
        (H - PADDLE.height) / 2;


    resetBall();
}


// ============================================================
// 33. HOVER — DETECCIÓN GENERAL
// ============================================================

function updateHoveredButton(x, y) {

    hoveredButton = null;


    if (gameOver) {

        if (
            isInsideButton(
                x,
                y,
                VICTORY_UI.x,
                VICTORY_UI.y,
                VICTORY_UI.buttonWidth,
                VICTORY_UI.buttonHeight
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
        updatePauseHover(x, y);
    }
}


// ============================================================
// 34. HOVER — PAUSA
// ============================================================

function updatePauseHover(x, y) {

    const buttons = [
        {
            id: "continue",
            button: getPauseButton(0)
        },

        {
            id: "settings",
            button: getPauseButton(1)
        }
    ];


    for (const item of buttons) {

        const button = item.button;

        if (
            isInsideButton(
                x,
                y,
                button.x,
                button.y,
                button.width,
                button.height
            )
        ) {
            hoveredButton = item.id;

            return;
        }
    }
}


// ============================================================
// 35. HOVER — AJUSTES
// ============================================================

function updateSettingsHover(x, y) {

    const ids = [
        "controls",
        "background",
        "physics",
        "settingsBack"
    ];


    for (
        let i = 0;
        i < ids.length;
        i++
    ) {

        const button =
            getSettingsButton(i);

        if (
            isInsideButton(
                x,
                y,
                button.x,
                button.y,
                button.width,
                button.height
            )
        ) {
            hoveredButton = ids[i];

            return;
        }
    }
}


// ============================================================
// 36. HOVER — FONDO
// ============================================================

function updateBackgroundHover(x, y) {

    const ids = [
        "background-green",
        "background-blue",
        "background-black",
        "background-reset",
        "backgroundBack"
    ];


    for (
        let i = 0;
        i < ids.length;
        i++
    ) {

        const button =
            getBackgroundButton(i);

        if (
            isInsideButton(
                x,
                y,
                button.x,
                button.y,
                button.width,
                button.height
            )
        ) {
            hoveredButton = ids[i];

            return;
        }
    }
}


// ============================================================
// 37. HOVER — FÍSICAS
// ============================================================

function updatePhysicsHover(x, y) {

    const buttons = [
        {
            id: "physics-speed-plus",
            button:
                getPhysicsButton("speedPlus")
        },

        {
            id: "physics-speed-minus",
            button:
                getPhysicsButton("speedMinus")
        },

        {
            id: "physics-progressive",
            button:
                getPhysicsButton("progressive")
        },

        {
            id: "physics-sens-minus",
            button:
                getPhysicsButton(
                    "sensitivityMinus"
                )
        },

        {
            id: "physics-sens-plus",
            button:
                getPhysicsButton(
                    "sensitivityPlus"
                )
        },

        {
            id: "physicsBack",
            button:
                getPhysicsButton("back")
        },

        {
            id: "physicsReset",
            button:
                getPhysicsButton("reset")
        }
    ];


    for (const item of buttons) {

        const button = item.button;

        if (
            isInsideButton(
                x,
                y,
                button.x,
                button.y,
                button.width,
                button.height
            )
        ) {
            hoveredButton = item.id;

            return;
        }
    }
}


// ============================================================
// 38. HOVER — CONTROLES
// ============================================================

function updateControlsHover(x, y) {

    for (
        const player of
        ["left", "right"]
    ) {

        const playerX =
            getControlPlayerX(player);

        const buttonX =
            playerX + 125;


        const ids = [
            `${player}-up`,
            `${player}-down`,
            `${player}-mouse`
        ];


        for (
            let i = 0;
            i < ids.length;
            i++
        ) {

            if (
                isInsideButton(
                    x,
                    y,
                    buttonX,
                    getControlRowY(i),
                    CONTROLS_UI.buttonWidth,
                    CONTROLS_UI.buttonHeight
                )
            ) {
                hoveredButton = ids[i];

                return;
            }
        }


        // Sensibilidad -
        if (
            isInsideButton(
                x,
                y,
                buttonX,
                getControlRowY(3),
                45,
                CONTROLS_UI.buttonHeight
            )
        ) {
            hoveredButton =
                `${player}-sens-minus`;

            return;
        }


        // Sensibilidad +
        if (
            isInsideButton(
                x,
                y,
                buttonX + 135,
                getControlRowY(3),
                45,
                CONTROLS_UI.buttonHeight
            )
        ) {
            hoveredButton =
                `${player}-sens-plus`;

            return;
        }
    }


    // Restablecer
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
        hoveredButton =
            "controlsReset";

        return;
    }


    // Volver
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
        hoveredButton =
            "controlsBack";
    }
}


// ============================================================
// 39. COMPONENTES VISUALES — BOTONES
// ============================================================

function drawButton(
    text,
    x,
    y,
    width,
    height,
    id = null
) {

    const hover =
        hoveredButton === id;


    ctx.lineWidth =
        hover ? 5 : 3;

    ctx.strokeStyle = "#FFFFFF";


    if (hover) {

        ctx.fillStyle =
            "rgba(255,255,255,0.12)";

        ctx.fillRect(
            x,
            y,
            width,
            height
        );
    }


    ctx.strokeRect(
        x,
        y,
        width,
        height
    );


    ctx.fillStyle = "#FFFFFF";

    ctx.font =
        UI.buttonFont;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";


    ctx.fillText(
        text,
        x + width / 2,
        y + height / 2
    );


    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
}

function drawControlLabel(
    text,
    x,
    y
) {

    ctx.fillStyle = "#FFFFFF";

    ctx.font =
        "bold 20px monospace";

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";


    ctx.fillText(
        text,
        x,
        y +
            CONTROLS_UI.buttonHeight /
                2
    );
}

function drawControlButton(
    text,
    x,
    y,
    width,
    height,
    id = null
) {

    const hover =
        hoveredButton === id;


    ctx.lineWidth =
        hover ? 4 : 2;

    ctx.strokeStyle = "#FFFFFF";


    if (hover) {

        ctx.fillStyle =
            "rgba(255,255,255,0.12)";

        ctx.fillRect(
            x,
            y,
            width,
            height
        );
    }


    ctx.strokeRect(
        x,
        y,
        width,
        height
    );


    ctx.fillStyle = "#FFFFFF";

    ctx.font =
        "bold 18px monospace";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";


    ctx.fillText(
        text,
        x + width / 2,
        y + height / 2
    );


    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
}


// ============================================================
// 40. RENDER — MESA
// ============================================================

function drawTable() {

    ctx.fillStyle =
        COLORS[courtColor];


    ctx.fillRect(
        TABLE.left,
        TABLE.top,
        TABLE.right -
            TABLE.left,
        TABLE.bottom -
            TABLE.top
    );


    ctx.strokeStyle = "#FFFFFF";

    ctx.lineWidth = 4;


    ctx.strokeRect(
        TABLE.left,
        TABLE.top,
        TABLE.right -
            TABLE.left,
        TABLE.bottom -
            TABLE.top
    );


    ctx.lineWidth =
        CENTER_LINE.width;


    ctx.setLineDash([
        CENTER_LINE.dash,
        CENTER_LINE.gap
    ]);


    ctx.beginPath();

    ctx.moveTo(
        W / 2,
        TABLE.top
    );

    ctx.lineTo(
        W / 2,
        TABLE.bottom
    );

    ctx.stroke();


    ctx.setLineDash([]);
}


// ============================================================
// 41. RENDER — PALETAS
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


// ============================================================
// 42. RENDER — PELOTA
// ============================================================

function drawBall() {

    ctx.fillStyle = "#FFFFFF";

    ctx.beginPath();


    ctx.arc(
        ball.x +
            BALL.size / 2,

        ball.y +
            BALL.size / 2,

        BALL.size / 2,

        0,
        Math.PI * 2
    );


    ctx.fill();
}


// ============================================================
// 43. RENDER — MARCADOR
// ============================================================

function drawScore() {

    ctx.fillStyle = "#FFFFFF";

    ctx.font =
        "bold 48px monospace";

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";


    ctx.fillText(
        String(leftScore)
            .padStart(2, "0"),
        W / 4,
        TABLE.bottom - 20
    );


    ctx.fillText(
        String(rightScore)
            .padStart(2, "0"),
        W * 3 / 4,
        TABLE.bottom - 20
    );


    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
}


// ============================================================
// 44. RENDER — OVERLAY Y TÍTULOS
// ============================================================

function drawOverlay(alpha) {

    ctx.fillStyle =
        `rgba(0,0,0,${alpha})`;


    ctx.fillRect(
        TABLE.left,
        TABLE.top,
        TABLE.right -
            TABLE.left,
        TABLE.bottom -
            TABLE.top
    );
}

function drawTitle(text) {

    ctx.fillStyle = "#FFFFFF";

    ctx.font =
        UI.titleFont;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";


    ctx.fillText(
        text,
        W / 2,
        70
    );
}


// ============================================================
// 45. RENDER — MENÚ DE PAUSA
// ============================================================

function drawPauseMenu() {

    drawOverlay(0.70);

    drawTitle("PAUSA");


    const continueButton =
        getPauseButton(0);

    const settingsButton =
        getPauseButton(1);


    drawButton(
        "CONTINUAR",
        continueButton.x,
        continueButton.y,
        continueButton.width,
        continueButton.height,
        "continue"
    );


    drawButton(
        "AJUSTES",
        settingsButton.x,
        settingsButton.y,
        settingsButton.width,
        settingsButton.height,
        "settings"
    );
}


// ============================================================
// 46. RENDER — MENÚ DE AJUSTES
// ============================================================

function drawSettingsMenu() {

    drawOverlay(0.75);

    drawTitle("AJUSTES");


    const buttons = [
        ["CONTROLES", "controls"],
        ["FONDO", "background"],
        ["FÍSICAS", "physics"],
        ["VOLVER", "settingsBack"]
    ];


    buttons.forEach(
        ([text, id], index) => {

            const button =
                getSettingsButton(index);


            drawButton(
                text,
                button.x,
                button.y,
                button.width,
                button.height,
                id
            );
        }
    );
}


// ============================================================
// 47. RENDER — MENÚ DE FONDO
// ============================================================

function drawBackgroundMenu() {

    drawOverlay(0.80);

    drawTitle("FONDO");


    const buttons = [
        ["VERDE", "background-green"],
        ["AZUL", "background-blue"],
        ["NEGRO", "background-black"],
        ["RESTABLECER", "background-reset"],
        ["VOLVER", "backgroundBack"]
    ];


    buttons.forEach(
        ([text, id], index) => {

            const button =
                getBackgroundButton(index);


            drawButton(
                text,
                button.x,
                button.y,
                button.width,
                button.height,
                id
            );
        }
    );
}


// ============================================================
// 48. RENDER — MENÚ DE FÍSICAS
// ============================================================

function drawPhysicsMenu() {

    drawOverlay(0.80);

    drawTitle("FÍSICAS");


    // --------------------------------------------------------
    // VELOCIDAD +
    // --------------------------------------------------------

    const speedPlus =
        getPhysicsButton("speedPlus");


    drawButton(
        `VELOCIDAD +   ${ballSpeed}`,
        speedPlus.x,
        speedPlus.y,
        speedPlus.width,
        speedPlus.height,
        "physics-speed-plus"
    );


    // --------------------------------------------------------
    // VELOCIDAD -
    // --------------------------------------------------------

    const speedMinus =
        getPhysicsButton("speedMinus");


    drawButton(
        `VELOCIDAD -   ${ballSpeed}`,
        speedMinus.x,
        speedMinus.y,
        speedMinus.width,
        speedMinus.height,
        "physics-speed-minus"
    );


    // --------------------------------------------------------
    // VELOCIDAD PROGRESIVA
    // --------------------------------------------------------

    const progressive =
        getPhysicsButton("progressive");


    drawButton(
        `PROGRESIVA: ${
            progressiveSpeed
                ? "ON"
                : "OFF"
        }`,
        progressive.x,
        progressive.y,
        progressive.width,
        progressive.height,
        "physics-progressive"
    );


    // --------------------------------------------------------
    // SENSIBILIDAD PROGRESIVA
    // --------------------------------------------------------

    const sensitivityMinus =
        getPhysicsButton(
            "sensitivityMinus"
        );

    const sensitivityValue =
        getPhysicsButton(
            "sensitivityValue"
        );

    const sensitivityPlus =
        getPhysicsButton(
            "sensitivityPlus"
        );


    drawControlLabel(
        "SENS. PROGRESIVA",
        PHYSICS_UI.centerX - 120,
        PHYSICS_UI.sensitivityY
    );


    drawControlButton(
        "-",
        sensitivityMinus.x,
        sensitivityMinus.y,
        sensitivityMinus.width,
        sensitivityMinus.height,
        "physics-sens-minus"
    );


    drawControlButton(
        progressiveSensitivity.toFixed(1),
        sensitivityValue.x,
        sensitivityValue.y,
        sensitivityValue.width,
        sensitivityValue.height
    );


    drawControlButton(
        "+",
        sensitivityPlus.x,
        sensitivityPlus.y,
        sensitivityPlus.width,
        sensitivityPlus.height,
        "physics-sens-plus"
    );


    // --------------------------------------------------------
    // INFORMACIÓN
    // --------------------------------------------------------

    ctx.fillStyle = "#FFFFFF";

    ctx.font =
        "bold 20px monospace";

    ctx.textAlign = "center";


    ctx.fillText(
        `VELOCIDAD ACTUAL: ${ballSpeed}`,
        W / 2,
        445
    );


    // --------------------------------------------------------
    // VOLVER
    // --------------------------------------------------------

    const back =
        getPhysicsButton("back");


    drawButton(
        "VOLVER",
        back.x,
        back.y,
        back.width,
        back.height,
        "physicsBack"
    );


    // --------------------------------------------------------
    // RESTABLECER
    // --------------------------------------------------------

    const reset =
        getPhysicsButton("reset");


    drawButton(
        "RESTABLECER",
        reset.x,
        reset.y,
        reset.width,
        reset.height,
        "physicsReset"
    );


    ctx.textAlign = "start";
}


// ============================================================
// 49. RENDER — MENÚ DE CONTROLES
// ============================================================

function drawControlsMenu() {

    drawOverlay(0.80);

    drawTitle("CONTROLES");


    ctx.font =
        "bold 30px monospace";

    ctx.textAlign = "center";

    ctx.fillStyle = "#FFFFFF";


    ctx.fillText(
        "IZQUIERDA",
        360,
        120
    );


    ctx.fillText(
        "DERECHA",
        920,
        120
    );


    for (
        const player of
        ["left", "right"]
    ) {

        const data =
            playerControls[player];

        const playerX =
            getControlPlayerX(player);

        const buttonX =
            playerX + 125;


        // ----------------------------------------------------
        // ARRIBA
        // ----------------------------------------------------

        drawControlLabel(
            "ARRIBA",
            playerX,
            getControlRowY(0)
        );


        drawControlButton(
            waitingForKey?.player === player &&
            waitingForKey?.action === "up"
                ? "PRESIONÁ..."
                : formatKey(data.up),

            buttonX,
            getControlRowY(0),

            CONTROLS_UI.buttonWidth,
            CONTROLS_UI.buttonHeight,

            `${player}-up`
        );


        // ----------------------------------------------------
        // ABAJO
        // ----------------------------------------------------

        drawControlLabel(
            "ABAJO",
            playerX,
            getControlRowY(1)
        );


        drawControlButton(
            waitingForKey?.player === player &&
            waitingForKey?.action === "down"
                ? "PRESIONÁ..."
                : formatKey(data.down),

            buttonX,
            getControlRowY(1),

            CONTROLS_UI.buttonWidth,
            CONTROLS_UI.buttonHeight,

            `${player}-down`
        );


        // ----------------------------------------------------
        // MOUSE
        // ----------------------------------------------------

        drawControlLabel(
            "MOUSE",
            playerX,
            getControlRowY(2)
        );


        drawControlButton(
            data.mouse
                ? "ON"
                : "OFF",

            buttonX,
            getControlRowY(2),

            CONTROLS_UI.buttonWidth,
            CONTROLS_UI.buttonHeight,

            `${player}-mouse`
        );


        // ----------------------------------------------------
        // SENSIBILIDAD
        // ----------------------------------------------------

        drawControlLabel(
            "SENS.",
            playerX,
            getControlRowY(3)
        );


        drawControlButton(
            "-",
            buttonX,
            getControlRowY(3),
            45,
            CONTROLS_UI.buttonHeight,
            `${player}-sens-minus`
        );


        drawControlButton(
            data.sensitivity.toFixed(1),
            buttonX + 50,
            getControlRowY(3),
            80,
            CONTROLS_UI.buttonHeight
        );


        drawControlButton(
            "+",
            buttonX + 135,
            getControlRowY(3),
            45,
            CONTROLS_UI.buttonHeight,
            `${player}-sens-plus`
        );
    }


    ctx.font =
        "16px monospace";

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
// 50. RENDER — PANTALLA DE VICTORIA
// ============================================================

function drawVictoryScreen() {

    drawOverlay(0.65);


    ctx.fillStyle = "#FFFFFF";

    ctx.font =
        UI.winnerFont;

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
        VICTORY_UI.x,
        VICTORY_UI.y,
        VICTORY_UI.buttonWidth,
        VICTORY_UI.buttonHeight,
        "revenge"
    );


    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
}


// ============================================================
// 51. RENDER PRINCIPAL
// ============================================================

function drawGame() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );


    // Juego
    drawTable();
    drawPaddles();
    drawBall();
    drawScore();


    // Victoria
    if (gameOver) {
        drawVictoryScreen();
        return;
    }


    // Submenú controles
    if (controlsOpen) {
        drawControlsMenu();
        return;
    }


    // Submenú fondo
    if (backgroundOpen) {
        drawBackgroundMenu();
        return;
    }


    // Submenú físicas
    if (physicsOpen) {
        drawPhysicsMenu();
        return;
    }


    // Menú ajustes
    if (settingsOpen) {
        drawSettingsMenu();
        return;
    }


    // Pausa
    if (gamePaused) {
        drawPauseMenu();
    }
}


// ============================================================
// 52. BUCLE PRINCIPAL DEL JUEGO
// ============================================================

function gameLoop() {

    updatePaddles();

    updateBall();

    drawGame();

    requestAnimationFrame(
        gameLoop
    );
}


// ============================================================
// 53. INICIALIZACIÓN
// ============================================================

resetBall();

gameLoop();
