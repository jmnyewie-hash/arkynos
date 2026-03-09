import { useTheme } from "@/hooks/useTheme";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const isDark = mode === "dark";

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 shadow-sm px-2 py-1">
      <Sun className={`h-3 w-3 transition-colors ${isDark ? 'text-muted-foreground/40' : 'text-amber-500'}`} />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setMode(checked ? 'dark' : 'light')}
        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
      />
      <Moon className={`h-3 w-3 transition-colors ${isDark ? 'text-primary' : 'text-muted-foreground/40'}`} />
    </div>
  );
}