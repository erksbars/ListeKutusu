export function getNextAvailableSeat(usedSeats: number[], maxPlayers: number) {
  const occupied = new Set(usedSeats);
  return Array.from({ length: maxPlayers }, (_, index) => index + 1)
    .find((seat) => !occupied.has(seat)) ?? null;
}

export function isRoomReady(playerCount: number, maxPlayers: number) {
  return maxPlayers >= 2 && playerCount === maxPlayers;
}

export const WAITING_ROOM_LIFETIME_MS = 15 * 60 * 1_000;
export const ACTIVE_ROOM_LIFETIME_MS = 30 * 60 * 1_000;

export function getRoomStaleBefore(status: "waiting" | "active", now = new Date()) {
  const lifetime = status === "waiting" ? WAITING_ROOM_LIFETIME_MS : ACTIVE_ROOM_LIFETIME_MS;
  return new Date(now.getTime() - lifetime);
}

export function isRoomStale(status: "waiting" | "active", updatedAt: Date, now = new Date()) {
  return updatedAt <= getRoomStaleBefore(status, now);
}
