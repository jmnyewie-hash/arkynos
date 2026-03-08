import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
        await supabase
          .from("user_library")
          .delete()
          .eq("user_id", user.id)
          .eq("resource_id", resourceId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(resourceId);
          return next;
        });
        return false;
      } else {
        await supabase
          .from("user_library")
          .insert({ user_id: user.id, resource_id: resourceId });
        setSavedIds((prev) => new Set(prev).add(resourceId));
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
