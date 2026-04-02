export interface CustomStoryPlaylist {
  id: string;
  name: string;
  courseShort: string;
  storyIds: number[];
  createdAt: number;
  updatedAt: number;
}

interface PlaylistStoreV1 {
  version: 1;
  playlists: CustomStoryPlaylist[];
}

const STORAGE_KEY = "duostories_custom_playlists_v1";

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function normalizePlaylist(input: unknown): CustomStoryPlaylist | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;
  if (
    typeof row.id !== "string" ||
    typeof row.name !== "string" ||
    typeof row.courseShort !== "string" ||
    !Array.isArray(row.storyIds) ||
    typeof row.createdAt !== "number" ||
    typeof row.updatedAt !== "number"
  ) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    courseShort: row.courseShort,
    storyIds: row.storyIds.filter(
      (item): item is number => typeof item === "number",
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function loadStore(): PlaylistStoreV1 {
  if (!canUseStorage()) return { version: 1, playlists: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, playlists: [] };
    const parsed = JSON.parse(raw) as Partial<PlaylistStoreV1>;
    if (parsed.version !== 1 || !Array.isArray(parsed.playlists)) {
      return { version: 1, playlists: [] };
    }
    return {
      version: 1,
      playlists: parsed.playlists
        .map(normalizePlaylist)
        .filter(
          (playlist): playlist is CustomStoryPlaylist => playlist !== null,
        ),
    };
  } catch {
    return { version: 1, playlists: [] };
  }
}

function saveStore(store: PlaylistStoreV1) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function listCustomStoryPlaylists(courseShort: string) {
  return loadStore()
    .playlists.filter((playlist) => playlist.courseShort === courseShort)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function createCustomStoryPlaylist(courseShort: string, name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) return null;
  const store = loadStore();
  const now = Date.now();
  const playlist: CustomStoryPlaylist = {
    id: `${now}-${Math.round(Math.random() * 1_000_000)}`,
    name: trimmedName,
    courseShort,
    storyIds: [],
    createdAt: now,
    updatedAt: now,
  };
  store.playlists.push(playlist);
  saveStore(store);
  return playlist;
}

export function deleteCustomStoryPlaylist(playlistId: string) {
  const store = loadStore();
  const filtered = store.playlists.filter(
    (playlist) => playlist.id !== playlistId,
  );
  if (filtered.length === store.playlists.length) return;
  saveStore({ version: 1, playlists: filtered });
}

export function renameCustomStoryPlaylist(playlistId: string, name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) return;
  const store = loadStore();
  const next = store.playlists.map((playlist) =>
    playlist.id === playlistId
      ? { ...playlist, name: trimmedName, updatedAt: Date.now() }
      : playlist,
  );
  saveStore({ version: 1, playlists: next });
}

export function toggleStoryInCustomPlaylist(
  playlistId: string,
  storyId: number,
) {
  const store = loadStore();
  const now = Date.now();
  const next = store.playlists.map((playlist) => {
    if (playlist.id !== playlistId) return playlist;
    const alreadyIncluded = playlist.storyIds.includes(storyId);
    return {
      ...playlist,
      storyIds: alreadyIncluded
        ? playlist.storyIds.filter((id) => id !== storyId)
        : [...playlist.storyIds, storyId],
      updatedAt: now,
    };
  });
  saveStore({ version: 1, playlists: next });
}

export function getCustomStoryPlaylist(playlistId: string) {
  return (
    loadStore().playlists.find((playlist) => playlist.id === playlistId) ?? null
  );
}
