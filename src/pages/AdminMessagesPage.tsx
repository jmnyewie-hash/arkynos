import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, MailOpen, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface UserMessage {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_email?: string;
}

export default function AdminMessagesPage() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !authLoading && !isAdmin) navigate("/");
  }, [isAdmin, adminLoading, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchMessages();
  }, [isAdmin]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("user_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((m: any) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
      const enriched = data.map((m: any) => {
        const profile = profileMap.get(m.user_id);
        return { ...m, sender_name: profile?.name ?? "Unknown", sender_email: profile?.email ?? "" };
      });
      setMessages(enriched);
    } else {
      setMessages([]);
    }
    setLoading(false);
  };

  const toggleRead = async (msg: UserMessage) => {
    const { error } = await supabase
      .from("user_messages")
      .update({ is_read: !msg.is_read })
      .eq("id", msg.id);
    if (!error) {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: !m.is_read } : m)));
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("user_messages").delete().eq("id", id);
    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast.success("Message deleted");
    }
  };

  if (adminLoading || authLoading || !isAdmin) {
    return <div className="container max-w-3xl py-10"><div className="h-8 w-48 animate-pulse rounded bg-muted" /></div>;
  }

  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <div className="container max-w-3xl py-10 animate-fade-in">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h1 className="font-heading text-2xl font-bold">User Messages</h1>
        {unread > 0 && (
          <Badge variant="destructive" className="text-xs">{unread} unread</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Messages from users</p>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : messages.length === 0 ? (
        <div className="mt-10 text-center text-muted-foreground">
          <Mail className="mx-auto h-10 w-10 opacity-40" />
          <p className="mt-2 text-sm">No messages yet</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl border bg-card p-4 transition-colors ${!msg.is_read ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <div
                className="flex items-start justify-between gap-3 cursor-pointer"
                onClick={() => {
                  setExpandedId(expandedId === msg.id ? null : msg.id);
                  if (!msg.is_read) toggleRead(msg);
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!msg.is_read ? (
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <MailOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <p className="font-medium text-sm text-foreground truncate">{msg.subject}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {msg.sender_name} · {msg.sender_email} · {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); toggleRead(msg); }}
                  >
                    {msg.is_read ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {expandedId === msg.id && (
                <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-foreground whitespace-pre-wrap">
                  {msg.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
