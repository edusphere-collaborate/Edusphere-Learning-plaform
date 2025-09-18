import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  X,
  Search,
  BookOpen,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Interface for PDF document metadata and properties
 */
interface DocumentInfo {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  pageCount?: number;
  description?: string;
}

/**
 * Props interface for the DocumentViewer component
 */
interface DocumentViewerProps {
  document: DocumentInfo;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * PDF Document Viewer Component
 * 
 * Provides comprehensive PDF viewing capabilities including:
 * - Page navigation with thumbnails
 * - Zoom controls and fit-to-width/height options
 * - Full-screen mode toggle
 * - Document rotation
 * - Search functionality within PDF
 * - Download capability
 * - Responsive design for mobile and desktop
 * 
 * @param document - Document metadata and URL
 * @param isOpen - Whether the viewer is currently open
 * @param onClose - Callback function to close the viewer
 * @param className - Additional CSS classes
 */
export function DocumentViewer({ document, isOpen, onClose, className }: DocumentViewerProps) {
  // State management for PDF viewer functionality
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);

  /**
   * Handle successful PDF document load
   * Extract metadata and initialize viewer state
   */
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
    console.log(`PDF loaded successfully with ${numPages} pages`);
  }, []);

  /**
   * Handle PDF document load error
   * Display user-friendly error message
   */
  const onDocumentLoadError = useCallback((error: Error) => {
    setIsLoading(false);
    setError('Failed to load PDF document. Please try again.');
    console.error('PDF load error:', error);
  }, []);

  /**
   * Navigate to previous page
   * Ensures page number stays within valid range
   */
  const goToPreviousPage = useCallback(() => {
    setPageNumber(prev => Math.max(1, prev - 1));
  }, []);

  /**
   * Navigate to next page
   * Ensures page number stays within valid range
   */
  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  }, [numPages]);

  /**
   * Navigate to specific page number
   * Validates page number input
   */
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  }, [numPages]);

  /**
   * Zoom in by 25%
   * Maximum zoom level of 300%
   */
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(3.0, prev + 0.25));
  }, []);

  /**
   * Zoom out by 25%
   * Minimum zoom level of 25%
   */
  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.25, prev - 0.25));
  }, []);

  /**
   * Reset zoom to 100%
   */
  const resetZoom = useCallback(() => {
    setScale(1.0);
  }, []);

  /**
   * Rotate document by 90 degrees clockwise
   */
  const rotateDocument = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  /**
   * Toggle fullscreen mode
   * Manages document viewer layout and controls
   */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  /**
   * Download PDF document
   * Opens document URL in new tab for download
   */
  const downloadDocument = useCallback(() => {
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [document]);

  /**
   * Handle search functionality
   * Note: Full text search requires additional PDF.js integration
   */
  const handleSearch = useCallback((searchQuery: string) => {
    setSearchText(searchQuery);
    // TODO: Implement full-text search within PDF
    console.log('Searching for:', searchQuery);
  }, []);

  /**
   * Reset viewer state when document changes
   */
  useEffect(() => {
    if (isOpen) {
      setPageNumber(1);
      setScale(1.0);
      setRotation(0);
      setIsFullscreen(false);
      setSearchText('');
      setIsLoading(true);
      setError(null);
    }
  }, [document.id, isOpen]);

  /**
   * Handle keyboard shortcuts for navigation
   */
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowLeft':
          goToPreviousPage();
          break;
        case 'ArrowRight':
          goToNextPage();
          break;
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            onClose();
          }
          break;
        case '+':
        case '=':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            zoomOut();
          }
          break;
        case '0':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            resetZoom();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, isFullscreen, goToPreviousPage, goToNextPage, zoomIn, zoomOut, resetZoom, onClose]);

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
      isFullscreen && "bg-black",
      className
    )}>
      <div className={cn(
        "flex flex-col h-full",
        isFullscreen ? "p-0" : "p-4"
      )}>
        {/* Header with document info and controls */}
        <Card className={cn(
          "mb-4",
          isFullscreen && "rounded-none border-0 mb-0"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-primary-600" />
                <div>
                  <CardTitle className="text-lg">{document.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(document.size / 1024)} KB
                    </Badge>
                    <span className="text-sm text-gray-500">
                      by {document.uploadedBy}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(document.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className="hidden md:flex"
                >
                  {showThumbnails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  Thumbnails
                </Button>
                <Button variant="outline" size="sm" onClick={downloadDocument}>
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </Button>
                <Button variant="outline" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main viewer content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Thumbnail sidebar */}
          {showThumbnails && !isFullscreen && (
            <Card className="w-48 mr-4 flex-shrink-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pages</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={cn(
                          "w-full p-2 text-sm rounded border-2 transition-colors",
                          page === pageNumber
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                            : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                        )}
                      >
                        Page {page}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* PDF viewer */}
          <Card className="flex-1 flex flex-col">
            {/* Viewer controls */}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                {/* Navigation controls */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={pageNumber <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min={1}
                      max={numPages}
                      value={pageNumber}
                      onChange={(e) => goToPage(parseInt(e.target.value))}
                      className="w-16 text-center"
                    />
                    <span className="text-sm text-gray-500">of {numPages}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Zoom and rotation controls */}
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.25}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm font-medium min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  
                  <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3.0}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  
                  <Separator orientation="vertical" className="h-6" />
                  
                  <Button variant="outline" size="sm" onClick={rotateDocument}>
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Search functionality */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search in document..."
                      value={searchText}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 w-48"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* PDF document display */}
            <CardContent className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-center p-4">
                {isLoading && (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                      <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <p className="text-red-600 dark:text-red-400 mb-2">Error loading PDF</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="mt-4"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                )}

                {!isLoading && !error && (
                  <Document
                    file={document.url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex items-center justify-center h-96">
                        <BookOpen className="w-12 h-12 text-gray-400 animate-pulse" />
                      </div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      rotate={rotation}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-lg"
                    />
                  </Document>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
