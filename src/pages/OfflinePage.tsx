import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WifiOff, BookOpen, FileText, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCachedMeta, type CachedResourceMeta } from "@/lib/offlineCache";

const typeLabels: Record<string, string> = {
  past_question: "Past Question",
  lecture_notes: "Lecture Notes",
  textbook: "Textbook",
  lab_manual: "Lab Manual",
  recommended_books: "Recommended Book",
  solution_manual: "Solution Manual",
};

export default function OfflinePage() {
  const navigate = useNavigate();
  const [cachedItems, setCachedItems] = useState<CachedResourceMeta[]>([]);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    setCachedItems(Object.values(getCachedMeta()));
  }, []);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    window.addEventListener("online", goOnline);
    return () => window.removeEventListener("online", goOnline);
  }, []);

  // If back online, redirect home
  useEffect(() => {
    if (online) navigate("/", { replace: true });
  }, [online, navigate]);

  return (
    <div className="container max-w-lg py-12 animate-fade-in">
      <div className="text-center mb-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
          <WifiOff className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-bold">You're Offline</h1>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          No internet connection. You can still access your saved library resources below.
        </p>
      </div>

      {/* What's available */}
      <div className="rounded-xl border bg-card p-5 mb-6">
        <h2 className="font-heading font-semibold text-base mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Available Offline
        </h2>
        {cachedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No resources have been saved for offline use yet. Save resources to your library while online to access them here.
          </p>
        ) : (
          <div className="space-y-2">
            {cachedItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/view/${item.id}`)}
                className="w-full flex items-center gap-3 rounded-lg p-2.5 text-left hover:bg-muted/60 transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.course_code && `${item.course_code} · `}
                    {typeLabels[item.resource_type] || item.resource_type}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* What's NOT available */}
      <div className="rounded-xl border bg-muted/30 p-5 mb-6">
        <h2 className="font-heading font-semibold text-base mb-2">Not Available Offline</h2>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>• Searching & browsing new resources</li>
          <li>• Downloading new files</li>
          <li>• Uploading resources</li>
          <li>• Account settings & profile</li>
        </ul>
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    </div>
  );
}
