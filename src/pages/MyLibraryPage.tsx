import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLibrary } from "@/hooks/useLibrary";
import ResourceCard from "@/components/ResourceCard";
import { BookOpen, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";

type ResourceWithRelations = Tables<"resources"> & {
  courses?: Tables<"courses"> | null;
  profiles?: Tables<"profiles"> | null;
};

function useIsInstalled() {
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    setInstalled(mq.matches);
    const handler = (e: MediaQueryListEvent) => setInstalled(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return installed;
}

export default function MyLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isInstalled = useIsInstalled();
  const { savedIds, isSaved, toggleSave, loading: libLoading } = useLibrary();
  const [resources, setResources] = useState<ResourceWithRelations[]>([]);
  const [fetching, setFetching] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Capture the install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!isInstalled || libLoading || savedIds.size === 0) {
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
  }, [savedIds, libLoading, isInstalled]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  const loading = authLoading || libLoading || fetching;

  // Gate: must have the app installed
  if (!isInstalled) {
    return (
      <div className="container max-w-md py-16 animate-fade-in">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 font-heading text-2xl font-bold">Install Arkynos</h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Your personal library is available offline — but only when you install the app on your device.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Saved resources will be cached so you can access them even without an internet connection.
          </p>

          {deferredPrompt ? (
            <Button className="mt-8" size="lg" onClick={handleInstall}>
              <Download className="mr-2 h-5 w-5" />
              Install Arkynos
            </Button>
          ) : (
            <div className="mt-8 rounded-xl border bg-muted/50 p-5 text-left text-sm text-muted-foreground space-y-3">
              <p className="font-medium text-foreground">How to install:</p>
              <div className="space-y-2">
                <p><strong>iPhone / iPad:</strong> Tap the share button <span className="inline-block">↑</span> → "Add to Home Screen"</p>
                <p><strong>Android:</strong> Tap the browser menu ⋮ → "Install app" or "Add to Home Screen"</p>
                <p><strong>Desktop:</strong> Click the install icon in the address bar</p>
              </div>
            </div>
          )}

          <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">My Library</h1>
          <p className="text-sm text-muted-foreground">Your saved resources, available offline</p>
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
