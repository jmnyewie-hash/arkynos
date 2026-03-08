import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Flag, CheckCircle, XCircle, ExternalLink, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const reasonLabels: Record<string, string> = {
  wrong_category: "Wrong category",
  inappropriate_content: "Inappropriate content",
  spam: "Spam",
  copyright_violation: "Copyright violation",
  low_quality: "Low quality",
  other: "Other",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  dismissed: "bg-muted text-muted-foreground",
};

interface FlagRow {
  id: string;
  resource_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  resources: { id: string; title: string } | null;
  profiles: { name: string } | null;
}

export default function AdminFlagsPage() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !authLoading && !isAdmin) navigate("/");
  }, [isAdmin, adminLoading, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchFlags = async () => {
      const { data } = await supabase
        .from("resource_flags")
        .select("*, resources!resource_flags_resource_id_fkey(id, title)")
        .order("created_at", { ascending: false });

      if (data) {
        const userIds = [...new Set(data.map((f: any) => f.flagged_by))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);
        const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));

        setFlags(data.map((f: any) => ({
          ...f,
          profiles: profileMap.get(f.flagged_by) ?? null,
        })));
      }
      setLoading(false);
    };
    fetchFlags();
  }, [isAdmin]);

  const handleAction = async (flagId: string, action: "resolved" | "dismissed") => {
    const { error } = await supabase
      .from("resource_flags")
      .update({ status: action, resolved_at: new Date().toISOString() })
      .eq("id", flagId);

    if (error) {
      toast.error("Failed to update flag");
    } else {
      setFlags((prev) => prev.map((f) => f.id === flagId ? { ...f, status: action } : f));
      toast.success(action === "resolved" ? "Flag resolved" : "Flag dismissed");
    }
  };

  if (adminLoading || authLoading || loading) {
    return <div className="container max-w-3xl py-10"><div className="h-8 w-48 animate-pulse rounded bg-muted" /></div>;
  }

  if (!isAdmin) return null;

  const pendingFlags = flags.filter(f => f.status === "pending");
  const pastFlags = flags.filter(f => f.status !== "pending");

  return (
    <div className="container max-w-3xl py-10 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Flagged Resources</h1>
      <p className="mt-1 text-sm text-muted-foreground">Review reported content</p>

      {pendingFlags.length === 0 && pastFlags.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">No flags yet.</p>
      )}

      {pendingFlags.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-base font-semibold mb-3">
            Pending ({pendingFlags.length})
          </h2>
          <div className="space-y-3">
            {pendingFlags.map((flag) => (
              <div key={flag.id} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-destructive shrink-0" />
                      <span className="font-heading font-semibold text-sm truncate">
                        {flag.resources?.title ?? "Unknown resource"}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{reasonLabels[flag.reason] ?? flag.reason}</Badge>
                      {flag.profiles && (
                        <span className="text-xs text-muted-foreground">by {flag.profiles.name}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(flag.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {flag.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{flag.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t pt-3">
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/resource/${flag.resource_id}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1.5 h-3 w-3" /> View
                    </a>
                  </Button>
                  <Button size="sm" onClick={() => handleAction(flag.id, "resolved")}>
                    <CheckCircle className="mr-1.5 h-3 w-3" /> Resolve
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleAction(flag.id, "dismissed")}>
                    <XCircle className="mr-1.5 h-3 w-3" /> Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pastFlags.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-base font-semibold mb-3">History</h2>
          <div className="space-y-2">
            {pastFlags.map((flag) => (
              <div key={flag.id} className="rounded-xl border bg-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm truncate">{flag.resources?.title ?? "Unknown"}</span>
                  <Badge variant="secondary" className="text-xs">{reasonLabels[flag.reason]}</Badge>
                </div>
                <Badge className={`shrink-0 ${statusColors[flag.status]}`}>
                  {flag.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
