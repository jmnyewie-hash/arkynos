import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

type ResourceWithRelations = Tables<"resources"> & {
  courses: Tables<"courses"> | null;
  profiles: Tables<"profiles"> | null;
};

const typeLabels: Record<string, string> = {
  past_question: "Past Question",
  lecture_notes: "Lecture Notes",
  textbook: "Textbook",
  lab_manual: "Lab Manual",
};

export default function ResourcePage() {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<ResourceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchResource = async () => {
      const { data } = await supabase
        .from("resources")
        .select("*, courses(*)")
        .eq("id", id)
        .single();

      if (data) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", data.uploaded_by)
          .single();
        setResource({ ...data, profiles: profile } as ResourceWithRelations);
        setLoading(false);
      });
  }, [id]);

  const handleDownload = async () => {
    if (!resource) return;
    setDownloading(true);
    try {
      // Increment download counter
      await supabase.rpc("increment_downloads", { resource_id: resource.id });

      // Get download URL
      const { data } = supabase.storage.from("resources").getPublicUrl(resource.file_path);
      window.open(data.publicUrl, "_blank");

      setResource((prev) => prev ? { ...prev, downloads: prev.downloads + 1 } : prev);
    } catch {
      toast.error("Failed to download");
    }
    setDownloading(false);
  };

  if (loading) return <div className="container max-w-2xl py-10"><div className="h-32 animate-pulse rounded-xl bg-muted" /></div>;
  if (!resource) return <div className="container max-w-2xl py-10"><p className="text-muted-foreground">Resource not found.</p></div>;

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-bold">{resource.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{typeLabels[resource.resource_type]}</Badge>
              {resource.courses && (
                <span className="text-sm text-muted-foreground">
                  {resource.courses.course_code} · {resource.courses.course_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {resource.description && (
          <p className="mt-5 text-sm text-muted-foreground leading-relaxed">{resource.description}</p>
        )}

        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <div className="text-xs text-muted-foreground space-y-1">
            {resource.profiles && <p>Uploaded by {resource.profiles.name}</p>}
            <p>{resource.downloads} downloads</p>
          </div>
          <Button onClick={handleDownload} disabled={downloading}>
            <Download className="mr-2 h-4 w-4" />
            {downloading ? "Downloading..." : "Download"}
          </Button>
        </div>
      </div>
    </div>
  );
}
