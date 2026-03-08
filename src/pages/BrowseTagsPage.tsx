import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Tag, ArrowRight, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ClassTag {
  id: string;
  name: string;
  description: string | null;
  resource_count: number;
}

interface Program {
  id: string;
  program_name: string;
  department: string;
  university: string;
}

export default function BrowseTagsPage() {
  const { user } = useAuth();
  const [tags, setTags] = useState<ClassTag[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Create dialog state
  const [open, setOpen] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState("");
  const [className, setClassName] = useState("");
  const [classDesc, setClassDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      const { data: tagData } = await supabase
        .from("class_tags")
        .select("*")
        .order("name");

      if (tagData) {
        const { data: resources } = await supabase
          .from("resources")
          .select("class_tag_id")
          .eq("is_hidden", false)
          .not("class_tag_id", "is", null);

        const countMap = new Map<string, number>();
        (resources ?? []).forEach((r: any) => {
          countMap.set(r.class_tag_id, (countMap.get(r.class_tag_id) ?? 0) + 1);
        });

        setTags(
          tagData.map((t: any) => ({
            ...t,
            resource_count: countMap.get(t.id) ?? 0,
          }))
        );
      }
      setLoading(false);
    };
    fetchTags();
  }, []);

  // Fetch programs when dialog opens
  useEffect(() => {
    if (!open || programs.length > 0) return;
    supabase
      .from("programs")
      .select("*")
      .order("program_name")
      .then(({ data }) => setPrograms((data as Program[]) ?? []));
  }, [open]);

  const handleCreate = async () => {
    if (!user || !className.trim()) return;
    setCreating(true);

    const selectedProgram = programs.find((p) => p.id === programId);
    const description = [
      classDesc.trim(),
      selectedProgram
        ? `Programme: ${selectedProgram.program_name} · ${selectedProgram.department}`
        : null,
    ]
      .filter(Boolean)
      .join(" | ") || null;

    const { data, error } = await supabase
      .from("class_tags")
      .insert({
        name: className.trim(),
        description,
        created_by: user.id,
      } as any)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") toast.error("A class with that name already exists");
      else toast.error("Failed to create class");
    } else if (data) {
      const newTag = { ...(data as any), resource_count: 0 } as ClassTag;
      setTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Class created!");
      setOpen(false);
      setClassName("");
      setClassDesc("");
      setProgramId("");
    }
    setCreating(false);
  };

  const filtered = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Browse Classes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find resources grouped by class tags
          </p>
        </div>
        {user && (
          <Button onClick={() => setOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Class
          </Button>
        )}
      </div>

      <div className="mt-6">
        <Input
          placeholder="Search classes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No classes found.</p>
      ) : (
        <div className="mt-6 space-y-2">
          {filtered.map((tag) => (
            <Link
              key={tag.id}
              to={`/class/${tag.id}`}
              className="group flex items-center justify-between rounded-xl border bg-card p-4 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Tag className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {tag.name}
                  </p>
                  {tag.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {tag.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {tag.resource_count} resource
                  {tag.resource_count !== 1 ? "s" : ""}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Class Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a New Class</DialogTitle>
            <DialogDescription>
              A class is a curated collection of resources for a specific programme or department.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="class-name">Class Name *</Label>
              <Input
                id="class-name"
                placeholder="e.g. EE 301 — Power Systems"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="programme">Programme</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a programme (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.program_name} — {p.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-desc">Description</Label>
              <Textarea
                id="class-desc"
                placeholder="What is this class about?"
                value={classDesc}
                onChange={(e) => setClassDesc(e.target.value)}
                maxLength={200}
                rows={2}
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={creating || !className.trim()}
              className="w-full"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Class"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
