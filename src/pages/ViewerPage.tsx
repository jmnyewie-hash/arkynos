import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCachedFileUrl } from "@/lib/offlineCache";
import DocumentViewer, { getFileType } from "@/components/DocumentViewer";

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function loadFile() {
      // Try cached version first (works offline)
      const cachedUrl = await getCachedFileUrl(id!);
      if (cachedUrl) {
        // Get metadata for name
        const meta = JSON.parse(localStorage.getItem("arkynos-library-meta") || "{}");
        const item = meta[id!];
        setFileName(item?.title || "Document");
        setFilePath(item?.file_path || "");
        setFileUrl(cachedUrl);
        setLoading(false);
        return;
      }

      // Fetch from server
      const { data: resource } = await supabase
        .from("resources")
        .select("title, file_path")
        .eq("id", id!)
        .single();

      if (resource) {
        const { data } = supabase.storage.from("resources").getPublicUrl(resource.file_path);
        setFileName(resource.title);
        setFilePath(resource.file_path);
        setFileUrl(data.publicUrl);
      }
      setLoading(false);
    }

    loadFile();
  }, [id]);

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/library");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <p className="text-muted-foreground">Document not found or unavailable offline.</p>
        <button onClick={handleClose} className="text-primary underline">Go back</button>
      </div>
    );
  }

  const fileType = getFileType(filePath || fileUrl || "");

  return (
    <div className="h-[calc(100vh-4rem)]">
      <DocumentViewer
        fileUrl={fileUrl}
        fileName={fileName}
        fileType={fileType}
        onClose={handleClose}
      />
    </div>
  );
}
