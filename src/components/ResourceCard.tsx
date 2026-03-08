import { Link } from "react-router-dom";
import { FileText, Download, BookOpen, FlaskConical, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";

const typeLabels: Record<string, string> = {
  past_question: "Past Question",
  lecture_notes: "Lecture Notes",
  textbook: "Textbook",
  lab_manual: "Lab Manual",
};

const typeIcons: Record<string, React.ReactNode> = {
  past_question: <HelpCircle className="h-4 w-4" />,
  lecture_notes: <FileText className="h-4 w-4" />,
  textbook: <BookOpen className="h-4 w-4" />,
  lab_manual: <FlaskConical className="h-4 w-4" />,
};

interface ResourceCardProps {
  resource: Tables<"resources"> & { courses?: Tables<"courses"> | null; profiles?: Tables<"profiles"> | null };
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Link
      to={`/resource/${resource.id}`}
      className="group block rounded-xl border bg-card p-4 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-semibold text-card-foreground truncate group-hover:text-primary transition-colors">
            {resource.title}
          </h3>
          {resource.courses && (
            <p className="mt-1 text-sm text-muted-foreground">
              {resource.courses.course_code} · {resource.courses.course_name}
            </p>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0 flex items-center gap-1.5">
          {typeIcons[resource.resource_type]}
          {typeLabels[resource.resource_type]}
        </Badge>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Download className="h-3 w-3" />{resource.downloads}</span>
        {resource.profiles && <span>by {resource.profiles.name}</span>}
      </div>
    </Link>
  );
}
