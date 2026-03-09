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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

  const fetchResources = useCallback(async () => {
    // Admin sees all mad_math resources; non-admin sees only non-hidden ones
    let query = supabase
      .from("resources")
      .select("*, courses(*)")
      .eq("is_mad_math" as any, true)
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("is_hidden", false);
    }

    const { data: resourcesData } = await query;

    if (resourcesData) {
      const userIds = [...new Set(resourcesData.map((r: any) => r.uploaded_by))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      const profilesMap = new Map((profilesData ?? []).map((p) => [p.user_id, p]));
      const merged = resourcesData.map((r: any) => ({
        ...r,
        profiles: profilesMap.get(r.uploaded_by) ?? null,
      }));
      setResources(merged as ResourceWithRelations[]);
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

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">Mad As Math</h1>
          <p className="text-sm text-muted-foreground">Admin-curated math resources</p>
        </div>
      </div>

      {isAdmin && (
        <Button size="sm" className="mt-4" onClick={() => navigate("/upload?mad_math=true")}>
          <Upload className="mr-1.5 h-4 w-4" /> Upload to Mad As Math
        </Button>
      )}

      {loading ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No resources here yet. Check back soon!</p>
      ) : (
        <div className="mt-6 space-y-4">
          {resources.map((r) => (
            <div key={r.id}>
              <ResourceCard resource={r} isSaved={isSaved(r.id)} onToggleSave={toggleSave} />
              {isAdmin && (
                <div className="mt-1.5 ml-12 flex flex-wrap items-center gap-4 text-xs">
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
                    {(r as any).show_in_general ? "In General Feeds" : "Mad Math Only"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
