import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Star, Trash2, EyeOff, Eye, Tag, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import FounderBadge from "@/components/FounderBadge";
import FlagResourceDialog from "@/components/FlagResourceDialog";
import { useLibrary } from "@/hooks/useLibrary";
import FilePreview from "@/components/FilePreview";
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
  solution_manual: "Solution Manual",
};

export default function ResourcePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<ResourceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isSaved, toggleSave } = useLibrary();

  useEffect(() => {
    if (!id) return;
    const fetchResource = async () => {
      const { data } = await supabase
        .from("resources")
        .select("*, courses(*), class_tags(*)")
        .eq("id", id)
        .single();

      if (data) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, programs(program_name, department)")
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
    if (!user) {
      toast.error("You need an account to download resources. Register or sign in to continue.", {
        action: { label: "Register", onClick: () => navigate("/register") },
      });
      return;
    }
    setDownloading(true);
    try {
      const { data: allowed } = await supabase.rpc("attempt_download", { p_resource_id: resource.id });
      if (!allowed) {
        toast.error("Daily download limit reached. Upgrade to premium for unlimited downloads.", {
          action: { label: "Upgrade", onClick: () => navigate("/upgrade") },
        });
        setDownloading(false);
        return;
      }
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

  const handleToggleHidden = async () => {
    if (!resource) return;
    setHiding(true);
    const newValue = !resource.is_hidden;
    const { error } = await supabase
      .from("resources")
      .update({ is_hidden: newValue } as any)
      .eq("id", resource.id);
    if (error) {
      toast.error("Failed to update visibility");
    } else {
      setResource((prev) => prev ? { ...prev, is_hidden: newValue } as any : prev);
      toast.success(newValue ? "Resource hidden" : "Resource visible again");
    }
    setHiding(false);
  };

  const handleDelete = async () => {
    if (!resource) return;
    setDeleting(true);
    await supabase.from("resource_flags").delete().eq("resource_id", resource.id);
    await supabase.storage.from("resources").remove([resource.file_path]);
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

  const isHidden = (resource as any).is_hidden;

  if (isHidden && !isAdmin) return <div className="container max-w-2xl py-10"><p className="text-muted-foreground">This resource is not available.</p></div>;

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      {isHidden && isAdmin && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-2 text-sm text-destructive">
          <EyeOff className="h-4 w-4 shrink-0" />
          This resource is hidden from users.
        </div>
      )}
      <div className={`relative rounded-xl border bg-card p-6 shadow-card ${resource.is_preferred ? "ring-2 ring-accent/50 border-accent/30" : ""} ${isHidden ? "opacity-60" : ""}`}>
        {(() => {
          const uploadYear = new Date(resource.created_at).getFullYear();
          return uploadYear >= 2026 ? (
            <span className="absolute top-4 right-4 text-sm font-bold text-primary/70">{uploadYear}</span>
          ) : null;
        })()}
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
              {(resource as any).class_tag_id && (resource as any).class_tags && (
                <a href={`/class/${(resource as any).class_tag_id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <Tag className="h-3.5 w-3.5" />
                  {(resource as any).class_tags.name}
                </a>
              )}
            </div>
          </div>
        </div>

        {resource.description && (
          <p className="mt-5 text-sm text-muted-foreground leading-relaxed">{resource.description}</p>
        )}

        {/* File Preview */}
        {(() => {
          const { data } = supabase.storage.from("resources").getPublicUrl(resource.file_path);
          return (
            <FilePreview
              fileUrl={data.publicUrl}
              filePath={resource.file_path}
              resourceId={resource.id}
            />
          );
        })()}

        <div className="mt-6 border-t pt-4 space-y-4">
          <div className="text-xs text-muted-foreground space-y-1">
            {resource.profiles && (
              <p className="flex items-center gap-1.5">
                Uploaded by {resource.profiles.name}
                <FounderBadge tier={(resource.profiles as any).subscription_tier} />
              </p>
            )}
            <p>{resource.downloads} downloads</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleDownload} disabled={downloading} size="sm">
              <Download className="mr-2 h-4 w-4" />
              {downloading ? "Downloading..." : "Download"}
            </Button>
            {user && (
              <Button
                variant={isSaved(resource.id) ? "secondary" : "outline"}
                size="sm"
                onClick={() => toggleSave(resource.id)}
              >
                <Bookmark className={`mr-2 h-4 w-4 ${isSaved(resource.id) ? "fill-primary text-primary" : ""}`} />
                {isSaved(resource.id) ? "Saved" : "Save"}
              </Button>
            )}
            <FlagResourceDialog resourceId={resource.id} />
          </div>
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <Button
                variant={resource.is_preferred ? "secondary" : "outline"}
                size="sm"
                onClick={handleTogglePreferred}
                disabled={toggling}
              >
                <Star className={`mr-1.5 h-4 w-4 ${resource.is_preferred ? "fill-accent text-accent" : ""}`} />
                {resource.is_preferred ? "Unmark Preferred" : "Mark Preferred"}
              </Button>
              <Button
                variant={isHidden ? "outline" : "secondary"}
                size="sm"
                onClick={handleToggleHidden}
                disabled={hiding}
              >
                {isHidden ? <Eye className="mr-1.5 h-4 w-4" /> : <EyeOff className="mr-1.5 h-4 w-4" />}
                {isHidden ? "Unhide" : "Hide"}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
