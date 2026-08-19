(function () {
    "use strict";

    const ICE_SERVERS = [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ];

    const LATENCY_PROBE_INTERVAL_MS =
        1000;
    const LATENCY_PROBE_TIMEOUT_MS =
        4000;

    let handlers = {};
    let socket = null;
    let peer = null;
    let channel = null;
    let role = null;
    let localSide = null;
    let pendingCandidates = [];
    let manualClose = false;
    let latencyTimer = null;
    let latencySequence = 0;
    let latencyPingId = null;
    let latencyPingStartedAt = 0;
    let latencyMs = null;
    const incomingChunks =
        new Map();

    const serverUrl = () =>
        String(
            window.ARGENPONG_ONLINE_URL ||
            ""
        ).trim();

    const emit = (
        name,
        payload = {}
    ) => {
        const handler =
            handlers[name];

        if (
            typeof handler ===
            "function"
        ) {
            handler(payload);
        }
    };

    const sendSocket = payload => {
        if (
            !socket ||
            socket.readyState !==
                WebSocket.OPEN
        ) {
            return false;
        }

        socket.send(
            JSON.stringify(payload)
        );

        return true;
    };

    const sendData = payload => {
        if (
            !channel ||
            channel.readyState !==
                "open"
        ) {
            return false;
        }

        const serialized =
            JSON.stringify(payload);

        if (
            serialized.length <=
            12000
        ) {
            channel.send(serialized);
            return true;
        }

        const id =
            typeof crypto.randomUUID ===
            "function"

                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`;

        const total =
            Math.ceil(
                serialized.length /
                12000
            );

        for (
            let index = 0;
            index < total;
            index++
        ) {
            channel.send(
                JSON.stringify({
                    __chunk: id,
                    index,
                    total,
                    data:
                        serialized.slice(
                            index * 12000,
                            (index + 1) *
                            12000
                        )
                })
            );
        }

        return true;
    };

    const stopLatencyProbe = () => {
        if (latencyTimer !== null) {
            clearInterval(
                latencyTimer
            );
            latencyTimer = null;
        }

        latencyPingId = null;
        latencyPingStartedAt = 0;
        latencyMs = null;

        emit("latency", {
            ms: null
        });
    };

    const sendLatencyProbe = () => {
        if (
            !channel ||
            channel.readyState !==
                "open"
        ) {
            return;
        }

        const now =
            performance.now();

        if (
            latencyPingId !== null
        ) {
            if (
                now -
                    latencyPingStartedAt <
                LATENCY_PROBE_TIMEOUT_MS
            ) {
                return;
            }

            latencyPingId = null;
            latencyPingStartedAt = 0;
            latencyMs = null;

            emit("latency", {
                ms: null
            });
        }

        latencySequence++;
        latencyPingId =
            latencySequence;
        latencyPingStartedAt = now;

        try {
            channel.send(
                JSON.stringify({
                    __argenPongLatency:
                        "ping",
                    id: latencyPingId
                })
            );
        } catch {}
    };

    const startLatencyProbe = () => {
        stopLatencyProbe();
        sendLatencyProbe();

        latencyTimer =
            setInterval(
                sendLatencyProbe,
                LATENCY_PROBE_INTERVAL_MS
            );
    };

    const handleLatencyMessage =
        message => {
            if (
                !message ||
                !message.__argenPongLatency
            ) {
                return false;
            }

            if (
                message.__argenPongLatency ===
                    "ping" &&
                Number.isInteger(
                    message.id
                )
            ) {
                if (
                    channel &&
                    channel.readyState ===
                        "open"
                ) {
                    try {
                        channel.send(
                            JSON.stringify({
                                __argenPongLatency:
                                    "pong",
                                id:
                                    message.id
                            })
                        );
                    } catch {}
                }

                return true;
            }

            if (
                message.__argenPongLatency ===
                    "pong"
            ) {
                if (
                    message.id ===
                        latencyPingId &&
                    latencyPingStartedAt > 0
                ) {
                    const sample =
                        performance.now() -
                        latencyPingStartedAt;

                    latencyMs =
                        latencyMs === null

                            ? sample
                            : latencyMs *
                                  0.7 +
                              sample *
                                  0.3;

                    latencyPingId = null;
                    latencyPingStartedAt = 0;

                    emit("latency", {
                        ms: Math.max(
                            0,
                            Math.round(
                                latencyMs
                            )
                        )
                    });
                }

                return true;
            }

            return true;
        };

    const emitDataMessage = message => {
        if (!message.__chunk) {
            emit("data", message);
            return;
        }

        if (
            !Number.isInteger(
                message.index
            ) ||
            !Number.isInteger(
                message.total
            ) ||
            message.total < 1 ||
            message.total > 64 ||
            message.index < 0 ||
            message.index >=
                message.total ||
            typeof message.data !==
                "string" ||
            message.data.length >
                12000
        ) {
            return;
        }

        const existing =
            incomingChunks.get(
                message.__chunk
            ) || {
                parts:
                    new Array(
                        message.total
                    ),
                received: 0
            };

        if (
            !existing.parts[
                message.index
            ]
        ) {
            existing.parts[
                message.index
            ] = message.data;
            existing.received++;
        }

        if (
            existing.received ===
            existing.parts.length
        ) {
            incomingChunks.delete(
                message.__chunk
            );

            try {
                emit(
                    "data",
                    JSON.parse(
                        existing.parts.join(
                            ""
                        )
                    )
                );
            } catch {}

            return;
        }

        incomingChunks.set(
            message.__chunk,
            existing
        );
    };

    const closePeer = () => {
        stopLatencyProbe();

        if (channel) {
            try {
                channel.close();
            } catch {}
        }

        if (peer) {
            try {
                peer.close();
            } catch {}
        }

        channel = null;
        peer = null;
        pendingCandidates = [];
        incomingChunks.clear();
    };

    const close = (
        notifyServer = true
    ) => {
        manualClose = true;

        if (notifyServer) {
            sendSocket({
                type: "cancel"
            });
        }

        closePeer();

        if (socket) {
            try {
                socket.close(
                    1000,
                    "client-cancel"
                );
            } catch {}
        }

        socket = null;
        role = null;
        localSide = null;
    };

    const wireChannel = nextChannel => {
        channel = nextChannel;

        const wiredChannel =
            nextChannel;

        wiredChannel.binaryType =
            "arraybuffer";

        wiredChannel.addEventListener(
            "open",
            () => {
                if (
                    channel !==
                    wiredChannel
                ) {
                    return;
                }

                emit("ready", {
                    role,
                    side: localSide
                });

                startLatencyProbe();
            }
        );

        wiredChannel.addEventListener(
            "message",
            event => {
                if (
                    channel !==
                        wiredChannel ||
                    typeof event.data !==
                        "string"
                ) {
                    return;
                }

                try {
                    const message =
                        JSON.parse(
                            event.data
                        );

                    if (
                        handleLatencyMessage(
                            message
                        )
                    ) {
                        return;
                    }

                    emitDataMessage(
                        message
                    );
                } catch {}
            }
        );

        wiredChannel.addEventListener(
            "close",
            () => {
                if (
                    channel !==
                    wiredChannel
                ) {
                    return;
                }

                channel = null;
                stopLatencyProbe();

                if (!manualClose) {
                    emit(
                        "opponentLeft"
                    );
                }
            }
        );
    };

    const createPeer = () => {
        closePeer();

        peer =
            new RTCPeerConnection({
                iceServers:
                    ICE_SERVERS
            });

        peer.addEventListener(
            "icecandidate",
            event => {
                if (event.candidate) {
                    sendSocket({
                        type: "signal",
                        candidate:
                            event.candidate
                    });
                }
            }
        );

        peer.addEventListener(
            "connectionstatechange",
            () => {
                if (
                    peer.connectionState ===
                        "failed" &&
                    !manualClose
                ) {
                    emit(
                        "connectionLost"
                    );
                }
            }
        );

        if (role === "host") {
            wireChannel(
                peer.createDataChannel(
                    "argenpong",
                    {
                        ordered: true
                    }
                )
            );
        } else {
            peer.addEventListener(
                "datachannel",
                event => {
                    wireChannel(
                        event.channel
                    );
                }
            );
        }
    };

    const flushCandidates =
        async () => {
            if (
                !peer ||
                !peer.remoteDescription
            ) {
                return;
            }

            const candidates =
                pendingCandidates;

            pendingCandidates = [];

            for (
                const candidate of
                candidates
            ) {
                try {
                    await peer.addIceCandidate(
                        candidate
                    );
                } catch {}
            }
        };

    const handleSignal =
        async message => {
            if (!peer) {
                createPeer();
            }

            if (message.description) {
                try {
                    await peer.setRemoteDescription(
                        message.description
                    );

                    await flushCandidates();

                    if (
                        message.description.type ===
                        "offer"
                    ) {
                        const answer =
                            await peer.createAnswer();

                        await peer.setLocalDescription(
                            answer
                        );

                        sendSocket({
                            type: "signal",
                            description:
                                peer.localDescription
                        });
                    }
                } catch {
                    emit("error", {
                        code: "negotiation"
                    });
                }

                return;
            }

            if (message.candidate) {
                if (
                    peer.remoteDescription
                ) {
                    try {
                        await peer.addIceCandidate(
                            message.candidate
                        );
                    } catch {}
                } else {
                    pendingCandidates.push(
                        message.candidate
                    );
                }
            }
        };

    const beginOffer = async () => {
        try {
            const offer =
                await peer.createOffer();

            await peer.setLocalDescription(
                offer
            );

            sendSocket({
                type: "signal",
                description:
                    peer.localDescription
            });
        } catch {
            emit("error", {
                code: "negotiation"
            });
        }
    };

    const handleSocketMessage =
        event => {
            let message;

            try {
                message = JSON.parse(
                    event.data
                );
            } catch {
                return;
            }

            if (message.type === "queued") {
                emit("queued", message);
                return;
            }

            if (message.type === "matched") {
                role = message.role;
                localSide = message.side;
                manualClose = false;

                emit("matched", {
                    role,
                    side: localSide
                });

                createPeer();

                if (role === "host") {
                    beginOffer();
                }

                return;
            }

            if (message.type === "signal") {
                handleSignal(message);
                return;
            }

            if (
                message.type ===
                "opponent_left"
            ) {
                emit("opponentLeft");
                return;
            }

            if (message.type === "error") {
                emit("error", {
                    code:
                        message.code ||
                        "server"
                });
            }
        };

    const connect = queueMessage => {
        const url = serverUrl();

        if (!url) {
            emit("error", {
                code: "not_configured"
            });
            return false;
        }

        if (
            !/^wss?:\/\//i.test(url)
        ) {
            emit("error", {
                code: "invalid_url"
            });
            return false;
        }

        close(false);
        manualClose = false;

        let nextSocket;

        try {
            nextSocket =
                new WebSocket(url);
            socket = nextSocket;
        } catch {
            emit("error", {
                code: "connection"
            });
            return false;
        }

        nextSocket.addEventListener(
            "open",
            () => {
                if (
                    socket !==
                    nextSocket
                ) {
                    return;
                }

                sendSocket(
                    queueMessage
                );
            }
        );

        nextSocket.addEventListener(
            "message",
            event => {
                if (
                    socket ===
                    nextSocket
                ) {
                    handleSocketMessage(
                        event
                    );
                }
            }
        );

        nextSocket.addEventListener(
            "error",
            () => {
                if (
                    socket !==
                    nextSocket
                ) {
                    return;
                }

                emit("error", {
                    code: "connection"
                });
            }
        );

        nextSocket.addEventListener(
            "close",
            event => {
                if (
                    socket !==
                    nextSocket
                ) {
                    return;
                }

                socket = null;

                if (
                    !manualClose &&
                    event.code !== 1000
                ) {
                    emit("error", {
                        code: "connection"
                    });
                }
            }
        );

        return true;
    };

    window.ArgenPongOnline = {
        configured: () =>
            Boolean(serverUrl()),

        serverUrl,

        setHandlers(nextHandlers) {
            handlers =
                nextHandlers || {};
        },

        join() {
            return connect({
                type: "join"
            });
        },

        host(side = "left") {
            return connect({
                type: "host",
                side
            });
        },

        updateSide(side) {
            return sendSocket({
                type: "side",
                side
            });
        },

        sendInput(input) {
            return sendData({
                type: "input",
                input
            });
        },

        sendSnapshot(snapshot) {
            if (
                channel &&
                channel.bufferedAmount >
                    65536
            ) {
                return false;
            }

            return sendData({
                type: "snapshot",
                snapshot
            });
        },

        sendEvent(event) {
            return sendData({
                type: "event",
                event
            });
        },

        close
    };
})();
