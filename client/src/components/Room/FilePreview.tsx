import React from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FilePreviewProps {
  fileName: string;
  fileSize?: number;
  fileType?: string;
  downloadUrl: string;
  previewUrl?: string;
}

export function FilePreview({ 
  fileName, 
  fileSize, 
  fileType, 
  downloadUrl, 
  previewUrl 
}: FilePreviewProps) {
  // Format file size for display
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Get file icon based on type
  const getFileIcon = (type?: string, name?: string) => {
    if (!type && name) {
      const extension = name.split('.').pop()?.toLowerCase();
      type = extension;
    }

    const iconProps = { className: "w-8 h-8" };

    // Image files
    if (type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(type || '')) {
      return <ImageIcon {...iconProps} className="w-8 h-8 text-green-500" />;
    }
    
    // Video files
    if (type?.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type || '')) {
      return <Video {...iconProps} className="w-8 h-8 text-red-500" />;
    }
    
    // Audio files
    if (type?.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(type || '')) {
      return <Music {...iconProps} className="w-8 h-8 text-purple-500" />;
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type || '')) {
      return <Archive {...iconProps} className="w-8 h-8 text-orange-500" />;
    }
    
    // Document files
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(type || '') || type?.includes('document')) {
      return <FileText {...iconProps} className="w-8 h-8 text-blue-500" />;
    }
    
    // Default file icon
    return <File {...iconProps} className="w-8 h-8 text-gray-500" />;
  };

  // Get file type badge color
  const getFileTypeBadgeColor = (type?: string, name?: string) => {
    if (!type && name) {
      const extension = name.split('.').pop()?.toLowerCase();
      type = extension;
    }

    if (type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(type || '')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    
    if (type?.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type || '')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    
    if (type?.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(type || '')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
    
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type || '')) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
    
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(type || '') || type?.includes('document')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  // Handle file download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file preview
  const handlePreview = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    } else {
      window.open(downloadUrl, '_blank');
    }
  };

  // Check if file can be previewed
  const canPreview = (type?: string, name?: string) => {
    if (!type && name) {
      const extension = name.split('.').pop()?.toLowerCase();
      type = extension;
    }

    const previewableTypes = [
      'pdf', 'txt', 'md', 'json', 'xml', 'csv',
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
      'mp4', 'webm', 'ogg', 'mp3', 'wav'
    ];

    return previewableTypes.includes(type || '') || 
           type?.startsWith('image/') || 
           type?.startsWith('video/') || 
           type?.startsWith('audio/') ||
           type?.includes('text');
  };

  const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'FILE';
  const isPreviewable = canPreview(fileType, fileName);

  return (
    <Card className="max-w-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* File Icon */}
          <div className="flex-shrink-0">
            {getFileIcon(fileType, fileName)}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={fileName}>
                  {fileName}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getFileTypeBadgeColor(fileType, fileName)}`}
                  >
                    {fileExtension}
                  </Badge>
                  {fileSize && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(fileSize)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* File Actions */}
            <div className="flex items-center space-x-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-1 text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
              
              {isPreviewable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className="flex-1 text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(downloadUrl, '_blank')}
                className="p-1"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
