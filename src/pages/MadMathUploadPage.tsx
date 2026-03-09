import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Brain } from "lucide-react";
import CourseSearchSelect from "@/components/CourseSearchSelect";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const MAX_SIZE = 100 * 1024 * 1024;

const subjects = [
  { value: "maths", label: "Mathematics" },
  { value: "physics", label: "Physics" },
];

const difficultyLevels = [
  { value: "ordinary", label: "Ordinary" },
  { value: "advanced", label: "Advanced" },
];

export default function MadMathUploadPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [courseId, setCourseId] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Tables<"courses"> | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      toast.error("Only administrators can upload to Mad As Math");
      navigate("/mad-as-math");
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error("Only PDF, DOCX, and PPTX files are allowed");
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error("File must be under 100MB");
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !subject || !topic.trim() || !title.trim() || !difficulty) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `mad-math/${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("resources").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("resources").getPublicUrl(filePath);

      const insertData: any = {
        title: title.trim(),
        description: description.trim() || null,
        resource_type: "past_question",
        file_url: urlData.publicUrl,
        file_path: filePath,
        uploaded_by: user.id,
        is_mad_math: true,
        is_hidden: false,
        show_in_general: false,
        mad_math_subject: subject,
        mad_math_topic: topic.trim(),
        mad_math_difficulty: difficulty,
        ...(courseId ? { course_id: courseId } : {}),
      };

      const { error: insertError } = await supabase.from("resources").insert(insertData);
      if (insertError) throw insertError;

      toast.success("Mad As Math Q&A uploaded!");
      navigate("/mad-as-math");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setSubmitting(false);
  };

  if (authLoading || adminLoading) return null;

  return (
    <div className="container max-w-lg py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">Upload Q&A</h1>
          <p className="text-sm text-muted-foreground">Add questions & answers to Mad As Math</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fourier Series — Brutal Set"
            maxLength={200}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Select value={subject} onValueChange={setSubject} required>
            <SelectTrigger><SelectValue placeholder="Pick a discipline" /></SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">Topic *</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Thermodynamics, Linear Algebra, Electrostatics"
            maxLength={150}
            required
          />
          <p className="text-xs text-muted-foreground">The topic this Q&A covers</p>
        </div>

        <div className="space-y-2">
          <Label>Difficulty *</Label>
          <div className="flex gap-2">
            {difficultyLevels.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
                  difficulty === d.value
                    ? d.value === "advanced"
                      ? "bg-destructive text-destructive-foreground border-destructive shadow-sm"
                      : "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Course <span className="text-muted-foreground font-normal">(optional — link to a specific course)</span></Label>
          <CourseSearchSelect
            value={courseId}
            onSelect={(id, course) => {
              setCourseId(id);
              setSelectedCourse(course);
            }}
            onClear={() => {
              setCourseId("");
              setSelectedCourse(null);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional — add context, difficulty hints, or a taunt..."
            maxLength={1000}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">File * (PDF, DOCX, PPTX — max 100MB)</Label>
          <Input id="file" type="file" accept=".pdf,.docx,.pptx" onChange={handleFileChange} required />
          {file && <p className="text-xs text-muted-foreground">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          <Upload className="mr-2 h-4 w-4" />
          {submitting ? "Uploading..." : "Upload Q&A"}
        </Button>
      </form>
    </div>
  );
}
