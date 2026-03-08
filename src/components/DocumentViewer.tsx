import { useState, useCallback, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Download, Maximize2, Minimize2, RotateCw, FileText, ArrowLeftRight, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: "pdf" | "docx" | "pptx" | "other";
  onClose: () => void;
}

/** Offline-capable PDF viewer using react-pdf — enhanced */
function PdfViewerOffline({ fileUrl, fileName, onClose }: { fileUrl: string; fileName: string; onClose: () => void }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [scale, setScale] = useState<number | null>(null); // null = auto fit-width
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [swipeMode, setSwipeMode] = useState<"horizontal" | "vertical">("horizontal");
  const [pageWidth, setPageWidth] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Compute fit-width scale
  const computeFitScale = useCallback(() => {
    if (!containerRef.current || !pageWidth) return 1;
    const containerWidth = containerRef.current.clientWidth - 32; // 16px padding each side
    return Math.min(containerWidth / pageWidth, 3);
  }, [pageWidth]);

  const effectiveScale = scale ?? computeFitScale();

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoadError(false);
    setIsLoading(false);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setLoadError(true);
    setIsLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback((page: { width: number }) => {
    if (!pageWidth) {
      setPageWidth(page.width);
    }
  }, [pageWidth]);

  // Recalculate fit-width on resize
  useEffect(() => {
    if (scale !== null) return; // user has manually zoomed
    const observer = new ResizeObserver(() => {
      // Force re-render to recalculate effectiveScale
      setPageWidth((w) => w); // no-op state update to trigger re-render
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [scale]);

  const goToPage = (p: number) => {
    setCurrentPage(p);
    setPageInput(String(p));
  };
  const goToPrev = () => goToPage(Math.max(1, currentPage - 1));
  const goToNext = () => goToPage(Math.min(numPages, currentPage + 1));
  const zoomIn = () => setScale((s) => Math.min(3, +((s ?? computeFitScale()) + 0.25).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(0.5, +((s ?? computeFitScale()) - 0.25).toFixed(2)));
  const resetZoom = () => setScale(null); // back to fit-width
  const rotate = () => setRotation((r) => (r + 90) % 360);
  const toggleFullscreen = () => setIsFullscreen((f) => !f);
  const toggleSwipeMode = () => setSwipeMode((m) => m === "horizontal" ? "vertical" : "horizontal");

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = parseInt(pageInput, 10);
      if (!isNaN(val) && val >= 1 && val <= numPages) {
        goToPage(val);
      } else {
        setPageInput(String(currentPage));
      }
    }
  };

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipe = 50;

    if (swipeMode === "horizontal") {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
        if (dx < 0) goToNext();
        else goToPrev();
      }
    } else {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > minSwipe) {
        if (dy < 0) goToNext();
        else goToPrev();
      }
    }
    touchStartRef.current = null;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (swipeMode === "horizontal") {
        if (e.key === "ArrowLeft") { e.preventDefault(); goToPrev(); }
        if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goToNext(); }
      } else {
        if (e.key === "ArrowUp") { e.preventDefault(); goToPrev(); }
        if (e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); goToNext(); }
      }
      if (e.key === "Escape" && isFullscreen) { e.preventDefault(); setIsFullscreen(false); }
      if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomIn(); }
      if (e.key === "-") { e.preventDefault(); zoomOut(); }
      if (e.key === "r") { e.preventDefault(); rotate(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <FileText className="h-7 w-7 text-destructive" />
        </div>
        <p className="text-foreground font-medium">Unable to render this PDF</p>
        <p className="text-sm text-muted-foreground">The file may be corrupted or unsupported.</p>
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
      <div className="flex items-center justify-between border-b bg-card/90 backdrop-blur-sm px-2 sm:px-4 py-1.5 shrink-0 gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
            <X className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-[240px]">{fileName}</span>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Zoom controls */}
          <Button variant="ghost" size="icon" onClick={zoomOut} className="h-8 w-8" disabled={effectiveScale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <button
            onClick={resetZoom}
            className="text-xs text-muted-foreground hover:text-foreground w-10 text-center tabular-nums transition-colors"
            title="Fit to width"
          >
            {scale === null ? "Fit" : `${Math.round(effectiveScale * 100)}%`}
          </button>
          <Button variant="ghost" size="icon" onClick={zoomIn} className="h-8 w-8" disabled={effectiveScale >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

          {/* Swipe mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSwipeMode}
            className="h-8 w-8"
            title={swipeMode === "horizontal" ? "Horizontal swipe (click to switch)" : "Vertical swipe (click to switch)"}
          >
            {swipeMode === "horizontal" ? <ArrowLeftRight className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />}
          </Button>

          {/* Rotate */}
          <Button variant="ghost" size="icon" onClick={rotate} className="h-8 w-8 hidden sm:flex" title="Rotate (R)">
            <RotateCw className="h-4 w-4" />
          </Button>

          {/* Fullscreen */}
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8" title="Fullscreen">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Download */}
          <Button variant="ghost" size="icon" onClick={() => window.open(fileUrl, "_blank")} className="h-8 w-8 hidden sm:flex" title="Download">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/20 flex justify-center relative select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-background/60">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading document…</p>
          </div>
        )}
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
        >
          <Page
            pageNumber={currentPage}
            scale={effectiveScale}
            rotate={rotation}
            className="shadow-xl my-6 rounded-sm overflow-hidden"
            renderTextLayer
            renderAnnotationLayer
            onLoadSuccess={onPageLoadSuccess}
          />
        </Document>
      </div>

      {/* Bottom navigation */}
      {numPages > 0 && (
        <div className="flex items-center justify-between border-t bg-card/90 backdrop-blur-sm px-3 sm:px-4 py-2 shrink-0">
          <Button variant="ghost" size="icon" onClick={goToPrev} disabled={currentPage <= 1} className="h-9 w-9">
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground hidden sm:inline">Page</span>
            <Input
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={handlePageInput}
              onBlur={() => setPageInput(String(currentPage))}
              className="w-12 h-8 text-center text-sm px-1 tabular-nums"
            />
            <span className="text-sm text-muted-foreground">of {numPages}</span>
          </div>

          <Button variant="ghost" size="icon" onClick={goToNext} disabled={currentPage >= numPages} className="h-9 w-9">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}

/** Online PDF viewer using Google Docs Viewer (iframe) */
function PdfViewerOnline({ fileUrl, fileName, onClose }: { fileUrl: string; fileName: string; onClose: () => void }) {
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

/** Smart PDF viewer: Google Docs when online, react-pdf when offline */
function PdfViewer({ fileUrl, fileName, onClose }: { fileUrl: string; fileName: string; onClose: () => void }) {
  const isOnline = navigator.onLine;
  const isBlobUrl = fileUrl.startsWith("blob:");

  if (isOnline && !isBlobUrl) {
    return <PdfViewerOnline fileUrl={fileUrl} fileName={fileName} onClose={onClose} />;
  }
  return <PdfViewerOffline fileUrl={fileUrl} fileName={fileName} onClose={onClose} />;
}

function OfficeViewer({ fileUrl, fileName, onClose }: { fileUrl: string; fileName: string; onClose: () => void }) {
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
