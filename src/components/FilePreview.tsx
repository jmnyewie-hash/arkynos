import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Eye, EyeOff, FileText, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FilePreviewProps {
  fileUrl: string;
  filePath: string;
  resourceId: string;
}

function PdfPreview({ fileUrl, resourceId }: { fileUrl: string; resourceId: string }) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const computeScale = useCallback(() => {
    if (!containerRef.current || !pageWidth) return 1;
    const containerWidth = containerRef.current.clientWidth - 16;
    return Math.min(containerWidth / pageWidth, 2);
  }, [pageWidth]);

  // Recalculate on resize
  const [, setTick] = useState(0);
  useEffect(() => {
    const observer = new ResizeObserver(() => setTick((t) => t + 1));
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
        <FileText className="h-8 w-8" />
        <p className="text-sm">Preview unavailable</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-lg bg-muted/30 border">
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <div className="flex justify-center overflow-hidden max-h-[500px]">
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            setLoading(false);
          }}
          onLoadError={() => {
            setError(true);
            setLoading(false);
          }}
          loading={null}
        >
          <Page
            pageNumber={1}
            scale={computeScale()}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onLoadSuccess={(page) => {
              if (!pageWidth) setPageWidth(page.width);
            }}
          />
        </Document>
      </div>
      {/* Fade overlay at bottom + full viewer button */}
      {!loading && !error && (
        <>
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <Button
              size="sm"
              variant="secondary"
              className="shadow-md"
              onClick={() => navigate(`/view/${resourceId}`)}
            >
              <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
              View Full Document {numPages > 0 && `(${numPages} pages)`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function getExtension(path: string): string {
  return path.split(".").pop()?.toLowerCase() || "";
}

export default function FilePreview({ fileUrl, filePath, resourceId }: FilePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const ext = getExtension(filePath);
  const isPdf = ext === "pdf";
  const isPreviewable = isPdf; // expand later for images, etc.

  if (!isPreviewable) return null;

  return (
    <div className="mt-5">
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-3"
      >
        {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {showPreview ? "Hide Preview" : "Preview First Page"}
      </button>
      {showPreview && isPdf && (
        <PdfPreview fileUrl={fileUrl} resourceId={resourceId} />
      )}
    </div>
  );
}
