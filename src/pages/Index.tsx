import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import CourseSearchBar from "@/components/CourseSearchBar";
import ResourceCard from "@/components/ResourceCard";
import FoundingBanner from "@/components/FoundingBanner";
import { useRealtimeResources } from "@/hooks/useRealtimeResources";
import { useLibrary } from "@/hooks/useLibrary";
import arkynosLogo from "@/assets/arkynos-logo-full.png";
import { Users, BookOpen, FolderOpen, Shield, Upload, Share2, Download } from "lucide-react";

type ResourceWithRelations = Tables<"resources"> & {
  courses: Tables<"courses"> | null;
  profiles: Tables<"profiles"> | null;
};

export default function Index() {
  const [recentResources, setRecentResources] = useState<ResourceWithRelations[]>([]);
  const { isSaved, toggleSave } = useLibrary();
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const logoRef = useRef<HTMLImageElement>(null);
  const navigate = useNavigate();

  // Detect if app is already installed (standalone mode)
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Capture the beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);


  const fetchResources = useCallback(async () => {
    const { data: resourcesData } = await supabase
      .from("resources")
      .select("*, courses(*)")
      .eq("is_hidden", false)
      .order("is_preferred", { ascending: false })
      .order("downloads", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6);

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
  }, []);

  const fetchFileCount = useCallback(async () => {
    const { count } = await supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("is_hidden", false);
    setTotalFiles(count ?? 0);
  }, []);

  // Realtime subscription — re-fetch on any resource change
  useRealtimeResources(useCallback(() => {
    fetchResources();
    fetchFileCount();
  }, [fetchResources, fetchFileCount]));

  useEffect(() => {
    fetchResources();
    fetchFileCount();

    const fetchUserCount = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      setUserCount(count ?? 0);
    };
    fetchUserCount();
  }, [fetchResources, fetchFileCount]);

  // Refetch resources when showAllResources changes
  useEffect(() => {
    if (!loading) {
      fetchResources();
    }
  }, [showAllResources, fetchResources]);

  const features = [
    { icon: BookOpen, label: "Curated Resources", desc: "Past questions, lecture notes, textbooks & more — organized by course" },
    { icon: FolderOpen, label: "Class Collections", desc: "Create or join class groups with all your semester materials in one place" },
    { icon: Shield, label: "Quality-First", desc: "Community-flagged content with admin curation keeps resources reliable" },
  ];

  return (
    <>
      <FoundingBanner />
      <div className="container max-w-2xl py-16">
        <div className="mb-6 animate-fade-in relative z-[60]">
          <CourseSearchBar />
        </div>
        <div className="text-center animate-fade-in">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground/50 italic">A total of <span className="text-sm font-bold text-primary not-italic">{totalFiles.toLocaleString()}</span> files available today</p>
          <div className="mt-3 flex flex-col items-center gap-2 px-2">
            <a href="/upload" className="inline-flex w-full max-w-xs items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
              <Upload className="h-3.5 w-3.5 shrink-0" /> Upload New Files To Help The Library Grow
            </a>
            <button
              onClick={() => {
                const url = "https://arkynos.lovable.app";
                const text = "Check out Arkynos — a free library of university study resources!";
                if (navigator.share) {
                  navigator.share({ title: "Arkynos", text, url }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(`${text} ${url}`);
                  alert("Link copied to clipboard!");
                }
              }}
              className="inline-flex w-full max-w-xs items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-background px-4 py-2 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-primary/10"
            >
              <Share2 className="h-3.5 w-3.5 shrink-0" /> Share The App Link To Help Community Grow
            </button>
          </div>
          <img id="home-centerpiece-logo" ref={logoRef} src={arkynosLogo} alt="Arkynos" className="mx-auto mb-2 w-[50rem] max-w-full h-[22rem] object-contain" />
          <p className="text-base font-medium tracking-[0.25em] uppercase text-muted-foreground/50 italic">The Labyrinth Of Knowledge</p>
          <p className="mt-3 text-lg text-muted-foreground">
            Find and share study resources for your courses
          </p>
        </div>

        {/* Welcome & community section */}
        <div className="mt-10 animate-fade-in rounded-2xl border bg-card p-6 text-center" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center justify-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            <span className="text-2xl font-bold">{userCount.toLocaleString()}</span>
            <span className="text-sm font-medium text-muted-foreground">students already here</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Your one-stop library for university study materials. Upload once, help hundreds.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.label} className="rounded-xl bg-muted/50 p-3 text-left">
                <f.icon className="h-4 w-4 text-primary mb-1" />
                <p className="text-xs font-semibold text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>


        <section className="mt-14 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">Recent Resources</h2>
            {!showAllResources && recentResources.length === 6 && (
              <button
                onClick={() => setShowAllResources(true)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                See All
              </button>
            )}
            {showAllResources && (
              <button
                onClick={() => setShowAllResources(false)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Show Less
              </button>
            )}
          </div>
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
                <ResourceCard key={r.id} resource={r} isSaved={isSaved(r.id)} onToggleSave={toggleSave} />
              ))}
            </div>
          )}
        </section>

        {/* Install app prompt — only in browser, not installed */}
        {!isInstalled && (
          <div className="mt-14 animate-fade-in rounded-2xl border border-primary/20 bg-card p-5 text-center">
            <Download className="mx-auto h-6 w-6 text-primary mb-2" />
            <p className="text-sm font-semibold text-foreground">Install Arkynos on your device</p>
            <p className="mt-1 text-xs text-muted-foreground">Get faster access, offline support, and a native app experience.</p>
            {deferredPrompt ? (
              <button
                onClick={async () => {
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  if (outcome === "accepted") setIsInstalled(true);
                  setDeferredPrompt(null);
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Download className="h-3.5 w-3.5" /> Install Now
              </button>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground italic">
                On <span className="font-medium">iOS</span>: tap Share → "Add to Home Screen". On <span className="font-medium">desktop</span>: look for the install icon in your browser's address bar.
              </p>
            )}
          </div>
        )}
      </div>

    </>
  );
}
