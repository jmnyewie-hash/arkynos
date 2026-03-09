import { Link } from "react-router-dom";
import { Download, Star, Bookmark } from "lucide-react";
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
  isSaved?: boolean;
  onToggleSave?: (resourceId: string) => void;
}

export default function ResourceCard({ resource, isSaved, onToggleSave }: ResourceCardProps) {
  return (
    <div
      className={`group relative rounded-xl border bg-card p-3 sm:p-4 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5 ${
        resource.is_preferred ? "ring-2 ring-accent/50 border-accent/30" : ""
      }`}
    >
      {onToggleSave && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave(resource.id);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg hover:bg-muted transition-colors z-10"
          title={isSaved ? "Remove from library" : "Save to library"}
        >
          <Bookmark
            className={`h-4 w-4 transition-colors ${
              isSaved ? "fill-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          />
        </button>
      )}
      <Link to={`/resource/${resource.id}`} className="block">
        <div className="flex items-start gap-2.5 sm:gap-3 pr-8">
          <img
            src={typeThumbnails[resource.resource_type]}
            alt={typeLabels[resource.resource_type]}
            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-lg object-contain"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-semibold text-sm sm:text-base text-card-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
              {resource.title}
              {resource.is_preferred && (
                <Star className="h-3.5 w-3.5 shrink-0 fill-accent text-accent" />
              )}
            </h3>
            {resource.is_preferred ? (
              <span className="text-[10px] sm:text-xs font-medium text-accent">Preferred</span>
            ) : (
              <span className="h-4" />
            )}
            {resource.courses && (
              <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground truncate">
                {resource.courses.course_code} · {resource.courses.course_name}
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0 shrink-0">
                {typeLabels[resource.resource_type]}
              </Badge>
              <span className="flex items-center gap-1 shrink-0"><Download className="h-3 w-3" />{resource.downloads}</span>
              {resource.profiles && (
                <span className="flex items-center gap-1 truncate hidden sm:inline">
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
    </div>
  );
}
