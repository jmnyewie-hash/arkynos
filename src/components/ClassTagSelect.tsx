import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Tag } from "lucide-react";
import { toast } from "sonner";

interface ClassTag {
  id: string;
  name: string;
  description: string | null;
}

interface ClassTagSelectProps {
  value: string;
  onSelect: (tagId: string) => void;
  onClear: () => void;
}

export default function ClassTagSelect({ value, onSelect, onClear }: ClassTagSelectProps) {
  const { user } = useAuth();
  const [tags, setTags] = useState<ClassTag[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTag, setSelectedTag] = useState<ClassTag | null>(null);

  useEffect(() => {
    supabase
      .from("class_tags")
      .select("*")
      .order("name")
      .then(({ data }) => setTags((data as ClassTag[]) ?? []));
  }, []);

  useEffect(() => {
    if (value && tags.length > 0) {
      const found = tags.find((t) => t.id === value);
      if (found) setSelectedTag(found);
    }
  }, [value, tags]);

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("class_tags")
      .insert({ name: newName.trim(), description: newDesc.trim() || null, created_by: user.id } as any)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") toast.error("A class with that name already exists");
      else toast.error("Failed to create class tag");
    } else if (data) {
      const tag = data as ClassTag;
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      onSelect(tag.id);
      setSelectedTag(tag);
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      toast.success("Class tag created!");
    }
    setCreating(false);
  };

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedTag) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2.5">
        <Tag className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium">{selectedTag.name}</span>
        {selectedTag.description && (
          <span className="text-xs text-muted-foreground truncate">— {selectedTag.description}</span>
        )}
        <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => { onClear(); setSelectedTag(null); }}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search existing class tags..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search && filtered.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {filtered.slice(0, 10).map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => { onSelect(tag.id); setSelectedTag(tag); setSearch(""); }}
            >
              <Tag className="mr-1 h-3 w-3" />
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
      {search && filtered.length === 0 && !showCreate && (
        <p className="text-xs text-muted-foreground">No matching class tags found.</p>
      )}

      {!showCreate ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Create new class tag
        </Button>
      ) : (
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <Input
            placeholder="Class name (e.g. EE 301 — Power Systems)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={100}
          />
          <Input
            placeholder="Short description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            maxLength={200}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? "Creating..." : "Create"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
