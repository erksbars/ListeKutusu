import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createConnection } from "node:net";
import { once } from "node:events";
import { trackRehearsalConnections, closeRehearsalHttpServer } from "../scripts/lib/rehearsal-http-close.mjs";

test("isolated HTTP shutdown closes upgraded sockets as well as the listener", async () => {
  const server = createServer(), sockets = trackRehearsalConnections(server);
  server.on("upgrade", (_request, socket) => socket.write("HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: fixture\r\n\r\n"));
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const client = createConnection({ host: "127.0.0.1", port: server.address().port });
  try {
    await once(client, "connect");
    client.write("GET / HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: Upgrade\r\nUpgrade: fixture\r\n\r\n");
    await once(client, "data");
    assert.equal(sockets.size, 1);
    const disconnected = once(client, "close");
    await closeRehearsalHttpServer(server, sockets); await disconnected;
    assert.equal(server.listening, false);
  } finally { client.destroy(); if (server.listening) await closeRehearsalHttpServer(server, sockets); }
});
