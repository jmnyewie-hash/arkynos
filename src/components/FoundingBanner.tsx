import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Crown } from "lucide-react";
import { Link } from "react-router-dom";

export default function FoundingBanner() {
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);

  useEffect(() => {
    supabase.rpc("get_founding_spots_remaining").then(({ data }) => {
      if (typeof data === "number") setSpotsRemaining(data);
    });
  }, []);

  if (spotsRemaining === null || spotsRemaining <= 0) return null;

  return (
    <Link
      to="/upgrade"
      className="block w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-white py-2.5 px-4 text-center text-sm font-semibold transition-opacity hover:opacity-90"
    >
      <span className="inline-flex items-center gap-2">
        <Crown className="h-4 w-4" />
        Founding User Spots Remaining: {spotsRemaining} / 500 — Sign up now for free lifetime premium!
      </span>
    </Link>
  );
}
