import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Upload, LogOut, Flag, Home, Tag, Crown, BarChart3, MessageSquare } from "lucide-react";
import arkynosLogo from "@/assets/arkynos-logo-full.png";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={arkynosLogo} alt="Arkynos" className="h-28" />
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><Home className="mr-1.5 h-4 w-4" />Home</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/classes"><Tag className="mr-1.5 h-4 w-4" />Classes</Link>
          </Button>
          {user ? (
            <>
              {isAdmin && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/flags"><Flag className="mr-1.5 h-4 w-4" />Flags</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/dashboard"><BarChart3 className="mr-1.5 h-4 w-4" />Stats</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/messages"><MessageSquare className="mr-1.5 h-4 w-4" />Messages</Link>
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/contact"><MessageSquare className="mr-1.5 h-4 w-4" />Contact</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/upload"><Upload className="mr-1.5 h-4 w-4" />Upload</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/upgrade"><Crown className="mr-1.5 h-4 w-4" />Upgrade</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1.5 h-4 w-4" />Sign Out
              </Button>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
