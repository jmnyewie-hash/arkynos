import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Suggestion = {
  course_code: string;
  course_name: string;
};

export default function CourseSearchBar({ className = "", initialQuery = "" }: { className?: string; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch suggestions as user types
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("courses")
        .select("course_code, course_name")
        .or(`course_code.ilike.%${trimmed}%,course_name.ilike.%${trimmed}%`)
        .order("course_code")
        .limit(7);

      if (data) setSuggestions(data);
    }, 150);

    return () => clearTimeout(timeout);
  }, [query]);

  const goToCourse = useCallback((courseCode: string) => {
    setQuery(courseCode);
    setShowSuggestions(false);
    inputRef.current?.blur();
    navigate(`/course/${encodeURIComponent(courseCode)}`);
  }, [navigate]);

  const goToSearch = useCallback((q: string) => {
    setShowSuggestions(false);
    inputRef.current?.blur();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      goToCourse(suggestions[selectedIndex].course_code);
    } else if (query.trim()) {
      goToSearch(query.trim());
    }
  };

  const clearQuery = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
      return;
    }
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i < suggestions.length - 1 ? i + 1 : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    }
  };

  // Highlight matched text
  const highlight = (text: string) => {
    const trimmed = query.trim();
    if (!trimmed) return text;
    const idx = text.toLowerCase().indexOf(trimmed.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-bold text-foreground">{text.slice(idx, idx + trimmed.length)}</span>
        {text.slice(idx + trimmed.length)}
      </>
    );
  };

  return (
    <>
      {/* Backdrop overlay when suggestions are showing */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onMouseDown={() => setShowSuggestions(false)}
        />
      )}
      <div ref={wrapperRef} className={`relative ${showSuggestions && suggestions.length > 0 ? "z-50" : ""} ${className}`}>
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search by course code or name..."
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              if (query.trim().length >= 1 && suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            className="h-12 rounded-xl border-2 pl-12 pr-10 text-base font-body shadow-card transition-all focus:shadow-card-hover focus:border-primary bg-background"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1.5 w-full rounded-xl border bg-popover p-1.5 shadow-xl animate-fade-in max-h-80 overflow-y-auto">
            {suggestions.map((s, i) => (
              <li
                key={s.course_code}
                onMouseDown={(e) => { e.preventDefault(); goToCourse(s.course_code); }}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors select-none ${
                  i === selectedIndex ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0 pointer-events-none" />
                <div className="min-w-0 pointer-events-none">
                  <span className="font-semibold text-primary">{highlight(s.course_code)}</span>
                  <span className="mx-1.5 text-muted-foreground/40">·</span>
                  <span className="text-muted-foreground">{highlight(s.course_name)}</span>
                </div>
              </li>
            ))}
            {query.trim().length >= 2 && (
              <li
                onMouseDown={(e) => { e.preventDefault(); goToSearch(query.trim()); }}
                onMouseEnter={() => setSelectedIndex(-1)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-primary hover:bg-muted transition-colors border-t mt-1 pt-3 select-none"
              >
                <Search className="h-3.5 w-3.5 shrink-0 pointer-events-none" />
                <span className="pointer-events-none">Search all for "<strong>{query.trim()}</strong>"</span>
              </li>
            )}
          </ul>
        )}
      </div>
    </>
  );
}
