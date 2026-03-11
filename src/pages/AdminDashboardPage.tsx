import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useSemesters } from "@/hooks/useSemesters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, Crown, Zap, UserCheck, Search, Loader2, ShieldCheck, Calendar, Power, Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Stats {
  total_users: number;
  founding_users: number;
  premium_users: number;
  free_users: number;
  founding_spots_remaining: number;
}

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  subscription_tier: string;
  founding_user: boolean;
  is_admin?: boolean;
}

const tierColors: Record<string, string> = {
  founder: "text-amber-600 bg-amber-100 border-amber-200",
  premium: "text-purple-600 bg-purple-100 border-purple-200",
  free: "text-muted-foreground bg-muted border-border",
};

export default function AdminDashboardPage() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { user, loading: authLoading } = useAuth();
  const { isPaywallEnabled, updateSetting } = useAppSettings();
  const { semesters, activeSemester, createSemester, activateSemester, endSemester } = useSemesters();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);

  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null);

  // Semester form
  const [showSemForm, setShowSemForm] = useState(false);
  const [semName, setSemName] = useState("");
  const [semStart, setSemStart] = useState("");
  const [semEnd, setSemEnd] = useState("");
  const [semCreating, setSemCreating] = useState(false);

  useEffect(() => {
    if (!adminLoading && !authLoading && !isAdmin) navigate("/");
  }, [isAdmin, adminLoading, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.rpc("get_admin_user_stats").then(({ data }) => {
      if (data) setStats(data as unknown as Stats);
    });
  }, [isAdmin]);

  const searchUsers = async () => {
    if (!userSearch.trim()) return;
    setSearchLoading(true);
    const term = `%${userSearch.trim()}%`;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .or(`name.ilike.${term},email.ilike.${term}`)
      .order("created_at", { ascending: false })
      .limit(20);

    const profiles = (data as UserProfile[]) ?? [];

    if (profiles.length > 0) {
      const userIds = profiles.map((p) => p.user_id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("user_id", userIds)
        .eq("role", "admin");
      const adminSet = new Set((roles ?? []).map((r: any) => r.user_id));
      profiles.forEach((p) => (p.is_admin = adminSet.has(p.user_id)));
    }

    setUsers(profiles);
    setSearchLoading(false);
  };

  const updateTier = async (targetUserId: string, newTier: string) => {
    setUpdatingId(targetUserId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/admin-update-tier`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ target_user_id: targetUserId, subscription_tier: newTier }),
        }
      );
      const result = await res.json();
      if (result.success) {
        setUsers((prev) => prev.map((u) => (u.user_id === targetUserId ? { ...u, subscription_tier: newTier } : u)));
        toast.success("Tier updated");
        supabase.rpc("get_admin_user_stats").then(({ data }) => { if (data) setStats(data as unknown as Stats); });
      } else {
        toast.error(result.error || "Failed");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setUpdatingId(null); }
  };

  const toggleAdminRole = async (targetUserId: string, grant: boolean) => {
    if (targetUserId === user?.id) {
      toast.error("You can't revoke your own admin role");
      return;
    }
    setTogglingRoleId(targetUserId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/admin-manage-role`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ target_user_id: targetUserId, action: grant ? "grant" : "revoke" }),
        }
      );
      const result = await res.json();
      if (result.success) {
        setUsers((prev) => prev.map((u) => (u.user_id === targetUserId ? { ...u, is_admin: grant } : u)));
        toast.success(grant ? "Admin privileges granted" : "Admin privileges revoked");
      } else {
        toast.error(result.error || "Failed");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setTogglingRoleId(null); }
  };

  const handlePaywallToggle = async (enabled: boolean) => {
    const { error } = await updateSetting("paywall_enabled", enabled ? "true" : "false");
    if (error) toast.error("Failed to update paywall");
    else toast.success(enabled ? "Paywall enabled" : "Paywall disabled — all downloads are free");
  };

  const handleCreateSemester = async () => {
    if (!semName.trim() || !semStart || !semEnd) {
      toast.error("Fill all semester fields");
      return;
    }
    setSemCreating(true);
    const { error } = await createSemester(semName.trim(), semStart, semEnd);
    if (error) toast.error("Failed to create semester");
    else {
      toast.success("Semester created");
      setSemName(""); setSemStart(""); setSemEnd("");
      setShowSemForm(false);
    }
    setSemCreating(false);
  };

  const handleActivate = async (id: string) => {
    const { error } = await activateSemester(id);
    if (error) toast.error("Failed to activate");
    else toast.success("Semester activated");
  };

  const handleEnd = async (id: string) => {
    const { error } = await endSemester(id);
    if (error) toast.error("Failed to end semester");
    else toast.success("Semester ended");
  };

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
    <div className="container max-w-3xl py-10 animate-fade-in space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">User statistics, paywall & semester management</p>
      </div>

      {/* Stats */}
      {!stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
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

      {/* Paywall Toggle */}
      <div className="rounded-xl border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-card-foreground">Paywall</p>
              <p className="text-xs text-muted-foreground">
                {isPaywallEnabled ? "Active — free users limited to 5 downloads/day" : "Disabled — all downloads are free"}
              </p>
            </div>
          </div>
          <Switch checked={isPaywallEnabled} onCheckedChange={handlePaywallToggle} />
        </div>
      </div>

      {/* Semester Management */}
      <div className="rounded-xl border bg-card p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-card-foreground">Semester Control</p>
              <p className="text-xs text-muted-foreground">
                {activeSemester ? `Active: ${activeSemester.semester_name}` : "No active semester"}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowSemForm(!showSemForm)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New
          </Button>
        </div>

        {showSemForm && (
          <div className="space-y-3 border-t pt-4">
            <Input placeholder="e.g. Semester 1, 2026" value={semName} onChange={(e) => setSemName(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={semStart} onChange={(e) => setSemStart(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input type="date" value={semEnd} onChange={(e) => setSemEnd(e.target.value)} />
              </div>
            </div>
            <Button size="sm" onClick={handleCreateSemester} disabled={semCreating}>
              {semCreating ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Create Semester
            </Button>
          </div>
        )}

        {semesters.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            {semesters.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-card-foreground flex items-center gap-2">
                    {s.semester_name}
                    {s.is_active && <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.start_date} → {s.end_date}</p>
                </div>
                <div className="flex gap-1.5">
                  {!s.is_active ? (
                    <Button size="sm" variant="outline" onClick={() => handleActivate(s.id)}>
                      <Power className="mr-1 h-3.5 w-3.5" /> Start
                    </Button>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => handleEnd(s.id)}>
                      End
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Management */}
      <div>
        <h2 className="font-heading text-xl font-bold">Manage Users</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search users to change tier or grant admin privileges
        </p>

        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Search by name or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchUsers()}
          />
          <Button onClick={searchUsers} disabled={searchLoading || !userSearch.trim()}>
            {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {users.length > 0 && (
          <div className="mt-4 space-y-2">
            {users.map((u) => (
              <div key={u.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-card-foreground truncate">{u.name}</p>
                      {u.is_admin && (
                        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs">
                          <ShieldCheck className="mr-1 h-3 w-3" />Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={tierColors[u.subscription_tier] ?? ""}>
                      {u.subscription_tier}
                    </Badge>
                    <Select
                      value={u.subscription_tier}
                      onValueChange={(val) => updateTier(u.user_id, val)}
                      disabled={updatingId === u.user_id}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="founder">Founder</SelectItem>
                      </SelectContent>
                    </Select>
                    {updatingId === u.user_id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                </div>
                {/* Admin toggle */}
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Admin privileges</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {togglingRoleId === u.user_id && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    <Switch
                      checked={u.is_admin ?? false}
                      onCheckedChange={(checked) => toggleAdminRole(u.user_id, checked)}
                      disabled={togglingRoleId === u.user_id || u.user_id === user?.id}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
