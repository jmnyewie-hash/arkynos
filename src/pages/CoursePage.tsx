import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import ResourceCard from "@/components/ResourceCard";

type ResourceWithRelations = Tables<"resources"> & {
  courses: Tables<"courses"> | null;
  profiles: Tables<"profiles"> | null;
};

const typeLabels: Record<string, string> = {
  past_question: "Past Questions",
  lecture_notes: "Lecture Notes",
  textbook: "Textbooks",
  lab_manual: "Lab Manuals",
};

const typeOrder = ["past_question", "lecture_notes", "textbook", "lab_manual"];

export default function CoursePage() {
  const { courseCode } = useParams<{ courseCode: string }>();
  const [course, setCourse] = useState<Tables<"courses"> | null>(null);
  const [resources, setResources] = useState<ResourceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

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
            setResources((data as ResourceWithRelations[]) ?? []);
            setLoading(false);
          });
      });
  }, [courseCode]);

  if (loading) return <div className="container max-w-2xl py-10"><div className="h-8 w-48 animate-pulse rounded bg-muted" /></div>;
  if (!course) return <div className="container max-w-2xl py-10"><p className="text-muted-foreground">Course not found.</p></div>;

  const grouped = typeOrder.reduce((acc, type) => {
    const items = resources.filter((r) => r.resource_type === type);
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {} as Record<string, ResourceWithRelations[]>);

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold">{course.course_code}</h1>
        <p className="mt-1 text-muted-foreground">{course.course_name} · {course.department} · {course.university}</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No resources uploaded yet for this course.</p>
      ) : (
        <div className="mt-8 space-y-8">
          {Object.entries(grouped).map(([type, items]) => (
            <section key={type}>
              <h2 className="font-heading text-base font-semibold text-foreground mb-3">{typeLabels[type]}</h2>
              <div className="space-y-2">
                {items.map((r) => <ResourceCard key={r.id} resource={r} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
