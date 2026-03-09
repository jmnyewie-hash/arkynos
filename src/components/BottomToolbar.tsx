import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, Settings, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function BottomToolbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);

  if (!user) return null;

  const handleManualUpdateCheck = async () => {
    setIsCheckingForUpdates(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) await registration.update();
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      window.location.reload();
    } finally {
      setIsCheckingForUpdates(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/90 backdrop-blur-md">
      <div className="container flex h-12 items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualUpdateCheck}
          disabled={isCheckingForUpdates}
          className="flex-1 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`h-4 w-4 ${isCheckingForUpdates ? "animate-spin" : ""}`} />
          <span className="ml-1.5 text-xs">{isCheckingForUpdates ? "Checking..." : "Check Updates"}</span>
        </Button>

        <div className="w-px h-6 bg-border" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/upgrade")}
          className="flex-1 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          <span className="ml-1.5 text-xs">Settings</span>
        </Button>

        <div className="w-px h-6 bg-border" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="flex-1 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="ml-1.5 text-xs">Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
