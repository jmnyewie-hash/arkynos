import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, Settings, LogOut, ChevronUp } from "lucide-react";
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Go to Top Button */}
      <Button
        variant="secondary"
        size="icon"
        onClick={scrollToTop}
        className="fixed bottom-16 right-4 z-50 h-10 w-10 rounded-full shadow-lg"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>

      {/* Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/90 backdrop-blur-md">
        <div className="container px-2">
          <div className="flex flex-wrap items-center justify-center gap-1 py-2 min-h-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualUpdateCheck}
              disabled={isCheckingForUpdates}
              className="flex-1 min-w-0 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${isCheckingForUpdates ? "animate-spin" : ""}`} />
              <span className="ml-1.5 text-xs truncate">{isCheckingForUpdates ? "Checking..." : "Check Updates"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/upgrade")}
              className="flex-1 min-w-0 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              <span className="ml-1.5 text-xs truncate">Settings</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex-1 min-w-0 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-1.5 text-xs truncate">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
