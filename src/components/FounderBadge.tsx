import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface FounderBadgeProps {
  tier?: string;
  className?: string;
}

export default function FounderBadge({ tier, className = "" }: FounderBadgeProps) {
  if (tier === "founder") {
    return (
      <Badge className={`bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-0 gap-1 ${className}`}>
        <Crown className="h-3 w-3" />
        Founding Member
      </Badge>
    );
  }

  if (tier === "premium") {
    return (
      <Badge className={`bg-gradient-to-r from-primary to-purple-500 text-white border-0 gap-1 ${className}`}>
        Premium
      </Badge>
    );
  }

  return null;
}
