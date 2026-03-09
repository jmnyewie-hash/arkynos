import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, Settings, LogOut, ChevronUp, Cog } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export default function BottomToolbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [gearRotation, setGearRotation] = useState(0);
  const lastScrollY = useRef(0);
  const scrollRaf = useRef<number>();

  // Watch for centerpiece logo visibility to show/hide scroll to top button
  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const attach = () => {
      if (observer) return;

      const logoEl = document.getElementById("home-centerpiece-logo");
      if (!logoEl) return;

      observer = new IntersectionObserver(
        ([entry]) => setShowScrollTop(!entry.isIntersecting),
        { threshold: 0 }
      );

      observer.observe(logoEl);
    };

    attach();

    // If the logo hasn't mounted yet, wait for it.
    if (!observer) {
      mutationObserver = new MutationObserver(() => {
        attach();
        if (observer) mutationObserver?.disconnect();
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observer?.disconnect();
      mutationObserver?.disconnect();
    };
  }, []);

  // Scroll-based gear rotation
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRaf.current) {
        cancelAnimationFrame(scrollRaf.current);
      }
      
      scrollRaf.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollY.current;
        
        // Gear rotates based on scroll direction and distance
        // Positive scrollDelta (scrolling down) = clockwise rotation
        // Negative scrollDelta (scrolling up) = counter-clockwise rotation
        setGearRotation(prev => prev + scrollDelta * 1.0);
        
        lastScrollY.current = currentScrollY;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollRaf.current) {
        cancelAnimationFrame(scrollRaf.current);
      }
    };
  }, []);

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
      {/* Go to Top Button - only when logo is not visible */}
      {showScrollTop && (
        <Button
          variant="secondary"
          size="icon"
          onClick={scrollToTop}
          className="fixed bottom-16 right-4 z-50 h-10 w-10 rounded-full shadow-lg"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}

      {/* Scroll Gear - always visible when user is logged in */}
      <div className="fixed bottom-16 left-4 z-40">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            transform: `rotate(${gearRotation}deg)`,
            transition: 'none',
            filter: "drop-shadow(0 0 8px rgba(249,115,22,0.45))",
          }}
        >
          <path
            d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
            stroke="#f97316"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            paintOrder="stroke"
          />
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke="#f97316"
            strokeWidth="2"
            fill="none"
          />
          {/* Black outline layer */}
          <path
            d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
            stroke="black"
            strokeWidth="0.5"
            fill="none"
            opacity="0.6"
          />
        </svg>
      </div>

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
              onClick={() => navigate("/settings")}
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
