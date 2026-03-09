import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Check, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

export default function SettingsPage() {
  const { theme: currentTheme, setTheme, themes } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  const handleApplyTheme = () => {
    setTheme(selectedTheme);
  };

  const resetToDefault = () => {
    setSelectedTheme('teal');
    setTheme('teal');
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

      {/* Theme Selection */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Theme & Colors</CardTitle>
              <CardDescription>
                Choose your preferred color scheme
              </CardDescription>
            </div>
          </div>
        </CardHeader>
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
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: themeOption.colors.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: themeOption.colors.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: themeOption.colors.accent }}
                    />
                  </div>
                  <h3 className="font-semibold text-sm">{themeOption.name}</h3>
                </div>
                
                <p className="text-xs text-muted-foreground leading-snug">
                  {themeOption.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t">
            <Button 
              onClick={handleApplyTheme} 
              disabled={selectedTheme === currentTheme}
            >
              Apply Theme
            </Button>
            
            <Button 
              variant="outline" 
              onClick={resetToDefault}
              disabled={currentTheme === 'teal'}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>

            <div className="flex-1 text-right">
              <p className="text-xs text-muted-foreground">
                Current: <span className="font-medium">{themes.find(t => t.id === currentTheme)?.name}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Link */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
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