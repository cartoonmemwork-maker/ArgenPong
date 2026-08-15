const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");

const TABLE = {
    margin: 10,
    left: 10,
    right: CANVAS_WIDTH - 10,
    top: 10,
    bottom: CANVAS_HEIGHT - 10,
    colors: {
        green: "#1f5f3a",
        blue: "#174a78",
        black: "#000000"
    }
};

const PADDLE = {
    width: 20,
    height: 120,
    margin: 40,
    minSpeed: 4,
    maxSpeed: 18,
    sensitivityMin: 0.1,
    sensitivityMax: 1,
    sensitivityStep: 0.1,
    defaultSensitivity: 0.5
};

const BALL = {
    size: 20,

    // Curva progresiva inspirada en la aceleración de Tetris.
    speedLevels: [
        4,
        5,
        6,
        7.2,
        8.6,
        10.2,
        12,
        14.2,
        17,
        20
    ],

    defaultLevel: 5,
    progressiveFactor: 1.04
};

const MATCH = {
    winScore: 11,
    winMargin: 2
};

const CENTER_LINE = {
    width: 4,
    dash: 20,
    gap: 20
};

const UI = {
    titleFont: "bold 48px monospace",
    buttonFont: "bold 24px monospace",
    smallFont: "bold 18px monospace",
    scoreFont: "bold 48px monospace",
    winnerFont: "bold 52px monospace",

    buttonWidth: 300,
    buttonHeight: 58,
    buttonGap: 16
};

const DEFAULTS = {
    tableColor: "black",
    sound: true,

    ballSpeedLevel: BALL.defaultLevel,
    progressiveSpeed: false,

    controls: {
        left: {
            up: "w",
            down: "s",
            mouse: false,
            sensitivity: PADDLE.defaultSensitivity
        },

        right: {
            up: "ArrowUp",
            down: "ArrowDown",
            mouse: false,
            sensitivity: PADDLE.defaultSensitivity
        }
    }
};

const state = {
    screen: "start",

    gameStarted: false,
    mode: null,

    hoveredId: null,
    activeSlider: null,
    waitingForKey: null,

    tableColor: DEFAULTS.tableColor,
    sound: DEFAULTS.sound,

    ballSpeedLevel: DEFAULTS.ballSpeedLevel,
    progressiveSpeed: DEFAULTS.progressiveSpeed,

    leftScore: 0,
    rightScore: 0,

    servingPlayer: "left",
    winner: null
};

const controls = {
    left: {
        ...DEFAULTS.controls.left
    },

    right: {
        ...DEFAULTS.controls.right
    }
};

const keys = {};

let mouseY = CANVAS_HEIGHT / 2;
let previousMouseY = null;

let audioContext = null;

const leftPaddle = {
    x: PADDLE.margin,
    y: (CANVAS_HEIGHT - PADDLE.height) / 2
};

const rightPaddle = {
    x:
        CANVAS_WIDTH -
        PADDLE.margin -
        PADDLE.width,

    y: (CANVAS_HEIGHT - PADDLE.height) / 2
};

const ball = {
    x: (CANVAS_WIDTH - BALL.size) / 2,
    y: (CANVAS_HEIGHT - BALL.size) / 2,

    velocityX: 0,
    velocityY: 0
};


// ============================================================
// UTILIDADES
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


function lerp(a, b, t) {
    return a + (b - a) * t;
}


function rectContains(rect, x, y) {
    return (
        x >= rect.x &&
        x <= rect.x + rect.w &&
        y >= rect.y &&
        y <= rect.y + rect.h
    );
}


function mousePosition(event) {

    const rect =
        canvas.getBoundingClientRect();

    return {
        x:
            (event.clientX - rect.left) *
            CANVAS_WIDTH /
            rect.width,

        y:
            (event.clientY - rect.top) *
            CANVAS_HEIGHT /
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
        key.toUpperCase()
    );
}


// ============================================================
// AUDIO
// ============================================================

function initializeAudio() {

    if (!audioContext) {
        audioContext =
            new AudioContext();
    }

    if (
        audioContext.state ===
        "suspended"
    ) {
        audioContext.resume();
    }
}


function playSound(
    frequency,
    duration,
    volume
) {

    if (
        !state.sound ||
        !audioContext
    ) {
        return;
    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type = "square";

    oscillator.frequency
        .setValueAtTime(
            frequency,
            audioContext.currentTime
        );

    gain.gain
        .setValueAtTime(
            volume,
            audioContext.currentTime
        );

    gain.gain
        .exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime +
            duration
        );

    oscillator.connect(gain);
    gain.connect(
        audioContext.destination
    );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime +
        duration
    );
}


function playWallSound() {
    playSound(
        500,
        0.06,
        0.08
    );
}


function playPaddleSound() {
    playSound(
        800,
        0.07,
        0.1
    );
}


function playPointSound() {
    playSound(
        180,
        0.2,
        0.12
    );
}


// ============================================================
// FÍSICAS
// ============================================================

function getBallBaseSpeed() {

    return BALL.speedLevels[
        state.ballSpeedLevel - 1
    ];
}


function getPaddleSpeed(side) {

    const sensitivity =
        controls[side].sensitivity;

    const t =
        (
            sensitivity -
            PADDLE.sensitivityMin
        ) /
        (
            PADDLE.sensitivityMax -
            PADDLE.sensitivityMin
        );

    return lerp(
        PADDLE.minSpeed,
        PADDLE.maxSpeed,
        t
    );
}


function resetPaddles() {

    leftPaddle.y =
        (
            CANVAS_HEIGHT -
            PADDLE.height
        ) / 2;

    rightPaddle.y =
        (
            CANVAS_HEIGHT -
            PADDLE.height
        ) / 2;
}


function resetBall() {

    ball.x =
        (
            CANVAS_WIDTH -
            BALL.size
        ) / 2;

    ball.y =
        (
            CANVAS_HEIGHT -
            BALL.size
        ) / 2;

    const speed =
        getBallBaseSpeed();

    const horizontal =
        speed * 0.82;

    const vertical =
        speed * 0.57;

    const directionX =
        state.servingPlayer === "left"
            ? 1
            : -1;

    const directionY =
        ball.velocityY < 0
            ? -1
            : 1;

    ball.velocityX =
        horizontal *
        directionX;

    ball.velocityY =
        vertical *
        directionY;
}


function increaseBallSpeed() {

    if (
        !state.progressiveSpeed
    ) {
        return;
    }

    const maxSpeed =
        BALL.speedLevels[
            BALL.speedLevels.length - 1
        ];

    const currentSpeed =
        Math.hypot(
            ball.velocityX,
            ball.velocityY
        );

    if (
        currentSpeed >= maxSpeed
    ) {
        return;
    }

    const nextSpeed =
        Math.min(
            currentSpeed *
            BALL.progressiveFactor,
            maxSpeed
        );

    const scale =
        nextSpeed /
        currentSpeed;

    ball.velocityX *= scale;
    ball.velocityY *= scale;
}


// ============================================================
// PARTIDA
// ============================================================

function resetMatch(
    startImmediately = true
) {

    state.leftScore = 0;
    state.rightScore = 0;

    state.servingPlayer =
        "left";

    state.winner = null;

    state.waitingForKey = null;
    state.activeSlider = null;
    state.hoveredId = null;

    resetPaddles();
    resetBall();

    state.screen =
        startImmediately
            ? "game"
            : "start";
}


function startLocalGame() {

    state.gameStarted = true;
    state.mode = "local";

    resetMatch(true);
}


function restartGame() {
    resetMatch(true);
}


function returnToGame() {

    if (
        !state.gameStarted ||
        state.screen === "victory"
    ) {
        return;
    }

    state.waitingForKey = null;
    state.activeSlider = null;
    state.hoveredId = null;

    state.screen = "game";
}


function handlePoint() {

    if (checkGameWinner()) {

        state.winner =
            state.leftScore >
            state.rightScore
                ? "left"
                : "right";

        state.screen =
            "victory";

        return;
    }

    updateServe();
    resetBall();
}


function checkGameWinner() {

    if (
        state.leftScore <
            MATCH.winScore &&
        state.rightScore <
            MATCH.winScore
    ) {
        return false;
    }

    return (
        Math.abs(
            state.leftScore -
            state.rightScore
        ) >=
        MATCH.winMargin
    );
}


function updateServe() {

    if (
        state.leftScore >= 10 &&
        state.rightScore >= 10
    ) {

        state.servingPlayer =
            state.servingPlayer ===
            "left"
                ? "right"
                : "left";

        return;
    }

    const totalPoints =
        state.leftScore +
        state.rightScore;

    state.servingPlayer =
        Math.floor(
            totalPoints / 2
        ) % 2 === 0
            ? "left"
            : "right";
}


// ============================================================
// PALETAS
// ============================================================

function limitPaddles() {

    const maxY =
        TABLE.bottom -
        PADDLE.height;

    leftPaddle.y =
        clamp(
            leftPaddle.y,
            TABLE.top,
            maxY
        );

    rightPaddle.y =
        clamp(
            rightPaddle.y,
            TABLE.top,
            maxY
        );
}


function updatePaddles() {

    if (
        state.screen !== "game"
    ) {
        return;
    }

    if (
        !controls.left.mouse
    ) {

        const speed =
            getPaddleSpeed(
                "left"
            );

        if (
            keys[
                controls.left.up
            ]
        ) {
            leftPaddle.y -=
                speed;
        }

        if (
            keys[
                controls.left.down
            ]
        ) {
            leftPaddle.y +=
                speed;
        }
    }

    if (
        !controls.right.mouse
    ) {

        const speed =
            getPaddleSpeed(
                "right"
            );

        if (
            keys[
                controls.right.up
            ]
        ) {
            rightPaddle.y -=
                speed;
        }

        if (
            keys[
                controls.right.down
            ]
        ) {
            rightPaddle.y +=
                speed;
        }
    }

    limitPaddles();
}


// ============================================================
// PELOTA
// ============================================================

function updateBall() {

    if (
        state.screen !== "game"
    ) {
        return;
    }

    ball.x +=
        ball.velocityX;

    ball.y +=
        ball.velocityY;


    // PARED SUPERIOR

    if (
        ball.y <= TABLE.top
    ) {

        ball.y = TABLE.top;

        ball.velocityY =
            Math.abs(
                ball.velocityY
            );

        increaseBallSpeed();
        playWallSound();
    }


    // PARED INFERIOR

    if (
        ball.y + BALL.size >=
        TABLE.bottom
    ) {

        ball.y =
            TABLE.bottom -
            BALL.size;

        ball.velocityY =
            -Math.abs(
                ball.velocityY
            );

        increaseBallSpeed();
        playWallSound();
    }


    // PALETA IZQUIERDA

    if (
        ball.velocityX < 0 &&

        ball.x <=
            leftPaddle.x +
            PADDLE.width &&

        ball.x + BALL.size >=
            leftPaddle.x &&

        ball.y + BALL.size >=
            leftPaddle.y &&

        ball.y <=
            leftPaddle.y +
            PADDLE.height
    ) {

        ball.x =
            leftPaddle.x +
            PADDLE.width;

        ball.velocityX =
            Math.abs(
                ball.velocityX
            );

        increaseBallSpeed();
        playPaddleSound();
    }


    // PALETA DERECHA

    if (
        ball.velocityX > 0 &&

        ball.x + BALL.size >=
            rightPaddle.x &&

        ball.x <=
            rightPaddle.x +
            PADDLE.width &&

        ball.y + BALL.size >=
            rightPaddle.y &&

        ball.y <=
            rightPaddle.y +
            PADDLE.height
    ) {

        ball.x =
            rightPaddle.x -
            BALL.size;

        ball.velocityX =
            -Math.abs(
                ball.velocityX
            );

        increaseBallSpeed();
        playPaddleSound();
    }


    // PUNTO DERECHA

    if (
        ball.x + BALL.size <
        TABLE.left
    ) {

        state.rightScore++;

        playPointSound();
        handlePoint();

        return;
    }


    // PUNTO IZQUIERDA

    if (
        ball.x >
        TABLE.right
    ) {

        state.leftScore++;

        playPointSound();
        handlePoint();
    }
}


// ============================================================
// RESTABLECER OPCIONES
// ============================================================

function resetControlsDefaults() {

    Object.assign(
        controls.left,
        DEFAULTS.controls.left
    );

    Object.assign(
        controls.right,
        DEFAULTS.controls.right
    );

    state.waitingForKey = null;
}


function resetPhysicsDefaults() {

    state.ballSpeedLevel =
        DEFAULTS.ballSpeedLevel;

    state.progressiveSpeed =
        DEFAULTS.progressiveSpeed;

    if (
        state.gameStarted
    ) {
        resetBall();
    }
}


// ============================================================
// TECLADO
// ============================================================

window.addEventListener(
    "keydown",
    event => {

        initializeAudio();


        // REASIGNACIÓN

        if (
            state.waitingForKey
        ) {

            event.preventDefault();

            if (
                event.key ===
                "Escape"
            ) {

                returnToGame();

                return;
            }

            const {
                side,
                action
            } =
                state.waitingForKey;

            controls[side][action] =
                event.key;

            state.waitingForKey =
                null;

            return;
        }


        // MUTE

        if (
            event.key
                .toLowerCase() ===
            "m"
        ) {

            event.preventDefault();

            state.sound =
                !state.sound;

            return;
        }


        // ESC

        if (
            event.key ===
            "Escape"
        ) {

            event.preventDefault();

            if (
                !state.gameStarted
            ) {
                return;
            }

            if (
                state.screen ===
                "game"
            ) {

                state.screen =
                    "pause";

            } else {

                returnToGame();
            }

            return;
        }


        if (
            state.screen !==
            "game"
        ) {
            return;
        }


        keys[event.key] =
            true;


        if (
            event.key
                .startsWith(
                    "Arrow"
                )
        ) {
            event.preventDefault();
        }
    }
);


window.addEventListener(
    "keyup",
    event => {

        keys[event.key] =
            false;
    }
);


// ============================================================
// MOUSE
// ============================================================

canvas.addEventListener(
    "mousemove",
    event => {

        const {
            x,
            y
        } =
            mousePosition(
                event
            );

        mouseY = y;


        // CONTROL POR MOUSE

        if (
            state.screen ===
                "game" &&
            previousMouseY !==
                null
        ) {

            const delta =
                y -
                previousMouseY;

            if (
                controls.left.mouse
            ) {

                leftPaddle.y +=
                    delta *
                    (
                        0.2 +
                        controls.left
                            .sensitivity *
                        2
                    );
            }

            if (
                controls.right.mouse
            ) {

                rightPaddle.y +=
                    delta *
                    (
                        0.2 +
                        controls.right
                            .sensitivity *
                        2
                    );
            }

            limitPaddles();
        }

        previousMouseY = y;


        // SLIDER ACTIVO

        if (
            state.activeSlider
        ) {

            updateSlider(
                state.activeSlider,
                x
            );
        }


        updateHover(
            x,
            y
        );
    }
);


window.addEventListener(
    "mouseup",
    () => {

        state.activeSlider =
            null;
    }
);


canvas.addEventListener(
    "mousedown",
    event => {

        const {
            x,
            y
        } =
            mousePosition(
                event
            );

        const slider =
            getSliderAt(
                x,
                y
            );

        if (!slider) {
            return;
        }

        state.activeSlider =
            slider.id;

        updateSlider(
            slider.id,
            x
        );
    }
);


canvas.addEventListener(
    "click",
    event => {

        const {
            x,
            y
        } =
            mousePosition(
                event
            );

        const item =
            getInteractiveAt(
                x,
                y
            );

        if (
            !item ||
            item.type ===
                "slider"
        ) {
            return;
        }

        handleAction(
            item.id
        );
    }
);


// ============================================================
// ACCIONES DE MENÚ
// ============================================================

function handleAction(id) {

    initializeAudio();

    const actions = {

        startLocal:
            startLocalGame,

        startOnline:
            () => {
                state.mode =
                    "online";
            },

        startAI:
            () => {
                state.mode =
                    "ai";
            },


        continue:
            () => {
                state.screen =
                    "game";
            },


        restart:
            () => {
                state.screen =
                    "restartConfirm";
            },


        restartYes:
            restartGame,


        restartNo:
            () => {
                state.screen =
                    "pause";
            },


        settings:
            () => {
                state.screen =
                    "settings";
            },


        controls:
            () => {
                state.screen =
                    "controls";
            },


        background:
            () => {
                state.screen =
                    "background";
            },


        physics:
            () => {
                state.screen =
                    "physics";
            },


        sound:
            () => {

                state.sound =
                    !state.sound;
            },


        backPause:
            () => {
                state.screen =
                    "pause";
            },


        backSettings:
            () => {
                state.screen =
                    "settings";
            },


        backgroundGreen:
            () => {
                state.tableColor =
                    "green";
            },


        backgroundBlue:
            () => {
                state.tableColor =
                    "blue";
            },


        backgroundBlack:
            () => {
                state.tableColor =
                    "black";
            },


        leftUp:
            () => {

                state.waitingForKey = {
                    side: "left",
                    action: "up"
                };
            },


        leftDown:
            () => {

                state.waitingForKey = {
                    side: "left",
                    action: "down"
                };
            },


        leftMouse:
            () => {

                controls.left.mouse =
                    !controls.left.mouse;
            },


        rightUp:
            () => {

                state.waitingForKey = {
                    side: "right",
                    action: "up"
                };
            },


        rightDown:
            () => {

                state.waitingForKey = {
                    side: "right",
                    action: "down"
                };
            },


        rightMouse:
            () => {

                controls.right.mouse =
                    !controls.right.mouse;
            },


        resetControls:
            resetControlsDefaults,


        progressive:
            () => {

                state.progressiveSpeed =
                    !state.progressiveSpeed;
            },


        resetPhysics:
            resetPhysicsDefaults,


        revenge:
            restartGame
    };


    if (actions[id]) {
        actions[id]();
    }
}


// ============================================================
// INTERFAZ
// ============================================================

function menuButtonRect(
    index,
    count,
    width = UI.buttonWidth,
    height = UI.buttonHeight,
    gap = UI.buttonGap,
    centerY =
        CANVAS_HEIGHT / 2 + 30
) {

    const total =
        count * height +
        (count - 1) * gap;

    return {

        x:
            (
                CANVAS_WIDTH -
                width
            ) / 2,

        y:
            centerY -
            total / 2 +
            index *
            (
                height +
                gap
            ),

        w: width,
        h: height
    };
}


function sliderRect(
    x,
    y,
    width = 240,
    height = 18
) {

    return {
        x,
        y,
        w: width,
        h: height
    };
}


function currentInteractives() {

    const items = [];


    const button = (
        id,
        text,
        rect,
        options = {}
    ) => {

        items.push({
            id,
            text,
            rect,
            type: "button",
            ...options
        });
    };


    const slider = (
        id,
        rect,
        options = {}
    ) => {

        items.push({
            id,
            rect,
            type: "slider",
            ...options
        });
    };


    // INICIO

    if (
        state.screen ===
        "start"
    ) {

        button(
            "startLocal",
            "PVP LOCAL",
            menuButtonRect(
                0,
                3,
                330,
                62,
                18,
                430
            )
        );

        button(
            "startOnline",
            "PVP ONLINE",
            menuButtonRect(
                1,
                3,
                330,
                62,
                18,
                430
            )
        );

        button(
            "startAI",
            "SP VS IA",
            menuButtonRect(
                2,
                3,
                330,
                62,
                18,
                430
            )
        );
    }


    // PAUSA

    if (
        state.screen ===
        "pause"
    ) {

        button(
            "continue",
            "CONTINUAR",
            menuButtonRect(
                0,
                3
            )
        );

        button(
            "restart",
            "REINICIAR PARTIDA",
            menuButtonRect(
                1,
                3
            )
        );

        button(
            "settings",
            "AJUSTES",
            menuButtonRect(
                2,
                3
            )
        );
    }


    // CONFIRMAR REINICIO

    if (
        state.screen ===
        "restartConfirm"
    ) {

        button(
            "restartYes",
            "SÍ",
            menuButtonRect(
                0,
                2,
                180,
                58,
                22,
                430
            )
        );

        button(
            "restartNo",
            "NO",
            menuButtonRect(
                1,
                2,
                180,
                58,
                22,
                430
            )
        );
    }


    // AJUSTES

    if (
        state.screen ===
        "settings"
    ) {

        button(
            "controls",
            "CONTROLES",
            menuButtonRect(
                0,
                5,
                300,
                55,
                14,
                390
            )
        );

        button(
            "background",
            "FONDO",
            menuButtonRect(
                1,
                5,
                300,
                55,
                14,
                390
            )
        );

        button(
            "physics",
            "FÍSICAS",
            menuButtonRect(
                2,
                5,
                300,
                55,
                14,
                390
            )
        );

        button(
            "sound",
            `SONIDO: ${
                state.sound
                    ? "ON"
                    : "OFF"
            }`,
            menuButtonRect(
                3,
                5,
                300,
                55,
                14,
                390
            )
        );

        button(
            "backPause",
            "VOLVER",
            menuButtonRect(
                4,
                5,
                300,
                55,
                14,
                390
            )
        );
    }


    // FONDO

    if (
        state.screen ===
        "background"
    ) {

        button(
            "backgroundGreen",
            "VERDE",
            menuButtonRect(
                0,
                4,
                280,
                55,
                15,
                390
            )
        );

        button(
            "backgroundBlue",
            "AZUL",
            menuButtonRect(
                1,
                4,
                280,
                55,
                15,
                390
            )
        );

        button(
            "backgroundBlack",
            "NEGRO",
            menuButtonRect(
                2,
                4,
                280,
                55,
                15,
                390
            )
        );

        button(
            "backSettings",
            "VOLVER",
            menuButtonRect(
                3,
                4,
                280,
                55,
                15,
                390
            )
        );
    }


    // CONTROLES

    if (
        state.screen ===
        "controls"
    ) {

        const leftX = 155;
        const rightX = 745;

        const valueXOffset =
            155;

        const rowY = [
            175,
            240,
            305
        ];


        button(
            "leftUp",

            state.waitingForKey?.side ===
                "left" &&
            state.waitingForKey?.action ===
                "up"

                ? "PRESIONÁ..."
                : formatKey(
                    controls.left.up
                ),

            {
                x:
                    leftX +
                    valueXOffset,

                y: rowY[0],

                w: 190,
                h: 44
            }
        );


        button(
            "leftDown",

            state.waitingForKey?.side ===
                "left" &&
            state.waitingForKey?.action ===
                "down"

                ? "PRESIONÁ..."
                : formatKey(
                    controls.left.down
                ),

            {
                x:
                    leftX +
                    valueXOffset,

                y: rowY[1],

                w: 190,
                h: 44
            }
        );


        button(
            "leftMouse",

            controls.left.mouse
                ? "ON"
                : "OFF",

            {
                x:
                    leftX +
                    valueXOffset,

                y: rowY[2],

                w: 190,
                h: 44
            }
        );


        button(
            "rightUp",

            state.waitingForKey?.side ===
                "right" &&
            state.waitingForKey?.action ===
                "up"

                ? "PRESIONÁ..."
                : formatKey(
                    controls.right.up
                ),

            {
                x:
                    rightX +
                    valueXOffset,

                y: rowY[0],

                w: 190,
                h: 44
            }
        );


        button(
            "rightDown",

            state.waitingForKey?.side ===
                "right" &&
            state.waitingForKey?.action ===
                "down"

                ? "PRESIONÁ..."
                : formatKey(
                    controls.right.down
                ),

            {
                x:
                    rightX +
                    valueXOffset,

                y: rowY[1],

                w: 190,
                h: 44
            }
        );


        button(
            "rightMouse",

            controls.right.mouse
                ? "ON"
                : "OFF",

            {
                x:
                    rightX +
                    valueXOffset,

                y: rowY[2],

                w: 190,
                h: 44
            }
        );


        slider(
            "leftSensitivity",

            sliderRect(
                leftX + 155,
                397,
                190,
                20
            ),

            {
                min:
                    PADDLE.sensitivityMin,

                max:
                    PADDLE.sensitivityMax,

                value:
                    controls.left
                        .sensitivity
            }
        );


        slider(
            "rightSensitivity",

            sliderRect(
                rightX + 155,
                397,
                190,
                20
            ),

            {
                min:
                    PADDLE.sensitivityMin,

                max:
                    PADDLE.sensitivityMax,

                value:
                    controls.right
                        .sensitivity
            }
        );


        button(
            "resetControls",
            "RESTABLECER POR DEFECTO",
            {
                x: 455,
                y: 535,
                w: 370,
                h: 52
            }
        );


        button(
            "backSettings",
            "VOLVER",
            {
                x: 530,
                y: 605,
                w: 220,
                h: 50
            }
        );
    }


    // FÍSICAS

    if (
        state.screen ===
        "physics"
    ) {

        slider(
            "ballSpeed",

            sliderRect(
                470,
                185,
                340,
                22
            ),

            {
                min: 1,
                max: 10,

                value:
                    state.ballSpeedLevel
            }
        );


        button(
            "progressive",

            `VELOCIDAD PROGRESIVA: ${
                state.progressiveSpeed
                    ? "ON"
                    : "OFF"
            }`,

            {
                x: 420,
                y: 255,
                w: 440,
                h: 55
            }
        );


        button(
            "resetPhysics",
            "RESTABLECER POR DEFECTO",
            {
                x: 455,
                y: 520,
                w: 370,
                h: 52
            }
        );


        button(
            "backSettings",
            "VOLVER",
            {
                x: 530,
                y: 590,
                w: 220,
                h: 50
            }
        );
    }


    // VICTORIA

    if (
        state.screen ===
        "victory"
    ) {

        button(
            "revenge",
            "¿REVANCHA?",
            {
                x: 510,
                y: 415,
                w: 260,
                h: 60
            }
        );
    }


    return items;
}


// ============================================================
// INTERACCIÓN
// ============================================================

function getInteractiveAt(
    x,
    y
) {

    return (
        currentInteractives()
            .find(
                item =>
                    rectContains(
                        item.rect,
                        x,
                        y
                    )
            ) ||
        null
    );
}


function getSliderAt(
    x,
    y
) {

    return (
        currentInteractives()
            .find(
                item =>
                    item.type ===
                        "slider" &&

                    rectContains(
                        {
                            x:
                                item.rect.x -
                                8,

                            y:
                                item.rect.y -
                                12,

                            w:
                                item.rect.w +
                                16,

                            h:
                                item.rect.h +
                                24
                        },

                        x,
                        y
                    )
            ) ||
        null
    );
}


function updateSlider(
    id,
    mouseX
) {

    const slider =
        currentInteractives()
            .find(
                item =>
                    item.id === id &&
                    item.type ===
                        "slider"
            );

    if (!slider) {
        return;
    }

    const ratio =
        clamp(
            (
                mouseX -
                slider.rect.x
            ) /
            slider.rect.w,

            0,
            1
        );


    // SENSIBILIDAD IZQUIERDA

    if (
        id ===
        "leftSensitivity"
    ) {

        controls.left
            .sensitivity =
            round1(
                PADDLE.sensitivityMin +
                ratio *
                (
                    PADDLE.sensitivityMax -
                    PADDLE.sensitivityMin
                )
            );
    }


    // SENSIBILIDAD DERECHA

    if (
        id ===
        "rightSensitivity"
    ) {

        controls.right
            .sensitivity =
            round1(
                PADDLE.sensitivityMin +
                ratio *
                (
                    PADDLE.sensitivityMax -
                    PADDLE.sensitivityMin
                )
            );
    }


    // VELOCIDAD DE PELOTA

    if (
        id ===
        "ballSpeed"
    ) {

        state.ballSpeedLevel =
            clamp(
                Math.round(
                    1 +
                    ratio * 9
                ),
                1,
                10
            );

        if (
            state.gameStarted &&
            state.screen !==
                "victory"
        ) {
            resetBall();
        }
    }
}


// ============================================================
// HOVER
// ============================================================

function updateHover(
    x,
    y
) {

    const item =
        getInteractiveAt(
            x,
            y
        );

    state.hoveredId =
        item
            ? item.id
            : null;

    canvas.style.cursor =
        item
            ? "pointer"
            : "default";
}


// ============================================================
// MOTOR GRÁFICO
// ============================================================

function drawTable() {

    context.fillStyle =
        TABLE.colors[
            state.tableColor
        ];

    context.fillRect(
        TABLE.left,
        TABLE.top,
        TABLE.right -
            TABLE.left,
        TABLE.bottom -
            TABLE.top
    );


    context.strokeStyle =
        "#FFFFFF";

    context.lineWidth = 4;

    context.strokeRect(
        TABLE.left,
        TABLE.top,
        TABLE.right -
            TABLE.left,
        TABLE.bottom -
            TABLE.top
    );


    context.lineWidth =
        CENTER_LINE.width;

    context.setLineDash([
        CENTER_LINE.dash,
        CENTER_LINE.gap
    ]);

    context.beginPath();

    context.moveTo(
        CANVAS_WIDTH / 2,
        TABLE.top
    );

    context.lineTo(
        CANVAS_WIDTH / 2,
        TABLE.bottom
    );

    context.stroke();

    context.setLineDash([]);
}


function drawPaddles() {

    context.fillStyle =
        "#FFFFFF";

    context.fillRect(
        leftPaddle.x,
        leftPaddle.y,
        PADDLE.width,
        PADDLE.height
    );

    context.fillRect(
        rightPaddle.x,
        rightPaddle.y,
        PADDLE.width,
        PADDLE.height
    );
}


function drawBall() {

    context.fillStyle =
        "#FFFFFF";

    context.beginPath();

    context.arc(
        ball.x +
            BALL.size / 2,

        ball.y +
            BALL.size / 2,

        BALL.size / 2,

        0,
        Math.PI * 2
    );

    context.fill();
}


function drawScore() {

    context.fillStyle =
        "#FFFFFF";

    context.font =
        UI.scoreFont;

    context.textAlign =
        "center";

    context.textBaseline =
        "bottom";


    context.fillText(
        String(
            state.leftScore
        ).padStart(
            2,
            "0"
        ),

        CANVAS_WIDTH / 4,
        TABLE.bottom - 20
    );


    context.fillText(
        String(
            state.rightScore
        ).padStart(
            2,
            "0"
        ),

        CANVAS_WIDTH * 3 / 4,
        TABLE.bottom - 20
    );
}


function drawOverlay(
    alpha = 0.78
) {

    context.fillStyle =
        `rgba(
            0,
            0,
            0,
            ${alpha}
        )`;

    context.fillRect(
        TABLE.left,
        TABLE.top,
        TABLE.right -
            TABLE.left,
        TABLE.bottom -
            TABLE.top
    );
}


function drawTitle(
    text,
    y = 90,
    font = UI.titleFont
) {

    context.fillStyle =
        "#FFFFFF";

    context.font = font;

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


function drawButton(item) {

    const hovered =
        state.hoveredId ===
        item.id;

    const {
        x,
        y,
        w,
        h
    } =
        item.rect;


    if (hovered) {

        context.fillStyle =
            "rgba(255,255,255,0.12)";

        context.fillRect(
            x,
            y,
            w,
            h
        );
    }


    context.strokeStyle =
        "#FFFFFF";

    context.lineWidth =
        hovered
            ? 5
            : 3;

    context.strokeRect(
        x,
        y,
        w,
        h
    );


    context.fillStyle =
        "#FFFFFF";

    context.font =
        item.small
            ? UI.smallFont
            : UI.buttonFont;

    context.textAlign =
        "center";

    context.textBaseline =
        "middle";


    context.fillText(
        item.text,
        x + w / 2,
        y + h / 2
    );
}


function drawSlider(
    item,
    label,
    displayValue
) {

    const hovered =
        state.hoveredId ===
            item.id ||
        state.activeSlider ===
            item.id;


    const {
        x,
        y,
        w,
        h
    } =
        item.rect;


    const ratio =
        (
            item.value -
            item.min
        ) /
        (
            item.max -
            item.min
        );


    const knobX =
        x +
        ratio * w;


    context.fillStyle =
        "#FFFFFF";

    context.font =
        "bold 20px monospace";

    context.textAlign =
        "left";

    context.textBaseline =
        "middle";


    context.fillText(
        label,
        x,
        y - 26
    );


    context.strokeStyle =
        "#FFFFFF";

    context.lineWidth =
        hovered
            ? 4
            : 2;


    context.strokeRect(
        x,
        y,
        w,
        h
    );


    context.fillStyle =
        "#FFFFFF";

    context.fillRect(
        x,
        y,
        ratio * w,
        h
    );


    context.beginPath();

    context.arc(
        knobX,
        y + h / 2,
        hovered
            ? 10
            : 8,
        0,
        Math.PI * 2
    );

    context.fill();


    context.textAlign =
        "right";

    context.fillText(
        displayValue,
        x + w,
        y - 26
    );
}


// ============================================================
// MENÚ INICIAL
// ============================================================

function drawStartMenu() {

    context.fillStyle =
        "#000000";

    context.fillRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    );


    drawTitle(
        "ARGENPONG",
        145,
        "bold 64px monospace"
    );


    context.font =
        "42px monospace";

    context.fillStyle =
        "#FFFFFF";

    context.textAlign =
        "center";

    context.fillText(
        "🏓",
        CANVAS_WIDTH / 2,
        220
    );


    for (
        const item of
        currentInteractives()
    ) {
        drawButton(item);
    }


    if (
        state.mode ===
            "online" ||
        state.mode ===
            "ai"
    ) {

        context.font =
            "bold 18px monospace";

        context.fillText(
            "PRÓXIMAMENTE",
            CANVAS_WIDTH / 2,
            610
        );
    }
}


// ============================================================
// PAUSA
// ============================================================

function drawPauseMenu() {

    drawOverlay(0.72);

    drawTitle(
        "PAUSA",
        125
    );

    currentInteractives()
        .forEach(
            drawButton
        );
}


// ============================================================
// CONFIRMACIÓN DE REINICIO
// ============================================================

function drawRestartConfirm() {

    drawOverlay(0.82);

    drawTitle(
        "¿REINICIAR PARTIDA?",
        235,
        "bold 42px monospace"
    );


    context.fillStyle =
        "#FFFFFF";

    context.font =
        "20px monospace";

    context.textAlign =
        "center";


    context.fillText(
        "Se perderá el marcador actual.",
        CANVAS_WIDTH / 2,
        300
    );


    currentInteractives()
        .forEach(
            drawButton
        );
}


// ============================================================
// AJUSTES
// ============================================================

function drawSettingsMenu() {

    drawOverlay();

    drawTitle(
        "AJUSTES",
        85
    );


    currentInteractives()
        .forEach(
            drawButton
        );
}


// ============================================================
// FONDO
// ============================================================

function drawBackgroundMenu() {

    drawOverlay();

    drawTitle(
        "FONDO",
        85
    );


    currentInteractives()
        .forEach(
            drawButton
        );
}


// ============================================================
// CONTROLES
// ============================================================

function drawControlsMenu() {

    drawOverlay(0.84);

    drawTitle(
        "CONTROLES",
        70
    );


    const leftX = 155;
    const rightX = 745;

    const rowY = [
        197,
        262,
        327
    ];


    context.fillStyle =
        "#FFFFFF";

    context.font =
        "bold 30px monospace";

    context.textAlign =
        "center";


    context.fillText(
        "IZQUIERDA",
        345,
        125
    );


    context.fillText(
        "DERECHA",
        935,
        125
    );


    context.font =
        "bold 20px monospace";

    context.textAlign =
        "left";


    [
        "ARRIBA",
        "ABAJO",
        "MOUSE"
    ].forEach(
        (
            label,
            index
        ) => {

            context.fillText(
                label,
                leftX,
                rowY[index]
            );

            context.fillText(
                label,
                rightX,
                rowY[index]
            );
        }
    );


    for (
        const item of
        currentInteractives()
    ) {

        if (
            item.type ===
            "button"
        ) {
            drawButton(item);
        }
    }


    const sliders =
        currentInteractives()
            .filter(
                item =>
                    item.type ===
                    "slider"
            );


    drawSlider(
        sliders.find(
            item =>
                item.id ===
                "leftSensitivity"
        ),

        "SENSIBILIDAD",

        controls.left
            .sensitivity
            .toFixed(1)
    );


    drawSlider(
        sliders.find(
            item =>
                item.id ===
                "rightSensitivity"
        ),

        "SENSIBILIDAD",

        controls.right
            .sensitivity
            .toFixed(1)
    );
}


// ============================================================
// FÍSICAS
// ============================================================

function drawPhysicsMenu() {

    drawOverlay(0.84);

    drawTitle(
        "FÍSICAS",
        70
    );


    const items =
        currentInteractives();


    const speedSlider =
        items.find(
            item =>
                item.id ===
                "ballSpeed"
        );


    drawSlider(
        speedSlider,
        "VELOCIDAD DE LA PELOTA",
        String(
            state.ballSpeedLevel
        )
    );


    items
        .filter(
            item =>
                item.type ===
                "button"
        )
        .forEach(
            drawButton
        );


    context.fillStyle =
        "#FFFFFF";

    context.font =
        "bold 20px monospace";

    context.textAlign =
        "center";


    context.fillText(
        `VELOCIDAD REAL: ${
            getBallBaseSpeed()
                .toFixed(1)
        }`,
        CANVAS_WIDTH / 2,
        232
    );


    const spins = [
        "TOPSPIN",
        "BACKSPIN",
        "SIDESPIN"
    ];


    spins.forEach(
        (
            name,
            index
        ) => {

            const y =
                340 +
                index * 52;


            context.strokeStyle =
                "rgba(255,255,255,0.45)";

            context.lineWidth = 2;


            context.strokeRect(
                475,
                y,
                330,
                40
            );


            context.fillStyle =
                "rgba(255,255,255,0.65)";

            context.font =
                "bold 18px monospace";


            context.fillText(
                `${name} · PRÓXIMAMENTE`,
                CANVAS_WIDTH / 2,
                y + 20
            );
        }
    );
}


// ============================================================
// VICTORIA
// ============================================================

function drawVictoryScreen() {

    drawOverlay(0.68);


    drawTitle(
        state.winner ===
            "left"

            ? "LA IZQUIERDA GANA"
            : "LA DERECHA GANA",

        315,
        UI.winnerFont
    );


    currentInteractives()
        .forEach(
            drawButton
        );
}


// ============================================================
// RENDER PRINCIPAL
// ============================================================

function drawGame() {

    context.clearRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    );


    if (
        state.screen ===
        "start"
    ) {

        drawStartMenu();

        return;
    }


    drawTable();
    drawPaddles();
    drawBall();
    drawScore();


    if (
        state.screen ===
        "pause"
    ) {
        drawPauseMenu();
    }


    if (
        state.screen ===
        "restartConfirm"
    ) {
        drawRestartConfirm();
    }


    if (
        state.screen ===
        "settings"
    ) {
        drawSettingsMenu();
    }


    if (
        state.screen ===
        "controls"
    ) {
        drawControlsMenu();
    }


    if (
        state.screen ===
        "background"
    ) {
        drawBackgroundMenu();
    }


    if (
        state.screen ===
        "physics"
    ) {
        drawPhysicsMenu();
    }


    if (
        state.screen ===
        "victory"
    ) {
        drawVictoryScreen();
    }
}


// ============================================================
// LOOP
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
// INICIO
// ============================================================

resetBall();
gameLoop();
