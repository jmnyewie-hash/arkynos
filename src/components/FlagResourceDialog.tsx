import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Flag } from "lucide-react";
import { toast } from "sonner";

const flagReasons = [
  { value: "wrong_category", label: "Wrong category" },
  { value: "inappropriate_content", label: "Inappropriate or depraving content" },
  { value: "spam", label: "Spam or irrelevant" },
  { value: "copyright_violation", label: "Copyright violation" },
  { value: "low_quality", label: "Low quality or unreadable" },
  { value: "other", label: "Other" },
];

interface FlagResourceDialogProps {
  resourceId: string;
  alreadyFlagged?: boolean;
}

export default function FlagResourceDialog({ resourceId, alreadyFlagged }: FlagResourceDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [flagged, setFlagged] = useState(alreadyFlagged ?? false);

  const handleSubmit = async () => {
    if (!user || !reason) {
      toast.error("Please select a reason");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("resource_flags").insert({
      resource_id: resourceId,
      flagged_by: user.id,
      reason: reason as any,
      description: description.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You've already flagged this resource");
        setFlagged(true);
      } else {
        toast.error("Failed to submit flag");
      }
    } else {
      toast.success("Resource flagged. An admin will review it.");
      setFlagged(true);
      setOpen(false);
    }
    setSubmitting(false);
  };

  if (!user) return null;

  if (flagged) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
        <Flag className="mr-1.5 h-4 w-4" />
        Flagged
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <Flag className="mr-1.5 h-4 w-4" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Report Resource</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>
                {flagReasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Details (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional details..."
              maxLength={500}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={submitting || !reason}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
