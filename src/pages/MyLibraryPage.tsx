import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLibrary } from "@/hooks/useLibrary";
import ResourceCard from "@/components/ResourceCard";
import { BookOpen, Download, Smartphone, WifiOff, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { getCachedMeta, getCachedFileUrl, type CachedResourceMeta } from "@/lib/offlineCache";

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

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return online;
}

const typeLabels: Record<string, string> = {
  past_question: "Past Question",
  lecture_notes: "Lecture Notes",
  textbook: "Textbook",
  lab_manual: "Lab Manual",
  recommended_books: "Recommended Book",
  solution_manual: "Solution Manual",
};

function OfflineCachedCard({ meta, onOpen }: { meta: CachedResourceMeta; onOpen: () => void }) {
  return (
    <div
      className={`group relative rounded-xl border bg-card p-4 shadow-card ${
        meta.is_preferred ? "ring-2 ring-accent/50 border-accent/30" : ""
      }`}
    >
      <button onClick={onOpen} className="block w-full text-left">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-semibold text-card-foreground truncate">
              {meta.title}
            </h3>
            {meta.course_code && (
              <p className="mt-1 text-sm text-muted-foreground">
                {meta.course_code} · {meta.course_name}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">{typeLabels[meta.resource_type] || meta.resource_type}</Badge>
              <span className="flex items-center gap-1 text-emerald-600">
                <Download className="h-3 w-3" /> Cached offline
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

export default function MyLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isInstalled = useIsInstalled();
  const isOnline = useOnlineStatus();
  const { savedIds, isSaved, toggleSave, loading: libLoading } = useLibrary();
  const [resources, setResources] = useState<ResourceWithRelations[]>([]);
  const [fetching, setFetching] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [cachedItems, setCachedItems] = useState<CachedResourceMeta[]>([]);

  // Load cached metadata always (works offline)
  useEffect(() => {
    const meta = getCachedMeta();
    setCachedItems(Object.values(meta));
  }, [savedIds]);

  useEffect(() => {
    if (!authLoading && !user && isOnline) {
      navigate("/login");
    }
  }, [user, authLoading, navigate, isOnline]);

  // Capture the install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Online mode: fetch full resource data from server
  useEffect(() => {
    if (!isOnline || !isInstalled || libLoading || savedIds.size === 0) {
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
  }, [savedIds, libLoading, isInstalled, isOnline]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  const handleOpenCached = async (resourceId: string) => {
    const url = await getCachedFileUrl(resourceId);
    if (url) {
      window.open(url, "_blank");
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
            Saved resources will be automatically downloaded so you can access them even without an internet connection.
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

  // Offline mode: show cached resources
  if (!isOnline) {
    return (
      <div className="container max-w-3xl py-10 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">My Library</h1>
            <p className="text-sm text-muted-foreground">Your saved resources</p>
          </div>
        </div>
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
          <WifiOff className="h-4 w-4 shrink-0" />
          You're offline. Showing cached resources.
        </div>
        {cachedItems.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No cached resources</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Save resources while online to access them offline
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cachedItems.map((item) => (
              <OfflineCachedCard
                key={item.id}
                meta={item}
                onOpen={() => handleOpenCached(item.id)}
              />
            ))}
          </div>
        )}
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
            Tap the bookmark icon on any resource to save it here — files are automatically downloaded for offline use
          </p>
          <Button variant="outline" className="mt-6" onClick={() => navigate("/")}>
            Browse Resources
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((r) => {
            const cached = cachedItems.find((c) => c.id === r.id);
            return (
              <LibraryResourceCard
                key={r.id}
                resource={r}
                isCached={!!cached}
                isSaved={isSaved(r.id)}
                onToggleSave={toggleSave}
                onOpen={() => handleOpenOrNavigate(r.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
