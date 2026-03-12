import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useSemesters } from "@/hooks/useSemesters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Lock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function UpgradePage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { activeSemester } = useSemesters();
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.rpc("get_founding_spots_remaining").then(({ data }) => {
      if (typeof data === "number") setSpotsRemaining(data);
    });
  }, []);

  // Verify semester payment on redirect back
  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (!reference || !user || verifying) return;

    const verify = async () => {
      setVerifying(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const res = await fetch(
          `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/verify-semester-payment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ reference }),
          }
        );
        const result = await res.json();
        if (result.success) {
          toast.success("Payment verified! You now have premium access for this semester.");
          navigate("/upgrade", { replace: true });
          // Force profile refresh
          window.location.reload();
        } else {
          toast.error(result.error || "Verification failed");
        }
      } catch {
        toast.error("Could not verify payment");
      } finally {
        setVerifying(false);
      }
    };
    verify();
  }, [searchParams, user]);

  const handlePaySemester = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setPaying(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/initialize-semester-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ callback_url: window.location.origin + "/upgrade" }),
        }
      );
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error(data.error || "Could not initialize payment");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPaying(false);
    }
  };

  const founderLocked = spotsRemaining !== null && spotsRemaining <= 0;
  const isPremiumActive = profile?.subscription_tier === "premium" && activeSemester && profile?.paid_semester_id === activeSemester.id;

  const tiers = [
    {
      name: "Free",
      key: "free",
      price: "GHS 0",
      icon: <Zap className="h-6 w-6" />,
      features: ["5 downloads per day", "Access to all resources", "Upload resources"],
      active: profile?.subscription_tier === "free" || (profile?.subscription_tier === "premium" && !isPremiumActive),
    },
    {
      name: "Premium",
      key: "premium",
      price: "GHS 2 / semester",
      icon: <Zap className="h-6 w-6 text-primary" />,
      features: [
        "Unlimited downloads",
        "Priority access to resources",
        "Upload resources",
        "Premium badge",
        activeSemester ? `Valid for: ${activeSemester.semester_name}` : "Pay when semester is active",
      ],
      active: isPremiumActive,
      highlight: true,
    },
    {
      name: "Founding Member",
      key: "founder",
      price: "FREE — Forever",
      icon: <Crown className="h-6 w-6 text-amber-500" />,
      features: [
        "All Premium features",
        "Lifetime access — never expires",
        "Exclusive Founding Member badge",
        "Limited to first 1,260 users",
      ],
      active: profile?.subscription_tier === "founder",
      locked: founderLocked && profile?.subscription_tier !== "founder",
    },
  ];

  return (
    <div className="container max-w-4xl py-12 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl font-bold">Choose Your Plan</h1>
        <p className="mt-2 text-muted-foreground">
          {spotsRemaining !== null && spotsRemaining > 0
            ? `🔥 Only ${spotsRemaining} founding member spots remaining!`
            : "Upgrade to unlock unlimited downloads"}
        </p>
        {activeSemester && (
          <p className="mt-1 text-xs text-muted-foreground">
            Current semester: <span className="font-semibold text-primary">{activeSemester.semester_name}</span>
          </p>
        )}
      </div>

      {verifying && (
        <div className="mb-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verifying your payment...</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.key}
            className={`relative rounded-xl border bg-card p-6 shadow-card flex flex-col ${
              tier.highlight && !tier.locked
                ? "ring-2 ring-primary border-primary/30"
                : tier.active
                ? "ring-2 ring-primary border-primary/30"
                : ""
            } ${tier.locked ? "opacity-60" : ""}`}
          >
            {tier.highlight && !tier.locked && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-0">
                Most Popular
              </Badge>
            )}
            {tier.locked && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-card/80 backdrop-blur-sm z-10">
                <div className="text-center">
                  <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">Sold Out</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              {tier.icon}
              <div>
                <h3 className="font-heading font-bold text-lg">{tier.name}</h3>
                <p className="text-sm text-muted-foreground">{tier.price}</p>
              </div>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            {tier.active ? (
              <Button disabled className="w-full">Current Plan</Button>
            ) : tier.key === "premium" && !isPremiumActive ? (
              activeSemester ? (
                <Button onClick={handlePaySemester} disabled={paying || !user} className="w-full">
                  {paying ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting...</>
                  ) : !user ? (
                    <Link to="/login" className="w-full">Sign in to upgrade</Link>
                  ) : (
                    "Pay GHS 2.00"
                  )}
                </Button>
              ) : (
                <Button variant="outline" disabled className="w-full">No active semester</Button>
              )
            ) : tier.key === "founder" && !founderLocked && !user ? (
              <Button asChild className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-white border-0">
                <Link to="/register">Sign Up Now</Link>
              </Button>
            ) : (
              <Button variant="outline" disabled className="w-full">
                {tier.locked ? "Sold Out" : "Current"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
