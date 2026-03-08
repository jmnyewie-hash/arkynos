import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Search, Check, X } from "lucide-react";

interface CourseSearchSelectProps {
  value: string; // course id
  onSelect: (courseId: string, course: Tables<"courses">) => void;
  onClear: () => void;
}

export default function CourseSearchSelect({ value, onSelect, onClear }: CourseSearchSelectProps) {
  const [courses, setCourses] = useState<Tables<"courses">[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Tables<"courses"> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load all courses once
  useEffect(() => {
    supabase
      .from("courses")
      .select("*")
      .order("course_code")
      .then(({ data }) => setCourses(data ?? []));
  }, []);

  // Sync selected course when value changes externally
  useEffect(() => {
    if (value && courses.length > 0) {
      const found = courses.find((c) => c.id === value);
      setSelectedCourse(found ?? null);
    } else {
      setSelectedCourse(null);
    }
  }, [value, courses]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = courses.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.course_code.toLowerCase().includes(q) ||
      c.course_name.toLowerCase().includes(q)
    );
  });

  const handleSelect = (course: Tables<"courses">) => {
    setSelectedCourse(course);
    setQuery("");
    setOpen(false);
    onSelect(course.id, course);
  };

  const handleClear = () => {
    setSelectedCourse(null);
    setQuery("");
    onClear();
  };

  if (selectedCourse) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
        <div>
          <span className="font-heading font-semibold text-sm text-foreground">{selectedCourse.course_code}</span>
          <span className="text-sm text-muted-foreground ml-2">— {selectedCourse.course_name}</span>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="ml-2 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by course code or name..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-10"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-card shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">No courses found</div>
          ) : (
            filtered.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => handleSelect(course)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors"
              >
                <span className="font-heading font-medium text-foreground">{course.course_code}</span>
                <span className="text-muted-foreground">— {course.course_name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
