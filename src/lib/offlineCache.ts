const CACHE_NAME = "arkynos-library-files";
const META_KEY = "arkynos-library-meta";

export interface CachedResourceMeta {
  id: string;
  title: string;
  resource_type: string;
  file_path: string;
  file_url: string;
  downloads: number;
  is_preferred: boolean;
  course_code?: string;
  course_name?: string;
  uploader_name?: string;
  cached_at: string;
}

function getMetaStore(): Record<string, CachedResourceMeta> {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || "{}");
  } catch {
    return {};
  }
}

function setMetaStore(store: Record<string, CachedResourceMeta>) {
  localStorage.setItem(META_KEY, JSON.stringify(store));
}

export async function cacheResourceFile(
  fileUrl: string,
  meta: CachedResourceMeta
): Promise<boolean> {
  try {
    const cache = await caches.open(CACHE_NAME);
    // Fetch the file and store it
    const response = await fetch(fileUrl, { mode: "cors" });
    if (!response.ok) return false;
    await cache.put(fileUrl, response);
    // Store metadata in localStorage
    const store = getMetaStore();
    store[meta.id] = { ...meta, cached_at: new Date().toISOString() };
    setMetaStore(store);
    return true;
  } catch (e) {
    console.error("Failed to cache resource file:", e);
    return false;
  }
}

export async function removeCachedFile(resourceId: string): Promise<void> {
  try {
    const store = getMetaStore();
    const meta = store[resourceId];
    if (meta) {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(meta.file_url);
      delete store[resourceId];
      setMetaStore(store);
    }
  } catch (e) {
    console.error("Failed to remove cached file:", e);
  }
}

export function getCachedMeta(): Record<string, CachedResourceMeta> {
  return getMetaStore();
}

export async function getCachedFileUrl(resourceId: string): Promise<string | null> {
  try {
    const store = getMetaStore();
    const meta = store[resourceId];
    if (!meta) return null;
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(meta.file_url);
    if (!response) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export function isResourceCached(resourceId: string): boolean {
  const store = getMetaStore();
  return !!store[resourceId];
}
