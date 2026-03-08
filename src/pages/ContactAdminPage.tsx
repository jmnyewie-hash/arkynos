import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function ContactAdminPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!user) return;
    const trimSubject = subject.trim();
    const trimMessage = message.trim();
    if (!trimSubject || !trimMessage) {
      toast.error("Please fill in both subject and message");
      return;
    }
    if (trimSubject.length > 200) {
      toast.error("Subject must be under 200 characters");
      return;
    }
    if (trimMessage.length > 2000) {
      toast.error("Message must be under 2000 characters");
      return;
    }

    setSending(true);
    const { error } = await supabase.from("user_messages").insert({
      user_id: user.id,
      subject: trimSubject,
      message: trimMessage,
    });
    setSending(false);

    if (error) {
      toast.error("Failed to send message");
    } else {
      setSent(true);
      setSubject("");
      setMessage("");
    }
  };

  if (!user) {
    return (
      <div className="container max-w-md py-16 text-center animate-fade-in">
        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-heading text-xl font-bold">Contact Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please sign in to send a message.</p>
        <Button className="mt-4" asChild><Link to="/login">Sign In</Link></Button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="container max-w-md py-16 text-center animate-fade-in">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h1 className="mt-4 font-heading text-xl font-bold">Message Sent!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks for reaching out. The admin team will review your message.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => setSent(false)}>
          Send Another
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-16 animate-fade-in">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h1 className="font-heading text-xl font-bold">Contact Admin</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Share your thoughts, report issues, or suggest improvements.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">Subject</label>
          <Input
            className="mt-1"
            placeholder="e.g. Feature request, Bug report..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Message</label>
          <Textarea
            className="mt-1 min-h-[140px]"
            placeholder="Tell us what's on your mind..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
          />
          <p className="mt-1 text-xs text-muted-foreground text-right">{message.length}/2000</p>
        </div>
        <Button onClick={handleSend} disabled={sending || !subject.trim() || !message.trim()} className="w-full">
          {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Send Message
        </Button>
      </div>
    </div>
  );
}
