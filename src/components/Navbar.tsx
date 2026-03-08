import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Upload, LogOut, Flag, Home, Tag, Crown, BarChart3, MessageSquare, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [totalFiles, setTotalFiles] = useState<number>(0);

  const isHome = location.pathname === "/";

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from("resources")
        .select("id", { count: "exact", head: true })
        .eq("is_hidden", false);
      setTotalFiles(count ?? 0);
    };
    fetchCount();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[10px] font-bold text-primary leading-none">{totalFiles}</span>
          {!isHome && (
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-6 w-6 mr-0.5" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <Link to="/" className="shrink-0">
                <img src="/favicon.png" alt="Arkynos" className="h-7 w-7" />
              </Link>
            </div>
          )}
          {isHome && (
            <Link to="/" className="shrink-0">
              <img src="/favicon.png" alt="Arkynos" className="h-7 w-7" />
            </Link>
          )}
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide ml-4">
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link to="/"><Home className="mr-1.5 h-4 w-4" />Home</Link>
          </Button>
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
      </div>
    </header>
  );
}
