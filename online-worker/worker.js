const MAX_MESSAGE_BYTES = 32768;
const RATE_WINDOW_MS = 10000;
const RATE_LIMIT = 120;

function allowedOrigin(
    origin,
    configuredOrigin
) {
    if (!origin) {
        return false;
    }

    if (
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i
            .test(origin)
    ) {
        return true;
    }

    return String(
        configuredOrigin ||
        "https://cartoonmemwork-maker.github.io"
    )
        .split(",")
        .map(value => value.trim())
        .filter(Boolean)
        .includes(origin);
}

export default {
    async fetch(request, env) {
        if (
            request.headers.get("Upgrade") !==
            "websocket"
        ) {
            return new Response(
                "ArgenPong public matchmaker",
                {
                    status: 200,
                    headers: {
                        "content-type":
                            "text/plain; charset=utf-8"
                    }
                }
            );
        }

        if (
            !allowedOrigin(
                request.headers.get(
                    "Origin"
                ),
                env.ALLOWED_ORIGIN
            )
        ) {
            return new Response(
                "Origin not allowed",
                { status: 403 }
            );
        }

        const id =
            env.PUBLIC_QUEUE.idFromName(
                "global"
            );

        return env.PUBLIC_QUEUE
            .get(id)
            .fetch(request);
    }
};

export class PublicQueue {
    constructor(ctx) {
        this.ctx = ctx;
    }

    async fetch(request) {
        const pair =
            new WebSocketPair();

        const [client, server] =
            Object.values(pair);

        this.ctx.acceptWebSocket(
            server
        );

        server.serializeAttachment({
            state: "connected",
            queuedAt: 0,
            side: null,
            role: null,
            matchId: null,
            rateStart: Date.now(),
            rateCount: 0
        });

        return new Response(null, {
            status: 101,
            webSocket: client
        });
    }

    send(socket, payload) {
        try {
            socket.send(
                JSON.stringify(payload)
            );
        } catch {}
    }

    attachment(socket) {
        return (
            socket.deserializeAttachment() ||
            {}
        );
    }

    store(socket, attachment) {
        socket.serializeAttachment(
            attachment
        );
    }

    rateAllowed(
        socket,
        attachment
    ) {
        const now = Date.now();

        if (
            now -
                (attachment.rateStart || 0) >=
            RATE_WINDOW_MS
        ) {
            attachment.rateStart = now;
            attachment.rateCount = 0;
        }

        attachment.rateCount =
            (attachment.rateCount || 0) +
            1;

        this.store(
            socket,
            attachment
        );

        return (
            attachment.rateCount <=
            RATE_LIMIT
        );
    }

    pairAvailable() {
        while (true) {
            const waiting =
                this.ctx
                    .getWebSockets()
                    .map(socket => ({
                        socket,
                        data:
                            this.attachment(
                                socket
                            )
                    }));

            const hosts = waiting
                .filter(
                    item =>
                        item.data.state ===
                        "host"
                )
                .sort(
                    (a, b) =>
                        a.data.queuedAt -
                        b.data.queuedAt
                );

            const guests = waiting
                .filter(
                    item =>
                        item.data.state ===
                        "join"
                )
                .sort(
                    (a, b) =>
                        a.data.queuedAt -
                        b.data.queuedAt
                );

            if (
                !hosts.length ||
                !guests.length
            ) {
                return;
            }

            const host = hosts[0];
            const guest = guests[0];
            const matchId =
                crypto.randomUUID();
            const hostSide =
                host.data.side === "right"
                    ? "right"
                    : "left";
            const guestSide =
                hostSide === "left"
                    ? "right"
                    : "left";

            this.store(host.socket, {
                ...host.data,
                state: "matched",
                role: "host",
                side: hostSide,
                matchId
            });

            this.store(guest.socket, {
                ...guest.data,
                state: "matched",
                role: "guest",
                side: guestSide,
                matchId
            });

            this.send(host.socket, {
                type: "matched",
                role: "host",
                side: hostSide
            });

            this.send(guest.socket, {
                type: "matched",
                role: "guest",
                side: guestSide
            });
        }
    }

    relaySignal(
        socket,
        attachment,
        message
    ) {
        if (
            attachment.state !==
                "matched" ||
            !attachment.matchId
        ) {
            return;
        }

        const peer =
            this.ctx
                .getWebSockets()
                .find(candidate => {
                    if (candidate === socket) {
                        return false;
                    }

                    const data =
                        this.attachment(
                            candidate
                        );

                    return (
                        data.state ===
                            "matched" &&
                        data.matchId ===
                            attachment.matchId
                    );
                });

        if (!peer) {
            return;
        }

        this.send(peer, {
            type: "signal",
            description:
                message.description,
            candidate:
                message.candidate
        });
    }

    async webSocketMessage(
        socket,
        rawMessage
    ) {
        if (
            typeof rawMessage !==
                "string" ||
            rawMessage.length >
                MAX_MESSAGE_BYTES
        ) {
            socket.close(
                1009,
                "message-too-large"
            );
            return;
        }

        let message;

        try {
            message =
                JSON.parse(rawMessage);
        } catch {
            this.send(socket, {
                type: "error",
                code: "invalid-json"
            });
            return;
        }

        const attachment =
            this.attachment(socket);

        if (
            !this.rateAllowed(
                socket,
                attachment
            )
        ) {
            socket.close(
                1008,
                "rate-limit"
            );
            return;
        }

        if (message.type === "host") {
            const next = {
                ...attachment,
                state: "host",
                role: null,
                matchId: null,
                side:
                    message.side ===
                    "right"
                        ? "right"
                        : "left",
                queuedAt: Date.now()
            };

            this.store(socket, next);
            this.send(socket, {
                type: "queued",
                mode: "host"
            });
            this.pairAvailable();
            return;
        }

        if (message.type === "join") {
            const next = {
                ...attachment,
                state: "join",
                role: null,
                matchId: null,
                side: null,
                queuedAt: Date.now()
            };

            this.store(socket, next);
            this.send(socket, {
                type: "queued",
                mode: "join"
            });
            this.pairAvailable();
            return;
        }

        if (
            message.type === "side" &&
            attachment.state === "host"
        ) {
            attachment.side =
                message.side === "right"
                    ? "right"
                    : "left";
            this.store(
                socket,
                attachment
            );
            return;
        }

        if (message.type === "signal") {
            this.relaySignal(
                socket,
                attachment,
                message
            );
            return;
        }

        if (message.type === "cancel") {
            this.store(socket, {
                ...attachment,
                state: "cancelled",
                role: null,
                matchId: null
            });

            socket.close(
                1000,
                "cancelled"
            );
        }
    }

    notifyPeer(socket) {
        const attachment =
            this.attachment(socket);

        if (!attachment.matchId) {
            return;
        }

        for (
            const candidate of
            this.ctx.getWebSockets()
        ) {
            if (candidate === socket) {
                continue;
            }

            const data =
                this.attachment(
                    candidate
                );

            if (
                data.matchId ===
                attachment.matchId
            ) {
                this.send(candidate, {
                    type:
                        "opponent_left"
                });

                this.store(candidate, {
                    ...data,
                    state: "connected",
                    role: null,
                    matchId: null
                });
            }
        }
    }

    async webSocketClose(socket) {
        this.notifyPeer(socket);
    }

    async webSocketError(socket) {
        this.notifyPeer(socket);
    }
}
