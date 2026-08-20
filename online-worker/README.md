# Coordinador público de P2Pon

Este Worker mantiene la cola pública y retransmite la negociación WebRTC. La física, los controles y los snapshots de la partida viajan directamente entre los navegadores; el Worker no ejecuta el juego.

Antes de entrar en la cola, cada cliente toma tres muestras rápidas contra el coordinador. La cola prioriza menor latencia, luego menor variación entre muestras y usa el orden de llegada sólo para desempatar.

## Despliegue gratuito

El proyecto conectado mediante Workers Builds debe llamarse `p2pon`, usar la rama `agent/pvp-online-p2p` y establecer `/online-worker` como directorio raíz.

1. Creá una cuenta gratuita en Cloudflare.
2. Desde esta carpeta ejecutá `npm install`.
3. Ejecutá `npx wrangler login` y autorizá Cloudflare en el navegador.
4. Ejecutá `npm run deploy`.
5. Copiá la URL publicada, cambiale `https://` por `wss://` y pegala en `online-config.js`.
6. Publicá `online-config.js`, `online.js`, `game.js`, `index.html` y la carpeta `assets` junto con el resto del juego.

El origen permitido por defecto acepta GitHub Pages y previews HTTPS bajo `pages.dev`. Para restringirlo a un dominio definitivo, cambiá `ALLOWED_ORIGIN` en `wrangler.jsonc`.

## Límites conocidos del MVP

- La cola es pública y anónima; prioriza jugadores con menor latencia medida contra el coordinador.
- El anfitrión del navegador es la autoridad de la física.
- WebRTC usa STUN sin TURN. Algunas redes corporativas o NAT muy restrictivas pueden impedir la conexión P2P; agregar TURN quedaría fuera del objetivo de costo cero.
- El Worker valida origen, tamaño y frecuencia de mensajes de señalización. No recibe los snapshots de la partida.
