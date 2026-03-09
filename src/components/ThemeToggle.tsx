import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <Button
      variant="outline"
      size="lg"
      className="fixed top-16 right-4 z-40 h-12 w-12 rounded-full shadow-lg border-2 border-primary/20 bg-background/80 backdrop-blur-md hover:bg-primary/10 hover:border-primary/40 transition-all duration-300"
      onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {mode === 'dark' ? (
        <Sun className="h-6 w-6 text-primary" />
      ) : (
        <Moon className="h-6 w-6 text-primary" />
      )}
    </Button>
  );
}