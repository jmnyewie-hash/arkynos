import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import CourseSearchSelect from "@/components/CourseSearchSelect";
import ClassTagSelect from "@/components/ClassTagSelect";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const MAX_SIZE_DEFAULT = 50 * 1024 * 1024; // 50MB
const MAX_SIZE_RECOMMENDED = 100 * 1024 * 1024; // 100MB
const MAX_SIZE_SOLUTION = 200 * 1024 * 1024; // 200MB

const resourceTypes = [
  { value: "past_question", label: "Past Question" },
  { value: "lecture_notes", label: "Lecture Notes" },
  { value: "textbook", label: "Textbook" },
  { value: "lab_manual", label: "Lab Manual" },
  { value: "recommended_books", label: "Recommended Book" },
  { value: "solution_manual", label: "Solution Manual" },
];

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [courseId, setCourseId] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Tables<"courses"> | null>(null);
  const [resourceType, setResourceType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [classTagId, setClassTagId] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error("Only PDF, DOCX, and PPTX files are allowed");
      return;
    }
    const maxSize = resourceType === "solution_manual" ? MAX_SIZE_SOLUTION : resourceType === "recommended_books" ? MAX_SIZE_RECOMMENDED : MAX_SIZE_DEFAULT;
    if (f.size > maxSize) {
      const label = resourceType === "solution_manual" ? "200" : resourceType === "recommended_books" ? "100" : "50";
      toast.error(`File must be under ${label}MB`);
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !courseId || !selectedCourse || !resourceType || !title.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("resources").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("resources").getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("resources").insert({
        title: title.trim(),
        description: description.trim() || null,
        author: author.trim() || null,
        course_id: courseId,
        resource_type: resourceType as any,
        file_url: urlData.publicUrl,
        file_path: filePath,
        uploaded_by: user.id,
        ...(classTagId ? { class_tag_id: classTagId } : {}),
      } as any);
      if (insertError) throw insertError;

      toast.success("Resource uploaded!");
      navigate(`/course/${selectedCourse.course_code}`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setSubmitting(false);
  };

  if (authLoading) return null;

  return (
    <div className="container max-w-lg py-10 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Upload Resource</h1>
      <p className="mt-1 text-sm text-muted-foreground">Share study materials with your peers</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Calculus Final Exam 2024" maxLength={200} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="author">Author <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Prof. Adeyemi, John Smith" maxLength={150} />
        </div>

        <div className="space-y-2">
          <Label>Course *</Label>
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
          <Label htmlFor="type">Resource Type *</Label>
          <Select value={resourceType} onValueChange={setResourceType} required>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {resourceTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." maxLength={1000} rows={3} />
        </div>

        <div className="space-y-2">
          <Label>Class Tag <span className="text-muted-foreground font-normal">(optional — group resources by class)</span></Label>
          <ClassTagSelect
            value={classTagId}
            onSelect={setClassTagId}
            onClear={() => setClassTagId("")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">File * (PDF, DOCX, PPTX — max {resourceType === "solution_manual" ? "200" : resourceType === "recommended_books" ? "100" : "50"}MB)</Label>
          <Input id="file" type="file" accept=".pdf,.docx,.pptx" onChange={handleFileChange} required />
          {file && <p className="text-xs text-muted-foreground">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          <Upload className="mr-2 h-4 w-4" />
          {submitting ? "Uploading..." : "Upload Resource"}
        </Button>
      </form>
    </div>
  );
}
