import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import CourseSearchBar from "@/components/CourseSearchBar";
import ResourceCard from "@/components/ResourceCard";
import { useRealtimeResources } from "@/hooks/useRealtimeResources";
import { useLibrary } from "@/hooks/useLibrary";

type ResourceWithRelations = Tables<"resources"> & {
  courses: Tables<"courses"> | null;
  profiles: Tables<"profiles"> | null;
};

export default function RecentResourcesPage() {
  const [resources, setResources] = useState<ResourceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSaved, toggleSave } = useLibrary();

  const fetchRecentResources = useCallback(async () => {
    const { data: resourcesData } = await supabase
      .from("resources")
      .select("*, courses(*)")
      .eq("is_hidden", false)
      .or("is_mad_math.eq.false,show_in_general.eq.true")
      .order("created_at", { ascending: false })
      .limit(20);

    if (resourcesData) {
      const userIds = [...new Set(resourcesData.map((r) => r.uploaded_by))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      const profilesMap = new Map((profilesData ?? []).map((p) => [p.user_id, p]));
      const merged = resourcesData.map((r) => ({
        ...r,
        profiles: profilesMap.get(r.uploaded_by) ?? null,
      }));
      setResources(merged as ResourceWithRelations[]);
    } else {
      setResources([]);
    }

    setLoading(false);
  }, []);

  useRealtimeResources(fetchRecentResources);

  useEffect(() => {
    fetchRecentResources();
  }, [fetchRecentResources]);

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-6">
        <CourseSearchBar />
      </div>

      <section>
        <h1 className="text-2xl font-semibold text-foreground">Recent Uploads</h1>
        <p className="mt-1 text-sm text-muted-foreground">Showing up to 20 latest uploads.</p>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No recent uploads yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isSaved={isSaved(resource.id)}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
