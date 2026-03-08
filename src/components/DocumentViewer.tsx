import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Download, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: "pdf" | "docx" | "pptx" | "other";
  onClose: () => void;
}

function PdfViewer({ fileUrl, fileName, onClose }: { fileUrl: string; fileName: string; onClose: () => void }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoadError(false);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setLoadError(true);
  }, []);

  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNext = () => setCurrentPage((p) => Math.min(numPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.25));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.25));

  const toggleFullscreen = () => setIsFullscreen((f) => !f);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-muted-foreground">Unable to render this PDF inline.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(fileUrl, "_blank")}>
            <Download className="mr-2 h-4 w-4" /> Open in browser
          </Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-50 bg-background" : "h-full"}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-card px-3 py-2 shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={zoomOut} className="h-8 w-8" disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={zoomIn} className="h-8 w-8" disabled={scale >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-muted/30 flex justify-center">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={scale}
            className="shadow-lg my-4"
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>

      {/* Page navigation */}
      {numPages > 0 && (
        <div className="flex items-center justify-center gap-3 border-t bg-card px-3 py-2 shrink-0">
          <Button variant="ghost" size="icon" onClick={goToPrev} disabled={currentPage <= 1} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {numPages}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNext} disabled={currentPage >= numPages} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function OfficeViewer({ fileUrl, fileName, onClose }: { fileUrl: string; fileName: string; onClose: () => void }) {
  // Use Google Docs Viewer for DOCX/PPTX - works with public URLs
  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b bg-card px-3 py-2 shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => window.open(fileUrl, "_blank")}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </div>
      <div className="flex-1">
        <iframe
          src={viewerUrl}
          className="w-full h-full border-0"
          title={fileName}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>
    </div>
  );
}

function getFileType(filePath: string): DocumentViewerProps["fileType"] {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "docx";
  if (ext === "pptx" || ext === "ppt") return "pptx";
  return "other";
}

export { getFileType };

export default function DocumentViewer({ fileUrl, fileName, fileType, onClose }: DocumentViewerProps) {
  if (fileType === "pdf") {
    return <PdfViewer fileUrl={fileUrl} fileName={fileName} onClose={onClose} />;
  }

  if (fileType === "docx" || fileType === "pptx") {
    return <OfficeViewer fileUrl={fileUrl} fileName={fileName} onClose={onClose} />;
  }

  // Fallback: open in new tab
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <p className="text-muted-foreground">This file type can't be previewed in-app.</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.open(fileUrl, "_blank")}>
          <Download className="mr-2 h-4 w-4" /> Open file
        </Button>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
