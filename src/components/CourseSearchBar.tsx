import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CourseSearchBar({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search courses... e.g. MATH 1521"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-14 rounded-xl border-2 pl-12 pr-4 text-base font-body shadow-card transition-shadow focus:shadow-card-hover focus:border-primary"
      />
    </form>
  );
}
