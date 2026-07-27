import crypto from "crypto";
import { prisma } from "./db";
import {
  addTrackToPlaylist,
  clearPlaylistItems,
  createOwnerPlaylist,
  isTrackInPlaylist,
  replacePlaylistTracks,
  updateOwnerPlaylistDetails,
} from "./spotify";

const DEFAULT_MANAGED_PLAYLIST_LIMIT = 10_000;

function getManagedPlaylistLimit() {
  const raw = Number(process.env.MANAGED_PLAYLIST_LIMIT);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return DEFAULT_MANAGED_PLAYLIST_LIMIT;
}

function createSlug(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "liste"}-${suffix}`;
}

export function createCode(prefix: string) {
  return `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function playlistNameFor(list: { ownerName: string; playlistName?: string | null }) {
  return list.playlistName?.trim() || `${list.ownerName} - Öneri Listesi`;
}

export function playlistDescriptionFor(ownerName: string) {
  return `${ownerName} için oluşturulan onaylı şarkı listesi. Kopyalamak isteyen Spotify veya transfer servisleriyle kendi hesabına alabilir.`;
}

export async function createUserList(
  ownerName: string,
  playlistName?: string,
  account?: { email: string; passwordHash: string }
) {
  const cleanName = ownerName.trim().slice(0, 80);
  const cleanPlaylistName = playlistName?.trim().slice(0, 100) || cleanName;
  if (!cleanName) throw new Error("Liste sahibi adı gerekli.");

  return prisma.userList.create({
    data: {
      ownerName: cleanName,
      playlistName: cleanPlaylistName,
      email: account?.email,
      passwordHash: account?.passwordHash,
      slug: createSlug(cleanName),
      submitCode: createCode("EKLE"),
    },
  });
}

export async function getUserList(listId: string) {
  return prisma.userList.findUnique({
    where: { id: listId },
    include: {
      suggestions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}

export async function ensureSpotifyPlaylistForList(listId: string) {
  const list = await prisma.userList.findUnique({ where: { id: listId } });
  if (!list) throw new Error("Liste bulunamadı.");

  if (list.spotifyPlaylistId) return list;

  const managedCount = await prisma.userList.count({
    where: { spotifyPlaylistId: { not: null } },
  });

  const limit = getManagedPlaylistLimit();
  const name = playlistNameFor(list);
  const description = playlistDescriptionFor(list.ownerName);

  if (managedCount >= limit) {
    const recyclableWhere = {
      id: { not: list.id },
      spotifyPlaylistId: { not: null },
    } as const;
    const recycled = await prisma.userList.findFirst({
      where: { ...recyclableWhere, status: "deleted" },
      orderBy: [{ lastExportedAt: "asc" }, { createdAt: "asc" }],
    });

    if (recycled?.spotifyPlaylistId) {
      await clearPlaylistItems(recycled.spotifyPlaylistId);
      await updateOwnerPlaylistDetails(recycled.spotifyPlaylistId, name, description);

      await prisma.userList.update({
        where: { id: recycled.id },
        data: {
          spotifyPlaylistId: null,
          spotifyExternalUrl: null,
          spotifySnapshotId: null,
          status: "recycled",
          recycledAt: new Date(),
        },
      });

      return prisma.userList.update({
        where: { id: list.id },
        data: {
          spotifyPlaylistId: recycled.spotifyPlaylistId,
          spotifyExternalUrl:
            recycled.spotifyExternalUrl ??
            `https://open.spotify.com/playlist/${recycled.spotifyPlaylistId}`,
          status: "active",
          lastExportedAt: new Date(),
        },
      });
    }

    throw new Error(
      "Yönetilen Spotify playlist kapasitesi dolu. Aktif kullanıcı listeleri korunuyor; yeni liste şu anda oluşturulamaz."
    );
  }

  const playlist = await createOwnerPlaylist(name);
  return prisma.userList.update({
    where: { id: list.id },
    data: {
      spotifyPlaylistId: playlist.id,
      spotifyExternalUrl:
        playlist.externalUrl ?? `https://open.spotify.com/playlist/${playlist.id}`,
      spotifySnapshotId: playlist.snapshotId ?? null,
      status: "active",
      lastExportedAt: new Date(),
    },
  });
}

export async function addSuggestionToSpotifyList(suggestionId: string) {
  const suggestion = await prisma.suggestion.findUnique({
    where: { id: suggestionId },
    include: { list: true },
  });
  if (!suggestion) throw new Error("Öneri bulunamadı.");
  if (!suggestion.listId) {
    await addTrackToPlaylist(suggestion.trackUri);
    return null;
  }

  const list = await ensureSpotifyPlaylistForList(suggestion.listId);
  if (!list.spotifyPlaylistId) throw new Error("Spotify listesi oluşturulamadı.");

  if (!(await isTrackInPlaylist(list.spotifyPlaylistId, suggestion.trackId))) {
    const snapshotId = await addTrackToPlaylist(
      suggestion.trackUri,
      list.spotifyPlaylistId
    );
    await prisma.userList.update({
      where: { id: list.id },
      data: {
        spotifySnapshotId: snapshotId ?? list.spotifySnapshotId,
        lastExportedAt: new Date(),
      },
    });
  }

  return list;
}

export async function exportApprovedListToSpotify(listId: string) {
  const list = await ensureSpotifyPlaylistForList(listId);
  if (!list.spotifyPlaylistId) throw new Error("Spotify listesi oluşturulamadı.");

  const approved = await prisma.suggestion.findMany({
    where: { listId, status: "approved" },
    orderBy: { decidedAt: "asc" },
    select: { trackUri: true },
  });

  const snapshotId =
    (await replacePlaylistTracks(
      list.spotifyPlaylistId,
      approved.map((item) => item.trackUri)
    )) ?? list.spotifySnapshotId;

  return prisma.userList.update({
    where: { id: list.id },
    data: { spotifySnapshotId: snapshotId, lastExportedAt: new Date() },
  });
}
