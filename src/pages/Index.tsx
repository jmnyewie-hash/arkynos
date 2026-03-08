import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import CourseSearchBar from "@/components/CourseSearchBar";
import ResourceCard from "@/components/ResourceCard";
import FoundingBanner from "@/components/FoundingBanner";
import arkynosLogo from "@/assets/arkynos-logo-full.png";
import { Users, BookOpen, FolderOpen, Shield } from "lucide-react";

type ResourceWithRelations = Tables<"resources"> & {
  courses: Tables<"courses"> | null;
  profiles: Tables<"profiles"> | null;
};

export default function Index() {
  const [recentResources, setRecentResources] = useState<ResourceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState<number>(0);

  useEffect(() => {
    const fetchResources = async () => {
      const { data: resourcesData } = await supabase
        .from("resources")
        .select("*, courses(*)")
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (resourcesData) {
        const userIds = [...new Set(resourcesData.map(r => r.uploaded_by))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);

        const profilesMap = new Map((profilesData ?? []).map(p => [p.user_id, p]));
        const merged = resourcesData.map(r => ({
          ...r,
          profiles: profilesMap.get(r.uploaded_by) ?? null,
        }));
        setRecentResources(merged as ResourceWithRelations[]);
      }
      setLoading(false);
    };

    const fetchUserCount = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      setUserCount(count ?? 0);
    };

    fetchResources();
    fetchUserCount();
  }, []);

  const features = [
    { icon: BookOpen, label: "Curated Resources", desc: "Past questions, lecture notes, textbooks & more — organized by course" },
    { icon: FolderOpen, label: "Class Collections", desc: "Create or join class groups with all your semester materials in one place" },
    { icon: Shield, label: "Quality-First", desc: "Community-flagged content with admin curation keeps resources reliable" },
  ];

  return (
    <>
      <FoundingBanner />
      <div className="container max-w-2xl py-16">
        <div className="text-center animate-fade-in">
          <svg viewBox="0 0 400 60" className="mx-auto w-[40rem] mb-1">
            <defs>
              <path id="curve" d="M 30,50 Q 200,0 370,50" fill="transparent" />
            </defs>
            <text className="fill-muted-foreground/90" style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontStyle: 'italic' }}>
              <textPath href="#curve" startOffset="50%" textAnchor="middle">The Labyrinth Of Knowledge</textPath>
            </text>
          </svg>
          <img src={arkynosLogo} alt="Arkynos" className="mx-auto mb-4 h-72" />
          <p className="mt-3 text-lg text-muted-foreground">
            Find and share study resources for your courses
          </p>
        </div>

        {/* Welcome & community section */}
        <div className="mt-10 animate-fade-in rounded-2xl border bg-card p-6 text-center" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center justify-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            <span className="text-2xl font-bold">{userCount.toLocaleString()}</span>
            <span className="text-sm font-medium text-muted-foreground">students already here</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Your one-stop library for university study materials. Upload once, help hundreds.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.label} className="rounded-xl bg-muted/50 p-3 text-left">
                <f.icon className="h-4 w-4 text-primary mb-1" />
                <p className="text-xs font-semibold text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CourseSearchBar />
        </div>

        <section className="mt-14 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="font-heading text-lg font-semibold text-foreground">Recent Resources</h2>
          {loading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : recentResources.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No resources yet. Be the first to upload!</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentResources.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
