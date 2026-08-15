const W = 1280, H = 720;
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TABLE = {
    margin: 10,
    left: 10,
    right: W - 10,
    top: 10,
    bottom: H - 10,
    colors: {
        green: "#1f5f3a",
        blue: "#174a78",
        black: "#000000"
    }
};

const PADDLE = {
    w: 20,
    h: 120,
    margin: 40,
    baseSpeed: 8
};

const BALL = {
    size: 20,
    baseX: 7,
    baseY: 5
};

const MATCH = {
    win: 11,
    margin: 2
};

const UI = {
    title: "bold 48px monospace",
    button: "bold 24px monospace",
    small: "bold 18px monospace",
    score: "bold 48px monospace",
    winner: "bold 52px monospace"
};

const PHYSICS = {
    min: 3,
    max: 15,
    step: 1,
    progressiveIncrement: 0.05
};

const SENS = {
    min: 0.1,
    max: 1,
    step: 0.1,
    default: 0.5
};

const DEFAULT_PLAYER_CONTROLS = {
    up1: "w",
    up2: "ArrowUp",
    down1: "s",
    down2: "ArrowDown",
    mouse: true,
    sensitivity: SENS.default
};

const AI_LEVELS = {
    easy: {
        label: "FÁCIL",
        reaction: 18,
        maxSpeed: 5.2,
        error: 75
    },

    normal: {
        label: "NORMAL",
        reaction: 9,
        maxSpeed: 7.2,
        error: 36
    },

    hard: {
        label: "DIFÍCIL",
        reaction: 4,
        maxSpeed: 9.6,
        error: 14
    }
};


// ============================================================
// ESTADO
// ============================================================

let courtColor = "black";

let audioContext = null;
let audioMuted = false;

let ballSpeed = BALL.baseX;
let progressiveSpeed = false;

let leftScore = 0;
let rightScore = 0;

let servingPlayer = "left";

let gameOver = false;
let winner = null;

let gamePaused = false;
let gameMode = null;

let startMenuOpen = true;
let aiMenuOpen = false;

let settingsOpen = false;
let controlsOpen = false;
let backgroundOpen = false;
let physicsOpen = false;

let confirmOpen = null;

let hoveredButton = null;
let waitingForKey = null;

let humanSide = "left";
let aiDifficulty = "normal";

let aiTargetY = H / 2;
let aiReactionCounter = 0;

const playerControls = {
    ...DEFAULT_PLAYER_CONTROLS
};

const keys = {};

let mouseY = H / 2;
let previousMouseY = null;


// ============================================================
// OBJETOS
// ============================================================

const leftPaddle = {
    x: PADDLE.margin,
    y: (H - PADDLE.h) / 2
};

const rightPaddle = {
    x:
        W -
        PADDLE.margin -
        PADDLE.w,

    y: (H - PADDLE.h) / 2
};

const ball = {
    x: (W - BALL.size) / 2,
    y: (H - BALL.size) / 2,

    vx: BALL.baseX,
    vy: BALL.baseY
};


// ============================================================
// UTILIDADES
// ============================================================

function clamp(value, min, max) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}

function round1(value) {

    return Math.round(
        value * 10
    ) / 10;
}

function inside(
    mouseX,
    mouseY,
    rect
) {

    return (
        mouseX >= rect.x &&
        mouseX <= rect.x + rect.w &&
        mouseY >= rect.y &&
        mouseY <= rect.y + rect.h
    );
}

function mousePos(event) {

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
        key.toUpperCase()
    );
}

function sidePaddle(side) {

    return side === "left"
        ? leftPaddle
        : rightPaddle;
}

function otherSide(side) {

    return side === "left"
        ? "right"
        : "left";
}


// ============================================================
// AUDIO
// ============================================================

function initAudio() {

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

function sound(
    frequency,
    duration,
    volume
) {

    if (
        audioMuted ||
        !audioContext
    ) {
        return;
    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        "square";

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

const wallSound =
    () =>
        sound(
            500,
            0.06,
            0.08
        );

const paddleSound =
    () =>
        sound(
            800,
            0.07,
            0.1
        );

const pointSound =
    () =>
        sound(
            180,
            0.2,
            0.12
        );


// ============================================================
// RESET
// ============================================================

function resetPlayerControls() {

    Object.assign(
        playerControls,
        DEFAULT_PLAYER_CONTROLS
    );

    waitingForKey = null;
}

function resetPaddles() {

    leftPaddle.y =
        (H - PADDLE.h) / 2;

    rightPaddle.y =
        (H - PADDLE.h) / 2;
}

function resetBall() {

    ball.x =
        (W - BALL.size) / 2;

    ball.y =
        (H - BALL.size) / 2;

    ball.vx =
        servingPlayer === "left"
            ? Math.abs(ballSpeed)
            : -Math.abs(ballSpeed);

    ball.vy =
        (
            ball.vy < 0
                ? -1
                : 1
        ) *
        BALL.baseY;

    aiReactionCounter = 0;
}

function resetMatch() {

    leftScore = 0;
    rightScore = 0;

    servingPlayer = "left";

    gameOver = false;
    winner = null;

    gamePaused = false;
    confirmOpen = null;

    resetPaddles();
    resetBall();
}

function startGame(
    mode,
    side = "left",
    difficulty = "normal"
) {

    gameMode = mode;

    humanSide = side;
    aiDifficulty = difficulty;

    startMenuOpen = false;
    aiMenuOpen = false;

    settingsOpen = false;
    controlsOpen = false;
    backgroundOpen = false;
    physicsOpen = false;

    resetMatch();
}

function goToStartMenu() {

    startMenuOpen = true;
    aiMenuOpen = false;

    gamePaused = false;

    gameOver = false;
    winner = null;

    settingsOpen = false;
    controlsOpen = false;
    backgroundOpen = false;
    physicsOpen = false;

    confirmOpen = null;

    hoveredButton = null;
    waitingForKey = null;

    gameMode = null;
}


// ============================================================
// PARTIDO
// ============================================================

function checkWinner() {

    if (
        leftScore < MATCH.win &&
        rightScore < MATCH.win
    ) {
        return false;
    }

    return (
        Math.abs(
            leftScore -
            rightScore
        ) >=
        MATCH.margin
    );
}

function updateServe() {

    if (
        leftScore >= 10 &&
        rightScore >= 10
    ) {

        servingPlayer =
            otherSide(
                servingPlayer
            );

        return;
    }

    servingPlayer =
        Math.floor(
            (
                leftScore +
                rightScore
            ) /
            2
        ) %
        2 ===
        0

            ? "left"
            : "right";
}

function handlePoint() {

    if (checkWinner()) {

        gameOver = true;

        winner =
            leftScore >
            rightScore

                ? "left"
                : "right";

        return;
    }

    updateServe();
    resetBall();
}


// ============================================================
// MATCH POINT
// ============================================================

function wouldWinNext(side) {

    let left = leftScore;
    let right = rightScore;

    if (side === "left") {

        left++;

    } else {

        right++;
    }

    return (
        (
            left >= MATCH.win ||
            right >= MATCH.win
        ) &&
        Math.abs(
            left -
            right
        ) >=
        MATCH.margin
    );
}

function matchPointSide() {

    const left =
        wouldWinNext(
            "left"
        );

    const right =
        wouldWinNext(
            "right"
        );

    if (
        left &&
        !right
    ) {

        return "left";
    }

    if (
        right &&
        !left
    ) {

        return "right";
    }

    return null;
}


// ============================================================
// VELOCIDAD PROGRESIVA
// ============================================================

function increaseBallSpeed() {

    if (!progressiveSpeed) {
        return;
    }

    const multiplier =
        1 +
        PHYSICS.progressiveIncrement;

    const directionX =
        Math.sign(
            ball.vx
        ) || 1;

    const directionY =
        Math.sign(
            ball.vy
        ) || 1;

    ball.vx =
        directionX *
        Math.min(
            Math.abs(ball.vx) *
            multiplier,

            PHYSICS.max
        );

    ball.vy =
        directionY *
        Math.min(
            Math.abs(ball.vy) *
            multiplier,

            PHYSICS.max
        );
}


// ============================================================
// JUGADOR
// ============================================================

function humanMoveSide(side) {

    const paddle =
        sidePaddle(side);

    const speed =
        PADDLE.baseSpeed *
        (
            0.45 +
            playerControls.sensitivity *
            1.35
        );

    const up =
        keys[playerControls.up1] ||
        keys[playerControls.up2];

    const down =
        keys[playerControls.down1] ||
        keys[playerControls.down2];

    if (up) {

        paddle.y -= speed;
    }

    if (down) {

        paddle.y += speed;
    }
}


// ============================================================
// PVP LOCAL
// ============================================================

function localMove() {

    if (keys.w) {

        leftPaddle.y -=
            PADDLE.baseSpeed;
    }

    if (keys.s) {

        leftPaddle.y +=
            PADDLE.baseSpeed;
    }

    if (keys.ArrowUp) {

        rightPaddle.y -=
            PADDLE.baseSpeed;
    }

    if (keys.ArrowDown) {

        rightPaddle.y +=
            PADDLE.baseSpeed;
    }
}


// ============================================================
// IA
// ============================================================

function predictBallY(targetX) {

    if (
        Math.abs(ball.vx) <
        0.001
    ) {

        return H / 2;
    }

    const time =
        (
            targetX -
            ball.x
        ) /
        ball.vx;

    if (time <= 0) {

        return H / 2;
    }

    const minY =
        TABLE.top;

    const maxY =
        TABLE.bottom -
        BALL.size;

    const span =
        maxY -
        minY;

    let predictedY =
        ball.y +
        ball.vy *
        time -
        minY;

    const period =
        span * 2;

    predictedY =
        (
            (
                predictedY %
                period
            ) +
            period
        ) %
        period;

    if (
        predictedY >
        span
    ) {

        predictedY =
            period -
            predictedY;
    }

    return (
        predictedY +
        minY +
        BALL.size / 2
    );
}

function updateAI() {

    if (
        gameMode !== "ai"
    ) {
        return;
    }

    const aiSide =
        otherSide(
            humanSide
        );

    const paddle =
        sidePaddle(
            aiSide
        );

    const config =
        AI_LEVELS[
            aiDifficulty
        ];

    const ballComing =
        aiSide === "left"
            ? ball.vx < 0
            : ball.vx > 0;

    if (
        aiReactionCounter-- <=
        0
    ) {

        const targetX =
            aiSide === "left"

                ? paddle.x +
                  PADDLE.w

                : paddle.x;

        const predicted =
            ballComing

                ? predictBallY(
                    targetX
                )

                : H / 2;

        const error =
            (
                Math.random() *
                2 -
                1
            ) *
            config.error;

        aiTargetY =
            predicted +
            error;

        aiReactionCounter =
            config.reaction;
    }

    const center =
        paddle.y +
        PADDLE.h / 2;

    const delta =
        aiTargetY -
        center;

    paddle.y +=
        clamp(
            delta,
            -config.maxSpeed,
            config.maxSpeed
        );
}


// ============================================================
// PALETAS
// ============================================================

function clampPaddles() {

    const maxY =
        TABLE.bottom -
        PADDLE.h;

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
        startMenuOpen ||
        aiMenuOpen ||
        gamePaused ||
        gameOver
    ) {
        return;
    }

    if (
        gameMode === "local"
    ) {

        localMove();
    }

    if (
        gameMode === "ai"
    ) {

        humanMoveSide(
            humanSide
        );

        updateAI();
    }

    clampPaddles();
}


// ============================================================
// PELOTA
// ============================================================

function updateBall() {

    if (
        startMenuOpen ||
        aiMenuOpen ||
        gamePaused ||
        gameOver ||
        !gameMode
    ) {
        return;
    }

    ball.x += ball.vx;
    ball.y += ball.vy;


    // PARED SUPERIOR

    if (
        ball.y <=
        TABLE.top
    ) {

        ball.y =
            TABLE.top;

        ball.vy =
            Math.abs(
                ball.vy
            );

        increaseBallSpeed();
        wallSound();
    }


    // PARED INFERIOR

    if (
        ball.y +
        BALL.size >=
        TABLE.bottom
    ) {

        ball.y =
            TABLE.bottom -
            BALL.size;

        ball.vy =
            -Math.abs(
                ball.vy
            );

        increaseBallSpeed();
        wallSound();
    }


    // PALETA IZQUIERDA

    if (
        ball.vx < 0 &&

        ball.x <=
            leftPaddle.x +
            PADDLE.w &&

        ball.x +
            BALL.size >=
            leftPaddle.x &&

        ball.y +
            BALL.size >=
            leftPaddle.y &&

        ball.y <=
            leftPaddle.y +
            PADDLE.h
    ) {

        ball.x =
            leftPaddle.x +
            PADDLE.w;

        ball.vx =
            Math.abs(
                ball.vx
            );

        increaseBallSpeed();
        paddleSound();
    }


    // PALETA DERECHA

    if (
        ball.vx > 0 &&

        ball.x +
            BALL.size >=
            rightPaddle.x &&

        ball.x <=
            rightPaddle.x +
            PADDLE.w &&

        ball.y +
            BALL.size >=
            rightPaddle.y &&

        ball.y <=
            rightPaddle.y +
            PADDLE.h
    ) {

        ball.x =
            rightPaddle.x -
            BALL.size;

        ball.vx =
            -Math.abs(
                ball.vx
            );

        increaseBallSpeed();
        paddleSound();
    }


    // PUNTO DERECHA

    if (
        ball.x +
        BALL.size <
        TABLE.left
    ) {

        rightScore++;

        pointSound();
        handlePoint();

        return;
    }


    // PUNTO IZQUIERDA

    if (
        ball.x >
        TABLE.right
    ) {

        leftScore++;

        pointSound();
        handlePoint();
    }
}


// ============================================================
// TECLADO
// ============================================================

window.addEventListener(
    "keydown",
    event => {

        initAudio();

        if (waitingForKey) {

            event.preventDefault();

            if (
                event.key ===
                "Escape"
            ) {

                waitingForKey =
                    null;

                closeMenusToGame();

                return;
            }

            playerControls[
                waitingForKey
            ] =
                event.key;

            waitingForKey =
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

            audioMuted =
                !audioMuted;

            return;
        }


        // ESC

        if (
            event.key ===
            "Escape"
        ) {

            event.preventDefault();

            handleEscape();

            return;
        }

        if (
            startMenuOpen ||
            aiMenuOpen ||
            gamePaused ||
            gameOver
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
// ESC
// ============================================================

function closeMenusToGame() {

    if (
        !gameMode ||
        startMenuOpen
    ) {
        return;
    }

    gamePaused = false;

    settingsOpen = false;
    controlsOpen = false;
    backgroundOpen = false;
    physicsOpen = false;

    confirmOpen = null;

    waitingForKey = null;
    hoveredButton = null;
}

function handleEscape() {

    if (startMenuOpen) {

        if (aiMenuOpen) {

            aiMenuOpen = false;
        }

        return;
    }

    if (gameOver) {
        return;
    }

    if (
        gamePaused ||
        settingsOpen ||
        controlsOpen ||
        backgroundOpen ||
        physicsOpen ||
        confirmOpen
    ) {

        closeMenusToGame();

        return;
    }

    gamePaused = true;
}


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
            mousePos(
                event
            );

        mouseY = y;

        if (
            !startMenuOpen &&
            !aiMenuOpen &&
            !gamePaused &&
            !gameOver &&
            gameMode === "ai" &&
            playerControls.mouse &&
            previousMouseY !== null
        ) {

            const paddle =
                sidePaddle(
                    humanSide
                );

            const delta =
                y -
                previousMouseY;

            paddle.y +=
                delta *
                (
                    0.55 +
                    playerControls
                        .sensitivity *
                    1.65
                );

            clampPaddles();
        }

        previousMouseY = y;

        updateHover(
            x,
            y
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
            mousePos(
                event
            );

        const hit =
            interactiveItems()
                .find(
                    item =>
                        inside(
                            x,
                            y,
                            item.rect
                        )
                );

        if (
            hit &&
            !hit.disabled
        ) {

            handleAction(
                hit.id
            );
        }
    }
);


// ============================================================
// MENÚS
// ============================================================

function buttonRect(
    index,
    count,
    width = 320,
    height = 58,
    gap = 16,
    centerY = 390
) {

    const total =
        count *
        height +
        (
            count -
            1
        ) *
        gap;

    return {
        x:
            (
                W -
                width
            ) /
            2,

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

function interactiveItems() {

    const items = [];

    const add = (
        id,
        text,
        rect,
        disabled = false
    ) => {

        items.push({
            id,
            text,
            rect,
            disabled
        });
    };


    // MENÚ INICIAL

    if (
        startMenuOpen &&
        !aiMenuOpen
    ) {

        add(
            "local",
            "PVP LOCAL",
            buttonRect(
                0,
                3
            )
        );

        add(
            "ai",
            "VS IA",
            buttonRect(
                1,
                3
            )
        );

        add(
            "online",
            "PVP ONLINE · PRÓXIMAMENTE",
            buttonRect(
                2,
                3
            ),
            true
        );

        return items;
    }


    // MENÚ IA

    if (
        startMenuOpen &&
        aiMenuOpen
    ) {

        add(
            "side",

            `LADO: ${
                humanSide ===
                "left"

                    ? "IZQUIERDA"
                    : "DERECHA"
            }`,

            buttonRect(
                0,
                5,
                360,
                54,
                13,
                400
            )
        );

        add(
            "easy",
            "FÁCIL",
            buttonRect(
                1,
                5,
                360,
                54,
                13,
                400
            )
        );

        add(
            "normal",
            "NORMAL",
            buttonRect(
                2,
                5,
                360,
                54,
                13,
                400
            )
        );

        add(
            "hard",
            "DIFÍCIL",
            buttonRect(
                3,
                5,
                360,
                54,
                13,
                400
            )
        );

        add(
            "aiBack",
            "VOLVER",
            buttonRect(
                4,
                5,
                360,
                54,
                13,
                400
            )
        );

        return items;
    }


    // VICTORIA

    if (gameOver) {

        add(
            "revenge",
            "¿REVANCHA?",
            {
                x: W / 2 - 130,
                y: H / 2 + 55,
                w: 260,
                h: 60
            }
        );

        add(
            "victoryMenu",
            "MENÚ INICIAL",
            {
                x: W / 2 - 130,
                y: H / 2 + 135,
                w: 260,
                h: 52
            }
        );

        return items;
    }


    // CONFIRMACIÓN

    if (confirmOpen) {

        add(
            "confirmYes",
            "SÍ",
            {
                x: W / 2 - 200,
                y: H / 2 + 40,
                w: 180,
                h: 55
            }
        );

        add(
            "confirmNo",
            "NO",
            {
                x: W / 2 + 20,
                y: H / 2 + 40,
                w: 180,
                h: 55
            }
        );

        return items;
    }


    // CONTROLES

    if (controlsOpen) {

        const x =
            W / 2 -
            170;

        add(
            "up1",
            formatKey(
                playerControls.up1
            ),
            {
                x,
                y: 185,
                w: 150,
                h: 44
            }
        );

        add(
            "up2",
            formatKey(
                playerControls.up2
            ),
            {
                x: x + 170,
                y: 185,
                w: 150,
                h: 44
            }
        );

        add(
            "down1",
            formatKey(
                playerControls.down1
            ),
            {
                x,
                y: 250,
                w: 150,
                h: 44
            }
        );

        add(
            "down2",
            formatKey(
                playerControls.down2
            ),
            {
                x: x + 170,
                y: 250,
                w: 150,
                h: 44
            }
        );

        add(
            "mouse",

            `MOUSE: ${
                playerControls.mouse
                    ? "ON"
                    : "OFF"
            }`,

            {
                x,
                y: 315,
                w: 320,
                h: 50
            }
        );

        add(
            "sensMinus",
            "-",
            {
                x,
                y: 390,
                w: 55,
                h: 46
            }
        );

        add(
            "sensPlus",
            "+",
            {
                x: x + 265,
                y: 390,
                w: 55,
                h: 46
            }
        );

        add(
            "controlsReset",
            "RESTABLECER POR DEFECTO",
            {
                x: W / 2 - 190,
                y: 500,
                w: 380,
                h: 52
            }
        );

        add(
            "controlsBack",
            "VOLVER",
            {
                x: W / 2 - 110,
                y: 575,
                w: 220,
                h: 50
            }
        );

        return items;
    }


    // FONDO

    if (backgroundOpen) {

        const labels = [
            "VERDE",
            "AZUL",
            "NEGRO",
            "VOLVER"
        ];

        const ids = [
            "green",
            "blue",
            "black",
            "backgroundBack"
        ];

        labels.forEach(
            (
                text,
                index
            ) => {

                add(
                    ids[index],
                    text,
                    buttonRect(
                        index,
                        4,
                        280,
                        55,
                        15,
                        380
                    )
                );
            }
        );

        return items;
    }


    // FÍSICAS

    if (physicsOpen) {

        add(
            "speedPlus",
            `VELOCIDAD +   ${ballSpeed}`,
            buttonRect(
                0,
                4,
                320,
                55,
                15,
                380
            )
        );

        add(
            "speedMinus",
            `VELOCIDAD -   ${ballSpeed}`,
            buttonRect(
                1,
                4,
                320,
                55,
                15,
                380
            )
        );

        add(
            "progressive",

            `PROGRESIVA: ${
                progressiveSpeed
                    ? "ON"
                    : "OFF"
            }`,

            buttonRect(
                2,
                4,
                320,
                55,
                15,
                380
            )
        );

        add(
            "physicsBack",
            "VOLVER",
            buttonRect(
                3,
                4,
                320,
                55,
                15,
                380
            )
        );

        return items;
    }


    // AJUSTES

    if (settingsOpen) {

        add(
            "controls",
            "CONTROLES",
            buttonRect(
                0,
                5,
                300,
                55,
                14,
                390
            )
        );

        add(
            "background",
            "FONDO",
            buttonRect(
                1,
                5,
                300,
                55,
                14,
                390
            )
        );

        add(
            "physics",
            "FÍSICAS",
            buttonRect(
                2,
                5,
                300,
                55,
                14,
                390
            )
        );

        add(
            "sound",

            `SONIDO: ${
                audioMuted
                    ? "OFF"
                    : "ON"
            }`,

            buttonRect(
                3,
                5,
                300,
                55,
                14,
                390
            )
        );

        add(
            "settingsBack",
            "VOLVER",
            buttonRect(
                4,
                5,
                300,
                55,
                14,
                390
            )
        );

        return items;
    }


    // PAUSA

    if (gamePaused) {

        add(
            "continue",
            "CONTINUAR",
            buttonRect(
                0,
                4,
                330,
                58,
                15,
                390
            )
        );

        add(
            "restart",
            "REINICIAR PARTIDA",
            buttonRect(
                1,
                4,
                330,
                58,
                15,
                390
            )
        );

        add(
            "mainMenu",
            "MENÚ INICIAL",
            buttonRect(
                2,
                4,
                330,
                58,
                15,
                390
            )
        );

        add(
            "settings",
            "AJUSTES",
            buttonRect(
                3,
                4,
                330,
                58,
                15,
                390
            )
        );
    }

    return items;
}


// ============================================================
// ACCIONES
// ============================================================

function handleAction(id) {

    initAudio();

    if (id === "online") {

        return;
    }

    if (id === "local") {

        startGame(
            "local"
        );

        return;
    }

    if (id === "ai") {

        aiMenuOpen = true;
        humanSide = "left";

        return;
    }

    if (id === "side") {

        humanSide =
            otherSide(
                humanSide
            );

        return;
    }

    if (
        [
            "easy",
            "normal",
            "hard"
        ].includes(id)
    ) {

        startGame(
            "ai",
            humanSide,
            id
        );

        return;
    }

    if (id === "aiBack") {

        aiMenuOpen = false;

        return;
    }

    if (id === "continue") {

        gamePaused = false;

        return;
    }

    if (id === "restart") {

        confirmOpen =
            "restart";

        return;
    }

    if (id === "mainMenu") {

        confirmOpen =
            "menu";

        return;
    }

    if (id === "settings") {

        settingsOpen =
            true;

        return;
    }

    if (id === "confirmYes") {

        const action =
            confirmOpen;

        confirmOpen =
            null;

        if (
            action ===
            "restart"
        ) {

            resetMatch();

        } else {

            goToStartMenu();
        }

        return;
    }

    if (id === "confirmNo") {

        confirmOpen =
            null;

        return;
    }

    if (id === "controls") {

        controlsOpen =
            true;

        return;
    }

    if (id === "background") {

        backgroundOpen =
            true;

        return;
    }

    if (id === "physics") {

        physicsOpen =
            true;

        return;
    }

    if (id === "sound") {

        audioMuted =
            !audioMuted;

        return;
    }

    if (id === "settingsBack") {

        settingsOpen =
            false;

        return;
    }

    if (id === "controlsBack") {

        controlsOpen =
            false;

        waitingForKey =
            null;

        return;
    }

    if (id === "backgroundBack") {

        backgroundOpen =
            false;

        return;
    }

    if (id === "physicsBack") {

        physicsOpen =
            false;

        return;
    }

    if (
        id === "green" ||
        id === "blue" ||
        id === "black"
    ) {

        courtColor = id;

        return;
    }

    if (
        [
            "up1",
            "up2",
            "down1",
            "down2"
        ].includes(id)
    ) {

        waitingForKey = id;

        return;
    }

    if (id === "mouse") {

        playerControls.mouse =
            !playerControls.mouse;

        return;
    }

    if (id === "sensMinus") {

        playerControls.sensitivity =
            round1(
                clamp(
                    playerControls
                        .sensitivity -
                    SENS.step,

                    SENS.min,
                    SENS.max
                )
            );

        return;
    }

    if (id === "sensPlus") {

        playerControls.sensitivity =
            round1(
                clamp(
                    playerControls
                        .sensitivity +
                    SENS.step,

                    SENS.min,
                    SENS.max
                )
            );

        return;
    }

    if (id === "controlsReset") {

        resetPlayerControls();

        return;
    }

    if (id === "speedPlus") {

        ballSpeed =
            Math.min(
                PHYSICS.max,
                ballSpeed +
                PHYSICS.step
            );

        return;
    }

    if (id === "speedMinus") {

        ballSpeed =
            Math.max(
                PHYSICS.min,
                ballSpeed -
                PHYSICS.step
            );

        return;
    }

    if (id === "progressive") {

        progressiveSpeed =
            !progressiveSpeed;

        return;
    }

    if (id === "revenge") {

        resetMatch();

        return;
    }

    if (id === "victoryMenu") {

        goToStartMenu();
    }
}


// ============================================================
// HOVER
// ============================================================

function updateHover(
    x,
    y
) {

    hoveredButton =
        null;

    for (
        const item of
        interactiveItems()
    ) {

        if (
            !item.disabled &&
            inside(
                x,
                y,
                item.rect
            )
        ) {

            hoveredButton =
                item.id;

            break;
        }
    }

    canvas.style.cursor =
        hoveredButton
            ? "pointer"
            : "default";
}


// ============================================================
// MOTOR GRÁFICO
// ============================================================

function drawTable() {

    ctx.fillStyle =
        TABLE.colors[
            courtColor
        ];

    ctx.fillRect(
        TABLE.left,
        TABLE.top,
        TABLE.right -
        TABLE.left,
        TABLE.bottom -
        TABLE.top
    );

    ctx.strokeStyle =
        "#FFFFFF";

    ctx.lineWidth = 4;

    ctx.strokeRect(
        TABLE.left,
        TABLE.top,
        TABLE.right -
        TABLE.left,
        TABLE.bottom -
        TABLE.top
    );

    ctx.setLineDash([
        20,
        20
    ]);

    ctx.lineWidth = 4;

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

function drawPaddles() {

    ctx.fillStyle =
        "#FFFFFF";

    ctx.fillRect(
        leftPaddle.x,
        leftPaddle.y,
        PADDLE.w,
        PADDLE.h
    );

    ctx.fillRect(
        rightPaddle.x,
        rightPaddle.y,
        PADDLE.w,
        PADDLE.h
    );
}

function drawBall() {

    ctx.fillStyle =
        "#FFFFFF";

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

function drawScore() {

    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        UI.score;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "bottom";

    ctx.fillText(
        String(
            leftScore
        ).padStart(
            2,
            "0"
        ),

        W / 4,
        TABLE.bottom - 20
    );

    ctx.fillText(
        String(
            rightScore
        ).padStart(
            2,
            "0"
        ),

        W * 3 / 4,
        TABLE.bottom - 20
    );

    const matchPoint =
        matchPointSide();

    if (
        matchPoint &&
        !gameOver
    ) {

        ctx.font =
            "bold 20px monospace";

        ctx.fillText(
            `MATCH POINT · ${
                matchPoint ===
                "left"

                    ? "IZQUIERDA"
                    : "DERECHA"
            }`,

            W / 2,
            TABLE.bottom - 82
        );
    }
}

function overlay(
    alpha = 0.78
) {

    ctx.fillStyle =
        `rgba(
            0,
            0,
            0,
            ${alpha}
        )`;

    ctx.fillRect(
        TABLE.left,
        TABLE.top,
        TABLE.right -
        TABLE.left,
        TABLE.bottom -
        TABLE.top
    );
}

function title(
    text,
    y = 90,
    font = UI.title
) {

    ctx.fillStyle =
        "#FFFFFF";

    ctx.font = font;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        text,
        W / 2,
        y
    );
}

function drawButton(item) {

    const hover =
        hoveredButton ===
        item.id;

    ctx.fillStyle =
        item.disabled

            ? "rgba(255,255,255,.03)"

            : hover
                ? "rgba(255,255,255,.13)"
                : "rgba(0,0,0,.1)";

    ctx.fillRect(
        item.rect.x,
        item.rect.y,
        item.rect.w,
        item.rect.h
    );

    ctx.strokeStyle =
        item.disabled

            ? "rgba(255,255,255,.35)"
            : "#FFFFFF";

    ctx.lineWidth =
        hover
            ? 5
            : 3;

    ctx.strokeRect(
        item.rect.x,
        item.rect.y,
        item.rect.w,
        item.rect.h
    );

    ctx.fillStyle =
        item.disabled

            ? "rgba(255,255,255,.5)"
            : "#FFFFFF";

    ctx.font =
        UI.button;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        item.text,

        item.rect.x +
        item.rect.w / 2,

        item.rect.y +
        item.rect.h / 2
    );
}


// ============================================================
// MENÚ INICIAL
// ============================================================

function drawStart() {

    ctx.fillStyle =
        "#000000";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    title(
        "ARGENPONG",
        145,
        "bold 64px monospace"
    );

    ctx.font =
        "42px monospace";

    ctx.fillStyle =
        "#FFFFFF";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "🏓",
        W / 2,
        220
    );

    if (aiMenuOpen) {

        title(
            "VS IA",
            105
        );

        ctx.font =
            "bold 20px monospace";

        ctx.fillText(
            "Elegí tu lado y después la dificultad",
            W / 2,
            180
        );
    }

    interactiveItems()
        .forEach(
            drawButton
        );
}


// ============================================================
// PAUSA
// ============================================================

function drawPause() {

    overlay(
        0.72
    );

    title(
        "PAUSA",
        110
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}


// ============================================================
// CONFIRMACIÓN
// ============================================================

function drawConfirm() {

    overlay(
        0.84
    );

    title(
        confirmOpen ===
        "restart"

            ? "¿REINICIAR PARTIDA?"
            : "¿VOLVER AL MENÚ?",

        H / 2 - 80,

        "bold 42px monospace"
    );

    ctx.font =
        "20px monospace";

    ctx.fillStyle =
        "#FFFFFF";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "Se perderá la partida actual.",
        W / 2,
        H / 2 - 25
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}


// ============================================================
// AJUSTES
// ============================================================

function drawSettings() {

    overlay(
        0.8
    );

    title(
        "AJUSTES",
        75
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}


// ============================================================
// FONDO
// ============================================================

function drawBackground() {

    overlay(
        0.82
    );

    title(
        "FONDO",
        75
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}


// ============================================================
// FÍSICAS
// ============================================================

function drawPhysics() {

    overlay(
        0.82
    );

    title(
        "FÍSICAS",
        75
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}


// ============================================================
// CONTROLES
// ============================================================

function drawControls() {

    overlay(
        0.84
    );

    title(
        "CONTROLES DEL JUGADOR",
        70
    );

    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        "bold 20px monospace";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "ARRIBA",
        W / 2,
        165
    );

    ctx.fillText(
        "ABAJO",
        W / 2,
        230
    );

    ctx.fillText(
        "SENSIBILIDAD",
        W / 2,
        385
    );

    ctx.font =
        "bold 24px monospace";

    ctx.fillText(
        playerControls
            .sensitivity
            .toFixed(1),

        W / 2,
        414
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}


// ============================================================
// VICTORIA
// ============================================================

function drawVictory() {

    overlay(
        0.68
    );

    title(
        winner ===
        "left"

            ? "LA IZQUIERDA GANA"
            : "LA DERECHA GANA",

        H / 2 - 50,

        UI.winner
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}


// ============================================================
// RENDER
// ============================================================

function drawGame() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    if (startMenuOpen) {

        drawStart();

        return;
    }

    drawTable();
    drawPaddles();
    drawBall();
    drawScore();

    if (gameOver) {

        drawVictory();

        return;
    }

    if (confirmOpen) {

        drawConfirm();

        return;
    }

    if (controlsOpen) {

        drawControls();

        return;
    }

    if (backgroundOpen) {

        drawBackground();

        return;
    }

    if (physicsOpen) {

        drawPhysics();

        return;
    }

    if (settingsOpen) {

        drawSettings();

        return;
    }

    if (gamePaused) {

        drawPause();
    }
}


// ============================================================
// LOOP
// ============================================================

function loop() {

    updatePaddles();
    updateBall();

    drawGame();

    requestAnimationFrame(
        loop
    );
}


// ============================================================
// INICIO
// ============================================================

resetBall();
loop();
