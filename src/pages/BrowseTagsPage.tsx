import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Tag, ArrowRight } from "lucide-react";

interface ClassTag {
  id: string;
  name: string;
  description: string | null;
  resource_count: number;
}

export default function BrowseTagsPage() {
  const [tags, setTags] = useState<ClassTag[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      const { data: tagData } = await supabase
        .from("class_tags")
        .select("*")
        .order("name");

      if (tagData) {
        // Get resource counts per tag
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

  const filtered = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold">Browse Classes</h1>
      <p className="mt-1 text-sm text-muted-foreground">Find resources grouped by class tags</p>

      <div className="mt-6">
        <Input
          placeholder="Search classes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
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
                    <p className="text-sm text-muted-foreground truncate">{tag.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">{tag.resource_count} resource{tag.resource_count !== 1 ? "s" : ""}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
