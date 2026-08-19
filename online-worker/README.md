# Coordinador público de ArgenPong

Este Worker sólo mantiene la cola pública y retransmite la negociación WebRTC. La física, los controles y los snapshots de la partida viajan directamente entre los navegadores; el Worker no ejecuta el juego.

## Despliegue gratuito

El proyecto conectado mediante Workers Builds debe llamarse `argenpong`, usar la rama `agent/pvp-online-p2p` y establecer `/online-worker` como directorio raíz.

1. Creá una cuenta gratuita en Cloudflare.
2. Desde esta carpeta ejecutá `npm install`.
3. Ejecutá `npx wrangler login` y autorizá Cloudflare en el navegador.
4. Ejecutá `npm run deploy`.
5. Copiá la URL publicada, cambiale `https://` por `wss://` y pegala en `online-config.js`.
6. Publicá `online-config.js`, `online.js`, `game.js` e `index.html` junto con el resto del juego.

El origen permitido por defecto es `https://cartoonmemwork-maker.github.io`, que incluye el sitio de GitHub Pages aunque el proyecto esté bajo `/ArgenPong/`. Para usar otro dominio, cambiá `ALLOWED_ORIGIN` en `wrangler.jsonc`.

## Límites conocidos del MVP

- La cola es pública, anónima y asigna el primer jugador disponible al anfitrión más antiguo.
- El anfitrión del navegador es la autoridad de la física.
- WebRTC usa STUN sin TURN. Algunas redes corporativas o NAT muy restrictivas pueden impedir la conexión P2P; agregar TURN quedaría fuera del objetivo de costo cero.
- El Worker valida origen, tamaño y frecuencia de mensajes de señalización. No recibe los snapshots de la partida.
