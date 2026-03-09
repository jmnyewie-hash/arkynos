import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CourseEntry {
  id: string;
  course_code: string;
  course_name: string;
  year: number;
  semester: number;
  programCount: number;
}

interface ProgramInfo {
  id: string;
  program_name: string;
  department: string;
  university: string;
}

export default function ProgrammePage() {
  const { programId } = useParams<{ programId: string }>();
  const [program, setProgram] = useState<ProgramInfo | null>(null);
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) return;

    (async () => {
      // Get programme info
      const { data: prog } = await supabase
        .from("programs")
        .select("*")
        .eq("id", programId)
        .single();
      setProgram(prog);

      if (!prog) { setLoading(false); return; }

      // Get courses for this programme via junction
      const { data: cpData } = await supabase
        .from("course_programs")
        .select("course_id, year, semester")
        .eq("program_id", programId)
        .order("year")
        .order("semester");

      if (cpData && cpData.length > 0) {
        const courseIds = cpData.map(cp => cp.course_id);
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, course_code, course_name")
          .in("id", courseIds);

        // Check how many programmes each course belongs to
        const { data: allLinks } = await supabase
          .from("course_programs")
          .select("course_id, program_id")
          .in("course_id", courseIds);

        const countMap = new Map<string, number>();
        (allLinks ?? []).forEach(l => {
          countMap.set(l.course_id, (countMap.get(l.course_id) ?? 0) + 1);
        });

        const cpMap = new Map(cpData.map(cp => [cp.course_id, cp]));
        const merged: CourseEntry[] = (coursesData ?? []).map(c => ({
          ...c,
          year: cpMap.get(c.id)?.year ?? 1,
          semester: cpMap.get(c.id)?.semester ?? 1,
          programCount: countMap.get(c.id) ?? 1,
        }));

        merged.sort((a, b) => a.year - b.year || a.semester - b.semester || a.course_code.localeCompare(b.course_code));
        setCourses(merged);
      }
      setLoading(false);
    })();
  }, [programId]);

  if (loading) return <div className="container max-w-2xl py-10"><div className="h-8 w-48 animate-pulse rounded bg-muted" /></div>;
  if (!program) return <div className="container max-w-2xl py-10"><p className="text-muted-foreground">Programme not found.</p></div>;

  // Group by year then semester
  const grouped: Record<string, CourseEntry[]> = {};
  courses.forEach(c => {
    const key = `Year ${c.year} — Semester ${c.semester}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <Link to={`/department/${encodeURIComponent(program.department)}`} className="text-xs text-primary hover:underline">
        ← Dept. of {program.department}
      </Link>
      <h1 className="mt-2 font-heading text-2xl sm:text-3xl font-bold">{program.program_name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{program.department} · {program.university}</p>

      <div className="mt-6 space-y-8">
        {Object.entries(grouped).map(([label, items]) => (
          <section key={label}>
            <h2 className="font-heading text-base font-semibold text-foreground mb-3 sticky top-14 bg-background/80 backdrop-blur-sm py-1 z-10">{label}</h2>
            <div className="space-y-2">
              {items.map((c) => (
                <Link
                  key={c.id}
                  to={`/course/${encodeURIComponent(c.course_code)}`}
                  className="flex items-center justify-between rounded-xl border bg-card p-3 sm:p-4 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-sm text-card-foreground">
                        {c.course_code}
                        {c.programCount > 1 && (
                          <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0 border-primary/30 text-primary/70">
                            Shared
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{c.course_name}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        ))}
        {courses.length === 0 && (
          <p className="text-sm text-muted-foreground">No courses linked to this programme yet.</p>
        )}
      </div>
    </div>
  );
}
