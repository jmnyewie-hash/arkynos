import { useTheme } from "@/hooks/useTheme";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const isDark = mode === "dark";

  return (
    <div className="fixed top-[calc(3.5rem+2.75rem)] right-4 z-40 flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-md border border-border/50 shadow-lg px-3 py-2">
      <Sun className={`h-4 w-4 transition-colors ${isDark ? 'text-muted-foreground/40' : 'text-amber-500'}`} />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setMode(checked ? 'dark' : 'light')}
        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted scale-110"
      />
      <Moon className={`h-4 w-4 transition-colors ${isDark ? 'text-primary' : 'text-muted-foreground/40'}`} />
    </div>
  );
}