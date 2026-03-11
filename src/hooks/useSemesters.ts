import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Semester {
  id: string;
  semester_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export function useSemesters() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSemesters = useCallback(async () => {
    const { data } = await supabase
      .from("semesters")
      .select("*")
      .order("start_date", { ascending: false });
    setSemesters((data as Semester[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSemesters(); }, [fetchSemesters]);

  const activeSemester = semesters.find((s) => s.is_active) ?? null;

  const createSemester = async (name: string, startDate: string, endDate: string) => {
    const { error } = await supabase.from("semesters").insert({
      semester_name: name,
      start_date: startDate,
      end_date: endDate,
      is_active: false,
    } as any);
    if (!error) await fetchSemesters();
    return { error };
  };

  const activateSemester = async (id: string) => {
    // Deactivate all first
    await supabase.from("semesters").update({ is_active: false } as any).neq("id", "00000000-0000-0000-0000-000000000000");
    const { error } = await supabase.from("semesters").update({ is_active: true } as any).eq("id", id);
    if (!error) await fetchSemesters();
    return { error };
  };

  const endSemester = async (id: string) => {
    const { error } = await supabase.from("semesters").update({ is_active: false } as any).eq("id", id);
    if (!error) await fetchSemesters();
    return { error };
  };

  return { semesters, activeSemester, loading, createSemester, activateSemester, endSemester, refetch: fetchSemesters };
}
