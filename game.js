const W = 1280, H = 720;
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TABLE = {
    left: 10, right: W - 10, top: 10, bottom: H - 10,
    colors: { green: "#1f5f3a", blue: "#174a78", black: "#000000" }
};

const PADDLE = { w: 20, h: 120, margin: 40, baseSpeed: 8 };

const BALL = {
    size: 20,
    speedLevels: [4, 5, 6, 7.2, 8.6, 10.2, 12, 14.2, 17, 20],
    defaultLevel: 5,
    baseYRatio: 0.7,
    progressiveFactor: 1.04
};

const MATCH = { win: 11, margin: 2 };

const UI = {
    title: "bold 48px monospace",
    button: "bold 24px monospace",
    small: "bold 18px monospace",
    score: "bold 48px monospace",
    winner: "bold 52px monospace"
};

const SENS = {
    min: 0.1,
    max: 1,
    step: 0.1,
    default: 0.5
};

const LOCAL_DEFAULTS = {
    left: {
        up: "w",
        down: "s",
        mouse: false,
        sensitivity: SENS.default
    },

    right: {
        up: "ArrowUp",
        down: "ArrowDown",
        mouse: false,
        sensitivity: SENS.default
    }
};

const AI_DEFAULTS = {
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

let courtColor = "black";

let audioContext = null;
let audioMuted = false;

let ballSpeedLevel = BALL.defaultLevel;
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

let previousMouseY = null;
let activeSlider = null;

const localControls = {
    left: { ...LOCAL_DEFAULTS.left },
    right: { ...LOCAL_DEFAULTS.right }
};

const aiControls = {
    ...AI_DEFAULTS
};

const keys = {};

const leftPaddle = {
    x: PADDLE.margin,
    y: (H - PADDLE.h) / 2
};

const rightPaddle = {
    x: W - PADDLE.margin - PADDLE.w,
    y: (H - PADDLE.h) / 2
};

const ball = {
    x: (W - BALL.size) / 2,
    y: (H - BALL.size) / 2,
    vx: 0,
    vy: 0
};


// ============================================================
// UTILS
// ============================================================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function round1(value) {
    return Math.round(value * 10) / 10;
}

function inside(x, y, rect) {
    return (
        x >= rect.x &&
        x <= rect.x + rect.w &&
        y >= rect.y &&
        y <= rect.y + rect.h
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

function currentBallSpeed() {
    return BALL.speedLevels[
        ballSpeedLevel - 1
    ];
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

const wallSound = () =>
    sound(500, 0.06, 0.08);

const paddleSound = () =>
    sound(800, 0.07, 0.1);

const pointSound = () =>
    sound(180, 0.2, 0.12);


// ============================================================
// RESET
// ============================================================

function resetLocalControls() {
    Object.assign(
        localControls.left,
        LOCAL_DEFAULTS.left
    );

    Object.assign(
        localControls.right,
        LOCAL_DEFAULTS.right
    );

    waitingForKey = null;
}

function resetAIControls() {
    Object.assign(
        aiControls,
        AI_DEFAULTS
    );

    waitingForKey = null;
}

function resetPhysics() {
    ballSpeedLevel =
        BALL.defaultLevel;

    progressiveSpeed =
        false;

    if (
        gameMode &&
        !gameOver
    ) {
        resetBall();
    }
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

    const speed =
        currentBallSpeed();

    ball.vx =
        (
            servingPlayer ===
            "left"
                ? 1
                : -1
        ) *
        speed;

    const ySign =
        ball.vy < 0
            ? -1
            : 1;

    ball.vy =
        ySign *
        Math.max(
            3,
            speed *
            BALL.baseYRatio
        );

    aiReactionCounter = 0;
}

function resetMatch() {
    leftScore = 0;
    rightScore = 0;

    servingPlayer =
        "left";

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

    confirmOpen = null;

    hoveredButton = null;
    waitingForKey = null;

    settingsOpen = false;
    controlsOpen = false;
    backgroundOpen = false;
    physicsOpen = false;

    gameMode = null;
}


// ============================================================
// MATCH
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
// FÍSICA
// ============================================================

function increaseBallSpeed() {
    if (!progressiveSpeed) {
        return;
    }

    const maxSpeed =
        BALL.speedLevels[
            BALL.speedLevels.length - 1
        ];

    const currentSpeed =
        Math.hypot(
            ball.vx,
            ball.vy
        );

    if (
        currentSpeed >=
        maxSpeed
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

    ball.vx *= scale;
    ball.vy *= scale;
}


// ============================================================
// MOVIMIENTO
// ============================================================

function localMove() {
    const left =
        localControls.left;

    const right =
        localControls.right;

    const leftSpeed =
        PADDLE.baseSpeed *
        (
            0.45 +
            left.sensitivity *
            1.35
        );

    const rightSpeed =
        PADDLE.baseSpeed *
        (
            0.45 +
            right.sensitivity *
            1.35
        );

    if (keys[left.up]) {
        leftPaddle.y -=
            leftSpeed;
    }

    if (keys[left.down]) {
        leftPaddle.y +=
            leftSpeed;
    }

    if (keys[right.up]) {
        rightPaddle.y -=
            rightSpeed;
    }

    if (keys[right.down]) {
        rightPaddle.y +=
            rightSpeed;
    }
}

function humanMoveAI() {
    const paddle =
        sidePaddle(
            humanSide
        );

    const speed =
        PADDLE.baseSpeed *
        (
            0.45 +
            aiControls.sensitivity *
            1.35
        );

    const up =
        keys[aiControls.up1] ||
        keys[aiControls.up2];

    const down =
        keys[aiControls.down1] ||
        keys[aiControls.down2];

    if (up) {
        paddle.y -= speed;
    }

    if (down) {
        paddle.y += speed;
    }
}

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

    const period =
        span * 2;

    let predictedY =
        ball.y +
        ball.vy *
        time -
        minY;

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
        gameMode !==
        "ai"
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

        aiTargetY =
            predicted +
            (
                Math.random() *
                2 -
                1
            ) *
            config.error;

        aiReactionCounter =
            config.reaction;
    }

    const delta =
        aiTargetY -
        (
            paddle.y +
            PADDLE.h / 2
        );

    paddle.y +=
        clamp(
            delta,
            -config.maxSpeed,
            config.maxSpeed
        );
}

function updatePaddles() {
    if (
        startMenuOpen ||
        gamePaused ||
        gameOver ||
        !gameMode
    ) {
        return;
    }

    if (
        gameMode ===
        "local"
    ) {
        localMove();
    }

    if (
        gameMode ===
        "ai"
    ) {
        humanMoveAI();
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
        gamePaused ||
        gameOver ||
        !gameMode
    ) {
        return;
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

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
// INPUT
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

            setRebindKey(
                waitingForKey,
                event.key
            );

            waitingForKey =
                null;

            return;
        }

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

function setRebindKey(
    id,
    key
) {
    if (
        gameMode ===
        "local"
    ) {
        const [
            side,
            action
        ] =
            id.split(":");

        localControls[
            side
        ][
            action
        ] =
            key;

        return;
    }

    aiControls[id] =
        key;
}

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
            mousePos(event);

        if (
            !startMenuOpen &&
            !gamePaused &&
            !gameOver &&
            previousMouseY !==
                null
        ) {
            const delta =
                y -
                previousMouseY;

            if (
                gameMode ===
                    "ai" &&
                aiControls.mouse
            ) {
                const paddle =
                    sidePaddle(
                        humanSide
                    );

                paddle.y +=
                    delta *
                    (
                        0.55 +
                        aiControls
                            .sensitivity *
                        1.65
                    );
            }

            if (
                gameMode ===
                "local"
            ) {
                if (
                    localControls
                        .left
                        .mouse
                ) {
                    leftPaddle.y +=
                        delta *
                        (
                            0.55 +
                            localControls
                                .left
                                .sensitivity *
                            1.65
                        );
                }

                if (
                    localControls
                        .right
                        .mouse
                ) {
                    rightPaddle.y +=
                        delta *
                        (
                            0.55 +
                            localControls
                                .right
                                .sensitivity *
                            1.65
                        );
                }
            }

            clampPaddles();
        }

        previousMouseY = y;

        updateHover(
            x,
            y
        );
    }
);

window.addEventListener(
    "mouseup",
    () => {
        activeSlider = null;
    }
);

canvas.addEventListener(
    "mousedown",
    event => {
        const {
            x,
            y
        } =
            mousePos(event);

        const slider =
            interactiveItems()
                .find(
                    item =>
                        item.type ===
                            "slider" &&
                        inside(
                            x,
                            y,
                            item.hitRect ||
                            item.rect
                        )
                );

        if (!slider) {
            return;
        }

        activeSlider =
            slider.id;

        updateSlider(
            slider,
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
            mousePos(event);

        const hit =
            interactiveItems()
                .find(
                    item =>
                        inside(
                            x,
                            y,
                            item.hitRect ||
                            item.rect
                        )
                );

        if (
            hit &&
            !hit.disabled &&
            hit.type !==
                "slider"
        ) {
            handleAction(
                hit.id
            );
        }
    }
);

canvas.addEventListener(
    "mousemove",
    event => {
        if (!activeSlider) {
            return;
        }

        const { x } =
            mousePos(event);

        const slider =
            interactiveItems()
                .find(
                    item =>
                        item.id ===
                            activeSlider &&
                        item.type ===
                            "slider"
                );

        if (slider) {
            updateSlider(
                slider,
                x
            );
        }
    }
);


// ============================================================
// UI DATA
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
            (W - width) / 2,

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

function addSlider(
    items,
    id,
    label,
    value,
    min,
    max,
    rect
) {
    items.push({
        id,
        label,
        value,
        min,
        max,
        rect,

        type:
            "slider",

        hitRect: {
            x: rect.x - 10,
            y: rect.y - 30,
            w: rect.w + 20,
            h: rect.h + 50
        }
    });
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
            disabled,
            type: "button"
        });
    };


    // INICIO

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
            "PVP ONLINE",
            buttonRect(
                2,
                3
            ),
            true
        );

        return items;
    }


    // IA

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
                390
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
                390
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
                390
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
                390
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
                390
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
        if (
            gameMode ===
            "local"
        ) {
            return localControlItems(
                items,
                add
            );
        }

        return aiControlItems(
            items,
            add
        );
    }


    // FONDO

    if (backgroundOpen) {
        [
            "VERDE",
            "AZUL",
            "NEGRO",
            "VOLVER"
        ].forEach(
            (
                text,
                index
            ) => {
                add(
                    [
                        "green",
                        "blue",
                        "black",
                        "backgroundBack"
                    ][index],

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
        addSlider(
            items,
            "ballSpeed",
            "VELOCIDAD",
            ballSpeedLevel,
            1,
            10,
            {
                x: W / 2 - 180,
                y: 170,
                w: 360,
                h: 20
            }
        );

        add(
            "progressive",

            `VELOCIDAD PROGRESIVA: ${
                progressiveSpeed
                    ? "ON"
                    : "OFF"
            }`,

            {
                x: W / 2 - 230,
                y: 240,
                w: 460,
                h: 55
            }
        );

        add(
            "topspin",
            "TOPSPIN · PRÓXIMAMENTE",
            {
                x: W / 2 - 210,
                y: 320,
                w: 420,
                h: 44
            },
            true
        );

        add(
            "backspin",
            "BACKSPIN · PRÓXIMAMENTE",
            {
                x: W / 2 - 210,
                y: 374,
                w: 420,
                h: 44
            },
            true
        );

        add(
            "sidespin",
            "SIDESPIN · PRÓXIMAMENTE",
            {
                x: W / 2 - 210,
                y: 428,
                w: 420,
                h: 44
            },
            true
        );

        add(
            "physicsReset",
            "RESTABLECER POR DEFECTO",
            {
                x: W / 2 - 190,
                y: 505,
                w: 380,
                h: 50
            }
        );

        add(
            "physicsBack",
            "VOLVER",
            {
                x: W / 2 - 110,
                y: 570,
                w: 220,
                h: 50
            }
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
// CONTROLES PVP
// ============================================================

function localControlItems(
    items,
    add
) {
    const columns = {
        left: 140,
        right: 720
    };

    for (
        const side of
        [
            "left",
            "right"
        ]
    ) {
        const x =
            columns[side];

        const controls =
            localControls[side];

        add(
            `${side}:up`,

            waitingForKey ===
            `${side}:up`

                ? "PRESIONÁ..."
                : formatKey(
                    controls.up
                ),

            {
                x: x + 125,
                y: 175,
                w: 180,
                h: 42
            }
        );

        add(
            `${side}:down`,

            waitingForKey ===
            `${side}:down`

                ? "PRESIONÁ..."
                : formatKey(
                    controls.down
                ),

            {
                x: x + 125,
                y: 235,
                w: 180,
                h: 42
            }
        );

        add(
            `${side}:mouse`,

            controls.mouse
                ? "ON"
                : "OFF",

            {
                x: x + 125,
                y: 295,
                w: 180,
                h: 42
            }
        );

        add(
            `${side}:sensMinus`,
            "-",
            {
                x: x + 125,
                y: 365,
                w: 45,
                h: 42
            }
        );

        add(
            `${side}:sensPlus`,
            "+",
            {
                x: x + 260,
                y: 365,
                w: 45,
                h: 42
            }
        );
    }

    add(
        "localControlsReset",
        "RESTABLECER POR DEFECTO",
        {
            x: W / 2 - 185,
            y: 520,
            w: 370,
            h: 50
        }
    );

    add(
        "controlsBack",
        "VOLVER",
        {
            x: W / 2 - 110,
            y: 590,
            w: 220,
            h: 50
        }
    );

    return items;
}


// ============================================================
// CONTROLES VS IA
// ============================================================

function aiControlItems(
    items,
    add
) {
    const labelX = 390;
    const buttonX =
        labelX + 180;

    const rowY = [
        175,
        235,
        295,
        365
    ];

    add(
        "up1",

        waitingForKey ===
        "up1"

            ? "PRESIONÁ..."
            : formatKey(
                aiControls.up1
            ),

        {
            x: buttonX,
            y: rowY[0],
            w: 95,
            h: 42
        }
    );

    add(
        "up2",

        waitingForKey ===
        "up2"

            ? "PRESIONÁ..."
            : formatKey(
                aiControls.up2
            ),

        {
            x: buttonX + 105,
            y: rowY[0],
            w: 95,
            h: 42
        }
    );

    add(
        "down1",

        waitingForKey ===
        "down1"

            ? "PRESIONÁ..."
            : formatKey(
                aiControls.down1
            ),

        {
            x: buttonX,
            y: rowY[1],
            w: 95,
            h: 42
        }
    );

    add(
        "down2",

        waitingForKey ===
        "down2"

            ? "PRESIONÁ..."
            : formatKey(
                aiControls.down2
            ),

        {
            x: buttonX + 105,
            y: rowY[1],
            w: 95,
            h: 42
        }
    );

    add(
        "aiMouse",

        aiControls.mouse
            ? "ON"
            : "OFF",

        {
            x: buttonX,
            y: rowY[2],
            w: 200,
            h: 42
        }
    );

    add(
        "aiSensMinus",
        "-",
        {
            x: buttonX,
            y: rowY[3],
            w: 45,
            h: 42
        }
    );

    add(
        "aiSensPlus",
        "+",
        {
            x: buttonX + 155,
            y: rowY[3],
            w: 45,
            h: 42
        }
    );

    add(
        "aiControlsReset",
        "RESTABLECER POR DEFECTO",
        {
            x: W / 2 - 185,
            y: 510,
            w: 370,
            h: 50
        }
    );

    add(
        "controlsBack",
        "VOLVER",
        {
            x: W / 2 - 110,
            y: 580,
            w: 220,
            h: 50
        }
    );

    return items;
}


// ============================================================
// SLIDER
// ============================================================

function updateSlider(
    slider,
    mouseX
) {
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

    if (
        slider.id ===
        "ballSpeed"
    ) {
        ballSpeedLevel =
            clamp(
                Math.round(
                    1 +
                    ratio * 9
                ),

                1,
                10
            );

        if (
            gameMode &&
            !gameOver
        ) {
            resetBall();
        }
    }
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
        startGame("local");
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
        settingsOpen = true;
        return;
    }

    if (id === "confirmYes") {
        const action =
            confirmOpen;

        confirmOpen = null;

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
        confirmOpen = null;
        return;
    }

    if (id === "controls") {
        controlsOpen = true;
        return;
    }

    if (id === "background") {
        backgroundOpen = true;
        return;
    }

    if (id === "physics") {
        physicsOpen = true;
        return;
    }

    if (id === "sound") {
        audioMuted =
            !audioMuted;

        return;
    }

    if (id === "settingsBack") {
        settingsOpen = false;
        return;
    }

    if (id === "controlsBack") {
        controlsOpen = false;
        waitingForKey = null;
        return;
    }

    if (id === "backgroundBack") {
        backgroundOpen = false;
        return;
    }

    if (id === "physicsBack") {
        physicsOpen = false;
        return;
    }

    if (
        [
            "green",
            "blue",
            "black"
        ].includes(id)
    ) {
        courtColor = id;
        return;
    }


    // CONTROLES PVP

    if (
        gameMode ===
        "local"
    ) {
        const parts =
            id.split(":");

        if (
            parts.length ===
            2
        ) {
            const [
                side,
                action
            ] =
                parts;

            const controls =
                localControls[
                    side
                ];

            if (
                action === "up" ||
                action === "down"
            ) {
                waitingForKey =
                    id;

                return;
            }

            if (
                action ===
                "mouse"
            ) {
                controls.mouse =
                    !controls.mouse;

                return;
            }

            if (
                action ===
                "sensMinus"
            ) {
                controls.sensitivity =
                    round1(
                        clamp(
                            controls.sensitivity -
                            SENS.step,
                            SENS.min,
                            SENS.max
                        )
                    );

                return;
            }

            if (
                action ===
                "sensPlus"
            ) {
                controls.sensitivity =
                    round1(
                        clamp(
                            controls.sensitivity +
                            SENS.step,
                            SENS.min,
                            SENS.max
                        )
                    );

                return;
            }
        }

        if (
            id ===
            "localControlsReset"
        ) {
            resetLocalControls();

            return;
        }
    }


    // CONTROLES IA

    if (
        gameMode ===
        "ai"
    ) {
        if (
            [
                "up1",
                "up2",
                "down1",
                "down2"
            ].includes(id)
        ) {
            waitingForKey =
                id;

            return;
        }

        if (
            id ===
            "aiMouse"
        ) {
            aiControls.mouse =
                !aiControls.mouse;

            return;
        }

        if (
            id ===
            "aiSensMinus"
        ) {
            aiControls.sensitivity =
                round1(
                    clamp(
                        aiControls.sensitivity -
                        SENS.step,
                        SENS.min,
                        SENS.max
                    )
                );

            return;
        }

        if (
            id ===
            "aiSensPlus"
        ) {
            aiControls.sensitivity =
                round1(
                    clamp(
                        aiControls.sensitivity +
                        SENS.step,
                        SENS.min,
                        SENS.max
                    )
                );

            return;
        }

        if (
            id ===
            "aiControlsReset"
        ) {
            resetAIControls();

            return;
        }
    }


    // FÍSICAS

    if (
        id ===
        "progressive"
    ) {
        progressiveSpeed =
            !progressiveSpeed;

        return;
    }

    if (
        id ===
        "physicsReset"
    ) {
        resetPhysics();

        return;
    }


    // FINAL

    if (
        id ===
        "revenge"
    ) {
        resetMatch();

        return;
    }

    if (
        id ===
        "victoryMenu"
    ) {
        goToStartMenu();
    }
}


// ============================================================
// HOVER
// ============================================================

function updateHover(x, y) {
    hoveredButton = null;

    for (
        const item of
        interactiveItems()
    ) {
        if (
            !item.disabled &&
            inside(
                x,
                y,
                item.hitRect ||
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
// RENDER BASE
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


// ============================================================
// MARCADOR
// ============================================================

function drawScore() {
    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        UI.score;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "bottom";

    const scoreY =
        TABLE.bottom -
        20;

    ctx.fillText(
        String(
            leftScore
        ).padStart(
            2,
            "0"
        ),

        W / 4,
        scoreY
    );

    ctx.fillText(
        String(
            rightScore
        ).padStart(
            2,
            "0"
        ),

        W * 3 / 4,
        scoreY
    );

    const matchPoint =
        matchPointSide();

    if (
        matchPoint &&
        !gameOver
    ) {
        const blink =
            0.25 +
            0.75 *
            (
                (
                    Math.sin(
                        performance.now() /
                        260
                    ) +
                    1
                ) /
                2
            );

        const matchY =
            TABLE.bottom -
            8;

        ctx.save();

        ctx.globalAlpha =
            blink;

        ctx.font =
            "bold 14px monospace";

        ctx.textBaseline =
            "bottom";

        ctx.fillText(
            "MATCH",

            matchPoint ===
            "left"

                ? W / 4
                : W * 3 / 4,

            matchY
        );

        ctx.restore();
    }
}


// ============================================================
// UI DRAW
// ============================================================

function overlay(
    alpha = 0.78
) {
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

function title(
    text,
    y = 90,
    font = UI.title
) {
    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        font;

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

    const rect =
        item.rect;

    ctx.fillStyle =
        item.disabled

            ? "rgba(255,255,255,.03)"

            : hover
                ? "rgba(255,255,255,.13)"
                : "rgba(0,0,0,.1)";

    ctx.fillRect(
        rect.x,
        rect.y,
        rect.w,
        rect.h
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
        rect.x,
        rect.y,
        rect.w,
        rect.h
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

        rect.x +
        rect.w / 2,

        rect.y +
        rect.h / 2
    );
}

function drawSlider(item) {
    const hover =
        hoveredButton ===
            item.id ||
        activeSlider ===
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

    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        "bold 20px monospace";

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        item.label,
        x,
        y - 25
    );

    ctx.textAlign =
        "right";

    ctx.fillText(
        String(
            item.value
        ),
        x + w,
        y - 25
    );

    ctx.strokeStyle =
        "#FFFFFF";

    ctx.lineWidth =
        hover
            ? 4
            : 2;

    ctx.strokeRect(
        x,
        y,
        w,
        h
    );

    ctx.fillStyle =
        "#FFFFFF";

    ctx.fillRect(
        x,
        y,
        ratio * w,
        h
    );

    ctx.beginPath();

    ctx.arc(
        knobX,
        y + h / 2,
        hover ? 10 : 8,
        0,
        Math.PI * 2
    );

    ctx.fill();
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

    if (!aiMenuOpen) {
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

    } else {
        title(
            "ELEGÍ TU LADO",
            125,
            "bold 42px monospace"
        );

        ctx.font =
            "18px monospace";

        ctx.fillStyle =
            "#FFFFFF";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "Después seleccioná la dificultad",
            W / 2,
            180
        );
    }

    const items =
        interactiveItems();

    items.forEach(
        drawButton
    );

    if (!aiMenuOpen) {
        const online =
            items.find(
                item =>
                    item.id ===
                    "online"
            );

        if (online) {
            ctx.fillStyle =
                "rgba(255,255,255,.65)";

            ctx.font =
                "bold 14px monospace";

            ctx.textAlign =
                "center";

            ctx.fillText(
                "PRÓXIMAMENTE",
                W / 2,
                online.rect.y +
                online.rect.h +
                22
            );
        }
    }
}


// ============================================================
// MENÚS
// ============================================================

function drawPause() {
    overlay(0.72);

    title(
        "PAUSA",
        110
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}

function drawConfirm() {
    overlay(0.84);

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

function drawSettings() {
    overlay(0.8);

    title(
        "AJUSTES",
        75
    );

    interactiveItems()
        .forEach(
            drawButton
        );
}

function drawBackground() {
    overlay(0.82);

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
    overlay(0.84);

    title(
        "FÍSICAS",
        65
    );

    const items =
        interactiveItems();

    items
        .filter(
            item =>
                item.type ===
                "slider"
        )
        .forEach(
            drawSlider
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
}


// ============================================================
// CONTROLES
// ============================================================

function drawControls() {
    overlay(0.84);

    if (
        gameMode ===
        "local"
    ) {
        drawLocalControls();
    } else {
        drawAIControls();
    }
}

function drawLocalControls() {
    title(
        "CONTROLES",
        65
    );

    const columns = {
        left: 140,
        right: 720
    };

    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        "bold 30px monospace";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "IZQUIERDA",
        360,
        125
    );

    ctx.fillText(
        "DERECHA",
        940,
        125
    );

    for (
        const side of
        [
            "left",
            "right"
        ]
    ) {
        const x =
            columns[side];

        const controls =
            localControls[side];

        ctx.font =
            "bold 20px monospace";

        ctx.textAlign =
            "left";

        ctx.fillText(
            "ARRIBA",
            x,
            202
        );

        ctx.fillText(
            "ABAJO",
            x,
            262
        );

        ctx.fillText(
            "MOUSE",
            x,
            322
        );

        ctx.fillText(
            "SENS.",
            x,
            392
        );

        ctx.textAlign =
            "center";

        ctx.font =
            "bold 18px monospace";

        ctx.fillText(
            controls.sensitivity
                .toFixed(1),

            x + 215,
            392
        );
    }

    interactiveItems()
        .forEach(
            drawButton
        );
}

function drawAIControls() {
    title(
        "CONTROLES",
        65
    );

    const labelX =
        390;

    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        "bold 30px monospace";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "JUGADOR",
        W / 2,
        125
    );

    ctx.font =
        "bold 20px monospace";

    ctx.textAlign =
        "left";

    ctx.fillText(
        "ARRIBA",
        labelX,
        202
    );

    ctx.fillText(
        "ABAJO",
        labelX,
        262
    );

    ctx.fillText(
        "MOUSE",
        labelX,
        322
    );

    ctx.fillText(
        "SENS.",
        labelX,
        392
    );

    ctx.textAlign =
        "center";

    ctx.font =
        "bold 18px monospace";

    ctx.fillText(
        aiControls.sensitivity
            .toFixed(1),

        670,
        392
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
    overlay(0.68);

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

resetBall();
loop();
