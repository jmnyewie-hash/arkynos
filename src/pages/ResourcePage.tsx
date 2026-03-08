import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import FlagResourceDialog from "@/components/FlagResourceDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
type ResourceWithRelations = Tables<"resources"> & {
  courses: Tables<"courses"> | null;
  profiles: Tables<"profiles"> | null;
};

const typeLabels: Record<string, string> = {
  past_question: "Past Question",
  lecture_notes: "Lecture Notes",
  textbook: "Textbook",
  lab_manual: "Lab Manual",
  recommended_books: "Recommended Book",
};

export default function ResourcePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<ResourceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { isAdmin } = useIsAdmin();

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
      }
      setLoading(false);
    };
    fetchResource();
  }, [id]);

  const handleDownload = async () => {
    if (!resource) return;
    setDownloading(true);
    try {
      await supabase.rpc("increment_downloads", { resource_id: resource.id });
      const { data } = supabase.storage.from("resources").getPublicUrl(resource.file_path);
      window.open(data.publicUrl, "_blank");
      setResource((prev) => prev ? { ...prev, downloads: prev.downloads + 1 } : prev);
    } catch {
      toast.error("Failed to download");
    }
    setDownloading(false);
  };

  const handleTogglePreferred = async () => {
    if (!resource) return;
    setToggling(true);
    const newValue = !resource.is_preferred;
    const { error } = await supabase
      .from("resources")
      .update({ is_preferred: newValue })
      .eq("id", resource.id);

    if (error) {
      toast.error("Failed to update preferred status");
    } else {
      setResource((prev) => prev ? { ...prev, is_preferred: newValue } : prev);
      toast.success(newValue ? "Marked as preferred" : "Removed preferred status");
    }
    setToggling(false);
  };

  const handleDelete = async () => {
    if (!resource) return;
    setDeleting(true);
    // Delete associated flags first
    await supabase.from("resource_flags").delete().eq("resource_id", resource.id);
    // Delete the file from storage
    await supabase.storage.from("resources").remove([resource.file_path]);
    // Delete the resource record
    const { error } = await supabase.from("resources").delete().eq("id", resource.id);
    if (error) {
      toast.error("Failed to delete resource");
      setDeleting(false);
    } else {
      toast.success("Resource deleted");
      navigate("/");
    }
  };

  if (loading) return <div className="container max-w-2xl py-10"><div className="h-32 animate-pulse rounded-xl bg-muted" /></div>;
  if (!resource) return <div className="container max-w-2xl py-10"><p className="text-muted-foreground">Resource not found.</p></div>;

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <div className={`rounded-xl border bg-card p-6 shadow-card ${resource.is_preferred ? "ring-2 ring-accent/50 border-accent/30" : ""}`}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {resource.is_preferred && <Star className="h-5 w-5 shrink-0 fill-accent text-accent" />}
              <h1 className="font-heading text-2xl font-bold">{resource.title}</h1>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {resource.is_preferred && (
                <Badge className="bg-accent text-accent-foreground">Preferred</Badge>
              )}
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

        <div className="mt-6 border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground space-y-1">
                {resource.profiles && <p>Uploaded by {resource.profiles.name}</p>}
                <p>{resource.downloads} downloads</p>
              </div>
              <FlagResourceDialog resourceId={resource.id} />
            </div>
            <Button onClick={handleDownload} disabled={downloading} size="sm">
              <Download className="mr-2 h-4 w-4" />
              {downloading ? "Downloading..." : "Download"}
            </Button>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 border-t pt-3">
            {isAdmin && (
              <>
                <Button
                  variant={resource.is_preferred ? "secondary" : "outline"}
                  size="sm"
                  onClick={handleTogglePreferred}
                  disabled={toggling}
                >
                  <Star className={`mr-1.5 h-4 w-4 ${resource.is_preferred ? "fill-accent text-accent" : ""}`} />
                  {resource.is_preferred ? "Unmark Preferred" : "Mark Preferred"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={deleting}>
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      {deleting ? "Deleting..." : "Delete"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{resource.title}" and its file. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            <Button onClick={handleDownload} disabled={downloading}>
              <Download className="mr-2 h-4 w-4" />
              {downloading ? "Downloading..." : "Download"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
