import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLibrary } from "@/hooks/useLibrary";
import ResourceCard from "@/components/ResourceCard";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";

type ResourceWithRelations = Tables<"resources"> & {
  courses?: Tables<"courses"> | null;
  profiles?: Tables<"profiles"> | null;
};

export default function MyLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { savedIds, loading: libLoading } = useLibrary();
  const [resources, setResources] = useState<ResourceWithRelations[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (libLoading || savedIds.size === 0) {
      setResources([]);
      setFetching(false);
      return;
    }
    const ids = Array.from(savedIds);
    supabase
      .from("resources")
      .select("*, courses(*)")
      .in("id", ids)
      .then(async ({ data }) => {
        if (!data) {
          setResources([]);
          setFetching(false);
          return;
        }
        // fetch uploader profiles
        const uploaderIds = [...new Set(data.map((r) => r.uploaded_by))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", uploaderIds);
        const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
        setResources(
          data.map((r) => ({
            ...r,
            profiles: profileMap.get(r.uploaded_by) ?? null,
          })) as ResourceWithRelations[]
        );
        setFetching(false);
      });
  }, [savedIds, libLoading]);

  const loading = authLoading || libLoading || fetching;

  return (
    <div className="container max-w-3xl py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">My Library</h1>
          <p className="text-sm text-muted-foreground">Resources you've saved for quick access</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Your library is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the bookmark icon on any resource to save it here
          </p>
          <Button variant="outline" className="mt-6" onClick={() => navigate("/")}>
            Browse Resources
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} isSaved={isSaved(r.id)} onToggleSave={toggleSave} />
          ))}
        </div>
      )}
    </div>
  );
}
