import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Upload,
  Search,
  Filter,
  Calendar,
  User,
  File,
  Image,
  Video,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DocumentViewer } from './DocumentViewer';

/**
 * Interface for shared document metadata
 */
interface SharedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'video' | 'document' | 'archive';
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  tags?: string[];
  downloadCount?: number;
}

/**
 * Props interface for the DocumentList component
 */
interface DocumentListProps {
  documents: SharedDocument[];
  onUpload?: (files: FileList) => void;
  onDelete?: (documentId: string) => void;
  onDownload?: (document: SharedDocument) => void;
  className?: string;
}

/**
 * Document List Component for Room Shared Resources
 * 
 * Provides comprehensive document management including:
 * - Document listing with metadata
 * - Search and filter functionality
 * - File type categorization
 * - Upload interface with drag-and-drop
 * - Document preview and download
 * - Delete functionality for authorized users
 * 
 * @param documents - Array of shared documents
 * @param onUpload - Callback for file upload
 * @param onDelete - Callback for document deletion
 * @param onDownload - Callback for document download
 * @param className - Additional CSS classes
 */
export function DocumentList({
  documents,
  onUpload,
  onDelete,
  onDownload,
  className
}: DocumentListProps) {
  // State management for document list functionality
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'downloads'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDocument, setSelectedDocument] = useState<SharedDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);

  /**
   * Get appropriate icon for file type
   */
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'image':
        return <Image className="w-5 h-5 text-green-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-blue-500" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-purple-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  /**
   * Filter and sort documents based on current criteria
   */
  const filteredAndSortedDocuments = React.useMemo(() => {
    let filtered = documents.filter(doc => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      const matchesType = selectedType === 'all' || doc.type === selectedType;

      return matchesSearch && matchesType;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'downloads':
          comparison = (a.downloadCount || 0) - (b.downloadCount || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [documents, searchQuery, selectedType, sortBy, sortOrder]);

  /**
   * Handle document preview
   */
  const handlePreview = (document: SharedDocument) => {
    if (document.type === 'pdf') {
      setSelectedDocument(document);
      setIsViewerOpen(true);
    } else {
      // For other file types, open in new tab
      window.open(document.url, '_blank');
    }
  };

  /**
   * Handle document download
   */
  const handleDownload = (document: SharedDocument) => {
    if (onDownload) {
      onDownload(document);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = document.url;
      link.download = document.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  /**
   * Handle file upload via drag and drop or file input
   */
  const handleFileUpload = (files: FileList | null) => {
    if (files && onUpload) {
      onUpload(files);
    }
  };

  /**
   * Handle drag and drop events
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with search and filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Shared Documents</CardTitle>
            <Badge variant="secondary">{documents.length} files</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters and sorting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    {selectedType === 'all' ? 'All Types' : selectedType.toUpperCase()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedType('all')}>
                    All Types
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('pdf')}>
                    PDF Documents
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('image')}>
                    Images
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('video')}>
                    Videos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('document')}>
                    Documents
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('archive')}>
                    Archives
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Sort by {sortBy}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('name')}>
                    Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('date')}>
                    Upload Date
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('size')}>
                    File Size
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('downloads')}>
                    Downloads
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Upload button */}
            {onUpload && (
              <div className="relative">
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.zip,.rar"
                />
                <Button size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document list */}
      <Card>
        <CardContent className="p-0">
          {filteredAndSortedDocuments.length === 0 ? (
            <div 
              className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg m-4"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {searchQuery || selectedType !== 'all' 
                  ? 'No documents match your criteria' 
                  : 'No documents shared yet'
                }
              </p>
              {onUpload && (
                <p className="text-sm text-gray-500">
                  Drag and drop files here or click the upload button
                </p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedDocuments.map((document, index) => (
                  <div key={document.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getFileIcon(document.type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {document.name}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-500">
                              {formatFileSize(document.size)}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {document.uploadedBy}
                              </span>
                            </div>
                            <Separator orientation="vertical" className="h-3" />
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {new Date(document.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                            {document.downloadCount && (
                              <>
                                <Separator orientation="vertical" className="h-3" />
                                <span className="text-sm text-gray-500">
                                  {document.downloadCount} downloads
                                </span>
                              </>
                            )}
                          </div>
                          {document.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                              {document.description}
                            </p>
                          )}
                          {document.tags && document.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {document.tags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(document)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(document)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(document.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* PDF Document Viewer */}
      {selectedDocument && (
        <DocumentViewer
          document={{
            id: selectedDocument.id,
            name: selectedDocument.name,
            url: selectedDocument.url,
            size: selectedDocument.size,
            uploadedBy: selectedDocument.uploadedBy,
            uploadedAt: selectedDocument.uploadedAt,
            description: selectedDocument.description
          }}
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
}
