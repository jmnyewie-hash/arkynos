import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Users, Crown, Zap, UserCheck } from "lucide-react";

interface Stats {
  total_users: number;
  founding_users: number;
  premium_users: number;
  free_users: number;
  founding_spots_remaining: number;
}

export default function AdminDashboardPage() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!adminLoading && !authLoading && !isAdmin) navigate("/");
  }, [isAdmin, adminLoading, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.rpc("get_admin_user_stats").then(({ data }) => {
      if (data) setStats(data as unknown as Stats);
    });
  }, [isAdmin]);

  if (adminLoading || authLoading || !isAdmin) {
    return <div className="container max-w-3xl py-10"><div className="h-8 w-48 animate-pulse rounded bg-muted" /></div>;
  }

  const cards = stats
    ? [
        { label: "Total Users", value: stats.total_users, icon: <Users className="h-5 w-5 text-primary" /> },
        { label: "Founding Members", value: stats.founding_users, icon: <Crown className="h-5 w-5 text-amber-500" /> },
        { label: "Founding Spots Left", value: stats.founding_spots_remaining, icon: <UserCheck className="h-5 w-5 text-green-500" /> },
        { label: "Premium Users", value: stats.premium_users, icon: <Zap className="h-5 w-5 text-purple-500" /> },
        { label: "Free Users", value: stats.free_users, icon: <Users className="h-5 w-5 text-muted-foreground" /> },
      ]
    : [];

  return (
    <div className="container max-w-3xl py-10 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">User statistics overview</p>

      {!stats ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(c => (
            <div key={c.label} className="rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                {c.icon}
                <span className="text-sm text-muted-foreground">{c.label}</span>
              </div>
              <p className="mt-2 font-heading text-3xl font-bold">{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
