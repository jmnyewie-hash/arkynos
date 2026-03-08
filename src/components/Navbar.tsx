import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Upload, LogOut, Flag, Home, Tag, Crown, BarChart3, MessageSquare, ArrowLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  const checkScroll = () => {
    const el = navRef.current;
    if (el) {
      setCanScroll(el.scrollWidth > el.clientWidth && el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }
  };

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

  const isHome = location.pathname === "/";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center shrink-0">
          {!isHome && (
            <Button variant="ghost" size="icon" className="h-8 w-8 mr-1" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Link to="/" className="shrink-0">
            <img src="/favicon.png" alt="Arkynos" className="h-8 w-8" />
          </Link>
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
                  <Link to="/contact"><MessageSquare className="mr-1.5 h-4 w-4" />Contact</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link to="/upload"><Upload className="mr-1.5 h-4 w-4" />Upload</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link to="/upgrade"><Crown className="mr-1.5 h-4 w-4" />Upgrade</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="shrink-0">
                  <LogOut className="mr-1.5 h-4 w-4" />Sign Out
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
