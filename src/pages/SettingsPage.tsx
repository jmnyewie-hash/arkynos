import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Palette, Check, RotateCcw, ChevronDown, Download } from "lucide-react";
import { Link } from "react-router-dom";

const AUTODOWNLOAD_KEY = "arkynos_library_autodownload";

export function getAutodownloadEnabled(): boolean {
  const val = localStorage.getItem(AUTODOWNLOAD_KEY);
  return val === null ? true : val === "true";
}

export default function SettingsPage() {
  const { theme: currentTheme, setTheme, themes } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [themesOpen, setThemesOpen] = useState(false);
  const [autodownload, setAutodownload] = useState(getAutodownloadEnabled);

  useEffect(() => {
    localStorage.setItem(AUTODOWNLOAD_KEY, String(autodownload));
  }, [autodownload]);

  const handleApplyTheme = () => {
    setTheme(selectedTheme);
  };

  const resetToDefault = () => {
    setSelectedTheme('mono');
    setTheme('mono');
  };

  return (
    <div className="container max-w-4xl py-12 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Customize your Arkynos experience
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/">← Back to Home</Link>
        </Button>
      </div>

      {/* Theme Selection — collapsible */}
      <Card className="mb-4">
        <Collapsible open={themesOpen} onOpenChange={setThemesOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/30 transition-colors rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">Theme & Colors</CardTitle>
                    <CardDescription className="text-xs">
                      Current: {themes.find(t => t.id === currentTheme)?.name}
                    </CardDescription>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${themesOpen ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {themes.map((themeOption) => (
                  <div
                    key={themeOption.id}
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedTheme === themeOption.id
                        ? 'ring-2 ring-primary border-primary/50 bg-accent/50'
                        : 'hover:border-primary/30'
                    }`}
                    onClick={() => setSelectedTheme(themeOption.id)}
                  >
                    {selectedTheme === themeOption.id && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: themeOption.colors.primary }} />
                        <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: themeOption.colors.secondary }} />
                        <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: themeOption.colors.accent }} />
                      </div>
                      <h3 className="font-semibold text-sm">{themeOption.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">{themeOption.description}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t">
                <Button 
                  onClick={handleApplyTheme} 
                  disabled={selectedTheme === currentTheme}
                  size="sm"
                  className="flex-1 min-w-fit"
                >
                  Apply Theme
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetToDefault} 
                  disabled={currentTheme === 'mono'}
                  size="sm"
                  className="flex-1 min-w-fit"
                >
                  <RotateCcw className="h-3 w-3 mr-1.5" />
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Library Autodownload Toggle */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Library Auto-Download</CardTitle>
                <CardDescription className="text-xs">
                  Automatically cache saved resources for offline access
                </CardDescription>
              </div>
            </div>
            <Switch checked={autodownload} onCheckedChange={setAutodownload} />
          </div>
        </CardHeader>
      </Card>

      {/* Subscription Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription</CardTitle>
          <CardDescription className="text-xs">
            Manage your subscription and access premium features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/upgrade">View Subscription Plans →</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
