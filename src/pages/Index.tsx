import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import CourseSearchBar from "@/components/CourseSearchBar";
import ResourceCard from "@/components/ResourceCard";
import arkynosLogo from "@/assets/arkynos-logo.png";

type ResourceWithRelations = Tables<"resources"> & {
  courses: Tables<"courses"> | null;
  profiles: Tables<"profiles"> | null;
};

export default function Index() {
  const [recentResources, setRecentResources] = useState<ResourceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      const { data: resourcesData } = await supabase
        .from("resources")
        .select("*, courses(*)")
        .order("created_at", { ascending: false })
        .limit(10);

      if (resourcesData) {
        const userIds = [...new Set(resourcesData.map(r => r.uploaded_by))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);

        const profilesMap = new Map((profilesData ?? []).map(p => [p.user_id, p]));
        const merged = resourcesData.map(r => ({
          ...r,
          profiles: profilesMap.get(r.uploaded_by) ?? null,
        }));
        setRecentResources(merged as ResourceWithRelations[]);
      }
      setLoading(false);
    };
    fetchResources();
  }, []);

  return (
    <div className="container max-w-2xl py-16">
      <div className="text-center animate-fade-in">
        <img src={arkynosLogo} alt="Arkynos logo" className="mx-auto mb-6 h-20 w-20" />
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Arkynos
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Find and share study resources for your courses
        </p>
      </div>

      <div className="mt-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <CourseSearchBar />
      </div>

      <section className="mt-14 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <h2 className="font-heading text-lg font-semibold text-foreground">Recent Resources</h2>
        {loading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : recentResources.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No resources yet. Be the first to upload!</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentResources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
