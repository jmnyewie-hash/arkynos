import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import ResourceCard from "@/components/ResourceCard";
import { useRealtimeResources } from "@/hooks/useRealtimeResources";
import { useLibrary } from "@/hooks/useLibrary";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Brain, Upload, Eye, EyeOff, Globe, Lock } from "lucide-react";

type ResourceWithRelations = Tables<"resources"> & {
  courses: Tables<"courses"> | null;
  profiles: Tables<"profiles"> | null;
};

export default function MadAsMathPage() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isSaved, toggleSave } = useLibrary();
  const navigate = useNavigate();
  const [resources, setResources] = useState<ResourceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const fetchResources = useCallback(async () => {
    const query = supabase
      .from("resources")
      .select("*, courses(*)") as any;

    let filtered = query.eq("is_mad_math", true).order("created_at", { ascending: false });

    if (!isAdmin) {
      filtered = filtered.eq("is_hidden", false);
    }

    const { data: resourcesData } = await filtered;

    if (resourcesData && resourcesData.length > 0) {
      const userIds = [...new Set((resourcesData as any[]).map((r) => r.uploaded_by))] as string[];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      const profilesMap = new Map((profilesData ?? []).map((p) => [p.user_id, p]));
      const merged = (resourcesData as any[]).map((r) => ({
        ...r,
        profiles: profilesMap.get(r.uploaded_by) ?? null,
      }));
      setResources(merged as ResourceWithRelations[]);
    } else {
      setResources([]);
    }
    setLoading(false);
  }, [isAdmin]);

  useRealtimeResources(fetchResources);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleToggleVisibility = async (resourceId: string, currentHidden: boolean) => {
    const { error } = await supabase
      .from("resources")
      .update({ is_hidden: !currentHidden } as any)
      .eq("id", resourceId);
    if (error) {
      toast.error("Failed to update visibility");
    } else {
      toast.success(currentHidden ? "Now visible to everyone" : "Hidden from non-admins");
      fetchResources();
    }
  };

  const handleToggleGeneral = async (resourceId: string, currentShowInGeneral: boolean) => {
    const { error } = await supabase
      .from("resources")
      .update({ show_in_general: !currentShowInGeneral } as any)
      .eq("id", resourceId);
    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success(!currentShowInGeneral ? "Will appear in general feeds" : "Removed from general feeds");
      fetchResources();
    }
  };

  // Filter by subject
  const filteredResources = subjectFilter === "all"
    ? resources
    : resources.filter((r) => (r as any).mad_math_subject === subjectFilter);

  // Group by topic
  const grouped = filteredResources.reduce((acc, r) => {
    const topic = (r as any).mad_math_topic || "Uncategorized";
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(r);
    return acc;
  }, {} as Record<string, ResourceWithRelations[]>);

  const sortedTopics = Object.keys(grouped).sort();

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">Mad As Math</h1>
          <p className="text-sm text-muted-foreground">Admin-curated Q&As in Mathematics & Physics</p>
        </div>
      </div>

      {/* Welcome */}
      <div className="mt-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 p-5 sm:p-6">
        <p className="text-sm sm:text-base leading-relaxed text-foreground/90">
          Welcome to <span className="font-bold text-primary">Mad As Math</span> — a sophisticated space reserved for those with a genuine interest in the mathematical and physical disciplines. Here, the questions hit different. Expect a difficulty on par with some of the most challenging courses you've ever encountered — and sometimes, well beyond them.
        </p>
        <p className="mt-3 text-sm sm:text-base leading-relaxed text-foreground/90">
          If you're the kind who finds thrill in a problem that fights back, if you actually <span className="italic">want</span> to be humbled by an integral or a mechanics question that stares you down — then stick around. This is where the fun lives.
        </p>
        <p className="mt-3 text-xs text-muted-foreground italic">
          — The Mad As Math corner. Not for the faint of heart.
        </p>
      </div>

      {/* Admin upload button */}
      {isAdmin && (
        <Button size="sm" className="mt-5" onClick={() => navigate("/mad-as-math/upload")}>
          <Upload className="mr-1.5 h-4 w-4" /> Upload Q&A
        </Button>
      )}

      {/* Subject filter pills */}
      <div className="mt-6 flex items-center gap-2 flex-wrap">
        {["all", "maths", "physics"].map((s) => (
          <button
            key={s}
            onClick={() => setSubjectFilter(s)}
            className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              subjectFilter === s
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {s === "all" ? "All" : s === "maths" ? "Mathematics" : "Physics"}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          {resources.length === 0 ? "No Q&As here yet. Check back soon!" : "No Q&As for this subject yet."}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {sortedTopics.map((topic) => (
            <section key={topic}>
              <h2 className="font-heading text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {topic}
              </h2>
              <div className="space-y-3">
                {grouped[topic].map((r) => (
                  <div key={r.id}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <ResourceCard resource={r} isSaved={isSaved(r.id)} onToggleSave={toggleSave} />
                      </div>
                      {(r as any).mad_math_difficulty && (
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            (r as any).mad_math_difficulty === "advanced"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-primary/15 text-primary"
                          }`}
                        >
                          {(r as any).mad_math_difficulty}
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="mt-1.5 ml-12 flex flex-wrap items-center gap-3 text-xs">
                        <button
                          onClick={() => handleToggleVisibility(r.id, (r as any).is_hidden)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-colors ${
                            (r as any).is_hidden
                              ? "bg-destructive/10 text-destructive"
                              : "bg-emerald-500/10 text-emerald-600"
                          }`}
                        >
                          {(r as any).is_hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          {(r as any).is_hidden ? "Hidden" : "Visible"}
                        </button>
                        <button
                          onClick={() => handleToggleGeneral(r.id, (r as any).show_in_general)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-colors ${
                            (r as any).show_in_general
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {(r as any).show_in_general ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          {(r as any).show_in_general ? "In General" : "Mad Math Only"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
