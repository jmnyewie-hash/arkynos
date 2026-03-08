import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export default function UpgradePage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);

  useEffect(() => {
    supabase.rpc("get_founding_spots_remaining").then(({ data }) => {
      if (typeof data === "number") setSpotsRemaining(data);
    });
  }, []);

  const founderLocked = spotsRemaining !== null && spotsRemaining <= 0;

  const tiers = [
    {
      name: "Free",
      key: "free",
      price: "$0",
      icon: <Zap className="h-6 w-6" />,
      features: ["5 downloads per day", "Access to all resources", "Upload resources"],
      cta: profile?.subscription_tier === "free" ? "Current Plan" : null,
      active: profile?.subscription_tier === "free",
    },
    {
      name: "Premium",
      key: "premium",
      price: "Coming Soon",
      icon: <Zap className="h-6 w-6 text-primary" />,
      features: ["Unlimited downloads", "Priority access to resources", "Upload resources", "Premium badge"],
      cta: profile?.subscription_tier === "premium" ? "Current Plan" : "Coming Soon",
      active: profile?.subscription_tier === "premium",
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
      cta: profile?.subscription_tier === "founder"
        ? "Your Plan"
        : founderLocked
        ? "Sold Out"
        : !user
        ? "Sign Up Now"
        : null,
      active: profile?.subscription_tier === "founder",
      locked: founderLocked && profile?.subscription_tier !== "founder",
      highlight: true,
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
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.key}
            className={`relative rounded-xl border bg-card p-6 shadow-card flex flex-col ${
              tier.highlight && !tier.locked
                ? "ring-2 ring-amber-400 border-amber-300"
                : tier.active
                ? "ring-2 ring-primary border-primary/30"
                : ""
            } ${tier.locked ? "opacity-60" : ""}`}
          >
            {tier.highlight && !tier.locked && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-0">
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
              <Button disabled className="w-full">
                {tier.cta}
              </Button>
            ) : tier.key === "founder" && !founderLocked && !user ? (
              <Button asChild className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-white border-0">
                <Link to="/register">Sign Up Now</Link>
              </Button>
            ) : (
              <Button variant="outline" disabled className="w-full">
                {tier.cta ?? "Current"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
