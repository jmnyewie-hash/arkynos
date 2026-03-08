import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cacheResourceFile, removeCachedFile, type CachedResourceMeta } from "@/lib/offlineCache";
import { toast } from "sonner";

export function useLibrary() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchLibrary = useCallback(async () => {
    if (!user) {
      setSavedIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_library")
      .select("resource_id")
      .eq("user_id", user.id);
    setSavedIds(new Set((data ?? []).map((r: any) => r.resource_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const toggleSave = useCallback(
    async (resourceId: string) => {
      if (!user) return false;
      const isSaved = savedIds.has(resourceId);
      if (isSaved) {
        // Remove from DB and cache
        await supabase
          .from("user_library")
          .delete()
          .eq("user_id", user.id)
          .eq("resource_id", resourceId);
        await removeCachedFile(resourceId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(resourceId);
          return next;
        });
        toast.success("Removed from library");
        return false;
      } else {
        // Add to DB
        await supabase
          .from("user_library")
          .insert({ user_id: user.id, resource_id: resourceId });
        setSavedIds((prev) => new Set(prev).add(resourceId));

        // Fetch resource details and cache the file
        const { data: resource } = await supabase
          .from("resources")
          .select("*, courses(course_code, course_name)")
          .eq("id", resourceId)
          .single();

        if (resource) {
          const { data: urlData } = supabase.storage
            .from("resources")
            .getPublicUrl(resource.file_path);

          const meta: CachedResourceMeta = {
            id: resource.id,
            title: resource.title,
            resource_type: resource.resource_type,
            file_path: resource.file_path,
            file_url: urlData.publicUrl,
            downloads: resource.downloads,
            is_preferred: resource.is_preferred,
            course_code: (resource as any).courses?.course_code,
            course_name: (resource as any).courses?.course_name,
          };

          toast.loading("Downloading for offline use...", { id: "cache-" + resourceId });
          const ok = await cacheResourceFile(urlData.publicUrl, meta);
          if (ok) {
            toast.success("Saved to library for offline use", { id: "cache-" + resourceId });
          } else {
            toast.error("Saved to library, but couldn't cache file for offline", { id: "cache-" + resourceId });
          }
        } else {
          toast.success("Saved to library");
        }
        return true;
      }
    },
    [user, savedIds]
  );

  const isSaved = useCallback(
    (resourceId: string) => savedIds.has(resourceId),
    [savedIds]
  );

  return { savedIds, isSaved, toggleSave, loading, refetch: fetchLibrary };
}
