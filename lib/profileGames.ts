/** Includes legacy owner-only rooms without double-counting seated owners. */
export function completedProfileGames(userId: string, publicOnly = false) {
  return {
    status: "completed",
    OR: [{ ownerId: userId }, { players: { some: { userId } } }],
    ...(publicOnly ? { visibility: "public" } : {}),
  };
}

export function profileGamePresentation(gameCode: string, id: string) {
  if (gameCode === "backgammon") return { title: "Tavla", href: `/games/backgammon/${encodeURIComponent(id)}` };
  if (gameCode === "song-elimination") return { title: "Şarkı Düellosu", href: `/games/elimination/${encodeURIComponent(id)}` };
  return { title: "Topluluk oyunu", href: "/games" };
}
