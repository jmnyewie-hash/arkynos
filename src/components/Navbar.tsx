import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Upload, Flag, Home, Tag, Crown, BarChart3, MessageSquare, ArrowLeft, ChevronRight, BookOpen, Info, Settings, Brain } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";

export default function Navbar() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [showScrollTip, setShowScrollTip] = useState(false);
  const hasAnimated = useRef(false);
  const [gearRotation, setGearRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGear, setShowGear] = useState(false);
  const animFrameRef = useRef<number>(0);

  const checkScroll = () => {
    const el = navRef.current;
    if (el) {
      const needsScroll = el.scrollWidth > el.clientWidth && el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      setCanScroll(needsScroll);
    }
  };

  const animateNavScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;

    setShowGear(true);
    setIsAnimating(true);

    // Quick scroll to end
    el.scrollTo({ left: el.scrollWidth, behavior: 'auto' });

    const maxScroll = el.scrollWidth - el.clientWidth;
    const initialRotation = 360;
    setGearRotation(initialRotation);

    // After a pause, smooth scroll back over 3 seconds
    setTimeout(() => {
      const start = el.scrollLeft;
      const startTime = Date.now();
      const duration = 3000;

      const smoothScroll = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        const newScrollLeft = start - (start * easeOut);
        el.scrollLeft = newScrollLeft;

        // Gear spins counter-clockwise as tabs slide back
        const scrollFraction = newScrollLeft / maxScroll;
        setGearRotation(scrollFraction * 360);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(smoothScroll);
        } else {
          setIsAnimating(false);
          setTimeout(() => {
            setShowGear(false);
            setShowScrollTip(true);
          }, 500);
        }
      };

      smoothScroll();
    }, 500);
  }, []);


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

  useEffect(() => {
    if (canScroll && !hasAnimated.current) {
      hasAnimated.current = true;
      setTimeout(animateNavScroll, 1000);
    }
  }, [canScroll, animateNavScroll]);

  useEffect(() => {
    if (showScrollTip) {
      const timer = setTimeout(() => setShowScrollTip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showScrollTip]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const isHome = location.pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center shrink-0 min-w-fit">
          {isHome ? (
            <Link to="/" className="shrink-0 block relative h-8 w-8">
              <Settings
                className="h-8 w-8 text-primary absolute inset-0"
                style={{
                  opacity: showGear ? 1 : 0,
                  transform: `rotate(${gearRotation}deg)`,
                  transition: isAnimating
                    ? 'opacity 0.3s ease'
                    : 'opacity 0.5s ease, transform 0.5s ease',
                }}
              />
              <img
                src="/favicon.png"
                alt="Arkynos"
                className="h-8 w-8 absolute inset-0"
                style={{
                  opacity: showGear ? 0 : 1,
                  transition: 'opacity 0.5s ease',
                }}
              />
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
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link to="/library"><BookOpen className="mr-1.5 h-4 w-4" />Library</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link to="/mad-as-math"><Brain className="mr-1.5 h-4 w-4" />Mad As Math</Link>
                </Button>
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
                )
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