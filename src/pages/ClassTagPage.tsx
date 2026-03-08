import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import ResourceCard from "@/components/ResourceCard";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Lock, Loader2, CheckCircle, Download, Upload, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import CourseSearchSelect from "@/components/CourseSearchSelect";

type ResourceWithRelations = Tables<"resources"> & {
  courses: Tables<"courses"> | null;
  profiles: Tables<"profiles"> | null;
};

interface ClassTag {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  is_preferred: boolean;
}

export default function ClassTagPage() {
  const { tagId } = useParams<{ tagId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { toast } = useToast();

  const [tag, setTag] = useState<ClassTag | null>(null);
  const [resources, setResources] = useState<ResourceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadCourseId, setUploadCourseId] = useState("");
  const [uploadCourse, setUploadCourse] = useState<Tables<"courses"> | null>(null);
  const [uploadType, setUploadType] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];
  const resourceTypes = [
    { value: "past_question", label: "Past Question" },
    { value: "lecture_notes", label: "Lecture Notes" },
    { value: "textbook", label: "Textbook" },
    { value: "lab_manual", label: "Lab Manual" },
    { value: "recommended_books", label: "Recommended Book" },
    { value: "solution_manual", label: "Solution Manual" },
  ];

  const isCreator = user && tag?.created_by === user.id;
  const canUpload = isCreator || isAdmin;

  // Check access — admins always have access
  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (isAdmin) {
      setHasAccess(true);
      setCheckingAccess(false);
      return;
    }
    if (!user || !tagId) {
      setCheckingAccess(false);
      return;
    }

    const checkAccess = async () => {
      const { data } = await supabase
        .from("class_access")
        .select("id")
        .eq("user_id", user.id)
        .eq("class_tag_id", tagId)
        .maybeSingle();

      setHasAccess(!!data);
      setCheckingAccess(false);
    };
    checkAccess();
  }, [user, tagId, authLoading, adminLoading, isAdmin]);

  // Verify payment on redirect back
  useEffect(() => {
    const reference = searchParams.get("reference");
    const trxref = searchParams.get("trxref");
    const ref = reference || trxref;

    if (!ref || !tagId || !user || hasAccess) return;

    const verify = async () => {
      setVerifying(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const res = await fetch(
          `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/verify-payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ reference: ref, class_tag_id: tagId }),
          }
        );

        const result = await res.json();
        if (result.success) {
          setHasAccess(true);
          toast({ title: "Payment verified!", description: "You now have permanent access to this class." });
          // Clean URL
          navigate(`/class/${tagId}`, { replace: true });
        } else {
          toast({ title: "Verification failed", description: result.error || "Please try again.", variant: "destructive" });
        }
      } catch {
        toast({ title: "Error", description: "Could not verify payment.", variant: "destructive" });
      } finally {
        setVerifying(false);
      }
    };
    verify();
  }, [searchParams, tagId, user, hasAccess]);

  // Fetch tag + resources
  useEffect(() => {
    if (!tagId) return;
    const fetchData = async () => {
      const { data: tagData } = await supabase
        .from("class_tags")
        .select("*")
        .eq("id", tagId)
        .single();

      setTag(tagData as ClassTag | null);
      if (!tagData) { setLoading(false); return; }

      const { data: resourcesData } = await supabase
        .from("resources")
        .select("*, courses(*)")
        .eq("class_tag_id", tagId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });

      if (resourcesData) {
        const userIds = [...new Set(resourcesData.map((r) => r.uploaded_by))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);

        const profilesMap = new Map((profilesData ?? []).map((p) => [p.user_id, p]));
        setResources(
          resourcesData.map((r) => ({
            ...r,
            profiles: profilesMap.get(r.uploaded_by) ?? null,
          })) as ResourceWithRelations[]
        );
      }
      setLoading(false);
    };
    fetchData();
  }, [tagId]);

  const handlePay = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setPaying(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/initialize-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            class_tag_id: tagId,
            callback_url: window.location.href.split("?")[0],
          }),
        }
      );

      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast({ title: "Error", description: data.error || "Could not initialize payment.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const handleSaveOffline = async (resource: ResourceWithRelations) => {
    try {
      const { data } = supabase.storage.from("resources").getPublicUrl(resource.file_path);
      const response = await fetch(data.publicUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resource.title}.${resource.file_path.split(".").pop() || "pdf"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      sonnerToast.success(`Saved "${resource.title}" for offline access`);
    } catch {
      sonnerToast.error("Failed to save file");
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    for (const r of resources) {
      await handleSaveOffline(r);
    }
    setDownloadingAll(false);
  };

  const handleUploadToClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !uploadFile || !uploadCourseId || !uploadType || !uploadTitle.trim() || !tagId) return;
    setUploading(true);
    try {
      const ext = uploadFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("resources").upload(filePath, uploadFile);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("resources").getPublicUrl(filePath);
      const { data: newResource, error: insertError } = await supabase
        .from("resources")
        .insert({
          title: uploadTitle.trim(),
          description: uploadDesc.trim() || null,
          course_id: uploadCourseId,
          resource_type: uploadType as any,
          file_url: urlData.publicUrl,
          file_path: filePath,
          uploaded_by: user.id,
          class_tag_id: tagId,
        } as any)
        .select("*, courses(*)")
        .single();
      if (insertError) throw insertError;

      if (newResource) {
        const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
        setResources((prev) => [{ ...newResource, profiles: prof } as ResourceWithRelations, ...prev]);
      }

      sonnerToast.success("Resource uploaded to class!");
      setUploadOpen(false);
      setUploadTitle("");
      setUploadDesc("");
      setUploadCourseId("");
      setUploadCourse(null);
      setUploadType("");
      setUploadFile(null);
    } catch (err: any) {
      sonnerToast.error(err.message || "Upload failed");
    }
    setUploading(false);
  };


  if (loading || checkingAccess || authLoading || adminLoading) {
    return (
      <div className="container max-w-2xl py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="container max-w-2xl py-10">
        <p className="text-muted-foreground">Class tag not found.</p>
      </div>
    );
  }

  const showPaywall = !hasAccess;

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">{tag.name}</h1>
          {tag.description && <p className="mt-1 text-muted-foreground">{tag.description}</p>}
        </div>
        {canUpload && hasAccess && (
          <Button onClick={() => setUploadOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Resource
          </Button>
        )}
      </div>

      {verifying && (
        <div className="mt-8 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verifying your payment...</span>
        </div>
      )}

      {showPaywall && !verifying ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-primary/60" />
          <h2 className="mt-4 font-heading text-xl font-semibold">Unlock this class</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get permanent access to all {resources.length} resource{resources.length !== 1 ? "s" : ""} in <strong>{tag.name}</strong> for just{" "}
            <span className="font-semibold text-primary">GHS 0.50</span>.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">One-time payment · Mobile Money accepted</p>
          <Button onClick={handlePay} disabled={paying} className="mt-6" size="lg">
            {paying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Pay GHS 0.50 to unlock"
            )}
          </Button>
          {!user && (
            <p className="mt-3 text-xs text-muted-foreground">
              You'll need to sign in first.
            </p>
          )}
        </div>
      ) : hasAccess ? (
        <>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>You have permanent access</span>
            </div>
            {resources.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAll}
                disabled={downloadingAll}
              >
                {downloadingAll ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                )}
                {downloadingAll ? "Saving..." : "Save All for Offline"}
              </Button>
            )}
          </div>
          {resources.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">No resources uploaded to this class yet.</p>
          ) : (
            <div className="mt-6 space-y-2">
              {resources.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <ResourceCard resource={r} />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    title="Save for offline"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSaveOffline(r);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload to {tag.name}</DialogTitle>
            <DialogDescription>Add a resource directly to this class.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadToClass} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="up-title">Title *</Label>
              <Input id="up-title" placeholder="e.g. Calculus Final 2024" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} maxLength={200} required />
            </div>
            <div className="space-y-2">
              <Label>Course *</Label>
              <CourseSearchSelect
                value={uploadCourseId}
                onSelect={(id, course) => { setUploadCourseId(id); setUploadCourse(course); }}
                onClear={() => { setUploadCourseId(""); setUploadCourse(null); }}
              />
            </div>
            <div className="space-y-2">
              <Label>Resource Type *</Label>
              <Select value={uploadType} onValueChange={setUploadType} required>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {resourceTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="up-desc">Description</Label>
              <Textarea id="up-desc" placeholder="Optional..." value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} maxLength={1000} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="up-file">File * (PDF, DOCX, PPTX)</Label>
              <Input
                id="up-file"
                type="file"
                accept=".pdf,.docx,.pptx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && !ALLOWED_TYPES.includes(f.type)) {
                    sonnerToast.error("Only PDF, DOCX, and PPTX files are allowed");
                    return;
                  }
                  if (f && f.size > 100 * 1024 * 1024) {
                    sonnerToast.error("File must be under 100MB");
                    return;
                  }
                  setUploadFile(f || null);
                }}
                required
              />
              {uploadFile && <p className="text-xs text-muted-foreground">{uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)</p>}
            </div>
            <Button type="submit" className="w-full" disabled={uploading || !uploadTitle.trim() || !uploadCourseId || !uploadType || !uploadFile}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resource
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

