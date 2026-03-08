import { Link } from "react-router-dom";
import { Download, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";

import pastQuestionThumb from "@/assets/thumbnails/past-question.png";
import lectureNotesThumb from "@/assets/thumbnails/lecture-notes.png";
import textbookThumb from "@/assets/thumbnails/textbook.png";
import labManualThumb from "@/assets/thumbnails/lab-manual.png";
import recommendedBooksThumb from "@/assets/thumbnails/recommended-books.png";
import solutionManualThumb from "@/assets/thumbnails/solution-manual.png";

const typeLabels: Record<string, string> = {
  past_question: "Past Question",
  lecture_notes: "Lecture Notes",
  textbook: "Textbook",
  lab_manual: "Lab Manual",
  recommended_books: "Recommended Book",
  solution_manual: "Solution Manual",
};

const typeThumbnails: Record<string, string> = {
  past_question: pastQuestionThumb,
  lecture_notes: lectureNotesThumb,
  textbook: textbookThumb,
  lab_manual: labManualThumb,
  recommended_books: recommendedBooksThumb,
  solution_manual: solutionManualThumb,
};

interface ResourceCardProps {
  resource: Tables<"resources"> & { courses?: Tables<"courses"> | null; profiles?: Tables<"profiles"> | null };
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Link
      to={`/resource/${resource.id}`}
      className={`group block rounded-xl border bg-card p-4 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5 ${
        resource.is_preferred ? "ring-2 ring-accent/50 border-accent/30" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <img
          src={typeThumbnails[resource.resource_type]}
          alt={typeLabels[resource.resource_type]}
          className="h-10 w-10 shrink-0 rounded-lg object-contain"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {resource.is_preferred && (
              <Star className="h-4 w-4 shrink-0 fill-accent text-accent" />
            )}
            <h3 className="font-heading font-semibold text-card-foreground truncate group-hover:text-primary transition-colors">
              {resource.title}
            </h3>
          </div>
          {resource.is_preferred && (
            <span className="text-xs font-medium text-accent">Preferred</span>
          )}
          {resource.courses && (
            <p className="mt-1 text-sm text-muted-foreground">
              {resource.courses.course_code} · {resource.courses.course_name}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs shrink-0">
              {typeLabels[resource.resource_type]}
            </Badge>
            <span className="flex items-center gap-1 shrink-0"><Download className="h-3 w-3" />{resource.downloads}</span>
            {resource.profiles && (
              <span className="flex items-center gap-1 truncate">
                by {resource.profiles.name}
                {(resource.profiles as any).subscription_tier === "founder" && (
                  <span className="ml-1 text-amber-500 font-semibold">👑</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
