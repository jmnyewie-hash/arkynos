import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import CourseSearchBar from "@/components/CourseSearchBar";
import { ArrowRight, Lightbulb } from "lucide-react";

const searchTips = [
  "Search by course code (e.g. \"MAT101\") for the most direct results",
  "Try searching by department name like \"Physics\" or \"Engineering\"",
  "Use partial words — \"bio\" will match Biology, Biochemistry, etc.",
  "Each course page has filters for resource type: past questions, lecture notes, textbooks & more",
  "Look for the ★ badge — preferred resources are pinned to the top by admins",
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [courses, setCourses] = useState<Tables<"courses">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) { setCourses([]); setLoading(false); return; }
    setLoading(true);
    supabase
      .from("courses")
      .select("*")
      .or(`course_code.ilike.%${query}%,course_name.ilike.%${query}%,department.ilike.%${query}%`)
      .order("course_code")
      .then(({ data }) => {
        setCourses(data ?? []);
        setLoading(false);
      });
  }, [query]);

  return (
    <div className="container max-w-2xl py-10">
      <CourseSearchBar initialQuery={query} />
      <div className="mt-8">
        <h2 className="font-heading text-lg font-semibold">
          {query ? `Results for "${query}"` : "Search for a course"}
        </h2>
        {loading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : courses.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No courses found.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {courses.map((c) => (
              <Link
                key={c.id}
                to={`/course/${c.course_code}`}
                className="group flex items-center justify-between rounded-xl border bg-card p-4 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
              >
                <div>
                  <p className="font-heading font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {c.course_code}
                  </p>
                  <p className="text-sm text-muted-foreground">{c.course_name} · {c.department} · {c.university}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Search Tips */}
      <div className="mt-10 rounded-xl border border-primary/10 bg-accent/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Search Tips</p>
        </div>
        <ul className="space-y-2">
          {searchTips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
