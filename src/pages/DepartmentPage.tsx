import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, GraduationCap } from "lucide-react";

interface Program {
  id: string;
  program_name: string;
  department: string;
  university: string;
  courseCount: number;
}

export default function DepartmentPage() {
  const { department } = useParams<{ department: string }>();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!department) return;
    const decoded = decodeURIComponent(department);

    (async () => {
      const { data: progs } = await supabase
        .from("programs")
        .select("*")
        .eq("department", decoded)
        .order("program_name");

      if (progs) {
        // Count courses per programme via course_programs
        const withCounts = await Promise.all(
          progs.map(async (p) => {
            const { count } = await supabase
              .from("course_programs")
              .select("id", { count: "exact", head: true })
              .eq("program_id", p.id);
            return { ...p, courseCount: count ?? 0 };
          })
        );
        setPrograms(withCounts);
      }
      setLoading(false);
    })();
  }, [department]);

  if (loading) return <div className="container max-w-2xl py-10"><div className="h-8 w-48 animate-pulse rounded bg-muted" /></div>;

  const decodedDept = decodeURIComponent(department || "");

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <h1 className="font-heading text-2xl sm:text-3xl font-bold">Department of {decodedDept}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Select a programme to browse courses</p>

      <div className="mt-6 space-y-3">
        {programs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No programmes found in this department.</p>
        ) : (
          programs.map((p) => (
            <Link
              key={p.id}
              to={`/programme/${p.id}`}
              className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-sm sm:text-base text-card-foreground truncate">{p.program_name}</p>
                  <p className="text-xs text-muted-foreground">{p.courseCount} courses</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
