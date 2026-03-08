import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import ResourceCard from "@/components/ResourceCard";
import { useRealtimeResources } from "@/hooks/useRealtimeResources";
import { TrendingUp, Star, Clock, SlidersHorizontal, FolderOpen } from "lucide-react";

type ResourceWithRelations = Tables<"resources"> & {
  courses: Tables<"courses"> | null;
  profiles: Tables<"profiles"> | null;
};

const typeLabels: Record<string, string> = {
  all: "All Types",
  past_question: "Past Questions",
  lecture_notes: "Lecture Notes",
  textbook: "Textbooks",
  lab_manual: "Lab Manuals",
  recommended_books: "Recommended Books",
  solution_manual: "Solution Manuals",
};

const typeOrder = ["past_question", "lecture_notes", "textbook", "lab_manual", "recommended_books", "solution_manual"];

type SortMode = "recent" | "downloads" | "preferred";

function sortResources(items: ResourceWithRelations[], mode: SortMode): ResourceWithRelations[] {
  const copy = [...items];
  switch (mode) {
    case "downloads":
      return copy.sort((a, b) => b.downloads - a.downloads || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "recent":
      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "preferred":
    default:
      return copy.sort((a, b) =>
        (b.is_preferred ? 1 : 0) - (a.is_preferred ? 1 : 0) ||
        b.downloads - a.downloads ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

const sortOptions: { value: SortMode; label: string; icon: typeof Star }[] = [
  { value: "preferred", label: "Preferred", icon: Star },
  { value: "downloads", label: "Most Downloaded", icon: TrendingUp },
  { value: "recent", label: "Most Recent", icon: Clock },
];

export default function CoursePage() {
  const { courseCode } = useParams<{ courseCode: string }>();
  const [course, setCourse] = useState<Tables<"courses"> | null>(null);
  const [resources, setResources] = useState<ResourceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("preferred");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (!courseCode) return;
    const decoded = decodeURIComponent(courseCode);

    const fetchData = async () => {
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("course_code", decoded)
        .single();

      setCourse(courseData);
      if (!courseData) { setLoading(false); return; }

      const { data: resourcesData } = await supabase
        .from("resources")
        .select("*, courses(*)")
        .eq("course_id", courseData.id)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });

      if (resourcesData) {
        const userIds = [...new Set(resourcesData.map(r => r.uploaded_by))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);

        const profilesMap = new Map((profilesData ?? []).map(p => [p.user_id, p]));
        const merged = resourcesData.map(r => ({
          ...r,
          profiles: profilesMap.get(r.uploaded_by) ?? null,
        }));
        setResources(merged as ResourceWithRelations[]);
      }
      setLoading(false);
    };
    fetchData();
  }, [courseCode]);

  if (loading) return <div className="container max-w-2xl py-10"><div className="h-8 w-48 animate-pulse rounded bg-muted" /></div>;
  if (!course) return <div className="container max-w-2xl py-10"><p className="text-muted-foreground">Course not found.</p></div>;

  // Available types in this course's resources
  const availableTypes = typeOrder.filter(t => resources.some(r => r.resource_type === t));

  // Filter then sort
  const filtered = typeFilter === "all"
    ? resources
    : resources.filter(r => r.resource_type === typeFilter);
  const sorted = sortResources(filtered, sortMode);

  // Group by type for display (only when showing all types)
  const showGrouped = typeFilter === "all";
  const grouped = showGrouped
    ? typeOrder.reduce((acc, type) => {
        const items = sorted.filter(r => r.resource_type === type);
        if (items.length > 0) acc[type] = items;
        return acc;
      }, {} as Record<string, ResourceWithRelations[]>)
    : {};

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold">{course.course_code}</h1>
        <p className="mt-1 text-muted-foreground">{course.course_name} · {course.department} · {course.university}</p>
      </div>

      {resources.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No resources uploaded yet for this course.</p>
      ) : (
        <>
          {/* Filter rows */}
          <div className="mt-6 space-y-3">
            {/* Sort filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Sort
              </span>
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortMode(opt.value)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    sortMode === opt.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <opt.icon className="h-3 w-3" />
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
                <FolderOpen className="h-3.5 w-3.5" /> Type
              </span>
              <button
                onClick={() => setTypeFilter("all")}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  typeFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                All
              </button>
              {availableTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    typeFilter === type
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {typeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="mt-6 space-y-8">
            {showGrouped ? (
              Object.entries(grouped).map(([type, items]) => (
                <section key={type}>
                  <h2 className="font-heading text-base font-semibold text-foreground mb-3">{typeLabels[type]}</h2>
                  <div className="space-y-2">
                    {items.map((r) => <ResourceCard key={r.id} resource={r} />)}
                  </div>
                </section>
              ))
            ) : (
              <div className="space-y-2">
                {sorted.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No resources of this type.</p>
                ) : (
                  sorted.map((r) => <ResourceCard key={r.id} resource={r} />)
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
