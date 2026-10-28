// HTTP closeAllConnections does not cover upgraded development sockets.
export function trackRehearsalConnections(server) {
  const sockets = new Set();
  server.on("connection", socket => { sockets.add(socket); socket.once("close", () => sockets.delete(socket)); });
  return sockets;
}

export async function closeRehearsalHttpServer(server, sockets) {
  const closed = new Promise(resolve => server.close(resolve));
  server.closeAllConnections();
  for (const socket of sockets) socket.destroy();
  await closed;
}
