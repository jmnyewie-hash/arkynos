import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import CourseSearchBar from "@/components/CourseSearchBar";
import ResourceCard from "@/components/ResourceCard";
import { BookOpen } from "lucide-react";

type ResourceWithRelations = Tables<"resources"> & {
  courses: Tables<"courses"> | null;
  profiles: Tables<"profiles"> | null;
};

export default function Index() {
  const [recentResources, setRecentResources] = useState<ResourceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("resources")
      .select("*, courses(*), profiles!resources_uploaded_by_fkey(*)")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setRecentResources((data as ResourceWithRelations[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container max-w-2xl py-16">
      <div className="text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Course Resource Hub
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
