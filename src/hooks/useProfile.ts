import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  founding_user: boolean;
  subscription_tier: "free" | "premium" | "founder";
  downloads_today: number;
  last_download_date: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setProfile(data as unknown as UserProfile | null);
        setLoading(false);
      });
  }, [user]);

  return { profile, loading, setProfile };
}
