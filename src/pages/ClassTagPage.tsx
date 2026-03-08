import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import ResourceCard from "@/components/ResourceCard";

type ResourceWithRelations = Tables<"resources"> & {
  courses: Tables<"courses"> | null;
  profiles: Tables<"profiles"> | null;
};

interface ClassTag {
  id: string;
  name: string;
  description: string | null;
}

export default function ClassTagPage() {
  const { tagId } = useParams<{ tagId: string }>();
  const [tag, setTag] = useState<ClassTag | null>(null);
  const [resources, setResources] = useState<ResourceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="container max-w-2xl py-10"><div className="h-8 w-48 animate-pulse rounded bg-muted" /></div>;
  if (!tag) return <div className="container max-w-2xl py-10"><p className="text-muted-foreground">Class tag not found.</p></div>;

  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold">{tag.name}</h1>
        {tag.description && <p className="mt-1 text-muted-foreground">{tag.description}</p>}
      </div>

      {resources.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No resources uploaded to this class yet.</p>
      ) : (
        <div className="mt-8 space-y-2">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
}
