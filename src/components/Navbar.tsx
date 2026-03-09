import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Flag, Home, Tag, Crown, BarChart3, MessageSquare, ArrowLeft, ChevronRight, BookOpen, Info } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function Navbar() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [showScrollTip, setShowScrollTip] = useState(false);
  const hasAnimated = useRef(false);

  const checkScroll = () => {
    const el = navRef.current;
    if (el) {
      const needsScroll = el.scrollWidth > el.clientWidth && el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      setCanScroll(needsScroll);
    }
  };

  const animateNavScroll = () => {
    const el = navRef.current;
    if (!el) return;

    // Quick scroll to end
    el.scrollTo({
      left: el.scrollWidth,
      behavior: 'auto'
    });

    // After a pause, custom smooth scroll back to start over 2 seconds
    setTimeout(() => {
      const start = el.scrollLeft;
      const startTime = Date.now();
      const duration = 3000; // 3 seconds

      const smoothScroll = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        el.scrollLeft = start - (start * easeOut);
        
        if (progress < 1) {
          requestAnimationFrame(smoothScroll);
        }
      };
      
      smoothScroll();
    }, 500);
  };

  // Re-show tip when user scrolls page to top
  useEffect(() => {
    const onPageScroll = () => {
      if (window.scrollY === 0 && canScroll) {
        setShowScrollTip(true);
      }
    };
    window.addEventListener("scroll", onPageScroll);
    return () => window.removeEventListener("scroll", onPageScroll);
  }, [canScroll]);

  useEffect(() => {
    checkScroll();
    const el = navRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [user, isAdmin]);

  // Show tip initially when canScroll becomes true and trigger animation ONCE
  useEffect(() => {
    if (canScroll && !hasAnimated.current) {
      setShowScrollTip(true);
      hasAnimated.current = true;
      // Trigger scroll animation after a short delay
      setTimeout(animateNavScroll, 1000);
    }
  }, [canScroll]);

  useEffect(() => {
    if (showScrollTip) {
      const timer = setTimeout(() => setShowScrollTip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showScrollTip]);

  const isHome = location.pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      {canScroll && showScrollTip && (
        <div className="flex items-center gap-2 bg-muted/30 px-4 py-1.5 border-b text-xs text-muted-foreground animate-fade-in">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>Scroll horizontally to see more navigation options</span>
        </div>
      )}
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center shrink-0 min-w-fit">
          {isHome ? (
            <Link to="/" className="shrink-0 block">
              <img src="/favicon.png" alt="Arkynos" className="h-8 w-8" />
            </Link>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="relative flex-1 min-w-0 ml-4">
          <nav ref={navRef} className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {!isHome && (
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link to="/"><Home className="mr-1.5 h-4 w-4" />Home</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link to="/classes"><Tag className="mr-1.5 h-4 w-4" />Classes</Link>
            </Button>
            {user ? (
              <>
                {isAdmin && (
                  <>
                    <Button variant="ghost" size="sm" asChild className="shrink-0">
                      <Link to="/admin/flags"><Flag className="mr-1.5 h-4 w-4" />Flags</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="shrink-0">
                      <Link to="/admin/dashboard"><BarChart3 className="mr-1.5 h-4 w-4" />Stats</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="shrink-0">
                      <Link to="/admin/messages"><MessageSquare className="mr-1.5 h-4 w-4" />Messages</Link>
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link to="/library"><BookOpen className="mr-1.5 h-4 w-4" />Library</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link to="/contact"><MessageSquare className="mr-1.5 h-4 w-4" />Contact</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link to="/upload"><Upload className="mr-1.5 h-4 w-4" />Upload</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link to="/upgrade"><Crown className="mr-1.5 h-4 w-4" />Upgrade</Link>
                </Button>
              </>
            ) : (
              <Button size="sm" asChild className="shrink-0">
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </nav>
          {canScroll && (
            <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none">
              <div className="bg-gradient-to-l from-card/80 via-card/80 to-transparent pl-6 pr-1 flex items-center animate-pulse">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
