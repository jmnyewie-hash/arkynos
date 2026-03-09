import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function AdminCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();

  const [programs, setPrograms] = useState<{ id: string; program_name: string; department: string }[]>([]);
  const [tab, setTab] = useState<"programme" | "course">("course");

  // Programme form
  const [progName, setProgName] = useState("");
  const [progDept, setProgDept] = useState("Mechanical Engineering");
  const [progUni, setProgUni] = useState("KNUST");

  // Course form
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseDept, setCourseDept] = useState("Mechanical Engineering");
  const [courseUni, setCourseUni] = useState("KNUST");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [courseYear, setCourseYear] = useState("1");
  const [courseSemester, setCourseSemester] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !adminLoading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    supabase.from("programs").select("id, program_name, department").order("program_name").then(({ data }) => {
      setPrograms(data ?? []);
    });
  }, []);

  const handleAddProgramme = async () => {
    if (!progName.trim()) { toast.error("Programme name required"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("programs").insert({
      program_name: progName.trim(),
      department: progDept.trim(),
      university: progUni.trim(),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Programme added!");
      setProgName("");
      const { data } = await supabase.from("programs").select("id, program_name, department").order("program_name");
      setPrograms(data ?? []);
    }
    setSubmitting(false);
  };

  const handleAddCourse = async () => {
    if (!courseCode.trim() || !courseName.trim()) { toast.error("Course code and name required"); return; }
    setSubmitting(true);
    try {
      // Insert or find existing course
      let courseId: string;
      const { data: existing } = await supabase.from("courses").select("id").eq("course_code", courseCode.trim()).maybeSingle();
      if (existing) {
        courseId = existing.id;
      } else {
        const { data: newCourse, error } = await supabase.from("courses").insert({
          course_code: courseCode.trim(),
          course_name: courseName.trim(),
          department: courseDept.trim(),
          university: courseUni.trim(),
          program_id: selectedProgramId || null,
        }).select("id").single();
        if (error) throw error;
        courseId = newCourse.id;
      }

      // Link to programme if selected
      if (selectedProgramId) {
        const { error: linkErr } = await supabase.from("course_programs").insert({
          course_id: courseId,
          program_id: selectedProgramId,
          year: parseInt(courseYear),
          semester: parseInt(courseSemester),
        });
        if (linkErr && !linkErr.message.includes("duplicate")) throw linkErr;
      }

      toast.success("Course added!");
      setCourseCode("");
      setCourseName("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add course");
    }
    setSubmitting(false);
  };

  if (authLoading || adminLoading) return null;

  return (
    <div className="container max-w-lg py-10 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Manage Courses & Programmes</h1>
      <p className="mt-1 text-sm text-muted-foreground">Admin-only: add new departments, programmes, and courses</p>

      <div className="mt-6 flex gap-2">
        <Button variant={tab === "course" ? "default" : "outline"} size="sm" onClick={() => setTab("course")}>Add Course</Button>
        <Button variant={tab === "programme" ? "default" : "outline"} size="sm" onClick={() => setTab("programme")}>Add Programme</Button>
      </div>

      {tab === "programme" && (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Programme Name</Label>
            <Input value={progName} onChange={e => setProgName(e.target.value)} placeholder="e.g. BSc Electrical Engineering" />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input value={progDept} onChange={e => setProgDept(e.target.value)} placeholder="e.g. Mechanical Engineering" />
          </div>
          <div className="space-y-2">
            <Label>University</Label>
            <Input value={progUni} onChange={e => setProgUni(e.target.value)} placeholder="e.g. KNUST" />
          </div>
          <Button onClick={handleAddProgramme} disabled={submitting} className="w-full">
            <Plus className="mr-2 h-4 w-4" />{submitting ? "Adding..." : "Add Programme"}
          </Button>
        </div>
      )}

      {tab === "course" && (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Course Code</Label>
            <Input value={courseCode} onChange={e => setCourseCode(e.target.value)} placeholder="e.g. ME 453" />
          </div>
          <div className="space-y-2">
            <Label>Course Name</Label>
            <Input value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="e.g. Hydraulics and Pneumatics" />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input value={courseDept} onChange={e => setCourseDept(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Link to Programme (optional)</Label>
            <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
              <SelectTrigger><SelectValue placeholder="Select programme" /></SelectTrigger>
              <SelectContent>
                {programs.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.program_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedProgramId && (
            <div className="flex gap-3">
              <div className="space-y-2 flex-1">
                <Label>Year</Label>
                <Select value={courseYear} onValueChange={setCourseYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4].map(y => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <Label>Semester</Label>
                <Select value={courseSemester} onValueChange={setCourseSemester}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <Button onClick={handleAddCourse} disabled={submitting} className="w-full">
            <Plus className="mr-2 h-4 w-4" />{submitting ? "Adding..." : "Add Course"}
          </Button>
        </div>
      )}
    </div>
  );
}
