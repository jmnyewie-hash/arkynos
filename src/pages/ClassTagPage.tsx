import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import ResourceCard from "@/components/ResourceCard";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ResourceWithRelations = Tables<"resources"> & {
  courses: Tables<"courses"> | null;
  profiles: Tables<"profiles"> | null;
};

interface ClassTag {
  id: string;
  name: string;
  description: string | null;
}

export default function ClassTagPage() {
  const { tagId } = useParams<{ tagId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [tag, setTag] = useState<ClassTag | null>(null);
  const [resources, setResources] = useState<ResourceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Check access
  useEffect(() => {
    if (authLoading) return;
    if (!user || !tagId) {
      setCheckingAccess(false);
      return;
    }

    const checkAccess = async () => {
      const { data } = await supabase
        .from("class_access")
        .select("id")
        .eq("user_id", user.id)
        .eq("class_tag_id", tagId)
        .maybeSingle();

      setHasAccess(!!data);
      setCheckingAccess(false);
    };
    checkAccess();
  }, [user, tagId, authLoading]);

  // Verify payment on redirect back
  useEffect(() => {
    const reference = searchParams.get("reference");
    const trxref = searchParams.get("trxref");
    const ref = reference || trxref;

    if (!ref || !tagId || !user || hasAccess) return;

    const verify = async () => {
      setVerifying(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const res = await fetch(
          `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/verify-payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ reference: ref, class_tag_id: tagId }),
          }
        );

        const result = await res.json();
        if (result.success) {
          setHasAccess(true);
          toast({ title: "Payment verified!", description: "You now have permanent access to this class." });
          // Clean URL
          navigate(`/class/${tagId}`, { replace: true });
        } else {
          toast({ title: "Verification failed", description: result.error || "Please try again.", variant: "destructive" });
        }
      } catch {
        toast({ title: "Error", description: "Could not verify payment.", variant: "destructive" });
      } finally {
        setVerifying(false);
      }
    };
    verify();
  }, [searchParams, tagId, user, hasAccess]);

  // Fetch tag + resources
  useEffect(() => {
    if (!tagId) return;
    const fetchData = async () => {
      const { data: tagData } = await supabase
        .from("class_tags")
        .select("*")
        .eq("id", tagId)
        .single();

      setTag(tagData as ClassTag | null);
      if (!tagData) { setLoading(false); return; }

      const { data: resourcesData } = await supabase
        .from("resources")
        .select("*, courses(*)")
        .eq("class_tag_id", tagId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });

      if (resourcesData) {
        const userIds = [...new Set(resourcesData.map((r) => r.uploaded_by))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);

        const profilesMap = new Map((profilesData ?? []).map((p) => [p.user_id, p]));
        setResources(
          resourcesData.map((r) => ({
            ...r,
            profiles: profilesMap.get(r.uploaded_by) ?? null,
          })) as ResourceWithRelations[]
        );
      }
      setLoading(false);
    };
    fetchData();
  }, [tagId]);

  const handlePay = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setPaying(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/initialize-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            class_tag_id: tagId,
            callback_url: window.location.href.split("?")[0],
          }),
        }
      );

      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast({ title: "Error", description: data.error || "Could not initialize payment.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  if (loading || checkingAccess || authLoading) {
    return (
      <div className="container max-w-2xl py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="container max-w-2xl py-10">
        <p className="text-muted-foreground">Class tag not found.</p>
      </div>
    );
  }

  const showPaywall = !hasAccess;

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold">{tag.name}</h1>
        {tag.description && <p className="mt-1 text-muted-foreground">{tag.description}</p>}
      </div>

      {verifying && (
        <div className="mt-8 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verifying your payment...</span>
        </div>
      )}

      {showPaywall && !verifying ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-primary/60" />
          <h2 className="mt-4 font-heading text-xl font-semibold">Unlock this class</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get permanent access to all {resources.length} resource{resources.length !== 1 ? "s" : ""} in <strong>{tag.name}</strong> for just{" "}
            <span className="font-semibold text-primary">GHS 0.50</span>.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">One-time payment · Mobile Money accepted</p>
          <Button onClick={handlePay} disabled={paying} className="mt-6" size="lg">
            {paying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Pay GHS 0.50 to unlock"
            )}
          </Button>
          {!user && (
            <p className="mt-3 text-xs text-muted-foreground">
              You'll need to sign in first.
            </p>
          )}
        </div>
      ) : hasAccess ? (
        <>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>You have permanent access</span>
          </div>
          {resources.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">No resources uploaded to this class yet.</p>
          ) : (
            <div className="mt-6 space-y-2">
              {resources.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
