import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Suggestion = {
  course_code: string;
  course_name: string;
};

export default function CourseSearchBar({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      // Search courses directly by code or name
      const { data: courses } = await supabase
        .from("courses")
        .select("course_code, course_name")
        .or(`course_code.ilike.%${trimmed}%,course_name.ilike.%${trimmed}%`)
        .order("course_code")
        .limit(8);

      if (courses) {
        setSuggestions(courses);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      navigateToCourse(suggestions[selectedIndex].course_code);
    } else if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const navigateToCourse = (courseCode: string) => {
    setQuery(courseCode);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(courseCode)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search courses... e.g. MATH 152"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="h-14 rounded-xl border-2 pl-12 pr-4 text-base font-body shadow-card transition-shadow focus:shadow-card-hover focus:border-primary"
        />
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border bg-popover p-1 shadow-lg animate-fade-in">
          {suggestions.map((s, i) => (
            <li
              key={s.course_code}
              onMouseDown={(e) => { e.preventDefault(); navigateToCourse(s.course_code); }}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                i === selectedIndex ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50"
              }`}
            >
              <span className="font-semibold text-primary">{s.course_code}</span>
              <span className="text-muted-foreground">{s.course_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
